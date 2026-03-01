---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-03-01'
inputDocuments:
  - '_bmad-output/planning-artifacts/product-brief-NVI FIBER-2026-02-28.md'
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
  - '_bmad-output/planning-artifacts/research/technical-gpon-ftth-tek-seviye-topoloji-research-2026-02-28.md'
  - '_bmad-output/project-context.md'
workflowType: 'architecture'
project_name: 'NVI FIBER'
user_name: 'BURAK'
date: '2026-02-28'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Proje Baglam Analizi

### Gereksinimler Genel Bakis

**Fonksiyonel Gereksinimler:**
77 FR, 17 yetenek alanina dagilmis. MVP kapsaminda 67 FR (FR1-FR67), Post-MVP'de 5 FR (FR68-72), Vizyon'da 5 FR (FR73-FR77). Hibrit gelistirme: mevcut modullerin ~%60'i korunacak (PonEngine, Topology, Scraper, MapUtils, ReviewEngine), ~%25 yeniden yazilacak (Panels → tek ekran UI, Storage → IndexedDB, Overlay → genisletilmis harita), ~%15 yeni modul (Varyasyon, MRR/ROI, Taahut/Kampanya, Pazarlama Data House, Isi Haritasi, Aktivasyon, NVI Cache).

**Fonksiyonel Olmayan Gereksinimler:**
- Performans: PonEngine < 100ms/50 bina, NVI scraping < 2s, IndexedDB I/O < 50ms
- Guvenlik: Sifreli IndexedDB, aktivasyon kodu/yonetici onayi, hassas veri uyarisi
- Olceklenebilirlik: 2 kullanici MVP, 500+ ada / 10.000+ bina / 100MB IndexedDB
- Guvenilirlik: Tam offline calisma, otomatik kayit, hata izolasyonu (ada bazinda)
- Loglama: 4 seviye (DEBUG/INFO/WARNING/ERROR), IndexedDB'de saklama
- Undo/Redo: Oturum boyunca, toplu islem destegi
- Otomatik yedekleme: 10 dk periyot, son 6 yedek

**Olcek ve Karmasiklik:**
- Birincil domain: Telecom fiber altyapi planlama (Chrome Extension)
- Karmasiklik seviyesi: YUKSEK
- Tahmini mimari bilesenler: ~15-18 modul
- Proje tipi: Brownfield hibrit gecis

### Teknik Kisitlamalar ve Bagimliliklar

1. **Chrome Manifest V3** — service worker yasam dongusu, background page yok
2. **Build step yok** — vanilla JS, IIFE pattern, manifest.json yukleme sirasi kritik
3. **NVI portal DOM bagimliligi** — dis kontrol disinda bagimlilik, scraper izolasyonu zorunlu
4. **CSP kisitlamalari** — NVI sayfasinin img-src politikasi, blob URL yaklasimi
5. **MAIN world injection** — NVI Leaflet instance koordinat yakalama
6. **IndexedDB gecisi** — chrome.storage.local'dan sifir veri kaybi ile migrasyon
7. **ITU-T G.984 Class B+** — GPON standart uyumu zorunlu (26.0 dB operator limiti)
8. **2 kullanici siniri** — MVP'de bagimsiz yerel veritabanlari, senkronizasyon yok

### Capraz Kesisen Endiseler

1. **Veri depolama gecisi** — chrome.storage.local → IndexedDB migrasyonu tum modulleri etkiler
2. **Tek ekran panel sistemi** — mevcut overlay + panels yeniden yapilandirmasi
3. **Erisim kontrolu (aktivasyon)** — tum extension islevselligini kapsayan guvenlik katmani
4. **Undo/Redo durum yonetimi** — tum kullanici islemlerini kapsayan command pattern
5. **Otomatik yedekleme** — arka plan zamanlayici, veri yazma koordinasyonu
6. **Loglama altyapisi** — tum modullerde seviye bazli tutarli log sistemi
7. **Penetrasyon orani yonetimi** — ada/bina bazinda, hesaplama zinciri boyunca tasinir

## Teknik Temel Degerlendirmesi

### Birincil Teknoloji Alani

Chrome Extension (Manifest V3) — NVI devlet portali uzerinde calisan FTTH fiber planlama araci. Brownfield proje, mevcut calisan sistem uzerine hibrit gecis.

### Starter Template Degerlendirmesi

Bu proje icin geleneksel starter template yaklasimi **uygulanamaz** cunku:
1. Mevcut calisan bir Chrome Extension var (~%60 korunacak)
2. Build step yok, vanilla JS - bu bilincli bir mimari karar
3. Framework bagimliligi yok - Chrome Extension icin hafif ve hizli

