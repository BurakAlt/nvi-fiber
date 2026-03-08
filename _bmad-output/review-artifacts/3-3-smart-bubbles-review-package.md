# Code Review Package: Story 3.3 — Smart Bubbles UI Sistemi

## Review Talimatlari

Bu bir Chrome Extension (Manifest V3, vanilla JS, IIFE pattern) icin yapilmis UI refactoring story'sidir. Asagidaki dosyalari ve acceptance criteria'lari inceleyerek code review yapin.

**Reviewer olarak su alanlari kontrol edin:**
1. Acceptance Criteria karsilaniyor mu?
2. IIFE pattern ve fp- prefix convention'a uygun mu?
3. Memory leak riski var mi? (timer, event listener temizligi)
4. z-index hiyerarsisi dogru mu?
5. CSS naming convention tutarli mi?
6. Public API backward compatibility korunmus mu?
7. NVI portal DOM ile catisma riski var mi?
8. Performans sorunu olabilecek noktalar var mi?

---

## Story Ozeti

**Story 3.3: Smart Bubbles UI Sistemi**
Harita-merkezli, %100 tam ekran harita + auto-hide toolbar + popup/modal arayuzu.
Eski sabit yan panel (panels.js) kaldirild, yerine Smart Bubbles mimarisi getirildi.

## Acceptance Criteria

### AC1: Tam Ekran Harita + Auto-hide Toolbar
- Harita %100 ekran kaplayacak, kalici panel YOK
- Toolbar: ust 60px hover ile gorunur, 2sn sonra fadeOut
- F2 toggle, aktif modda toolbar pinli
- Icerik: Ada secici, mod butonlari (OLT/KABLO/SINIR), eylem butonlari, export

### AC2: Scoreboard Card
- Ust ortada yuzen kart: ada adi, bina sayisi, BB, maliyet, kalite skoru, loss budget
- 5sn sonra fadeOut, toolbar'dan tekrar gosterme

### AC3: Modal Cards
- Ekran ortasinda modal: Envanter / Maliyet / KPI / Binalar / Oncelik / Canli Izleme
- %50 backdrop, ESC + dis tiklama kapatma
- Sekme degisimi < 100ms

### AC4: Detail Popups
- Bina popup: BB, splitter, loss budget, maliyet
- Kablo popup: mesafe, kor, fiber kayip
- OLT popup: port durumu, kapasite bar
- Tek popup kurali (yenisi acilinca eski kapanir)

---

## Degisen Dosyalar

### 1. fiber-chrome/content/overlay.js (2978 satir)

**Kaldirilan:** createHeaderBar(), createLegendPanel()
**Eklenen:** createToolbar(), createScoreboard(), createModal(), createToast()

#### createToolbar() — Satir 178-378
Auto-hide toolbar. Ana icerik:
- Logo + Ada secici dropdown + Sehir secici (81 il) + Koordinat input
- Mod butonlari: OLT SEC, KABLO CIZ, SINIR CIZ
- Eylem butonlari: ADA BITIR, HESAPLA, CANLI
- Sag: Scoreboard ikonu, ENVANTER modal, UYDU/SOKAK katman, JSON/CSV/GeoJSON export, KAPAT
- Ada secici change event: Topology.setActiveAda() + render() + Panels.refresh()
- Export butonlari: Panels._handleExportJSON/CSV/GeoJSON'a yonlendirir

```javascript
function createToolbar() {
    var tb = document.createElement('div');
    tb.className = 'fp-smart-toolbar';
    tb.id = 'fp-smart-toolbar';
    tb.innerHTML =
      '<span class="fp-tb-logo">FIBERPLAN</span>' +
      '<span class="fp-tb-sep"></span>' +
      '<select class="fp-tb-ada-select" id="fp-tb-ada-select">...</select>' +
      // ... mod butonlari, eylem butonlari, export butonlari
      '<button class="fp-tb-btn fp-tb-danger" id="fp-tb-close">KAPAT</button>';
    // Event listeners: citySelect, coordInput, layerToggle, modeButtons, adaSelect...
    toolbarEl = tb;
    return tb;
}
```

