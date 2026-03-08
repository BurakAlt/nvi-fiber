# Story 6.2: Bolge Bazli Pazarlama Stratejisi

Status: done

## Story

As a saha muhendisi,
I want farkli bolgelerdeki adalarin pazarlama stratejilerini karsilastirabilmek ve en karli kombinasyonu gorebilmek,
So that sinirli butceyi en yuksek getiri saglayacak bolgelere yonlendirebilirim.

## Acceptance Criteria

1. **AC1 — Bolgesel Karsilastirma Tablosu (FR42):**
   Given birden fazla ada icin senaryo verileri kayitliyken
   When kullanici bolge bazli karsilastirma gorunumunu actiginda
   Then adalarin pazarlama metrikleri yan yana karsilastirma tablosunda gosterilmeli:
   - Ada kodu ve adi
   - Toplam yatirim maliyeti
   - Beklenen MRR
   - ROI yuzdesi
   - Break-even suresi (ay)
   - Penetrasyon potansiyeli
   - Kalite skoru
   And tablo siralama destegi olmali (herhangi bir metrige gore)

2. **AC2 — En Karli Strateji Kombinasyonu (FR44):**
   Given karsilastirma tablosu gosterildiginde
   When en karli strateji kombinasyonu analiz edildiginde
   Then sistem butce limiti dahilinde en yuksek toplam ROI saglayan ada kombinasyonunu ozet olarak sunmali
   And onceliklendirme onerileri gosterilmeli (en yuksek ROI'den en dusuge)
   And toplam butce etkisi hesaplanmali

3. **AC3 — Butce Optimizasyonu:**
   Given kullanici belirli bir butce limitini girdiginde
   When optimizasyon hesabi yapildiginda
   Then butce dahilinde en karli ada kombinasyonu onerisi gosterilmeli
   And toplam beklenen gelir ve ROI hesaplanmali

## Tasks / Subtasks

- [x] Task 1: MarketingDataHouse — Bolgesel analiz fonksiyonlari (AC: #1, #2, #3)
  - [x] 1.1 compareRegions() — tum adalarin ozet metriklerini IndexedDB'den cek ve karsilastir
  - [x] 1.2 getAdaSummaryMetrics(adaId) — tek ada icin ozet metrik paketi (yatirim, MRR, ROI, breakEven, penetrasyon, kalite)
  - [x] 1.3 optimizeBudget(budget, adaMetrics) — greedy ROI sirali butce optimizasyonu
  - [x] 1.4 rankByMetric(adaMetrics, metricKey, ascending) — siralama yardimcisi

- [x] Task 2: Panels.js — Bolgesel karsilastirma UI (AC: #1, #2, #3)
  - [x] 2.1 Yonetim sekmesinde "Bolgesel Analiz" alt bolumu
  - [x] 2.2 "Bolge Karsilastir" butonu → karsilastirma modal
  - [x] 2.3 buildRegionalComparisonHTML(data) — tablo olusturma (siralama destekli)
  - [x] 2.4 Butce limit input + "Optimize Et" butonu
  - [x] 2.5 Optimizasyon sonuc paneli (secilen adalar, toplam butce, toplam ROI)
  - [x] 2.6 Modal kapatma: X, overlay click, Escape

- [x] Task 3: Testler
  - [x] 3.1 compareRegions testleri (bos, tek ada, coklu ada)
  - [x] 3.2 optimizeBudget testleri (butce yeterli, yetersiz, tam sinir)
  - [x] 3.3 rankByMetric testleri (artan, azalan siralama)

## Dev Notes

### Bagimliliklar

- **Story 6.1 ZORUNLU** — MarketingDataHouse modulu ve scenarios store 6.1'de olusturuluyor
- Financial.getTotalInvestment(), calculateMRR(), calculateROI() fonksiyonlarini kullanir
- ReviewEngine.evaluate() ile kalite skoru alinir
- IndexedDB scenarios store'undan coklu ada verisi cekilir

### Hesaplama Mantigi

```
compareRegions():
  1. IndexedDB'den tum adas store kayitlarini cek
  2. Her ada icin getAdaSummaryMetrics(adaId):
     - totalInvestment = Financial.getTotalInvestment(ada)
     - mrr = Financial.calculateMRR(ada).mrr
     - roi = Financial.calculateROI(ada).roiPercent
     - breakEven = Financial.calculateROI(ada).breakEvenMonth
     - penetration = ada.topology.defaultPenetrationRate
     - qualityScore = ReviewEngine.evaluate(ada).overall
     - buildingCount = ada.buildings.length
     - totalBB = toplam bagimsiz bolum
  3. Return { columns: [...adaMetrics], sortable: true }

optimizeBudget(budget, adaMetrics):
  1. ROI'ye gore azalan sirala
  2. Greedy secim: en yuksek ROI'li adayi sec, butceden dus
  3. Butce yetmeyene kadar devam et
  4. Return {
       selected: [...secilen adalar],
       totalCost: toplam yatirim,
       totalMRR: toplam aylik gelir,
       combinedROI: agirlikli ortalama ROI,
       remainingBudget: kalan butce
     }
```

### UI Yapisi

Mevcut Epic 4 karsilastirma tablosu CSS kaliplari yeniden kullanilir:
- `fp-comparison-overlay`, `fp-comparison-modal`, `fp-cmp-table`
- Satirlarda metrikler, sutunlarda adalar
- Sticky column: metrik baslik kolonu sabit
- En iyi ROI'li ada: `fp-cmp-col-optimum` stili ile vurgulu

Butce optimizasyonu bolumu:
```html
<div class="fp-budget-optimizer">
  <div class="fp-budget-input">
    <label>Butce Limiti (TL):</label>
    <input type="number" id="fp-budget-limit" min="0" step="1000">
    <button class="fp-btn fp-btn-sm" id="fp-budget-optimize">OPTIMIZE ET</button>
  </div>
  <div id="fp-budget-result" style="display:none">
    <!-- Secilen adalar + toplam ROI ozeti -->
  </div>
</div>
```

### Siralama Mekanizmasi

```javascript
// Tablo basliklarina tiklandiginda siralama
function handleRegionalSort(metricKey) {
  var sorted = rankByMetric(_currentRegionalData, metricKey, _sortAscending);
  _sortAscending = !_sortAscending; // Toggle
  rebuildRegionalTable(sorted);
}
```

- Her sutun basligina tiklanabilir (cursor: pointer)
- Aktif siralama sutunu gorsel isaretle (ok ikonu ↑↓)
- Varsayilan siralama: ROI azalan

### Mimari Kisitlamalar

- IIFE pattern — MarketingDataHouse modulune fonksiyon ekleme (public API genisletme)
- Coklu ada verisi: IndexedDB transaction ile toplu okuma (Storage.loadAll veya benzeri)
- Performans: 500+ ada icin siralama O(n log n) yeterli
- Error boundary: ada bazinda — bir ada verisi eksikse atlayip devam et

### Project Structure Notes

- Degisecek dosyalar: marketing-data-house.js (6.1'de olusturulan), panels.js
- Yeni dosya yok — mevcut modullere fonksiyon ekleme
- Test dosyasi: test/test-marketing-data-house.html'e yeni suite ekleme

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 6, Story 6.2]
- [Source: _bmad-output/planning-artifacts/architecture.md — Pazarlama Data House notu, line 607-608]
- [Source: fiber-chrome/lib/financial.js — getTotalInvestment, calculateMRR, calculateROI]
- [Source: fiber-chrome/lib/review-engine.js — evaluate() kalite skoru]
- [Source: fiber-chrome/lib/variation.js — getComparisonData pattern]
- [Source: _bmad-output/implementation-artifacts/5-6-taahut-senaryo-karsilastirma.md — karsilastirma tablo kaliplari]
- [Source: _bmad-output/implementation-artifacts/6-1-senaryo-verisi-saklama-ve-disa-aktarma.md — MarketingDataHouse modul yapisi]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

N/A

### Completion Notes List

- Task 1: MarketingDataHouse modulune 4 yeni fonksiyon eklendi:
  - `getAdaSummaryMetrics(ada)` — Financial.getTotalInvestment, calculateMRR, calculateROI + ReviewEngine.reviewAda ile ozet metrik paketi. Type guard ile bagimliliklari korur.
  - `compareRegions()` — Topology.PROJECT.adas uzerinden tum adalarin metriklerini toplar, varsayilan ROI azalan siralama.
  - `optimizeBudget(budget, adaMetrics)` — Greedy knapsack: ROI azalan sirali adalari butce dahilinde secer. combinedROI = 36 aylik projeksiyon bazli.
  - `rankByMetric(adaMetrics, metricKey, ascending)` — null/undefined degerleri sona atan genel siralama fonksiyonu. Orijinal diziyi bozmaz (slice ile kopya).
- Task 2: Panels.js'e bolgesel karsilastirma UI eklendi:
  - Senaryo panelinde "BOLGE KARSILASTIR" butonu
  - `openRegionalComparisonModal()` — fp-comparison-overlay/modal CSS kaliplarini yeniden kullanan modal
  - `_buildRegionalTableHTML(data)` — 10 metrikli tablo, min/max renklendirme (fp-cmp-good/bad), tiklanabilir baslik ile siralama
  - `_renderBudgetResult(result, budget)` — Optimizasyon sonuc paneli: secilen adalar, toplam ROI, kalan butce
  - Modal kapatma: X butonu, overlay click, Escape key
  - CSS: fp-budget-optimizer, fp-regional-table, fp-budget-summary stilleri overlay.css'e eklendi
- Task 3: test-marketing-data-house.html'e 4 yeni test grubu eklendi (Group 11-14):
  - getAdaSummaryMetrics: bina sayisi, BB, penetrasyon, bos ada null donusu
  - compareRegions: dizi yapisi, sortable flag, alan varligi
  - rankByMetric: azalan/artan siralama, null handling, bos dizi
  - optimizeBudget: yeterli butce, sinirli butce (greedy secim), yetersiz butce, sifir butce, bos metrik

### Change Log

- 2026-03-02: Story 6.2 implementasyonu — MarketingDataHouse bolgesel analiz, Panels.js karsilastirma modal, butce optimizer, testler.

### File List

- fiber-chrome/lib/marketing-data-house.js (DEGISTI — 4 yeni fonksiyon: getAdaSummaryMetrics, compareRegions, optimizeBudget, rankByMetric)
- fiber-chrome/content/panels.js (DEGISTI — BOLGE KARSILASTIR butonu + openRegionalComparisonModal + tablo + butce optimizer)
- fiber-chrome/styles/overlay.css (DEGISTI — fp-budget-optimizer, fp-regional-table CSS)
- fiber-chrome/dashboard/test-marketing-data-house.html (DEGISTI — 4 yeni test grubu: Group 11-14)
