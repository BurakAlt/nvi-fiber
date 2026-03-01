# Story 1.7: Extension Erisim Kontrolu ve Aktivasyon

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a yonetici,
I want extension erisimini kontrol edebilmek ve sadece onayladigim kullanicilarin sistemi kullanabilmesini,
so that hassas altyapi verilerine yetkisiz erisimi engelleyebileyim.

## Acceptance Criteria (BDD)

1. **Given** yeni bir kullanici extension'i yukleyip ilk kez actiginda **When** extension baslatiginda **Then** aktivasyon ekrani gosterilmeli: "Aktivasyon kodu giriniz" **And** aktivasyon kodu girilene kadar tum extension islevleri kilitli olmali (NFR8).

2. **Given** kullanici gecerli bir aktivasyon kodu girdiginde **When** dogrulama yapildiginda **Then** anahtar cifti ile yerel dogrulama basarili olmali **And** extension tam islevsellikle acilmali **And** aktivasyon durumu chrome.storage.local'da saklanmali.

3. **Given** kullanici gecersiz bir aktivasyon kodu girdiginde **When** dogrulama yapildiginda **Then** hata mesaji gosterilmeli: "Gecersiz aktivasyon kodu" **And** extension islevleri kilitli kalmali.

4. **Given** yonetici yeni kullanici icin aktivasyon kodu olusturmak istediginde **When** master key ile yeni kod urettiginde **Then** benzersiz kullanici kodu olusturulmali **And** kod kullaniciya iletildikten sonra ilk kullanimda aktive olmali.

5. **Given** onaylanmamis bir kullanici extension'i kullanmaya calistiginda **When** herhangi bir islem yapmak istediginde **Then** tum islevler engellenmeli ve aktivasyon ekranina yonlendirilmeli (FR67).

## Tasks / Subtasks

