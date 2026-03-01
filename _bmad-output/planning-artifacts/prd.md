---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish']
inputDocuments:
  - '_bmad-output/planning-artifacts/research/technical-gpon-ftth-tek-seviye-topoloji-research-2026-02-28.md'
  - '_bmad-output/brainstorming/brainstorming-session-2026-02-27.md'
  - '_bmad-output/project-context.md'
workflowType: 'prd'
documentCounts:
  briefs: 0
  research: 1
  brainstorming: 1
  projectDocs: 1
classification:
  projectType: 'web_app'
  domain: 'telecom_fiber_infrastructure'
  complexity: 'high'
  projectContext: 'brownfield'
---

# Product Requirements Document - NVI FIBER

**Author:** BURAK
**Date:** 2026-02-28
**Versiyon:** 1.0

## Yonetici Ozeti

### Vizyon
FiberPlan, Turkiye'nin NVI adres portali uzerinde calisan bir Chrome Extension ile saha muhendislerinin FTTH fiber ag topolojisini planlama, maliyet hesaplama ve yatirim analizi yapmasini saglayan ucretsiz bir muhendislik aracidir.

### Farklilik
Geleneksel FTTH planlama araclari (IQGeo, 3-GIS, Vetro FiberMap, Comsof) kurumsal lisans gerektiren agir GIS platformlaridir. FiberPlan ise:
- NVI devlet portalini dogrudan veri kaynagi olarak kullanir - ayri veri girisi gerektirmez
- Tamamen tarayici icinde calisir - kurulum, sunucu veya GIS lisansi gerektirmez
- Saha muhendisi sahada aninda hesaplama yapabilir
- Mevcut pazarda bu yaklasimda calisan baska bir sistem bulunmuyor

### Hedef Kullanicilar
Saha muhendisleri ve yoneticiler (baslangicta 2 kullanici). Ada bazli FTTH planlama, envanter yonetimi, maliyet analizi ve bolgesel stratejik kararlari tek ekrandan yonetirler.

### Gelistirme Yaklasimi
Hibrit: Mevcut sistemin kanitlanmis hesaplama cekirdegi (~%60) korunacak, UI ve veri katmani yeniden yazilacak (~%25), yeni moduller eklenecek (~%15). MVP tamamen offline, IndexedDB tabanli calisir; backend entegrasyonu Post-MVP'de planlanir.

## Basari Kriterleri

### Kullanici Basarisi
- Saha muhendisi, bir adanin FTTH topolojisini NVI portali uzerinden eksiksiz tanimlayabilir (bina secimi, OLT yerlesimi, kablo rotalama)
- Farkli penetrasyon oranlari ve fiber konfigurasyonlari icin varyasyon analizi yapabilir ve optimum senaryoyu secebilir
- Sistem otomatik olarak malzeme listesi, envanter kalemleri ve birim maliyetleri uretir; manuel hesaplama tamamen ortadan kalkar
- Envanterdeki fiyat veya malzeme tipi degistiginde tum maliyet hesaplamalari otomatik guncellenir
- Gecmis hesaplamalara ve farkli varyasyonlara geri donulebilir

### Is Basarisi
- Tum saha calismalari ve ada planlari tek ekrandan izlenebilir
- Aktif musteri sayisi (effBB = BB x penetrasyon) sisteme dogru yansir
- MRR projeksiyonu: abone basina aylik gelir x aktif abone sayisi
- ROI hesabi: tum yatirim maliyetleri (fiber + ekipman + modem + kampanya) vs gelir projeksiyon karsilastirmasi
- Karmasik veriler sadelestirilmis gorunumle sunulur; operasyonel surecler seffaf

### Teknik Basari
- ITU-T G.984 Class B+ standartlarina tam uyum (26.0 dB operator loss budget siniri)
- Hesaplama sonuclari saha olcumleriyle tutarli (loss budget dogrulugu)
- IndexedDB ile yerel veri depolama, offline calisma destegi
- 2 kullanici icin etkili performans ve veri tutarliligi

### Olculebilir Sonuclar
- Manuel hesaplama sureci: %100 ortadan kalkmali
- Hesaplama dogrulugu: ITU-T standart degerlerinden sapma < %5
- Envanter guncelleme: fiyat/malzeme degisikliginde aninda yeniden hesaplama
- Varyasyon karsilastirma: en az 3 farkli senaryo yan yana kiyaslanabilmeli

## Urun Kapsami