### Mevcut Teknik Temel (Korunan Mimari Kararlar)

**Dil ve Calisma Ortami:**
- Vanilla JavaScript (ES6+), TypeScript yok
- Build step yok, bundler yok — dogrudan tarayicida calisir
- Chrome Manifest V3 runtime

**Modul Sistemi:**
- IIFE pattern — her modul kendi kapsaminda izole
- Global API uzerinden moduller arasi iletisim
- manifest.json content_scripts sirasi ile bagimlilik yonetimi
- Yukleme sirasi: leaflet → debug → ws-bridge → pon-engine → topology → storage → map-utils → draw-polygon → review-engine → scraper → overlay → panels → main

**Stil Cozumu:**
- Satir ici CSS ve Chrome Extension icin ayri CSS dosyalari
- NVI portal DOM'una enjekte edilen stiller

**Harita Altyapisi:**
- Leaflet.js (dis kutuphane, CDN/yerel)
- Esri World Imagery uydu karolari
- CSP-safe blob URL tile yuklemesi (MapUtils.FetchTileLayer)

**Veri Yonetimi (Mevcut → Hedef):**
- Mevcut: chrome.storage.local (fp_ prefix)
- Hedef: IndexedDB (offline calisma, NVI veri cache, daha buyuk kapasite)
- Gecis: Sifir veri kaybi migrasyonu gerekli

**Test Altyapisi:**
- Tarayici tabanli HTML test dosyasi (test-topology.html)
- Manuel test — otomatik CI/CD yok

