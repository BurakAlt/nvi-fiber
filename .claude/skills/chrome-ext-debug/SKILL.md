---
name: chrome-ext-debug
description: Debug Chrome Extension content scripts and NVI integration issues
triggers:
  - debug extension
  - extension error
  - content script error
  - NVI not working
  - injection failed
  - log monitor
  - hata bul
---

# Chrome Extension Debug

## Debug System Architecture

```
Chrome Extension (NVI Portal)     Python Log Monitor (Terminal)
┌─────────────────────┐           ┌──────────────────────┐
│  debug.js           │  HTTP     │  log-monitor.py      │
│  - console hook     │ -------> │  - color-coded logs   │
│  - error capture    │ :7777    │  - error diagnosis    │
│  - DOM observer     │          │  - pattern matching   │
│  - snapshot()       │          │  - log file export    │
└─────────────────────┘           └──────────────────────┘
```

## Quick Start

### 1. Start Python Monitor
```bash
python scripts/log-monitor.py
```
Terminal'de renk kodlu loglar gorunur. Port 7777'de HTTP server acar.

### 2. Chrome Extension'i Yukle
- `chrome://extensions` → Developer Mode → Load unpacked → `fiber-chrome/`

### 3. NVI Portal'a Git
- `https://adres.nvi.gov.tr/VatandasIslemleri/AdresSorgu`
- Adres sorgula → Tablo gelince loglar Python'da gorunur

### 4. Manuel Debug (DevTools Console)
```js
// Sayfa durumu snapshot'i
__FPDebug.snapshot()

// Scraper test (tablo varsa)
__FPDebug.scrapeTest()

// Log gecmisi
__FPDebug.history()
```

## Log Levels

| Level | Color | Meaning |
|-------|-------|---------|
| LOG | Green | Normal FiberPlan log |
| WARN | Yellow | Uyari - islem devam ediyor |
| ERROR | Red | Hata - islem basarisiz |
| EXCEPTION | Red BG | Yakalanmamis hata / promise rejection |
| DOM | Cyan | DOM degisikligi (tablo satiri, harita, buton) |

## Error Pattern Auto-Diagnosis

Python monitor 14+ hata pattern'i otomatik tanir:

| Pattern | Tani | Fix |
|---------|------|-----|
| `X is not defined` | JS dosyasi yuklenmedi | manifest.json siralama kontrol |
| `Cannot read properties of null` | DOM element bulunamadi | snapshot() ile selector kontrol |
| `Content Security Policy` | CSP engelliyor | web_accessible_resources guncelle |
| `Timeout` | Element DOM'da belirmedi | Sayfa yavas veya selector yanlis |
| `IndexedDB` | Storage hatasi | Permission kontrol |
| `0 BB rows` | Tablo bos | NVI'de adres sorgula |

## Debug Flow (Self-Annealing)

```
1. python scripts/log-monitor.py  (terminal acik birak)
2. NVI portal ac, adres sorgula
3. Monitor'de hatalari oku:
   - TANI: Neyin bozuk oldugu
   - FIX: Ne yapilmasi gerektigi
4. Kodu duzelt
5. chrome://extensions → Reload
6. Tekrar test et
7. Hata kalmadiysa → production
```

## File Locations

| File | Purpose |
|------|---------|
| `fiber-chrome/lib/debug.js` | Extension-side log interceptor |
| `scripts/log-monitor.py` | Python real-time log server |
| `logs/fiberplan-*.jsonl` | Exported log files |

## manifest.json Load Order (Critical)

```
1. lib/debug.js        ← EN ONCE - diger hatalari yakalar
2. lib/pon-engine.js   ← Hesaplama motoru
3. lib/topology.js     ← Veri modeli (PonEngine'e bagimli)
4. lib/storage.js      ← IndexedDB (Topology'ye bagimli)
5. lib/map-utils.js    ← Harita yardimcilari (PonEngine'e bagimli)
6. content/scraper.js  ← NVI DOM scraping
7. content/overlay.js  ← Harita overlay
8. content/panels.js   ← UI paneller
9. content/main.js     ← EN SON - hepsini orkestra eder
```

## Common Issues & Solutions

### Content Script Not Loading
1. `chrome://extensions` → Errors sekmesi
2. manifest.json `matches` pattern: `https://adres.nvi.gov.tr/*`
3. `run_at: document_idle` olmali

### NVI DOM Selectors Broken
1. Monitor'de `DOM` loglarina bak
2. `__FPDebug.snapshot()` calistir → sampleRow incele
3. `scraper.js` selector'larini guncelle

### BB Rows Not Found
1. NVI'de adres sorgula, tablo gelsin
2. Monitor'de `BB rows appeared` logu gorulmeli
3. Gorunmuyorsa selector degismis: `tr[bagimsizbolumkimlikno]`

### Panels Breaking NVI Layout
1. Tum FP element'leri `position: fixed` olmali
2. NVI DOM'unu degistirmemeli, sadece ustune eklemeli
3. z-index: 9999+ kullan

## Learnings
<!-- Updated by self-annealing loop -->
- NVI uses `kale.Module` framework, dynamic SPA
- Table rows have `bagimsizbolumkimlikno` attribute
- Each row = 1 BB, group by `binaNo` label for building count
- "Dogrula" button class: `.haritaDogrulaButton`
- Add button container: `.dogrulamaButonContainer`
