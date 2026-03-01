/bmad-bmm-create-brief ---
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments: []
workflowType: 'research'
lastStep: 2
research_type: 'technical'
research_topic: 'GPON FTTH tek seviye topoloji - FDHsiz mimari ve standart uyumu'
research_goals: 'Mevcut FDHsiz tek seviye MST ve splitter yaklasiminin ITU-T GPON standartlarina uygunlugunu dogrulamak, kod implementasyonunun teknik dogrulugunu kontrol etmek, gerekirse duzeltmeler yapmak'
user_name: 'BURAK'
date: '2026-02-28'
web_research_enabled: true
source_verification: true
---

# Research Report: Technical

**Date:** 2026-02-28
**Author:** BURAK
**Research Type:** Technical

---

## Research Overview

Bu arastirma, FiberPlan Chrome Extension'in GPON FTTH topoloji hesaplama motorunun (PonEngine) teknik dogrulugunu ve ITU-T standartlarina uyumunu incelemektedir. Ozellikle FDH katmaninin kaldirilmasi sonrasi tek seviye MST ve tek seviye splitter yaklasiminin gecerliligi arastirilmaktadir.

---

## Technical Research Scope Confirmation

**Research Topic:** GPON FTTH tek seviye topoloji - FDHsiz mimari ve standart uyumu
**Research Goals:** Mevcut FDHsiz tek seviye MST ve splitter yaklasiminin ITU-T GPON standartlarina uygunlugunu dogrulamak, kod implementasyonunun teknik dogrulugunu kontrol etmek, gerekirse duzeltmeler yapmak

**Technical Research Scope:**

- Architecture Analysis - GPON topoloji tasarim kaliplari, FDH'siz mimari, splitter yerlesim stratejileri
- Implementation Approaches - PonEngine hesaplama pipeline dogrulugu, MST algoritma uygunlugu
- Technology Standards - ITU-T G.984 Class B+ parametreleri, splitter kayip degerleri, fiber kayip katsayilari
- Integration Patterns - OLT-bina direkt baglanti modeli, tek seviye rotalama
- Performance Considerations - Loss budget sinirlari, mesafe/kapasite limitleri, cascade vs tek seviye karsilastirmasi

**Research Methodology:**

- Current web data with rigorous source verification
- Multi-source validation for critical technical claims
- Confidence level framework for uncertain information
- Comprehensive technical coverage with architecture-specific insights

**Scope Confirmed:** 2026-02-28

---

## Technology Stack Analysis

### GPON Standartlari ve Parametreler (ITU-T G.984)

**Class B+ Optik Guc Butcesi:**
- Minimum kayip: 13 dB
- Maksimum kayip: **28 dB** (kodda dogru: `maxLossBudget: 28`)
- Verici gucu: -3 dBm (kisa mesafe) / 0 dBm (orta) / +3 dBm (uzun mesafe)
- APD alici hassasiyeti: -28 dBm
- Maksimum erisim: ~20 km (1:32 split ile)

