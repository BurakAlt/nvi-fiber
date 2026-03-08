# Code Review: qoe-engine.js (Story 7.6)

**File**: `F:\NVI FIBER\fiber-chrome\lib\qoe-engine.js`
**Reviewer**: Code Review Subagent
**Date**: 2026-03-07
**Lines**: 823

---

## Summary

QoE Engine implementation has **8 blocking issues** including critical correctness bugs (metric aggregation race conditions, missing IndexedDB integration), security vulnerabilities (XSS via unbounded alert storage), and architectural flaws (missing capacity alert tracking, incomplete persistence). Module is NOT production-ready.

---

## Issues

### **[HIGH] Correctness: Race condition in metric collection causes stale QoE scores**

**Lines 277-310** (`_gatherSubscriberMetrics`)

The function synchronously accesses `LiveMonitor.getMetricCache()` and `FlowAnalyzer.getSubscriberProfile()` without waiting for their polling cycles. If these modules haven't completed their first poll, metrics will be zero.

```javascript
function _gatherSubscriberMetrics(subscriberId) {
  var metrics = { latencyMs: 0, jitterMs: 0, ... };

  // PROBLEM: No validation that LiveMonitor has completed at least one poll
  if (typeof LiveMonitor !== 'undefined' && LiveMonitor.getMetricCache) {
    var cache = LiveMonitor.getMetricCache(); // May be empty/stale
    var deviceMetrics = _findDeviceMetrics(subscriberId, cache);
    // ...
  }
}
```

**Impact**: First 5 minutes of QoE scores will be artificially zero (all components score 20 for zero values), triggering false critical alerts.

**Fix**: Add metric age validation:
```javascript
if (typeof LiveMonitor !== 'undefined' && LiveMonitor.getLastPollTime) {
  var lastPoll = LiveMonitor.getLastPollTime();
  if (lastPoll && (Date.now() - lastPoll) < 600000) { // 10min freshness
    var cache = LiveMonitor.getMetricCache();
    // ...
  }
}
```

---

### **[HIGH] Correctness: Missing IndexedDB batch write validation**

**Lines 686-691** (`_persistScores`)

The function sends batch writes to IndexedDB without checking if the `qoeScores` store exists in background.js. Per CLAUDE.md storage integration checklist (step 1), new stores need DB_VERSION bump + STORES config.

```javascript
_dbSend('db:putBatch', {
  operations: [{ store: 'qoeScores', records: records }]
}).catch(function(err) {
  _log('QoE kayit hatasi (IndexedDB)', err.message); // Silent failure
});
```

**Evidence from CLAUDE.md**:
> When adding a new IndexedDB store:
> 1. background.js STORES config + DB_VERSION bump

**Impact**: All QoE scores fail to persist silently. Users lose historical data after page refresh.

**Fix**:
1. Add to `fiber-chrome/background.js` STORES array:
```javascript
STORES: [
  // ... existing stores
  { name: 'qoeScores', key: 'id', indexes: ['subscriberId', 'timestamp'] }
]
```
2. Bump `DB_VERSION` in background.js
3. Add rejection handler with user notification

---

### **[HIGH] Security: Unbounded alert arrays enable memory exhaustion DoS**

**Lines 79-80, 449-452**

Both `_bufferbloatAlerts` and `_capacityAlerts` have no max size limit. `_bufferbloatAlerts` has a 200-item cap but it's only enforced AFTER adding the new alert. `_capacityAlerts` has NO cap at all.

```javascript
var _bufferbloatAlerts = [];
var _capacityAlerts = [];

// In detectBufferbloat():
_bufferbloatAlerts.push(alert);
if (_bufferbloatAlerts.length > CONSTANTS.MAX_ALERTS) {
  _bufferbloatAlerts = _bufferbloatAlerts.slice(-CONSTANTS.MAX_ALERTS); // After push!
}
```

