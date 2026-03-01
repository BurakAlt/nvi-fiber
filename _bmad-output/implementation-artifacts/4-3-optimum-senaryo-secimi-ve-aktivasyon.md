# Story 4.3: Optimum Senaryo Secimi ve Aktivasyon

Status: review

## Story

As a saha muhendisi,
I want karsilastirma sonrasi en uygun senaryoyu aktif plan olarak belirleyebilmek,
So that sectigim plani uygulama asamasina tasiyabilir ve raporlarima yansitabileyim.

## Acceptance Criteria

1. **AC1 — Optimum Isaretleme (FR23):**
   Given karsilastirma tablosu acik ve varyasyonlar goruntulendikten
   When kullanici bir varyasyonu "Optimum" olarak isaretlediginde
   Then secilen varyasyon gorsel olarak one cikarilmali
   And optimum secim nedeni icin kullaniciya not girme imkani sunulmali (opsiyonel)

2. **AC2 — Aktif Plan Yapma:**
   Given kullanici optimum senaryoyu aktif plan olarak belirlemek istediginde
   When "Aktif Yap" islemini onayladiginda
   Then secilen varyasyonun verileri adanin aktif plani olarak yuklenmeli
   And harita, panel ve envanter secilen varyasyona gore guncellenmeli
   And onceki aktif plan otomatik olarak bir varyasyon olarak saklanmali (veri kaybi yok)

3. **AC3 — Aktif Plan Etiketi:**
   Given optimum senaryo aktif yapildiktan sonra
   When ada ozeti goruntulendikten
   Then aktif planin hangi varyasyondan geldigini gosteren etiket olmali
   And disa aktarim (JSON/CSV) aktif planin verilerini icermeli

4. **AC4 — Optimum Degisikligi:**
   Given kullanici optimum secimini degistirmek istediginde
   When baska bir varyasyonu optimum olarak isaretlediginde
   Then onceki optimum isaretlemesi kaldirilmali
   And yeni secilenin isaretlenmeli
   And aktif plan degismemeli (aktif yapma ayri islem)

## Tasks / Subtasks

