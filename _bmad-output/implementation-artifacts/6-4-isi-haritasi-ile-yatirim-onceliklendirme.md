# Story 6.4: Isi Haritasi ile Yatirim Onceliklendirme

Status: done

## Story

As a saha muhendisi,
I want isi haritasi verilerini yatirim onceliklendirmesi icin kullanabilmek,
So that en yuksek potansiyeli olan bolgelere once yatirim yapabilir ve kaynaklarimi verimli kullanabilirim.

## Acceptance Criteria

1. **AC1 — Oncelik Hesaplama (FR54):**
   Given potansiyel musteri yogunlugu ve ariza yogunlugu isi haritalari aktif oldugunda
   When kullanici yatirim onceliklendirme analizini baslattiginda
   Then adalarin oncelik sirasi hesaplanmali:
   - Oncelik 1: Yuksek musteri yogunlugu + dusuk ariza (en iyi yatirim)
   - Oncelik 2: Yuksek musteri yogunlugu + yuksek ariza (yatirim + iyilestirme)
   - Oncelik 3: Dusuk musteri yogunlugu + dusuk ariza (dusuk oncelik)
   - Oncelik 4: Dusuk musteri yogunlugu + yuksek ariza (sadece iyilestirme)
   And oncelik sirasi harita uzerinde renk kodlariyla gorsellestirilmeli

2. **AC2 — Oncelik Listesi:**
   Given onceliklendirme hesabi tamamlandiginda
   When oncelik listesi goruntulendikten
   Then adalar oncelik sirasina gore listelenmeli
   And her ada icin: oncelik skoru, beklenen ROI, tahmini yatirim tutari gosterilmeli
   And liste filtrelenebilir olmali (oncelik seviyesine gore)

3. **AC3 — Agirlik Katsayisi Ayarlama:**
   Given kullanici onceliklendirme parametrelerini ayarlamak istediginde
   When agirlik katsayilarini degistirdiginde (orn: musteri yogunlugu %70, ariza %30)
   Then oncelik sirasi yeniden hesaplanmali
   And harita ve liste aninda guncellenmeli

## Tasks / Subtasks

