---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/project-context.md'
  - '_bmad-output/brainstorming/brainstorming-session-2026-02-27.md'
  - '_bmad-output/planning-artifacts/research/technical-gpon-ftth-tek-seviye-topoloji-research-2026-02-28.md'
date: '2026-02-28'
author: 'BURAK'
---

# Product Brief: NVI FIBER

## Executive Summary

FiberPlan, Turkiye'deki kucuk ve orta olcekli fiber internet isletmecilerinin (yerel ISP'lerin) ag planlama, yatirim analizi ve pazarlama stratejisi ihtiyaclarini tek bir platformda karsilayan Chrome Extension tabanli bir muhendislik ve is zekasi aracidir. NVI adres portali uzerinde calisan sistem, devletin mevcut adres veritabanini dogrudan veri kaynagi olarak kullanarak sifir altyapi maliyetiyle fiber planlama yapilmasini saglar.

Mevcut ISP yonetim sistemleri sadece BTK regulasyonlarini karsilamakta (abone acma, log tutma) olup planlama, finansal analiz ve pazarlama katmanlari tamamen eksiktir. FiberPlan bu boslugu doldurarak isletme sahibinin "nereye, ne kadar yatirim yapayim ve ne zaman geri donusunu alayim" sorusuna veriye dayali cevap vermesini saglar.

---

## Core Vision

### Problem Statement

Kucuk ve orta olcekli fiber internet isletmecileri, fiber altyapi yatirimlarini sistematik bir planlama ve hesaplama araci olmadan "kor" sekilde yurutmektedir. Mevcut ISP yonetim yazilimlari sadece BTK'nin zorunlu kildigi abone yonetimi ve log tutma gibi temel islemleri karsilamakta; fiber ag planlama, yatirim maliyet analizi, geri donus hesaplari ve pazarlama stratejisi gibi kritik is surecleri Excel veya kafadan hesaplamalarla yurumektedir. Bu durum hatali kablo core secimleri, yanlis maliyet projeksiyonlari ve veriye dayanmayan yatirim kararlarina yol acmaktadir.

### Problem Impact

- **Teknik:** Yanlis hesaplamalar sahada maliyetli hatalara yol aciyor (ornegin 4 core olmasi gereken yere 12 core kablo atilmasi)
- **Finansal:** Yatirim miktari ve geri donus suresi bilinmeden yatirim karari veriliyor, modem dagitimlari ve cayma bedelleri takip edilemiyor
- **Ticari:** Pazarlama kararlari veriye degil sezgiye dayaniyor; tarif senaryolari, referans programlari ve kampanya etkileri test edilemiyor
- **Operasyonel:** Ag kalitesi dususleri ancak musteri sikayet ettikten sonra fark ediliyor, proaktif mudahale imkani yok

### Why Existing Solutions Fall Short

- **Buyuk FTTH planlama araclari** (IQGeo, 3-GIS, Vetro FiberMap, Comsof): Kurumsal lisans gerektiren agir GIS platformlari - kucuk isletmelerin butcesi ve ihtiyaci icin uygun degil
- **Mevcut ISP yonetim yazilimlari:** Sadece BTK uyumu icin minimum islevselligi karsilar, planlama ve pazarlama katmani yok
- **Turk Telekom gibi buyuk operatorler:** Kendi ic araclarini kullanir, ancak bu araclar kucuk isletmelere acik degil
- **Sonuc:** Kucuk fiber ISP'ler icin uygun fiyatli, planlama + finansal analiz + pazarlama stratejisini birlestiren bir arac piyasada mevcut degil

### Proposed Solution

FiberPlan, uc katmanli bir cozum olarak tasarlanmistir:

