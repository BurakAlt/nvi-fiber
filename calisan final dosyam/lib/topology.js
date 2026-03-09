/**
 * Topology Manager - Ada-based project data model and operations
 * Manages PROJECT state, ada CRUD, building CRUD, multi-ada OLT grouping
 */

const Topology = (() => {
  // Project state
  const PROJECT = {
    meta: {
      name: '',
      city: '',
      district: '',
      date: new Date().toISOString().split('T')[0],
      standard: 'ITU-T G.984 GPON Class B+'
    },
    adas: [],
    oltGroups: [],       // Multi-ada OLT sharing groups
    activeAdaId: null,
    viewMode: 'all', // 'all' or specific ada id
    nextAdaId: 1,
    nextBuildingId: 1,
    nextPtpId: 1,
    nextAdaCode: 1    // Sequential code counter for DA-NNN
  };

  /**
   * Create a new ada and set it as active
   */
  function generateAdaCode() {
    return 'DA-' + String(PROJECT.nextAdaCode++).padStart(3, '0');
  }

  function createAda(name) {
    var code = generateAdaCode();
    const ada = {
      id: PROJECT.nextAdaId++,
      code: code,
      name: name || `Ada ${PROJECT.nextAdaId - 1}`,
      createdAt: Date.now(),
      status: 'planning', // planning | completed
      buildings: [],
      boundary: null, // { type: 'Polygon', coordinates: [[[lng,lat], ...]] } GeoJSON
      topology: {
        oltBuildingId: null,
        antenBuildingId: null,
        arms: [],
        ringCable: null,
        backboneCable: null,
        fdhNodes: [],
        manualDistances: {},
        manualEdges: [],   // [{from: buildingId, to: buildingId}] user-drawn cables
        svgPositions: {},
        oltConfig: { manualPorts: null },
        ptpLinks: [],
        defaultPenetrationRate: 70,
        equipmentSelections: {}
      },
      calculations: {
        splitters: [],
        cables: [],
        lossBudget: [],
        inventory: [],
        oltCapacity: null,
        costs: { items: [], total: 0 }
      }
    };
    PROJECT.adas.push(ada);
    PROJECT.activeAdaId = ada.id;
    return ada;
  }

  /**
   * Get currently active ada
   */
  function getActiveAda() {
    return PROJECT.adas.find(a => a.id === PROJECT.activeAdaId);
  }

  /**
   * Get all buildings across all adas (flattened with adaId/adaName)
   */
  function getAllBuildings() {
    return PROJECT.adas.flatMap(a => a.buildings.map(b => ({ ...b, adaId: a.id, adaName: a.name })));
  }

  /**
   * Find ada by id
   */
  function getAda(adaId) {
    return PROJECT.adas.find(a => a.id === adaId);
  }

  /**
   * Add building to active ada
   */
  function addBuilding(ada, buildingData) {
    const building = {
      id: PROJECT.nextBuildingId++,
      name: buildingData.name,
      addr: buildingData.addr || '',
      bb: buildingData.bb || 12,
      lat: buildingData.lat || 0,
      lng: buildingData.lng || 0,
      floor: buildingData.floor || 0,
      hasElectric: buildingData.hasElectric !== false,
      // NVI-specific fields
      binaNo: buildingData.binaNo || '',
      adaNo: buildingData.adaNo || '',
      parsel: buildingData.parsel || '',
      // Penetration rate: null = use ada default
      penetrationRate: buildingData.penetrationRate || null,
      customPenetration: buildingData.customPenetration || false
    };
    ada.buildings.push(building);
    return building;
  }

  /**
   * Remove building from ada
   */
  function removeBuilding(ada, buildingId) {
    ada.buildings = ada.buildings.filter(b => b.id !== buildingId);
    if (ada.topology.oltBuildingId === buildingId) ada.topology.oltBuildingId = null;
    if (ada.topology.antenBuildingId === buildingId) ada.topology.antenBuildingId = null;
    // Clean up FDH references
    if (ada.topology.fdhNodes) {
      ada.topology.fdhNodes = ada.topology.fdhNodes
        .map(f => ({
          ...f,
          servedBuildingIds: f.servedBuildingIds.filter(id => id !== buildingId)
        }))
        .filter(f => f.buildingId !== buildingId && f.servedBuildingIds.length > 0);
    }
  }

  /**
   * Complete ada - set OLT, antenna, mark completed
   */
  function completeAda(ada) {
    if (ada.buildings.length === 0) return false;
    ada.topology.oltBuildingId = PonEngine.findOptimalOLT(ada.buildings);
    ada.topology.antenBuildingId = ada.topology.oltBuildingId;
    ada.status = 'completed';
    PonEngine.recalculateAda(ada);
    return true;
  }

  /**
   * Delete ada
   */
  function deleteAda(adaId) {
    PROJECT.adas = PROJECT.adas.filter(a => a.id !== adaId);
    if (PROJECT.activeAdaId === adaId) {
      PROJECT.activeAdaId = PROJECT.adas.length > 0 ? PROJECT.adas[0].id : null;
    }
    PROJECT.viewMode = 'all';
    // Re-group OLTs after ada deletion
    groupAdasByOLT();
  }

  /**
   * Clear all buildings and reset calculations for an ada
   */
  function clearAda(adaId) {
    var ada = PROJECT.adas.find(function(a) { return a.id === adaId; });
    if (!ada) return false;
    ada.buildings = [];
    ada.status = 'planning';
    ada.boundary = null;
    ada.topology = { oltBuildingId: null, antenBuildingId: null, arms: [], ringCable: null, backboneCable: null, fdhNodes: [], manualDistances: {}, svgPositions: {}, oltConfig: { manualPorts: null }, ptpLinks: [] };
    ada.calculations = { splitters: [], cables: [], lossBudget: [], inventory: [], oltCapacity: null, costs: { items: [], total: 0 } };
    return true;
  }

  /**
   * Rename an ada
   */
  function renameAda(adaId, newName) {
    var ada = PROJECT.adas.find(function(a) { return a.id === adaId; });
    if (!ada) return false;
    ada.name = newName;
    return true;
  }

  /**
   * Switch view to specific ada or 'all'
   */
  function switchView(adaId) {
    if (adaId === 'all') {
      PROJECT.viewMode = 'all';
    } else {
      PROJECT.activeAdaId = adaId;
      PROJECT.viewMode = adaId;
    }
  }

  /**
   * Set OLT building for ada
   */
  function setOLT(ada, buildingId) {
    ada.topology.oltBuildingId = buildingId;
    ada.topology.antenBuildingId = buildingId;
    PonEngine.recalculateAda(ada);
  }

  /**
   * Set antenna building for ada
   */
  function setAntenna(ada, buildingId) {
    ada.topology.antenBuildingId = buildingId;
    PonEngine.recalculateAda(ada);
  }

  /**
   * Recalculate all adas and re-group OLTs
   */
  function recalculateAll() {
    // Migrate: ensure all adas have codes
    if (!PROJECT.nextAdaCode) PROJECT.nextAdaCode = 1;
    for (var i = 0; i < PROJECT.adas.length; i++) {
      if (!PROJECT.adas[i].code) {
        PROJECT.adas[i].code = 'DA-' + String(PROJECT.nextAdaCode++).padStart(3, '0');
      }
    }
    // Ensure nextAdaCode is higher than any existing code
    for (var m = 0; m < PROJECT.adas.length; m++) {
      var ec = PROJECT.adas[m].code;
      if (ec && ec.indexOf('DA-') === 0) {
        var n = parseInt(ec.substring(3), 10);
        if (!isNaN(n) && n >= PROJECT.nextAdaCode) {
          PROJECT.nextAdaCode = n + 1;
        }
      }
    }
    for (const ada of PROJECT.adas) PonEngine.recalculateAda(ada);
    groupAdasByOLT();
  }

  // ─── MULTI-ADA OLT SHARING ──────────────────────────────────────

  /**
   * Group nearby adas to share OLT infrastructure
   * Adas within 500m with combined BB ≤ 128 share one OLT
   */
  function groupAdasByOLT() {
    const completedAdas = PROJECT.adas.filter(a => a.status === 'completed' && a.topology.oltBuildingId);
    if (completedAdas.length === 0) {
      PROJECT.oltGroups = [];
      return;
    }

    const assigned = new Set();
    const groups = [];
    const maxDist = 500; // meters
    const maxBB = PonEngine.CONSTANTS.maxBBPerPort;

    for (const ada of completedAdas) {
      if (assigned.has(ada.id)) continue;

      const oltB = ada.buildings.find(b => b.id === ada.topology.oltBuildingId);
      if (!oltB) continue;

      const group = {
        oltBuildingId: ada.topology.oltBuildingId,
        oltBuildingName: oltB.name,
        adas: [ada.id],
        adaNames: [ada.name],
        totalBB: ada.buildings.reduce((s, b) => s + b.bb, 0),
        requiredPorts: 1
      };
      assigned.add(ada.id);

      // Find nearby adas that can join this group
      for (const other of completedAdas) {
        if (assigned.has(other.id)) continue;
        const otherOlt = other.buildings.find(b => b.id === other.topology.oltBuildingId);
        if (!otherOlt) continue;

        const dist = PonEngine.safeDist(oltB, otherOlt);
        const otherBB = other.buildings.reduce((s, b) => s + b.bb, 0);

        if (dist <= maxDist && (group.totalBB + otherBB) <= maxBB * 2) {
          group.adas.push(other.id);
          group.adaNames.push(other.name);
          group.totalBB += otherBB;
          assigned.add(other.id);
        }
      }

      // Calculate required ports for the group (use effective BB)
      var groupEffBB = 0;
      for (var gi = 0; gi < group.adas.length; gi++) {
        var gAda = PROJECT.adas.find(function(a) { return a.id === group.adas[gi]; });
        if (gAda) {
          for (var gbi = 0; gbi < gAda.buildings.length; gbi++) {
            groupEffBB += PonEngine.getEffectiveBB(gAda.buildings[gbi], gAda);
          }
        }
      }
      group.totalEffBB = groupEffBB;
      group.requiredPorts = Math.max(1,
        Math.ceil(group.totalBB / maxBB),
        Math.ceil(groupEffBB / PonEngine.CONSTANTS.maxONTPerPort)
      );

      groups.push(group);
    }

    PROJECT.oltGroups = groups;
  }

  /**
   * Get OLT group for a specific ada
   */
  function getOLTGroup(adaId) {
    return PROJECT.oltGroups.find(g => g.adas.includes(adaId));
  }

  /**
   * Set manual distance between two buildings in an ada
   * Uses sorted key (smaller id first) to avoid duplicates
   */
  function setManualDistance(adaId, fromId, toId, meters) {
    var ada = PROJECT.adas.find(function(a) { return a.id === adaId; });
    if (!ada) return false;
    if (!ada.topology.manualDistances) ada.topology.manualDistances = {};
    var key = Math.min(fromId, toId) + '-' + Math.max(fromId, toId);
    ada.topology.manualDistances[key] = meters;
    return true;
  }

  /**
   * Set manual parent (upstream connection) for a building
   * Overrides MST routing: cable goes from parentId → buildingId
   * Pass null to clear override and revert to auto MST
   */
  function setManualParent(adaId, buildingId, parentId) {
    var ada = PROJECT.adas.find(function(a) { return a.id === adaId; });
    if (!ada) return false;
    if (!ada.topology.manualParents) ada.topology.manualParents = {};
    if (parentId === null || parentId === undefined) {
      delete ada.topology.manualParents[buildingId];
    } else {
      ada.topology.manualParents[buildingId] = parentId;
    }
    PonEngine.recalculateAda(ada);
    return true;
  }

  /**
   * Add a manual cable edge (user-drawn connection)
   * Does NOT recalculate - user calls HESAPLA when ready
   * Updates mstEdges for layout display only
   */
  function addManualEdge(adaId, fromId, toId) {
    var ada = PROJECT.adas.find(function(a) { return a.id === adaId; });
    if (!ada) return null;
    if (fromId === toId) return null;
    if (!ada.topology.manualEdges) ada.topology.manualEdges = [];
    // Check duplicate (both directions)
    var dup = ada.topology.manualEdges.find(function(e) {
      return (e.from === fromId && e.to === toId) || (e.from === toId && e.to === fromId);
    });
    if (dup) return null;
    // Validate both buildings exist
    var fromB = ada.buildings.find(function(b) { return b.id === fromId; });
    var toB = ada.buildings.find(function(b) { return b.id === toId; });
    if (!fromB || !toB) return null;
    var edge = { from: fromId, to: toId };
    ada.topology.manualEdges.push(edge);
    // Update mstEdges for layout display (no full recalc)
    syncManualToMstEdges(ada);
    return edge;
  }

  /**
   * Remove a manual cable edge
   * Does NOT recalculate - user calls HESAPLA when ready
   */
  function removeManualEdge(adaId, fromId, toId) {
    var ada = PROJECT.adas.find(function(a) { return a.id === adaId; });
    if (!ada || !ada.topology.manualEdges) return false;
    var idx = ada.topology.manualEdges.findIndex(function(e) {
      return (e.from === fromId && e.to === toId) || (e.from === toId && e.to === fromId);
    });
    if (idx === -1) return false;
    ada.topology.manualEdges.splice(idx, 1);
    // Update mstEdges for layout display (no full recalc)
    syncManualToMstEdges(ada);
    return true;
  }

  /**
   * Clear all manual edges (revert to auto MST)
   */
  function clearManualEdges(adaId) {
    var ada = PROJECT.adas.find(function(a) { return a.id === adaId; });
    if (!ada) return false;
    ada.topology.manualEdges = [];
    PonEngine.recalculateAda(ada);
    return true;
  }

  /**
   * Copy current auto MST edges into manualEdges for editing
   */
  function copyMstToManualEdges(adaId) {
    var ada = PROJECT.adas.find(function(a) { return a.id === adaId; });
    if (!ada) return false;
    var mst = ada.topology.mstEdges || [];
    ada.topology.manualEdges = mst.map(function(e) {
      return { from: e.from, to: e.to };
    });
    return true;
  }

  /**
   * Sync manualEdges → mstEdges (for layout only, no recalc)
   */
  function syncManualToMstEdges(ada) {
    var manDist = ada.topology.manualDistances || {};
    ada.topology.mstEdges = ada.topology.manualEdges.map(function(e) {
      var fromB = ada.buildings.find(function(b) { return b.id === e.from; });
      var toB = ada.buildings.find(function(b) { return b.id === e.to; });
      var dist = (fromB && toB && typeof PonEngine !== 'undefined')
        ? Math.round(PonEngine.getDistance(fromB, toB, manDist))
        : 0;
      return { from: e.from, to: e.to, distance: dist };
    });
  }

  /**
   * Add PTP wireless link to an ada
   */
  function addPtpLink(adaId, linkData) {
    var ada = PROJECT.adas.find(function(a) { return a.id === adaId; });
    if (!ada) return null;
    if (!ada.topology.ptpLinks) ada.topology.ptpLinks = [];
    var link = {
      id: PROJECT.nextPtpId++,
      fromBuildingId: linkData.fromBuildingId,
      toBuildingId: linkData.toBuildingId,
      device: linkData.device || 'airFiber 24',
      freqGHz: linkData.freqGHz || 24,
      distanceM: linkData.distanceM || 0,
      throughputMbps: linkData.throughputMbps || 1000,
      note: linkData.note || ''
    };
    ada.topology.ptpLinks.push(link);
    return link;
  }

  /**
   * Remove PTP link from an ada
   */
  function removePtpLink(adaId, linkId) {
    var ada = PROJECT.adas.find(function(a) { return a.id === adaId; });
    if (!ada || !ada.topology.ptpLinks) return false;
    ada.topology.ptpLinks = ada.topology.ptpLinks.filter(function(l) { return l.id !== linkId; });
    return true;
  }

  /**
   * Update PTP link
   */
  function updatePtpLink(adaId, linkId, updates) {
    var ada = PROJECT.adas.find(function(a) { return a.id === adaId; });
    if (!ada || !ada.topology.ptpLinks) return false;
    var link = ada.topology.ptpLinks.find(function(l) { return l.id === linkId; });
    if (!link) return false;
    for (var key in updates) {
      if (updates.hasOwnProperty(key)) link[key] = updates[key];
    }
    return true;
  }

  /**
   * Set ada boundary polygon from Leaflet latlngs
   * @param {number} adaId
   * @param {Array} latlngs - Leaflet [lat,lng] array
   */
  function setAdaBoundary(adaId, latlngs) {
    var ada = PROJECT.adas.find(function(a) { return a.id === adaId; });
    if (!ada) return false;
    // Convert Leaflet [lat,lng] to GeoJSON [lng,lat] ring (closed)
    var coords = latlngs.map(function(ll) { return [ll.lng || ll[1], ll.lat || ll[0]]; });
    // Close ring if not closed
    if (coords.length > 0) {
      var first = coords[0], last = coords[coords.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) coords.push([first[0], first[1]]);
    }
    ada.boundary = { type: 'Polygon', coordinates: [coords] };
    return true;
  }

  /**
   * Clear ada boundary polygon
   */
  function clearAdaBoundary(adaId) {
    var ada = PROJECT.adas.find(function(a) { return a.id === adaId; });
    if (!ada) return false;
    ada.boundary = null;
    return true;
  }

  /**
   * Store map screenshot and viewport bounds for geo-positioned dashboard
   * @param {number} adaId
   * @param {string} screenshotDataUrl - JPEG data URL
   * @param {Object} bounds - { north, south, east, west } lat/lng
   */
  function setMapSnapshot(adaId, screenshotDataUrl, bounds) {
    var ada = PROJECT.adas.find(function(a) { return a.id === adaId; });
    if (!ada) return false;
    ada.mapSnapshot = {
      screenshot: screenshotDataUrl,
      bounds: bounds,
      timestamp: Date.now()
    };
    return true;
  }

  /**
   * Set manual OLT port count for an ada
   * @param {number} adaId
   * @param {number|null} count - null=auto, 1|2|4|8
   */
  function setOltPortCount(adaId, count) {
    var ada = PROJECT.adas.find(function(a) { return a.id === adaId; });
    if (!ada) return false;
    if (!ada.topology.oltConfig) ada.topology.oltConfig = {};
    ada.topology.oltConfig.manualPorts = count;
    PonEngine.recalculateAda(ada);
    return true;
  }

  /**
   * Set SVG position for a building in an ada (visual only)
   */
  function setSvgPosition(adaId, buildingId, x, y) {
    var ada = PROJECT.adas.find(function(a) { return a.id === adaId; });
    if (!ada) return false;
    if (!ada.topology.svgPositions) ada.topology.svgPositions = {};
    ada.topology.svgPositions[buildingId] = { x: x, y: y };
    return true;
  }

  /**
   * Get adas to render based on current view mode
   */
  function getVisibleAdas() {
    if (PROJECT.viewMode === 'all') return PROJECT.adas.filter(a => a.buildings.length > 0);
    const ada = PROJECT.adas.find(a => a.id === PROJECT.viewMode);
    return ada ? [ada] : [];
  }

  /**
   * Export project as JSON
   */
  function exportJSON() {
    return JSON.stringify(PROJECT, null, 2);
  }

  /**
   * Export project as CSV
   */
  function exportCSV() {
    const headers = ['Ada', 'ID', 'Bina', 'Adres', 'BB', 'Kat', 'Splitter', 'Cascade', 'Kayip(dB)', 'Marj(dB)', 'OLT', 'FDH', 'Lat', 'Lng'];
    const rows = [];
    for (const ada of PROJECT.adas) {
      for (const b of ada.buildings) {
        const spl = PonEngine.calcSplitter(b.bb);
        const splData = ada.calculations.splitters?.find(s => s.buildingId === b.id);
        const loss = ada.calculations.lossBudget?.find(l => l.buildingId === b.id);
        const isFDH = ada.topology.fdhNodes?.some(f => f.buildingId === b.id);
        const cascadeStr = splData?.cascade?.level1
          ? `1:${splData.cascade.level1.ratio}+1:${splData.cascade.level2.ratio}`
          : spl.map(s => '1:' + s.ratio).join('+');

        rows.push([
          ada.name, b.id, b.name, `"${b.addr}"`, b.bb, b.floor,
          spl.map(s => '1:' + s.ratio).join('+'),
          cascadeStr,
          loss?.totalLoss || '', loss?.margin || '',
          b.id === ada.topology.oltBuildingId ? 'EVET' : '',
          isFDH ? 'EVET' : '',
          b.lat, b.lng
        ].join(','));
      }
    }
    return '\uFEFF' + [headers.join(','), ...rows].join('\n');
  }

  /**
   * Export project as GeoJSON FeatureCollection
   * Points: buildings + FDH nodes, LineStrings: cables
   * Coordinates: WGS84 (EPSG:4326), [lng, lat] order
   */
  function exportGeoJSON() {
    var features = [];

    for (var a = 0; a < PROJECT.adas.length; a++) {
      var ada = PROJECT.adas[a];

      // ── Ada Boundary Polygon ──
      if (ada.boundary && ada.boundary.coordinates) {
        features.push({
          type: 'Feature',
          geometry: ada.boundary,
          properties: {
            ada: ada.name,
            adaId: ada.id,
            featureType: 'adaBoundary'
          }
        });
      }

      // ── Building Points ──
      for (var i = 0; i < ada.buildings.length; i++) {
        var b = ada.buildings[i];
        if (!b.lat && !b.lng) continue;

        var isOLT = b.id === ada.topology.oltBuildingId;
        var isFDH = ada.topology.fdhNodes && ada.topology.fdhNodes.some(function(f) { return f.buildingId === b.id; });
        var spl = PonEngine.calcSplitter(b.bb);
        var splData = ada.calculations.splitters && ada.calculations.splitters.find(function(s) { return s.buildingId === b.id; });
        var loss = ada.calculations.lossBudget && ada.calculations.lossBudget.find(function(l) { return l.buildingId === b.id; });

        var role = isOLT ? 'olt' : isFDH ? 'fdh' : 'building';
        var splStr = splData && splData.cascade && splData.cascade.level1
          ? '1:' + splData.cascade.level1.ratio + '+1:' + splData.cascade.level2.ratio
          : spl.map(function(s) { return '1:' + s.ratio; }).join('+');

        var props = {
          id: b.id,
          name: b.name,
          bb: b.bb,
          binaNo: b.binaNo || '',
          adaNo: b.adaNo || '',
          parsel: b.parsel || '',
          addr: b.addr || '',
          floor: b.floor || 0,
          ada: ada.name,
          adaId: ada.id,
          role: role,
          splitter: splStr,
          totalLoss: loss ? loss.totalLoss : null,
          margin: loss ? loss.margin : null,
          featureType: 'building'
        };

        // FDH extra info
        if (isFDH) {
          var fdhInfo = ada.topology.fdhNodes.find(function(f) { return f.buildingId === b.id; });
          if (fdhInfo) {
            props.servedBuildings = fdhInfo.servedBuildingIds.length;
            props.fdhTotalBB = fdhInfo.totalBB;
          }
        }

        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [b.lng, b.lat] },
          properties: props
        });
      }

      // ── Cable LineStrings ──
      var cables = ada.calculations.cables || [];
      for (var j = 0; j < cables.length; j++) {
        var c = cables[j];
        if (c.type === 'drop') continue; // skip internal wiring
        if (!c.from) continue; // skip backbone (no source building)

        var b1 = ada.buildings.find(function(x) { return x.id === c.from; });
        var b2 = ada.buildings.find(function(x) { return x.id === c.to; });
        if (!b1 || !b2) continue;
        if ((!b1.lat && !b1.lng) || (!b2.lat && !b2.lng)) continue;

        features.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [[b1.lng, b1.lat], [b2.lng, b2.lat]]
          },
          properties: {
            type: c.type,
            cores: c.cores,
            distanceM: c.distanceM,
            fromName: c.fromName,
            toName: c.toName,
            ada: ada.name,
            adaId: ada.id,
            featureType: 'cable'
          }
        });
      }

      // ── PTP Links ──
      var ptpLinks = ada.topology.ptpLinks || [];
      for (var p = 0; p < ptpLinks.length; p++) {
        var ptp = ptpLinks[p];
        var pb1 = ada.buildings.find(function(x) { return x.id === ptp.fromBuildingId; });
        var pb2 = ada.buildings.find(function(x) { return x.id === ptp.toBuildingId; });
        if (pb1 && pb2 && (pb1.lat || pb1.lng) && (pb2.lat || pb2.lng)) {
          features.push({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [[pb1.lng, pb1.lat], [pb2.lng, pb2.lat]]
            },
            properties: {
              id: ptp.id,
              device: ptp.device,
              freqGHz: ptp.freqGHz,
              distanceM: ptp.distanceM,
              throughputMbps: ptp.throughputMbps,
              fromName: pb1.name,
              toName: pb2.name,
              ada: ada.name,
              adaId: ada.id,
              featureType: 'ptpLink'
            }
          });
        }
      }

      // ── Ring closure cable ──
      if (ada.topology.ringCable) {
        var rb1 = ada.buildings.find(function(x) { return x.id === ada.topology.ringCable.from; });
        var rb2 = ada.buildings.find(function(x) { return x.id === ada.topology.ringCable.to; });
        if (rb1 && rb2 && (rb1.lat || rb1.lng) && (rb2.lat || rb2.lng)) {
          features.push({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [[rb1.lng, rb1.lat], [rb2.lng, rb2.lat]]
            },
            properties: {
              type: 'ring',
              cores: ada.topology.ringCable.cores,
              distanceM: Math.round(PonEngine.getDistance(rb1, rb2, ada.topology.manualDistances)),
              fromName: rb1.name,
              toName: rb2.name,
              ada: ada.name,
              adaId: ada.id,
              featureType: 'cable'
            }
          });
        }
      }
    }

    var geojson = {
      type: 'FeatureCollection',
      name: PROJECT.meta.name || 'FTTH Plan',
      crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } },
      features: features
    };

    return JSON.stringify(geojson, null, 2);
  }

  /**
   * Get serializable state for storage
   */
  function getState() {
    return {
      meta: PROJECT.meta,
      adas: PROJECT.adas,
      oltGroups: PROJECT.oltGroups,
      activeAdaId: PROJECT.activeAdaId,
      nextAdaId: PROJECT.nextAdaId,
      nextBuildingId: PROJECT.nextBuildingId,
      nextPtpId: PROJECT.nextPtpId,
      nextAdaCode: PROJECT.nextAdaCode
    };
  }

  /**
   * Restore state from storage
   */
  function loadState(saved) {
    if (!saved || !saved.adas) return false;
    PROJECT.meta = saved.meta || PROJECT.meta;
    PROJECT.adas = saved.adas;
    PROJECT.oltGroups = saved.oltGroups || [];
    PROJECT.activeAdaId = saved.activeAdaId;
    PROJECT.nextAdaId = saved.nextAdaId || 1;
    PROJECT.nextBuildingId = saved.nextBuildingId || 1;
    PROJECT.nextPtpId = saved.nextPtpId || 1;
    PROJECT.nextAdaCode = saved.nextAdaCode || 1;
    // Backward compat
    for (var i = 0; i < PROJECT.adas.length; i++) {
      var ada = PROJECT.adas[i];
      if (!ada.topology.oltConfig) ada.topology.oltConfig = { manualPorts: null };
      if (!ada.topology.ptpLinks) ada.topology.ptpLinks = [];
      if (ada.boundary === undefined) ada.boundary = null;
      if (ada.topology.defaultPenetrationRate === undefined) ada.topology.defaultPenetrationRate = 70;
      if (!ada.topology.equipmentSelections) ada.topology.equipmentSelections = {};
      for (var j = 0; j < ada.buildings.length; j++) {
        var bldg = ada.buildings[j];
        if (bldg.penetrationRate === undefined) bldg.penetrationRate = null;
        if (bldg.customPenetration === undefined) bldg.customPenetration = false;
      }
    }
    // Migration: ensure all adas have codes and createdAt
    if (!PROJECT.nextAdaCode) PROJECT.nextAdaCode = 1;
    for (var k = 0; k < PROJECT.adas.length; k++) {
      if (!PROJECT.adas[k].code) {
        PROJECT.adas[k].code = 'DA-' + String(PROJECT.nextAdaCode++).padStart(3, '0');
      }
      if (!PROJECT.adas[k].createdAt) {
        PROJECT.adas[k].createdAt = Date.now();
      }
    }
    // Ensure nextAdaCode is higher than any existing code
    for (var m = 0; m < PROJECT.adas.length; m++) {
      var existingCode = PROJECT.adas[m].code;
      if (existingCode && existingCode.indexOf('DA-') === 0) {
        var num = parseInt(existingCode.substring(3), 10);
        if (!isNaN(num) && num >= PROJECT.nextAdaCode) {
          PROJECT.nextAdaCode = num + 1;
        }
      }
    }
    return true;
  }

  // ─── PENETRATION RATE ──────────────────────────────────────

  /**
   * Get effective penetration rate for a building
   * Building custom rate takes priority, otherwise ada default
   * @returns {number} penetration rate (10-100)
   */
  function getEffectivePenetration(building, ada) {
    if (building.customPenetration && building.penetrationRate !== null) {
      return building.penetrationRate;
    }
    return (ada && ada.topology && ada.topology.defaultPenetrationRate) || 70;
  }

  /**
   * Set ada-level default penetration rate
   */
  function setAdaPenetrationRate(adaId, rate) {
    var ada = PROJECT.adas.find(function(a) { return a.id === adaId; });
    if (!ada) return false;
    ada.topology.defaultPenetrationRate = Math.max(10, Math.min(100, rate));
    PonEngine.recalculateAda(ada);
    return true;
  }

  /**
   * Set building-specific penetration rate
   */
  function setBuildingPenetrationRate(adaId, buildingId, rate) {
    var ada = PROJECT.adas.find(function(a) { return a.id === adaId; });
    if (!ada) return false;
    var bldg = ada.buildings.find(function(b) { return b.id === buildingId; });
    if (!bldg) return false;
    bldg.penetrationRate = Math.max(10, Math.min(100, rate));
    bldg.customPenetration = true;
    PonEngine.recalculateAda(ada);
    return true;
  }

  /**
   * Reset building penetration rate to ada default
   */
  function resetBuildingPenetrationRate(adaId, buildingId) {
    var ada = PROJECT.adas.find(function(a) { return a.id === adaId; });
    if (!ada) return false;
    var bldg = ada.buildings.find(function(b) { return b.id === buildingId; });
    if (!bldg) return false;
    bldg.penetrationRate = null;
    bldg.customPenetration = false;
    PonEngine.recalculateAda(ada);
    return true;
  }

  // Public API
  return {
    PROJECT,
    createAda,
    generateAdaCode,
    getActiveAda,
    getAllBuildings,
    getAda,
    addBuilding,
    removeBuilding,
    completeAda,
    deleteAda,
    clearAda,
    renameAda,
    switchView,
    setOLT,
    setAntenna,
    recalculateAll,
    groupAdasByOLT,
    getOLTGroup,
    getVisibleAdas,
    setManualDistance,
    setManualParent,
    addManualEdge,
    removeManualEdge,
    clearManualEdges,
    copyMstToManualEdges,
    setSvgPosition,
    setOltPortCount,
    setAdaBoundary,
    setMapSnapshot,
    clearAdaBoundary,
    addPtpLink,
    removePtpLink,
    updatePtpLink,
    exportJSON,
    exportCSV,
    exportGeoJSON,
    getState,
    loadState,
    getEffectivePenetration,
    setAdaPenetrationRate,
    setBuildingPenetrationRate,
    resetBuildingPenetrationRate
  };
})();
