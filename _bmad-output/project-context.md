---
project_name: 'NVI FIBER'
user_name: 'BURAK'
date: '2026-03-07'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'code_quality', 'workflow_rules', 'critical_rules']
status: 'complete'
rule_count: 124
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

| Teknoloji | Versiyon | Not |
|-----------|----------|-----|
| JavaScript | ES6+ (Vanilla) | TypeScript yok, build step yok |
| Chrome Extension | Manifest V3 | Service worker background |
| Leaflet.js | 1.9.x (yerel) | Harita altyapısı |
| Depolama | chrome.storage.local | fp_ prefix, JSON serialize |
| Tile Provider | Esri World Imagery | Uydu karoları, blob URL fetch |
| Debug | FPDebug + ws-bridge | Python log-monitor.py (port 7777) |
| Test | HTML tabanlı | Tarayıcıda çalışır, CI/CD yok |
| Modül Sistemi | IIFE pattern | import/export YASAK |
| CSS | Vanilla CSS + satır içi | fp- prefix, CSS değişkenleri |
| Hedef Platform | NVI portal (adres.nvi.gov.tr) | Content script injection |

### Versiyon Kısıtlamaları
- Chrome Manifest V3: background page yok, service worker zorunlu
- Leaflet yerel kopya: CDN bağımlılığı yok, offline çalışır
- ES6+ özellikler: const/let, arrow functions, template literals, destructuring OK
- ES modules (import/export): YASAK — IIFE pattern zorunlu

## Critical Implementation Rules

### Dil-Spesifik Kurallar (JavaScript ES6+)

**Modül Tanımı — Tek Geçerli Pattern:**
```js
const ModuleName = (() => {
  'use strict';
  // ─── CONSTANTS ─────────────────────────────
  // ─── PRIVATE STATE ─────────────────────────
  // ─── PRIVATE FUNCTIONS ─────────────────────
  // ─── PUBLIC API ────────────────────────────
  return { init, publicMethod };
})();
```

**Adlandırma Kuralları:**
- Modül adı: PascalCase (`PonEngine`, `EventBus`, `LiveMonitor`)
- Fonksiyon/değişken: camelCase (`createAda`, `recalculateAda`)
- Özel değişken: `_` prefix (`var _map = null`, `var _active = false`)
- Sabitler: UPPER_SNAKE obje (`const CONSTANTS = {}`, `const CATALOG = {}`)
- Sabit iç anahtarlar: camelCase (`maxLossBudget`, `fiberLoss1310`)

