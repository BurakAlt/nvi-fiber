# Mimari - FiberPlan Chrome Extension

**Tip:** Chrome Manifest V3 Extension
**Dil:** Vanilla JavaScript (IIFE pattern)
**Build:** Yok — chrome://extensions'dan Load unpacked

---

## Genel Bakis

FiberPlan Chrome, NVI adres portalinda (adres.nvi.gov.tr) calisan bir content script tabanli Chrome Extension'dir. Saha muhendisleri binalari secip GPON ITU-T G.984 Class B+ standartlarina uygun fiber ag planlama yapar.

## Modul Sistemi

Tum moduller IIFE pattern kullanir: `const Module = (() => { ... })()`

**Load order (manifest.json sirasinda):**
```
leaflet → debug → ws-bridge → event-bus → pon-engine → topology →
storage → command-manager → map-utils → draw-polygon → review-engine →
activation → variation → financial → marketing-data-house → ai-engine →
live-monitor → acs-manager → flow-analyzer → qoe-engine →
scraper → nvi-cache → overlay → heat-map → panels → main
```

## Cekirdek Veri Akisi

```
NviScraper polls NVI DOM (1s interval)
  → groups <tr> rows by binaNo into buildings
  → main.js adds buildings to active ada via Topology.addBuilding()
  → PonEngine.recalculateAda(ada) runs full pipeline
  → Overlay.render() updates map + Panels.refresh() updates sidebar
  → Storage.autoSave() persists to chrome.storage.local
```

## Hesaplama Pipeline (PonEngine.recalculateAda)

| Adim | Islem | Aciklama |
|------|-------|----------|
| 1 | OLT Yerlestirme | Agirlikli geometrik medyan (BB x mesafe) |
| 2 | OLT Kapasitesi | GPON port sayisi (128 BB/port, 64 ONT/port) |
| 3 | FDH Atama | Greedy clustering, max 8 bina/FDH |
| 4 | MST Yonlendirme | Prim algoritmasi (feeder + distribution) |
| 5 | Kablo Boyutlandirma | Backbone, distribution, drop, ring |
| 6 | Splitter Kaskadi | 2 seviye: FDH'de Level 1, binada Level 2 |
| 7 | Kayip Butcesi | Splitter + fiber + konnektor + splice ≤ 28 dB |
| 8 | Envanter & Maliyet | Katalogdan ekipman toplamasi |

## Depolama

- **chrome.storage.local** ile `fp_` prefix
- `fp_current`: Tam proje durumu (Topology.getState())
- `fp_catalog_custom`: Ozel ekipman fiyatlandirmasi
- `fp_map_position`: Son harita viewport

## Yonlendirme Modlari

- **Auto mod:** MST otomatik hesaplanir, her degisiklikte yenilenir
- **Manual mod:** Kullanici kablo cizer, sadece HESAPLA butonunda yenilenir

## GPON Sabitleri (Class B+)

| Parametre | Deger |
|-----------|-------|
| Max kayip butcesi | 28 dB |
| Fiber kayip | 0.35 dB/km @ 1310nm |
| Konnektor kayip | 0.5 dB (4 konnektor) |
| Ekleme kayip | 0.1 dB (2 ekleme) |
| Max BB/port | 128 |
| Max ONT/port | 64 |
| Penetrasyon orani | %70 (ayarlanabilir) |

## Harita & NVI Entegrasyonu

- Kendi Leaflet haritasi (Overlay.js) — NVI'nin haritasindan bagimsiz
- NVI koordinatlari: MAIN world script injection ile yakalar
- CSP workaround: FetchTileLayer ile blob URL tile'lar

## Anahtar Dosyalar

| Dosya | Rol |
|-------|-----|
| lib/pon-engine.js | GPON hesaplamalar, CONSTANTS, CATALOG |
| lib/topology.js | Proje veri modeli, ada/bina CRUD |
| content/scraper.js | NVI DOM scraping |
| content/overlay.js | Leaflet harita, marker'lar, kablolar |
| content/panels.js | Toolbar + side panel UI |
| content/main.js | Entry point, orchestration |
| lib/map-utils.js | Pentagon icon, tile layer, renkler |
| lib/review-engine.js | Kalite siniflandirma (6 kategori) |
