# Kaynak Agaci Analizi

**Tarih:** 2026-03-08

---

## Proje Kok Dizini

```
NVI FIBER/
├── CLAUDE.md                    # Proje talimatlari (AI asistan icin)
├── .gitignore
│
├── fiber-chrome/                # [EXTENSION] Chrome Extension - Ana urun
│   ├── manifest.json            # Manifest V3 konfigurasyonu
│   ├── background.js            # Service Worker (IndexedDB, storage events)
│   ├── lib/                     # Core modul kutuphanesi (26 dosya)
│   │   ├── leaflet.js           # Harita kutuphanesi
│   │   ├── debug.js             # Debug logging
│   │   ├── ws-bridge.js         # WebSocket kopru
│   │   ├── event-bus.js         # Olay sistemi
│   │   ├── pon-engine.js        # ★ GPON hesaplamalar (CONSTANTS, CATALOG)
│   │   ├── topology.js          # ★ Proje veri modeli (PROJECT singleton)
│   │   ├── storage.js           # chrome.storage.local kalicilik
│   │   ├── command-manager.js   # Undo/redo komut gecmisi
│   │   ├── map-utils.js         # Pentagon icon, tile layer, renkler
│   │   ├── draw-polygon.js      # Polygon cizim modulu
│   │   ├── review-engine.js     # Kalite siniflandirma (6 kategori)
│   │   ├── activation.js        # Aktivasyon modeli
│   │   ├── variation.js         # Varyasyon olusturma
│   │   ├── financial.js         # Finansal hesaplamalar (MRR, ROI)
│   │   ├── marketing-data-house.js  # Pazarlama veri tabani
│   │   ├── ai-engine.js         # AI anomali tespiti
│   │   ├── live-monitor.js      # UISP/Zabbix canli izleme
│   │   ├── acs-manager.js       # TR-069/ACS yonetimi
│   │   ├── flow-analyzer.js     # NetFlow/sFlow trafik analizi
│   │   ├── qoe-engine.js        # Quality of Experience motoru
│   │   └── gdrive.js            # Google Drive entegrasyonu
│   ├── content/                 # NVI portal content scripts (6 dosya)
│   │   ├── scraper.js           # ★ NVI DOM scraping + world script injection
│   │   ├── nvi-cache.js         # NVI veri cache
│   │   ├── overlay.js           # ★ Leaflet harita UI (~3500 satir)
│   │   ├── heat-map.js          # Isi haritasi
│   │   ├── panels.js            # ★ Toolbar + side panel UI (~4300 satir)
│   │   └── main.js              # Entry point (init, auto-save, polling)
│   ├── styles/
│   │   ├── leaflet.css
│   │   └── overlay.css
│   ├── dashboard/               # CRM dashboard (ayri extension sayfasi)
│   │   ├── dashboard.html
│   │   ├── dashboard.js
│   │   └── test-topology.html   # Topology testleri
│   ├── popup/                   # Extension popup
│   │   └── popup.html
│   ├── icons/                   # Extension ikonlari (16-512px)
│   └── test/                    # Test dosyalari
│
├── portal/                      # [WEB] Abone Self-Servis Portal
│   ├── index.html               # SPA shell (hash routing)
│   ├── css/
│   │   └── portal.css           # Dark theme, responsive
│   ├── js/
│   │   ├── api-client.js        # Mock API (swap for real backend)
│   │   ├── portal.js            # SPA controller
│   │   ├── charts.js            # Canvas grafikleri
│   │   └── speedtest.js         # Hiz testi motoru
│   └── test-portal.html
│
├── nms/                         # [BACKEND] Network Management System
│   ├── package.json             # express, ws, ping
│   ├── server.js                # ★ Express + WebSocket server
│   ├── config/
│   │   ├── devices.json         # ★ 108 cihaz envanteri (20 site)
│   │   └── credentials.json     # ★ GIZLI - cihaz auth profilleri
│   ├── lib/
│   │   ├── device-manager.js    # Cihaz yonetimi + status tracking
│   │   └── ping-monitor.js      # Periyodik ping monitoring
│   └── public/
│       └── index.html           # Dashboard UI (inline JS + WebSocket)
│
├── scripts/                     # Yardimci scriptler
│   └── log-monitor.py           # Debug log monitor
│
├── _bmad/                       # BMAD Method konfigurasyonu
│   ├── _config/                 # Yardim CSV ve konfigurasyonlar
│   ├── core/                    # Core workflow engine
│   └── bmm/                     # BMM modulu (agents, workflows)
│
├── _bmad-output/                # BMAD ciktilari
│   ├── planning-artifacts/      # PRD, mimari, UX, epikler
│   ├── implementation-artifacts/ # Story dokumanlari, sprint durumu
│   └── project-context.md
│
└── docs/                        # Proje dokumantasyonu (bu dosyalar)
```

## Kritik Dosyalar (★ ile isaretli)

| Dosya | Satir | Onemi |
|-------|-------|-------|
| content/overlay.js | ~3700 | En buyuk dosya - Leaflet harita, tum UI modlari |
| content/panels.js | ~4300 | Toolbar, side panel, tum buton handler'lari |
| lib/pon-engine.js | ~1000 | GPON hesaplama motoru - CONSTANTS ve CATALOG |
| lib/topology.js | ~1100 | Proje veri modeli - PROJECT singleton |
| content/scraper.js | ~600 | NVI DOM scraping, world script injection |
| nms/server.js | ~200 | NMS sunucu - Express + WebSocket |
| nms/config/devices.json | ~2000 | 108 cihaz envanteri |
