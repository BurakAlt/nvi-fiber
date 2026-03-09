# NVI FIBER — Proje Dokumantasyonu

**Son guncelleme:** 2026-03-08

---

## Hakkinda

NVI FIBER, Turkiye'nin NVI adres portali (adres.nvi.gov.tr) uzerinde FTTH fiber ag planlama, izleme ve yonetim sistemidir. Uc ana bilesenden olusur:

1. **Chrome Extension** (fiber-chrome/) — NVI portali uzerinde fiber topoloji planlama
2. **Abone Portali** (portal/) — Self-servis web uygulamasi
3. **NMS** (nms/) — Network Management System sunucusu

---

## Dokuman Indeksi

### Genel Bakis

| Dokuman | Aciklama |
|---------|----------|
| [Proje Genel Bakis](project-overview.md) | Proje ozeti, teknoloji yigini, hizli baslangic |
| [Kaynak Agaci Analizi](source-tree-analysis.md) | Tum dosya yapisi ve kritik dosyalar |
| [Gelistirme Rehberi](development-guide.md) | Kurulum, calistirma, debug, test talimatlari |

### Mimari

| Dokuman | Aciklama |
|---------|----------|
| [Chrome Extension Mimarisi](architecture-fiber-chrome.md) | Modul sistemi, veri akisi, GPON pipeline, harita entegrasyonu |
| [Portal Mimarisi](architecture-portal.md) | SPA yapisi, routing, mock API, grafik motoru |
| [NMS Mimarisi](architecture-nms.md) | Express sunucusu, ping monitor, WebSocket, dashboard |

### Teknik Referans

| Dokuman | Aciklama |
|---------|----------|
| [Bilesen Envanteri](component-inventory.md) | Tum modüller, UI bilesenleri, bagimlilik grafigi |
| [NMS API Sozlesmeleri](api-contracts-nms.md) | REST endpoint'ler, WebSocket protokolu, cihaz semasi |

---

## Hizli Erisim

### Calistirma Komutlari

```bash
# Chrome Extension → chrome://extensions → Paketlenmemis oge yukle → fiber-chrome/

# Portal
cd portal && python -m http.server 8080

# NMS
cd nms && npm install && npm start
```

### Onemli Dosyalar

| Dosya | Aciklama |
|-------|----------|
| `fiber-chrome/manifest.json` | Extension konfigurasyonu + modul yukleme sirasi |
| `fiber-chrome/lib/pon-engine.js` | GPON hesaplama motoru — CONSTANTS ve CATALOG |
| `fiber-chrome/lib/topology.js` | Proje veri modeli — PROJECT singleton |
| `fiber-chrome/content/overlay.js` | Leaflet harita UI (~3700 satir) |
| `nms/server.js` | NMS sunucusu — tum API endpoint'ler |
| `nms/config/devices.json` | 108 cihaz envanteri (20 site) |
| `CLAUDE.md` | AI asistan talimatlari |

### Domain Sabitleri (GPON Class B+)

| Parametre | Deger |
|-----------|-------|
| Max kayip butcesi | 28 dB |
| Fiber kaybi | 0.35 dB/km |
| Konnektor kaybi | 0.5 dB × 4 |
| Ek kaybi | 0.1 dB × 2 |
| Max BB/port | 128 |
| Max ONT/port | 64 |
| Penetrasyon orani | %70 (varsayilan) |

---

## Ilgili Kaynaklar

| Kaynak | Konum |
|--------|-------|
| Sprint durumu | `_bmad-output/implementation-artifacts/sprint-status.yaml` |
| Story dokumanlari | `_bmad-output/implementation-artifacts/` |
| Planlama ciktilari | `_bmad-output/planning-artifacts/` |
| Proje baglamı | `_bmad-output/project-context.md` |