#### Auto-hide Davranisi — Satir 380-431
```javascript
var toolbarPinned = false;   // mod aktifken true
var toolbarForceVisible = false; // F2 ile toggle

function showToolbar() {
    clearTimeout(toolbarHideTimer);
    toolbarEl.classList.remove('fp-toolbar-hiding');
    toolbarEl.classList.add('fp-toolbar-visible');
}
function hideToolbar() {
    if (toolbarPinned || toolbarForceVisible) return;
    toolbarEl.classList.add('fp-toolbar-hiding');
    toolbarEl.classList.remove('fp-toolbar-visible');
}
function scheduleHideToolbar() {
    if (toolbarPinned || toolbarForceVisible) return;
    clearTimeout(toolbarHideTimer);
    toolbarHideTimer = setTimeout(hideToolbar, 2000);
}
function initToolbarAutoHide() {
    toolbarTrigger = document.createElement('div');
    toolbarTrigger.className = 'fp-toolbar-trigger'; // Gorunmez 60px alan
    document.body.appendChild(toolbarTrigger);
    toolbarTrigger.addEventListener('mouseenter', showToolbar);
    toolbarEl.addEventListener('mouseenter', function() { clearTimeout(toolbarHideTimer); });
    toolbarEl.addEventListener('mouseleave', scheduleHideToolbar);
}
```

#### activateMode() / deactivateMode() — Satir 460-540
Mod aktifken toolbar pinleniyor, mode buton fp-tb-active class alir.
```javascript
function activateMode(mode) {
    if (mapMode.current) deactivateMode();
    // Validasyonlar: cable icin ada tamamlanmis olmali, olt icin aktif ada olmali
    mapMode.current = mode;
    map.getContainer().style.cursor = 'crosshair';
    updateModeButtons();
    // Cable: syncCableModeToPanel(true), OLT: setHelpText, Boundary: DrawPolygon.start
    Panels.refresh();
}
function deactivateMode() {
    cleanupCablePreview();
    mapMode.current = null;
    mapMode.cableSource = null;
    map.getContainer().style.cursor = '';
    updateModeButtons();
}
```

#### createScoreboard() — Satir 685-745
```javascript
function createScoreboard() {
    var sb = document.createElement('div');
    sb.className = 'fp-scoreboard fp-scoreboard-hidden';
    sb.id = 'fp-scoreboard';
    return sb;
}
function showScoreboard() {
    updateScoreboardContent(ada);
    scoreboardEl.classList.remove('fp-scoreboard-hidden');
    scoreboardTimer = setTimeout(function() {
        scoreboardEl.classList.add('fp-scoreboard-hidden');
    }, 5000);
}
function updateScoreboardContent(ada) {
    // Ada adi, bina sayisi, BB, maliyet, kalite skoru (ReviewEngine), loss budget durumu
    scoreboardEl.innerHTML = '...'; // 6 ozellik karti
}
```

#### createModal() — Satir 753-807
```javascript
function createModal() {
    modalBackdrop = document.createElement('div');
    modalBackdrop.className = 'fp-modal-backdrop';
    modalBackdrop.addEventListener('click', closeModal);

    modalEl = document.createElement('div');
    modalEl.className = 'fp-modal';
    modalEl.innerHTML =
      '<div class="fp-modal-header">...' +
      '<div class="fp-modal-tabs">' +
        '<button class="fp-modal-tab" data-tab="envanter">Envanter</button>' +
        '<button class="fp-modal-tab" data-tab="maliyet">Maliyet</button>' +
        '<button class="fp-modal-tab" data-tab="kpi">KPI</button>' +
        '<button class="fp-modal-tab" data-tab="binalar">Binalar</button>' +
        '<button class="fp-modal-tab" data-tab="oncelik">Oncelik</button>' +
        '<button class="fp-modal-tab" data-tab="live">Canli Izleme</button>' +
      '</div>' +
      '<div class="fp-modal-body">...(tab panels)...</div>';
    // Tab click: toggle fp-tab-active, renderModalTab(tabName)
    return { backdrop: modalBackdrop, modal: modalEl };
}
function openModal(tabName) {
    renderModalTab(tabName || 'envanter');
    modalBackdrop.classList.add('fp-modal-active');
    modalEl.classList.add('fp-modal-active');
}
function closeModal() {
    modalEl.classList.add('fp-modal-closing');
    modalEl.classList.remove('fp-modal-active');
    setTimeout(function() {
        modalBackdrop.classList.remove('fp-modal-active');
        modalEl.classList.remove('fp-modal-closing');
    }, 150);
}
```

#### Toast Notification — Satir 1868-1903
```javascript
function createToast() {
    var t = document.createElement('div');
    t.className = 'fp-toast';
    t.id = 'fp-toast';
    return t;
}
function showToast(msg, type) {
    toastEl.textContent = msg;
    toastEl.className = 'fp-toast fp-toast-visible fp-toast-' + (type || 'info');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function() {
        toastEl.classList.remove('fp-toast-visible');
    }, 3000);
}
```

