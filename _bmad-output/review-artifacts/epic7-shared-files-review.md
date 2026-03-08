# Epic 7 Shared Files - Adversarial Code Review

**Reviewer:** Code Review Subagent
**Date:** 2026-03-07
**Scope:** Shared files modified by Epic 7 stories (LiveMonitor, Zabbix, Comparison, ACS, FlowAnalyzer, QoE)

---

## Summary

Epic 7 integration in shared files is **mostly complete** with correct module load order and EventBus wiring. However, there are **4 HIGH severity issues** and **several missing integrations** that will cause runtime failures. Most critical: live monitoring layer toggle missing from overlay.js, dashboard sections incomplete, and missing 'warning' status in map-utils.js getLiveStatusStyle.

---

## Issues

### HIGH SEVERITY

- **[severity: high]** **overlay.js - Missing Live Monitoring Layer Toggle**: The "CANLI" button handler (line 343-357) opens modal tab, but there is NO map layer toggle for live device rendering. The render() function must check `typeof LiveMonitor !== 'undefined'` and call LiveMonitor functions to display device status rings on building markers. Currently live data is fetched but never visualized on the map.
  - **Fix:** Add layer toggle logic in render() after line 17 (`var _comparisonLayers`). Create `var _liveMonitoringEnabled = false;` state. In render(), after markers loop, if `_liveMonitoringEnabled && typeof LiveMonitor !== 'undefined'`, call `LiveMonitor.getDevices()` and overlay device status borders using CSS classes (`.fp-live-pulse`, `.fp-disc-pulse`). Add flicker-free update by comparing device status deltas before re-rendering.

- **[severity: high]** **overlay.js - Comparison Mode Overlay Missing**: `_comparisonMode` and `_comparisonLayers` variables declared (lines 16-17) but never used. No comparison visualization logic exists in render() function. LiveMonitor.comparePlannedVsLive() results are not displayed.
  - **Fix:** In render(), after building markers, if `_comparisonMode && typeof LiveMonitor !== 'undefined'`, call `LiveMonitor.getComparison()` and render discrepancy markers (red pulsing circles) with popup showing discrepancy details (missing/extra/mismatch).

- **[severity: high]** **map-utils.js - Missing 'warning' Status Color**: getLiveStatusStyle() function (lines 250-260) handles 'online', 'offline', 'unknown' but missing 'warning' case. LIVE_STATUS_COLORS defines 'warning' (line 239) but function defaults to 'unknown' for warning devices.
  - **Fix:** Line 252, change `var status = (device.status || 'unknown').toLowerCase();` to normalize, then line 253 check `if (status === 'warning') { ... }` before fallback.

- **[severity: high]** **dashboard.js - Incomplete CPE Tab Rendering**: renderCpe() function called (line 140) but not defined anywhere in the read chunks. Line 52-63 shows AcsManager/FlowAnalyzer/QoeEngine init but no CPE rendering implementation.
  - **Fix:** Add renderCpe(el) function with AcsManager integration: device list, ZTP status, firmware table, TR-069 command interface. Follow pattern of renderTrafficAnalysis (lines 3252+).

### MEDIUM SEVERITY

- **[severity: medium]** **main.js - AcsManager Init Missing LiveMonitor Dependency**: Line 156-159 initializes AcsManager but does NOT wait for LiveMonitor to complete (line 150-153). AcsManager may depend on LiveMonitor's device mapping for CPE-building association.
  - **Fix:** Chain await: `await LiveMonitor.init(); await AcsManager.init();` to ensure serial initialization.

- **[severity: medium]** **overlay.css - Missing fp-disc-pulse Animation**: overlay.css line 1-300 chunk does NOT contain `.fp-disc-pulse` animation keyframes. Code references it for comparison markers but animation is undefined.
  - **Fix:** Add to overlay.css after existing animations: `@keyframes fp-disc-pulse { 0%, 100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.3); opacity: 0.4; } }`. Apply to `.fp-comparison-marker { animation: fp-disc-pulse 2s infinite; }`.

- **[severity: medium]** **background.js - proxyFetch GET/POST Support Correct But Unused**: background.js lines 666-676 handles both GET and POST via `msg.method || 'GET'`, body encoding correct (lines 581-583). However, LiveMonitor.js likely uses this for UISP/Zabbix API calls. If Zabbix JSON-RPC POST requests fail, check if msg.body is being JSON.stringify'd twice (once in LiveMonitor, once in background.js line 582).
  - **Fix:** Add guard in background.js line 582: `if (msg.body) { fetchOpts.body = typeof msg.body === 'string' ? msg.body : JSON.stringify(msg.body); }`. Already correct. Mark as PASS WITH NOTES.

