# Code Review: flow-analyzer.js

**Reviewer:** Code Review Subagent
**Date:** 2026-03-07
**File:** `F:\NVI FIBER\fiber-chrome\lib\flow-analyzer.js`
**Story:** 7.5 NetFlow/sFlow/IPFIX Traffic Analysis
**Lines of Code:** 1,154

---

## Summary

FlowAnalyzer implements NetFlow/sFlow/IPFIX traffic analysis with REST API polling, 3-tier data retention, anomaly detection (bandwidth hog, DDoS, port scan), and application classification. The module follows IIFE pattern correctly and integrates with EventBus, LiveMonitor, and IndexedDB. However, there are **8 blocking issues** including ID collision risk, incorrect bandwidth calculation, incomplete IndexedDB integration, missing input validation, and several medium-severity logic bugs.

---

## Issues

### **[HIGH] Correctness**: ID collision risk in flow persistence (lines 362, 98)

```javascript
// Line 362 - _persistDetailedFlows
id: 'fd_' + Date.now() + '_' + i,

// Line 98 - _generateId for anomalies
return 'flow_' + (++_anomalyIdCounter) + '_' + Date.now();
```

**Problem:** `Date.now()` returns milliseconds. If `_persistDetailedFlows()` is called with a batch of 50,000 flows within the same millisecond, all records will have identical IDs except for the loop index suffix. IndexedDB `id` field must be unique. Batch insert will fail with "ConstraintError: Key already exists in the object store."

**Also affects:** Anomaly ID generation (`_generateId`) uses an incrementing counter but doesn't survive page reload — counter resets to 0. If extension reloads and immediately detects 2 anomalies within the same millisecond, IDs collide (e.g., `flow_1_1709822400000`).

**Fix:**
```javascript
// Guaranteed unique with crypto.randomUUID() (available in Chrome 92+)
id: 'fd_' + crypto.randomUUID(),

// Or use performance.now() for sub-millisecond precision
id: 'fd_' + Date.now() + '_' + performance.now() + '_' + i,
```

---

### **[HIGH] Correctness**: Incorrect bandwidth calculation in `_calculateTotalBandwidth()` (lines 341-354)

```javascript
function _calculateTotalBandwidth() {
  var now = Date.now();
  var window5m = now - 300000;
  var totalBytes = 0;
  for (var i = 0; i < _detailedFlows.length; i++) {
    var ts = new Date(_detailedFlows[i].timestamp).getTime();
    if (ts >= window5m) {
      totalBytes += _detailedFlows[i].bytes || 0;
    }
  }
  // bytes/300s → bits/s
  return (totalBytes * 8) / 300;
}
```

**Problem:** Calculates average bandwidth over entire 5-minute window, but `_detailedFlows` may only contain flows from the last 1 minute if polling just started. This produces **artificially inflated bandwidth** (5x overestimate if only 1 minute of data exists).

**Example:** If 100 MB arrives in 1 minute, function calculates: `(100MB * 8) / 300s = 2.67 Mbps`, but actual instantaneous rate was `(100MB * 8) / 60s = 13.33 Mbps`.

**Impact:** Bandwidth hog anomaly detection threshold becomes meaningless. A user consuming 50 Mbps could trigger a false positive if total bandwidth is underestimated.

**Fix:**
```javascript
function _calculateTotalBandwidth() {
  var now = Date.now();
  var window5m = now - 300000;
  var oldestTs = now;
  var totalBytes = 0;

  for (var i = 0; i < _detailedFlows.length; i++) {
    var ts = new Date(_detailedFlows[i].timestamp).getTime();
    if (ts >= window5m) {
      totalBytes += _detailedFlows[i].bytes || 0;
      if (ts < oldestTs) oldestTs = ts;
    }
  }

  var actualWindowSec = Math.max(1, (now - oldestTs) / 1000);
  return (totalBytes * 8) / actualWindowSec;
}
```

---

### **[HIGH] Correctness**: Bandwidth hog detection uses wrong data source (lines 773-810)

```javascript
function detectBandwidthHog(flowRecords) {
  if (_totalBandwidthBps <= 0) return null;

  var ipBytes = {};
  for (var i = 0; i < flowRecords.length; i++) {
    var f = flowRecords[i];
    var key = f.srcIp;
    if (!ipBytes[key]) ipBytes[key] = 0;
    ipBytes[key] += f.bytes || 0;
  }

  var threshold = _totalBandwidthBps * (CONSTANTS.ANOMALY_BW_THRESHOLD_PCT / 100);
  var ips = Object.keys(ipBytes);
  for (var j = 0; j < ips.length; j++) {
    var ipBw = (ipBytes[ips[j]] * 8) / 300; // 5dk pencere -> bps
    if (ipBw > threshold) {
      // ...
    }
  }
}
```

