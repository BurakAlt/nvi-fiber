# 🕵️ Adversarial Code Review: Story 7.3 (Planlanan ve Canlı Ağ Karşılaştırması)

## ❌ OVERALL VERDICT: CHANGES REQUESTED
Story 7.3 genel olarak `live-monitor.js` içine Story 7.2 geliştirilirken önceden yazılmıştır (Scope Creep). Mevcut olan kod parçaları Leaflet overlay entegrasyonu ve yapılandırma açısından UI seviyesinde iyi dursa da, altyapısal olarak 7.1 ve 7.2'nin `proxyFetch` çöküşünden etkilendiği için veri alamayarak tamamen geçersiz bir modül konumundadır. Bunun yanı sıra temel bir BDD Acceptance Criteria ihlali taşıyan mantık hatası da vardır.

---

## 🚨 CRITICAL / HIGH ISSUES

### 1. [Architecture] Asla Tetiklenemeyecek Karşılaştırma Motoru (Dependency Chain Failure)
**Problem:** `comparePlannedVsLive` fonskiyonu `LiveMonitor` içerisindeki `getDevices()` (UISP) ve `getMetrics()` (Zabbix) çağrılarna bağımlıdır. 7.1 ve 7.2 no'lu hikayelerin `proxyFetch` ağ yapılandırması `background.js` içinde olmadığından bu fonksiyonlar hiçbir zaman veri getiremeyecektir. 
**Impact:** `comparePlannedVsLive` her zaman 0 online cihaz ve 0 ekstra cihaz ile eksik / hatalı çalışacaktır. Bu hikaye teorik olarak yazılmış ama entegrasyon hataları yüzünden hiçbir zaman canlı veriyle test edilmemiştir (veya mock veriyle test edilip geçilmiştir).

### 2. [Logic] Kapasite Karşılaştırmasında Yanlış Değişken Kullanımı (`lib/live-monitor.js`)
**Problem:** Acceptance Criteria'da özellikle "planlanan PON port kapasitesi vs gercek kullanim" istenmiştir. `_compareCapacity` metodu içerisinde `totalBB` hesaplanıp `plannedPorts = Math.ceil(totalBB / 128)` gibi doğru bir port hesabı dahi yapılmıştır (Satır ~1339). Ancak hemen altında bu hesap çöpe atılmış ve karşılaştırma şu koda bırakılmıştır:
```javascript
    // Bagli cihaz > planlanan bina sayisi → kapasite uyarisi
    if (onlineCount > ada.buildings.length) { ... }
```
**Impact:** Online cihaz sayısı (her bina için 1 router varsa) genelde bina sayısına eşittir. Sistem port kapasitesinin aşılıp aşılmadığını kontrol etmek yerine "cihaz sayısı > bina sayısı" olup olmadığına bakmaktadır (ki bu zaten `EXTRA_DEVICE` mantığına daha yakındır). FR ihlali mevcuttur.
**Expected Fix:** `onlineCount` değerinin `plannedPorts * maxBBPerPort` değeri veya sadece `plannedPorts` üzerinden geçilip port hesaplamasına bağlanması gerekir.

---

## ⚠️ MEDIUM / LOW ISSUES

### 3. [Performance/UX] Comparison Render Tetiklenmesi (`content/overlay.js`)
**Problem:** `comparison:updated` event'i geldiğinde haritanın tamamı `Overlay.render()` fonksiyonu ile tetiklenmektedir. Canlı ağ ortamında saniyede onlarca cihaz düşüp geri gelebilir (flapping). 
**Impact:** Zaten yavaş çalışan Leaflet Canvas ve DOM manipülasyonları ana thread'i bloke ederek "Jank" (takılma) hissi verecektir.
**Expected Fix:** `comparison:updated` için özel bir `renderComparisonLayerOnly()` yazılmalı veya en azından 1000ms - 2000ms'lik bir Debounce (Throttle) uygulanarak saniyede bir defadan fazla render edilmesi engellenmelidir.

## Sonuc
Story 7.3, hatalı kapasite hesabı ve altyapısındaki ölümcül bağımlılık (proxyFetch) kaynaklı sebeplerle reddedilmelidir. `_compareCapacity` foksiyonunun yeniden yazılması gerekmektedir. Kod şimdilik **Changes Requested** seviyesindedir.

---

## 🚀 Dev Agent İçin Sonraki Adımlar (Priority List)

Lütfen düzeltmeleri aşağıdaki öncelik sırasına göre **ayrı context window'larda** (`/bmad-bmm-dev-story` kullanarak) gerçekleştirin:

1. **Ortak Sorun - `proxyFetch` Altyapısı (Priority 1):** `background.js` dosyasına `proxyFetch` asenkron listener'ı eklenmelidir (Bu 4 story'yi etkiliyor. Story 7.1 veya 7.3 bağlamında yapılabilir).
2. **Story 7.3 Düzeltmesi (Priority 2):** `lib/live-monitor.js` içindeki `_compareCapacity` mantık hatası giderilmelidir. Port hesaplaması (`plannedPorts`) online cihaz kıyaslamasında doğru şekilde kullanılmalıdır.
3. **Story 7.3 Perf Düzeltmesi:** `comparison:updated` tetiklenmesi için debounce/throttle yazılmalıdır.
4. Düzeltmeler tamamlanınca tekrar `/bmad-bmm-code-review` akışını tetikleyin.
