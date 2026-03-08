# Story 9.1: Binalar Arasi Ada Tasima

Status: in-review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a saha muhendisi,
I want bir binayi sag tiklayarak baska bir adaya tasiyabilmek,
So that NVI'nin ayni ada icerisinde grupladigi farkli adalara ait binalari dogru adaya atayip, her ada icin bagimsiz ve dogru hesaplama yapabileyim.

## Motivasyon

NVI portali bazen farkli adalara ait binalari ayni bolge icerisinde gosterir. Ornegin Park Apt ve Erdal Apt farkli bir adanin binalari oldugu halde, mevcut ada ile birlikte taraniyor. Bu binalarin dogru adaya tasinmasi gerekiyor ki her ada icin splitter, loss budget ve maliyet hesaplamalari dogru ciksin.

## Acceptance Criteria

### AC1: Bina Context Menu — "Baska Adaya Tasi" Secenegi
**Given** bir bina kartina veya harita marker'ina sag tiklandiginda
**When** context menu goruntulendiginde
**Then** mevcut seceneklere ek olarak "Baska Adaya Tasi..." secenegi bulunmali
**And** bu secenek sadece projede birden fazla ada varken VEYA yeni ada olusturma secilebilirken aktif olmali

### AC2: Hedef Ada Secim Modali
**Given** kullanici "Baska Adaya Tasi..." secenegine tikladiginda
**When** hedef ada secim modali acildiginda
**Then** modal sunlari icermeli:
- Mevcut adalarin listesi (kaynak ada haric)
- Her ada icin: kod, isim, bina sayisi, BB bilgisi
- "Yeni Ada Olustur" secenegi (listenin altinda)
- Iptal ve Tasi butonlari
**And** modal Overlay.createModal() pattern'ini kullanmali (ESC ile kapanir, backdrop)
**And** hedef ada secilmeden "Tasi" butonu disabled olmali

### AC3: Bina Tasima Islemi
**Given** kullanici hedef adayi secip "Tasi" butonuna bastiginda
**When** tasima islemi gerceklestirildiginde
**Then** bina kaynak adadan cikarilmali:
- buildings[] dizisinden kaldirilmali
- OLT/anten referanslari temizlenmeli (bina OLT veya anten idiyse)
- FDH referanslari temizlenmeli (fdhNodes icindeki servedBuildingIds)
- manualEdges icindeki ilgili kenarlar kaldirilmali
- svgPositions icindeki ilgili kayit silinmeli
**And** bina hedef adaya eklenmeli (orijinal id, isim, BB, koordinatlar korunmali)
**And** kaynak ada yeniden hesaplanmali (PonEngine.recalculateAda)
**And** hedef ada yeniden hesaplanmali (PonEngine.recalculateAda)
**And** UI guncellenmeli (Overlay.render + Panels.refresh)
**And** otomatik kayit tetiklenmeli (Storage.autoSave)

### AC4: Undo/Redo Destegi
**Given** bir bina baska adaya tasindiginda
**When** kullanici Ctrl+Z ile geri alma yaptiginda
**Then** bina orijinal adaya geri donmeli, tum referanslar eski haline gelmeli
**And** her iki ada yeniden hesaplanmali
**And** Ctrl+Y ile yeniden tasima uygulanabilmeli

### AC5: Toplu Tasima (Bulk Move)
**Given** birden fazla bina checkbox ile secildiginde
**When** toplu islem menusunden "Secilileri Baska Adaya Tasi" secildiginde
**Then** tum secili binalar ayni hedef adaya toplu olarak tasinmali
**And** BatchCommand kullanilarak tek bir undo ile geri alinabilmeli
**And** islem sonunda kaynak ve hedef adalar yeniden hesaplanmali

### AC6: Yeni Ada Olusturarak Tasima
**Given** kullanici hedef ada olarak "Yeni Ada Olustur" sectiginde
**When** yeni ada icin isim girilip onaylandiginda
**Then** yeni bir ada olusturulmali (Topology.createAda)
**And** secili bina(lar) bu yeni adaya tasinmali
**And** yeni ada aktif ada olarak ayarlanmali

## Tasks / Subtasks

### Faz 1: Topology.moveBuilding() Fonksiyonu (AC: #3)
- [ ] Task 1: topology.js icinde moveBuilding(fromAda, toAda, buildingId) fonksiyonu
  - [ ] 1.1: Binayı kaynak adadan cikar — removeBuilding + ek temizlik
  - [ ] 1.2: OLT/anten/FDH referans temizligi (oltBuildingId, antenBuildingId, fdhNodes)
  - [ ] 1.3: manualEdges, svgPositions, ptpLinks temizligi
  - [ ] 1.4: Binayi hedef adaya ekle — koordinatlar ve orijinal veriler korunarak
  - [ ] 1.5: Her iki ada icin PonEngine.recalculateAda() cagrisi
  - [ ] 1.6: Topology.groupAdasByOLT() guncelleme