1. **Ag Planlama Motoru:** NVI portali uzerinde GPON standartlarina (ITU-T G.984 Class B+) uyumlu fiber topoloji planlama - OLT yerlesimi, MST rotalama, splitter hesabi, loss budget analizi, envanter ve maliyet hesaplari
2. **Finansal Analiz Motoru:** Yatirim maliyet hesabi (fiber + aktif ekipman + modem + kampanya), MRR/ROI projeksiyonu, musteri LTV hesabi, cayma bedeli analizi, taahut senaryo karsilastirmasi
3. **Pazarlama ve Strateji Motoru:** Referans programlari ("komsunu getir", "1 ay hediye"), tarif/kampanya simulasyonu, modem politikasi senaryolari, bolgesel pazar analizi, veriye dayali karar destegi

Uzun vadede sistem, proaktif ag izleme (baglanti kalitesi dususunu musteri sikayet etmeden once tespit etme) ve tum operasyonel sureclerin tek dashboard'dan yonetildigi merkezi bir is zekasi platformuna donusecektir.

### Key Differentiators

- **NVI Portal Entegrasyonu:** Turkiye'nin devlet adres veritabanini dogrudan kullanan tek fiber planlama araci - ayri veri girisi gerektirmez, her zaman guncel veri
- **Sifir Altyapi Maliyeti:** Chrome Extension olarak calisir, sunucu veya GIS lisansi gerektirmez, aninda basla
- **Saha Muhendisi Perspektifi:** Gelistirici ayni zamanda isletme sahibi ve saha muhendisi - gercek ihtiyaclari bizzat yasiyor
- **Kucuk ISP Odagi:** Buyuk operatorlerin ic araclarina erisemeyen yerel isletmeciler icin tasarlanmis
- **Butuncul Yaklasim:** Sadece teknik planlama degil, finansal analiz + pazarlama stratejisi + operasyonel yonetim tek platformda
- **Zamanlama:** Turkiye'de fiber altyapi yatirimlari hizla artiyor, kucuk isletmecilerin sistematik planlama ihtiyaci acil

---

## Target Users

### Primary Users

**Persona: Burak - ISP Isletme Sahibi & Saha Muhendisi**

- **Rol:** Yatirimci, sistem yoneticisi, saha muhendisi, is gelistirme sorumlusu - tek kisilik karar mercii
- **Ortam:** Kucuk olcekli yerel fiber internet isletmesi, 2 kisilik operasyonel ekip
- **Motivasyon:** Fiber yatirimlarini veriye dayali kararlarla yonetmek, "kor" calismayi sona erdirmek
- **Gunluk Gerceklik:** Sabah ekiple toplanti yapilir ama ellerinde veri yok - neye odaklanacaklari, hangi ariza oncelikli, hangi bolgeye yatirim yapmali gibi kararlar sezgisel veriliyor. Bu durum en buyuk rahatsizlik kaynagi.
- **Mevcut Araclar:** BTK uyumlu ISP yonetim yazilimi (sadece abone acma, log tutma), Excel, kafadan hesaplama
- **Beklenti:** Tek bir ekrandan fiber planlama, finansal analiz, musteri notlari, ag durumu ve is gelistirme kararlarini gorebilmek

**Persona: Ekip Uyesi - Saha Teknisyeni & Operasyon Destegi**

- **Rol:** Burak'la ayni yetkilerle sistemi kullanan ikinci kullanici
- **Ortam:** Sahada fiber calismalari, ariza mudahale, kurulum islemleri
- **Motivasyon:** Sahadaki islemleri sistematik takip etmek
- **Erisim:** Burak'in onayi ile aktive edilen extension erisimi (aktivasyon kodu/mail onayi)

### Secondary Users (Gelecek)

- **Diger Kucuk ISP Isletmecileri:** Benzer sorunlari yasayan yerel fiber internet isletmecileri - potansiyel gelecek kullanici tabani. Su anda kapsam disinda, ancak mimari buna acik tutulacak.

### User Journey

**Burak'in FiberPlan Yolculugu:**

**1. Sabah Toplantisi (Veri Odakli Baslangic)**
- Burak FiberPlan dashboard'unu acar
- Ekraninda: aktif adalarin durumu, devam eden yatirimlar, MRR/ROI ozeti, ariza bildirimleri
- Ekiple toplanti artik veriye dayali: "Su adada yatirim geri donusu 8 ay, bu bolgedeki penetrasyon %40'a dustu, su antende sinyal dususu var"
- **Aha Ani:** "Artik neye odaklanacagimizi biliyoruz"

