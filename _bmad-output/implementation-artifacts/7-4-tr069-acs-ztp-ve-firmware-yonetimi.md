# Story 7.4: TR-069 ACS Entegrasyonu, Zero Touch Provisioning ve Firmware Yonetimi

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Kapsam ve Iliski Notu

> **Bu story "Canli Izleme Harita Katmani" (7.1) ile FARKLI bir alandir.**
>
> 7.1/7.2/7.3 = Izleme (monitoring) — haritada cihaz durumu ve metrikleri GORME
> 7.4 = Yonetim (management) — cihazlara uzaktan MUDAHALE ETME (config push, firmware, ZTP)
>
> **Entegrasyon noktasi:** 7.1'deki cihaz popup'inda "Yeniden Baslat" veya "WiFi Ayarla"
> gibi AKSIYON butonlari, 7.4'teki AcsManager fonksiyonlarini cagirabilir.
> Yani 7.1 GOSTERIR, 7.4 YAPAR.
>
> **Mimari sinirlari:**
> - AcsManager kendi IIFE modulu (`lib/acs-manager.js`) — LiveMonitor'dan AYRI
> - Harici ACS sunucusu (GenieACS) GEREKTIRIR — Chrome Extension icinden ACS sunucusu calistirilamaz
> - Dashboard CPE sekmesi: harita katmanindan BAGIMSIZ, ayri yonetim paneli

## Story

As a ag yoneticisi,
I want TR-069/TR-369 protokolu uzerinden tum CPE cihazlarimi (ONT, router) uzaktan yonetebilmek, yeni cihazlari otomatik yapilandirabilmek ve firmware guncellemelerini toplu yapabilmek,
So that saha ziyaretlerini %60-70 azaltabileyim, yuzlerce cihaza tek seferde konfigürasyon/firmware dagitabileyim ve ZTP ile kutudan cikan cihazlar otomatik profil alsin.

## Acceptance Criteria (BDD)

1. **Given** ACS (Auto Configuration Server) modulu aktif olduGunda **When** TR-069 destekli bir CPE cihazi (TP-Link XC220-G3, Tenda, Cudy) aga baglandiginda **Then** cihaz otomatik olarak ACS'ye CWMP uzerinden kayit olmali **And** cihaz seri numarasi, MAC adresi, model ve firmware versiyonu ACS veritabanina kaydedilmeli **And** cihaz durumu dashboard'da goruntulenebilmeli.

2. **Given** ACS'ye kayitli bir cihaz mevcut olduGunda **When** yonetici uzaktan yonetim islemleri baslattiginda **Then** asagidaki islemler yapilabilmeli:
   - WiFi SSID ve sifre degisikligi
   - PPPoE kimlik bilgisi guncelleme
   - Bandwidth limiti ayarlama (VLAN profili)
   - Fabrika ayarlarina sifirlama
   - Uzaktan diagnostik (ping, traceroute, WiFi site survey)
   **And** islem sonucu (basarili/basarisiz) loglanmali ve bildirim uretilmeli.

3. **Given** yeni bir CPE cihazi sahaya gonderildiginde **When** cihaz elektrige takilip WAN (PPPoE) baglantisi kuruldugunda **Then** ZTP sureci otomatik baslamali:
   - Cihaz seri numarasiyla ACS'ye baglanmali
   - Onceden tanimlanmis profil (bandwidth limiti, VLAN, WiFi SSID, TR-069 ACS URL) otomatik yuklenmeli
   - Provisioning durumu (pending/in-progress/complete/failed) takip edilebilmeli
   **And** teknisyenin cihaza console ile baglanmasina gerek kalmamali.

4. **Given** firmware guncelleme plani olusturulduGunda **When** yonetici toplu guncelleme baslattiginda **Then** secilen cihaz grubuna (model bazli, lokasyon bazli, veya manual secim) firmware push yapilabilmeli **And** guncelleme oncesi otomatik config backup alinmali **And** basarisiz guncelleme durumunda otomatik rollback yapilabilmeli **And** guncelleme ilerleme durumu (kuyrukta/indiriliyor/kuruluyor/tamamlandi/basarisiz) canli izlenebilmeli.

5. **Given** ACS modulu calisirken **When** baglanti veya islem hatasi olustuGunda **Then** hata detayi loglanmali **And** yeniden deneme mekanizmasi (exponential backoff, max 3 retry) calismali **And** basarisiz islemler ayri kuyrukta listelenmeli.

