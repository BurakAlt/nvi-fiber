# Gelistirme Rehberi

**Tarih:** 2026-03-08

---

## Onkoşullar

| Arac | Versiyon | Aciklama |
|------|---------|----------|
| Google Chrome | 120+ | Manifest V3 destegi |
| Node.js | 18+ | NMS sunucusu icin |
| Python 3 | 3.8+ | Debug log monitor (opsiyonel) |
| Git | herhangi | Kaynak kontrolu |

---

## 1. Chrome Extension (fiber-chrome)

### Kurulum

```bash
# Build adimi yok — vanilla JS, dogrudan yukle
# 1. Chrome'da chrome://extensions adresine git
# 2. "Gelistirici modu"nu ac (sag ust)
# 3. "Paketlenmemis oge yukle" → fiber-chrome/ klasorunu sec
```

### Calisma Ortami

Extension yalnizca **adres.nvi.gov.tr** uzerinde calisir. Content script'ler NVI portalinin DOM'una enjekte olur.

### Debug

```bash
# Debug koprusu (ws-bridge.js → log-monitor.py)
python scripts/log-monitor.py
# http://127.0.0.1:7777/log adresine baglanir
# Tum Debug.log() mesajlarini gercek zamanli gosterir
```

Chrome DevTools uzerinden:
1. NVI portalini ac (adres.nvi.gov.tr)
2. F12 → Console
3. `FPDebug` namespace'i altinda tum modullere erisim mumkun
4. Content script loglari `[FP]` prefiksi ile gorunur

### Test

```
# Topology hesaplama testleri
fiber-chrome/dashboard/test-topology.html
# Tarayicida ac — otomatik test suite calisir
```

### Dosya Degisikligi Sonrasi

Extension dosyalarini degistirdikten sonra:
1. `chrome://extensions` → FiberPlan Chrome kartinda yenile (circular arrow) ikonuna tikla
2. NVI portalini yeniden yukle (F5)

### Kritik Notlar

- **Build yok.** Bundler, transpiler, minifier kullanilmiyor.
- **Load order onemli.** `manifest.json` → `content_scripts.js` dizisi bagimlilik sirasini belirler.
- **IIFE modulleri global.** Her modul `const Module = (() => { ... })()` seklinde tanimlanir.
- **Tip guvenlik kontrolu.** Diger modullere erisimden once: `if (typeof X !== 'undefined' && X.method)`

---

## 2. Portal (portal/)

### Kurulum

```bash
# Build yok — statik HTML/CSS/JS
# Herhangi bir HTTP sunucusu ile servir:
cd portal
python -m http.server 8080
# veya
npx serve .
```

### Yapi

- SPA (Single Page Application) — hash routing (`#dashboard`, `#speedtest`, vb.)
- `index.html` shell + `js/portal.js` controller
- `js/api-client.js` mock API — gercek backend eklendiginde sadece bu dosya degisecek

### Test

```
# Portal test sayfasi
portal/test-portal.html
# Tarayicida ac
```

---

## 3. NMS (nms/)

### Kurulum

```bash
cd nms
npm install
```

### Calistirma

```bash
# Production
npm start
# veya
node server.js

# Development (auto-reload)
npm run dev
# veya
node --watch server.js
```

### Ortam Degiskenleri

| Degisken | Varsayilan | Aciklama |
|----------|-----------|----------|
| `PORT` | 3000 | HTTP + WebSocket port |
| `PING_INTERVAL` | 60 | Ping dongusu araligi (saniye) |
| `PING_CONCURRENCY` | 10 | Ayni anda max ping sayisi |
| `PING_TIMEOUT` | 3 | Tek ping zaman asimi (saniye) |

### Erisim Noktalari

```
HTTP API:   http://localhost:3000/api/stats
Dashboard:  http://localhost:3000
WebSocket:  ws://localhost:3000
```

### Konfigürasyon Dosyalari

- `config/devices.json` — 108 cihaz envanteri + 20 site tanimlamasi
- `config/credentials.json` — Cihaz auth profilleri (GIZLI, .gitignore'da olmali)

### Yeni Cihaz Ekleme

`config/devices.json` → `devices` dizisine yeni obje ekle:

```json
{
  "id": "BENZERSIZ_ID",
  "ad": "Gorsel_Ad",
  "ip": "10.x.x.x",
  "tip": "AP|LINK|SW|POE-SW|ROUTER",
  "marka": "ubiquiti|mikrotik|tplink|...",
  "model": "Model adi",
  "credential": "profil-adi",
  "site": "site-anahtari",
  "rol": "ap|ptp-station|ptp-master|switch|router|...",
  "notlar": "Aciklama"
}
```

Yeni site icin `sites` objesine de ekleme yap.

---

## 4. Ortak Kurallar

### Kod Stili

- **Vanilla JS** — framework, TypeScript veya JSX yok
- **Degisken isimleri** Turkce/Ingilizce karisik (domain terimleri Turkce: ada, bina, cihaz, dusuk, canli)
- **Yorum dili** Turkce
- **Semicolon** kullanilir
- **Indentation** 2 space

### Git Akisi

```bash
# Tek branch: master
git add <dosyalar>
git commit -m "feat: Ozellik aciklamasi"
```

Commit mesaj ön-ekleri: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`

### BMAD Workflow

Proje yonetimi BMAD Method ile yapilir:
- Story dokumanlari: `_bmad-output/implementation-artifacts/`
- Sprint durumu: `_bmad-output/implementation-artifacts/sprint-status.yaml`
- Dev-story workflow: 10 adimli (implement → test → validate → complete)
- Code review: farkli LLM ile (Gemini onerilir)

---

## 5. Sorun Giderme

### Extension yuklenmiyor
- `manifest.json` dosyasinda syntax hatasi kontrol et
- Chrome'u tamamen kapat/ac
- `chrome://extensions` → "Hatalar" butonuna bak

### NVI portalinda panel gorunmuyor
- adres.nvi.gov.tr adresinde oldugundan emin ol
- Console'da hata mesajlarini kontrol et
- Extension'i yeniden yukle

### NMS ping sonuclari gelmiyor
- `config/devices.json` dosyasindaki IP adresleri dogru mu?
- Firewall ICMP'yi engelliyor olabilir
- `PING_TIMEOUT` degerini artir

### WebSocket baglantisi kurulamiyor
- NMS sunucusunun calistigini dogrula
- Port cakismasi kontrol et
- CORS baslik hatasi: farkli origin'den baglaniliyorsa `Access-Control-Allow-Origin` kontrol et