**2. Is Gelistirme (Yatirim Planlama)**
- NVI portalinde yeni bir bolgeyi inceliyor
- FiberPlan otomatik olarak bina sayilari, BB'leri tariyor
- Farkli penetrasyon senaryolariyla yatirim maliyeti ve geri donus suresini karsilastiriyor
- Pazarlama senaryolari test ediyor: "Taahhutlu tarifle mi yoksa komsunu getir kampanyasiyla mi daha hizli geri donus alirim?"
- Karar veriyor: "Bu adaya yatirim yapiyorum, 14 ayda geri donus"

**3. Saha Calismalari (Fiber Planlama)**
- Sahada NVI portali uzerinden adayi aciyor
- OLT yerlesimi, kablo rotalama, splitter hesabi aninda yapiliyor
- Bina/musteri/anlasma notlarini sisteme giriyor
- Ozel durumlar (sorunlu musteri, ozel anlasma, yapi problemi) kayit altina aliniyor

**4. Ariza Yonetimi (WhatsApp & Coklu Kanal Entegrasyonu)**
- Musteri WhatsApp'tan veya sistem uzerinden ariza bildiriyor
- FiberPlan ariza talebini otomatik dinliyor ve kaydediyor
- Ariza ilgili bina/ada/bolge ile eslestirilip harita uzerinde isaretleniyor
- Oncelik siralamasini sistem belirliyor (baglanti kalitesi verisiyle birlestirilmis)
- Burak veya ekip uyesi aksiyon aliyor, ariza durumu takip ediliyor
- Ariza gecmisi bolge bazinda analiz edilebiliyor (isi haritasina yansir)

**5. Proaktif Izleme (Otonom Sistem - Vizyon)**
- Sistem anten degerlerini ve fiber baglanti kalitesini surekli izliyor
- Sinyal dususu tespit edildiginde musteri sikayet etmeden once uyari veriyor
- WhatsApp arizalari + otonom tespitler birlestirilip butuncul ag sagligi gorunumu
- Gerekirse kablosuz frekans ayarlamalarina otonom mudahale
- Burak sadece kritik kararlarda devreye giriyor

**6. Notlar ve Takip**
- Her bina, musteri, anlasma icin not alabilme
- Ozel durumlar (sorunlu abonelik, sikinti cikartan yapi, yonetici anlasmalari) kayit altinda
- Gecmise donuk arama ve filtreleme

---

## Success Metrics

### Kullanici Basarisi

- Saha muhendisi bir adanin FTTH topolojisini NVI portali uzerinden eksiksiz tanimlayabilir (bina secimi, OLT yerlesimi, kablo rotalama, splitter hesabi)
- Farkli penetrasyon oranlari ve fiber konfigurasyonlari icin varyasyon analizi yapilabilir ve optimum senaryo secilebilir
- Sistem otomatik malzeme listesi, envanter kalemleri ve birim maliyetleri uretir - manuel hesaplama tamamen ortadan kalkar
- Yatirim kararlari veriye dayali olarak verilebilir (nereye, ne kadar, ne zaman geri donus)
- Sabah toplantisinda ekranda net veriler bulunur: ada durumlari, MRR/ROI, ariza bildirimleri, ag sagligi

### Business Objectives

**3 Ay Hedefi:**
- Cankiri'daki tum adalarin FTTH analizi tamamlanmis olacak
- Her ada icin yatirim maliyeti, geri donus suresi ve penetrasyon projeksiyonu hazir olacak
- Bolge bazli yatirim stratejileri (hangi adaya once yatirim yapilacagi) belirlenecek
- Pazarlama senaryolari (taahut modelleri, kampanyalar) test edilmis ve karsilastirilmis olacak

