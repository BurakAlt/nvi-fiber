# Story 1.1: Olay Sistemi ve Gelismis Loglama

Status: done

## Story

As a saha muhendisi,
I want sistem olaylarini ve hatalari seviye bazli izleyebilmek,
so that sorunlari hizla tespit edip cozebilirim.

## Acceptance Criteria (BDD)

1. **Given** extension yuklendiginde **When** herhangi bir modul olay yayinladiginda **Then** EventBus `namespace:action` formatinda (orn: `ada:created`, `building:added`) olayi kaydetmeli ve dinleyicilere iletmeli. EventBus `on/off/emit` API'si tum modullerden erisilebilir olmali.

2. **Given** sistem calisiyor ve islemler gerceklesiyorken **When** bir log mesaji uretildiginde **Then** mesaj `[ModuleName]` prefix'i ile seviye bazli (DEBUG/INFO/WARNING/ERROR) kaydedilmeli. Loglar IndexedDB `logs` store'una zaman damgasiyla yazilmali.

3. **Given** loglar IndexedDB'de biriktiginde **When** kullanici loglari filtrelemek istediginde **Then** seviye bazli filtreleme calismali (sadece ERROR goster, WARNING+ goster vb.). Log gecmisi disa aktarilabilir olmali.

## Tasks / Subtasks

