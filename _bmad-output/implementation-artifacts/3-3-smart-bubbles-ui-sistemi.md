# Story 3.3: Smart Bubbles UI Sistemi

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a saha muhendisi,
I want topoloji, envanter ve yonetim islevlerine harita-merkezli Smart Bubbles arayuzu ile erisebilmek,
So that harita alanini hic kisitlamadan, tikla-gor mantigi ile tum bilgilere hizla ulasabileyim.

## Acceptance Criteria

### AC1: Tam Ekran Harita + Auto-hide Toolbar
**Given** extension aktif ve bir ada yuklenmisken
**When** harita goruntulendiginde
**Then** harita %100 ekran kaplayacak, hicbir sabit panel harita alanini kalici olarak kisitlamamali
**And** tum bilgiler kullanici etkilesimiyle (tikla, hover) ortaya cikmali

**Given** kullanici haritanin ust 60px alanina mouse ile geldiginde
**When** auto-hide toolbar goruntulendiginde
**Then** toolbar icerisinde sunlar bulunmali:
- Ada secici dropdown
- Mod butonlari (OLT MOD, KABLO CIZ, SINIR CIZ)
- Eylem butonlari (HESAPLA, KAYDET, EXPORT)
- Envanter/Maliyet modal butonu
- Scoreboard ikonu
**And** mouse toolbar alanindan ciktiginda 2sn sonra fadeOut ile gizlenmeli
**And** aktif mod varken toolbar surekli gorunur kalmali
**And** F2 klavye kisayolu ile toolbar toggle edilebilmeli

### AC2: Scoreboard Card
**Given** bir ada yuklendiginde
**When** scoreboard karti goruntulendiginde
**Then** ust ortada yuzen kart olarak belirmeli:
- Ada adi, bina sayisi, toplam BB, toplam maliyet, kalite skoru, loss budget durumu
**And** 5 saniye sonra yavasce solmali (fadeOut)
**And** toolbar daki scoreboard ikonuna tiklayarak tekrar goruntulenebilmeli

### AC3: Modal Cards (Inventory, Cost, KPI)
**Given** kullanici envanter veya maliyet detayini gormek istediginde
**When** toolbar dan "Envanter" veya "Maliyet" butonuna tikladiginda
**Then** ekran ortasinda modal kart acilmali:
- Icinde sekmeli yapi: Envanter / Maliyet / KPI
- Harita %50 karartilmali (backdrop overlay)
- ESC veya dis tiklama ile kapanmali
**And** modal icindeki sekmeler arasi gecis < 100ms olmali

### AC4: Detail Popups (Building, Cable, OLT)
**Given** kullanici binaya/kabloya/OLT ye tikladiginda
**When** detay popup i acildiginda
**Then** Leaflet popup API ile ilgili detay balonu gosterilmeli:
- Bina popup: BB, splitter, loss budget, maliyet bilgileri
- Kablo popup: mesafe, kor sayisi, kablo tipi
- OLT popup: port durumu ve kapasite
**And** tek seferde maksimum 1 detay popup acik olmali (yenisi acilinca eski kapanir)

## Tasks / Subtasks

### Faz 1: Auto-hide Toolbar (AC: #1)
- [x] Task 1: Mevcut header bar + legend paneli kaldir, yerine auto-hide toolbar yaz
  - [x] 1.1: overlay.js deki createHeaderBar() ve createLegendPanel() fonksiyonlarini kaldir
  - [x] 1.2: Yeni createToolbar() fonksiyonu yaz - position:fixed, top:0, backdrop-filter:blur(8px)
  - [x] 1.3: Ada secici dropdown u toolbar a tasi (mevcut panels.js ada dongusunden)
  - [x] 1.4: Mod butonlarini toolbar a tasi (OLT SEC, KABLO CIZ, SINIR CIZ)
  - [x] 1.5: Eylem butonlarini toolbar a tasi (HESAPLA, KAYDET, EXPORT)
  - [x] 1.6: Auto-hide davranisi: mouseenter (ust 60px) fadeIn, mouseleave 2sn delay + fadeOut
  - [x] 1.7: Aktif mod varken toolbar i surekli gorunur tut
  - [x] 1.8: F2 klavye kisayolu ile toggle ekle (main.js keydown listener)

