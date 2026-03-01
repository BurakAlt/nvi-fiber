# Story 1.5: Otomatik Yedekleme ve Geri Yukleme

Status: done

## Story

As a saha muhendisi,
I want verilerimin otomatik olarak yedeklenmesini ve istedigim yedege geri donebilmeyi,
so that beklenmedik durumlarda (tarayici cokmesi, yanlis islem) verilerimi kaybetmeyeyim.

## Acceptance Criteria (BDD)

1. **Given** extension aktif ve calisiyor oldugunda **When** 10 dakika gectiginde **Then** sistem otomatik olarak IndexedDB'nin tam snapshot'ini backups store'una kaydetmeli (NFR34) **And** yedekleme arka planda sessizce calismali, kullanici is akisini kesmemeli (NFR37).

2. **Given** backups store'unda 6'dan fazla yedek biriktiginde **When** yeni yedek alindiginda **Then** en eski yedek silinmeli ve en fazla son 6 yedek saklanmali (NFR35).

3. **Given** kullanici yedeklerini goruntulemek istediginde **When** yedek listesini actiginda **Then** mevcut yedekler tarih/saat bilgisiyle listelenmeli **And** her yedek icin ada sayisi ve veri boyutu gosterilmeli.

4. **Given** kullanici belirli bir yedege geri donmek istediginde **When** yedegi secip geri yukleme onayladiginda **Then** secilen yedekteki veriler aktif verilerin yerine yuklenmeli (NFR36) **And** geri yukleme basarili oldugunda bilgilendirme mesaji gosterilmeli.

5. **Given** tarayici cokmesi veya beklenmedik kapanis sonrasi **When** extension yeniden baslatiginda **Then** son kaydedilmis durumdan devam edebilmeli (NFR25).

## Tasks / Subtasks

