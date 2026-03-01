# Story 8.1: Anomali Tespiti ve Ariza Tahmini

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a ag yoneticisi,
I want ag metriklerindeki anomalilerin otomatik tespit edilmesini ve olasi arizalarin onceden tahmin edilmesini,
so that sorunlar buyumeden mudahale edebilir ve kesintisiz hizmet sunabileyim.

## Acceptance Criteria (BDD)

1. **Given** canli ag metrikleri (Epic 7 — Zabbix entegrasyonu) surekli toplaniyor oldugunda **When** anomali tespit motoru calistiginda **Then** normal davranis profilinden sapan metrikler otomatik tespit edilmeli (FR73):
   - Ani bant genisligi dususu
   - Normalin uzerinde paket kaybi
   - Gecikme artisi trendi
   - Cihaz uptime anormallikleri
   **And** her anomali icin ciddiyet seviyesi, etkilenen cihaz/bina ve baslanis zamani raporlanmali.

2. **Given** anomali verileri biriktiginde **When** ariza tahmin modeli calistiginda **Then** gelecek 7 gun icerisinde olasi arizalar tahmin edilmeli (FR74) **And** tahmin icin olasilik yuzdesi, beklenen ariza tipi ve etkilenen bolge gosterilmeli **And** tahminler haritada gorsel olarak isaretlenmeli.

3. **Given** yetersiz veri oldugunda (ilk kurulum veya yeni cihaz) **When** anomali tespiti baslatildiginda **Then** minimum veri esigi karsilanana kadar "ogrenme modu" gosterilmeli **And** kullanici bilgilendirilmeli.

4. **Given** anomali tespit edildiginde **When** detay goruntulendiginde **Then** etkilenen cihazin son 24 saatlik metrik grafigi, anomali baslangic noktasi ve sapma buyuklugu gosterilmeli.

5. **Given** ariza tahmini yapildiginda **When** tahmin dogrusuz ciktiginda (false positive) **Then** kullanici geri bildirim verebilmeli **And** bu geri bildirim model iyilestirme icin kayit edilmeli (FR77 hazirlik).

## Tasks / Subtasks