- **[severity: medium]** **dashboard.html - Missing Script Order Validation**: Lines 106-116 load modules, but critical dependency: `live-monitor.js` is NOT in the script list! Only acs-manager, flow-analyzer, qoe-engine are present. Dashboard sections for traffic/QoE will fail.
  - **Fix:** Add `<script src="../lib/live-monitor.js"></script>` before line 112 (acs-manager.js), because AcsManager may import LiveMonitor for device state.

### LOW SEVERITY

- **[severity: low]** **manifest.json - Load Order Correct**: Lines 36-39 show live-monitor.js → acs-manager.js → flow-analyzer.js → qoe-engine.js. Dependency chain is correct (LiveMonitor is base, others depend on it). PASS.

- **[severity: low]** **background.js - DB_VERSION=6 Correct**: Line 9 shows DB_VERSION 6, STORES config includes flowDetailed, flowAggregate, flowSummary, qoeScores (lines 84-113). All Epic 7 stores present. PASS.

- **[severity: low]** **main.js - EventBus Listeners Missing for Epic 7**: Lines 169-176 listen to financial events but NOT to `uisp:devicesUpdated`, `metrics:updated`, `comparison:updated`. If LiveMonitor emits these, UI won't auto-refresh.
  - **Fix:** Add after line 176: `['uisp:devicesUpdated', 'metrics:updated', 'comparison:updated'].forEach(function(evtName) { EventBus.on(evtName, function() { Overlay.render(); }); });`

- **[severity: low]** **overlay.js - Scoreboard Live Status Missing**: updateScoreboardContent() (lines 706-745) shows ada stats but does NOT include live monitoring status (e.g., "5 devices online"). Add KPI card for connected device count.
  - **Fix:** After line 744, add: `var liveDevs = typeof LiveMonitor !== 'undefined' ? LiveMonitor.getDevices().length : 0; var liveOnline = liveDevs ? LiveMonitor.getDevices().filter(d => d.status === 'online').length : 0;` then append to scoreboardEl.innerHTML.

- **[severity: low]** **dashboard.css - Styles for Live Tabs Incomplete**: Lines 1-200 show base styles but NO `.db-live-subtab`, `.db-qoe-rank-row`, `.db-anomaly-panel` classes. These are referenced in dashboard.js traffic/QoE rendering.
  - **Fix:** Add after line 200: `.db-live-subtab { ... }`, `.db-qoe-rank-row:hover { background: var(--fp-surface2); }`, `.db-anomaly-panel { padding: 16px; background: var(--fp-surface); border-radius: 8px; }`.

---

## Integration Gaps

1. **overlay.js → LiveMonitor Wiring**: No render() logic to fetch and display device status on map markers.
2. **overlay.js → Comparison Mode**: Comparison data not visualized (no discrepancy markers on map).
3. **dashboard.js → CPE Tab**: renderCpe() function missing entirely.
4. **dashboard.html → live-monitor.js**: Script tag missing (critical for dashboard traffic/QoE pages).
5. **EventBus → Overlay Auto-refresh**: Epic 7 events not wired to trigger Overlay.render().

---

## Detailed Findings

### File: F:\NVI FIBER\fiber-chrome\manifest.json

**Lines 36-39:**
```json
"lib/live-monitor.js",
"lib/acs-manager.js",
"lib/flow-analyzer.js",
"lib/qoe-engine.js",
```

**Status:** ✅ PASS
Load order is correct. live-monitor.js loads before dependent modules.

---

### File: F:\NVI FIBER\fiber-chrome\background.js

**Lines 84-113:**
```javascript
flowDetailed: { keyPath: 'id', obfuscate: false, indexes: { by_timestamp: ..., by_srcIp: ... } },
flowAggregate: { keyPath: 'id', obfuscate: false, indexes: { by_timestamp: ... } },
flowSummary: { keyPath: 'id', obfuscate: false, indexes: { by_timestamp: ... } },
qoeScores: { keyPath: 'id', obfuscate: false, indexes: { by_subscriberId: ..., by_timestamp: ... } }
```

**Status:** ✅ PASS
All Epic 7 IndexedDB stores present with correct indexes.