### MVP
- Chrome Extension: NVI portal entegrasyonu, ada bazli bina secimi, Leaflet harita overlay
- PonEngine: OLT yerlesimi, tek seviye MST, splitter hesabi, loss budget (26.0 dB), envanter ve maliyet
- Varyasyon analizi: farkli penetrasyon/konfigurasyonlarda kiyaslama
- Tek ekran deneyimi: dashboard islevleri overlay paneline entegre, ayri sayfa yok
- IndexedDB: yerel veritabani, NVI verilerini cache'leme, offline calisma
- Envanter yonetimi: interaktif fiyat guncelleme, otomatik maliyet yeniden hesaplama
- Finansal analiz: MRR/ROI hesaplari, tum yatirim kalemleri (fiber + aktif ekipman + modem + kampanya)
- Taahhhut/abonelik modelleri: taahutlu, taahutsuz, kampanya parametreleri
- Modem maliyet yonetimi: ucretli/ucretsiz verilme, ek maliyet hesaplama
- Pazarlama data house: senaryo verileri, strateji karsilastirma, dis aktarim
- Isi haritalari: potansiyel musteri yogunlugu, bolgesel analiz
- Extension erisim kontrolu: aktivasyon kodu/yonetici onayi sistemi
- Otomatik yedekleme, geri al/ileri al, arka plan loglama

### Buyume (Post-MVP)
- Backend entegrasyonu: merkezi sunucu, kimlik dogrulama, cihazlar arasi senkronizasyon
- Gercek zamanli canli guncelleme (backend uzerinden)
- IndexedDB → backend veritabanina veri migrasyonu ve senkronizasyon
- OTDR olcum entegrasyonu (hesaplanan vs olculen deger karsilastirmasi)
- Canli ag izleme: UBNT UISP + Zabbix entegrasyonu, cihaz durum izleme
- Rol bazli erisim kontrolu ve daha fazla kullanici destegi
- Dinamik konnektor/splice sayisi (sabit 4+2 yerine gercek rota bazli)

### Vizyon (Gelecek)
- Yapay zeka destekli proaktif ariza yonetimi: anomali tespiti, ariza tahmini, onleyici bakim
- Otonom planlama: AI destekli topoloji onerisi
- ML tabanli optimizasyon onerileri
- Coklu operator destegi
- Mobil uygulama (saha icin)
- Turkiye capinda olceklendirme

## Kullanici Yolculuklari

### Yolculuk 1: Yeni Ada Planlama (Basari Yolu)

**Karakter:** Burak, saha muhendisi ve yonetici. Yeni bir mahalledeki ada icin FTTH planlama yapacak.

**Acilis:** Burak NVI adres portalini aciyor. Daha once her seyi Excel'de manuel hesapliyordu - kablo corlari, splitter'lar, maliyetler. Hatalar yapiyordu, 4 core olmasi gereken yere 12 core kablo atiyordu. Simdi FiberPlan Chrome Extension aktif.

**Yukselis:** NVI portalinde adayi seciyor. Scraper otomatik olarak binalari ve bagimsiz bolumleri tariyor. Harita uzerinde binalar pentagon ikonlarla beliriyor. Burak OLT binasini seciyor - sistem agirlikli geometrik medyanla optimal konumu oneriyor. Tek tikla onayliyor.

**Doruk:** HESAPLA butonuna basiyor. PonEngine saniyeler icinde tum pipeline'i calistiriyor: tek seviye MST rotalama, her bina icin dogru splitter hesabi, loss budget kontrolu (26.0 dB siniri icinde), ve en kritigi - dogru kablo corlari. Envanter panelinde tum malzemeler birim fiyatlariyla listeleniyor. Burak farkli penetrasyon oranlariyla varyasyonlari deniyor, optimum senaryoyu seciyor.

**Cozum:** Burak plani kaydediyor. Ayni ekranda toplam maliyeti, MRR projeksiyonunu ve ROI'yi goruyor. Manuel hesaplamaya ihtiyac yok - sisteme guveniyor cunku sonuclar her seferinde tutarli.

### Yolculuk 2: Mevcut Plan Guncelleme ve Hata Durumu

**Karakter:** Ayni Burak, daha once planladigi bir adaya yeni bina eklenmis.

**Acilis:** Overlay panelinden mevcut ada planlarini inceliyor. Bir adada yeni bina insaati tamamlanmis, plana eklenmesi gerekiyor.

**Yukselis:** NVI portalinde adayi aciyor. FiberPlan mevcut plani IndexedDB'den yukledi, yeni binayi ekliyor. Sistem otomatik yeniden hesapliyor - MST guncelleniyor, splitter boyutlari degisiyor, kablo corlari ayarlaniyor.

**Hata Durumu:** Yeni bina eklendikten sonra bir binanin loss budget'i 25.5 dB'e cikiyor - WARNING statusu (26.0 dB sinirinda, 3 dB guvenlik marji yok). Burak haritada bu binayi sari uyariyla goruyor. Manuel modda kabloyu farkli yonlendiriyor, mesafe kisaliyor, loss budget 22.1 dB'e dusuyor - OK statusu.

