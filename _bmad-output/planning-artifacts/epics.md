---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/architecture.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
---

# NVI FIBER - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for NVI FIBER, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

**Ada ve Bina Yonetimi (FR1-FR6) — MVP**
- FR1: Saha muhendisi, NVI portalinde bir ada secerek binalari ve bagimsiz bolum sayilarini otomatik tarayabilir
- FR2: Saha muhendisi, taranan binalari ada planina ekleyebilir veya cikarabilir
- FR3: Saha muhendisi, bina bilgilerini (tip, BB sayisi, koordinat) inline duzenleyebilir
- FR4: Saha muhendisi, birden fazla adayi bagimsiz olarak yonetebilir ve adalar arasi gecis yapabilir
- FR5: Sistem, NVI'dan cekilen ada/bina verilerini yerel veritabaninda (IndexedDB) cache'leyebilir
- FR6: Sistem, cache'lenmis verileri periyodik olarak NVI'dan delta kontrol ile guncelleyebilir

**OLT Yerlesimi ve Ag Topolojisi (FR7-FR11) — MVP**
- FR7: Sistem, agirlikli geometrik medyan ile optimal OLT konumunu hesaplayabilir (elektrik binasi tercihi)
- FR8: Saha muhendisi, OLT binasini manuel olarak secebilir veya degistirebilir
- FR9: Sistem, tek seviye MST (Prim algoritmasi) ile kablo rotalamasi olusturabilir
- FR10: Saha muhendisi, otomatik MST rotasini manuel modda duzenleyebilir (KABLO CIZ)
- FR11: Sistem, GPON port kapasitesini hesaplayabilir (128 BB/port, 64 ONT/port)

**Splitter ve Loss Budget Hesaplamalari (FR12-FR15) — MVP**
- FR12: Sistem, effBB (BB x penetrasyon orani) bazinda dogru splitter boyutu secebilir (1:8, 1:16, 1:32, cascade)
- FR13: Sistem, her bina icin loss budget hesaplayabilir (splitter + fiber + konnektor + ek kayiplari)
- FR14: Sistem, loss budget durumunu siniflandirabilir (OK: >=3 dB marj, WARNING: 0-3 dB marj, FAIL: <0 dB, 26.0 dB siniri)
- FR15: Saha muhendisi, penetrasyon oranini ada ve bina bazinda ayarlayabilir

**Kablo ve Envanter Yonetimi (FR16-FR20) — MVP**
- FR16: Sistem, MST topolojisine gore dogru kablo core sayilarini hesaplayabilir (backbone, distribution, drop, ring)
- FR17: Sistem, ekipman katalogundan otomatik envanter ve malzeme listesi uretebilir
- FR18: Saha muhendisi, katalogdaki birim fiyatlari guncelleyebilir
- FR19: Sistem, fiyat guncellendiginde tum ada maliyetlerini otomatik yeniden hesaplayabilir
- FR20: Sistem, toplam proje maliyetini hesaplayabilir

**Varyasyon Analizi (FR21-FR23) — MVP**
- FR21: Saha muhendisi, farkli penetrasyon oranlari ve fiber konfigurasyonlariyla varyasyon olusturabilir
- FR22: Saha muhendisi, en az 3 farkli senaryoyu yan yana karsilastirabilir
- FR23: Saha muhendisi, optimum senaryoyu secerek aktif plan olarak belirleyebilir

**Finansal Hesaplamalar ve Yatirim Yonetimi (FR24-FR31) — MVP**
- FR24: Sistem, aktif abone sayisina (effBB) gore MRR (Aylik Tekrarlayan Gelir) projeksiyonu hesaplayabilir
- FR25: Sistem, yatirim maliyeti vs gelir projeksiyon karsilastirmasiyla ROI hesaplayabilir
- FR26: Saha muhendisi, MRR ve ROI verilerini tek ekrandan goruntuleyebilir
- FR27: Saha muhendisi, anten maliyetlerini (tip, adet, birim fiyat) yatirim hesabina dahil edebilir
- FR28: Saha muhendisi, OLT cihaz maliyetlerini (model, port sayisi, birim fiyat) yatirim hesabina dahil edebilir
- FR29: Saha muhendisi, switch, router ve diger aktif ekipman maliyetlerini tanimlayabilir
- FR30: Sistem, toplam yatirim maliyetini fiber altyapi + aktif ekipman + modem + kampanya maliyetlerinin butunu olarak hesaplayabilir
- FR31: Sistem, ROI hesabini tum yatirim kalemleri dahil edilerek (altyapi + ekipman + operasyonel) sunabilir

**Modem ve CPE Maliyet Yonetimi (FR32-FR34) — MVP**
- FR32: Saha muhendisi, envanterde modemleri "ucretli satis" veya "ucretsiz verilme" olarak isaretleyebilir
- FR33: Sistem, modem verilme durumuna gore ek maliyetleri (abone basina modem maliyeti) otomatik hesaplayabilir
- FR34: Sistem, ucretli vs ucretsiz modem senaryolarinin toplam maliyete etkisini karsilastirabilir

**Taahut ve Abonelik Modelleri (FR35-FR40) — MVP**
- FR35: Saha muhendisi, taahutlu abonelik modeli tanimlayabilir (orn. 12 ay, 24 ay sureli)
- FR36: Saha muhendisi, taahutsuz model tanimlayabilir (modem satisi, sozlesme yok)
- FR37: Saha muhendisi, kampanya parametreleri girebilir (X ay ucretsiz, X ay %Y indirim)
- FR38: Sistem, farkli taahut modellerinin MRR ve ROI uzerindeki etkisini hesaplayabilir
- FR39: Sistem, taahut karsilama maliyetini (ucretsiz aylar, indirimler, modem maliyeti) toplam yatirima dahil edebilir
- FR40: Saha muhendisi, birden fazla taahut senaryosunu yan yana karsilastirabilir

**Pazarlama Strateji Veri Tabani - Data House (FR41-FR44) — MVP**
- FR41: Sistem, farkli senaryo sonuclarini (penetrasyon, taahut modeli, modem politikasi, kampanya) yapilandirilmis veri olarak saklayabilir
- FR42: Saha muhendisi, gecmis senaryo verilerinden bolge bazli pazarlama stratejisi karsilastirmasi yapabilir
- FR43: Sistem, senaryo verilerini disa aktarilabilir formatta sunabilir
- FR44: Sistem, ada/bolge bazinda en karli strateji kombinasyonunu (taahut + modem + kampanya) ozetleyebilir

**Harita ve Gorsellestirme (FR45-FR50) — MVP**
- FR45: Sistem, NVI portali uzerinde bagimsiz Leaflet harita overlay'i olusturabilir (uydu gorunumu)
- FR46: Sistem, binalari tip bazli renkli pentagon ikonlarla gosterebilir (OLT, MDU Large, MDU Medium, SFU)
- FR47: Sistem, kablo rotalarini harita uzerinde cizgi olarak gorsellestirebilir
- FR48: Sistem, ada sinirlarini harita uzerinde poligon olarak gosterebilir
- FR49: Sistem, secilen adanin komsu adalarini harita uzerinde sematik olarak gosterebilir
- FR50: Saha muhendisi, komsu adaya tiklayarak seri planlama akisina gecebilir

**Isi Haritalari ve Bolgesel Analiz (FR51-FR54) — MVP**
- FR51: Sistem, potansiyel musteri yogunlugunu harita uzerinde isi haritasi olarak gorsellestirebilir (BB sayisi, penetrasyon potansiyeli bazli)
- FR52: Sistem, ariza yogunlugunu harita uzerinde isi haritasi olarak gorsellestirebilir (bolge/ada bazli)
- FR53: Saha muhendisi, isi haritasi katmanlarini acip kapatabilir ve filtreleyebilir
- FR54: Sistem, isi haritasi verilerini bolgesel yatirim onceliklendirmesi icin kullanabilir

**Tek Ekran Panel Sistemi (FR55-FR58) — MVP**
- FR55: Saha muhendisi, topoloji planlamasi, envanter, MRR/ROI ve ada yonetimini tek ekrandan erisebilir
- FR56: Saha muhendisi, panel/sekme sistemiyle farkli gorunumler arasinda gecis yapabilir
- FR57: Sistem, ada bazli listeleme ile tum planlanan adalarin ozet gorunumunu gosterebilir
- FR58: Sistem, ada durum gostergelerini gosterebilir (tamamlanmis, devam ediyor, planlanmamis)

**Kalite Degerlendirme (FR59-FR60) — MVP**
- FR59: Sistem, topolojiyi 6 agirlikli kategoride otomatik degerlendirebilir (loss budget, standartlar, splitter, OLT, kablo, maliyet)
- FR60: Sistem, loss budget asimi veya uyari durumlarini harita uzerinde gorsel olarak isaretleyebilir

**Veri Depolama ve Sureklilik (FR61-FR64) — MVP**
- FR61: Sistem, tum proje verilerini IndexedDB'de kalici olarak saklayabilir
- FR62: Sistem, offline calisma destegi saglayabilir (internet baglantisi olmadan mevcut verilerle calisma)
- FR63: Saha muhendisi, gecmis hesaplamalara ve kayitli planlara geri donebilir
- FR64: Sistem, proje verilerini JSON/CSV/GeoJSON formatinda disa aktarabilir

**Erisim Kontrolu (FR65-FR67) — MVP**
- FR65: Yonetici, yeni kullanicilarin extension erisimini onaylayabilir veya reddedebilir
- FR66: Kullanici, extension kurulumu sonrasi aktivasyon kodu ile erisim talep edebilir
- FR67: Sistem, onaylanmamis kullanicilarin extension islevlerine erisimini engelleyebilir

**Canli Ag Izleme Altyapisi (FR68-FR72) — Post-MVP**
- FR68: Sistem, mevcut switch/anten/router cihaz envanterini canli ag topolojisiyle eslestirebilir
- FR69: Sistem, UBNT UISP modulunden cihaz durum verilerini cekebilir
- FR70: Sistem, Zabbix benzeri ag izleme metriklerini (uptime, trafik, hata orani) panelde gosterebilir
- FR71: Saha muhendisi, planlanan topoloji ile canli ag durumunu ayni harita uzerinde karsilastirabilir
- FR72: Sistem, cihaz bazli performans grafiklerini monitor edebilir

**Uzaktan Cihaz Yonetimi ve Trafik Analizi (FR78-FR83) — Post-MVP Ek**
- FR78: Sistem, TR-069/TR-369 protokolu uzerinden CPE cihazlarini (ONT, router) uzaktan yonetebilir (WiFi, PPPoE, bandwidth, reset, diagnostik)
- FR79: Sistem, yeni CPE cihazlarini Zero Touch Provisioning ile otomatik yapilandirabilir (seri no bazli profil esleme)
- FR80: Sistem, cihaz gruplarına toplu firmware guncelleme dagitabilir (pre-backup, rollback destegi)
- FR81: Sistem, NetFlow/sFlow/IPFIX flow verilerini toplayip analiz edebilir (top talkers, uygulama dagilimi, anomali tespiti)
- FR82: Sistem, abone bazinda QoE skoru (0-100) hesaplayabilir (latency, jitter, packet loss, throughput)
- FR83: Abone, self-servis web portali uzerinden fatura, paket, hiz testi, destek talebi ve WiFi yonetimi yapabilir

**Yapay Zeka Destekli Proaktif Ariza Yonetimi (FR73-FR77) — Vizyon**
- FR73: Sistem, ag metriklerindeki anormallikleri tespit ederek musteri bildirmeden once arizayi sezebilir
- FR74: Sistem, gecmis ariza verilerinden oruntu cikararak olasi ariza noktalarini onceden tahmin edebilir
- FR75: Sistem, tespit edilen anomali ve tahminler icin otomatik uyari ve onlem is akisi olusturabilir
- FR76: Sistem, musteri ariza deneyimini minimize etmek icin onleyici bakim onerileri sunabilir
- FR77: Sistem, ariza tahmin modellerini gercek verilerle surekli ogrenerek iyilestirebilir

### NonFunctional Requirements

**Performans**
- NFR1: PonEngine ada bazli hesaplama suresi: < 100ms (50 binaya kadar)
- NFR2: NVI bina listesi scraping suresi: < 2 saniye
- NFR3: Harita render (50+ ada gosteriminde): < 500ms, akici pan/zoom
- NFR4: IndexedDB okuma/yazma: < 50ms (kullanici fark etmeyecek duzeyde)
- NFR5: Varyasyon karsilastirma: 3+ senaryo paralel hesaplama < 300ms
- NFR6: Isi haritasi katman render: < 1 saniye

**Guvenlik**
- NFR7: Topoloji ve altyapi verileri IndexedDB'de sifrelenmis olarak saklanir
- NFR8: Extension erisimi aktivasyon kodu/yonetici onayi olmadan kullanilamaz
- NFR9: Disa aktarilan veriler (JSON/CSV/GeoJSON) hassas veri uyarisi icerir
- NFR10: chrome.storage.local'da saklanan ayar verileri kullanici kimligine baglidir
- NFR11: Post-MVP backend entegrasyonunda tum iletisim HTTPS uzerinden sifrelenmis olacak

**Olceklenebilirlik**
- NFR12: MVP'de 2 eszamanli kullanici, bagimsiz yerel veritabanlari
- NFR13: Tek kullanici kapasitesi: 500+ ada, 10.000+ bina verisi IndexedDB'de sorunsuz
- NFR14: IndexedDB veri boyutu: 100MB'a kadar performans kaybi olmadan
- NFR15: Post-MVP: Backend ile coklu kullanici destegine gecis altyapisi hazir

**Entegrasyon**
- NFR16: NVI portal DOM yapisi degistiginde sadece scraper modulu guncellenir, diger moduller etkilenmez
- NFR17: NVI Leaflet instance'ina MAIN world injection ile koordinat yakalama guvenilir calisir
- NFR18: CSP kisitlamalarina uygun tile yukleme (blob URL yaklasimi) kesintisiz calisir
- NFR19: Post-MVP: UBNT UISP API entegrasyonu icin standart REST API istemci altyapisi
- NFR20: Post-MVP: Zabbix SNMP/API entegrasyonu icin veri toplama arayuzu

**Guvenilirlik**
- NFR21: Offline calisma: Internet baglantisi kesildiginde mevcut IndexedDB verileriyle tam islevsellik
- NFR22: Veri kaybi onleme: Her hesaplama/degisiklik sonrasi otomatik kayit
- NFR23: IndexedDB migrasyon: chrome.storage.local'dan geciste sifir veri kaybi garantisi
- NFR24: Hata durumunda kurtarma: Hesaplama hatasi tum sistemi kilitlemez, sadece ilgili ada etkilenir
- NFR25: Tarayici cokmesi sonrasi: Son kaydedilmis durumdan devam edebilme