**Veri Serileştirme (JSON uyumlu zorunlu):**
- Tarih: `new Date().toISOString()` — Date objesi YASAK
- ID: `Date.now().toString(36)` veya `crypto.randomUUID()`
- Boolean: `true/false` — 1/0 YASAK
- Null: explicit `null` — undefined YASAK (JSON'da kaybolur)
- Deep clone: `JSON.parse(JSON.stringify(obj))` — safe for all ada data

**Hata Yönetimi:**
- Her modül kendi try/catch ile izole — hata üst katmana yayılmaz
- Ada bazında izolasyon: bir ada hatası diğerlerini etkilemez
- Chrome API: `chrome.runtime.lastError` her callback'te kontrol
- Null guard: `if (!data || !data.id) return;`

**Modüller Arası İletişim:**
- Type guard zorunlu: `if (typeof X !== 'undefined' && X.method)`
- EventBus: yeni modüller için tercih edilen yol
- Doğrudan çağrı: mevcut API'ler korunur (PonEngine.recalculateAda vb.)

### Chrome Extension & NVI Portal Kuralları

**manifest.json Yükleme Sırası (KRİTİK):**
Modüller bağımlılık zincirinde yüklenir. Yeni modül eklerken sırayı bozma:
```
leaflet → debug → ws-bridge → event-bus → pon-engine → topology → storage
→ command-manager → map-utils → draw-polygon → review-engine → activation
→ variation → financial → marketing-data-house → ai-engine → live-monitor
→ acs-manager → flow-analyzer → qoe-engine
→ [content] scraper → nvi-cache → overlay → heat-map → panels → main
```

**İki Dünya Sorunu (ISOLATED vs MAIN world):**
- Content scripts ISOLATED world'de çalışır — NVI'nın JS değişkenlerine erişemez
- NVI Leaflet koordinatları için MAIN world script injection gerekir
- `injectMainWorldCoordReader()` scraper.js'te — koordinat yakalama buradan
- MAIN world'e enjekte edilen kod content script API'lerine erişemez (ters yön)

**CSP Workaround (Tile Yükleme):**
- NVI'nın Content-Security-Policy'si dış img-src'yi engelliyor
- `MapUtils.FetchTileLayer`: fetch() → blob URL dönüşümü ile bypass
- Doğrudan `<img src="https://...">` tile yükleme ÇALIŞMAZ

**Service Worker (background.js):**
- Manifest V3: kalıcı background page yok, service worker yaşam döngüsü
- Uzun süreli bağlantılar tutma — alarm/timer ile uyanma
- chrome.runtime.sendMessage ile content ↔ background iletişimi
- Proxy pattern: Zabbix JSON-RPC gibi cross-origin istekler background üzerinden

**Storage Entegrasyonu:**
- Prefix: `fp_` + snake_case (`fp_current`, `fp_map_position`)
- Tüm veri JSON serileştirilebilir olmalı
- autoSave: her değişiklikte tetiklenir
- Yeni store eklerken Storage Integration Checklist takip et (MEMORY.md'de)

**DOM Injection (NVI Portal):**
- Tüm UI elementleri `fp-` prefix CSS sınıfı kullanmalı
- NVI'nın DOM'unu bozma — kendi container'larını oluştur
- z-index hiyerarşisi: map=1000, popup=1100, scoreboard=1150, toolbar=1200, backdrop=1250, modal=1300

### Test Kuralları

**Test Altyapısı:**
- Framework yok — HTML tabanlı manuel test dosyaları
- Mevcut: `fiber-chrome/dashboard/test-topology.html`
- Yeni testler: `fiber-chrome/test/test-{modul-adi}.html`
- Tarayıcıda aç → sonuçlar DOM'a yazılır → görsel doğrulama

**Test Yapısı:**
- Her modül için ayrı HTML test dosyası
- Modülün `<script>` ile yüklenmesi (bağımlılık sırasına dikkat)
- Test sonuçları: DOM elementlerine yazılır (pass/fail renk kodlu)
- CI/CD yok — tüm testler manuel çalıştırılır

**Neyi Test Et:**
- PonEngine hesaplamaları: splitter, loss budget, MST, FDH
- Topology CRUD: ada/bina ekleme, silme, güncelleme
- Storage: kaydetme/yükleme döngüsü, migrasyon
- Sınır değerler: 0 bina, 1 bina, 128+ BB, 28 dB loss limit

**Test Anti-Patternleri:**
- Jest/Mocha/Vitest gibi Node.js test framework'leri KULLANMA
- `require()` veya `import` ile modül yükleme YAPMA
- Testler tarayıcıda çalışmalı (Chrome Extension context)

### Kod Kalitesi & Stil Kuralları

**Dosya Adlandırma:**
- kebab-case: `pon-engine.js`, `map-utils.js`, `draw-polygon.js`
- Dizinler: `lib/` (paylaşılan), `content/` (NVI inject), `styles/`, `test/`

**CSS Kuralları:**
- Sınıf prefix: `fp-` + kebab-case (`fp-btn`, `fp-side-panel`, `fp-toolbar-inner`)
- CSS değişkenleri: `--fp-bg`, `--fp-accent`, `--fp-color-olt`, `--fp-radius-sm`
- ID'ler: `fp-toolbar`, `fp-side-panel`, `fp-stat-ada`
- Stil dosyası: `styles/overlay.css` — tüm CSS değişkenleri burada tanımlı

**Dosya Başlığı (JSDoc):**
```js
/**
 * ModuleName - Short description (English)
 * Detail line
 */
```

**Bölüm Ayraçları:**
```js
// ─── SECTION NAME ─────────────────────────────
```

**Yorum Dili:**
- JSDoc başlıkları: İngilizce
- Satır içi yorumlar: Türkçe kabul edilir
- UI metinleri: Türkçe

**Linting/Formatting:**
- ESLint/Prettier YOK — elle tutarlılık
- `'use strict';` her IIFE'nin ilk satırı
- Noktalı virgül zorunlu
- Tek tırnak (`'string'`) tercih edilir

### Geliştirme İş Akışı Kuralları

**BMAD Metodu:**
- Story dokümanları: `_bmad-output/implementation-artifacts/`
- Dev-story: 10 adımlı iş akışı (implement → test → validate → complete)
- Sprint takibi: `_bmad-output/implementation-artifacts/sprint-status.yaml`
- Kod inceleme: farklı LLM ile (Gemini tercih edilir)

**Extension Yükleme & Test:**
- `chrome://extensions` → Developer mode → "Load unpacked" → `fiber-chrome/`
- Değişiklik sonrası: extension'ı reload et (güncelle butonu)
- Debug: `python scripts/log-monitor.py` (ws-bridge port 7777)

**Yeni Modül Ekleme Checklist:**
1. `lib/` veya `content/` altında kebab-case dosya oluştur
2. IIFE pattern ile modülü yaz (`const ModuleName = (() => { ... })()`)
3. `manifest.json` content_scripts js dizisine doğru sıraya ekle
4. Bağımlı olduğu modüllerden SONRA, bağımlı olan modüllerden ÖNCE
5. Type guard ile diğer modüllere erişim ekle

**Yeni Storage Key Ekleme:**
- `fp_` prefix + snake_case
- Storage.save() ve Storage.load() fonksiyonlarına ekle
- JSON serileştirilebilir veri yapısı zorunlu

**Git:**
- Tek branch: master (küçük ekip, basit akış)
- Commit mesajları: feat/fix/refactor prefix önerilir

### Kritik Kaçırılmaması Gereken Kurallar

**YASAK Anti-Patternler:**
- `import`/`export` KULLANMA — IIFE pattern zorunlu
- `class` sözdizimi KULLANMA — IIFE + return obje pattern
- `window.myHelper = ...` ile global kirletme YAPMA
- React/Vue/Angular gibi framework EKLEME
- `require()` KULLANMA — Node.js değil, tarayıcı ortamı
- `async/await` kullanırken `try/catch` UNUTMA

**Domain-Spesifik Gotcha'lar (GPON):**
- Max loss budget: 28 dB — aşılırsa bina FAIL
- Splitter loss tablosu: `{2: 3.5, 4: 7.0, 8: 10.5, 16: 14.0, 32: 17.5, 64: 21.0}` dB
- Fiber loss: 0.35 dB/km @ 1310nm — km cinsinden hesapla (metre değil!)
- Connector: 4 × 0.5 dB = 2.0 dB (sabit)
- Splice: 2 × 0.1 dB = 0.2 dB (sabit)
- Max BB per port: 128, Max ONT per port: 64
- Penetrasyon oranı: %70 default — effBB = BB × penetrationRate

**Harita Gotcha'ları:**
- NVI'nın haritasını KULLANMA — kendi Leaflet instance'ımız var
- Tile yükleme: `MapUtils.FetchTileLayer` kullan, doğrudan URL ÇALIŞMAZ
- Koordinat yakalama: MAIN world injection gerekir (scraper.js)
- Pentagon marker: `MapUtils.createPentagonIcon()` — standart marker değil

**Storage Gotcha'ları:**
- `deleteProject()` fonksiyonuna yeni store eklemeyi UNUTMA
- Migration fonksiyonuna yeni store eklemeyi UNUTMA
- `undefined` değer kaydetme — JSON.stringify'da kaybolur, `null` kullan
- Date objesi kaydetme — `toISOString()` string'e çevir

**EventBus Gotcha'ları:**
- Event adı formatı: `namespace:action` (camelCase yok, kebab yok)
- Listener hata izolasyonu: bir listener hatası diğerlerini etkilememeli
- Wildcard `*` dinleyici: debug/loglama için, iş mantığı için KULLANMA

**Güvenlik:**
- OAuth2 client_id manifest'te açık — hassas veri DEĞİL (public client)
- Kullanıcı verisi export'unda uyarı dialogu göster
- NVI DOM'undan alınan veriye güvenme — sanitize et

---

## Usage Guidelines

**AI Ajanları İçin:**
- Kod yazmadan ÖNCE bu dosyayı oku
- TÜM kuralları tam olarak uygula
- Şüphe durumunda daha kısıtlayıcı seçeneği tercih et
- Yeni kalıplar ortaya çıkarsa bu dosyayı güncelle

**İnsanlar İçin:**
- Dosyayı yalın ve ajan ihtiyaçlarına odaklı tut
- Teknoloji yığını değiştiğinde güncelle
- Periyodik olarak eskiyen kuralları gözden geçir
- Zamanla bariz hale gelen kuralları kaldır

Son Güncelleme: 2026-03-07