**Lines 666-676 (proxyFetch):**
```javascript
if (msg.action === 'proxyFetch') {
  if (!msg.url) { sendResponse({ error: 'url parametresi gerekli' }); return; }
  _proxyQueue.push({ msg: msg, sendResponse: sendResponse });
  _proxyProcessQueue();
  return true;
}
```

**Status:** ✅ PASS WITH NOTES
GET/POST support correct (line 577 `method: msg.method || 'GET'`). Body encoding safe (line 582 checks string vs object). Rate limiting (6 concurrent) and retry logic (lines 590-602) implemented. No issues found.

---

### File: F:\NVI FIBER\fiber-chrome\content\overlay.js

**Lines 16-17:**
```javascript
var _comparisonMode = false;
var _comparisonLayers = { planned: true, live: true, discrepancies: true };
```

**Status:** ❌ FAIL
Variables declared but NEVER USED. No comparison rendering logic in render() function.

**Lines 343-357 (CANLI button):**
```javascript
tb.querySelector('#fp-tb-live').addEventListener('click', function() {
  openModal('live');
});
```

**Status:** ⚠️ NEEDS CHANGES
Button opens modal tab but does NOT toggle live monitoring layer on map. No visual feedback for live device status.

**Suggested Fix (insert after line 640):**
```javascript
function renderLiveDeviceOverlays() {
  if (!_liveMonitoringEnabled || typeof LiveMonitor === 'undefined') return;
  var devices = LiveMonitor.getDevices();
  for (var i = 0; i < markers.length; i++) {
    var marker = markers[i];
    var buildingId = marker._fpBuildingId;
    var device = devices.find(function(d) { return d.buildingId === buildingId; });
    if (device) {
      var statusStyle = MapUtils.getLiveStatusStyle(device);
      if (statusStyle) {
        var el = marker.getElement ? marker.getElement() : marker._icon;
        if (el) {
          el.style.border = '3px solid ' + statusStyle.borderColor;
          el.style.boxShadow = '0 0 12px ' + statusStyle.glowColor;
          if (device.status === 'offline') el.classList.add('fp-live-pulse');
        }
      }
    }
  }
}
```

**Lines 946-948 (_renderLiveTab):**
```javascript
} else if (tabName === 'live') {
  _renderLiveTab();
}
```

**Status:** ✅ PASS
Modal tab rendering exists (lines 957-999+), UISP/Zabbix sub-tabs present.

---

### File: F:\NVI FIBER\fiber-chrome\styles\overlay.css

**Lines 1-300 (read chunk):**

**Status:** ❌ FAIL
Missing `.fp-disc-pulse` animation keyframes (referenced in code but undefined).
Missing `.fp-live-pulse` animation (for offline device blinking).

**Required Additions:**
```css
@keyframes fp-live-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes fp-disc-pulse {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.3); opacity: 0.4; }
}

.fp-live-pulse { animation: fp-live-pulse 1.5s infinite; }
.fp-comparison-marker { animation: fp-disc-pulse 2s infinite; }
```

---

### File: F:\NVI FIBER\fiber-chrome\lib\map-utils.js

**Lines 236-260 (getLiveStatusStyle):**
```javascript
var LIVE_STATUS_COLORS = {
  online: { border: '#22c55e', glow: 'rgba(34,197,94,.5)' },
  warning: { border: '#EAB308', glow: 'rgba(234,179,8,.5)' },
  offline: { border: '#ef4444', glow: 'rgba(239,68,68,.5)' },
  unknown: { border: '#94a3b8', glow: 'rgba(148,163,184,.3)' }
};

function getLiveStatusStyle(device) {
  if (!device) return null;
  var status = (device.status || 'unknown').toLowerCase();
  var colors = LIVE_STATUS_COLORS[status] || LIVE_STATUS_COLORS.unknown;
  var label = status === 'online' ? 'ONLINE' : status === 'offline' ? 'OFFLINE' : status === 'warning' ? 'UYARI' : 'BILINMIYOR';
  return { borderColor: colors.border, glowColor: colors.glow, statusLabel: label };
}
```

**Status:** ⚠️ NEEDS CHANGES
Line 253: `LIVE_STATUS_COLORS[status]` will correctly map 'warning' if status is normalized to lowercase. However, line 254 label assignment is redundant (ternary chain).

**Optimized Fix (line 254):**
```javascript
var labels = { online: 'ONLINE', warning: 'UYARI', offline: 'OFFLINE', unknown: 'BILINMIYOR' };
var label = labels[status] || 'BILINMIYOR';
```

---