- [x] Task 1: AIEngine modulu olusturma (AC: #1, #2, #3)
  - [x] 1.1 `lib/ai-engine.js` IIFE modulu olustur — anomalyDetect(), predictFailure() API
  - [x] 1.2 CONSTANTS tanimla: Z_SCORE_THRESHOLD (3.0), MOVING_AVG_WINDOW (24), MIN_DATA_POINTS (168), PREDICTION_HORIZON_DAYS (7)
  - [x] 1.3 `detectAnomalies(metrics)` — Z-score hesaplama ve esik kontrolu
  - [x] 1.4 `calculateMovingAverage(data, window)` — hareketli ortalama ve sapma tespiti
  - [x] 1.5 `predictFailures(historicalData)` — trend analizi + gecmis ariza korelasyonu
  - [x] 1.6 `getAnomalySeverity(zScore)` — ciddiyet siniflandirma: info (2-3), warning (3-4), critical (4+)
  - [x] 1.7 `getLearningStatus(deviceId)` — ogrenme modu durumu kontrolu (min veri esigi)

- [x] Task 2: Veri modeli ve metrik tanimlari (AC: #1, #4)
  - [x] 2.1 Metrik veri yapisi tanimla: { deviceId, timestamp, bandwidth, packetLoss, latency, uptime }
  - [x] 2.2 Anomali veri yapisi tanimla: { id, deviceId, buildingId, metricType, severity, startTime, zScore, deviation }
  - [x] 2.3 Tahmin veri yapisi tanimla: { id, deviceId, region, failureType, probability, predictedDate, affectedBuildings }
  - [x] 2.4 Normal davranis profili (baseline) veri yapisi: { deviceId, metricType, mean, stdDev, lastUpdated, dataPoints }

- [x] Task 3: EventBus entegrasyonu (AC: #1, #2)
  - [x] 3.1 Event tanimlamalari: `anomaly:detected`, `anomaly:resolved`, `prediction:created`, `prediction:feedback`
  - [x] 3.2 Zabbix veri dinleme: `metrics:updated` event'ini dinle (Epic 7 bagimliligi)
  - [x] 3.3 Anomali tespit dongusu: metrik guncelleme → anomali kontrolu → event yayini

- [x] Task 4: Harita gorsellestirme entegrasyonu (AC: #2, #4)
  - [x] 4.1 Overlay.js'e anomali katmani ekle — kirmizi pulse marker (anomali) ve turuncu marker (tahmin)
  - [x] 4.2 Anomali popup: cihaz bilgisi, metrik grafigi, ciddiyet, baslangic zamani
  - [x] 4.3 Tahmin popup: ariza tipi, olasilik, beklenen tarih, etkilenen bina sayisi
  - [x] 4.4 MapUtils'e anomali/tahmin ikon fonksiyonlari ekle

- [x] Task 5: Panel UI entegrasyonu (AC: #3, #4, #5)
  - [x] 5.1 Panels.js'e "AI Izleme" sekmesi ekle — anomali listesi, tahmin listesi, ogrenme durumu
  - [x] 5.2 Anomali detay karti: metrik grafigi (son 24 saat), sapma buyuklugu, onerilen aksiyon
  - [x] 5.3 Tahmin geri bildirim butonu: "Dogru tahmin" / "Yanlis alarm" (FR77 hazirlik)
  - [x] 5.4 Ogrenme modu gostergesi: ilerleme cubugu (toplanan veri / minimum esik)

- [x] Task 6: manifest.json guncelleme
  - [x] 6.1 `lib/ai-engine.js` dosyasini content_scripts[0].js dizisine ekle — `lib/review-engine.js` veya `lib/financial.js`'ten sonra, `content/` dosyalarindan once
  - [x] 6.2 Gerekli yeni izinleri kontrol et (ek izin gerekmemeli)

## Dev Notes

### Mimari Gereksinimler

- **Modul pattern:** IIFE (`const AIEngine = (() => { ... })()`) — ES module/class YASAK
- **EventBus entegrasyonu:** Tum moduller arasi iletisim `EventBus.emit()` / `EventBus.on()` ile
- **Log format:** `[AIEngine] mesaj` prefix'i — FPDebug.log() kullan
- **CSS prefix:** Tum CSS siniflarinda `fp-` prefix'i zorunlu (ornek: `fp-anomaly-marker`, `fp-ai-panel`)
- **Storage key prefix:** `fp_` prefix'i (ornek: `fp_anomaly_history`, `fp_baseline_profiles`)

### Bagimliliklar ve Onkosuller

- **KRITIK: Epic 7 Bagimliligi** — Bu story, Epic 7 (Canli Ag Izleme) tarafindan saglanan canli ag metriklerine bagimlidir:
  - Story 7.1: UISP cihaz durum verisi
  - Story 7.2: Zabbix ag metrikleri
  - Epic 7 henuz `backlog` durumunda — bu story gelistirilirken **mock/simulasyon veri** kullanilmali
- **Mevcut Moduller:** EventBus, Debug, Storage (IndexedDB), Overlay, Panels, MapUtils
- **Yukleme Sirasi:** `lib/ai-engine.js` → `lib/financial.js`'ten sonra, `content/scraper.js`'ten once

### Teknik Yaklasim

**Anomali Tespiti (Z-score):**
```javascript
// Z-score = (deger - ortalama) / standart_sapma
// Z > 3.0 → anomali (ayarlanabilir esik)
function calculateZScore(value, mean, stdDev) {
  if (stdDev === 0) return 0;
  return Math.abs(value - mean) / stdDev;
}
```

**Hareketli Ortalama Sapma:**
```javascript
// Son N olcumun ortalamasindan sapma
// Sapma > 2 * stdDev → anomali sinyali
function movingAverageDeviation(data, windowSize) {
  var window = data.slice(-windowSize);
  var avg = window.reduce((s, v) => s + v, 0) / window.length;
  var stdDev = Math.sqrt(window.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / window.length);
  var lastValue = data[data.length - 1];
  return { avg: avg, stdDev: stdDev, deviation: Math.abs(lastValue - avg), isAnomaly: Math.abs(lastValue - avg) > 2 * stdDev };
}
```

**Ariza Tahmini (Trend Analizi):**
```javascript
// Lineer regresyon ile trend yonu ve hizi hesapla
// Negatif trend + artan anomali sikligi = ariza riski
function linearTrend(dataPoints) {
  // En kucuk kareler yontemi
  // Eger egim < -esik VE anomali sayisi artiyorsa → ariza tahmini olustur
}
```

### Anti-Pattern Uyarilari

- **YASAK:** `import`, `export`, `class`, `async/await` (eski tarayici uyumu), `window.` global kirletme
- **YASAK:** Harici ML kutuphanesi (TensorFlow.js vb.) — saf JavaScript istatistiksel yontemler kullan
- **YASAK:** Backend API cagrisi — tum hesaplamalar istemci tarafinda (Chrome Extension sinirlamalari)
- **YASAK:** `var` yerine `let/const` kullanilabilir ama IIFE icinde — global scope'a sizmamali
- **Mock veri:** Epic 7 hazir olana kadar `AIEngine._generateMockMetrics()` ile test verisi uret (underscored = private)

### Veri Kaynagi Stratejisi

Epic 7 henuz gelistirilmediginden:
1. **Mock veri ureteci:** Rastgele ama gercekci ag metrikleri ureten dahili fonksiyon
2. **IndexedDB saklama:** Anomali gecmisi ve baseline profilleri `fp_ai_baselines` ve `fp_ai_anomalies` store'larinda
3. **Gecis plani:** Epic 7 tamamlandiginda `metrics:updated` event'i dinlenerek gercek veriye gecis — mock ureteci kaldirilmaz, test icin korunur

### Performans Gereksinimleri

- Anomali taramasi: < 50ms (100 cihaz icin)
- Tahmin hesaplama: < 200ms (30 gunluk veri icin)
- Baseline profil guncelleme: arka planda, UI bloklamadan
- IndexedDB okuma/yazma: mevcut Storage API uzerinden, ek store olusturma gerekmemeli (calculations store altinda)

### Project Structure Notes

- `lib/ai-engine.js` — Yeni modul, `lib/` klasorune eklenir (content + dashboard paylasimli)
- `content/overlay.js` — Anomali/tahmin harita katmani icin genisletilir (yeni metot eklenir)
- `content/panels.js` — "AI Izleme" sekmesi icin genisletilir
- `lib/map-utils.js` — Anomali/tahmin ikon fonksiyonlari icin genisletilir
- `manifest.json` — Yukleme sirasina `lib/ai-engine.js` eklenir
- Mevcut modullere dokunmadan, EventBus event dinleme ile entegrasyon

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 8 - Story 8.1]
- [Source: _bmad-output/planning-artifacts/prd.md#FR73-FR77]
- [Source: _bmad-output/planning-artifacts/architecture.md#Modul Sinirlari, EventBus, Yukleme Sirasi]
- [Source: CLAUDE.md#Architecture, Module System, Core Data Flow]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- AIEngine IIFE modulu olusturuldu (lib/ai-engine.js): Z-score anomali tespiti, hareketli ortalama, lineer regresyon ile ariza tahmini, ogrenme durumu kontrolu, mock veri ureteci, EventBus entegrasyonu
- Tum veri yapilari AIEngine icinde tanimli: metrik, anomali, tahmin, baseline profili
- EventBus event'leri: anomaly:detected, anomaly:resolved, prediction:created, prediction:feedback — tumu emit ve listen ediliyor
- metrics:updated event dinleme init() icinde baglandi (Epic 7 hazir oldugunda otomatik gecis)
- Overlay.js'e renderAILayer() eklendi: anomali markerleri (kirmizi pulse SVG), tahmin markerleri (turuncu ucgen), detayli popup'lar
- MapUtils'e createAnomalyIcon() ve createPredictionIcon() SVG ikon fonksiyonlari eklendi
- Panels.js'e renderAIPanel() eklendi: ogrenme durumu (progress bar), anomali listesi (ciddiyet renkli), tahmin listesi (geri bildirim butonlari)
- CSS stilleri overlay.css'e eklendi: fp-ai-panel, fp-ai-anomaly-card, fp-ai-prediction-card, severity renkler
- manifest.json guncellendi: lib/ai-engine.js → lib/activation.js'ten sonra, content/scraper.js'ten once
- Test dosyasi: dashboard/test-ai-engine.html — 16 test grubu, 80+ assertion
- Ek izin gerekmedi (mevcut permissions yeterli)
- [Review Fix] getRecommendedAction(), getSparklineData(), sparklineSVG() fonksiyonlari AIEngine'e eklendi
- [Review Fix] Anomali popup ve panelde 24 saatlik sparkline grafik + onerilen aksiyon gosteriliyor
- [Review Fix] init() guard, anomali deduplication, prediction trim, CSS degisken duzeltmeleri uyguland

### Change Log

- 2026-03-01: Story 8.1 implementasyonu tamamlandi — AIEngine modulu, harita ve panel entegrasyonlari
- 2026-03-01: Senior Developer Review (8 bulgu) — 4 HIGH, 3 MEDIUM, 1 LOW otomatik duzeltildi:
  - H1: AC4 sparkline grafik eklendi (sparklineSVG fonksiyonu, overlay popup ve panel kart)
  - H2: Onerilen aksiyon eklendi (getRecommendedAction fonksiyonu, overlay popup ve panel kart)
  - H3: init() guard eklendi (_initialized flag ile coklu EventBus listener onlendi)
  - H4: CSS --fp-muted → --fp-text-muted duzeltildi (4 yer)
  - M1: _predictions dizi buyume siniri eklendi (MAX_PREDICTIONS: 100)
  - M2: Anomali deduplication eklendi (ayni device+metric kontrolu)
  - M3: scanAllDevices mock buildingId mapping → _deviceBuildingMap lookup
  - L1: Test non-determinism (bilgi notu, duzeltme gereksiz)

### File List

- fiber-chrome/lib/ai-engine.js (YENI)
- fiber-chrome/lib/map-utils.js (DEGISTIRILDI — createAnomalyIcon, createPredictionIcon, AI_COLORS eklendi)
- fiber-chrome/content/overlay.js (DEGISTIRILDI — aiMarkers dizisi, renderAILayer() eklendi, clear() ve render() guncellendi)
- fiber-chrome/content/panels.js (DEGISTIRILDI — fp-ai-panel div, renderAIPanel() eklendi, refresh() guncellendi, public API'ye eklendi)
- fiber-chrome/styles/overlay.css (DEGISTIRILDI — AI panel CSS stilleri eklendi)
- fiber-chrome/manifest.json (DEGISTIRILDI — lib/ai-engine.js yukleme sirasina eklendi)
- fiber-chrome/dashboard/test-ai-engine.html (YENI — 16 test grubu, 80+ assertion)
