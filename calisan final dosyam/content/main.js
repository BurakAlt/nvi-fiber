/**
 * FiberPlan Chrome - Main Entry Point
 * Orchestrates NVI portal integration, initializes all modules
 *
 * Flow:
 * 1. User searches address on NVI portal
 * 2. NVI shows result table with bagimsiz bolum rows
 * 3. Buildings auto-added to active ada
 * 4. User clicks "ADA BITIR" → calculations run
 * 5. User clicks "GeoJSON" → downloads file for QGIS
 * 6. Dashboard page shows full project overview
 */

(async function FiberPlanInit() {
  'use strict';

  // Selected buildings for GeoJSON export (binaNo → building data)
  var selectedBuildings = new Map();
  window._fpSelectedBuildings = selectedBuildings;

  // Initialize debug bridge FIRST - captures all subsequent logs
  if (typeof FPDebug !== 'undefined') FPDebug.init();

  console.log('[FiberPlan] v2.0.0 Initializing...');

  // Check if we're on NVI portal
  if (!NviScraper.isNviPortal()) {
    console.log('[FiberPlan] Not on NVI portal, skipping.');
    return;
  }

  try {
    // 1. Initialize storage
    await Storage.init();
    console.log('[FiberPlan] Storage ready.');

    // 1b. One-time migration: IndexedDB → chrome.storage.local
    await migrateFromIndexedDB();

    // 2. Load saved project data
    var loaded = await Storage.autoLoad();
    if (loaded) {
      console.log('[FiberPlan] Project loaded from storage.');
      Topology.recalculateAll();
    }

    // 3. Initialize UI panels (toolbar, side panel)
    Panels.init();
    console.log('[FiberPlan] Panels injected.');

    // 4. Start auto-polling: detect NVI table changes → auto-add to topology
    NviScraper.startAutoPolling(function(buildings) {
      onTableDetected(buildings);
    });
    console.log('[FiberPlan] Auto-polling active.');

    // 6. Observe building row clicks for QGIS selection
    NviScraper.observeBuildingClicks(function(buildingData) {
      onBuildingClicked(buildingData);
    });
    console.log('[FiberPlan] Building click observer active.');

    // 7. Watch for "Dogrula" clicks to capture map coordinates
    NviScraper.observeVerifyButtons(function(data) {
      updateBuildingCoords(data.binaNo, data.lat, data.lng);
    });

    // 8. Initialize map overlay (self-contained, no NVI map dependency)
    Overlay.init();

    // 9. Auto-save (debounced)
    var saveTimer = null;
    window.addEventListener('fiberplan-change', function() {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(function() { Storage.autoSave(); }, 2000);
    });

    console.log('[FiberPlan] Ready. FTTH planning active on NVI portal.');

  } catch (err) {
    console.error('[FiberPlan] Initialization error:', err);
  }

  /**
   * Handle building row click - toggle selection for GeoJSON export
   */
  function onBuildingClicked(buildingData) {
    if (!buildingData || !buildingData.binaNo) return;

    var key = buildingData.binaNo;

    if (buildingData._deselect) {
      // Explicit deselection from scraper
      selectedBuildings.delete(key);
      console.log('[FiberPlan] Deselected: ' + key);
    } else {
      // Select (add/overwrite)
      selectedBuildings.set(key, buildingData);
      console.log('[FiberPlan] Selected: ' + buildingData.name + ' (' + buildingData.bb + ' BB, splitter: ' + buildingData.splitter + ')');
    }

    // Update toolbar GeoJSON badge
    var btn = document.getElementById('fp-btn-export-geojson');
    if (btn) {
      var count = selectedBuildings.size;
      btn.textContent = count > 0
        ? 'GeoJSON (' + count + ')'
        : 'GeoJSON';
    }
  }

  /**
   * Handle auto-detected table change — bulk add to topology (keeps side panel updated)
   * This still auto-adds buildings to active ada for local calculation display
   */
  function onTableDetected(buildings) {
    if (!buildings || buildings.length === 0) return;

    // Ensure we have an active ada, auto-create from NVI ada number
    var ada = Topology.getActiveAda();
    if (!ada) {
      var firstAda = buildings[0].ada;
      var adaName = firstAda && firstAda !== '-'
        ? 'Ada ' + firstAda
        : 'Ada ' + Date.now();
      ada = Topology.createAda(adaName);
      Topology.switchView(ada.id);
      console.log('[FiberPlan] Auto-created ada: ' + adaName);
    }

    var addedCount = 0;

    for (var i = 0; i < buildings.length; i++) {
      var bldg = buildings[i];
      var binaNoList = bldg.binaNoList || [bldg.binaNo];

      // Check for existing building: match by any binaNo in the list,
      // or by same name+disKapiNo (handles NVI multi-binaNo per building)
      var existing = ada.buildings.find(function(b) {
        // Match by binaNo (primary or any in list)
        if (binaNoList.indexOf(b.binaNo) !== -1) return true;
        if (b.binaNo === bldg.binaNo) return true;
        // Match by name+disKapiNo within same ada (physical building match)
        if (bldg.disKapiNo && bldg.disKapiNo !== '-' &&
            b.name === bldg.name && b.name !== '-') return true;
        return false;
      });

      if (existing) {
        // Update BB if changed (take the larger value to capture all units)
        if (bldg.bb > existing.bb) {
          existing.bb = bldg.bb;
        }
      } else {
        // New building — add to ada
        Topology.addBuilding(ada, {
          name: bldg.name,
          addr: bldg.addr,
          bb: bldg.bb,
          lat: bldg.lat || 0,
          lng: bldg.lng || 0,
          floor: bldg.floor || 0,
          hasElectric: bldg.hasElectric !== false,
          binaNo: bldg.binaNo,
          adaNo: bldg.ada,
          parsel: bldg.parsel
        });
        addedCount++;
      }
    }

    if (addedCount > 0) {
      Overlay.autoPlaceBuildings(ada);
      PonEngine.recalculateAda(ada);
      Panels.refresh();
      Storage.autoSave();
      Overlay.render();

      var totalBB = ada.buildings.reduce(function(s, b) { return s + b.bb; }, 0);
      Panels.showNotification(addedCount + ' bina eklendi (' + totalBB + ' BB)', 'success');
    }
  }

  /**
   * Update building coordinates from map (after "Dogrula" click)
   */
  function updateBuildingCoords(binaNo, lat, lng) {
    if (!binaNo || !lat || !lng) return;

    for (var i = 0; i < Topology.PROJECT.adas.length; i++) {
      var ada = Topology.PROJECT.adas[i];
      var building = ada.buildings.find(function(b) { return b.binaNo === binaNo; });
      if (building) {
        building.lat = lat;
        building.lng = lng;
        console.log('[FiberPlan] Coords updated: ' + building.name + ' [' + lat + ', ' + lng + ']');

        PonEngine.recalculateAda(ada);
        Panels.refresh();
        Storage.autoSave();
        Overlay.render();
        break;
      }
    }
  }


  /**
   * One-time migration: move data from IndexedDB to chrome.storage.local
   * Runs only on NVI portal (where old IndexedDB data lives)
   */
  function migrateFromIndexedDB() {
    return new Promise(function(resolve) {
      // Skip if already migrated
      chrome.storage.local.get('fp_migrated', function(result) {
        if (result.fp_migrated) { resolve(); return; }

        // Try to read old IndexedDB
        var request;
        try {
          request = indexedDB.open('FiberPlanDB', 1);
        } catch (e) {
          resolve(); return;
        }

        request.onerror = function() { resolve(); };
        request.onupgradeneeded = function(e) {
          // DB didn't exist before, nothing to migrate
          e.target.transaction.abort();
          resolve();
        };
        request.onsuccess = function(e) {
          var db = e.target.result;
          if (!db.objectStoreNames.contains('projects')) {
            db.close();
            resolve();
            return;
          }

          var tx = db.transaction('projects', 'readonly');
          var store = tx.objectStore('projects');
          var getReq = store.get('current');

          getReq.onsuccess = function() {
            var entry = getReq.result;
            db.close();

            if (entry && entry.data) {
              // Save to chrome.storage.local
              var obj = {
                fp_current: { data: entry.data, updatedAt: new Date().toISOString() },
                fp_migrated: true
              };
              chrome.storage.local.set(obj, function() {
                console.log('[FiberPlan] Migrated data from IndexedDB to chrome.storage.local');
                resolve();
              });
            } else {
              chrome.storage.local.set({ fp_migrated: true }, function() { resolve(); });
            }
          };

          getReq.onerror = function() {
            db.close();
            resolve();
          };
        };
      });
    });
  }
})();