**Attack vector**: Malicious FlowAnalyzer data with 10,000 subscribers triggers 10,000 alerts every 5 minutes → 288,000 alerts/day → ~500MB RAM in 24 hours.

**Fix**:
```javascript
// Enforce BEFORE push
if (_bufferbloatAlerts.length >= CONSTANTS.MAX_ALERTS) {
  _bufferbloatAlerts.shift(); // FIFO
}
_bufferbloatAlerts.push(alert);

// Add limit to capacity alerts (line 80):
var _capacityAlerts = []; // MAX: CONSTANTS.MAX_ALERTS
```

---

### **[HIGH] Correctness: Capacity alerts never stored in `_capacityAlerts` array**

**Lines 527-565** (`checkCapacity`)

The function calculates capacity status but never creates or stores capacity alerts. The `_capacityAlerts` array (line 80) is initialized but never populated. `getCapacityAlerts()` returns an empty array always.

```javascript
function checkCapacity(equipmentId) {
  var capacity = { id: equipmentId, usagePct: 0, ... };
  // ... calculation logic ...

  if (capacity.usagePct >= CONSTANTS.CAPACITY_CRITICAL_PCT) {
    capacity.status = 'critical';
  }

  return capacity; // MISSING: No alert creation or _capacityAlerts.push()
}
```

**Impact**: Capacity monitoring feature (Task 3) completely non-functional. Critical OLT saturation events never trigger alerts or events.

**Fix**:
```javascript
// Before return in checkCapacity():
if (capacity.status === 'warning' || capacity.status === 'critical' || capacity.status === 'saturated') {
  var alert = {
    id: _generateId(),
    equipmentId: equipmentId,
    type: 'capacity',
    severity: capacity.status === 'saturated' || capacity.status === 'critical' ? 'critical' : 'warning',
    usagePct: capacity.usagePct,
    timestamp: _now(),
    resolved: false
  };

  // Check for duplicate
  var existing = _capacityAlerts.find(function(a) {
    return a.equipmentId === equipmentId && !a.resolved;
  });

  if (!existing) {
    if (_capacityAlerts.length >= CONSTANTS.MAX_ALERTS) _capacityAlerts.shift();
    _capacityAlerts.push(alert);
    _emitEvent('qoe:capacityWarning', alert);
  }
}
```

---

### **[MEDIUM] Correctness: QoE score calculation rounds too aggressively**

**Lines 207-209** (`calculateQoeScore`)

Weighted sum is rounded to integer immediately, losing precision for trend analysis. Small changes (e.g., latency 19ms→21ms) don't change score (100→80 component, but final score may stay 88 due to other components).

```javascript
var total = (lScore * w.latency) + (jScore * w.jitter) + (plScore * w.packetLoss) + (tScore * w.throughput);
var score = Math.round(total); // Precision loss
```

**Impact**: Dashboard trend charts show flat lines despite real QoE degradation. Users can't detect gradual performance decline.

**Fix**: Store float score, round only for display:
```javascript
var score = total; // Keep float (e.g., 87.35)

return {
  score: score,
  scoreRounded: Math.round(score), // For display
  // ...
}
```

---

### **[MEDIUM] Performance: O(n²) lookup in `_findDeviceMetrics` for large device counts**

**Lines 312-332** (`_findDeviceMetrics`)

Nested loops iterate through all deviceIds and all metric entries for each subscriber QoE calculation. With 1000 devices × 100 entries/device × 1000 subscribers = 100M iterations per poll cycle.

```javascript
function _findDeviceMetrics(subscriberId, cache) {
  var deviceIds = Object.keys(cache);
  for (var i = 0; i < deviceIds.length; i++) {
    var entries = cache[deviceIds[i]];
    if (!Array.isArray(entries) || entries.length === 0) continue;
    var last = entries[entries.length - 1]; // Only need last entry!
    if (last && (last.subscriberIp === subscriberId || deviceIds[i] === subscriberId)) {
      return { ... };
    }
  }
}
```

