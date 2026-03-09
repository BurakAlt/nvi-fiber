# NVI FIBER - Proje Genel Bakis

**Tarih:** 2026-03-08
**Tipi:** Multi-part (3 parcali) repository
**Dil:** Vanilla JavaScript (No Framework, No Build Step)

---

## Proje Amaci

NVI FIBER, Turkiye'deki NVI adres portalinda (adres.nvi.gov.tr) FTTH fiber optik ag planlama, cihaz izleme ve abone yonetimi icin gelistirilmis kapsamli bir sistemdir. Saha muhendisleri binalari secip GPON ITU-T G.984 Class B+ standartlarina uygun OLT yerlestirme, splitter kaskadi, kablo yonlendirme, kayip butcesi ve maliyet hesaplari yapar.

## Parcalar

| Parca | Dizin | Tip | Aciklama |
|-------|-------|-----|----------|
| **FiberPlan Chrome** | `fiber-chrome/` | Chrome Extension (Manifest V3) | Ana urun — FTTH fiber ag planlama, NVI portali uzerine content script enjeksiyonu |
| **Abone Portal** | `portal/` | Web SPA | Abone self-servis portali — fatura, paket, hiz testi, WiFi yonetimi |
| **NMS** | `nms/` | Node.js Backend | Network Management System — 108 cihaz real-time ping monitoring + dashboard |

## Teknoloji Ozeti

| Kategori | Teknoloji |
|----------|-----------|
| Dil | Vanilla JavaScript (ES5/ES6) |
| Harita | Leaflet.js |
| Backend | Node.js + Express.js |
| Realtime | WebSocket (ws) |
| Depolama | chrome.storage.local, IndexedDB |
| Build | Yok (no bundler) |
| Test | Browser-based (test-topology.html) |

## Mimari Yaklasim

- **IIFE Pattern:** Tum moduller `const Module = (() => { ... })()` seklinde
- **Global Namespace:** Import/export yok, her modul global degisken
- **Load Order:** manifest.json'daki script sirasi kritik (bagimlilik zinciri)
- **Ada-Scoped:** Her islem ada (city block) bazinda calisir
- **Event-Driven:** NVI DOM scraping (1s polling) → hesaplama → render → kaydetme

## Hizli Baslangic

### Chrome Extension
```bash
# chrome://extensions → Developer mode → Load unpacked → fiber-chrome/
```

### Portal
```bash
# portal/index.html dosyasini browserda ac
# Mock login: AB-1001 / demo
```

### NMS
```bash
cd nms
npm install
npm start
# http://localhost:3000
```

## Dokumantasyon Indeks

- [Mimari - Chrome Extension](./architecture-fiber-chrome.md)
- [Mimari - Portal](./architecture-portal.md)
- [Mimari - NMS](./architecture-nms.md)
- [Kaynak Agaci Analizi](./source-tree-analysis.md)
- [Gelistirme Rehberi](./development-guide.md)
- [Bilesen Envanteri](./component-inventory.md)
- [API Sozlesmesi - NMS](./api-contracts-nms.md)