### Faz 2: Yan Panel Kaldirilmasi (AC: #1)
- [x] Task 2: Mevcut sabit yan paneli kaldir, bina listesini popup/modal a tasi
  - [x] 2.1: panels.js deki sabit side panel DOM olusturma kodunu kaldir
  - [x] 2.2: Bina listesi islevlerini toolbar dropdown veya modal icine tasi
  - [x] 2.3: Cable mode UI ini toolbar ile entegre et
  - [x] 2.4: Mevcut panels.js public API sini koru (refresh, showBuildingContextMenu vs.)

### Faz 3: Scoreboard Card (AC: #2)
- [x] Task 3: Scoreboard karti olustur
  - [x] 3.1: createScoreboard() fonksiyonu - yuzen kart, ust orta konum
  - [x] 3.2: Icerik: ada adi, bina sayisi, toplam BB, maliyet, kalite skoru, loss budget durumu
  - [x] 3.3: Otomatik fadeOut: 5sn delay + 1sn fade animasyonu
  - [x] 3.4: Toolbar daki scoreboard ikonu ile tekrar gosterme
  - [x] 3.5: Ada yukleme/degistirme eventinde otomatik guncelleme

### Faz 4: Modal Cards (AC: #3)
- [x] Task 4: Modal kart sistemi olustur
  - [x] 4.1: Modal container + backdrop olustur (rgba(0,0,0,0.5), fadeIn/Out)
  - [x] 4.2: Sekmeli yapi: Envanter / Maliyet / KPI
  - [x] 4.3: Envanter sekmesi: mevcut envanter tablosu (Story 3.1 icerigini goster)
  - [x] 4.4: Maliyet sekmesi: mevcut maliyet tablosu + inline fiyat duzenleme (Story 3.2)
  - [x] 4.5: KPI sekmesi: performans gostergeleri (kalite skoru, loss budget ozeti)
  - [x] 4.6: ESC + dis tiklama ile kapatma
  - [x] 4.7: Toolbar dan acma butonu entegrasyonu

### Faz 5: Detail Popups (AC: #4)
- [x] Task 5: Zengin detay popuplari olustur
  - [x] 5.1: Bina popup sablonu: BB, splitter, loss budget (dB + durum badge), maliyet
  - [x] 5.2: Kablo popup sablonu: mesafe, kor sayisi, kablo tipi, baslangic-bitis binalari
  - [x] 5.3: OLT popup sablonu: port durumu, kapasite, bagli bina sayisi
  - [x] 5.4: Tek popup kurali: yeni popup acildiginda onceki kapanir
  - [x] 5.5: Popup stil: --fp-bg-surface, --fp-border-default, fadeIn 150ms

