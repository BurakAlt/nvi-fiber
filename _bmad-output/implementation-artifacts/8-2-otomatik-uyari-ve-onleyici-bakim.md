# Story 8.2: Otomatik Uyari ve Onleyici Bakim

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a ag yoneticisi,
I want tespit edilen anomaliler ve ariza tahminleri icin otomatik uyari almak ve onleyici bakim onerileri gorebilmek,
so that proaktif olarak mudahale edebilir ve ariza suresini minimize edebilirim.

## Acceptance Criteria (BDD)

1. **Given** bir anomali veya ariza tahmini tespit edildiginde **When** uyari sistemi tetiklendiginde **Then** otomatik uyari olusturulmali (FR75):
   - Uyari seviyesi (bilgi/uyari/kritik)
   - Etkilenen cihaz ve konum
   - Onerilen aksiyon
   **And** uyarilar panel icerisinde bildirim olarak gosterilmeli
   **And** kritik uyarilar gorsel olarak one cikarilmali (kirmizi badge + ses/titresim opsiyonel)

2. **Given** bir ariza tahmini veya tekrarlayan anomali tespit edildiginde **When** onleyici bakim motoru calistiginda **Then** sisteme ozel bakim onerileri olusturulmali (FR76):
   - Etkilenen ekipman ve konum
   - Onerilen bakim aksiyonu (kablo kontrolu, cihaz yenileme, splitter degisimi vb.)
   - Tahmini bakim maliyeti
   - Aciliyet seviyesi
   **And** oneriler oncelik sirasina gore listelenmeli

3. **Given** AI modeli uretimde calisiyorken **When** gercek ariza verileri toplandikca **Then** model tahmin dogrulugu surekli olculecek (FR77):
   **And** yanlis pozitif/negatif oranlari izlenmeli
   **And** model periyodik olarak gercek verilerle yeniden egitilmeli
   **And** model performans metrikleri goruntulenmeli

4. **Given** birden fazla uyari biriktiginde **When** kullanici uyari panelini goruntulediginde **Then** uyarilar aciliyet ve kronolojik siraya gore listelenecek **And** okunmus/okunmamis durumu ayirt edilebilecek **And** toplam okunmamis sayisi badge olarak gosterilecek.

5. **Given** bir bakim onerisi gerceklestirildiginde **When** kullanici "Tamamlandi" isaretlediginde **Then** oneri durumu guncellenmeli **And** model dogruluk hesabina geri bildirim olarak eklenmeli.

## Tasks / Subtasks