- [x] Task 1: Activation modulu olusturma (AC: #2, #3, #4)
  - [x] 1.1 `lib/activation.js` IIFE modulu olustur — master key, kod uretme, dogrulama API
  - [x] 1.2 Master key'den benzersiz kullanici kodu uretme algoritmasi: HMAC-benzeri XOR + Base64 encoding
  - [x] 1.3 `verify(code)` fonksiyonu: kullanici kodunu master key ile dogrulama
  - [x] 1.4 `isActivated()` fonksiyonu: chrome.storage.local'dan aktivasyon durumunu kontrol
  - [x] 1.5 `activate(code)` fonksiyonu: verify + durumu chrome.storage.local'a kaydetme
  - [x] 1.6 `generateCode(userId)` fonksiyonu: yonetici icin yeni kullanici kodu uretme (console/dashboard erisimiyle)
  - [x] 1.7 EventBus entegrasyonu: `activation:success`, `activation:failed`, `activation:check` event'leri

- [x] Task 2: Aktivasyon ekrani UI (AC: #1, #3)
  - [x] 2.1 `main.js`'e aktivasyon gate ekle — `Activation.isActivated()` kontrolu, basarisizsa tum init'i durdur
  - [x] 2.2 Aktivasyon modal overlay olustur: tam ekran koyu arka plan + ortada kart
  - [x] 2.3 Kart icerigi: FiberPlan logo, "Aktivasyon Kodu" input alani, "Aktive Et" butonu, hata mesaj alani
  - [x] 2.4 Gecersiz kod girildiginde kirmizi hata mesaji gosterme
  - [x] 2.5 Basarili aktivasyonda modal'i kaldir ve normal init akisina devam et
  - [x] 2.6 CSS: `.fp-activation-overlay`, `.fp-activation-card` — mevcut dark theme uyumlu

- [x] Task 3: Popup entegrasyonu (AC: #1, #5)
  - [x] 3.1 `popup.js`'e aktivasyon durumu kontrolu ekle
  - [x] 3.2 Aktive edilmemisse popup'ta "Aktive edilmedi" uyarisi ve kod girme alani goster
  - [x] 3.3 Popup'tan da aktivasyon yapilabilmeli (alternatif giris noktasi)

- [x] Task 4: manifest.json guncelleme
  - [x] 4.1 `lib/activation.js`'i content_scripts[0].js dizisine ekle — `lib/review-engine.js`'ten sonra, `content/scraper.js`'ten once

- [x] Task 5: Entegrasyon testleri
  - [x] 5.1 `test/test-activation.html` olustur
  - [x] 5.2 Kod uretme testi: generateCode() benzersiz ve gecerli kodlar uretiyor
  - [x] 5.3 Dogrulama testi: gecerli kod → true, gecersiz kod → false
  - [x] 5.4 Aktivasyon durumu testi: activate() sonrasi isActivated() → true
  - [x] 5.5 EventBus event testi: activation:success ve activation:failed event'leri
  - [x] 5.6 Gate testi: isActivated() false → UI kilitli, true → UI acik

## Dev Notes

### KRITIK: Bu Story'nin Pozisyonu

Story 1.1 (EventBus), 1.2 (IndexedDB Storage), 1.3 (NviCache), 1.4 (CommandManager), 1.5 (Backup), 1.6 (Offline/Export — review'da) tamamlandi. Bu story Epic 1'in SON story'sidir ve **yeni bir modul olusturur:**
- **lib/activation.js** (YENI) — Activation IIFE modulu
- **content/main.js** (GUNCELLENECEK) — init akisina activation gate eklenir
- **popup/popup.js** (GUNCELLENECEK) — aktivasyon durumu + alternatif giris noktasi
- **popup/popup.html** (GUNCELLENECEK) — aktivasyon UI elementleri
- **manifest.json** (GUNCELLENECEK) — activation.js content_scripts'e eklenir

### KRITIK: Aktivasyon Durumu chrome.storage.local'da — IndexedDB'de DEGIL

Aktivasyon kontrolu extension baslamadan ONCE yapilmali. IndexedDB acilisi Storage.init() ile olur, bu ise init akisinin ilerisindedir. Bu yuzden aktivasyon durumu **chrome.storage.local** kullanir (senkron erisim, hizli kontrol). IndexedDB bagimliligini onler.

```javascript
// Aktivasyon durumu saklama — chrome.storage.local
// Key: fp_activation
// Value: { activated: true, code: 'xxx', activatedAt: ISO_string, userId: 'xxx' }
```

### KRITIK: main.js Init Akisi — Activation Gate

Mevcut init akisi 14 adim. Activation gate en basta, NVI portal kontrolunden HEMEN SONRA eklenir:

```javascript
// Mevcut sira (main.js):
// 1. NVI portal kontrolu (NviScraper.isNviPortal())
// ★ YENI: 1.5 Activation gate — isActivated() kontrolu
// 2. migrateFromIndexedDB()
// 3. Storage.init()
// ... devam
```

**Activation gate akisi:**
```javascript
// 1.5 Activation gate
var activated = await Activation.isActivated();
if (!activated) {
  showActivationScreen(function() {
    // Aktivasyon basarili → init akisina devam
    continueInit();
  });
  return; // Init'i durdur
}
// Aktivasyon gecerli → normal init devam
```

### KRITIK: Anahtar Cifti Dogrulama Algoritmasi

Backend gerektirmeyen, tamamen yerel dogrulama. Basit ama etkili:

```javascript
// Master key (activation.js icinde sabit — obfuscation ile gizlenir)
var MASTER_KEY = 'FP2026-MASTER-KEY-SEED';

// Kod uretme:
// 1. userId (ornek: "burak", "teknisyen1") + master key → XOR islemleri
// 2. Sonuc Base64 encode → kullanici kodu (ornek: "FP-A3B7C9D2")

// Dogrulama:
// 1. Kullanici kodundan userId cikar
// 2. userId + master key ile beklenen kodu yeniden uret
// 3. Uretilen kod == girilen kod → gecerli

function generateCode(userId) {
  var combined = MASTER_KEY + ':' + userId + ':' + MASTER_KEY;
  var hash = simpleHash(combined);
  return 'FP-' + hash.substring(0, 8).toUpperCase();
}

function verify(code) {
  // Kod formati kontrol: FP-XXXXXXXX
  if (!code || !code.startsWith('FP-') || code.length !== 11) return false;
  // Brute-force korumasi yok (MVP icin yeterli) — backend geldiginde guclendirilir
  // Tum bilinen userId'lerle deneme yapmak yerine, dogrudan hash karsilastirma
  return true; // Basitlestirme: format dogruysa kabul (gercek implementasyonda hash dogrulama)
}
```

**ONEMLI:** Gercek implementasyonda `simpleHash()` fonksiyonu `_encode()` pattern'ini (background.js:137) referans alabilir. XOR + Base64 zaten projede mevcut.

### KRITIK: Aktivasyon Ekrani Tasarimi

Mevcut popup.html'deki dark theme (background: #0f1729, color: #e2e8f0, accent: #facc15) ile uyumlu tam ekran modal:

```javascript
function showActivationScreen(onSuccess) {
  var overlay = document.createElement('div');
  overlay.id = 'fp-activation-overlay';
  overlay.className = 'fp-activation-overlay';
  overlay.innerHTML =
    '<div class="fp-activation-card">' +
    '<div class="fp-activation-logo">FIBERPLAN</div>' +
    '<div class="fp-activation-subtitle">FTTH Fiber Ag Planlama</div>' +
    '<div class="fp-activation-divider"></div>' +
    '<label class="fp-activation-label">Aktivasyon Kodu</label>' +
    '<input type="text" id="fp-activation-input" class="fp-activation-input" ' +
    'placeholder="FP-XXXXXXXX" maxlength="11" autocomplete="off" spellcheck="false">' +
    '<div id="fp-activation-error" class="fp-activation-error"></div>' +
    '<button id="fp-activation-btn" class="fp-activation-btn">Aktive Et</button>' +
    '</div>';

  document.body.appendChild(overlay);

  var input = document.getElementById('fp-activation-input');
  var btn = document.getElementById('fp-activation-btn');
  var errorEl = document.getElementById('fp-activation-error');

  btn.addEventListener('click', function() {
    var code = input.value.trim().toUpperCase();
    errorEl.textContent = '';

    Activation.activate(code).then(function(result) {
      if (result.success) {
        overlay.remove();
        if (typeof EventBus !== 'undefined') {
          EventBus.emit('activation:success', { code: code, timestamp: new Date().toISOString() });
        }
        onSuccess();
      } else {
        errorEl.textContent = 'Gecersiz aktivasyon kodu';
        input.classList.add('fp-activation-input-error');
        if (typeof EventBus !== 'undefined') {
          EventBus.emit('activation:failed', { code: code, timestamp: new Date().toISOString() });
        }
      }
    });
  });

  // Enter tusu ile de gonder
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') btn.click();
  });

  // Auto-uppercase
  input.addEventListener('input', function() {
    input.value = input.value.toUpperCase();
    input.classList.remove('fp-activation-input-error');
    errorEl.textContent = '';
  });

  // Focus input
  setTimeout(function() { input.focus(); }, 100);
}
```

**CSS (overlay.css veya main.js icinde inject):**
```css
.fp-activation-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 41, 0.95);
  z-index: 999999;
  display: flex;
  align-items: center;
  justify-content: center;
}
.fp-activation-card {
  background: #1a2744;
  border: 2px solid #facc15;
  border-radius: 16px;
  padding: 40px;
  width: 380px;
  text-align: center;
}
.fp-activation-logo {
  font-family: 'Courier New', monospace;
  font-size: 28px;
  font-weight: 700;
  color: #facc15;
  letter-spacing: 3px;
}
.fp-activation-subtitle {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
}
.fp-activation-divider {
  height: 2px;
  background: #253554;
  margin: 24px 0;
}
.fp-activation-label {
  display: block;
  font-size: 11px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin-bottom: 8px;
  text-align: left;
}
.fp-activation-input {
  width: 100%;
  padding: 12px 16px;
  background: #0f1729;
  border: 1px solid #334155;
  border-radius: 8px;
  color: #e2e8f0;
  font-family: 'Courier New', monospace;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 2px;
  text-align: center;
  outline: none;
}
.fp-activation-input:focus {
  border-color: #facc15;
}
.fp-activation-input-error {
  border-color: #ef4444 !important;
}
.fp-activation-error {
  color: #ef4444;
  font-size: 13px;
  margin-top: 8px;
  min-height: 20px;
}
.fp-activation-btn {
  width: 100%;
  padding: 12px;
  background: #facc15;
  border: none;
  border-radius: 8px;
  color: #000;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 1px;
  cursor: pointer;
  margin-top: 16px;
}
.fp-activation-btn:hover {
  background: #fde047;
}
```

### Mevcut Kodda Korunmasi Gerekenler

1. **`main.js` mevcut init akisi** — 14 adim korunur, activation gate EN BASA eklenir
2. **`Storage.init()`** — activation kontrolu oncesinde Storage init cagirilMAZ (chrome.storage.local direkt kullanilir)
3. **`popup.html` mevcut yapi** — header, status, stats, actions korunur; activation durumu eklenir
4. **`popup.js` mevcut mantik** — dashboard butonu ve NVI kontrol mantigi korunur
5. **Tum diger moduller** (PonEngine, Topology, Scraper, Overlay, Panels vb.) → DOKUNULMAZ
6. **EventBus** → DOKUNULMAZ, sadece emit() kullanilir
7. **background.js** → DOKUNULMAZ; settings store zaten mevcut, activation bilgisi chrome.storage.local'da saklanir

### Onceki Story (1.6) Intelligence

Story 1.6'da ogrenilenler:
- **Modal overlay pattern**: `showExportConfirmDialog()` tam olarak bu story'nin activation modal'i icin referans — overlay + card + butonlar + ESC handler
- **EventBus entegrasyonu**: `EventBus.emit('namespace:action', data)` pattern'i — activation:success/failed
- **CSS dark theme**: `background: #0f1729`, `border: #facc15`, `color: #e2e8f0` — popup.html ile tutarli
- **Test dosyasi yapisi**: `dashboard/test-*.html` veya `test/test-*.html` — mock pattern + assert helper
- **Mevcut kodda dikkat**: `toolbar.querySelector('.fp-toolbar-inner')` ile toolbar icine element ekleme
- **showNotification(text, type)** kullanimi: `'success'`, `'error'`, `'info'` type'lari

### KRITIK TASARIM KARARI: Popup Aktivasyon Akisi

Popup hem aktive edilmis hem de edilmemis durumda acilabilir. Aktivasyon durumuna gore UI degisir:

**Aktive edilmemis:**
```
┌─────────────────────────┐
│ FIBERPLAN        v1.0.0 │
├─────────────────────────┤
│ ⚠ Aktive Edilmedi       │
│                         │
│ [Aktivasyon kodu:     ] │
│ [    Aktive Et        ] │
│                         │
│ [   Dashboard Ac      ] │ (disabled)
│ [   NVI Portal Ac     ] │
└─────────────────────────┘
```

**Aktive edilmis:**
```
┌─────────────────────────┐
│ FIBERPLAN        v1.0.0 │
├─────────────────────────┤
│ ● NVI Portal aktif      │  (mevcut davranis)
│ Ada: 3  Bina: 12  BB:85 │
│                         │
│ ✅ Aktive (Burak)       │  (yeni satir)
│                         │
│ [   Dashboard Ac      ] │
│ [   NVI Portal Ac     ] │
└─────────────────────────┘
```

### KRITIK: manifest.json Guncelleme

`lib/activation.js` dosyasi content_scripts[0].js dizisine eklenmeli. Mimari dokumana gore sirasi: `lib/review-engine.js`'ten sonra, `content/scraper.js`'ten once.

```json
"js": [
  "lib/leaflet.js",
  "lib/debug.js",
  "lib/ws-bridge.js",
  "lib/event-bus.js",
  "lib/pon-engine.js",
  "lib/topology.js",
  "lib/storage.js",
  "lib/command-manager.js",
  "lib/map-utils.js",
  "lib/draw-polygon.js",
  "lib/review-engine.js",
  "lib/activation.js",          // ★ YENI — Activation modulu
  "content/scraper.js",
  "content/nvi-cache.js",
  "content/overlay.js",
  "content/panels.js",
  "content/main.js"
]
```

### Project Structure Notes

```
fiber-chrome/
  lib/
    activation.js      ★ YENI — Activation IIFE modulu (master key, kod uretme, dogrulama)
    event-bus.js       DOKUNULMAYACAK
    storage.js         DOKUNULMAYACAK
    ...
  content/
    main.js            ★ GUNCELLENECEK — activation gate + activation modal UI
    panels.js          DOKUNULMAYACAK
    scraper.js         DOKUNULMAYACAK
    ...
  popup/
    popup.html         ★ GUNCELLENECEK — aktivasyon durumu UI
    popup.js           ★ GUNCELLENECEK — aktivasyon kontrol + kod girme
  manifest.json        ★ GUNCELLENECEK — activation.js ekleme
  test/
    test-activation.html  ★ YENI — aktivasyon entegrasyon test dosyasi
```

## Architecture Compliance

### IIFE Module Pattern (ZORUNLU)

Yeni `Activation` modulu IIFE pattern ile olusturulur:

```javascript
/**
 * Activation - Extension access control and activation key management
 * Local key-pair verification without backend dependency
 */
const Activation = (() => {
  'use strict';
  // ─── CONSTANTS ─────────────────────────────────────────
  const CONFIG = { ... };
  // ─── PRIVATE STATE ─────────────────────────────────────
  var _activated = null; // Cache: null = unknown, true/false = checked
  // ─── PRIVATE FUNCTIONS ─────────────────────────────────
  function _simpleHash(str) { ... }
  function _verify(code) { ... }
  // ─── PUBLIC API ────────────────────────────────────────
  return {
    isActivated: isActivated,
    activate: activate,
    verify: verify,
    generateCode: generateCode,
    getStatus: getStatus
  };
})();
```

### Manifest.json Yukleme Sirasi

activation.js → `lib/review-engine.js`'ten sonra, `content/scraper.js`'ten once (pozisyon 12):

```json
"js": [
  "lib/leaflet.js",           // 1
  "lib/debug.js",             // 2
  "lib/ws-bridge.js",         // 3
  "lib/event-bus.js",         // 4
  "lib/pon-engine.js",        // 5
  "lib/topology.js",          // 6
  "lib/storage.js",           // 7
  "lib/command-manager.js",   // 8
  "lib/map-utils.js",         // 9
  "lib/draw-polygon.js",      // 10
  "lib/review-engine.js",     // 11
  "lib/activation.js",        // 12 ★ YENI
  "content/scraper.js",       // 13
  "content/nvi-cache.js",     // 14
  "content/overlay.js",       // 15
  "content/panels.js",        // 16
  "content/main.js"           // 17
]
```

### EventBus Event'leri

```javascript
EventBus.emit('activation:success', { code: 'FP-A3B7C9D2', userId: 'burak', timestamp: '2026-03-01T10:00:00Z' });
EventBus.emit('activation:failed', { code: 'FP-INVALID1', timestamp: '2026-03-01T10:00:05Z' });
EventBus.emit('activation:check', { activated: true, timestamp: '2026-03-01T10:00:00Z' });
```

### Naming Conventions (ZORUNLU)

| Kural | Ornek |
|-------|-------|
| IIFE modul adi: PascalCase | `Activation` |
| Dosya adi: kebab-case | `activation.js` |
| CSS class: `fp-` prefix | `.fp-activation-overlay`, `.fp-activation-card` |
| CSS element ID: `fp-` prefix | `#fp-activation-input`, `#fp-activation-btn` |
| Private degiskenler: `_` prefix | `_activated`, `_masterKey` |
| Public API: camelCase | `isActivated()`, `generateCode()` |
| Event format: `namespace:action` | `activation:success`, `activation:failed` |
| Log prefix: `[ModuleName]` | `[Activation]` |
| Storage key: `fp_` prefix | `fp_activation` |

### Anti-Pattern Uyarilari

1. **Backend API cagrisi YAPMA** — tamamen yerel dogrulama, internet gerektirmez
2. **IndexedDB kullanma** aktivasyon durumu icin — chrome.storage.local kullan (init oncesi erisim)
3. **import/export KULLANMA** — IIFE pattern ZORUNLU
4. **`window.confirm()` KULLANMA** — ozel modal overlay kullan
5. **Mevcut init adimlarini DEGISTIRME** — sadece activation gate ekle (adim 1.5)
6. **Storage.init() oncesinde IndexedDB ERISMEYE CALISMA** — activation chrome.storage.local'dan okur
7. **Master key'i basit string olarak birakma** — en azindan split/obfuscate yap (kaynak kodda gorunmesin)
8. **Kriptografik guvenlik IDDIA ETME** — bu MVP obfuscation, backend geldiginde guclendirilir

### Performance Gereksinimleri

- Activation check (isActivated): < 10ms (chrome.storage.local okuma)
- Activation modal render: < 50ms (basit DOM islemleri)
- Code verification: < 5ms (yerel hash karsilastirma)
- Init gate overhead: < 20ms toplam (mevcut init akisina minimal ek yuk)

### Test Stratejisi

Test dosyasi: `fiber-chrome/test/test-activation.html`

**Test Sections:**

1. **Kod Uretme**: `generateCode('burak')` benzersiz ve gecerli formatta kod uretiyor (FP-XXXXXXXX)
2. **Kod Dogrulama**: `verify(gecerliKod)` → true, `verify('gecersiz')` → false
3. **Farkli Kullanici Kodlari**: farkli userId'ler farkli kodlar uretiyor
4. **Aktivasyon Akisi**: `activate(gecerliKod)` → `{success: true}`, ardından `isActivated()` → true
5. **Gecersiz Kod Aktivasyonu**: `activate('FP-INVALID1')` → `{success: false}`
6. **EventBus Event'leri**: activation:success ve activation:failed event'leri dogru emit ediliyor
7. **Chrome Storage Persistence**: activate() sonrasi `fp_activation` key'i chrome.storage.local'da mevcut

**DIKKAT:** Test dosyasi `background.js` OLMADAN calismali. chrome.storage.local mock'u gerekli:
```javascript
// chrome.storage.local mock
var _mockStorage = {};
if (typeof chrome === 'undefined') var chrome = {};
if (!chrome.storage) chrome.storage = {};
if (!chrome.storage.local) {
  chrome.storage.local = {
    get: function(keys, cb) {
      var result = {};
      if (typeof keys === 'string') { result[keys] = _mockStorage[keys]; }
      else if (Array.isArray(keys)) { keys.forEach(function(k) { result[k] = _mockStorage[k]; }); }
      cb(result);
    },
    set: function(obj, cb) {
      Object.keys(obj).forEach(function(k) { _mockStorage[k] = obj[k]; });
      if (cb) cb();
    }
  };
}
chrome.runtime = chrome.runtime || { lastError: null };
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 1, Story 1.7]
- [Source: _bmad-output/planning-artifacts/architecture.md — Aktivasyon sistemi: anahtar cifti, yerel dogrulama, backend gerektirmez]
- [Source: _bmad-output/planning-artifacts/architecture.md — Sifreleme: obfuscation (XOR/Base64)]
- [Source: _bmad-output/planning-artifacts/architecture.md — manifest.json yukleme sirasi — activation.js pozisyon 12]
- [Source: _bmad-output/planning-artifacts/architecture.md — IIFE modul sablon + naming conventions]
- [Source: _bmad-output/planning-artifacts/architecture.md — fp_ storage prefix, fp- CSS prefix]
- [Source: fiber-chrome/content/main.js — Mevcut init akisi (14 adim), activation gate ekleme noktasi]
- [Source: fiber-chrome/popup/popup.html — Mevcut popup tasarimi, dark theme renk paleti]
- [Source: fiber-chrome/popup/popup.js — Popup mantigi, dashboard butonu, NVI kontrol]
- [Source: fiber-chrome/background.js — XOR/Base64 obfuscation pattern (satir 137-158), settings store]
- [Source: fiber-chrome/manifest.json — Content script yukleme sirasi, mevcut 15 dosya]
- [Source: _bmad-output/implementation-artifacts/1-6-offline-calisma-ve-veri-aktarimi.md — Modal overlay pattern, EventBus pattern, test mock yapisi]
- [Source: CLAUDE.md — Mimari genel bakis, IIFE pattern, EventBus pattern, Storage pattern]

## Change Log

- 2026-03-01: Story 1.7 olusturuldu — extension erisim kontrolu ve aktivasyon sistemi icin kapsamli gelistirici kilavuzu
- 2026-03-01: Implementasyon tamamlandi — Activation IIFE modulu, main.js activation gate, popup entegrasyonu, manifest guncelleme, entegrasyon testleri
- 2026-03-01: Code review tamamlandi — 3 HIGH, 2 MEDIUM, 2 LOW bulgu. Duzeltmeler: popup.js yeniden yazildi (Activation modulu kullaniliyor, duplike master key ve verify mantigi kaldirildi), dashboardBtn.disabled eklendi, NVI tab reload eklendi, test EventBus assertion'lari gercek dogrulamaya cevrildi

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

Hata yok — temiz implementasyon.

### Completion Notes List

- **Task 1:** `lib/activation.js` IIFE modulu olusturuldu. Obfuscated master key (byte array olarak saklanir, runtime'da assemble edilir). `_simpleHash()` fonksiyonu Java hashCode benzeri 32-bit hash uretir. `generateCode(userId)` deterministik kod uretir (FP-PPPPCCCC formati: payload + checksum). `verify(code)` checksum dogrulamasi yapar — format + hex kontrol + son 4 karakter checksum karsilastirma. `isActivated()` chrome.storage.local'dan okuyor ve sonucu cache'liyor (< 10ms). `activate(code)` verify + storage kaydi. EventBus entegrasyonu: activation:success, activation:failed, activation:check event'leri emit ediliyor. `reset()` fonksiyonu test icin eklendi.

- **Task 2:** main.js'e activation gate eklendi — NVI portal kontrolunden hemen sonra, `migrateFromIndexedDB()` oncesinde. `continueInit()` async fonksiyonu ile mevcut init akisi sarmalandi. `showActivationScreen()` tam ekran modal overlay olusturuyor: dark theme uyumlu (#0f1729 arka plan, #facc15 accent, #1a2744 kart). Auto-uppercase, Enter tusu destegi, kirmizi hata mesaji, basarili aktivasyonda modal kaldirilip init devam ediyor.

- **Task 3:** popup.html'e iki bolum eklendi: aktivasyon durumu (yesil tik) ve aktivasyon formu (turuncu uyari + input + buton). popup.js tamamen yeniden yazildi — `Activation.isActivated()` ve `Activation.activate(code)` API'leri kullaniliyor (activation.js popup.html'de yukleniyor). Dashboard butonu `disabled=true` ve `pointerEvents='none'` ile cift katmanli engelleme. Basarili aktivasyonda NVI tab otomatik reload ediliyor (content script cache'ini guncellemek icin).

- **Task 4:** manifest.json'da `lib/activation.js` content_scripts js dizisine eklendi — `lib/review-engine.js`'ten sonra (pozisyon 12), `content/scraper.js`'ten once.

- **Task 5:** `test/test-activation.html` olusturuldu — chrome.storage.local mock, EventBus mock. 8 test section: Module API, Kod Uretme (deterministic, unique, case-insensitive), Kod Dogrulama (gecerli/gecersiz), Aktivasyon Akisi (async), Gecersiz Kod, EventBus Events (gercek event array dogrulamasi — count + payload kontrolleri), Chrome Storage Kaliciligi, Gate Davranisi (cache performance).

### File List

- `fiber-chrome/lib/activation.js` — YENI — Activation IIFE modulu (master key, kod uretme, dogrulama, EventBus entegrasyonu)
- `fiber-chrome/content/main.js` — GUNCELLENDI — Activation gate eklendi (NVI kontrol sonrasi), continueInit() wrapper, showActivationScreen() modal UI
- `fiber-chrome/popup/popup.html` — GUNCELLENDI — Aktivasyon durumu section'lari eklendi (aktive/aktive-degil)
- `fiber-chrome/popup/popup.js` — GUNCELLENDI — Aktivasyon kontrolu, inline verify, popup'tan aktivasyon
- `fiber-chrome/manifest.json` — GUNCELLENDI — lib/activation.js content_scripts'e eklendi (pozisyon 12)
- `fiber-chrome/test/test-activation.html` — YENI — Activation modulu entegrasyon test suite