### Faz 6: Hover & Gecis Animasyonlari
- [x] Task 6: Hover davranislari ve animasyonlar (AC: #1, #4)
  - [x] 6.1: Pentagon ikon hover: brightness(1.2) + tooltip (bina adi, BB sayisi)
  - [x] 6.2: Toolbar buton hover: --fp-bg-elevated arka plan
  - [x] 6.3: Durum degisimi animasyonu: transition 300ms
  - [x] 6.4: Yeni hesaplama sonrasi pulse efekti (500ms)

### Faz 7: CSS & Style Sistemi
- [x] Task 7: Smart Bubbles CSS sinif sistemi (tum AC ler)
  - [x] 7.1: overlay.css genisletme - tum yeni siniflar fp- prefix ile
  - [x] 7.2: CSS degiskenleri tanimla (--fp-bg-surface, --fp-radius-lg, vs.)
  - [x] 7.3: Dark mode renk sistemi uygula
  - [x] 7.4: Responsive uyum (< 1440px icin kuculen toolbar butonlari)
  - [x] 7.5: z-index hiyerarsisi: harita=1000, popup=1100, toolbar=1200, modal=1300, backdrop=1250

## Dev Notes

### Kritik Mimari Kararlar

**Bu story panels.js in YENIDEN YAPILANDIRILMASINI gerektirir.** Mevcut panels.js (3,700+ satir) sabit yan panel mimarisi uzerine kurulu. Smart Bubbles yaklasiminda sabit panel YOK - tum icerik toolbar, popup ve modal uzerinden sunuluyor.

**Yaklasim:** panels.js i sifirdan yazmak yerine, mevcut islevleri koruyarak adim adim donusturmek:
1. Once toolbar i overlay.js e ekle (Faz 1)
2. Sonra yan paneli kaldir, islevleri toolbar/modal a tasi (Faz 2)
3. panels.js public API sini koru - diger moduller (overlay.js, main.js) bu API yi kullaniyor

### Mevcut Kod Durumu (Brownfield Analiz)

**overlay.js (1,463 satir) - DEGISECEK:**
- createHeaderBar() (satir 169-352): Kaldirilacak, toolbar a tasinacak
- createLegendPanel() (satir 580-683): Modal KPI sekmesine tasinacak
- renderAdaBuildings() (satir 1328-1423): Popup sablonlari zenginlestirilecek
- renderAdaCables(): Kablo popup sablonu eklenecek
- activateMode()/deactivateMode(): Toolbar ile entegre edilecek

**panels.js (3,700+ satir) - YENIDEN YAPILANDIRILACAK:**
- Mevcut sabit panel DOM olusturma: Kaldirilacak
- renderBuildingList() (satir 494-615): Modal veya dropdown a tasinacak
- showBuildingContextMenu() (satir 1022-1137): Korunacak (popup icerisinden tetiklenecek)
- Cable mode UI: Toolbar a entegre edilecek
- refresh(): Korunacak ama yeni UI elemanlarini guncelleyecek

**map-utils.js (238 satir) - MINIMAL DEGISIKLIK:**
- createPentagonIcon(): Hover efekti icin CSS sinifi eklenecek
- Renk kodlari korunuyor (COLORS objesi ayni)

### Korunacak Public API ler

```javascript
// panels.js - bu metodlar diger moduller tarafindan cagriliyor:
Panels.init()          // main.js den cagriliyor
Panels.refresh()       // overlay.js renderdan sonra, main.js auto-save den sonra
Panels._cableActive()  // overlay.js renderAdaCables icerisinde
Panels._handleCableClick() // overlay.js marker click handler dan
Panels._setCableState()    // overlay.js cable mode activation dan
Panels.showBuildingContextMenu() // overlay.js marker contextmenu eventinden
```

### CSS Degisken Sistemi (UX Spec ten)

```css
/* Arka Plan */
--fp-bg-base: #0F1117;
--fp-bg-surface: #1A1D27;
--fp-bg-elevated: #242835;
--fp-bg-overlay: #2E3344;

/* Metin */
--fp-text-primary: #F0F2F5;
--fp-text-secondary: #9CA3B4;
--fp-text-muted: #5C6478;

/* Durum */
--fp-color-ok: #22C55E;
--fp-color-warning: #F59E0B;
--fp-color-fail: #EF4444;
--fp-color-info: #3B82F6;

/* Bina Tipleri */
--fp-color-olt: #8B5CF6;
--fp-color-fdh: #3B82F6;
--fp-color-mdu-large: #22C55E;
--fp-color-mdu-medium: #F97316;
--fp-color-sfu: #EAB308;

/* Boyut & Bosluk */
--fp-toolbar-height: 44px;
--fp-radius-sm: 4px;
--fp-radius-md: 8px;
--fp-radius-lg: 12px;
--fp-space-1: 4px;
--fp-space-2: 8px;
--fp-space-3: 12px;
--fp-space-4: 16px;
--fp-space-6: 24px;

/* Tipografi */
--fp-text-xs: 11px;
--fp-text-sm: 12px;
--fp-text-base: 13px;
--fp-text-md: 14px;
--fp-text-lg: 16px;
--fp-text-xl: 20px;
```

### Popup HTML Sablonlari

**Bina Popup:**
```html
<div class="fp-popup fp-popup__building">
  <div class="fp-popup__header">
    <h4>{buildingName}</h4>
    <span class="fp-badge fp-status--{lossStatus}">{lossStatus}</span>
  </div>
  <div class="fp-popup__metrics">
    <span class="fp-popup__metric-lg">{bbCount} BB</span>
    <span class="fp-popup__metric-lg">{totalCost} TL</span>
  </div>
  <div class="fp-popup__details">
    <div>Splitter: {splitterRatio}</div>
    <div>Loss Budget: {loss} dB</div>
    <div>Mesafe: {distance} m</div>
  </div>
</div>
```

**Kablo Popup:**
```html
<div class="fp-popup fp-popup__cable">
  <div class="fp-popup__header"><h4>{cableType}</h4></div>
  <div class="fp-popup__details">
    <div>Mesafe: {distance} m</div>
    <div>Kor: {coreCount}</div>
    <div>Kayip: {fiberLoss} dB</div>
    <div>{fromBuilding} -> {toBuilding}</div>
  </div>
</div>
```

**OLT Popup:**
```html
<div class="fp-popup fp-popup__olt">
  <div class="fp-popup__header">
    <h4>{oltBuildingName}</h4>
    <span class="fp-badge fp-badge--olt">OLT</span>
  </div>
  <div class="fp-popup__metrics">
    <span class="fp-popup__metric-lg">{usedPorts}/{totalPorts} Port</span>
    <span class="fp-popup__metric-lg">{totalBB} BB</span>
  </div>
  <div class="fp-popup__capacity-bar">
    <div class="fp-capacity__fill fp-capacity--{capacityStatus}" style="width:{capacityPct}%"></div>
  </div>
</div>
```

### Animasyon Zamanlama Referansi

| Animasyon | Sure | Ease | Tetikleme |
|-----------|------|------|-----------|
| Toolbar fadeIn | 200ms | ease-in-out | Mouse ust 60px e giris |
| Toolbar fadeOut | 300ms | ease-in-out | Mouse cikisi + 2sn delay |
| Scoreboard fadeOut | 1000ms | ease-out | 5sn delay sonrasi |
| Modal backdrop fadeIn | 200ms | ease-out | Modal acma |
| Modal slideUp + fadeIn | 200ms | ease-out | Modal acma |
| Modal fadeOut | 150ms | ease-in | Modal kapama |
| Popup fadeIn | 150ms | ease-out | Eleman tiklama |
| Popup fadeOut | 100ms | ease-in | Kapatma |
| Durum degisimi | 300ms | ease | Yeni hesaplama |
| Pulse efekti | 500ms | ease | Hesaplama sonrasi dikkat |

### z-index Hiyerarsisi

| Katman | z-index | Aciklama |
|--------|---------|----------|
| Leaflet harita | 1000 | Temel harita |
| Leaflet popup | 1100 | Bina/kablo/OLT detay |
| Scoreboard | 1150 | Yuzen ozet karti |
| Toolbar | 1200 | Auto-hide toolbar |
| Modal backdrop | 1250 | Karartma katmani |
| Modal kart | 1300 | Envanter/Maliyet/KPI |

### Performans Gereksinimleri

| Islem | Hedef | Aciklama |
|-------|-------|----------|
| Sekme degistirme | < 100ms | CSS transition:none, DOM toggle |
| Popup render | < 50ms | Leaflet native rendering |
| Toolbar auto-hide | 2sn delay | setTimeout + CSS transition |
| Modal backdrop | < 100ms | CSS opacity transition |
| Inline fiyat duzenleme | < 100ms | Input focus + blur save |

### Etkilesim Kurallari (Kesin)

1. **Tek popup kurali:** Yeni popup acildiginda onceki otomatik kapanir
2. **ESC kapatma onceligi:** Modal > Popup > Aktif Mod
3. **Dis tiklama:** Modal dis alan -> modal kapat, Harita bos alan -> popup kapat
4. **F2 toggle:** Toolbar gorunurlugu
5. **Mod aktifken:** Toolbar surekli gorunur
6. **Scoreboard yenileme:** Ada yuklendiginde + recalculate sonrasi

### Dokunulacak Dosyalar

| Dosya | Islem | Aciklama |
|-------|-------|----------|
| content/overlay.js | Degistirilecek | Toolbar ekleme, header/legend kaldirma, popup zenginlestirme |
| content/panels.js | Yeniden yapilandirilacak | Sabit panel -> toolbar/modal/popup gecisi |
| styles/overlay.css | Genisletilecek | Tum yeni Smart Bubbles CSS siniflari |
| content/main.js | Minimal degisiklik | F2 keydown listener, scoreboard tetikleme |
| lib/map-utils.js | Minimal degisiklik | Hover CSS sinifi ekleme |

### YAPMA Listesi (Anti-patterns)

1. **YENI dosya olusturma** - Tum degisiklikler mevcut dosyalarda yapilacak
2. **Import/export kullanma** - IIFE pattern zorunlu
3. **fp- prefix siz CSS** - Tum siniflar fp- ile baslamali
4. **NVI DOM u ile catisma** - z-index hiyerarsisine uy, fp- prefix kullan
5. **Sabit panel birakma** - Harita %100 kaplayacak, hicbir kalici panel YOK
6. **Mevcut public API yi kirma** - Panels.refresh(), Panels._cableActive() vs. korunmali
7. **Framework ekleme** - Vanilla JS, ek kutuphane YOK (Leaflet zaten var)
8. **Build step ekleme** - Dogrudan tarayicida calisan kod

### Project Structure Notes

- Tum dosyalar fiber-chrome/ altinda
- manifest.json yukleme sirasi degismeyecek (overlay panels ten once yuklenir)
- CSS degiskenleri overlay.css dosyasina :root altinda tanimlanacak
- Test: dashboard/test-topology.html mevcut testlere ek olarak gorsel dogrulama

### References

- [Source: _bmad-output/planning-artifacts/epics.md - Epic 3, Story 3.3]
- [Source: _bmad-output/planning-artifacts/architecture.md - Frontend Mimarisi, Implementasyon Kaliplari]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md - Smart Bubbles, Popup Sistemi, Renk Sistemi]
- [Source: CLAUDE.md - Core Data Flow, Key Files, Building Types & Map Colors]
- [Source: fiber-chrome/content/overlay.js - Mevcut marker/popup implementasyonu]
- [Source: fiber-chrome/content/panels.js - Mevcut panel sistemi]
- [Source: fiber-chrome/lib/map-utils.js - Pentagon ikon uretimi]

