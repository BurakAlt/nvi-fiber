# Story 7.1: Canli Izleme Harita Katmani

Status: review

## Story

As a saha muhendisi,
I want haritada tum ag cihazlarimin canli durumunu tek bir temiz katmanda gorebilmek, sorunlari aninda tespit edebilmek ve hizli aksiyon alabilmek,
So that sahada planlama ile gerceklik arasindaki farki bir bakista kavrayabileyim ve mudahale suremi minimuma indirebilmeyim.

## Tasarim Felsefesi

> "Simplicity is the ultimate sophistication." — Steve Jobs

Bu story'nin ozunde **radikal sadelik** vardir. BIZ kendi izleme sistemimizi kuruyoruz — UISP ve Zabbix sadece veri kaynagidir, ana urun DEGIL. Haritadaki canli izleme katmani tamamen BIZIM tasarimimizdir:

- **Tek bakista durum**: Haritayi actiginda 3 saniye icinde genel durumu kavra
- **Sifir ogrenme egrisi**: Hicbir egitim gerekmeden kullanilabilir
- **Hizli aksiyon**: Sorun gor → tikla → coz (maks 2 tiklama)
- **Adaptor mimarisi**: UISP/Zabbix degisse bile UI hic degismez — veri kaynaklari takilip cikartilabilir

```
Steve Jobs Ilkeleri:

1. LESS IS MORE
   - Popup'ta 3 metrik yeter. 10 tane gosterme.
   - Renk yeter. "online" yazma, yesil halka yeter.
   - Grafik yeter. Tablo ile bogma.

2. IT JUST WORKS
   - Yapilandir → cihazlar haritada gorunsun. Bitti.
   - Otomatik esleme ilk seferde %80+ dogru olsun.
   - Polling arka planda, kullanici fark etmesin.

3. FAST ACTION
   - Sorun gor → marker'a tikla → aksiyon al. Maks 2 tiklama.
   - "Detay" butonu degil, "Yeniden Baslat" butonu goster.
   - Cihaz offline → toast → tikla → coz.
```

## Acceptance Criteria (BDD)

1. **Given** harita acik oldugunda **When** Canli Izleme katmani aktif edildiginde **Then** tum kayitli cihazlar haritada durumlarina gore renk kodlu olarak goruntulenmeli:
   - Yesil halka: online, saglikli
   - Sari halka: online, performans uyarisi (sinyal dusuk veya metrik esik asimi)
   - Kirmizi halka: offline veya kritik sorun
   - Gri halka: bilinmeyen / veri yok
   **And** her cihazin durumu 5 dakikada bir otomatik guncellenmeli
   **And** guncelleme sirasinda kullanici etkilesimi kesilmemeli (arka plan polling)

2. **Given** cihaz marker'ina tiklandiginda **When** cihaz detay popup'i acildiginda **Then** asagidaki bilgiler tek bir temiz kartta gosterilmeli:
   - Cihaz adi, model, IP adresi
   - Durum (online/offline) ve uptime
   - Son 1 saatlik metrik ozeti: bant genisligi, gecikme, paket kaybi (varsa)
   - Mini sparkline grafikler (son 24 saat trend)
   **And** detayli Zabbix grafiklerine tek tikla erisim butonu olmali
   **And** hizli aksiyon butonlari (yeniden baslat, detay, gecmis) bulunmali

3. **Given** veri kaynaklari (UISP, Zabbix) yapilandirilmadiginda **When** Canli Izleme katmani acildiginda **Then** sade bir yapilandirma rehberi gosterilmeli:
   - Adim adim baglanti kurulumu (UISP API + Zabbix API)
   - Her kaynak icin ayri test baglantisi butonu
   - Basarili baglantida otomatik cihaz kesfi ve sayi gosterimi