**Cozum:** Guncellenmis plan kaydediliyor, envanter otomatik guncelleniyor, ayni ekranda maliyet farki aninda gorunuyor.

### Yolculuk 3: Operasyonel Takip ve Bolge Planlama

**Karakter:** Burak, yonetici sifatiyla haftalik planlama yapiyor.

**Acilis:** Overlay panelinden yonetim gorunumune geciyor. Tum planlanan adalarin ozet gorunumunu inceliyor - hangileri tamamlanmis, hangileri devam ediyor. Haritada komsu adalar sematik olarak gosteriliyor.

**Yukselis:** Toplam malzeme ihtiyacini goruyor - kac metre fiber, kac splitter, kac OLT portu. MRR projeksiyonunu inceliyor: toplam effBB x abone basina gelir. ROI tablosunda yatirim maliyeti vs beklenen gelir karsilastirmasini goruyor. Komsu adalara tiklayarak seri planlama akisina geciyor.

**Doruk:** Envanter panelinde bir splitter fiyatinin degistigini fark ediyor. Yeni fiyati giriyor - tum adalarin maliyet hesaplamalari otomatik guncelleniyor. Toplam butce aninda yenileniyor.

**Cozum:** Burak raporunu olusturuyor. Tum veriler tek yerde, guncel ve tutarli. Komsu ada sematigi ile bolgesel genisleme planini gorebiliyor.

### Yolculuk Gereksinimleri Ozeti

| Yolculuk | Ortaya Cikan Yetenekler |
|----------|------------------------|
| Yeni Ada Planlama | NVI scraping, OLT yerlesimi, MST rotalama, splitter hesabi, loss budget, envanter, varyasyon analizi, dogru kablo core hesabi |
| Plan Guncelleme & Hata | Mevcut plan yukleme, artimsal yeniden hesaplama, loss budget WARNING sistemi, manuel mod, IndexedDB depolama |
| Operasyonel Takip | Tek ekran yonetim gorunumu, ada bazli listeleme, komsu ada sematigi, MRR/ROI hesaplari, envanter fiyat guncelleme, seri planlama |

## Domain Gereksinimleri

### Standart Uyumu ve Regulasyon
- ITU-T G.984 Class B+ GPON standartlarina tam uyum
- Maksimum ODN loss budget: **26.0 dB** (Turk operator siniri)
- Loss budget status: margin >= 3 dB → OK, margin >= 0 dB ve < 3 dB → WARNING, margin < 0 dB → FAIL
- Splitter kayiplari: 3.5 x log2(oran) formulu (PLC spec ile uyumlu)
- Fiber kaybi: 0.35 dB/km @1310nm (G.652)
- Konnektor kaybi: 0.5 dB (4 adet), Ek kaybi: 0.1 dB (2 adet)