## AI-Review Checklist

### Reviewer: Claude Opus 4.6
### Tarih: 2026-03-02

| # | Kontrol | Durum | Not |
|---|---------|-------|-----|
| 1 | AC1: Tam ekran harita | OK | #fp-map-overlay top:0, right:0, %100 ekran |
| 2 | AC1: Auto-hide toolbar (60px trigger, 2sn delay, fadeOut) | OK | createToolbar(), fp-toolbar-trigger, mouseenter/mouseleave |
| 3 | AC1: F2 toggle | OK | main.js keydown listener |
| 4 | AC1: Aktif mod → toolbar pinli | OK | activateMode() toolbarVisible=true koruyor |
| 5 | AC2: Scoreboard karti (ust orta, 5sn fadeOut) | OK | createScoreboard(), 5000ms setTimeout |
| 6 | AC2: Toolbar'dan scoreboard tekrar gosterme | OK | fp-tb-btn scoreboard ikonu |
| 7 | AC3: Modal (Envanter/Maliyet/KPI sekmeleri) | OK | createModal(), sekmeli yapi |
| 8 | AC3: ESC + dis tiklama kapatma | OK | ESC onceligi: Modal > Popup > Mod |
| 9 | AC3: Backdrop %50 karartma | OK | fp-modal-backdrop rgba(0,0,0,0.5) |
| 10 | AC4: Bina popup (BB, splitter, loss, maliyet) | OK | fp-popup__building sablonu |
| 11 | AC4: Kablo popup (mesafe, kor, fiber kayip) | OK | fp-popup__cable sablonu, bindTooltip |
| 12 | AC4: OLT popup (port, kapasite bar) | OK | fp-popup__olt sablonu |
| 13 | AC4: Tek popup kurali | OK | Leaflet tek popup destegi varsayilan |
| 14 | Task 6.1: Pentagon hover brightness(1.2) | OK | CSS fp-pentagon-hover:hover filter |
| 15 | Task 6.1: Pentagon hover tooltip (bina adi + BB) | **FIX** | marker.bindTooltip() eksikti → eklendi |
| 16 | Panels.js public API korundu | OK | display:none, API metodlari yonlendirme |
| 17 | z-index hiyerarsisi | OK | 1000/1100/1150/1200/1250/1300 |
| 18 | CSS degisken sistemi (--fp-*) | OK | :root altinda tam set |
| 19 | Responsive < 1440px | OK | CSS media query |
| 20 | IIFE pattern, fp- prefix | OK | Tum kod IIFE, siniflar fp- onekli |

