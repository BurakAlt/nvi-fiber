/**
 * Map Overlay - Self-contained Leaflet map overlaid on NVI page
 * Creates its own map div with satellite/street tiles, building markers,
 * cable lines, boundary polygons. Bypasses NVI's inaccessible map.
 * Includes header bar with city presets, coordinate input, layer toggle.
 */

var Overlay = (function() {
  'use strict';

  var markers = [];
  var cableLines = [];
  var boundaryPolygons = [];
  var map = null;
  var mapContainer = null;
  var mapDiv = null;
  var visible = false;
  var currentTileLayer = null;
  var labelsLayer = null;
  var isSatellite = false;
  var coordInput = null;

  // Place mode state - for manually placing buildings on map
  var placeState = { active: false, buildingId: null, adaId: null };

  // ─── Map Mode System ───
  var mapMode = {
    current: null,     // null | 'cable' | 'olt' | 'boundary'
    cableSource: null, // source building ID for cable drawing
    tempLine: null     // L.polyline (cursor-following preview)
  };

  // Storage key for saved map position
  var MAP_POS_KEY = 'fp_map_position';

  // Cable type visual styles
  var CABLE_STYLES = {
    backbone:     { color: '#2563eb', weight: 5, opacity: 0.9, dashArray: null },
    distribution: { color: '#ea580c', weight: 3, opacity: 0.8, dashArray: null },
    drop:         { color: '#dc2626', weight: 1.5, opacity: 0.6, dashArray: '6 4' },
    ring:         { color: '#4f46e5', weight: 2, opacity: 0.5, dashArray: '8 5' },
    ptp:          { color: '#ef4444', weight: 3.5, opacity: 0.9, dashArray: '10 6' }
  };

  // Core count → cable color mapping
  var CORE_COLORS = {
    2:  { color: '#ef4444', weight: 1.8, label: '2 Kor' },
    4:  { color: '#f97316', weight: 2.2, label: '4 Kor' },
    12: { color: '#eab308', weight: 3,   label: '12 Kor' },
    24: { color: '#22c55e', weight: 3.5, label: '24 Kor' },
    48: { color: '#3b82f6', weight: 4.5, label: '48 Kor' },
    96: { color: '#a855f7', weight: 5.5, label: '96 Kor' }
  };

  function getCoreStyle(cores) {
    if (cores >= 96) return CORE_COLORS[96];
    if (cores >= 48) return CORE_COLORS[48];
    if (cores >= 24) return CORE_COLORS[24];
    if (cores >= 12) return CORE_COLORS[12];
    if (cores >= 4)  return CORE_COLORS[4];
    return CORE_COLORS[2];
  }

  // City presets (all 81 Turkish provinces)
  var CITY_PRESETS = [
    { name: 'Istanbul (Avrupa)', lat: 41.015, lng: 28.979, zoom: 12 },
    { name: 'Istanbul (Anadolu)', lat: 40.983, lng: 29.100, zoom: 12 },
    { name: 'Ankara', lat: 39.925, lng: 32.837, zoom: 12 },
    { name: 'Izmir', lat: 38.423, lng: 27.143, zoom: 12 },
    { name: 'Bursa', lat: 40.183, lng: 29.067, zoom: 12 },
    { name: 'Antalya', lat: 36.897, lng: 30.713, zoom: 12 },
    { name: 'Adana', lat: 37.000, lng: 35.321, zoom: 12 },
    { name: 'Konya', lat: 37.871, lng: 32.484, zoom: 12 },
    { name: 'Gaziantep', lat: 37.066, lng: 37.383, zoom: 12 },
    { name: 'Mersin', lat: 36.800, lng: 34.633, zoom: 12 },
    { name: 'Diyarbakir', lat: 37.910, lng: 40.237, zoom: 12 },
    { name: 'Kayseri', lat: 38.734, lng: 35.467, zoom: 12 },
    { name: 'Eskisehir', lat: 39.784, lng: 30.520, zoom: 12 },
    { name: 'Samsun', lat: 41.292, lng: 36.331, zoom: 12 },
    { name: 'Trabzon', lat: 41.003, lng: 39.717, zoom: 12 },
    { name: 'Malatya', lat: 38.350, lng: 38.317, zoom: 12 },
    { name: 'Cankiri', lat: 40.601, lng: 33.619, zoom: 13 },
    { name: 'Denizli', lat: 37.774, lng: 29.088, zoom: 12 },
    { name: 'Erzurum', lat: 39.905, lng: 41.268, zoom: 12 },
    { name: 'Sanliurfa', lat: 37.159, lng: 38.796, zoom: 12 },
    { name: 'Van', lat: 38.494, lng: 43.380, zoom: 12 },
    { name: 'Manisa', lat: 38.619, lng: 27.429, zoom: 12 },
    { name: 'Sakarya', lat: 40.677, lng: 30.400, zoom: 12 },
    { name: 'Balikesir', lat: 39.649, lng: 27.886, zoom: 12 },
    { name: 'Hatay', lat: 36.202, lng: 36.160, zoom: 12 },
    { name: 'Kahramanmaras', lat: 37.575, lng: 36.937, zoom: 12 },
    { name: 'Afyon', lat: 38.737, lng: 30.539, zoom: 12 },
    { name: 'Sivas', lat: 39.748, lng: 37.015, zoom: 12 },
    { name: 'Tokat', lat: 40.314, lng: 36.554, zoom: 12 },
    { name: 'Amasya', lat: 40.652, lng: 35.833, zoom: 13 },
    { name: 'Corum', lat: 40.551, lng: 34.956, zoom: 13 },
    { name: 'Kastamonu', lat: 41.389, lng: 33.783, zoom: 13 },
    { name: 'Kirikkale', lat: 39.847, lng: 33.515, zoom: 13 },
    { name: 'Yozgat', lat: 39.818, lng: 34.815, zoom: 13 },
    { name: 'Cankiri (Ilgaz)', lat: 40.919, lng: 33.627, zoom: 14 },
    { name: 'Cankiri (Cerkes)', lat: 40.812, lng: 32.891, zoom: 14 },
    { name: 'Bolu', lat: 40.735, lng: 31.611, zoom: 13 },
    { name: 'Duzce', lat: 40.844, lng: 31.156, zoom: 13 },
    { name: 'Karabuk', lat: 41.196, lng: 32.625, zoom: 13 },
    { name: 'Bartin', lat: 41.636, lng: 32.338, zoom: 13 },
    { name: 'Zonguldak', lat: 41.456, lng: 31.799, zoom: 13 },
    { name: 'Sinop', lat: 42.027, lng: 35.153, zoom: 13 },
    { name: 'Rize', lat: 41.020, lng: 40.521, zoom: 13 },
    { name: 'Artvin', lat: 41.182, lng: 41.818, zoom: 13 },
    { name: 'Giresun', lat: 40.912, lng: 38.390, zoom: 13 },
    { name: 'Ordu', lat: 40.984, lng: 37.879, zoom: 13 },
    { name: 'Elazig', lat: 38.674, lng: 39.223, zoom: 12 },
    { name: 'Tunceli', lat: 39.108, lng: 39.547, zoom: 13 },
    { name: 'Bingol', lat: 38.885, lng: 40.498, zoom: 13 },
    { name: 'Mus', lat: 38.748, lng: 41.491, zoom: 13 },
    { name: 'Bitlis', lat: 38.401, lng: 42.108, zoom: 13 },
    { name: 'Siirt', lat: 37.933, lng: 41.946, zoom: 13 },
    { name: 'Batman', lat: 37.887, lng: 41.132, zoom: 13 },
    { name: 'Sirnak', lat: 37.514, lng: 42.458, zoom: 13 },
    { name: 'Hakkari', lat: 37.574, lng: 43.741, zoom: 13 },
    { name: 'Mardin', lat: 37.321, lng: 40.735, zoom: 12 },
    { name: 'Agri', lat: 39.720, lng: 43.051, zoom: 13 },
    { name: 'Igdir', lat: 39.920, lng: 44.047, zoom: 13 },
    { name: 'Kars', lat: 40.608, lng: 43.097, zoom: 13 },
    { name: 'Ardahan', lat: 41.111, lng: 42.702, zoom: 13 },
    { name: 'Gumushane', lat: 40.460, lng: 39.481, zoom: 13 },
    { name: 'Bayburt', lat: 40.255, lng: 40.224, zoom: 13 },
    { name: 'Erzincan', lat: 39.750, lng: 39.493, zoom: 13 },
    { name: 'Nevsehir', lat: 38.625, lng: 34.714, zoom: 13 },
    { name: 'Kirsehir', lat: 39.146, lng: 34.161, zoom: 13 },
    { name: 'Nigde', lat: 37.967, lng: 34.694, zoom: 13 },
    { name: 'Aksaray', lat: 38.374, lng: 34.025, zoom: 13 },
    { name: 'Karaman', lat: 37.181, lng: 33.229, zoom: 13 },
    { name: 'Isparta', lat: 37.764, lng: 30.556, zoom: 13 },
    { name: 'Burdur', lat: 37.721, lng: 30.291, zoom: 13 },
    { name: 'Mugla', lat: 37.215, lng: 28.364, zoom: 12 },
    { name: 'Aydin', lat: 37.849, lng: 27.845, zoom: 12 },
    { name: 'Usak', lat: 38.682, lng: 29.408, zoom: 13 },
    { name: 'Kutahya', lat: 39.424, lng: 29.983, zoom: 13 },
    { name: 'Bilecik', lat: 40.056, lng: 30.017, zoom: 13 },
    { name: 'Canakkale', lat: 40.155, lng: 26.414, zoom: 12 },
    { name: 'Edirne', lat: 41.677, lng: 26.556, zoom: 13 },
    { name: 'Tekirdag', lat: 41.000, lng: 27.511, zoom: 13 },
    { name: 'Kirklareli', lat: 41.735, lng: 27.226, zoom: 13 },
    { name: 'Kocaeli', lat: 40.767, lng: 29.917, zoom: 12 },
    { name: 'Yalova', lat: 40.656, lng: 29.275, zoom: 13 },
    { name: 'Osmaniye', lat: 37.074, lng: 36.247, zoom: 13 },
    { name: 'Adiyaman', lat: 37.764, lng: 38.276, zoom: 13 },
    { name: 'Kilis', lat: 36.718, lng: 37.121, zoom: 14 }
  ];

  // ─── Map position persistence ───

  function loadSavedMapPosition(callback) {
    chrome.storage.local.get(MAP_POS_KEY, function(result) {
      callback(result[MAP_POS_KEY] || null);
    });
  }

  function saveMapPosition(lat, lng, zoom) {
    var obj = {};
    obj[MAP_POS_KEY] = { lat: lat, lng: lng, zoom: zoom };
    chrome.storage.local.set(obj);
  }

  // ─── Header bar builder ───

  function buildHeaderBar() {
    var header = document.createElement('div');
    header.id = 'fp-map-header';

    // City preset dropdown
    var citySelect = document.createElement('select');
    citySelect.id = 'fp-map-city-select';
    citySelect.innerHTML = '<option value="">Sehir sec...</option>';
    for (var ci = 0; ci < CITY_PRESETS.length; ci++) {
      citySelect.innerHTML += '<option value="' + ci + '">' + CITY_PRESETS[ci].name + '</option>';
    }
    header.appendChild(citySelect);

    // Coordinate input
    coordInput = document.createElement('input');
    coordInput.type = 'text';
    coordInput.id = 'fp-map-coord-input';
    coordInput.placeholder = 'Lat, Lng';
    header.appendChild(coordInput);

    // Go button
    var goBtn = document.createElement('button');
    goBtn.className = 'fp-map-hdr-btn fp-map-hdr-go';
    goBtn.textContent = 'GIT';
    header.appendChild(goBtn);

    // Spacer
    var spacer = document.createElement('div');
    spacer.style.flex = '1';
    header.appendChild(spacer);

    // ── Map mode buttons ──
    var modeOlt = document.createElement('button');
    modeOlt.className = 'fp-map-hdr-btn fp-map-mode-btn';
    modeOlt.id = 'fp-map-mode-olt';
    modeOlt.textContent = 'OLT SEC';
    header.appendChild(modeOlt);

    var modeCable = document.createElement('button');
    modeCable.className = 'fp-map-hdr-btn fp-map-mode-btn';
    modeCable.id = 'fp-map-mode-cable';
    modeCable.textContent = 'KABLO CIZ';
    header.appendChild(modeCable);

    var modeBoundary = document.createElement('button');
    modeBoundary.className = 'fp-map-hdr-btn fp-map-mode-btn';
    modeBoundary.id = 'fp-map-mode-boundary';
    modeBoundary.textContent = 'SINIR CIZ';
    header.appendChild(modeBoundary);

    var modeAdaBitir = document.createElement('button');
    modeAdaBitir.className = 'fp-map-hdr-btn fp-map-hdr-adabitir';
    modeAdaBitir.id = 'fp-map-mode-adabitir';
    modeAdaBitir.textContent = 'ADA BITIR';
    header.appendChild(modeAdaBitir);

    var modeHesapla = document.createElement('button');
    modeHesapla.className = 'fp-map-hdr-btn fp-map-hdr-hesapla';
    modeHesapla.id = 'fp-map-mode-hesapla';
    modeHesapla.textContent = 'HESAPLA';
    header.appendChild(modeHesapla);

    // Spacer 2
    var spacer2 = document.createElement('div');
    spacer2.style.flex = '1';
    header.appendChild(spacer2);

    // Layer toggle
    var layerBtn = document.createElement('button');
    layerBtn.className = 'fp-map-hdr-btn';
    layerBtn.id = 'fp-map-layer-btn';
    layerBtn.textContent = 'UYDU';
    header.appendChild(layerBtn);

    // Help text
    var helpText = document.createElement('span');
    helpText.id = 'fp-map-help';
    helpText.textContent = 'Binalari surukleyerek konumlandir';
    header.appendChild(helpText);

    // Close button
    var closeBtn = document.createElement('button');
    closeBtn.className = 'fp-map-hdr-btn fp-map-hdr-close';
    closeBtn.textContent = 'KAPAT';
    header.appendChild(closeBtn);

    // ── Bind events ──

    citySelect.addEventListener('change', function() {
      var idx = parseInt(this.value, 10);
      if (isNaN(idx) || !map) return;
      var preset = CITY_PRESETS[idx];
      map.setView([preset.lat, preset.lng], preset.zoom);
    });

    goBtn.addEventListener('click', function() {
      if (!coordInput || !map) return;
      var parts = coordInput.value.split(',');
      if (parts.length >= 2) {
        var lat = parseFloat(parts[0].trim());
        var lng = parseFloat(parts[1].trim());
        if (!isNaN(lat) && !isNaN(lng)) {
          map.setView([lat, lng], Math.max(map.getZoom(), 15));
        }
      }
    });

    coordInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') goBtn.click();
    });

    layerBtn.addEventListener('click', function() {
      if (!map) return;
      if (currentTileLayer) map.removeLayer(currentTileLayer);
      if (isSatellite) {
        currentTileLayer = MapUtils.createStreetLayer();
        layerBtn.textContent = 'UYDU';
      } else {
        currentTileLayer = MapUtils.createSatelliteLayer();
        layerBtn.textContent = 'SOKAK';
      }
      currentTileLayer.addTo(map);
      isSatellite = !isSatellite;
    });

    closeBtn.addEventListener('click', function() {
      if (mapMode.current) deactivateMode();
      hide();
      // Update toolbar button
      var btn = document.getElementById('fp-btn-map-toggle');
      if (btn) { btn.classList.remove('fp-btn-danger'); btn.textContent = 'HARITA'; }
    });

    // ── Mode button events ──
    modeOlt.addEventListener('click', function() {
      if (isMode('olt')) deactivateMode();
      else activateMode('olt');
    });

    modeCable.addEventListener('click', function() {
      if (isMode('cable')) deactivateMode();
      else activateMode('cable');
    });

    modeBoundary.addEventListener('click', function() {
      if (isMode('boundary')) deactivateMode();
      else activateMode('boundary');
    });

    modeAdaBitir.addEventListener('click', function() {
      var ada = Topology.getActiveAda();
      if (!ada) { Panels.showNotification('Aktif ada yok.', 'error'); return; }
      if (ada.buildings.length === 0) { Panels.showNotification('Bu adada bina yok.', 'error'); return; }
      Topology.completeAda(ada);
      PonEngine.recalculateAda(ada);
      render();
      Panels.refresh();
      Storage.autoSave();
      var oltB = ada.buildings.find(function(b) { return b.id === ada.topology.oltBuildingId; });
      Panels.showNotification('Ada tamamlandi! OLT: ' + (oltB ? oltB.name : '?'), 'success');
    });

    modeHesapla.addEventListener('click', function() {
      var ada = Topology.getActiveAda();
      if (!ada) { Panels.showNotification('Aktif ada yok.', 'error'); return; }
      if (ada.buildings.length === 0) { Panels.showNotification('Bu adada bina yok.', 'error'); return; }
      // Auto-complete if still planning
      if (ada.status !== 'completed') Topology.completeAda(ada);
      PonEngine.recalculateAda(ada);
      Storage.autoSave();
      render();
      Panels.refresh();
      var totalCable = (ada.calculations.cables || []).reduce(function(s, c) { return s + c.distanceM; }, 0);
      var totalCost = ada.calculations.costs ? ada.calculations.costs.total : 0;
      var cap = ada.calculations.oltCapacity;
      Panels.showNotification(
        'Hesaplandi: ' + (totalCable / 1000).toFixed(1) + 'km kablo' +
        (cap ? ' \u00b7 ' + cap.requiredPorts + ' port' : '') +
        ' \u00b7 ' + MapUtils.formatTL(totalCost), 'success'
      );
    });

    return header;
  }

  function updateCoordDisplay() {
    if (!coordInput || !map) return;
    var c = map.getCenter();
    coordInput.value = c.lat.toFixed(5) + ', ' + c.lng.toFixed(5);
  }

  // ─── Mode Management ───

  function activateMode(mode) {
    if (mapMode.current) deactivateMode();
    // Pre-validation
    if (mode === 'cable') {
      var cAda = Topology.getActiveAda();
      if (!cAda || cAda.status !== 'completed') {
        Panels.showNotification('Once bir ada tamamlayin (ADA BITIR)', 'error');
        return;
      }
      if (!cAda.topology.manualEdges || cAda.topology.manualEdges.length === 0) {
        Topology.copyMstToManualEdges(cAda.id);
        Storage.autoSave();
      }
    }
    if (mode === 'olt') {
      if (!Topology.getActiveAda()) { Panels.showNotification('Aktif ada yok.', 'error'); return; }
    }
    if (mode === 'boundary') {
      if (!Topology.getActiveAda()) { Panels.showNotification('Aktif ada yok.', 'error'); return; }
      if (!visible) {
        show();
        var mBtn = document.getElementById('fp-btn-map-toggle');
        if (mBtn) { mBtn.classList.add('fp-btn-danger'); mBtn.textContent = 'HARITA \u2716'; }
      }
    }

    mapMode.current = mode;
    if (map) map.getContainer().style.cursor = 'crosshair';
    updateModeButtons();

    if (mode === 'cable') {
      setHelpText('Kaynak binaya tikla...');
      syncCableModeToPanel(true);
      Panels.showNotification('KABLO CIZ: Haritada binaya tikla', 'info');
    } else if (mode === 'olt') {
      setHelpText('OLT atamak icin binaya tikla');
      Panels.showNotification('OLT SEC: Binaya tikla', 'info');
    } else if (mode === 'boundary') {
      setHelpText('Tiklayarak sinir ciz \u00b7 Cift tikla kapat \u00b7 ESC iptal');
      Panels.showNotification('Haritaya tiklayarak sinir cizin', 'info');
      var drawAda = Topology.getActiveAda();
      if (typeof DrawPolygon !== 'undefined' && map && drawAda) {
        DrawPolygon.start(map, function(latlngs) {
          Topology.setAdaBoundary(drawAda.id, latlngs);
          try { map.fitBounds(L.latLngBounds(latlngs).pad(0.3)); } catch(e) {}
          setTimeout(function() {
            var bounds = map.getBounds();
            var bd = { north: bounds.getNorth(), south: bounds.getSouth(), east: bounds.getEast(), west: bounds.getWest() };
            if (chrome.runtime && chrome.runtime.sendMessage) {
              chrome.runtime.sendMessage({ action: 'captureTab' }, function(resp) {
                Topology.setMapSnapshot(drawAda.id, resp && resp.screenshot ? resp.screenshot : null, bd);
                Storage.autoSave();
              });
            }
          }, 800);
          Storage.autoSave();
          DrawPolygon.removePolygon();
          deactivateMode();
          render();
          Panels.refresh();
          Panels.showNotification(drawAda.name + ' siniri cizildi (' + latlngs.length + ' nokta)', 'success');
        });
      }
    }

    Panels.refresh();
  }

  function deactivateMode() {
    var prev = mapMode.current;
    cleanupCablePreview();
    mapMode.current = null;
    mapMode.cableSource = null;
    if (map) map.getContainer().style.cursor = '';
    setHelpText('Binalari surukleyerek konumlandir');
    updateModeButtons();
    if (prev === 'cable') syncCableModeToPanel(false);
    if (prev === 'boundary' && typeof DrawPolygon !== 'undefined' && DrawPolygon.isActive()) {
      DrawPolygon.stop();
    }
  }

  function isMode(mode) {
    return mapMode.current === mode;
  }

  function updateModeButtons() {
    var ids = { olt: 'fp-map-mode-olt', cable: 'fp-map-mode-cable', boundary: 'fp-map-mode-boundary' };
    for (var m in ids) {
      if (ids.hasOwnProperty(m)) {
        var el = document.getElementById(ids[m]);
        if (el) {
          if (mapMode.current === m) el.classList.add('fp-map-mode-active');
          else el.classList.remove('fp-map-mode-active');
        }
      }
    }
    var cBtn = document.getElementById('fp-btn-cable-mode');
    if (cBtn) {
      if (mapMode.current === 'cable') { cBtn.classList.add('fp-btn-draw-active'); cBtn.textContent = 'KABLO CIZ \u2713'; }
      else { cBtn.classList.remove('fp-btn-draw-active'); cBtn.textContent = 'KABLO CIZ'; }
    }
    var bBtn = document.getElementById('fp-btn-draw-poly');
    if (bBtn) {
      if (mapMode.current === 'boundary') { bBtn.classList.add('fp-btn-draw-active'); bBtn.textContent = 'IPTAL'; }
      else { bBtn.classList.remove('fp-btn-draw-active'); bBtn.textContent = 'SINIR CIZ'; }
    }
  }

  function syncCableModeToPanel(active) {
    if (typeof Panels !== 'undefined' && Panels._setCableState) {
      Panels._setCableState(active, null);
    }
  }

  // ─── Cable Drawing Helpers ───

  function cleanupCablePreview() {
    if (mapMode.tempLine && map) map.removeLayer(mapMode.tempLine);
    mapMode.tempLine = null;
    unhighlightAllMarkers();
  }

  function highlightMarkerForBuilding(buildingId) {
    for (var i = 0; i < markers.length; i++) {
      if (markers[i]._fpBuildingId === buildingId) {
        var el = markers[i].getElement ? markers[i].getElement() : markers[i]._icon;
        if (el) el.classList.add('fp-marker-highlight');
      }
    }
  }

  function unhighlightAllMarkers() {
    for (var i = 0; i < markers.length; i++) {
      var el = markers[i].getElement ? markers[i].getElement() : markers[i]._icon;
      if (el) el.classList.remove('fp-marker-highlight');
    }
  }

  function handleMapCableClick(buildingId, ada) {
    if (mapMode.current !== 'cable') return;

    if (!mapMode.cableSource) {
      mapMode.cableSource = buildingId;
      highlightMarkerForBuilding(buildingId);
      var srcB = ada.buildings.find(function(b) { return b.id === buildingId; });
      setHelpText('Hedef binaya tikla... (ESC iptal)');
      Panels.showNotification('Kaynak: ' + (srcB ? srcB.name : '?') + ' \u2192 hedef binaya tikla', 'info');
      if (typeof Panels !== 'undefined' && Panels._setCableState) Panels._setCableState(true, buildingId);
      return;
    }

    if (mapMode.cableSource === buildingId) {
      mapMode.cableSource = null;
      cleanupCablePreview();
      setHelpText('Kaynak binaya tikla...');
      Panels.showNotification('Secim iptal', 'info');
      Panels.refresh();
      return;
    }

    var srcB2 = ada.buildings.find(function(b) { return b.id === mapMode.cableSource; });
    var tgtB = ada.buildings.find(function(b) { return b.id === buildingId; });
    var result = Topology.addManualEdge(ada.id, mapMode.cableSource, buildingId);
    mapMode.cableSource = null;
    cleanupCablePreview();

    if (result) {
      Storage.autoSave();
      Panels.showNotification('Kablo: ' + (srcB2 ? srcB2.name : '?') + ' \u2192 ' + (tgtB ? tgtB.name : '?'), 'success');
    } else {
      Panels.showNotification('Kablo eklenemedi (zaten var veya gecersiz)', 'error');
    }
    setHelpText('Kaynak binaya tikla...');
    render();
    Panels.refresh();
  }

  // ─── Auto-Placement ───

  function autoPlaceBuildings(ada) {
    if (!ada) return;
    var unplaced = ada.buildings.filter(function(b) { return !b.lat && !b.lng; });
    if (unplaced.length === 0) return;

    var center = calcPlacementCenter(ada);
    if (!center) return; // No anchor yet — user must place first building
    var radius = 0.0004 + (unplaced.length * 0.00005);
    var step = (2 * Math.PI) / unplaced.length;

    for (var i = 0; i < unplaced.length; i++) {
      var angle = step * i - (Math.PI / 2);
      unplaced[i].lat = center.lat + radius * Math.sin(angle);
      unplaced[i].lng = center.lng + radius * Math.cos(angle);
    }
  }

  function calcPlacementCenter(ada) {
    // 1. Boundary centroid
    if (ada.boundary && ada.boundary.coordinates && ada.boundary.coordinates[0]) {
      var ring = ada.boundary.coordinates[0];
      var cLat = 0, cLng = 0;
      for (var ri = 0; ri < ring.length; ri++) { cLat += ring[ri][1]; cLng += ring[ri][0]; }
      return { lat: cLat / ring.length, lng: cLng / ring.length };
    }
    // 2. Average of already-placed buildings
    var placed = ada.buildings.filter(function(b) { return b.lat || b.lng; });
    if (placed.length > 0) {
      var sLat = 0, sLng = 0;
      for (var pi = 0; pi < placed.length; pi++) { sLat += placed[pi].lat; sLng += placed[pi].lng; }
      return { lat: sLat / placed.length, lng: sLng / placed.length };
    }
    // 3. No good anchor — don't guess, let user place first building
    return null;
  }

  // ─── Legend & Penetration Panel ───

  function buildLegendPanel() {
    var panel = document.createElement('div');
    panel.id = 'fp-map-legend';
    panel.className = 'fp-map-legend';

    // Penetration control
    panel.innerHTML =
      '<div class="fp-legend-title">FIBER HESAP</div>' +
      '<div class="fp-legend-pen">' +
        '<span>Penetrasyon:</span>' +
        '<select id="fp-pen-select" class="fp-pen-select">' +
          '<option value="50">%50</option>' +
          '<option value="60">%60</option>' +
          '<option value="70">%70</option>' +
          '<option value="80">%80</option>' +
          '<option value="90">%90</option>' +
          '<option value="100">%100</option>' +
        '</select>' +
      '</div>' +
      '<div class="fp-legend-section">KABLO KORLARI</div>' +
      '<div id="fp-legend-cables" class="fp-legend-items"></div>' +
      '<div class="fp-legend-section">BINA TIPLERI</div>' +
      '<div id="fp-legend-buildings" class="fp-legend-items">' +
        '<div class="fp-legend-row"><span class="fp-legend-dot" style="background:#8b5cf6"></span>OLT</div>' +
        '<div class="fp-legend-row"><span class="fp-legend-dot" style="background:#3b82f6"></span>FDH</div>' +
        '<div class="fp-legend-row"><span class="fp-legend-dot" style="background:#22c55e"></span>MDU Buyuk (20+BB)</div>' +
        '<div class="fp-legend-row"><span class="fp-legend-dot" style="background:#f97316"></span>MDU Orta (8-19BB)</div>' +
        '<div class="fp-legend-row"><span class="fp-legend-dot" style="background:#eab308"></span>SFU (1-7BB)</div>' +
      '</div>';

    return panel;
  }

  function updateLegend(ada) {
    var panel = document.getElementById('fp-map-legend');
    if (!panel) return;

    // Show/hide based on ada status
    if (!ada || ada.buildings.length === 0) {
      panel.style.display = 'none';
      return;
    }
    panel.style.display = '';

    // Set penetration dropdown value
    var penSelect = document.getElementById('fp-pen-select');
    if (penSelect && ada.topology) {
      penSelect.value = String(ada.topology.defaultPenetrationRate || 70);
    }

    // Update cable legend: only show core counts actually used
    var cableDiv = document.getElementById('fp-legend-cables');
    if (cableDiv) {
      var usedCores = {};
      var cables = ada.calculations.cables || [];
      for (var i = 0; i < cables.length; i++) {
        if (cables[i].type !== 'drop') {
          var coreKey = getCoreStyle(cables[i].cores);
          usedCores[cables[i].cores] = coreKey;
        }
      }
      // Also count ring
      if (ada.topology.ringCable && !ada.topology.noRing) {
        var rc = ada.topology.ringCable.cores;
        usedCores[rc] = getCoreStyle(rc);
      }

      var cableHtml = '';
      var sortedCores = Object.keys(usedCores).map(Number).sort(function(a, b) { return a - b; });
      var totalMeters = cables.reduce(function(s, c) { return s + (c.type !== 'drop' ? c.distanceM : 0); }, 0);

      for (var ci = 0; ci < sortedCores.length; ci++) {
        var core = sortedCores[ci];
        var style = usedCores[core];
        // Count total meters for this core
        var coreMeter = cables.filter(function(c) { return getCoreStyle(c.cores) === style && c.type !== 'drop'; })
          .reduce(function(s, c) { return s + c.distanceM; }, 0);
        cableHtml += '<div class="fp-legend-row">' +
          '<span class="fp-legend-line" style="background:' + style.color + ';height:' + Math.min(style.weight, 5) + 'px"></span>' +
          '<span>' + style.label + '</span>' +
          '<span class="fp-legend-val">' + coreMeter + 'm</span>' +
          '</div>';
      }
      if (totalMeters > 0) {
        cableHtml += '<div class="fp-legend-row fp-legend-total">' +
          '<span>Toplam</span>' +
          '<span class="fp-legend-val">' + (totalMeters / 1000).toFixed(2) + ' km</span>' +
          '</div>';
      }
      cableDiv.innerHTML = cableHtml;
    }
  }

  // ─── Init ───

  /**
   * Initialize: create map container, header bar, and Leaflet map instance
   */
  function init() {
    if (mapContainer) return;

    // Create overlay container
    mapContainer = document.createElement('div');
    mapContainer.id = 'fp-map-overlay';

    // Header bar with controls
    var header = buildHeaderBar();
    mapContainer.appendChild(header);

    // Map div (below header)
    mapDiv = document.createElement('div');
    mapDiv.id = 'fp-map-canvas';
    mapContainer.appendChild(mapDiv);

    // Legend + penetration panel (floating over map)
    var legendPanel = buildLegendPanel();
    mapContainer.appendChild(legendPanel);

    document.body.appendChild(mapContainer);

    // Bind penetration dropdown change
    setTimeout(function() {
      var penSelect = document.getElementById('fp-pen-select');
      if (penSelect) {
        penSelect.addEventListener('change', function() {
          var ada = Topology.getActiveAda();
          if (!ada) return;
          var rate = parseInt(penSelect.value, 10);
          Topology.setAdaPenetrationRate(ada.id, rate);
          Storage.autoSave();
          render();
          Panels.refresh();
          Panels.showNotification('Penetrasyon: %' + rate, 'info');
        });
      }
    }, 100);

    // Create Leaflet map on the canvas div
    map = L.map(mapDiv, {
      zoomControl: true,
      attributionControl: false
    });

    // Start with OSM street tiles (faster loading, easier navigation)
    currentTileLayer = MapUtils.createStreetLayer();
    currentTileLayer.addTo(map);
    isSatellite = false;

    // Default view: Ankara center
    map.setView([39.92, 32.85], 13);

    // Restore saved position
    loadSavedMapPosition(function(saved) {
      if (saved && saved.lat && saved.lng && map) {
        map.setView([saved.lat, saved.lng], saved.zoom || 15);
      }
    });

    // Save position on move + update coord display
    map.on('moveend', function() {
      var c = map.getCenter();
      saveMapPosition(c.lat, c.lng, map.getZoom());
      updateCoordDisplay();
    });

    // Place mode: click on map to set building coordinates
    map.on('click', function(e) {
      // Ignore map clicks when a mode is active (only marker clicks are handled)
      if (mapMode.current) return;
      if (!placeState.active || !placeState.buildingId) return;
      var ada = Topology.getAda(placeState.adaId);
      if (!ada) { stopPlaceMode(); return; }
      var b = ada.buildings.find(function(x) { return x.id === placeState.buildingId; });
      if (b) {
        b.lat = e.latlng.lat;
        b.lng = e.latlng.lng;
        // Auto-place remaining unplaced buildings around this one
        autoPlaceBuildings(ada);
        PonEngine.recalculateAda(ada);
        Storage.autoSave();
        render();
        Panels.refresh();
        Panels.showNotification(b.name + ' konumu ayarlandi', 'success');
      }
      stopPlaceMode();
    });

    // ESC to cancel active mode
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        if (mapMode.current) deactivateMode();
        if (placeState.active) stopPlaceMode();
      }
    });

    // ── Drag & drop: panel building cards → map ──
    mapDiv.addEventListener('dragover', function(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      mapDiv.classList.add('fp-map-drop-active');
    });
    mapDiv.addEventListener('dragleave', function() {
      mapDiv.classList.remove('fp-map-drop-active');
    });
    mapDiv.addEventListener('drop', function(e) {
      e.preventDefault();
      mapDiv.classList.remove('fp-map-drop-active');
      var raw = e.dataTransfer.getData('text/plain');
      if (!raw || raw.indexOf(':') === -1) return;
      var parts = raw.split(':');
      var bId = parseInt(parts[0], 10);
      var aId = parseInt(parts[1], 10);
      if (isNaN(bId) || isNaN(aId)) return;
      var dropAda = Topology.getAda(aId);
      if (!dropAda) return;
      var dropB = dropAda.buildings.find(function(b) { return b.id === bId; });
      if (!dropB) return;
      // Convert drop pixel to lat/lng
      var rect = mapDiv.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      var latlng = map.containerPointToLatLng(L.point(x, y));
      dropB.lat = latlng.lat;
      dropB.lng = latlng.lng;
      autoPlaceBuildings(dropAda);
      PonEngine.recalculateAda(dropAda);
      Storage.autoSave();
      render();
      Panels.refresh();
      Panels.showNotification(dropB.name + ' haritaya yerlestirildi', 'success');
    });

    // ── Right-click on empty map → building picker ──
    map.on('contextmenu', function(e) {
      if (mapMode.current) return;
      showMapContextMenu(e.latlng, e.originalEvent);
    });

    // Mouse-following temp line for cable mode
    map.on('mousemove', function(e) {
      if (mapMode.current !== 'cable' || !mapMode.cableSource) return;
      var cAda = Topology.getActiveAda();
      if (!cAda) return;
      var srcB = cAda.buildings.find(function(b) { return b.id === mapMode.cableSource; });
      if (!srcB || (!srcB.lat && !srcB.lng)) return;
      var pts = [[srcB.lat, srcB.lng], [e.latlng.lat, e.latlng.lng]];
      if (mapMode.tempLine) {
        mapMode.tempLine.setLatLngs(pts);
      } else {
        mapMode.tempLine = L.polyline(pts, {
          color: '#22c55e', weight: 2.5, dashArray: '8 6', opacity: 0.7
        }).addTo(map);
      }
    });

    console.log('[FiberPlan] Map overlay created.');
  }

  /**
   * Start place mode - user clicks map to set building coordinates
   */
  function startPlaceMode(buildingId, adaId) {
    placeState = { active: true, buildingId: buildingId, adaId: adaId };
    if (map) map.getContainer().style.cursor = 'crosshair';
    setHelpText('Haritaya tiklayarak binayi yerlestir');
  }

  /**
   * Stop place mode - reset cursor and state
   */
  function stopPlaceMode() {
    placeState = { active: false, buildingId: null, adaId: null };
    if (map) map.getContainer().style.cursor = '';
    setHelpText('Binalari surukleyerek konumlandir');
  }

  /**
   * Right-click on empty map → show context menu with "Bina Ekle" option
   */
  function showMapContextMenu(latlng, e) {
    // Remove any existing context menu
    var existing = document.getElementById('fp-ctx-menu');
    if (existing) existing.remove();

    var ada = Topology.getActiveAda();
    if (!ada) return;

    // Find unplaced buildings (no coordinates)
    var unplaced = ada.buildings.filter(function(b) {
      return !b.lat && !b.lng;
    });

    var menu = document.createElement('div');
    menu.id = 'fp-ctx-menu';
    menu.className = 'fp-ctx-menu';
    menu.style.left = e.clientX + 'px';
    menu.style.top = e.clientY + 'px';

    var html = '<div class="fp-ctx-item disabled" style="font-size:10px;color:#64748b">' +
      latlng.lat.toFixed(5) + ', ' + latlng.lng.toFixed(5) + '</div>';
    html += '<div class="fp-ctx-sep"></div>';

    if (unplaced.length > 0) {
      html += '<div class="fp-ctx-item disabled" style="font-size:10px;color:#94a3b8;font-weight:700">' +
        'Bina Yerlestir (' + unplaced.length + ')</div>';
      // Show up to 15 unplaced buildings
      var show = unplaced.slice(0, 15);
      for (var i = 0; i < show.length; i++) {
        var ub = show[i];
        var label = ub.name || ('Bina #' + ub.id);
        if (ub.bbCount) label += ' (' + ub.bbCount + ' BB)';
        html += '<div class="fp-ctx-item" data-action="place-here" data-bid="' + ub.id + '">' + label + '</div>';
      }
      if (unplaced.length > 15) {
        html += '<div class="fp-ctx-item disabled" style="font-size:10px">...ve ' + (unplaced.length - 15) + ' bina daha</div>';
      }
      html += '<div class="fp-ctx-sep"></div>';
      html += '<div class="fp-ctx-item" data-action="place-all" style="color:#22c55e;font-weight:600">Tumunu Buraya Yerlestir</div>';
    } else {
      html += '<div class="fp-ctx-item disabled">Tum binalar yerlestirilmis</div>';
    }

    menu.innerHTML = html;
    document.body.appendChild(menu);

    // Keep menu within viewport
    var rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) menu.style.left = (e.clientX - rect.width) + 'px';
    if (rect.bottom > window.innerHeight) menu.style.top = (e.clientY - rect.height) + 'px';

    menu.addEventListener('click', function(ev) {
      var action = ev.target.dataset.action;
      if (!action) return;

      if (action === 'place-here') {
        var bid = parseInt(ev.target.dataset.bid, 10);
        var bld = ada.buildings.find(function(b) { return b.id === bid; });
        if (bld) {
          bld.lat = latlng.lat;
          bld.lng = latlng.lng;
          PonEngine.recalculateAda(ada);
          Storage.autoSave();
          render();
          Panels.refresh();
          Panels.showNotification(bld.name + ' yerlestirildi', 'success');
        }
      } else if (action === 'place-all') {
        // Place all unplaced buildings in a circle around the clicked point
        var step = (2 * Math.PI) / unplaced.length;
        var radius = 0.0003 + (unplaced.length * 0.00004);
        for (var j = 0; j < unplaced.length; j++) {
          var angle = step * j - (Math.PI / 2);
          unplaced[j].lat = latlng.lat + radius * Math.sin(angle);
          unplaced[j].lng = latlng.lng + radius * Math.cos(angle);
        }
        PonEngine.recalculateAda(ada);
        Storage.autoSave();
        render();
        Panels.refresh();
        Panels.showNotification(unplaced.length + ' bina yerlestirildi', 'success');
      }

      menu.remove();
    });

    // Close on click outside
    setTimeout(function() {
      document.addEventListener('click', function closeCtx(ev) {
        if (!menu.contains(ev.target)) {
          menu.remove();
          document.removeEventListener('click', closeCtx);
        }
      });
    }, 50);
  }

  /**
   * Show the map overlay
   */
  function show() {
    if (!mapContainer) init();
    mapContainer.style.display = 'flex';
    visible = true;
    // Leaflet needs invalidateSize after container becomes visible
    setTimeout(function() {
      if (map) {
        map.invalidateSize();
        updateCoordDisplay();
      }
      render();
    }, 150);
  }

  /**
   * Hide the map overlay
   */
  function hide() {
    if (mapContainer) mapContainer.style.display = 'none';
    visible = false;
  }

  /**
   * Toggle map visibility, returns new state
   */
  function toggle() {
    if (visible) hide();
    else show();
    return visible;
  }

  /**
   * Check if map is currently visible
   */
  function isVisible() {
    return visible;
  }

  /**
   * Get the Leaflet map instance (for DrawPolygon etc.)
   */
  function getMap() {
    return map;
  }

  /**
   * Set the help text in the header bar
   */
  function setHelpText(text) {
    var el = document.getElementById('fp-map-help');
    if (el) el.textContent = text || '';
  }

  /**
   * Clear all overlay layers
   */
  function clear() {
    var i;
    for (i = 0; i < markers.length; i++) {
      if (map) map.removeLayer(markers[i]);
    }
    for (i = 0; i < cableLines.length; i++) {
      if (map) map.removeLayer(cableLines[i]);
    }
    for (i = 0; i < boundaryPolygons.length; i++) {
      if (map) map.removeLayer(boundaryPolygons[i]);
    }
    markers = [];
    cableLines = [];
    boundaryPolygons = [];
  }

  /**
   * Render all visible adas on the map
   */
  function render() {
    if (!map || !visible) return;
    clear();

    var adasToRender = Topology.getVisibleAdas();

    for (var i = 0; i < adasToRender.length; i++) {
      var ada = adasToRender[i];
      renderAdaBoundary(ada);
      renderAdaCables(ada);
      renderAdaPtpLinks(ada);
      renderAdaBuildings(ada);
    }

    fitBounds(adasToRender);

    // Update legend for active ada
    var activeAda = Topology.getActiveAda();
    updateLegend(activeAda);
  }

  /**
   * Render ada boundary polygon if exists
   */
  function renderAdaBoundary(ada) {
    if (!ada.boundary || !ada.boundary.coordinates || !ada.boundary.coordinates[0]) return;
    var ring = ada.boundary.coordinates[0];
    var latlngs = ring.map(function(c) { return [c[1], c[0]]; });
    var poly = L.polygon(latlngs, {
      color: '#facc15',
      weight: 2,
      dashArray: '8 5',
      fillColor: '#facc15',
      fillOpacity: 0.06,
      interactive: false
    }).addTo(map);
    poly.bindTooltip(ada.name + ' siniri', { sticky: true });
    boundaryPolygons.push(poly);

    // Ada code label inside boundary (top area to avoid building overlap)
    var adaCode = ada.code || 'DA-' + String(ada.id).padStart(3, '0');
    var bounds = poly.getBounds();
    // Place label at the north (top) of boundary, slightly inward
    var labelLat = bounds.getNorth() - (bounds.getNorth() - bounds.getSouth()) * 0.08;
    var labelLng = (bounds.getWest() + bounds.getEast()) / 2;

    var codeLabel = L.marker([labelLat, labelLng], {
      icon: L.divIcon({
        className: 'fp-boundary-code',
        html: '<span>' + adaCode + '</span>',
        iconSize: [80, 22],
        iconAnchor: [40, 11]
      }),
      interactive: false,
      zIndexOffset: -500
    }).addTo(map);
    markers.push(codeLabel);
  }

  /**
   * Render cable lines for an ada
   */
  function renderAdaCables(ada) {
    var cables = ada.calculations.cables || [];
    for (var ci = 0; ci < cables.length; ci++) {
      var cable = cables[ci];
      if (cable.type === 'drop') continue;
      if (!cable.from) continue;

      var b1 = ada.buildings.find(function(b) { return b.id === cable.from; });
      var b2 = ada.buildings.find(function(b) { return b.id === cable.to; });
      if (!b1 || !b2) continue;
      if (!b1.lat && !b1.lng) continue;
      if (!b2.lat && !b2.lng) continue;

      var coreStyle = getCoreStyle(cable.cores);
      var line = L.polyline([[b1.lat, b1.lng], [b2.lat, b2.lng]], {
        color: coreStyle.color,
        weight: coreStyle.weight,
        opacity: 0.85,
        dashArray: cable.type === 'ring' ? '8 5' : null
      }).addTo(map);

      var typeLabel = { backbone: 'Backbone', distribution: 'Dagitim', drop: 'Drop', ring: 'Ring' }[cable.type] || cable.type;
      var vertInfo = cable.vertDistanceM ? ' (yatay:' + cable.horizDistanceM + '+dikey:' + cable.vertDistanceM + ')' : '';
      line.bindTooltip(typeLabel + ' \u00b7 ' + cable.cores + ' kor \u00b7 ' + cable.distanceM + 'm' + vertInfo, { sticky: true });

      // Permanent meterage label at cable midpoint
      var midLat = (b1.lat + b2.lat) / 2;
      var midLng = (b1.lng + b2.lng) / 2;
      var metLabel = L.marker([midLat, midLng], {
        icon: L.divIcon({
          className: 'fp-cable-label',
          html: '<span style="color:' + coreStyle.color + '">' + cable.distanceM + 'm</span>',
          iconSize: [50, 14], iconAnchor: [25, 7]
        }),
        interactive: false
      }).addTo(map);
      markers.push(metLabel);

      // Click to delete cable
      (function(cFrom, cTo, adaRef, b1Name, b2Name, typeLbl) {
        line.on('click', function(e) {
          L.DomEvent.stopPropagation(e);
          // Auto-copy MST to manual edges if not done yet
          if (!adaRef.topology.manualEdges || adaRef.topology.manualEdges.length === 0) {
            Topology.copyMstToManualEdges(adaRef.id);
          }
          var popupHtml = '<div style="text-align:center;font-family:JetBrains Mono,monospace;font-size:11px;line-height:1.6">' +
            '<b>' + typeLbl + '</b><br>' +
            b1Name + ' \u2194 ' + b2Name + '<br>' +
            '<button id="fp-map-cable-del" style="margin-top:4px;padding:3px 12px;background:#ef4444;color:#fff;border:none;border-radius:4px;cursor:pointer;font-family:inherit;font-weight:700;font-size:11px">SIL \u00d7</button>' +
            '</div>';
          L.popup().setLatLng(e.latlng).setContent(popupHtml).openOn(map);
          setTimeout(function() {
            var delBtn = document.getElementById('fp-map-cable-del');
            if (delBtn) {
              delBtn.addEventListener('click', function() {
                map.closePopup();
                Topology.removeManualEdge(adaRef.id, cFrom, cTo);
                PonEngine.recalculateAda(adaRef);
                Storage.autoSave();
                render();
                Panels.refresh();
                Panels.showNotification('Kablo silindi: ' + b1Name + ' \u2194 ' + b2Name, 'info');
              });
            }
          }, 50);
        });
      })(cable.from, cable.to, ada, b1.name, b2.name, typeLabel);

      cableLines.push(line);
    }

    // Ring closure (optional - respects noRing flag)
    if (ada.topology.ringCable && !ada.topology.noRing) {
      var rb1 = ada.buildings.find(function(b) { return b.id === ada.topology.ringCable.from; });
      var rb2 = ada.buildings.find(function(b) { return b.id === ada.topology.ringCable.to; });
      if (rb1 && rb2 && (rb1.lat || rb1.lng) && (rb2.lat || rb2.lng)) {
        var rCoreStyle = getCoreStyle(ada.topology.ringCable.cores);
        var rLine = L.polyline([[rb1.lat, rb1.lng], [rb2.lat, rb2.lng]], {
          color: rCoreStyle.color, weight: rCoreStyle.weight, opacity: 0.6, dashArray: '8 5'
        }).addTo(map);
        rLine.bindTooltip('Ring \u00b7 ' + ada.topology.ringCable.cores + ' kor', { sticky: true });

        // Click to delete ring cable
        (function(adaRef, rb1Name, rb2Name) {
          rLine.on('click', function(e) {
            L.DomEvent.stopPropagation(e);
            var popupHtml = '<div style="text-align:center;font-family:JetBrains Mono,monospace;font-size:11px;line-height:1.6">' +
              '<b>Ring Kablosu</b><br>' +
              rb1Name + ' \u2194 ' + rb2Name + '<br>' +
              '<button id="fp-map-ring-del" style="margin-top:4px;padding:3px 12px;background:#ef4444;color:#fff;border:none;border-radius:4px;cursor:pointer;font-family:inherit;font-weight:700;font-size:11px">RING SIL \u00d7</button>' +
              '</div>';
            L.popup().setLatLng(e.latlng).setContent(popupHtml).openOn(map);
            setTimeout(function() {
              var delBtn = document.getElementById('fp-map-ring-del');
              if (delBtn) {
                delBtn.addEventListener('click', function() {
                  map.closePopup();
                  adaRef.topology.noRing = true;
                  adaRef.topology.ringCable = null;
                  Storage.autoSave();
                  render();
                  Panels.refresh();
                  Panels.showNotification('Ring kablosu kaldirildi', 'info');
                });
              }
            }, 50);
          });
        })(ada, rb1.name, rb2.name);

        cableLines.push(rLine);
      }
    }
  }

  /**
   * Render PTP wireless links for an ada
   */
  function renderAdaPtpLinks(ada) {
    var links = ada.topology.ptpLinks || [];
    for (var i = 0; i < links.length; i++) {
      var ptp = links[i];
      var b1 = ada.buildings.find(function(x) { return x.id === ptp.fromBuildingId; });
      var b2 = ada.buildings.find(function(x) { return x.id === ptp.toBuildingId; });
      if (!b1 || !b2) continue;
      if ((!b1.lat && !b1.lng) || (!b2.lat && !b2.lng)) continue;

      var style = CABLE_STYLES.ptp;
      var line = L.polyline([[b1.lat, b1.lng], [b2.lat, b2.lng]], {
        color: style.color,
        weight: style.weight,
        opacity: style.opacity,
        dashArray: style.dashArray
      }).addTo(map);

      line.bindTooltip('PTP: ' + ptp.device + ' \u00b7 ' + ptp.throughputMbps + ' Mbps' + (ptp.distanceM ? ' \u00b7 ' + ptp.distanceM + 'm' : ''), { sticky: true });
      cableLines.push(line);
    }
  }

  /**
   * Render building markers for an ada
   */
  function renderAdaBuildings(ada) {
    for (var i = 0; i < ada.buildings.length; i++) {
      var b = ada.buildings[i];
      if (!b.lat && !b.lng) continue;

      var isOLT = b.id === ada.topology.oltBuildingId;
      var isFDH = ada.topology.fdhNodes && ada.topology.fdhNodes.some(function(f) { return f.buildingId === b.id; });
      var spl = PonEngine.calcSplitter(b.bb);
      var splData = ada.calculations.splitters
        ? ada.calculations.splitters.find(function(s) { return s.buildingId === b.id; })
        : null;
      // Build splitter string for icon display
      var splStr = null;
      if (splData && splData.cascade) {
        if (splData.cascade.level1) {
          splStr = '1:' + splData.cascade.level1.ratio + '\u2192' + '1:' + splData.cascade.level2.ratio;
        } else if (splData.cascade.level2) {
          splStr = '1:' + splData.cascade.level2.ratio;
        }
      }
      if (!splStr) {
        splStr = spl.map(function(s) { return '1:' + s.ratio; }).join('+');
      }
      var cascadeStr = (splData && splData.cascade && splData.cascade.level1)
        ? 'Cascade: 1:' + splData.cascade.level1.ratio + ' \u2192 1:' + splData.cascade.level2.ratio
        : spl.map(function(s) { return '1:' + s.ratio; }).join('+');
      var icon = MapUtils.createPentagonIcon(b, ada, splStr);

      var marker = L.marker([b.lat, b.lng], { icon: icon, draggable: true }).addTo(map);
      marker._fpBuildingId = b.id;
      marker._fpAdaId = ada.id;

      // Build popup content
      var popup = '<b>' + b.name + '</b>';
      if (isOLT) popup += ' <span style="color:#8b5cf6;font-weight:700">OLT</span>';
      if (isFDH) popup += ' <span style="color:#3b82f6;font-weight:700">FDH</span>';
      popup += '<br>' + ada.name + '<br>' + b.addr + '<br>';
      popup += b.bb + ' BB \u00b7 ' + cascadeStr + '<br>';
      popup += 'Kat: ' + b.floor;

      if (isOLT && ada.calculations.oltCapacity) {
        var cap = ada.calculations.oltCapacity;
        var capColor = cap.status === 'critical' ? '#ef4444' : cap.status === 'warning' ? '#f59e0b' : '#22c55e';
        popup += '<br><span style="color:' + capColor + ';font-weight:700">Port: ' + cap.requiredPorts + ' \u00b7 %' + cap.utilization + '</span>';
      }

      if (isFDH) {
        var fdhInfo = ada.topology.fdhNodes.find(function(f) { return f.buildingId === b.id; });
        if (fdhInfo) {
          popup += '<br><span style="color:#3b82f6">FDH: ' + fdhInfo.servedBuildingIds.length + ' bina \u00b7 ' + fdhInfo.totalBB + ' BB</span>';
        }
      }

      marker.bindPopup(popup);

      // Drag + click + context menu (closure for loop capture)
      (function(building, adaRef) {
        marker.on('dragend', function(e) {
          var pos = e.target.getLatLng();
          building.lat = pos.lat;
          building.lng = pos.lng;
          autoPlaceBuildings(adaRef);
          PonEngine.recalculateAda(adaRef);
          render();
          Panels.refresh();
          Storage.autoSave();
        });
        // Mode-based marker click
        marker.on('click', function(e) {
          if (mapMode.current === 'cable') {
            handleMapCableClick(building.id, adaRef);
            return;
          }
          if (mapMode.current === 'olt') {
            Topology.setOLT(adaRef, building.id);
            PonEngine.recalculateAda(adaRef);
            deactivateMode();
            render();
            Panels.refresh();
            Storage.autoSave();
            Panels.showNotification(building.name + ' \u2192 OLT atandi', 'success');
            return;
          }
          if (typeof Panels !== 'undefined' && Panels._cableActive && Panels._cableActive()) {
            Panels._handleCableClick(building.id, adaRef);
          }
        });
        marker.on('contextmenu', function(e) {
          L.DomEvent.stopPropagation(e);
          Panels.showBuildingContextMenu(e.originalEvent, building, adaRef);
        });
      })(b, ada);

      markers.push(marker);
    }
  }

  /**
   * Fit map bounds to show all visible buildings
   */
  function fitBounds(adas) {
    var coords = [];
    for (var a = 0; a < adas.length; a++) {
      for (var bi = 0; bi < adas[a].buildings.length; bi++) {
        var bldg = adas[a].buildings[bi];
        if (bldg.lat || bldg.lng) coords.push([bldg.lat, bldg.lng]);
      }
    }
    if (coords.length > 1) map.fitBounds(coords, { padding: [30, 30] });
    else if (coords.length === 1) map.setView(coords[0], 17);
  }

  // Public API
  return {
    init: init,
    show: show,
    hide: hide,
    toggle: toggle,
    isVisible: isVisible,
    getMap: getMap,
    setHelpText: setHelpText,
    clear: clear,
    render: render,
    fitBounds: fitBounds,
    startPlaceMode: startPlaceMode,
    stopPlaceMode: stopPlaceMode,
    activateMode: activateMode,
    deactivateMode: deactivateMode,
    isMode: isMode,
    autoPlaceBuildings: autoPlaceBuildings,
    updateLegend: updateLegend,
    CABLE_STYLES: CABLE_STYLES,
    CORE_COLORS: CORE_COLORS,
    CITY_PRESETS: CITY_PRESETS
  };
})();