### NVI Portal Bagimliligi ve Veri Yonetimi
- **Risk:** NVI portal DOM yapisi degisirse scraper kirilir
- **Onlem:** IndexedDB cache + modular scraper izolasyonu - NVI DOM degisikliginde sadece scraper modulu guncellenir
- **Yerel veritabani (IndexedDB):** NVI'dan cekilen bina/ada verilerini tarayicida cache'leme
  - Ilk cekimde IndexedDB'ye kaydet, sonraki kullanimlarda yerel veritabanindan oku
  - Periyodik guncelleme mekanizmasi (NVI'dan delta kontrol)
- **Adadan adaya atlama:** Planlanan adalar arasi gecis ve seri planlama destegi

### Guvenlik ve Erisim Kontrolu
- Topoloji verileri hassas altyapi bilgisi olarak siniflandirilir
- **Extension erisim kontrolu:** Yeni kullanici extension'i yukler → aktivasyon kodu/onay talep eder → yonetici onaylar → kullanilabilir hale gelir
- Veri erisimi sadece onaylanmis kullanicilarla sinirli
- IndexedDB verileri sifrelenmis olarak saklanir

### OTDR Saha Dogrulama Modulu (Post-MVP)
- Saha olcum sonuclarini (OTDR degerleri) sisteme girebilme
- Hesaplanan loss budget vs gercek olcum karsilastirmasi (bina bazinda)
- Olcum gecmisi: nerede, ne zaman, ne olculdu - kayit altinda
- Zaman icinde olcum trendi analizi: fiber yaslanma, ek bozulma takibi
- Gercek veriye dayali kalibrasyon imkani

### Domain Riskleri ve Onlemler

| Risk | Etki | Onlem |
|------|------|-------|
| NVI DOM degisikligi | Scraper kirilir | IndexedDB cache + modular scraper izolasyonu |
| Loss budget sinir asimi | Hizmet kalitesi dusmesi | 26.0 dB sinir + 3 dB guvenlik marji + WARNING sistemi |
| Yetkisiz erisim | Altyapi verisi sizintisi | Aktivasyon sistemi + sifreleme + erisim kontrolu |
| Hesaplama sapmalari | Saha gercekleriyle uyumsuzluk | OTDR dogrulama modulu + gercek veri kalibrasyonu (Post-MVP) |

## Inovasyon ve Yenilikci Kaliplar

### Tespit Edilen Inovasyon Alanlari

**1. Devlet Portali Uzerine Muhendislik Araci (Birincil Inovasyon)**
Turkiye'nin NVI adres portali uzerine Chrome Extension ile FTTH fiber planlama araci insa etmek benzersiz bir yaklasim. Mevcut pazarda bu sekilde calisan bir sistem bulunmuyor. Geleneksel fiber planlama araclari bagimsiz GIS platformlari olarak calisir. FiberPlan ise devletin mevcut adres veritabanini dogrudan kaynak olarak kullanarak:
- Ayri veri girisi ihtiyacini ortadan kaldirir
- Bina ve bagimsiz bolum bilgilerini NVI'dan canli cekmesi ile her zaman guncel veri ile calisir
- Sifir altyapi maliyetiyle (sunucu, GIS lisansi gerektirmeden) calismaya baslar

**2. Tarayici Icinde GPON Muhendislik Hesaplamalari**
Genellikle masaustu CAD/GIS yazilimlariyla yapilan OLT yerlesimi, MST rotalama, splitter hesabi, loss budget analizi gibi karmasik muhendislik hesaplamalari tamamen tarayici icinde vanilla JavaScript ile calistiriliyor:
- Kurulum gerektirmez (extension yukle, hemen calis)
- Platform bagimsiz (Chrome olan her yerde calisir)
- Saha muhendisinin sahada aninda hesaplama yapmasina imkan tanir

### Rekabet Ortami

Mevcut FTTH planlama araclari (IQGeo, 3-GIS, Vetro FiberMap, Comsof) kurumsal lisans gerektiren, agir masaustu veya bulut GIS platformlaridir. FiberPlan'in farki:
- Ucretsiz Chrome Extension - lisans maliyeti yok
- NVI entegrasyonu - Turkiye'ye ozgu, devlet verisiyle dogrudan calisir
- Hafif ve hizli - saniyeler icinde hesaplama, agir GIS yuklemesi yok
- Saha odakli - muhendis sahada aninda kullanabilir

### Dogrulama Yaklasimi
- Mevcut 2 kullanicinin gercek saha projelerinde kullanimi ile dogrulama
- Hesaplama sonuclarinin manuel hesaplamalarla ve OTDR olcumleriyle karsilastirilmasi
- Ada bazinda pilot uygulama: kucuk olcekten baslayip buyutme

## Chrome Extension Ozel Gereksinimleri

### Teknik Mimari

**Tek Ekran Deneyimi:**
- Dashboard islevleri ayri extension sayfasi yerine NVI portal uzerindeki overlay paneline entegre
- Saha planlama, envanter, MRR/ROI ve ada yonetimi tek ekrandan eriselebilir
- Panel bazli arayuz: genis yan panel veya sekme sistemiyle farkli gorunumler arasinda gecis

**Tarayici Destegi:**
- Sadece Google Chrome (Manifest V3), minimum Chrome 88+

**Veri Depolama (MVP):**
- IndexedDB: ana veri deposu, offline calisma, NVI veri cache'i
- chrome.storage.local: kullanici ayarlari, harita pozisyonu, katalog fiyatlari

### Ada Yonetimi ve Harita Gorunumu

**Ada Bazli Listeleme:**
- Harita uzerinde planlanan adalar ada ada listelenir
- Her ada tiklayarak detaylerina inilebilir
- Ada durum gostergeleri: tamamlanmis, devam ediyor, planlanmamis

**Komsuluk Sematigi:**
- Secilen adanin yanindaki (komsu) adalar harita uzerinde sematik olarak gosterilir
- Adadan adaya atlama: bir adanin plani tamamlaninca komsu adaya gecis
- Seri planlama akisi: mahalle/bolge bazinda ardisik ada planlama
- Is gelistirme perspektifi: bolgesel kapsam ve genisleme planlama gorsellestirilir

### Uygulama Dikkat Noktalari
- Content script izolasyonu: ISOLATED world'de calisma, NVI DOM ile dikkatli etkilesim
- CSP uyumu: NVI sayfasinin Content-Security-Policy kisitlamalarina uygun tile yukleme (blob URL yaklasimi)
- MAIN world script injection: NVI Leaflet instance'ina koordinat yakalama icin (mevcut calisan yaklasim)
- Modul bagimliligi: IIFE pattern, manifest.json'da dogru yukleme sirasi kritik

## Proje Kapsam Belirleme ve Fazli Gelistirme

### Korunacak Moduller (~%60)
- PonEngine (pon-engine.js): OLT yerlesimi, MST rotalama, splitter hesabi, loss budget, envanter/maliyet
- Topology (topology.js): Proje veri modeli, ada/bina CRUD, multi-ada OLT gruplama, export
- NviScraper (scraper.js): NVI DOM scraping, bina/BB gruplama
- MapUtils (map-utils.js): Pentagon ikon, CSP-safe tile, renk/stil sistemi
- ReviewEngine (review-engine.js): Kalite siniflandirma, 6 kategorili degerlendirme

### Yeniden Yazilacak Moduller (~%25)
- Panels → Tek Ekran UI: Ayri dashboard sayfasi yerine overlay panel sistemi, sekme/gorunum gecisleri
- Storage → IndexedDB: chrome.storage.local'dan IndexedDB'ye gecis, NVI veri cache'i, offline calisma
- Overlay → Genisletilmis Harita: Komsu ada sematigi, ada bazli listeleme, durum gostergeleri

### Yeni Moduller (~%15)
- Varyasyon Motoru: Farkli penetrasyon/konfigurasyonlarda senaryo karsilastirma
- MRR/ROI Hesaplayici: Abone bazli gelir projeksiyon ve yatirim geri donus hesabi
- Taahut/Kampanya Motoru: Taahutlu/taahutsuz modeller, kampanya parametreleri, modem maliyet yonetimi
- Pazarlama Data House: Senaryo verileri saklama, strateji karsilastirma, dis aktarim
- Isi Haritasi Motoru: Potansiyel musteri yogunlugu, ariza yogunlugu gorsellestime
- Aktivasyon Sistemi: Extension erisim kontrolu, yonetici onay mekanizmasi
- NVI Cache: IndexedDB uzerinde ada/bina veri cache'leme ve delta guncelleme

### Faz Plani

**Faz 1 - MVP:**
- Mevcut hesaplama motorunu (PonEngine) 26.0 dB sinirla guncelle
- IndexedDB veri katmanini kur, mevcut chrome.storage.local verilerini migrate et
- Tek ekran panel sistemini olustur (ayri dashboard → overlay paneline birlesim)
- Varyasyon analizi, MRR/ROI, taahut/kampanya, modem maliyet modullerini ekle
- Pazarlama data house ve isi haritasi modullerini ekle
- Aktivasyon sistemi ve erisim kontrolunu ekle
- NVI veri cache mekanizmasini kur
- Otomatik yedekleme, geri al/ileri al, loglama altyapisini kur

**Faz 2 - Post-MVP:**
- Backend entegrasyonu ve merkezi veritabani
- Gercek zamanli canli guncelleme
- IndexedDB → backend senkronizasyonu
- OTDR saha dogrulama modulu
- Canli ag izleme: UBNT UISP + Zabbix entegrasyonu
- Rol bazli erisim kontrolu
- Dinamik konnektor/splice hesabi

**Faz 3 - Vizyon:**
- AI destekli proaktif ariza yonetimi
- Otonom topoloji planlama
- ML tabanli optimizasyon
- Coklu operator destegi
- Mobil uygulama
- Ulusal olceklendirme

### Gecis Riskleri ve Onlemler

| Risk | Strateji |
|------|----------|
| Hibrit gecis sirasinda regresyon | Her modul gecisinde mevcut hesaplamalari dogrulayan test suite |
| IndexedDB migrasyon veri kaybi | chrome.storage.local → IndexedDB migrasyonda yedekleme mekanizmasi |
| Tek ekran karmasikligi | Panel bazli moduler UI, asamali ozellik entegrasyonu |
| Mevcut kullanici aliskanlik degisimi | Asamali gecis, mevcut is akislarini bozmadan yeni ozellikleri ekleme |

## Fonksiyonel Gereksinimler

### Ada ve Bina Yonetimi

- FR1: Saha muhendisi, NVI portalinde bir ada secerek binalari ve bagimsiz bolum sayilarini otomatik tarayabilir
- FR2: Saha muhendisi, taranan binalari ada planina ekleyebilir veya cikarabilir
- FR3: Saha muhendisi, bina bilgilerini (tip, BB sayisi, koordinat) inline duzenleyebilir
- FR4: Saha muhendisi, birden fazla adayi bagimsiz olarak yonetebilir ve adalar arasi gecis yapabilir
- FR5: Sistem, NVI'dan cekilen ada/bina verilerini yerel veritabaninda (IndexedDB) cache'leyebilir
- FR6: Sistem, cache'lenmis verileri periyodik olarak NVI'dan delta kontrol ile guncelleyebilir

### OLT Yerlesimi ve Ag Topolojisi

- FR7: Sistem, agirlikli geometrik medyan ile optimal OLT konumunu hesaplayabilir (elektrik binasi tercihi)
- FR8: Saha muhendisi, OLT binasini manuel olarak secebilir veya degistirebilir
- FR9: Sistem, tek seviye MST (Prim algoritmasi) ile kablo rotalamasi olusturabilir
- FR10: Saha muhendisi, otomatik MST rotasini manuel modda duzenleyebilir (KABLO CIZ)
- FR11: Sistem, GPON port kapasitesini hesaplayabilir (128 BB/port, 64 ONT/port)

### Splitter ve Loss Budget Hesaplamalari

- FR12: Sistem, effBB (BB x penetrasyon orani) bazinda dogru splitter boyutu secebilir (1:8, 1:16, 1:32, cascade)
- FR13: Sistem, her bina icin loss budget hesaplayabilir (splitter + fiber + konnektor + ek kayiplari)
- FR14: Sistem, loss budget durumunu siniflandirabilir (OK: >=3 dB marj, WARNING: 0-3 dB marj, FAIL: <0 dB, 26.0 dB siniri)
- FR15: Saha muhendisi, penetrasyon oranini ada ve bina bazinda ayarlayabilir

### Kablo ve Envanter Yonetimi

- FR16: Sistem, MST topolojisine gore dogru kablo core sayilarini hesaplayabilir (backbone, distribution, drop, ring)
- FR17: Sistem, ekipman katalogundan otomatik envanter ve malzeme listesi uretebilir
- FR18: Saha muhendisi, katalogdaki birim fiyatlari guncelleyebilir
- FR19: Sistem, fiyat guncellendiginde tum ada maliyetlerini otomatik yeniden hesaplayabilir
- FR20: Sistem, toplam proje maliyetini hesaplayabilir

### Varyasyon Analizi

- FR21: Saha muhendisi, farkli penetrasyon oranlari ve fiber konfigurasyonlariyla varyasyon olusturabilir
- FR22: Saha muhendisi, en az 3 farkli senaryoyu yan yana karsilastirabilir
- FR23: Saha muhendisi, optimum senaryoyu secerek aktif plan olarak belirleyebilir

### Finansal Hesaplamalar ve Yatirim Yonetimi

- FR24: Sistem, aktif abone sayisina (effBB) gore MRR (Aylik Tekrarlayan Gelir) projeksiyonu hesaplayabilir
- FR25: Sistem, yatirim maliyeti vs gelir projeksiyon karsilastirmasiyla ROI hesaplayabilir
- FR26: Saha muhendisi, MRR ve ROI verilerini tek ekrandan goruntuleyebilir
- FR27: Saha muhendisi, anten maliyetlerini (tip, adet, birim fiyat) yatirim hesabina dahil edebilir
- FR28: Saha muhendisi, OLT cihaz maliyetlerini (model, port sayisi, birim fiyat) yatirim hesabina dahil edebilir
- FR29: Saha muhendisi, switch, router ve diger aktif ekipman maliyetlerini tanimlayabilir
- FR30: Sistem, toplam yatirim maliyetini fiber altyapi + aktif ekipman + modem + kampanya maliyetlerinin butunu olarak hesaplayabilir
- FR31: Sistem, ROI hesabini tum yatirim kalemleri dahil edilerek (altyapi + ekipman + operasyonel) sunabilir

### Modem ve CPE Maliyet Yonetimi

- FR32: Saha muhendisi, envanterde modemleri "ucretli satis" veya "ucretsiz verilme" olarak isaretleyebilir
- FR33: Sistem, modem verilme durumuna gore ek maliyetleri (abone basina modem maliyeti) otomatik hesaplayabilir
- FR34: Sistem, ucretli vs ucretsiz modem senaryolarinin toplam maliyete etkisini karsilastirabilir

### Taahut ve Abonelik Modelleri

- FR35: Saha muhendisi, taahutlu abonelik modeli tanimlayabilir (orn. 12 ay, 24 ay sureli)
- FR36: Saha muhendisi, taahutsuz model tanimlayabilir (modem satisi, sozlesme yok)
- FR37: Saha muhendisi, kampanya parametreleri girebilir (X ay ucretsiz, X ay %Y indirim)
- FR38: Sistem, farkli taahut modellerinin MRR ve ROI uzerindeki etkisini hesaplayabilir
- FR39: Sistem, taahut karsilama maliyetini (ucretsiz aylar, indirimler, modem maliyeti) toplam yatirima dahil edebilir
- FR40: Saha muhendisi, birden fazla taahut senaryosunu yan yana karsilastirabilir

### Pazarlama Strateji Veri Tabani (Data House)

- FR41: Sistem, farkli senaryo sonuclarini (penetrasyon, taahut modeli, modem politikasi, kampanya) yapilandirilmis veri olarak saklayabilir
- FR42: Saha muhendisi, gecmis senaryo verilerinden bolge bazli pazarlama stratejisi karsilastirmasi yapabilir
- FR43: Sistem, senaryo verilerini disa aktarilabilir formatta sunabilir
- FR44: Sistem, ada/bolge bazinda en karli strateji kombinasyonunu (taahut + modem + kampanya) ozetleyebilir

### Harita ve Gorsellestirme

- FR45: Sistem, NVI portali uzerinde bagimsiz Leaflet harita overlay'i olusturabilir (uydu gorunumu)
- FR46: Sistem, binalari tip bazli renkli pentagon ikonlarla gosterebilir (OLT, MDU Large, MDU Medium, SFU)
- FR47: Sistem, kablo rotalarini harita uzerinde cizgi olarak gorsellestirebilir
- FR48: Sistem, ada sinirlarini harita uzerinde poligon olarak gosterebilir
- FR49: Sistem, secilen adanin komsu adalarini harita uzerinde sematik olarak gosterebilir
- FR50: Saha muhendisi, komsu adaya tiklayarak seri planlama akisina gecebilir

### Isi Haritalari ve Bolgesel Analiz

- FR51: Sistem, potansiyel musteri yogunlugunu harita uzerinde isi haritasi olarak gorsellestirebilir (BB sayisi, penetrasyon potansiyeli bazli)
- FR52: Sistem, ariza yogunlugunu harita uzerinde isi haritasi olarak gorsellestirebilir (bolge/ada bazli)
- FR53: Saha muhendisi, isi haritasi katmanlarini acip kapatabilir ve filtreleyebilir
- FR54: Sistem, isi haritasi verilerini bolgesel yatirim onceliklendirmesi icin kullanabilir

### Tek Ekran Panel Sistemi

- FR55: Saha muhendisi, topoloji planlamasi, envanter, MRR/ROI ve ada yonetimini tek ekrandan erisebilir
- FR56: Saha muhendisi, panel/sekme sistemiyle farkli gorunumler arasinda gecis yapabilir
- FR57: Sistem, ada bazli listeleme ile tum planlanan adalarin ozet gorunumunu gosterebilir
- FR58: Sistem, ada durum gostergelerini gosterebilir (tamamlanmis, devam ediyor, planlanmamis)

### Kalite Degerlendirme

- FR59: Sistem, topolojiyi 6 agirlikli kategoride otomatik degerlendirebilir (loss budget, standartlar, splitter, OLT, kablo, maliyet)
- FR60: Sistem, loss budget asimi veya uyari durumlarini harita uzerinde gorsel olarak isaretleyebilir

### Veri Depolama ve Sureklilik

- FR61: Sistem, tum proje verilerini IndexedDB'de kalici olarak saklayabilir
- FR62: Sistem, offline calisma destegi saglayabilir (internet baglantisi olmadan mevcut verilerle calisma)
- FR63: Saha muhendisi, gecmis hesaplamalara ve kayitli planlara geri donebilir
- FR64: Sistem, proje verilerini JSON/CSV/GeoJSON formatinda disa aktarabilir

### Erisim Kontrolu

- FR65: Yonetici, yeni kullanicilarin extension erisimini onaylayabilir veya reddedebilir
- FR66: Kullanici, extension kurulumu sonrasi aktivasyon kodu ile erisim talep edebilir
- FR67: Sistem, onaylanmamis kullanicilarin extension islevlerine erisimini engelleyebilir

### Canli Ag Izleme Altyapisi (Post-MVP)

- FR68: Sistem, mevcut switch/anten/router cihaz envanterini canli ag topolojisiyle eslestirebilir
- FR69: Sistem, UBNT UISP modulunden cihaz durum verilerini cekebilir
- FR70: Sistem, Zabbix benzeri ag izleme metriklerini (uptime, trafik, hata orani) panelde gosterebilir
- FR71: Saha muhendisi, planlanan topoloji ile canli ag durumunu ayni harita uzerinde karsilastirabilir
- FR72: Sistem, cihaz bazli performans grafiklerini monitor edebilir

### Yapay Zeka Destekli Proaktif Ariza Yonetimi (Vizyon)

- FR73: Sistem, ag metriklerindeki anormallikleri tespit ederek musteri bildirmeden once arizayi sezebilir
- FR74: Sistem, gecmis ariza verilerinden oruntu cikararak olasi ariza noktalarini onceden tahmin edebilir
- FR75: Sistem, tespit edilen anomali ve tahminler icin otomatik uyari ve onlem is akisi olusturabilir
- FR76: Sistem, musteri ariza deneyimini minimize etmek icin onleyici bakim onerileri sunabilir
- FR77: Sistem, ariza tahmin modellerini gercek verilerle surekli ogrenerek iyilestirebilir

### Faz Eslestirmesi

| Yetenek Alani | Faz |
|----------------|-----|
| Ada/Bina Yonetimi (FR1-6) | MVP |
| OLT/Topoloji (FR7-11) | MVP |
| Splitter/Loss Budget (FR12-15) | MVP |
| Kablo/Envanter (FR16-20) | MVP |
| Varyasyon Analizi (FR21-23) | MVP |
| Finansal Hesaplamalar ve Yatirim (FR24-31) | MVP |
| Modem/CPE Maliyet (FR32-34) | MVP |
| Taahut/Abonelik Modelleri (FR35-40) | MVP |
| Pazarlama Data House (FR41-44) | MVP |
| Harita/Gorsellestirme (FR45-50) | MVP |
| Isi Haritalari (FR51-54) | MVP |
| Tek Ekran Panel (FR55-58) | MVP |
| Kalite Degerlendirme (FR59-60) | MVP |
| Veri Depolama (FR61-64) | MVP |
| Erisim Kontrolu (FR65-67) | MVP |
| Canli Ag Izleme - UISP/Zabbix (FR68-72) | Post-MVP |
| AI Proaktif Ariza Yonetimi (FR73-77) | Vizyon |

## Fonksiyonel Olmayan Gereksinimler

### Performans

- PonEngine ada bazli hesaplama suresi: < 100ms (50 binaya kadar)
- NVI bina listesi scraping suresi: < 2 saniye
- Harita render (50+ ada gosteriminde): < 500ms, akici pan/zoom
- IndexedDB okuma/yazma: < 50ms (kullanici fark etmeyecek duzeyde)
- Varyasyon karsilastirma: 3+ senaryo paralel hesaplama < 300ms
- Isi haritasi katman render: < 1 saniye

### Guvenlik

- Topoloji ve altyapi verileri IndexedDB'de sifrelenmis olarak saklanir
- Extension erisimi aktivasyon kodu/yonetici onayi olmadan kullanilamaz
- Disa aktarilan veriler (JSON/CSV/GeoJSON) hassas veri uyarisi icerir
- chrome.storage.local'da saklanan ayar verileri kullanici kimligine baglidir
- Post-MVP backend entegrasyonunda tum iletisim HTTPS uzerinden sifrelenmis olacak

### Olceklenebilirlik

- MVP: 2 eszamanli kullanici, bagimsiz yerel veritabanlari
- Tek kullanici kapasitesi: 500+ ada, 10.000+ bina verisi IndexedDB'de sorunsuz
- IndexedDB veri boyutu: 100MB'a kadar performans kaybi olmadan
- Post-MVP: Backend ile coklu kullanici destegine gecis altyapisi hazir

### Entegrasyon

- NVI portal DOM yapisi degistiginde sadece scraper modulu guncellenir, diger moduller etkilenmez
- NVI Leaflet instance'ina MAIN world injection ile koordinat yakalama guvenilir calisir
- CSP kisitlamalarina uygun tile yukleme (blob URL yaklasimi) kesintisiz calisir
- Post-MVP: UBNT UISP API entegrasyonu icin standart REST API istemci altyapisi
- Post-MVP: Zabbix SNMP/API entegrasyonu icin veri toplama arayuzu

### Guvenilirlik

- Offline calisma: Internet baglantisi kesildiginde mevcut IndexedDB verileriyle tam islevsellik
- Veri kaybi onleme: Her hesaplama/degisiklik sonrasi otomatik kayit
- IndexedDB migrasyon: chrome.storage.local'dan geciste sifir veri kaybi garantisi
- Hata durumunda kurtarma: Hesaplama hatasi tum sistemi kilitlemez, sadece ilgili ada etkilenir
- Tarayici cokmesi sonrasi: Son kaydedilmis durumdan devam edebilme

### Loglama ve Izlenebilirlik

- Tum arka plan islemleri (hesaplama, scraping, cache guncelleme, veri yazma) zaman damgali log kaydi tutar
- Log seviyeleri: DEBUG, INFO, WARNING, ERROR - filtrelenebilir
- Hata durumlarinda detayli log ile sorun kaynagi hizla tespit edilebilir
- Log gecmisi IndexedDB'de saklanir, disa aktarilabilir

### Geri Al / Ileri Al (Undo/Redo)

- Kullanici islemleri (bina ekleme/cikarma, OLT degistirme, kablo duzenleme, fiyat guncelleme, penetrasyon degisikligi) geri alinabilir
- Geri alinan islem ileri alinabilir (redo)
- Islem gecmisi oturum boyunca korunur
- Toplu islemler tek adimda geri alinabilir

### Otomatik Yedekleme

- Sistem 10 dakikada bir otomatik yedek alir (IndexedDB snapshot)
- Yedek gecmisi: en az son 6 yedek saklanir (1 saatlik gecmis)
- Kullanici istedigi yedege geri donebilir
- Yedekleme arka planda sessizce calisir, kullanici is akisini kesmez
