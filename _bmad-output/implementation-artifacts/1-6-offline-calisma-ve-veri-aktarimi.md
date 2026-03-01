# Story 1.6: Offline Calisma ve Veri Aktarimi

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a saha muhendisi,
I want internet baglantisi olmadan mevcut verilerimle calisabilmeyi ve verilerimi farkli formatlarda disa aktarabilmeyi,
so that sahada baglantisiz ortamda da planlama yapabilir ve verilerimi raporlama icin paylasabileyim.

## Acceptance Criteria (BDD)

1. **Given** internet baglantisi kesildiginde **When** kullanici extension'i kullandiginda **Then** mevcut IndexedDB verileriyle tam islevsellik saglanmali (NFR21) **And** hesaplama, gorsellestirme ve veri duzenleme islemleri calismaya devam etmeli **And** NVI'dan yeni veri cekme islemleri icin uygun hata mesaji gosterilmeli.

2. **Given** kullanici proje verilerini disa aktarmak istediginde **When** JSON formatini sectiginde **Then** tum proje verileri (adalar, binalar, hesaplamalar) JSON dosyasi olarak indirilmeli.

3. **Given** kullanici proje verilerini disa aktarmak istediginde **When** CSV formatini sectiginde **Then** ada ve bina verileri tablo formatinda CSV dosyasi olarak indirilmeli.

4. **Given** kullanici harita verilerini disa aktarmak istediginde **When** GeoJSON formatini sectiginde **Then** koordinat bazli veriler (bina konumlari, kablo rotalari, ada sinirlari) GeoJSON dosyasi olarak indirilmeli.

5. **Given** herhangi bir formatta veri aktarimi yapildiginda **When** dosya olusturuldugunda **Then** hassas veri uyarisi gosterilmeli (NFR9): "Bu veriler hassas altyapi bilgisi icerir" **And** kullanici uyariyi onayladiktan sonra indirme baslamali.

## Tasks / Subtasks

