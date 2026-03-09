# Bilesen Envanteri

**Tarih:** 2026-03-08

---

## 1. Chrome Extension Modulleri (fiber-chrome/lib/)

### Cekirdek Modüller

| Modul | Dosya | ~Satir | Aciklama |
|-------|-------|--------|----------|
| PonEngine | pon-engine.js | 1000 | GPON hesaplama motoru (OLT, splitter, MST, kayip butcesi, envanter) |
| Topology | topology.js | 1100 | Proje veri modeli (PROJECT singleton, ada/bina CRUD, export) |
| Storage | storage.js | 400 | chrome.storage.local kalicilik katmani |
| MapUtils | map-utils.js | 350 | Pentagon ikon, tile layer, renk paleti, pointInPolygon |
| EventBus | event-bus.js | 80 | Publish/subscribe olay sistemi |
| Debug | debug.js | 60 | Debug log bridge |
| WsBridge | ws-bridge.js | 100 | WebSocket debug koprusu |
| CommandManager | command-manager.js | 300 | Undo/redo komut gecmisi |
| DrawPolygon | draw-polygon.js | 250 | Polygon cizim araci |

### Analiz ve Raporlama Modulleri

| Modul | Dosya | ~Satir | Aciklama |
|-------|-------|--------|----------|
| ReviewEngine | review-engine.js | 400 | Kalite siniflandirma (6 agirlikli kategori) |
| Activation | activation.js | 350 | Aktivasyon ve senaryo modeli |
| Variation | variation.js | 300 | Varyasyon olusturma motoru |
| Financial | financial.js | 500 | MRR, ROI, NPV, karlilk hesaplamalari |
| MarketingDataHouse | marketing-data-house.js | 400 | Pazarlama veri tabani |
| AiEngine | ai-engine.js | 500 | Anomali tespiti ve ariza tahmini |

### Ag Izleme Modulleri

| Modul | Dosya | ~Satir | Aciklama |
|-------|-------|--------|----------|
| LiveMonitor | live-monitor.js | 800 | UISP + Zabbix + karsilastirma (tek IIFE) |
| AcsManager | acs-manager.js | 400 | TR-069/ACS cihaz yonetimi |
| FlowAnalyzer | flow-analyzer.js | 400 | NetFlow/sFlow trafik analizi |
| QoeEngine | qoe-engine.js | 500 | Quality of Experience motoru |

### Harici Entegrasyonlar

| Modul | Dosya | ~Satir | Aciklama |
|-------|-------|--------|----------|
| GDrive | gdrive.js | 300 | Google Drive yedekleme |
| NviCache | nvi-cache.js | 200 | NVI portal veri cache |

---

## 2. Chrome Extension UI Bileşenleri (fiber-chrome/content/)

### overlay.js (~3700 satir)

Leaflet harita overlay'i — tum gorsel bilesen ve etkilesim modlarini yonetir.

| Bilesen | Fonksiyon(lar) | Aciklama |
|---------|---------------|----------|
| Harita | initMap() | Leaflet instance, Esri satellite tile |
| Toolbar | createToolbar() | Mod butonlari (OLT, KABLO, SINIR, TOPLU SEC) |
| Scoreboard | createScoreboard() | Ada istatistik paneli (BB, OLT, kayip) |
| Pentagon Marker | renderBuildings() | Bina SVG ikonlari (tip bazli renk) |
| Kablo Cizgileri | renderCables() | MST/manuel edge polyline'lari |
| Sinir Polygon | renderAdaBoundary() | Ada sinir polygonu + vertex marker'lari |
| Modal | createModal() | Ortalanmis dialog (liste, bilgi) |
| Toast | showToast() | Gecici bildirim mesaji (success/error/info) |
| Yardim Metni | setHelpText() | Toolbar altinda mod talimat satiri |
| Rectangle Select | onSelectMouseDown/Move/Up | Surukle-sec dikdortgeni |
| Vertex Edit | renderBoundaryVertices() | Sinir kose surukleme + ekleme/silme |

**Mod Sistemi:**

| Mod | Buton ID | Aciklama |
|-----|----------|----------|
| olt | fp-tb-mode-olt | OLT binasini tikla-ata |
| cable | fp-tb-mode-cable | Manuel kablo cizimi |
| boundary | fp-tb-mode-boundary | Sinir polygon cizimi |
| select | fp-tb-mode-select | Rectangle toplu secim |

### panels.js (~4300 satir)

Eski toolbar + side panel (display:none, API korunmus).

| Bilesen | Fonksiyon | Aciklama |
|---------|----------|----------|
| Ada Secici | renderAdaSelector() | Dropdown ile ada degistirme |
| Bina Listesi | renderBuildingList() | Inline edit, BB sayisi, sil butonu |
| Detay Paneli | showBuildingDetail() | Tek bina tum bilgileri |
| Kablo Modu | toggleCableMode() | KABLO CIZ acma/kapama |
| Toplu Silme | bulkDelete() | Secili binalari sil |
| Context Menu | showContextMenu() | Sag tik menusu |
| Bildirim | showNotification() | Overlay.showToast()'a yonlendirir |

### scraper.js (~600 satir)

NVI DOM scraping + MAIN world script injection.