- [x] Task 1: MarketingDataHouse — Onceliklendirme hesaplama (AC: #1, #3)
  - [x] 1.1 calculatePriority(adaMetrics, weights) — agirlikli oncelik skoru
  - [x] 1.2 classifyPriority(score) — skor → oncelik seviyesi (1-4) esleme
  - [x] 1.3 calculateAllPriorities(weights) — tum adalar icin toplu hesaplama
  - [x] 1.4 getCustomerDensityScore(ada) — BB yogunlugu normalize (0-1)
  - [x] 1.5 getFaultDensityScore(ada) — ariza yogunlugu normalize (0-1)

- [x] Task 2: Harita gorsellemesi (AC: #1)
  - [x] 2.1 HeatMap.renderPriorityOverlay(priorities) — ada bazinda renk kodlama
  - [x] 2.2 Oncelik renk paleti: P1=koyu yesil, P2=acik yesil, P3=sari, P4=kirmizi
  - [x] 2.3 Ada sinir poligonlarini oncelik rengine boyama
  - [x] 2.4 Harita uzerinde oncelik badge'i (ada merkezinde numara)

- [x] Task 3: Panels.js — Oncelik listesi ve filtre UI (AC: #2, #3)
  - [x] 3.1 Yonetim sekmesinde "Yatirim Onceliklendirme" alt bolumu
  - [x] 3.2 Agirlik katsayisi slider'lari (musteri yogunlugu + ariza tersi, toplam %100)
  - [x] 3.3 "Hesapla" butonu → calculateAllPriorities tetikle
  - [x] 3.4 Oncelik listesi tablosu (ada, skor, ROI, yatirim, oncelik seviyesi)
  - [x] 3.5 Filtre butonlari: P1 / P2 / P3 / P4 / Tumu
  - [x] 3.6 Slider degisiminde otomatik yeniden hesaplama (debounce 300ms)

- [x] Task 4: Testler
  - [x] 4.1 calculatePriority testleri (farkli agirlik kombinasyonlari)
  - [x] 4.2 classifyPriority testleri (sinir degerleri)
  - [x] 4.3 Normalizasyon testleri (0 bina, 0 ariza, maksimum degerler)

## Dev Notes

### Bagimliliklar

- **Story 6.3 ZORUNLU** — HeatMap modulu ve faultData yapisi 6.3'te olusturuluyor
- **Story 6.1 ZORUNLU** — MarketingDataHouse modulu 6.1'de olusturuluyor
- Financial.getTotalInvestment(), calculateROI() fonksiyonlari
- HeatMap.renderPriorityOverlay() — yeni fonksiyon HeatMap modulune eklenecek

### Hesaplama Mantigi

```
calculatePriority(adaMetrics, weights):
  // Varsayilan agirliklar
  w1 = weights.customerDensity || 0.60  // Musteri yogunlugu agirligi
  w2 = weights.faultInverse   || 0.40  // Ariza tersi agirligi

  // Normalize skorlar (0-1 arasi)
  customerScore = getCustomerDensityScore(ada)
    → totalEffBB / maxEffBBacrossAllAdas (min-max normalizasyon)

  faultScore = getFaultDensityScore(ada)
    → totalFaults / maxFaultsAcrossAllAdas (min-max normalizasyon)

  // Agirlikli skor
  priorityScore = (customerScore * w1) + ((1 - faultScore) * w2)

  return { adaId, score: priorityScore, level: classifyPriority(priorityScore) }

classifyPriority(score):
  score >= 0.75 → Oncelik 1 (en iyi yatirim)
  score >= 0.50 → Oncelik 2 (yatirim + iyilestirme)
  score >= 0.25 → Oncelik 3 (dusuk oncelik)
  score < 0.25  → Oncelik 4 (sadece iyilestirme)
```

### Oncelik Renk Kodlari

| Oncelik | Hex | Anklam |
|---------|-----|--------|
| P1 | #166534 (koyu yesil) | En iyi yatirim — yuksek musteri, dusuk ariza |
| P2 | #22C55E (acik yesil) | Yatirim + iyilestirme — yuksek musteri, yuksek ariza |
| P3 | #EAB308 (sari) | Dusuk oncelik — dusuk musteri, dusuk ariza |
| P4 | #EF4444 (kirmizi) | Sadece iyilestirme — dusuk musteri, yuksek ariza |

### Agirlik Slider UI

```html
<div class="fp-priority-weights">
  <div class="fp-weight-row">
    <label>Musteri Yogunlugu: <span id="fp-weight-customer-val">60</span>%</label>
    <input type="range" id="fp-weight-customer" min="0" max="100" value="60">
  </div>
  <div class="fp-weight-row">
    <label>Ariza Tersi: <span id="fp-weight-fault-val">40</span>%</label>
    <input type="range" id="fp-weight-fault" min="0" max="100" value="40">
  </div>
  <p class="fp-weight-note">Toplam: <span id="fp-weight-total">100</span>%</p>
</div>
```

**Slider senkronizasyonu:** Biri degistiginde digeri otomatik ayarlanir (toplam 100):
```javascript
customerSlider.oninput = function() {
  faultSlider.value = 100 - this.value;
  // Debounce 300ms sonra recalculate
};
```

### Oncelik Listesi Tablosu

| Ada | Skor | Oncelik | ROI % | Yatirim (TL) | Musteri | Ariza |
|-----|------|---------|-------|-------------|---------|-------|
| DA-001 | 0.82 | P1 | 145% | 32.000 | 45 BB | 2 |
| DA-003 | 0.61 | P2 | 98% | 28.500 | 38 BB | 8 |

- Filtre butonlari: toggle (aktif P1+P2 goster, P3+P4 gizle gibi)
- Sirasi: oncelik skoru azalan
- Satira tiklandiginda harita o adaya pan

### Mimari Kisitlamalar

- HeatMap modulune renderPriorityOverlay() fonksiyonu eklenir (IIFE API genisletme)
- MarketingDataHouse modulune calculatePriority() ailesini ekle
- Ada sinir poligonu: Overlay modulunden boundary verisi alinir (`ada.boundary`)
- Renk kodlu poligon: Leaflet L.polygon ile fill rengi ayarlama
- Performans: Tum adalar icin hesaplama O(n), harita cizim O(n)

### Project Structure Notes

- Degisecek dosyalar: marketing-data-house.js, heat-map.js, panels.js, overlay.js (boundary poligon renkleme)
- Yeni dosya yok — mevcut modullere fonksiyon ekleme
- Test dosyasi: test/test-marketing-data-house.html'e yeni suite ekleme

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 6, Story 6.4]
- [Source: _bmad-output/planning-artifacts/architecture.md — Canvas Overlay karari, line 199]
- [Source: _bmad-output/implementation-artifacts/6-3-isi-haritasi-gorsellestirme-ve-katman-yonetimi.md — HeatMap modul yapisi]
- [Source: _bmad-output/implementation-artifacts/6-1-senaryo-verisi-saklama-ve-disa-aktarma.md — MarketingDataHouse modul yapisi]
- [Source: fiber-chrome/lib/financial.js — getTotalInvestment, calculateROI]
- [Source: fiber-chrome/content/overlay.js — boundary poligon rendering]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

N/A

### Completion Notes List

- MarketingDataHouse'a 5 yeni fonksiyon eklendi: calculatePriority, classifyPriority, calculateAllPriorities, getCustomerDensityScore, getFaultDensityScore
- PRIORITY_COLORS ve PRIORITY_LABELS sabitleri eklendi (P1-P4 renk kodlari)
- Iki gecisli verimli hesaplama: birinci gecis raw degerler + max, ikinci gecis normalize + skor
- Min-max normalizasyon: tum adalar arasinda BB yogunlugu ve ariza yogunlugu 0-1 arasina normalize
- HeatMap modulune renderPriorityOverlay() ve clearPriorityOverlay() eklendi — Leaflet L.polygon + L.marker ile ada sinirlarina renk kodlu poligon ve P-badge
- Overlay.js modal'a yeni "Oncelik" sekmesi eklendi — agirlik slider'lari, hesapla butonu, filtre butonlari, oncelik tablosu
- Slider senkronizasyonu: biri degistiginde digeri 100'e tamamlanir, 300ms debounce ile otomatik yeniden hesaplama
- Tablo satirina tiklandiginda harita ilgili adaya pan yapiyor
- "HARITADA GOSTER" toggle butonu ile oncelik overlay acilip kapatilabiliyor
- 30+ test case ile dogrulanmis: calculatePriority agirlik kombinasyonlari, classifyPriority sinir degerleri, normalizasyon edge case'leri

### Change Log

- 2026-03-03: Story 6.4 implementasyonu tamamlandi — yatirim onceliklendirme hesaplama, harita gorselleme, UI

### File List

- fiber-chrome/lib/marketing-data-house.js (DEGISTIRILDI — 5 onceliklendirme fonksiyonu + PRIORITY_COLORS/LABELS eklendi)
- fiber-chrome/content/heat-map.js (DEGISTIRILDI — renderPriorityOverlay, clearPriorityOverlay eklendi)
- fiber-chrome/content/overlay.js (DEGISTIRILDI — "Oncelik" modal sekmesi + _renderPriorityTab eklendi)
- fiber-chrome/styles/overlay.css (DEGISTIRILDI — priority badge + priority tab UI stilleri eklendi)
- fiber-chrome/test/test-priority.html (YENI — 7 test grubu, 30+ test case)
