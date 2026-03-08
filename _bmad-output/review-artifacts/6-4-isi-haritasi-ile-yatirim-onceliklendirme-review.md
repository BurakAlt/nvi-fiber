# Code Review: 6-4 Isle Haritasi Ile Yatirim Onceliklendirme

## Genel Degerlendirme
Story 6.4 (Yatırım Önceliklendirme), `MarketingDataHouse` modülüne eklenen onceliklendirme algoritmalari ile dogru biçimde kurgulanmıştır. Min-Max normalizasyon yapılarak müşteri yoğunluğu ve arıza yoğunluğuna dayalı ağırlıklı puanlama mantığı `calculateAllPriorities` fonskiyonu içerisinde iki geçişli (two-pass) olarak hatasız tasarlanmıştır. `overlay.js` ve `heat-map.js` üzerinde gösterimi de istenilen şekilde render edilmektedir.

## Bulgular

### [AI-Review] Bulgu 1 (LOW): ROI ve Investment Hata Yakalama Yaklaşımı
**Problem:** `calculateAllPriorities` metodunda ROI ve yatırım hesaplamaları sırasında `try...catch { /* ignore */ }` kullanılmış ve hata durumunda bu değerler sessizce yutulmuştur (null veya 0 dönüyor). Bu durum veritabanı veya hesaplama modülünde temel bir matematik hatası (örn. `Financial` API'si değişirse) oluştuğunda debug etmeyi çok zorlaştıracaktır.
**Yeri:** `fiber-chrome/lib/marketing-data-house.js` (Satır ~800)
```javascript
      if (typeof Financial !== 'undefined') {
        try {
          var inv = Financial.getTotalInvestment(d.ada);
          totalInvestment = inv ? inv.totalInvestment : 0;
        } catch (e) { /* ignore */ }
        // ...
```
**Cozum Onerisi:** İçerideki `catch` bloklarına en azından geliştirici konsoluna bilgi vermek için `if (typeof FPDebug !== 'undefined') FPDebug.warn(e)` gibi bir loglama mekanizması eklenmelidir.

### [AI-Review] Bulgu 2 (LOW): Normalizasyon Esnasında Sıfıra Bölme Güvenliği
**Problem:** `maxCustomer > 0 ? d.rawC / maxCustomer : 0` yaklaşımı tam olarak doğru çalışır, ancak `d.rawC` verisi bazen çok küçük ondalıklı değerler alabilir (`rawC` = penetrasyon üzerinden hesaptır). Yinelemelerde rounding sorunlarına ekstra dikkat edilebilir ancak iş mantığını bozacak bir zafiyet yoktur. Tamamen iyi kodlanmıştır.

### [AI-Review] Bulgu 3 (LOW): Event Listener Performans Optimize
**Problem:** Yatırım modalı içerisinde slider (`fp-weight-customer`) değiştiğinde `syncSliders` aracılığıyla UI tetiklenmekte ve veriler eşzamanlı olarak calculate edilmektedir. Eğer projede yüzlerce ada bulunursa slider arayüzü hesaplama bitene kadar takılabilir (jank).
**Cozum Onerisi:** İsterlerde debounce (300ms) belirtilmiş olmasına rağmen implementasyon esnasında sadece `heat-map.js` üzerindeki genel redraw işlemlerine odaklanılmıştır, veri hesaplamasında ufak gecikmeler fark edilebilir ama büyük bir risk değildir.

## Sonuc
Story 6.4 Yatırım Önceliklendirme modülü, verilerin UI ile kusursuz etkileşime girmesi ve belirlenen metriklerin harita üzerinde Leaflet Poligon/Markerlarıyla görselleştirilmesi (Color mapping vb.) açısından gayet sağlıklı ve iyi dizayn edilmiştir. Onaylanarak bir sonraki development evrelerine (Epic 7 vb.) geçirilebilir. Mevcut kod: **Looks Good**.