**Loglama ve Izlenebilirlik**
- NFR26: Tum arka plan islemleri zaman damgali log kaydi tutar
- NFR27: Log seviyeleri: DEBUG, INFO, WARNING, ERROR — filtrelenebilir
- NFR28: Hata durumlarinda detayli log ile sorun kaynagi hizla tespit edilebilir
- NFR29: Log gecmisi IndexedDB'de saklanir, disa aktarilabilir

**Geri Al / Ileri Al (Undo/Redo)**
- NFR30: Kullanici islemleri (bina ekleme/cikarma, OLT degistirme, kablo duzenleme, fiyat guncelleme, penetrasyon degisikligi) geri alinabilir
- NFR31: Geri alinan islem ileri alinabilir (redo)
- NFR32: Islem gecmisi oturum boyunca korunur
- NFR33: Toplu islemler tek adimda geri alinabilir

**Otomatik Yedekleme**
- NFR34: Sistem 10 dakikada bir otomatik yedek alir (IndexedDB snapshot)
- NFR35: Yedek gecmisi: en az son 6 yedek saklanir (1 saatlik gecmis)
- NFR36: Kullanici istedigi yedege geri donebilir
- NFR37: Yedekleme arka planda sessizce calisir, kullanici is akisini kesmez

### Additional Requirements

**Mimari Ek Gereksinimler (Architecture.md kaynakli):**

