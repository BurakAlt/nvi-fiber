# Story 5.5a: Taahut ve Kampanya Model Tanimlama

Status: review

## Story

As a saha muhendisi,
I want farkli taahut sureli abonelik modelleri ve kampanya parametreleri tanimlayabilmek,
So that farkli pazarlama stratejilerini sisteme girebilir ve analiz icin hazir hale getirebilirim.

## Acceptance Criteria

1. **AC1 — Taahut Modeli Tanimlama (FR35):**
   Given kullanici taahut modeli tanimlamak istediginde
   When taahutlu model olusturduGunda
   Then asagidaki parametreler tanimlanabilir olmali:
   - Taahut suresi (ay cinsinden: 12, 24, 36)
   - Taahutlu indirimli fiyat (orn: normal 299 TL → taahutlu 199 TL)
   - Erken iptal cezasi (kalan ay x birim ceza)
   And model kayit edilebilmeli ve isimlendirilebilmeli

2. **AC2 — Taahutsuz Model Tanimlama (FR36):**
   Given kullanici taahutsuz model tanimlamak istediginde
   When taahutsuz model olusturduGunda
   Then taahutsuz abonelik fiyati tanimlanabilir olmali
   And aylik churn orani (abone kaybi) tanimlanabilir olmali
   And taahutsuz modelde indirim uygulanmamali

3. **AC3 — Kampanya Parametreleri Tanimlama (FR37):**
   Given kullanici kampanya parametreleri tanimlamak istediginde
   When kampanya olusturduGunda
   Then asagidaki parametreler tanimlanabilir olmali:
   - Kampanya suresi (ay)
   - Indirim orani veya sabit indirim tutari
   - Ucretsiz modem dahil mi (evet/hayir)
   - Kurulum ucreti muafiyeti (evet/hayir)

4. **AC4 — Model CRUD Islemleri:**
   Given kullanici modelleri yonetmek istediginde
   When ekleme/duzenleme/silme yaptiginda
   Then islemler basarili sekilde gerceklesmeli
   And ilgili event dispatch edilmeli

## Tasks / Subtasks