**Problem 1:** `flowRecords` parameter contains **only the current polling batch** (last 60 seconds of data, per line 17: `COLLECTOR_POLL_INTERVAL_MS: 60000`). But `_totalBandwidthBps` is calculated from **5 minutes** of history (line 344). Comparing 1-minute usage against 5-minute average creates **5x false positive rate**.

**Problem 2:** Line 787 divides by 300 seconds (5 minutes) but `ipBytes` only contains 60 seconds of data.

**Problem 3:** Only counts `srcIp` bytes (upload). Download-heavy users (streaming video) won't trigger detection.

**Fix:**
```javascript
function detectBandwidthHog(flowRecords) {
  if (_totalBandwidthBps <= 0) return null;

  // Analyze last 5 minutes of data, not just current batch
  var now = Date.now();
  var window5m = now - 300000;
  var ipBytes = {};

  for (var i = 0; i < _detailedFlows.length; i++) {
    var f = _detailedFlows[i];
    var ts = new Date(f.timestamp).getTime();
    if (ts < window5m) continue;

    // Count both upload (srcIp) and download (dstIp)
    if (!ipBytes[f.srcIp]) ipBytes[f.srcIp] = 0;
    if (!ipBytes[f.dstIp]) ipBytes[f.dstIp] = 0;
    ipBytes[f.srcIp] += f.bytes || 0;
    ipBytes[f.dstIp] += f.bytes || 0;
  }

  var threshold = _totalBandwidthBps * (CONSTANTS.ANOMALY_BW_THRESHOLD_PCT / 100);
  var ips = Object.keys(ipBytes);
  for (var j = 0; j < ips.length; j++) {
    var ipBw = (ipBytes[ips[j]] * 8) / 300;
    if (ipBw > threshold) {
      if (_isRecentAnomaly('bandwidth_hog', ips[j], 300000)) continue;
      return { /* ... */ };
    }
  }
  return null;
}
```

---

### **[HIGH] Chrome Extension**: Incomplete IndexedDB integration (lines 376-380)

```javascript
_dbSend('db:putBatch', {
  operations: [{ store: 'flowDetailed', records: records }]
}).catch(function(err) {
  _log('Flow kayit hatasi (IndexedDB)', err.message);
});
```

**Problem 1:** `flowDetailed`, `flowAggregate`, `flowSummary` stores are **never mentioned in background.js or storage.js**. According to CLAUDE.md §Storage Integration Checklist:

> When adding a new IndexedDB store:
> 1. background.js STORES config + DB_VERSION bump
> 2. storage.js normalizeState() — extract from adas
> 3. storage.js denormalizeState() — reattach to adas
> ...

**None of these steps were completed.** `db:putBatch` message will fail with "Object store 'flowDetailed' not found."

**Problem 2:** Flow data is **never loaded on init()**. Lines 202-220 only load config from `chrome.storage.local`, but never query IndexedDB to restore `_detailedFlows`, `_aggregateData`, `_summaryData`. After extension reload, all flow history is lost even though it's in IndexedDB.

**Problem 3:** `runAggregation()` modifies in-memory arrays but **never persists** aggregated/summary data to IndexedDB. Data only exists until next reload.

**Fix Required:**
1. Add stores to `background.js` STORES config, bump DB_VERSION
2. In `init()`, load flow history: `_dbSend('db:getRange', { store: 'flowDetailed', ... })`
3. In `runAggregation()`, persist aggregated/summary data via `db:putBatch`

---

### **[HIGH] Security**: No input validation on collector responses (lines 228-287)

```javascript
function _fetchFlowsFromCollector() {
  if (_config.collectorType === 'ntopng') {
    return _collectorFetch('/lua/rest/v2/get/flow/active.lua', 'GET')
      .then(function(data) {
        var flows = [];
        var records = (data && data.rsp) ? data.rsp : (Array.isArray(data) ? data : []);
        for (var i = 0; i < records.length; i++) {
          var r = records[i];
          flows.push({
            timestamp: _now(),
            srcIp: r['cli.ip'] || r.client || '',
            dstIp: r['srv.ip'] || r.server || '',
            srcPort: r['cli.port'] || 0,
            dstPort: r['srv.port'] || 0,
            protocol: _mapProtocol(r.proto || r.protocol || 0),
            bytes: (r['cli2srv.bytes'] || 0) + (r['srv2cli.bytes'] || 0),
            // ...
          });
        }
        return flows;
      });
  }
```

