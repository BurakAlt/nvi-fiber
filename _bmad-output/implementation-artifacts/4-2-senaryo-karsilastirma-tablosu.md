# Story 4.2: Senaryo Karsilastirma Tablosu

Status: done

## Story

As a saha muhendisi,
I want en az 3 varyasyonu yan yana karsilastirabilmek,
So that farkli senaryolarin maliyet, kapasite ve kalite farklarini net gorebilir ve bilingli karar verebilirim.

## Acceptance Criteria

1. **AC1 — Karsilastirma Tablosu Acilmasi (FR22):**
   Given bir ada icin en az 2 varyasyon mevcutken
   When kullanici "Karsilastir" islemini baslattiginda
   Then yan yana karsilastirma tablosu acilmali
   And sutunlarda secilen varyasyonlar, satirlarda metrikler olmali

2. **AC2 — Metrik Gosterimi:**
   Given karsilastirma tablosu gosterildiginde
   When metrikler goruntulendikten
   Then asagidaki metrikler her varyasyon icin gosterilmeli:
   - Penetrasyon orani (%)
   - Toplam BB / Efektif BB
   - OLT port sayisi
   - Toplam kablo metraji (backbone + distribution + drop)
   - Splitter dagilimi (1:8 / 1:16 / 1:32 adetleri)
   - Ortalama loss budget (dB)
   - Loss budget durum dagilimi (OK / WARNING / FAIL sayilari)
   - Toplam maliyet (TL)
   - Birim maliyet (TL/BB)
   - Kalite skoru
   And en iyi deger yesil, en kotu deger kirmizi ile vurgulanmali (NFR5)

3. **AC3 — Responsive Tablo Davranisi:**
   Given en az 3 varyasyon secildiginde
   When tablo goruntulendikten
   Then yatay scroll olmadan en az 3 senaryo yan yana gorunmeli
   And 4+ senaryo varsa yatay scroll aktif olmali
   And satir basliklari sabit kalmali (sticky column)

4. **AC4 — Metrik Detay Acilimi:**
   Given kullanici karsilastirma tablosundaki bir metrigi detaylandirmak istediginde
   When metrik satirana tikladiginda
   Then detay acilimi (accordion) ile bina bazli dagilim gosterilmeli

## Tasks / Subtasks

