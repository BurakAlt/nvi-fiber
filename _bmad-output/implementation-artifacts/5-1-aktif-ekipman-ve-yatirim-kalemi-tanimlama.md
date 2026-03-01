# Story 5.1: Aktif Ekipman ve Yatirim Kalemi Tanimlama

Status: review

## Story

As a saha muhendisi,
I want anten, OLT cihaz ve diger aktif ekipman maliyetlerini sisteme tanimlayabilmek,
So that toplam yatirim maliyetini sadece fiber degil tum ekipman dahil hesaplayabileyim.

## Acceptance Criteria

1. **AC1 — Ekipman Tanimlama (FR27, FR28, FR29):**
   Given kullanici bir ada icin topoloji hesabi tamamlanmisken
   When aktif ekipman tanimlama alanini actiginda
   Then asagidaki ekipman kategorileri tanimlanabilir olmali:
   - Anten maliyetleri (FR27): tip, adet, birim fiyat
   - OLT cihaz maliyetleri (FR28): model, adet, birim fiyat
   - Diger aktif ekipman (FR29): switch, media converter, UPS vb.
   And her kalem icin birim fiyat ve adet girilebilmeli

2. **AC2 — Otomatik Hesaplama:**
   Given aktif ekipman tanimlari yapildiginda
   When kalem kaydedildiginde
   Then toplam ekipman maliyeti otomatik hesaplanmali
   And degisiklikler aninda maliyet ozetine yansimali

3. **AC3 — Ekipman Guncelleme:**
   Given kullanici daha once tanimladigi bir ekipmani degistirmek istediginde
   When ekipman bilgisini guncelledikten
   Then ilgili maliyet kalemleri aninda yeniden hesaplanmali

4. **AC4 — Ada Bazli Bagimsizlik:**
   Given kullanici ada bazli ekipman tanimaldiginda
   When farkli adalar arasi gecis yaptiginda
   Then her adanin kendi ekipman tanimlari bagimsiz saklanmali

## Tasks / Subtasks