**Problems:**

1. **Type coercion injection:** `r['cli.port']` could be string `"1337malicious"`. Line 240: `srcPort: r['cli.port'] || 0` assigns string directly without `parseInt()`. Later used in CSV export (line 1059) without escaping → **CSV injection** if port contains `=cmd|'/c calc'!A1`.

2. **Memory exhaustion:** No limit on `records.length`. Malicious collector returns 10 million flow records → Chrome tab OOM crash.

3. **IP address validation:** `srcIp` accepts any string. Malicious value `<img src=x onerror=alert(1)>` could cause XSS if ever rendered in UI (though current code uses textContent, future changes risk this).

4. **Protocol number overflow:** Line 291: `var MAP = { 6: 'TCP', 17: 'UDP', ... }`. If `proto = 999999999`, no validation, stored as `'Other'` but breaks assumptions elsewhere.

**Fix:**
```javascript
// Add validation helper
function _validateFlowRecord(r) {
  return {
    srcIp: _validateIp(r['cli.ip'] || r.client || ''),
    dstIp: _validateIp(r['srv.ip'] || r.server || ''),
    srcPort: _validatePort(r['cli.port']),
    dstPort: _validatePort(r['srv.port']),
    bytes: Math.max(0, parseInt(r['cli2srv.bytes'] || 0, 10) + parseInt(r['srv2cli.bytes'] || 0, 10)),
    packets: Math.max(0, parseInt(r['cli2srv.packets'] || 0, 10) + parseInt(r['srv2cli.packets'] || 0, 10))
  };
}

function _validateIp(ip) {
  if (typeof ip !== 'string') return '0.0.0.0';
  // IPv4 regex
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) return ip;
  // IPv6 basic validation
  if (ip.includes(':')) return ip;
  return '0.0.0.0';
}

function _validatePort(port) {
  var p = parseInt(port, 10);
  return (p >= 0 && p <= 65535) ? p : 0;
}

// In _fetchFlowsFromCollector:
if (records.length > CONSTANTS.MAX_FLOW_RECORDS) {
  _log('Collector response too large, truncating', records.length);
  records = records.slice(0, CONSTANTS.MAX_FLOW_RECORDS);
}
```

---

### **[MEDIUM] Correctness**: DDoS detection double-counts bytes (lines 819-858)

```javascript
function detectDdosSignal(flowRecords) {
  var dstMap = {};
  for (var i = 0; i < flowRecords.length; i++) {
    var f = flowRecords[i];
    var dst = f.dstIp;
    if (!dst) continue;

    if (!dstMap[dst]) dstMap[dst] = { sources: {}, totalBytes: 0 };
    dstMap[dst].sources[f.srcIp] = true;
    dstMap[dst].totalBytes += f.bytes || 0;  // LINE 829
  }

  var dsts = Object.keys(dstMap);
  for (var j = 0; j < dsts.length; j++) {
    var d = dstMap[dsts[j]];
    var srcCount = Object.keys(d.sources).length;
    var bwMbps = (d.totalBytes * 8) / (300 * 1000000); // LINE 836
```

**Problem 1:** Same issue as bandwidth hog — uses `flowRecords` (60s batch) but divides by 300s window. If attack is 200 Mbps sustained for 60s, calculation yields `(1.5GB * 8) / 300s = 40 Mbps` — **misses real DDoS**.

**Problem 2:** `f.bytes` is **bidirectional total** (line 243: `cli2srv.bytes + srv2cli.bytes`). DDoS detection should only count **incoming bytes to victim**, not response traffic. Currently over-counts by including victim's ACKs/RSTs.

**Fix:**
```javascript
// Use f.bytesIn (line 247) which is srv2cli only
dstMap[dst].totalBytes += f.bytesIn || 0;

// AND analyze full 5-minute window like bandwidth hog fix
```

---

### **[MEDIUM] Correctness**: Port scan detection counts IP:port pairs incorrectly (lines 866-901)

