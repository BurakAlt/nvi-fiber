/**
 * NVI Portal Scraper - DOM interaction with adres.nvi.gov.tr
 * Extracts building data from NVI address query result tables
 *
 * NVI DOM Structure (per bağımsız bölüm row):
 *   <tr bagimsizbolumkimlikno="1111991293">
 *     <td data-title="Numarataj Kimlik No"><label id="binaNo">349214767</label></td>
 *     <td data-title="Ada"><label id="ada">574</label></td>
 *     <td data-title="Parsel"><label id="parsel">246</label></td>
 *     <td data-title="Apartman/Blok Adı"><label id="blokAdi">AKASYA SITESI B BLOK</label></td>
 *     <td data-title="Dış Kapı No"><label id="disKapiNo">8</label></td>
 *     <td data-title="Kullanım Amacı"><label id="yapiKullanimAmacFormatted">Mesken</label></td>
 *     ... <label id="acikAdresAciklama">full address</label>
 *     <button class="haritaDogrulaButton">Doğrula</button>
 *   </tr>
 *
 * Key insight: Each <tr> = 1 bağımsız bölüm (BB).
 * Buildings are grouped by binaNo (Numarataj Kimlik No).
 * Ada field provides direct ada grouping.
 */

const NviScraper = (() => {

  // Auto-polling state
  let lastTableHash = '';
  let pollingIntervalId = null;

  // Real NVI DOM selectors
  const SELECTORS = {
    // Result table rows - each row is one bağımsız bölüm
    bbRow: 'tr[bagimsizbolumkimlikno]',
    // Fields inside each row (label IDs)
    binaNo: '#binaNo',
    ada: '#ada',
    parsel: '#parsel',
    pafta: '#pafta',
    blokAdi: '#blokAdi',
    siteAdi: '#siteAdi',
    disKapiNo: '#disKapiNo',
    icKapiNo: '#icKapiNo',
    acikAdres: '#acikAdresAciklama',
    kullanimAmaci: '#yapiKullanimAmacFormatted',
    bbDurum: '#maksBbDurumFormatted',
    bbTip: '#maksBbTipFormatted',
    postaKodu: '#postaKodu',
    adresNo: '#adresNo',
    // Map verify button
    verifyBtn: '.haritaDogrulaButton',
    // Map container (appears after Doğrula click)
    mapContainer: '.leaflet-container, #map, [class*="harita"]'
  };

  /**
   * Wait for an element to appear in DOM
   */
  function waitForElement(selector, timeout) {
    timeout = timeout || 10000;
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(selector);
      if (existing) { resolve(existing); return; }

      const observer = new MutationObserver((mutations, obs) => {
        const el = document.querySelector(selector);
        if (el) { obs.disconnect(); resolve(el); }
      });
      observer.observe(document.body, { childList: true, subtree: true });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`[FiberPlan] Timeout: ${selector}`));
      }, timeout);
    });
  }

  /**
   * Extract label text from a row by data-title attribute
   */
  function getFieldByTitle(row, title) {
    const td = row.querySelector(`td[data-title="${title}"]`);
    if (!td) return '';
    const label = td.querySelector('label');
    return label ? label.textContent.trim() : td.textContent.trim();
  }

  /**
   * Extract label text from a row by label ID
   * Note: NVI reuses IDs across rows, so we scope to the row
   */
  function getFieldById(row, labelId) {
    const label = row.querySelector(`label[id="${labelId}"]`);
    return label ? label.textContent.trim() : '';
  }

  /**
   * Scrape all bağımsız bölüm rows from the result table
   * Returns raw row data array
   */
  function scrapeAllRows() {
    const rows = document.querySelectorAll(SELECTORS.bbRow);
    const data = [];

    rows.forEach(row => {
      data.push({
        bbKimlikNo: row.getAttribute('bagimsizbolumkimlikno') || '',
        binaNo: getFieldById(row, 'binaNo'),
        ada: getFieldById(row, 'ada'),
        parsel: getFieldById(row, 'parsel'),
        pafta: getFieldById(row, 'pafta'),
        blokAdi: getFieldById(row, 'blokAdi'),
        siteAdi: getFieldById(row, 'siteAdi'),
        disKapiNo: getFieldById(row, 'disKapiNo'),
        icKapiNo: getFieldById(row, 'icKapiNo'),
        acikAdres: getFieldById(row, 'acikAdresAciklama'),
        kullanimAmaci: getFieldById(row, 'yapiKullanimAmacFormatted'),
        durum: getFieldById(row, 'maksBbDurumFormatted'),
        tip: getFieldById(row, 'maksBbTipFormatted'),
        postaKodu: getFieldById(row, 'postaKodu'),
        adresNo: getFieldById(row, 'adresNo'),
        rowElement: row
      });
    });

    return data;
  }

  /**
   * Group raw BB rows into buildings (by physical building identity)
   * Uses ada+parsel+disKapiNo as composite key to handle NVI's multiple
   * binaNo values for the same physical building (e.g. mesken vs ticaret).
   * Falls back to binaNo when composite key fields are missing.
   * Each building = { binaNo, binaNoList, name, addr, bb, ada, parsel, disKapiNo, rows[] }
   */
  function groupByBuilding(rows) {
    const map = new Map();

    for (const row of rows) {
      const binaNo = row.binaNo;
      if (!binaNo || binaNo === '-') continue;

      // Composite key: ada+parsel+disKapiNo identifies a physical building
      // Falls back to binaNo when ada/disKapiNo are missing
      var key;
      if (row.ada && row.ada !== '-' && row.disKapiNo && row.disKapiNo !== '-') {
        key = row.ada + '_' + (row.parsel || '0') + '_' + row.disKapiNo;
      } else {
        key = binaNo;
      }

      if (!map.has(key)) {
        // Determine building name: blokAdi > siteAdi > "Bina No:disKapiNo"
        let name = row.blokAdi;
        if (!name || name === '-') name = row.siteAdi;
        if (!name || name === '-') name = `Bina No:${row.disKapiNo}`;

        map.set(key, {
          binaNo: binaNo,
          binaNoList: [binaNo],
          name: name,
          addr: row.acikAdres || '',
          ada: row.ada || '',
          parsel: row.parsel || '',
          disKapiNo: row.disKapiNo || '',
          bb: 0,
          rows: [],
          // Will be filled from map coordinates
          lat: 0,
          lng: 0,
          floor: 0,
          hasElectric: true
        });
      }

      const building = map.get(key);
      building.bb++;
      building.rows.push(row);
      // Track all binaNo values belonging to this physical building
      if (building.binaNoList.indexOf(binaNo) === -1) {
        building.binaNoList.push(binaNo);
      }
    }

    return Array.from(map.values());
  }

  /**
   * Group buildings by ada number
   * Returns Map<adaNo, building[]>
   */
  function groupByAda(buildings) {
    const map = new Map();
    for (const b of buildings) {
      const key = b.ada || 'unknown';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(b);
    }
    return map;
  }

  /**
   * Full extraction pipeline: scrape → group by building → group by ada
   * Returns { buildings[], adaGroups: Map<adaNo, building[]> }
   */
  function extractAll() {
    const rows = scrapeAllRows();
    const buildings = groupByBuilding(rows);
    const adaGroups = groupByAda(buildings);

    console.log(`[FiberPlan] Scraped: ${rows.length} BB rows → ${buildings.length} buildings → ${adaGroups.size} adas`);

    return { rows, buildings, adaGroups };
  }

  /**
   * Extract data from a single selected row
   */
  function extractFromRow(row) {
    return {
      bbKimlikNo: row.getAttribute('bagimsizbolumkimlikno') || '',
      binaNo: getFieldById(row, 'binaNo'),
      ada: getFieldById(row, 'ada'),
      parsel: getFieldById(row, 'parsel'),
      blokAdi: getFieldById(row, 'blokAdi'),
      siteAdi: getFieldById(row, 'siteAdi'),
      disKapiNo: getFieldById(row, 'disKapiNo'),
      acikAdres: getFieldById(row, 'acikAdresAciklama'),
      kullanimAmaci: getFieldById(row, 'yapiKullanimAmacFormatted')
    };
  }

  /**
   * Get NVI's map instance (appears after "Doğrula" button click)
   */
  function getNviMap() {
    const mapEl = document.querySelector('.leaflet-container');
    if (!mapEl) return null;

    // Try Leaflet internal reference
    for (const key of Object.keys(mapEl)) {
      if (key.startsWith('_leaflet')) {
        const val = mapEl[key];
        if (val && typeof val.getCenter === 'function') return val;
      }
    }

    // Fallback: global scope
    if (typeof map !== 'undefined' && map && typeof map.getCenter === 'function') return map;
    if (typeof haritaMap !== 'undefined' && haritaMap) return haritaMap;
    return null;
  }

  /**
   * Observe "Doğrula" button clicks to capture map coordinates
   * When user clicks verify, NVI opens a map - we capture the coordinates.
   *
   * Key insight: Content scripts run in Chrome's ISOLATED world, so
   * Leaflet's _leaflet_* properties on DOM elements are invisible.
   * We inject a <script> that runs in the MAIN world, reads the map
   * center, and sends it back via window.postMessage.
   */
  function observeVerifyButtons(callback) {
    // Track the most recent verify click's row data so the
    // postMessage handler can merge coordinates with building info
    var pendingVerify = null;

    // Listen for coordinates posted from the MAIN world injected script
    window.addEventListener('message', function(e) {
      if (!e.data || e.data.type !== 'fp-nvi-map-coords') return;
      if (!pendingVerify) return;

      var lat = e.data.lat;
      var lng = e.data.lng;
      if (lat && lng) {
        console.log('[FiberPlan] Coords from MAIN world: ' + lat + ', ' + lng);
        callback({
          bbKimlikNo: pendingVerify.bbKimlikNo,
          binaNo: pendingVerify.binaNo,
          ada: pendingVerify.ada,
          parsel: pendingVerify.parsel,
          blokAdi: pendingVerify.blokAdi,
          siteAdi: pendingVerify.siteAdi,
          disKapiNo: pendingVerify.disKapiNo,
          acikAdres: pendingVerify.acikAdres,
          kullanimAmaci: pendingVerify.kullanimAmaci,
          lat: lat,
          lng: lng
        });
      }
      pendingVerify = null;
    });

    // Use event delegation on document body
    document.body.addEventListener('click', function(e) {
      var btn = e.target.closest('.haritaDogrulaButton');
      if (!btn) return;

      var row = btn.closest('tr[bagimsizbolumkimlikno]');
      if (!row) return;

      var rowData = extractFromRow(row);
      pendingVerify = rowData;
      console.log('[FiberPlan] Dogrula clicked: ' + rowData.blokAdi + ' (binaNo: ' + rowData.binaNo + ')');

      // Wait for map container to appear, then inject MAIN world script
      waitForElement(SELECTORS.mapContainer, 5000)
        .then(function() {
          // Delay to let Leaflet fully initialize the map
          setTimeout(function() {
            injectMainWorldCoordReader();
          }, 1000);
        })
        .catch(function(err) {
          console.warn('[FiberPlan] Map did not appear:', err);
        });
    });
  }

  /**
   * Inject a script element that runs in the MAIN world to read
   * Leaflet map center coordinates and post them back via postMessage.
   */
  function injectMainWorldCoordReader() {
    var script = document.createElement('script');
    script.textContent = '(' + function() {
      try {
        var el = document.querySelector('.leaflet-container');
        if (!el) return;
        var keys = Object.keys(el);
        for (var i = 0; i < keys.length; i++) {
          if (keys[i].indexOf('_leaflet') === 0) {
            var val = el[keys[i]];
            if (val && typeof val.getCenter === 'function') {
              var c = val.getCenter();
              window.postMessage({
                type: 'fp-nvi-map-coords',
                lat: c.lat,
                lng: c.lng
              }, '*');
              return;
            }
          }
        }
      } catch (e) { /* silent */ }
    } + ')();';
    document.documentElement.appendChild(script);
    script.remove();
  }

  /**
   * Observe building row clicks for QGIS selection
   * Click on a table row → toggle building selection
   * callback receives: { binaNo, name, bb, ada, parsel, disKapiNo, splitter, addr }
   */
  var _selectedBinaNos = new Set();

  function observeBuildingClicks(callback) {
    document.body.addEventListener('click', function(e) {
      var row = e.target.closest(SELECTORS.bbRow);
      if (!row) return;

      var rowData = extractFromRow(row);
      if (!rowData.binaNo || rowData.binaNo === '-') return;

      var binaNo = rowData.binaNo;

      // Toggle selection (check if any binaNo for this building is selected)
      if (_selectedBinaNos.has(binaNo)) {
        // Deselect - first find the building to get all its binaNo values
        var allScrapedDel = scrapeAllRows();
        var buildingsDel = groupByBuilding(allScrapedDel);
        var bldgDel = null;
        for (var d = 0; d < buildingsDel.length; d++) {
          if (buildingsDel[d].binaNoList && buildingsDel[d].binaNoList.indexOf(binaNo) !== -1) {
            bldgDel = buildingsDel[d]; break;
          }
        }
        var delList = bldgDel ? bldgDel.binaNoList : [binaNo];
        for (var di = 0; di < delList.length; di++) _selectedBinaNos.delete(delList[di]);

        var allRows = document.querySelectorAll(SELECTORS.bbRow);
        allRows.forEach(function(r) {
          if (delList.indexOf(getFieldById(r, 'binaNo')) !== -1) {
            r.classList.remove('fp-row-selected');
          }
        });
        callback({ binaNo: bldgDel ? bldgDel.binaNo : binaNo, _deselect: true });
        return;
      }

      // Select - group building and calculate
      var allScraped = scrapeAllRows();
      var buildings = groupByBuilding(allScraped);
      var building = null;
      for (var i = 0; i < buildings.length; i++) {
        // Match by binaNoList (composite key may merge multiple binaNo)
        if (buildings[i].binaNoList && buildings[i].binaNoList.indexOf(binaNo) !== -1) {
          building = buildings[i];
          break;
        }
      }

      if (!building) return;

      // Calculate splitter
      var splitters = PonEngine.calcSplitter(building.bb);
      var splitterStr = splitters.length > 0 ? '1:' + splitters[0].ratio : '1:8';

      // Mark all binaNo values for this building as selected
      var bnList = building.binaNoList || [binaNo];
      for (var si = 0; si < bnList.length; si++) _selectedBinaNos.add(bnList[si]);

      // Highlight all rows belonging to this building (any binaNo in list)
      var allRows = document.querySelectorAll(SELECTORS.bbRow);
      allRows.forEach(function(r) {
        if (bnList.indexOf(getFieldById(r, 'binaNo')) !== -1) {
          r.classList.add('fp-row-selected');
        }
      });

      callback({
        binaNo: binaNo,
        name: building.name,
        bb: building.bb,
        ada: building.ada,
        parsel: building.parsel,
        disKapiNo: building.disKapiNo,
        splitter: splitterStr,
        addr: building.addr
      });
    });

    return _selectedBinaNos;
  }

  /**
   * Get currently selected binaNo set
   */
  function getSelectedBinaNos() {
    return _selectedBinaNos;
  }

  /**
   * Clear all selections
   */
  function clearSelections() {
    _selectedBinaNos.clear();
    var allRows = document.querySelectorAll(SELECTORS.bbRow);
    allRows.forEach(function(r) {
      r.classList.remove('fp-row-selected');
    });
  }

  /**
   * Start automatic table polling (1s interval)
   * Detects when NVI table content changes and auto-extracts buildings
   * callback receives grouped buildings array when table changes
   */
  function startAutoPolling(callback) {
    if (pollingIntervalId) return; // Already running

    console.log('[FiberPlan] Auto-polling started (1s interval)');

    pollingIntervalId = setInterval(() => {
      const rows = scrapeAllRows();
      if (rows.length === 0) {
        // Table empty — reset hash so next population triggers
        if (lastTableHash !== '') {
          lastTableHash = '';
          console.log('[FiberPlan] Table cleared, hash reset.');
        }
        return;
      }

      // Build hash from first row's full text + row count
      // This catches both content changes and row additions
      const firstRowText = rows[0].rowElement ? rows[0].rowElement.innerText : '';
      const hash = rows.length + ':' + firstRowText;

      if (hash === lastTableHash) return; // No change

      lastTableHash = hash;
      console.log(`[FiberPlan] Table changed: ${rows.length} BB rows detected`);

      const buildings = groupByBuilding(rows);
      if (buildings.length > 0) {
        callback(buildings);
      }
    }, 1000);
  }

  /**
   * Stop automatic table polling
   */
  function stopAutoPolling() {
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
      pollingIntervalId = null;
      lastTableHash = '';
      console.log('[FiberPlan] Auto-polling stopped.');
    }
  }

  /**
   * Check if we're on the NVI portal
   */
  function isNviPortal() {
    return window.location.hostname.includes('adres.nvi.gov.tr');
  }

  /**
   * Get count of BB rows currently in DOM
   */
  function getRowCount() {
    return document.querySelectorAll(SELECTORS.bbRow).length;
  }

  // Public API
  return {
    SELECTORS,
    waitForElement,
    scrapeAllRows,
    groupByBuilding,
    groupByAda,
    extractAll,
    extractFromRow,
    getNviMap,
    observeVerifyButtons,
    observeBuildingClicks,
    getSelectedBinaNos,
    clearSelections,
    startAutoPolling,
    stopAutoPolling,
    isNviPortal,
    getRowCount
  };
})();
