# Story 6.1: Senaryo Verisi Saklama ve Disa Aktarma

Status: done

## Story

As a saha muhendisi,
I want topoloji ve finansal senaryo sonuclarini yapilandirilmis sekilde saklayabilmek ve disa aktarabilmek,
So that farkli zamanlarda yaptigim analizleri geri yukleyebilir ve raporlama icin paylasabileyim.

## Acceptance Criteria

1. **AC1 — Senaryo Kaydetme (FR41):**
   Given bir ada icin topoloji hesabi, varyasyonlar ve finansal analiz tamamlandiginda
   When kullanici senaryoyu kaydettiginde
   Then tum senaryo verileri yapilandirilmis JSON formatinda saklanmali:
   - Topoloji snapshot'i (binalar, OLT, rotalama, splitter, loss budget)
   - Envanter ve maliyet verileri
   - Finansal analiz (MRR, ROI, taahut modeli)
   - Varyasyon karsilastirma sonuclari
   - Meta veri (tarih, ada kodu, versiyon)
   And kayit IndexedDB scenarios store'unda saklanmali

2. **AC2 — Senaryo Listeleme ve Geri Yukleme:**
   Given birden fazla senaryo kaydedildiginde
   When senaryo listesi goruntulendikten
   Then tum kayitli senaryolar tarih ve ozet metrikleriyle listelenmeli
   And herhangi bir senaryo geri yuklenebilmeli
   And senaryolar arasi gecis yapilabilmeli

3. **AC3 — JSON Export (FR43):**
   Given kullanici senaryo verilerini disa aktarmak istediginde
   When export islemini baslattiginda
   Then JSON formatinda yapilandirilmis dosya indirilmeli
   And dosya baska bir FiberPlan kurulumunda import edilebilir formatta olmali
   And export oncesi hassas veri uyarisi gosterilmeli

4. **AC4 — JSON Import:**
   Given kullanici daha once export edilmis bir senaryo dosyasini yuklemek istediginde
   When import islemini baslattiginda
   Then JSON dosyasi dogrulanmali (format, versiyon uyumu)
   And basarili import sonrasi senaryo listeye eklenmeli
   And hatali dosyada aciklayici hata mesaji gosterilmeli

## Tasks / Subtasks