- [x] Task 1: Financial.js — Taahut Modeli CRUD (AC: #1, #2, #4)
  - [x] 1.1 CommitmentModel ID sayaci ve veri yapisi
  - [x] 1.2 addCommitmentModel(ada, model) — yeni taahut modeli ekle
  - [x] 1.3 updateCommitmentModel(ada, modelId, changes) — model guncelle
  - [x] 1.4 removeCommitmentModel(ada, modelId) — model sil
  - [x] 1.5 getCommitmentModels(ada) — model listesi
  - [x] 1.6 DEFAULT_COMMITMENTS sabitleri (12/24/36 ay presetleri)

- [x] Task 2: Financial.js — Kampanya CRUD (AC: #3, #4)
  - [x] 2.1 Campaign ID sayaci ve veri yapisi
  - [x] 2.2 addCampaign(ada, campaign) — yeni kampanya ekle
  - [x] 2.3 updateCampaign(ada, campaignId, changes) — kampanya guncelle
  - [x] 2.4 removeCampaign(ada, campaignId) — kampanya sil
  - [x] 2.5 getCampaigns(ada) — kampanya listesi

- [x] Task 3: Topology.js — Veri init ve backward compat (AC: #1, #2, #3)
  - [x] 3.1 createAda() commitmentModels ve campaigns init
  - [x] 3.2 loadState() backward compatibility guard

- [x] Task 4: Panels.js — Taahut/Kampanya UI (AC: #1, #2, #3, #4)
  - [x] 4.1 Taahut modeli form (ad, sure, fiyat, ceza, churn)
  - [x] 4.2 Kampanya form (ad, sure, indirim, modem, kurulum)
  - [x] 4.3 Model/kampanya listeleme, duzenleme, silme UI
  - [x] 4.4 Preset butonlari (12/24/36 ay hizli ekleme)

- [x] Task 5: CSS stilleri
  - [x] 5.1 Model ve kampanya form stilleri
  - [x] 5.2 Model listesi ve aksiyon butonlari

- [x] Task 6: Testler
  - [x] 6.1 Commitment model CRUD testleri
  - [x] 6.2 Campaign CRUD testleri
  - [x] 6.3 Taahutsuz model validasyonu
  - [x] 6.4 Event dispatch testleri

## Dev Notes

### Veri Yapisi

```javascript
// Taahut modeli
ada.topology.commitmentModels = [
  {
    id: 'CM-001',
    name: '24 Ay Taahut',
    type: 'committed',          // 'committed' | 'noCommitment'
    durationMonths: 24,         // taahut suresi
    monthlyPrice: 199,          // aylik abonelik fiyati (taahutlu indirimli)
    earlyTermFee: 50,           // erken iptal ceza birim ucreti (kalan ay x bu deger)
    churnRate: 2                // aylik churn % (taahutlu dusuk, taahutsuz yuksek)
  }
];

// Kampanya
ada.topology.campaigns = [
  {
    id: 'CMP-001',
    name: 'Yaz Kampanyasi',
    durationMonths: 3,          // kampanya suresi
    discountType: 'percent',    // 'percent' | 'fixed'
    discountValue: 25,          // %25 veya 50 TL
    freeModem: true,            // ucretsiz modem
    freeInstall: true           // kurulum ucreti muaf
  }
];
```

### Varsayilan Presetler

```javascript
DEFAULT_COMMITMENTS = {
  '12ay': { name: '12 Ay Taahut', type: 'committed', durationMonths: 12, monthlyPrice: 249, earlyTermFee: 100, churnRate: 3 },
  '24ay': { name: '24 Ay Taahut', type: 'committed', durationMonths: 24, monthlyPrice: 199, earlyTermFee: 75, churnRate: 2 },
  '36ay': { name: '36 Ay Taahut', type: 'committed', durationMonths: 36, monthlyPrice: 149, earlyTermFee: 50, churnRate: 1 },
  'taahutsuz': { name: 'Taahutsuz', type: 'noCommitment', durationMonths: 0, monthlyPrice: 299, earlyTermFee: 0, churnRate: 5 }
};
```

### Notlar

- Bu story sadece model tanimlama (CRUD) icerir, finansal hesaplama Story 5.5b'de
- commitmentModels ve campaigns dizileri topology.* altinda saklanir
- Mevcut storage altyapisi (auto-save) ile otomatik persist olur
- getDetailedInvestment().campaign.total su an 0 placeholder — 5.5b'de doldurulacak

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Test runner: Node.js vm.runInThisContext() ile 26/26 test PASS
- Syntax check: financial.js, topology.js, panels.js — hepsi OK

### Completion Notes List

- CommitmentModel CRUD: add/update/remove/get + addFromPreset
- Campaign CRUD: add/update/remove/get
- DEFAULT_COMMITMENTS: 12ay, 24ay, 36ay, taahutsuz presetleri
- Taahutsuz model constraint: durationMonths=0, earlyTermFee=0 otomatik
- Kampanya: percent/fixed indirim tipi, freeModem, freeInstall boolean
- Yuzdelik indirim max %100 clamp
- UI: preset butonlari, model/kampanya listesi, form overlay, edit/delete
- Events: fiberplan-commitment-changed, fiberplan-campaign-changed

### Change Log

| Tarih | Degisiklik |
|-------|-----------|
| 2026-03-01 | Task 1-2: Financial.js commitment + campaign CRUD fonksiyonlari |
| 2026-03-01 | Task 3: Topology.js commitmentModels/campaigns init + backward compat |
| 2026-03-01 | Task 4: Panels.js renderCommitmentSection + form overlays |
| 2026-03-01 | Task 5: overlay.css commitment/campaign stilleri |
| 2026-03-01 | Task 6: 7 test suite, 26 test — hepsi PASS |

### File List

| File | Action | Description |
|------|--------|-------------|
| fiber-chrome/lib/financial.js | Modified | CommitmentModel CRUD, Campaign CRUD, DEFAULT_COMMITMENTS presets |
| fiber-chrome/lib/topology.js | Modified | createAda() commitmentModels/campaigns init, loadState() backward compat |
| fiber-chrome/content/panels.js | Modified | renderCommitmentSection, showCommitmentForm, showCampaignForm |
| fiber-chrome/styles/overlay.css | Modified | Commitment/campaign section stilleri |
| fiber-chrome/dashboard/test-financial.html | Modified | Suite 22-28: commitment + campaign CRUD testleri |