#### Public API — Satir 2941-2977
```javascript
return {
    init, show, hide, toggle, isVisible, getMap, setHelpText,
    clear, render, fitBounds, startPlaceMode, stopPlaceMode,
    activateMode, deactivateMode, isMode, autoPlaceBuildings, updateLegend,
    // Smart Bubbles API
    showToolbar, hideToolbar, toggleToolbarForce,
    showScoreboard, openModal, closeModal,
    showToast, refreshToolbarAdaSelect,
    CABLE_STYLES, CORE_COLORS, CITY_PRESETS,
    // Comparison mode (Story 7.3)
    setComparisonMode, getComparisonMode,
    setComparisonLayerVisibility, COMPARISON_COLORS
};
```

---

### 2. fiber-chrome/content/panels.js (4163 satir)

**Yaklasim:** Eski toolbar ve side panel `display:none` ile gizlendi. Public API korundu.

#### Eski toolbar gizlendi — Satir 22-26
```javascript
function injectToolbar() {
    toolbarContainer = document.createElement('div');
    toolbarContainer.id = 'fp-toolbar';
    // Smart Bubbles: eski toolbar gizli — overlay.js Smart Toolbar kullaniliyor
    toolbarContainer.style.display = 'none';
    // ... eski toolbar HTML ve event listeners ayni
}
```

#### Eski side panel gizlendi — Satir 76-80
```javascript
function injectSidePanel() {
    panelContainer = document.createElement('div');
    panelContainer.id = 'fp-side-panel';
    // Smart Bubbles: yan panel gizli — icerik modal/popup uzerinden sunuluyor
    panelContainer.style.display = 'none';
    // ... eski panel HTML ve event listeners ayni
}
```

#### showNotification yonlendirme — Satir 2293-2298
```javascript
function showNotification(text, type) {
    // Smart Bubbles: Toast bildirim sistemi
    if (typeof Overlay !== 'undefined' && Overlay.showToast) {
        Overlay.showToast(text, type);
        return;
    }
    // Fallback: eski notification sistemi...
}
```

#### Public API (korunmus) — Satir 4137-4162
```javascript
return {
    init, refresh, renderAdaSelector, renderBuildingList,
    renderAIPanel, renderVariationPanel, renderEquipmentPanel,
    renderScenarioPanel, openComparisonModal, openRegionalComparisonModal,
    updateStats, showBuildingContextMenu, showAdaContextMenu,
    showNotification, showInlinePrompt, renderTopoPreview,
    _cableActive: function() { return cableState.active; },
    _handleCableClick: handleCableClick,
    _setCableState: _setCableState,
    // Smart Bubbles: overlay toolbar'dan cagirilabilen handler'lar
    _handleExportJSON: handleExportJSON,
    _handleExportCSV: handleExportCSV,
    _handleExportGeoJSON: handleExportGeoJSON,
    _handleYeniAda: handleYeniAda
};
```

**DIKKAT:** Bulk mode (enterBulkMode, showBulkTip) hala `fp-side-panel` referansi kullaniyor. Panel `display:none` oldugu icin bulk mode de gizli. Teknik borc olarak birakidi.

---

### 3. fiber-chrome/content/main.js (612 satir)

#### F2 Toggle — Satir 220-227
```javascript
document.addEventListener('keydown', function(e) {
    if (e.key === 'F2') {
        e.preventDefault();
        if (typeof Overlay !== 'undefined' && Overlay.toggleToolbarForce) {
            Overlay.toggleToolbarForce();
        }
    }
});
```

#### ESC Onceligi — Satir 230-247
```javascript
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        // 1. Modal aciksa modal kapat
        if (typeof Overlay !== 'undefined' && Overlay.closeModal) {
            var modal = document.getElementById('fp-modal');
            if (modal && modal.classList.contains('fp-modal-active')) {
                Overlay.closeModal();
                return;
            }
        }
        // 2. Leaflet popup aciksa popup kapat
        if (typeof Overlay !== 'undefined' && Overlay.getMap) {
            var m = Overlay.getMap();
            if (m) m.closePopup();
        }
        // 3. Aktif mod varsa mod kapat
    }
});
```

**POTANSIYEL SORUN:** ESC step 3'te aktif mod kapatma eksik — yorum olarak "overlay.js zaten handler var" denmis ama acik `deactivateMode()` cagrisi yok. Overlay.js'in kendi ESC handler'i mi var kontrol edilmeli.

---

### 4. fiber-chrome/lib/map-utils.js (280 satir)

