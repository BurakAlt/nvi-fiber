/**
 * PON Engine - GPON ITU-T G.984 Class B+ Calculations
 * Splitter sizing, loss budget, inventory, cost, MST routing, FDH placement, OLT capacity
 */

const PonEngine = (() => {
  // GPON Constants
  const CONSTANTS = {
    maxLossBudget: 28,        // dB - Class B+
    fiberLoss1310: 0.35,      // dB/km @ 1310nm
    fiberLoss1550: 0.25,      // dB/km @ 1550nm
    connectorLoss: 0.5,       // dB per connector
    spliceLoss: 0.1,          // dB per splice
    splitterLoss: { 2: 3.5, 4: 7.0, 8: 10.5, 16: 14.0, 32: 17.5, 64: 21.0 },
    penetrationTarget: 0.70,  // %70 subscriber penetration
    avgCableDistM: 120,       // default cable distance when coords unavailable
    backboneDistM: 500,       // default backbone distance (santral → OLT)
    maxBBPerPort: 128,        // max BB per GPON port
    maxONTPerPort: 64,        // max ONT per GPON port
    fdhMaxBuildings: 8,       // max buildings per FDH
    dropInternalRatio: 0.2    // drop cable = 20% of building distance (internal wiring)
  };

  // Equipment catalog with prices (TL)
  const CATALOG = {
    olt_port:      { name: 'OLT GPON Port',      unit: 'adet', price: 8500 },
    sfp_module:    { name: 'SFP-B+ Modul',        unit: 'adet', price: 3200 },
    splitter_1x2:  { name: 'Splitter 1:2 PLC',    unit: 'adet', price: 180 },
    splitter_1x4:  { name: 'Splitter 1:4 PLC',    unit: 'adet', price: 300 },
    splitter_1x8:  { name: 'Splitter 1:8 PLC',    unit: 'adet', price: 450 },
    splitter_1x16: { name: 'Splitter 1:16 PLC',   unit: 'adet', price: 750 },
    splitter_1x32: { name: 'Splitter 1:32 PLC',   unit: 'adet', price: 1100 },
    fdh_cabinet:   { name: 'FDH Kabini 96 port',  unit: 'adet', price: 4500 },
    ont:           { name: 'ONT Cihaz',            unit: 'adet', price: 350 },
    fiber_96:      { name: '96 Kor Fiber Kablo',   unit: 'm',    price: 28 },
    fiber_48:      { name: '48 Kor Fiber Kablo',   unit: 'm',    price: 18 },
    fiber_24:      { name: '24 Kor Fiber Kablo',   unit: 'm',    price: 12 },
    fiber_12:      { name: '12 Kor Fiber Kablo',   unit: 'm',    price: 8 },
    fiber_4:       { name: '4 Kor Drop Kablo',     unit: 'm',    price: 3.5 },
    fiber_2:       { name: '2 Kor Drop Kablo',     unit: 'm',    price: 2.5 },
    connector:     { name: 'SC/APC Konnektor',     unit: 'adet', price: 15 },
    splice_tray:   { name: 'Ekleme Kaseti',        unit: 'adet', price: 85 },
    anten:         { name: 'Sektor Anten',         unit: 'adet', price: 12000 },
    anten_pole:    { name: 'Anten Diregi',         unit: 'adet', price: 8500 },
    patch_cord:    { name: 'Patch Kord SC/APC',    unit: 'adet', price: 25 },
    odf_panel:     { name: 'ODF Patch Panel',      unit: 'adet', price: 350 },
    splice_closure:{ name: 'Mufa Ek Kutusu',       unit: 'adet', price: 450 },
    fusion_splice: { name: 'Fiber Sonlandirma',    unit: 'adet', price: 200 },
    ptp_radio:     { name: 'PTP Radyo (airFiber)', unit: 'cift', price: 28000 },
    ptp_antenna:   { name: 'PTP Anten',            unit: 'cift', price: 6000 },
    ptp_mount:     { name: 'PTP Montaj Seti',      unit: 'adet', price: 2500 }
  };

  // Device database (brand/model reference for equipment selection)
  var DEVICE_DB = {
    olt: [
      { brand: 'Huawei', model: 'MA5800-X2', ports: 2, price: 45000 },
      { brand: 'Huawei', model: 'MA5800-X7', ports: 7, price: 85000 },
      { brand: 'ZTE', model: 'C320', ports: 4, price: 38000 },
      { brand: 'ZTE', model: 'C650', ports: 16, price: 120000 },
      { brand: 'Catel', model: 'FD1104B', ports: 4, price: 25000 },
      { brand: 'Ozel', model: '', ports: 0, price: 0 }
    ],
    ont: [
      { brand: 'Huawei', model: 'HG8245H5', type: 'router', price: 450 },
      { brand: 'ZTE', model: 'F670L', type: 'router', price: 380 },
      { brand: 'TP-Link', model: 'XC220-G3v', type: 'router', price: 320 },
      { brand: 'Ozel', model: '', type: '', price: 0 }
    ],
    splitter: [
      { brand: 'Corning', model: 'PLC 1:8', ratio: 8, price: 520 },
      { brand: 'Corning', model: 'PLC 1:16', ratio: 16, price: 850 },
      { brand: 'Huawei', model: 'PLC 1:8', ratio: 8, price: 480 },
      { brand: 'Huawei', model: 'PLC 1:16', ratio: 16, price: 800 },
      { brand: 'Ozel', model: '', ratio: 0, price: 0 }
    ],
    sfp: [
      { brand: 'Huawei', model: 'SFP-GE-LX-SM1310', price: 3500 },
      { brand: 'FS.com', model: 'SFP-GE-BX', price: 1800 },
      { brand: 'Ozel', model: '', price: 0 }
    ]
  };

  // Category mapping for cost summary grouping
  var CATALOG_CATEGORIES = {
    olt_port: 'aktif', sfp_module: 'aktif', ont: 'aktif',
    splitter_1x2: 'pasif', splitter_1x4: 'pasif', splitter_1x8: 'pasif',
    splitter_1x16: 'pasif', splitter_1x32: 'pasif',
    fdh_cabinet: 'pasif', odf_panel: 'pasif', splice_closure: 'pasif',
    fiber_96: 'kablo', fiber_48: 'kablo', fiber_24: 'kablo',
    fiber_12: 'kablo', fiber_4: 'kablo', fiber_2: 'kablo',
    connector: 'aksesuar', splice_tray: 'aksesuar', patch_cord: 'aksesuar',
    fusion_splice: 'aksesuar', anten: 'aksesuar', anten_pole: 'aksesuar',
    ptp_radio: 'aktif', ptp_antenna: 'aksesuar', ptp_mount: 'aksesuar'
  };

  /**
   * Get merged catalog: defaults + custom overrides
   * @param {Object} customEntries - { key: { price, name?, unit? }, ... }
   * @returns {Object} merged catalog
   */
  function getCatalog(customEntries) {
    var merged = {};
    var key;
    for (key in CATALOG) {
      if (CATALOG.hasOwnProperty(key)) {
        merged[key] = { name: CATALOG[key].name, unit: CATALOG[key].unit, price: CATALOG[key].price };
      }
    }
    if (customEntries) {
      for (key in customEntries) {
        if (customEntries.hasOwnProperty(key)) {
          var entry = customEntries[key];
          if (merged[key]) {
            if (entry.price !== undefined) merged[key].price = entry.price;
            if (entry.name) merged[key].name = entry.name;
            if (entry.unit) merged[key].unit = entry.unit;
          } else {
            merged[key] = { name: entry.name || key, unit: entry.unit || 'adet', price: entry.price || 0 };
          }
        }
      }
    }
    return merged;
  }

  // ─── DISTANCE ────────────────────────────────────────────────────

  /**
   * Haversine distance between two points (meters)
   */
  function distBetween(b1, b2) {
    const R = 6371000;
    const dLat = (b2.lat - b1.lat) * Math.PI / 180;
    const dLng = (b2.lng - b1.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(b1.lat * Math.PI / 180) * Math.cos(b2.lat * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /**
   * Safe distance - returns avgCableDistM when coords are 0/0
   */
  function safeDist(b1, b2) {
    if ((!b1.lat && !b1.lng) || (!b2.lat && !b2.lng)) return CONSTANTS.avgCableDistM;
    const d = distBetween(b1, b2);
    return d < 1 ? CONSTANTS.avgCableDistM : d;
  }

  /**
   * Get distance between two buildings, checking manual overrides first
   * @param {Object} b1 - first building
   * @param {Object} b2 - second building
   * @param {Object} manualDistances - { "id1-id2": meters }
   * @returns {number} distance in meters
   */
  function getDistance(b1, b2, manualDistances) {
    if (manualDistances) {
      var key1 = b1.id + '-' + b2.id;
      var key2 = b2.id + '-' + b1.id;
      if (manualDistances[key1]) return manualDistances[key1];
      if (manualDistances[key2]) return manualDistances[key2];
    }
    return safeDist(b1, b2);
  }

  /**
   * Check if building has real coordinates
   */
  function hasCoords(b) {
    return b.lat !== 0 || b.lng !== 0;
  }

  // ─── PENETRATION & FIBER HELPERS ─────────────────────────────────

  /**
   * Get effective BB for a building based on penetration rate
   * @param {Object} building - building object
   * @param {Object} ada - ada object (for default penetration rate)
   * @returns {number} effective BB (ceiled)
   */
  function getEffectiveBB(building, ada) {
    var pen = (typeof Topology !== 'undefined' && Topology.getEffectivePenetration)
      ? Topology.getEffectivePenetration(building, ada)
      : CONSTANTS.penetrationTarget * 100;
    return Math.max(1, Math.ceil(building.bb * pen / 100));
  }

  /**
   * Round fiber core count up to nearest standard size
   * Standard sizes: 2, 4, 12, 24, 48, 96
   * @param {number} count - raw fiber core count
   * @returns {number} standard fiber core count
   */
  function roundToStandardFiber(count) {
    if (count <= 2) return 2;
    if (count <= 4) return 4;
    if (count <= 12) return 12;
    if (count <= 24) return 24;
    if (count <= 48) return 48;
    return 96;
  }

  /**
   * Calculate feeder cable cores (OLT → FDH)
   * @param {number} ponPorts - number of PON ports
   * @returns {number} standard fiber core count
   */
  function calcFeederCores(ponPorts) {
    return roundToStandardFiber(ponPorts * 2);
  }

  /**
   * Calculate distribution cable cores based on downstream demand
   * @param {Array} downstreamBldgs - buildings downstream from this cable
   * @param {Object} ada - ada object
   * @returns {number} standard fiber core count
   */
  function calcDistributionCores(downstreamBldgs, ada) {
    var totalEffBB = 0;
    for (var i = 0; i < downstreamBldgs.length; i++) {
      totalEffBB += getEffectiveBB(downstreamBldgs[i], ada);
    }
    // Each building needs at least 1 fiber, plus reserve
    var raw = Math.max(downstreamBldgs.length * 2, Math.ceil(totalEffBB / 8));
    return roundToStandardFiber(raw);
  }

  // ─── SPLITTER ────────────────────────────────────────────────────

  /**
   * Simple splitter for a single building (level 2 / building-level)
   */
  function calcSplitter(bb) {
    if (bb <= 8)  return [{ ratio: 8,  ports: 8,  loss: 10.5, level: 2 }];
    if (bb <= 16) return [{ ratio: 16, ports: 16, loss: 14.0, level: 2 }];
    if (bb <= 24) return [{ ratio: 16, ports: 16, loss: 14.0, level: 2 }, { ratio: 8, ports: 8, loss: 10.5, level: 2 }];
    if (bb <= 32) return [{ ratio: 32, ports: 32, loss: 17.5, level: 2 }];
    return [{ ratio: 32, ports: 32, loss: 17.5, level: 2 }, { ratio: 16, ports: 16, loss: 14.0, level: 2 }];
  }

  /**
   * Cascaded 2-level splitter calculation (penetration-aware)
   * Level 1 (FDH): sized by building COUNT in group
   * Level 2 (Building): sized by building's EFFECTIVE BB
   *
   * @param {number} totalEffBB - Total effective BB in FDH group
   * @param {number} buildingCount - Number of buildings in FDH group
   * @param {number} effectiveBB - Effective BB for specific building
   * @returns {{ level1, level2, totalRatio, totalLoss }}
   */
  function calcSplitterCascade(totalEffBB, buildingCount, effectiveBB) {
    var level1 = null;
    var level2 = null;

    if (totalEffBB <= 16) {
      // Small group: single-level splitting at building
      level2 = calcSplitter(effectiveBB)[0];
      return {
        level1: null,
        level2: level2,
        totalRatio: level2.ratio,
        totalLoss: level2.loss
      };
    }

    // 2-level splitting needed
    // Level 1 at FDH: split based on building COUNT in group
    if (buildingCount <= 4) {
      level1 = { ratio: 4, ports: 4, loss: CONSTANTS.splitterLoss[4], level: 1 };
    } else if (buildingCount <= 8) {
      level1 = { ratio: 8, ports: 8, loss: CONSTANTS.splitterLoss[8], level: 1 };
    } else {
      level1 = { ratio: 16, ports: 16, loss: CONSTANTS.splitterLoss[16], level: 1 };
    }

    // Level 2 at building: split based on EFFECTIVE BB
    if (effectiveBB <= 8) {
      level2 = { ratio: 8, ports: 8, loss: CONSTANTS.splitterLoss[8], level: 2 };
    } else if (effectiveBB <= 16) {
      level2 = { ratio: 16, ports: 16, loss: CONSTANTS.splitterLoss[16], level: 2 };
    } else {
      level2 = { ratio: 32, ports: 32, loss: CONSTANTS.splitterLoss[32], level: 2 };
    }

    // Safety: level1 × level2 must not exceed 1:128
    while (level1.ratio * level2.ratio > 128 && level1.ratio > 4) {
      var smallerRatio = level1.ratio === 16 ? 8 : 4;
      level1 = { ratio: smallerRatio, ports: smallerRatio, loss: CONSTANTS.splitterLoss[smallerRatio], level: 1 };
    }

    // Safety: combined loss must stay within budget
    if (level1.loss + level2.loss > CONSTANTS.maxLossBudget) {
      // Reduce level1 if over budget
      if (level1.ratio > 4) {
        level1 = { ratio: 4, ports: 4, loss: CONSTANTS.splitterLoss[4], level: 1 };
      }
    }

    return {
      level1: level1,
      level2: level2,
      totalRatio: level1.ratio * level2.ratio,
      totalLoss: level1.loss + level2.loss
    };
  }

  // ─── OLT PLACEMENT ──────────────────────────────────────────────

  /**
   * Find optimal OLT building using weighted geometric median
   * Falls back to max-BB building when coordinates unavailable
   */
  function findOptimalOLT(buildings) {
    if (buildings.length === 0) return null;
    if (buildings.length === 1) return buildings[0].id;

    const withCoords = buildings.some(b => hasCoords(b));

    if (!withCoords) {
      // No coordinates: pick building with most BB, prefer electric
      const candidates = buildings.filter(b => b.hasElectric);
      const pool = candidates.length > 0 ? candidates : buildings;
      pool.sort((a, b) => b.bb - a.bb || b.floor - a.floor);
      return pool[0].id;
    }

    // Weighted geometric median with coordinate data
    let bestId = buildings[0].id, bestCost = Infinity;
    for (const candidate of buildings) {
      if (!candidate.hasElectric) continue;
      let totalCost = 0;
      for (const b of buildings) {
        if (b.id === candidate.id) continue;
        totalCost += safeDist(candidate, b) * b.bb;
      }
      totalCost -= candidate.floor * 50; // height bonus
      if (totalCost < bestCost) { bestCost = totalCost; bestId = candidate.id; }
    }
    return bestId;
  }

  /**
   * Determine building type based on BB count and role
   */
  function getBuildingType(b, ada) {
    if (ada && b.id === ada.topology.oltBuildingId) return 'olt';
    if (ada && ada.topology.fdhNodes && ada.topology.fdhNodes.some(f => f.buildingId === b.id)) return 'fdh';
    if (b.bb >= 20) return 'mdu-lg';
    if (b.bb >= 8)  return 'mdu-md';
    return 'sfu';
  }

  // ─── OLT CAPACITY ───────────────────────────────────────────────

  /**
   * Check OLT port capacity for an ada (penetration-aware)
   * GPON: max 128 BB per port, max 64 ONT per port
   */
  function checkOLTCapacity(ada) {
    var totalBB = ada.buildings.reduce(function(s, b) { return s + b.bb; }, 0);
    var totalEffBB = 0;
    for (var i = 0; i < ada.buildings.length; i++) {
      totalEffBB += getEffectiveBB(ada.buildings[i], ada);
    }
    var totalONT = totalEffBB;
    var portsByBB = Math.ceil(totalBB / CONSTANTS.maxBBPerPort);
    var portsByONT = Math.ceil(totalONT / CONSTANTS.maxONTPerPort);
    var autoRequired = Math.max(1, portsByBB, portsByONT);

    // Manual override
    var manualPorts = ada.topology && ada.topology.oltConfig ? ada.topology.oltConfig.manualPorts : null;
    var isManual = manualPorts !== null && manualPorts !== undefined;
    var requiredPorts = isManual ? manualPorts : autoRequired;
    var utilization = Math.round((totalBB / (requiredPorts * CONSTANTS.maxBBPerPort)) * 100);
    var status = utilization > 90 ? 'critical' : utilization > 70 ? 'warning' : 'ok';

    // If manual value is less than auto-required, mark critical
    if (isManual && manualPorts < autoRequired) {
      status = 'critical';
    }

    return {
      totalBB: totalBB,
      totalEffBB: totalEffBB,
      totalONT: totalONT,
      requiredPorts: requiredPorts,
      autoRequired: autoRequired,
      isManual: isManual,
      utilization: utilization,
      status: status
    };
  }

  // ─── FDH PLACEMENT ──────────────────────────────────────────────

  /**
   * Assign FDH nodes to buildings using greedy clustering
   * Each FDH serves up to fdhMaxBuildings buildings
   * FDH placed at the building with the most BB in each cluster
   */
  function assignFDH(ada) {
    const blds = ada.buildings;
    const oltId = ada.topology.oltBuildingId;
    if (blds.length <= 2) {
      // Too few buildings for FDH - direct connection
      return [];
    }

    const nonOLT = blds.filter(b => b.id !== oltId);
    const maxPerFDH = CONSTANTS.fdhMaxBuildings;
    const fdhNodes = [];
    const assigned = new Set();

    // Sort by distance from OLT (closest first)
    const oltB = blds.find(b => b.id === oltId);
    const sorted = [...nonOLT].sort((a, b) => safeDist(oltB, a) - safeDist(oltB, b));

    while (assigned.size < sorted.length) {
      // Find unassigned building with most BB as FDH center
      let center = null;
      for (const b of sorted) {
        if (!assigned.has(b.id)) {
          if (!center || b.bb > center.bb) center = b;
        }
      }
      if (!center) break;

      // Collect nearby unassigned buildings
      const cluster = [center.id];
      assigned.add(center.id);

      const unassigned = sorted.filter(b => !assigned.has(b.id));
      unassigned.sort((a, b) => safeDist(center, a) - safeDist(center, b));

      for (const b of unassigned) {
        if (cluster.length >= maxPerFDH) break;
        cluster.push(b.id);
        assigned.add(b.id);
      }

      var clusterBB = 0;
      var clusterEffBB = 0;
      for (var ci = 0; ci < cluster.length; ci++) {
        var cb = blds.find(function(b) { return b.id === cluster[ci]; });
        if (cb) {
          clusterBB += cb.bb;
          clusterEffBB += getEffectiveBB(cb, ada);
        }
      }
      fdhNodes.push({
        buildingId: center.id,
        buildingName: center.name,
        servedBuildingIds: cluster,
        totalBB: clusterBB,
        totalEffBB: clusterEffBB
      });
    }

    return fdhNodes;
  }

  // ─── MST ROUTING ────────────────────────────────────────────────

  /**
   * Build Minimum Spanning Tree using Prim's algorithm
   * Returns edges as [{from, to, distance}] starting from OLT
   */
  function buildMST(buildings, oltId) {
    if (buildings.length <= 1) return [];

    const inMST = new Set([oltId]);
    const edges = [];
    const bMap = new Map(buildings.map(b => [b.id, b]));

    while (inMST.size < buildings.length) {
      let bestEdge = null;
      let bestDist = Infinity;

      for (const fromId of inMST) {
        const fromB = bMap.get(fromId);
        for (const toB of buildings) {
          if (inMST.has(toB.id)) continue;
          const d = safeDist(fromB, toB);
          if (d < bestDist) {
            bestDist = d;
            bestEdge = { from: fromId, to: toB.id, distance: Math.round(d) };
          }
        }
      }

      if (!bestEdge) break;
      edges.push(bestEdge);
      inMST.add(bestEdge.to);
    }

    return edges;
  }

  /**
   * Find the two leaf nodes of the MST (for ring closure)
   * Leaves = nodes with only 1 connection in MST
   */
  function findMSTLeaves(edges, oltId) {
    const degree = {};
    for (const e of edges) {
      degree[e.from] = (degree[e.from] || 0) + 1;
      degree[e.to] = (degree[e.to] || 0) + 1;
    }
    // Find leaves (degree 1) that are not OLT
    const leaves = Object.entries(degree)
      .filter(([id, deg]) => deg === 1 && parseInt(id) !== oltId)
      .map(([id]) => parseInt(id));

    if (leaves.length >= 2) return { from: leaves[0], to: leaves[leaves.length - 1] };
    return null;
  }

  // ─── LOSS BUDGET ─────────────────────────────────────────────────

  /**
   * Calculate loss budget for a building relative to OLT
   * Uses actual cascade splitter data and safe distance
   */
  function calcLossBudget(building, oltBuilding, cascadeData, manualDistances, pathDistanceM) {
    var directDist = getDistance(oltBuilding, building, manualDistances);
    var dist;
    if (building.id === oltBuilding.id) {
      dist = 0;
      directDist = 0;
    } else if (pathDistanceM !== undefined && pathDistanceM !== null) {
      dist = pathDistanceM;  // MST cumulative path distance
    } else {
      dist = directDist;     // fallback: haversine
    }
    const distKm = dist / 1000;

    // Use cascade splitter loss if available, else simple calculation
    let splLoss;
    if (cascadeData) {
      splLoss = cascadeData.totalLoss;
    } else {
      const spl = calcSplitter(building.bb);
      splLoss = spl.reduce((s, sp) => s + sp.loss, 0);
    }

    const fiberLoss = distKm * CONSTANTS.fiberLoss1310;
    const connLoss = 4 * CONSTANTS.connectorLoss;  // 2 connectors each end
    const spliceLoss = 2 * CONSTANTS.spliceLoss;
    const totalLoss = Math.round((splLoss + fiberLoss + connLoss + spliceLoss) * 10) / 10;
    const margin = Math.round((CONSTANTS.maxLossBudget - totalLoss) * 10) / 10;

    return {
      buildingId: building.id,
      buildingName: building.name,
      bb: building.bb,
      distanceM: Math.round(dist),
      directDistanceM: Math.round(directDist),
      distanceKm: Math.round(distKm * 100) / 100,
      splitterLoss: Math.round(splLoss * 10) / 10,
      fiberLoss: Math.round(fiberLoss * 10) / 10,
      connectorLoss: connLoss,
      spliceLoss,
      totalLoss,
      margin,
      status: margin >= 0 ? 'OK' : 'FAIL'
    };
  }

  // ─── INVENTORY ───────────────────────────────────────────────────

  /**
   * Calculate full inventory for an ada
   */
  function calcInventory(ada, customCatalog) {
    var cat = customCatalog || CATALOG;
    const inv = {};
    const addInv = (key, qty) => { inv[key] = (inv[key] || 0) + qty; };

    // OLT capacity
    const capacity = ada.calculations.oltCapacity || { requiredPorts: 1 };
    addInv('olt_port', capacity.requiredPorts);
    addInv('sfp_module', capacity.requiredPorts);

    // FDH-level (level 1) splitters
    const fdhNodes = ada.topology.fdhNodes || [];
    for (const fdh of fdhNodes) {
      addInv('fdh_cabinet', 1);
      // Level 1 splitter at FDH
      const cascade = ada.calculations.splitters?.find(s => s.buildingId === fdh.buildingId);
      if (cascade && cascade.cascade?.level1) {
        const r = cascade.cascade.level1.ratio;
        if (r === 4) addInv('splitter_1x4', 1);
        else if (r === 8) addInv('splitter_1x8', 1);
        else if (r === 16) addInv('splitter_1x16', 1);
      }
    }
    if (fdhNodes.length === 0) {
      addInv('fdh_cabinet', Math.max(1, Math.ceil(ada.buildings.length / CONSTANTS.fdhMaxBuildings)));
    }

    // Per-building (level 2) splitters
    for (const s of (ada.calculations.splitters || [])) {
      const level2 = s.cascade ? s.cascade.level2 : (s.splitters ? s.splitters[0] : null);
      if (!level2) continue;
      if (level2.ratio === 4) addInv('splitter_1x4', 1);
      else if (level2.ratio === 8) addInv('splitter_1x8', 1);
      else if (level2.ratio === 16) addInv('splitter_1x16', 1);
      else if (level2.ratio === 32) addInv('splitter_1x32', 1);
    }

    // ONT (penetration-aware: use effective BB)
    var totalEffBB = 0;
    for (var bi = 0; bi < ada.buildings.length; bi++) {
      totalEffBB += getEffectiveBB(ada.buildings[bi], ada);
    }
    addInv('ont', totalEffBB);

    // Cable-based inventory
    let totalConnectors = 0;
    for (const c of (ada.calculations.cables || [])) {
      let key;
      if (c.cores >= 96) key = 'fiber_96';
      else if (c.cores >= 48) key = 'fiber_48';
      else if (c.cores >= 24) key = 'fiber_24';
      else if (c.cores >= 12) key = 'fiber_12';
      else if (c.cores >= 4) key = 'fiber_4';
      else key = 'fiber_2';
      addInv(key, c.distanceM);
      totalConnectors += c.cores * 2;
    }
    addInv('connector', totalConnectors);
    addInv('splice_tray', Math.ceil(totalConnectors / 12));

    if (ada.topology.antenBuildingId) {
      addInv('anten', 1);
      addInv('anten_pole', 1);
    }

    // PTP wireless equipment
    var ptpCount = ada.topology.ptpLinks ? ada.topology.ptpLinks.length : 0;
    if (ptpCount > 0) {
      addInv('ptp_radio', ptpCount);
      addInv('ptp_antenna', ptpCount);
      addInv('ptp_mount', ptpCount * 2);
    }

    return Object.entries(inv).map(([key, qty]) => ({
      key, ...(cat[key] || CATALOG[key] || {}), qty, total: qty * ((cat[key] && cat[key].price) || (CATALOG[key] && CATALOG[key].price) || 0)
    })).filter(item => item.qty > 0);
  }

  // ─── FULL RECALCULATION ──────────────────────────────────────────

  /**
   * Full recalculation for an ada
   * Pipeline: OLT → FDH → MST → Cables → Splitters → Loss → Inventory → Costs
   */
  function recalculateAda(ada) {
    const blds = ada.buildings;
    if (blds.length === 0) {
      ada.calculations = { splitters: [], cables: [], lossBudget: [], inventory: [], oltCapacity: null, costs: { items: [], total: 0 } };
      ada.topology.fdhNodes = [];
      return;
    }

    // 1. OLT placement
    if (!ada.topology.oltBuildingId || !blds.find(b => b.id === ada.topology.oltBuildingId)) {
      ada.topology.oltBuildingId = findOptimalOLT(blds);
    }
    if (!ada.topology.antenBuildingId || !blds.find(b => b.id === ada.topology.antenBuildingId)) {
      ada.topology.antenBuildingId = ada.topology.oltBuildingId;
    }

    const oltB = blds.find(b => b.id === ada.topology.oltBuildingId);
    if (!oltB) return;

    // 2. OLT capacity check
    ada.calculations.oltCapacity = checkOLTCapacity(ada);

    // 3. FDH placement
    ada.topology.fdhNodes = assignFDH(ada);

    // 4. Routing: manual edges (user-drawn) OR auto two-level MST
    var manualEdges = ada.topology.manualEdges || [];
    var mstEdges;

    if (manualEdges.length > 0) {
      // ── MANUAL MODE: user drew cables, use those directly ──
      mstEdges = [];
      for (var mei = 0; mei < manualEdges.length; mei++) {
        var me = manualEdges[mei];
        var meFrom = blds.find(function(b) { return b.id === me.from; });
        var meTo = blds.find(function(b) { return b.id === me.to; });
        if (meFrom && meTo) {
          mstEdges.push({
            from: me.from,
            to: me.to,
            distance: Math.round(getDistance(meFrom, meTo, manDist))
          });
        }
      }
    } else {
      // ── AUTO MODE: two-level MST routing (respects FDH groups) ──
      //    Level 1: OLT → FDH buildings (feeder route)
      //    Level 2: Each FDH → its served buildings (distribution route)
      if (ada.topology.fdhNodes.length > 0) {
        mstEdges = [];

        // Collect unique FDH buildings + OLT
        var fdhBldSet = {};
        var fdhBldList = [oltB];
        fdhBldSet[oltB.id] = true;
        for (var fi = 0; fi < ada.topology.fdhNodes.length; fi++) {
          var fdhB = blds.find(function(b) { return b.id === ada.topology.fdhNodes[fi].buildingId; });
          if (fdhB && !fdhBldSet[fdhB.id]) {
            fdhBldList.push(fdhB);
            fdhBldSet[fdhB.id] = true;
          }
        }

        // Level 1: MST among OLT + FDH buildings
        if (fdhBldList.length > 1) {
          var feederEdges = buildMST(fdhBldList, oltB.id);
          mstEdges = mstEdges.concat(feederEdges);
        }

        // Level 2: MST within each FDH group (FDH → served buildings)
        for (var fi2 = 0; fi2 < ada.topology.fdhNodes.length; fi2++) {
          var fdh = ada.topology.fdhNodes[fi2];
          var groupBlds = [];
          for (var gi = 0; gi < fdh.servedBuildingIds.length; gi++) {
            var gb = blds.find(function(b) { return b.id === fdh.servedBuildingIds[gi]; });
            if (gb) groupBlds.push(gb);
          }
          if (groupBlds.length > 1) {
            var distEdges = buildMST(groupBlds, fdh.buildingId);
            mstEdges = mstEdges.concat(distEdges);
          }
        }
      } else {
        // No FDH (< 3 buildings): simple MST from OLT
        mstEdges = buildMST(blds, oltB.id);
      }

      // Apply manual parent overrides (single-edge overrides on auto MST)
      var manualParents = ada.topology.manualParents || {};
      for (var mpKey in manualParents) {
        if (!manualParents.hasOwnProperty(mpKey)) continue;
        var mpChildId = parseInt(mpKey);
        var mpParentId = manualParents[mpKey];
        var mpChildB = blds.find(function(b) { return b.id === mpChildId; });
        var mpParentB = blds.find(function(b) { return b.id === mpParentId; });
        if (!mpChildB || !mpParentB) continue;
        mstEdges = mstEdges.filter(function(e) { return e.to !== mpChildId; });
        mstEdges.push({
          from: mpParentId,
          to: mpChildId,
          distance: Math.round(getDistance(mpParentB, mpChildB, manDist))
        });
      }
    }

    var isManualMode = manualEdges.length > 0;

    // Store MST edges for dashboard layout
    ada.topology.mstEdges = mstEdges;

    // Find ring closure leaves (auto mode only, respects noRing flag)
    if (!isManualMode && !ada.topology.noRing) {
      var leaves = findMSTLeaves(mstEdges, oltB.id);
      if (leaves) {
        ada.topology.ringCable = { from: leaves.from, to: leaves.to, cores: 4 };
      } else {
        ada.topology.ringCable = null;
      }
    } else {
      ada.topology.ringCable = null;
    }

    // Store MST arms for compatibility
    ada.topology.arms = [{ name: 'MST', buildings: mstEdges.map(function(e) { return e.to; }) }];

    // Build children map and downstream map from edges
    var manDist = ada.topology.manualDistances || {};
    var mstChildren = {};
    for (var ei2 = 0; ei2 < mstEdges.length; ei2++) {
      var me2 = mstEdges[ei2];
      if (!mstChildren[me2.from]) mstChildren[me2.from] = [];
      mstChildren[me2.from].push(me2.to);
    }

    // Find which buildings are reachable from OLT (for robust partial-tree handling)
    var reachable = {};
    reachable[oltB.id] = true;
    function markReachable(nodeId) {
      var ch = mstChildren[nodeId] || [];
      for (var r = 0; r < ch.length; r++) {
        if (!reachable[ch[r]]) {
          reachable[ch[r]] = true;
          markReachable(ch[r]);
        }
      }
    }
    markReachable(oltB.id);

    // 5. Cascaded splitters per building (penetration-aware)
    ada.calculations.splitters = blds.map(function(b) {
      var fdhGroup = !isManualMode ? ada.topology.fdhNodes.find(function(f) { return f.servedBuildingIds.includes(b.id); }) : null;
      var groupEffBB = fdhGroup ? fdhGroup.totalEffBB : blds.reduce(function(s, x) { return s + getEffectiveBB(x, ada); }, 0);
      var groupCount = fdhGroup ? fdhGroup.servedBuildingIds.length : blds.length;
      var effBB = getEffectiveBB(b, ada);

      var cascade = calcSplitterCascade(groupEffBB, groupCount, effBB);
      var simpleSpls = calcSplitter(effBB);

      return {
        buildingId: b.id,
        buildingName: b.name,
        bb: b.bb,
        effBB: effBB,
        splitters: simpleSpls,
        cascade: cascade,
        totalPorts: cascade.level2 ? cascade.level2.ports : simpleSpls[0].ports,
        targetSubs: effBB
      };
    });

    // 6. Cables: backbone + distribution + drop + ring
    ada.calculations.cables = [];
    var addCable = function(from, to, cores, type) {
      var bFrom = blds.find(function(b) { return b.id === from; });
      var bTo = blds.find(function(b) { return b.id === to; });
      var horizDist = bFrom && bTo ? Math.round(getDistance(bFrom, bTo, manDist)) : CONSTANTS.avgCableDistM;
      // Add vertical cable: rooftop entry → energy room (3m per floor)
      var vertDist = 0;
      if (type !== 'backbone' && type !== 'drop') {
        if (bFrom && bFrom.floor) vertDist += Math.max(1, bFrom.floor) * 3;
        if (bTo && bTo.floor) vertDist += Math.max(1, bTo.floor) * 3;
      }
      var dist = horizDist + vertDist;
      ada.calculations.cables.push({
        from: from, to: to, cores: cores, type: type, distanceM: dist,
        horizDistanceM: horizDist, vertDistanceM: vertDist,
        fromName: bFrom ? bFrom.name : 'Santral', toName: bTo ? bTo.name : '?'
      });
    };

    // Build downstream building map (only for reachable nodes)
    var downstreamMap = {};
    function collectDownstream(nodeId) {
      var result = [];
      var ch = mstChildren[nodeId] || [];
      for (var c = 0; c < ch.length; c++) {
        var childB = blds.find(function(b) { return b.id === ch[c]; });
        if (childB) result.push(childB);
        result = result.concat(collectDownstream(ch[c]));
      }
      return result;
    }
    for (var di = 0; di < blds.length; di++) {
      if (reachable[blds[di].id]) {
        downstreamMap[blds[di].id] = collectDownstream(blds[di].id);
      }
    }

    // Build cumulative path distances from OLT along edges
    var pathDistances = {};
    pathDistances[oltB.id] = 0;
    function buildPathDistances(nodeId) {
      var ch = mstChildren[nodeId] || [];
      for (var c = 0; c < ch.length; c++) {
        var childB = blds.find(function(b) { return b.id === ch[c]; });
        var parentB = blds.find(function(b) { return b.id === nodeId; });
        if (childB && parentB) {
          var hopDist = getDistance(parentB, childB, manDist);
          // Add vertical cable distance (rooftop entry, 3m per floor)
          if (parentB.floor) hopDist += Math.max(1, parentB.floor) * 3;
          if (childB.floor) hopDist += Math.max(1, childB.floor) * 3;
          pathDistances[ch[c]] = (pathDistances[nodeId] || 0) + hopDist;
        }
        buildPathDistances(ch[c]);
      }
    }
    buildPathDistances(oltB.id);

    // 6a. Backbone cable (santral → OLT) - sized by PON ports
    var capacity = ada.calculations.oltCapacity || { requiredPorts: 1 };
    var backboneCores = calcFeederCores(capacity.requiredPorts);
    if (blds.length > 16) backboneCores = Math.max(backboneCores, 48);
    ada.topology.backboneCable = {
      cores: backboneCores,
      distanceM: CONSTANTS.backboneDistM,
      type: 'backbone'
    };
    ada.calculations.cables.push({
      from: null, to: oltB.id, cores: backboneCores, type: 'backbone',
      distanceM: CONSTANTS.backboneDistM,
      fromName: 'Santral', toName: oltB.name
    });

    // 6b. Distribution cables from edges (demand-based core sizing)
    for (var ei3 = 0; ei3 < mstEdges.length; ei3++) {
      var edge = mstEdges[ei3];
      var toBuilding = blds.find(function(b) { return b.id === edge.to; });
      if (!toBuilding) continue;
      var downstream = [toBuilding].concat(downstreamMap[edge.to] || []);
      var cores;
      if (edge.from === oltB.id) {
        cores = calcFeederCores(capacity.requiredPorts);
        cores = Math.max(cores, calcDistributionCores(downstream, ada));
      } else {
        cores = calcDistributionCores(downstream, ada);
      }
      addCable(edge.from, edge.to, cores, 'distribution');
    }

    // 6c. Drop cables per building (only reachable buildings in manual mode)
    for (var bi2 = 0; bi2 < blds.length; bi2++) {
      var b = blds[bi2];
      if (b.id === oltB.id) continue;
      if (isManualMode && !reachable[b.id]) continue;  // skip disconnected buildings
      var effBBDrop = getEffectiveBB(b, ada);
      var dropCores = effBBDrop <= 4 ? 2 : 4;
      // Drop cable: rooftop entry → energy room → floor risers (3.5m/floor + 20m base for roof+basement)
      var dropDist = Math.max(10, b.floor * 3.5 + 20);
      ada.calculations.cables.push({
        from: b.id, to: b.id, cores: dropCores, type: 'drop',
        distanceM: dropDist,
        fromName: b.name, toName: b.name + ' (ic)'
      });
    }

    // 6d. Ring closure cable (auto mode only)
    if (!isManualMode && ada.topology.ringCable) {
      addCable(ada.topology.ringCable.from, ada.topology.ringCable.to, 4, 'ring');
    }

    // 7. Loss budget per building (only reachable in manual mode)
    ada.calculations.lossBudget = blds.map(function(b) {
      if (isManualMode && !reachable[b.id]) {
        return { buildingId: b.id, buildingName: b.name, status: 'disconnected', totalLoss: 0, margin: 0 };
      }
      var splData = ada.calculations.splitters.find(function(s) { return s.buildingId === b.id; });
      var pathDist = pathDistances[b.id];
      return calcLossBudget(b, oltB, splData ? splData.cascade : null, manDist, pathDist);
    });

    // 8. Inventory & costs
    ada.calculations.inventory = calcInventory(ada);
    ada.calculations.costs = {
      items: ada.calculations.inventory,
      total: ada.calculations.inventory.reduce((s, i) => s + i.total, 0)
    };
  }

  // Public API
  return {
    CONSTANTS,
    CATALOG,
    CATALOG_CATEGORIES,
    DEVICE_DB,
    getCatalog,
    distBetween,
    safeDist,
    hasCoords,
    getEffectiveBB,
    roundToStandardFiber,
    calcFeederCores,
    calcDistributionCores,
    calcSplitter,
    calcSplitterCascade,
    findOptimalOLT,
    getBuildingType,
    checkOLTCapacity,
    assignFDH,
    buildMST,
    getDistance,
    calcLossBudget,
    calcInventory,
    recalculateAda
  };
})();