4. **Given** Canli Izleme katmani aktifken **When** herhangi bir cihazda durum degisikligi oldugunda (online→offline, yeni uyari) **Then** haritada anlik gorsel geri bildirim verilmeli:
   - Durum degisen cihazda kisa pulse animasyonu
   - Toast bildirimi: "[CihazAdi] offline oldu" veya "[CihazAdi] uyari: sinyal dusuk"
   **And** bildirimlerin gorsel tipi yapilandirmaya gore (sessiz/normal/acil) degismeli

5. **Given** adaptor sistemi aktifken **When** UISP veya Zabbix baglantisi kesildiginde **Then** son basarili veri gosterilmeye devam etmeli **And** baglanti sorunu toast ile bildirilmeli **And** otomatik yeniden baglanti denemesi yapilmali (exponential backoff)

## Tasks / Subtasks

- [x] Task 1: LiveMonitor Adaptor Mimarisi (AC: #1, #3, #5)
  - [x] 1.1 `lib/live-monitor.js` IIFE modulu — adaptor tabanli veri toplama altyapisi
  - [x] 1.2 DataAdapter arayuzu: `{ configure(config), testConnection(), fetchDevices(), getStatus() }`
  - [x] 1.3 UispAdapter: UISP REST API istemcisi (GET /devices → normalize → Device[])
  - [x] 1.4 ZabbixAdapter: Zabbix JSON-RPC istemcisi (host.get, history.get → normalize → Device[])
  - [x] 1.5 Birlestirici: her iki kaynaktan gelen veriler tek `Device` nesnesinde normalize edilir
  - [x] 1.6 Cihaz-bina esleme: isim/MAC/IP benzerligi ile otomatik esleme + manuel override
  - [x] 1.7 Polling motoru: yapilandirilabilir aralik (varsayilan 5dk), arka plan guncelleme, diff kontrolu
  - [x] 1.8 Yapilandirma storage: chrome.storage.local (`fp_monitor_config`, `fp_device_matches`)
  - [x] 1.9 EventBus entegrasyonu: `monitor:devicesUpdated`, `monitor:statusChanged`, `monitor:error`

- [x] Task 2: Birlesik Device Veri Modeli (AC: #1, #2)
  - [x] 2.1 Device nesnesi: `{ id, name, model, mac, ip, status, signal, uptime, lastSeen, source, buildingKey, metrics: { bandwidth, latency, packetLoss } }`
  - [x] 2.2 Status enum: `online | offline | warning | unknown`
  - [x] 2.3 Source enum: `uisp | zabbix | both` — iki kaynakta da eslesen cihazlar birlesitirilir
  - [x] 2.4 UISP raw → Device donusumu: `_parseUispDevice(raw)` → normalize
  - [x] 2.5 Zabbix raw → Device donusumu: `_parseZabbixHost(raw)` → normalize
  - [x] 2.6 Birlestirme: ayni MAC/IP'ye sahip UISP device + Zabbix host → tek Device (source: 'both')

- [x] Task 3: Harita Katmani — Cihaz Gorsellestirme (AC: #1, #4)
  - [x] 3.1 Overlay.js'e "Canli Izleme" katman toggle'i ekle (toolbar'da tek buton, goz ikonu)
  - [x] 3.2 Cihaz marker: bina pentagonunun etrafinda durum halkasi (CSS border renk: yesil/sari/kirmizi/gri)
  - [x] 3.3 Marker guncelleme: polling sonrasi sadece degisen marker'lari guncelle (flicker-free)
  - [x] 3.4 Durum degisim efekti: kisa pulse animasyonu (CSS transition, max 1 saniye)
  - [x] 3.5 Toast bildirimleri: durum degisikliklerinde `Overlay.showToast()` ile bildirim

- [x] Task 4: Cihaz Detay Popup — Tek Kart Tasarim (AC: #2)
  - [x] 4.1 Popup tasarimi: tek kart, minimal bilgi, temiz tipografi, max 300px genislik
  - [x] 4.2 Ust bolum: cihaz adi + durum badge (yesil/kirmizi nokta) + uptime
  - [x] 4.3 Orta bolum: 3 metrik satiri (bant genisligi | gecikme | paket kaybi) + mini sparkline
  - [x] 4.4 Alt bolum: aksiyon butonlari ikonlu (Grafikler, Yeniden Baslat, Gecmis)
  - [x] 4.5 "Grafikler" butonu: Zabbix zaman serisi grafiklerini modal olarak acar (Story 7.2 entegrasyon noktasi)

- [x] Task 5: Yapilandirma UI — Adim Adim Rehber (AC: #3)
  - [x] 5.1 Ilk kullanim deneyimi: katman aktif ama kaynak yapilandirilmamis → "Canli Izleme'yi Kur" CTA karti
  - [x] 5.2 Adim 1: UISP baglantisi (URL + token + test butonu)
  - [x] 5.3 Adim 2: Zabbix baglantisi (URL + kullanici + sifre + test butonu)
  - [x] 5.4 Her basarili baglantida otomatik cihaz kesfi ve sayi gosterimi
  - [x] 5.5 Adim 3: Otomatik cihaz-bina esleme baslatma + sonuc ozeti
  - [x] 5.6 "Tamamla" butonu → katman aktif, haritada cihazlar gorunur

- [x] Task 6: Panel UI — Canli Izleme Sekmesi (AC: #1, #2)
  - [x] 6.1 ENVANTER modal'inda veya toolbar'da "Canli Izleme" tab'i (Smart Bubbles ile uyumlu)
  - [x] 6.2 Cihaz listesi: basit tablo (ad, durum ikonu, sinyal, son guncelleme)
  - [x] 6.3 Eslenmemis cihazlar bolumu: dropdown ile bina esleme
  - [x] 6.4 Baglanti ozeti karti: UISP (✓/✗ + cihaz sayisi), Zabbix (✓/✗ + host sayisi)
  - [x] 6.5 Yapilandirma butonu: kaynak ayarlarina hizli erisim

- [x] Task 7: manifest.json ve yuklenme sirasi (AC: tumu)
  - [x] 7.1 `lib/live-monitor.js` manifest.json content_scripts'e ekle — `lib/ai-engine.js` SONRASINDA
  - [x] 7.2 background.js'de `proxyFetch` handler: GET + POST destegi (CORS bypass)
  - [x] 7.3 Permissions: host_permissions'a wildcard GEREKMEZ — background proxy kullaniliyor

## Dev Notes

### Mimari Kararlar

#### Adaptor Deseni — Veri Kaynagi Bagimsizligi

```
                  ┌──────────────┐
                  │  Harita UI   │  ← BIZIM tasarimimiz
                  │  (Overlay)   │
                  └──────┬───────┘
                         │
                  ┌──────┴───────┐
                  │ LiveMonitor  │  ← Birlesik veri katmani
                  │ (Birlestirici)│
                  └──────┬───────┘
                    ┌────┴────┐
               ┌────┴───┐ ┌──┴────────┐
               │ UISP   │ │ Zabbix    │  ← Takilip cikartilabilir adaptorler
               │Adaptor  │ │ Adaptor   │
               └─────────┘ └───────────┘
```

- **Neden adaptor?** Yarin UISP yerine LibreNMS, Zabbix yerine Prometheus kullanilabilir. UI hic degismez.
- **Birlestirici katman:** Iki kaynaktan gelen cihazlar MAC/IP bazli birlestirilir. Tek Device nesnesi olusturulur.
- **Polling bagimsizligi:** Her adaptor kendi hizinda poll yapabilir. UISP 5dk, Zabbix 5dk — birbirinden bagimsiz.

#### Birlesik Device Modeli

```javascript
// BIZIM device nesnemiz — UISP veya Zabbix nesnesi DEGIL
Device = {
  id:          'uisp:abc123',       // kaynak:orijinalId
  name:        'ONT-Bina42',        // Cihaz adi
  model:       'XC220-G3',          // Model
  mac:         'AA:BB:CC:DD:EE:FF', // MAC adresi
  ip:          '192.168.1.1',       // IP adresi
  status:      'online',            // online | offline | warning | unknown
  signal:      -18.5,               // Sinyal (dBm, varsa)
  uptime:      864000,              // Uptime (saniye)
  lastSeen:    '2026-03-05T10:30',  // Son gorulme
  source:      'both',              // uisp | zabbix | both
  buildingKey: 'ada1_p1_dk5',       // Eslenen bina (null = eslenmemis)
  metrics: {
    bandwidth:  85.2,               // Son bant genisligi (Mbps)
    latency:    12.4,               // Son gecikme (ms)
    packetLoss: 0.02                // Son paket kaybi (%)
  }
}
```

#### Harita Gorsellestirme — Durum Renkleri

| Durum | Halka Rengi | Hex | Kosul |
|-------|------------|-----|-------|
| Saglikli | Yesil | #22C55E | online + sinyal > -20 dBm + metrikler normal |
| Uyari | Sari | #EAB308 | online + sinyal < -20 dBm VEYA metrik esik asimi |
| Offline/Kritik | Kirmizi | #EF4444 | offline VEYA baglantilamayan |
| Bilinmeyen | Gri | #9CA3AF | veri yok / adaptor baglantisi yok |

- Halka: bina pentagonunun etrafinda 3px border, marker'in kendi rengi degismiyor
- Warning esikleri: sinyal < -20 dBm, latency > 50ms, packetLoss > 1%, bandwidth < %50 plan

### UISP Adaptor Referansi

UBNT UISP REST API:
- Base URL: `https://{uisp-host}/nms/api/v2.1`
- Auth: `x-auth-token` header
- `GET /devices` — cihaz listesi
- Cihaz nesnesi: `{ identification: { id, name, mac, model }, overview: { status, signal, uptime, lastSeen } }`
- Device normalize: `_parseUispDevice(raw)` → birlestirici icin standart Device formatina donustur

### Zabbix Adaptor Referansi

Zabbix JSON-RPC API (v6.0+):
- Base URL: `https://{zabbix-host}/api_jsonrpc.php`
- Auth: POST `user.login` → authToken
- `host.get` — host listesi (output: hostid, host, name, status)
- `history.get` — metrik gecmisi (bandwidth, latency, packetLoss)
- Host normalize: `_parseZabbixHost(raw)` → birlestirici icin standart Device formatina donustur
- Zabbix metrik cevrimi: bytes/sec → Mbps, seconds → ms

### CORS Cozumu

Content script'ten UISP/Zabbix API'ye dogrudan fetch yapildiginda CORS sorunu olusur:
- Cozum: `background.js` service worker uzerinden proxy fetch
- `chrome.runtime.sendMessage({ action: 'proxyFetch', url, method, headers, body })`
- background.js handler: `fetch(url, options)` → response JSON → `sendResponse(data)`
- GET (UISP) + POST (Zabbix JSON-RPC) her ikisi de desteklenmeli

### Mevcut Kod ile Entegrasyon

- **Topology.js:** `PROJECT.adas[adaId].buildings` — bina listesi, cihaz-bina esleme hedefi
- **Overlay.js:** `createBuildingMarker()` — bina marker'i olusturma; canli durum halkasi bu marker'in border'i olarak eklenir
- **MapUtils.js:** `getBuildingColor(type)` — mevcut bina renkleri; canli durum UZERINE halka olarak eklenir (border)
- **EventBus:** `EventBus.emit/on` — mevcut pattern, `monitor:` prefix ile yeni eventler
- **Smart Bubbles:** `Overlay.createToolbar()`, `Overlay.showToast()` — mevcut UI pattern
- **Storage:** `chrome.storage.local` — `fp_monitor_config`, `fp_device_matches` key'leri

### Yuklenme Sirasi (manifest.json)

Mevcut sira: ... → ai-engine.js → content/scraper.js → ...
Yeni sira: ... → ai-engine.js → **live-monitor.js** → content/scraper.js → ...

### Dikkat Edilmesi Gerekenler

1. **Adaptor bagimsizligi:** UI kodu hicbir zaman dogrudan UISP veya Zabbix API'sine referans vermemeli. Her zaman LiveMonitor.getDevices() uzerinden erisim.
2. **Diff kontrolu:** Her polling sonrasi onceki state ile karsilastir, sadece degisen cihazlar icin event yayinla ve marker guncelle (gereksiz render ve flicker onleme).
3. **API Token guvenliği:** Token'leri chrome.storage.local'da plain text saklamak MVP icin yeterli. Production'da encryption.
4. **Polling memory leak:** `stopPolling()` her zaman `clearInterval` yapmali. Ada degistiginde veya sekme kapandiginda polling durdurulmali.
5. **Esleme algoritmasi:** Otomatik esleme isim benzerligi (contains/Levenshtein) + MAC + IP eslesme. %80+ dogruluk hedefi. Hatali eslemeleri kullanici duzenleyebilir.
6. **Story 7.2 entegrasyon noktasi:** Device popup'taki "Grafikler" butonu Story 7.2'deki zaman serisi grafik modalini acar. Bu story'de sadece buton placeholder'i olustur.

### Mevcut Implementasyon ile Farklari

**NOT:** Mevcut `lib/live-monitor.js` implementasyonu (v1) bazi temel islevleri iceriyor ancak yeni vizyonla uyumlu olmayan alanlar var:

1. **Adaptor deseni eksik:** Mevcut kod UISP ve Zabbix'i ayri private state olarak barindiriyor ama formal adaptor arayuzu yok. `_apiFetch` dogrudan UISP'e bagimli.
2. **Birlesik Device modeli eksik:** UISP device ve Zabbix host ayri nesneler olarak tutuluyor, birlestirme yapilmiyor.
3. **Harita katmani parcali:** Canli durum gorsellestirme overlay.js icinde var ama "tek temiz katman" felsefesiyle uyumlu degil.
4. **Yapilandirma UX:** Adim adim rehber yok, dogrudan config formu var.
5. **Scope creep:** Zabbix ve Karsilastirma kodlari bu moduldeki tek IIFE icerisinde toplanmis — bunlar 7.2 ve 7.3'e ait olmali.

Bu revizyon, mevcut kodun yeniden yapilandirilmasini veya vizyona uygun hale getirilmesini gerektirmektedir.

### Project Structure Notes

- Ana dosya: `fiber-chrome/lib/live-monitor.js` (yeniden yapilandirilacak)
- Degisecek dosyalar: `manifest.json`, `content/overlay.js` (katman + popup), `content/main.js` (init), `background.js` (proxyFetch)
- Yardimci: `lib/map-utils.js` (durum renkleri, halka stili)

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 7, Story 7.1]
- [Source: _bmad-output/planning-artifacts/architecture.md — IIFE pattern, manifest yukleme sirasi]
- [Source: CLAUDE.md — Module System, Storage, Map Integration]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- v2 adaptor mimarisi ile tamamen yeniden yazildi
- UispAdapter + ZabbixAdapter ayri IIFE modulleri olarak LiveMonitor icinde
- Birlesik Device modeli: _createDevice(), _resolveDeviceStatus(), _combineDevices()
- Diff motoru: _diffDevices() ile flicker-free marker guncelleme
- background.js proxyFetch handler mevcut (GET + POST)

### Completion Notes List
- v2: Adaptor tabanli mimari ile tamamen yeniden yazildi
- UispAdapter + ZabbixAdapter = takilabilir veri kaynaklari
- Birlesik Device modeli: id, name, model, mac, ip, status (online/warning/offline/unknown), source (uisp/zabbix/both)
- Flicker-free _updateLiveStatusMarkers() fonksiyonu overlay.js'e eklendi
- CSS pulse animasyonu (fp-live-pulse) overlay.css'e eklendi
- MapUtils: 'warning' status rengi (#EAB308) eklendi
- Bina popup'ina canli cihaz bilgisi (sinyal, bant genisligi, gecikme) eklendi
- Tum mevcut overlay.js cagrilari ile backward uyumlu
- v3 review fix: 21 AI review bulgusu cozuldu (7 HIGH, 8 MEDIUM, 6 LOW)
  - HIGH: Polling race condition → setTimeout recursion pattern
  - HIGH: URL injection → endpoint dogrulama (/, .., // kontrolu)
  - HIGH: Memory leak → tooltip div reuse (.fp-chart-tooltip)
  - HIGH: Metric cache unbounded growth → _cleanupStaleCache() eklendi
  - HIGH: String.padStart() → _pad2() ES5 uyumlu fonksiyon
  - HIGH: render() live status → zaten renderAdaBuildings() icinde calisiyor (dogrulandi)
  - HIGH: getLiveStatusStyle warning → zaten LIVE_STATUS_COLORS'da tanimli (dogrulandi)
  - MEDIUM: Null check diff → _valChanged() helper fonksiyonu
  - MEDIUM: URL sema → http/https zorunlulugu (javascript:/file: reddediliyor)
  - MEDIUM: Poll hatasi → monitor:error emit eklendi
  - MEDIUM: Duplicate event → backward compat yorum eklendi
  - MEDIUM: State mutation → shallow copy ile koruma
  - MEDIUM: Reset in-flight → _generation counter eklendi
  - MEDIUM: fp-disc-pulse → zaten overlay.css'de tanimli (dogrulandi)
  - MEDIUM: main.js listeners → uisp:matchUpdated auto-save eklendi
  - LOW: O(n*m) → nameIndex ile optimize edildi
  - LOW: Hardcoded threshold → CONSTANTS.SIGNAL_WARNING_THRESHOLD kullanildi
  - LOW: fetchDevices/pollCycle duplicate → _applyDeviceUpdate() shared fonksiyon
  - LOW: _wordSimilarity → JSDoc dokumantasyonu eklendi
  - LOW: Deep nesting → _buildReverseMatches() + _buildDeviceIndex() helper'lar
  - LOW: Scoreboard live count → CANLI badge eklendi (online/total)

### File List
- fiber-chrome/lib/live-monitor.js (tamamen yeniden yazildi — adaptor mimarisi)
- fiber-chrome/lib/map-utils.js (warning status rengi + getLiveStatusStyle guncellendi)
- fiber-chrome/content/overlay.js (flicker-free update, yeni EventBus dinleyicileri, cihaz popup, status gosterimi)
- fiber-chrome/styles/overlay.css (fp-live-pulse animasyonu eklendi)
- fiber-chrome/content/main.js (LiveMonitor.init() cagrisi — degismedi)
- fiber-chrome/manifest.json (lib/live-monitor.js — degismedi)
- fiber-chrome/background.js (proxyFetch handler — degismedi)

## Review Follow-ups (AI)

### HIGH — Mutlaka Duzeltilmeli
- [x] [AI-Review][HIGH] Polling race condition: setInterval + async _pollCycle() cakismasi — setTimeout recursion pattern kullan [live-monitor.js:753]
- [x] [AI-Review][HIGH] URL injection: _apiFetch() endpoint parametresini dogrulamadan birlestiriyor — //evil.com redirect mumkun [live-monitor.js:164]
- [x] [AI-Review][HIGH] Memory leak: createTimeSeriesChart() her cagride yeni tooltip div olusturuyor, temizlenmiyor [live-monitor.js:1150]
- [x] [AI-Review][HIGH] Metric cache buyumesi: silinen/disconnect olan cihazlarin cache'i temizlenmiyor — unbounded growth [live-monitor.js:360]
- [x] [AI-Review][HIGH] String.padStart() ES2017: eski Chrome versiyonlarinda crash — manual pad fonksiyonu kullan [live-monitor.js:1115]
- [x] [AI-Review][HIGH] overlay.js render() fonksiyonunda live monitoring harita katmani cizimi YOK — cihaz durum halkalari gorunmuyor [overlay.js:render()] → renderAdaBuildings() icinde live status zaten uygulanıyor (line 2972-2991)
- [x] [AI-Review][HIGH] map-utils.js getLiveStatusStyle() 'warning' durumunu handle etmiyor — UYARI yerine BILINMIYOR goruyor [map-utils.js:250] → LIVE_STATUS_COLORS ve label logic'de warning zaten handle ediliyor

### MEDIUM — Duzeltilmesi Oneriliyor
- [x] [AI-Review][MEDIUM] Null check eksik diff hesaplamasinda — signal=null vs signal=-20 false change event [live-monitor.js:668]
- [x] [AI-Review][MEDIUM] URL sema dogrulamasi yok — javascript: ve file: protokolleri kabul ediliyor [live-monitor.js:227]
- [x] [AI-Review][MEDIUM] Poll hatasi sessiz yutuluyor — [] donuyor, monitor:error emit edilmiyor [live-monitor.js:689]
- [x] [AI-Review][MEDIUM] Duplicate event emission — monitor:devicesUpdated + uisp:devicesUpdated ayni veri [live-monitor.js:718] → backward compat: eski v1 kodlari icin kasitli, yorum eklendi
- [x] [AI-Review][MEDIUM] State mutation race — matchDevicesToBuildings polling sirasinda _devices degistiriyor [live-monitor.js:834]
- [x] [AI-Review][MEDIUM] Reset sonrasi in-flight callback — chrome.runtime.sendMessage iptal edilmiyor [live-monitor.js:1383]
- [x] [AI-Review][MEDIUM] overlay.css fp-disc-pulse animasyonu tanimli degil — comparison marker'lar animasyon yok [overlay.css] → fp-disc-pulse zaten tanimli (line 2230)
- [x] [AI-Review][MEDIUM] main.js EventBus listener'lari eksik — uisp:devicesUpdated, metrics:updated dinlenmiyor [main.js:169]

### LOW — Iyilestirme
- [x] [AI-Review][LOW] O(n*m) hostname matching — name index ile O(1) lookup yap [live-monitor.js:607]
- [x] [AI-Review][LOW] Hardcoded threshold -25 vs CONSTANTS -20 dBm tutarsizligi [live-monitor.js:1273]
- [x] [AI-Review][LOW] fetchDevices() ve _pollCycle() birlesme logigini tekrarliyor — extract shared [live-monitor.js:965]
- [x] [AI-Review][LOW] _wordSimilarity() dokumantasyonu eksik — skor araligi ve esik degeri [live-monitor.js:119]
- [x] [AI-Review][LOW] Deep nesting karsilastirma fonksiyonunda — helper ile sadelelestir [live-monitor.js:1306]
- [x] [AI-Review][LOW] Scoreboard'da live cihaz sayisi gosterilmiyor [overlay.js:706]

_Reviewer: AI Code Review (Claude Opus 4.6) on 2026-03-07_

## Change Log
- 2026-03-04: v1 implement edildi — UISP + Zabbix + Karsilastirma tek IIFE
- 2026-03-05: Story yeniden yazildi — "Canli Izleme Harita Katmani" vizyonu, adaptor mimarisi, Steve Jobs tasarim felsefesi. Status: revision-needed
- 2026-03-05: v2 implement edildi — adaptor mimarisi, birlesik Device modeli, flicker-free guncelleme, warning status, popup canli veri
- 2026-03-07: AI code review tamamlandi — 7 HIGH, 8 MEDIUM, 6 LOW bulgu. Status: done
- 2026-03-07: Review follow-up'lar cozuldu — 21/21 bulgu adreslendi (15 kod duzeltmesi + 6 dogrulama). Status: review
