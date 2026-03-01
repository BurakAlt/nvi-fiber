# Story 5.6: Taahut Senaryo Karsilastirma

Status: review

## Story

As a saha muhendisi,
I want birden fazla taahut senaryosunu yan yana karsilastirabilmek,
So that en karli pazarlama stratejisini veriye dayali olarak secebilirim.

## Acceptance Criteria

1. **AC1 — Yan Yana Karsilastirma Tablosu (FR40):**
   Given en az 2 taahut modeli tanimlandiginda
   When kullanici "Taahut Karsilastir" islemini baslattiginda
   Then yan yana karsilastirma tablosu acilmali
   And sutunlarda taahut senaryolari, satirlarda metrikler olmali

2. **AC2 — Metrik Gosterimi:**
   Given karsilastirma tablosu gosterildiginde
   When metrikler goruntulendikten
   Then asagidaki metrikler her senaryo icin gosterilmeli:
   - Taahut suresi ve fiyatlandirma
   - Aylik MRR (model fiyati x abone)
   - Yillik gelir projeksiyonu
   - Taahut karsilama maliyeti (indirim farki toplami)
   - Net gelir (gelir - karsilama maliyeti)
   - ROI ve break-even suresi
   - Churn orani ve abone kaybi etkisi
   And en yuksek net gelirli senaryo vurgulanmali

3. **AC3 — Aktif Model Secimi:**
   Given kullanici karsilastirma sonrasi bir senaryoyu sectiginde
   When "Aktif Model Yap" islemini onayladiginda
   Then secilen taahut modeli adanin aktif finansal modeli olmali
   And MRR/ROI hesaplari secilen modele gore guncellenmeli

4. **AC4 — Yatay Scroll ve Sticky Column:**
   Given kullanici 3+ taahut senaryosu karsilastirdiginda
   When tablo goruntulendikten
   Then yatay scroll ile tum senaryolar goruntulenebilmeli
   And metrik satir basliklari sabit kalmali (sticky column)

## Tasks / Subtasks

- [x] Task 1: Financial.js — compareCommitmentScenarios (AC: #1, #2)
  - [x] 1.1 compareCommitmentScenarios(ada) fonksiyonu
  - [x] 1.2 Her model icin calculateCommitmentImpact + calculateROI metrikleri
  - [x] 1.3 En yuksek net gelirli model isaretleme (bestModelId)
  - [x] 1.4 minMax hesabi (karsilastirma renklendirme)

- [x] Task 2: Panels.js — Karsilastirma butonu ve modal (AC: #1, #3, #4)
  - [x] 2.1 renderCommitmentSection icinde "TAAHUT KARSILASTIR" butonu
  - [x] 2.2 openCommitmentComparisonModal fonksiyonu
  - [x] 2.3 buildCommitmentComparisonHTML — tablo HTML
  - [x] 2.4 "Aktif Model Yap" butonu ve event handler
  - [x] 2.5 Modal kapatma (close, overlay click, Escape)

- [x] Task 3: CSS stilleri (AC: #4)
  - [x] 3.1 Commitment comparison stiller (mevcut fp-cmp-* yeniden kullanimi)

- [x] Task 4: Testler
  - [x] 4.1 compareCommitmentScenarios testleri
  - [x] 4.2 bestModelId ve minMax dogrulama

## Dev Notes

### Hesaplama Mantigi

```
compareCommitmentScenarios(ada):
  for each model in ada.topology.commitmentModels:
    impact = calculateCommitmentImpact(ada, model)
    roi = calculateROI icin gecici activeCommitmentId set
    column = {
      modelId, modelName, modelType, monthlyPrice,
      durationMonths, churnRate,
      mrr, yearlyRevenue, baseMRR,
      discountCostTotal, netRevenue12,
      breakEvenMonth, roiPercent36
    }
  bestModelId = max netRevenue12
  minMax = her metrik icin min/max (renklendirme icin)
```

### UI Kaliplari

- Epic 4 karsilastirma tablosu ayni CSS kullanilir (fp-comparison-overlay, fp-comparison-modal, fp-cmp-table)
- Sticky column: metrik baslik kolonu sabit (fp-cmp-label-col)
- En iyi model vurgusu: fp-cmp-col-optimum stili
- "Aktif Model Yap" butonu: Financial.setActiveCommitment(ada, modelId)

### Onemli

- Hesaplama sirasinda orijinal activeCommitmentId korunmali (gecici set, sonra restore)
- En az 2 model yoksa karsilastirma butonu gosterilmemeli
- Modal kapatma: X butonu, overlay click, Escape key

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- 8/8 test PASS (Suite 32: compareCommitmentScenarios)
- Syntax check: financial.js OK, panels.js OK

### Completion Notes List

- compareCommitmentScenarios: tum taahut modellerini yan yana karsilastirir, her biri icin gecici activeCommitmentId set edip ROI hesaplar, sonra orijinali restore eder
- bestModelId: en yuksek 12-aylik net gelirli model otomatik isaretlenir
- minMax: her metrik icin min/max hesabi — en iyi/kotu degerler yesil/kirmizi renklenir
- UI: Epic 4 karsilastirma modal kaliplari yeniden kullanildi (fp-comparison-overlay, fp-cmp-table)
- "TAAHUT KARSILASTIR" butonu en az 2 model varken gosterilir
- "Aktif Model Yap" butonu Financial.setActiveCommitment cagirir ve MRR/ROI gunceller
- Modal kapatma: X, overlay click, Escape key

### Change Log

- financial.js: +compareCommitmentScenarios
- panels.js: +openCommitmentComparisonModal, +buildCommitmentComparisonHTML, +getCmCompareColorClass, +formatCmMetricValue, ~renderCommitmentSection (karsilastirma butonu)
- test-financial.html: +Suite 32 (8 test)

### File List

| File | Action | Description |
|------|--------|-------------|
| fiber-chrome/lib/financial.js | Modified | compareCommitmentScenarios fonksiyonu eklendi |
| fiber-chrome/content/panels.js | Modified | Commitment comparison modal + buton + yardimci fonksiyonlar |
| fiber-chrome/dashboard/test-financial.html | Modified | Suite 32 (8 test) |