| Bilesen | Fonksiyon | Aciklama |
|---------|----------|----------|
| DOM Scraper | scrapeBuildingTable() | `<tr bagimsizbolumkimlikno>` satirlarini parse et |
| Building Grouper | groupByBuilding() | Satirlari binaNo'ya gore grupla |
| Coord Reader | injectMainWorldCoordReader() | NVI Leaflet instance'indan koordinat oku |
| Polling | startPolling() | 1s aralikla DOM tarama |

### heat-map.js (~400 satir)

| Bilesen | Fonksiyon | Aciklama |
|---------|----------|----------|
| Isi Haritasi | renderHeatMap() | Canvas overlay ile yogunluk gorsellestirme |
| Katman Yonetimi | toggleLayer() | Katman ac/kapa |

### main.js (~300 satir)

| Bilesen | Fonksiyon | Aciklama |
|---------|----------|----------|
| Init | init() | Tum modulleri baslat |
| Auto-Save | setupAutoSave() | Degisiklikleri otomatik kaydet |
| Polling | setupPolling() | Scraper polling baslatma |
| Migration | migrateFromIndexedDB() | Eski IndexedDB → chrome.storage.local |

---

## 3. Portal Bilesenleri (portal/js/)

| Modul | Dosya | ~Satir | Aciklama |
|-------|-------|--------|----------|
| Portal | portal.js | 500 | SPA controller (hash routing, sayfa render) |
| ApiClient | api-client.js | 300 | Mock REST API (gercek backend icin swap) |
| PortalCharts | charts.js | 600 | Canvas grafikleri (sparkline, gauge, doughnut, speedometer) |
| SpeedTest | speedtest.js | 400 | Simulasyonlu hiz testi motoru |

**Portal Sayfalari (rotalar):**

| Rota | Aciklama |
|------|----------|
| #dashboard | Ana sayfa — ozet istatistikler |
| #services | Aktif hizmetler listesi |
| #invoices | Fatura gecmisi |
| #speedtest | Internet hiz testi |
| #support | Destek/ariza kaydı |
| #profile | Profil ayarlari |

---

## 4. NMS Bilesenleri (nms/)

| Modul | Dosya | ~Satir | Aciklama |
|-------|-------|--------|----------|
| server | server.js | 200 | Express + WebSocket sunucusu |
| DeviceManager | lib/device-manager.js | 178 | Cihaz CRUD + durum takibi |
| PingMonitor | lib/ping-monitor.js | 122 | Periyodik ICMP ping tarama |
| Dashboard | public/index.html | 650 | Inline JS ile tek sayfa izleme paneli |

**Dashboard UI Bilesenleri (inline):**

| Bilesen | Aciklama |
|---------|----------|
| Stats Bar | 4 kart: Toplam, Canli, Dusuk, Bilinmiyor |
| Filter Bar | 7 buton: Tumu, Canli, Dusuk, AP, Link, Switch, Router |
| Sites Grid | Site kartlari (durum cubugu + istatistik) |
| Device Table | Siralamalr tablo (8 sutun) |
| Search Box | Cihaz arama (ad, IP, site, marka) |
| Log Panel | Canli log satirlari (max 50) |

---

## 5. Bagimlilik Grafigi

```
fiber-chrome/ (Chrome Extension)
├── leaflet.js (vendor — harita)
├── debug.js → ws-bridge.js (debug koprusu)
├── event-bus.js (olay sistemi — bagimsiz)
├── pon-engine.js (bagimsiz — saf hesaplama)
├── topology.js → pon-engine.js (veri modeli + hesaplama)
├── storage.js → topology.js (kalicilik)
├── command-manager.js → topology.js, storage.js (undo/redo)
├── map-utils.js (bagimsiz — yardimci)
├── draw-polygon.js → map overlay (cizim)
├── review-engine.js → pon-engine.js (kalite analiz)
├── activation.js → topology.js (aktivasyon)
├── variation.js → topology.js, pon-engine.js (varyasyon)
├── financial.js → topology.js (finans)
├── marketing-data-house.js → topology.js (pazarlama)
├── ai-engine.js → topology.js, pon-engine.js (anomali)
├── live-monitor.js → event-bus.js (UISP/Zabbix)
├── acs-manager.js → event-bus.js (TR-069)
├── flow-analyzer.js → event-bus.js (NetFlow)
├── qoe-engine.js → event-bus.js (QoE)
├── scraper.js → NVI DOM (scraping)
├── nvi-cache.js → scraper.js (cache)
├── overlay.js → topology, map-utils, draw-polygon, storage
├── heat-map.js → overlay map
├── panels.js → topology, overlay, storage
└── main.js → tum moduller (orkestrasyon)

portal/ (Web SPA — bagimsiz)
├── portal.js → api-client.js
├── api-client.js (mock API)
├── charts.js (canvas — bagimsiz)
└── speedtest.js (bagimsiz)

nms/ (Node.js — bagimsiz)
├── server.js → device-manager, ping-monitor
├── device-manager.js → config/devices.json
└── ping-monitor.js → device-manager, ping (npm)
```

---

## 6. Harici Kutuphaneler

| Kutuphane | Versiyon | Konum | Kullanim |
|-----------|---------|-------|----------|
| Leaflet | 1.9.4 | fiber-chrome/lib/leaflet.js | Harita rendering |
| Express | ^4.21.0 | nms/node_modules | HTTP sunucusu |
| ws | ^8.18.0 | nms/node_modules | WebSocket sunucusu |
| ping | ^0.4.4 | nms/node_modules | ICMP ping |