**Gelistirme Deneyimi:**
- Hot reload: Chrome Extension reload (chrome://extensions)
- Debug: python scripts/log-monitor.py (ws-bridge uzerinden)
- Kaynak harita yok (vanilla JS, gerek yok)

### Neden Bu Teknik Temel Korunuyor?

1. **Basitlik:** Build step olmamasi, deployment'i "extension yukle" kadar basit tutar
2. **Saha uygunlugu:** Saha muhendisi aninda kullanabilir, karmasik toolchain yok
3. **Hata ayiklama:** Kaynak kod dogrudan okunabilir, transpile/minify yok
4. **Chrome Extension uyumu:** Manifest V3 content scripts zaten vanilla JS bekler
5. **Mevcut kanit:** Hesaplama motoru (PonEngine) standartlara uygun calisiyor (arastirma ile dogrulanmis)

### Evrim Stratejisi

Mevcut temel korunurken MVP kapsaminda eklenen yenilikler:
- **IndexedDB katmani:** Yeni depolama modulu (mevcut API'yi koruyarak)
- **Tek ekran panel:** Mevcut panels.js yeniden yapilandirmasi
- **Yeni moduller:** Ayni IIFE pattern ile eklenir, manifest.json'a yukleme sirasina gore dahil edilir
- **Undo/Redo:** Command pattern ile durum yonetimi katmani
- **Loglama:** Mevcut debug modulu genisletilir

Post-MVP'de potansiyel evrim:
- TypeScript gecisi (opsiyonel, build step gerektirir)
- Bundler ekleme (Vite/esbuild — sadece backend entegrasyonu ile birlikte)
- CI/CD pipeline (otomatik test ve paketleme)

## Temel Mimari Kararlar

### Karar Oncelik Analizi

**Kritik Kararlar (Implementasyonu Bloklar):**
- IndexedDB coklu store sema tasarimi
- Dual-read migrasyon stratejisi
- Event bus katmani (undo/redo entegrasyonu icin)
- Hibrit panel sistemi (tek ekran deneyimi)

**Onemli Kararlar (Mimariyi Sekillendirir):**
- Command pattern undo/redo
- Error boundary hata yonetimi
- Canvas overlay isi haritasi
- Katman kontrol paneli

**Ertelenen Kararlar (Post-MVP):**
- Backend API tasarimi ve iletisim protokolu
- Coklu kullanici senkronizasyonu
- CI/CD pipeline
- Chrome Web Store dagitimi
- TypeScript gecisi

### Veri Mimarisi

| Karar | Secim | Gerekce | Etkiler |
|-------|-------|---------|---------|
| IndexedDB Sema | Coklu Store (normalize) | 500+ ada, 10.000+ bina olceginde performans; ada bazinda bagimsiz I/O; undo/redo ve yedekleme icin uygun | Tum moduller — Storage API degisir |
| Migrasyon | Dual-Read gecis | Sifir veri kaybi garantisi; eski veri okunabilir kalir; asamali gecis riski azaltir | Storage, main.js init sureci |
| Undo/Redo | Command Pattern | Her islem {do, undo} cifti; verimli bellek; event bus ile dogal entegrasyon | Tum kullanici islemleri, event bus |
| NVI Cache | Ilk cekimde cache + manuel yenileme | Basit, offline uyumlu; NVI'ya gereksiz istek atmaz | Scraper, IndexedDB nviCache store |
| Yedekleme | Tam snapshot / 10 dk / son 6 | Basit implementasyon; tutarli geri donme noktasi | IndexedDB backups store |

**IndexedDB Store Yapisi:**
- `adas` — ada verileri (topoloji, hesaplamalar dahil)
- `buildings` — bina detaylari (ada_id ile iliskili)
- `calculations` — hesaplama sonuclari (ada_id ile iliskili)
- `settings` — kullanici ayarlari, katalog fiyatlari, harita pozisyonu
- `backups` — 10 dk snapshot'lar, son 6 yedek
- `logs` — seviye bazli log kayitlari
- `nviCache` — NVI'dan cekilen ada/bina ham verileri

### Guvenlik ve Erisim Kontrolu

| Karar | Secim | Gerekce | Etkiler |
|-------|-------|---------|---------|
| Aktivasyon | Anahtar cifti | Master key ile benzersiz kullanici kodlari; yerel dogrulama; backend gerektirmez | Aktivasyon modulu, extension init |
| Sifreleme | Obfuscation (XOR/Base64) | Sifir performans etkisi; MVP icin yeterli; backend geldiginde guclendirilir | IndexedDB yazma/okuma katmani |
| Export guvenlik | Sadece uyari dialogu | Basit, etkili; kullanici farkindaliği | Export fonksiyonlari |

### Moduller Arasi Iletisim ve Hata Yonetimi

| Karar | Secim | Gerekce | Etkiler |
|-------|-------|---------|---------|
| Olay iletisimi | Event Bus katmani | Mevcut dogrudan cagrilar korunur; yeni moduller event bus kullanir; undo/redo ve loglama icin dogal entegrasyon noktasi | Yeni EventBus modulu, command pattern, debug |
| Hata yonetimi | Error Boundary pattern | Her modul kendi hata siniri; graceful degradation; ada bazinda izolasyon — bir ada hatasi digerlerini etkilemez | Tum moduller |
| Loglama | Debug modulu genisletme | Performans odakli: mevcut ws-bridge korunur; seviye destegi (DEBUG/INFO/WARNING/ERROR) + IndexedDB log store; asenkron yazma | Debug modulu, IndexedDB logs store |

### Frontend Mimarisi

| Karar | Secim | Gerekce | Etkiler |
|-------|-------|---------|---------|
| Panel sistemi | Hibrit (sekmeler + katlanir bolumler) | Ana sekmeler: Planlama \| Analiz \| Yonetim; her sekme icinde accordion alt bolumler; derin organizasyon + esnek gorunum | Panels yeniden yazimi |
| Isi haritasi | Canvas Overlay | Ozel canvas katmani; tam kontrol; yuksek performans; buyuk veri setlerinde akici render | Yeni HeatMap modulu, Leaflet entegrasyonu |
| Varyasyon UI | Yan yana tablo | Sutunlarda senaryolar, satirlarda metrikler; en az 3 senaryo; net karsilastirma | Varyasyon modulu UI |
| Harita modlari | Katman kontrol paneli | Leaflet layer control tarzi; katmanlar bagimsiz acilip kapanir; isi haritasi + kablo ayni anda gorunebilir | Overlay genisletme |

### Altyapi ve Dagitim

| Karar | Secim | Gerekce | Etkiler |
|-------|-------|---------|---------|
| Dagitim | Manuel .crx | 2 kullanici icin yeterli; hizli; developer mode ile yukle | Paketleme scripti |
| Versiyon | Tarih damgasi (2026.02.28) | Basit, siralama kolay; manifest.json'da version alani | manifest.json |
| Test | HTML test genisletme | Her modul icin ayri HTML test dosyasi; tarayicida ac, sonuclari gor; mevcut yaklasim ile tutarli | test/ klasoru |

### Karar Etki Analizi

**Implementasyon Sirasi:**
1. EventBus modulu (diger modullerin bagimliligi)
2. Debug modulu genisletme (loglama altyapisi)
3. IndexedDB Storage modulu (coklu store + migrasyon)
4. Command Pattern / Undo-Redo modulu (event bus + storage bagimliligi)
5. Aktivasyon sistemi (extension init)
6. Panel sistemi yeniden yapisi (hibrit sekmeler)
7. Yeni hesaplama modulleri (varyasyon, MRR/ROI, taahut)
8. Isi haritasi canvas overlay
9. Katman kontrol paneli
10. Otomatik yedekleme zamanlayici

**Capraz Bilesen Bagimliliklari:**
- EventBus → Command Pattern → Undo/Redo (zincir bagimlilik)
- IndexedDB Storage → Migrasyon → Yedekleme (veri katmani zinciri)
- Panel Sistemi → Varyasyon UI → Finansal UI (gorunum zinciri)
- Debug Genisletme → Tum moduller (loglama altyapisi)

## Implementasyon Kaliplari & Tutarlilik Kurallari

### Tanimlanan Kalip Kategorileri

**Belirlenen Catisma Noktalari:** 12 alan — adlandirma, yapi, format, iletisim ve surec kategorilerinde AI ajanlarin farkli secimler yapabilecegi noktalar

### Adlandirma Kaliplari

**Dosya Adlandirma:**
- kebab-case: `pon-engine.js`, `map-utils.js`, `draw-polygon.js`
- Dizinler: `lib/`, `content/`, `styles/`, `dashboard/`, `popup/`, `test/`

**IIFE Modul Adlari:**
- PascalCase: `PonEngine`, `Topology`, `NviScraper`, `MapUtils`, `DrawPolygon`
- Yeni moduller: `EventBus`, `CommandManager`, `HeatMap`, `Activation`
- Tanim: `const ModuleName = (() => { ... })();`
- Eski moduller `var` kullanir, yeni moduller `const` kullanir

**Fonksiyon ve Degisken Adlandirma:**
- camelCase: `getCatalog()`, `createAda()`, `handleDrawBoundary()`, `renderBuildingList()`
- Ozel degiskenler `_` prefix: `var _map = null;`, `var _active = false;`
- Kisa dongu degiskenleri kabul: `b1`, `b2`, `i`, `s`, `m`

**Sabit Adlandirma:**
- Modul sabitleri UPPER_SNAKE obje: `const CONSTANTS = { ... }`, `const CATALOG = { ... }`, `const SELECTORS = { ... }`
- Obje ici anahtarlar camelCase: `maxLossBudget`, `fiberLoss1310`, `penetrationTarget`
- Stil sabitleri UPPER_SNAKE: `var CABLE_STYLES = { ... }`, `var VERTEX_STYLE = { ... }`

**CSS Sinif Adlandirma:**
- `fp-` prefix + kebab-case: `fp-btn`, `fp-side-panel`, `fp-toolbar-inner`, `fp-building-list`
- CSS degiskenleri: `--fp-bg`, `--fp-accent`
- ID'ler: `fp-toolbar`, `fp-side-panel`, `fp-stat-ada`

**Storage Anahtar Adlandirma:**
- `fp_` prefix + snake_case: `fp_current`, `fp_map_position`, `fp_catalog_custom`

### Yapi Kaliplari

**Modul Yapisi (IIFE Sablonu):**
```javascript
/**
 * ModuleName - Kisa aciklama (Ingilizce)
 * Detayli aciklama satiri
 */
const ModuleName = (() => {
  'use strict';
  // ─── CONSTANTS ─────────────────────────────────────────
  const CONFIG = { ... };
  // ─── PRIVATE STATE ─────────────────────────────────────
  var _state = null;
  // ─── PRIVATE FUNCTIONS ─────────────────────────────────
  function helperFn() { ... }
  // ─── PUBLIC API ────────────────────────────────────────
  return {
    init: init,
    publicMethod: publicMethod,
  };
})();
```

**Dosya Basligi:**
- JSDoc blok yorum, Ingilizce
- Modul adi, kisa aciklama, alt aciklama

**Bolum Ayraclari:**
- `// ─── SECTION NAME ────────────────────────────────────` formati

**Test Dosyalari:**
- Konum: `test/test-{modul-adi}.html`
- Tarayicida acilir, sonuclar DOM'a yazilir
- Her modul icin ayri test dosyasi

**manifest.json Yukleme Sirasi:**
- Yeni moduller bagimlilik sirasina gore eklenir
- EventBus: debug'dan sonra, diger modullerden once
- CommandManager: event-bus'tan sonra

### Format Kaliplari

**IndexedDB Store Adlandirma:**
- camelCase store isimleri: `adas`, `buildings`, `calculations`, `settings`, `backups`, `logs`, `nviCache`
- Index isimleri: `by_{field}` formati — or: `by_adaId`, `by_timestamp`

**Veri Yapilari (JSON Serilestirilebilir):**
- Tarih: ISO string (`new Date().toISOString()`)
- ID: `Date.now().toString(36)` veya `crypto.randomUUID()` (mevcut `generateAdaCode()` pattern)
- Boolean: `true/false` (1/0 yok)
- Null: explicit `null` (undefined kullanilmaz — JSON'da kaybolur)

**Log Mesaj Formati:**
- Pattern: `[ModuleName] Mesaj` — or: `[EventBus] Registered: ada:created`
- Seviyeler: `console.log` (INFO), `console.warn` (WARNING), `console.error` (ERROR)

### Iletisim Kaliplari

**Event Bus Olay Adlandirma:**
- Format: `namespace:action` — or: `ada:created`, `building:added`, `storage:saved`
- Undo/redo olaylari: `command:execute`, `command:undo`, `command:redo`
- UI olaylari: `panel:refresh`, `overlay:render`
- Payload: `{ type: 'ada:created', data: { ... }, timestamp: ISO_string }`

**Mevcut DOM Olaylari:**
- `fiberplan-change` — kebab-case, mevcut pattern korunur

**Chrome Mesajlari:**
- Obje tabanli: `{ type: 'action-name', data: { ... } }`

### Surec Kaliplari

**Hata Yonetimi:**
```javascript
try {
  // islem
} catch (err) {
  console.error('[ModuleName] Aciklama:', err);
  // graceful degradation — hata ust katmana yayilmaz
}
```
- Ada bazinda izolasyon: bir ada hatasi digerlerini etkilemez
- Null/undefined kontrol: `if (!data || !data.id) return;`
- Promise hata: `chrome.runtime.lastError` kontrolu

**Yukleme Durumlari:**
- Basit boolean flag: `var _loading = false;`
- UI feedback: `fp-status-msg` elementine mesaj yazma
- Asenkron islem tamamlaninca flag sifirlama

### Uygulama Yonergeleri

**Tum AI Ajanlari MUTLAKA:**
1. IIFE pattern kullanmali, import/export YASAK
2. `fp-` CSS prefix kullanmali
3. `fp_` storage prefix kullanmali
4. `[ModuleName]` log prefix kullanmali
5. camelCase fonksiyon/degisken, PascalCase modul adi
6. JSDoc ile fonksiyon dokumantasyonu (Ingilizce)
7. Error boundary — try/catch ile hata izolasyonu
8. `manifest.json` content_scripts sirasina yeni modulu dogru yere eklemeli
9. JSON serilestirilebilir veri yapilari (Date objesi yok, ISO string kullan)
10. Mevcut global API pattern'i takip et (return objesi ile public API)

**Kalip Uygulamasi:**
- Kod incelemesinde kalip uyumu kontrol edilir
- Yeni moduller mevcut modullerin yapisini referans alir
- Kalip ihlalleri ReviewEngine raporlarinda belirtilir

### Kalip Ornekleri

**Dogru Ornekler:**
```javascript
// Modul tanimı — DOGRU
const EventBus = (() => {
  'use strict';
  var _listeners = {};
  function on(event, callback) { ... }
  function emit(event, data) { ... }
  return { on: on, emit: emit, off: off };
})();

// CSS sinifi — DOGRU
'<div class="fp-event-log">'

// Storage anahtari — DOGRU
'fp_event_history'

// Log mesaji — DOGRU
console.log('[EventBus] Registered: ada:created');
```

**Anti-Patternler (YASAK):**
```javascript
// ES module — YASAK
import { something } from './module.js';

// class sozdizimi — YASAK
class EventBus { constructor() {} }

// fp- prefix'siz CSS — YASAK
'<div class="event-log">'

// Framework bagimliligi — YASAK
import React from 'react';

// window ile global kirletme — YASAK
window.myHelper = function() {};
```

## Proje Yapisi & Sinirlari

### Tam Proje Dizin Yapisi

```
fiber-chrome/
├── manifest.json                    # Extension yapisi, yukleme sirasi, izinler
├── background.js                    # Service worker (Manifest V3)
│
├── lib/                             # Paylasilan kutuphaneler (content + dashboard)
│   ├── leaflet.js                   # Leaflet harita kutuphanesi (dis)
│   ├── debug.js                     # FPDebug — loglama (GENISLETILECEK: seviye + IndexedDB)
│   ├── ws-bridge.js                 # WebSocket debug koprusu
│   ├── event-bus.js                 # ★ YENI — EventBus (namespace:action olaylari)
│   ├── pon-engine.js                # PonEngine — GPON hesaplamalari (KORUNACAK)
│   ├── topology.js                  # Topology — proje veri modeli (KORUNACAK)
│   ├── storage.js                   # Storage — IndexedDB + migrasyon (YENIDEN YAZILACAK)
│   ├── command-manager.js           # ★ YENI — CommandManager undo/redo
│   ├── map-utils.js                 # MapUtils — harita yardimcilari (KORUNACAK)
│   ├── draw-polygon.js              # DrawPolygon — sinir cizimi (KORUNACAK)
│   ├── review-engine.js             # ReviewEngine — kalite siniflandirici (KORUNACAK)
│   ├── activation.js                # ★ YENI — Activation anahtar cifti dogrulama
│   ├── variation.js                 # ★ YENI — Varyasyon/senaryo karsilastirma
│   ├── financial.js                 # ★ YENI — MRR/ROI/taahut hesaplamalari
│   └── gdrive.js                    # Google Drive entegrasyonu (mevcut, Post-MVP)
│
├── content/                         # NVI portala enjekte edilen icerik
│   ├── scraper.js                   # NviScraper — DOM scraping (KORUNACAK)
│   ├── overlay.js                   # Overlay — Leaflet harita katmani (GENISLETILECEK)
│   ├── panels.js                    # Panels — UI panel sistemi (YENIDEN YAZILACAK)
│   ├── heat-map.js                  # ★ YENI — HeatMap canvas overlay
│   ├── nvi-cache.js                 # ★ YENI — NviCache IndexedDB cache katmani
│   └── main.js                      # FiberPlanInit — giris noktasi, orkestrasyon
│
├── styles/                          # CSS dosyalari
│   ├── leaflet.css                  # Leaflet stilleri
│   ├── overlay.css                  # Harita + panel stilleri (GENISLETILECEK)
│   └── images/                      # Leaflet marker ikonlari
│       ├── layers.png
│       ├── layers-2x.png
│       ├── marker-icon.png
│       ├── marker-icon-2x.png
│       └── marker-shadow.png
│
├── popup/                           # Extension popup
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
│
├── dashboard/                       # Tam sayfa CRM dashboard
│   ├── dashboard.html
│   ├── dashboard.css
│   ├── dashboard.js
│   └── test-topology.html           # Mevcut topoloji testi
│
├── test/                            # ★ YENI — Modul testleri
│   ├── test-event-bus.html
│   ├── test-storage.html
│   ├── test-command-manager.html
│   ├── test-activation.html
│   ├── test-variation.html
│   ├── test-financial.html
│   └── test-heat-map.html
│
└── icons/                           # Extension ikonlari
    ├── icon.svg
    ├── favicon-16x16.png
    ├── favicon-32x32.png
    ├── android-chrome-192x192.png
    ├── android-chrome-512x512.png
    └── about.txt
```

### manifest.json Yukleme Sirasi (MVP)

```
content_scripts[0].js sirasi:
  1.  lib/leaflet.js
  2.  lib/debug.js              ← genisletilmis (seviye + IndexedDB log)
  3.  lib/ws-bridge.js
  4.  lib/event-bus.js           ★ YENI
  5.  lib/pon-engine.js
  6.  lib/topology.js
  7.  lib/storage.js             ← yeniden yazilmis (IndexedDB)
  8.  lib/command-manager.js     ★ YENI
  9.  lib/map-utils.js
  10. lib/draw-polygon.js
  11. lib/review-engine.js
  12. lib/activation.js          ★ YENI
  13. lib/variation.js           ★ YENI
  14. lib/financial.js           ★ YENI
  15. content/scraper.js
  16. content/overlay.js         ← genisletilmis (katman kontrol)
  17. content/heat-map.js        ★ YENI
  18. content/nvi-cache.js       ★ YENI
  19. content/panels.js          ← yeniden yazilmis (hibrit sekmeler)
  20. content/main.js
```

### Mimari Sinirlar

**Modul Sinirlari (IIFE Kapsami):**
- Her modul kendi IIFE kapsaminda izole
- Moduller arasi iletisim: global API veya EventBus
- Hic bir modul baska modulun ozel durumuna dogrudan erismez

**Veri Sinirlari:**
- IndexedDB: 7 store (adas, buildings, calculations, settings, backups, logs, nviCache)
- Her store tek sorumlu — capraz store islemleri Storage API uzerinden
- Migrasyon katmani: chrome.storage.local → IndexedDB (dual-read)

**Olay Sinirlari:**
- EventBus: `namespace:action` formati
- Mevcut dogrudan cagrilar korunur (PonEngine.recalculateAda, Storage.save vb.)
- Yeni moduller EventBus tercih eder

**Guvenlik Sinirlari:**
- Activation modulu: extension init'te dogrulama, basarisiz = UI kilitli
- Sifreleme: IndexedDB yazma/okuma katmaninda (Storage modulu ici)
- Export: uyari dialogu paneller seviyesinde

### Gereksinim → Yapi Eslestirmesi

| FR Kategorisi | Birincil Dosya(lar) | Destek Dosya(lari) |
|---------------|--------------------|--------------------|
| Ada/Bina Yonetimi (FR1-FR10) | topology.js, panels.js | storage.js, overlay.js |
| NVI Scraping (FR11-FR15) | scraper.js, nvi-cache.js | main.js |
| GPON Hesaplama (FR16-FR25) | pon-engine.js | topology.js |
| Harita Gorsellestime (FR26-FR32) | overlay.js, heat-map.js, map-utils.js | draw-polygon.js |
| Varyasyon Analizi (FR33-FR38) | variation.js | pon-engine.js, panels.js |
| Finansal Analiz (FR39-FR45) | financial.js | variation.js, panels.js |
| Panel UI (FR46-FR55) | panels.js | overlay.js, topology.js |
| Undo/Redo (FR56-FR58) | command-manager.js | event-bus.js, storage.js |
| Yedekleme (FR59-FR61) | storage.js | main.js (zamanlayici) |
| Loglama (FR62-FR64) | debug.js | storage.js (IndexedDB log) |
| Aktivasyon (FR65-FR67) | activation.js | main.js, popup.js |

### Capraz Kesisen Endise Eslestirmesi

| Endise | Etkiledigi Dosyalar |
|--------|---------------------|
| EventBus | event-bus.js → tum yeni moduller |
| Undo/Redo | command-manager.js → panels.js, topology.js, overlay.js |
| Migrasyon | storage.js → main.js (init sirasi) |
| Loglama | debug.js → tum moduller |
| Aktivasyon | activation.js → main.js (init gate) |
| Penetrasyon Orani | topology.js → pon-engine.js → panels.js |

### Veri Akisi

```
NviScraper (DOM polling 1s)
  → NviCache.store() → IndexedDB nviCache
  → main.js → Topology.addBuilding()
  → EventBus.emit('building:added')
  → CommandManager.execute(AddBuildingCmd)
  → PonEngine.recalculateAda()
  → EventBus.emit('ada:recalculated')
  → Overlay.render() + Panels.refresh()
  → Storage.autoSave() → IndexedDB adas/buildings/calculations
```

## Mimari Dogrulama Sonuclari

### Tutarlilik Dogrulamasi ✅

**Karar Uyumlulugu:**
- Vanilla JS + IIFE pattern tum modullerde tutarli — cakisma yok
- IndexedDB coklu store + dual-read migrasyon Storage modulunde kapsulleniyor
- EventBus → CommandManager → Storage zincir bagimliligi yukleme sirasiyla uyumlu
- Error Boundary pattern her modulde bagimsiz uygulanabilir
- Tum kararlar Chrome Extension Manifest V3 kisitlamalariyla uyumlu

**Kalip Tutarliligi:**
- Adlandirma konvansiyonlari mevcut kodla %100 uyumlu (dogrudan koddan cikarildi)
- IIFE sablonu, log prefix, CSS prefix kurallari celiskisiz
- Event Bus `namespace:action` formati mevcut `fiberplan-change` DOM olayiyla cakismaz

**Yapi Uyumu:**
- `lib/` → paylasilan moduller, `content/` → NVI'ya enjekte — sinir net
- manifest.json yukleme sirasi bagimlilik zincirini dogru yansitiyor
- Dashboard ayri sayfa olarak lib/ modullerini bagimsiz yukler

### Gereksinim Kapsama Dogrulamasi ✅

**Fonksiyonel Gereksinimler (67 MVP FR):**
- FR1-FR67 tamami mimari bilesenlerle eslestirilmis
- 11 FR kategorisinin her biri en az bir birincil module atanmis

**Not — Pazarlama Data House:**
PRD'de belirtilen "Pazarlama Data House" modulu yapida financial.js altinda ortuk olarak kapsaniyor. Post-MVP kapsaminda oldugu icin kritik degil; gerekirse ayri modul olarak cikarilabilir.

**Fonksiyonel Olmayan Gereksinimler:**

| NFR | Mimari Destek | Durum |
|-----|---------------|-------|
| Performans <100ms | PonEngine mevcut haliyle sagliyor | ✅ |
| IndexedDB I/O <50ms | Coklu store normalize yapi | ✅ |
| Offline calisma | IndexedDB + backend bagimsizligi | ✅ |
| Guvenlik | Activation + obfuscation | ✅ |
| Loglama 4 seviye | Debug genisletme + IndexedDB logs | ✅ |
| Undo/Redo | CommandManager + EventBus | ✅ |
| Otomatik yedekleme | Storage + main.js zamanlayici | ✅ |
| 500+ ada olcek | IndexedDB normalize store | ✅ |

### Implementasyon Hazirlik Dogrulamasi ✅

**Karar Tamligi:** Tum kritik ve onemli kararlar gerekce ile belgelenmis. Ertelenen kararlar acikca isaretli (Post-MVP).

**Yapi Tamligi:** 20 dosyalik manifest yukleme sirasi, 7 IndexedDB store, tam dizin agaci tanimli.

**Kalip Tamligi:** Adlandirma (6 kategori), yapi (IIFE sablon), format (veri tipleri), iletisim (EventBus), surec (hata yonetimi) — tum kategoriler ornekli.

### Bosluk Analizi

**Kritik Bosluk:** Yok

**Onemli Bosluklar:**
1. Pazarlama Data House — PRD'de ayri modul, yapida financial.js altinda ortuk. Post-MVP'de gerekirse ayrilabilir.

**Kucuk Notlar:**
- `test_penetration.js` kok dizinde — `test/` altina tasinabilir
- `gdrive.js` Post-MVP — MVP manifest'ine dahil edilmemeli

### Mimari Tamlik Kontrol Listesi

**✅ Gereksinim Analizi**
- [x] Proje baglami analiz edildi
- [x] Olcek ve karmasiklik degerlendirildi
- [x] Teknik kisitlamalar belirlendi
- [x] Capraz kesisen endiseler haritalandi

**✅ Mimari Kararlar**
- [x] 18 karar 5 kategoride belgelenmis
- [x] Teknoloji yigini tam olarak belirtilmis
- [x] Entegrasyon kaliplari tanimli
- [x] Performans gereksinimleri adreslenmis

**✅ Implementasyon Kaliplari**
- [x] Adlandirma kurallari 6 kategoride
- [x] Yapi kaliplari (IIFE sablon) tanimli
- [x] Iletisim kaliplari (EventBus) belirtilmis
- [x] Surec kaliplari (hata yonetimi) belgelenmis
- [x] Anti-patternler listelenmis

**✅ Proje Yapisi**
- [x] Tam dizin yapisi tanimli
- [x] Bilesen sinirlari belirlenmis
- [x] Entegrasyon noktalari haritlanmis
- [x] FR → yapi eslestirmesi tamamlanmis

### Mimari Hazirlik Degerlendirmesi

**Genel Durum:** IMPLEMENTASYONA HAZIR

**Guven Seviyesi:** YUKSEK — brownfield proje, mevcut calisan kodun konvansiyonlari dogrudan kullaniliyor

**Guclu Yonler:**
- Mevcut calisan sistemin kanitlanmis kaliplari uzerine insa
- Basit, build step'siz mimari — hata ayiklama ve dagitim kolayligi
- Net modul sinirlari ve yukleme sirasi
- GPON hesaplamalari arastirma ile dogrulanmis

**Gelecek Iyilestirme Alanlari:**
- TypeScript gecisi (Post-MVP)
- CI/CD pipeline (Post-MVP)
- Backend API ve coklu kullanici senkronizasyonu (Post-MVP)
- Chrome Web Store dagitimi (Post-MVP)

### Implementasyon Devir Teslimi

**AI Ajan Yonergeleri:**
- Tum mimari kararlari belgelendirilmis sekliyle tam olarak takip et
- Implementasyon kaliplarini tum bilesenler arasinda tutarli kullan
- Proje yapisi ve sinirlarini gozet
- Tum mimari sorular icin bu dokumana basvur

**Ilk Implementasyon Onceligi:**
1. EventBus modulu (lib/event-bus.js)
2. Debug modulu genisletme (lib/debug.js)
3. IndexedDB Storage modulu (lib/storage.js + migrasyon)
4. CommandManager modulu (lib/command-manager.js)