**12 Ay Hedefi:**
- Fiber dosenmis adalardaki aktif musteriler FiberPlan uzerinden izleniyor olacak
- Tamamlanan ve devam eden adalar harita uzerinde isaretlenmis ve takip ediliyor olacak
- Gercek performans verileri (MRR, penetrasyon, ariza oranlari) planlamadaki projeksiyonlarla karsilastirilabilir olacak
- Sistem gunluk operasyonlarin (ariza takibi, musteri notlari, ag izleme) merkezi aracina donusmus olacak

### Key Performance Indicators

| KPI | Olcum | Hedef |
|-----|-------|-------|
| Ada analiz tamamlanma | Analiz edilen ada / toplam ada | 3 ayda %100 (Cankiri) |
| Manuel hesaplama orani | Manuel hesaplama gerektiren islem sayisi | %0 (tamamen otomatik) |
| Hesaplama dogrulugu | ITU-T standart degerlerinden sapma | < %5 |
| Varyasyon karsilastirma | Yan yana kiyaslanabilen senaryo sayisi | >= 3 |
| Envanter guncellik | Fiyat degisikliginde yeniden hesaplama suresi | Aninda (< 1 saniye) |
| Veri odakli toplanti | Sabah toplantisinda veri tabanli karar orani | %100 |
| Aktif musteri izleme | FiberPlan uzerinden izlenen aktif abone orani | 12 ayda %100 |
| Sistem oneri isabetliligi | Sistemin yatirim onerisi vs gercek performans | Zaman icinde artan isabet |
| Otonom degerlendirme kapsami | Sistemin kendi basina analiz ettigi alan orani | Tum Cankiri bolgesini kapsamali |
| Ariza tespit suresi | Musterinin sikayet etmesine kalan sure | Proaktif tespit (vizyon) |

### Self-Optimizing Intelligence

- Sistem, sahada yapilan ve uygulanan islerden ogrenerek gelecek planlamalari optimize eder (hangi strateji hangi adada isledi, hangi penetrasyon gerceklesti)
- Henuz fiber dosenmeyen alanlari kendi analiziyle degerlendirir ve proaktif yatirim onerileri sunar ("su adaya yatirim yapmalisin, cunku X")
- Kullandikca akillanan, veri birikimi arttikca daha isabetli oneriler ureten bir yapi

**Not:** FiberPlan bir ticari urun degil, ic operasyonel verimlilik aracidir. Basari finansal amorti degil, is kalitesi ve verimlilik artisi ile olculur.

---

## MVP Scope

### Core Features - MVP Faz 1 (Ay 1-3)

**1. Fiber Ag Planlama (Birincil Oncelik)**
- NVI portal entegrasyonu: ada secimi, bina/BB otomatik tarama
- Harita uzerinde gorsel topoloji: binalar pentagon ikonlarla, kablolar cizgi olarak
- OLT yerlesimi: agirlikli geometrik medyan ile optimal konum hesabi
- MST rotalama: tek seviye Prim algoritmasi ile kablo rotalama
- Splitter hesabi: bina bazinda effBB'ye gore dogru splitter boyutu secimi
- Loss budget analizi: ITU-T G.984 Class B+ uyumlu (26.0 dB sinir, 3 dB guvenlik marji)
- Manuel mod: otomatik MST rotasini elle duzenleme imkani (KABLO CIZ)
- Penetrasyon orani: ada ve bina bazinda ayarlanabilir

**2. Envanter ve Maliyet Hesaplama**
- Otomatik malzeme listesi: kablo (dogru core sayilari), splitter, OLT port, konnektor
- Birim fiyat yonetimi: katalogdaki fiyatlari guncelleme
- Fiyat degisikliginde otomatik yeniden hesaplama
- Toplam yatirim maliyeti hesabi

**3. Varyasyon Analizi**
- Farkli penetrasyon oranlari ve konfigurasyonlarla senaryo olusturma
- En az 3 senaryoyu yan yana karsilastirma
- Optimum senaryoyu secip aktif plan olarak belirleme