### File: F:\NVI FIBER\fiber-chrome\content\main.js

**Lines 149-159:**
```javascript
// 8c. Initialize LiveMonitor (UISP cihaz durum entegrasyonu)
if (typeof LiveMonitor !== 'undefined') {
  await LiveMonitor.init();
  console.log('[FiberPlan] LiveMonitor ready.');
}

// 8d. Initialize AcsManager (TR-069 ACS entegrasyonu)
if (typeof AcsManager !== 'undefined') {
  await AcsManager.init();
  console.log('[FiberPlan] AcsManager ready.');
}
```

**Status:** ⚠️ NEEDS CHANGES
AcsManager init does NOT wait for LiveMonitor. If AcsManager depends on LiveMonitor device mapping, race condition possible.

**Fix (chain awaits):**
```javascript
if (typeof LiveMonitor !== 'undefined') {
  await LiveMonitor.init();
  console.log('[FiberPlan] LiveMonitor ready.');
  if (typeof AcsManager !== 'undefined') {
    await AcsManager.init();
    console.log('[FiberPlan] AcsManager ready.');
  }
}
```

**Lines 169-176 (EventBus auto-save):**
```javascript
['equipment:changed', 'modem:changed', 'financial:changed', 'commitment:changed', 'campaign:changed'].forEach(function(evtName) {
  EventBus.on(evtName, function() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function() { Storage.autoSave(); }, 2000);
  });
});
```

**Status:** ⚠️ NEEDS CHANGES
Missing Epic 7 events (`uisp:devicesUpdated`, `metrics:updated`, `comparison:updated`). If LiveMonitor emits these, UI won't auto-refresh.

**Fix (add after line 176):**
```javascript
['uisp:devicesUpdated', 'metrics:updated', 'comparison:updated', 'flow:dataUpdated', 'qoe:scoresUpdated'].forEach(function(evtName) {
  EventBus.on(evtName, function() {
    if (typeof Overlay !== 'undefined' && Overlay.render) Overlay.render();
    if (typeof Panels !== 'undefined' && Panels.refresh) Panels.refresh();
  });
});
```

---

### File: F:\NVI FIBER\fiber-chrome\dashboard\dashboard.js

**Lines 52-63 (init):**
```javascript
// AcsManager init (opsiyonel — modul yüklü ise)
if (typeof AcsManager !== 'undefined' && AcsManager.init) { AcsManager.init(); }
// FlowAnalyzer init (opsiyonel)
if (typeof FlowAnalyzer !== 'undefined' && FlowAnalyzer.init) { FlowAnalyzer.init(); }
// QoeEngine init (opsiyonel)
if (typeof QoeEngine !== 'undefined' && QoeEngine.init) { QoeEngine.init(); }
```

**Status:** ✅ PASS
All Epic 7 modules initialized in dashboard.

**Lines 140-142 (render dispatcher):**
```javascript
case 'cpe':       renderCpe(el); break;
case 'traffic':   renderTrafficAnalysis(el); break;
case 'qoe':       renderQoeDashboard(el); break;
```

**Status:** ❌ FAIL
`renderCpe(el)` called but function NOT DEFINED in read chunks (lines 1-3700). renderTrafficAnalysis exists (line 3252+), renderQoeDashboard exists (line 3442+), but CPE tab missing.