#### Pentagon Hover CSS — Satir 81-82
```javascript
return L.divIcon({
    className: 'fp-pentagon-hover',  // hover: brightness(1.2) CSS efekti
    html: '<svg ...>...</svg>',
    iconSize: [size * 2, height],
    iconAnchor: [size, size]
});
```

Tek degisiklik: `className: 'fp-pentagon-hover'` eklenmesi. CSS'te `.fp-pentagon-hover:hover { filter: brightness(1.2); }` tanimli.

---

### 5. fiber-chrome/styles/overlay.css (2607 satir)

#### CSS Degisken Sistemi — Satir 27-67 (:root)
```css
/* Smart Bubbles - Arka Plan */
--fp-bg-base: #0F1117;
--fp-bg-surface: #1A1D27;
--fp-bg-elevated: #242835;
--fp-bg-overlay: #2E3344;

/* Smart Bubbles - Metin */
--fp-text-primary: #F0F2F5;
--fp-text-secondary: #9CA3B4;

/* Smart Bubbles - Durum */
--fp-color-ok: #22C55E;
--fp-color-warning: #F59E0B;
--fp-color-fail: #EF4444;
--fp-color-info: #3B82F6;

/* Smart Bubbles - Boyut & Bosluk */
--fp-toolbar-height: 44px;
--fp-radius-sm: 4px; --fp-radius-md: 8px; --fp-radius-lg: 12px;
--fp-space-1: 4px; --fp-space-2: 8px; --fp-space-3: 12px;
--fp-space-4: 16px; --fp-space-6: 24px;

/* Smart Bubbles - Tipografi */
--fp-text-xs: 11px; --fp-text-sm: 12px; --fp-text-base: 13px;
--fp-text-md: 14px; --fp-text-lg: 16px; --fp-text-xl: 20px;
```

**NOT:** Eski CSS degiskenleri (--fp-bg, --fp-surface, --fp-text vs.) de hala mevcut. Smart Bubbles degiskenleri bunlarin YANINA eklenmis. Iki degisken seti paralel yasiyor.

#### z-index Hiyerarsisi
```css
Leaflet harita:     1000  (fp-map-overlay)
Leaflet popup:      1100  (Leaflet built-in)
Scoreboard:         1150  (.fp-scoreboard)
Toolbar trigger:    1199  (.fp-toolbar-trigger)
Smart Toolbar:      1200  (.fp-smart-toolbar)
Modal backdrop:     1250  (.fp-modal-backdrop)
Modal kart:         1300  (.fp-modal)
```

#### Smart Toolbar CSS — Satir 1769-1935
```css
.fp-smart-toolbar {
    position: fixed; top: 0; left: 0; right: 0;
    height: var(--fp-toolbar-height);
    background: rgba(15, 17, 23, 0.92);
    backdrop-filter: blur(12px);
    z-index: 1200;
    opacity: 0; transform: translateY(-100%);
    transition: opacity 200ms ease-in-out, transform 200ms ease-in-out;
    pointer-events: none;
}
.fp-smart-toolbar.fp-toolbar-visible {
    opacity: 1; transform: translateY(0); pointer-events: auto;
}
.fp-smart-toolbar.fp-toolbar-hiding {
    opacity: 0; transform: translateY(-100%);
    transition: opacity 300ms ease-in-out, transform 300ms ease-in-out;
}
.fp-toolbar-trigger {
    position: fixed; top: 0; left: 0; right: 0;
    height: 60px; z-index: 1199; pointer-events: auto;
}
```

#### Scoreboard CSS — Satir 1938-1994
```css
.fp-scoreboard {
    position: fixed; top: var(--fp-space-3); left: 50%;
    transform: translateX(-50%); z-index: 1150;
    background: rgba(26, 29, 39, 0.95);
    backdrop-filter: blur(12px);
    border-radius: var(--fp-radius-lg);
    opacity: 1; transition: opacity 1000ms ease-out;
}
.fp-scoreboard.fp-scoreboard-hidden { opacity: 0; pointer-events: none; }
```

#### Modal CSS — Satir 1997-2108
```css
.fp-modal-backdrop {
    position: fixed; inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1250; opacity: 0; pointer-events: none;
}
.fp-modal-backdrop.fp-modal-active { opacity: 1; pointer-events: auto; }

.fp-modal {
    position: fixed; top: 50%; left: 50%;
    transform: translate(-50%, -48%) scale(0.97);
    z-index: 1300;
    width: min(900px, 90vw); max-height: 80vh;
    opacity: 0; pointer-events: none;
}
.fp-modal.fp-modal-active {
    opacity: 1; pointer-events: auto;
    transform: translate(-50%, -50%) scale(1);
}
.fp-modal.fp-modal-closing {
    opacity: 0; transform: translate(-50%, -48%) scale(0.97);
    transition: all 150ms ease-in;
}
```