**4. Finansal Temel Hesaplamalar**
- MRR projeksiyonu: abone basina gelir x aktif abone sayisi
- ROI hesabi: toplam yatirim vs gelir projeksiyon karsilastirmasi
- Yatirim kalemleri: fiber altyapi + aktif ekipman + modem

**5. Veri Depolama ve Sureklilik**
- IndexedDB ile yerel veritabani, offline calisma
- NVI verilerini cache'leme
- Proje kaydetme/yukleme, JSON/CSV/GeoJSON export
- Extension erisim kontrolu (aktivasyon kodu/yonetici onayi)

**6. Pazarlama Icgoruleri (Opsiyonel MVP Eki)**
- Taahut senaryo karsilastirmasi (taahhutlu vs taahutsuz)
- Modem maliyet senaryolari (ucretli vs ucretsiz)
- Kampanya parametreleri ve MRR/ROI etkisi

### Core Features - MVP Faz 2 (Ay 4)

**7. Proaktif Ag Izleme**
- UBNT UISP modulunden cihaz durum verilerini cekme
- Zabbix entegrasyonu: ag izleme metrikleri (uptime, trafik, hata orani)
- Planlanan topoloji ile canli ag durumunu ayni harita uzerinde karsilastirma
- Cihaz bazli performans izleme

**8. Otonom Sistem**
- Sinyal dususu tespiti: baglanti kalitesi dusuklerini musteri sikayet etmeden once sezme
- Kablosuz frekans mudahalesi: gerektiginde otonom olarak frekans ayarlamasi
- Uyari sistemi: tespit edilen anomaliler icin otomatik bildirim

### Out of Scope for MVP

| Ozellik | Neden Sonraya? | Hedef Faz |
|---------|----------------|-----------|
| WhatsApp ariza entegrasyonu | Cekirdek planlama oncelikli | Post-MVP |
| Referans programlari ("komsunu getir") | Pazarlama motoru MVP'de temel seviyede | Post-MVP |
| Isi haritalari | Veri birikimi gerektirir | Post-MVP |
| LTV / cayma bedeli hesabi | Finansal motor MVP'de temel seviyede | Post-MVP |
| AI destekli ariza tahmini | ML altyapisi gerektirir | Vizyon |
| Self-optimizing intelligence | Veri birikimi gerektirir | Post-MVP |
| Coklu operator destegi | Mevcut ihtiyac yok | Vizyon |
| Mobil uygulama | Oncelik degil | Vizyon |

### MVP Success Criteria

- Cankiri'daki tum adalar 3 ay icinde analiz edilmis
- Her ada icin fiber topoloji harita uzerinde gorsel olarak tanimlanmis
- Envanter ve maliyet hesaplari otomatik uretilmis, manuel hesaplama %0
- Hesaplama dogrulugu ITU-T standartlarindan sapma < %5
- Varyasyon analizi ile yatirim kararlari veriye dayali olarak veriliyor
- Sabah toplantisinda ekranda ada bazli yatirim verileri gorulebiliyor
- 4. ayda mevcut ag altyapisi UISP/Zabbix uzerinden canli izleniyor

### Future Vision

**Post-MVP (6-12 Ay):**
- Backend entegrasyonu: merkezi sunucu, cihazlar arasi senkronizasyon
- WhatsApp ariza entegrasyonu ve coklu kanal ariza yonetimi
- Gelismis pazarlama motoru: referans programlari, LTV, cayma bedeli
- Isi haritalari: potansiyel musteri yogunlugu, bolgesel analiz
- OTDR saha dogrulama: hesaplanan vs olculen loss budget karsilastirmasi
- Bina/musteri/anlasma not sistemi
- Self-optimizing intelligence: sahadan ogrenen, oneri ureten sistem

**Vizyon (12+ Ay):**
- AI destekli ariza tahmini ve onleyici bakim
- Tum operasyonlarin tek dashboard'dan yonetimi
- Mobil uygulama destegi
- Coklu operator destegi
- Ulusal olceklendirme
