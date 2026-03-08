# Code Review: 6-3 Isi Haritasi Gorsellestirme ve Katman Yonetimi

## Genel Degerlendirme
Story 6.3 (Isi Haritası Görselleştirme), kurgulanan `HeatMap` Canvas tabanlı overlay sistemi üzerinden başarılı şekilde implemente edilmiştir. Leaflet pan/zoom olaylarıyla senkronizasyon performanslıdır (requestAnimationFrame ve debounce). İki temel katman (Müşteri Yoğunluğu ve Arıza Yoğunluğu) farklı renk skalalarıyla (LinearGradient'tan Palette haritalaması yapılarak) `overlay.js` ve `panels.js` arayüzüne başarıyla entegre edilmiştir.

Bununla birlikte, inceleme esnasında yeniden kullanım ve yaşam döngüsü senaryolarında bir memory leak (bellek sızıntısı) tespit edilmiştir.

## Bulgular

### [AI-Review] Bulgu 1 (MEDIUM): Harita Resize Event Listener Memory Leak
**Problem:** `fiber-chrome/content/heat-map.js` modülünde `init()` metodunda Leaflet haritasına `resize` olay dinleyicisi eklenmektedir. Ancak modülün yaşam döngüsünü bitiren `destroy()` fonksiyonunda `moveend` ve `zoomend` olayları kapatılmasına rağmen `resize` olayı için `.off()` çağrısı yapılmamıştır. Eğer HeatMap birden çok kez unmount/mount edilirse (örneğin eklentinin yeniden başlatılması veya farklı bir instance oluşturulması durumunda), haritaya bağlı birden fazla anonim `resize` handler referansı asılı kalacak ve potansiyel bir memory leak'e yol açacaktır.
**Yeri:** `fiber-chrome/content/heat-map.js`
- `init` fonksiyonu: `_map.on('resize', function() { ... });`
- `destroy` fonksiyonu: Sadece `moveend` ve `zoomend` serbest bırakılıyor.

**Cozum Onerisi:** Anonim fonksiyon yerine referanslı bir event handler atanmalı ve `destroy()` eyleminde haritadan koparılmalıdır:
```javascript
function _onResize() {
  _resizeCanvas();
  _renderAll();
}

function init(map) {
  // ...
  _map.on('resize', _onResize);
}

function destroy() {
  if (_map) {
    _map.off('moveend', _debouncedRender);
    _map.off('zoomend', _debouncedRender);
    _map.off('resize', _onResize); // Eksik olan satir
  }
}
```

### [AI-Review] Bulgu 2 (LOW): DOM Container'a Yasadisi Eklenen Layer Control
**Problem:** `_createLayerControl()` fonksiyonunda `_map.getContainer().appendChild(_layerControlEl);` çağrısı yapılmaktadır. Standart Leaflet eklenti geliştirmelerinde overlay kontrollerinin doğrudan map container'ına appendChild ile eklenmesi yerine `L.Control` yapısı kullanarak `_map.addControl()` şeklinde DOM'a aktarılması z-index çatışmalarını ve harita sürükleme (pointer event) bug'larını engeller.
**Yeri:** `fiber-chrome/content/heat-map.js` (`_createLayerControl` fonksiyonu başı)
**Cozum Onerisi:** Native DOM müdahalesi UI testlerinde sorun yaratmadıysa şu aşamada kabul edilebilir, ancak mimari borç olarak Leaflet L.Control standardına geçirilmesi tavsiye edilir.

### [AI-Review] Bulgu 3 (LOW): Layer Toggle Sırasında Olası Animasyon Kaybı
**Problem:** `_renderLayer` içerisinde opacity maping iterasyonu (256 renk, alpha ayarlama vs) 10 binlerce piksel için requestAnimationFrame içerisinde tek seferde senkron olarak çalışır. Çok büyük adalarda (Örn: 50.000 bina) slider ile opacity değiştirilirken bu blocking işlem ana thread'de frame gecikmesine (jank) sebep olabilir.
**Yeri:** `fiber-chrome/content/heat-map.js` (`_renderLayer` içerisindeki pixel array loop)
**Cozum Onerisi:** Şu anki veri setinde bir sorun görünmüyor, ancak ilerleyen fazlarda OffscreenCanvas ve Web Worker (Epic 7 kapsamında) bu iş için harika bir adaydır.

## Sonuc
Story 6.3'ün acceptance criteria metrikleri (AC1, AC2, AC3) harita görselleştirme, yoğunluk gösterimi, renk skalaları ve arıza/veri giriş UI entegrasyonu başarıyla sağlanmıştır. `_map.on('resize')` düzeltmesi kolay bir fix'tir. Mevcut durum: **Gözden geçirildi**, ilerlenebilir.
