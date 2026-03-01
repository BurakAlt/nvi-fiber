# Story 1.3: NVI Veri Cache ve Delta Guncelleme

Status: done

## Story

As a saha muhendisi,
I want NVI'dan cekilen ada ve bina verilerinin yerel veritabaninda cache'lenmesini,
so that ayni verileri tekrar tekrar NVI'dan cekmek zorunda kalmayayim ve daha hizli calisabileyim.

## Acceptance Criteria (BDD)

1. **Given** NVI portalinde bir ada ilk kez tarandiginda **When** scraper bina verilerini cektiginde **Then** veriler IndexedDB nviCache store'una kaydedilmeli (ada kodu, bina listesi, BB sayilari, zaman damgasi) **And** sonraki kullanimda once cache'den okunmali.

2. **Given** cache'de mevcut bir ada verisi varken **When** kullanici ayni adayi tekrar actiginda **Then** sistem once cache'deki veriyi yuklemeli **And** delta kontrol ile NVI'daki guncel veriyle karsilastirmali **And** degisiklik varsa cache guncellemeli, yoksa mevcut cache'i kullanmali.

3. **Given** internet baglantisi olmayan bir ortamda **When** kullanici daha once cache'lenmis bir adayi actiginda **Then** cache'deki verilerle tam islevsellik saglanmali.

## Tasks / Subtasks

