/**
 * Map Utilities - Pentagon markers, cable rendering, Leaflet helpers
 * Used by both overlay.js (NVI map) and standalone planner
 */

const MapUtils = (() => {
  // Building type colors
  const COLORS = {
    olt:    { fill: 'rgba(139,92,246,.3)', stroke: '#8b5cf6', text: '#c4b5fd', hex: '#8b5cf6' },
    fdh:    { fill: 'rgba(59,130,246,.25)', stroke: '#3b82f6', text: '#93c5fd', hex: '#3b82f6' },
    'mdu-lg': { fill: 'rgba(34,197,94,.25)', stroke: '#22c55e', text: '#86efac', hex: '#22c55e' },
    'mdu-md': { fill: 'rgba(249,115,22,.25)', stroke: '#f97316', text: '#fdba74', hex: '#f97316' },
    sfu:    { fill: 'rgba(234,179,8,.25)', stroke: '#eab308', text: '#fde68a', hex: '#eab308' },
    default: { fill: 'rgba(148,163,184,.2)', stroke: '#94a3b8', text: '#cbd5e1', hex: '#94a3b8' }
  };

  // Cable type styles
  const CABLE_STYLES = {
    backbone:     { color: '#3b5998', width: 4, dash: '' },
    distribution: { color: '#f97316', width: 3, dash: '' },
    ring:         { color: '#6366f1', width: 2, dash: '8 5' },
    drop:         { color: '#ef4444', width: 1.2, dash: '4 3' },
    default:      { color: '#94a3b8', width: 1.5, dash: '' }
  };

  /**
   * Generate pentagon SVG points string
   */
  function pentagonPoints(cx, cy, r) {
    const pts = [];
    for (let i = 0; i < 5; i++) {
      const angle = (i * 72 - 90) * Math.PI / 180;
      pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
    }
    return pts.join(' ');
  }

  /**
   * Get color palette for building type
   */
  function getNodeColor(b, ada) {
    const type = PonEngine.getBuildingType(b, ada);
    return COLORS[type] || COLORS.default;
  }

  /**
   * Get cable line style
   */
  function getCableStyle(cable) {
    if (cable.type === 'distribution') {
      return {
        color: cable.cores >= 12 ? '#f97316' : '#60a5fa',
        width: cable.cores >= 12 ? 3 : 2.5,
        dash: ''
      };
    }
    return CABLE_STYLES[cable.type] || CABLE_STYLES.default;
  }

  /**
   * Create a Leaflet divIcon with pentagon SVG for a building
   */
  function createPentagonIcon(building, ada, splitterStr) {
    const isOLT = building.id === ada.topology.oltBuildingId;
    const isFDH = ada.topology.fdhNodes && ada.topology.fdhNodes.some(function(f) { return f.buildingId === building.id; });
    const type = PonEngine.getBuildingType(building, ada);
    const color = COLORS[type]?.hex || COLORS.default.hex;
    const size = isOLT ? 18 : 14;
    const hasExtra = splitterStr || isFDH || isOLT;
    const height = hasExtra ? size * 2 + 28 : size * 2 + 16;
    const splColor = '#67e8f9';

    var roleTag = '';
    if (isOLT) roleTag = '<text x="' + size + '" y="10" text-anchor="middle" fill="#c4b5fd" font-size="8" font-weight="700" font-family="JetBrains Mono">OLT</text>';
    else if (isFDH) roleTag = '<text x="' + size + '" y="10" text-anchor="middle" fill="#93c5fd" font-size="8" font-weight="700" font-family="JetBrains Mono">FDH</text>';

    var splLine = splitterStr
      ? '<text x="' + size + '" y="' + (size * 2 + 24) + '" text-anchor="middle" fill="' + splColor + '" font-size="8" font-weight="600" font-family="JetBrains Mono">' + splitterStr + '</text>'
      : '';

    return L.divIcon({
      className: '',
      html: '<svg width="' + (size * 2) + '" height="' + height + '" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,.6))">' +
        roleTag +
        '<polygon points="' + pentagonPoints(size, size, size) + '" fill="' + color + '55" stroke="' + color + '" stroke-width="2.5"/>' +
        '<text x="' + size + '" y="' + (size + 5) + '" text-anchor="middle" fill="white" font-size="' + (size - 2) + '" font-weight="700" font-family="JetBrains Mono">' + building.bb + '</text>' +
        '<text x="' + size + '" y="' + (size * 2 + 12) + '" text-anchor="middle" fill="' + color + '" font-size="9" font-weight="600" font-family="JetBrains Mono">' + building.name.substring(0, 12) + '</text>' +
        splLine +
      '</svg>',
      iconSize: [size * 2, height],
      iconAnchor: [size, size]
    });
  }

  /**
   * CSP-safe tile layer: fetches tiles via content script fetch() (extension origin)
   * then converts to blob URLs. Bypasses host page CSP img-src restrictions.
   */
  var FetchTileLayer = null;
  if (typeof L !== 'undefined') {
    FetchTileLayer = L.TileLayer.extend({
      createTile: function(coords, done) {
        var tile = document.createElement('img');
        var url = this.getTileUrl(coords);
        fetch(url, { mode: 'cors' })
          .then(function(r) { return r.blob(); })
          .then(function(blob) {
            tile.onload = function() { URL.revokeObjectURL(tile.src); done(null, tile); };
            tile.onerror = function() { done(new Error('tile load error'), tile); };
            tile.src = URL.createObjectURL(blob);
          })
          .catch(function() {
            // Fallback: try direct img load (might work if CSP allows)
            tile.onload = function() { done(null, tile); };
            tile.onerror = function() { done(new Error('tile error'), tile); };
            tile.crossOrigin = 'anonymous';
            tile.src = url;
          });
        return tile;
      }
    });
  }

  /**
   * Create Esri World Imagery tile layer (CSP-safe)
   */
  function createSatelliteLayer() {
    if (FetchTileLayer) {
      return new FetchTileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: 'Esri Satellite', maxZoom: 20 }
      );
    }
    return L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: 'Esri Satellite', maxZoom: 20 }
    );
  }

  /**
   * Create OSM street map tile layer (CSP-safe)
   */
  function createStreetLayer() {
    if (FetchTileLayer) {
      return new FetchTileLayer(
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        { attribution: 'OSM', maxZoom: 19 }
      );
    }
    return L.tileLayer(
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      { attribution: 'OSM', maxZoom: 19 }
    );
  }

  /**
   * Create Esri road labels overlay (CSP-safe)
   */
  function createLabelsLayer() {
    if (FetchTileLayer) {
      return new FetchTileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 20, opacity: 0.5 }
      );
    }
    return L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 20, opacity: 0.5 }
    );
  }

  /**
   * Format TL currency
   */
  function formatTL(n) {
    return n >= 1000 ? (n / 1000).toFixed(0) + 'K TL' : n + ' TL';
  }

  // Public API
  return {
    COLORS,
    CABLE_STYLES,
    pentagonPoints,
    getNodeColor,
    getCableStyle,
    createPentagonIcon,
    createSatelliteLayer,
    createStreetLayer,
    createLabelsLayer,
    formatTL
  };
})();