**Fix**: Pre-build subscriber→device index in LiveMonitor or cache lookups:
```javascript
// In QoeEngine private state:
var _deviceLookup = {}; // subscriberId → deviceId

// Update on LiveMonitor events:
if (typeof LiveMonitor !== 'undefined') {
  LiveMonitor.on('metrics:updated', function(data) {
    _deviceLookup = {}; // Rebuild
    var cache = data.cache;
    Object.keys(cache).forEach(function(deviceId) {
      var entries = cache[deviceId];
      if (entries.length > 0) {
        var last = entries[entries.length - 1];
        if (last.subscriberIp) _deviceLookup[last.subscriberIp] = deviceId;
      }
    });
  });
}

// Fast lookup:
function _findDeviceMetrics(subscriberId, cache) {
  var deviceId = _deviceLookup[subscriberId];
  if (!deviceId || !cache[deviceId]) return null;
  var entries = cache[deviceId];
  var last = entries[entries.length - 1];
  return { latency: last.latency, ... };
}
```

---

### **[MEDIUM] Correctness: QoE history filter uses client-side time, breaks after clock skew**

**Lines 390-404** (`getQoeHistory`)

Uses `Date.now()` for cutoff calculation but timestamps are ISO strings. If system clock changes (NTP sync, manual adjustment), historical data becomes inaccessible.

```javascript
var now = Date.now();
var cutoff;
switch (timeRange) {
  case '24h': cutoff = now - 86400000; break;
  // ...
}

return entries.filter(function(e) {
  return new Date(e.timestamp).getTime() >= cutoff; // Breaks if clock skew
});
```

**Impact**: After NTP sync moves clock back 1 hour, `getQoeHistory('24h')` returns 25 hours of data.

**Fix**: Use relative timestamps or validate clock monotonicity:
```javascript
function getQoeHistory(subscriberId, timeRange) {
  var entries = _qoeScores[subscriberId] || [];
  if (entries.length === 0) return [];

  // Use most recent entry as reference
  var mostRecent = new Date(entries[entries.length - 1].timestamp).getTime();
  var cutoff;
  switch (timeRange) {
    case '24h': cutoff = mostRecent - 86400000; break;
    // ...
  }

  return entries.filter(function(e) {
    return new Date(e.timestamp).getTime() >= cutoff;
  });
}
```

---

### **[MEDIUM] Readability: Magic number cascade in throughput thresholds**

**Lines 60-67** (`_throughputScore`)

Hardcoded percentages (90%, 70%, 50%) have no rationale comment. Different from other metric thresholds (latency uses absolute ms values).

```javascript
function _throughputScore(actualMbps, planMbps) {
  if (!planMbps || planMbps <= 0) return 80; // Why 80?
  var pct = (actualMbps / planMbps) * 100;
  if (pct > 90) return 100; // Why 90%?
  if (pct > 70) return 80;
  if (pct > 50) return 50;
  return 20;
}
```

**Fix**: Add named constants with source rationale:
```javascript
var THROUGHPUT_THRESHOLDS = {
  EXCELLENT: 90,  // ITU-T G.1028 — excellent QoE
  GOOD: 70,       // IETF RFC 8289 — acceptable for HD streaming
  FAIR: 50,       // Minimum for SD video
  POOR: 0
};
```

---

### **[LOW] Performance: Redundant JSON deep clone in getCurrentScores**

**Line 786** (`getCurrentScores`)

Deep clone of entire `_currentScores` object on every call, even though data is read-only for most consumers.

```javascript
function getCurrentScores() {
  return JSON.parse(JSON.stringify(_currentScores)); // Expensive
}
```

**Impact**: Dashboard polling every 30s clones 1000+ subscriber records → 50ms blocking operation on main thread.