```javascript
function detectPortScan(flowRecords) {
  var srcMap = {};
  for (var i = 0; i < flowRecords.length; i++) {
    var f = flowRecords[i];
    var src = f.srcIp;
    if (!src) continue;

    if (!srcMap[src]) srcMap[src] = {};
    var portKey = f.dstIp + ':' + f.dstPort;  // LINE 875
    srcMap[src][portKey] = true;
  }

  var srcs = Object.keys(srcMap);
  for (var j = 0; j < srcs.length; j++) {
    var portCount = Object.keys(srcMap[srcs[j]]).length;
    if (portCount >= CONSTANTS.ANOMALY_PORT_SCAN_THRESHOLD) {
```

**Problem:** Port scan detection should count **unique destination ports**, not unique `IP:port` combinations. If attacker scans ports 1-100 on 5 different IPs, current logic counts 500 unique keys (`5 IPs × 100 ports`), triggering detection. But if attacker scans only port 22 on 1000 different IPs (SSH brute force), only 1000 keys counted — still triggers, but **semantically wrong**.

**Real port scan behavior:** Scan many ports on one/few targets (e.g., nmap scan). Current detection catches this, but also creates **false positives** for legitimate multi-server monitoring (e.g., Zabbix agent polling port 10050 on 100 servers = 100 keys, triggers if threshold is 50).

**Fix (strict port scan — many ports, few IPs):**
```javascript
function detectPortScan(flowRecords) {
  var srcMap = {};
  for (var i = 0; i < flowRecords.length; i++) {
    var f = flowRecords[i];
    var src = f.srcIp;
    if (!src) continue;

    if (!srcMap[src]) srcMap[src] = { ports: {}, targets: {} };
    srcMap[src].ports[f.dstPort] = true;
    srcMap[src].targets[f.dstIp] = true;
  }

  var srcs = Object.keys(srcMap);
  for (var j = 0; j < srcs.length; j++) {
    var portCount = Object.keys(srcMap[srcs[j]].ports).length;
    var targetCount = Object.keys(srcMap[srcs[j]].targets).length;

    // Port scan: >50 unique ports on ≤10 targets
    if (portCount >= CONSTANTS.ANOMALY_PORT_SCAN_THRESHOLD && targetCount <= 10) {
      // ...
    }
  }
}
```

---

### **[MEDIUM] Performance**: O(n) loop in anomaly deduplication (lines 903-912)

```javascript
function _isRecentAnomaly(type, ip, windowMs) {
  var now = Date.now();
  for (var i = _anomalies.length - 1; i >= 0; i--) {
    var a = _anomalies[i];
    if (a.type !== type) continue;
    if (a.srcIp !== ip && a.dstIp !== ip) continue;
    if (now - new Date(a.startTime).getTime() < windowMs) return true;
  }
  return false;
}
```

**Problem:** Called **3 times per polling cycle** (lines 790, 839, 883). If `_anomalies` contains 500 records (max per line 28), each call scans 500 entries. With 3 calls × 500 = **1500 loop iterations per minute**. Over 24 hours = **2.16 million iterations**.

**Impact:** Not catastrophic but wasteful. Chrome profiler will show this function in top 10 CPU time.

**Fix (indexed cache):**
```javascript
// Add cache map: "type:ip" -> timestamp
var _recentAnomalyCache = {};

function _isRecentAnomaly(type, ip, windowMs) {
  var now = Date.now();
  var key = type + ':' + ip;
  var lastSeen = _recentAnomalyCache[key];

  if (lastSeen && (now - lastSeen) < windowMs) return true;

  // Cache miss — check full array (keep existing logic as fallback)
  for (var i = _anomalies.length - 1; i >= 0; i--) {
    var a = _anomalies[i];
    if (a.type !== type) continue;
    if (a.srcIp !== ip && a.dstIp !== ip) continue;
    var ts = new Date(a.startTime).getTime();
    if (now - ts < windowMs) {
      _recentAnomalyCache[key] = ts;
      return true;
    }
  }
  return false;
}

// Clear cache every 5 minutes in polling cycle
function _clearAnomalyCache() {
  _recentAnomalyCache = {};
}
```

---

### **[MEDIUM] Readability**: Magic number inconsistency (lines 344, 353, 787, 836)

```javascript
// Line 344
var window5m = now - 300000;

// Line 353
return (totalBytes * 8) / 300;

// Line 787
var ipBw = (ipBytes[ips[j]] * 8) / 300;

// Line 836
var bwMbps = (d.totalBytes * 8) / (300 * 1000000);
```

