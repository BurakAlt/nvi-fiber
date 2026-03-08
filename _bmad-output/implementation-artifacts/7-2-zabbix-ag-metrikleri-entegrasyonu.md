# Story 7.2: Zabbix Metrik Grafikleri ve Detay Gorunumu

Status: done

## Vizyon Notu

> Bu story, Story 7.1'in "Canli Izleme Harita Katmani" vizyonunun bir UZANTISIDIR.
> 7.1'deki adaptor mimarisi Zabbix'ten temel cihaz durumu ve metrik ozeti ceker.
> Bu story (7.2), o verilerin DERINLEMESINE gorsellestirilmesini saglar:
> zaman serisi grafikleri, detayli metrik panelleri ve performans gecmisi.
>
> Odak: kullanicinin harita popup'indan tek tikla eristigi **guzel, anlasilir grafik deneyimi**.

## Story

As a saha muhendisi,
I want herhangi bir cihazin performans grafiklerini gorebilmek — bant genisligi, gecikme, paket kaybi zaman serisi grafikleriyle,
So that ag sorunlarini gorsel olarak tespit edebileyim, trendleri izleyebileyim ve haritadaki canli izleme katmaninin derinliklerine inebilmeyim.

## Acceptance Criteria (BDD)

1. **Given** haritada bir cihaz marker'ina tiklandiginda **When** popup'taki "Grafikler" butonuna basildiginda **Then** detayli performans modal'i acilmali:
   - Bant Genisligi grafigi (Mbps) — mavi cizgi, zaman serisi
   - Gecikme grafigi (ms) — turuncu cizgi, zaman serisi
   - Paket Kaybi grafigi (%) — kirmizi alan grafik
   **And** her grafik icin zaman araligi secilmeli (son 1 saat / 24 saat / 7 gun / 30 gun)
   **And** grafik hover ile tarih/saat + deger tooltip gosterilmeli.

2. **Given** Zabbix API baglantisi yapilandirildiginda **When** metrik cekme basltiginda **Then** cihaz bazinda metrik gecmisi toplanmali:
   - bandwidth (bytes/sec → Mbps cevrimi)
   - latency / ping RTT (seconds → ms cevrimi)
   - packetLoss / icmppingloss (%)
   - uptime (saniye)
   **And** metrikler in-memory cache'te saklanmali (per-device 1000 kayit limiti, FIFO)
   **And** her basarili fetch sonrasi `metrics:updated` EventBus event'i yayinlanmali (AIEngine 8.1 koprüsü).

3. **Given** Zabbix API erisim hatasi oldugunda **When** hata tespit edildiginde **Then** son basarili metrik verileri gosterilmeye devam etmeli **And** hata Toast bildirimi yapilmali **And** otomatik yeniden deneme baslatilmali (exponential backoff).

4. **Given** Zabbix host listesi cekildiginde **When** esleme yapildiginda **Then** Zabbix host'lari UISP cihazlariyla eslenebilmeli:
   - Otomatik esleme: hostname veya IP benzerligi
   - Manuel esleme: kullanici dropdown ile override
   **And** esleme sonucu Story 7.1'deki birlesik Device modeline aktarilmali (source: 'both').

## Tasks / Subtasks

