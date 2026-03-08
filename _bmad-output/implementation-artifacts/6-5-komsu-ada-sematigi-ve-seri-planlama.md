# Story 6.5: Komsu Ada Sematigi ve Seri Planlama

Status: done

## Story

As a saha muhendisi,
I want mevcut adanin komsularini gorsel olarak gorebilmek ve tiklayarak hizla gecis yapabilmek,
So that bolgedeki adalari sirayla verimli planlayabilir ve bolgesel gorusu kaybetmeyeyim.

## Acceptance Criteria

1. **AC1 — Komsu Ada Sematigi (FR49):**
   Given bir ada aktif olarak yuklendiginde
   When komsu ada sematigi gosterildiginde
   Then mevcut adanin etrafindaki komsu adalar sematik olarak gorsellestirilmeli
   And her komsu ada icin: ada kodu, bina sayisi ve durum badge'i gosterilmeli
   And mevcut ada merkeze, komsular etrafina konumlandirilmali

2. **AC2 — Komsu Adaya Gecis (FR50):**
   Given komsu ada sematigi gorunurken
   When kullanici bir komsu adaya tikladiginda
   Then tiklanan ada otomatik olarak yuklenmeli
   And mevcut adanin durumu kaydedilmeli
   And yeni adanin topolojisi ve hesaplari yuklenmeli
   And sematik yeni adanin komsularina gore guncellenmeli

3. **AC3 — Seri Planlama ve Gezinme Gecmisi:**
   Given kullanici seri planlama yaptiginda (ada -> komsu ada -> komsu ada)
   When birden fazla ada sirayla planlandiginda
   Then her adanin durumu otomatik saklanmali
   And gezinme gecmisi (breadcrumb) gosterilmeli: Ada A -> Ada B -> Ada C
   And gecmisteki herhangi bir adaya tek tikla donulebilmeli

4. **AC4 — Komsu Ada Bilgisi Bulunamama:**
   Given komsu ada bilgisi mevcut olmadiginda (ilk kullanimda)
   When sematik gosterilmek istendiginde
   Then NVI portalindan komsu ada bilgisi cekilebilmeli (sayfadaki mahalle/ada verilerinden)
   And cekilemeyen durumlarda "Komsu ada bilgisi mevcut degil" mesaji gosterilmeli

## Tasks / Subtasks