### Faz 2: MoveBuildingCmd (Undo/Redo) (AC: #4)
- [ ] Task 2: command-manager.js icinde MoveBuildingCmd
  - [ ] 2.1: MoveBuildingCmd(fromAdaId, toAdaId, buildingId) constructor
  - [ ] 2.2: do() — bina verilerini deep clone + moveBuilding cagrisi
  - [ ] 2.3: undo() — ters yone moveBuilding + OLT/anten referanslarini geri yukle
  - [ ] 2.4: description() — "Park Apt → Ada 2'ye tasindi" seklinde aciklama

### Faz 3: Context Menu Entegrasyonu (AC: #1)
- [ ] Task 3: panels.js showBuildingContextMenu() guncelleme
  - [ ] 3.1: "Baska Adaya Tasi..." menu ogesi ekle
  - [ ] 3.2: Sadece PROJECT.adas.length > 1 veya yeni ada olusturma imkani varken goster
  - [ ] 3.3: Tiklama handler'i — hedef ada secim modali ac

### Faz 4: Hedef Ada Secim Modali (AC: #2, #6)
- [ ] Task 4: Overlay.createModal() ile ada secim diyalogu
  - [ ] 4.1: Modal HTML/CSS — ada listesi, yeni ada olustur butonu
  - [ ] 4.2: Ada listesini doldur (kaynak ada haric, her ada icin bilgi)
  - [ ] 4.3: "Yeni Ada Olustur" secenegi — isim input + onay
  - [ ] 4.4: "Tasi" butonu — CommandManager.execute(MoveBuildingCmd) cagrisi
  - [ ] 4.5: Islem sonrasi toast bildirimi — "Park Apt → Ada 2'ye tasindi"

### Faz 5: Toplu Tasima (AC: #5)
- [ ] Task 5: Coklu bina tasima destegi
  - [ ] 5.1: Toplu islem menusune "Secilileri Baska Adaya Tasi" butonu ekle
  - [ ] 5.2: BatchCommand ile tum secili binalar icin MoveBuildingCmd dizisi
  - [ ] 5.3: Tek modal — secili bina sayisini goster, hedef ada sec

## Dev Notes

### Mevcut Kod Referanslari:
- `Topology.removeBuilding(ada, buildingId)` — lines 132-145, temel cikarma islemi
- `Topology.addBuilding(ada, buildingData)` — lines 107-127, yeni ID atiyor (bunu bypass etmek lazim)
- `showBuildingContextMenu(e, building, ada)` — panels.js lines 2086-2106
- `CommandManager` — command-manager.js, AddBuildingCmd/RemoveBuildingCmd pattern'leri
- `Overlay.createModal()` — overlay.js, mevcut modal altyapisi
- `Overlay.showToast()` — bildirim icin

### Kritik Dikkat Noktalari:
1. **Building ID korunmali** — addBuilding() yeni ID atiyor, moveBuilding icinde orijinal ID ile eklenmeli
2. **FDH temizligi** — `fdhNodes[].servedBuildingIds[]` icinden buildingId cikarilmali, bos FDH kalirsa fdhNodes'dan silinmeli
3. **OLT atamasi kaybolur** — bina OLT ise kaynak adanin OLT'si null olur, kullaniciya uyari goster
4. **manualEdges temizligi** — from veya to buildingId olan kenarlar silinmeli
5. **Penetration rate** — bina bazli penetration rate korunmali (building.penetrationRate)
6. **Koordinat** — bina lat/lng degismemeli, sadece ada aidiyeti degismeli

### Standart Islem Akisi:
```
Sag tik → Context menu → "Baska Adaya Tasi..."
  → Modal (ada sec / yeni olustur)
  → CommandManager.execute(MoveBuildingCmd)
    → Topology.moveBuilding(from, to, id)
    → PonEngine.recalculateAda(fromAda)
    → PonEngine.recalculateAda(toAda)
  → EventBus 'command:execute'
    → Panels.refresh()
    → Overlay.render()
    → Storage.autoSave()
```

### CSS/Stil Notlari:
- Modal tasarimi mevcut Overlay.createModal() pattern'ini kullanir
- Ada listesi kartlari fp-bldg-card benzeri stil
- Secili ada highlight: border-left color + background
- Toast bildirimi: Overlay.showToast() — yesil basari mesaji