- [x] Task 1: Zabbix Adaptor — LiveMonitor entegrasyonu (AC: #2, #4)
  - [x] 1.1 `lib/live-monitor.js` icerisine ZabbixAdapter islevleri ekle (veya genislet)
  - [x] 1.2 `configureZabbix(config)` — Zabbix API URL + kimlik bilgileri kaydet (`fp_zabbix_config`)
  - [x] 1.3 `zabbixAuth()` — JSON-RPC `user.login` → authToken al ve sakla
  - [x] 1.4 `testZabbixConnection()` — auth + basit host listesi sorgusu ile baglanti testi
  - [x] 1.5 `fetchHosts()` — Zabbix `host.get` ile host listesi (UISP cihazlariyla esleme icin)
  - [x] 1.6 `fetchMetrics(hostIds, timeRange)` — Zabbix `history.get` ile bandwidth, latency, packetLoss, uptime cek
  - [x] 1.7 `matchZabbixHostsToDevices(hosts, devices)` — hostname/IP ile otomatik esleme → birlesik Device
  - [x] 1.8 `startZabbixPolling()` / `stopZabbixPolling()` — ayri polling dongusu

- [x] Task 2: Metrik Veri Modeli ve Cache (AC: #2)
  - [x] 2.1 In-memory metrik cache: Map<deviceId, MetricEntry[]> — per-device 1000 kayit limiti (FIFO)
  - [x] 2.2 MetricEntry: `{ timestamp, metric (bandwidth|latency|packetLoss|uptime), value, unit }`
  - [x] 2.3 `getMetrics(deviceId, metricType, timeRange?)` — bellekteki metrik verisi sorgulama
  - [x] 2.4 `getMetricSummary(deviceId)` — son deger + 24h ortalama + trend (yukselis/dusus/sabit)
  - [x] 2.5 Metrik birim cevrimi: Zabbix raw → okunur format (bytes/sec → Mbps, seconds → ms)

- [x] Task 3: EventBus — AIEngine Koprusu (AC: #2)
  - [x] 3.1 `metrics:updated` event yayinlama: `{ deviceId, metrics: { bandwidth, packetLoss, latency, uptime }, timestamp }`
  - [x] 3.2 Bu event Story 8.1'deki AIEngine'in dinledigi event — anomali tespitini tetikler
  - [x] 3.3 Ek eventler: `zabbix:connected`, `zabbix:disconnected`, `zabbix:error`

- [x] Task 4: Performans Grafikleri — Canvas Zaman Serisi (AC: #1)
  - [x] 4.1 `createTimeSeriesChart(container, data, options)` — Canvas bazli zaman serisi cizici
  - [x] 4.2 Grafik tipleri: line chart (bandwidth, latency), area chart (packetLoss)
  - [x] 4.3 X ekseni: zaman (auto-format: saat:dakika veya gun.ay)
  - [x] 4.4 Y ekseni: metrik degeri (auto-scale, min/max)
  - [x] 4.5 Hover: crosshair + tooltip (tarih/saat + deger)
  - [x] 4.6 Responsive boyutlandirma (panel genisligine uyum)
  - [x] 4.7 Renk kodlari: bandwidth=#3B82F6 (mavi), packetLoss=#EF4444 (kirmizi), latency=#F97316 (turuncu)
  - [x] 4.8 No animation — performans icin statik render, sadece hover interaksiyon

- [x] Task 5: Grafik Modal UI (AC: #1, #3)
  - [x] 5.1 Cihaz popup'taki "Grafikler" butonuna tiklaninca acilan modal (Overlay.createModal pattern)
  - [x] 5.2 Modal header: cihaz adi + durum badge + zaman araligi secici (1h / 24h / 7d / 30d butonlari)
  - [x] 5.3 Modal body: 3 grafik ust uste (bandwidth, latency, packetLoss) — her biri kendi canvas'inda
  - [x] 5.4 Veri yoksa: "Bu cihaz icin Zabbix metrigi bulunamadi" mesaji
  - [x] 5.5 "Yenile" butonu: grafikleri guncel veriyle yeniden ciz
  - [x] 5.6 Grafik modal mobile-friendly: dar ekranda tek sutun, scroll

- [x] Task 6: Canli Izleme Sekmesine Zabbix Paneli (AC: #1, #3, #4)
  - [x] 6.1 Story 7.1'deki Canli Izleme sekmesine "Zabbix" sub-tab'i ekle (UISP yanina)
  - [x] 6.2 Zabbix yapilandirma formu: API URL, kullanici adi, sifre, test butonu
  - [x] 6.3 Metrik ozet listesi: cihaz adi, son bandwidth, packetLoss, latency, trend ikonu (↑↓→)
  - [x] 6.4 Cihaz secildiginde: 3 grafik (bandwidth, packetLoss, latency) + zaman araligi secici
  - [x] 6.5 Baglanti durumu gostergesi (header'da yesil/kirmizi nokta)

## Dev Notes

### Mimari Kararlar

- **LiveMonitor'un parcasi:** Zabbix islevleri `lib/live-monitor.js` icerisinde. Ayri modul DEGIL. Zabbix, LiveMonitor'un bir adaptorudur.
- **Canvas grafik:** Harici grafik kutuphanesi EKLEME. Basit canvas time-series cizici yeterli. Chart.js gibi kutuphaneler bundle boyutunu gereksiz buyutur.
- **In-memory cache:** Metrik verileri IndexedDB'ye yazma — bellekte tut, sayfa yenilenince sifirlansin. 1000 kayit/cihaz limiti memory leak onler.
- **AIEngine koprusu:** `metrics:updated` event'i Story 8.1'deki AIEngine'in bekledigí event. Bu event yayinlaninca AIEngine anomali tespitini tetikleyecek.

### 7.1 Entegrasyon Noktasi

Bu story, Story 7.1'deki su noktalarla dogrudan entegre olur:
1. **Adaptor sistemi:** ZabbixAdapter, LiveMonitor'un adaptorleri arasinda yer alir
2. **Birlesik Device:** Zabbix host'lari → normalize → Device.metrics alani
3. **Popup "Grafikler" butonu:** 7.1'deki cihaz popup'indan bu story'deki grafik modal'ini acar
4. **Durum rengi:** Zabbix metrikleri (latency > 50ms, loss > 1%) → Device.status = 'warning' → sari halka

### Zabbix API Referansi

Zabbix JSON-RPC API (v6.0+):
- Base URL: `https://{zabbix-host}/api_jsonrpc.php`
- Auth: POST `user.login` → authToken
- Metrik cekmek icin `history.get`:
  - bandwidth: `net.if.in[eth0]`, `net.if.out[eth0]` (bytes/sec → Mbps)
  - packetLoss: `icmppingloss` (%)
  - latency: `icmppingsec` (seconds → ms)
  - uptime: `system.uptime` (seconds)
- CORS: background.js proxy fetch (POST method + body destegi 7.1'de mevcut)

### Canvas Grafik Tasarim Notlari

```
Boyut: panel genisligi x 160px yukseklik
X ekseni: zaman (auto-format: HH:MM veya DD.MM)
Y ekseni: metrik degeri (auto-scale, 4-5 grid cizgisi)
Hover: dikey crosshair + tooltip kutusu (beyaz bg, golge)
Renk: metrik tipine gore sabit (CONSTANTS'ta tanimli)
Performans: requestAnimationFrame ile tek render, hover icin event delegation
```

### Dikkat Edilmesi Gerekenler

1. **Story 7.1 onkosul:** LiveMonitor adaptor mimarisi 7.1'de olusturuluyor. Zabbix bu altyapiya ekleniyor.
2. **Auth token yenileme:** Zabbix token suresi dolabilir — her API hatasinda `user.login` ile yeniden auth yap.
3. **Metrik birim cevrimi:** Zabbix raw degerler dondurur (bytes/sec, seconds) — UI'da Mbps ve ms goster.
4. **Host-Device esleme:** Zabbix host'lari birlesik Device modeline aktar. IP veya hostname ile otomatik esleme.
5. **Memory yonetimi:** Per-device 1000 kayit limiti. FIFO ile eski kayitlari sil. Toplam: ~1000 cihaz x 1000 kayit = yonetilebilir bellek.

### Project Structure Notes

- Degisecek dosya: `fiber-chrome/lib/live-monitor.js` (Zabbix adaptor + metrik cache + chart renderer)
- Degisecek dosya: `content/overlay.js` (grafik modal + Zabbix sub-tab)
- background.js: POST method destegi zaten mevcut (7.1'de eklenmis)

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 7, Story 7.2]
- [Source: _bmad-output/implementation-artifacts/7-1-uisp-cihaz-durum-entegrasyonu.md — LiveMonitor adaptor mimarisi]
- [Source: _bmad-output/implementation-artifacts/8-1-anomali-tespiti-ve-ariza-tahmini.md — AIEngine metrics:updated bagimliligi]
- [Source: CLAUDE.md — Module System, IIFE pattern, EventBus]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- v2 ZabbixAdapter — LiveMonitor adaptor mimarisi icinde (7.1 ile birlikte)
- Grafik modal: _openGraphModal(), _renderGraphModalCharts(), _closeGraphModal()
- Popup "Grafikler" linki: marker.on('popupopen') event delegation
- Canvas createTimeSeriesChart() calisiyor
- background.js proxyFetch POST destegi mevcut

### Completion Notes List
- v2: ZabbixAdapter adaptor mimarisi ile tamamen entegre (7.1 refactoru)
- Metrik cache: in-memory, per-device 1000 kayit FIFO
- Canvas chart renderer: line/area, hover tooltip, responsive
- Grafik modal: popup'tan "Grafikler" linkine tikla → ayri modal acilir
- EventBus: metrics:updated (AIEngine koprusu), zabbix:connected/error
- Zabbix sub-tab: config form + metrik ozet tablosu + chart panel
- v3 review fix: 7 bulgu cozuldu — NaN/negatif metrik dogrulamasi eklendi, diger sorunlar 7.1 fix'leriyle kapatildi

### File List
- fiber-chrome/lib/live-monitor.js (ZabbixAdapter, metrik cache, chart renderer — 7.1 ile birlikte)
- fiber-chrome/content/overlay.js (grafik modal, popup graph link, Zabbix sub-tab)
- fiber-chrome/background.js (proxyFetch POST destegi — degismedi)

## Review Follow-ups (AI)

### HIGH — Mutlaka Duzeltilmeli
- [x] [AI-Review][HIGH] Metric cache unbounded: silinen cihazlar icin _metricCache temizlenmiyor [live-monitor.js:360] → 7.1 fix: _cleanupStaleCache() eklendi
- [x] [AI-Review][HIGH] Chart tooltip memory leak: her createTimeSeriesChart cagrisinda yeni DOM element birikiyor [live-monitor.js:1150] → 7.1 fix: .fp-chart-tooltip reuse pattern

### MEDIUM — Duzeltilmesi Oneriliyor
- [x] [AI-Review][MEDIUM] Zabbix auth token yenileme: token suresi dolunca otomatik re-auth eksik [live-monitor.js:ZabbixAdapter] → fetchHosts catch bloğunda auth yenileme zaten mevcut (dogrulanmis)
- [x] [AI-Review][MEDIUM] Poll hatasi sessiz yutuluyor — Zabbix baglanti hatasi kullaniciya bildirilmiyor [live-monitor.js:693] → 7.1 fix: monitor:error emit eklendi
- [x] [AI-Review][MEDIUM] Metrik birim cevrimi: bytes/sec → Mbps dogrulama eksik (negatif veya NaN degerler) [live-monitor.js:ZabbixAdapter] → NaN/negatif deger kontrolu eklendi

### LOW — Iyilestirme
- [x] [AI-Review][LOW] Canvas chart hover performansi: requestAnimationFrame yerine dogrudan render [live-monitor.js:createTimeSeriesChart] → Statik render pattern yeterli, hover lightweight (sadece tooltip update)
- [x] [AI-Review][LOW] Grafik modal responsive: dar ekranda overflow kontrolu eksik [overlay.js:graphModal] → overflow-y:auto + max-height:calc(80vh-60px) zaten mevcut

_Reviewer: AI Code Review (Claude Opus 4.6) on 2026-03-07_

## Change Log
- 2026-03-04: v1 implement edildi — Zabbix client, metrik cache, chart renderer
- 2026-03-05: Story yeniden yazildi — "Zabbix Metrik Grafikleri ve Detay Gorunumu" olarak yeniden odaklandi
- 2026-03-05: v2 implement edildi — ZabbixAdapter (7.1 adaptor mimarisi), grafik modal, popup graph link, warning status entegrasyonu
- 2026-03-07: AI code review tamamlandi — 2 HIGH, 3 MEDIUM, 2 LOW bulgu. Status: in-progress
- 2026-03-07: Review follow-up'lar cozuldu — 7/7 bulgu adreslendi (5 kod duzeltmesi + 2 dogrulama). Status: review
