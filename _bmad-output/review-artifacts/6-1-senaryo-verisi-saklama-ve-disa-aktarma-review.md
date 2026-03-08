# Code Review: 6-1 Senaryo Verisi Saklama ve Disa Aktarma

## Genel Degerlendirme
Story 6.1 (Senaryo Verisi Saklama), `MarketingDataHouse` modulu uzerinden basariyla implemente edilmis. IndexedDB `scenarios` store eklenmesi, Storage `normalizeState/denormalizeState` akisi ve JSON export/import (File API) fonksiyonlari standartlara uygun calisiyor. `getScenarioSummary` ve metadata yonetimi stabil gorunuyor.

## Bulgular

### [AI-Review] Bulgu 1 (MEDIUM): JSON Import Dosya Boyutu Kontrolu Eksikligi
**Problem:** `importScenario(jsonFile)` fonksiyonu, dosya boyutu kontrolu (MAX_FILE_SIZE) yapmadan tum dosyayi `FileReader.readAsText` ile bellege alip `JSON.parse` islemine tabi tutmaktadir. Bu durum eger kullanici yanlislikla cok buyuk (ornegin 50MB+) bir json dosyasi yuklerse tarayici sekmesini kilitletebilir (OOM).
**Yeri:** `fiber-chrome/lib/marketing-data-house.js` (Satir 372-435)
**Cozum Onerisi:** `importScenario` baslangicinda `if (jsonFile.size > 5 * 1024 * 1024) throw new Error('Dosya cok buyuk (>5MB)');` gibi bir koruma siniri eklenmelidir.

### [AI-Review] Bulgu 2 (LOW): Export Sirasinda OOM Riski (Senkron Deep Clone)
**Problem:** IndexedDB'ye `saveScenario` yapilirken kullanilan `JSON.parse(JSON.stringify(ada.topology))` islemi senkrondur ve 1000'den fazla ucu (kablo, bina, vb) olan buyuk adalarda ana thread'i saniyenin altinda olsa da bloke etme potansiyeli tasir.
**Yeri:** `fiber-chrome/lib/marketing-data-house.js` icinde `_buildSnapshot()` 
**Cozum Onerisi:** Su asamada tarayici performansi kabul edilebilir duzeydedir ancak ileride Web Worker kullanimi (UI donmamasi icin) dusunulebilir. Sadece teknik borc olarak not alinmistir.

### [AI-Review] Bulgu 3 (LOW): Validation Hatasinda Ozel Veri Uyarisi Mesaji
**Problem:** Import sirasinda schema validation (versiyon/tip) basarisiz olursa firlatilan hata detayli degil. Ozellikle `data.calculations` ya da baska bir nesne bozuk oldugunda spesifik olarak nerenin kirildigini soylemek yerine sadece 'Zorunlu alan eksik' donuyor.
**Yeri:** `fiber-chrome/lib/marketing-data-house.js` icindeki `_validateSchema()`
**Cozum Onerisi:** Error firlatirken schema eksiklik listesi zenginlestirilebilir.

## Sonuc
Story 6.1, Acceptance Criteria maddelerini (AC1, AC2, AC3, AC4) karsiliyor ve IndexedDB DB versiyon update mekanizmasi (v3->v4) sorunsuz tasarlanmis. Onerilen fix'ler uygulandiktan sonra gonderilebilir seviyede. Stok durum: `in-progress` (ufak guvenlik iyilestirmesi icin).
