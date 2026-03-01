---
stepsCompleted: ['setup', 'ideation', 'evaluation', 'implementation']
inputDocuments: []
session_topic: 'FiberPlan Chrome Extension ozellikleri - Hesaplama & Topoloji'
session_goals: 'Belirli sorunlara yaratici cozumler bulmak'
selected_approach: 'AI-Recommended'
techniques_used: ['Question Storming', 'Simplification Analysis']
ideas_generated: ['FDH konseptini kaldir', 'Tek seviye MST', 'Tek seviye splitter', 'Penetrasyon dropdown bug fix']
context_file: ''
---

# Brainstorming Session Results

**Facilitator:** BURAK
**Date:** 2026-02-27
**Odak:** Hesaplama & Topoloji (PonEngine, splitter, loss budget, kablo rotalama)

---

## Teknik 1: Question Storming

**Kural:** Sadece soru uretiyoruz. Cevap yok, cozum yok - sadece sorular!
**Amac:** Dogru problemleri tanimlayacak sorulari bulmak.

### Sorular

1. FDH konsepti neden var? Ada icinde sadece binalari birbirine baglamak yeterli degil mi?
2. Hesaplama matematigi neden manuel hesaplamalardan farkli sonuc veriyor?
3. FDH kumeleme karmasikligi hesaplamalari nasil etkiliyor?
4. Penetrasyon orani degistiginde harita neden guncellenmiyor?
5. Dashboard'da penetrasyon neden dogru calisiyor ama overlay'de calismiyor?
6. Tek seviye MST, iki seviyeli MST'ye gore ne kadar daha basit ve dogru?
7. Splitter cascade gerekliligi FDH'ye mi bagli yoksa bina bazinda yeterli mi?

---

## Teknik 2: Simplification Analysis

**Amac:** Gereksiz karmasikligi tespit etmek ve kaldirmak.

### Tespit Edilen 3 Kritik Sorun

#### Sorun 1: FDH Konsepti Gereksiz
- **Durum:** PonEngine, binalari FDH gruplarinda kumeliyor (max 8 bina/FDH)
- **Problem:** Ada icinde sadece binalari birbirine fiberle baglamak isteniyor. FDH kumeleme karmasikligi istenmiyor.
- **Etki:** Iki seviyeli MST, cascade splitter, FDH kabinet envanteri - hepsi gereksiz karmasiklik ekliyor
- **Cozum:** FDH adimini devre disi birak, tek seviye MST ve tek seviye splitter kullan

#### Sorun 2: Hesaplama Matematigi Yanlis Hissettiriyor
- **Durum:** PonEngine sonuclari, BURAK'in manuel hesaplamalariyla uyusmuyor
- **Problem:** FDH gruplama → cascade splitter → feeder/distribution ayrimi zincirleme hataya yol aciyor
- **Etki:** Kullanici sisteme guvenemiyor, her seferinde manuel kontrol yapmak zorunda
- **Cozum:** FDH kaldirilinca splitter cascade da sadeleşecek, sonuclar daha mantikli olacak

#### Sorun 3: Penetrasyon Orani Haritada Guncellenmiyor
- **Durum:** Dashboard'da dogru calisiyor ama harita overlay'de dropdown yeniden olusturulunca event listener kayboluyor
- **Problem:** `buildLegendPanel()` her `render()` cagirisinda dropdown HTML'i yeniden olusturuyor, ama event listener sadece `init()` sirasinda bir kez baglaniyor
- **Etki:** Kullanici penetrasyon oranini haritadan degistiremiyor
- **Cozum:** Event listener'i `updateLegend()` fonksiyonuna tasi, her render'da yeniden bagla

---

## Uygulanan Degisiklikler

### 1. PonEngine Sadelestirme (pon-engine.js)
- **Step 3:** `assignFDH()` cagrisi yerine `fdhNodes = []`
- **Step 4:** Iki seviyeli MST → tek seviye `buildMST(blds, oltB.id)`
- **Step 5:** `calcSplitterCascade()` → `calcSplitter(effBB)` (tek seviye, level1=null)
- **Step 6b:** OLT kenarlarinda `calcFeederCores` + `calcDistributionCores` max → sadece `calcDistributionCores`
- **Step 8:** FDH kabinet envanterden kaldirildi

### 2. Penetrasyon Dropdown Bug Fix (overlay.js)
- `init()` icindeki `setTimeout` listener kaldirildi
- `updateLegend()` icinde her cagirisda cloneNode + addEventListener ile listener yeniden baglaniyor
- FDH legend satiri kaldirildi

---

## Gelecek Dusunceler (Bu Oturumda Uygulanmadi)

- **ML onerisi:** Kullanicinin manuel duzeltmelerinden ogrenen bir sistem
- **Per-building penetrasyon orani:** Bina bazinda farkli penetrasyon destegi
- **Connector/splice sayisi:** Sabit 4+2 yerine gercek yola gore hesaplama
- **calcSplitterCascade() korunuyor:** Fonksiyon silinmedi, ileride FDH geri istenirse kullanilabilir
