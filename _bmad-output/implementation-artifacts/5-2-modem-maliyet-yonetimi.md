# Story 5.2: Modem Maliyet Yonetimi

Status: done

## Story

As a saha muhendisi,
I want modem maliyet politikasini (ucretli/ucretsiz) belirleyebilmek ve modem maliyetlerinin otomatik hesaplanmasini,
So that modem stratejisinin toplam yatirim uzerindeki etkisini gorebilir ve karsilastirebiliyim.

## Acceptance Criteria

1. **AC1 — Modem Politika Belirleme (FR32):**
   Given ada planinda binalar ve BB sayilari belirlendiginde
   When kullanici modem maliyet politikasini ayarlamak istediginde
   Then ada bazinda modem politikasi secilmeli (tumu ucretli / tumu ucretsiz / bina bazli)
   And bina bazli modda her bina icin ucretli/ucretsiz isaretlenebilmeli
   And varsayilan olarak tum modemler "ucretli" isaretli olmali

2. **AC2 — Otomatik Maliyet Hesaplama (FR33):**
   Given modem isaretlemesi yapildiginda
   When maliyet hesabi tetiklendiginde
   Then ucretli modem sayisi x birim fiyat = toplam modem geliri otomatik hesaplanmali
   And ucretsiz modem sayisi ayri gosterilmeli (kampanya maliyeti olarak)
   And hesaplama penetrasyon oranina gore efektif BB bazinda yapilmali

3. **AC3 — Senaryo Karsilastirma (FR34):**
   Given kullanici modem politikasini karsilastirmak istediginde
   When karsilastirma gorunumunu actiginda
   Then ucretli vs ucretsiz modem senaryolari yan yana gosterilmeli
   And toplam modem maliyeti, net yatirim farki ve ROI etkisi gosterilmeli

4. **AC4 — Fiyat Guncelleme:**
   Given modem birim fiyati degistirildiginde
   When fiyat kaydedildiginde
   Then tum modem maliyetleri aninda yeniden hesaplanmali
   And toplam yatirim maliyetine yansiamali

## Tasks / Subtasks

- [x] Task 1: Financial.js modem fonksiyonlari (AC: #1, #2, #4)
  - [x] 1.1 setModemPolicy(ada, policy) — ada bazinda modem politikasi (allPaid/allFree/perBuilding)
  - [x] 1.2 setModemUnitPrice(ada, price) — modem birim fiyat guncelleme
  - [x] 1.3 setBuildingModemFree(ada, buildingId, isFree) — bina bazli ucretli/ucretsiz
  - [x] 1.4 calculateModemCost(ada) — modem maliyet hesaplama (efektif BB bazinda)
  - [x] 1.5 compareModemScenarios(ada) — ucretli vs ucretsiz karsilastirma
  - [x] 1.6 getTotalInvestment() guncelleme — modemCost dahil etme

- [x] Task 2: Topology.js entegrasyonu (AC: #1)
  - [x] 2.1 createAda() icinde modemConfig init
  - [x] 2.2 loadState() backward compatibility guard

- [x] Task 3: Panels.js modem UI (AC: #1, #2, #3, #4)
  - [x] 3.1 Ekipman paneline modem bolumu ekle
  - [x] 3.2 Politika secici (dropdown: Tumu Ucretli / Tumu Ucretsiz / Bina Bazli)
  - [x] 3.3 Modem birim fiyat input
  - [x] 3.4 Bina bazli mod: bina listesi + checkbox
  - [x] 3.5 Modem maliyet ozeti karti
  - [x] 3.6 Senaryo karsilastirma butonu ve goruntuleme

- [x] Task 4: CSS stilleri
  - [x] 4.1 Modem bolumu stilleri
  - [x] 4.2 Karsilastirma tablosu stilleri

- [x] Task 5: Testler
  - [x] 5.1 test-financial.html'e modem testleri ekle
  - [x] 5.2 setModemPolicy / calculateModemCost testleri
  - [x] 5.3 compareModemScenarios testleri
  - [x] 5.4 getTotalInvestment modemCost dahil testi

## Dev Notes

### Veri Yapisi

```javascript
// ada.topology.modemConfig
ada.topology.modemConfig = {
  policy: 'allPaid',       // 'allPaid' | 'allFree' | 'perBuilding'
  unitPrice: 350,          // TL — varsayilan PonEngine.CATALOG.ont.price
  freeBuildings: []        // bina bazli modda: ucretsiz modem olan bina ID'leri
};
```

### Modem Sayisi Hesaplama

```
Efektif BB = bina.bb * penetrasyon orani
Modem sayisi = Math.ceil(efektif BB)
Toplam modem sayisi = sum(her bina icin modem sayisi)
```

### Maliyet Hesaplama

```
allPaid modda:
  paidCount = toplam modem sayisi
  freeCount = 0
  modemRevenue = paidCount * unitPrice (abone odemesi — gelir)
  modemCost = 0 (yatirim maliyeti olarak sifir)

allFree modda:
  paidCount = 0
  freeCount = toplam modem sayisi
  modemRevenue = 0
  modemCost = freeCount * unitPrice (yatirim maliyeti)

perBuilding modda:
  paidCount = ucretli binalarin modem sayisi toplami
  freeCount = ucretsiz binalarin modem sayisi toplami
  modemRevenue = paidCount * unitPrice
  modemCost = freeCount * unitPrice
```

### Referanslar

- [Source: PonEngine.CATALOG.ont.price = 350 TL — varsayilan modem fiyati]
- [Source: PonEngine.DEVICE_DB.ont — marka/model referanslari]
- [Source: lib/financial.js — mevcut ekipman yonetim modulu]
- [Source: content/panels.js — ekipman paneli UI]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Node.js test runner: 28/28 test PASS (10 suite — ekipman + modem)
- Syntax check: financial.js, topology.js, panels.js — hepsi OK

### Completion Notes List

- modemConfig veri yapisi: { policy, unitPrice, freeBuildings[] }
- 3 politika modu: allPaid (varsayilan), allFree, perBuilding
- Modem sayisi: Math.ceil(bb * penetrasyon) — bina ve ada bazli penetrasyon destekli
- modemCost = ucretsiz modem bedeli (yatirim), modemRevenue = ucretli modem geliri (gelir)
- getTotalInvestment artik 3 katmanli: fiber + ekipman + modem
- compareModemScenarios: allPaid vs allFree vs mevcut durum karsilastirma tablosu
- Karsilastirma modali: gelir/gider/net fark gosterimi

### Change Log

- 2026-03-01: Tum 5 task implement edildi, 28/28 test gecti, story review'e alindi

### File List

| File | Action | Description |
|------|--------|-------------|
| lib/financial.js | MODIFIED | Modem fonksiyonlari: setModemPolicy, setModemUnitPrice, setBuildingModemFree, calculateModemCost, compareModemScenarios. getTotalInvestment modemCost dahil |
| lib/topology.js | MODIFIED | createAda(): modemConfig init, loadState(): backward compat guard |
| content/panels.js | MODIFIED | Modem bolumu: politika secici, fiyat input, bina bazli checkbox, ozet, karsilastirma modali. Investment summary'ye modem satiri |
| styles/overlay.css | MODIFIED | Modem section, controls, compare modal, positive/negative renk stilleri |
| dashboard/test-financial.html | MODIFIED | 7 yeni modem test suite (16 test) eklendi, toplam 46 test |