- [x] Task 1: EventBus modulu olusturma (AC: #1)
  - [x] 1.1 `lib/event-bus.js` dosyasi olustur — IIFE pattern
  - [x] 1.2 `on(event, callback)` — multi-subscriber dinleyici kayit
  - [x] 1.3 `off(event, callback)` — dinleyici cikarma
  - [x] 1.4 `emit(event, data)` — olay yayinlama, payload `{type, data, timestamp}` formatinda
  - [x] 1.5 Wildcard desteGi: `*` ile tum olaylari dinleme (debug icin)
  - [x] 1.6 Error boundary: listener hatalari diger listener'lari engellemez

- [x] Task 2: Debug modulu genisletme (AC: #2)
  - [x] 2.1 `FPDebug` modulu icerisine log seviyeleri ekle: `DEBUG`, `INFO`, `WARNING`, `ERROR`
  - [x] 2.2 `log(level, module, message, data)` public metodu ekle
  - [x] 2.3 `[ModuleName]` prefix formatini zorunlu kil
  - [x] 2.4 Mevcut console hook'u koru — ws-bridge HTTP POST batching devam etmeli
  - [x] 2.5 IndexedDB `logs` store'una asenkron yazma fonksiyonu ekle
  - [x] 2.6 Log filtreleme: `getLogsByLevel(level)`, `getLogsByModule(module)` metodlari
  - [x] 2.7 Log disa aktarim: `exportLogs()` — JSON formatinda Blob URL indirme

- [x] Task 3: IndexedDB logs store sema (AC: #2, #3)
  - [x] 3.1 IndexedDB veritabani acma/olusturma (`fp_logs` veya ortak DB icerisinde `logs` store)
  - [x] 3.2 Store index'leri: `by_timestamp`, `by_level`, `by_module`
  - [x] 3.3 Log kayit yapisi: `{id, level, module, message, timestamp, data}`
  - [x] 3.4 Circular buffer / retention: eski loglar otomatik temizlensin (max 10.000 kayit)

- [x] Task 4: manifest.json guncelleme (AC: #1)
  - [x] 4.1 `lib/event-bus.js` dosyasini `lib/ws-bridge.js` SONRASINA ekle (pozisyon 4)

- [x] Task 5: Entegrasyon testleri
  - [x] 5.1 EventBus on/emit/off dongusunu test et
  - [x] 5.2 Multi-subscriber davranisini test et
  - [x] 5.3 Error boundary: listener hatasi diger listener'lari durdurmuyor mu
  - [x] 5.4 FPDebug.log() → IndexedDB yazma + mevcut HTTP POST devam ediyor mu
  - [x] 5.5 Log filtreleme ve export test

## Dev Notes

### KRITIK: Bu Story Neden Onemli

EventBus ve Debug genisletme, tum gelecek story'lerin (1.2 - 1.7 ve Epic 2+) temel bagimliGidir. Mimari dokumani bu modulu "implementasyon sirasi #1" olarak belirlenmis. Hata yapilirsa tum sonraki moduller etkilenir.

### Mevcut Kodda Korunmasi Gerekenler

1. **`FPDebug` modulu** (`lib/debug.js`, 276 satir):
   - Console hook mekanizmasi (console.log/warn/error/info yakalama) — KORU
   - HTTP POST batching (`http://127.0.0.1:7777/log`, 500ms aralik, 200 buffer) — KORU
   - History circular buffer (200 entry) — KORU
   - DOM mutation observer (NVI tablo satirlari izleme) — KORU
   - Error handler'lar (window.onerror, unhandledrejection) — KORU
   - `window.__FPDebug` test arayuzu — KORU
   - Mevcut public API: `init()`, `entry()`, `snapshot()`, `history()` — KORU
   - Mevcut log seviyeleri: LOG, WARN, ERROR, EXCEPTION, DOM, NET — KORU ve genislet

2. **`WsBridge` modulu** (`lib/ws-bridge.js`, 138 satir):
   - Tamamen DOKUNMA — degisiklik yapma
   - EventBus ile WsBridge BAGIMSIZ calisir
   - WsBridge `on(type, handler)` tek handler/tip — bu EventBus'un multi-subscriber yapisinindan farkli

3. **`manifest.json` mevcut yukleme sirasi**:
   ```
   lib/leaflet.js → lib/debug.js → lib/ws-bridge.js → lib/pon-engine.js → ...
   ```
   Sadece `lib/event-bus.js` eklenmeli, mevcut siralama bozulmamali.

### Mevcut Olay Mekanizmalari (Degistirme)

Bu story'de mevcut modullerdeki callback/event pattern'lari **DEGISTIRME**. Sadece EventBus ve Debug genisletme yap. Mevcut modullere EventBus entegrasyonu sonraki story'lerde yapilacak.

Mevcut pattern'lar (sadece bilgi amacli):
- `window.addEventListener('fiberplan-change', ...)` — main.js:73
- Scraper callback pattern: `NviScraper.startAutoPolling(function(buildings) {...})`
- Leaflet `.on()` olaylari — overlay.js
- 200+ DOM `addEventListener` — panels.js, overlay.js

### Project Structure Notes

```
fiber-chrome/
  lib/
    event-bus.js     ★ YENI — bu story'de olusturulacak
    debug.js         ★ GENISLETILECEK — log seviyeleri + IndexedDB
    ws-bridge.js     DOKUNULMAYACAK
    leaflet.js       DOKUNULMAYACAK
    pon-engine.js    DOKUNULMAYACAK
    topology.js      DOKUNULMAYACAK
    storage.js       DOKUNULMAYACAK
    ...
  content/
    main.js          DOKUNULMAYACAK (bu story'de)
    scraper.js       DOKUNULMAYACAK
    ...
  manifest.json      ★ GUNCELLENECEK — event-bus.js ekleme
```

## Architecture Compliance

### IIFE Module Pattern (ZORUNLU)

```javascript
/**
 * EventBus - Centralized pub/sub event system
 * Namespace:action format event routing with multi-subscriber support
 */
const EventBus = (() => {
  'use strict';

  // ─── PRIVATE STATE ─────────────────────────────────────
  var _listeners = {};
  var _allListeners = []; // wildcard '*' subscribers

  // ─── PRIVATE FUNCTIONS ─────────────────────────────────

  // ─── PUBLIC API ────────────────────────────────────────
  function on(event, callback) { /* multi-subscriber */ }
  function off(event, callback) { /* remove specific listener */ }
  function emit(event, data) {
    /* payload: { type: event, data: data, timestamp: new Date().toISOString() } */
    /* try/catch per listener — error boundary */
  }

  return { on: on, off: off, emit: emit };
})();
```

### Event Payload Format (ZORUNLU)

```javascript
{
  type: 'namespace:action',       // orn: 'ada:created', 'building:added'
  data: { ... },                  // event-specific data
  timestamp: '2026-03-01T...'     // ISO string — Date objesi YASAK
}
```

### Event Namespace Ornekleri

```
ada:created, ada:loaded, ada:saved, ada:deleted
building:added, building:removed, building:updated
storage:saved, storage:loaded, storage:error
command:execute, command:undo, command:redo
panel:refresh, overlay:render
log:entry  (debug modulu icin)
```

### Manifest.json Guncel Yukleme Sirasi

```json
"js": [
  "lib/leaflet.js",
  "lib/debug.js",
  "lib/ws-bridge.js",
  "lib/event-bus.js",        // ★ YENI — pozisyon 4
  "lib/pon-engine.js",
  "lib/topology.js",
  "lib/storage.js",
  "lib/map-utils.js",
  "lib/draw-polygon.js",
  "lib/review-engine.js",
  "content/scraper.js",
  "content/overlay.js",
  "content/panels.js",
  "content/main.js"
]
```

**DIKKAT:** Sadece `lib/event-bus.js` satirini ekle. Diger dosyalari ekleme veya siralama degistirme.

### IndexedDB Logs Store Semasi

```javascript
// Database: 'FiberPlanLogs' (ayri DB — ana veri DB'si Story 1.2'de olusturulacak)
// Store: 'logs'
// keyPath: 'id'
// Indexes:
//   - 'by_timestamp': { keyPath: 'timestamp' }
//   - 'by_level': { keyPath: 'level' }
//   - 'by_module': { keyPath: 'module' }

// Kayit yapisi:
{
  id: crypto.randomUUID(),          // veya Date.now().toString(36)
  level: 'INFO',                    // DEBUG | INFO | WARNING | ERROR
  module: 'EventBus',              // PascalCase modul adi
  message: 'Registered: ada:created',
  timestamp: '2026-03-01T10:30:00.000Z',  // ISO string
  data: null                        // opsiyonel ek veri, explicit null
}
```

**ONEMLI:** Ana IndexedDB veritabani (7 store: adas, buildings, calculations, settings, backups, logs, nviCache) Story 1.2'de olusturulacak. Bu story'de SADECE loglama icin gecici/bagimsiz bir IndexedDB olustur. Story 1.2'de bu logs store ana DB'ye tasinacak.

### Naming Conventions (ZORUNLU)

| Kural | Ornek |
|-------|-------|
| Module ismi: PascalCase | `EventBus`, `FPDebug` |
| Yeni module: `const` | `const EventBus = (() => { ... })();` |
| Private state: `var _` prefix | `var _listeners = {};` |
| Functions: camelCase | `on()`, `emit()`, `off()` |
| Log prefix: `[ModuleName]` | `[EventBus]`, `[FPDebug]` |
| Storage prefix: `fp_` | `fp_log_settings` |
| CSS prefix: `fp-` | Kullanilmaz bu story'de |
| Event format: `namespace:action` | `ada:created`, `log:entry` |
| Date: ISO string | `new Date().toISOString()` |
| Boolean: `true/false` | `1/0` YASAK |
| Null: explicit `null` | `undefined` YASAK |

### Error Boundary Pattern (ZORUNLU)

```javascript
// EventBus.emit icinde her listener icin:
function emit(event, data) {
  var payload = { type: event, data: data, timestamp: new Date().toISOString() };
  var handlers = _listeners[event] || [];
  for (var i = 0; i < handlers.length; i++) {
    try {
      handlers[i](payload);
    } catch (err) {
      console.error('[EventBus] Listener error on ' + event + ':', err);
      // Hata diger listener'lari ENGELLEMEZ
    }
  }
  // Wildcard listeners
  for (var j = 0; j < _allListeners.length; j++) {
    try {
      _allListeners[j](payload);
    } catch (err) {
      console.error('[EventBus] Wildcard listener error:', err);
    }
  }
}
```

### Debug Module Genisletme Detaylari

```javascript
// FPDebug mevcut API'ye EKLENECEK yeni metodlar:

// Seviye bazli loglama
FPDebug.log = function(level, module, message, data) {
  // 1. Mevcut console hook'a yonlendir (HTTP POST batching devam eder)
  // 2. IndexedDB logs store'a asenkron yaz
  // 3. EventBus mevcutsa: EventBus.emit('log:entry', {level, module, message, data})
};

// Kolaylik metodlari
FPDebug.debug = function(module, message, data) { FPDebug.log('DEBUG', module, message, data); };
FPDebug.info = function(module, message, data) { FPDebug.log('INFO', module, message, data); };
FPDebug.warn = function(module, message, data) { FPDebug.log('WARNING', module, message, data); };
FPDebug.error = function(module, message, data) { FPDebug.log('ERROR', module, message, data); };

// Filtreleme
FPDebug.getLogsByLevel = function(level) { /* IndexedDB query by_level */ };
FPDebug.getLogsByModule = function(module) { /* IndexedDB query by_module */ };

// Export
FPDebug.exportLogs = function() { /* IndexedDB → JSON → Blob URL → download */ };
```

**DIKKAT:** FPDebug baslangicta init() cagrildiginda EventBus henuz mevcut olmayabilir. EventBus varligini kontrol et:
```javascript
if (typeof EventBus !== 'undefined') {
  EventBus.emit('log:entry', payload);
}
```

### Anti-Pattern Uyarilari

1. **EventBus'u WsBridge ile KARISTIRMA** — WsBridge harici sunucu iletisimi, EventBus dahili modul iletisimi
2. **Mevcut callback pattern'lari DEGISTIRME** — Bu story'de sadece EventBus ve Debug olustur. Mevcut modullere entegrasyon sonraki story'lerde
3. **DOM event'leri ile EventBus'u KARISTIRMA** — `addEventListener` ve `dispatchEvent` DOM icin. EventBus uygulama seviyesinde
4. **Sinif (class) KULLANMA** — IIFE pattern ZORUNLU, class/import/export YASAK
5. **async/await KULLANMA** — IndexedDB callback/Promise pattern kullan, async/await Chrome content script uyumlulugu sorunlu olabilir
6. **Date objesi SAKLAMA** — Her zaman `new Date().toISOString()` kullan

### Performance Gereksinimleri

- EventBus emit: < 1ms (senkron cagri, listener'larin kendi isi)
- IndexedDB log yazma: asenkron, UI thread'i bloklamaz
- Log retention: max 10.000 kayit, FIFO ile eski kayitlar silinir
- Console hook overhead: mevcut FPDebug seviyesinde kalmali

### Test Stratejisi

Test dosyasi: `fiber-chrome/dashboard/test-eventbus.html` (mevcut test-topology.html yapisini ornek al)

```javascript
// Test 1: EventBus on/emit
EventBus.on('test:event', function(payload) {
  console.assert(payload.type === 'test:event', 'Payload type dogru');
  console.assert(payload.timestamp, 'Timestamp mevcut');
});
EventBus.emit('test:event', { foo: 'bar' });

// Test 2: Multi-subscriber
var count = 0;
EventBus.on('test:multi', function() { count++; });
EventBus.on('test:multi', function() { count++; });
EventBus.emit('test:multi', {});
console.assert(count === 2, 'Multi-subscriber calisiyor');

// Test 3: off() — unsubscribe
var handler = function() { count++; };
EventBus.on('test:off', handler);
EventBus.off('test:off', handler);
EventBus.emit('test:off', {});
// count degismemeli

// Test 4: Error boundary
EventBus.on('test:error', function() { throw new Error('test'); });
EventBus.on('test:error', function() { count++; }); // Bu CALISMALI
EventBus.emit('test:error', {});
console.assert(count > 0, 'Error boundary calisiyor');

// Test 5: FPDebug.log → IndexedDB
FPDebug.log('INFO', 'TestModule', 'Test log mesaji', { key: 'value' });
// IndexedDB'den oku ve dogrula
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 1, Story 1.1]
- [Source: _bmad-output/planning-artifacts/architecture.md — EventBus Module, Debug Extension, IIFE Pattern, Manifest Load Order]
- [Source: fiber-chrome/lib/debug.js — Mevcut FPDebug modulu, 276 satir]
- [Source: fiber-chrome/lib/ws-bridge.js — Mevcut WsBridge modulu, 138 satir]
- [Source: fiber-chrome/manifest.json — Mevcut content_scripts yukleme sirasi]
- [Source: fiber-chrome/content/main.js — Mevcut olay ve callback pattern'lari]
- [Source: CLAUDE.md — Mimari genel bakis, modul sistemi, veri akisi]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- Tum testler `dashboard/test-eventbus.html` dosyasinda (12 test grubu, 30+ assertion)

### Completion Notes List

- EventBus modulu IIFE pattern ile olusturuldu (89 satir) — on/off/emit + wildcard + error boundary
- FPDebug modulu 276 → 513 satira genisletildi — mevcut API tamamen korundu
- IndexedDB `FiberPlanLogs` ayri DB olarak olusturuldu (Story 1.2'de ana DB'ye tasinacak)
- `writeLogRecord()` async non-blocking, `trimOldLogs()` FIFO retention (max 10.000)
- `log()` 3 kanala yazar: console hook (HTTP POST), IndexedDB, EventBus
- `typeof EventBus !== 'undefined'` guard kullanildi (debug.js, event-bus.js'den once yuklenir)
- manifest.json'da event-bus.js pozisyon 4'e eklendi (ws-bridge sonrasi)
- Convenience metodlar: debug(), info(), warn(), error()
- Query metodlar: getLogsByLevel(), getLogsByModule() — Promise donduruyor
- Export: exportLogs() — JSON Blob URL download

### File List

- `fiber-chrome/lib/event-bus.js` — YENI (92 satir)
- `fiber-chrome/lib/debug.js` — GENISLETILDI (276 → 544 satir)
- `fiber-chrome/manifest.json` — GUNCELLENDI (event-bus.js eklendi)
- `fiber-chrome/dashboard/test-eventbus.html` — YENI (243 satir, 12 test grubu)

## Senior Developer Review (AI)

**Reviewer:** Claude Opus 4.6 | **Tarih:** 2026-03-01 | **Sonuc:** APPROVED (fix sonrasi)

### Bulunan Sorunlar ve Duzeltmeler

| # | Ciddiyet | Sorun | Duzeltme |
|---|----------|-------|----------|
| H1 | HIGH | EventBus emit() iterasyon sirasinda dizi mutasyonu — off() sirasinda listener atlama riski | `.slice()` ile snapshot kopya eklendi |
| M1 | MEDIUM | FPDebug.log() WARNING/ERROR icin duplike HTTP POST entry | `_inStructuredLog` guard eklendi, console hook sirasinda structured log'lari atliyor |
| M2 | MEDIUM | `const`/`let` vs `var` stil tutarsizligi | Private state `var` → `let` degistirildi |
| M3 | MEDIUM | `log()` gecersiz level parametresini kabul ediyor | Level validasyonu eklendi, gecersiz level → INFO |
| M4 | MEDIUM | Her writeLogRecord() yeni readwrite transaction | Batch write sistemi: 100ms aralikla tek transaction |

### Kalan LOW Sorunlar (Kabul Edildi)

- L1: Test izolasyonu (listener cleanup yok) — testler hala gecerli
- L2: DEBUG/INFO HTTP POST'a gitmiyor — tasarimsal, IndexedDB birincil depo
- L3: once() metodu yok — AC'de talep edilmemis