- [x] Task 1: Storage modulu yedekleme API genisletmesi (AC: #1, #2, #3, #4)
  - [x] 1.1 `Storage` modulune yeni fonksiyonlar ekle: `createBackup()`, `listBackups()`, `restoreBackup(backupId)`, `deleteBackup(backupId)`
  - [x] 1.2 `createBackup()` — `Topology.getState()` snapshot'ini `normalizeState()` ile normalize et → backups store'una `{id, timestamp, adaCount, buildingCount, dataSize, snapshot}` olarak yaz
  - [x] 1.3 `createBackup()` icinde MAX_BACKUPS=6 limiti uygula — backup kaydetmeden ONCE backups store'daki kayit sayisini kontrol et, 6'ya esit veya fazlaysa en eskiyi sil (by_timestamp index ile)
  - [x] 1.4 `listBackups()` — backups store'dan tum kayitlari oku, `[{id, timestamp, adaCount, buildingCount, dataSize}]` dondur (snapshot verisi HARIC — listelemede gereksiz, buyuk veri transferini onler)
  - [x] 1.5 `restoreBackup(backupId)` — backupId ile backups store'dan kaydı oku → `denormalizeState(snapshot)` ile Topology formatina cevir → `Topology.loadState(state)` ile yukle → `Topology.recalculateAll()` → UI guncelleme event'i yayinla
  - [x] 1.6 `deleteBackup(backupId)` — backupId ile backups store'dan sil
  - [x] 1.7 EventBus entegrasyonu: `backup:created`, `backup:restored`, `backup:deleted` event'leri emit et
  - [x] 1.8 Error boundary: tum backup islemleri try/catch ile sarili, hata durumunda FPDebug.warn + graceful degradation

- [x] Task 2: Periyodik yedekleme zamanlayicisi (AC: #1, #5)
  - [x] 2.1 `main.js`'te Storage.init() sonrasi `setInterval` ile 10 dk (600000ms) periyodik zamanlayici baslat
  - [x] 2.2 Zamanlayici callback'i: `Storage.createBackup()` cagirir (fire-and-forget Promise chain, hata UI'yi kesmez)
  - [x] 2.3 Zamanlayici referansini sakla (`_backupTimer`) — ileride temizleme icin
  - [x] 2.4 Ilk calistirmada hemen yedek ALMA — 10 dk sonra ilk yedek (kullanici yeni basladiysa gereksiz bos yedek olusmasini onler)

- [x] Task 3: Yedek listesi ve geri yukleme UI (AC: #3, #4)
  - [x] 3.1 Bu story'de KAPSAMLI UI olusturulmaz — sadece `Storage` API'si hazirlaniyor
  - [x] 3.2 Temel erisim noktasi: `window._fpBackups` ile konsol uzerinden erisim (debug amacli)
  - [x] 3.3 UI butonu entegrasyonu sonraki story'lerde yapilir (panels.js)

- [x] Task 4: manifest.json guncelleme
  - [x] 4.1 manifest.json'da DEGISIKLIK YOK — Storage modulu zaten yuklu, yeni dosya eklenmeyecek

- [x] Task 5: Entegrasyon testleri
  - [x] 5.1 `dashboard/test-backup.html` olustur
  - [x] 5.2 createBackup round-trip testi: backup olustur → listBackups → backup listede var
  - [x] 5.3 restoreBackup testi: backup olustur → Topology'yi degistir → restore → orijinal durum geri geldi
  - [x] 5.4 MAX_BACKUPS limiti testi: 8 backup olustur → listBackups → 6 backup var (en eski 2 silindi)
  - [x] 5.5 deleteBackup testi: backup olustur → sil → listede yok
  - [x] 5.6 Backup metadata testi: adaCount, buildingCount, dataSize, timestamp dogru
  - [x] 5.7 EventBus event testi: backup:created, backup:restored event'leri emit ediliyor

## Dev Notes

### KRITIK: Bu Story'nin Pozisyonu

Story 1.1 (EventBus), 1.2 (IndexedDB Storage), 1.3 (NviCache), 1.4 (CommandManager) tamamlandi. Bu story mevcut Storage modulunu genisletir:
- **Storage** (lib/storage.js) — Yedekleme fonksiyonlari BURAYA eklenir (yeni dosya OLUSTURULMAZ)
- **background.js** — IndexedDB backups store ZATEN mevcut, dokunulmaz
- **main.js** — Periyodik zamanlayici BURAYA eklenir

### KRITIK: `backups` Store Zaten Mevcut

`background.js` icerisinde `backups` store tanimli:
```javascript
backups: {
    keyPath: 'id',
    obfuscate: true,
    indexes: {
        by_timestamp: { field: 'timestamp', unique: false }
    }
}
```

**BACKGROUND.JS'YE DOKUNMA!** Store zaten var. Tum islemler mevcut `_send()` pattern'i ile yapilir.

### Mevcut Kodda Korunmasi Gerekenler

1. **`Storage` modulunun mevcut API'si** (`lib/storage.js`, ~473 satir):
   - `init()`, `save()`, `load()`, `autoSave()`, `autoLoad()`, `listProjects()`, `deleteProject()`, `saveCatalog()`, `loadCatalog()` → HIC BIRINI DEGISTIRME
   - `normalizeState()`, `denormalizeState()` — yedekleme icin kullanilacak, DEGISTIRME
   - `_send()` helper — yedekleme islemleri de bunu kullanir

2. **`background.js` IndexedDB handler'lari** — DOKUNMA
   - `db:put`, `db:get`, `db:getAll`, `db:delete`, `db:count`, `db:putBatch`, `db:loadAll`, `db:deleteBatch`
   - `db:getByIndex` — backups store'daki `by_timestamp` index ile sorgulama icin

3. **`main.js`** (`content/main.js`):
   - Mevcut init akisi korunur
   - Zamanlayici mevcut autoSave mekanizmasindan SONRA eklenir
   - `fiberplan-change` event listener ve autoSave debounce KORUNUR

4. **`Topology` modulu** — `getState()` ve `loadState()` API'si kullanilir, DEGISTIRME

5. **`EventBus` modulu** — `emit()` kullanilir, DEGISTIRME

### Onceki Story (1.4) Intelligence

Story 1.4'te ogrenilenler:
- **IIFE module pattern** ve mevcut `Storage` modulu icine fonksiyon eklemek kolay — sadece private fonksiyonlari tanimla + return objesine ekle
- **`_send()` pattern** ile tum IndexedDB islemleri yapilir — `_send('db:put', {...})`, `_send('db:getAll', {...})` vb.
- **Code review bulgulari**: API signature uyumsuzlugu (ada object vs adaId), deep copy ile ID koruma, partial failure rollback — **Topology API signature'larini MUTLAKA dogrula**
- **Test dosyasi yapisi**: `dashboard/test-*.html` + mock PonEngine + section bazli testler + assert helper + showSummary
- **EventBus entegrasyonu**: `EventBus.emit('namespace:action', data)` pattern'i

### KRITIK TASARIM KARARI: Backup Veri Yapisi

Her backup kaydinin yapisi:

```javascript
{
  id: 'backup_' + Date.now().toString(36),    // Benzersiz ID (keyPath)
  timestamp: new Date().toISOString(),          // ISO string (by_timestamp index)
  adaCount: 3,                                   // Metadata: kac ada var
  buildingCount: 45,                             // Metadata: kac bina var
  dataSize: 12345,                               // Metadata: JSON.stringify boyutu (byte)
  snapshot: {                                     // normalizeState() ciktisi
    adas: [...],
    buildings: [...],
    calculations: [...],
    settings: [...]
  }
}
```

**DIKKAT: `listBackups()` fonksiyonu snapshot verisi DONMEMELI!** Snapshot cok buyuk olabilir (onlarca KB). `db:getAll` ile tum backup'lari ceker ama donuste `snapshot` alanini strip eder. Geri yukleme icin `db:get` ile tek backup okunur.

### KRITIK: Yedekleme Akisi

```
setInterval (10 dk)
  → Storage.createBackup()
    → Topology.getState() — mevcut proje durumu
    → normalizeState(state) — store formatina donustur
    → JSON.stringify ile dataSize hesapla
    → _send('db:count', {store: 'backups'}) — mevcut backup sayisi
    → count >= MAX_BACKUPS ise:
        → _send('db:getAll', {store: 'backups'}) — tum backup'lari al
        → timestamp'e gore sirala, en eski(ler)i bul
        → _send('db:delete', {store: 'backups', key: oldestId})
    → _send('db:put', {store: 'backups', record: backupRecord})
    → EventBus.emit('backup:created', {id, timestamp, adaCount})
```

### KRITIK: Geri Yukleme Akisi

```
Storage.restoreBackup(backupId)
  → _send('db:get', {store: 'backups', key: backupId})
  → backup.snapshot alinir
  → denormalizeState(snapshot) — Topology formatina cevir
  → Topology.loadState(restoredState)
  → Topology.recalculateAll()
  → CommandManager.clear() — undo/redo stack'i temizle (eski islemler gecersiz)
  → EventBus.emit('backup:restored', {id, timestamp, adaCount})
```

**DIKKAT:** Geri yukleme sonrasi `CommandManager.clear()` cagirilmali cunku undo stack'teki komutlar artik gecersiz duruma isaret eder.

### KRITIK: listBackups'ta Snapshot Strip Etme

```javascript
function listBackups() {
  return _send('db:getAll', { store: 'backups' }).then(function(result) {
    if (!result || !result.data) return [];
    var backups = result.data;
    // Strip snapshot to reduce memory/transfer — only metadata returned
    return backups.map(function(b) {
      return {
        id: b.id,
        timestamp: b.timestamp,
        adaCount: b.adaCount || 0,
        buildingCount: b.buildingCount || 0,
        dataSize: b.dataSize || 0
      };
    }).sort(function(a, b) {
      return b.timestamp.localeCompare(a.timestamp); // En yeni en ustte
    });
  });
}
```

### KRITIK: Trim Stratejisi (MAX_BACKUPS=6)

`createBackup()` icinde, yeni backup YAZMADAN ONCE eski backup'lari temizle:

```javascript
var MAX_BACKUPS = 6;
// Count kontrolu
_send('db:count', {store: 'backups'}).then(function(result) {
  var count = result.count || 0;
  if (count >= MAX_BACKUPS) {
    // En eski backup'lari sil (count - MAX_BACKUPS + 1 tane)
    return _send('db:getAll', {store: 'backups'}).then(function(allResult) {
      var sorted = (allResult.data || []).sort(function(a, b) {
        return a.timestamp.localeCompare(b.timestamp);
      });
      var deleteCount = count - MAX_BACKUPS + 1;
      var deletePromises = [];
      for (var i = 0; i < deleteCount && i < sorted.length; i++) {
        deletePromises.push(_send('db:delete', {store: 'backups', key: sorted[i].id}));
      }
      return Promise.all(deletePromises);
    });
  }
}).then(function() {
  // Yeni backup'i yaz
  return _send('db:put', {store: 'backups', record: backupRecord});
});
```

### Project Structure Notes

```
fiber-chrome/
  lib/
    storage.js       ★ GUNCELLENECEK — createBackup, listBackups, restoreBackup, deleteBackup eklenir
    ...
  content/
    main.js          ★ GUNCELLENECEK — setInterval zamanlayici eklenir
    ...
  background.js      DOKUNULMAYACAK (backups store zaten var)
  manifest.json      DOKUNULMAYACAK (degisiklik yok)
  dashboard/
    test-backup.html  ★ YENI — yedekleme entegrasyon test dosyasi
```

## Architecture Compliance

### IIFE Module Pattern (ZORUNLU)

Mevcut `Storage` IIFE modulune fonksiyon eklenir — yeni IIFE OLUSTURULMAZ:

```javascript
const Storage = (() => {
  'use strict';

  var MAX_BACKUPS = 6;

  // ... mevcut fonksiyonlar ...

  // ─── BACKUP OPERATIONS ──────────────────────────────────

  function createBackup() { ... }
  function listBackups() { ... }
  function restoreBackup(backupId) { ... }
  function deleteBackup(backupId) { ... }

  return {
    // mevcut API korunur
    init: init,
    save: save,
    load: load,
    autoSave: autoSave,
    autoLoad: autoLoad,
    // ... diger mevcut fonksiyonlar ...
    // Yeni backup API
    createBackup: createBackup,
    listBackups: listBackups,
    restoreBackup: restoreBackup,
    deleteBackup: deleteBackup
  };
})();
```

### Manifest.json Yukleme Sirasi

Degisiklik YOK — Storage zaten yuklu:

```json
"js": [
  "lib/leaflet.js",
  "lib/debug.js",
  "lib/ws-bridge.js",
  "lib/event-bus.js",
  "lib/pon-engine.js",
  "lib/topology.js",
  "lib/storage.js",            // ← Zaten burada, backup fonksiyonlari buraya eklenir
  "lib/command-manager.js",
  "lib/map-utils.js",
  ...
]
```

### EventBus Event'leri

```javascript
EventBus.emit('backup:created', { id: 'backup_xyz', timestamp: '...', adaCount: 3 });
EventBus.emit('backup:restored', { id: 'backup_xyz', timestamp: '...', adaCount: 3 });
EventBus.emit('backup:deleted', { id: 'backup_xyz' });
```

### main.js Zamanlayici Ekleme Noktasi

```javascript
// main.js init blogu icinde, Storage.init() sonrasi, autoSave oncesi veya sonrasinda:

// 11. Periodic backup timer (10 min interval)
var _backupTimer = setInterval(function() {
  Storage.createBackup().catch(function(err) {
    if (typeof FPDebug !== 'undefined') {
      FPDebug.warn('Main', 'Auto-backup failed', { error: err.message });
    }
  });
}, 600000); // 10 dakika
console.log('[FiberPlan] Auto-backup active (10 min interval).');
```

### Naming Conventions (ZORUNLU)

| Kural | Ornek |
|-------|-------|
| Private degisken: `_` prefix veya `var` | `var MAX_BACKUPS = 6;` |
| Public fonksiyon: camelCase | `createBackup()`, `listBackups()` |
| Event format: `namespace:action` | `backup:created`, `backup:restored` |
| Backup ID: `backup_` + timestamp base36 | `'backup_' + Date.now().toString(36)` |
| Log prefix: `[Storage]` | `console.error('[Storage] Backup failed:', err)` |
| Tarih format: ISO string | `new Date().toISOString()` |

### Anti-Pattern Uyarilari

1. **Yeni dosya OLUSTURMA** — tum backup fonksiyonlari mevcut `Storage` IIFE icine eklenir
2. **background.js'ye DOKUNMA** — `backups` store zaten var, yeni handler gerekmez
3. **manifest.json'u DEGISTIRME** — yeni script eklenmeyecek
4. **`normalizeState`/`denormalizeState` DEGISTIRME** — olduklari gibi kullan
5. **`listBackups`'ta snapshot DONME** — sadece metadata don, snapshot strip et
6. **Ilk calistirmada hemen backup ALMA** — 10 dk sonra ilk backup, bos/gereksiz backup onlenir
7. **Geri yukleme sonrasi CommandManager.clear() UNUTMA** — undo stack gecersiz olur
8. **Senkron islem BEKLEME** — tum backup islemleri async/Promise, fire-and-forget pattern

### Performance Gereksinimleri

- `createBackup()`: < 500ms (normalizeState + JSON.stringify + IndexedDB write)
- `listBackups()`: < 100ms (getAll + metadata strip)
- `restoreBackup()`: < 500ms (get + denormalize + loadState + recalculate)
- Bellek: MAX_BACKUPS=6, her backup ~50-200KB → ~1.2MB toplam
- Zamanlayici: arka planda, UI thread'i bloklamaz

### Test Stratejisi

Test dosyasi: `fiber-chrome/dashboard/test-backup.html`

**DIKKAT:** Test dosyasi `background.js` OLMADAN calismali. Background.js servis worker'da calisir ve test sayfasindan erisilemez. Bu yuzden `_send()` fonksiyonunu MOCK'lamak gerekir — in-memory obje kullanarak IndexedDB simulasyonu yap.

```javascript
// Mock _send() for tests — replaces chrome.runtime.sendMessage
// In-memory store simulation
var _mockStores = { backups: [] };

// Storage._send override for testing
// Test dosyasinda Storage modulunu yuklemeden once mock'u tanimla
```

**Alternatif yaklaskim:** Test dosyasinda sadece `Storage` public API'sini mock'la ve unit test yap. Veya mevcut test pattern'i gibi gercek modulleri yukle ama `PonEngine` mock'la.

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 1, Story 1.5]
- [Source: _bmad-output/planning-artifacts/architecture.md — Yedekleme karari (Tam snapshot / 10 dk / son 6), IndexedDB store yapisi]
- [Source: fiber-chrome/lib/storage.js — Storage API (normalizeState, denormalizeState, _send pattern)]
- [Source: fiber-chrome/background.js — backups store sema (keyPath: 'id', index: by_timestamp), DB handler'lari]
- [Source: fiber-chrome/content/main.js — init blogu, zamanlayici ekleme noktasi]
- [Source: CLAUDE.md — Mimari genel bakis, Storage bolumu]
- [Source: _bmad-output/implementation-artifacts/1-4-geri-al-ileri-al-undo-redo-sistemi.md — Onceki story intelligence]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

N/A

### Completion Notes List

- Task 1: 4 backup fonksiyonu (createBackup, listBackups, restoreBackup, deleteBackup) mevcut Storage IIFE modulune eklendi. MAX_BACKUPS=6 sabiti ile trim stratejisi uygulandi. Tum fonksiyonlar mevcut `_send()` pattern'ini ve `normalizeState`/`denormalizeState` yardimcilarini kullaniyor.
- Task 2: main.js'e setInterval(600000ms) periyodik zamanlayici eklendi. Fire-and-forget pattern — hata UI'yi bloklamaz. Ilk calistirmada hemen backup alinmaz.
- Task 3: `window._fpBackups` debug erisim noktasi main.js'e eklendi. Konsol uzerinden create/list/restore/delete/stopTimer islemleri yapiabilir.
- Task 4: manifest.json degisiklik gerektirmedi — Storage modulu zaten yuklu.
- Task 5: 12 test section'li test-backup.html olusturuldu. Mock _send() ile IndexedDB simulasyonu. Async test runner ile sequential Promise chain.
- Tum Topology API signature'lari dogrulandi (getState, loadState, recalculateAll).
- restoreBackup sonrasi CommandManager.clear() cagrisi eklendi.
- EventBus entegrasyonu: backup:created, backup:restored, backup:deleted event'leri.

### Senior Developer Review (AI)

**Reviewer:** Claude Opus 4.6 — 2026-03-01
**Verdict:** PASS (6 sorun bulundu, 6 duzeltildi)

| # | Severity | Bulgu | Dosya | Duzeltme |
|---|----------|-------|-------|----------|
| 1 | HIGH | Test section 7: EventBus payload wrapping — `events[0].data.id` undefined, dogru yol `events[0].data.data.id` | test-backup.html:416 | Event data erisimleri `payload.data.xxx` olarak duzeltildi |
| 2 | HIGH | restoreBackup() geri yuklenen state'i ana IndexedDB store'larina kaydetmiyor — restart sonrasi eski state gelir | storage.js:452 | restoreBackup icine `save(Topology.getState())` eklendi |
| 3 | MEDIUM | Restore sonrasi UI guncellenmiyor, backup:restored event'ini dinleyen listener yok | main.js | EventBus.on('backup:restored') listener eklendi: Panels.refresh + Overlay.render + notification |
| 4 | MEDIUM | createBackup'ta Date.now() ve new Date() ayri cagrilarak farkli ms degerleri uretebilir | storage.js:369 | Tek `var now = Date.now()` ile hem id hem timestamp tutarli hale getirildi |
| 5 | MEDIUM | _backupTimer disaridan erisilemez, clearInterval yapilamaz | main.js:178 | `_fpBackups.stopTimer()` metodu eklendi |
| 6 | LOW | Test section 4 MAX_BACKUPS: 5ms delay fragile, ayni ms'te ID collision riski | test-backup.html:337 | Delay 5ms → 20ms'e cikarildi |

### Change Log

| Dosya | Degisiklik |
|-------|-----------|
| lib/storage.js | +4 backup fonksiyonu, MAX_BACKUPS=6, restoreBackup icinde save() ile kalicilik, Date.now() tutarliligi |
| content/main.js | +backup:restored listener (UI refresh + notification), +_fpBackups.stopTimer(), +setInterval 10dk zamanlayici |
| dashboard/test-backup.html | YENI — 12 section, mock IndexedDB, EventBus payload wrapping fix, restore persistence testi |

### File List

- `fiber-chrome/lib/storage.js` — MODIFIED (backup API + review fixes)
- `fiber-chrome/content/main.js` — MODIFIED (debug access + timer + restore listener)
- `fiber-chrome/dashboard/test-backup.html` — NEW (test suite, 12 sections)