- [x] Task 1: MarketingDataHouse modulu olustur (AC: #1, #2)
  - [x] 1.1 lib/marketing-data-house.js — IIFE iskelet, CONSTANTS, private state
  - [x] 1.2 saveScenario(ada) — tum ada verisinden senaryo snapshot olustur ve IndexedDB'ye kaydet
  - [x] 1.3 listScenarios(adaId) — ada bazli senaryo listesi (tarih, ozet metrikler)
  - [x] 1.4 loadScenario(scenarioId) — kayitli senaryoyu geri yukle ve ada'ya uygula
  - [x] 1.5 deleteScenario(scenarioId) — senaryo silme
  - [x] 1.6 getScenarioSummary(scenario) — ozet metrik cikarma (maliyet, MRR, ROI, bina sayisi)

- [x] Task 2: IndexedDB scenarios store entegrasyonu (AC: #1)
  - [x] 2.1 background.js — STORES'a scenarios store ekle, DB_VERSION 3→4
  - [x] 2.2 storage.js — normalizeState() icinde scenarios cikarma
  - [x] 2.3 storage.js — denormalizeState() icinde scenarios yeniden baglama
  - [x] 2.4 storage.js — save() clearStores dizisine scenarios ekle
  - [x] 2.5 storage.js — deleteProject() clearStores'a scenarios ekle
  - [x] 2.6 storage.js — migration clearStores + operations guncelleme
  - [x] 2.7 topology.js — createAda() icinde scenarios: [] baslatma
  - [x] 2.8 topology.js — loadState() backward compat guard

- [x] Task 3: Export/Import fonksiyonlari (AC: #3, #4)
  - [x] 3.1 MarketingDataHouse.exportScenario(scenarioId) — JSON Blob URL ile dosya indirme
  - [x] 3.2 MarketingDataHouse.importScenario(jsonFile) — dosya okuma, dogrulama, kaydetme
  - [x] 3.3 Versiyon ve format dogrulama (schema validation)
  - [x] 3.4 Hassas veri uyarisi (export oncesi confirm dialog)

- [x] Task 4: Panels.js UI entegrasyonu (AC: #1, #2, #3, #4)
  - [x] 4.1 Yonetim sekmesinde "Senaryolar" alt bolumu olustur
  - [x] 4.2 "Senaryo Kaydet" butonu + isim girisi
  - [x] 4.3 Senaryo listesi (tarih, ozet metrikler, yukle/sil butonlari)
  - [x] 4.4 "Export JSON" ve "Import JSON" butonlari
  - [x] 4.5 Import icin file input (hidden) + dosya secim akisi
  - [x] 4.6 Hassas veri uyarisi modal/confirm

- [x] Task 5: manifest.json ve yukleme sirasi (AC: tumu)
  - [x] 5.1 manifest.json content_scripts'e marketing-data-house.js ekle (financial.js'den sonra)

- [x] Task 6: Testler
  - [x] 6.1 test/test-marketing-data-house.html olustur
  - [x] 6.2 saveScenario / listScenarios / loadScenario testleri
  - [x] 6.3 exportScenario / importScenario testleri
  - [x] 6.4 Schema validation testleri (bozuk JSON, eksik alan, yanlis versiyon)

### Review Follow-ups (AI)

- [x] [AI-Review] HIGH: handleScenarioExportPrompt scenarios[0] yerine kullaniciya senaryo secimi sunma

## Dev Notes

### Yeni Modul: MarketingDataHouse (lib/marketing-data-house.js)

```javascript
/**
 * MarketingDataHouse - Scenario data persistence and export/import
 * Manages structured scenario snapshots for marketing analysis
 */
const MarketingDataHouse = (() => {
  'use strict';
  // ─── CONSTANTS ─────────────────────────────────────────
  const CONFIG = {
    SCHEMA_VERSION: '1.0.0',
    MAX_SCENARIOS_PER_ADA: 20,
    STORE_NAME: 'scenarios'
  };
  // ─── PRIVATE STATE ─────────────────────────────────────
  // ─── PRIVATE FUNCTIONS ─────────────────────────────────
  // ─── PUBLIC API ────────────────────────────────────────
  return {
    saveScenario,
    listScenarios,
    loadScenario,
    deleteScenario,
    getScenarioSummary,
    exportScenario,
    importScenario
  };
})();
```

### Senaryo Veri Yapisi

```javascript
const scenario = {
  id: 'SCN-' + Date.now().toString(36),   // Benzersiz ID
  adaId: ada.id,                           // FK — ada referansi
  name: 'Kullanici girdisi',              // Senaryo adi
  createdAt: new Date().toISOString(),     // ISO tarih
  updatedAt: new Date().toISOString(),
  schemaVersion: '1.0.0',                 // Import/export uyumluluk kontrolu
  meta: {
    adaCode: ada.code,
    adaName: ada.name,
    buildingCount: ada.buildings.length,
    totalBB: toplam_bb,
    appVersion: chrome.runtime.getManifest().version
  },
  topology: {
    // Deep clone: JSON.parse(JSON.stringify(ada.topology))
    // OLT, rotalama, splitter, loss budget, FDH, edges, penetrasyon
  },
  buildings: [
    // Deep clone: JSON.parse(JSON.stringify(ada.buildings))
  ],
  calculations: {
    // Deep clone: JSON.parse(JSON.stringify(ada.calculations))
    // splitters, cables, lossBudget, inventory, costs
  },
  variations: [
    // Deep clone: JSON.parse(JSON.stringify(ada.variations))
  ],
  financial: {
    // Hesaplanmis finansal metrikler (snapshot anindaki degerler)
    totalInvestment: null,    // Financial.getTotalInvestment(ada)
    mrr: null,                // Financial.calculateMRR(ada)
    roi: null,                // Financial.calculateROI(ada)
    commitmentModels: [],     // ada.topology.commitmentModels deep clone
    campaigns: [],            // ada.topology.campaigns deep clone
    equipment: [],            // ada.topology.equipment deep clone
    modemConfig: {}           // ada.topology.modemConfig deep clone
  }
};
```

### IndexedDB Entegrasyonu — Storage Checklist

**KRITIK: Bu checklist'teki 8 adimin hepsi tamamlanmali!**

| # | Dosya | Islem | Detay |
|---|-------|-------|-------|
| 1 | background.js | STORES + DB_VERSION | `scenarios: { keyPath: 'id', obfuscate: true, indexes: { by_adaId: 'adaId', by_timestamp: 'createdAt' } }`, DB_VERSION: 3→4 |
| 2 | storage.js | normalizeState() | `ada.scenarios` dizisinden cikar, her birine `adaId` FK ekle |
| 3 | storage.js | denormalizeState() | `by_adaId` index ile grupla, `ada.scenarios` olarak geri bagla |
| 4 | storage.js | save() | clearStores dizisine `'scenarios'` ekle |
| 5 | storage.js | deleteProject() | clearStores dizisine `'scenarios'` ekle (KOLAY ATLANIR!) |
| 6 | storage.js | migration | clearStores + operations'a `'scenarios'` ekle (KOLAY ATLANIR!) |
| 7 | topology.js | createAda() | `scenarios: []` baslangic degeri ekle |
| 8 | topology.js | loadState() | `ada.scenarios = ada.scenarios \|\| []` backward compat |

### Export/Import Akisi

```
EXPORT:
  1. Kullanici "Export JSON" tiklar
  2. Hassas veri uyarisi modal gosterilir ("Bu dosya koordinat, bina ve finansal veri icerir")
  3. Kullanici onaylarsa:
     a. MarketingDataHouse.exportScenario(scenarioId) cagirilir
     b. JSON.stringify(scenario, null, 2) ile formatli string
     c. new Blob([jsonStr], {type: 'application/json'})
     d. URL.createObjectURL(blob) ile indirme linki
     e. Otomatik tikla + URL.revokeObjectURL ile temizle
     f. Dosya adi: `fiberplan-${ada.code}-${scenario.name}-${tarih}.json`

IMPORT:
  1. Kullanici "Import JSON" tiklar
  2. Hidden <input type="file" accept=".json"> tetiklenir
  3. FileReader.readAsText ile oku
  4. JSON.parse + schema dogrulama:
     a. schemaVersion kontrolu (desteklenen surumlere bakma)
     b. Zorunlu alanlar: id, adaId, topology, buildings, calculations
     c. Veri tipi dogrulamalari
  5. Basarili ise: MarketingDataHouse.saveScenario() ile kaydet
  6. Hatali ise: Overlay.showToast('Dosya formati hatali: ...', 'error')
```

### manifest.json Yukleme Sirasi

```
... → financial.js → marketing-data-house.js → ai-engine.js → ...
```

MarketingDataHouse, Financial modulu ve Variation modulunden sonra, AI engine'den once yuklenmeli. Cunku:
- Financial.getTotalInvestment(), calculateMRR(), calculateROI() fonksiyonlarini kullanir
- Variation snapshot verisine erisir
- ai-engine.js MarketingDataHouse verisine bagimliligi yok (simdlik)

### Onceki Story'lerden Ogrenimler (Story 5.6)

- Epic 4 karsilastirma tablosu CSS kaliplari yeniden kullanilabilir (fp-comparison-overlay, fp-cmp-table)
- Modal kapatma: X butonu + overlay click + Escape key — 3'u birden implement edilmeli
- Hesaplama sirasinda orijinal state korunmali (gecici degisiklik → restore pattern)
- En az 2 kayit yoksa karsilastirma butonu gosterilmemeli

### Mimari Kisitlamalar

- **IIFE pattern ZORUNLU** — import/export YASAK
- **fp- CSS prefix** — tum CSS siniflarinda
- **fp_ storage prefix** — IndexedDB store adi haric (camelCase: scenarios)
- **[MarketingDataHouse] log prefix** — tum console.log/warn/error
- **JSON serilestirilebilir** — Date objesi yok, ISO string kullan
- **Error boundary** — try/catch ile hata izolasyonu, ada bazinda
- **Deep clone** — JSON.parse(JSON.stringify()) ile snapshot olustur
- **Type guard** — `if (typeof Financial !== 'undefined' && Financial.calculateMRR)` seklinde

### Panels.js UI Yapisi

Yonetim sekmesi icinde yeni "Senaryolar" alt bolumu:

```html
<div id="fp-scenario-section" class="fp-section">
  <div class="fp-section-header">
    <span>Kayitli Senaryolar</span>
    <div class="fp-scenario-actions">
      <button class="fp-btn fp-btn-sm" id="fp-scenario-save">KAYDET</button>
      <button class="fp-btn fp-btn-sm fp-btn-secondary" id="fp-scenario-export">EXPORT</button>
      <button class="fp-btn fp-btn-sm fp-btn-secondary" id="fp-scenario-import">IMPORT</button>
    </div>
  </div>
  <div id="fp-scenario-list">
    <!-- Dinamik senaryo kartlari -->
  </div>
</div>
```

Her senaryo karti:
```html
<div class="fp-scenario-card" data-id="SCN-xxx">
  <div class="fp-scenario-info">
    <strong>Senaryo Adi</strong>
    <span class="fp-scenario-date">2026-03-02 14:30</span>
    <span class="fp-scenario-metrics">12 bina | 45.200 TL | MRR 3.500 TL</span>
  </div>
  <div class="fp-scenario-btns">
    <button class="fp-btn fp-btn-xs" data-action="load">YUKLE</button>
    <button class="fp-btn fp-btn-xs fp-btn-danger" data-action="delete">SIL</button>
  </div>
</div>
```

### Bilinen Riskler ve Dikkat Edilecekler

1. **Deep clone boyutu:** Buyuk adalarda (50+ bina) senaryo snapshot'i buyuk olabilir. JSON.stringify performansi izlenmeli.
2. **IndexedDB kotasi:** Chrome extension'da IndexedDB varsayilan 10% disk kotasina sahip. MAX_SCENARIOS_PER_ADA limiti (20) ile kontrol altinda.
3. **Import guvenlik:** Dis kaynaktan gelen JSON dosyasinda XSS riski — import sirasinda sadece beklenen alanlari al, fazlaliklari at.
4. **Backward compat:** Eski export dosyalari (schemaVersion farki) icin migrasyon stratejisi dusunulmeli. v1.0.0'da basit — sadece versiyon eslesmesi kontrolu yeterli.

### Project Structure Notes

- Yeni dosya: `fiber-chrome/lib/marketing-data-house.js`
- Yeni test: `fiber-chrome/test/test-marketing-data-house.html`
- Degisecek dosyalar: background.js, storage.js, topology.js, panels.js, manifest.json
- Mimari ile uyum: architecture.md'de "Pazarlama Data House" modulu tanimli (line 608), financial.js altinda ortuk olarak kapsaniyordu — simdi ayri modul olarak cikariliyor

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 6, Story 6.1]
- [Source: _bmad-output/planning-artifacts/architecture.md — IndexedDB Store Yapisi, line 169-176]
- [Source: _bmad-output/planning-artifacts/architecture.md — Modul Yapisi IIFE Sablonu, line 269-289]
- [Source: _bmad-output/planning-artifacts/architecture.md — Proje Dizin Yapisi, line 422-489]
- [Source: _bmad-output/planning-artifacts/architecture.md — manifest.json Yukleme Sirasi, line 491-515]
- [Source: _bmad-output/planning-artifacts/architecture.md — Pazarlama Data House notu, line 607-608]
- [Source: fiber-chrome/background.js — STORES config, DB_VERSION=3]
- [Source: fiber-chrome/lib/storage.js — normalizeState/denormalizeState pattern]
- [Source: fiber-chrome/lib/topology.js — createAda() ada yapisi]
- [Source: fiber-chrome/lib/financial.js — getTotalInvestment, calculateMRR, calculateROI]
- [Source: fiber-chrome/lib/variation.js — variation snapshot yapisi]
- [Source: _bmad-output/implementation-artifacts/5-6-taahut-senaryo-karsilastirma.md — Dev Notes]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

N/A

### Completion Notes List

- Task 1: `MarketingDataHouse` IIFE modulu olusturuldu (`lib/marketing-data-house.js`). Tum CRUD fonksiyonlari: `saveScenario`, `listScenarios`, `loadScenario`, `deleteScenario`, `getScenarioSummary`. Deep clone ile snapshot olusturma, Financial modul entegrasyonu (type guard ile), max 20 senaryo limiti.
- Task 2: IndexedDB `scenarios` store entegrasyonu — 8 adimlik storage checklist tamami uygulanmistir:
  - background.js: STORES + DB_VERSION 3->4
  - storage.js: normalizeState (scenarios cikarma), denormalizeState (scenarios gruplama), save (clearStores), load (stores listesi), deleteProject (clearStores), migration (clearStores + operations)
  - topology.js: createAda (scenarios: []), loadState (backward compat guard)
- Task 3: Export/Import fonksiyonlari — JSON Blob URL ile dosya indirme, FileReader ile import, schema validation (zorunlu alan + versiyon kontrolu), hassas veri uyarisi icin modal/confirm entegrasyonu.
- Task 4: Panels.js UI — Senaryo paneli (fp-scenario-panel), kaydet butonu (inline prompt ile isim girisi), senaryo listesi (tarih + ozet metrikler + yukle/sil butonlari), export/import butonlari, file input (hidden), event delegation ile kart aksiyon yonetimi.
- Task 5: manifest.json'a `lib/marketing-data-house.js` eklendi (financial.js sonrasi, ai-engine.js oncesi).
- Task 6: Kapsamli test dosyasi olusturuldu — 10 test grubu, 40+ assertion: modul yapisi, saveScenario, listScenarios, loadScenario, deleteScenario, getScenarioSummary, schema validation (bozuk JSON, eksik alan, uyumsuz versiyon), export, storage entegrasyonu, max limit testi.
- [AI-Review] HIGH — handleScenarioExportPrompt: scenarios[0] yerine inline select ile senaryo secimi eklendi. Tek senaryo → direkt export, birden fazla → _showScenarioSelectForExport + _confirmAndExportScenario akisi.

### Change Log

- 2026-03-02: Story 6.1 implementasyonu tamamlandi — MarketingDataHouse modulu, IndexedDB scenarios store, export/import, UI paneli, testler.
- 2026-03-07: Review follow-up — handleScenarioExportPrompt: birden fazla senaryo varsa kullaniciya inline select ile secim sunma eklendi. Tek senaryo icin mevcut davranis korundu.

### File List

- fiber-chrome/lib/marketing-data-house.js (YENi)
- fiber-chrome/dashboard/test-marketing-data-house.html (YENi)
- fiber-chrome/background.js (DEGISTI — STORES + DB_VERSION)
- fiber-chrome/lib/storage.js (DEGISTI — normalize/denormalize/save/load/delete/migration)
- fiber-chrome/lib/topology.js (DEGISTI — createAda scenarios init + loadState backward compat)
- fiber-chrome/content/panels.js (DEGISTI — senaryo paneli + handler fonksiyonlari)
- fiber-chrome/manifest.json (DEGISTI — marketing-data-house.js eklendi)