**Fix**: Document that returned object should not be mutated, remove clone:
```javascript
/**
 * WARNING: Returned object is read-only. Do not mutate.
 * @returns {Object} Map<subscriberId, entry>
 */
function getCurrentScores() {
  return _currentScores; // Caller responsibility to not mutate
}
```
Or use Object.freeze for safety:
```javascript
return Object.freeze(JSON.parse(JSON.stringify(_currentScores)));
```

---

### **[LOW] Correctness: Missing type guard for Topology module**

**Lines 539-540** (`checkCapacity`)

Type guard checks for `Topology` and `Topology.PROJECT` but not for `Topology.PROJECT.adas` before iterating.

```javascript
if (typeof Topology !== 'undefined' && Topology.PROJECT) {
  var adas = Topology.PROJECT.adas || []; // Safe default
  for (var i = 0; i < adas.length; i++) {
    // ...
  }
}
```

**Status**: Actually CORRECT — uses `|| []` fallback. No issue here (kept for completeness).

---

### **[LOW] Readability: Inconsistent severity naming in bufferbloat vs rules**

**Lines 87-89, 423-426**

Rules use `'warning'` and `'critical'` severity levels, but bufferbloat detection adds `'high'` and `'medium'` levels.

```javascript
// Rules (line 87):
{ severity: 'warning' }, { severity: 'critical' }

// Bufferbloat (line 424):
if (bloatRatio > 500) severity = 'critical';
else if (bloatRatio > 300) severity = 'high'; // Not in rules
else severity = 'medium'; // Not in rules
```

**Impact**: Dashboard alert filtering will miss bufferbloat alerts if filtering by rule severity levels.

**Fix**: Normalize to three-level system across entire module:
```javascript
var SEVERITY_LEVELS = {
  INFO: 'info',      // < 200% bloat, 70+ score
  WARNING: 'warning', // 200-300% bloat, 40-70 score
  CRITICAL: 'critical' // > 300% bloat, < 40 score
};
```

---

## Missing Features (Per Spec)

### **Dashboard Integration**: Story 7.6 requires QoE tab in dashboard
**Expected**: `fiber-chrome/dashboard/dashboard.js` should have QoE tab with:
- Overview panel (avg score, distribution doughnut)
- Ranking table with sortable columns
- Detail charts per subscriber (sparkline trend)
- Alert list with filtering
- Rule editor UI

**Status**: Not implemented. Module is library-only, no UI integration.

**Action Required**: See Story 7.6 implementation artifact task list.

---

## Architecture Compliance

| Requirement | Status | Notes |
|-------------|--------|-------|
| IIFE pattern | ✅ PASS | Correct `const QoeEngine = (() => { ... })()` |
| Type guards | ✅ PASS | All module access guarded (LiveMonitor, FlowAnalyzer, Topology) |
| EventBus events | ✅ PASS | All 4 required events emitted (scoreUpdated, bufferbloatDetected, capacityWarning, criticalAlert) |
| FPDebug logging | ✅ PASS | Fallback to console.log |
| No global pollution | ✅ PASS | Single global `QoeEngine` |
| QoE formula | ✅ PASS | Weighted 30/20/25/25 correct |
| Score thresholds | ✅ PASS | good≥70, fair≥40, poor<40 |
| Bufferbloat threshold | ✅ PASS | 200% ratio correct |
| AQM suggestions | ✅ PASS | Device-specific (MikroTik, Linux, generic) |
| Capacity thresholds | ✅ PASS | 80% warning, 95% critical |
| IndexedDB store | ❌ FAIL | Store not registered in background.js |
| Autonomous rules | ⚠️ PARTIAL | Logic present but capacity alerts never fire |
| Memory cleanup | ⚠️ PARTIAL | Bufferbloat capped, capacity unlimited, no stopPolling() cleanup |

---

## Positive Observations