- [x] Task 1: Financial.js IIFE modulu olustur (AC: #1, #2, #3)
  - [x] 1.1 Temel IIFE yapisini olustur (Financial global objesi)
  - [x] 1.2 DEFAULT_EQUIPMENT sabiti — varsayilan ekipman kategorileri ve fiyatlari
  - [x] 1.3 addEquipment(ada, item) — yeni ekipman kalemi ekle
  - [x] 1.4 updateEquipment(ada, equipmentId, changes) — mevcut kalemi guncelle
  - [x] 1.5 removeEquipment(ada, equipmentId) — kalemi sil
  - [x] 1.6 getEquipment(ada) — ada'nin ekipman listesini dondur
  - [x] 1.7 calculateEquipmentCost(ada) — toplam ekipman maliyetini hesapla
  - [x] 1.8 getTotalInvestment(ada) — fiber + ekipman toplam maliyet

- [x] Task 2: Topology.js entegrasyonu (AC: #4)
  - [x] 2.1 createAda() icinde equipment:[] init
  - [x] 2.2 loadState() backward compatibility guard

- [x] Task 3: Panels.js ekipman UI (AC: #1, #2, #3)
  - [x] 3.1 Toolbar'a YATIRIM butonu ekle
  - [x] 3.2 Ekipman paneli (side panel icinde toggle)
  - [x] 3.3 Ekipman listesi render — kategori gruplama
  - [x] 3.4 Ekipman ekleme formu (kategori, isim, adet, birim fiyat)
  - [x] 3.5 Inline duzenleme (adet ve fiyat degistirme)
  - [x] 3.6 Ekipman silme butonu
  - [x] 3.7 Maliyet ozeti karti (fiber + ekipman + toplam)

- [x] Task 4: CSS stilleri
  - [x] 4.1 Ekipman paneli ve form stilleri
  - [x] 4.2 Maliyet ozeti karti stili
  - [x] 4.3 Kategori grup basliklari

- [x] Task 5: Manifest ve testler
  - [x] 5.1 manifest.json'a financial.js ekle (variation.js sonrasi)
  - [x] 5.2 test-financial.html olustur
  - [x] 5.3 addEquipment/updateEquipment/removeEquipment testleri
  - [x] 5.4 calculateEquipmentCost ve getTotalInvestment testleri
  - [x] 5.5 Ada bazli bagimsizlik testleri

## Dev Notes

### Mimari — Yeni Financial Modulu

```javascript
const Financial = (() => {
  'use strict';

  // Varsayilan ekipman sablonlari (kullanici bunlari ada'ya ekleyebilir)
  var DEFAULT_EQUIPMENT = {
    olt_chassis: { category: 'olt', name: 'OLT Cihaz', unit: 'adet', unitPrice: 45000 },
    switch_l2:   { category: 'diger', name: 'L2 Switch', unit: 'adet', unitPrice: 8000 },
    ups:         { category: 'diger', name: 'UPS 2000VA', unit: 'adet', unitPrice: 5000 },
    media_conv:  { category: 'diger', name: 'Media Converter', unit: 'adet', unitPrice: 2500 },
    rack_cabin:  { category: 'diger', name: 'Rack Kabini', unit: 'adet', unitPrice: 6000 },
    anten_5ghz:  { category: 'anten', name: 'Sektor Anten 5GHz', unit: 'adet', unitPrice: 12000 },
    anten_24ghz: { category: 'anten', name: 'Sektor Anten 2.4GHz', unit: 'adet', unitPrice: 8000 },
    anten_pole:  { category: 'anten', name: 'Anten Diregi', unit: 'adet', unitPrice: 8500 }
  };

  return {
    DEFAULT_EQUIPMENT,
    addEquipment, updateEquipment, removeEquipment,
    getEquipment, calculateEquipmentCost, getTotalInvestment
  };
})();
```

### Veri Yapisi

```javascript
// ada.topology.equipment dizisinde saklanir
ada.topology.equipment = [
  {
    id: 'EQ-001',           // Benzersiz ID
    category: 'olt',        // 'olt' | 'anten' | 'diger'
    name: 'Huawei MA5800-X2',
    unit: 'adet',
    quantity: 1,
    unitPrice: 45000
  }
];
```

### Kategori Tanimlari

| Kategori | Aciklama | Ornek Kalemler |
|----------|----------|----------------|
| `olt` | OLT cihaz ve modulleri | OLT chassis, line card |
| `anten` | Anten ve montaj | Sektor anten, direk |
| `diger` | Diger aktif ekipman | Switch, UPS, media converter, rack |

### Maliyet Hesaplama

```
Fiber Maliyeti     = PonEngine.recalculateAda → ada.calculations.costs.total
Ekipman Maliyeti   = sum(equipment[i].quantity * equipment[i].unitPrice)
TOPLAM YATIRIM     = Fiber Maliyeti + Ekipman Maliyeti
```

### Manifest.json Yukleme Sirasi

```
... lib/variation.js
lib/financial.js          ← BURAYA
lib/ai-engine.js ...
```

### Mevcut PonEngine ile Iliski

- PonEngine.CATALOG zaten fiber ekipman fiyatlarini icerir (kablo, splitter, konnektor, ONT)
- Financial modulu CATALOG'a DOKUNMAZ — ayri bir katman olarak calisir
- Toplam yatirim = fiber (PonEngine) + ekipman (Financial)
- PonEngine DEVICE_DB'de OLT modelleri zaten var — Financial bunlari referans alabilir

### Storage — Ek Islem Gerektirmez

`ada.topology.equipment` dizisi, topology objesi icinde oldugu icin:
- normalizeState(): ada kaydi icinde otomatik olarak kopyalanir (buildings/calculations haric her sey)
- denormalizeState(): ada kaydi geri yuklenirken otomatik gelir
- Yeni IndexedDB store GEREKMEZ

### Referanslar

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 5, Story 5.1]
- [Source: fiber-chrome/lib/pon-engine.js — CATALOG, DEVICE_DB, calcInventory, costs]
- [Source: fiber-chrome/content/panels.js — side panel UI, toolbar]
- [Source: fiber-chrome/lib/topology.js — createAda, loadState]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Node.js test runner: `vm.runInThisContext()` ile IIFE modulleri yukleyerek 30/30 test basarili
- Syntax check: financial.js, topology.js, storage.js, panels.js — hepsi OK

### Completion Notes List

- Financial modulu PonEngine.CATALOG'a dokunmaz — ayri maliyet katmani
- Equipment verileri `ada.topology.equipment[]` icinde saklanir, storage normalization otomatik
- Yeni IndexedDB store gereksiz — topology objesi icinde auto-persist
- 9 varsayilan sablon: olt_chassis, olt_linecard, switch_l2, ups, media_conv, rack_cabin, anten_5ghz, anten_24ghz, anten_pole
- Inline edit: adet/fiyat alanlari direkt panelde duzenlenebilir
- Event dispatch: `fiberplan-equipment-changed` ile add/update/remove aksiyonlari

### Change Log

- 2026-03-01: Tum 5 task implement edildi, 30/30 test gecti, story review'e alindi

### File List

| File | Action | Description |
|------|--------|-------------|
| lib/financial.js | CREATED | Financial IIFE modulu — ekipman CRUD, maliyet hesaplama, toplam yatirim |
| lib/topology.js | MODIFIED | createAda(): equipment:[] init, loadState(): backward compat guard |
| content/panels.js | MODIFIED | YATIRIM butonu, ekipman paneli, form, inline edit, maliyet ozeti |
| styles/overlay.css | MODIFIED | Ekipman paneli, form, kategori grup, maliyet karti stilleri |
| manifest.json | MODIFIED | financial.js eklendi (variation.js sonrasi) |
| dashboard/test-financial.html | CREATED | 9 suite, 30 test — tumu PASS |