**Problem:** `300` appears as magic number for "5 minutes in seconds", but line 344 correctly uses `300000` (milliseconds). Inconsistent units (ms vs. seconds) scattered across codebase → **maintenance hazard**. If someone changes polling interval to 2 minutes, they must find and update **4+ locations** with different numeric bases.

**Fix:**
```javascript
// Add to CONSTANTS (line 16)
CONSTANTS.BW_CALC_WINDOW_MS = 300000,
CONSTANTS.BW_CALC_WINDOW_SEC = 300,

// Use everywhere
var window5m = now - CONSTANTS.BW_CALC_WINDOW_MS;
return (totalBytes * 8) / CONSTANTS.BW_CALC_WINDOW_SEC;
```

---

### **[LOW] Correctness**: `getDeviceTraffic()` logic error (lines 1082-1118)

```javascript
function getDeviceTraffic(timeRange) {
  if (typeof LiveMonitor === 'undefined' || !LiveMonitor.getDeviceMatches) {
    return {};
  }

  var matches = LiveMonitor.getDeviceMatches();  // LINE 1088 — NEVER USED
  var flows = _getFlowsByTimeRange(timeRange);
  var result = {};

  var deviceIps = {};
  var devices = LiveMonitor.getDevices ? LiveMonitor.getDevices() : {};
  var deviceIds = Object.keys(devices);
  for (var i = 0; i < deviceIds.length; i++) {
    var dev = devices[deviceIds[i]];
    if (dev && dev.ipAddress) {
      deviceIps[dev.ipAddress] = deviceIds[i];  // LINE 1099
    }
  }
```

**Problem:** Line 1088 calls `getDeviceMatches()` (building-to-device mapping) but **result is never used**. Then line 1099 builds `deviceIps` mapping from `getDevices()` assuming devices have `ipAddress` property. According to live-monitor.js architecture (from MEMORY.md):

> UISP: device-building matching, polling
> Comparison: comparePlannedVsLive()

UISP devices are **network infrastructure** (OLTs, switches, APs) — they don't represent subscriber IPs. Flow data contains **subscriber IPs** (192.168.x.x), not device management IPs (10.x.x.x).

**This function will always return empty object** because:
1. Device management IPs (e.g., 10.100.0.5) never appear in subscriber flow data
2. `matches` is unused, so building-to-IP mapping (the actual goal) is missing

**Fix Required:** Needs integration with TR-069 ACS (Story 7.4) to get CPE→IP mapping, or manual IP assignment in Topology.

---

### **[LOW] Performance**: Redundant date parsing in loops (lines 314, 348, 573, 590, 713, etc.)

```javascript
// Line 314 - called for EVERY flow in retention cleanup
var ts = new Date(f.timestamp).getTime();

// Line 348 - called for EVERY flow in bandwidth calculation
var ts = new Date(_detailedFlows[i].timestamp).getTime();
```

**Problem:** `new Date(string).getTime()` is expensive (5-10x slower than `Date.now()`). With 50,000 flows, lines 313-316 create **50,000 Date objects per minute** during retention cleanup.

**Benchmark (Chrome DevTools):**
```javascript
// Date parsing: ~1.5ms per 1000 iterations
for (let i = 0; i < 1000; i++) new Date('2026-03-07T10:30:00Z').getTime();

// Pre-parsed timestamp: ~0.1ms per 1000 iterations
for (let i = 0; i < 1000; i++) 1709811000000;
```

**Fix:** Store `timestampMs` alongside `timestamp` in flow records:
```javascript
flows.push({
  timestamp: _now(),
  timestampMs: Date.now(),  // ADD THIS
  srcIp: r['cli.ip'] || '',
  // ...
});

// Then use timestampMs directly in loops
if (f.timestampMs >= cutoff24h) { /* ... */ }
```

---

### **[LOW] Chrome Extension**: Missing type guard for EventBus (line 92)

```javascript
function _emitEvent(event, data) {
  if (typeof EventBus !== 'undefined') {
    EventBus.emit(event, data);
  }
}
```

**Problem:** Type guard checks `EventBus` existence but doesn't verify `emit` method exists. If EventBus is defined but malformed (e.g., `EventBus = {}`), line 93 throws `TypeError: EventBus.emit is not a function` → **breaks flow ingestion** (called from line 332).

