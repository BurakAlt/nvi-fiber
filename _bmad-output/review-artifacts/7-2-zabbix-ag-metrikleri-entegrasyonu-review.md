# 🕵️ Adversarial Code Review: Story 7.2 (Zabbix Ag Metrikleri Entegrasyonu)

## ❌ OVERALL VERDICT: CHANGES REQUESTED
Story 7.2 implementasyonlarında Zabbix JSON-RPC mimarisi, In-memory cache ve EventBus tabanlı köprüler teoride çok iyi tasarlanmıştır. `createTimeSeriesChart` gibi Canvas çözümleri dış kütüphanelere bağımlılığı önlemek üzere pratik bir yoldur. Ancak Story 7.1 incelemesinde tespit ettiğimiz temel ağ iletişimi çöküşü (proxyFetch eksikliği) Zabbix modülünü de vurmaktadır. Ayrıca ciddi bir `Scope Creep` (Kapsam Kayması) yaşanmıştır. 

---

## 🚨 CRITICAL / HIGH ISSUES

### 1. [Logic/Architecture] Kusurlu CORS Çözümü ve Eksik `proxyFetch` (`background.js`)
**Problem:** `lib/live-monitor.js` dosyasındaki `_zabbixRpc` metodu, Story 7.1'dekine benzer şekilde CORS'u aşmak için `chrome.runtime.sendMessage({ action: 'proxyFetch', method: 'POST', body: ... })` kullanmaktadır. Geliştirici dokümanlarında `background.js` icerisinde POST desteğinin dahil edildiği belirtilmesine rağmen (`Dev Agent Record` sekmesinde `background.js proxyFetch POST desteği eklendi` yazıyor), `background.js` içerisinde ne `fetch` ne de `proxyFetch` event listener'ı bulunmamaktadır!
**Impact:** Zabbix üzerinden alınan metrikler veya login isteklerinin (`user.login`) hepsi cevapsız kalır, promise çözülmez ve uygulama zaman aşımına uğrar ya da background port closed hatası verir. Kısacası Story 7.2 kodu *tamamen çalışmaz*.
**Expected Fix:** `background.js`'e derhal JSON ve POST desteği barındıran asenkron bir `proxyFetch` iletişim listener'ı eklenmelidir.

---

## ⚠️ MEDIUM / LOW ISSUES

### 2. [Scope Creep] Story 7.3 Kodlarının Şimdiden Kodlanmış Olması (`lib/live-monitor.js`)
**Problem:** Story 7.2 "Zabbix Ag Metrikleri Entegrasyonu" ile ilgilidir, ancak `live-monitor.js` incelendiğinde `DISCREPANCY_TYPES`, `comparePlannedVsLive`, `getComparisonSummary`, `exportComparisonReport` gibi tamamen Story 7.3 ("[Story 7.3] Planlanan ve Canlı Ağ Karşılaştırması") kapsamına giren koca bir modül dizisi şimdiden geliştirme dosyasına enjekte edilmiştir (Line ~1400 ile 1580 aralığı).
**Impact:** `live-monitor.js` dosyası 1584 satıra ulaşarak aşırı şişkin (Bloated) bir yapı haline gelmiştir. Task/Story izolasyonu ilkesi ağır biçimde ihlal edilmiştir. Bu durum, revizyon yönetimini ve branch birleştirmeyi (gerçek bir senaryoda) mahveder.
**Expected Fix:** Kodlar doğru çalıştığı sürece silinmesine gerek kalmayabilir, ancak incelemenin amacı çerçevesinde "Feature Leakage / Scope Creep" olarak ciddi şekilde uyarılmalıdır. `lib/live-monitor.js` gibi devasa dosyalar yerine `lib/discrepancy-engine.js` gibi ayrı parçalara bölünmesi düşünülmelidir.

### 3. [Logic/UX] Memory Yönetimi - Tab Geçişlerinde Grafik Yenileme
**Problem:** `createTimeSeriesChart` metodu basit Canvas implementasyonu ile çizim yapar. DOM üzerinde `Panels.js` içerisine eklenen sekme değiştirildiğinde Canvas elementleri yok edilip baştan render edilir (`innerHTML` manipülasyonu ile). Ancak Canvas'ta bağlı olan event listener'lar (ör: mousemove tooltip için v.b.) çöp toplayıcı (GC) tarafından zamanla temizlenmezse memory leak yaratabilir. 
**Impact:** Uzun süre açık kalan sekmede defalarca Zabbix sekmesine girip çıkılırsa hafif bir Memory Leak durumu yaşanabilir. MVP ölçeğinde çok zararlı değildir.
**Expected Fix:** Detaylı Canvas cleanup fonksiyonları (örneğin `removeEventListener`) tab kapanırken çağırılmalıdır.

## Sonuc
Story 7.2, Story 7.1'deki temel altyapı eksikliğinin (proxyFetch) kurbanı olmuştur, bu sebeple test edilebilir ve onaylanabilir bir durumda değildir. Kod yazımı mantıklı olsa da Network layer hatalıdır. `proxyFetch` onarılmadan bu hikaye de tamamlanmış sayılamaz.