## Tasks / Subtasks

- [x] Task 1: ACS Core Modulu (AC: #1, #5)
  - [x]1.1 `lib/acs-manager.js` IIFE modulu olustur — AcsManager global nesnesi
  - [x]1.2 CONSTANTS tanimla: CWMP_PORT (7547), INFORM_INTERVAL_S (300), MAX_RETRY (3), RETRY_BACKOFF_MS (5000), FIRMWARE_TIMEOUT_MS (600000)
  - [x]1.3 Private state: `_acsConfig` (serverUrl, port), `_devices` (Map<serialNumber, DeviceRecord>), `_pendingJobs` (Map), `_connectionStatus`
  - [x]1.4 `configure(config)` — ACS sunucu ayarlari kaydet (chrome.storage.local `fp_acs_config`)
  - [x]1.5 `handleInform(cwmpEnvelope)` — CPE INFORM mesaji isleme: cihaz kayit/guncelleme, parametre toplama
  - [x]1.6 `getRegisteredDevices()` — kayitli cihaz listesi (seri no, MAC, model, firmware, son baglanti zamani)
  - [x]1.7 `getDeviceParameters(serialNumber, parameterPaths[])` — TR-069 GetParameterValues RPC
  - [x]1.8 `setDeviceParameters(serialNumber, parameterValuePairs[])` — TR-069 SetParameterValues RPC
  - [x]1.9 Hata yonetimi: exponential backoff retry, basarisiz islem kuyrugu, EventBus entegrasyonu

- [x] Task 2: Cihaz Profil ve Sablon Sistemi (AC: #2, #3)
  - [x]2.1 `DeviceProfile` veri modeli: { profileId, name, targetModels[], parameters: { wifi: {ssid, password, channel}, wan: {pppoeUser, pppoePass}, bandwidth: {downMbps, upMbps}, vlan: {id, priority} } }
  - [x]2.2 `createProfile(profile)` / `updateProfile()` / `deleteProfile()` — profil CRUD
  - [x]2.3 `getProfileForDevice(serialNumber)` — seri numarasi veya model bazli profil esleme
  - [x]2.4 `applyProfile(serialNumber, profileId)` — profil parametrelerini TR-069 RPC ile cihaza push et
  - [x]2.5 Profil saklama: chrome.storage.local `fp_acs_profiles` (JSON array)

- [x] Task 3: Zero Touch Provisioning (ZTP) Motoru (AC: #3)
  - [x]3.1 `ZtpEngine` alt modulu: yeni cihaz tespit → profil esleme → otomatik provisioning pipeline
  - [x]3.2 ZTP durum makinesi: `pending` → `matched` → `provisioning` → `complete` | `failed`
  - [x]3.3 `onNewDeviceInform(device)` — yeni cihaz geldiginde: model kontrol → profil bul → provisioning baslat
  - [x]3.4 `getZtpStatus()` — tum ZTP islemlerinin durumu (pending/in-progress/complete/failed sayilari)
  - [x]3.5 `retryFailedZtp(serialNumber)` — basarisiz ZTP'yi tekrar dene

- [x] Task 4: Firmware Yonetimi (AC: #4)
  - [x]4.1 `FirmwareManager` alt modulu: firmware deposu, guncelleme planlama, toplu dagitim
  - [x]4.2 `addFirmware(firmwareRecord)` — firmware kaydı ekle: { id, model, version, url, checksum, releaseDate }
  - [x]4.3 `createUpdatePlan(plan)` — guncelleme plani: { targetGroup (model/location/manual), firmwareId, schedule, preBackup: true }
  - [x]4.4 `executeUpdatePlan(planId)` — toplu guncelleme baslat: siralı cihaz guncelleme (paralel limit: 5)
  - [x]4.5 TR-069 Download RPC kullanarak firmware push: `Download(fileType=1, url, fileSize, targetFileName)`
  - [x]4.6 Guncelleme oncesi otomatik config backup: `Upload(fileType=1)` ile mevcut config'i kaydet
  - [x]4.7 Rollback mekanizmasi: basarisiz guncelleme → onceki config'i geri yukle
  - [x]4.8 Guncelleme ilerleme izleme: kuyrukta/indiriliyor/kuruluyor/tamamlandi/basarisiz durumu per-cihaz

- [x] Task 5: Panel UI — ACS Yonetim Paneli (AC: #1, #2, #3, #4)
  - [x]5.1 Dashboard'a "CPE Yonetimi" sekmesi ekle
  - [x]5.2 Cihaz listesi gorunumu: seri no, model, firmware, son baglanti, durum ikonu, profil adi
  - [x]5.3 Cihaz detay paneli: uzaktan yonetim islemleri (WiFi, PPPoE, reset, diagnostik butonlari)
  - [x]5.4 Profil yonetim ekrani: profil olustur/duzenle/sil, parametre formu
  - [x]5.5 ZTP durum paneli: bekleyen/islenen/tamamlanan/basarisiz cihazlar
  - [x]5.6 Firmware guncelleme paneli: firmware listesi, guncelleme plani olustur, ilerleme izle
  - [x]5.7 ACS yapilandirma formu: sunucu ayarlari, test baglantisi

- [x] Task 6: EventBus ve Storage Entegrasyonu (AC: tumu)
  - [x]6.1 Event tanimlari: `acs:deviceRegistered`, `acs:deviceUpdated`, `acs:ztpComplete`, `acs:ztpFailed`, `acs:firmwareUpdateProgress`, `acs:firmwareUpdateComplete`
  - [x]6.2 Storage key'leri: `fp_acs_config`, `fp_acs_devices`, `fp_acs_profiles`, `fp_acs_firmware`, `fp_acs_jobs`
  - [x]6.3 LiveMonitor modulu ile entegrasyon: UISP cihaz verisi + ACS cihaz verisi birlestirme

## Dev Notes

### Mimari Kararlar

- **Yeni modul:** `lib/acs-manager.js` — TR-069 ACS islemleri, ZTP motoru, firmware yonetimi tek modülde
- **IIFE pattern:** Proje standarti — `const AcsManager = (() => { ... })()` global nesnesi
- **Storage:** chrome.storage.local kullan (`fp_acs_*` prefix). Cihaz sayisi yuzlerce olabilir — storage boyutu dikkat
- **LiveMonitor entegrasyonu:** AcsManager, LiveMonitor'un cihaz verileriyle senkronize calisir. Ayni cihaz hem UISP hem ACS'de olabilir — seri numarasi / MAC ile esleme

### TR-069 / CWMP Protokol Referansi

TR-069 (CWMP — CPE WAN Management Protocol) temel RPC'ler:
- **Inform:** CPE → ACS, periyodik durum bildirimi (bootstrap, periodic, value change, connection request)
- **GetParameterValues:** ACS → CPE, parametre okuma
- **SetParameterValues:** ACS → CPE, parametre yazma
- **Download:** ACS → CPE, firmware/config indirme komutu
- **Upload:** CPE → ACS, config/log yükleme
- **Reboot:** ACS → CPE, cihazi yeniden baslat
- **FactoryReset:** ACS → CPE, fabrika ayarlarina don

### Desteklenen Cihaz Matrisi

| Marka | Model | TR-069 | OMCI | PPPoE | Notlar |
|-------|-------|--------|------|-------|--------|
| TP-Link | XC220-G3 | Destekli | Destekli | Destekli | GPON ONT, ana cihaz |
| Tenda | HG9/V300 | Destekli | Destekli | Destekli | GPON ONT modelleri |
| Cudy | WiFi Router/Mesh/4G/5G | TR-069/098/111/181 | - | Destekli | Tum seriler destekli |

### Onemli TR-069 Parametre Yollari

```
InternetGatewayDevice.DeviceInfo.SerialNumber
InternetGatewayDevice.DeviceInfo.SoftwareVersion
InternetGatewayDevice.DeviceInfo.ModelName
InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANPPPConnection.1.Username
InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANPPPConnection.1.Password
InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSID
InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.PreSharedKey.1.KeyPassphrase
InternetGatewayDevice.ManagementServer.URL (ACS URL)
InternetGatewayDevice.ManagementServer.PeriodicInformInterval
```

### ACS Sunucu Mimarisi Notu

Chrome Extension icinden dogrudan ACS sunucusu calistirmak MUMKUN DEGIL — ACS sunucusu TCP/7547 portunda dinleyen bir sunucudur. Bu story icin iki secenek:

1. **Harici ACS entegrasyonu (Oneri):** GenieACS (acik kaynak), OpenACS veya FreeACS gibi mevcut ACS sunucusuna API uzerinden baglan. Dashboard'dan ACS API'sini cagir.
2. **Kendi ACS backend'imiz:** Node.js/Python backend ile kendi ACS'mizi yaz (Post-MVP backend plani ile uyumlu).

MVP icin **Secenek 1** (harici ACS API entegrasyonu) oneriliyor. GenieACS REST API:
- `GET /devices` — cihaz listesi
- `POST /devices/{id}/tasks` — cihaza gorev gonder (getParameterValues, setParameterValues, download, reboot)
- `GET /faults` — hata listesi
- `GET /presets` — ZTP profilleri (preset kurallar)

### Mevcut Kod ile Entegrasyon

- **LiveMonitor.js (Story 7.1):** UISP cihaz verileriyle birlestirme — ayni cihaz hem UISP hem ACS'de olabilir
- **Topology.js:** `PROJECT.adas[adaId].buildings` — bina-cihaz esleme icin
- **Panels.js:** Dashboard sekmesi olarak CPE Yonetimi ekleme
- **EventBus:** `EventBus.emit/on` — ACS eventleri icin
- **Storage:** `chrome.storage.local` — `fp_acs_*` prefix

### Yuklenme Sirasi (manifest.json)

Mevcut sira: ... → live-monitor.js → content/scraper.js → ...
Yeni sira: ... → live-monitor.js → **acs-manager.js** → content/scraper.js → ...

AcsManager, LiveMonitor'dan sonra yuklenmeli cunku LiveMonitor cihaz verilerini saglar.

### Dikkat Edilmesi Gerekenler

1. **ACS Sunucu Gereksinimi:** Bu story Chrome Extension'dan bagimsiz bir ACS sunucusu (GenieACS vb.) kurulmasini GEREKTIRIR. Extension sadece API client olarak calisir.
2. **CORS:** ACS API'sine Chrome Extension'dan fetch yapilirken CORS sorunu yasanabilir — background.js proxy gerekebilir.
3. **API Token guvenliği:** ACS API token'i chrome.storage.local'da plain text. Production icin encryption gerekir.
4. **Cihaz sayisi:** Yuzlerce cihaz olabilir — pagination ve lazy loading gerekli.
5. **Firmware boyutu:** Firmware dosyalari buyuk (10-50MB) — Extension'dan degil, ACS sunucusundan servis edilmeli.
6. **Rollback riskleri:** Firmware rollback basarisiz olursa cihaz brick olabilir — critical islem olarak logla ve onay iste.

### Project Structure Notes

- Yeni dosya: `fiber-chrome/lib/acs-manager.js`
- Degisecek dosyalar: `manifest.json` (js sirasi), `dashboard/dashboard.js` (CPE Yonetimi sekmesi), `dashboard/dashboard.html` (UI), `content/panels.js` (toolbar entegrasyonu)
- Dosya yolu kurali: lib/ → paylasilan moduller

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 7]
- [Source: Gemini arastirma raporu — TR-069, ZTP, Firmware ozellikleri]
- [Source: TR-069 Amendment 6 (TR-069a6) — CWMP protokol spesifikasyonu]
- [Source: GenieACS REST API — https://github.com/genieacs/genieacs]
- [Source: CLAUDE.md — Module System, Storage, IIFE pattern]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- AcsManager IIFE modulu olusturuldu: configure, testConnection, handleInform, fetchDevicesFromAcs, getDeviceParameters, setDeviceParameters, rebootDevice, factoryResetDevice, setWifi, setPPPoE, runDiagnostic
- Profil sistemi: createProfile, updateProfile, deleteProfile, getProfileForDevice, applyProfile
- ZTP motoru: _onNewDeviceInform, _runZtpProvisioning (exponential backoff auto-retry, max 3), getZtpStatus, retryFailedZtp (pending → matched → provisioning → retrying → complete | failed)
- Firmware yonetimi: addFirmware (URL/versiyon validasyon), createUpdatePlan, executeUpdatePlan (paralel limit: 5), _backupDeviceConfig, _rollbackConfig, _verifyFirmwareVersion (post-update dogrulama)
- Dashboard CPE Yonetimi sekmesi: 5 sub-tab (Cihazlar, Profiller, ZTP, Firmware, Yapilandirma)
- EventBus entegrasyonu: acs:deviceRegistered, acs:deviceUpdated, acs:ztpComplete, acs:ztpFailed, acs:firmwareUpdateProgress, acs:firmwareUpdateComplete, acs:error
- Storage: fp_acs_config, fp_acs_devices, fp_acs_profiles, fp_acs_firmware, fp_acs_jobs
- background.js proxy: POST method + body destegi mevcut (Story 7.2'de eklenmis)
- Hata yonetimi: exponential backoff retry (max 3), basarisiz islem kuyrugu, clearFailedJobs

### Completion Notes List
- Task 1: AcsManager IIFE modulu — GenieACS REST API istemcisi. configure(), testConnection(), handleInform(), fetchDevicesFromAcs(), getDeviceParameters/setDeviceParameters TR-069 RPC. Exponential backoff retry (max 3), basarisiz islem kuyrugu.
- Task 2: DeviceProfile veri modeli — CRUD (createProfile, updateProfile, deleteProfile). Model bazli otomatik esleme (getProfileForDevice). applyProfile() TR-069 SetParameterValues ile WiFi/PPPoE/VLAN parametrelerini push eder.
- Task 3: ZTP motoru — Yeni cihaz inform geldiginde otomatik profil esleme ve provisioning. Durum makinesi: pending → matched → provisioning → retrying → complete | failed. Auto-retry: exponential backoff (5s, 10s, 20s), max 3 deneme. retryFailedZtp() basarisiz ZTP'yi tekrar dener.
- Task 4: Firmware yonetimi — addFirmware() firmware deposu (URL zorunlu, format dogrulama). createUpdatePlan() guncelleme plani, executeUpdatePlan() toplu guncelleme (5 paralel limit). Oncesi otomatik config backup (backupResult plan.progress'e kaydedilir), basarisiz guncelleme icin rollback mekanizmasi. Post-update _verifyFirmwareVersion() ile versiyon dogrulama.
- Task 5: Dashboard CPE Yonetimi sekmesi — 5 sub-tab: Cihazlar (tablo + senkronizasyon + cihaz detay popup), Profiller (card grid + CRUD formlar), ZTP (durum sayaclari + tablo), Firmware (depo + guncelleme planlari), Yapilandirma (ACS URL + kurulum rehberi + basarisiz islemler).
- Task 6: EventBus 7 event tanimı. Storage 5 key (fp_acs_*). LiveMonitor entegrasyonu: getDeviceWithLiveData() UISP + ACS veri birlestirme. Dashboard init'de AcsManager.init() cagrisi. manifest.json'da yuklenme sirasi eklendi.
- v3 review fix: 16 bulgu incelendi — Basic auth, storage error callback, XSS escape, ZTP timer cleanup, firmware verify retry, createUpdatePlan persist, rollback format fix, _extractParam exact match, polling ZTP trigger, URL hostname validation

### File List
- fiber-chrome/lib/acs-manager.js (yeni — ACS core, profil, ZTP, firmware, storage)
- fiber-chrome/manifest.json (degistirildi — acs-manager.js yuklenme sirasi eklendi)
- fiber-chrome/content/main.js (degistirildi — AcsManager.init() eklendi)
- fiber-chrome/dashboard/dashboard.html (degistirildi — CPE Yonetimi nav butonu + acs-manager.js + event-bus.js script)
- fiber-chrome/dashboard/dashboard.js (degistirildi — renderCpe() + 5 sub-tab + event bindings + AcsManager.init())
- fiber-chrome/dashboard/dashboard.css (degistirildi — CPE sub-tab, form, card, badge stilleri)

## Review Follow-ups (AI)

### HIGH — Mutlaka Duzeltilmeli
- [x] [AI-Review][HIGH] Guvenlik: ACS API isteklerinde authentication/authorization eksik — herkes baglanabilir [acs-manager.js:71-107] → Basic auth destegi eklendi (config.username/password → Authorization header)
- [x] [AI-Review][HIGH] Race condition: paralel firmware update shared counter'lari sync olmadan degistiriliyor — progress asla tamamlanmaz [acs-manager.js:764-800] → YANLIS POZITIF: JS single-threaded, Promise callback'leri sirayla calisir — race condition yok
- [x] [AI-Review][HIGH] Storage hatasi: _save*() fonksiyonlari hata callback'i yok — sessiz veri kaybi [acs-manager.js:925-947] → _storageErrorHandler() eklendi, tum _save*() fonksiyonlarina callback olarak verildi
- [x] [AI-Review][HIGH] Device collision: ayni seri numarali cihazlar cakisma kontrolu yok — veri kaybi [acs-manager.js:230-260] → YANLIS POZITIF: Serial number TR-069 standartinda unique, handleInform mevcut alanlari koruyarak gunceller
- [x] [AI-Review][HIGH] XSS riski: event data'da sanitization yok — dashboard innerHTML ile render ederse stored XSS [acs-manager.js:60-64] → _escHtml() utility eklendi, dashboard.js _renderCpeDevices/_renderCpeProfiles/_renderCpeZtp fonksiyonlarinda cihaz verileri escape ediliyor
- [x] [AI-Review][HIGH] dashboard.js renderCpe() fonksiyonu TANIMLANMAMIS — CPE tab crash eder [dashboard.js:140] → YANLIS POZITIF: renderCpe() dashboard.js:3770'de tanimli

### MEDIUM — Duzeltilmesi Oneriliyor
- [x] [AI-Review][MEDIUM] ZTP setTimeout timer'lari temizlenmiyor — reset() sonrasi zombie timeout [acs-manager.js:609-645] → _ztpTimers Map eklendi, reset() icinde tum timer'lar clearTimeout ile temizleniyor
- [x] [AI-Review][MEDIUM] Firmware verification _acsFetchWithRetry yerine _acsFetch kullaniyor — tek hata = false negative [acs-manager.js:871-890] → _acsFetchWithRetry kullanacak sekilde degistirildi
- [x] [AI-Review][MEDIUM] O(n*m) profil esleme — 1000 cihaz x 100 profil = performans sorunu [acs-manager.js:515-538] → Kabul edilebilir: pratikte profil sayisi < 20, targetModels < 5 — O(n*m) ihmal edilebilir
- [x] [AI-Review][MEDIUM] createUpdatePlan() storage'a yazmiyor — extension reload'da planlar kayboluyor [acs-manager.js:725-738] → _saveJobs() cagrisi eklendi
- [x] [AI-Review][MEDIUM] Rollback yanlis parametre formati gonderiyor — rollback DAIMA basarisiz [acs-manager.js:909-919] → backupConfig'i GenieACS formatindan parameterValues array'ine donusturuyor
- [x] [AI-Review][MEDIUM] _extractParam() indexOf ile yanlis key eslemesi mumkun [acs-manager.js:325-338] → Tam eslesme veya '.' ayiracli endsWith pattern kullaniliyor
- [x] [AI-Review][MEDIUM] main.js AcsManager.init() LiveMonitor.init() tamamlanmadan calisiyor — race condition [main.js:150-159] → YANLIS POZITIF: await ile sequential calisir (satir 151 → 157)

### LOW — Iyilestirme
- [x] [AI-Review][LOW] Event isimlendirme tutarsizligi [acs-manager.js:events] → Kabul edilebilir: tum eventler tutarli acs:camelCase pattern kullanir
- [x] [AI-Review][LOW] Polling modunda ZTP tetiklenmiyor — sadece handleInform ile calisir [acs-manager.js:950] → fetchDevicesFromAcs() icerisinde isNew cihaz icin _onNewDeviceInform() cagrisi eklendi
- [x] [AI-Review][LOW] addFirmware() URL yapisini dogrulamiyor — http:// tek basina kabul ediliyor [acs-manager.js:682] → Hostname kontrolu eklendi (protocol sonrasi . iceren hostname zorunlu)

_Reviewer: AI Code Review (Claude Opus 4.6) on 2026-03-07_

## Change Log
- 2026-03-04: Story 7.4 implement edildi — TR-069 ACS entegrasyonu, ZTP motoru, firmware yonetimi, Dashboard CPE sekmesi tamamlandi
- 2026-03-05: Review duzeltmeleri — (1) ZTP auto-retry: exponential backoff max 3 deneme + retrying durumu, (2) Firmware validation: addFirmware URL zorunlu/format kontrolu + post-update _verifyFirmwareVersion, (3) Rollback bug fix: _backupDeviceConfig sonucu plan.progress'e kaydediliyor, (4) Kiril karakter hatasi duzeltildi (U+0430/U+0442 → Latin a/t), (5) Dashboard: ZTP retrying badge + firmware form URL dogrulama
- 2026-03-07: AI code review tamamlandi — 6 HIGH, 7 MEDIUM, 3 LOW bulgu. Status: in-progress
- 2026-03-07: Review follow-up'lar cozuldu — 16/16 bulgu adreslendi (10 kod duzeltmesi + 3 yanlis pozitif + 3 kabul edilebilir). Status: review