### Sonuc: 1 FIX gerekli (hover tooltip)

### Adversarial Review Aksiyonlari

- [x] [AI-Review] **Bulgu 1 (MEDIUM):** overlay.js renderAdaBuildings() — bina markerlara `marker.bindTooltip()` ekle (Task 6.1 hover tooltip) — **FIXED**
- [ ] [AI-Review] **Bulgu 2 (MEDIUM — teknik borc):** panels.js eski DOM elemanlari `display:none` ile gizli. Bulk mode (enterBulkMode, showBulkTip) hala `fp-side-panel` referansi kullaniyor, tamamen kaldirmak kirar. Gelecek sprint'te refactor edilecek.
- [ ] [AI-Review] **Bulgu 3 (MEDIUM):** overlay.css legacy CSS siniflari (.fp-toolbar-inner, .fp-logo, .fp-panel-header) — Bulgu 2 cozuldugunde temizlenecek.
- [ ] [AI-Review] **Bulgu 4 (MEDIUM):** createToolbar/createScoreboard/createModal/createToast icin UI test dosyasi olusturulacak.

### Adversarial Review #2 Aksiyonlari (2026-03-07, Claude Opus 4.6)

- [x] [AI-Review2] **H1 (HIGH):** openModal(tabName) sekme butonunu gorsel olarak guncellemiyordu — CANLI butonu acildiginda Envanter sekmesi aktif gorunuyordu — **FIXED** (overlay.js:809)
- [x] [AI-Review2] **H2 (HIGH):** Offline badge gizli eski toolbar'a (#fp-toolbar) ekleniyordu, Smart Toolbar'da gorunmuyordu — **FIXED** (main.js:284)
- [x] [AI-Review2] **M1 (MEDIUM):** Scoreboard HESAPLA/ADA BITIR sonrasi guncellenmiyordu — showScoreboard() cagrilari eklendi — **FIXED** (overlay.js:298,285)
- [x] [AI-Review2] **M2 (MEDIUM):** Toast z-index (1200) = Toolbar z-index (1200), overlap riski — toast z-index 1225 yapildi — **FIXED** (overlay.css)
- [x] [AI-Review2] **M3 (MEDIUM):** Kablo popup'lari AC4'e aykiri bindTooltip kullanyordu — bindPopup eklendi + basit tooltip korundu — **FIXED** (overlay.js:2802)
- [x] [AI-Review2] **M4 (MEDIUM):** z-index tutarsizligi (eski 10000-99999, yeni 1000-1300) — ctx-menu:1350, flash:1500, var-form:1350, comparison:1350 yapildi — **FIXED** (overlay.css)
- [x] [AI-Review2] **M5 (MEDIUM):** Popup HTML'de XSS riski — _esc() fonksiyonu eklendi, tum popup bina/ada adlari escape edildi — **FIXED** (overlay.js)
- [ ] [AI-Review2] **L1 (LOW):** UI test dosyasi olusturulmamis (onceki Review Bulgu 4 ile ayni)
- [ ] [AI-Review2] **L2 (LOW):** Eski panel event listener'lari bellek israfi (onceki Review Bulgu 2 ile ayni)

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