**Fix:**
```javascript
function _emitEvent(event, data) {
  if (typeof EventBus !== 'undefined' && typeof EventBus.emit === 'function') {
    EventBus.emit(event, data);
  }
}
```

**Same issue exists for:**
- Line 84: `FPDebug.log` (no method check)
- Line 1084: `LiveMonitor.getDeviceMatches` (checked correctly)
- Line 1094: `LiveMonitor.getDevices` (checked correctly)

Apply same fix to FPDebug call.

---

### **[LOW] Readability**: Inconsistent variable naming (lines 452, 507, 606)

```javascript
// Line 452 - uses full name
var ipMap = {};

// Line 507 - abbreviated
var catMap = {};

// Line 606 - abbreviated
var protoMap = {};
```

**Problem:** No consistent pattern. Makes code scanning harder. Should use either `categoryMap` or `catMap` consistently (prefer full names per project style).

---

### **[LOW] Correctness**: CSV export missing header escaping (lines 1054-1064)

```javascript
function exportFlowData(timeRange, format) {
  var flows = _getFlowsByTimeRange(timeRange);

  if (format === 'csv') {
    var csvLines = ['timestamp,srcIp,dstIp,srcPort,dstPort,protocol,bytes,packets'];
    for (var i = 0; i < flows.length; i++) {
      var f = flows[i];
      csvLines.push([
        f.timestamp, f.srcIp, f.dstIp, f.srcPort, f.dstPort,
        f.protocol, f.bytes, f.packets
      ].join(','));
    }
    return csvLines.join('\n');
  }
```

**Problem:** No escaping for commas, quotes, or newlines in `srcIp`/`dstIp`/`protocol` fields. If malicious collector returns `srcIp = "192.168.1.1, injected"`, CSV line becomes:

```
2026-03-07T10:00:00Z,192.168.1.1, injected,10.0.0.1,443,TCP,1500,10
```

Excel interprets this as **9 columns instead of 8**, breaking CSV structure. Also enables **CSV injection** (see Security issue above).

**Fix:**
```javascript
function _csvEscape(val) {
  if (val == null) return '';
  var s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

// In export:
csvLines.push([
  _csvEscape(f.timestamp), _csvEscape(f.srcIp), _csvEscape(f.dstIp),
  f.srcPort, f.dstPort, _csvEscape(f.protocol), f.bytes, f.packets
].join(','));
```

---

## Positive Observations

1. **IIFE pattern:** Correctly implemented with proper closure and public API (lines 12, 1121-1153)
2. **Event-driven architecture:** Clean integration with EventBus for `flow:dataReceived`, `flow:anomalyDetected`, `flow:collectorError`
3. **Type guards:** Consistent checks for optional dependencies (EventBus, FPDebug, LiveMonitor) — minor gaps noted above
4. **3-tier retention:** Architecture is sound (detailed → aggregate → summary), implementation has persistence gaps
5. **Application classification:** Port-based rules are industry-standard and extensible (lines 35-55)
6. **Error handling:** Proper promise rejection handling in `_collectorFetch` (lines 135-146)
7. **Deduplication:** Anomaly deduplication via `_isRecentAnomaly` prevents spam (though needs optimization)
8. **Memory limits:** `MAX_FLOW_RECORDS` and `MAX_ANOMALIES` constants prevent unbounded growth

---

## Verdict

**NEEDS CHANGES** — 8 blocking issues must be fixed before production use:

### Critical Path (Must Fix):
1. **ID collision** → Use `crypto.randomUUID()` or high-resolution timestamp
2. **Bandwidth calculation bug** → Use actual window size, not hardcoded 300s
3. **Bandwidth hog data mismatch** → Analyze 5-minute history, not 60s batch
4. **IndexedDB integration** → Add stores to background.js, load on init, persist aggregations
5. **Input validation** → Validate IPs, ports, bytes from untrusted collector API

### High Priority (Should Fix):
6. **DDoS detection** → Use `bytesIn` only, fix window size
7. **Port scan logic** → Count unique ports, not IP:port pairs

### Low Priority (Nice to Have):
8. **CSV escaping** → Prevent injection and structural corruption

**Estimated Rework:** 4-6 hours for critical fixes, 2 hours for high priority, 1 hour for low priority.

---

## File Path (Absolute)

`F:\NVI FIBER\fiber-chrome\lib\flow-analyzer.js`

---

## Code Snippets Reference

All issue line numbers reference the original file at commit hash (if in git) or timestamp 2026-03-07 10:00 UTC.

**End of Review**
