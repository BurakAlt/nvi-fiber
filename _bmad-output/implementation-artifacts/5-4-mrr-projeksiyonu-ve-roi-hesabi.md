# Story 5.4: MRR Projeksiyonu ve ROI Hesabi

Status: done

## Story

As a saha muhendisi,
I want aylik tekrarlayan gelir (MRR) projeksiyonu ve yatirim geri donus (ROI) hesabini gorebilmek,
So that yatirimin ne zaman kendini amorte edecegini ve karlilik durumunu bilebilirim.

## Acceptance Criteria

1. **AC1 — MRR Hesabi (FR24):**
   Given toplam yatirim maliyeti ve abone projeksiyonu hazir oldugunda
   When MRR hesabi yapildiginda
   Then efektif abone x ARPU = MRR hesaplanmali
   And 12/24/36 aylik projeksiyon tablosu gosterilmeli

2. **AC2 — ROI Hesabi (FR25):**
   Given MRR ve toplam yatirim hesaplandiginda
   When ROI hesabi yapildiginda
   Then break-even noktasi (kumulatif gelir >= toplam yatirim) hesaplanmali
   And ROI% = ((kumulatif gelir - toplam yatirim) / toplam yatirim) x 100

3. **AC3 — Tek Ekran Goruntuleme (FR26):**
   Given kullanici MRR/ROI sonuclarini incelemek istediginde
   When finansal ozet gorunumune gectiginde
   Then ozet metrikler (MRR, ROI%, break-even ay, toplam yatirim) one cikan kutucuklarda gosterilmeli
   And aylik projeksiyon tablosu gosterilmeli

4. **AC4 — Anlik Guncelleme:**
   Given penetrasyon orani veya ARPU degistirildiginde
   When parametre kaydedildiginde
   Then MRR ve ROI aninda yeniden hesaplanmali

## Tasks / Subtasks

- [x] Task 1: Financial.js MRR/ROI fonksiyonlari (AC: #1, #2, #4)
  - [x] 1.1 DEFAULT_ARPU sabiti ve setARPU(ada, arpu) fonksiyonu
  - [x] 1.2 calculateMRR(ada) — efektif abone x ARPU
  - [x] 1.3 calculateROI(ada, months) — aylik projeksiyon + break-even + ROI%
  - [x] 1.4 getFinancialSummary(ada) — tum metrikleri tek objede topla

- [x] Task 2: Topology.js entegrasyonu (AC: #4)
  - [x] 2.1 createAda() icinde financialConfig init (arpu)
  - [x] 2.2 loadState() backward compatibility guard

- [x] Task 3: Panels.js MRR/ROI UI (AC: #1, #2, #3)
  - [x] 3.1 Equipment paneline MRR/ROI bolumu ekle
  - [x] 3.2 ARPU input alani
  - [x] 3.3 Ozet metrik kutucuklari (MRR, break-even, ROI%)
  - [x] 3.4 Aylik projeksiyon tablosu (12/24/36 ay)

- [x] Task 4: CSS stilleri
  - [x] 4.1 Metrik kutucuklari
  - [x] 4.2 Projeksiyon tablosu

- [x] Task 5: Testler
  - [x] 5.1 calculateMRR testleri
  - [x] 5.2 calculateROI testleri (break-even, ROI%)
  - [x] 5.3 ARPU degisiminde yeniden hesaplama testi

## Dev Notes

### Veri Yapisi

```javascript
ada.topology.financialConfig = {
  arpu: 200  // TL — varsayilan ARPU (Average Revenue Per User)
};
```

### MRR Hesaplama

```
effectiveSubscribers = sum(ceil(bina.bb * penetrasyon)) — her bina icin
MRR = effectiveSubscribers * ARPU
Yillik Gelir = MRR * 12
```

### ROI Hesaplama

```
Kumulatif Gelir(ay N) = MRR * N
Break-even = ilk N ki: MRR * N >= totalInvestment
ROI%(ay N) = ((MRR * N - totalInvestment) / totalInvestment) * 100
```

### Projeksiyon Tablosu

| Ay | Kumulatif Gelir | Toplam Yatirim | Net Kar/Zarar | ROI% |
|----|-----------------|----------------|---------------|------|
| 1  | MRR*1           | totalInv       | MRR*1-totalInv| ...  |
| 12 | MRR*12          | totalInv       | MRR*12-totalInv| ... |
| 24 | MRR*24          | totalInv       | ...           | ...  |
| 36 | MRR*36          | totalInv       | ...           | ...  |

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Test runner: Node.js vm.runInThisContext() ile 17/17 test PASS
- Syntax check: financial.js, topology.js, panels.js, overlay.css — hepsi OK

### Completion Notes List

- DEFAULT_ARPU = 200 TL sabiti, ada bazinda degistirilebilir
- calculateMRR: her bina icin Math.ceil(bb * penetration) ile efektif abone hesabi
- calculateROI: 36 aylik projeksiyon, break-even noktasi, ROI% hesabi
- getFinancialSummary: tum finansal metrikleri tek objede toplayan fonksiyon
- UI: 4 metrik karti (MRR, Efektif Abone, Break-Even, ROI%) + projeksiyon tablosu
- Break-even satiri tabloda yesil vurgu ile isaretleniyor
- ARPU degisiminde CustomEvent('fiberplan-financial-changed') dispatch ediliyor

### Change Log

| Tarih | Degisiklik |
|-------|-----------|
| 2026-03-01 | Task 1: Financial.js MRR/ROI fonksiyonlari eklendi |
| 2026-03-01 | Task 2: Topology.js financialConfig init + backward compat |
| 2026-03-01 | Task 3: Panels.js MRR/ROI UI (metrik kartlari + projeksiyon tablosu) |
| 2026-03-01 | Task 4: overlay.css MRR/ROI stilleri |
| 2026-03-01 | Task 5: 4 test suite, 17 test — hepsi PASS |

### File List

| File | Action | Description |
|------|--------|-------------|
| fiber-chrome/lib/financial.js | Modified | DEFAULT_ARPU, setARPU, calculateMRR, calculateROI, getFinancialSummary eklendi |
| fiber-chrome/lib/topology.js | Modified | createAda() financialConfig init, loadState() backward compat |
| fiber-chrome/content/panels.js | Modified | renderMrrSection: ARPU input, metrik kartlari, projeksiyon tablosu |
| fiber-chrome/styles/overlay.css | Modified | MRR/ROI stilleri (grid, kartlar, tablo, breakeven vurgu) |
| fiber-chrome/dashboard/test-financial.html | Modified | Suite 18-21: setARPU, calculateMRR, calculateROI, getFinancialSummary testleri |