_Guven Seviyesi: YUKSEK - ITU-T G.984.2 dogrudan referans_
_Kaynak: [APNIC GPON Power Budget](https://blog.apnic.net/2024/11/14/gpon-power-budget-calculations/), [ITU-T G.984.2](https://www.itu.int/rec/T-REC-G.984.2)_

### Splitter Kayip Degerleri - Kod vs Endustri

| Oran | Kodda (dB) | PLC Max Spec (dB) | FOA Tipik (dB) | Ideal (dB) | Degerlendirme |
|------|-----------|-------------------|---------------|-----------|---------------|
| 1:2  | 3.5       | ~3.8              | 4.0           | 3.0       | UYGUN |
| 1:4  | 7.0       | ~7.2              | 7.0           | 6.0       | UYGUN |
| 1:8  | 10.5      | 10.2              | 11.0          | 9.0       | UYGUN |
| 1:16 | 14.0      | 13.5              | 15.0          | 12.0      | UYGUN |
| 1:32 | 17.5      | 16.6              | 19.0          | 15.0      | UYGUN |
| 1:64 | 21.0      | ~20.0             | ~23.0         | 18.0      | UYGUN |

**Analiz:** Kod `3.5 x log2(oran)` formulunu kullaniyor. Bu degerler PLC splitter max spesifikasyonlarinin biraz ustunde, FOA tipik degerlerinin altinda. Planlama araci icin **kabul edilebilir orta yol** - ne fazla iyimser ne fazla kotumser.

_Guven Seviyesi: YUKSEK - Coklu kaynak dogrulamasi_
_Kaynaklar: [FOA Splitter Loss](https://www.thefoa.org/tech/ref/appln/FTTH-design.html), [FS.com Splitter Specs](https://www.fs.com/blog/basic-knowledge-about-split-ratio-and-insertion-loss-of-optical-splitter-4453.html), [Yamasaki OT](https://yamasakiot.com/2025/05/15/understanding-optical-splitter-loss/)_

### Fiber Optik Kayip Parametreleri

| Parametre | Kodda | Endustri Standardi | Kaynak | Durum |
|-----------|-------|-------------------|--------|-------|
| Fiber kayip @1310nm | 0.35 dB/km | 0.35 dB/km (G.652) | ITU-T, APNIC | DOGRU |
| Fiber kayip @1550nm | 0.25 dB/km | 0.25 dB/km (G.652) | ITU-T | DOGRU |
| Konnektor kaybi | 0.5 dB | 0.2-0.75 dB (TIA/EIA max: 0.75) | FOA, TIA/EIA | UYGUN |
| Ek kaybi (fusion) | 0.1 dB | 0.1-0.3 dB (TIA/EIA max: 0.3) | FOA, TIA/EIA | UYGUN |
| Konnektor sayisi | 4 (sabit) | Yola bagli, tipik 4-6 | Endustri pratigi | UYGUN |
| Ek sayisi | 2 (sabit) | Yola bagli, tipik 2-4 | Endustri pratigi | UYGUN |

**Analiz:** Tum fiber parametreleri ITU-T ve TIA/EIA standartlarina uygun. Konnektor kaybi (0.5 dB) saha tipi konnektorler icin dogru. Fusion ek kaybi (0.1 dB) en iyi durum degeri ama kabul edilebilir.

_Guven Seviyesi: YUKSEK_
_Kaynaklar: [FOA Loss Budget](https://www.thefoa.org/tech/lossbudg.htm), [FOA Loss Estimates](https://www.thefoa.org/tech/loss-est.htm), [APNIC](https://blog.apnic.net/2024/11/14/gpon-power-budget-calculations/)_

### Tek Seviye vs Cascade Splitter Mimarisi

**Tek Seviye (Centralized) - Kodun Mevcut Yaklasimi:**
- Yogun sehir merkezleri ve kasaba alanlari icin onerilir
- Daha dusuk bakim maliyeti, daha kolay sorun giderme
- Tipik olarak 1:32 veya 1:64 splitter kullanilir
- FDH kabini gerektirmez, maliyet tasarrufu saglar

**Cascade (2 Seviyeli) - Kodun Eski Yaklasimi:**
- Kirsal ve dagnik yerlesim alanlari icin daha uygun
- Ilk yatirim daha dusuk (daha az fiber)
- Daha genis cografi kapsama
- FDH kabini + iki seviye splitter gerektirir

**Ada Bazli Degerlendirme:**
FiberPlan ada (sehir bloku) bazinda calisir. Bir ada icindeki binalar cografi olarak yakin, tipik mesafe <500m. Bu senaryo icin **tek seviye splitting kesinlikle dogru mimari secim**. FDH katmani, ada olceginde gereksiz karmasiklik ekler.

_Guven Seviyesi: YUKSEK_
_Kaynaklar: [FS.com Split Level Design](https://www.fs.com/blog/optimizing-your-ftth-design-strategies-for-designing-split-levels-and-split-ratio-4127.html), [FOA FTTH Design](https://www.thefoa.org/tech/ref/appln/FTTH-design.html), [Lightwave Architecture](https://www.lightwaveonline.com/fttx/cables-enclosures/article/16673516/architecture-choices-in-ftth-networks)_

### MST (Minimum Spanning Tree) Algoritma Uygunlugu

- **Prim algoritmasi** - Kodda OLT'den baslayarak MST olusturuluyor. FTTH rotalama icin standart yaklasim.
- **Tek seviye MST** - FDH kaldirilinca iki seviyeli (OLT→FDH, FDH→bina) yerine tek seviye (OLT→tum binalar) MST kullaniliyor. Ada olceginde bu daha dogru.
- **Ring closure** - MST yaprak dugumlerini birlestirerek halka yedekliligi saglaniyor. Bu fiber ag tasariminda onerilir.

_Guven Seviyesi: YUKSEK - Standart graf algoritmasi, FTTH rotalama icin yaygin kullanim_

### Kod Implementasyonunda Tespit Edilen Bug

**`manDist` degiskeni erken kullanim (var hoisting sorunu):**
- `pon-engine.js` satir 698-699: `getDistance(meFrom, meTo, manDist)` cagriliyor
- `manDist` degiskeni satir 745'te tanimlaniyor: `var manDist = ada.topology.manualDistances || {}`
- JavaScript var hoisting nedeniyle `manDist` satir 698'de `undefined` olacak
- **Sonuc:** Manuel mod'da kablo mesafeleri hesaplanirken `manualDistances` override'lari uygulanmiyor
- **Etki:** Manuel modda kullanici mesafe duzeltmeleri goz ardi ediliyor

_Guven Seviyesi: YUKSEK - Dogrudan kod analizi_

---

## Entegrasyon Kaliplari Analizi

### GPON Point-to-Multipoint Baglanti Kaliplari

**ITU-T G.984 Baglanti Modeli:**
- **Topoloji:** Point-to-Multipoint (P2MP) - bir OLT portu, pasif splitter uzerinden birden fazla ONT'ye baglanir
- **Downstream:** 2.488 Gbit/s broadcast (1480-1500nm) - tum ONT'lere ayni sinyal gider, GEM port ID ile filtrelenir
- **Upstream:** 1.244 Gbit/s TDMA (1290-1330nm) - her ONT'ye zaman dilimi atanir
- **Maksimum mesafe:** OLT-ONT arasi 20 km (fiber), 60 km (mantiksal erisim)
- **Maksimum split:** 1:128 (teorik), pratikte 1:32 veya 1:64

**Kodla Uyum:**
Kodun tek seviye MST modeli, P2MP topolojisini dogru sekilde modelliyor. OLT'den baslayarak tum binalara MST ile baglanti kurulmasi, fiziksel fiber rotalama icin standart yaklasim.

_Guven Seviyesi: YUKSEK_
_Kaynaklar: [Cisco GPON Guide](https://www.cisco.com/c/en/us/support/docs/switches/catalyst-pon-series/216230-understand-gpon-technology.html), [ITU-T G.984.1](https://www.itu.int/rec/T-REC-G.984.1), [Wikipedia PON](https://en.wikipedia.org/wiki/Passive_optical_network)_

### OLT Port Kapasite Hesaplamasi

**Kodun Yaklaşımı (checkOLTCapacity):**
```
portsByBB  = totalBB / 128    → ham fiziksel kapasite
portsByONT = totalEffBB / 64  → aktif ONT limiti (penetrasyon sonrasi)
required   = max(1, portsByBB, portsByONT)
```

**ITU-T G.984 Spesifikasyonu:**
- Maksimum: 128 ONU/ONT per GPON port (G.984.1)
- Pratikte: 32-64 ONT onerilir (optik butce ve performans nedeniyle)

**Analiz:**
Kodun iki katmanli kontrolu (128 BB ham + 64 ONT efektif) **standarttan daha konservatif** ve dogru bir yaklasim:
- 128 BB: Fiziksel altyapinin destekleyebilecegi maksimum bagimsiz bolum
- 64 ONT: Aktif cihaz limiti - penetrasyon orani uygulandiktan sonra
- Ornek: 100 BB, %70 penetrasyon = 70 ONT → 2 port gerekli (70/64)

Bu iki katmanli kontrol, port asiri yuklemesini onler.

_Guven Seviyesi: YUKSEK_
_Kaynaklar: [ITU-T G.984.1](https://www.itu.int/rec/T-REC-G.984.1), [Cisco GPON](https://www.cisco.com/c/en/us/support/docs/switches/catalyst-pon-series/216230-understand-gpon-technology.html)_

### Hesaplama Pipeline Veri Akisi

**PonEngine.recalculateAda() Pipeline:**
```
1. OLT Yerlesim  → findOptimalOLT() → agirlikli geometrik medyan
2. OLT Kapasite  → checkOLTCapacity() → port sayisi
3. FDH           → [devre disi] → fdhNodes = []
4. Rotalama      → buildMST() veya manualEdges → tek seviye MST
5. Splitter      → calcSplitter() → bina bazinda tek seviye
6. Kablolama     → backbone + distribution + drop + ring
7. Loss Budget   → calcLossBudget() → bina bazinda kayip hesabi
8. Envanter      → calcInventory() → malzeme ve maliyet
```

**Modul Arasi Veri Akisi:**
```
NviScraper (DOM) → Topology (veri modeli) → PonEngine (hesaplama)
                                           → Overlay (harita)
                                           → Panels (UI)
                                           → Storage (kalicilik)
```

**Entegrasyon Kalitesi:** Her modul IIFE pattern ile izole, global API uzerinden etkilesir. Veri akisi tek yonlu ve deterministik - her degisiklik `recalculateAda()` tetikler, sonuclar `ada.calculations` nesnesinde toplanir.

_Guven Seviyesi: YUKSEK - Dogrudan kod analizi_

### Splitter-Bina Entegrasyon Kaliplari

**Mevcut Tek Seviye Yaklasim:**
```
OLT Port → Fiber → Splitter (bina icinde) → ONT'ler
```

Her bina icin bagimsiz splitter hesaplanir:
- effBB ≤ 8  → 1:8 (10.5 dB)
- effBB ≤ 16 → 1:16 (14.0 dB)
- effBB ≤ 24 → 1:16 + 1:8 (paralel, cascade degil)
- effBB ≤ 32 → 1:32 (17.5 dB)
- effBB > 32 → 1:32 + 1:16 (paralel)

**Kritik Tespit - Paralel Splitter Davranisi:**
`calcSplitter()` fonksiyonu effBB > 16 icin **birden fazla splitter** dondurur. Bunlar **paralel** splitter olarak calisir (cascade degil). Loss budget hesabinda `spl.reduce((s, sp) => s + sp.loss, 0)` ile **toplam kayip toplanir**, bu da yanlis. Paralel splitter'larda kayip en yuksek splitter'in kaybidir, toplam degil.

Ancak `recalculateAda()` icinde (satir 768-783), sadece `simpleSpls[0]` (ilk splitter) cascade verisi olarak kullanilir ve loss budget bu tek splitter uzerinden hesaplanir. Bu dogru calisiyor cunku loss budget tek splitter kaybi kullaniyor.

**Sonuc:** Ikinci splitter envantere ekleniyor ama loss budget'a etki etmiyor - bu **dogru** davranis. Buyuk binalarda iki paralel splitter farklı fiber kollarını besler.

_Guven Seviyesi: YUKSEK - Kod analizi ile dogrulanmis_

### Veri Depolama ve Serializasyon

- **Format:** JSON - `chrome.storage.local` ile `fp_` prefix
- **Durum yonetimi:** `Topology.getState()` → tam proje durumu (ada, bina, hesaplama)
- **Backend uyumluluk:** Tum veri yapilari JSON-serializable, gelecekte online izleme icin hazir

_Guven Seviyesi: YUKSEK_

---

## Mimari Kaliplar ve Tasarim Kararlari

### FTTH Splitter Mimarisi Karsilastirmasi

| Ozellik | Centralized (Kodun Yaklasimi) | Cascade (Eski Yaklasim) | Distributed |
|---------|-------------------------------|------------------------|-------------|
| Splitter seviyesi | 1 (bina icinde) | 2 (FDH + bina) | 1-2 (saha ekipmani) |
| Esneklik | Yuksek | Dusuk | Orta |
| Bakim maliyeti | Dusuk | Yuksek | Orta |
| Ilk yatirim | Daha fazla fiber | Daha az fiber | Orta |
| Sorun giderme | Kolay (tek nokta) | Zor (iki seviye) | Orta |
| Uygun senaryo | Yogun sehir, kisa mesafe | Kirsal, uzun mesafe | Banliyö |

**Ada Bazli Degerlendirme:**
Kodun centralized (tek seviye) yaklasimi, ada (sehir bloku) olceginde **kesinlikle dogru secim**:
- Ada icinde mesafeler tipik olarak <500m
- Bina sayisi genellikle 3-30 arasi
- FDH kabini icin ek altyapi/maliyet gereksiz
- Tek seviye splitter sorun gidermeyi kolaylastirir

_Guven Seviyesi: YUKSEK_
_Kaynaklar: [Lightwave Architecture Choices](https://www.lightwaveonline.com/fttx/cables-enclosures/article/16673516/architecture-choices-in-ftth-networks), [Tarluz Centralized vs Cascading](https://www.tarluz.com/ftth/what-splitter-structure-you-should-have-in-ftth-network-centralized-or-cascading/), [CommScope Centralized Split](https://www.commscope.com/knowledge/what-is-centralized-split-architecture/), [Corning FTTH Architecture](https://www.corning.com/optical-communications/worldwide/en/home/the-signal-network-blog/choosing-a-ftth-network-architecture.html)_

### Rotalama Algoritmasi: MST vs Steiner Tree

**MST (Prim) - Kodun Yaklasimi:**
- Zaman karmasikligi: O(V * log V) - hizli
- Her binayi ziyaret eder (tum dugumler MST'de)
- Deterministik, tekrarlanabilir sonuc
- Gercek zamanli yeniden hesaplama icin uygun

**Steiner Tree - Alternatif:**
- NP-hard problem - buyuk olcekler icin cozulmesi zor
- Ara dugumler (Steiner noktalar) ekleyerek daha kisa toplam uzunluk bulabilir
- Optimal Steiner tree, MST'den en fazla %50 daha kisa (2x sinir)
- Pratik fark genellikle %5-15

**Karar:** Ada olceginde (3-30 bina) MST **kesinlikle yeterli**:
- Steiner tree optimizasyonunun getirisi minimum (<500m alanda %5-15 tasarruf = onumsuz)
- MST, kullanici her bina eklediginde aninda yeniden hesaplanabilir
- Steiner tree, gercek zamanli etkilesim icin cok yavas

_Guven Seviyesi: YUKSEK_
_Kaynaklar: [PLOS One - Capacitated Steiner Tree](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0270147), [arXiv - Steiner Tree FTTH](https://arxiv.org/abs/2109.10617), [IJLTET - MST Fiber Optic](https://www.ijltet.org/journal_details.php?id=930&j_id=4461)_

### Loss Budget Guvenlik Marji - KRITIK BULGU

**Endustri Standardi:**
- Minimum **3 dB** guvenlik marji onerilir
- Bazi operatorler 5-10 dB marj kullanir
- Marj su durumlari kapsar: bilesen yaslanmasi, cevre degisiklikleri, gelecek ek ve onarimlar
- Bazi Turk operatorleri ODN butcesini 26.7 dB ile sinirlar (28 dB yerine, 1.3 dB marj)

**Kodun Durumu:**
```javascript
// pon-engine.js satir 552
const margin = Math.round((CONSTANTS.maxLossBudget - totalLoss) * 10) / 10;
// Status: margin >= 0 ise "OK"
```

Kod, `margin >= 0` kontrolu yapiyor (28 dB sinirdan kalan marj). Ancak **ek bir guvenlik marji uygulanmiyor**. Bir bina icin totalLoss = 27.5 dB oldugunda margin = 0.5 dB ve status = "OK" olur, ancak bu gercek dunyada **riskli**.

**Oneri:** `status` degerlendirmesine guvenlik marji eklemek:
- margin >= 3 dB → "OK" (guvenli)
- margin >= 0 dB ve < 3 dB → "WARNING" (risk)
- margin < 0 dB → "FAIL" (basarisiz)

_Guven Seviyesi: YUKSEK_
_Kaynaklar: [FOA Loss Budgets](https://www.thefoa.org/tech/lossbudg.htm), [OptCore Link Budget](https://www.optcore.net/how-to-calculate-the-fiber-link-budget/), [Grokipedia Optical Margin](https://grokipedia.com/page/optical_power_margin), [ScienceDirect Loss Budget](https://www.sciencedirect.com/topics/engineering/loss-budget)_

### Ada-Scoped Mimari Tasarim

**Kodun Yaklasimi:**
- Her islem ada (sehir bloku) baglaminda calisir
- Binalar asla duz liste olarak islenmez, her zaman ada'ya bagli
- `recalculateAda()` tek bir ada icin tam pipeline calistirir
- Multi-ada OLT gruplama destegi mevcut (`oltGroups`)

**Degerlendirme:** Bu tasarim karari **cok dogru**:
- Turkiye'de adres sistemi ada/parsel bazli (NVI uyumu)
- Hesaplama karmasikligi ada boyutuyla sinirli kalir
- Her ada bagimsiz olarak planlanabilir
- Paralel ada islemesi gelecekte mumkun

_Guven Seviyesi: YUKSEK - Dogrudan kod analizi_

### Veri Modeli Tasarimi

**PROJECT Singleton Pattern:**
```
PROJECT → adas[] → buildings[]
                 → topology{} (OLT, MST, splitter config)
                 → calculations{} (hesaplama sonuclari)
```

- IIFE pattern ile modul izolasyonu
- Global API uzerinden moduller arasi iletisim
- Durum degisikligi → tam yeniden hesaplama (event-driven degil, snapshot-based)
- JSON-serializable veri yapilari

**Degerlendirme:** Chrome Extension baglami icin **uygun mimari**:
- Build step yok, vanilla JS - basitlik korunuyor
- Global state tek noktada yonetiliyor
- Herhangi bir degisiklikte tam yeniden hesaplama, ada boyutunda performans sorunu yaratmaz

---

## Implementasyon Arastirmasi ve Oneriler

### Tespit Edilen Sorunlar - Tam Liste

#### BUG 1: `manDist` Degiskeni Erken Kullanim (ONCELIK: YUKSEK)

**Dosya:** `pon-engine.js` satir 698 vs 745
**Sorun:** `var manDist` JavaScript hoisting nedeniyle fonksiyon basinda `undefined` olarak tanimlaniyor. Manuel modda (satir 688-701) `getDistance(meFrom, meTo, manDist)` cagrildiginda `manDist` henuz atanmamis.
**Etki:** Manuel modda kullanicinin mesafe override'lari (`ada.topology.manualDistances`) uygulanmiyor. Tum mesafeler Haversine hesabindan gelir.
**Cozum:**
```javascript
// Satir 684'ten ONCE, manDist tanimini yukari tasi:
var manDist = ada.topology.manualDistances || {};
```

_Guven Seviyesi: YUKSEK - Dogrudan kod analizi, JavaScript hoisting davranisi_

#### BUG 2: ReviewEngine Cascade Kontrolu Uyumsuz (ONCELIK: ORTA)

**Dosya:** `review-engine.js` satir 136-148
**Sorun:** `evalSplitter()` icinde:
```javascript
const needsCascade = splitters.filter(s => s.bb > 16);
const hasCascade = splitters.filter(s => s.cascade && s.cascade.level1);
const cascadeOk = needsCascade.length === 0 || hasCascade.length > 0;
```
FDH kaldirilinca `level1` her zaman `null`. Eger herhangi bir bina >16 BB ise `cascadeOk = false` ve skor 40 (fail) olur. Bu **yanlis negatif** - tek seviye mimaride cascade beklenmemeli.

**Etki:** >16 BB'li binalar olan adalar icin ReviewEngine hep "Kaskad Verimliligi: FAIL" raporu verir.
**Cozum:** Cascade kontrolunu tek seviye mimariye uyarla:
```javascript
// Tek seviye mimaride: parallel splitter kontrolu yap
const needsMultiple = splitters.filter(s => s.effBB > 16);
const hasMultiple = splitters.filter(s => s.splitters && s.splitters.length > 1);
const multiOk = needsMultiple.length === 0 || hasMultiple.length === needsMultiple.length;
```

_Guven Seviyesi: YUKSEK - Dogrudan kod analizi_

#### IYILESTIRME 1: Loss Budget Status'e Guvenlik Marji (ONCELIK: ORTA)

**Dosya:** `pon-engine.js` satir 567
**Mevcut:** `status: margin >= 0 ? 'OK' : 'FAIL'`
**Oneri:**
```javascript
status: margin >= 3 ? 'OK' : margin >= 0 ? 'WARNING' : 'FAIL'
```
**Not:** `ReviewEngine` zaten 0-3 dB araligini warning olarak degerlendiriyor (satir 44). Bu iyilestirme, ReviewEngine kullanilmadan da (ornegin dashboard'da) dogru bilgi gostermesini saglar.

_Guven Seviyesi: YUKSEK_
_Kaynaklar: [FOA Loss Budgets](https://www.thefoa.org/tech/lossbudg.htm), [OptCore Link Budget](https://www.optcore.net/how-to-calculate-the-fiber-link-budget/)_

#### IYILESTIRME 2: Backbone Kablo Minimum Kor Sayisi (ONCELIK: DUSUK)

**Dosya:** `pon-engine.js` satir 846
**Mevcut:** `if (blds.length > 16) backboneCores = Math.max(backboneCores, 48);`
**Analiz:** Backbone kablo 16+ bina icin 48 kor minimuma cekilir. FOA "gelecekte ihtiyactan cok daha fazla fiber dosemek daha ucuz" der. 12 kor'luk backbone riskli olabilir.
**Oneri:** Minimum backbone'u her durumda 24 kor yapmak dusunulebilir:
```javascript
backboneCores = Math.max(backboneCores, 24);
if (blds.length > 16) backboneCores = Math.max(backboneCores, 48);
```

_Guven Seviyesi: ORTA - Endustri pratigi ama zorunlu degil_

### Dogrulama ve Test Stratejisi

**Mevcut Test Altyapisi:**
- `fiber-chrome/dashboard/test-topology.html` - Topoloji hesaplama testleri
- Tarayicida acilarak calistirilir

**Onerilen Test Senaryolari:**

| Senaryo | Kontrol | Beklenen |
|---------|---------|----------|
| 1 bina, 5 BB | Splitter 1:8 | 10.5 dB |
| 1 bina, 20 BB | Splitter 1:32 | 17.5 dB |
| 1 bina, 25 BB | 2x paralel splitter | 1:16 + 1:8, loss = 14.0 dB (sadece ilk) |
| 3 bina, 500m mesafe | Loss budget | < 28 dB, mesafe 0.5 km |
| Manuel mesafe override | manDist uygulanmasi | Override mesafe kullanilmali |
| 10 bina, 1 bina >16 BB | ReviewEngine cascade | Warning/OK olmali (FAIL degil) |
| Bina, 27.5 dB toplam kayip | Status | "WARNING" (FAIL degil, OK degil) |

**GPON Dogrulama Best Practice:**
- Hesaplanan loss budget ile gercek OTDR olcumu karsilastirilmali
- Olcum belirsizligi ~±0.5 dB dikkate alinmali
- Kurulumdan sonra segment-segment test onerilir

_Kaynaklar: [FOA Loss Budget](https://www.thefoa.org/tech/lossbudg.htm), [Xena GPON Testing](https://www.xenanetworks.com/wp-content/uploads/2020/06/GPON-WP.pdf), [Kingfisher PON Testing](https://kingfisherfiber.com/application-notes/a-pon-testing-strategy/)_

### Teknik Arastirma Oneriler Ozeti

#### Hemen Yapilmasi Gerekenler

1. **`manDist` bug fix** - `var manDist = ...` satirini satir 684'ten once tasi
2. **ReviewEngine cascade kontrolu** - Tek seviye mimariye uyarla
3. **Loss budget status** - 3 dB guvenlik marji ekle (WARNING seviyesi)

#### Gelecek Iyilestirmeler

4. **Backbone minimum kor** - Tum durumlarda minimum 24 kor
5. **Konnektor/ek sayisi** - Sabit 4+2 yerine gercek rota uzerinden dinamik hesaplama
6. **Per-building penetrasyon** - Bina bazinda farkli penetrasyon orani destegi (brainstorming'den)
7. **OTDR dogrulama entegrasyonu** - Hesaplanan vs olculen deger karsilastirmasi

---

## Sonuc ve Genel Degerlendirme

### Standart Uyumu Sonucu

| Parametre | Kodda | Standart | Sonuc |
|-----------|-------|----------|-------|
| Max loss budget | 28 dB | 28 dB (Class B+) | DOGRU |
| Fiber kaybi @1310nm | 0.35 dB/km | 0.35 dB/km (G.652) | DOGRU |
| Konnektor kaybi | 0.5 dB | 0.2-0.75 dB (TIA/EIA) | UYGUN |
| Ek kaybi | 0.1 dB | 0.1-0.3 dB (TIA/EIA) | UYGUN |
| Splitter kayiplari | 3.5×log2(n) | PLC spec ustu | UYGUN |
| Max BB/port | 128 | 128 (G.984.1) | DOGRU |
| Max ONT/port | 64 | 128 (pratikte 32-64) | KONSERVATIF-DOGRU |

### Mimari Degerlendirme

| Karar | Sonuc | Aciklama |
|-------|-------|----------|
| FDH'siz tek seviye splitter | DOGRU | Ada olceginde centralized mimari onerilir |
| Tek seviye MST (Prim) | DOGRU | 3-30 bina icin yeterli, Steiner tree gereksiz |
| Ada-scoped islemler | DOGRU | NVI adres sistemiyle uyumlu |
| IIFE + global singleton | DOGRU | Chrome Extension + vanilla JS icin uygun |

### Genel Sonuc

**Mevcut mimari ve hesaplama yaklasimi buyuk olcude dogru ve standartlara uygun.** 2 bug (manDist hoisting, ReviewEngine cascade), 1 iyilestirme (loss budget safety margin) tespit edildi. Bunlarin hicbiri mimari degisiklik gerektirmiyor - hepsi lokalize duzeltmeler.