- Starter template UYGULANAMAZ — brownfield proje, mevcut calisan Chrome Extension uzerine hibrit gecis
- EventBus modulu tum yeni modullerin bagimliligi olarak ilk uygulanmali (implementasyon sirasi #1)
- IndexedDB 7 store sema tasarimi: adas, buildings, calculations, settings, backups, logs, nviCache
- Dual-read migrasyon stratejisi: chrome.storage.local → IndexedDB gecisinde eski veri okunabilir kalmali
- Command Pattern ile undo/redo: her islem {do, undo} cifti olarak tanimlanmali
- IIFE modul pattern ZORUNLU, import/export YASAK — tum moduller const ModuleName = (() => { ... })() sablonunda
- manifest.json yukleme sirasi kritik — 20 dosya bagimlilik sirasina gore yuklenir
- Error Boundary pattern: her modulde try/catch ile hata izolasyonu, ada bazinda bagimsilik
- Canvas overlay ile isi haritasi — ozel canvas katmani, Leaflet entegrasyonu
- Katman kontrol paneli — Leaflet layer control tarzi, katmanlar bagimsiz acilip kapanir
- Hibrit panel sistemi: 3 ana sekme (Planlama | Analiz | Yonetim) + accordion alt bolumler
- Aktivasyon sistemi: anahtar cifti ile yerel dogrulama, backend gerektirmez
- Sifreleme: obfuscation (XOR/Base64) MVP icin yeterli, backend ile guclendirilir
- fp- CSS prefix, fp_ storage prefix, [ModuleName] log prefix ZORUNLU
- EventBus namespace:action formati (orn: ada:created, building:added, storage:saved)
- JSON serilestirilebilir veri yapilari — Date objesi yok, ISO string kullan
- Veri yapilari: explicit null (undefined YASAK), boolean true/false (1/0 yok)
- ID olusturma: Date.now().toString(36) veya crypto.randomUUID()
- Implementasyon sirasi: EventBus → Debug genisletme → IndexedDB Storage → CommandManager → Aktivasyon → Panel sistemi → Hesaplama modulleri → Isi haritasi → Katman kontrol → Yedekleme

**UX Ek Gereksinimler (UX Design Specification kaynakli):**

- "Ada durumu bir bakista" scoreboard deneyimi: loss budget durumu, toplam maliyet, MRR, ada kalite skoru — ada acildiginda 5 saniyede kavranabilmeli
- Harita-merkezli kesif deneyimi: binaya tik → detay, kabloya tik → mesafe/core, OLT'ye tik → port durumu
- 5 dakika icinde karar verebilme hedefi: "Bu adada ne yapmaliyim?" sorusuna net cevap
- Zahmetsiz etkilesimler: splitter boyutu, kablo kor sayisi, loss budget, envanter kalemleri — tamamen otomatik hesaplanmali
- Kullanicinin ASLA yapmamasi gerekenler: manuel kor hesabi, splitter secimi, envanter sayimi, loss budget hesabi
- Kritik basari anlari (hata toleransi sifir): kablo kor sayilari, cihaz envanteri, loss budget dogrulugu
- Panel bazli overlay NVI portal uzerine — NVI'nin kendi DOM'u ve haritasiyla gorsel catisma onlenmeli
- Masaustu/monitor odakli tasarim (ofis ortami) — mouse/keyboard giris
- Bilgi yogunlugu vs kavrama hizi dengelenmeli — veri hiyerarsik ve taranabilir sunulmali
- Brownfield UX gecisi: mevcut kullanim aliskanliklari bozulmadan yeni deneyim sunulmali
- Hizli varyasyon karsilastirma: farkli senaryolar yan yana, aninda gorsel fark analizi

### FR Coverage Map

| FR | Epic | Aciklama |
|----|------|----------|
| FR1 | Epic 2 | NVI portalinde ada secimi ve bina tarama |
| FR2 | Epic 2 | Bina ekleme/cikarma |
| FR3 | Epic 2 | Bina bilgisi inline duzenleme |
| FR4 | Epic 2 | Coklu ada yonetimi ve gecis |
| FR5 | Epic 1 | NVI verilerini IndexedDB'de cache'leme |
| FR6 | Epic 1 | Cache delta kontrol ve guncelleme |
| FR7 | Epic 2 | OLT optimal konum hesaplama |
| FR8 | Epic 2 | OLT binasi manuel secimi |
| FR9 | Epic 2 | Tek seviye MST kablo rotalamasi |
| FR10 | Epic 2 | Manuel kablo duzenleme (KABLO CIZ) |
| FR11 | Epic 2 | GPON port kapasite hesabi |
| FR12 | Epic 2 | Splitter boyutu secimi (effBB bazli) |
| FR13 | Epic 2 | Bina bazli loss budget hesabi |
| FR14 | Epic 2 | Loss budget durum siniflandirmasi (OK/WARNING/FAIL) |
| FR15 | Epic 2 | Penetrasyon orani ayarlama (ada/bina bazli) |
| FR16 | Epic 2 | Kablo core sayisi hesabi |
| FR17 | Epic 3 | Otomatik envanter ve malzeme listesi |
| FR18 | Epic 3 | Katalog birim fiyat guncelleme |
| FR19 | Epic 3 | Fiyat degisiminde otomatik maliyet yeniden hesaplama |
| FR20 | Epic 3 | Toplam proje maliyeti hesabi |
| FR21 | Epic 4 | Varyasyon olusturma (penetrasyon/konfigurasyon) |
| FR22 | Epic 4 | En az 3 senaryo yan yana karsilastirma |
| FR23 | Epic 4 | Optimum senaryo secimi |
| FR24 | Epic 5 | MRR projeksiyonu hesabi |
| FR25 | Epic 5 | ROI hesabi (yatirim vs gelir) |
| FR26 | Epic 5 | MRR/ROI tek ekrandan goruntuleme |
| FR27 | Epic 5 | Anten maliyetlerini yatirima dahil etme |
| FR28 | Epic 5 | OLT cihaz maliyetlerini yatirima dahil etme |
| FR29 | Epic 5 | Aktif ekipman maliyet tanimlama |
| FR30 | Epic 5 | Toplam yatirim maliyeti (fiber+ekipman+modem+kampanya) |
| FR31 | Epic 5 | ROI tum yatirim kalemleri dahil |
| FR32 | Epic 5 | Modem ucretli/ucretsiz isaretleme |
| FR33 | Epic 5 | Modem maliyet otomatik hesaplama |
| FR34 | Epic 5 | Ucretli vs ucretsiz modem karsilastirma |
| FR35 | Epic 5 | Taahutlu abonelik modeli |
| FR36 | Epic 5 | Taahutsuz model |
| FR37 | Epic 5 | Kampanya parametreleri |
| FR38 | Epic 5 | Taahut modellerinin MRR/ROI etkisi |
| FR39 | Epic 5 | Taahut karsilama maliyeti |
| FR40 | Epic 5 | Birden fazla taahut senaryosu karsilastirma |
| FR41 | Epic 6 | Senaryo sonuclarini yapilandirilmis saklama |
| FR42 | Epic 6 | Bolge bazli pazarlama stratejisi karsilastirma |
| FR43 | Epic 6 | Senaryo verilerini disa aktarma |
| FR44 | Epic 6 | En karli strateji kombinasyonu ozeti |
| FR45 | Epic 2 | Leaflet harita overlay (uydu gorunumu) |
| FR46 | Epic 2 | Tip bazli renkli pentagon ikonlar |
| FR47 | Epic 2 | Kablo rotalari harita cizgisi |
| FR48 | Epic 2 | Ada sinirlari poligon gosterimi |
| FR49 | Epic 6 | Komsu ada sematik gosterimi |
| FR50 | Epic 6 | Komsu adaya tiklayarak seri planlama |
| FR51 | Epic 6 | Potansiyel musteri yogunlugu isi haritasi |
| FR52 | Epic 6 | Ariza yogunlugu isi haritasi |
| FR53 | Epic 6 | Isi haritasi katman ac/kapa ve filtreleme |
| FR54 | Epic 6 | Isi haritasi verileriyle yatirim onceliklendirme |
| FR55 | Epic 3 | Tek ekrandan tum islevlere erisim |
| FR56 | Epic 3 | Panel/sekme gecis sistemi |
| FR57 | Epic 3 | Ada bazli listeleme ozet gorunumu |
| FR58 | Epic 3 | Ada durum gostergeleri |
| FR59 | Epic 2 | 6 kategorili kalite degerlendirme |
| FR60 | Epic 2 | Loss budget uyari gorsel isaretleme |
| FR61 | Epic 1 | IndexedDB kalici veri saklama |
| FR62 | Epic 1 | Offline calisma destegi |
| FR63 | Epic 1 | Gecmis hesaplara geri donus |
| FR64 | Epic 1 | JSON/CSV/GeoJSON disa aktarim |
| FR65 | Epic 1 | Yonetici erisim onay/red |
| FR66 | Epic 1 | Aktivasyon kodu ile erisim talebi |
| FR67 | Epic 1 | Onaylanmamis kullanici engelleme |
| FR68 | Epic 7 | Cihaz envanteri canli topoloji eslestirme (Post-MVP) |
| FR69 | Epic 7 | UBNT UISP cihaz durum verisi (Post-MVP) |
| FR70 | Epic 7 | Zabbix ag izleme metrikleri (Post-MVP) |
| FR71 | Epic 7 | Planlanan vs canli ag karsilastirma (Post-MVP) |
| FR72 | Epic 7 | Cihaz performans grafikleri (Post-MVP) |
| FR73 | Epic 8 | Anomali tespiti (Vizyon) |
| FR74 | Epic 8 | Ariza tahmini (Vizyon) |
| FR75 | Epic 8 | Otomatik uyari is akisi (Vizyon) |
| FR76 | Epic 8 | Onleyici bakim onerileri (Vizyon) |
| FR77 | Epic 8 | Model surekli iyilestirme (Vizyon) |

## Epic List

### Epic 1: Guvenli Erisim ve Veri Altyapisi
Muhendis extension'i guvenli sekilde aktive eder, tum veriler IndexedDB'ye migrate edilir, offline calisir, islemlerini geri alabilir ve otomatik yedeklerden faydalanir.
**FR kapsami:** FR5, FR6, FR61, FR62, FR63, FR64, FR65, FR66, FR67
**NFR kapsami:** NFR4, NFR7, NFR8, NFR9, NFR10, NFR12-14, NFR21-29, NFR30-37
**Teknik altyapi:** EventBus, Debug genisletme, IndexedDB Storage + dual-read migrasyon, CommandManager (undo/redo), Activation sistemi, otomatik yedekleme

### Epic 2: Ada Topoloji Planlama ve Harita Deneyimi
Muhendis NVI portalinde ada secer, binalar otomatik taranir, OLT yerlestirilir, MST kablo rotalamasi olusur, splitter'lar hesaplanir, loss budget dogrulanir, kablo cor sayilari belirlenir — tumu harita uzerinde gorsellestirilir ve kalite degerlendirmesi yapilir.
**FR kapsami:** FR1, FR2, FR3, FR4, FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR16, FR45, FR46, FR47, FR48, FR59, FR60
**NFR kapsami:** NFR1, NFR2, NFR3, NFR16, NFR17, NFR18
**Teknik altyapi:** PonEngine (korunacak), Topology (korunacak), Scraper (korunacak), Overlay (temel genisletme), Panels (temel yeniden yazim), MapUtils (korunacak)

### Epic 3: Envanter, Maliyet ve Tek Ekran Yonetimi
Sistem otomatik envanter ve malzeme listesi uretir, muhendis katalog fiyatlarini gunceller, tum maliyetler aninda yeniden hesaplanir. Topoloji, envanter ve ada yonetimi tek ekrandan erisilebilir hale gelir.
**FR kapsami:** FR17, FR18, FR19, FR20, FR55, FR56, FR57, FR58
**Teknik altyapi:** Panels hibrit sekme sistemi (Planlama | Analiz | Yonetim) + accordion alt bolumler, ada bazli listeleme, durum gostergeleri

### Epic 4: Varyasyon Analizi ve Senaryo Karsilastirma
Muhendis farkli penetrasyon oranlari ve fiber konfigurasyonlariyla varyasyonlar olusturur, en az 3 senaryoyu yan yana karsilastirir ve optimum senaryoyu aktif plan olarak belirler.
**FR kapsami:** FR21, FR22, FR23
**NFR kapsami:** NFR5
**Teknik altyapi:** Variation modulu, yan yana tablo UI (sutunlarda senaryolar, satirlarda metrikler)

### Epic 5: Finansal Analiz ve Yatirim Yonetimi
Muhendis MRR/ROI hesaplarini gorur, tum yatirim kalemlerini (fiber + aktif ekipman + modem + kampanya) yonetir, modem maliyet politikalarini belirler, taahut modellerini tanimlar ve farkli senaryolari karsilastirir.
**FR kapsami:** FR24, FR25, FR26, FR27, FR28, FR29, FR30, FR31, FR32, FR33, FR34, FR35, FR36, FR37, FR38, FR39, FR40
**Teknik altyapi:** Financial modulu (MRR/ROI + taahut/kampanya + modem maliyet yonetimi)

### Epic 6: Pazarlama Stratejisi ve Bolgesel Planlama
Muhendis senaryo verilerini yapilandirilmis sekilde saklar, bolge bazli pazarlama stratejisi karsilastirmasi yapar, isi haritalarindan faydalanir ve komsu adalara gecis yaparak seri planlama gerceklestirir.
**FR kapsami:** FR41, FR42, FR43, FR44, FR49, FR50, FR51, FR52, FR53, FR54
**NFR kapsami:** NFR6
**Teknik altyapi:** Pazarlama Data House, HeatMap canvas overlay, komsu ada sematigi, katman kontrol paneli

### Epic 7: Canli Ag Izleme (Post-MVP)
Muhendis planlanan topolojiyi canli ag durumuyla karsilastirir, cihaz performansini izler, UISP/Zabbix metriklerini goruntuler.
**FR kapsami:** FR68, FR69, FR70, FR71, FR72
**NFR kapsami:** NFR19, NFR20

### Epic 8: AI Destekli Proaktif Ariza Yonetimi (Vizyon)
Sistem ag metriklerinde anomali tespit eder, ariza tahmin eder, onleyici bakim onerir ve modelleri gercek verilerle surekli iyilestirir.
**FR kapsami:** FR73, FR74, FR75, FR76, FR77

---

## Epic 1: Guvenli Erisim ve Veri Altyapisi

Muhendis extension'i guvenli sekilde aktive eder, tum veriler IndexedDB'ye migrate edilir, offline calisir, islemlerini geri alabilir ve otomatik yedeklerden faydalanir.

### Story 1.1: Olay Sistemi ve Gelismis Loglama

As a saha muhendisi,
I want sistem olaylarini ve hatalari seviye bazli izleyebilmek,
So that sorunlari hizla tespit edip cozebilirim.

**Acceptance Criteria:**

**Given** extension yuklendiginde
**When** herhangi bir modul olay yayinladiginda (emit)
**Then** EventBus namespace:action formatinda (orn: ada:created, building:added) olayi kaydetmeli ve dinleyicilere iletmeli
**And** EventBus on/off/emit API'si tum modullerden erisilebilir olmali

**Given** sistem calisiyor ve islemler gerceklesiyorken
**When** bir log mesaji uretildiginde
**Then** mesaj [ModuleName] prefix'i ile seviye bazli (DEBUG/INFO/WARNING/ERROR) kaydedilmeli
**And** loglar IndexedDB logs store'una zaman damgasiyla yazilmali

**Given** loglar IndexedDB'de biriktiginde
**When** kullanici loglari filtrelemek istediginde
**Then** seviye bazli filtreleme calismali (sadece ERROR goster, WARNING+ goster vb.)
**And** log gecmisi disa aktarilabilir olmali

**Teknik Notlar:**
- EventBus modulu (lib/event-bus.js) — IIFE pattern, manifest.json'da debug.js'ten sonra yuklenir
- Debug modulu genisletme (lib/debug.js) — mevcut ws-bridge korunur, seviye destegi + IndexedDB log store eklenir
- Payload formati: { type: 'namespace:action', data: { ... }, timestamp: ISO_string }

### Story 1.2: IndexedDB Veri Katmani ve Migrasyon

As a saha muhendisi,
I want tum proje verilerimin guvenli ve kalici bir veritabaninda saklanmasini,
So that buyuk veri setleriyle (500+ ada, 10.000+ bina) performans kaybi olmadan calisabileyim.

**Acceptance Criteria:**

**Given** extension ilk kez yuklendiginde (yeni kurulum)
**When** Storage modulu baslatildiginda
**Then** IndexedDB 7 store ile olusturulmali: adas, buildings, calculations, settings, backups, logs, nviCache
**And** her store dogru index'lerle (by_adaId, by_timestamp vb.) yapilandirilmali

**Given** kullanicinin mevcut chrome.storage.local'da verileri varken
**When** extension guncelleme sonrasi ilk calistiginda
**Then** dual-read migrasyon baslamali: once IndexedDB'den oku, yoksa chrome.storage.local'dan oku ve IndexedDB'ye yaz
**And** migrasyon sirasinda sifir veri kaybi garantisi saglanmali (NFR23)
**And** migrasyon tamamlandiginda basari mesaji loglanmali

**Given** IndexedDB aktif ve calisiyor olduGunda
**When** veri okuma/yazma islemleri yapildiginda
**Then** islem suresi < 50ms olmali (NFR4)
**And** 100MB'a kadar veri boyutunda performans kaybi olmamali (NFR14)

**Given** IndexedDB'de sifreli veri saklama aktif olduGunda
**When** veri yazildiginda
**Then** veriler obfuscation (XOR/Base64) ile sifrelenmeli (NFR7)
**And** okuma sirasinda seffaf sekilde cozulmeli

**Teknik Notlar:**
- Storage modulu yeniden yazimi (lib/storage.js) — IndexedDB coklu store + dual-read migrasyon
- Mevcut Storage API korunur (save/load/delete), arka plan IndexedDB'ye cevirilir
- fp_ prefix ile anahtar uyumu korunur

### Story 1.3: NVI Veri Cache ve Delta Guncelleme

As a saha muhendisi,
I want NVI'dan cekilen ada ve bina verilerinin yerel veritabaninda cache'lenmesini,
So that ayni verileri tekrar tekrar NVI'dan cekmek zorunda kalmayayim ve daha hizli calisabileyim.

**Acceptance Criteria:**

**Given** NVI portalinde bir ada ilk kez tarandiginda
**When** scraper bina verilerini cektiginde
**Then** veriler IndexedDB nviCache store'una kaydedilmeli (ada kodu, bina listesi, BB sayilari, zaman damgasi)
**And** sonraki kullanimda once cache'den okunmali

**Given** cache'de mevcut bir ada verisi varken
**When** kullanici ayni adayi tekrar actiginda
**Then** sistem once cache'deki veriyi yuklemeli
**And** delta kontrol ile NVI'daki guncel veriyle karsilastirmali
**And** degisiklik varsa cache guncellemeli, yoksa mevcut cache'i kullanmali

**Given** internet baglantisi olmayan bir ortamda
**When** kullanici daha once cache'lenmis bir adayi actiginda
**Then** cache'deki verilerle tam islevsellik saglanmali

**Teknik Notlar:**
- NviCache modulu (content/nvi-cache.js) — IIFE pattern
- IndexedDB nviCache store'u kullanir
- Delta kontrol: son cekme zamani + bina sayisi karsilastirmasi

### Story 1.4: Geri Al / Ileri Al (Undo/Redo) Sistemi

As a saha muhendisi,
I want yaptigim islemleri geri alabilmek ve ileri alabilmek,
So that hatali islemlerden kolayca donebilir ve farkli secimleri deneyebilirim.

**Acceptance Criteria:**

**Given** kullanici bir islem yaptiginda (bina ekleme, OLT degistirme, fiyat guncelleme, penetrasyon degisikligi vb.)
**When** islem gerceklestirildiginde
**Then** islem Command Pattern ile {do, undo} cifti olarak CommandManager'a kaydedilmeli
**And** EventBus uzerinden command:execute olayi yayinlanmali

**Given** islem gecmisinde en az bir islem varken
**When** kullanici geri al (undo) islemini tetiklediginde
**Then** son islem geri alinmali ve onceki duruma donulmeli
**And** EventBus uzerinden command:undo olayi yayinlanmali
**And** geri alinan islem redo yiginina eklenmeli

**Given** redo yigininda en az bir islem varken
**When** kullanici ileri al (redo) islemini tetiklediginde
**Then** geri alinan islem yeniden uygulanmali
**And** EventBus uzerinden command:redo olayi yayinlanmali

**Given** toplu bir islem yapildiginda (orn: birden fazla binayi silme)
**When** kullanici geri al istediginde
**Then** toplu islemin tamami tek adimda geri alinmali (NFR33)

**Given** kullanici oturum boyunca islemler yaptiginda
**When** islem gecmisi kontrol edildiginde
**Then** tum islemler oturum boyunca korunmali (NFR32)

**Teknik Notlar:**
- CommandManager modulu (lib/command-manager.js) — IIFE pattern
- EventBus bagimliligi (event-bus.js'ten sonra yuklenir)
- Gecmis hesaplara geri donus (FR63) bu altyapi ile saglanir

### Story 1.5: Otomatik Yedekleme ve Geri Yukleme

As a saha muhendisi,
I want verilerimin otomatik olarak yedeklenmesini ve istedigim yedege geri donebilmeyi,
So that beklenmedik durumlarda (tarayici cokmesi, yanlis islem) verilerimi kaybetmeyeyim.

**Acceptance Criteria:**

**Given** extension aktif ve calisiyor olduGunda
**When** 10 dakika gectiginde
**Then** sistem otomatik olarak IndexedDB'nin tam snapshot'ini backups store'una kaydetmeli (NFR34)
**And** yedekleme arka planda sessizce calismali, kullanici is akisini kesmemeli (NFR37)

**Given** backups store'unda 6'dan fazla yedek biriktiginde
**When** yeni yedek alindiginda
**Then** en eski yedek silinmeli ve en fazla son 6 yedek saklanmali (NFR35)

**Given** kullanici yedeklerini goruntulemek istediginde
**When** yedek listesini actiginda
**Then** mevcut yedekler tarih/saat bilgisiyle listelenmeli
**And** her yedek icin ada sayisi ve veri boyutu gosterilmeli

**Given** kullanici belirli bir yedege geri donmek istediginde
**When** yedegi secip geri yukleme onayladiginda
**Then** secilen yedekteki veriler aktif verilerin yerine yuklenmeli (NFR36)
**And** geri yukleme basarili olduGunda bilgilendirme mesaji gosterilmeli

**Given** tarayici cokmesi veya beklenmedik kapanis sonrasi
**When** extension yeniden baslatiginda
**Then** son kaydedilmis durumdan devam edebilmeli (NFR25)

**Teknik Notlar:**
- IndexedDB backups store kullanilir
- main.js'te setInterval ile 10 dk periyodik zamanlayici
- Snapshot: tum adas + buildings + calculations store'larinin kopyasi

### Story 1.6: Offline Calisma ve Veri Aktarimi

As a saha muhendisi,
I want internet baglantisi olmadan mevcut verilerimle calisabilmeyi ve verilerimi farkli formatlarda disa aktarabilmeyi,
So that sahada baglantisiz ortamda da planlama yapabilir ve verilerimi raporlama icin paylasabileyim.

**Acceptance Criteria:**

**Given** internet baglantisi kesildiginde
**When** kullanici extension'i kullandiginda
**Then** mevcut IndexedDB verileriyle tam islevsellik saglanmali (NFR21)
**And** hesaplama, gorsellestirme ve veri duzenleme islemleri calismaya devam etmeli
**And** NVI'dan yeni veri cekme islemleri icin uygun hata mesaji gosterilmeli

**Given** kullanici proje verilerini disa aktarmak istediginde
**When** JSON formatini sectiginde
**Then** tum proje verileri (adalar, binalar, hesaplamalar) JSON dosyasi olarak indirilmeli

**Given** kullanici proje verilerini disa aktarmak istediginde
**When** CSV formatini sectiginde
**Then** ada ve bina verileri tablo formatinda CSV dosyasi olarak indirilmeli

**Given** kullanici harita verilerini disa aktarmak istediginde
**When** GeoJSON formatini sectiginde
**Then** koordinat bazli veriler (bina konumlari, kablo rotalari, ada sinirlari) GeoJSON dosyasi olarak indirilmeli

**Given** herhangi bir formatta veri aktarimi yapildiginda
**When** dosya olusturuldugunda
**Then** hassas veri uyarisi gosterilmeli (NFR9): "Bu veriler hassas altyapi bilgisi icerir"
**And** kullanici uyariyi onayladiktan sonra indirme baslamali

**Teknik Notlar:**
- Mevcut Topology.js export fonksiyonlari genisletilir
- IndexedDB'den veri okuma + Blob URL ile indirme
- FR62 (offline), FR64 (export)

### Story 1.7: Extension Erisim Kontrolu ve Aktivasyon

As a yonetici,
I want extension erisimini kontrol edebilmek ve sadece onayladigim kullanicilarin sistemi kullanabilmesini,
So that hassas altyapi verilerine yetkisiz erisimi engelleyebileyim.

**Acceptance Criteria:**

**Given** yeni bir kullanici extension'i yukleyip ilk kez actiginda
**When** extension baslatiginda
**Then** aktivasyon ekrani gosterilmeli: "Aktivasyon kodu giriniz"
**And** aktivasyon kodu girilene kadar tum extension islevleri kilitli olmali (NFR8)

**Given** kullanici gecerli bir aktivasyon kodu girdiginde
**When** dogrulama yapildiginda
**Then** anahtar cifti ile yerel dogrulama basarili olmali
**And** extension tam islevsellikle acilmali
**And** aktivasyon durumu chrome.storage.local'da saklanmali

**Given** kullanici gecersiz bir aktivasyon kodu girdiginde
**When** dogrulama yapildiginda
**Then** hata mesaji gosterilmeli: "Gecersiz aktivasyon kodu"
**And** extension islevleri kilitli kalmali

**Given** yonetici yeni kullanici icin aktivasyon kodu olusturmak istediginde
**When** master key ile yeni kod urettiginde
**Then** benzersiz kullanici kodu olusturulmali
**And** kod kullaniciya iletildikten sonra ilk kullanimda aktive olmali

**Given** onaylanmamis bir kullanici extension'i kullanmaya calistiginda
**When** herhangi bir islem yapmak istediginde
**Then** tum islevler engellenmeli ve aktivasyon ekranina yonlendirilmeli (FR67)

**Teknik Notlar:**
- Activation modulu (lib/activation.js) — IIFE pattern
- Anahtar cifti dogrulama: master key ile benzersiz kullanici kodlari
- Backend gerektirmez, tamamen yerel dogrulama
- main.js init sirasinda Activation kontrolu (gate)

---

## Epic 2: Ada Topoloji Planlama ve Harita Deneyimi

Muhendis NVI portalinde ada secer, binalar otomatik taranir, OLT yerlestirilir, MST kablo rotalamasi olusur, splitter'lar hesaplanir, loss budget dogrulanir, kablo cor sayilari belirlenir — tumu harita uzerinde gorsellestirilir ve kalite degerlendirmesi yapilir.

### Story 2.1: Leaflet Harita Overlay ve Uydu Gorunumu

As a saha muhendisi,
I want NVI portali uzerinde bagimsiz bir harita katmani gorebilmek,
So that fiber ag topolojisini uydu gorunumunde gorsellestirebilir ve planlama yapabileyim.

**Acceptance Criteria:**

**Given** NVI portal sayfasi yuklendiginde ve extension aktif olduGunda
**When** Overlay modulu baslatildiginda
**Then** NVI portali uzerinde bagimsiz Leaflet harita olusturulmali (Esri World Imagery uydu karolari)
**And** harita NVI'nin kendi haritasindan bagimsiz calismali

**Given** harita yuklendikten sonra
**When** kullanici pan/zoom yaptiginda
**Then** harita akici sekilde cevap vermeli (< 500ms render, NFR3)
**And** CSP-safe blob URL yaklasimi ile tile'lar kesintisiz yuklenmeli (NFR18)

**Given** NVI portalinin MAIN world'unde Leaflet instance'i mevcutken
**When** kullanici haritada bir konuma tikladiginda
**Then** MAIN world script injection ile NVI koordinatlari yakalanabilmeli (NFR17)
**And** koordinatlar extension'in Leaflet instance'ina aktarilabilmeli

**Given** kullanici harita gorunumunu degistirip sayfayi kapattiginda
**When** sayfayi tekrar actiginda
**Then** son harita pozisyonu (lat, lng, zoom) korunmali ve geri yuklenmeli

**Teknik Notlar:**
- Overlay modulu (content/overlay.js) — mevcut modulu genisletme
- MapUtils.FetchTileLayer ile CSP-safe tile yukleme (blob URL)
- injectMainWorldCoordReader() ile NVI Leaflet koordinat yakalama
- Harita pozisyonu IndexedDB settings store'unda saklanir

### Story 2.2: NVI Ada Tarama ve Bina Secimi

As a saha muhendisi,
I want NVI portalinde bir adayi sectigimde binalarin ve bagimsiz bolum sayilarinin otomatik taranmasini,
So that manuel veri girisi yapmadan hizla planlama yapabileyim.

**Acceptance Criteria:**

**Given** kullanici NVI portalinde bir adanin sayfasina gittiginde
**When** NviScraper DOM polling (1s interval) ile sayfa icerigini taradiginda
**Then** sayfadaki tum `<tr bagimsizbolumkimlikno>` satirlari otomatik tespit edilmeli
**And** satirlar binaNo (ada+parsel+disKapiNo) bazinda binalara gruplamali
**And** tarama suresi < 2 saniye olmali (NFR2)

**Given** binalar basariyla tarandiginda
**When** bina listesi olusturuldugunda
**Then** her bina icin bagimsiz bolum (BB) sayisi dogru hesaplanmali
**And** binalar harita uzerinde pentagon ikonlarla gosterilmeli

**Given** kullanici taranan binalari incelediginde
**When** bir binayi ada planina eklemek istediginde
**Then** tek tikla binalar planina eklenebilmeli (FR2)
**And** ekleme islemi EventBus uzerinden building:added olayi yayinlamali

**Given** kullanici planindaki bir binayi cikarma istediginde
**When** binayi secip cikarma islemini tetiklediginde
**Then** bina plandan cikarilmali ve haritada guncellenmeli
**And** cikarma islemi CommandManager'a kaydedilmeli (geri alinabilir)

**Teknik Notlar:**
- NviScraper modulu (content/scraper.js) — mevcut modulu koruma
- Bina gruplama: composite key (ada+parsel+disKapiNo)
- NviCache entegrasyonu: ilk taramada cache'le, sonraki kullanimda cache'den oku

### Story 2.3: Bina Bilgisi Duzenleme ve Coklu Ada Yonetimi

As a saha muhendisi,
I want bina bilgilerini inline duzenleyebilmek ve birden fazla adayi bagimsiz yonetebilmek,
So that saha gerceklerine gore verileri guncelleyebilir ve farkli adalari verimli planlayabileyim.

**Acceptance Criteria:**

**Given** kullanici bina listesindeki bir binayi sectiginde
**When** duzenleme moduna gectiginde
**Then** bina tipi, BB sayisi ve koordinat bilgilerini inline duzenleyebilmeli (FR3)
**And** degisiklikler aninda haritaya yansiamali
**And** duzenleme islemi CommandManager'a kaydedilmeli (geri alinabilir)

**Given** kullanici birden fazla ada planladiginda
**When** adalar arasi gecis yapmak istediginde
**Then** mevcut adanin durumu otomatik kaydedilmeli
**And** hedef ada yuklenmeli (IndexedDB'den veya cache'den)
**And** her ada bagimsiz olarak yonetilebilmeli (FR4)

**Given** kullanici bir adadan digerine gecis yaptiginda
**When** hedef ada daha once planlanmissa
**Then** son kaydedilen durum (binalar, OLT, rotalama) ile yuklemeli
**And** gecis suresi kullanici fark etmeyecek duzeyde olmali

**Teknik Notlar:**
- Panels modulu (content/panels.js) — temel yeniden yazim
- Topology modulu (lib/topology.js) — mevcut ada/bina CRUD korunur
- Ada gecisinde Topology.loadAda() / Topology.saveAda() akisi

### Story 2.4: OLT Yerlesimi ve GPON Port Hesabi

As a saha muhendisi,
I want sistemin optimal OLT konumunu hesaplamasini ve gerektiginde manuel secim yapabilmeyi,
So that en verimli fiber ag topolojisini olusturabileyim.

**Acceptance Criteria:**

**Given** bir adaya binalar eklendiginde
**When** OLT yerlesimi hesaplandiginda
**Then** agirlikli geometrik medyan (BB x mesafe) ile optimal konum belirlemeli (FR7)
**And** elektrik binasi varsa oncelikli olarak secilmeli
**And** OLT binasi haritada mor (#8B5CF6) pentagon ikonla isaretlenmeli

**Given** kullanici otomatik OLT secimiyle tatmin olmadiginda
**When** farkli bir binayi OLT olarak sectiginde
**Then** OLT binasi degismeli ve haritada guncellenmeli (FR8)
**And** degisiklik sonrasi tum hesaplamalar (MST, splitter, loss budget) otomatik yeniden calismali
**And** OLT degisikligi CommandManager'a kaydedilmeli

**Given** OLT binasi belirlendikten sonra
**When** GPON port kapasitesi hesaplandiginda
**Then** toplam BB sayisina gore port sayisi hesaplanmali (128 BB/port, 64 ONT/port) (FR11)
**And** port doluluk orani gosterilmeli

**Teknik Notlar:**
- PonEngine.recalculateAda() — mevcut OLT yerlesim algoritmasi korunur
- Agirlikli geometrik medyan: her bina icin BB x mesafe agirligi
- GPON port hesabi: Math.ceil(totalBB / 128) ve Math.ceil(totalONT / 64) max'i

### Story 2.5: MST Kablo Rotalama ve Manuel Duzenleme

As a saha muhendisi,
I want sistemin otomatik kablo rotalamasi olusturmasini ve gerektiginde manuel duzenleme yapabilmeyi,
So that en verimli kablo agini kurabilirim ve saha kosullarinina gore rota ayarlayabileyim.

**Acceptance Criteria:**

**Given** OLT binasi ve diger binalar belirlendiginde
**When** otomatik rotalama hesaplandiginda
**Then** tek seviye MST (Prim algoritmasi) ile kablo rotalari olusturulmali (FR9)
**And** kablolar harita uzerinde cizgi olarak gorsellestirilmeli (FR47)

**Given** kullanici otomatik rotayi degistirmek istediginde
**When** KABLO CIZ (manuel mod) modunu aktive ettiginde
**Then** mevcut MST rotalari manualEdges'e kopyalanmali (Topology.copyMstToManualEdges)
**And** kullanici haritada tikla-tikla ile yeni kablo rotalari cizebilmeli (FR10)
**And** manuel modda yalnizca HESAPLA butonu ile yeniden hesaplama yapilmali

**Given** otomatik modda herhangi bir degisiklik yapildiginda (bina ekleme/cikarma, OLT degisimi)
**When** PonEngine.recalculateAda() tetiklendiginde
**Then** MST rotalamasi otomatik guncellenmeli
**And** haritadaki kablo cizgileri aninda yenilenmeli

**Teknik Notlar:**
- PonEngine — mevcut MST (Prim) algoritmasi korunur
- Iki rotalama modu: auto (MST her degisiklikte yeniden) vs manual (manualEdges, sadece HESAPLA ile)
- DrawPolygon modulu ile kullanici etkilesimi

### Story 2.6: Splitter Hesabi ve Loss Budget Dogrulama

As a saha muhendisi,
I want her bina icin dogru splitter boyutunun hesaplanmasini ve loss budget'in dogrulanmasini,
So that GPON standartlarina uygun bir ag topolojisi planlayabileyim.

**Acceptance Criteria:**

**Given** binalar ve OLT belirlendiginde ve penetrasyon orani ayarlandiginda
**When** PonEngine splitter hesabini yaptiginda
**Then** effBB (BB x penetrasyon orani) bazinda dogru splitter boyutu secilmeli (FR12):
- effBB <= 8 → 1:8 (10.5 dB)
- effBB <= 16 → 1:16 (14.0 dB)
- effBB <= 24 → 1:16+1:8 cascade
- effBB <= 32 → 1:32 (17.5 dB)
**And** toplam splitter orani <= 1:128 olmali

**Given** splitter boyutlari belirlendiginde
**When** loss budget hesaplandiginda
**Then** her bina icin toplam kayip hesaplanmali: splitter + fiber (0.35 dB/km) + konnektor (4 x 0.5 dB) + ek (2 x 0.1 dB) (FR13)
**And** 26.0 dB operator limitine gore durum siniflandirilmali (FR14):
- margin >= 3 dB → OK (yesil)
- margin >= 0 dB ve < 3 dB → WARNING (sari)
- margin < 0 dB → FAIL (kirmizi)

**Given** kullanici penetrasyon oranini degistirmek istediginde
**When** ada veya bina bazinda oran ayarlandiginda (FR15)
**Then** effBB degismeli ve splitter + loss budget otomatik yeniden hesaplanmali
**And** hesaplama suresi < 100ms olmali (NFR1)

**Teknik Notlar:**
- PonEngine.recalculateAda() — mevcut splitter ve loss budget hesabi korunur
- CONSTANTS.maxLossBudget = 26.0 (operator limiti)
- Splitter kayiplari: 3.5 * log2(oran)

### Story 2.7: Kablo Core Hesabi ve Harita Gorsellestirme

As a saha muhendisi,
I want MST topolojisine gore dogru kablo core sayilarinin hesaplanmasini ve haritada gorsellestirilmesini,
So that sahaya gonderilecek malzemelerin dogru belirlenmesini saglayabileyim.

**Acceptance Criteria:**

**Given** MST rotalama ve splitter hesabi tamamlandiginda
**When** kablo boyutlandirma hesaplandiginda
**Then** 4 tip kablo icin dogru core sayilari belirlemeli (FR16):
- Backbone: PON port bazli
- Distribution: downstream talep bazli
- Drop: bina bazli dahili
- Ring: MST yaprak kapatma

**Given** kablo hesaplari tamamlandiginda
**When** harita gorsellestirmesi guncellendiginde
**Then** kablolar harita uzerinde tip ve core sayisina gore farkli renk/kalinkta gosterilmeli (FR47)
**And** kabloya tiklandiginda mesafe (km) ve core sayisi popup'ta gosterilmeli

**Given** binalar haritada gosterildiginde
**When** bina tipine gore renklendirme yapildiginda
**Then** her bina tipi farkli renkte pentagon ikonla gosterilmeli (FR46):
- OLT: #8B5CF6 (mor)
- FDH: #3B82F6 (mavi)
- MDU Large (>=20 BB): #22C55E (yesil)
- MDU Medium (8-19 BB): #F97316 (turuncu)
- SFU (1-7 BB): #EAB308 (sari)

**Given** ada sinirlari belirlendiginde
**When** harita gorsellestirmesi yapildiginda
**Then** ada sinirlari harita uzerinde poligon olarak gosterilmeli (FR48)

**Teknik Notlar:**
- PonEngine — mevcut kablo boyutlandirma algoritmasi korunur
- MapUtils — pentagon ikon uretimi, kablo stilleri (CABLE_STYLES), bina tipi renkleri
- Overlay.render() ile harita guncelleme

### Story 2.8: Kalite Degerlendirme ve Uyari Sistemi

As a saha muhendisi,
I want topolojinin otomatik kalite degerlendirmesini ve sorunlu noktalarin haritada gorsel isaretlenmesini,
So that planimdaki sorunlari hizla tespit edip cozebilir ve standartlara uygunlugu saglayabileyim.

**Acceptance Criteria:**

**Given** tum hesaplamalar tamamlandiginda (OLT, MST, splitter, loss budget, kablo)
**When** ReviewEngine kalite degerlendirmesi yaptiginda
**Then** topoloji 6 agirlikli kategoride puanlanmali (FR59):
- Loss budget uygunlugu
- Standart uyumu (ITU-T G.984)
- Splitter konfigurasyonu
- OLT yerlesimi ve kapasite
- Kablo boyutlandirma
- Maliyet verimliligi
**And** genel kalite skoru hesaplanmali

**Given** loss budget hesabinda WARNING veya FAIL durumu olusan binalar varken
**When** harita gorsellestirmesi yapildiginda
**Then** WARNING durumundaki binalar sari vurgu ile isaretlenmeli (FR60)
**And** FAIL durumundaki binalar kirmizi vurgu ile isaretlenmeli
**And** binaya tiklandiginda detayli loss budget bilgisi gosterilmeli (toplam kayip, marj, durum)

**Given** kullanici "Ada durumu bir bakista" scoreboard'u goruntulediginde
**When** ada ozeti gosterildiginde
**Then** loss budget durumu (OK/WARNING/FAIL sayilari), toplam maliyet ve kalite skoru tek bakista gorunmeli
**And** 5 saniye icinde ada durumu kavranabilmeli (UX gereksinimleri)

**Teknik Notlar:**
- ReviewEngine modulu (lib/review-engine.js) — mevcut kalite siniflandirici korunur
- 6 agirlikli kategori degerlendirmesi
- Harita uzerinde renk kodlu gorsellestirme (OK=yesil, WARNING=sari, FAIL=kirmizi)

---

## Epic 3: Envanter, Maliyet ve Tek Ekran Yonetimi

Sistem otomatik envanter ve malzeme listesi uretir, muhendis katalog fiyatlarini gunceller, tum maliyetler aninda yeniden hesaplanir. Topoloji, envanter ve ada yonetimi tek ekrandan erisilebilir hale gelir.

### Story 3.1: Otomatik Envanter ve Malzeme Listesi

As a saha muhendisi,
I want topoloji hesabi tamamlandiginda otomatik olarak envanter ve malzeme listesi uretilmesini,
So that sahaya gonderilecek malzemeleri tek tek elle hesaplamak zorunda kalmayayim.

**Acceptance Criteria:**

**Given** PonEngine.recalculateAda() basariyla tamamlandiginda
**When** envanter hesabi tetiklendiginde
**Then** topolojiden turetilen tum malzemeler otomatik listelenmeli (FR17):
- Fiber kablolar (tip ve metraj bazinda: backbone, distribution, drop, ring)
- Splitter'lar (oran ve adet bazinda: 1:8, 1:16, 1:32 vb.)
- Konnektor ve ek malzemeleri (adet bazinda)
- OLT port karti (adet bazinda)
- Patch panel / ODF (adet bazinda)
**And** her kalem icin birim ve miktar dogru hesaplanmali

**Given** envanter listesi olusturuldugunda
**When** kullanici envanter gorunumune gectiginde
**Then** malzemeler kategori bazinda gruplanmis tablo halinde gosterilmeli
**And** her satir icin: malzeme adi, birim, miktar, birim fiyat, toplam fiyat gorunmeli

**Given** topolojide bir degisiklik yapildiginda (bina ekleme/cikarma, OLT degisimi, penetrasyon degisikligi)
**When** PonEngine yeniden hesaplama yaptiginda
**Then** envanter listesi otomatik guncellenmeli
**And** degisen kalemler gorsel olarak vurgulanmali

**Teknik Notlar:**
- PonEngine.recalculateAda() pipeline'inin son adimi (8. adim: Inventory & costs)
- CATALOG objesi (pon-engine.js) — malzeme tanimlari ve varsayilan fiyatlar
- Envanter hesabi mevcut kodda zaten var, panel gorunumu genisletilecek

### Story 3.2: Katalog Fiyat Guncelleme ve Maliyet Hesabi

As a saha muhendisi,
I want malzeme katalogundaki birim fiyatlari guncelleyebilmek ve toplam proje maliyetini gorebilmek,
So that gercek piyasa fiyatlarina gore dogru maliyet analizi yapabileyim.

**Acceptance Criteria:**

**Given** envanter tablosu gosterildiginde
**When** kullanici bir malzemenin birim fiyatini degistirmek istediginde
**Then** fiyat alani inline duzenlenebilir olmali (FR18)
**And** girilen fiyat pozitif sayi olmali (negatif veya sifir kabul edilmemeli)
**And** degisiklik aninda chrome.storage.local'a kaydedilmeli (fp_catalog_custom)

**Given** bir birim fiyat degistirildiginde
**When** fiyat kaydedildiginde
**Then** ilgili malzemenin satir toplami aninda yeniden hesaplanmali (FR19)
**And** genel toplam maliyet aninda guncellenmeli (FR20)
**And** hesaplama suresi kullanici fark edemeyecek duzeyde olmali (< 100ms)

**Given** kullanici ozel fiyat girdikten sonra varsayilana donmek istediginde
**When** fiyat sifirlama islemini tetiklediginde
**Then** ilgili malzeme CATALOG varsayilan fiyatina donmeli
**And** toplam maliyet yeniden hesaplanmali

**Given** toplam proje maliyeti hesaplandiginda
**When** maliyet ozeti gosterildiginde
**Then** kategori bazli alt toplamlar (kablo, splitter, konnektor, ekipman) gorunmeli
**And** genel toplam TL cinsinden gosterilmeli
**And** birim maliyet (TL/BB) hesaplanmali

**Teknik Notlar:**
- fp_catalog_custom key'i ile kullanici fiyatlari chrome.storage.local'da saklanir
- CATALOG objesi varsayilan fiyatlari tutar, kullanici guncelleri uzerine yazilir
- Fiyat degisikliginde yalnizca maliyet hesabi yenilenir (topoloji yeniden hesaplanmaz)

### Story 3.3: Smart Bubbles UI Sistemi

As a saha muhendisi,
I want topoloji, envanter ve yonetim islevlerine harita-merkezli Smart Bubbles arayuzu ile erisebilmek,
So that harita alanini hic kismadan, tikla-gor mantigi ile tum bilgilere hizla ulasabileyim.

**Acceptance Criteria:**

**Given** extension aktif ve bir ada yuklenmisken
**When** harita goruntulendikten
**Then** harita %100 ekran kaplayacak, hicbir sabit panel harita alanini kalici olarak kisitlamamali (FR55)
**And** tum bilgiler kullanici etkilesimiyle (tikla, hover) ortaya cikmali

**Given** kullanici haritanin ust 60px alanina mouse ile geldiginde
**When** auto-hide toolbar goruntulendikten
**Then** toolbar icerisinde sunlar bulunmali (FR56):
- Ada secici dropdown
- Mod butonlari (OLT MOD, KABLO CIZ, SINIR CIZ)
- Eylem butonlari (HESAPLA, KAYDET, EXPORT)
- Envanter/Maliyet modal butonu
- Scoreboard ikonu
**And** mouse toolbar alanindan ciktiginda 2sn sonra fadeOut ile gizlenmeli
**And** aktif mod varken toolbar surekli gorunur kalmali
**And** F2 klavye kisayolu ile toolbar toggle edilebilmeli

**Given** bir ada yuklendiginde
**When** scoreboard karti goruntulendikten
**Then** ust ortada yuzen kart olarak belirmeli:
- Ada adi, bina sayisi, toplam BB, toplam maliyet, kalite skoru, loss budget durumu
**And** 5 saniye sonra yavasce solmali (fadeOut)
**And** toolbar'daki scoreboard ikonuna tiklayarak tekrar goruntulenebilmeli

**Given** kullanici envanter veya maliyet detayini gormek istediginde
**When** toolbar'dan "Envanter" veya "Maliyet" butonuna tikladiginda
**Then** ekran ortasinda modal kart acilmali (FR56):
- Icinde sekmeli yapi: Envanter / Maliyet / KPI
- Harita %50 karartilmali (backdrop overlay)
- ESC veya dis tiklama ile kapanmali
**And** modal icindeki sekmeler arasi gecis < 100ms olmali

**Given** kullanici binaya/kabloya/OLT'ye tikladiginda
**When** detay popup'u acildiginda
**Then** Leaflet popup API ile ilgili detay balonu gosterilmeli:
- Bina popup: BB, splitter, loss budget, maliyet bilgileri
- Kablo popup: mesafe, kor sayisi, kablo tipi
- OLT popup: port durumu ve kapasite
**And** tek seferde maksimum 1 detay popup acik olmali (yenisi acilinca eski kapanir)

**Teknik Notlar:**
- Panels modulu (content/panels.js) — Smart Bubbles yaklasimina gore yeniden yazim
- UX Spec'teki "Akilli Balonlar" tasarim yonelimi uygulanir
- Auto-hide toolbar: position:fixed, top:0, backdrop-filter:blur(8px), --fp-bg-surface
- Modal kart: --fp-bg-surface, --fp-radius-lg, sekmeli yapi
- Popup'lar: Leaflet L.popup API, ozel HTML sablonlari (bina, kablo, OLT, scoreboard)
- CSS: fp-toolbar, fp-toolbar--visible, fp-modal, fp-modal__backdrop, fp-scoreboard
- Mevcut bina listesi ve toolbar islevleri auto-hide toolbar'a tasenir

### Story 3.4: Ada Bazli Listeleme ve Durum Gostergeleri

As a saha muhendisi,
I want tum adalarimi tek listede gorebilmeyi ve her adanin durumunu bir bakista anlayabilmeyi,
So that hangi adanin tamamlandigini, hangisinde sorun oldugunu hizla tespit edebileyim.

**Acceptance Criteria:**

**Given** kullanici Yonetim sekmesine gectiginde
**When** ada listesi gosterildiginde
**Then** tum kayitli adalar ozet bilgileriyle listelenmeli (FR57):
- Ada kodu ve adi
- Bina sayisi
- Toplam BB sayisi
- Topoloji durumu (planlandi/hesaplandi/sorunlu)
- Son guncelleme tarihi
**And** liste ada koduna gore sirali olmali

**Given** ada listesi goruntulendikten
**When** her adanin durum gostergesi kontrol edildiginde
**Then** gorsel durum badge'leri gosterilmeli (FR58):
- Yesil badge: Tum hesaplamalar OK, loss budget uygun
- Sari badge: WARNING durumu var (loss budget marji dusuk)
- Kirmizi badge: FAIL durumu var (loss budget asimi)
- Gri badge: Henuz hesaplanmamis (bina eklenmis ama recalculate yapilmamis)

**Given** kullanici ada listesinde bir adaya tikladiginda
**When** ada secildiginde
**Then** secilen ada yuklenmeli (Topology.loadAda)
**And** Planlama sekmesine otomatik gecis yapilmali
**And** harita secilen adanin konumuna odaklanmali (fitBounds)

**Given** kullanici ada listesini filtrelemek istediginde
**When** durum filtresini kullandiginda
**Then** secilen duruma gore adalar filtrelenmeli (orn: sadece sorunlu adalar)
**And** filtre sonucu toplam ada sayisi gosterilmeli

**Teknik Notlar:**
- Yonetim sekmesi icerisinde ada listesi bileeni
- IndexedDB adas store'undan ozet veri cekilir (tam yukleme degil)
- Durum badge'leri: fp-status--ok, fp-status--warning, fp-status--fail, fp-status--pending
- Ada gecisi Topology.loadAda() / Topology.saveAda() akisiyla (Story 2.3 altyapisi)

---

## Epic 4: Varyasyon Analizi ve Senaryo Karsilastirma

Muhendis farkli penetrasyon oranlari ve fiber konfigurasyonlariyla varyasyonlar olusturur, en az 3 senaryoyu yan yana karsilastirir ve optimum senaryoyu aktif plan olarak belirler.

### Story 4.1: Varyasyon Olusturma

As a saha muhendisi,
I want mevcut ada planimin farkli penetrasyon oranlari ve konfigurasyonlariyla varyasyonlarini olusturabilmek,
So that farkli senaryolarin topoloji ve maliyet etkilerini gorebilir ve en uygun plani belirleyebilirim.

**Acceptance Criteria:**

**Given** bir ada icin topoloji hesabi tamamlanmis ve aktif plan mevcutken
**When** kullanici "Yeni Varyasyon" islemini baslattiginda
**Then** mevcut adanin tam kopyasi (binalar, OLT, rotalama, splitter) yeni bir varyasyon olarak olusturulmali (FR21)
**And** varyasyona kullanici tarafindan isim verilebilmeli (orn: "%40 penetrasyon", "%80 penetrasyon")
**And** varyasyon bagimsiz bir hesaplama birimi olarak saklanmali

**Given** yeni bir varyasyon olusturuldugunda
**When** kullanici varyasyon parametrelerini degistirmek istediginde
**Then** penetrasyon oranini (ada bazli veya bina bazli) degistirebilmeli
**And** OLT konumunu degistirebilmeli
**And** rotalama modunu degistirebilmeli (auto/manual)
**And** her parametre degisikliginde PonEngine.recalculateAda() tetiklenmeli ve sonuclar guncellenmeli

**Given** bir ada icin birden fazla varyasyon olusturuldugunda
**When** varyasyon listesi goruntulendikten
**Then** tum varyasyonlar isim ve temel metrikleriyle (toplam maliyet, ortalama loss budget, kalite skoru) listelenmeli
**And** aktif varyasyon gorsel olarak isaretlenmeli
**And** varyasyonlar arasi gecis tek tikla yapilabilmeli

**Given** kullanici bir varyasyonu silmek istediginde
**When** silme islemini onayladiginda
**Then** varyasyon kalici olarak silinmeli
**And** aktif varyasyon silinemez kurali uygulanmali (once baska varyasyon aktif yapilmali)

**Teknik Notlar:**
- Variation modulu (lib/variation.js) — IIFE pattern, yeni modul
- Varyasyon verisi: { id, name, adaId, penetration, oltBuildingId, routingMode, snapshot: {...} }
- IndexedDB calculations store'unda ada bazli varyasyon dizisi
- Mevcut ada verisi deep copy ile klonlanir (JSON.parse(JSON.stringify))

### Story 4.2: Senaryo Karsilastirma Tablosu

As a saha muhendisi,
I want en az 3 varyasyonu yan yana karsilastirabilmek,
So that farkli senaryolarin maliyet, kapasite ve kalite farklarini net gorebilir ve bilingli karar verebilirim.

**Acceptance Criteria:**

**Given** bir ada icin en az 2 varyasyon mevcutken
**When** kullanici "Karsilastir" islemini baslattiginda
**Then** yan yana karsilastirma tablosu acilmali (FR22)
**And** sutunlarda secilen varyasyonlar, satirlarda metrikler olmali

**Given** karsilastirma tablosu gosterildiginde
**When** metrikler goruntulendikten
**Then** asagidaki metrikler her varyasyon icin gosterilmeli:
- Penetrasyon orani (%)
- Toplam BB / Efektif BB
- OLT port sayisi
- Toplam kablo metrajı (backbone + distribution + drop)
- Splitter dagilimi (1:8 / 1:16 / 1:32 adetleri)
- Ortalama loss budget (dB)
- Loss budget durum dagilimi (OK / WARNING / FAIL sayilari)
- Toplam maliyet (TL)
- Birim maliyet (TL/BB)
- Kalite skoru
**And** en iyi deger yesil, en kotu deger kirmizi ile vurgulanmali (NFR5)

**Given** en az 3 varyasyon secildiginde
**When** tablo goruntulendikten
**Then** yatay scroll olmadan en az 3 senaryo yan yana gorunmeli
**And** 4+ senaryo varsa yatay scroll aktif olmali
**And** satir basliklari sabit kalmali (sticky column)

**Given** kullanici karsilastirma tablosundaki bir metrigi detaylandirmak istediginde
**When** metrik satirana tikladiginda
**Then** detay acilimi (accordion) ile bina bazli dagilim gosterilmeli

**Teknik Notlar:**
- Analiz sekmesi icerisinde karsilastirma gorunumu
- CSS Grid/Flexbox ile yan yana tablo (sutunlarda senaryolar)
- Metrik hesaplama: her varyasyonun snapshot'indan turetilir
- Renk kodlama: min/max deger karsilastirmasi ile otomatik

### Story 4.3: Optimum Senaryo Secimi ve Aktivasyon

As a saha muhendisi,
I want karsilastirma sonrasi en uygun senaryoyu aktif plan olarak belirleyebilmek,
So that sectigim plani uygulama asamasina tasiyabilir ve raporlarima yansitabileyim.

**Acceptance Criteria:**

**Given** karsilastirma tablosu acik ve varyasyonlar goruntulendikten
**When** kullanici bir varyasyonu "Optimum" olarak isaretlediginde
**Then** secilen varyasyon gorsel olarak one cikarilmali (FR23)
**And** optimum secim nedeni icin kullaniciya not girme imkani sunulmali (opsiyonel)

**Given** kullanici optimum senaryoyu aktif plan olarak belirlemek istediginde
**When** "Aktif Yap" islemini onayladiginda
**Then** secilen varyasyonun verileri adanin aktif plani olarak yuklenmeli
**And** harita, panel ve envanter secilen varyasyona gore guncellenmeli
**And** onceki aktif plan otomatik olarak bir varyasyon olarak saklanmali (veri kaybi yok)

**Given** optimum senaryo aktif yapildiktan sonra
**When** ada ozeti goruntulendikten
**Then** aktif planin hangi varyasyondan geldigini gosteren etiket olmali
**And** disa aktarim (JSON/CSV) aktif planin verilerini icermeli

**Given** kullanici optimum secimini degistirmek istediginde
**When** baska bir varyasyonu optimum olarak isaretlediginde
**Then** onceki optimum isaretlemesi kaldirilmali
**And** yeni secilenin isaretlenmeli
**And** aktif plan degismemeli (aktif yapma ayri islem)

**Teknik Notlar:**
- Variation modulu — setOptimum(variationId), activateVariation(variationId)
- Aktif plan degisimi: Topology.loadState(variation.snapshot) ile ada verilerini degistirir
- Onceki aktif plan: otomatik olarak "Onceki Aktif" isimli varyasyon olarak saklanir
- EventBus: variation:activated olayi yayinlanir

---

## Epic 5: Finansal Analiz ve Yatirim Yonetimi

Muhendis MRR/ROI hesaplarini gorur, tum yatirim kalemlerini (fiber + aktif ekipman + modem + kampanya) yonetir, modem maliyet politikalarini belirler, taahut modellerini tanimlar ve farkli senaryolari karsilastirir.

### Story 5.1: Aktif Ekipman ve Yatirim Kalemi Tanimlama

As a saha muhendisi,
I want anten, OLT cihaz ve diger aktif ekipman maliyetlerini sisteme tanimlayabilmek,
So that toplam yatirim maliyetini sadece fiber degil tum ekipman dahil hesaplayabileyim.

**Acceptance Criteria:**

**Given** kullanici Analiz sekmesinde finansal bolume gectiginde
**When** aktif ekipman tanimlama alanini actiginda
**Then** asagidaki ekipman kategorileri tanimlanabilir olmali:
- Anten maliyetleri (FR27): tip, adet, birim fiyat
- OLT cihaz maliyetleri (FR28): model, port kapasitesi, birim fiyat
- Diger aktif ekipman (FR29): switch, media converter, UPS vb.
**And** her kalem icin birim fiyat ve adet girilebilmeli

**Given** aktif ekipman tanimlari yapildiginda
**When** kalem kaydedildiginde
**Then** ekipman IndexedDB calculations store'unda saklanmali
**And** toplam ekipman maliyeti otomatik hesaplanmali
**And** degisiklikler aninda maliyet ozetine yansiamali

**Given** kullanici daha once tanimladigi bir ekipmani degistirmek istediginde
**When** ekipman bilgisini guncelledikten
**Then** ilgili maliyet kalemleri aninda yeniden hesaplanmali
**And** degisiklik CommandManager'a kaydedilmeli (geri alinabilir)

**Given** kullanici ada bazli ekipman tanimaldiginda
**When** farkli adalar arasi gecis yaptiginda
**Then** her adanin kendi ekipman tanimlari bagimsiz saklanmali
**And** ada ozet gorunumunde ekipman maliyeti gorsel olmali

**Teknik Notlar:**
- Financial modulu (lib/financial.js) — IIFE pattern, yeni modul
- Ekipman verisi: { category, name, unit, quantity, unitPrice, adaId }
- IndexedDB calculations store'unda ada bazli finansal veri
- CATALOG genisletmesi: aktif ekipman varsayilan fiyatlari

### Story 5.2: Modem Maliyet Yonetimi

As a saha muhendisi,
I want modem maliyet politikasini (ucretli/ucretsiz) belirleyebilmek ve modem maliyetlerinin otomatik hesaplanmasini,
So that modem stratejisinin toplam yatirim uzerindeki etkisini gorebilir ve karsilastirebiliyim.

**Acceptance Criteria:**

**Given** ada planinda binalar ve BB sayilari belirlendiginde
**When** kullanici modem maliyet politikasini ayarlamak istediginde
**Then** her bina veya ada bazinda modem ucretli/ucretsiz isaretlenebilmeli (FR32)
**And** varsayilan olarak tum modemler "ucretli" isaretli olmali

**Given** modem isaretlemesi yapildiginda
**When** maliyet hesabi tetiklendiginde
**Then** ucretli modem sayisi x birim modem fiyati = toplam modem maliyeti otomatik hesaplanmali (FR33)
**And** ucretsiz modem sayisi ayri olarak gosterilmeli (kampanya maliyeti olarak)
**And** hesaplama penetrasyon oranina gore efektif BB bazinda yapilmali

**Given** kullanici modem politikasini karsilastirmak istediginde
**When** karsilastirma gorunumunu actiginda
**Then** ucretli vs ucretsiz modem senaryolari yan yana gosterilmeli (FR34):
- Toplam modem maliyeti (ucretli durumda gelir, ucretsiz durumda gider)
- Net yatirim farki
- ROI uzerindeki etki
**And** en dusuk maliyetli senaryo vurgulanmali

**Given** modem birim fiyati degistirildiginde
**When** fiyat kaydedildiginde
**Then** tum modem maliyetleri aninda yeniden hesaplanmali
**And** toplam yatirim maliyetine yansiamali

**Teknik Notlar:**
- Financial modulu — modem maliyet hesaplama fonksiyonlari
- Modem verisi: { adaId, buildingId, isFree: boolean, unitPrice }
- Varsayilan modem fiyati CATALOG'dan gelir, kullanici guncelleyebilir
- Penetrasyon oranina gore efektif modem sayisi: Math.ceil(BB * penetration)

### Story 5.3: Toplam Yatirim Maliyeti Hesabi

As a saha muhendisi,
I want tum yatirim kalemlerini (fiber + aktif ekipman + modem + kampanya) tek bir toplam maliyet olarak gorebilmek,
So that projenin gercek toplam yatirim tutarini net olarak bilir ve butce planlamasi yapabilirim.

**Acceptance Criteria:**

**Given** fiber maliyet (Epic 3), aktif ekipman (Story 5.1) ve modem maliyetleri (Story 5.2) hesaplandiginda
**When** toplam yatirim maliyeti gosterildiginde
**Then** tum kalemler toplam yatirim olarak birlestirilmeli (FR30):
- Fiber altyapi maliyeti (kablo + splitter + konnektor + iscilik)
- Aktif ekipman maliyeti (anten + OLT + diger)
- Modem maliyeti (ucretli modem bedeli veya ucretsiz modem gideri)
- Kampanya maliyeti (taahut karsilama + promosyon)
**And** kategori bazli alt toplamlar ve genel toplam gosterilmeli

**Given** toplam yatirim maliyeti hesaplandiginda
**When** ROI hesabi yapildiginda
**Then** ROI tum yatirim kalemlerini dahil etmeli (FR31)
**And** yatirim dagilimi pasta grafigi ile gorsellestirilmeli
**And** birim yatirim maliyeti (TL/BB ve TL/abone) hesaplanmali

**Given** herhangi bir yatirim kaleminde degisiklik yapildiginda
**When** kalem guncellendikten
**Then** toplam yatirim aninda yeniden hesaplanmali
**And** ROI otomatik guncellenmeli
**And** degisiklik oncesi/sonrasi fark gosterilmeli

**Teknik Notlar:**
- Financial modulu — aggregateTotalInvestment() fonksiyonu
- Toplam = fiberCost + equipmentCost + modemCost + campaignCost
- Birim yatirim: totalInvestment / totalBB ve totalInvestment / effectiveSubscribers
- EventBus: financial:updated olayi ile panel guncelleme

### Story 5.4: MRR Projeksiyonu ve ROI Hesabi

As a saha muhendisi,
I want aylik tekrarlayan gelir (MRR) projeksiyonu ve yatirim geri donus (ROI) hesabini gorebilmek,
So that yatirimin ne zaman kendini amorte edecegini ve karlilik durumunu bilebilirim.

**Acceptance Criteria:**

**Given** toplam yatirim maliyeti ve abone projeksiyonu hazir olduGunda
**When** MRR hesabi yapildiginda
**Then** aylik tekrarlayan gelir projeksiyonu olusturulmali (FR24):
- Efektif abone sayisi (BB x penetrasyon orani)
- Ortalama ARPU (abonelik ucreti / abone)
- MRR = efektif abone x ARPU
**And** 12/24/36 aylik MRR projeksiyonu tablo ve grafik olarak gosterilmeli

**Given** MRR ve toplam yatirim hesaplandiginda
**When** ROI hesabi yapildiginda
**Then** yatirim geri donus suresi (aylik bazda break-even noktasi) hesaplanmali (FR25)
**And** ROI yuzdesi gosterilmeli: ((kumulatif gelir - toplam yatirim) / toplam yatirim) x 100
**And** kumulatif kar/zarar egrisi grafik olarak gorsellestirilmeli

**Given** kullanici MRR/ROI sonuclarini incelemek istediginde
**When** finansal ozet gorunumune gectiginde
**Then** MRR ve ROI tek ekrandan goruntulenmeli (FR26):
- Ust kisim: ozet metrikler (MRR, ROI%, break-even ay, toplam yatirim)
- Alt kisim: aylik projeksiyon tablosu ve grafik
**And** anahtar metrikler (break-even, ROI%) one cikan kutucuklarda gosterilmeli

**Given** penetrasyon orani veya ARPU degistirildiginde
**When** parametre kaydedildiginde
**Then** MRR ve ROI aninda yeniden hesaplanmali
**And** break-even noktasindaki degisim vurgulanmali

**Teknik Notlar:**
- Financial modulu — calculateMRR(), calculateROI() fonksiyonlari
- MRR = effectiveSubscribers * ARPU (varsayilan ARPU kullanici tarafindan ayarlanir)
- ROI = (cumulativeRevenue - totalInvestment) / totalInvestment * 100
- Break-even: cumulativeRevenue >= totalInvestment olan ilk ay
- Grafik: basit canvas/SVG cizimi (dis kutuphane yok)

### Story 5.5a: Taahut ve Kampanya Model Tanimlama

As a saha muhendisi,
I want farkli taahut sureli abonelik modelleri ve kampanya parametreleri tanimlayabilmek,
So that farkli pazarlama stratejilerini sisteme girebilir ve analiz icin hazir hale getirebilirim.

**Acceptance Criteria:**

**Given** kullanici taahut modeli tanimlamak istediginde
**When** taahutlu model olusturduGunda
**Then** asagidaki parametreler tanimlanabilir olmali (FR35):
- Taahut suresi (ay cinsinden: 12, 24, 36)
- Taahutlu indirimli fiyat (orn: normal 299 TL → taahutlu 199 TL)
- Erken iptal cezasi (kalan ay x birim ceza)
**And** model kayit edilebilmeli ve isimlendirilebilmeli

**Given** kullanici taahutsuz model tanimlamak istediginde
**When** taahutsuz model olusturduGunda
**Then** taahutsuz abonelik fiyati tanimlanabilir olmali (FR36)
**And** aylik churn orani (abone kaybi) tanimlanabilir olmali
**And** taahutsuz modelde indirim uygulanmamali

**Given** kullanici kampanya parametreleri tanimlamak istediginde
**When** kampanya olusturduGunda
**Then** asagidaki parametreler tanimlanabilir olmali (FR37):
- Kampanya suresi (ay)
- Indirim orani veya sabit indirim tutari
- Ucretsiz modem dahil mi (evet/hayir)
- Kurulum ucreti muafiyeti (evet/hayir)

**Teknik Notlar:**
- Financial modulu — CommitmentModel, CampaignModel veri yapilari
- Taahut verisi: { id, name, durationMonths, discountedPrice, earlyTermFee, churnRate }
- Kampanya verisi: { id, name, durationMonths, discountRate, freeModem, freeInstall }
- Modeller IndexedDB'de saklanir, finansal hesaplamalarda kullanilir

### Story 5.5b: Taahut Modeli Finansal Etki Hesabi

As a saha muhendisi,
I want tanimlanan taahut modellerinin MRR ve ROI uzerindeki etkisini gorebilmek,
So that hangi taahut yapisinin finansal olarak en avantajli oldugunu anlayabileyim.

**Acceptance Criteria:**

**Given** taahut modeli tanimlandiginda
**When** MRR/ROI hesabi yapildiginda
**Then** taahut modelinin MRR uzerindeki etkisi gosterilmeli (FR38):
- Taahutlu abone MRR'i (indirimli fiyat x abone)
- Taahutsuz abone MRR'i (tam fiyat x abone)
- Toplam MRR = taahutlu MRR + taahutsuz MRR
**And** taahut karsilama maliyeti hesaplanmali (FR39): kampanya suresi boyunca indirim farki toplami

**Given** kampanya parametreleri uygulandiginda
**When** finansal etki hesaplandiginda
**Then** kampanyanin toplam maliyeti gosterilmeli:
- Ucretsiz modem maliyeti (varsa)
- Kurulum muafiyet maliyeti (varsa)
- Indirim farki toplami (kampanya suresi x indirim tutari x abone sayisi)
**And** net gelir = brut gelir - kampanya maliyeti olarak hesaplanmali

**Given** kullanici taahut etkisini incelediginde
**When** MRR/ROI paneli goruntulendikten
**Then** taahutlu vs taahutsuz MRR dagilimlari ayri gosterilmeli
**And** kampanya maliyetinin ROI'ye etkisi gorsel olarak belirtilmeli

**Teknik Notlar:**
- Financial modulu — calculateCommitmentImpact(commitmentModel, adaData) fonksiyonu
- Story 5.4'teki MRR/ROI hesap motoruna entegre
- Taahutlu ve taahutsuz aboneleri ayri ayri hesaplar, toplar
- Kampanya maliyeti toplam yatirim maliyetine eklenir

### Story 5.6: Taahut Senaryo Karsilastirma

As a saha muhendisi,
I want birden fazla taahut senaryosunu yan yana karsilastirabilmek,
So that en karli pazarlama stratejisini veriye dayali olarak secebilirim.

**Acceptance Criteria:**

**Given** en az 2 taahut modeli tanimlandiginda
**When** kullanici "Taahut Karsilastir" islemini baslattiginda
**Then** yan yana karsilastirma tablosu acilmali (FR40)
**And** sutunlarda taahut senaryolari, satirlarda metrikler olmali

**Given** karsilastirma tablosu gosterildiginde
**When** metrikler goruntulendikten
**Then** asagidaki metrikler her senaryo icin gosterilmeli:
- Taahut suresi ve fiyatlandirma
- Aylik MRR (taahutlu + taahutsuz)
- Yillik gelir projeksiyonu
- Taahut karsilama maliyeti (indirim farki toplami)
- Net gelir (gelir - karsilama maliyeti)
- ROI ve break-even suresi
- Churn orani ve abone kaybi etkisi
**And** en yuksek net gelirli senaryo vurgulanmali

**Given** kullanici karsilastirma sonrasi bir senaryoyu sectiginde
**When** "Aktif Model Yap" islemini onayladiginda
**Then** secilen taahut modeli adanin aktif finansal modeli olmali
**And** MRR/ROI hesaplari secilen modele gore guncellenmeli

**Given** kullanici 3+ taahut senaryosu karsilastirdiginda
**When** tablo goruntulendikten
**Then** yatay scroll ile tum senaryolar goruntulenebilmeli
**And** metrik satir basliklari sabit kalmali (sticky column)

**Teknik Notlar:**
- Financial modulu — compareCommitmentScenarios() fonksiyonu
- Epic 4 karsilastirma tablosu yapisiyla tutarli UI (ayni CSS bilesen)
- Metrik hesaplama: her taahut modelinin MRR/ROI degerlerinden turetilir
- Aktif model secimi: Financial.setActiveCommitment(modelId)

---

## Epic 6: Pazarlama Stratejisi ve Bolgesel Planlama

Muhendis senaryo verilerini yapilandirilmis sekilde saklar, bolge bazli pazarlama stratejisi karsilastirmasi yapar, isi haritalarindan faydalanir ve komsu adalara gecis yaparak seri planlama gerceklestirir.

### Story 6.1: Senaryo Verisi Saklama ve Disa Aktarma

As a saha muhendisi,
I want topoloji ve finansal senaryo sonuclarini yapilandirilmis sekilde saklayabilmek ve disa aktarabilmek,
So that farkli zamanlarda yaptigim analizleri geri yukleyebilir ve raporlama icin paylasabileyim.

**Acceptance Criteria:**

**Given** bir ada icin topoloji hesabi, varyasyonlar ve finansal analiz tamamlandiginda
**When** kullanici senaryoyu kaydettiginde
**Then** tum senaryo verileri yapilandirilmis JSON formatinda saklanmali (FR41):
- Topoloji snapshot'i (binalar, OLT, rotalama, splitter, loss budget)
- Envanter ve maliyet verileri
- Finansal analiz (MRR, ROI, taahut modeli)
- Varyasyon karsilastirma sonuclari
- Meta veri (tarih, ada kodu, versiyon)
**And** kayit IndexedDB calculations store'unda saklanmali

**Given** birden fazla senaryo kaydedildiginde
**When** senaryo listesi goruntulendikten
**Then** tum kayitli senaryolar tarih ve ozet metrikleriyle listelenmeli
**And** herhangi bir senaryo geri yuklenebilmeli
**And** senaryolar arasi gecis yapilabilmeli

**Given** kullanici senaryo verilerini disa aktarmak istediginde
**When** export islemini baslattiginda
**Then** JSON formatinda yapilandirilmis dosya indirilmeli (FR43)
**And** dosya baska bir FiberPlan kurulumunda import edilebilir formatta olmali
**And** export oncesi hassas veri uyarisi gosterilmeli

**Teknik Notlar:**
- MarketingDataHouse modulu (lib/marketing-data-house.js) — IIFE pattern, yeni modul
- Senaryo verisi: { id, adaId, timestamp, topology, inventory, financial, variations, meta }
- IndexedDB calculations store — ada bazli senaryo dizisi
- Export: Blob URL ile JSON dosya indirme

### Story 6.2: Bolge Bazli Pazarlama Stratejisi

As a saha muhendisi,
I want farkli bolgelerdeki adalarin pazarlama stratejilerini karsilastirabilmek ve en karli kombinasyonu gorebilmek,
So that sinirli butceyi en yuksek getiri saglayacak bolgelere yonlendirebilirim.

**Acceptance Criteria:**

**Given** birden fazla ada icin senaryo verileri kayitliyken
**When** kullanici bolge bazli karsilastirma gorunumunu actiginda
**Then** adalarin pazarlama metrikleri yan yana karsilastirma tablosunda gosterilmeli (FR42):
- Ada kodu ve adi
- Toplam yatirim maliyeti
- Beklenen MRR
- ROI yuzdesi
- Break-even suresi (ay)
- Penetrasyon potansiyeli
- Kalite skoru
**And** tablo siralama destegi olmali (herhangi bir metrige gore)

**Given** karsilastirma tablosu gosterildiginde
**When** en karli strateji kombinasyonu analiz edildiginde
**Then** sistem butce limiti dahilinde en yuksek toplam ROI saglayan ada kombinasyonunu ozet olarak sunmali (FR44)
**And** onceliklendirme onerileri gosterilmeli (en yuksek ROI'den en dusuge)
**And** toplam butce etkisi hesaplanmali

**Given** kullanici belirli bir butce limitini girdiginde
**When** optimizasyon hesabi yapildiginda
**Then** butce dahilinde en karli ada kombinasyonu onerisi gosterilmeli
**And** toplam beklenen gelir ve ROI hesaplanmali

**Teknik Notlar:**
- MarketingDataHouse — compareRegions(), optimizeBudget() fonksiyonlari
- Coklu ada karsilastirmasi: IndexedDB'den tum adalarin ozet metriklerini ceker
- Butce optimizasyonu: ada ROI siralama + greedy secim algoritmasi
- Yonetim sekmesinde bolgesel analiz alt bolumu

### Story 6.3: Isi Haritasi Gorsellestirme ve Katman Yonetimi

As a saha muhendisi,
I want harita uzerinde potansiyel musteri yogunlugu ve ariza yogunlugu isi haritalarini gorebilmek,
So that yatirim kararlarimi gorsel veriye dayandirabilir ve sorunlu bolgeleri hizla tespit edebilirim.

**Acceptance Criteria:**

**Given** adalarin BB sayilari ve penetrasyon oranlari mevcut olduGunda
**When** kullanici potansiyel musteri yogunlugu katmanini actiginda
**Then** harita uzerinde BB yogunluguna dayali isi haritasi gosterilmeli (FR51)
**And** yogun bolgeler kirmizi, dusuk yogunluk bolgeleri mavi olarak gorsellestirilmeli
**And** isi haritasi gradient gosterimi ile gecisler yumusak olmali

**Given** ariza verileri mevcut olduGunda (kullanici girisli veya cache'den)
**When** kullanici ariza yogunlugu katmanini actiginda
**Then** ariza dagilimi isi haritasi olarak gosterilmeli (FR52)
**And** yuksek ariza yogunlugu kirmizi, dusuk yogunluk yesil olarak gorsellestirilmeli

**Given** birden fazla isi haritasi katmani mevcut olduGunda
**When** kullanici katman kontrol panelini kullandiginda
**Then** her katman bagimsiz olarak acilip kapatilabilmeli (FR53)
**And** katman saydamligi ayarlanabilmeli (slider ile %0-%100)
**And** aktif katmanlar gorsel olarak isaretlenmeli
**And** en fazla 2 katman ayni anda goruntulenebilmeli (performans icin)

**Teknik Notlar:**
- HeatMap modulu (content/heat-map.js) — IIFE pattern, yeni modul
- Canvas overlay ile isi haritasi cizimi (Leaflet canvas katmani)
- Veri kaynagi: IndexedDB adas store'undan BB yogunlugu, kullanici girisli ariza verileri
- Katman kontrol paneli: fp-layer-control bilesen, harita sag ustunde
- Performans: canvas rasterizasyon, tile bazli render (buyuk alan icin)

### Story 6.4: Isi Haritasi ile Yatirim Onceliklendirme

As a saha muhendisi,
I want isi haritasi verilerini yatirim onceliklendirmesi icin kullanabilmek,
So that en yuksek potansiyeli olan bolgelere once yatirim yapabilir ve kaynaklarimi verimli kullanabilirim.

**Acceptance Criteria:**

**Given** potansiyel musteri yogunlugu ve ariza yogunlugu isi haritalari aktif olduGunda
**When** kullanici yatirim onceliklendirme analizini baslattiginda
**Then** adalarin oncelik sirasi hesaplanmali (FR54):
- Yuksek musteri yogunlugu + dusuk ariza = oncelik 1 (en iyi yatirim)
- Yuksek musteri yogunlugu + yuksek ariza = oncelik 2 (yatirim + iyilestirme)
- Dusuk musteri yogunlugu + dusuk ariza = oncelik 3 (dusuk oncelik)
- Dusuk musteri yogunlugu + yuksek ariza = oncelik 4 (sadece iyilestirme)
**And** oncelik sirasi harita uzerinde renk kodlariyla gorsellestirilmeli

**Given** onceliklendirme hesabi tamamlandiginda
**When** oncelik listesi goruntulendikten
**Then** adalar oncelik sirasina gore listelenmeli
**And** her ada icin: oncelik skoru, beklenen ROI, tahmini yatirim tutari gosterilmeli
**And** liste filtrelenebilir olmali (oncelik seviyesine gore)

**Given** kullanici onceliklendirme parametrelerini ayarlamak istediginde
**When** agirlik katsayilarini degistirdiginde (orn: musteri yogunlugu %70, ariza %30)
**Then** oncelik sirasi yeniden hesaplanmali
**And** harita ve liste aninda guncellenmeli

**Teknik Notlar:**
- MarketingDataHouse — calculatePriority(adaMetrics, weights) fonksiyonu
- Oncelik skoru: weightedScore = (customerDensity * w1) + (1 - faultDensity) * w2
- Varsayilan agirliklar: musteri yogunlugu %60, ariza tersi %40
- Harita renklendirme: oncelik 1=koyu yesil, 2=acik yesil, 3=sari, 4=kirmizi

### Story 6.5: Komsu Ada Sematigi ve Seri Planlama

As a saha muhendisi,
I want mevcut adanin komsularini gorsel olarak gorebilmek ve tiklayarak hizla gecis yapabilmek,
So that bolgedeki adalari sirayla verimli planlayabilir ve bolgesel gorusu kaybetmeyeyim.

**Acceptance Criteria:**

**Given** bir ada aktif olarak yuklendiginde
**When** komsu ada sematigi gosterildiginde
**Then** mevcut adanin etrafindaki komsu adalar sematik olarak gorsellestirilmeli (FR49)
**And** her komsu ada icin: ada kodu, bina sayisi ve durum badge'i gosterilmeli
**And** mevcut ada merkeze, komsular etrafina konumlandirilmali

**Given** komsu ada sematigi gorunurken
**When** kullanici bir komsu adaya tikladiginda
**Then** tiklanan ada otomatik olarak yuklenmeli (FR50)
**And** mevcut adanin durumu kaydedilmeli
**And** yeni adanin topolojisi ve hesaplari yuklenmeli
**And** sematik yeni adanin komsularina gore guncellenmeli

**Given** kullanici seri planlama yaptiginda (ada -> komsu ada -> komsu ada)
**When** birden fazla ada sirayla planlandiginda
**Then** her adanin durumu otomatik saklanmali
**And** gezinme gecmisi (breadcrumb) gosterilmeli: Ada A → Ada B → Ada C
**And** gecmisteki herhangi bir adaya tek tikla donulebilmeli

**Given** komsu ada bilgisi mevcut olmadiginda (ilk kullanimda)
**When** sematik gosterilmek istendiginde
**Then** NVI portalindan komsu ada bilgisi cekilebilmeli (sayfadaki mahalle/ada verilerinden)
**And** cekilemeyen durumlarda "Komsu ada bilgisi mevcut degil" mesaji gosterilmeli

**Teknik Notlar:**
- Komsu ada sematigi: basit SVG/canvas cizimi (merkez ada + etraf adalar)
- NVI'dan komsu ada tespiti: ayni mahalle icerisindeki diger adalar
- Seri planlama: Topology.saveAda() + Topology.loadAda() akisi (Story 2.3 altyapisi)
- Gezinme gecmisi: basit dizi yapisi, panel ust kisminda breadcrumb
- Yonetim sekmesi icerisinde veya harita uzerinde mini-widget olarak

---

## Epic 7: Canli Ag Izleme (Post-MVP)

Muhendis planlanan topolojiyi canli ag durumuyla karsilastirir, cihaz performansini izler, UISP/Zabbix metriklerini goruntuler.

### Story 7.1: UISP Cihaz Durum Entegrasyonu

As a saha muhendisi,
I want UBNT UISP platformundan cihaz durum verilerini gorebilmek,
So that sahadaki aktif ekipmanlarin canli durumunu planlama ekraninda izleyebileyim.

**Acceptance Criteria:**

**Given** UISP API erisim bilgileri tanimlandiginda
**When** sistem cihaz verilerini cektiginde
**Then** UISP'den cihaz listesi, durum (online/offline), sinyal seviyesi ve uptime bilgileri alinmali (FR69)
**And** veriler periyodik olarak guncellenmeli (varsayilan 5 dk aralik)
**And** API hatasi durumunda son basarili veri gosterilmeli ve uyari verilmeli

**Given** UISP cihaz verileri cekildiginde
**When** cihazlar planlanan topolojiyle eslestirildiginde
**Then** her cihaz ilgili binayla eslesmeli (FR68): cihaz adi / MAC adresi → bina eslemesi
**And** eslesen cihazlar haritada canli durum rengiyle gosterilmeli (online=yesil, offline=kirmizi)
**And** eslesmeyen cihazlar ayri listede gosterilmeli

**Teknik Notlar:**
- LiveMonitor modulu (lib/live-monitor.js) — IIFE pattern, yeni modul
- UISP API: REST endpoint'leri ile cihaz listesi ve durum
- Cihaz-bina esleme: kullanici tarafindan manuel veya otomatik (isim benzerlik) esleme
- Post-MVP: backend proxy gerektirebilir (CORS)

### Story 7.2: Zabbix Ag Metrikleri Entegrasyonu

As a saha muhendisi,
I want Zabbix izleme platformundan ag metriklerini gorebilmek,
So that ag performansini ve sorunlari planlama ekraninda takip edebilir ve sorunlari erken tespit edebileyim.

**Acceptance Criteria:**

**Given** Zabbix API erisim bilgileri tanimlandiginda
**When** sistem ag metriklerini cektiginde
**Then** Zabbix'ten ag metrikleri alinmali (FR70): bant genisligi, paket kaybi, gecikme, uptime
**And** metrikler cihaz/bina bazinda gruplinmali
**And** veriler periyodik olarak guncellenmeli

**Given** ag metrikleri mevcut olduGunda
**When** kullanici cihaz performans goruntusune gectiginde
**Then** secilen cihaz/bina icin performans grafikleri gosterilmeli (FR72):
- Bant genisligi (Mbps) — zaman serisi grafik
- Paket kaybi (%) — zaman serisi grafik
- Gecikme (ms) — zaman serisi grafik
**And** grafik zaman araligi secilmeli (son 1 saat / 24 saat / 7 gun / 30 gun)

**Teknik Notlar:**
- LiveMonitor modulu — Zabbix API entegrasyonu
- Zabbix API: JSON-RPC ile metrik sorgulama
- Grafik: basit canvas/SVG cizimi (zaman serisi)
- Post-MVP: backend proxy gerektirebilir (CORS)

### Story 7.3: Planlanan vs Canli Ag Karsilastirma

As a saha muhendisi,
I want planlanan topolojiyi canli ag durumuyla karsilastirabilmek,
So that planla gerceklik arasindaki farklari tespit edebilir ve duzeltici aksiyonlar alabileyim.

**Acceptance Criteria:**

**Given** planlanan topoloji (Epic 2) ve canli ag verileri (Story 7.1, 7.2) mevcut olduGunda
**When** kullanici karsilastirma gorunumunu actiginda
**Then** planlanan vs canli ag yan yana veya overlay olarak gosterilmeli (FR71):
- Planlanan binalar vs canli cihazlar eslemesi
- Planlanan port kapasitesi vs gercek kullanim
- Planlanan kablo rotalari vs tespit edilen baglantılar
**And** uyumsuzluklar gorsel olarak vurgulanmali (kirmizi ile)

**Given** uyumsuzluklar tespit edildiginde
**When** fark listesi gosterildiginde
**Then** her uyumsuzluk icin: tip, konum, planlanan deger, gercek deger gosterilmeli
**And** uyumsuzluklar oncelik sirasina gore listelenmeli
**And** toplam uyumsuzluk sayisi ozet olarak gosterilmeli

**Teknik Notlar:**
- LiveMonitor modulu — comparePlannedVsLive() fonksiyonu
- Karsilastirma: planlanan topoloji (Topology) vs canli veriler (UISP + Zabbix)
- Overlay modu: haritada planlanan (mavi) vs canli (yesil) katmanlar
- Uyumsuzluk tipleri: eksik cihaz, fazla cihaz, kapasite asimi, baglanti farki

### Story 7.4: TR-069 ACS Entegrasyonu, Zero Touch Provisioning ve Firmware Yonetimi

As a ag yoneticisi,
I want TR-069/TR-369 protokolu uzerinden tum CPE cihazlarimi uzaktan yonetebilmek, yeni cihazlari otomatik yapilandirabilmek ve firmware guncellemelerini toplu yapabilmek,
So that saha ziyaretlerini %60-70 azaltabileyim ve yuzlerce cihaza tek seferde konfigürasyon/firmware dagitabileyim.

**Acceptance Criteria:**

**Given** ACS modulu aktif olduGunda
**When** TR-069 destekli bir CPE cihazi (TP-Link XC220-G3, Tenda, Cudy) aga baglandiginda
**Then** cihaz otomatik olarak ACS'ye CWMP uzerinden kayit olmali
**And** cihaz seri numarasi, MAC adresi, model ve firmware versiyonu kaydedilmeli

**Given** ACS'ye kayitli bir cihaz mevcut olduGunda
**When** yonetici uzaktan yonetim islemleri baslattiginda
**Then** WiFi ayarlari, PPPoE kimlik bilgisi, bandwidth limiti degistirilebilmeli
**And** fabrika ayarlarina sifirlama ve uzaktan diagnostik (ping, traceroute) yapilabilmeli

**Given** yeni bir CPE cihazi sahaya gonderildiginde
**When** cihaz elektrige takilip WAN baglantisi kuruldugunda
**Then** ZTP sureci otomatik baslamali: seri numarasiyla ACS'ye baglanip dogru profili indirmeli
**And** teknisyenin cihaza console ile baglanmasina gerek kalmamali

**Given** firmware guncelleme plani olusturulduGunda
**When** yonetici toplu guncelleme baslattiginda
**Then** secilen cihaz grubuna firmware push yapilabilmeli
**And** guncelleme oncesi otomatik config backup alinmali
**And** basarisiz guncelleme durumunda otomatik rollback yapilabilmeli

**Teknik Notlar:**
- AcsManager modulu (lib/acs-manager.js) — IIFE pattern, yeni modul
- Harici ACS sunucusu gerekli (GenieACS oneriliyor) — Extension sadece API client
- Desteklenen cihazlar: TP-Link XC220-G3, Tenda HG9/V300, Cudy tum seriler (hepsi TR-069 destekli)
- TR-069 CWMP protokolu: Inform, GetParameterValues, SetParameterValues, Download, Upload, Reboot, FactoryReset
- ZTP: cihaz boot → PPPoE baglanti → TR-069 client ACS'ye baglan → profil indir → provisioning complete
- Firmware: TR-069 Download RPC ile push, oncesinde Upload RPC ile config backup

### Story 7.5: NetFlow/sFlow/IPFIX Trafik Analizi

As a ag yoneticisi,
I want router ve switch'lerden gelen flow verilerini toplayip analiz edebilmek,
So that ag trafigini uygulama bazinda gorebileyim, kapasite planlamasini gercek veriye dayandirabileyim ve anormal trafik paternlerini erken tespit edebileyim.

**Acceptance Criteria:**

**Given** flow collector aktif olduGunda
**When** router'lar flow verisi gonderdiginde
**Then** flow kayitlari toplanmali ve islenmeli (kaynak/hedef IP, port, protokol, byte/paket sayisi)
**And** veriler zaman serisi olarak saklanmali (24h detayli, 7d agregat, 30d ozet)

**Given** flow verileri toplandıGında
**When** kullanici trafik analiz panelini actiginda
**Then** top talkers, uygulama dagilimi, bant genisligi kullanimi ve protokol dagilimi goruntulenebilmeli
**And** tum gorunumlerde zaman araligi secimi olmali

**Given** flow analizi calisirken
**When** anormal trafik paterni tespit edildiginde
**Then** anomali uyarisi uretilmeli (bandwidth hog >%30, DDoS sinyali, port scan)
**And** anomali detaylari loglanmali ve EventBus uzerinden bildirilmeli

**Teknik Notlar:**
- FlowAnalyzer modulu (lib/flow-analyzer.js) — IIFE pattern, yeni modul
- Harici flow collector gerekli (ntopng oneriliyor) — Extension sadece API client
- NetFlow v5/v9, sFlow v5, IPFIX destegi (collector uzerinden)
- MikroTik router'lar sFlow destekler — Cankiri altyapisiyla uyumlu
- Uygulama siniflandirma: port-bazli (80/443=Web, 6881-6889=Torrent, 3478-3497=Gaming)
- IndexedDB kullan (flow verileri buyuk — chrome.storage.local yetersiz)

### Story 7.6: QoE (Quality of Experience) Motoru

As a ag yoneticisi,
I want her abonenin gercek internet deneyim kalitesini olcebilmek ve bufferbloat gibi sorunlari otomatik tespit edebilmek,
So that musteri memnuniyetini proaktif olarak izleyebileyim ve churn oranini dusurebileyim.

**Acceptance Criteria:**

**Given** QoE motoru aktif olduGunda
**When** abone bazinda ag metrikleri toplandıGında
**Then** her abone icin QoE skoru (0-100) hesaplanmali (latency %30, jitter %20, packet loss %25, throughput %25)
**And** QoE gecmisi saklanmali (trend analizi icin son 30 gun)

**Given** QoE metrikleri toplandıGında
**When** bufferbloat tespit edildiginde
**Then** etkilenen abone ve ekipman bilgisi raporlanmali
**And** onerilen AQM (FQ-CoDel) ayari sunulmali

**Given** AP veya OLT portu kapasite limitine yaklastiginda
**When** ortalama kullanim >%80 olduGunda
**Then** kapasite uyarisi uretilmeli ve genisleme onerisi sunulmali

**Given** QoE verileri toplandıGında
**When** kullanici QoE dashboard'unu actiginda
**Then** genel ozet, abone QoE listesi, detay grafikleri ve problem haritasi goruntulenebilmeli

**Teknik Notlar:**
- QoeEngine modulu (lib/qoe-engine.js) — IIFE pattern, yeni modul
- Metrik kaynagi: Zabbix (Story 7.2) + FlowAnalyzer (Story 7.5) — her ikisi bagimlilik
- QoE skoru: agirlikli formul (latency 0.30, jitter 0.20, loss 0.25, throughput 0.25)
- Bufferbloat tespiti: loaded vs unloaded latency farki >%200
- Preseem modeli ilham kaynagi (endustriyel QoE cozumu)
- AQM onerisi: FQ-CoDel (MikroTik RouterOS v7+) veya CAKE
- IndexedDB kullan (QoE zaman serisi verileri buyuk)

### Story 7.7: Abone Self-Servis Portali

As a internet abonesi,
I want kendi web panelimden faturami gorebilmek, paketimi degistirebilmek, hiz testi yapabilmek ve destek talebi acabilmek,
So that cagri merkezini aramadan islemlerimi kendim halledebileyim.

**Acceptance Criteria:**

**Given** abone portalina giris yapildiginda
**When** ana sayfa yuklendiginde
**Then** abone dashboard'u gosterilmeli (paket, kullanim, fatura, baglanti durumu)

**Given** abone fatura bolumune gectiginde
**When** fatura listesi goruntulendiginde
**Then** gecmis faturalar, detay, PDF indirme ve odeme gecmisi gorulebilmeli

**Given** abone paket degisikligi yapmak istediginde
**When** paket yonetim sayfasina gectiginde
**Then** paket karsilastirma ve degisiklik talebi olusturulabilmeli

**Given** abone hiz testi yapmak istediginde
**When** hiz testi butonuna bastiginda
**Then** download/upload hiz, latency ve jitter olculebilmeli
**And** sonuclar QoE skoruyla iliskilendirilmeli

**Given** abone destek talebi acmak istediginde
**When** destek sayfasina gectiginde
**Then** yeni talep olusturma, mevcut talep izleme ve SSS goruntulenebilmeli
**And** talep olusturuldugunda otomatik diagnostik raporu eklenmeli

**Given** abone WiFi ayarlarini degistirmek istediginde
**When** WiFi yonetim sayfasina gectiginde
**Then** SSID, sifre degistirme ve bagli cihazlar listelenebilmeli
**And** degisiklikler TR-069 ACS uzerinden CPE cihazina push edilmeli

**Teknik Notlar:**
- Chrome Extension'dan BAGIMSIZ web uygulamasi — ayri deploy
- Backend API gerekli (Node.js + Express/Fastify oneriliyor)
- Mobil oncelikli responsive tasarim (aboneler telefondan erisecek)
- Vanilla HTML/CSS/JS veya Alpine.js — bundler YASAK
- ACS (Story 7.4) entegrasyonu: WiFi yonetimi, firmware bilgisi
- QoE (Story 7.6) entegrasyonu: hiz testi sonuclari, kalite skoru
- RADIUS entegrasyonu: fatura ve paket bilgileri mevcut RADIUS'tan cekilir
- Referans platformlar: Splynx Customer Portal, Sonar

---

## Epic 8: AI Destekli Proaktif Ariza Yonetimi (Vizyon)

Sistem ag metriklerinde anomali tespit eder, ariza tahmin eder, onleyici bakim onerir ve modelleri gercek verilerle surekli iyilestirir.

### Story 8.1: Anomali Tespiti ve Ariza Tahmini

As a ag yoneticisi,
I want ag metriklerindeki anomalilerin otomatik tespit edilmesini ve olasi arizalarin onceden tahmin edilmesini,
So that sorunlar buyumeden mudahale edebilir ve kesintisiz hizmet sunabileyim.

**Acceptance Criteria:**

**Given** canli ag metrikleri (Epic 7) surekli toplaniyor olduGunda
**When** anomali tespit motoru calistiginda
**Then** normal davranis profilinden sapan metrikler otomatik tespit edilmeli (FR73):
- Ani bant genisligi dususu
- Normalin uzerinde paket kaybi
- Gecikme artisi trendi
- Cihaz uptime anormallikleri
**And** her anomali icin: ciddiyet seviyesi, etkilenen cihaz/bina, baslanis zamani raporlanmali

**Given** anomali verileri biriktiginde
**When** ariza tahmin modeli calistiginda
**Then** gelecek 7 gun icerisinde olasi arizalar tahmin edilmeli (FR74)
**And** tahmin icin: olasilik yuzdesi, beklenen ariza tipi, etkilenen bolge gosterilmeli
**And** tahminler haritada gorsel olarak isaretlenmeli

**Teknik Notlar:**
- AIEngine modulu (lib/ai-engine.js) — Vizyon fazinda gelistirilecek
- Anomali tespiti: istatistiksel yontemler (Z-score, moving average sapma)
- Ariza tahmini: trend analizi + gecmis ariza korelasyonu
- Veri kaynagi: Zabbix metrikleri + gecmis ariza kayitlari

### Story 8.2: Otomatik Uyari ve Onleyici Bakim

As a ag yoneticisi,
I want tespit edilen anomaliler ve ariza tahminleri icin otomatik uyari almak ve onleyici bakim onerileri gorebilmek,
So that proaktif olarak mudahale edebilir ve ariza suresini minimize edebilirim.

**Acceptance Criteria:**

**Given** bir anomali veya ariza tahmini tespit edildiginde
**When** uyari sistemi tetiklendiginde
**Then** otomatik uyari olusturulmali (FR75):
- Uyari seviyesi (bilgi/uyari/kritik)
- Etkilenen cihaz ve konum
- Onerilen aksiyon
**And** uyarilar panel icerisinde bildirim olarak gosterilmeli
**And** kritik uyarilar gorsel olarak one cikarilmali (kirmizi badge + ses/titresim opsiyonel)

**Given** bir ariza tahmini veya tekrarlayan anomali tespit edildiginde
**When** onleyici bakim motoru calistiginda
**Then** sisteme ozel bakim onerileri olusturulmali (FR76):
- Etkilenen ekipman ve konum
- Onerilen bakim aksiyonu (kablo kontrolu, cihaz yenileme, splitter degisimi vb.)
- Tahmini bakim maliyeti
- Aciliyet seviyesi
**And** oneriler oncelik sirasina gore listelenmeli

**Given** AI modeli uretimde calisiyorken
**When** gercek ariza verileri toplandikca
**Then** model tahmin dogrulugu surekli olculecek (FR77)
**And** yanlis pozitif/negatif oranlari izlenmeli
**And** model periyodik olarak gercek verilerle yeniden egitilmeli
**And** model performans metrikleri goruntulenmeli

**Teknik Notlar:**
- AIEngine modulu — anomalyDetect(), predictFailure(), suggestMaintenance()
- Uyari sistemi: EventBus uzerinden alert:created olaylari
- Onleyici bakim: kurala dayali (rule-based) + istatistiksel tahmin
- Model iyilestirme: gercek ariza verilerinin geri besleme dongusunde kullanilmasi
- Vizyon fazi: backend ML servisi gerektirebilir
