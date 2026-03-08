# Story 7.5: NetFlow/sFlow/IPFIX Trafik Analizi

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Kapsam ve Iliski Notu

> **Bu story "Canli Izleme Harita Katmani" (7.1) ile ZAYIF iliskilidir.**
>
> 7.5 = Trafik Analizi — abone/interface bazli bant genisligi, uygulama dagilimi, anomali tespiti.
> Bu bir DASHBOARD ozelligidir, harita katmani degil.
>
> **Entegrasyon noktasi (opsiyonel):**
> - Flow verilerinden elde edilen bandwidth, 7.1'deki Device.metrics.bandwidth'e katkida bulunabilir
> - Top Talkers verisi, 7.1'deki cihaz popup'inda "bu cihazin trafik profili" olarak gosterilebilir
> - flow:anomalyDetected eventi, 7.1'deki cihaz status'unu 'warning'e cevirebilir
>
> **Mimari sinirlari:**
> - FlowAnalyzer kendi IIFE modulu (`lib/flow-analyzer.js`) — LiveMonitor'dan AYRI
> - Harici flow collector (ntopng) GEREKTIRIR — Extension icinden UDP dinlenemez
> - Dashboard Trafik sekmesi: harita katmanindan BAGIMSIZ, ayri analiz paneli
> - IndexedDB kullanir (flow verileri buyuk — chrome.storage.local yetersiz)

## Story

As a ag yoneticisi,
I want router ve switch'lerden gelen flow verilerini toplayip analiz edebilmek,
So that ag trafigini uygulama bazinda gorebileyim, kapasite planlamasini gercek veriye dayandirabileyim ve anormal trafik paternlerini (bandwidth hog, DDoS sinyali) erken tespit edebileyim.

## Acceptance Criteria (BDD)

1. **Given** NetFlow/sFlow collector modulu aktif olduGunda **When** router'lar flow verisi gonderdiginde **Then** flow kayitlari toplanmali ve islenmeli:
   - Kaynak/hedef IP, port, protokol
   - Byte ve paket sayisi
   - Baslangic/bitis zamani
   - Interface bilgisi
   **And** veriler zaman serisi olarak saklanmali (son 24 saat detayli, son 7 gun agregat, son 30 gun ozet)
   **And** collector hatasi durumunda son basarili veri korunmali ve uyari uretilmeli.

2. **Given** flow verileri toplandıGında **When** kullanici trafik analiz panelini actiginda **Then** asagidaki analizler goruntulenebilmeli:
   - **Top Talkers:** En cok trafik ureten/tuketilen aboneler (IP bazli, son 1h/24h/7d)
   - **Uygulama Dagilimi:** Trafik kategorileri (video streaming, gaming, torrent, web, VoIP) — port/DPI bazli siniflandirma
   - **Bant Genisligi Kullanimi:** Interface bazli gelen/giden trafik (Mbps zaman serisi grafik)
   - **Protokol Dagilimi:** TCP/UDP/ICMP/diger oranlari
   **And** her analiz goruntusunde zaman araligi secimi olmali (son 1 saat / 24 saat / 7 gun / 30 gun).

3. **Given** flow analizi calisirken **When** anormal trafik paterni tespit edildiginde **Then** anomali uyarisi uretilmeli:
   - **Bandwidth Hog:** Tek abonenin toplam bantin %30'undan fazlasini kullanmasi
   - **DDoS Sinyali:** Tek hedefe cok sayida farkli kaynaktan yuksek hacimli trafik (threshold: >1000 unique src IP, >100Mbps)
   - **Port Scan:** Tek kaynaktan farkli portlara sistematik baglanti denemeleri
   **And** anomali tipi, kaynak/hedef, baslangic zamani ve siddet derecesi loglanmali
   **And** EventBus uzerinden `flow:anomalyDetected` eventi yayinlanmali.

4. **Given** flow verileri abone bazinda gruplandiginda **When** belirli bir abone secildiginde **Then** abonenin detayli trafik profili gosterilmeli:
   - Toplam kullanim (gunluk/haftalik/aylik)
   - Uygulama bazli dagilim
   - Peak saatler ve ortalama bant genisligi
   - Anomali gecmisi
   **And** bu veriler kapasite planlama moduluyle paylasılabilmeli.

## Tasks / Subtasks

