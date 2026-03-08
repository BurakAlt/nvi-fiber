# Story 6.3: Isi Haritasi Gorsellestirme ve Katman Yonetimi

Status: done

## Story

As a saha muhendisi,
I want harita uzerinde potansiyel musteri yogunlugu ve ariza yogunlugu isi haritalarini gorebilmek,
So that yatirim kararlarimi gorsel veriye dayandirabilir ve sorunlu bolgeleri hizla tespit edebilirim.

## Acceptance Criteria

1. **AC1 — Potansiyel Musteri Yogunlugu Isi Haritasi (FR51):**
   Given adalarin BB sayilari ve penetrasyon oranlari mevcut oldugunda
   When kullanici potansiyel musteri yogunlugu katmanini actiginda
   Then harita uzerinde BB yogunluguna dayali isi haritasi gosterilmeli
   And yogun bolgeler kirmizi, dusuk yogunluk bolgeleri mavi olarak gorsellestirilmeli
   And isi haritasi gradient gosterimi ile gecisler yumusak olmali

2. **AC2 — Ariza Yogunlugu Isi Haritasi (FR52):**
   Given ariza verileri mevcut oldugunda (kullanici girisli veya cache'den)
   When kullanici ariza yogunlugu katmanini actiginda
   Then ariza dagilimi isi haritasi olarak gosterilmeli
   And yuksek ariza yogunlugu kirmizi, dusuk yogunluk yesil olarak gorsellestirilmeli

3. **AC3 — Katman Kontrol Paneli (FR53):**
   Given birden fazla isi haritasi katmani mevcut oldugunda
   When kullanici katman kontrol panelini kullandiginda
   Then her katman bagimsiz olarak acilip kapatilabilmeli
   And katman saydamligi ayarlanabilmeli (slider ile %0-%100)
   And aktif katmanlar gorsel olarak isaretlenmeli
   And en fazla 2 katman ayni anda goruntulenebilmeli (performans icin)

## Tasks / Subtasks

- [x] Task 1: HeatMap modulu olustur (AC: #1, #2)
  - [x] 1.1 content/heat-map.js — IIFE iskelet, CONSTANTS, private state
  - [x] 1.2 init(map) — Leaflet harita referansini al, canvas katmani olustur
  - [x] 1.3 generateCustomerDensityData() — IndexedDB'den tum adalarin BB/koordinat verisi
  - [x] 1.4 generateFaultDensityData() — ariza verisi toplama (kullanici girisli)
  - [x] 1.5 renderHeatLayer(layerId, dataPoints, colorScheme) — canvas uzerinde isi haritasi ciz
  - [x] 1.6 clearLayer(layerId) — belirli katmani temizle
  - [x] 1.7 setOpacity(layerId, opacity) — katman saydamligi ayarla
  - [x] 1.8 getActiveLayerCount() — aktif katman sayisi

- [x] Task 2: Canvas overlay altyapisi (AC: #1, #2)
  - [x] 2.1 Leaflet canvas katmani olusturma (L.canvas veya ozel overlay)
  - [x] 2.2 Gaussian blur ile yumusak gradient gecis
  - [x] 2.3 Renk skalasi: mavi→yesil→sari→kirmizi (musteri yogunlugu)
  - [x] 2.4 Renk skalasi: yesil→sari→kirmizi (ariza yogunlugu)
  - [x] 2.5 Harita zoom/pan olaylarinda canvas yeniden cizim
  - [x] 2.6 Performans: requestAnimationFrame ile throttle

- [x] Task 3: Katman kontrol paneli UI (AC: #3)
  - [x] 3.1 fp-layer-control bilesen — harita sag ustunde pozisyon
  - [x] 3.2 Katman toggle checkbox'lari (Musteri Yogunlugu / Ariza Yogunlugu)
  - [x] 3.3 Saydamlik slider (range input, %0-%100)
  - [x] 3.4 Maks 2 katman siniri — 3. katman acilirken uyari
  - [x] 3.5 Aktif katman badge/gosterge (renkli nokta)

- [x] Task 4: Ariza verisi giris mekanizmasi (AC: #2)
  - [x] 4.1 Panels.js — "Ariza Verisi Ekle" bolumu (bina bazinda sayi girisi)
  - [x] 4.2 ada.topology.faultData = { buildingId: count } veri yapisi
  - [x] 4.3 topology.js — createAda() icinde faultData: {} baslatma
  - [x] 4.4 topology.js — loadState() backward compat guard

- [x] Task 5: manifest.json ve yukleme sirasi
  - [x] 5.1 manifest.json content_scripts'e heat-map.js ekle (overlay.js'den sonra, panels.js'den once)

- [x] Task 6: Testler
  - [x] 6.1 test/test-heat-map.html olustur
  - [x] 6.2 generateCustomerDensityData testleri
  - [x] 6.3 renderHeatLayer / clearLayer testleri
  - [x] 6.4 Katman limiti testleri (maks 2 kontrol)
  - [x] 6.5 setOpacity testleri

## Dev Notes

### Yeni Modul: HeatMap (content/heat-map.js)

```javascript
/**
 * HeatMap - Heat map visualization for customer density and fault analysis
 * Canvas-based overlay for Leaflet map with layer management
 */
const HeatMap = (() => {
  'use strict';
  // ─── CONSTANTS ─────────────────────────────────────────
  const CONFIG = {
    MAX_ACTIVE_LAYERS: 2,
    DEFAULT_OPACITY: 0.6,
    BLUR_RADIUS: 25,          // Gaussian blur piksel
    POINT_RADIUS: 30,         // Veri noktasi piksel yaricapi
    MIN_ZOOM_FOR_RENDER: 14,  // Bu zoom altinda render yapma
    GRADIENT_CUSTOMER: {      // Mavi→Kirmizi
      0.0: 'rgba(0, 0, 255, 0)',
      0.25: 'rgba(0, 0, 255, 0.5)',
      0.5: 'rgba(0, 255, 0, 0.7)',
      0.75: 'rgba(255, 255, 0, 0.8)',
      1.0: 'rgba(255, 0, 0, 1.0)'
    },
    GRADIENT_FAULT: {         // Yesil→Kirmizi
      0.0: 'rgba(0, 200, 0, 0)',
      0.25: 'rgba(0, 200, 0, 0.5)',
      0.5: 'rgba(255, 255, 0, 0.7)',
      0.75: 'rgba(255, 140, 0, 0.8)',
      1.0: 'rgba(255, 0, 0, 1.0)'
    }
  };

  const LAYERS = {
    CUSTOMER_DENSITY: 'customerDensity',
    FAULT_DENSITY: 'faultDensity'
  };

  // ─── PRIVATE STATE ─────────────────────────────────────
  var _map = null;
  var _canvas = null;
  var _ctx = null;
  var _activeLayers = {};  // { layerId: { data, colorScheme, opacity, visible } }

  // ─── PUBLIC API ────────────────────────────────────────
  return {
    init,
    generateCustomerDensityData,
    generateFaultDensityData,
    renderHeatLayer,
    clearLayer,
    setOpacity,
    getActiveLayerCount,
    toggleLayer,
    destroy,
    LAYERS
  };
})();
```

### Canvas Rendering Yaklasimi

```
Rendering Pipeline:
  1. Veri noktalarini harita koordinatlarindan piksel koordinatlarina donustur
     → map.latLngToContainerPoint(latlng)
  2. Her veri noktasi icin:
     a. Radial gradient olustur (merkez: opak, kenar: seffaf)
     b. Yogunluk degerine gore alfa ayarla
     c. Canvas'a ciz (globalCompositeOperation: 'lighter')
  3. Gradient haritalama:
     a. imageData piksellerini oku
     b. Her pikselin alfa degerini renk skalasina esle
     c. Sonuc canvas'a geri yaz
  4. requestAnimationFrame ile throttle (max 30fps)
```

**Performans Notlari:**
- Zoom < 14 ise render yapma (cok uzak, anlamsiz)
- debounce(200ms) ile moveend/zoomend olaylarinda yeniden ciz
- OffscreenCanvas kullanilabilirse tercih et (web worker potansiyeli)
- Veri noktasi sayisi > 500 ise tile bazli render dusun

### Veri Noktalari Yapisi

```javascript
// Musteri yogunlugu veri noktasi
const customerPoint = {
  lat: bina.coordinates.lat,
  lng: bina.coordinates.lng,
  intensity: bina.bbCount * (ada.topology.defaultPenetrationRate / 100),
  adaId: ada.id,
  buildingId: bina.id
};

// Ariza yogunlugu veri noktasi
const faultPoint = {
  lat: bina.coordinates.lat,
  lng: bina.coordinates.lng,
  intensity: ada.topology.faultData[bina.id] || 0,
  adaId: ada.id,
  buildingId: bina.id
};
```

### Katman Kontrol Paneli

```html
<div id="fp-layer-control" class="fp-layer-control">
  <div class="fp-layer-title">Katmanlar</div>

  <div class="fp-layer-item">
    <label>
      <input type="checkbox" id="fp-layer-customer" data-layer="customerDensity">
      <span class="fp-layer-dot" style="background:#3B82F6"></span>
      Musteri Yogunlugu
    </label>
    <input type="range" class="fp-layer-opacity" data-layer="customerDensity"
           min="0" max="100" value="60">
  </div>

  <div class="fp-layer-item">
    <label>
      <input type="checkbox" id="fp-layer-fault" data-layer="faultDensity">
      <span class="fp-layer-dot" style="background:#EF4444"></span>
      Ariza Yogunlugu
    </label>
    <input type="range" class="fp-layer-opacity" data-layer="faultDensity"
           min="0" max="100" value="60">
  </div>
</div>
```

**Pozisyon:** Harita sag ust kose, z-index: 1100 (popup ile ayni, toolbar'in altinda)

### Ariza Verisi Girisi

Ariza verileri su an icin kullanici girisidir (canli UISP/Zabbix Epic 7'de):

```javascript
// topology.js createAda() icinde
topology: {
  ...mevcut alanlar,
  faultData: {}   // { buildingId: faultCount }
}
```

Panels.js'de "Ariza Verisi" bolumu:
- Bina listesinde her bina yaninda ariza sayisi input (number, min=0)
- Degisiklikte: `ada.topology.faultData[buildingId] = value`
- Kaydet: Storage.autoSave() tetikle

### manifest.json Yukleme Sirasi

```
... → overlay.js → heat-map.js → panels.js → main.js
```

HeatMap, Overlay'den sonra yuklenmeli cunku:
- Overlay.getMap() ile Leaflet harita referansina ihtiyaci var
- Panels.js HeatMap.toggleLayer() cagirir

### z-index Hiyerarsisi (Guncellenmis)

| Katman | z-index |
|--------|---------|
| Harita (Leaflet) | 1000 |
| Isi haritasi canvas | 1050 |
| Popup | 1100 |
| Katman kontrol paneli | 1100 |
| Scoreboard | 1150 |
| Toolbar | 1200 |
| Backdrop | 1250 |
| Modal | 1300 |

### Mimari Kisitlamalar

- IIFE pattern — yeni modul (content/heat-map.js)
- Canvas element: document.createElement('canvas'), Leaflet map container'a ekle
- CSP: Canvas rendering CSP'den etkilenmez (img-src kisitlamasi canvas'a uygulanmaz)
- Koordinat donusum: SADECE Overlay.getMap() uzerinden, NVI haritasina erismek YASAK
- Memory: canvas boyutu viewport ile sinirli, tum harita degil
- Type guard: `if (typeof Overlay !== 'undefined' && Overlay.getMap)`

### Project Structure Notes

- Yeni dosya: `fiber-chrome/content/heat-map.js`
- Yeni test: `fiber-chrome/test/test-heat-map.html`
- Degisecek dosyalar: topology.js (faultData), panels.js (ariza giris + katman kontrol), manifest.json, overlay.js (getMap public API)
- Architecture uyum: architecture.md line 199 "Canvas Overlay" karari, line 448 "content/heat-map.js" tanimli

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 6, Story 6.3]
- [Source: _bmad-output/planning-artifacts/architecture.md — Canvas Overlay karari, line 199]
- [Source: _bmad-output/planning-artifacts/architecture.md — heat-map.js konum, line 448]
- [Source: _bmad-output/planning-artifacts/architecture.md — Katman kontrol paneli, line 201]
- [Source: _bmad-output/planning-artifacts/architecture.md — z-index sistemi (Smart Bubbles MEMORY)]
- [Source: fiber-chrome/content/overlay.js — Leaflet harita yonetimi]
- [Source: fiber-chrome/lib/topology.js — ada yapisi, createAda()]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — harita-merkezli kesif deneyimi]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

N/A

### Completion Notes List

- HeatMap IIFE modulu (content/heat-map.js) olusturuldu — canvas-based isi haritasi gorsellestirme
- Canvas rendering pipeline: radial gradient → Gaussian blur → renk palette haritalama
- Iki ayri renk skalasi: musteri yogunlugu (mavi→kirmizi), ariza yogunlugu (yesil→kirmizi)
- Katman kontrol paneli: checkbox toggle + opacity slider + aktif katman badge gostergesi
- Maks 2 katman siniri uygulanarak performans korundu
- Ariza verisi girisi overlay.js modal "binalar" tabina entegre edildi (bina bazinda number input)
- topology.js'de faultData: {} veri yapisi createAda() ve loadState() backward compat guard eklendi
- manifest.json yukleme sirasi: overlay.js → heat-map.js → panels.js
- main.js'de HeatMap.init() cagrisi Overlay.init() sonrasina eklendi
- 9 test grubu, 30+ test case ile dogrulanmis

### Change Log

- 2026-03-03: Story 6.3 implementasyonu tamamlandi — isi haritasi gorsellestirme ve katman yonetimi

### File List

- fiber-chrome/content/heat-map.js (YENi)
- fiber-chrome/test/test-heat-map.html (YENi)
- fiber-chrome/lib/topology.js (DEGISTIRILDI — faultData eklendi)
- fiber-chrome/content/overlay.js (DEGISTIRILDI — binalar tabinda ariza verisi girisi)
- fiber-chrome/content/main.js (DEGISTIRILDI — HeatMap.init() cagrisi)
- fiber-chrome/manifest.json (DEGISTIRILDI — heat-map.js eklendi)
- fiber-chrome/styles/overlay.css (DEGISTIRILDI — katman kontrol paneli stilleri)
