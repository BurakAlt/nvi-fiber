# Story 1.4: Geri Al / Ileri Al (Undo/Redo) Sistemi

Status: done

## Story

As a saha muhendisi,
I want yaptigim islemleri geri alabilmek ve ileri alabilmek,
so that hatali islemlerden kolayca donebilir ve farkli secimleri deneyebilirim.

## Acceptance Criteria (BDD)

1. **Given** kullanici bir islem yaptiginda (bina ekleme, OLT degistirme, fiyat guncelleme, penetrasyon degisikligi vb.) **When** islem gerceklestirildiginde **Then** islem Command Pattern ile {do, undo} cifti olarak CommandManager'a kaydedilmeli **And** EventBus uzerinden `command:execute` olayi yayinlanmali.

2. **Given** islem gecmisinde en az bir islem varken **When** kullanici geri al (undo) islemini tetiklediginde **Then** son islem geri alinmali ve onceki duruma donulmeli **And** EventBus uzerinden `command:undo` olayi yayinlanmali **And** geri alinan islem redo yiginina eklenmeli.

3. **Given** redo yigininda en az bir islem varken **When** kullanici ileri al (redo) islemini tetiklediginde **Then** geri alinan islem yeniden uygulanmali **And** EventBus uzerinden `command:redo` olayi yayinlanmali.

4. **Given** toplu bir islem yapildiginda (orn: birden fazla binayi silme) **When** kullanici geri al istediginde **Then** toplu islemin tamami tek adimda geri alinmali (NFR33).

5. **Given** kullanici oturum boyunca islemler yaptiginda **When** islem gecmisi kontrol edildiginde **Then** tum islemler oturum boyunca korunmali (NFR32).

## Tasks / Subtasks