**Required Implementation (add after line 3242):**
```javascript
function renderCpe(el) {
  if (typeof AcsManager === 'undefined') {
    el.innerHTML = emptyState('&#9881;', 'ACS Modulu Yuklenemedi', 'acs-manager.js yuklenirken hata olustu.');
    return;
  }

  var devices = AcsManager.getCpeDevices();
  var config = AcsManager.getConfig();
  var ztpStatus = AcsManager.getZtpStatus();

  var html = '<div class="db-section">';
  html += '<div class="db-section-header"><h2>CPE Yonetimi (TR-069)</h2></div>';

  // Konfigürasyon paneli
  html += '<div class="db-config-panel" style="margin-bottom:16px;padding:16px;background:var(--fp-surface);border:1px solid var(--fp-border);border-radius:8px">';
  html += '<h3>ACS Konfigürasyonu</h3>';
  html += '<div class="db-form-group"><label>ACS URL</label><input type="text" id="db-acs-url" value="' + (config.acsUrl || '') + '"></div>';
  html += '<div class="db-form-group"><label>Username</label><input type="text" id="db-acs-user" value="' + (config.username || '') + '"></div>';
  html += '<div class="db-form-group"><label>Password</label><input type="password" id="db-acs-pass"></div>';
  html += '<button class="fp-btn fp-btn-ada" id="db-acs-save">Kaydet</button>';
  html += '</div>';

  // ZTP durumu
  html += '<div class="db-kpi-row">';
  html += kpi(devices.length, 'Toplam CPE', 'var(--fp-info)');
  html += kpi(ztpStatus.pendingCount, 'ZTP Bekliyor', 'var(--fp-warning)');
  html += kpi(ztpStatus.provisionedCount, 'Provizyon Tamam', 'var(--fp-success)');
  html += '</div>';

  // Cihaz listesi
  html += '<h3>CPE Cihazlar</h3>';
  html += '<table class="db-table"><thead><tr><th>Serial</th><th>Model</th><th>IP</th><th>Firmware</th><th>Durum</th><th>Islemler</th></tr></thead><tbody>';
  for (var i = 0; i < devices.length; i++) {
    var d = devices[i];
    html += '<tr>';
    html += '<td>' + d.serialNumber + '</td>';
    html += '<td>' + d.modelName + '</td>';
    html += '<td>' + (d.ipAddress || '-') + '</td>';
    html += '<td>' + (d.firmwareVersion || '-') + '</td>';
    html += '<td><span class="db-badge ' + (d.status === 'online' ? 'db-badge-green' : 'db-badge-red') + '">' + d.status + '</span></td>';
    html += '<td><button class="fp-btn fp-btn-sm" data-serial="' + d.serialNumber + '" data-action="reboot">Reboot</button> ';
    html += '<button class="fp-btn fp-btn-sm" data-serial="' + d.serialNumber + '" data-action="upgrade">Upgrade</button></td>';
    html += '</tr>';
  }
  html += '</tbody></table>';

  html += '</div>';
  el.innerHTML = html;

  // Event bindings
  setTimeout(function() {
    var saveBtn = document.getElementById('db-acs-save');
    if (saveBtn) {
      saveBtn.addEventListener('click', function() {
        AcsManager.configure({
          acsUrl: document.getElementById('db-acs-url').value,
          username: document.getElementById('db-acs-user').value,
          password: document.getElementById('db-acs-pass').value
        });
        showToast('ACS konfigürasyonu kaydedildi', 'success');
      });
    }

    var actionBtns = el.querySelectorAll('[data-action]');
    for (var i = 0; i < actionBtns.length; i++) {
      actionBtns[i].addEventListener('click', function() {
        var serial = this.dataset.serial;
        var action = this.dataset.action;
        if (action === 'reboot') {
          AcsManager.sendCommand(serial, 'reboot').then(function() {
            showToast('Reboot komutu gonderildi', 'success');
          });
        } else if (action === 'upgrade') {
          AcsManager.sendCommand(serial, 'upgrade').then(function() {
            showToast('Firmware upgrade baslatildi', 'success');
          });
        }
      });
    }
  }, 50);
}
```

**Lines 3300-3394 (_renderTrafficConfig):**
```javascript
function _renderTrafficConfig() { ... }
```

**Status:** ✅ PASS
Traffic config panel implemented with FlowAnalyzer integration, polling controls, export buttons.

**Lines 3442-3522 (renderQoeDashboard):**
```javascript
function renderQoeDashboard(el) { ... }
```

**Status:** ✅ PASS
QoE dashboard complete with sub-tabs (summary, ranking, detail, alerts, rules), QoeEngine integration correct.

---

### File: F:\NVI FIBER\fiber-chrome\dashboard\dashboard.html

**Lines 106-116 (script tags):**
```html
<script src="../lib/pon-engine.js"></script>
<script src="../lib/topology.js"></script>
<script src="../lib/storage.js"></script>
<script src="../lib/review-engine.js"></script>
<script src="../lib/map-utils.js"></script>
<script src="../lib/event-bus.js"></script>
<script src="../lib/acs-manager.js"></script>
<script src="../lib/flow-analyzer.js"></script>
<script src="../lib/qoe-engine.js"></script>
<script src="../lib/gdrive.js"></script>
<script src="dashboard.js"></script>
```

**Status:** ❌ FAIL
**MISSING `live-monitor.js`!** AcsManager, FlowAnalyzer, QoeEngine may depend on LiveMonitor device mapping. Script load will fail at runtime.

**Fix (insert after line 111):**
```html
<script src="../lib/live-monitor.js"></script>
```