- [x] Task 1: Variation.js optimum ve aktivasyon fonksiyonlari (AC: #1, #2, #4)
  - [x] 1.1 setOptimum(variationId, note) — varyasyonu optimum olarak isaretle, oncekini kaldir
  - [x] 1.2 getOptimumId(adaId) — aktif ada icin optimum varyasyon ID'sini dondur
  - [x] 1.3 activateVariation(variationId) — varyasyon verisini ada aktif plani olarak yukle
  - [x] 1.4 activateVariation icinde onceki aktif plani "Onceki Aktif" varyasyonu olarak sakla
  - [x] 1.5 ada.topology.activatedFrom alanini kaydet (kaynak varyasyon bilgisi)

- [x] Task 2: Karsilastirma tablosuna OPTIMUM ve AKTIF YAP butonlari (AC: #1, #2)
  - [x] 2.1 Karsilastirma tablo header'ina her varyasyon icin OPTIMUM butonu ekle
  - [x] 2.2 AKTIF YAP butonu — sadece optimum isaretli varyasyonda gorunur
  - [x] 2.3 Optimum seciminde opsiyonel not girme dialogu
  - [x] 2.4 AKTIF YAP onay dialogu ("Onceki plan varyasyon olarak saklanacak")

- [x] Task 3: Varyasyon panelinde optimum gostergesi (AC: #1, #3, #4)
  - [x] 3.1 renderVariationPanel() icinde optimum varyasyonu gorsel olarak isaretleme (yildiz/badge)
  - [x] 3.2 activatedFrom etiketi — "Kaynak: VAR-XXX" gostergesi
  - [x] 3.3 Varyasyon item'inda OPTIMUM ve AKTIF YAP kisa yol butonlari

- [x] Task 4: CSS stilleri (AC: #1, #3)
  - [x] 4.1 Optimum varyasyon stili (altin/sari border, yildiz ikonu)
  - [x] 4.2 Karsilastirma tablosunda optimum sutun vurgulama
  - [x] 4.3 activatedFrom etiketi stili
  - [x] 4.4 Onay dialogu stili (fp-var-form-overlay yeniden kullanildi)

- [x] Task 5: Testler ve entegrasyon (AC: #1-#4)
  - [x] 5.1 test-variation.html'e Suite 10: Optimum ve Aktivasyon testleri
  - [x] 5.2 setOptimum/getOptimumId testleri (set, degistir, kaldir)
  - [x] 5.3 activateVariation testleri (onceki plan saklama, activatedFrom)
  - [x] 5.4 Event dispatch testleri (fiberplan-variation-optimum, fiberplan-variation-activated)

## Dev Notes

### Bagimlilik: Story 4.1 + 4.2

Bu story, Story 4.1 (variation.js) ve Story 4.2 (karsilastirma tablosu) uzerine insa edilir.
Mevcut API:
- `Variation.createVariation(ada, name, params)` — yeni varyasyon olustur
- `Variation.selectVariation(id)` — gecici goruntuleme icin varyasyon sec
- `Variation.deselectVariation()` — orijinale don
- `Variation.getVariations(adaId)` — varyasyon listesi
- `Variation.getComparisonData(ids)` — karsilastirma metrikleri
- `Panels.openComparisonModal()` — karsilastirma tablosu ac

### Optimum vs Aktif Varyasyon Farki

- **selectVariation()** = gecici goruntuleme (geri alinabilir, orijinal korunur)
- **activateVariation()** = KALICI degisiklik (ada verisi degisir, onceki plan varyasyon olur)
- **optimum** = sadece isaretleme (gorsel vurgulama, aktif plan degismez)

### Veri Yapisi Degisiklikleri

```javascript
// ada.topology'ye eklenenler:
ada.topology.optimumVariationId = 'VAR-003' | null;   // optimum isaretli varyasyon
ada.topology.activatedFrom = 'VAR-002' | null;        // son aktif yapilan varyasyon

// Variation objesine eklenenler:
variation.isOptimum = true | false;
variation.optimumNote = string | null;   // kullanicinin optimum secim notu
```

### activateVariation Akisi

```
activateVariation(variationId):
  1. Mevcut aktif plani "Onceki Aktif (tarih)" isimli varyasyon olarak kaydet
  2. Secilen varyasyonun snapshot'ini ada'ya uygula (applySnapshot)
  3. ada.topology.activatedFrom = variationId kaydet
  4. PonEngine.recalculateAda() (aktivasyon sonrasi yeniden hesaplama)
  5. _activeVariationId = null (artik bu ana plan, varyasyon degil)
  6. _originalSnapshot = null (artik orijinal degisti)
  7. Panels.refresh() + Overlay.render()
  8. Event: fiberplan-variation-activated
```

### UI Tasarimi

**Karsilastirma tablosu header'i:**
```
| Metrik     | VAR-001        | VAR-002        | VAR-003 ★      |
|            | [OPTIMUM]      | [OPTIMUM]      | OPTIMUM ✓      |
|            |                |                | [AKTIF YAP]    |
```

**Varyasyon paneli item'i:**
```
┌──────────────────────────────────┐
│ ★ VAR-003 — %70 Penetrasyon     │  ← optimum: altin yildiz
│ %70 | 52,100 TL                 │
│ [AKTIF YAP]                     │
└──────────────────────────────────┘
```

**activatedFrom etiketi (ada header'inda):**
```
Orijinal Plan (Kaynak: VAR-002)
```

### Referanslar

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 4, Story 4.3]
- [Source: fiber-chrome/lib/variation.js — selectVariation, deselectVariation]
- [Source: fiber-chrome/content/panels.js — renderVariationPanel, openComparisonModal, buildComparisonHTML]
- [Source: fiber-chrome/styles/overlay.css — fp-var-*, fp-cmp-*]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Validation: Explore agent checked all files — 3 issues found and fixed (topology init, backward compat, storage serialization)

### Completion Notes List

- setOptimum(variationId, note): ada-scope optimum isaretleme, onceki optimumu otomatik temizler
- clearOptimum(adaId): tum optimum isaretlerini temizler
- getOptimumId(adaId): ada icin optimum varyasyon ID'si dondurur
- activateVariation(variationId): varyasyonu KALICI aktif plan yapar, onceki plani "Onceki Aktif (tarih)" olarak saklar
- Karsilastirma tablosu header'ina OPTIMUM butonu (her varyasyon) ve AKTIF YAP butonu (sadece optimum) eklendi
- showOptimumNoteDialog(): opsiyonel not girme popup'i
- renderVariationPanel(): optimum yildiz badge, activatedFrom kaynak etiketi, AKTIF YAP kisa yol butonu
- CSS: .fp-var-optimum (altin border), .fp-cmp-col-optimum (sari border), .fp-btn-optimum, .fp-btn-activate
- Validation fixes: topology.js createAda() init + loadState() backward compat, storage.js isOptimum/optimumNote serialization
- Suite 10: 14 test (setOptimum, getOptimumId, clearOptimum, activateVariation, event dispatch)

### Change Log

- 2026-03-01: Tum 5 task implement edildi, 3 post-validation fix yapildi (topology init, backward compat, storage serialization)

### File List

| File | Action | Description |
|------|--------|-------------|
| `fiber-chrome/lib/variation.js` | MODIFIED | setOptimum(), clearOptimum(), getOptimumId(), activateVariation() eklendi (~110 satir) |
| `fiber-chrome/content/panels.js` | MODIFIED | Karsilastirma tablosuna OPTIMUM/AKTIF YAP butonlari, showOptimumNoteDialog(), renderVariationPanel optimum badge/activatedFrom etiketi |
| `fiber-chrome/styles/overlay.css` | MODIFIED | Optimum/activation CSS stilleri (~12 satir) |
| `fiber-chrome/lib/topology.js` | MODIFIED | createAda() optimumVariationId/activatedFrom init + loadState() backward compat |
| `fiber-chrome/lib/storage.js` | MODIFIED | normalizeState/denormalizeState'e isOptimum ve optimumNote alanlari eklendi |
| `fiber-chrome/dashboard/test-variation.html` | MODIFIED | Suite 10: Optimum & Activation testleri (14 test) |