- [x] Task 1: NviCache modulu olusturma (AC: #1, #2, #3)
  - [x] 1.1 `content/nvi-cache.js` dosyasi olustur — IIFE pattern, `const NviCache = (() => { ... })()`
  - [x] 1.2 `_send(action, params)` helper — background.js'e chrome.runtime.sendMessage (Storage.js'deki pattern'in aynisi)
  - [x] 1.3 `store(adaNo, buildings)` — NVI'dan cekilen bina listesini nviCache store'una yaz
  - [x] 1.4 `get(adaNo)` — cache'den ada verisini oku, yoksa null don
  - [x] 1.5 `has(adaNo)` — ada verisi cache'de var mi kontrol et (hizli, count-based)
  - [x] 1.6 `remove(adaNo)` — belirli ada cache'ini sil
  - [x] 1.7 `clear()` — tum cache'i temizle
  - [x] 1.8 `list()` — cache'deki tum ada numaralarini listele
  - [x] 1.9 EventBus entegrasyonu: `cache:stored`, `cache:hit`, `cache:miss`, `cache:delta-update` event'leri

- [x] Task 2: Delta kontrol sistemi (AC: #2)
  - [x] 2.1 `checkDelta(adaNo, freshBuildings)` — cache'deki veri ile yeni NVI verisini karsilastir
  - [x] 2.2 Delta karsilastirma kriterleri: bina sayisi + toplam BB sayisi + bina isim listesi hash
  - [x] 2.3 Delta sonucu: `{ changed: boolean, added: [], removed: [], bbChanged: [] }`
  - [x] 2.4 Degisiklik varsa cache guncelle + FPDebug.info() ile logla
  - [x] 2.5 Degisiklik yoksa mevcut cache'i kullan, gereksiz yazma yapma

- [x] Task 3: Scraper-Cache entegrasyonu (AC: #1, #2, #3)
  - [x] 3.1 `main.js` icinde `onTableDetected()` callback'ine NviCache entegrasyonu ekle
  - [x] 3.2 Akis: NVI tablo degisiklik algilandi → `NviCache.get(adaNo)` ile cache kontrol → cache varsa `checkDelta()` → degisiklik yoksa cache'den yukle, varsa NVI verisini kullan + cache guncelle
  - [x] 3.3 Ilk kez taranan ada: NVI'dan cek → `NviCache.store(adaNo, buildings)` ile cache'e yaz
  - [x] 3.4 Offline fallback: NVI tablosu bos/erislemez durumda → cache'den oku (varsa)

- [x] Task 4: Cache veri formati ve store semasi (AC: #1)
  - [x] 4.1 nviCache store record yapisi: `{ cacheKey, adaNo, timestamp, data: { buildings, totalBB, buildingCount, hash } }`
  - [x] 4.2 `cacheKey` = `'ada_' + adaNo` (keyPath, unique per ada)
  - [x] 4.3 `data.buildings` = NviScraper.groupByBuilding() ciktisi formatinda (binaNo, name, bb, addr, ...)
  - [x] 4.4 `data.hash` = bina sayisi + BB toplam + bina isimlerinin sorted join'i icin basit hash
  - [x] 4.5 `timestamp` = ISO string, son basarili cekme zamani

- [x] Task 5: manifest.json guncelleme (AC: #1)
  - [x] 5.1 `content/nvi-cache.js` dosyasini `content/scraper.js` SONRASINA ekle (scraper'a bagimli)
  - [x] 5.2 Pozisyon: scraper.js → nvi-cache.js → overlay.js siralamasinda

- [x] Task 6: Entegrasyon testleri
  - [x] 6.1 `dashboard/test-nvi-cache.html` olustur
  - [x] 6.2 store/get round-trip testi (mock bina verisi → cache yaz → oku → dogrula)
  - [x] 6.3 Delta kontrol testi: ayni veri → changed: false; farkli veri → changed: true, added/removed listesi
  - [x] 6.4 Cache miss testi: olmayan ada → null donus
  - [x] 6.5 Cache list testi: birden fazla ada cache'le → list() ile tum ada numaralarini al
  - [x] 6.6 Offline simulasyon testi: cache'de veri var, NVI erisim yok → cache'den basarili okuma

## Dev Notes

### KRITIK: Bu Story'nin Pozisyonu

Story 1.1 (EventBus) ve 1.2 (IndexedDB) tamamlandi. nviCache store'u IndexedDB'de zaten mevcut (background.js tarafindan olusturuldu). Bu story sadece **cache islemlerini yapan content-side modulu** olusturuyor ve **scraper akisina entegre ediyor**.

### Mevcut Kodda Korunmasi Gerekenler

1. **`NviScraper` modulu** (`content/scraper.js`, 535 satir):
   - `startAutoPolling(callback)` — 1s aralikla tablo degisikligi algilar → KORU
   - `groupByBuilding(rows)` — BB satirlarini bina bazinda gruplar → KORU, NviCache bu ciktiyi kullanacak
   - `extractAll()` — tam pipeline: scrapeAllRows → groupByBuilding → groupByAda → KORU
   - Scraper'in kendisini DEGISTIRME — NviCache entegrasyonu main.js uzerinden yapilacak

2. **`main.js` icindeki `onTableDetected()` fonksiyonu** (satir 116-181):
   - Mevcut akis: scraper callback → buildings gelen → ada kontrolu → Topology.addBuilding → PonEngine → render
   - NviCache entegrasyonu BU FONKSIYONA eklenmeli
   - Mevcut islevsellik BOZULMAMALI — cache sadece ek katman

3. **`background.js` nviCache store** (zaten olusturuldu Story 1.2'de):
   - keyPath: `cacheKey`
   - Indexes: `by_adaNo` (unique: false), `by_timestamp` (unique: false)
   - Obfuscation: false (cache verisi sifrelenmez — NVI'dan zaten acik veri)
   - DOKUNMA — store semasi mevcut ve dogru

4. **Storage modulu** (`lib/storage.js`):
   - `_send()` helper pattern — NviCache AYNI pattern'i kullanacak
   - DOKUNMA — NviCache kendi `_send()` helper'ini tanimlar

### Onceki Story (1.2) Intelligence

Story 1.2'de ogrenilenler:
- **Message-passing pattern** calisiyor: `chrome.runtime.sendMessage({ action: 'db:*', ... })` → background.js handler
- **background.js handler'lari**: `db:put`, `db:get`, `db:getAll`, `db:getByIndex`, `db:delete`, `db:clear`, `db:count`, `db:putBatch`, `db:loadAll`
- **nviCache store obfuscate: false** — kayitlar plaintext, encode/decode yok
- **Index kullanimi**: `db:getByIndex` ile `by_adaNo` index'inden ada bazli sorgulama
- **Batch write**: `db:putBatch` ile coklu kayit tek transaction'da
- **Code review bulgulari**: denormalizeState'te fazladan alan temizligi eklendi, try/finally guard, performance test esikleri duzeltildi
- **`_send()` pattern**: Promise donduren, chrome.runtime.lastError kontrol eden helper — ayni pattern NviCache icin kopyalanmali

### Project Structure Notes

```
fiber-chrome/
  content/
    nvi-cache.js     ★ YENI — bu story'de olusturulacak
    scraper.js       DOKUNULMAYACAK
    main.js          ★ GUNCELLENECEK — onTableDetected() icine cache entegrasyonu
    overlay.js       DOKUNULMAYACAK
    panels.js        DOKUNULMAYACAK
  lib/
    storage.js       DOKUNULMAYACAK (_send pattern referans)
    debug.js         DOKUNULMAYACAK (FPDebug.info kullanilacak)
    event-bus.js     DOKUNULMAYACAK (EventBus.emit kullanilacak)
    ...
  background.js      DOKUNULMAYACAK (nviCache store zaten mevcut)
  manifest.json      ★ GUNCELLENECEK — nvi-cache.js ekleme
  dashboard/
    test-nvi-cache.html ★ YENI — entegrasyon test dosyasi
```

## Architecture Compliance

### IIFE Module Pattern (ZORUNLU)

```javascript
/**
 * NviCache - NVI veri cache katmani
 * IndexedDB nviCache store uzerinden ada/bina verilerini cache'ler.
 * background.js ile chrome.runtime.sendMessage uzerinden iletisir.
 */
const NviCache = (() => {
  'use strict';

  // ─── MESSAGE HELPER ────────────────────────────────────
  function _send(action, params) {
    return new Promise(function(resolve, reject) {
      try {
        var msg = { action: action };
        if (params) {
          var keys = Object.keys(params);
          for (var i = 0; i < keys.length; i++) {
            msg[keys[i]] = params[keys[i]];
          }
        }
        chrome.runtime.sendMessage(msg, function(response) {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (response && response.ok === false) {
            reject(new Error(response.error || 'DB operation failed'));
            return;
          }
          resolve(response);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  // ─── CACHE OPERATIONS ──────────────────────────────────

  function _buildCacheKey(adaNo) {
    return 'ada_' + String(adaNo);
  }

  function _buildHash(buildings) {
    // Basit hash: bina sayisi + BB toplam + sorted bina isimleri
    var totalBB = 0;
    var names = [];
    for (var i = 0; i < buildings.length; i++) {
      totalBB += buildings[i].bb || 0;
      names.push(buildings[i].name || '');
    }
    names.sort();
    return buildings.length + ':' + totalBB + ':' + names.join(',');
  }

  function store(adaNo, buildings) { /* ... */ }
  function get(adaNo) { /* ... */ }
  function has(adaNo) { /* ... */ }
  function checkDelta(adaNo, freshBuildings) { /* ... */ }
  function remove(adaNo) { /* ... */ }
  function clear() { /* ... */ }
  function list() { /* ... */ }

  return {
    store: store,
    get: get,
    has: has,
    checkDelta: checkDelta,
    remove: remove,
    clear: clear,
    list: list
  };
})();
```

### nviCache Store Record Formati (ZORUNLU)

```javascript
// nviCache store record:
{
  cacheKey: 'ada_574',              // keyPath — 'ada_' + adaNo
  adaNo: '574',                      // index: by_adaNo
  timestamp: '2026-03-01T10:30:00Z', // index: by_timestamp — son cekme zamani
  data: {
    buildings: [                      // NviScraper.groupByBuilding() ciktisi
      { binaNo: '349214767', binaNoList: ['349214767'], name: 'AKASYA B BLOK',
        addr: '...', ada: '574', parsel: '246', disKapiNo: '8',
        bb: 12, lat: 0, lng: 0, floor: 0, hasElectric: true }
    ],
    buildingCount: 5,                 // hizli delta kontrolu icin
    totalBB: 47,                      // hizli delta kontrolu icin
    hash: '5:47:AKASYA A BLOK,AKASYA B BLOK,...' // tam delta hash
  }
}
```

### main.js onTableDetected() Entegrasyon Akisi (ZORUNLU)

```
NviScraper callback → buildings geldi
  ├─ adaNo = buildings[0].ada
  ├─ NviCache.get(adaNo)
  │   ├─ CACHE HIT:
  │   │   ├─ NviCache.checkDelta(adaNo, buildings)
  │   │   │   ├─ DEGISIKLIK YOK → log "cache hit, no delta" → mevcut akisa DEVAM (cache'den)
  │   │   │   └─ DEGISIKLIK VAR → NviCache.store(adaNo, buildings) → mevcut akisa DEVAM (fresh data)
  │   │   └─ EventBus.emit('cache:hit' / 'cache:delta-update')
  │   └─ CACHE MISS:
  │       ├─ NviCache.store(adaNo, buildings) → mevcut akisa DEVAM
  │       └─ EventBus.emit('cache:miss')
  └─ Mevcut Topology.addBuilding + PonEngine + render akisi AYNEN DEVAM
```

**DIKKAT:** onTableDetected() fonksiyonunun mevcut davranisini BOZMA. Cache sadece ek bir katman — buildings verisi her durumda mevcut akisa girer. Cache'in rolu: (1) gelecekte ayni ada aciliginda hizli veri saglamak, (2) offline durumda fallback sunmak.

### Manifest.json Guncel Yukleme Sirasi

```json
"js": [
  "lib/leaflet.js",
  "lib/debug.js",
  "lib/ws-bridge.js",
  "lib/event-bus.js",
  "lib/pon-engine.js",
  "lib/topology.js",
  "lib/storage.js",
  "lib/map-utils.js",
  "lib/draw-polygon.js",
  "lib/review-engine.js",
  "content/scraper.js",
  "content/nvi-cache.js",        // ★ YENI — scraper sonrasi, overlay oncesi
  "content/overlay.js",
  "content/panels.js",
  "content/main.js"
]
```

**DIKKAT:** Sadece `content/nvi-cache.js` satirini ekle. Diger dosyalari ekleme veya siralama degistirme. NviCache, scraper.js'e bagimli (NviScraper.groupByBuilding referansi icin), bu yuzden scraper SONRASINDA yuklenmeli.

### EventBus Event'leri

```javascript
// NviCache event'leri:
EventBus.emit('cache:stored', { adaNo: '574', buildingCount: 5 });
EventBus.emit('cache:hit', { adaNo: '574', age: 3600000 }); // ms cinsinden cache yasi
EventBus.emit('cache:miss', { adaNo: '574' });
EventBus.emit('cache:delta-update', { adaNo: '574', added: 1, removed: 0, bbChanged: 2 });
```

### Naming Conventions (ZORUNLU)

| Kural | Ornek |
|-------|-------|
| Module ismi: PascalCase | `NviCache` |
| Private fonksiyon: `_` prefix | `_send()`, `_buildCacheKey()`, `_buildHash()` |
| Public fonksiyon: camelCase | `store()`, `get()`, `checkDelta()` |
| Store name: camelCase | `nviCache` |
| Cache key format: `ada_` + adaNo | `ada_574` |
| Event format: `namespace:action` | `cache:stored`, `cache:hit` |
| Date: ISO string | `new Date().toISOString()` |
| Null: explicit `null` | `undefined` YASAK |

### Anti-Pattern Uyarilari

1. **NviScraper'i DEGISTIRME** — Cache entegrasyonu main.js uzerinden, scraper'a dokunma
2. **Sinif (class) KULLANMA** — IIFE pattern ZORUNLU
3. **async/await KULLANMA** — Promise pattern kullan
4. **Cache'i sifreleme** — nviCache store obfuscate: false, NVI verisi zaten acik
5. **Kendi IndexedDB baglantini ACMA** — background.js uzerinden message-passing kullan
6. **Date objesi saklama** — ISO string kullan
7. **Cache'i Storage modulu ile KARISTIRMA** — NviCache bagimsiz, Storage proje verisi icin

### Performance Gereksinimleri

- Cache okuma (get): < 50ms (tek ada, NFR4)
- Cache yazma (store): < 50ms (tek ada)
- Delta kontrol: < 10ms (in-memory karsilastirma, IndexedDB disinda)
- Cache miss → NVI scrape + cache write: toplam < 2s (NFR2 + yazma)

### Test Stratejisi

Test dosyasi: `fiber-chrome/dashboard/test-nvi-cache.html` (mevcut test-storage.html yapisini ornek al)

```javascript
// Mock veri olustur
var mockBuildings = [
  { binaNo: 'BN-001', binaNoList: ['BN-001'], name: 'Test Bina A', addr: 'Cadde 1', ada: '100', parsel: '1', disKapiNo: '5', bb: 8, lat: 0, lng: 0, floor: 3, hasElectric: true },
  { binaNo: 'BN-002', binaNoList: ['BN-002'], name: 'Test Bina B', addr: 'Cadde 2', ada: '100', parsel: '2', disKapiNo: '7', bb: 15, lat: 0, lng: 0, floor: 5, hasElectric: false }
];

// Test 1: store/get round-trip
NviCache.store('100', mockBuildings).then(function() {
  return NviCache.get('100');
}).then(function(cached) {
  console.assert(cached !== null, 'Cache hit');
  console.assert(cached.data.buildingCount === 2, 'Building count dogru');
  console.assert(cached.data.totalBB === 23, 'Total BB dogru');
});

// Test 2: Delta kontrol — ayni veri
NviCache.checkDelta('100', mockBuildings).then(function(result) {
  console.assert(result.changed === false, 'Ayni veri: delta yok');
});

// Test 3: Delta kontrol — farkli veri
var changedBuildings = mockBuildings.concat([
  { binaNo: 'BN-003', name: 'Yeni Bina', bb: 5, ada: '100' }
]);
NviCache.checkDelta('100', changedBuildings).then(function(result) {
  console.assert(result.changed === true, 'Farkli veri: delta var');
  console.assert(result.added.length === 1, 'Bir bina eklenmis');
});
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 1, Story 1.3]
- [Source: _bmad-output/planning-artifacts/architecture.md — NVI Cache karar, veri akisi, dosya yapisi]
- [Source: fiber-chrome/content/scraper.js — NviScraper modulu, groupByBuilding, startAutoPolling]
- [Source: fiber-chrome/content/main.js — onTableDetected() satir 116-181]
- [Source: fiber-chrome/background.js — nviCache store STORES config (obfuscate: false)]
- [Source: fiber-chrome/lib/storage.js — _send() message-passing pattern]
- [Source: fiber-chrome/manifest.json — content_scripts yukleme sirasi]
- [Source: CLAUDE.md — Mimari genel bakis, modul sistemi, veri akisi]
- [Source: _bmad-output/implementation-artifacts/1-2-indexeddb-veri-katmani-ve-migrasyon.md — Onceki story intelligence]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

N/A — no runtime debug issues encountered during implementation.

### Completion Notes List

- **Task 1-4**: Created `content/nvi-cache.js` (228 lines) — IIFE module with 7 public methods (store, get, has, checkDelta, remove, clear, list), `_send()` helper matching Storage.js pattern, `_buildCacheKey()` and `_buildHash()` helpers, full EventBus integration (cache:stored, cache:hit, cache:miss, cache:delta-update)
- **Task 2**: Delta check implemented as single entry point — `checkDelta()` internally fetches cached data, emits hit/miss events, compares via hash first (fast path), then detailed diff (building-by-building) for added/removed/bbChanged
- **Task 3**: main.js integration — non-blocking cache operations in `onTableDetected()` via fire-and-forget promise chain; `_tableDataReceived` flag guards offline fallback; 5-second timeout loads first cached ada if no NVI data arrives
- **Task 5**: manifest.json updated — `content/nvi-cache.js` placed after `content/scraper.js`, before `content/overlay.js`
- **Task 6**: 9-section test suite (55+ assertions) covering store/get round-trip, delta same/changed, cache miss, list, has/remove/clear, offline simulation, performance (<50ms thresholds), EventBus event verification

### Implementation Plan

1. NviCache modulu: IIFE pattern, `_send()` helper (Storage.js pattern clone), 7 public API methods
2. Delta: `_buildHash()` ile hizli karsilastirma (count:totalBB:sortedNames), eser yoksa detayli diff
3. main.js: `onTableDetected()` icinde non-blocking NviCache.checkDelta() + store(); 5s offline fallback timer
4. manifest.json: scraper.js → nvi-cache.js → overlay.js sirasi
5. Test: test-nvi-cache.html, 9 test grubu, EventBus event dogrulamasi dahil

### File List

- **NEW** `fiber-chrome/content/nvi-cache.js` — NviCache IIFE module (228 lines)
- **MODIFIED** `fiber-chrome/content/main.js` — NviCache entegrasyonu (onTableDetected + offline fallback)
- **MODIFIED** `fiber-chrome/manifest.json` — nvi-cache.js content_scripts'e eklendi
- **NEW** `fiber-chrome/dashboard/test-nvi-cache.html` — Entegrasyon test suite (9 bolum, 55+ assertion)

## Senior Developer Review (AI)

### Review Date
2026-03-01

### Reviewer Model
Claude Opus 4.6

### Verdict
**PASS** (after fixes)

### Findings

| ID | Severity | Description | Status |
|----|----------|-------------|--------|
| H1 | HIGH | `store()` serializes `rows[]` containing `rowElement` DOM references — causes DataCloneError in `chrome.runtime.sendMessage` structured clone | **FIXED** — Added stripping loop to remove `rows` and `rowElement` keys before creating cache record |
| H2 | HIGH | Test mock data lacks `rows[]` with DOM elements — doesn't catch H1 in real usage | **FIXED** — Mock buildings now include `rows: [{ rowElement: document.createElement('tr') }]`; added 3 assertions verifying rows are stripped from cached data |
| M1 | MEDIUM | `_buildHash()` uses `names.join(',')` — Turkish building names can contain commas, producing ambiguous hashes | **FIXED** — Changed separator to `\|` (pipe) |
| M2 | MEDIUM | Delta diff uses `binaNo \|\| name` as key — two buildings with same name but empty binaNo collide | **FIXED** — Added `_diffKey()` composite key function: binaNo → ada+disKapiNo → name (matches scraper groupByBuilding logic) |
| M3 | MEDIUM | Offline fallback blindly loads `adaNos[0]` without relevance check | **FIXED** — Extracts adaNo from active ada name (pattern "Ada 574" → "574"), tries preferred ada first, falls back to first available |
| L1 | LOW | `get()` doesn't emit cache:hit/miss events (story diagram says it should) | **ACCEPTED** — `checkDelta()` is the workflow entry point that emits all events; `get()` as pure getter is reasonable design |
| L2 | LOW | `has()` uses full `db:get` instead of count-based check | **ACCEPTED** — Performance is adequate, `db:count` with key filter not supported by background handler |

### Files Modified During Review

- `fiber-chrome/content/nvi-cache.js` — H1 (rows stripping), M1 (hash separator), M2 (_diffKey composite key)
- `fiber-chrome/content/main.js` — M3 (offline fallback preferred ada logic)
- `fiber-chrome/dashboard/test-nvi-cache.html` — H2 (mock data with DOM elements + stripping assertions)

## Change Log

- 2026-03-01: Story 1.3 implemented — NviCache module created, delta check system, scraper-cache integration in main.js, offline fallback, manifest.json updated, comprehensive test suite added
- 2026-03-01: Code review completed — 5 fixes applied (H1, H2, M1, M2, M3), 2 LOWs accepted, status → done