- [x] Task 1: Karsilastirma veri motoru (AC: #1, #2)
  - [x] 1.1 Variation.getComparisonData(variationIds) — secilen varyasyonlarin metrik datasini hesapla
  - [x] 1.2 Metrik hesaplama: penetrasyon, totalBB, effBB, OLT port, kablo metraji, splitter dagilimi
  - [x] 1.3 Metrik hesaplama: loss budget ort/OK/FAIL, toplam maliyet, birim maliyet, kalite skoru
  - [x] 1.4 Min/max deger tespiti (renk kodlama icin) — her metrik satirinda best/worst isaretleme

- [x] Task 2: Karsilastirma tablosu UI (AC: #1, #3)
  - [x] 2.1 Panels.js'de KARSILASTIR butonu (varyasyon panelinde, 2+ varyasyon varsa aktif)
  - [x] 2.2 Modal kart (overlay popup) — tam ekran karsilastirma tablosu
  - [x] 2.3 CSS table yapisi: sticky satir basliklari + yatay scroll (4+ sutun)
  - [x] 2.4 Kapat butonu ve ESC ile kapatma

- [x] Task 3: Metrik satirlari render (AC: #2)
  - [x] 3.1 Metrik satir sablonu: baslik + her varyasyon icin deger hucresi
  - [x] 3.2 Renk kodlama: min deger kirmizi, max deger yesil (maliyet icin ters)
  - [x] 3.3 Sayi formatlama: TL para birimi, dB birimi, yuzde, adet
  - [x] 3.4 Aktif varyasyon sutununda gorsel vurgulama (turuncu border)

- [x] Task 4: Detay accordion (AC: #4)
  - [x] 4.1 Tiklanabilir metrik satirlari (toggle acilimi)
  - [x] 4.2 Loss budget detay: bina bazli loss, status, splitter bilgisi
  - [x] 4.3 Kablo detay: backbone/distribution/drop ayrintili metraji
  - [x] 4.4 Splitter detay: bina bazli splitter ratio dagilimi

- [x] Task 5: Entegrasyon ve test
  - [x] 5.1 Karsilastirma event'leri (fiberplan-comparison-opened/closed)
  - [x] 5.2 test-variation.html'e karsilastirma testleri ekle (Suite 9, 13 test)
  - [x] 5.3 2, 3, 5 varyasyonla gorsel dogrulama (test icinde 2 ve 3 varyasyon testleri)

## Dev Notes

### Bagimlilik: Story 4.1 (variation.js)

Bu story tamamen Story 4.1'de olusturulan Variation modulune bagimlidir:
- `Variation.getVariations(adaId)` — varyasyon listesi
- `Variation.getVariationSummary(v)` — temel metrikler (zaten mevcut)
- `Variation.getActiveVariationId()` — aktif varyasyon isaretleme

### Mevcut getVariationSummary vs Gerekli Metrikler

`getVariationSummary()` su alanlari donduruyor:
```javascript
{ id, name, parameters, totalCost, avgLossBudget, lossBudgetOk, lossBudgetFail, buildingCount, totalBB, updatedAt }
```

Karsilastirma tablosu icin EKSIK metrikler (yeni fonksiyon gerekli):
- **Efektif BB** — penetrasyon orani uygulanmis BB toplami
- **OLT port sayisi** — snapshot.calculations.oltCapacity.requiredPorts
- **Kablo metraji** — snapshot.calculations.cables gruplarina gore (backbone/distribution/drop)
- **Splitter dagilimi** — snapshot.calculations.splitters'dan ratio gruplama (1:8, 1:16, 1:32)
- **Loss budget WARNING sayisi** — mevcut sadece OK/FAIL sayiyor
- **Birim maliyet (TL/BB)** — totalCost / totalBB
- **Kalite skoru** — ReviewEngine.reviewAda() snapshot uzerinde calistirilmali

Bu yuzden yeni bir `getComparisonData(variationIds)` fonksiyonu gerekli.

### Metrik Tanimlari ve Renk Kodlama

```javascript
var COMPARISON_METRICS = [
  // [key, label, unit, higherIsBetter]
  ['penetrationRate', 'Penetrasyon Orani', '%', true],
  ['totalBB', 'Toplam BB', 'adet', true],
  ['effBB', 'Efektif BB', 'adet', true],
  ['oltPorts', 'OLT Port Sayisi', 'port', false],      // az = iyi
  ['cableTotal', 'Toplam Kablo', 'm', false],           // az = iyi
  ['cableBackbone', 'Backbone Kablo', 'm', false],
  ['cableDistribution', 'Distribution Kablo', 'm', false],
  ['cableDrop', 'Drop Kablo', 'm', false],
  ['splitter8', '1:8 Splitter', 'adet', null],          // karsilastirma yok
  ['splitter16', '1:16 Splitter', 'adet', null],
  ['splitter32', '1:32 Splitter', 'adet', null],
  ['avgLoss', 'Ort. Loss Budget', 'dB', false],         // az = iyi
  ['lbOk', 'Loss OK', 'adet', true],
  ['lbWarn', 'Loss WARNING', 'adet', false],
  ['lbFail', 'Loss FAIL', 'adet', false],
  ['totalCost', 'Toplam Maliyet', 'TL', false],         // az = iyi
  ['unitCost', 'Birim Maliyet', 'TL/BB', false],        // az = iyi
  ['qualityScore', 'Kalite Skoru', '/100', true]         // cok = iyi
];
```

Renk kodlama mantigi:
- `higherIsBetter === true` → max deger yesil, min deger kirmizi
- `higherIsBetter === false` → min deger yesil, max deger kirmizi
- `higherIsBetter === null` → renk kodlama yok (bilgi amacli)

### UI Yapisi — Modal Overlay

```
+--------------------------------------------------+
| SENARYO KARSILASTIRMA          [Ada: XXX]    [X] |
+--------------------------------------------------+
|                  | VAR-001     | VAR-002     | VAR-003     |
|                  | %40 Pen.    | %70 Pen.    | %90 Pen.    |
|------------------+-------------+-------------+-------------|
| Penetrasyon      |    40%      |    70%      |    90%      |
| Toplam BB        |    92       |    92       |    92       |
| Efektif BB       |    37       |    64       |    83       |
| OLT Port         |     1       |     1       |     2       |
| ▶ Toplam Kablo   |  1.2 km     |  1.2 km     |  1.2 km     |
|   └ Backbone     |  450 m      |  450 m      |  450 m      |  ← accordion acik
|   └ Distribution |  520 m      |  520 m      |  520 m      |
|   └ Drop         |  230 m      |  230 m      |  230 m      |
| ▶ Splitter Dag.  |  3/2/0      |  4/3/1      |  5/4/2      |
| Ort. Loss Budget |  18.2 dB    |  19.5 dB    |  21.3 dB    |
| Loss OK          |     5       |     4       |     3       |
| Loss FAIL        |     0       |     1       |     2       |
| Toplam Maliyet   | ₺45,200     | ₺52,100     | ₺68,900     |
| Birim Maliyet    | ₺1,222/BB   | ₺814/BB     | ₺830/BB     |
| Kalite Skoru     |  78/100     |  85/100     |  72/100     |
+--------------------------------------------------+
```

### Entegrasyon Noktalari

1. **variation.js** — yeni `getComparisonData(variationIds)` fonksiyonu eklenir
2. **panels.js** — KARSILASTIR butonu + modal render + event handler'lar
3. **review-engine.js** — varyasyon snapshot'i uzerinde `reviewAda()` cagrilabilir (gecici ada objesi ile)
4. **overlay.css** — karsilastirma modal + tablo stilleri

### Performans Notu

- Kalite skoru hesabi (ReviewEngine.reviewAda) agir islem olabilir — her varyasyon icin 6 kategori x N bina
- Karsilastirma verisi bir kez hesaplanir, modal acikken cache'lenir
- 5+ varyasyonda yatay scroll smooth olmali

### Referanslar

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 4, Story 4.2]
- [Source: fiber-chrome/lib/variation.js — getVariationSummary, getVariations]
- [Source: fiber-chrome/lib/pon-engine.js — calculations yapisi]
- [Source: fiber-chrome/lib/review-engine.js — reviewAda(), kalite skoru]
- [Source: fiber-chrome/content/panels.js — Varyasyon paneli UI]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Validation: Explore agent verified all 4 files — 0 issues found

### Completion Notes List

- extractMetrics() fonksiyonu: 17 metrik, ReviewEngine kalite skoru entegrasyonu, accordion detay verileri
- COMPARISON_METRICS dizisi: [key, label, unit, higherIsBetter] formatinda, renk kodlama mantigi
- Modal UI: sticky satir basliklari, yatay scroll, ESC/click-outside kapatma, accordion toggle
- Renk kodlama: higherIsBetter=true → max yesil/min kirmizi, false → ters, null → renk yok
- Sayi formatlama: TL (₺+locale), dB (2 decimal), % (%prefix), m (locale+suffix), /100
- Bina bazli accordion: kablo (backbone/dist/drop), splitter (1:8/16/32), loss budget (per-building loss+status)
- 13 yeni test Suite 9'da (getComparisonData dogrulama)

### Change Log

- 2026-03-01: Tum 5 task implement edildi, validation 100% pass

### File List

| File | Action | Description |
|------|--------|-------------|
| `fiber-chrome/lib/variation.js` | MODIFIED | extractMetrics(), getComparisonData(), COMPARISON_METRICS eklendi |
| `fiber-chrome/content/panels.js` | MODIFIED | KARSILASTIR butonu, openComparisonModal(), buildComparisonHTML(), accordion, format |
| `fiber-chrome/styles/overlay.css` | MODIFIED | Variation panel + Comparison modal CSS (~100 satir) |
| `fiber-chrome/dashboard/test-variation.html` | MODIFIED | Suite 9 karsilastirma testleri (13 test), review-engine.js yukleme |