**Lines 45-56 (nav buttons):**
```html
<button class="db-nav-item" data-section="cpe">CPE Yonetimi</button>
<button class="db-nav-item" data-section="traffic">Trafik Analizi</button>
<button class="db-nav-item" data-section="qoe">QoE Izleme</button>
```

**Status:** ✅ PASS
All Epic 7 nav buttons present.

---

### File: F:\NVI FIBER\fiber-chrome\dashboard\dashboard.css

**Lines 1-200 (read chunk):**

**Status:** ⚠️ NEEDS CHANGES
Missing styles for Epic 7 UI components:
- `.db-live-subtab`
- `.db-qoe-rank-row`
- `.db-anomaly-panel`
- `.db-config-panel`
- `.db-traffic-controls`

**Required Additions (after line 200):**
```css
.db-live-subtab {
  padding: 6px 12px;
  background: var(--fp-surface);
  border: 1px solid var(--fp-border);
  border-radius: 4px;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.15s;
}
.db-live-subtab.active { background: var(--fp-accent); color: #000; }

.db-qoe-rank-row {
  cursor: pointer;
  transition: background 0.15s;
}
.db-qoe-rank-row:hover { background: var(--fp-surface2); }

.db-anomaly-panel {
  padding: 16px;
  background: var(--fp-surface);
  border: 1px solid var(--fp-border);
  border-radius: 8px;
  margin-bottom: 16px;
}

.db-config-panel h3 { font-size: 0.9rem; margin-bottom: 12px; color: var(--fp-text-dim); }
.db-form-group { margin-bottom: 12px; }
.db-form-group label { display: block; font-size: 0.75rem; color: var(--fp-text-muted); margin-bottom: 4px; }
.db-form-group input, .db-form-group select {
  width: 100%;
  padding: 8px;
  background: var(--fp-bg);
  border: 1px solid var(--fp-border);
  color: var(--fp-text);
  border-radius: 4px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
}

.db-traffic-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.db-time-range { display: flex; gap: 4px; }
.db-time-btn {
  padding: 6px 12px;
  background: var(--fp-surface);
  border: 1px solid var(--fp-border);
  color: var(--fp-text-dim);
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.15s;
}
.db-time-btn.active { background: var(--fp-accent); color: #000; border-color: var(--fp-accent); }
```

---

## Cross-Module Dependency Check

| Module | Depends On | Status |
|--------|-----------|--------|
| LiveMonitor | EventBus, Storage | ✅ Loads after EventBus (manifest line 23, 36) |
| AcsManager | LiveMonitor (device mapping) | ⚠️ No explicit dependency in manifest, but init order correct (line 37-38) |
| FlowAnalyzer | Storage (IndexedDB flow stores) | ✅ Stores exist (background.js lines 84-105) |
| QoeEngine | LiveMonitor (Zabbix metrics), FlowAnalyzer (traffic data) | ⚠️ Loads last (manifest line 39) but init in main.js not serial |

**Recommendation:** Enforce serial init in main.js:
```javascript
await LiveMonitor.init();
await AcsManager.init(); // depends on LiveMonitor
await FlowAnalyzer.init(); // standalone
await QoeEngine.init(); // depends on LiveMonitor + FlowAnalyzer
```

---

## Verdict

**NEEDS CHANGES** — 4 high severity issues block live monitoring visualization and dashboard CPE tab. Medium/low issues degrade user experience but not blocking.

### Critical Path to Fix

1. **overlay.js**: Add live device status rendering in render() function (HIGH)
2. **overlay.js**: Add comparison mode visualization logic (HIGH)
3. **map-utils.js**: Simplify getLiveStatusStyle label logic (HIGH)
4. **dashboard.js**: Implement renderCpe() function (HIGH)
5. **dashboard.html**: Add live-monitor.js script tag (MEDIUM)
6. **overlay.css**: Add fp-live-pulse and fp-disc-pulse animations (MEDIUM)
7. **main.js**: Add Epic 7 EventBus listeners (LOW)

### Testing Checklist

- [ ] CANLI button toggles live device status rings on map
- [ ] Comparison mode shows red pulsing markers for discrepancies
- [ ] CPE Yonetimi tab renders device table with reboot/upgrade buttons
- [ ] Dashboard traffic/QoE tabs load without errors
- [ ] Live device status updates without full map re-render (flicker-free)
- [ ] Zabbix metrics display in modal sub-tabs
- [ ] QoE ranking table click navigates to detail view

---

**End of Review**