- [x] Task 1: Offline durum yonetimi ve gorsel gosterge (AC: #1)
  - [x] 1.1 `main.js`'e `navigator.onLine` kontrolu ve `online`/`offline` event listener'lari ekle
  - [x] 1.2 Offline durumda toolbar'da gorsel gosterge goster (kirmizi nokta + "CEVRIMDISI" yazisi)
  - [x] 1.3 Online'a donuldugunde gostergeyi kaldir ve bilgilendirme mesaji goster
  - [x] 1.4 EventBus entegrasyonu: `connectivity:offline` ve `connectivity:online` event'leri emit et
  - [x] 1.5 Offline durumda NviScraper polling'in NVI'ya istek atmamasini sagla — `onTableDetected` callback'inde NVI DOM taramasi zaten yerel DOM islemleri, dogrudan etkilenmez; ancak eger NVI sayfasi yuklenemezse (sayfa yenileme) kullanici cache'den calisir

- [x] Task 2: NVI islemleri icin offline hata yonetimi (AC: #1)
  - [x] 2.1 `NviScraper.startAutoPolling` callback'inde: tablo bos + offline ise `showNotification('Cevrimdisi mod — NVI\'dan veri cekilemiyor, cache kullaniliyor', 'info')` goster
  - [x] 2.2 `main.js`'teki mevcut offline fallback (satir 58-104) ile entegre et — offline durumda 5s degil hemen NviCache'den yukle
  - [x] 2.3 Koordinat yakalama (`observeVerifyButtons`) offline'da calismaz — uyari mesaji yok, sessiz basarisizlik (NVI harita acilmaz zaten)

- [x] Task 3: Export hassas veri uyari diyalogu (AC: #5)
  - [x] 3.1 `panels.js`'e `showExportConfirmDialog(format, callback)` fonksiyonu ekle
  - [x] 3.2 Dialog icerigi: "⚠ Hassas Veri Uyarisi\n\nBu veriler hassas altyapi bilgisi icerir.\nFiber topoloji, bina konumlari ve ag yapilandirma detaylari bulunmaktadir.\n\nDevam etmek istiyor musunuz?"
  - [x] 3.3 Iki buton: "Indir" (onay) ve "Iptal" (kapat)
  - [x] 3.4 Dialog CSS: `.fp-export-dialog` modal overlay — mevcut `fp-` CSS prefix kurali
  - [x] 3.5 ESC tusu ile de iptal edilebilmeli

- [x] Task 4: Mevcut export handler'larini guncelle (AC: #2, #3, #4, #5)
  - [x] 4.1 `handleExportJSON()` — oncelik: `showExportConfirmDialog('JSON', function() { ... mevcut indirme kodu ... })` seklinde sar
  - [x] 4.2 `handleExportCSV()` — ayni sekilde `showExportConfirmDialog('CSV', ...)` ile sar
  - [x] 4.3 `handleExportGeoJSON()` — ayni sekilde `showExportConfirmDialog('GeoJSON', ...)` ile sar
  - [x] 4.4 EventBus entegrasyonu: basarili indirme sonrasi `export:completed` event'i emit et (format, fileSize, adaCount bilgisi ile)

- [x] Task 5: manifest.json kontrolu
  - [x] 5.1 manifest.json'da DEGISIKLIK YOK — yeni dosya eklenmeyecek, mevcut moduller yeterli

- [x] Task 6: Entegrasyon testleri
  - [x] 6.1 `dashboard/test-offline-export.html` olustur
  - [x] 6.2 Offline durum simülasyonu: `Object.defineProperty(navigator, 'onLine', {value: false})` ile mock
  - [x] 6.3 Export guvenlik dialogu testi: dialog aciliyor, iptal calisiyor, onay sonrasi indirme basliyor
  - [x] 6.4 Offline gosterge testi: offline event → gosterge gorunur, online event → gosterge kaybolur
  - [x] 6.5 EventBus event testi: connectivity:offline, connectivity:online, export:completed event'leri
  - [x] 6.6 Offline fallback hizlandirma testi: offline durumda 5s beklemeden hemen cache'den yukleme

## Dev Notes

### KRITIK: Bu Story'nin Pozisyonu

Story 1.1 (EventBus), 1.2 (IndexedDB Storage), 1.3 (NviCache), 1.4 (CommandManager), 1.5 (Backup) tamamlandi. Bu story mevcut modulleri genisletir:
- **panels.js** (content/panels.js) — Export handler'lari ve guvenlik diyalogu BURAYA eklenir
- **main.js** (content/main.js) — Offline durum yonetimi BURAYA eklenir
- Yeni dosya OLUSTURULMAZ

### KRITIK: Mevcut Export Altyapisi ZATEN VAR

Export fonksiyonlari ve UI zaten calisiyor. Bu story yeni export mekanizmasi OLUSTURMAZ, mevcut sistemi guclendirir:

**topology.js — Export API (DOKUNULMAYACAK):**
```javascript
Topology.exportJSON()  // → JSON.stringify(PROJECT, null, 2)
Topology.exportCSV()   // → UTF-8 BOM + headers + rows
Topology.exportGeoJSON() // → FeatureCollection (buildings, cables, boundaries)
```

**panels.js — Export Handler'lari (GUNCELLENECEK — sadece confirm dialog sarma):**
```javascript
// Satir 1316: handleExportJSON()  — Blob + URL.createObjectURL + a.click
// Satir 1327: handleExportGeoJSON() — ayni pattern
// Satir 1420: handleExportCSV()   — ayni pattern
```

**panels.js — Export Butonlari (DOKUNULMAYACAK):**
```javascript
// Satir 33-35: Toolbar'da 3 buton
'<button class="fp-btn fp-btn-sm" id="fp-btn-export-geojson">GeoJSON</button>' +
'<button class="fp-btn fp-btn-sm" id="fp-btn-export-json">JSON</button>' +
'<button class="fp-btn fp-btn-sm" id="fp-btn-export-csv">CSV</button>' +
```

### KRITIK: Mevcut Offline Fallback ZATEN VAR

`main.js` satir 58-104'te NviCache'den offline fallback mekanizmasi mevcut. Bu story'de yapilacak:
1. Offline durumda 5s timeout'u KISALT — `navigator.onLine === false` ise hemen cache'den yukle
2. Gorsel gosterge ekle
3. EventBus event'leri ekle

**Mevcut offline fallback kodu (main.js:58-104):**
```javascript
// 4b. Offline fallback: if no table data after 5s, try cache
if (typeof NviCache !== 'undefined') {
  setTimeout(function() {
    if (_tableDataReceived) return;
    // ... NviCache.get(adaNo) → onTableDetected(cached.data.buildings)
  }, 5000);
}
```

**Guncelleme stratejisi:** `navigator.onLine === false` kontrolu ekle → offline ise timeout'u 500ms'e dusur (DOM henuz hazir olmamis olabilir, biraz bekle ama 5s kadar bekleme).

### Mevcut Kodda Korunmasi Gerekenler

1. **`Topology` export fonksiyonlari** (`lib/topology.js`):
   - `exportJSON()`, `exportCSV()`, `exportGeoJSON()` → HIC BIRINI DEGISTIRME
   - `getState()`, `loadState()`, `PROJECT` → KORUNUR

2. **`Panels` toolbar HTML** (`content/panels.js`):
   - Export butonlari (satir 33-35) → KORUNUR
   - Event listener'lar (satir 56-58) → KORUNUR
   - `showNotification()` (satir 1136) → KORUNUR, dialog icinden kullanilir

3. **`main.js` init akisi** (content/main.js):
   - Mevcut 14 adimlik init sirasi korunur
   - Offline yonetimi SONUNA eklenir (yeni adim 14)
   - Mevcut offline fallback GUNCELLENIR (timeout kisaltma)

4. **`NviScraper`** → DOKUNULMAZ — zaten yerel DOM taraiyor, offline sorunu yok
5. **`NviCache`** → DOKUNULMAZ — Story 1.3'te tamamlandi
6. **`EventBus`** → DOKUNULMAZ — emit() kullanilir
7. **`Storage`** → DOKUNULMAZ — IndexedDB zaten offline calisiyor
8. **`PonEngine`** → DOKUNULMAZ — tamamen yerel hesaplama, internet gerektirmez
9. **`Overlay`** → DOKUNULMAZ — tile'lar cache'lenmis olabilir, olmayanlar icin Leaflet kendi hata yonetimine sahip

### Onceki Story (1.5) Intelligence

Story 1.5'te ogrenilenler:
- **Mevcut Storage IIFE modulune fonksiyon eklemek kolay** — private fonksiyonlari tanimla + return objesine ekle
- **`_send()` pattern** ile tum IndexedDB islemleri yapilir
- **Code review bulgulari**: EventBus payload wrapping (`events[0].data.data.id`), restore sonrasi UI guncelleme, `Date.now()` tutarliligi
- **Test dosyasi yapisi**: `dashboard/test-*.html` + mock pattern + section bazli testler + assert helper + showSummary
- **EventBus entegrasyonu**: `EventBus.emit('namespace:action', data)` pattern'i
- **`showNotification(text, type)`** kullanimi: `'success'`, `'error'`, `'info'` type'lari

### KRITIK TASARIM KARARI: Offline Gosterge

Toolbar'daki mevcut `<span class="fp-notification" id="fp-status-msg">` notification alani gecici mesajlar icin kullaniliyor (4 sn sonra kaybolur). Offline gostergesi KALICI olmali, bu yuzden AYRI bir element kullanilir:

```javascript
// Toolbar'a offline badge ekleme (init sirasinda)
var toolbar = document.getElementById('fp-toolbar');
var offlineBadge = document.createElement('span');
offlineBadge.id = 'fp-offline-badge';
offlineBadge.className = 'fp-offline-badge';
offlineBadge.textContent = '⚫ CEVRIMDISI';
offlineBadge.style.display = 'none'; // Baslangicta gizli
toolbar.insertBefore(offlineBadge, toolbar.firstChild.nextSibling); // Toolbar basina ekle
```

CSS (overlay.css veya panels.js icinde inline):
```css
.fp-offline-badge {
  background: #DC2626;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  margin-left: 8px;
  animation: fp-pulse 2s infinite;
}
@keyframes fp-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
```

### KRITIK TASARIM KARARI: Export Confirm Dialog

Mimari karar (architecture.md): "Export guvenlik: Sadece uyari dialogu — Basit, etkili; kullanici farkindaliği"

Mevcut kodda `confirm()` zaten kullaniliyor (panels.js:487 — MST reset onay). Ancak bu story icin OZEL dialog kullanilacak (daha bilgilendirici, stile uygun):

```javascript
function showExportConfirmDialog(format, onConfirm) {
  // Mevcut dialog varsa kaldir
  var existing = document.getElementById('fp-export-dialog');
  if (existing) existing.remove();

  var overlay = document.createElement('div');
  overlay.id = 'fp-export-dialog';
  overlay.className = 'fp-export-dialog-overlay';
  overlay.innerHTML =
    '<div class="fp-export-dialog">' +
    '<div class="fp-export-dialog-title">Hassas Veri Uyarisi</div>' +
    '<div class="fp-export-dialog-body">' +
    'Bu veriler hassas altyapi bilgisi icerir.<br>' +
    'Fiber topoloji, bina konumlari ve ag yapilandirma detaylari bulunmaktadir.<br><br>' +
    '<strong>' + format + '</strong> formatinda disa aktarilacak.' +
    '</div>' +
    '<div class="fp-export-dialog-actions">' +
    '<button class="fp-btn fp-btn-sm" id="fp-export-cancel">Iptal</button>' +
    '<button class="fp-btn fp-btn-sm fp-btn-danger" id="fp-export-confirm">Indir</button>' +
    '</div>' +
    '</div>';

  document.body.appendChild(overlay);

  document.getElementById('fp-export-confirm').addEventListener('click', function() {
    overlay.remove();
    onConfirm();
  });

  document.getElementById('fp-export-cancel').addEventListener('click', function() {
    overlay.remove();
  });

  // ESC ile iptal
  var escHandler = function(e) {
    if (e.key === 'Escape') {
      overlay.remove();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);

  // Overlay tikla → iptal
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) overlay.remove();
  });
}
```

### KRITIK: Export Handler Sarma Pattern

Mevcut handler'lar basit ve calisiyorlar. Sadece confirm dialog ile SARILACAK — ic kod DEGISMEYECEK:

```javascript
// ONCE (mevcut):
function handleExportJSON() {
  var blob = new Blob([Topology.exportJSON()], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'ftth-plan-' + Topology.PROJECT.meta.date + '.json';
  a.click();
  URL.revokeObjectURL(url);
  showNotification('JSON indirildi', 'success');
}

// SONRA (guncel):
function handleExportJSON() {
  showExportConfirmDialog('JSON', function() {
    var blob = new Blob([Topology.exportJSON()], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'ftth-plan-' + Topology.PROJECT.meta.date + '.json';
    a.click();
    URL.revokeObjectURL(url);
    showNotification('JSON indirildi', 'success');
    if (typeof EventBus !== 'undefined') {
      EventBus.emit('export:completed', { format: 'json', adaCount: Topology.PROJECT.adas.length });
    }
  });
}
```

Ayni pattern `handleExportCSV()` ve `handleExportGeoJSON()` icin de uygulanir.

### KRITIK: Offline Fallback Hizlandirma

```javascript
// main.js satir 58-104 guncelleme:
// ONCE: setTimeout(function() { ... }, 5000);
// SONRA:
var offlineDelay = navigator.onLine ? 5000 : 500;
setTimeout(function() {
  if (_tableDataReceived) return;
  // ... mevcut cache yukleme kodu ...
}, offlineDelay);
```

### KRITIK: main.js'e Offline Event Listener Ekleme

```javascript
// main.js init blogu icinde, backup timer'dan sonra:

// 14. Offline/Online connectivity monitoring
var offlineBadge = document.createElement('span');
offlineBadge.id = 'fp-offline-badge';
offlineBadge.className = 'fp-offline-badge';
offlineBadge.style.display = navigator.onLine ? 'none' : 'inline-block';
offlineBadge.textContent = 'CEVRIMDISI';
var toolbar = document.getElementById('fp-toolbar');
if (toolbar) {
  var notifSpan = document.getElementById('fp-status-msg');
  if (notifSpan) toolbar.insertBefore(offlineBadge, notifSpan);
}

window.addEventListener('offline', function() {
  offlineBadge.style.display = 'inline-block';
  if (typeof EventBus !== 'undefined') {
    EventBus.emit('connectivity:offline', { timestamp: new Date().toISOString() });
  }
  if (typeof FPDebug !== 'undefined') {
    FPDebug.warn('Main', 'Internet baglantisi kesildi — cevrimdisi mod');
  }
  Panels.showNotification('Cevrimdisi moda gecildi — mevcut verilerle calisabilirsiniz', 'info');
});

window.addEventListener('online', function() {
  offlineBadge.style.display = 'none';
  if (typeof EventBus !== 'undefined') {
    EventBus.emit('connectivity:online', { timestamp: new Date().toISOString() });
  }
  if (typeof FPDebug !== 'undefined') {
    FPDebug.info('Main', 'Internet baglantisi geri geldi');
  }
  Panels.showNotification('Baglanti geri geldi', 'success');
});

// Baslangicta offline ise bildir
if (!navigator.onLine) {
  Panels.showNotification('Cevrimdisi mod aktif — mevcut verilerle calisabilirsiniz', 'info');
  if (typeof EventBus !== 'undefined') {
    EventBus.emit('connectivity:offline', { timestamp: new Date().toISOString() });
  }
}

console.log('[FiberPlan] Connectivity monitoring active.');
```

### Project Structure Notes

```
fiber-chrome/
  content/
    panels.js        ★ GUNCELLENECEK — showExportConfirmDialog + export handler sarma + dialog CSS
    main.js          ★ GUNCELLENECEK — offline event listener + badge + fallback hizlandirma
    scraper.js       DOKUNULMAYACAK
    nvi-cache.js     DOKUNULMAYACAK
    overlay.js       DOKUNULMAYACAK
  lib/
    topology.js      DOKUNULMAYACAK (export fonksiyonlari mevcut)
    storage.js       DOKUNULMAYACAK
    event-bus.js     DOKUNULMAYACAK
    ...
  background.js      DOKUNULMAYACAK
  manifest.json      DOKUNULMAYACAK (degisiklik yok)
  dashboard/
    test-offline-export.html  ★ YENI — offline + export entegrasyon test dosyasi
```

## Architecture Compliance

### IIFE Module Pattern (ZORUNLU)

Yeni modul OLUSTURULMAZ. Mevcut `Panels` IIFE modulune `showExportConfirmDialog()` eklenir ve mevcut export handler'lari guncellenir.

### Manifest.json Yukleme Sirasi

Degisiklik YOK — tum ilgili moduller zaten yuklu:

```json
"js": [
  "lib/event-bus.js",       // EventBus — connectivity event'leri
  "content/nvi-cache.js",   // NviCache — offline fallback
  "content/panels.js",      // ← Export dialog + handler guncelleme
  "content/main.js"         // ← Offline monitoring
]
```

### EventBus Event'leri

```javascript
EventBus.emit('connectivity:offline', { timestamp: '2026-03-01T10:00:00Z' });
EventBus.emit('connectivity:online', { timestamp: '2026-03-01T10:05:00Z' });
EventBus.emit('export:completed', { format: 'json', adaCount: 3 });
EventBus.emit('export:completed', { format: 'csv', adaCount: 3 });
EventBus.emit('export:completed', { format: 'geojson', adaCount: 3 });
```

### Naming Conventions (ZORUNLU)

| Kural | Ornek |
|-------|-------|
| CSS class: `fp-` prefix | `.fp-export-dialog`, `.fp-offline-badge` |
| CSS element ID: `fp-` prefix | `#fp-export-dialog`, `#fp-offline-badge` |
| Private fonksiyon: camelCase | `showExportConfirmDialog()` |
| Event format: `namespace:action` | `connectivity:offline`, `export:completed` |
| Log prefix: `[ModuleName]` | `[Main]`, `[Panels]` |
| Notification type: string | `'success'`, `'error'`, `'info'` |

### Anti-Pattern Uyarilari

1. **Yeni dosya OLUSTURMA** — tum degisiklikler mevcut `panels.js` ve `main.js` icine
2. **Topology export fonksiyonlarini DEGISTIRME** — sadece handler'lari confirm ile sar
3. **NviScraper'a DOKUNMA** — zaten yerel DOM taraiyor
4. **NviCache'e DOKUNMA** — Story 1.3'te tamamlandi
5. **`window.confirm()` KULLANMA** — ozel `showExportConfirmDialog()` kullan (daha bilgilendirici)
6. **Export butonlari veya toolbar HTML'ini DEGISTIRME** — mevcut buton yapisi korunur
7. **Tile cache mekanizmasi EKLEME** — Leaflet kendi tile cache'ine sahip, ek islem gereksiz
8. **ServiceWorker EKLEME** — MV3 zaten service worker kullaniyor (background.js), ayri offline SW gereksiz

### Performance Gereksinimleri

- Export dialog render: < 50ms (basit DOM islemleri)
- Offline badge toggle: < 10ms (display style degisiklik)
- Offline fallback delay: 500ms (offline) vs 5000ms (online)
- Export islemleri: mevcut performans korunur (Topology.exportXXX() < 100ms)

### Test Stratejisi

Test dosyasi: `fiber-chrome/dashboard/test-offline-export.html`

**Test Sections:**

1. **Offline Badge Visibility**: `navigator.onLine` mock → badge visible/hidden
2. **Online/Offline Events**: `window.dispatchEvent(new Event('offline'))` → EventBus event emit
3. **Export Confirm Dialog**: dialog aciliyor, cancel calisiyor, ESC calisiyor
4. **Export Confirm + Download**: onay sonrasi download fonksiyonu cagriliyor
5. **Export EventBus Events**: export sonrasi `export:completed` event emit ediliyor
6. **Offline Fallback Speed**: offline durumda cache yukleme 500ms timeout

**DIKKAT:** Test dosyasi `background.js` OLMADAN calismali. Mock pattern onceki story'lerden (test-backup.html, test-nvi-cache.html) kullanilir.

```javascript
// navigator.onLine mock
Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });

// EventBus event capture icin:
var events = [];
EventBus.on('connectivity:offline', function(data) { events.push({type: 'offline', data: data}); });
EventBus.on('export:completed', function(data) { events.push({type: 'export', data: data}); });
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 1, Story 1.6]
- [Source: _bmad-output/planning-artifacts/architecture.md — Offline calisma (NFR21), Export guvenlik (sadece uyari dialogu)]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Toolbar export butonlari, completion akisi]
- [Source: fiber-chrome/lib/topology.js — exportJSON (satir 560), exportCSV (satir 567), exportGeoJSON (satir 599)]
- [Source: fiber-chrome/content/panels.js — handleExportJSON (satir 1316), handleExportCSV (satir 1420), handleExportGeoJSON (satir 1327), showNotification (satir 1136)]
- [Source: fiber-chrome/content/main.js — Offline fallback (satir 58-104), init blogu]
- [Source: fiber-chrome/manifest.json — Content script yukleme sirasi]
- [Source: CLAUDE.md — Mimari genel bakis, IIFE pattern, EventBus pattern]
- [Source: _bmad-output/implementation-artifacts/1-5-otomatik-yedekleme-ve-geri-yukleme.md — Onceki story intelligence]

## Change Log

- 2026-03-01: Story 1.6 implemented — offline connectivity monitoring, export confirm dialog, export handler wrapping with EventBus, offline fallback speedup, integration tests
- 2026-03-01: Code review fixes — export:completed event'e fileSize eklendi (H2), badge DOM ekleme fallback (M2), test dosyasi: kopya kod notu (H1), offline fallback testi gercek fonksiyon (M1), overlay click testi iyilestirildi (M3), NVI offline bildirim testi eklendi (M4)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

N/A — no runtime debugging needed

### Completion Notes List

- Task 1: Added `fp-offline-badge` element to toolbar (main.js line 203-213), window offline/online event listeners with EventBus emit (215-243), initial offline check (237-243), CSS with pulse animation injected via panels.js
- Task 2: NviScraper callback checks `!navigator.onLine` when no buildings found (main.js line 54-57), offline fallback delay reduced from 5000ms to 500ms when offline (main.js line 64)
- Task 3: `showExportConfirmDialog(format, onConfirm)` function added to panels.js with modal overlay, ESC key handler, overlay click dismiss, styled dark theme dialog
- Task 4: All 3 export handlers (JSON, CSV, GeoJSON) wrapped with `showExportConfirmDialog()` — original download code preserved inside callback. Added `EventBus.emit('export:completed', {format, adaCount, fileSize})` after each successful export
- Task 5: manifest.json verified — no changes needed
- Task 6: Created `dashboard/test-offline-export.html` with 9 test sections covering badge visibility, EventBus connectivity events, export dialog open/cancel/confirm/ESC/overlay-click, export EventBus events (with fileSize), offline fallback delay logic (function-based), NVI offline notification callback logic

### File List

- fiber-chrome/content/main.js (MODIFIED — offline monitoring, fallback speedup, NVI offline notification)
- fiber-chrome/content/panels.js (MODIFIED — showExportConfirmDialog, export handler wrapping, dialog CSS, offline badge CSS)
- fiber-chrome/dashboard/test-offline-export.html (NEW — integration test suite)
- _bmad-output/implementation-artifacts/sprint-status.yaml (MODIFIED — status update)
- _bmad-output/implementation-artifacts/1-6-offline-calisma-ve-veri-aktarimi.md (MODIFIED — task checkboxes, dev agent record)