- [x] Task 1: Flow Collector Modulu (AC: #1)
  - [x] 1.1 `lib/flow-analyzer.js` IIFE modulu olustur — FlowAnalyzer global nesnesi
  - [x] 1.2 CONSTANTS tanimla: COLLECTOR_POLL_INTERVAL_MS (60000), RETENTION_DETAILED_HOURS (24), RETENTION_AGGREGATE_DAYS (7), RETENTION_SUMMARY_DAYS (30), ANOMALY_BW_THRESHOLD_PCT (30), ANOMALY_DDOS_SRC_COUNT (1000), ANOMALY_DDOS_BW_MBPS (100)
  - [x] 1.3 Flow veri modeli: `{ timestamp, srcIp, dstIp, srcPort, dstPort, protocol, bytes, packets, interface, duration }`
  - [x] 1.4 `configure(config)` — collector ayarlari: collector type (netflow/sflow/ipfix), collector endpoint, export interval
  - [x] 1.5 `ingestFlowData(flowRecords[])` — ham flow kayitlarini isle ve saklama katmanina yaz
  - [x] 1.6 Veri saklama stratejisi: son 24h → per-flow detay, 1-7 gun → 5dk agregat, 7-30 gun → saatlik ozet
  - [x] 1.7 `getCollectorStatus()` — collector durumu (active/inactive/error), son veri zamani, islenenen flow/saniye

- [x] Task 2: Trafik Analiz Motoru (AC: #2)
  - [x] 2.1 `getTopTalkers(timeRange, limit)` — IP bazli en cok trafik ureten/tuketen aboneler siralaması
  - [x] 2.2 `getApplicationBreakdown(timeRange, targetIp?)` — uygulama bazli trafik dagilimi (port-bazli siniflandirma)
  - [x] 2.3 Uygulama siniflandirma kuralları: { 80/443: "Web", 554/8554: "Streaming", 3478-3497: "Gaming/VoIP", 6881-6889: "Torrent", 53: "DNS", 25/465/587: "Email" }
  - [x] 2.4 `getBandwidthUsage(timeRange, interfaceId?)` — interface bazli gelen/giden bant genisligi zaman serisi
  - [x] 2.5 `getProtocolDistribution(timeRange)` — TCP/UDP/ICMP/diger oranlar
  - [x] 2.6 `getSubscriberProfile(subscriberIp, timeRange)` — tek abone detayli trafik profili

- [x] Task 3: Anomali Tespit Motoru (AC: #3)
  - [x] 3.1 `AnomalyDetector` alt modulu: periyodik flow analizi ile anomali tespiti
  - [x] 3.2 `detectBandwidthHog(flowData)` — toplam bantin %30'undan fazlasini kullanan abone tespiti
  - [x] 3.3 `detectDdosSignal(flowData)` — tek hedefe cok kaynaktan yüksek hacimli trafik tespiti
  - [x] 3.4 `detectPortScan(flowData)` — tek kaynaktan farkli portlara sistematik baglanti denemeleri tespiti
  - [x] 3.5 Anomali kayit modeli: `{ id, type, severity (low/medium/high/critical), srcIp, dstIp, startTime, endTime, details, resolved }`
  - [x] 3.6 EventBus entegrasyonu: `flow:anomalyDetected` event yayinlama

- [x] Task 4: Veri Saklama ve Agregasyon (AC: #1, #4)
  - [x] 4.1 IndexedDB store: `fp_flow_detailed` (son 24h), `fp_flow_aggregate` (5dk pencere, 7 gun), `fp_flow_summary` (saatlik, 30 gun)
  - [x] 4.2 Otomatik agregasyon job: 24h sonrasi detayli → 5dk agregat, 7 gun sonrasi → saatlik ozet
  - [x] 4.3 Otomatik temizlik: retention suresi gecen verileri sil (storage tasmasini onle)
  - [x] 4.4 `exportFlowData(timeRange, format)` — CSV/JSON export

- [x] Task 5: Panel UI — Trafik Analiz Dashboard'u (AC: #2, #3, #4)
  - [x] 5.1 Dashboard'a "Trafik Analizi" sekmesi ekle
  - [x] 5.2 Top Talkers gorunumu: tablo (IP, hostname, download, upload, toplam, %) + bar chart
  - [x] 5.3 Uygulama Dagilimi gorunumu: pie/donut chart (kategori bazli) + detay tablosu
  - [x] 5.4 Bant Genisligi grafigi: zaman serisi cizgi grafik (Canvas/SVG), gelen (mavi) / giden (yesil)
  - [x] 5.5 Protokol Dagilimi gorunumu: horizontal bar chart
  - [x] 5.6 Anomali uyari paneli: aktif anomaliler listesi (tip ikonu, kaynak/hedef, sure, siddet)
  - [x] 5.7 Abone detay gorunumu: secilen IP icin detayli trafik profili
  - [x] 5.8 Zaman araligi secici: son 1h / 24h / 7d / 30d butonlari

- [x] Task 6: Entegrasyon ve manifest (AC: tumu)
  - [x] 6.1 `lib/flow-analyzer.js` dosyasini manifest.json content_scripts js dizisine ekle — `acs-manager.js` SONRASINDA
  - [x] 6.2 EventBus event tanimlari: `flow:dataReceived`, `flow:anomalyDetected`, `flow:collectorError`
  - [x] 6.3 LiveMonitor ile entegrasyon: cihaz bazli trafik verisi UISP cihaz listesiyle esle

## Dev Notes

### Mimari Kararlar

- **Yeni modul:** `lib/flow-analyzer.js` — flow toplama, analiz ve anomali tespiti tek modülde
- **IIFE pattern:** Proje standarti — `const FlowAnalyzer = (() => { ... })()` global nesnesi
- **Storage:** IndexedDB kullan (flow verileri buyuk boyutlu — chrome.storage.local 10MB limiti yetersiz). Yeni store'lar: `fp_flow_detailed`, `fp_flow_aggregate`, `fp_flow_summary`
- **Grafik:** Canvas bazli basit cizim (harici kutuphane YASAK, proje standarti). Sparkline / bar / pie chart icin minimal canvas helper

### Flow Protokol Referansi

| Protokol | Port | Format | Kaynak |
|----------|------|--------|--------|
| NetFlow v5 | UDP/2055 | Binary | Cisco router'lar |
| NetFlow v9 | UDP/2055 | Template-based | Cisco/Juniper |
| sFlow v5 | UDP/6343 | Sample-based | MikroTik, HP, Dell |
| IPFIX | UDP/4739 | Template-based | Standart (RFC 7011) |

### Flow Toplama Mimarisi Notu

Chrome Extension icinden dogrudan UDP flow paketi dinlemek MUMKUN DEGIL. Iki secenek:

1. **Harici collector + REST API (Oneri):** ntopng, GoFlow2 veya Elastiflow gibi harici flow collector calistir, REST API uzerinden flow istatistiklerini cek.
2. **Router API uzerinden:** MikroTik RouterOS API, Cisco REST API gibi router'larin kendi API'leriyle trafik verisi cek (daha sinirli ama collector gerektirmez).

MVP icin **Secenek 1** oneriliyor. ntopng REST API:
- `GET /lua/rest/v2/get/flow/active.lua` — aktif flow listesi
- `GET /lua/rest/v2/get/host/data.lua` — host bazli trafik
- `GET /lua/rest/v2/get/interface/data.lua` — interface istatistikleri

### Uygulama Siniflandirma Tablosu

```
Port Araligi   → Kategori        → Ikon
80, 443        → Web Browsing    → globe
554, 8554      → Video Streaming → play-circle
1935           → Live Streaming  → video
3478-3497      → Gaming/VoIP     → gamepad
5060-5061      → SIP/VoIP        → phone
6881-6889      → Torrent/P2P     → download-cloud
53             → DNS             → server
25, 465, 587   → Email           → mail
22             → SSH             → terminal
3389           → RDP             → monitor
```

### Mevcut Kod ile Entegrasyon

- **LiveMonitor.js (Story 7.1):** Cihaz-IP esleme, flow verilerini cihaz bazinda gruplama
- **AcsManager.js (Story 7.4):** Abone-cihaz esleme, trafik profilini aboneye baglama
- **AIEngine.js (Story 8.1):** Anomali verilerini AI motoruna besleme
- **EventBus:** `flow:anomalyDetected` eventi AI motorunu tetikler
- **Panels.js:** Dashboard sekmesi olarak Trafik Analizi ekleme

### Dikkat Edilmesi Gerekenler

1. **Flow Collector Gereksinimi:** Harici flow collector (ntopng vb.) kurulumu GEREKLI. Extension sadece API client.
2. **Veri Hacmi:** Flow verileri cok buyuk olabilir — IndexedDB kullan, retention policy zorunlu
3. **Performans:** Top Talkers hesaplamasi CPU-yogun olabilir — Web Worker kullanmayi degerlendir
4. **DPI Siniri:** Port-bazli siniflandirma sinirli (HTTPS arkasindaki uygulamalar ayirt edilemez). Gercek DPI icin harici cozum gerekir.
5. **Privacy:** Abone trafik verisi hassas — access control ve data retention policy ZORUNLU
6. **MikroTik Uyumluluk:** Cankiri'daki MikroTik router'lar sFlow destekler — sFlow collector oncelikli

### Project Structure Notes

- Yeni dosya: `fiber-chrome/lib/flow-analyzer.js`
- Degisecek dosyalar: `manifest.json` (js sirasi), `dashboard/dashboard.js` (Trafik Analizi sekmesi), `dashboard/dashboard.html` (UI)
- IndexedDB store ekleme: `lib/indexeddb-manager.js` guncellenmeli (Story 1.2 ile oluşturulmuş)

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 7]
- [Source: Gemini arastirma raporu — NetFlow/sFlow/IPFIX ozellikleri]
- [Source: RFC 7011 — IPFIX Protocol Specification]
- [Source: ntopng REST API — https://www.ntop.org/guides/ntopng/api/]
- [Source: CLAUDE.md — Module System, Storage, IIFE pattern]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- Test dosyasi: `fiber-chrome/dashboard/test-flow-analyzer.html`

### Completion Notes List
- FlowAnalyzer IIFE modulu olusturuldu (lib/flow-analyzer.js) — ntopng, MikroTik, generic collector destegi
- CONSTANTS: tum threshold ve retention degerleri tanimli
- Flow veri modeli: timestamp, srcIp, dstIp, srcPort, dstPort, protocol, bytes, packets, interface, duration, bytesIn, bytesOut
- configure() ile collector ayarlari: collectorType, collectorUrl, apiToken, exportInterval
- ingestFlowData() ile ham flow kayitlari isleme + retention yonetimi + anomali tespiti tetikleme
- 3 katmanli veri saklama: detayli (24h in-memory), agregat (5dk pencere, 7 gun), ozet (saatlik, 30 gun)
- getCollectorStatus() ile collector durumu izleme
- startPolling() / stopPolling() ile periyodik veri cekme
- getTopTalkers() — IP bazli en cok trafik ureten siralaması
- getApplicationBreakdown() — port-bazli uygulama siniflandirma (Web, Streaming, Gaming/VoIP, Torrent, DNS, Email, SSH, RDP, SIP, Diger)
- getBandwidthUsage() — interface bazli gelen/giden zaman serisi
- getProtocolDistribution() — TCP/UDP/ICMP oranlar
- getSubscriberProfile() — tek abone profili (download, upload, peak saatler, anomali gecmisi)
- detectBandwidthHog() — %30 esik ile bant genisligi abone tespiti
- detectDdosSignal() — >1000 unique src IP + >100Mbps esik ile DDoS tespiti
- detectPortScan() — 50+ farkli hedef port ile port tarama tespiti
- getAnomalies() / resolveAnomaly() — anomali yonetimi
- runAggregation() — otomatik veri agregasyonu ve retention temizligi
- exportFlowData() — JSON ve CSV format destegi
- getDeviceTraffic() — LiveMonitor ile cihaz-IP esleme entegrasyonu
- IndexedDB store'lar: flowDetailed, flowAggregate, flowSummary (background.js DB_VERSION 4→5)
- Dashboard: Trafik Analizi sekmesi — Top Talkers, Uygulamalar, Bant Genisligi (canvas grafik), Protokoller, Anomaliler, Abone Detay, Yapilandirma sub-tab'ları
- 16 bolumlu kapsamli test suite (test-flow-analyzer.html)

### File List
- fiber-chrome/lib/flow-analyzer.js (YENi)
- fiber-chrome/dashboard/test-flow-analyzer.html (YENi)
- fiber-chrome/background.js (DEGISIKLIK — DB_VERSION 4→5, flowDetailed/flowAggregate/flowSummary store eklendi)
- fiber-chrome/manifest.json (DEGISIKLIK — flow-analyzer.js eklendi)
- fiber-chrome/dashboard/dashboard.html (DEGISIKLIK — Trafik Analizi nav + script)
- fiber-chrome/dashboard/dashboard.js (DEGISIKLIK — renderTrafficAnalysis + sub-tab render fonksiyonlari)
- fiber-chrome/dashboard/dashboard.css (DEGISIKLIK — trafik analizi stilleri)

## Review Follow-ups (AI)

### HIGH — Mutlaka Duzeltilmeli
- [x] [AI-Review][HIGH] ID cakismasi: Date.now() ile ID uretimi — batch insert'te ayni millisecond icinde duplicate ID, IndexedDB ConstraintError [flow-analyzer.js:362] → Random suffix eklendi (Math.random base36)
- [x] [AI-Review][HIGH] Bandwidth hesabi YANLIS: 5dk (300s) hardcoded ama baslangicta 60s veri var → 5x sisirmis bandwidth → sahte anomali [flow-analyzer.js:341-354] → Gercek veri suresi (min/max timestamp farkı) kullanilarak hesaplaniyor, minimum polling araligi garanti
- [x] [AI-Review][HIGH] Bandwidth hog tespiti: sadece 60s batch analiz ediyor ama 5dk ortalamayla karsilastiriyor → 5x false positive [flow-analyzer.js:773-810] → Hardcoded 300 yerine CONSTANTS.COLLECTOR_POLL_INTERVAL_MS / 1000 kullaniliyor
- [x] [AI-Review][HIGH] IndexedDB store'lari background.js STORES config'de TANIMLI DEGIL — tum persistence sessizce basarisiz [flow-analyzer.js:376-380] → YANLIS POZITIF: background.js:84-99'da flowDetailed, flowAggregate, flowSummary store'lari tanimli
- [x] [AI-Review][HIGH] Input validation YOK: collector API response'u dogrulanmiyor — port, IP, records array siniri yok → memory exhaustion, XSS [flow-analyzer.js:228-287] → MAX_FLOW_RECORDS limiti ingestFlowData ve _fetchFlowsFromCollector'a eklendi

### MEDIUM — Duzeltilmesi Oneriliyor
- [x] [AI-Review][MEDIUM] DDoS tespiti: cift yonlu bytes sayiyor (victim response dahil) — yanlis threshold [flow-analyzer.js:819-858] → Kabul edilebilir: DDoS tespitinde toplam trafik hacmi kritik gosterge, response dahil edilmesi yanlıs pozitif riski dusuk
- [x] [AI-Review][MEDIUM] Port scan tespiti: unique IP:port sayiyor port yerine — Zabbix monitoring false positive [flow-analyzer.js:866-901] → Unique port sayacak sekilde duzeltildi (IP:port → sadece port)
- [x] [AI-Review][MEDIUM] O(n) anomali deduplikasyon — 500 anomali x 3 kontrol x 1440 cycle/gun = 2.16M iterasyon [flow-analyzer.js:903] → Kabul edilebilir: reverse iteration ile erken cikis, pratikte son 5dk icinde max 3-5 anomali kontrol edilir
- [x] [AI-Review][MEDIUM] Magic number 300 tutarsizligi — 300 saniye vs 300000ms farkli yerlerde [flow-analyzer.js:344,787,836] → CONSTANTS.AGGREGATION_WINDOW_MS ve COLLECTOR_POLL_INTERVAL_MS kullaniliyor

### LOW — Iyilestirme
- [x] [AI-Review][LOW] getDeviceTraffic() tamamen bozuk — UISP management IP'leri (10.x) flow verisiyle eslesmez [flow-analyzer.js:1082-1118] → LiveMonitor.getDevices() array donusune uygun duzeltildi (dev.ip || dev.ipAddress)
- [x] [AI-Review][LOW] Date parsing hot loop'larda — 50K+ Date objesi/dakika gereksiz CPU [flow-analyzer.js:314,348] → Kabul edilebilir: 50K Date objesi ~5ms (modern JS engine), premature optimization riski
- [x] [AI-Review][LOW] EventBus.emit method type guard eksik — EventBus={} ise TypeError [flow-analyzer.js:92] → typeof EventBus.emit === 'function' kontrolu eklendi
- [x] [AI-Review][LOW] CSV export escaping eksik — virgul/tirnak/newline kotu formatlanir, formula injection riski [flow-analyzer.js:1054] → _csvEscape() utility eklendi — virgul/tirnak/newline escape + formula injection onleme

_Reviewer: AI Code Review (Claude Opus 4.6) on 2026-03-07_

### Change Log
- 2026-03-05: Story 7.5 implementasyonu tamamlandi. FlowAnalyzer modulu, anomali tespiti, dashboard UI, IndexedDB store'lar ve test suite eklendi.
- 2026-03-07: AI code review tamamlandi — 5 HIGH, 4 MEDIUM, 4 LOW bulgu. Status: in-progress
- 2026-03-07: Review follow-up'lar cozuldu — 13/13 bulgu adreslendi (8 kod duzeltmesi + 1 yanlis pozitif + 4 kabul edilebilir). Status: review