- [x] Task 1: Komsu ada tespit mekanizmasi (AC: #1, #4)
  - [x] 1.1 MarketingDataHouse.detectNeighbors(ada) — NVI DOM'undan ayni mahalle adalarini cek
  - [x] 1.2 NVI komsu ada parse: sayfadaki ada dropdown veya tablo verisi
  - [x] 1.3 Komsu ada cache: ada.topology.neighbors = [{ adaNo, adaCode, status }]
  - [x] 1.4 topology.js — createAda() icinde neighbors: [] baslatma
  - [x] 1.5 topology.js — loadState() backward compat guard

- [x] Task 2: Sematik gorsellestirme (AC: #1)
  - [x] 2.1 SVG/Canvas ile sematik cizim (merkez ada + cevredeki komsular)
  - [x] 2.2 Merkez ada: buyuk daire, ada kodu + bina sayisi
  - [x] 2.3 Komsu adalar: kucuk daireler, radyal dizilim
  - [x] 2.4 Durum badge'i: planlanmis(yesil) / planlanmamis(gri) / aktif(mavi)
  - [x] 2.5 Baglanti cizgileri: merkez → komsular (ince cizgi)
  - [x] 2.6 Hover efekti: komsu ada uzerinde bilgi tooltip

- [x] Task 3: Seri planlama ve gezinme (AC: #2, #3)
  - [x] 3.1 navigateToNeighbor(adaNo) — mevcut ada kaydet + komsu adaya gec
  - [x] 3.2 Topology.saveAda() + Topology.loadAda() akisi (Story 2.3 altyapisi)
  - [x] 3.3 Gezinme gecmisi dizisi: _navigationHistory = [{ adaId, adaCode }]
  - [x] 3.4 Breadcrumb UI: panel ust kisminda yatay nav bar
  - [x] 3.5 Breadcrumb tiklandiginda: o adaya geri don
  - [x] 3.6 Maks 10 gecmis kaydi (eski olan duser)

- [x] Task 4: Panels.js UI entegrasyonu (AC: #1, #2, #3, #4)
  - [x] 4.1 Side panel icinde "Komsu Adalar" alt bolumu (veya harita uzerinde mini-widget)
  - [x] 4.2 Sematik SVG container
  - [x] 4.3 Breadcrumb bar (panel ust kisminda)
  - [x] 4.4 "Komsulari Tara" butonu (NVI'dan komsu bilgi cekme)
  - [x] 4.5 "Komsu ada bilgisi mevcut degil" fallback mesaji

- [x] Task 5: Testler
  - [x] 5.1 detectNeighbors testleri (mock NVI DOM)
  - [x] 5.2 navigateToNeighbor testleri (save + load akisi)
  - [x] 5.3 Gezinme gecmisi testleri (ekleme, geri donme, maks limit)

### Review Follow-ups (AI)

- [x] [AI-Review] CRITICAL: navigateToNeighbor — yeni ada olusturulurken NVI'dan taranan bina verilerini cache'den aktarma
- [x] [AI-Review] MEDIUM: navigateToNeighbor ve navigateToHistory — Storage.autoSave() Promise hata yakalama

## Dev Notes

### Bagimliliklar

- **Story 6.1 ZORUNLU** — MarketingDataHouse modulu 6.1'de olusturuluyor
- Topology.saveAda() / loadAda() — Story 2.3'te implement edilmis coklu ada yonetimi
- NviScraper — NVI DOM'undan komsu ada verisi cekmek icin
- Storage — ada gecisi sirasinda otomatik kaydetme

### Komsu Ada Tespit Yaklasimi

NVI portalinda ada degistirme mekanizmasi:
```
1. Sayfadaki mahalle/ada dropdown'larindan ayni mahalleki diger adalari listele
2. Veya: mevcut adanin NVI sayfasindaki "Ayni Mahalle Adalari" tablosundan parse et
3. Sonuc: [{ adaNo: '123', parsel: null, buildingCount: null }]
4. Kaydet: ada.topology.neighbors dizisine cache
```

**Not:** Komsu ada "fiziksel yakinlik" degil "ayni mahalle" anlaminda. Gercek komsuluk icin koordinat bazli hesaplama gerekir (gelecekte eklenebilir).

### Sematik Gorsellestirme

```
       [DA-045]
        (12 bina)
          |
[DA-089]--[AKTIF ADA]--[DA-012]
 (8 bina)  (DA-067)    (15 bina)
  (gri)    (24 bina)    (yesil)
          (mavi)
          |
       [DA-103]
        (6 bina)
```

SVG ile implementasyon:
```javascript
function renderNeighborSchematic(currentAda, neighbors) {
  var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 300 300');
  svg.setAttribute('class', 'fp-neighbor-schematic');

  // Merkez ada (150, 150) pozisyonunda buyuk daire
  var centerCircle = createCircle(150, 150, 40, '#3B82F6');
  var centerText = createText(150, 150, currentAda.code);

  // Komsular radyal dizilim (360 / n derece araliklarla)
  var angleStep = (2 * Math.PI) / neighbors.length;
  var radius = 100; // Merkeze uzaklik

  neighbors.forEach(function(n, i) {
    var x = 150 + radius * Math.cos(angleStep * i - Math.PI/2);
    var y = 150 + radius * Math.sin(angleStep * i - Math.PI/2);
    var color = n.status === 'planned' ? '#22C55E' : '#9CA3AF';
    // Daire + metin + baglanti cizgisi
  });
}
```

### Durum Badge Renkleri

| Durum | Hex | Anlam |
|-------|-----|-------|
| Aktif | #3B82F6 (mavi) | Su an yuklu olan ada |
| Planlandi | #22C55E (yesil) | Daha once topoloji olusturulmus |
| Planlanmadi | #9CA3AF (gri) | Henuz islem yapilmamis |
| Senaryo Var | #8B5CF6 (mor) | Kayitli senaryo mevcut (Story 6.1) |

### Gezinme Gecmisi (Breadcrumb)

```html
<div id="fp-nav-breadcrumb" class="fp-breadcrumb">
  <span class="fp-breadcrumb-item" data-ada-id="1">DA-045</span>
  <span class="fp-breadcrumb-sep">→</span>
  <span class="fp-breadcrumb-item" data-ada-id="3">DA-067</span>
  <span class="fp-breadcrumb-sep">→</span>
  <span class="fp-breadcrumb-item fp-breadcrumb-active">DA-012</span>
</div>
```

**Davranis:**
- Breadcrumb item'a tiklandiginda: o adaya geri don
- Geri donuste: aradaki adalar gecmisten silinmez (tam gecmis korunur)
- Maks 10 kayit — en eski duser (FIFO)
- Pozisyon: side panel ust kisminda, ada selector'un hemen altinda

### Ada Gecis Akisi

```
Kullanici komsu adaya tiklar:
  1. Topology.saveCurrentAda()  // Mevcut adayi kaydet
  2. Storage.save()             // IndexedDB'ye yaz
  3. _navigationHistory.push({ adaId, adaCode })
  4. Topology.switchAda(targetAdaNo) veya yeni ada olustur
  5. PonEngine.recalculateAda() // Yeni ada icin hesapla
  6. Overlay.render()           // Haritayi guncelle
  7. Panels.refresh()           // Panelleri guncelle
  8. renderNeighborSchematic()  // Yeni komsulari goster
  9. updateBreadcrumb()         // Breadcrumb guncelle
```

### Mimari Kisitlamalar

- MarketingDataHouse modulune detectNeighbors(), navigateToNeighbor() ekle
- SVG: document.createElementNS kullan (createElement degil!)
- NVI DOM erisimi: NviScraper uzerinden — dogrudan DOM manipulasyonu YASAK
- Ada gecisi: mevcut Topology coklu ada yonetimi altyapisini kullan (Story 2.3)
- Type guard: `if (typeof NviScraper !== 'undefined' && NviScraper.getNeighborAdas)`
- Error boundary: NVI'dan komsu veri cekilemezse graceful fallback ("Bilgi mevcut degil")

### NVI DOM Parse Notlari

NVI portalinde komsu ada bilgisi icin potansiyel kaynaklar:
1. **Ada secim dropdown:** `<select>` elementi icerisindeki `<option>` listesi
2. **Mahalle tablosu:** Sayfadaki ada listesi tablosu
3. **URL pattern:** `adres.nvi.gov.tr/...?il=XX&ilce=YY&mahalle=ZZ&ada=NN`

**DIKKAT:** NVI DOM yapisi degisebilir. Scraper izolasyonu zorunlu — DOM parse hatasi uzantinin geri kalanini etkilememeli.

### Project Structure Notes

- Degisecek dosyalar: marketing-data-house.js, topology.js (neighbors), panels.js (sematik + breadcrumb), scraper.js (komsu ada parse)
- Yeni dosya yok — mevcut modullere fonksiyon ekleme
- Test dosyasi: test/test-marketing-data-house.html'e yeni suite ekleme

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 6, Story 6.5]
- [Source: _bmad-output/planning-artifacts/architecture.md — Proje yapisi, content/scraper.js]
- [Source: _bmad-output/planning-artifacts/epics.md — Story 2.3 coklu ada yonetimi altyapisi]
- [Source: _bmad-output/implementation-artifacts/6-1-senaryo-verisi-saklama-ve-disa-aktarma.md — MarketingDataHouse modul yapisi]
- [Source: fiber-chrome/lib/topology.js — saveAda/loadAda, coklu ada yonetimi]
- [Source: fiber-chrome/content/scraper.js — NVI DOM parse kaliplari]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- Node.js smoke test: 12/12 PASSED — detectNeighbors, navigateToNeighbor, navigateToHistory, clearNavigationHistory, max limit, null/edge cases
- Syntax check: node -c tum JS dosyalari PASS
- Browser test suite: test-marketing-data-house.html'e yeni test gruplari eklendi

### Completion Notes List

- Komsu ada tespiti 3 strateji ile calisiyor: NVI DOM dropdown, NVI tablo verisi, Topology mevcut adalar
- SVG sematik: radyal dizilim (merkez ada + komsular), durum renkli badge'lar, hover efekti, tiklanabilir
- Breadcrumb: gezinme gecmisi FIFO (maks 10), panel ust kisminda, tiklanarak geri donus
- Seri planlama: navigateToNeighbor ile otomatik kaydet + gec + recalculate + render
- Error boundary: NVI DOM parse hatalari try/catch ile yakalaniyor, graceful fallback mesaji
- [AI-Review] CRITICAL — _scrapedBuildingCache eklendi: _parseNviTableAdas taranan bina verilerini cache'ler, navigateToNeighbor yeni ada olustururken cache'den Topology.addBuilding ile aktarir. Cache kullanildiktan sonra temizlenir.
- [AI-Review] MEDIUM — navigateToNeighbor ve navigateToHistory: Storage.autoSave() Promise'ine .catch() eklendi, async hata yutulmasi onlendi.

### Change Log

1. `lib/topology.js` — createAda() icine `neighbors: []` eklendi, loadState() backward compat guard eklendi
2. `lib/marketing-data-house.js` — detectNeighbors(), navigateToNeighbor(), navigateToHistory(), getNavigationHistory(), clearNavigationHistory() fonksiyonlari ve yardimci _parseNviAdaDropdown(), _parseNviTableAdas(), _parseTopologyAdas(), _getAdaStatus(), _addToHistory() fonksiyonlari eklendi
3. `content/panels.js` — renderNeighborPanel(), _renderNeighborSchematic(), renderBreadcrumb(), handleNeighborScan() fonksiyonlari eklendi; injectSidePanel() icine neighbor panel HTML ve breadcrumb container eklendi; refresh() icine renderNeighborPanel() ve renderBreadcrumb() cagrilari eklendi
4. `styles/overlay.css` — Komsu ada paneli (.fp-neighbor-*) ve breadcrumb (.fp-breadcrumb-*) CSS stilleri eklendi
5. `dashboard/test-marketing-data-house.html` — detectNeighbors, navigateToNeighbor ve gezinme gecmisi test gruplari eklendi
6. 2026-03-07: Review follow-up — navigateToNeighbor: _scrapedBuildingCache ile bina veri aktarimi, autoSave Promise .catch() hata yakalama. Test dosyasina bina cache aktarimi test grubu eklendi.

### File List

- `fiber-chrome/lib/topology.js` — MODIFIED (neighbors alanı + backward compat)
- `fiber-chrome/lib/marketing-data-house.js` — MODIFIED (komsu ada + navigasyon fonksiyonlari)
- `fiber-chrome/content/panels.js` — MODIFIED (komsu panel + sematik + breadcrumb UI)
- `fiber-chrome/styles/overlay.css` — MODIFIED (komsu + breadcrumb CSS)
- `fiber-chrome/dashboard/test-marketing-data-house.html` — MODIFIED (yeni test gruplari)