- [x] Task 1: AlertManager fonksiyonlari (AC: #1, #4)
  - [x] 1.1 `AIEngine` icerisine `_alerts[]` state ve alert CRUD fonksiyonlari ekle (createAlert, dismissAlert, markAlertAsRead, getAlerts)
  - [x] 1.2 Alert veri yapisi: `{ id, type (anomaly|prediction|maintenance), severity, deviceId, buildingId, title, message, action, createdAt, readAt, dismissedAt }`
  - [x] 1.3 EventBus entegrasyonu: `anomaly:detected` -> otomatik alert olustur, `prediction:created` -> otomatik alert olustur
  - [x] 1.4 Alert kuyruk yonetimi: maksimum 200 alert, eski okunmuslar otomatik temizlensin
  - [x] 1.5 Okunmamis alert sayaci: `getUnreadAlertCount()` fonksiyonu

- [x] Task 2: Onleyici bakim motoru (AC: #2, #5)
  - [x] 2.1 `AIEngine.suggestMaintenance(anomalyOrPrediction)` fonksiyonu -- kural tabanli bakim onerisi ureteci
  - [x] 2.2 Bakim onerisi veri yapisi: `{ id, alertId, deviceId, buildingId, equipmentType, action, estimatedCost, urgency (low|medium|high|critical), status (pending|completed|dismissed), createdAt, completedAt }`
  - [x] 2.3 Kural tabani: metricType + severity -> aksiyon eslestirmesi (MAINTENANCE_RULES objesi)
  - [x] 2.4 Maliyet tahmini: CATALOG fiyatlarindan ekipman bazli tahmini maliyet (orn: splitter degisimi -> CATALOG.splitter_1_8 fiyati)
  - [x] 2.5 `completeMaintenance(maintenanceId)` -- tamamlanma islemi ve model geri bildirimi
  - [x] 2.6 `getMaintenanceSuggestions(filter)` -- filtreleme (status, urgency, deviceId)

- [x] Task 3: Model performans izleme (AC: #3)
  - [x] 3.1 `AIEngine.getModelPerformance()` -- dogruluk metrikleri hesaplama
  - [x] 3.2 Metrikler: true positive, false positive, true negative, false negative, precision, recall, f1-score
  - [x] 3.3 `_feedbacks[]` verisinden otomatik hesaplama -- mevcut submitFeedback() ile entegre
  - [x] 3.4 Periyodik baseline guncelleme: `retrainBaselines()` -- mevcut baselines'i gercek verilerle yeniden hesapla
  - [x] 3.5 Model performans gecmisi: son 30 gunluk precision/recall trendi

- [x] Task 4: Uyari paneli UI (AC: #1, #4)
  - [x] 4.1 Panels.js'teki mevcut AI paneline "UYARILAR" sekmesi ekle -- alert listesi, okunmamis badge
  - [x] 4.2 Alert karti: seviye ikonu, baslik, mesaj, onerilen aksiyon, zaman damgasi, "Okundu" / "Kapat" butonlari
  - [x] 4.3 Kritik alert vurgusu: kirmizi arka plan + pulse animasyon
  - [x] 4.4 Badge: toolbar'daki AI butonunda okunmamis alert sayisi gosterimi (kirmizi yuvarlak)
  - [x] 4.5 Alert filtreleme: tur (anomali/tahmin/bakim), seviye (bilgi/uyari/kritik), durum (okunmamis/tumu)

- [x] Task 5: Bakim onerileri paneli UI (AC: #2, #5)
  - [x] 5.1 AI paneline "BAKIM ONERILERI" sekmesi ekle -- oncelik sirasina gore liste
  - [x] 5.2 Bakim karti: ekipman, aksiyon, tahmini maliyet, aciliyet badge, "Tamamlandi" butonu
  - [x] 5.3 Aciliyet renk kodlama: critical -> kirmizi, high -> turuncu, medium -> sari, low -> yesil
  - [x] 5.4 Toplam tahmini maliyet ozeti (tum bekleyen oneriler)

- [x] Task 6: Model performans paneli UI (AC: #3)
  - [x] 6.1 AI paneline "MODEL PERFORMANS" sekmesi ekle
  - [x] 6.2 Metrik kartlari: precision, recall, F1-score, toplam tahmin sayisi, geri bildirim orani
  - [x] 6.3 "Modeli Yeniden Egit" butonu -- retrainBaselines() tetikleme
  - [x] 6.4 Son geri bildirim listesi (dogru/yanlis)

- [x] Task 7: Harita entegrasyonu guncellemeleri (AC: #1)
  - [x] 7.1 Overlay.js -- kritik alert olan binalarda kirmizi pulse efekti (mevcut anomali marker'i uzerinde)
  - [x] 7.2 Bakim onerisi olan binalarda turuncu wrench ikonu ekleme

- [x] Task 8: CSS stilleri (AC: #1, #2, #3, #4)
  - [x] 8.1 overlay.css'e uyari, bakim, model performans kartlari icin stiller
  - [x] 8.2 Badge ve pulse animasyonlari
  - [x] 8.3 Aciliyet renk kodlama siniflar (fp-urgency-critical, fp-urgency-high vb.)
  - [x] 8.4 Responsif panel sekme navigasyonu

## Dev Notes

### Mimari Gereksinimler

- **Modul pattern:** IIFE (`const AIEngine = (() => { ... })()`) -- **MEVCUT** AIEngine genisletilecek, yeni modul olusturulmayacak
- **EventBus entegrasyonu:** `anomaly:detected` ve `prediction:created` event'leri mevcut -- bunlari dinleyerek alert olusturulmali
- **Yeni event'ler:** `alert:created`, `alert:read`, `maintenance:created`, `maintenance:completed`
- **Log format:** `[AIEngine] mesaj` prefix'i -- FPDebug.log() kullan
- **CSS prefix:** Tum CSS siniflarinda `fp-` prefix'i zorunlu (ornek: `fp-alert-card`, `fp-maintenance-card`)

### Bagimliliklar ve Onkosuller

- **KRITIK: Story 8.1 TAMAMLANMIS** -- AIEngine modulu (616 satir), anomali tespiti, ariza tahmini, sparkline, mock data, panels.js AI paneli, overlay.js anomali katmani MEVCUT
- **Mevcut API'ler Korunacak:** detectAnomalies(), predictFailures(), getRecommendedAction(), submitFeedback() -- geri uyumlu genisletme
- **Mevcut Moduller:** EventBus, FPDebug, AIEngine, Overlay (anomali katmani), Panels (AI paneli)
- **Epic 7 Bagimliligi:** Hala mock veri ile calisiliyor -- _generateMockMetrics() korunacak

### Teknik Yaklasim

**Alert Sistemi (AIEngine icine ekleme):**
```javascript
// Mevcut detectAnomalies() icinde EventBus.emit('anomaly:detected') sonrasi
// otomatik alert olusturma tetiklenecek
var _alerts = [];
var _alertIdCounter = 0;

function createAlert(type, severity, deviceId, buildingId, title, message, action) {
  var alert = {
    id: 'alert_' + (++_alertIdCounter) + '_' + Date.now(),
    type: type,         // 'anomaly' | 'prediction' | 'maintenance'
    severity: severity, // 'info' | 'warning' | 'critical'
    deviceId: deviceId,
    buildingId: buildingId,
    title: title,
    message: message,
    action: action,
    createdAt: new Date().toISOString(),
    readAt: null,
    dismissedAt: null
  };
  _alerts.push(alert);
  _trimAlerts();
  if (typeof EventBus !== 'undefined') EventBus.emit('alert:created', alert);
  return alert;
}
```

**Bakim Onerisi Motoru (Kural Tabani):**
```javascript
var MAINTENANCE_RULES = {
  fiber_degradation:      { action: 'Fiber kablo ve konnektorleri kontrol et', equipmentType: 'fiber_cable', urgencyBase: 'high' },
  connection_instability: { action: 'Splice ve konnektor baglantilari yeniden yap', equipmentType: 'splice_connector', urgencyBase: 'medium' },
  network_congestion:     { action: 'Splitter kademesini yeniden degerlendir', equipmentType: 'splitter', urgencyBase: 'medium' },
  device_failure:         { action: 'ONT/OLT cihazini degistir', equipmentType: 'ont_device', urgencyBase: 'critical' },
  general_degradation:    { action: 'Genel ag saglik kontrolu yap', equipmentType: 'general', urgencyBase: 'low' }
};

function suggestMaintenance(anomalyOrPrediction) {
  var failureType = anomalyOrPrediction.failureType || _inferFailureType(anomalyOrPrediction);
  var rule = MAINTENANCE_RULES[failureType] || MAINTENANCE_RULES.general_degradation;
  // ... maliyet tahmini CATALOG'dan cekilecek
}
```

**Model Performans Hesaplama:**
```javascript
function getModelPerformance() {
  var fb = _feedbacks;
  var tp = 0, fp = 0, total = fb.length;
  for (var i = 0; i < fb.length; i++) {
    if (fb[i].isCorrect) tp++; else fp++;
  }
  var precision = total > 0 ? _round(tp / total * 100) : 0;
  return { truePositive: tp, falsePositive: fp, total: total, precision: precision };
}
```

### Anti-Pattern Uyarilari

- **YASAK:** Yeni IIFE modulu olusturma -- tum yeni fonksiyonlar mevcut `AIEngine` icine eklenmeli
- **YASAK:** `import`, `export`, `class`, `async/await`, `window.` global kirletme
- **YASAK:** Harici kutuphane (notification API, ses kutuphanesi vb.) -- saf JS + CSS animasyonlari
- **YASAK:** chrome.notifications API kullanimi -- NVI portal icinde calisan content script'te bu API mevcut degil
- **YASAK:** `var` yerine `let/const` kullanilabilir ama IIFE icinde -- global scope'a sizmamali
- **DIKKAT:** Mevcut panels.js AI paneli `renderAIPanel()` fonksiyonunu degistirirken, anomali ve tahmin kartlarini korumali -- sekme sistemi ile genisletmeli
- **DIKKAT:** Mevcut overlay.js anomali marker'larini korumali -- sadece pulse efekti eklemeli
- **DIKKAT:** Smart Bubbles UI mimarisi aktif -- toolbar auto-hide, Overlay.showToast(), z-index katmanlari (toolbar=1200, modal=1300) ile uyumlu calisilmali

### Mevcut AIEngine API (8.1'den -- KORUNACAK)

| Fonksiyon | Aciklama |
|-----------|----------|
| `init()` | Baslat, EventBus dinleme |
| `detectAnomalies(deviceMetrics)` | Z-score + MA anomali tespiti |
| `predictFailures(historicalData)` | Trend analizi ariza tahmini |
| `calculateMovingAverage(data, window)` | Hareketli ortalama |
| `getAnomalySeverity(zScore)` | Ciddiyet siniflandirma |
| `getLearningStatus(deviceId)` | Ogrenme modu durumu |
| `addMetrics(deviceId, data)` | Metrik ekleme |
| `getMetrics(deviceId, lastN)` | Metrik okuma |
| `submitFeedback(predictionId, isCorrect)` | Geri bildirim |
| `resolveAnomaly(anomalyId)` | Anomali cozme |
| `scanAllDevices()` | Toplu anomali taramasi |
| `getActiveAnomalies()` | Aktif anomaliler |
| `getActivePredictions()` | Aktif tahminler |
| `getRecommendedAction(anomaly)` | Onerilen aksiyon (basit) |
| `sparklineSVG(deviceId, metricType, w, h)` | SVG grafik |
| `_generateMockMetrics(count, hours)` | Mock veri ureteci |

### 8.2'de EKLENECEK Yeni API Fonksiyonlari

| Fonksiyon | Aciklama |
|-----------|----------|
| `createAlert(type, severity, ...)` | Uyari olusturma |
| `dismissAlert(alertId)` | Uyari kapatma |
| `markAlertAsRead(alertId)` | Okundu isaretleme |
| `getAlerts(filter)` | Uyari listesi (filtreleme) |
| `getUnreadAlertCount()` | Okunmamis sayac |
| `suggestMaintenance(anomalyOrPrediction)` | Bakim onerisi uretme |
| `completeMaintenance(maintenanceId)` | Bakim tamamlama |
| `getMaintenanceSuggestions(filter)` | Bakim listesi |
| `getModelPerformance()` | Dogruluk metrikleri |
| `retrainBaselines()` | Baseline yeniden hesaplama |

### Panels.js Mevcut AI Panel Yapisi (Genisletilecek)

Mevcut `renderAIPanel()` fonksiyonu:
- `#fp-ai-panel` container'i mevcut
- Anomali kartlari ve tahmin kartlari render ediliyor
- **Genisletme plani:** Sekme sistemi ekle: "UYARILAR" | "BAKIM" | "MODEL" | "ANOMALILER" | "TAHMINLER"
- Mevcut anomali/tahmin kartlari "ANOMALILER" ve "TAHMINLER" sekmelerine tasinacak

### Veri Kaynagi Stratejisi

Epic 7 henuz gelistirilmediginden (8.1 ile ayni yaklasim):
1. **Mock veri:** `_generateMockMetrics()` mevcut -- alerts ve maintenance icin mock tetikleme ekle
2. **Test:** `test-ai-engine.html` dosyasi mevcut -- alert ve maintenance testleri eklenecek
3. **Gecis plani:** Epic 7 hazir olunca gercek event'ler otomatik calisacak (EventBus pattern)

### Performans Gereksinimleri

- Alert olusturma: < 5ms (senkron islem)
- Bakim onerisi uretme: < 10ms (kural tabani lookup)
- Model performans hesabi: < 20ms (feedbacks dizisi boyutu < 1000)
- Panel render: < 50ms (mevcut benchmark ile tutarli)
- Badge guncelleme: EventBus ile anlik

### Project Structure Notes

- `lib/ai-engine.js` -- Mevcut modul genisletilecek (~200-250 satir ek kod)
- `content/panels.js` -- renderAIPanel() yeniden yapilandirilacak (sekme sistemi)
- `content/overlay.js` -- Mevcut anomali katmanina pulse efekti ve bakim ikonu eklenecek
- `styles/overlay.css` -- Alert, bakim, model performans stilleri eklenecek
- `dashboard/test-ai-engine.html` -- Yeni testler eklenecek
- `manifest.json` -- Degisiklik GEREKMEZ (ai-engine.js zaten yuklu)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 8 - Story 8.2 (line 1742-1781)]
- [Source: _bmad-output/planning-artifacts/prd.md#FR75-FR77 (line 439-445)]
- [Source: _bmad-output/planning-artifacts/architecture.md#Modul Sinirlari, EventBus, Hata Yonetimi]
- [Source: _bmad-output/implementation-artifacts/8-1-anomali-tespiti-ve-ariza-tahmini.md]
- [Source: fiber-chrome/lib/ai-engine.js -- 616 satir mevcut AIEngine modulu]
- [Source: fiber-chrome/content/panels.js -- renderAIPanel() line 131-210]
- [Source: fiber-chrome/content/overlay.js -- AI anomaly layer line 1320-1400]
- [Source: CLAUDE.md#Architecture, Module System, Core Data Flow]

## Change Log

- 2026-03-04: Story 8.2 implementasyonu tamamlandi — Alert sistemi, bakim motoru, model performans, panel UI, harita entegrasyonu, CSS (Claude Opus 4.6)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Node.js integration test ile tum alert CRUD, maintenance CRUD, model performans fonksiyonlari dogrulandi
- Syntax check: ai-engine.js, map-utils.js, panels.js, overlay.js — tumu gecti

### Completion Notes List

- Task 1-3: AIEngine modulu ~250 satir yeni kod ile genisletildi (alert, maintenance, model performance)
- MAINTENANCE_RULES kural tabani 5 failure type ile tanimli
- EQUIPMENT_COST_MAP ile PonEngine.CATALOG'a fallback'li maliyet tahmini
- EventBus entegrasyonu: anomaly:detected ve prediction:created event'lerinden otomatik alert + bakim onerisi
- Yeni event'ler: alert:created, alert:read, maintenance:created, maintenance:completed
- Task 4-6: renderAIPanel() sekmeli yapiya donusturuldu (UYARILAR / BAKIM / MODEL / ANOMALILER / TAHMINLER)
- Mevcut anomali/tahmin kartlari korunarak ayri sekmelere tasinildi
- Task 7: overlay.js'e maintenance marker (wrench ikonu) eklendi, MapUtils'e createMaintenanceIcon() eklendi
- Task 8: overlay.css'e ~150 satir yeni stil: sekmeler, alert kartlari, bakim kartlari, model grid, urgency renkleri, pulse animasyonu
- test-ai-engine.html'e 11 yeni test bolumu (Test 17-27) eklendi: alert CRUD, filtreleme, kuyruk limiti, bakim, model performans, EventBus entegrasyonu

### File List

- `fiber-chrome/lib/ai-engine.js` — genisletme: alert, maintenance, model performance fonksiyonlari
- `fiber-chrome/lib/map-utils.js` — createMaintenanceIcon() eklendi
- `fiber-chrome/content/panels.js` — renderAIPanel() sekmeli yapiya donusturuldu
- `fiber-chrome/content/overlay.js` — renderAILayer() maintenance marker eklendi
- `fiber-chrome/styles/overlay.css` — yeni stiller: sekmeler, alert, maintenance, model kartlari
- `fiber-chrome/dashboard/test-ai-engine.html` — 11 yeni test bolumu (Test 17-27)