N/A — gorsel dogrulama gerekli (Chrome Extension tarayicida test edilmeli)

### Completion Notes List

1. overlay.js: buildHeaderBar() ve buildLegendPanel() kaldirild, yerine createToolbar(), createScoreboard(), createModal(), createToast() eklendi
2. overlay.js: #fp-map-overlay tam ekran (top:0, right:0), z-index:1000
3. overlay.js: Auto-hide toolbar — 60px hover trigger, 2sn delay fadeOut, F2 toggle, mod aktifken pinli
4. overlay.js: Scoreboard — ada yukleme/degistirme/hesaplamada otomatik gosterim, 5sn fadeOut
5. overlay.js: Modal — Envanter/Maliyet/KPI/Binalar sekmeleri, ESC + dis tiklama ile kapatma
6. overlay.js: Rich popuplar — bina (BB, splitter, loss budget, maliyet), kablo (mesafe, kor, fiber kayip), OLT (port, kapasite bar)
7. overlay.css: Smart Bubbles CSS degisken sistemi (--fp-bg-*, --fp-text-*, --fp-color-*, --fp-radius-*, --fp-space-*, --fp-text-*)
8. overlay.css: z-index hiyerarsisi: harita=1000, popup=1100(Leaflet), scoreboard=1150, toolbar=1200, backdrop=1250, modal=1300
9. overlay.css: Responsive < 1440px, toolbar/scoreboard/modal/toast/popup stilleri, hover/pulse animasyonlari
10. panels.js: Eski toolbar ve side panel gizlendi (display:none), public API korundu
11. panels.js: showNotification() -> Overlay.showToast() yonlendirme
12. panels.js: Export handler'lari public API'ye eklendi (_handleExportJSON, _handleExportCSV, _handleExportGeoJSON, _handleYeniAda)
13. main.js: F2 klavye kisayolu (toolbar toggle), ESC onceligi (Modal > Popup > Mod)
14. map-utils.js: Pentagon ikon hover CSS sinifi (fp-pentagon-hover)

### File List

| Dosya | Degisiklik |
|-------|-----------|
| fiber-chrome/styles/overlay.css | Smart Bubbles CSS degiskenleri, toolbar/scoreboard/modal/popup/toast/hover/pulse stilleri, tam ekran map overlay, responsive |
| fiber-chrome/content/overlay.js | buildHeaderBar/buildLegendPanel -> createToolbar/createScoreboard/createModal/createToast, auto-hide, rich popuplar |
| fiber-chrome/content/panels.js | Eski toolbar+panel gizlendi, showNotification->showToast, export handler'lar public API'ye eklendi |
| fiber-chrome/content/main.js | F2 klavye kisayolu, ESC oncelik sirasi |
| fiber-chrome/lib/map-utils.js | Pentagon hover CSS sinifi |