- [x] Task 1: CommandManager modulu olusturma (AC: #1, #2, #3, #5)
  - [x] 1.1 `lib/command-manager.js` dosyasi olustur — IIFE pattern, `const CommandManager = (() => { ... })()`
  - [x] 1.2 Undo stack (array) ve redo stack (array) ozel durum degiskenleri
  - [x] 1.3 `execute(command)` — command.do() calistir, undo stack'e ekle, redo stack'i temizle, EventBus emit `command:execute`
  - [x] 1.4 `undo()` — undo stack'ten son komutu al, command.undo() calistir, redo stack'e ekle, EventBus emit `command:undo`
  - [x] 1.5 `redo()` — redo stack'ten son komutu al, command.do() calistir, undo stack'e ekle, EventBus emit `command:redo`
  - [x] 1.6 `canUndo()` / `canRedo()` — boolean durum sorgulama
  - [x] 1.7 `getHistory()` — undo stack'in okunabilir ozeti (label listesi)
  - [x] 1.8 `clear()` — her iki stack'i temizle (proje degistiginde / yeni proje yuklendiginde)
  - [x] 1.9 Opsiyonel: `MAX_HISTORY` limiti (orn: 100 islem) — undo stack asarsa en eskiyi sil

- [x] Task 2: Command nesnesi arayuzu ve yerlesik komutlar (AC: #1, #2, #3)
  - [x] 2.1 Command arayuzu tanimla: `{ label: string, do: function, undo: function }`
  - [x] 2.2 `AddBuildingCmd(ada, buildingData)` — do: Topology.addBuilding + recalc, undo: Topology.removeBuilding + recalc
  - [x] 2.3 `RemoveBuildingCmd(ada, buildingId)` — do: remove + recalc, undo: addBuilding (kaydedilmis veriyle) + recalc
  - [x] 2.4 `SetOLTCmd(ada, newBuildingId)` — do: setOLT(yeni), undo: setOLT(eski)
  - [x] 2.5 `SetPenetrationCmd(adaId, rate)` — do: setAdaPenetrationRate(yeni), undo: setAdaPenetrationRate(eski)
  - [x] 2.6 `DeleteAdaCmd(adaId)` — do: deleteAda, undo: PROJECT.adas.push(kaydedilmis ada) + restore
  - [x] 2.7 `RenameAdaCmd(adaId, newName)` — do: renameAda(yeni), undo: renameAda(eski)
  - [x] 2.8 `AddManualEdgeCmd(ada, fromId, toId)` — do: addManualEdge, undo: removeManualEdge

- [x] Task 3: Toplu islem destegi (AC: #4)
  - [x] 3.1 `BatchCommand(label, commands[])` — do: tum komutlari sirayla calistir, undo: tum komutlari ters sirayla geri al
  - [x] 3.2 Toplu bina silme icin BatchCommand kullanimi (panels.js "Secilenleri Sil" butonu)
  - [x] 3.3 BatchCommand tek undo adimi olarak stack'e eklenir

- [x] Task 4: Klavye kisayolu ve UI entegrasyonu (AC: #2, #3)
  - [x] 4.1 `document.addEventListener('keydown')` ile Ctrl+Z (undo) ve Ctrl+Y / Ctrl+Shift+Z (redo) yakalama
  - [x] 4.2 Klavye dinleyicisi main.js'te init sirasinda kaydet (NVI portal sayfasinda aktif)
  - [x] 4.3 Undo/redo sonrasi: PonEngine.recalculateAda + Panels.refresh + Overlay.render + Storage.autoSave zincirleme

- [x] Task 5: manifest.json guncelleme (AC: #1)
  - [x] 5.1 `lib/command-manager.js` dosyasini `lib/storage.js` SONRASINA ekle
  - [x] 5.2 Pozisyon: storage.js → command-manager.js → map-utils.js siralamasinda

- [x] Task 6: Entegrasyon testleri
  - [x] 6.1 `dashboard/test-command-manager.html` olustur
  - [x] 6.2 execute/undo/redo round-trip testi (AddBuildingCmd)
  - [x] 6.3 Redo stack temizleme testi (execute sonrasi redo stack bos)
  - [x] 6.4 canUndo/canRedo durum testi
  - [x] 6.5 BatchCommand testi (toplu islem tek adimda geri alinir)
  - [x] 6.6 History limiti testi (MAX_HISTORY asiminda en eski silme)
  - [x] 6.7 EventBus event dogrulama testi (command:execute, command:undo, command:redo)
  - [x] 6.8 Clear testi (stackler sifirlanir)

## Dev Notes

### KRITIK: Bu Story'nin Pozisyonu

Story 1.1 (EventBus), 1.2 (IndexedDB), 1.3 (NviCache) tamamlandi. CommandManager bu uc modulun uzerine insa edilir:
- **EventBus** (lib/event-bus.js) — CommandManager event'leri buradan emit eder
- **Topology** (lib/topology.js) — Komutlar Topology API'sini cagirir (addBuilding, removeBuilding, setOLT vb.)
- **PonEngine** (lib/pon-engine.js) — Her komut sonrasi recalculate cagirilir

CommandManager **Topology API'sini sarmalar** — dogrudan Topology fonksiyonlari yerine CommandManager.execute() uzerinden islem yapilir. Ancak **mevcut Topology fonksiyonlari DEGISTIRILMEZ** — CommandManager sadece onlari cagiran komut nesneleri tanimlar.

### Mevcut Kodda Korunmasi Gerekenler

1. **`Topology` modulu** (`lib/topology.js`, ~928 satir):
   - `addBuilding(ada, buildingData)` — return building objesi (id, name, bb, lat, lng...) → KORU
   - `removeBuilding(ada, buildingId)` — ada.buildings filter + OLT/FDH temizligi → KORU
   - `setOLT(ada, buildingId)` — OLT + anten ata, recalculate cagir → KORU
   - `setAntenna(ada, buildingId)` → KORU
   - `deleteAda(adaId)` — ada sil, aktif ada degistir, OLT yeniden grupla → KORU
   - `renameAda(adaId, newName)` → KORU
   - `clearAda(adaId)` → KORU
   - `setAdaPenetrationRate(adaId, rate)` → KORU
   - `setBuildingPenetrationRate(adaId, buildingId, rate)` → KORU
   - `addManualEdge(ada, fromId, toId)` → KORU
   - `removeManualEdge(adaId, fromId, toId)` → KORU
   - `getState()` / `loadState(saved)` — serialization → KORU
   - **DOKUNMA** — Topology API'si aynen kalir, CommandManager sadece uzerinde komut katmani

2. **`PonEngine` modulu** (`lib/pon-engine.js`):
   - `recalculateAda(ada)` — komut sonrasi tetiklenir → KORU, DOKUNMA

3. **`Panels` modulu** (`content/panels.js`):
   - `refresh()` — komut sonrasi UI guncelleme → KORU
   - Mevcut bina ekleme/silme butonlari `Topology.addBuilding()` / `Topology.removeBuilding()` cagirir
   - **Bu cagrilar SIMDILIK degistirilMEYECEK** — CommandManager sadece altyapiyi kurar
   - Panels entegrasyonu (butonlarin CommandManager.execute ile calismasi) sonraki story'de yapilir

4. **`EventBus` modulu** (`lib/event-bus.js`, 91 satir):
   - `on(event, callback)`, `off(event, callback)`, `emit(event, data)` → KORU, DOKUNMA

5. **`main.js`** (`content/main.js`):
   - Klavye dinleyicisi BURAYA eklenir (init blogu icinde)
   - `onTableDetected()` icindeki Topology.addBuilding cagrilari SIMDILIK degistirilMEZ
   - Mevcut `fiberplan-change` DOM olayi ve autoSave mekanizmasi KORUNUR

### Onceki Story (1.3) Intelligence

Story 1.3'te ogrenilenler:
- **_send() pattern** devam ediyor — background.js uzerinden IndexedDB iletisimi
- **IIFE module pattern** tum yeni moduller icin ZORUNLU — `const ModuleName = (() => { ... })()`
- **EventBus entegrasyonu** calisyor — `EventBus.emit('namespace:action', data)` pattern'i
- **Test dosyasi yapisi**: `dashboard/test-*.html` + mock veri + section bazli testler + assert helper + showSummary
- **Code review bulgulari**: DOM element serializasyon hatasi (rows/rowElement), hash separator collision, composite key kullanimi — **serializasyon konusunda dikkatli ol**
- **Non-blocking pattern**: Cache islemleri fire-and-forget Promise chain ile yapildi — CommandManager'da ise **senkron execute** daha uygun (do/undo aninda gerceklesmeli)

### KRITIK TASARIM KARARI: Komut Nesnesi Yapisi

Her komut objesi su arayuze uymali:

```javascript
// Command interface:
{
  label: 'Bina Eklendi: Test Bina A',  // Insan-okunabilir aciklama (getHistory icin)
  do: function() { ... },               // Islemi gerceklestir
  undo: function() { ... }              // Islemi geri al
}
```

**KRITIK: Closure ile durum yakalama.** Her komut olusturuldugunda, geri alma icin gereken veriyi closure icerisinde saklamali. Ornek:

```javascript
function AddBuildingCmd(ada, buildingData) {
  var addedBuilding = null;  // do() sonrasi yakalanacak
  return {
    label: 'Bina Eklendi: ' + (buildingData.name || 'Yeni Bina'),
    do: function() {
      addedBuilding = Topology.addBuilding(ada, buildingData);
      PonEngine.recalculateAda(ada);
    },
    undo: function() {
      if (addedBuilding) {
        Topology.removeBuilding(ada, addedBuilding.id);
        PonEngine.recalculateAda(ada);
      }
    }
  };
}
```

**DIKKAT: RemoveBuildingCmd icin bina verisini ONCEDEN kaydetmelisin** — cunku `removeBuilding()` sonrasi bina objesi kaybolur:

```javascript
function RemoveBuildingCmd(ada, buildingId) {
  // Geri alma icin mevcut bina verisini ONCEDEN kaydet
  var savedBuilding = null;
  var bldg = ada.buildings.find(function(b) { return b.id === buildingId; });
  if (bldg) {
    savedBuilding = JSON.parse(JSON.stringify(bldg)); // Deep copy
  }
  return {
    label: 'Bina Silindi: ' + (savedBuilding ? savedBuilding.name : buildingId),
    do: function() {
      Topology.removeBuilding(ada, buildingId);
      PonEngine.recalculateAda(ada);
    },
    undo: function() {
      if (savedBuilding) {
        Topology.addBuilding(ada, savedBuilding);
        PonEngine.recalculateAda(ada);
      }
    }
  };
}
```

### KRITIK: Redo Stack Temizleme Kurali

Yeni bir komut execute edildiginde **redo stack TAMAMEN temizlenir**. Bu standart undo/redo davranisidir:

```
execute(A) → undo: [A], redo: []
execute(B) → undo: [A, B], redo: []
undo()     → undo: [A], redo: [B]
undo()     → undo: [], redo: [B, A]
execute(C) → undo: [C], redo: []  ← B ve A kaybolur!
```

### KRITIK: Komut Sonrasi Zincir

Her undo/redo isleminden sonra su sira takip edilmeli (mevcut recalc akisiyla ayni):

```
CommandManager.undo() / redo()
  → command.undo() / command.do()  (Topology mutasyonu + PonEngine.recalculateAda)
  → Panels.refresh()
  → Overlay.render()
  → Storage.autoSave()
  → EventBus.emit('command:undo' / 'command:redo')
```

Bu zincirlemeyi CommandManager'in execute/undo/redo fonksiyonlari icinde **yapma**. Bunun yerine:
- Komut nesneleri sadece Topology mutasyonu + recalculate yapar
- CommandManager sadece do/undo cagirir + EventBus emit eder
- Dinleyiciler (main.js veya panels.js) `command:execute` / `command:undo` / `command:redo` event'lerini dinleyerek Panels.refresh + Overlay.render + Storage.autoSave cagirir

Bu sayede CommandManager Panels/Overlay/Storage'a bagimli olmaz.

### Project Structure Notes

```
fiber-chrome/
  lib/
    event-bus.js     DOKUNULMAYACAK (EventBus.emit kullanilacak)
    pon-engine.js    DOKUNULMAYACAK (PonEngine.recalculateAda kullanilacak)
    topology.js      DOKUNULMAYACAK (Topology API komutlar tarafindan cagirilir)
    storage.js       DOKUNULMAYACAK (Storage.autoSave event listener ile tetiklenir)
    command-manager.js  ★ YENI — bu story'de olusturulacak
    ...
  content/
    main.js          ★ GUNCELLENECEK — klavye kisayolu + event listener eklenecek
    panels.js        DOKUNULMAYACAK (buton entegrasyonu SONRAKI story'de)
    overlay.js       DOKUNULMAYACAK
    ...
  manifest.json      ★ GUNCELLENECEK — command-manager.js ekleme
  dashboard/
    test-command-manager.html ★ YENI — entegrasyon test dosyasi
```

## Architecture Compliance

### IIFE Module Pattern (ZORUNLU)

```javascript
/**
 * CommandManager - Undo/redo command pattern implementation
 * Manages command execution history with undo/redo stacks.
 * Integrates with EventBus for command lifecycle events.
 */
const CommandManager = (() => {
  'use strict';

  // ─── CONSTANTS ─────────────────────────────────────────
  var MAX_HISTORY = 100;

  // ─── PRIVATE STATE ─────────────────────────────────────
  var _undoStack = [];
  var _redoStack = [];

  // ─── COMMAND EXECUTION ─────────────────────────────────

  function execute(command) {
    if (!command || typeof command.do !== 'function') return;
    command.do();
    _undoStack.push(command);
    _redoStack = []; // Yeni komut → redo stack temizle
    if (_undoStack.length > MAX_HISTORY) {
      _undoStack.shift(); // En eskiyi sil
    }
    if (typeof EventBus !== 'undefined') {
      EventBus.emit('command:execute', { label: command.label });
    }
  }

  function undo() { /* ... */ }
  function redo() { /* ... */ }
  function canUndo() { return _undoStack.length > 0; }
  function canRedo() { return _redoStack.length > 0; }
  function getHistory() { /* ... */ }
  function clear() { _undoStack = []; _redoStack = []; }

  // ─── BUILT-IN COMMAND FACTORIES ────────────────────────
  // AddBuildingCmd, RemoveBuildingCmd, SetOLTCmd, ...

  return {
    execute: execute,
    undo: undo,
    redo: redo,
    canUndo: canUndo,
    canRedo: canRedo,
    getHistory: getHistory,
    clear: clear,
    // Command factories
    AddBuildingCmd: AddBuildingCmd,
    RemoveBuildingCmd: RemoveBuildingCmd,
    SetOLTCmd: SetOLTCmd,
    SetPenetrationCmd: SetPenetrationCmd,
    DeleteAdaCmd: DeleteAdaCmd,
    RenameAdaCmd: RenameAdaCmd,
    AddManualEdgeCmd: AddManualEdgeCmd,
    BatchCommand: BatchCommand
  };
})();
```

### Manifest.json Guncel Yukleme Sirasi

```json
"js": [
  "lib/leaflet.js",
  "lib/debug.js",
  "lib/ws-bridge.js",
  "lib/event-bus.js",
  "lib/pon-engine.js",
  "lib/topology.js",
  "lib/storage.js",
  "lib/command-manager.js",        // ★ YENI — storage sonrasi, map-utils oncesi
  "lib/map-utils.js",
  "lib/draw-polygon.js",
  "lib/review-engine.js",
  "content/scraper.js",
  "content/nvi-cache.js",
  "content/overlay.js",
  "content/panels.js",
  "content/main.js"
]
```

**DIKKAT:** Sadece `lib/command-manager.js` satirini ekle. `storage.js` SONRASINDA olmali cunku CommandManager Topology'ye bagimli (Topology storage'dan sonra yukleniyor). EventBus'tan sonra olmali cunku EventBus.emit kullanilacak.

### EventBus Event'leri

```javascript
// CommandManager event'leri:
EventBus.emit('command:execute', { label: 'Bina Eklendi: Test Bina A' });
EventBus.emit('command:undo', { label: 'Bina Eklendi: Test Bina A' });
EventBus.emit('command:redo', { label: 'Bina Eklendi: Test Bina A' });
```

### Klavye Kisayollari (main.js'e eklenecek)

```javascript
// main.js init blogu icinde:
document.addEventListener('keydown', function(e) {
  // Ctrl+Z → Undo
  if (e.ctrlKey && !e.shiftKey && e.key === 'z') {
    e.preventDefault();
    if (typeof CommandManager !== 'undefined' && CommandManager.canUndo()) {
      CommandManager.undo();
    }
  }
  // Ctrl+Y veya Ctrl+Shift+Z → Redo
  if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
    e.preventDefault();
    if (typeof CommandManager !== 'undefined' && CommandManager.canRedo()) {
      CommandManager.redo();
    }
  }
});

// Event listener: command sonrasi UI guncelle
if (typeof EventBus !== 'undefined') {
  EventBus.on('command:execute', function() { Panels.refresh(); Overlay.render(); Storage.autoSave(); });
  EventBus.on('command:undo', function() { Panels.refresh(); Overlay.render(); Storage.autoSave(); });
  EventBus.on('command:redo', function() { Panels.refresh(); Overlay.render(); Storage.autoSave(); });
}
```

**DIKKAT:** `input`, `textarea` veya `contenteditable` elemente focus varken Ctrl+Z'yi ENGELLEME — tarayicinin kendi undo'su calissin. Sadece bu elementler disindayken CommandManager'i tetikle:

```javascript
if (e.ctrlKey && !e.shiftKey && e.key === 'z') {
  var tag = document.activeElement && document.activeElement.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement.isContentEditable) return;
  e.preventDefault();
  // ...
}
```

### Naming Conventions (ZORUNLU)

| Kural | Ornek |
|-------|-------|
| Module ismi: PascalCase | `CommandManager` |
| Private degisken: `_` prefix | `_undoStack`, `_redoStack` |
| Public fonksiyon: camelCase | `execute()`, `canUndo()`, `getHistory()` |
| Command factory: PascalCase + Cmd suffix | `AddBuildingCmd`, `SetOLTCmd` |
| Event format: `namespace:action` | `command:execute`, `command:undo` |
| Label: insan-okunabilir Turkce | `'Bina Eklendi: Test Bina A'` |

### Anti-Pattern Uyarilari

1. **Topology/Panels/Overlay'i DEGISTIRME** — CommandManager sadece kendi modulu, baska dosyalara DOKUNMA (main.js haric)
2. **Sinif (class) KULLANMA** — IIFE pattern ZORUNLU
3. **async/await KULLANMA** — Senkron do/undo pattern kullan (Topology API senkron)
4. **Komut icinde Panels.refresh/Overlay.render CAGIRMA** — Event listener uzerinden tetiklenir
5. **Deep state snapshot SAKLAMA** — Sadece geri alma icin gereken minimal veriyi kaydet (building objesi, eski OLT id vb.)
6. **Mevcut Topology cagrilarini degistirme** — Bu story sadece CommandManager altyapisini kurar; mevcut butonlarin CommandManager.execute ile calismasi SONRAKI story'de yapilir

### Performance Gereksinimleri

- execute(): < 1ms (command.do delegasyonu + stack push)
- undo()/redo(): < 1ms (command.undo/do delegasyonu + stack transfer)
- Bellek: MAX_HISTORY=100 komut, her komut ~1KB closure → ~100KB toplam
- Topology mutasyonlari + PonEngine.recalculateAda zaten < 100ms (NFR1)

### Test Stratejisi

Test dosyasi: `fiber-chrome/dashboard/test-command-manager.html` (mevcut test-nvi-cache.html yapisini ornek al)

Mock'lar gerektirmez — CommandManager dogrudan Topology API'sini kullanir. Test sayfasi lib/topology.js ve lib/pon-engine.js yukler.

```javascript
// Test 1: execute + undo round-trip
var ada = Topology.createAda('Test Ada');
var cmd = CommandManager.AddBuildingCmd(ada, { name: 'Test Bina', bb: 10 });
CommandManager.execute(cmd);
assert(ada.buildings.length === 1, 'Execute: bina eklendi');
assert(CommandManager.canUndo() === true, 'canUndo: true');
CommandManager.undo();
assert(ada.buildings.length === 0, 'Undo: bina geri alindi');
assert(CommandManager.canRedo() === true, 'canRedo: true');
CommandManager.redo();
assert(ada.buildings.length === 1, 'Redo: bina geri eklendi');

// Test 2: Execute sonrasi redo stack temizleme
CommandManager.undo();
CommandManager.execute(anotherCmd);
assert(CommandManager.canRedo() === false, 'Yeni execute → redo stack temiz');

// Test 3: BatchCommand
var batch = CommandManager.BatchCommand('Toplu Silme', [
  CommandManager.RemoveBuildingCmd(ada, bldg1.id),
  CommandManager.RemoveBuildingCmd(ada, bldg2.id)
]);
CommandManager.execute(batch);
assert(ada.buildings.length === 0, 'Batch: tum binalar silindi');
CommandManager.undo();
assert(ada.buildings.length === 2, 'Batch undo: tum binalar geri geldi');
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 1, Story 1.4]
- [Source: _bmad-output/planning-artifacts/architecture.md — CommandManager karar, veri akisi, yukleme sirasi]
- [Source: fiber-chrome/lib/topology.js — Topology public API (addBuilding, removeBuilding, setOLT, deleteAda, ...)]
- [Source: fiber-chrome/lib/event-bus.js — EventBus on/off/emit API]
- [Source: fiber-chrome/content/main.js — init blogu, klavye dinleyici eklenecek konum]
- [Source: fiber-chrome/manifest.json — content_scripts yukleme sirasi]
- [Source: CLAUDE.md — Mimari genel bakis, modul sistemi, veri akisi]
- [Source: _bmad-output/implementation-artifacts/1-3-nvi-veri-cache-ve-delta-guncelleme.md — Onceki story intelligence]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

N/A — no runtime debug issues encountered during implementation.

### Completion Notes List

- **Task 1**: Created `lib/command-manager.js` (~270 lines) — IIFE module with core API: execute(), undo(), redo(), canUndo(), canRedo(), getHistory(), clear(). MAX_HISTORY=100 limit with oldest-removal. Error boundary with try/catch on do/undo/redo. Returns boolean from undo/redo for success indication.
- **Task 2**: 7 built-in command factories — AddBuildingCmd (closure-captured addedBuilding), RemoveBuildingCmd (JSON deep copy for restore), SetOLTCmd (captures prevOltId), SetPenetrationCmd (captures prevRate), DeleteAdaCmd (JSON deep copy entire ada + activeAda restore), RenameAdaCmd (captures prevName), AddManualEdgeCmd (symmetric add/remove).
- **Task 3**: BatchCommand factory — executes commands in order, undoes in reverse order. Single stack entry for atomic undo/redo.
- **Task 4**: Keyboard shortcuts in main.js — Ctrl+Z (undo), Ctrl+Y and Ctrl+Shift+Z (redo). Skips when INPUT/TEXTAREA/contentEditable focused. EventBus listeners on command:execute/undo/redo trigger Panels.refresh + Overlay.render + Storage.autoSave.
- **Task 5**: manifest.json updated — `lib/command-manager.js` placed after `lib/storage.js`, before `lib/map-utils.js`.
- **Task 6**: 16-section test suite (~65 assertions) — round-trip, redo clearing, canUndo/canRedo, RemoveBuildingCmd deep copy + ID preservation, SetOLTCmd, SetPenetrationCmd, RenameAdaCmd, DeleteAdaCmd + viewMode restore, BatchCommand, history limit (105 commands → 100 retained), EventBus events, clear, getHistory order, invalid command handling, AddManualEdgeCmd, BatchCommand partial failure rollback.

### Implementation Plan

1. CommandManager IIFE: undo/redo stacks, execute/undo/redo with try/catch + EventBus emit
2. 7 command factories using closure capture + JSON deep copy for destructive operations
3. BatchCommand: array of commands, forward execute, reverse undo
4. main.js: keydown listener (Ctrl+Z/Y) with input bypass + EventBus UI refresh chain
5. manifest.json: storage.js → command-manager.js → map-utils.js
6. Test suite: 15 sections covering all commands, edge cases, history limits, events

### File List

- **NEW** `fiber-chrome/lib/command-manager.js` — CommandManager IIFE module (~270 lines)
- **MODIFIED** `fiber-chrome/content/main.js` — Keyboard shortcuts + command event listeners
- **MODIFIED** `fiber-chrome/manifest.json` — command-manager.js added to content_scripts
- **NEW** `fiber-chrome/dashboard/test-command-manager.html` — Test suite (16 sections, ~65 assertions)

## Senior Developer Review (AI)

**Reviewer:** Claude Opus 4.6 (adversarial code review)
**Date:** 2026-03-01
**Verdict:** PASS (after fixes)

### Findings (5 fixed, 1 noted)

1. **[HIGH][FIXED]** `AddManualEdgeCmd` `ada` object yerine `ada.id` gecilmeliydi — `Topology.addManualEdge(adaId, fromId, toId)` number bekliyor, object geciliyordu → komut tamamen bozuktu (`command-manager.js:273`)
2. **[HIGH][FIXED]** Test section 15 (AddManualEdgeCmd) Bug #1 nedeniyle FAIL edecekti — test dogrulanmadan yazilmisti
3. **[MEDIUM][FIXED]** `RemoveBuildingCmd` undo `Topology.addBuilding()` yerine `ada.buildings.push(savedBuilding)` kullanmali — addBuilding yeni ID atiyor, eski referanslar (manualEdges, FDH) bozuluyordu (`command-manager.js:167`)
4. **[MEDIUM][FIXED]** `BatchCommand.do()` kismi hata durumunda rollback yapmiyordu — command N fail olunca 0..N-1 geri alinamaz durumda kaliyordu (`command-manager.js:293-296`)
5. **[MEDIUM][FIXED]** `DeleteAdaCmd` undo `PROJECT.viewMode` geri yuklemiyordu — deleteAda `viewMode='all'` ayarliyor ama undo restore etmiyordu (`command-manager.js:230-238`)
6. **[LOW][NOTED]** `execute()` basari/basarisizlik bilgisi donmuyor — `undo()`/`redo()` boolean donuyor, `execute()` undefined

## Change Log

- 2026-03-01: Story 1.4 implemented — CommandManager module created, 7 command factories, BatchCommand, keyboard shortcuts (Ctrl+Z/Y), EventBus integration, manifest.json updated, comprehensive test suite added
- 2026-03-01: Code review — 5 fixes applied (AddManualEdgeCmd signature, RemoveBuildingCmd ID preservation, BatchCommand rollback, DeleteAdaCmd viewMode restore, test updates); test suite expanded to 16 sections
