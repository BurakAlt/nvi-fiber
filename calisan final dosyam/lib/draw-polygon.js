/**
 * DrawPolygon - Minimal Leaflet polygon drawing tool
 * Uses NVI page's global L (Leaflet) to draw boundary polygons
 * ES5+ compatible
 */

var DrawPolygon = (function() {
  'use strict';

  var _map = null;
  var _active = false;
  var _vertices = [];       // L.LatLng array
  var _markers = [];        // L.circleMarker array
  var _polyline = null;     // Live preview polyline
  var _polygon = null;      // Final polygon
  var _cursorLine = null;   // Line following cursor
  var _onComplete = null;
  var _prevDoubleClickZoom = false;

  var VERTEX_STYLE = {
    radius: 6,
    fillColor: '#facc15',
    fillOpacity: 0.9,
    color: '#000',
    weight: 1.5
  };

  var LINE_STYLE = {
    color: '#facc15',
    weight: 2,
    dashArray: '6 4',
    opacity: 0.8
  };

  var POLYGON_STYLE = {
    color: '#facc15',
    weight: 2,
    dashArray: '8 5',
    fillColor: '#facc15',
    fillOpacity: 0.08
  };

  /**
   * Start drawing mode
   * @param {L.Map} map - Leaflet map instance
   * @param {Function} onComplete - callback(latlngs, polygonLayer)
   */
  function start(map, onComplete) {
    if (_active) stop();
    _map = map;
    _active = true;
    _vertices = [];
    _markers = [];
    _onComplete = onComplete;

    // Disable double-click zoom
    _prevDoubleClickZoom = _map.doubleClickZoom.enabled();
    _map.doubleClickZoom.disable();

    // Set crosshair cursor
    _map.getContainer().style.cursor = 'crosshair';

    _map.on('click', onMapClick);
    _map.on('dblclick', onMapDblClick);
    _map.on('mousemove', onMapMouseMove);
    document.addEventListener('keydown', onKeyDown);
  }

  /**
   * Stop drawing (cancel)
   */
  function stop() {
    if (!_map) return;
    _active = false;

    _map.off('click', onMapClick);
    _map.off('dblclick', onMapDblClick);
    _map.off('mousemove', onMapMouseMove);
    document.removeEventListener('keydown', onKeyDown);

    // Restore cursor
    _map.getContainer().style.cursor = '';

    // Restore double-click zoom
    if (_prevDoubleClickZoom) _map.doubleClickZoom.enable();

    // Remove drawing artifacts
    clearDrawingLayers();
  }

  /**
   * Remove final polygon from map
   */
  function removePolygon() {
    if (_polygon && _map) {
      _map.removeLayer(_polygon);
      _polygon = null;
    }
  }

  /**
   * Is drawing active?
   */
  function isActive() {
    return _active;
  }

  // ─── Internal handlers ──────────────────────────────────────

  function onMapClick(e) {
    if (!_active) return;

    var latlng = e.latlng;

    // Check proximity to first vertex (close polygon)
    if (_vertices.length >= 3) {
      var firstPx = _map.latLngToContainerPoint(_vertices[0]);
      var clickPx = _map.latLngToContainerPoint(latlng);
      var dist = firstPx.distanceTo(clickPx);
      if (dist < 15) {
        closePolygon();
        return;
      }
    }

    _vertices.push(latlng);

    // Add vertex marker
    var marker = L.circleMarker(latlng, VERTEX_STYLE).addTo(_map);
    _markers.push(marker);

    // Update preview polyline
    updatePolyline();
  }

  function onMapDblClick(e) {
    if (!_active) return;
    L.DomEvent.stopPropagation(e);
    L.DomEvent.preventDefault(e);

    if (_vertices.length >= 3) {
      closePolygon();
    }
  }

  function onMapMouseMove(e) {
    if (!_active || _vertices.length === 0) return;

    var lastPt = _vertices[_vertices.length - 1];
    if (_cursorLine) _map.removeLayer(_cursorLine);
    _cursorLine = L.polyline([lastPt, e.latlng], {
      color: '#facc15',
      weight: 1.5,
      dashArray: '4 4',
      opacity: 0.5
    }).addTo(_map);
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') stop();
  }

  function closePolygon() {
    if (_vertices.length < 3) return;

    // Create final polygon
    _polygon = L.polygon(_vertices, POLYGON_STYLE).addTo(_map);

    var latlngs = _vertices.slice(); // copy

    // Clean up drawing artifacts
    clearDrawingLayers();
    _active = false;

    // Restore cursor and events
    _map.getContainer().style.cursor = '';
    _map.off('click', onMapClick);
    _map.off('dblclick', onMapDblClick);
    _map.off('mousemove', onMapMouseMove);
    document.removeEventListener('keydown', onKeyDown);

    // Restore double-click zoom (delayed to avoid triggering)
    setTimeout(function() {
      if (_prevDoubleClickZoom && _map) _map.doubleClickZoom.enable();
    }, 300);

    if (_onComplete) _onComplete(latlngs, _polygon);
  }

  function clearDrawingLayers() {
    for (var i = 0; i < _markers.length; i++) {
      if (_map) _map.removeLayer(_markers[i]);
    }
    _markers = [];
    if (_polyline && _map) _map.removeLayer(_polyline);
    _polyline = null;
    if (_cursorLine && _map) _map.removeLayer(_cursorLine);
    _cursorLine = null;
  }

  function updatePolyline() {
    if (_polyline && _map) _map.removeLayer(_polyline);
    if (_vertices.length >= 2) {
      _polyline = L.polyline(_vertices, LINE_STYLE).addTo(_map);
    }
  }

  return {
    start: start,
    stop: stop,
    removePolygon: removePolygon,
    isActive: isActive
  };
})();