#### Toast CSS — Satir 2181-2205
```css
.fp-toast {
    position: fixed; bottom: 24px; left: 50%;
    transform: translateX(-50%) translateY(20px);
    z-index: 1400; opacity: 0;
    transition: opacity 200ms, transform 200ms;
}
.fp-toast.fp-toast-visible {
    opacity: 1; transform: translateX(-50%) translateY(0);
}
.fp-toast.fp-toast-success { color: #22c55e; background: rgba(34,197,94,0.12); }
.fp-toast.fp-toast-info { color: #06b6d4; background: rgba(6,182,212,0.12); }
.fp-toast.fp-toast-error { color: #ef4444; background: rgba(239,68,68,0.12); }
```

#### Pentagon Hover + Responsive — Satir 2208-2240
```css
.fp-pentagon-hover:hover { filter: brightness(1.2); }
@keyframes fp-mode-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(250,204,21,0.4); }
    50% { box-shadow: 0 0 0 6px rgba(250,204,21,0); }
}
/* Responsive < 1440px */
@media (max-width: 1440px) {
    .fp-smart-toolbar { gap: var(--fp-space-1); padding: 0 var(--fp-space-2); }
    .fp-tb-btn { padding: 3px 6px; font-size: 10px; }
    .fp-tb-help { display: none; }
    /* ...diger kucultmeler */
}
```

---

## Bilinen Sorunlar (Self-Review'dan)

| # | Ciddiyet | Aciklama | Durum |
|---|----------|----------|-------|
| 1 | MEDIUM | overlay.js renderAdaBuildings() — marker.bindTooltip() eksikti (hover tooltip) | FIXED |
| 2 | MEDIUM | panels.js eski DOM elemanlari display:none ile gizli. Bulk mode fp-side-panel referansi kullaniyor | Teknik borc |
| 3 | MEDIUM | overlay.css legacy CSS siniflari (.fp-toolbar-inner, .fp-logo, .fp-panel-header) hala mevcut | Teknik borc |
| 4 | MEDIUM | createToolbar/createScoreboard/createModal/createToast icin UI test dosyasi yok | Teknik borc |
| 5 | LOW | CSS'te iki paralel degisken seti var (eski --fp-bg vs yeni --fp-bg-base) | Teknik borc |
| 6 | LOW? | main.js ESC handler'da aktif mod kapatma cagrisi eksik olabilir (step 3) | KONTROL GEREKLI |

---

## Review Sorulari

1. **Memory leak riski:** `toolbarHideTimer`, `scoreboardTimer`, `toastTimer` — bunlar clearTimeout ile temizleniyor mu? Extension sayfayi terk ettiginde timer'lar temizlenmeli mi?

2. **CSS catisma:** NVI portal'in kendi CSS'i ile `.fp-smart-toolbar`, `.fp-modal` gibi siniflar catisabilir mi? fp- prefix yeterli mi?

3. **Event listener birikimi:** Toolbar ve modal icindeki event listener'lar her init'te yeniden mi ekleniyor? Birden fazla init() cagrilirsa listener birikimi olur mu?

4. **Accessibility:** Modal acikken focus trap var mi? Tab ile gezinme modal disina cikabilir mi?

5. **Scoreboard top konumu:** toolbar visible iken scoreboard toolbar'in ALTINDA mi kalir yoksa ustune mi biner? (z-index toolbar=1200, scoreboard=1150)

6. **Panels.js display:none yaklasimi:** Eski panel HTML'i DOM'da hala var ama gizli. Bu gereksiz DOM sismesi yaratiyor. Gelecekte tamamen kaldirilmali mi yoksa backward compat icin korunmali mi?

---

## Proje Baglamlari

- **IIFE pattern zorunlu:** `const Module = (() => { ... })()`
- **fp- prefix zorunlu:** Tum CSS siniflari ve DOM id'leri
- **No framework:** Vanilla JS, Leaflet haric kutuphane YOK
- **NVI portal uzerine enjekte:** Content script olarak calisiyor
- **Chrome Extension Manifest V3:** Service worker background.js
- **z-index dizilimi:** harita=1000, popup=1100, scoreboard=1150, toolbar=1200, backdrop=1250, modal=1300
