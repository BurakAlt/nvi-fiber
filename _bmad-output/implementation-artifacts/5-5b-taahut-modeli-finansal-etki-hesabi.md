# Story 5.5b: Taahut Modeli Finansal Etki Hesabi

Status: review

## Story

As a saha muhendisi,
I want tanimlanan taahut modellerinin MRR ve ROI uzerindeki etkisini gorebilmek,
So that hangi taahut yapisinin finansal olarak en avantajli oldugunu anlayabileyim.

## Acceptance Criteria

1. **AC1 — Taahut MRR Etkisi (FR38, FR39):**
   Given taahut modeli tanimlandiginda
   When MRR/ROI hesabi yapildiginda
   Then taahut modelinin MRR uzerindeki etkisi gosterilmeli:
   - Taahutlu abone MRR'i (indirimli fiyat x abone)
   - Taahutsuz abone MRR'i (tam fiyat x abone)
   - Toplam MRR = taahutlu MRR + taahutsuz MRR
   And taahut karsilama maliyeti hesaplanmali: kampanya suresi boyunca indirim farki toplami

2. **AC2 — Kampanya Finansal Etkisi:**
   Given kampanya parametreleri uygulandiginda
   When finansal etki hesaplandiginda
   Then kampanyanin toplam maliyeti gosterilmeli:
   - Ucretsiz modem maliyeti (varsa)
   - Kurulum muafiyet maliyeti (varsa)
   - Indirim farki toplami (kampanya suresi x indirim tutari x abone sayisi)
   And net gelir = brut gelir - kampanya maliyeti olarak hesaplanmali

3. **AC3 — UI Gosterimi:**
   Given kullanici taahut etkisini incelediginde
   When MRR/ROI paneli goruntulediginde
   Then aktif model secimi yapilabilmeli
   And taahutlu vs taahutsuz MRR dagilimi gosterilmeli
   And kampanya maliyetinin ROI'ye etkisi gorsel olarak belirtilmeli

## Tasks / Subtasks

- [x] Task 1: Financial.js — calculateCommitmentImpact (AC: #1)
  - [x] 1.1 calculateCommitmentImpact(ada, model) fonksiyonu
  - [x] 1.2 Model bazli MRR hesabi (model.monthlyPrice x subscribers)
  - [x] 1.3 Indirim farki maliyeti (ARPU - monthlyPrice) x subscribers x durationMonths
  - [x] 1.4 Churn-adjusted net abone projeksiyonu

- [x] Task 2: Financial.js — calculateCampaignCost (AC: #2)
  - [x] 2.1 calculateCampaignCost(ada) fonksiyonu
  - [x] 2.2 Ucretsiz modem maliyeti, kurulum muafiyeti, indirim toplami
  - [x] 2.3 getDetailedInvestment campaign.total entegrasyonu

- [x] Task 3: Financial.js — MRR/ROI entegrasyonu (AC: #1, #2)
  - [x] 3.1 financialConfig.activeCommitmentId + activeCampaignId
  - [x] 3.2 calculateMRR aktif model fiyati ile hesaplama
  - [x] 3.3 calculateROI kampanya maliyeti ve churn entegrasyonu
  - [x] 3.4 Topology.js financialConfig backward compat

- [x] Task 4: Panels.js — UI guncelleme (AC: #3)
  - [x] 4.1 Aktif model secim dropdown
  - [x] 4.2 Taahut etki ozeti (MRR karsilastirma, indirim maliyeti)
  - [x] 4.3 Kampanya maliyet gosterimi

- [x] Task 5: CSS stilleri
  - [x] 5.1 Taahut etki ozeti stilleri

- [x] Task 6: Testler
  - [x] 6.1 calculateCommitmentImpact testleri
  - [x] 6.2 calculateCampaignCost testleri
  - [x] 6.3 MRR/ROI aktif model entegrasyon testleri

## Dev Notes

### Hesaplama Mantigi

```
# Commitment Impact
modelMRR = effectiveSubscribers * model.monthlyPrice
baseMRR = effectiveSubscribers * ARPU (tam fiyat)
discountCostTotal = (ARPU - model.monthlyPrice) * effectiveSubscribers * durationMonths
monthlyChurnLoss = subscribers * (churnRate / 100)

# Campaign Cost
freeModemCost = freeModem ? effectiveSubscribers * modemUnitPrice : 0
freeInstallCost = freeInstall ? effectiveSubscribers * DEFAULT_INSTALL_FEE : 0
discountAmount = discountType === 'percent'
  ? activeMonthlyPrice * (discountValue/100)
  : discountValue
discountCost = discountAmount * effectiveSubscribers * campaign.durationMonths
totalCampaignCost = freeModemCost + freeInstallCost + discountCost
```

### Aktif Model Secimi

```javascript
ada.topology.financialConfig = {
  arpu: 200,
  activeCommitmentId: null,    // CM-001 veya null (ARPU kullan)
  activeCampaignId: null       // CMP-001 veya null (kampanya yok)
};
```

- activeCommitmentId set ise → calculateMRR model.monthlyPrice kullanir
- activeCampaignId set ise → campaign cost toplam yatirim eklenir
- Her ikisi de null ise → mevcut davranis korunur (backward compat)

### DEFAULT_INSTALL_FEE

```javascript
var DEFAULT_INSTALL_FEE = 500; // TL — varsayilan kurulum ucreti
```

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- 20/20 test PASS (Suite 29-31: calculateCommitmentImpact, calculateCampaignCost, MRR/ROI aktif model)
- Syntax check: financial.js OK, topology.js OK, panels.js OK

### Completion Notes List

- calculateCommitmentImpact: model bazli MRR, indirim maliyeti, churn projeksiyonu hesaplar
- calculateCampaignCost: aktif kampanya ucretsiz modem/kurulum/indirim maliyet hesabi
- setActiveCommitment/setActiveCampaign: aktif model secimi ve fiberplan-financial-changed event dispatch
- calculateMRR: aktif model varsa model.monthlyPrice kullanir, baseMRR doner
- calculateROI: kampanya maliyeti totalInvestment'a eklenir, churn aylik abone azaltir
- getDetailedInvestment: campaign.total artik gercek calculateCampaignCost() sonucu
- UI: aktif model/kampanya dropdown, taahut etki ozeti, kampanya maliyet gosterimi

### Change Log

- financial.js: +calculateCommitmentImpact, +calculateCampaignCost, +setActiveCommitment, +setActiveCampaign, ~ensureFinancialConfig, ~calculateMRR, ~calculateROI, ~getDetailedInvestment
- topology.js: ~createAda (financialConfig activeCommitmentId/activeCampaignId), ~loadState (backward compat)
- panels.js: ~renderMrrSection (aktif model dropdown, etki ozeti, kampanya maliyet)
- overlay.css: +fp-impact-summary, +fp-impact-campaign, +fp-impact-row, +fp-impact-total stilleri
- test-financial.html: +Suite 29-31 (20 test)

### File List

| File | Action | Description |
|------|--------|-------------|
| fiber-chrome/lib/financial.js | Modified | calculateCommitmentImpact, calculateCampaignCost, setActiveCommitment, setActiveCampaign, MRR/ROI entegrasyonu |
| fiber-chrome/lib/topology.js | Modified | createAda financialConfig + loadState backward compat |
| fiber-chrome/content/panels.js | Modified | renderMrrSection aktif model/kampanya UI |
| fiber-chrome/styles/overlay.css | Modified | Impact summary CSS stilleri |
| fiber-chrome/dashboard/test-financial.html | Modified | Suite 29-31 (20 test) |
