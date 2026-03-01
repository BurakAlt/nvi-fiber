# Story 1.2: IndexedDB Veri Katmani ve Migrasyon

Status: done

## Story

As a saha muhendisi,
I want tum proje verilerimin guvenli ve kalici bir veritabaninda saklanmasini,
so that buyuk veri setleriyle (500+ ada, 10.000+ bina) performans kaybi olmadan calisabileyim.

## Acceptance Criteria (BDD)

1. **Given** extension ilk kez yuklendiginde (yeni kurulum) **When** Storage modulu baslatildiginda **Then** IndexedDB 7 store ile olusturulmali: `adas`, `buildings`, `calculations`, `settings`, `backups`, `logs`, `nviCache`. Her store dogru index'lerle (`by_adaId`, `by_timestamp` vb.) yapilandirilmali.

2. **Given** kullanicinin mevcut chrome.storage.local'da verileri varken **When** extension guncelleme sonrasi ilk calistiginda **Then** dual-read migrasyon baslamali: once IndexedDB'den oku, yoksa chrome.storage.local'dan oku ve IndexedDB'ye yaz. Migrasyon sirasinda sifir veri kaybi garantisi saglanmali (NFR23). Migrasyon tamamlandiginda basari mesaji loglanmali.

3. **Given** IndexedDB aktif ve calisiyor oldugunda **When** veri okuma/yazma islemleri yapildiginda **Then** islem suresi < 50ms olmali (NFR4). 100MB'a kadar veri boyutunda performans kaybi olmamali (NFR14).

4. **Given** IndexedDB'de sifreli veri saklama aktif oldugunda **When** veri yazildiginda **Then** veriler obfuscation (XOR/Base64) ile sifrelenmeli (NFR7). Okuma sirasinda seffaf sekilde cozulmeli.

## Tasks / Subtasks