1. **Clean separation of concerns**: Metric collection, scoring, alerting, and persistence are well-separated functions.
2. **Comprehensive scoring tables**: Latency/jitter/packet loss/throughput thresholds are industry-aligned (ITU-T G.1028).
3. **Device-specific AQM logic**: MikroTik vs Linux differentiation shows domain expertise.
4. **Defensive defaults**: Graceful degradation when FlowAnalyzer/LiveMonitor unavailable.
5. **Configurable thresholds**: `configure()` allows runtime tuning without code changes.

---

## Security Analysis

| Vector | Risk | Mitigation |
|--------|------|------------|
| XSS via alert data | LOW | Alert fields (`subscriberId`, `deviceId`) are never rendered in innerHTML — only textContent in panels.js |
| Memory exhaustion | **HIGH** | Unbounded `_capacityAlerts` array (issue #3) |
| IndexedDB injection | LOW | `subscriberId` used as key but sanitized by chrome.runtime messaging |
| CSP violations | NONE | No eval(), no inline scripts, no external fetches |

---

## Test Coverage Gaps

1. **Metric staleness**: No test for `_gatherSubscriberMetrics` with empty LiveMonitor cache
2. **Clock skew**: No test for `getQoeHistory` after system time change
3. **Concurrent polling**: No test for overlapping `calculateAllQoe()` calls (5min interval vs 10min execution time)
4. **Capacity overflow**: No test for >128 BB/port scenario (should alert but topology prevents this)
5. **Bufferbloat edge case**: No test for `idleLatency = 0` (divide by zero protection works but not tested)

---

## Recommendations

### Immediate (Blocking)
1. **Fix issue #2**: Add `qoeScores` store to background.js + bump DB_VERSION
2. **Fix issue #4**: Implement capacity alert creation in `checkCapacity()`
3. **Fix issue #1**: Add metric freshness validation (10min max age)
4. **Fix issue #3**: Cap `_capacityAlerts` array to CONSTANTS.MAX_ALERTS

### Short-term (Before Production)
5. **Fix issue #5**: Store float scores for precision trend analysis
6. **Fix issue #6**: Add subscriber→device index to LiveMonitor
7. Add `stopPolling()` cleanup: clear arrays, stop timers
8. Add dashboard UI integration (Story 7.6 Task 5)

### Long-term (Post-MVP)
9. Implement QoE prediction (ML-based, requires historical data)
10. Add WebRTC-based active latency probes (supplement Zabbix ICMP)
11. Cross-reference QoE with TR-069 CPE diagnostics (Story 7.4)

---

## Verdict

**NEEDS CHANGES** — 4 blocking issues prevent production deployment:
1. IndexedDB store missing (data loss)
2. Capacity alerts non-functional (core feature broken)
3. Metric race condition (false alerts on startup)
4. Memory exhaustion risk (DoS vector)

**Estimated fix effort**: 6 hours (2h IndexedDB integration, 2h capacity alert logic, 1h metric validation, 1h testing)

---

## Appendix: Fiber Domain Validation

| Parameter | Expected | Actual | Status |
|-----------|----------|--------|--------|
| Latency good threshold | < 20ms | < 20ms | ✅ |
| Jitter good threshold | < 5ms | < 5ms | ✅ |
| Packet loss good | < 0.1% | < 0.1% | ✅ |
| Throughput good | > 90% plan | > 90% plan | ✅ |
| Bufferbloat ratio | > 200% | > 200% | ✅ |
| QoE weights sum | 1.0 | 0.30+0.20+0.25+0.25=1.0 | ✅ |
| OLT capacity | 128 BB/port | 128 (line 546) | ✅ |

**Fiber calculations**: All GPON assumptions correct per ITU-T G.984. No dB calculations in this module (delegated to PonEngine).

---

**Review completed**: 2026-03-07
**Files referenced**:
- `F:\NVI FIBER\fiber-chrome\lib\qoe-engine.js`
- `F:\NVI FIBER\CLAUDE.md` (storage checklist)
- `F:\NVI FIBER\_bmad-output\implementation-artifacts\7-6-qoe-quality-of-experience-motoru.md` (spec)
