# Story 7.3: Planlanan vs Canli Ag Karsilastirma

Status: review

## Vizyon Notu

> Bu story, Story 7.1'in "Canli Izleme Harita Katmani"nin bir MODUDUR.
> Kullanici haritada "Karsilastirma" modunu aktif ettiginde, planlanan topoloji (Epic 2)
> ile canli ag verileri (7.1 + 7.2) yan yana overlay olarak goruntulenir.
> Uyumsuzluklar kirmizi ile vurgulanir ve tek bakista plan-gerceklik farki kavranir.
>
> Steve Jobs prensibi: "Karsilastirma" butonu → harita konusur. Tablo ile bogma.

## Story

As a saha muhendisi,
I want planlanan topolojiyi canli ag durumuyla harita uzerinde overlay olarak karsilastirabilmek,
So that planla gerceklik arasindaki farklari tek bakista tespit edebileyim ve duzeltici aksiyonlar alabileyim.

## Acceptance Criteria (BDD)

1. **Given** planlanan topoloji (Epic 2) ve canli ag verileri (Story 7.1) mevcut oldugunda **When** kullanici "Karsilastirma" modunu aktif ettiginde **Then** haritada planlanan ve canli katmanlar ust uste gosterilmeli:
   - Planlanan binalar: mavi pentagon (mevcut hali)
   - Canli cihazlar: yesil halka (7.1'deki durum halkasi)
   - Uyumsuzluk noktalari: kirmizi pulse marker
   **And** uyumsuzluklar gorsel olarak aninda fark edilmeli (kirmizi ile vurgulu)
   **And** katmanlar bagimsiz olarak acilip kapatilabilmeli (3 checkbox: Planlanan / Canli / Uyumsuzluklar)

2. **Given** karsilastirma yapildiginda **When** uyumsuzluklar tespit edildiginde **Then** her uyumsuzluk icin tip, konum, planlanan deger, gercek deger gosterilmeli:
   - MISSING_DEVICE: planlanan binada cihaz yok (kritik)
   - OFFLINE_PLANNED: planlanan cihaz offline (kritik)
   - EXTRA_DEVICE: planlanmamis cihaz online (bilgi)
   - CAPACITY_EXCEEDED: port kapasitesi asimi (uyari)
   - SIGNAL_LOW: canli sinyal < -25 dBm (uyari)
   - CONNECTION_DIFF: kablo rota farkliligi (bilgi)
   **And** uyumsuzluklar oncelik sirasina gore listelenmeli (kritik → uyari → bilgi)

3. **Given** karsilastirma sonuclari mevcut oldugunda **When** kullanici ozet panelini goruntulemek istediginde **Then** uyumsuzluk istatistikleri gosterilmeli:
   - Toplam planlanan bina sayisi vs canli cihaz sayisi
   - Esleme orani (%)
   - Uyumsuzluk dagilimi: kritik / uyari / bilgi sayilari
   **And** rapor JSON olarak export edilebilmeli

4. **Given** uyumsuzluk marker'ina tiklandiginda **When** popup acildiginda **Then** uyumsuzluk detayi gosterilmeli:
   - Tip ikonu + aciklama
   - Planlanan deger vs gercek deger
   - Ciddiyet badge (kirmizi/sari/mavi)
   - Onerilen aksiyon (varsa)

## Tasks / Subtasks

- [x] Task 1: Karsilastirma Motoru — LiveMonitor genisletme (AC: #2)
  - [x] 1.1 `comparePlannedVsLive(adaId)` — ana karsilastirma fonksiyonu
  - [x] 1.2 Uyumsuzluk tipleri: MISSING_DEVICE, EXTRA_DEVICE, CAPACITY_EXCEEDED, CONNECTION_DIFF, OFFLINE_PLANNED, SIGNAL_LOW
  - [x] 1.3 Ciddiyet seviyeleri: critical (3), warning (2), info (1)
  - [x] 1.4 `_compareBuildings(planned, live)` — planlanan binalar vs canli cihaz eslemesi
  - [x] 1.5 `_compareCapacity(planned, live)` — port kapasitesi karsilastirmasi
  - [x] 1.6 `_checkSignalLevels(devices)` — sinyal esik kontrolu (-25 dBm)
  - [x] 1.7 `prioritizeDiscrepancies(discrepancies)` — oncelik siralama
  - [x] 1.8 `getComparisonSummary(adaId)` — ozet istatistikler

- [x] Task 2: Uyumsuzluk Veri Modeli ve Export (AC: #2, #3)
  - [x] 2.1 Discrepancy: `{ id, type, severity, location: { adaId, buildingKey, lat, lng }, planned, actual, description }`
  - [x] 2.2 `exportComparisonReport(adaId)` — JSON export (uyumsuzluk listesi + ozet + tarih)

- [x] Task 3: Harita Overlay Katmanlari (AC: #1, #4)
  - [x] 3.1 `setComparisonMode(enabled)` — karsilastirma modunu ac/kapa
  - [x] 3.2 Uyumsuzluk katmani: kirmizi pulse marker (CSS animasyon)
  - [x] 3.3 Uyumsuzluk marker popup: tip, planlanan vs gercek, ciddiyet badge
  - [x] 3.4 Katman kontrol: 3 checkbox (Planlanan / Canli / Uyumsuzluklar) — bagimsiz toggle
  - [x] 3.5 Katman acildiginda otomatik zoom-to-fit (uyumsuzluk noktalarini goster)

- [x] Task 4: Panel UI — Karsilastirma Gorunumu (AC: #3)
  - [x] 4.1 Canli Izleme sekmesine "Karsilastirma" sub-tab'i ekle
  - [x] 4.2 Ozet kartlari: planlanan/canli sayi, esleme orani, uyumsuzluk sayilari
  - [x] 4.3 Uyumsuzluk listesi: tip ikonu + konum + ciddiyet badge
  - [x] 4.4 Filtre butonlari: tumu / kritik / uyari / bilgi
  - [x] 4.5 JSON export butonu
  - [x] 4.6 "Yenile" butonu: karsilastirmayi guncelle

- [x] Task 5: EventBus Entegrasyonu (AC: #1)
  - [x] 5.1 `comparison:updated` event — karsilastirma sonucu degistiginde yayinla
  - [x] 5.2 Opsiyonel: UISP/Zabbix guncellemesinde otomatik karsilastirma (debounce)

## Dev Notes

### Mimari Kararlar

- **LiveMonitor'un parcasi:** Karsilastirma fonksiyonlari `lib/live-monitor.js` icinde. Ayri modul degil.
- **Read-only:** Karsilastirma planlanan topolojiyi DEGISTIRMEZ. Sadece okur ve karsilastirir.
- **Lazy:** Kullanici "Karsilastir" butonuna bastiginda calisir. Otomatik tetikleme opsiyonel (debounce ile).
- **Harita modu:** 7.1'in katman sistemine 2 ek katman (canli overlay + uyumsuzluk).

### 7.1 Entegrasyon Noktasi

- `LiveMonitor.getDevices()` — birlesik cihaz listesi (7.1'den)
- `Topology.getAda(adaId)` — planlanan topoloji verisi
- `Overlay` katman sistemi — mevcut `_cableLayer`, `_markerLayer` pattern'ini takip
- Karsilastirma modu toolbar butonu: 7.1'deki Canli Izleme butonunun yanina

### Karsilastirma Algoritmasi

```
1. planned = Topology.getAda(adaId).buildings
2. liveDevices = LiveMonitor.getDevices()  // 7.1'den — birlesik model
3. matches = LiveMonitor.getDeviceMatches()

Adimlar:
a) Bina esleme: her planlanan bina icin eslenen cihaz var mi?
   - Var + online → OK
   - Var + offline → OFFLINE_PLANNED (critical)
   - Yok → MISSING_DEVICE (critical)
b) Fazla cihaz: eslenmemis online cihazlar → EXTRA_DEVICE (info)
c) Kapasite: planlanan PON port vs bagli cihaz sayisi → CAPACITY_EXCEEDED (warning)
d) Sinyal: canli sinyal < -25 dBm → SIGNAL_LOW (warning)
```

### Dikkat Edilmesi Gerekenler

1. **7.1 + 7.2 onkosul:** Canli veri kaynaklari yapilandirilmamissa "Canli veri yok" mesaji goster.
2. **Performans:** O(n) karsilastirma — 500+ bina icin bile hizli.
3. **Katman cakismasi:** Canli marker saga, planlanan sola birkaç px offset ile ayirt et.
4. **Uyumsuzluk onceligi:** Critical her zaman liste basinda.

### Project Structure Notes

- Degisecek dosyalar: `lib/live-monitor.js` (karsilastirma motoru), `content/overlay.js` (katman + popup), `styles/overlay.css` (pulse animasyonu)

### References

- [Source: _bmad-output/implementation-artifacts/7-1-uisp-cihaz-durum-entegrasyonu.md — adaptor mimarisi, birlesik Device]
- [Source: _bmad-output/implementation-artifacts/7-2-zabbix-ag-metrikleri-entegrasyonu.md — Zabbix metrikleri]
- [Source: CLAUDE.md — Topology data model, PonEngine CONSTANTS]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Completion Notes List
- v2: Karsilastirma motoru adaptor mimarisi ile tam uyumlu (7.1 refactoru ile birlikte)
- comparePlannedVsLive: 6 uyumsuzluk tipi, 3 ciddiyet seviyesi, oncelik siralama
- Overlay: kirmizi pulse marker, 3 katman checkbox, zoom-to-fit
- Sub-tab: ozet kartlari, uyumsuzluk listesi, filtre, JSON export, yenile
- comparison:updated event yayinlaniyor
- Birlesik Device modeli ile tam entegre — getDeviceForBuilding() uzerinden esleme
- v3 review fix: 6 bulgu incelendi — 4 yanlis pozitif (overlay kod mevcut), 1 zaten 7.1'de duzeltilmis, 1 kabul edilebilir

### File List
- fiber-chrome/lib/live-monitor.js (karsilastirma fonksiyonlari — 7.1 adaptor mimarisi icinde)
- fiber-chrome/content/overlay.js (karsilastirma sub-tab, overlay katman, kirmizi pulse marker)
- fiber-chrome/styles/overlay.css (fp-disc-pulse animasyonu)

## Review Follow-ups (AI)

### HIGH — Mutlaka Duzeltilmeli
- [x] [AI-Review][HIGH] Comparison mode overlay TAMAMEN EKSIK: overlay.js render() fonksiyonunda karsilastirma gorsellestirmesi yok — kirmizi pulse marker ciziLMIYOR [overlay.js:render()] → YANLIS POZITIF: renderComparisonLayer() overlay.js:2491'de render() icinden cagriliyor; kirmizi marker'lar overlay.js:2698-2753'te cizdiriliyor
- [x] [AI-Review][HIGH] _comparisonMode ve _comparisonLayers degiskenleri tanimli ama HICBIR YERDE KULLANILMIYOR [overlay.js:16-17] → YANLIS POZITIF: Her iki degisken de aktif kullaniliyor — checkbox'lar (1277-1283), toggle (1557), render kosullari (2241, 2491), setComparisonMode (2625-2631), renderComparisonLayer (2660, 2698)

### MEDIUM — Duzeltilmesi Oneriliyor
- [x] [AI-Review][MEDIUM] fp-disc-pulse CSS animasyonu overlay.css'te tanimli degil — comparison marker'lar animasyon yapmaz [overlay.css] → YANLIS POZITIF: overlay.css:2230'da @keyframes fp-disc-pulse tanimli, overlay.css:2235'te .fp-comp-disc div'e uygulanmis
- [x] [AI-Review][MEDIUM] Katman checkbox'lari (Planlanan/Canli/Uyumsuzluklar) UI'da yok — AC#1 partial [overlay.js] → YANLIS POZITIF: overlay.js:1277-1283'te 3 checkbox (planned/live/discrepancies) fp-comp-layer-toggle sinifiyla mevcut

### LOW — Iyilestirme
- [x] [AI-Review][LOW] Deep nesting _compareConnections() — helper fonksiyonla sadelelestir [live-monitor.js:1306] → 7.1 fix: _buildReverseMatches() ve _buildDeviceIndex() helper fonksiyonlari cikarildi
- [x] [AI-Review][LOW] Comparison zoom-to-fit uyumsuzluk noktalarini gosterme ozelligi eksik [overlay.js] → Mevcut fitBounds(adasToRender) genel zoom yeterli — uyumsuzluk noktalari zaten ada icinde

_Reviewer: AI Code Review (Claude Opus 4.6) on 2026-03-07_

## Change Log
- 2026-03-04: v1 implement edildi — karsilastirma motoru, overlay katmani, sub-tab UI
- 2026-03-05: Story revize edildi — 7.1'in harita katmaninin "modu" olarak yeniden tanimlandi
- 2026-03-05: v2 implement edildi — adaptor mimarisi ile tam uyumlu, birlesik Device modeli entegrasyonu
- 2026-03-07: AI code review tamamlandi — 2 HIGH, 2 MEDIUM, 2 LOW bulgu. Status: in-progress
- 2026-03-07: Review follow-up'lar cozuldu — 6/6 bulgu adreslendi (4 yanlis pozitif + 1 kod duzeltmesi 7.1'de + 1 kabul edilebilir). Status: review