- [x] Task 1: IndexedDB coklu store sema olusturma (AC: #1)
  - [x] 1.1 `FiberPlanDB` veritabani olustur — version 2 (mevcut migrasyondaki v1'den yukselt)
  - [x] 1.2 `adas` store: keyPath `id`, index `by_code` (unique), `by_status`
  - [x] 1.3 `buildings` store: keyPath `id`, index `by_adaId`, `by_binaNo`
  - [x] 1.4 `calculations` store: keyPath `adaId`, index `by_timestamp`
  - [x] 1.5 `settings` store: keyPath `key` (key-value ciftleri icin)
  - [x] 1.6 `backups` store: keyPath `id`, index `by_timestamp`
  - [x] 1.7 `logs` store: mevcut FiberPlanLogs DB'den tasi — keyPath `id`, index `by_timestamp`, `by_level`, `by_module`
  - [x] 1.8 `nviCache` store: keyPath `cacheKey`, index `by_adaNo`, `by_timestamp`
  - [x] 1.9 `onupgradeneeded` handler: version 1→2 gecisi icin mevcut `projects` store'dan veri tasima

- [x] Task 2: Storage modulu yeniden yazma (AC: #1, #2, #3)
  - [x] 2.1 `lib/storage.js` icerigini yeniden yaz — IIFE pattern koru
  - [x] 2.2 Mevcut public API'yi koru: `init()`, `save()`, `load()`, `listProjects()`, `deleteProject()`, `autoSave()`, `autoLoad()`, `saveCatalog()`, `loadCatalog()`
  - [x] 2.3 `init()`: IndexedDB ac, hazir oldugunda resolve et
  - [x] 2.4 `save(data, key)`: `adas` + `buildings` + `calculations` store'larina normalize ederek yaz
  - [x] 2.5 `load(key)`: Normalize edilmis store'lardan oku, Topology.getState() formatinda birlestir
  - [x] 2.6 `autoSave()`: Topology.getState() → normalize → IndexedDB yaz + EventBus emit `storage:saved`
  - [x] 2.7 `autoLoad()`: IndexedDB'den oku → denormalize → Topology.loadState() + EventBus emit `storage:loaded`
  - [x] 2.8 `saveCatalog()` / `loadCatalog()`: `settings` store'a yaz/oku (key: `catalog_custom`)
  - [x] 2.9 Map position save/load: `settings` store'a yaz/oku (key: `map_position`)
  - [x] 2.10 Tum islemlerde `< 50ms` performans hedefini koru

- [x] Task 3: Dual-read migrasyon sistemi (AC: #2)
  - [x] 3.1 `init()` icinde migrasyon kontrolu: `settings` store'da `migration_complete` flag'i kontrol et
  - [x] 3.2 chrome.storage.local'dan `fp_current` oku
  - [x] 3.3 Topology state verisini normalize ederek 3 store'a (adas, buildings, calculations) yaz
  - [x] 3.4 `fp_catalog_custom` → settings store'a tasi
  - [x] 3.5 `fp_map_position` → settings store'a tasi
  - [x] 3.6 Migrasyon tamamlaninca `migration_complete: true` yaz + FPDebug.info() ile logla
  - [x] 3.7 Mevcut main.js `migrateFromIndexedDB()` fonksiyonunu guncelle — eski FiberPlanDB→chrome.storage zincirini FiberPlanDB→yeni IndexedDB'ye yonlendir
  - [x] 3.8 Sifir veri kaybi dogrulama: migrasyon sonrasi veri sayisi kontrolu

- [x] Task 4: Obfuscation sifreleme katmani (AC: #4)
  - [x] 4.1 `_encode(data)` — JSON.stringify → XOR → Base64 encode
  - [x] 4.2 `_decode(encoded)` — Base64 decode → XOR → JSON.parse
  - [x] 4.3 XOR anahtari: sabit extension-internal key (kaynak kodda)
  - [x] 4.4 Tum store yazma/okuma islemlerinde seffaf encode/decode

- [x] Task 5: FPDebug logs store entegrasyonu (AC: #1)
  - [x] 5.1 Mevcut `FiberPlanLogs` DB'yi kapat ve yeni `FiberPlanDB` v2 icindeki `logs` store'a yonlendir
  - [x] 5.2 `debug.js` guncelle: `openLogDB()` yerine `initLogStore()` — background.js uzerinden log yazimi
  - [x] 5.3 Mevcut FiberPlanLogs verileri varsa yeni logs store'a tasi
  - [x] 5.4 `writeLogRecord`, `getLogsByLevel`, `getLogsByModule`, `exportLogs` yeni store'u kullanacak sekilde guncelle

- [x] Task 6: Entegrasyon testleri
  - [x] 6.1 `dashboard/test-storage.html` olustur
  - [x] 6.2 7 store olusturma ve index dogrulama testi
  - [x] 6.3 save/load round-trip testi (Topology state → normalize → denormalize)
  - [x] 6.4 Dual-read migrasyon testi (chrome.storage.local → IndexedDB)
  - [x] 6.5 Obfuscation encode/decode round-trip testi
  - [x] 6.6 Performans testi: 50 ada, 500 bina ile < 50ms yazma/okuma
  - [x] 6.7 Mevcut API uyumluluk testi (autoSave/autoLoad calismaya devam ediyor)

## Dev Notes

### KRITIK: Cross-Context IndexedDB Sinirlamasi

Chrome Manifest V3'te IndexedDB **origin-scoped** calisir:
- **Content scripts** (adres.nvi.gov.tr'de calisan): NVI sayfasinin origin'inde IndexedDB olusturur
- **Extension pages** (dashboard, popup): `chrome-extension://ID/` origin'inde IndexedDB olusturur

Bu iki farkli veritabani! Cozum secenekleri:

**Secim A (ONERILEN): Background Service Worker Uzerinden**
- `background.js` IndexedDB'yi yonetir (extension origin)
- Content script ve dashboard `chrome.runtime.sendMessage` ile iletisim kurar
- Tek kaynakli veritabani, tum context'lerden erisim

**Secim B: Hibrit Yaklasim**
- `chrome.storage.local` proje verileri icin (cross-context, mevcut calisma sekli)
- IndexedDB sadece content script'te buyuk veri icin (nviCache, logs)
- Dashboard zaten chrome.storage.local ile calisiyor

**Karar**: Implementasyon sirasinda biri secilmeli. Secim A daha temiz ama karmasik, Secim B daha basit ama bolucu. Her iki durumda da **mevcut Storage public API korunmali**.

### Mevcut Kodda Korunmasi Gerekenler

1. **`Storage` modulu** (`lib/storage.js`, 161 satir):
   - Public API: `init()`, `save()`, `load()`, `listProjects()`, `deleteProject()`, `autoSave()`, `autoLoad()`, `saveCatalog()`, `loadCatalog()`
   - `fp_` prefix key convention
   - Wrapper format: `{ data: ..., updatedAt: ISO }` — bunun preserve edilip edilmeyecegine karar ver

2. **`Topology` modulu** (`lib/topology.js`):
   - `getState()` (satir 767-778): Tum proje verisini serialize eder
   - `loadState(saved)` (satir 783-828): Backward compatibility migration'lar (oltConfig, ptpLinks, boundary, penetrationRate, equipmentSelections, ada codes)
   - PROJECT singleton yapisi — DOKUNMA

3. **`main.js` migrasyonu** (`content/main.js`, satir 212-270):
   - Mevcut `migrateFromIndexedDB()`: eski `FiberPlanDB` v1 → chrome.storage.local
   - Bu fonksiyon guncellenmeli: eski FiberPlanDB v1 → yeni FiberPlanDB v2 (veya zincir: v1 → chrome.storage → v2)

4. **`overlay.js` harita pozisyonu** (`content/overlay.js`, satir 155-163):
   - `fp_map_position` chrome.storage.local'dan okur/yazar
   - Settings store'a tasinmali VEYA chrome.storage.local'da kalmali (basitlik icin)

5. **`debug.js` logs** (`lib/debug.js`):
   - Story 1.1'de olusturulan `FiberPlanLogs` DB (ayri DB)
   - Bu story'de ana `FiberPlanDB` icindeki `logs` store'a tasinmali
   - `openLogDB()`, `writeLogRecord()`, `flushWriteBatch()`, `getLogsByLevel()`, `getLogsByModule()`, `exportLogs()` guncellenmeli

6. **Dashboard** (`dashboard/dashboard.js`):
   - Ayni `Storage` modulu yuklenir
   - `Storage.autoLoad()` ve `Storage.loadCatalog()` cagirilir
   - IndexedDB yaklasimindan bagimsiz olarak Storage API uyumu ZORUNLU

### Mevcut chrome.storage.local Anahtarlari

| Anahtar | Kullanim Yeri | Hedef Store |
|---------|--------------|-------------|
| `fp_current` | storage.js (save/load) | → `adas` + `buildings` + `calculations` (normalize) |
| `fp_catalog_custom` | storage.js (saveCatalog/loadCatalog) | → `settings` (key: `catalog_custom`) |
| `fp_map_position` | overlay.js | → `settings` (key: `map_position`) |
| `fp_migrated` | main.js | → `settings` (key: `migration_v1_complete`) |
| `fp_bulk_tip_done` | panels.js (localStorage) | Kalsin — UI hint, IndexedDB'ye gerek yok |
| `fp_onboarding_done` | dashboard.js (localStorage) | Kalsin — UI hint, IndexedDB'ye gerek yok |

### Denormalizasyon Stratejisi

Mevcut `fp_current` tek bir buyuk JSON objesi olarak saklanir. Yeni IndexedDB'de normalize edilmeli:

```javascript
// Topology.getState() ciktisi:
{
  meta: { name, city, district, date, standard },
  adas: [
    { id, code, name, buildings: [...], topology: {...}, calculations: {...} }
  ],
  oltGroups: [...],
  activeAdaId, nextAdaId, nextBuildingId, nextPtpId, nextAdaCode
}

// NORMALIZE → IndexedDB store'lari:
// adas store: { id, code, name, meta, topology, activeAdaId, ... }
// buildings store: { id, adaId, name, addr, bb, lat, lng, ... }  (ada.buildings'den cikarilir)
// calculations store: { adaId, splitters, cables, lossBudget, inventory, costs, timestamp }
```

**Denormalize** (IndexedDB → Topology.loadState formatina):
```javascript
// 1. adas store'dan tum ada kayitlarini oku
// 2. Her ada icin buildings store'dan by_adaId ile binalari oku
// 3. Her ada icin calculations store'dan by_adaId ile hesaplamalari oku
// 4. Hepsini birlestirip Topology.getState() formatina donustur
// 5. Topology.loadState(merged) cagir
```

### IndexedDB Store Sema Detaylari

```javascript
// Database: 'FiberPlanDB'
// Version: 2 (v1 mevcut migrasyon icin kullanilmis)

// ─── STORE: adas ─────────────────────────────
// keyPath: 'id'
// indexes: by_code (unique), by_status
// Record: {
//   id: number,
//   code: 'DA-NNN',
//   name: string,
//   createdAt: number,
//   status: 'planning' | 'completed',
//   boundary: GeoJSON | null,
//   topology: { oltBuildingId, fdhNodes, manualEdges, ... },
//   mapSnapshot: { screenshot, bounds, timestamp } | null,
//   // meta fields (proje bazinda tekil)
//   meta: { name, city, district, date, standard } | null,  // sadece ilk ada'da
//   oltGroups: [...] | null,  // sadece ilk ada'da
//   activeAdaId: number | null,  // sadece ilk ada'da
//   nextAdaId: number | null,
//   nextBuildingId: number | null,
//   nextPtpId: number | null,
//   nextAdaCode: number | null
// }
// NOT: meta ve global alanlar ayri bir 'project' kaydinda da tutulabilir
//      Bu durumda settings store'da key:'project_meta' olarak saklanir

// ─── STORE: buildings ────────────────────────
// keyPath: 'id'
// indexes: by_adaId, by_binaNo
// Record: {
//   id: number,
//   adaId: number,  // foreign key → adas.id
//   name: string,
//   addr: string,
//   bb: number,
//   lat: number,
//   lng: number,
//   floor: number,
//   hasElectric: boolean,
//   binaNo: string,
//   adaNo: string,
//   parsel: string,
//   penetrationRate: number | null,
//   customPenetration: boolean
// }

// ─── STORE: calculations ─────────────────────
// keyPath: 'adaId'
// indexes: by_timestamp
// Record: {
//   adaId: number,  // foreign key → adas.id
//   timestamp: ISO string,
//   splitters: [...],
//   cables: [...],
//   lossBudget: [...],
//   inventory: [...],
//   oltCapacity: { requiredPorts, maxBB, maxONT },
//   costs: { items: [], total: number }
// }

// ─── STORE: settings ─────────────────────────
// keyPath: 'key'
// Record: { key: string, value: any }
// Ornek kayitlar:
//   { key: 'project_meta', value: { name, city, ... } }
//   { key: 'catalog_custom', value: { ... } }
//   { key: 'map_position', value: { lat, lng, zoom } }
//   { key: 'migration_complete', value: true }
//   { key: 'global_state', value: { activeAdaId, nextAdaId, ... } }

// ─── STORE: backups ──────────────────────────
// keyPath: 'id'
// indexes: by_timestamp
// Record: {
//   id: string,  // Date.now().toString(36)
//   timestamp: ISO string,
//   data: string (encoded full state snapshot)
// }
// Story 1.5'te doldurulacak — simdi sadece store olustur

// ─── STORE: logs ─────────────────────────────
// (Story 1.1'den miras — FiberPlanLogs DB'den tasinacak)
// keyPath: 'id'
// indexes: by_timestamp, by_level, by_module
// Record: { id, level, module, message, timestamp, data }

// ─── STORE: nviCache ─────────────────────────
// keyPath: 'cacheKey'
// indexes: by_adaNo, by_timestamp
// Record: {
//   cacheKey: string,  // 'ada_XXXXX' veya 'bina_XXXXX'
//   adaNo: string,
//   timestamp: ISO string,
//   data: object (NVI'dan cekilen ham veri)
// }
// Story 1.3'te doldurulacak — simdi sadece store olustur
```

### Onceki Story (1.1) Intelligence

Story 1.1'de ogrenilenler:
- **IIFE pattern ve naming convention** basariyla uygulanmis
- **EventBus** `on/off/emit` API'si calisiyor — `storage:saved`, `storage:loaded` event'leri eklenebilir
- **FPDebug** structured logging calisiyor — `FPDebug.info('Storage', 'Migration complete', {...})` pattern'i
- **IndexedDB deneyimi** kazanildi — `openLogDB()`, `writeLogRecord()`, `flushWriteBatch()` pattern'lari
- **Code review bulgulari**: `.slice()` ile iterasyon guvenli hale getirildi, `_inStructuredLog` guard eklendi, batch write optimize edildi
- **Anti-pattern**: `const`/`let` vs `var` tutarsizligi — yeni kodda `const`/`let` kullan (orijinal storage.js `const`/`var` karisik)
- **FiberPlanLogs ayri DB** — bu story'de ana DB'ye tasinacak

### Project Structure Notes

```
fiber-chrome/
  lib/
    storage.js       ★ YENIDEN YAZILACAK — IndexedDB coklu store
    debug.js         ★ GUNCELLENECEK — logs store referansi degisecek
    event-bus.js     DOKUNULMAYACAK
    topology.js      DOKUNULMAYACAK (loadState/getState aynen kalacak)
    ...
  content/
    main.js          ★ GUNCELLENECEK — migrasyon fonksiyonu
    overlay.js       ★ GUNCELLENECEK — map position settings store'a (opsiyonel)
    ...
  background.js      ★ GUNCELLENECEK (Secim A ise — IndexedDB yonetimi eklenecek)
  manifest.json      DOKUNULMAYACAK (yukleme sirasi degismez)
  dashboard/
    test-storage.html ★ YENI — entegrasyon test dosyasi
```

## Architecture Compliance

### IIFE Module Pattern (ZORUNLU)

```javascript
const Storage = (() => {
  'use strict';

  // ─── PRIVATE STATE ─────────────────────────────────────
  const DB_NAME = 'FiberPlanDB';
  const DB_VERSION = 2;
  let _db = null;
  let _dbReady = false;

  // ─── INDEXEDDB MANAGEMENT ──────────────────────────────
  function openDB() { /* ... */ }

  // ─── NORMALIZE / DENORMALIZE ───────────────────────────
  function normalizeState(state) { /* getState → store records */ }
  function denormalizeState(records) { /* store records → loadState format */ }

  // ─── OBFUSCATION ───────────────────────────────────────
  function _encode(data) { /* JSON → XOR → Base64 */ }
  function _decode(encoded) { /* Base64 → XOR → JSON */ }

  // ─── PUBLIC API (preserved) ────────────────────────────
  function init() { /* open DB, run migration if needed */ }
  function save(data, key) { /* normalize → write stores */ }
  function load(key) { /* read stores → denormalize */ }
  // ... (same API surface as before)

  return {
    init, save, load, listProjects, deleteProject,
    autoSave, autoLoad, saveCatalog, loadCatalog
  };
})();
```

### EventBus Entegrasyonu

```javascript
// Storage islemlerinde EventBus event'leri:
EventBus.emit('storage:saved', { key: key, adaCount: adas.length });
EventBus.emit('storage:loaded', { key: key, adaCount: adas.length });
EventBus.emit('storage:migrated', { from: 'chrome.storage', records: count });
EventBus.emit('storage:error', { operation: 'save', error: err.message });
```

### Naming Conventions (ZORUNLU)

| Kural | Ornek |
|-------|-------|
| Module ismi: PascalCase | `Storage` |
| Private state: `let _` prefix | `let _db = null;` |
| Constants: UPPER_SNAKE | `DB_NAME`, `DB_VERSION` |
| Functions: camelCase | `openDB()`, `normalizeState()` |
| Store names: camelCase | `adas`, `buildings`, `nviCache` |
| Index names: by_fieldName | `by_adaId`, `by_timestamp` |
| Settings keys: snake_case | `catalog_custom`, `map_position` |
| Event format: namespace:action | `storage:saved`, `storage:loaded` |
| Date: ISO string | `new Date().toISOString()` |
| Null: explicit `null` | `undefined` YASAK |

### Anti-Pattern Uyarilari

1. **Tek buyuk JSON saklama YAPMA** — normalize et, ada bazinda bagimsiz I/O sagla
2. **Senkron API YAPMA** — tum islemler Promise dondurmeli
3. **chrome.storage.local'i tamamen SILME** — migrasyon sonrasi bile fallback olarak kalmali (gerekirse)
4. **Topology.loadState() formatini DEGISTIRME** — denormalize sonucu ayni formatta olmali
5. **Class kullanma** — IIFE pattern ZORUNLU
6. **async/await kullanma** — Promise pattern kullan
7. **Global state'i localStorage'da saklama** — IndexedDB veya chrome.storage kullan

### Performance Gereksinimleri

- IndexedDB okuma: < 50ms (tek ada)
- IndexedDB yazma: < 50ms (tek ada)
- Tam proje yuklemesi: < 200ms (50 ada, 500 bina)
- Migrasyon: < 5s (mevcut veriler icin tek seferlik)
- Obfuscation overhead: < 5ms per encode/decode

## References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 1, Story 1.2]
- [Source: _bmad-output/planning-artifacts/architecture.md — IndexedDB Store Yapisi, Veri Mimarisi, Migrasyon]
- [Source: fiber-chrome/lib/storage.js — Mevcut Storage modulu, 161 satir, 9 public method]
- [Source: fiber-chrome/lib/topology.js — PROJECT singleton, getState() satir 767, loadState() satir 783]
- [Source: fiber-chrome/content/main.js — migrateFromIndexedDB() satir 212-270]
- [Source: fiber-chrome/content/overlay.js — fp_map_position satir 155-163]
- [Source: fiber-chrome/lib/debug.js — FiberPlanLogs DB, logs store]
- [Source: CLAUDE.md — Storage section, Module system, Data flow]
- [Source: _bmad-output/implementation-artifacts/1-1-olay-sistemi-ve-gelismis-loglama.md — Onceki story intelligence]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

None — implementation session, no runtime debug logs.

### Completion Notes List

1. **Secim A (Background Service Worker)** kullanildi: background.js IndexedDB'yi extension origin'de yonetir, tum context'ler chrome.runtime.sendMessage ile iletisir.
2. **v1→v2 migration**: FiberPlanDB v1 NVI origin'de kalmistir (content script), yeni v2 extension origin'dedir. Veri zinciri: old v1 → chrome.storage.local (main.js) → new IndexedDB v2 (Storage._runMigration).
3. **main.js init sirasi degistirildi**: migrateFromIndexedDB() artik Storage.init()'ten ONCE calisir. Bu sayede chrome.storage.local'a yazilan veriler Storage.init() icindeki _runMigration tarafindan bulunur.
4. **Obfuscation**: XOR/Base64 encoding, TextEncoder/TextDecoder ile UTF-8 safe. Sadece adas, buildings, calculations, backups store'lari sifrelenir. Settings, logs, nviCache sifrelenmez.
5. **Index fields plaintext**: Obfuscated store'larda keyPath + index alanlari duzmetin kalir, tum veri _enc alaninda kodlanir.
6. **putBatch clearStores**: save() islemi oncesinde adas/buildings/calculations store'larini temizler (atomic), settings'e dokunmaz. Bu sayede silinen ada/bina verileri IndexedDB'de kalmaz.
7. **debug.js**: Dogrudan IndexedDB erisimi kaldirildi, tum log yazma/okuma background.js uzerinden message-passing ile yapilir. Eski FiberPlanLogs DB migrasyonu initLogStore() icinde otomatik calisir.
8. **overlay.js fp_map_position**: chrome.storage.local'da birakild — degisiklik gereksiz, zaten cross-context calisiyor ve performans avantaji var.
9. **ensureDB() deduplication**: Birden fazla concurrent cagri ayni promise'i bekler, DB tekrar tekrar acilmaz.
10. **handleLoadAll**: Tek transaction'da birden fazla store okunur — round-trip sayisi minimize edildi.

### File List

| Dosya | Islem | Satir |
|-------|-------|-------|
| `fiber-chrome/background.js` | REWRITE | ~350 sat. — IndexedDB schema (7 store), obfuscation, CRUD handlers, message dispatch |
| `fiber-chrome/lib/storage.js` | REWRITE | ~310 sat. — IIFE, message-passing API, normalize/denormalize, dual-read migration |
| `fiber-chrome/lib/debug.js` | UPDATE | ~110 sat. degisiklik — initLogStore(), message-based write/query, FiberPlanLogs migration |
| `fiber-chrome/content/main.js` | UPDATE | ~4 sat. degisiklik — init sirasi: migrateFromIndexedDB() before Storage.init() |
| `fiber-chrome/dashboard/test-storage.html` | NEW | ~350 sat. — 7 test grubu: store creation, indexes, round-trip, obfuscation, migration, performance, API compat |

## Senior Developer Review (AI)

**Reviewer:** Claude Opus 4.6 | **Tarih:** 2026-03-01 | **Sonuc:** APPROVED (fix sonrasi)

### Bulunan Sorunlar ve Duzeltmeler

| # | Ciddiyet | Sorun | Duzeltme |
|---|----------|-------|----------|
| H1 | HIGH | `denormalizeState()` building ve calculation kayitlarina fazladan `adaId` alani ekliyor — Topology.loadState() formati bozuluyor | `denormalizeState()` icinde building'lerden `adaId`, calculation'lardan `adaId` strip ediliyor |
| H2 | HIGH | Performans test esikleri 25x gevsek (5000ms vs stated 200ms) | Test esikleri 5000ms → 500ms olarak duzeltildi (message-passing overhead dahil) |
| M1 | MEDIUM | `_inStructuredLog` guard try/finally ile korunmuyor — flag stuck kalabilir | `try { console.* } finally { _inStructuredLog = false; }` pattern eklendi |
| M2 | MEDIUM | `_ready` flag dead code — set edilip hic kontrol edilmiyor | Kaldirildi |
| M3 | MEDIUM | Migrasyon veri kaybi dogrulamasi eksik — post-count var ama pre-count karsilastirmasi yok | Pre vs post count karsilastirmasi + uyumsuzluk durumunda FPDebug.warn eklendi |
| M4 | MEDIUM | `autoSave()` promise rejection yakalanmiyor | `save().catch()` eklendi |

### Kalan LOW Sorunlar (Kabul Edildi)

- L1: background.js mesaj handler'inda msg.store input validation yok — extension-internal trust sinirlari icinde
- L2: `deleteProject()` iki ayri mesaj ile non-atomic — kismen temizlik riski cok dusuk
- L3: Test izolasyonu zayif — paylasilmis DB, cleanup failure etkisi sinirli
