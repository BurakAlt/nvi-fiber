/**
 * Panels v2 - Single side panel UI
 * Layout: Toolbar (top) + Side Panel (right, full height)
 * Side Panel: Stat cards > Ada tabs > Building list (drag-drop) > Dashboard link
 */

const Panels = (() => {
  let panelContainer = null;
  let toolbarContainer = null;
  function init() {
    injectToolbar();
    injectSidePanel();
    refresh();
  }

  function injectToolbar() {
    toolbarContainer = document.createElement('div');
    toolbarContainer.id = 'fp-toolbar';
    toolbarContainer.innerHTML = '<div class="fp-toolbar-inner">' +
      '<span class="fp-logo">FIBERPLAN</span>' +
      '<span class="fp-sep"></span>' +
      '<span class="fp-stat" id="fp-stat-ada">Ada: <b>0</b></span>' +
      '<span class="fp-stat" id="fp-stat-bldg">Bina: <b>0</b></span>' +
      '<span class="fp-stat" id="fp-stat-bb">BB: <b>0</b></span>' +
      '<span class="fp-sep"></span>' +
      '<button class="fp-btn fp-btn-ada" id="fp-btn-adabitir">ADA BITIR</button>' +
      '<button class="fp-btn" id="fp-btn-yeniada">+ ADA</button>' +
      '<button class="fp-btn" id="fp-btn-draw-poly">SINIR CIZ</button>' +
      '<button class="fp-btn" id="fp-btn-cable-mode">KABLO CIZ</button>' +
      '<button class="fp-btn" id="fp-btn-map-toggle">HARITA</button>' +
      '<span class="fp-notification" id="fp-status-msg"></span>' +
      '<div class="fp-toolbar-right">' +
      '<button class="fp-btn fp-btn-sm" id="fp-btn-export-geojson">GeoJSON</button>' +
      '<button class="fp-btn fp-btn-sm" id="fp-btn-export-json">JSON</button>' +
      '<button class="fp-btn fp-btn-sm" id="fp-btn-export-csv">CSV</button>' +
      '<span class="fp-sep"></span>' +
      '<button class="fp-btn fp-btn-sm fp-btn-dashboard" id="fp-btn-dashboard">DASHBOARD</button>' +
      '</div></div>';
    document.body.appendChild(toolbarContainer);

    document.getElementById('fp-btn-adabitir').addEventListener('click', handleAdaBitir);
    document.getElementById('fp-btn-yeniada').addEventListener('click', handleYeniAda);
    document.getElementById('fp-btn-draw-poly').addEventListener('click', handleDrawBoundary);
    document.getElementById('fp-btn-cable-mode').addEventListener('click', handleCableMode);
    document.getElementById('fp-btn-map-toggle').addEventListener('click', function() {
      var isOn = Overlay.toggle();
      var btn = document.getElementById('fp-btn-map-toggle');
      if (isOn) {
        btn.classList.add('fp-btn-danger');
        btn.textContent = 'HARITA \u2716';
      } else {
        btn.classList.remove('fp-btn-danger');
        btn.textContent = 'HARITA';
      }
    });
    document.getElementById('fp-btn-export-json').addEventListener('click', handleExportJSON);
    document.getElementById('fp-btn-export-csv').addEventListener('click', handleExportCSV);
    document.getElementById('fp-btn-export-geojson').addEventListener('click', handleExportGeoJSON);
    document.getElementById('fp-btn-dashboard').addEventListener('click', function() {
      window.open(chrome.runtime.getURL('dashboard/dashboard.html'), '_blank');
    });
  }

  function injectSidePanel() {
    panelContainer = document.createElement('div');
    panelContainer.id = 'fp-side-panel';
    panelContainer.innerHTML = '<div class="fp-panel-header">Ada & Bina Yonetimi</div>' +
      '<div id="fp-stat-cards"></div>' +
      '<div class="fp-ada-selector" id="fp-ada-selector"></div>' +
      '<div class="fp-search-bar"><input type="text" id="fp-bldg-search" placeholder="Bina ara..."></div>' +
      '<div class="fp-building-list" id="fp-building-list"></div>' +
      '<div class="fp-panel-footer" id="fp-panel-footer">' +
      '<button class="fp-btn fp-btn-sm fp-btn-dashboard-panel" id="fp-btn-dashboard-panel">DASHBOARD\'DA DETAY GOR</button>' +
      '</div>';
    document.body.appendChild(panelContainer);

    document.getElementById('fp-bldg-search').addEventListener('input', function(e) {
      filterBuildings(e.target.value);
    });

    document.getElementById('fp-btn-dashboard-panel').addEventListener('click', function() {
      window.open(chrome.runtime.getURL('dashboard/dashboard.html'), '_blank');
    });
  }

  function refresh() {
    renderStatCards();
    renderAdaSelector();
    renderTopoPreview();
    renderBuildingList();
    updateStats();
  }

  function renderStatCards() {
    var el = document.getElementById('fp-stat-cards');
    if (!el) return;

    var P = Topology.PROJECT;
    var ada = P.viewMode === 'all' ? null : Topology.getAda(P.viewMode);

    if (ada) {
      var blds = ada.buildings;
      var totalBB = blds.reduce(function(s, b) { return s + b.bb; }, 0);
      var totalCable = (ada.calculations.cables || []).reduce(function(s, c) { return s + c.distanceM; }, 0);
      var cap = ada.calculations.oltCapacity;
      var worst = (ada.calculations.lossBudget || []).length > 0
        ? ada.calculations.lossBudget.reduce(function(w, l) { return l.totalLoss > w.totalLoss ? l : w; }, ada.calculations.lossBudget[0])
        : null;

      el.innerHTML = '<div class="fp-compact-stats">' +
        '<span>' + blds.length + ' bina</span>' +
        '<span class="fp-cs-sep">\u00b7</span>' +
        '<span class="fp-cs-accent">' + totalBB + ' BB</span>' +
        '<span class="fp-cs-sep">\u00b7</span>' +
        '<span>' + (cap ? cap.requiredPorts + 'P' : '-') + '</span>' +
        '<span class="fp-cs-sep">\u00b7</span>' +
        '<span>' + (totalCable / 1000).toFixed(1) + 'km</span>' +
        (worst ? '<span class="fp-cs-sep">\u00b7</span><span style="color:' + (worst.margin < 0 ? '#ef4444' : '#22c55e') + '">' + worst.margin + 'dB</span>' : '') +
        '</div>';
    } else {
      var totalAda = P.adas.length;
      var totalBldg = P.adas.reduce(function(s, a) { return s + a.buildings.length; }, 0);
      var totalBBAll = P.adas.reduce(function(s, a) { return s + a.buildings.reduce(function(s2, b) { return s2 + b.bb; }, 0); }, 0);

      el.innerHTML = '<div class="fp-stat-row">' +
        '<div class="fp-stat-box"><div class="val">' + totalAda + '</div><div class="lbl">Ada</div></div>' +
        '<div class="fp-stat-box"><div class="val">' + totalBldg + '</div><div class="lbl">Bina</div></div>' +
        '<div class="fp-stat-box"><div class="val">' + totalBBAll + '</div><div class="lbl">BB</div></div>' +
        '</div>';
    }
  }

  function renderAdaSelector() {
    var el = document.getElementById('fp-ada-selector');
    if (!el) return;

    var P = Topology.PROJECT;
    var activeAda = P.viewMode === 'all' ? null : Topology.getAda(P.viewMode);

    // Current selection label
    var currentLabel;
    if (activeAda) {
      var code = activeAda.code || 'DA-' + String(activeAda.id).padStart(3, '0');
      var icon = activeAda.status === 'completed' ? ' \u2713' : '';
      currentLabel = code + ' \u00b7 ' + activeAda.name + ' (' + activeAda.buildings.length + ')' + icon;
    } else {
      currentLabel = 'TUMU (' + P.adas.length + ' ada)';
    }

    var html = '<div class="fp-ada-dropdown">' +
      '<div class="fp-ada-trigger" id="fp-ada-trigger">' +
        '<span class="fp-ada-trigger-text">' + currentLabel + '</span>' +
        '<span class="fp-ada-arrow">\u25BC</span>' +
      '</div>' +
      '<div class="fp-ada-panel" id="fp-ada-panel">' +
        '<input type="text" class="fp-ada-filter" id="fp-ada-filter" placeholder="Ada ara / filtrele...">' +
        '<div class="fp-ada-list" id="fp-ada-list">';

    // TUMU option
    html += '<div class="fp-ada-item' + (P.viewMode === 'all' ? ' active' : '') + '" data-ada="all">' +
      '<span class="fp-ada-item-code">TUMU</span>' +
      '<span class="fp-ada-item-name">' + P.adas.length + ' ada \u00b7 ' + P.adas.reduce(function(s, a) { return s + a.buildings.length; }, 0) + ' bina</span>' +
      '</div>';

    // Ada options
    P.adas.forEach(function(ada) {
      var isActive = P.viewMode === ada.id;
      var adaCode = ada.code || 'DA-' + String(ada.id).padStart(3, '0');
      var adaIcon = ada.status === 'completed' ? ' \u2713' : '';
      var totalBB = ada.buildings.reduce(function(s, b) { return s + b.bb; }, 0);
      html += '<div class="fp-ada-item' + (isActive ? ' active' : '') + '" data-ada="' + ada.id + '">' +
        '<span class="fp-ada-item-code">' + adaCode + '</span>' +
        '<span class="fp-ada-item-name">' + ada.name + adaIcon + '</span>' +
        '<span class="fp-ada-item-info">' + ada.buildings.length + ' bina \u00b7 ' + totalBB + ' BB</span>' +
        '</div>';
    });

    html += '</div></div></div>';

    // Status line for active ada
    if (activeAda) {
      var stCode = activeAda.code || 'DA-' + String(activeAda.id).padStart(3, '0');
      var stStatus = activeAda.status === 'completed' ? 'Tamamlandi' : 'Planlama';
      html += '<div class="fp-ada-status">' + stCode + ' \u00b7 ' + activeAda.name + ' \u00b7 ' + stStatus + '</div>';
    }

    el.innerHTML = html;

    // ── Bind dropdown events ──
    var trigger = document.getElementById('fp-ada-trigger');
    var panel = document.getElementById('fp-ada-panel');
    var filterInput = document.getElementById('fp-ada-filter');
    var isOpen = false;

    function togglePanel() {
      isOpen = !isOpen;
      panel.style.display = isOpen ? 'flex' : 'none';
      if (isOpen && filterInput) { filterInput.value = ''; filterAdaList(''); filterInput.focus(); }
    }

    if (trigger) trigger.addEventListener('click', togglePanel);

    // Filter
    if (filterInput) {
      filterInput.addEventListener('input', function() {
        filterAdaList(filterInput.value.toLowerCase());
      });
      filterInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') { isOpen = false; panel.style.display = 'none'; }
      });
    }

    function filterAdaList(query) {
      var items = document.querySelectorAll('#fp-ada-list .fp-ada-item');
      items.forEach(function(item) {
        if (!query) { item.style.display = ''; return; }
        var text = item.textContent.toLowerCase();
        item.style.display = text.indexOf(query) >= 0 ? '' : 'none';
      });
    }

    // Item click
    el.querySelectorAll('.fp-ada-item').forEach(function(item) {
      item.addEventListener('click', function() {
        var adaId = item.dataset.ada;
        Topology.switchView(adaId === 'all' ? 'all' : parseInt(adaId));
        isOpen = false;
        panel.style.display = 'none';
        Overlay.render();
        refresh();
      });

      // Right-click context menu (not on TUMU)
      if (item.dataset.ada !== 'all') {
        item.addEventListener('contextmenu', function(e) {
          e.preventDefault();
          var ctxAdaId = parseInt(item.dataset.ada);
          var ctxAda = Topology.getAda(ctxAdaId);
          if (!ctxAda) return;
          showAdaContextMenu(e, ctxAda);
        });
      }
    });

    // Close on outside click (remove previous listener to prevent accumulation)
    if (renderAdaSelector._closeHandler) {
      document.removeEventListener('click', renderAdaSelector._closeHandler);
    }
    renderAdaSelector._closeHandler = function(e) {
      if (!el.contains(e.target) && isOpen) {
        isOpen = false;
        panel.style.display = 'none';
      }
    };
    setTimeout(function() {
      document.addEventListener('click', renderAdaSelector._closeHandler);
    }, 10);
  }

  function renderTopoPreview() {
    var container = document.getElementById('fp-topo-mini');
    if (!container) {
      // Create container after building list
      var list = document.getElementById('fp-building-list');
      if (!list) return;
      container = document.createElement('div');
      container.id = 'fp-topo-mini';
      list.parentNode.insertBefore(container, list);
    }

    var P = Topology.PROJECT;
    var ada = P.viewMode === 'all' ? null : Topology.getAda(P.viewMode);
    if (!ada || ada.status !== 'completed' || ada.buildings.length === 0) {
      container.style.display = 'none';
      return;
    }

    var oltB = ada.buildings.find(function(b) { return b.id === ada.topology.oltBuildingId; });
    if (!oltB) { container.style.display = 'none'; return; }

    container.style.display = '';
    var blds = ada.buildings;
    var nonOLT = blds.filter(function(b) { return b.id !== oltB.id; });
    var n = nonOLT.length;

    // Simple horizontal layout
    var W = 300, H = 100, cy = 50;
    var oltX = W / 2;
    var gap = Math.min(40, (W - 40) / Math.max(n, 1));
    var half = Math.ceil(n / 2);

    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '">';

    // Position nodes
    var positions = [];
    positions.push({ x: oltX, y: cy, b: oltB, isOLT: true });

    for (var i = 0; i < half && i < n; i++) {
      positions.push({ x: oltX - (i + 1) * gap, y: cy, b: nonOLT[i], isOLT: false });
    }
    for (var j = half; j < n; j++) {
      positions.push({ x: oltX + (j - half + 1) * gap, y: cy, b: nonOLT[j], isOLT: false });
    }

    // Draw cables (simple lines between consecutive)
    var mstEdges = PonEngine.buildMST(blds, oltB.id);
    var posMap = {};
    for (var pi = 0; pi < positions.length; pi++) {
      posMap[positions[pi].b.id] = positions[pi];
    }

    for (var ei = 0; ei < mstEdges.length; ei++) {
      var e = mstEdges[ei];
      var fp = posMap[e.from];
      var tp = posMap[e.to];
      if (fp && tp) {
        svg += '<line x1="' + fp.x + '" y1="' + fp.y + '" x2="' + tp.x + '" y2="' + tp.y + '" class="mini-cable"/>';
      }
    }

    // Ring closure
    if (ada.topology.ringCable) {
      var rf = posMap[ada.topology.ringCable.from];
      var rt = posMap[ada.topology.ringCable.to];
      if (rf && rt) {
        var mX = (rf.x + rt.x) / 2;
        svg += '<path d="M ' + rf.x + ' ' + (rf.y + 6) + ' Q ' + mX + ' ' + (H - 2) + ', ' + rt.x + ' ' + (rt.y + 6) + '" class="mini-cable ring" fill="none"/>';
      }
    }

    // Draw nodes
    for (var k = 0; k < positions.length; k++) {
      var p = positions[k];
      var r = p.isOLT ? 6 : 4;
      var cls = p.isOLT ? 'mini-node is-olt' : 'mini-node';
      svg += '<circle cx="' + p.x + '" cy="' + p.y + '" r="' + r + '" class="' + cls + '"/>';
      if (p.isOLT) {
        svg += '<text x="' + p.x + '" y="' + (p.y - 10) + '" text-anchor="middle" font-size="6" fill="#a78bfa" font-weight="700">OLT</text>';
      }
    }

    svg += '</svg>';
    container.innerHTML = svg;
  }

  function renderBuildingList() {
    var list = document.getElementById('fp-building-list');
    if (!list) return;

    var P = Topology.PROJECT;
    var ada = P.viewMode === 'all' ? null : Topology.getAda(P.viewMode);
    var buildings = ada ? ada.buildings : Topology.getAllBuildings();

    if (buildings.length === 0) {
      list.innerHTML = '<div class="fp-empty"><div class="fp-empty-icon">\u2B21</div>Henuz bina eklenmedi.<br>NVI tablosundan otomatik eklenir.</div>';
      return;
    }

    // Cable mode info bar
    var html = '';
    if (cableState.active && ada && ada.topology.manualEdges) {
      var mEdges = ada.topology.manualEdges;
      var srcBldg = cableState.sourceId ? ada.buildings.find(function(b) { return b.id === cableState.sourceId; }) : null;
      html += '<div class="fp-cable-bar">' +
        '<div class="fp-cable-bar-info">' +
        '<span style="color:#22c55e;font-weight:700">KABLO CIZ</span>' +
        '<span>' + mEdges.length + ' kablo</span>' +
        (srcBldg ? '<span style="color:#facc15">Kaynak: ' + srcBldg.name + '</span>' : '<span style="color:#94a3b8">Kaynak bina sec...</span>') +
        '</div>' +
        '<div class="fp-cable-bar-actions">' +
        '<button class="fp-btn fp-btn-sm" id="fp-cable-hesapla" style="background:#06b6d4;border-color:#06b6d4;color:#000;font-weight:700">HESAPLA</button>' +
        '<button class="fp-btn fp-btn-sm" id="fp-cable-auto" style="color:#f97316">OTOMATIK</button>' +
        '</div></div>';

      // List current cables (deletable)
      if (mEdges.length > 0) {
        html += '<div class="fp-cable-list">';
        for (var ci = 0; ci < mEdges.length; ci++) {
          var ce = mEdges[ci];
          var ceFrom = ada.buildings.find(function(b) { return b.id === ce.from; });
          var ceTo = ada.buildings.find(function(b) { return b.id === ce.to; });
          var ceDist = (ceFrom && ceTo) ? Math.round(PonEngine.safeDist(ceFrom, ceTo)) : '?';
          html += '<div class="fp-cable-item" data-from="' + ce.from + '" data-to="' + ce.to + '">' +
            '<span class="fp-cable-line"></span>' +
            '<span>' + (ceFrom ? ceFrom.name : '?') + '</span>' +
            '<span class="fp-cable-arrow">\u2194</span>' +
            '<span>' + (ceTo ? ceTo.name : '?') + '</span>' +
            '<span class="fp-cable-dist">' + ceDist + 'm</span>' +
            '<button class="fp-cable-del" title="Sil">\u00d7</button>' +
            '</div>';
        }
        html += '</div>';
      }
    }

    html += '<div class="fp-section-label fp-section-with-action">' +
      '<span>BINALAR (' + buildings.length + ')</span>' +
      '<button class="fp-btn-bulk-main" id="fp-btn-bulk-mode">TOPLU SIL</button>' +
      '</div>';

    // Pre-compute OLT building and distances
    var oltB = ada ? ada.buildings.find(function(x) { return x.id === ada.topology.oltBuildingId; }) : null;

    buildings.forEach(function(b) {
      var bAda = ada || P.adas.find(function(a) { return a.buildings.some(function(x) { return x.id === b.id; }); });
      if (!bAda) return;
      var isOLT = b.id === bAda.topology.oltBuildingId;
      var isAnten = b.id === bAda.topology.antenBuildingId;
      var isFDH = bAda.topology.fdhNodes && bAda.topology.fdhNodes.some(function(f) { return f.buildingId === b.id; });
      var type = PonEngine.getBuildingType(b, bAda);
      var color = (MapUtils.COLORS[type] && MapUtils.COLORS[type].hex) || MapUtils.COLORS.default.hex;
      var splData = bAda.calculations.splitters && bAda.calculations.splitters.find(function(s) { return s.buildingId === b.id; });
      // Show building's own splitter (level 2), FDH shows both levels
      var cascadeStr;
      if (splData && splData.cascade && splData.cascade.level1) {
        cascadeStr = isFDH
          ? '1:' + splData.cascade.level1.ratio + '\u21921:' + splData.cascade.level2.ratio
          : '1:' + splData.cascade.level2.ratio;
      } else if (splData && splData.cascade && splData.cascade.level2) {
        cascadeStr = '1:' + splData.cascade.level2.ratio;
      } else {
        var spl = PonEngine.calcSplitter(b.bb);
        cascadeStr = spl.map(function(s) { return '1:' + s.ratio; }).join('+');
      }

      // Distance from OLT
      var distStr = '';
      if (oltB && !isOLT) {
        var lossBudgetItem = (bAda.calculations.lossBudget || []).find(function(l) { return l.buildingId === b.id; });
        if (lossBudgetItem) {
          distStr = lossBudgetItem.distanceM + 'm';
        } else {
          distStr = Math.round(PonEngine.safeDist(oltB, b)) + 'm';
        }
      }

      // Manual parent info
      var parentStr = '';
      var manParents = bAda.topology.manualParents || {};
      if (manParents[b.id]) {
        var parentB = bAda.buildings.find(function(x) { return x.id === manParents[b.id]; });
        if (parentB) parentStr = '\u2192 ' + parentB.name.substring(0, 10);
      }

      var isCableSrc = cableState.active && cableState.sourceId === b.id;
      html += '<div class="fp-bldg-card ' + (isOLT ? 'is-olt' : '') + ' ' + (isFDH ? 'is-fdh' : '') + (isCableSrc ? ' cable-source' : '') + (cableState.active ? ' cable-mode' : '') + '"' +
        ' style="border-left:3px solid ' + color + '"' +
        ' draggable="' + (cableState.active ? 'false' : 'true') + '" data-id="' + b.id + '" data-ada="' + bAda.id + '">' +
        '<div class="fp-bldg-top">' +
        '<input type="checkbox" class="fp-bldg-chk fp-bulk-hidden" data-id="' + b.id + '" data-ada="' + bAda.id + '">' +
        '<span class="fp-drag-handle">\u2817</span>' +
        '<span class="fp-bldg-name fp-editable" data-field="name" data-id="' + b.id + '" data-ada="' + bAda.id + '">' + b.name + '</span>' +
        '<span class="fp-bldg-bb fp-editable" data-field="bb" data-id="' + b.id + '" data-ada="' + bAda.id + '">' + b.bb + '</span>' +
        (distStr ? '<span class="fp-bldg-dist">' + distStr + '</span>' : '') +
        '<button class="fp-bldg-del" data-id="' + b.id + '" data-ada="' + bAda.id + '" title="Bina sil">\u00d7</button>' +
        '</div>' +
        '<div class="fp-bldg-badges">' +
        (isOLT ? '<span class="fp-badge olt">OLT</span>' : '') +
        (isFDH ? '<span class="fp-badge fdh">FDH</span>' : '') +
        '<span class="fp-badge splitter">' + cascadeStr + '</span>' +
        '</div>' +
        '</div>';
    });

    list.innerHTML = html;
    bindBuildingEvents(list);
  }

  function bindBuildingEvents(list) {
    var dragSrc = null;

    // Cable mode: bind HESAPLA and OTOMATIK buttons
    var hesaplaBtn = document.getElementById('fp-cable-hesapla');
    var autoBtn = document.getElementById('fp-cable-auto');
    if (hesaplaBtn) {
      hesaplaBtn.addEventListener('click', function() {
        var P = Topology.PROJECT;
        var ada = P.viewMode === 'all' ? null : Topology.getAda(P.viewMode);
        if (ada) handleCableHesapla(ada);
      });
    }
    if (autoBtn) {
      autoBtn.addEventListener('click', function() {
        var P = Topology.PROJECT;
        var ada = P.viewMode === 'all' ? null : Topology.getAda(P.viewMode);
        if (!ada) return;
        if (!confirm('Manuel kablolar silinecek, otomatik MST\'ye donulecek. Emin misiniz?')) return;
        Topology.clearManualEdges(ada.id);
        cableState.active = false;
        cableState.sourceId = null;
        var btn = document.getElementById('fp-btn-cable-mode');
        if (btn) { btn.classList.remove('fp-btn-draw-active'); btn.textContent = 'KABLO CIZ'; }
        Storage.autoSave();
        Overlay.render();
        refresh();
        showNotification('Otomatik MST\'ye donuldu', 'info');
      });
    }

    // Cable mode: bind delete buttons on cable list
    list.querySelectorAll('.fp-cable-del').forEach(function(delBtn) {
      delBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        var item = delBtn.closest('.fp-cable-item');
        if (!item) return;
        var fromId = parseInt(item.dataset.from);
        var toId = parseInt(item.dataset.to);
        var P = Topology.PROJECT;
        var ada = P.viewMode === 'all' ? null : Topology.getAda(P.viewMode);
        if (ada) handleCableDelete(fromId, toId, ada);
      });
    });

    list.querySelectorAll('.fp-bldg-card').forEach(function(card) {
      // Cable mode: click to select source/target
      card.addEventListener('click', function(e) {
        if (!cableState.active) return;
        e.stopPropagation();
        e.preventDefault();
        var bId = parseInt(card.dataset.id);
        var aId = parseInt(card.dataset.ada);
        var cardAda = Topology.getAda(aId);
        if (cardAda) handleCableClick(bId, cardAda);
      });

      card.addEventListener('dragstart', function(e) {
        if (cableState.active) { e.preventDefault(); return; }
        dragSrc = card;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        // Include both building ID and ada ID for cross-panel drops (e.g., onto map)
        e.dataTransfer.setData('text/plain', card.dataset.id + ':' + card.dataset.ada);
      });

      card.addEventListener('dragend', function() {
        card.classList.remove('dragging');
        list.querySelectorAll('.fp-bldg-card').forEach(function(c) { c.classList.remove('drag-over'); });
        dragSrc = null;
      });

      card.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (card !== dragSrc) card.classList.add('drag-over');
      });

      card.addEventListener('dragleave', function() {
        card.classList.remove('drag-over');
      });

      card.addEventListener('drop', function(e) {
        e.preventDefault();
        card.classList.remove('drag-over');
        if (!dragSrc || dragSrc === card) return;

        var srcId = parseInt(dragSrc.dataset.id);
        var tgtId = parseInt(card.dataset.id);
        var adaId = parseInt(card.dataset.ada);
        var dropAda = Topology.getAda(adaId);
        if (!dropAda) return;

        var srcIdx = dropAda.buildings.findIndex(function(b) { return b.id === srcId; });
        var tgtIdx = dropAda.buildings.findIndex(function(b) { return b.id === tgtId; });
        if (srcIdx < 0 || tgtIdx < 0) return;

        var moved = dropAda.buildings.splice(srcIdx, 1)[0];
        dropAda.buildings.splice(tgtIdx, 0, moved);

        PonEngine.recalculateAda(dropAda);
        Overlay.render();
        refresh();
        Storage.autoSave();
      });

      card.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        var bId = parseInt(card.dataset.id);
        var aId = parseInt(card.dataset.ada);
        var cardAda = Topology.getAda(aId);
        if (!cardAda) return;
        var building = cardAda.buildings.find(function(x) { return x.id === bId; });
        if (!building) return;
        showBuildingContextMenu(e, building, cardAda);
      });
    });

    list.querySelectorAll('.fp-editable').forEach(function(el) {
      el.addEventListener('dblclick', function(e) {
        e.stopPropagation();
        startInlineEdit(el);
      });
    });

    // Delete buttons on each building card
    list.querySelectorAll('.fp-bldg-del').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        e.preventDefault();
        var bId = parseInt(btn.dataset.id);
        var aId = parseInt(btn.dataset.ada);
        var delAda = Topology.getAda(aId);
        if (!delAda) return;
        var building = delAda.buildings.find(function(x) { return x.id === bId; });
        if (!building) return;
        Topology.removeBuilding(delAda, bId);
        PonEngine.recalculateAda(delAda);
        Overlay.render();
        refresh();
        Storage.autoSave();
        showNotification(building.name + ' silindi', 'info');
      });
    });

    // ── Quick action buttons (OLT, ANT, PTP, parent) ──
    list.querySelectorAll('.fp-qbtn[data-action]').forEach(function(qbtn) {
      qbtn.addEventListener('click', function(e) {
        e.stopPropagation();
        e.preventDefault();
        var action = qbtn.dataset.action;
        var bId = parseInt(qbtn.dataset.id);
        var aId = parseInt(qbtn.dataset.ada);
        var qAda = Topology.getAda(aId);
        if (!qAda) return;
        var qBldg = qAda.buildings.find(function(x) { return x.id === bId; });
        if (!qBldg) return;

        if (action === 'set-olt') {
          Topology.setOLT(qAda, bId);
          PonEngine.recalculateAda(qAda);
          showNotification(qBldg.name + ' → OLT atandi', 'success');
        } else if (action === 'set-anten') {
          Topology.setAntenna(qAda, bId);
          showNotification(qBldg.name + ' → Anten atandi', 'success');
        } else if (action === 'add-ptp') {
          showPtpDialog(qAda, qBldg);
          return; // dialog handles refresh
        } else if (action === 'set-parent') {
          showParentPicker(qAda, qBldg);
          return; // picker handles refresh
        } else if (action === 'place') {
          // Open map if not visible, then start place mode
          if (!Overlay.isVisible()) {
            Overlay.show();
            var mapBtn = document.getElementById('fp-btn-map-toggle');
            if (mapBtn) { mapBtn.classList.add('fp-btn-danger'); mapBtn.textContent = 'HARITA \u2716'; }
          }
          Overlay.startPlaceMode(bId, aId);
          showNotification(qBldg.name + ': haritaya tiklayarak yerlestirin', 'info');
          return; // no refresh needed yet
        }
        Overlay.render();
        refresh();
        Storage.autoSave();
      });
    });

    // ── Bulk delete mode ──
    var bulkModeBtn = document.getElementById('fp-btn-bulk-mode');
    if (bulkModeBtn) {
      bulkModeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        enterBulkMode(list);
      });
    }
  }

  // ─── BULK DELETE MODE ─────────────────────────────────────────

  function enterBulkMode(list) {
    // Show checkboxes
    list.querySelectorAll('.fp-bldg-chk').forEach(function(chk) {
      chk.classList.remove('fp-bulk-hidden');
      chk.checked = false;
    });

    // Hide single delete buttons while in bulk mode
    list.classList.add('fp-bulk-active');

    // Hide the "TOPLU SIL" trigger button
    var triggerBtn = document.getElementById('fp-btn-bulk-mode');
    if (triggerBtn) triggerBtn.style.display = 'none';

    // Create floating action bar
    var existing = document.getElementById('fp-bulk-bar');
    if (existing) existing.remove();

    var bar = document.createElement('div');
    bar.id = 'fp-bulk-bar';
    bar.className = 'fp-bulk-bar';
    bar.innerHTML =
      '<span class="fp-bulk-count" id="fp-bulk-count">0 secildi</span>' +
      '<button class="fp-btn fp-btn-sm" id="fp-bulk-all">TUMU SEC</button>' +
      '<button class="fp-btn fp-btn-sm fp-btn-bulk-confirm" id="fp-bulk-delete" disabled>SIL</button>' +
      '<button class="fp-btn fp-btn-sm" id="fp-bulk-cancel">IPTAL</button>';

    var panel = document.getElementById('fp-side-panel');
    if (panel) panel.appendChild(bar);

    // Show first-time tip
    showBulkTip();

    var checkboxes = list.querySelectorAll('.fp-bldg-chk');

    function updateCount() {
      var checked = list.querySelectorAll('.fp-bldg-chk:checked');
      var n = checked.length;
      var countEl = document.getElementById('fp-bulk-count');
      var delBtn = document.getElementById('fp-bulk-delete');
      if (countEl) countEl.textContent = n + ' secildi';
      if (delBtn) {
        delBtn.disabled = n === 0;
        delBtn.textContent = n > 0 ? 'SIL (' + n + ')' : 'SIL';
      }
    }

    checkboxes.forEach(function(chk) {
      chk.addEventListener('change', updateCount);
    });

    // Select all
    document.getElementById('fp-bulk-all').addEventListener('click', function() {
      var allChecked = list.querySelectorAll('.fp-bldg-chk:checked').length === checkboxes.length;
      checkboxes.forEach(function(chk) { chk.checked = !allChecked; });
      this.textContent = allChecked ? 'TUMU SEC' : 'TUMU BIRAK';
      updateCount();
    });

    // Cancel — exit bulk mode
    document.getElementById('fp-bulk-cancel').addEventListener('click', function() {
      exitBulkMode(list);
    });

    // Delete selected
    document.getElementById('fp-bulk-delete').addEventListener('click', function() {
      var checked = list.querySelectorAll('.fp-bldg-chk:checked');
      var count = checked.length;
      if (count === 0) return;
      if (!confirm(count + ' bina silinecek. Emin misiniz?')) return;

      var affectedAdas = {};
      checked.forEach(function(chk) {
        var bId = parseInt(chk.dataset.id);
        var aId = parseInt(chk.dataset.ada);
        var bulkAda = Topology.getAda(aId);
        if (!bulkAda) return;
        Topology.removeBuilding(bulkAda, bId);
        affectedAdas[aId] = bulkAda;
      });

      for (var aId in affectedAdas) {
        if (affectedAdas.hasOwnProperty(aId)) {
          PonEngine.recalculateAda(affectedAdas[aId]);
        }
      }

      exitBulkMode(list);
      Overlay.render();
      refresh();
      Storage.autoSave();
      showNotification(count + ' bina silindi', 'success');
    });
  }

  function exitBulkMode(list) {
    // Hide checkboxes
    list.querySelectorAll('.fp-bldg-chk').forEach(function(chk) {
      chk.classList.add('fp-bulk-hidden');
      chk.checked = false;
    });
    list.classList.remove('fp-bulk-active');

    // Remove floating bar
    var bar = document.getElementById('fp-bulk-bar');
    if (bar) bar.remove();

    // Restore trigger button
    var triggerBtn = document.getElementById('fp-btn-bulk-mode');
    if (triggerBtn) triggerBtn.style.display = '';
  }

  function showBulkTip() {
    try {
      if (localStorage.getItem('fp_bulk_tip_done')) return;
    } catch (e) { return; }

    var existing = document.getElementById('fp-bulk-tip');
    if (existing) existing.remove();

    var tip = document.createElement('div');
    tip.id = 'fp-bulk-tip';
    tip.className = 'fp-bulk-tip';
    tip.innerHTML =
      '<div class="fp-bulk-tip-title">Toplu Silme Modu</div>' +
      '<div class="fp-bulk-tip-body">' +
        '<p>1. Silmek istediginiz binalarin <b>kutucugunu isaretleyin</b></p>' +
        '<p>2. Hepsini secmek icin <b>TUMU SEC</b> butonunu kullanin</p>' +
        '<p>3. Hazir olunca <b>SIL (N)</b> butonuna basin</p>' +
        '<p>4. Vazgecerseniz <b>IPTAL</b> ile cikabilirsiniz</p>' +
      '</div>' +
      '<button class="fp-btn fp-btn-sm fp-btn-ada" id="fp-bulk-tip-ok">ANLADIM</button>';

    var panel = document.getElementById('fp-side-panel');
    if (panel) panel.appendChild(tip);

    document.getElementById('fp-bulk-tip-ok').addEventListener('click', function() {
      tip.remove();
      try { localStorage.setItem('fp_bulk_tip_done', '1'); } catch (e) {}
    });
  }

  function startInlineEdit(el) {
    var field = el.dataset.field;
    var bId = parseInt(el.dataset.id);
    var aId = parseInt(el.dataset.ada);
    var editAda = Topology.getAda(aId);
    if (!editAda) return;
    var building = editAda.buildings.find(function(b) { return b.id === bId; });
    if (!building) return;

    var currentVal = field === 'bb' ? building.bb : building.name;
    var input = document.createElement('input');
    input.className = 'fp-edit-input ' + field;
    input.value = currentVal;
    input.type = field === 'bb' ? 'number' : 'text';

    el.textContent = '';
    el.appendChild(input);
    input.focus();
    input.select();

    var committed = false;
    var commit = function() {
      if (committed) return;
      committed = true;
      var newVal = field === 'bb' ? Math.max(1, parseInt(input.value) || 1) : (input.value.trim() || building.name);
      if (field === 'bb') {
        building.bb = newVal;
        el.textContent = newVal + ' BB';
      } else {
        building.name = newVal;
        el.textContent = newVal;
      }
      PonEngine.recalculateAda(editAda);
      Overlay.render();
      refresh();
      Storage.autoSave();
    };

    input.addEventListener('blur', commit);
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { e.preventDefault(); commit(); }
      if (e.key === 'Escape') { committed = true; el.textContent = field === 'bb' ? currentVal + ' BB' : currentVal; }
    });
  }

  function filterBuildings(query) {
    var q = query.toLowerCase();
    document.querySelectorAll('.fp-bldg-card').forEach(function(card) {
      card.style.display = card.textContent.toLowerCase().indexOf(q) >= 0 ? '' : 'none';
    });
  }

  function updateStats() {
    var P = Topology.PROJECT;
    var totalBldg = P.adas.reduce(function(s, a) { return s + a.buildings.length; }, 0);
    var totalBB = P.adas.reduce(function(s, a) { return s + a.buildings.reduce(function(s2, b) { return s2 + b.bb; }, 0); }, 0);

    var set = function(id, html) { var el = document.getElementById(id); if (el) el.innerHTML = html; };
    set('fp-stat-ada', 'Ada: <b>' + P.adas.length + '</b>');
    set('fp-stat-bldg', 'Bina: <b>' + totalBldg + '</b>');
    set('fp-stat-bb', 'BB: <b>' + totalBB + '</b>');
  }

  function showBuildingContextMenu(e, building, ada) {
    var existing = document.getElementById('fp-ctx-menu');
    if (existing) existing.remove();

    var isOLT = building.id === ada.topology.oltBuildingId;
    var isAnten = building.id === ada.topology.antenBuildingId;

    var menu = document.createElement('div');
    menu.id = 'fp-ctx-menu';
    menu.className = 'fp-ctx-menu';
    menu.style.left = e.clientX + 'px';
    menu.style.top = e.clientY + 'px';

    // Distance from OLT
    var oltBld = ada.buildings.find(function(x) { return x.id === ada.topology.oltBuildingId; });
    var oltDist = (oltBld && !isOLT) ? Math.round(PonEngine.safeDist(oltBld, building)) + 'm' : '';

    var html = '';
    if (oltDist) html += '<div class="fp-ctx-item disabled" style="font-size:11px;color:#94a3b8">OLT mesafe: ' + oltDist + '</div>';
    if (!isOLT) html += '<div class="fp-ctx-item" data-action="set-olt">OLT Ata</div>';
    if (!isAnten) html += '<div class="fp-ctx-item" data-action="set-anten">Anten Ata</div>';
    if (isOLT) html += '<div class="fp-ctx-item disabled">OLT Merkezi</div>';
    if (!isOLT) html += '<div class="fp-ctx-item" data-action="set-parent">Baglanti Degistir</div>';
    html += '<div class="fp-ctx-item" data-action="add-ptp">PTP Baglanti Ekle</div>';
    html += '<div class="fp-ctx-item" data-action="edit">Duzenle</div>';
    html += '<div class="fp-ctx-sep"></div>';
    html += '<div class="fp-ctx-item" data-action="place-map">Haritada Yerlestir</div>';
    html += '<div class="fp-ctx-item" data-action="enter-coords">Koordinat Gir</div>';
    if (!isOLT) {
      var hasManualParent = ada.topology.manualParents && ada.topology.manualParents[building.id];
      if (hasManualParent) html += '<div class="fp-ctx-item" data-action="clear-parent">Otomatik Rotaya Don</div>';
    }
    html += '<div class="fp-ctx-item danger" data-action="delete">Sil</div>';
    menu.innerHTML = html;

    document.body.appendChild(menu);

    menu.addEventListener('click', function(ev) {
      var action = ev.target.dataset.action;
      if (action === 'set-olt') {
        Topology.setOLT(ada, building.id);
      } else if (action === 'set-anten') {
        Topology.setAntenna(ada, building.id);
      } else if (action === 'set-parent') {
        menu.remove();
        showParentPicker(ada, building);
        return;
      } else if (action === 'clear-parent') {
        Topology.setManualParent(ada.id, building.id, null);
      } else if (action === 'add-ptp') {
        menu.remove();
        showPtpDialog(ada, building);
        return;
      } else if (action === 'edit') {
        var card = document.querySelector('.fp-bldg-card[data-id="' + building.id + '"]');
        if (card) {
          var nameEl = card.querySelector('.fp-editable[data-field="name"]');
          if (nameEl) startInlineEdit(nameEl);
        }
      } else if (action === 'place-map') {
        if (!Overlay.isVisible()) {
          Overlay.show();
          var mapBtn2 = document.getElementById('fp-btn-map-toggle');
          if (mapBtn2) { mapBtn2.classList.add('fp-btn-danger'); mapBtn2.textContent = 'HARITA \u2716'; }
        }
        Overlay.startPlaceMode(building.id, ada.id);
        menu.remove();
        showNotification(building.name + ': haritaya tiklayarak yerlestirin', 'info');
        return;
      } else if (action === 'enter-coords') {
        menu.remove();
        showInlinePrompt('Koordinat girin (lat, lng):', function(val) {
          if (!val) return;
          var parts = val.split(',');
          if (parts.length >= 2) {
            var lat = parseFloat(parts[0].trim());
            var lng = parseFloat(parts[1].trim());
            if (!isNaN(lat) && !isNaN(lng)) {
              building.lat = lat;
              building.lng = lng;
              Overlay.autoPlaceBuildings(ada);
              PonEngine.recalculateAda(ada);
              Storage.autoSave();
              Overlay.render();
              refresh();
              showNotification(building.name + ' → ' + lat.toFixed(5) + ', ' + lng.toFixed(5), 'success');
              if (!Overlay.isVisible()) {
                Overlay.show();
                var mb = document.getElementById('fp-btn-map-toggle');
                if (mb) { mb.classList.add('fp-btn-danger'); mb.textContent = 'HARITA \u2716'; }
              }
            } else {
              showNotification('Gecersiz format. Ornek: 39.92, 32.85', 'error');
            }
          } else {
            showNotification('Format: 39.92, 32.85', 'error');
          }
        });
        return;
      } else if (action === 'delete') {
        Topology.removeBuilding(ada, building.id);
        PonEngine.recalculateAda(ada);
      }
      menu.remove();
      Overlay.render();
      refresh();
      Storage.autoSave();
    });

    setTimeout(function() {
      document.addEventListener('click', function close() {
        menu.remove();
        document.removeEventListener('click', close);
      }, { once: true });
    }, 10);
  }

  /**
   * Show parent building picker - "Bu bina nereye baglansin?"
   * Lists all other buildings with distance, sorted by proximity
   */
  function showParentPicker(ada, building) {
    var container = document.createElement('div');
    container.className = 'fp-ctx-menu';
    container.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:100001;width:280px;max-height:400px;overflow-y:auto;padding:8px 0';

    var others = ada.buildings.filter(function(b) { return b.id !== building.id; });

    // Sort by distance to this building
    others.sort(function(a, b) {
      return PonEngine.safeDist(building, a) - PonEngine.safeDist(building, b);
    });

    var html = '<div style="padding:6px 12px;font-size:11px;color:#facc15;font-weight:700;border-bottom:1px solid rgba(148,163,184,0.1);margin-bottom:4px">' +
      building.name + ' \u2192 nereye baglansin?</div>';

    for (var i = 0; i < others.length; i++) {
      var o = others[i];
      var d = Math.round(PonEngine.safeDist(building, o));
      var isOLT = o.id === ada.topology.oltBuildingId;
      var isFDH = ada.topology.fdhNodes && ada.topology.fdhNodes.some(function(f) { return f.buildingId === o.id; });
      var label = o.name;
      if (isOLT) label += ' [OLT]';
      if (isFDH) label += ' [FDH]';

      html += '<div class="fp-ctx-item" data-parent-id="' + o.id + '" style="display:flex;justify-content:space-between;align-items:center">' +
        '<span>' + label + '</span>' +
        '<span style="font-size:10px;color:#64748b;margin-left:8px">' + d + 'm</span>' +
        '</div>';
    }
    container.innerHTML = html;
    document.body.appendChild(container);

    // Backdrop
    var backdrop = document.createElement('div');
    backdrop.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:100000;background:rgba(0,0,0,0.4)';
    document.body.appendChild(backdrop);

    function cleanup() {
      container.remove();
      backdrop.remove();
    }

    backdrop.addEventListener('click', cleanup);

    container.addEventListener('click', function(ev) {
      var parentId = ev.target.closest('[data-parent-id]');
      if (!parentId) return;
      var pid = parseInt(parentId.dataset.parentId);
      Topology.setManualParent(ada.id, building.id, pid);
      cleanup();
      Overlay.render();
      refresh();
      Storage.autoSave();
      var parentB = ada.buildings.find(function(x) { return x.id === pid; });
      showNotification(building.name + ' \u2192 ' + (parentB ? parentB.name : '?') + ' baglandi', 'success');
    });
  }

  function showAdaContextMenu(e, ada) {
    var existing = document.getElementById('fp-ctx-menu');
    if (existing) existing.remove();

    var menu = document.createElement('div');
    menu.id = 'fp-ctx-menu';
    menu.className = 'fp-ctx-menu';
    menu.style.left = e.clientX + 'px';
    menu.style.top = e.clientY + 'px';

    var bCount = ada.buildings.length;
    var html = '';
    html += '<div class="fp-ctx-item" data-action="rename">Yeniden Adlandir</div>';
    if (ada.boundary) {
      html += '<div class="fp-ctx-item" data-action="clear-boundary">Siniri Sil</div>';
    }
    html += '<div class="fp-ctx-item" data-action="clear">Temizle (' + bCount + ' bina)</div>';
    html += '<div class="fp-ctx-sep"></div>';
    html += '<div class="fp-ctx-item danger" data-action="delete">Sil</div>';
    menu.innerHTML = html;

    document.body.appendChild(menu);

    menu.addEventListener('click', function(ev) {
      var action = ev.target.dataset.action;
      if (!action) return;

      if (action === 'rename') {
        menu.remove();
        showInlinePrompt('Yeni ada adi:', function(newName) {
          if (!newName) return;
          Topology.renameAda(ada.id, newName);
          Overlay.render();
          refresh();
          Storage.autoSave();
          showNotification('Ada yeniden adlandirildi: ' + newName, 'success');
        });
        return;
      }

      if (action === 'clear-boundary') {
        Topology.clearAdaBoundary(ada.id);
        Overlay.render();
        refresh();
        Storage.autoSave();
        showNotification(ada.name + ' siniri silindi', 'success');
      }

      if (action === 'clear') {
        if (!confirm(ada.name + ' adasindaki ' + bCount + ' bina silinecek. Emin misiniz?')) {
          menu.remove();
          return;
        }
        Topology.clearAda(ada.id);
        Overlay.render();
        refresh();
        Storage.autoSave();
        showNotification(ada.name + ' temizlendi', 'success');
      }

      if (action === 'delete') {
        if (!confirm(ada.name + ' adasi tamamen silinecek. Emin misiniz?')) {
          menu.remove();
          return;
        }
        Topology.deleteAda(ada.id);
        Overlay.render();
        refresh();
        Storage.autoSave();
        showNotification('Ada silindi', 'success');
      }

      menu.remove();
    });

    setTimeout(function() {
      document.addEventListener('click', function close() {
        menu.remove();
        document.removeEventListener('click', close);
      }, { once: true });
    }, 10);
  }

  function showNotification(text, type) {
    var el = document.getElementById('fp-status-msg');
    if (!el) return;
    el.textContent = (type === 'success' ? '\u2713 ' : type === 'error' ? '\u2717 ' : '') + text;
    el.className = 'fp-notification ' + (type || 'info');
    el.classList.add('visible');
    clearTimeout(el._fadeTimer);
    el._fadeTimer = setTimeout(function() { el.classList.remove('visible'); }, 4000);
  }

  function showInlinePrompt(label, callback) {
    var existing = document.getElementById('fp-inline-prompt');
    if (existing) existing.remove();

    var container = document.createElement('div');
    container.id = 'fp-inline-prompt';
    container.className = 'fp-inline-prompt';
    container.innerHTML = '<div style="color:var(--fp-text);font-size:.92rem;font-weight:600">' + label + '</div>' +
      '<input type="text" id="fp-prompt-input" placeholder="...">' +
      '<div class="fp-prompt-actions">' +
      '<button class="fp-btn fp-btn-sm" id="fp-prompt-cancel">IPTAL</button>' +
      '<button class="fp-btn fp-btn-sm fp-btn-ada" id="fp-prompt-ok">TAMAM</button>' +
      '</div>';
    document.body.appendChild(container);

    var input = document.getElementById('fp-prompt-input');
    input.focus();

    var close = function(val) { container.remove(); if (val) callback(val); };
    document.getElementById('fp-prompt-cancel').addEventListener('click', function() { close(null); });
    document.getElementById('fp-prompt-ok').addEventListener('click', function() { close(input.value.trim()); });
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') close(input.value.trim());
      if (e.key === 'Escape') close(null);
    });
  }

  function showPtpDialog(ada, fromBuilding) {
    var others = ada.buildings.filter(function(b) { return b.id !== fromBuilding.id; });
    if (others.length === 0) {
      showNotification('Hedef bina yok. En az 2 bina gerekli.', 'error');
      return;
    }

    var existing = document.getElementById('fp-inline-prompt');
    if (existing) existing.remove();

    var container = document.createElement('div');
    container.id = 'fp-inline-prompt';
    container.className = 'fp-inline-prompt';

    var optHtml = '';
    for (var i = 0; i < others.length; i++) {
      optHtml += '<option value="' + others[i].id + '">' + others[i].name + '</option>';
    }

    container.innerHTML = '<div style="color:var(--fp-text);font-size:.92rem;font-weight:600">PTP Kablosuz Baglanti</div>' +
      '<div style="color:var(--fp-text-dim);font-size:.78rem;margin-top:4px">Kaynak: ' + fromBuilding.name + '</div>' +
      '<div style="margin-top:8px"><label style="font-size:.72rem;color:var(--fp-text-dim)">Hedef Bina:</label>' +
      '<select id="fp-ptp-target" style="width:100%;padding:6px 8px;background:var(--fp-surface2);border:1px solid var(--fp-border);border-radius:4px;color:var(--fp-text);font-family:inherit;margin-top:2px">' + optHtml + '</select></div>' +
      '<div style="margin-top:8px"><label style="font-size:.72rem;color:var(--fp-text-dim)">Cihaz:</label>' +
      '<input type="text" id="fp-ptp-device" value="airFiber 24" style="width:100%;padding:6px 8px;background:var(--fp-surface2);border:1px solid var(--fp-border);border-radius:4px;color:var(--fp-text);font-family:inherit;margin-top:2px"></div>' +
      '<div style="display:flex;gap:8px;margin-top:8px">' +
      '<div style="flex:1"><label style="font-size:.72rem;color:var(--fp-text-dim)">Frekans (GHz):</label><input type="number" id="fp-ptp-freq" value="24" style="width:100%;padding:6px 8px;background:var(--fp-surface2);border:1px solid var(--fp-border);border-radius:4px;color:var(--fp-text);font-family:inherit;margin-top:2px"></div>' +
      '<div style="flex:1"><label style="font-size:.72rem;color:var(--fp-text-dim)">Hiz (Mbps):</label><input type="number" id="fp-ptp-speed" value="1000" style="width:100%;padding:6px 8px;background:var(--fp-surface2);border:1px solid var(--fp-border);border-radius:4px;color:var(--fp-text);font-family:inherit;margin-top:2px"></div>' +
      '</div>' +
      '<div class="fp-prompt-actions">' +
      '<button class="fp-btn fp-btn-sm" id="fp-ptp-cancel">IPTAL</button>' +
      '<button class="fp-btn fp-btn-sm fp-btn-ada" id="fp-ptp-ok">EKLE</button>' +
      '</div>';
    document.body.appendChild(container);

    document.getElementById('fp-ptp-cancel').addEventListener('click', function() { container.remove(); });
    document.getElementById('fp-ptp-ok').addEventListener('click', function() {
      var targetId = parseInt(document.getElementById('fp-ptp-target').value, 10);
      var device = document.getElementById('fp-ptp-device').value.trim() || 'airFiber 24';
      var freq = parseFloat(document.getElementById('fp-ptp-freq').value) || 24;
      var speed = parseInt(document.getElementById('fp-ptp-speed').value, 10) || 1000;

      var targetB = ada.buildings.find(function(b) { return b.id === targetId; });
      var dist = targetB ? Math.round(PonEngine.safeDist(fromBuilding, targetB)) : 0;

      Topology.addPtpLink(ada.id, {
        fromBuildingId: fromBuilding.id,
        toBuildingId: targetId,
        device: device,
        freqGHz: freq,
        distanceM: dist,
        throughputMbps: speed
      });

      container.remove();
      Overlay.render();
      refresh();
      Storage.autoSave();
      showNotification('PTP baglanti eklendi: ' + fromBuilding.name + ' \u2194 ' + (targetB ? targetB.name : '?'), 'success');
    });
  }

  /**
   * Create a standalone fullscreen Leaflet map for boundary drawing
   * Used when NVI portal map is not available (no address search done)
   */
  // Turkish city presets for quick navigation

  function handleDrawBoundary() {
    if (typeof Overlay !== 'undefined' && Overlay.isMode && Overlay.isMode('boundary')) {
      Overlay.deactivateMode();
      return;
    }
    if (!Overlay.isVisible()) {
      Overlay.show();
      var mapBtn = document.getElementById('fp-btn-map-toggle');
      if (mapBtn) { mapBtn.classList.add('fp-btn-danger'); mapBtn.textContent = 'HARITA \u2716'; }
    }
    if (typeof Overlay !== 'undefined' && Overlay.activateMode) {
      Overlay.activateMode('boundary');
    }
  }

  /**
   * Capture map screenshot and store with ada for dashboard geo-view
   */
  function captureMapScreenshot(ada, map) {
    // Get map viewport bounds
    var bounds = map.getBounds();
    var boundsData = {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest()
    };

    // Request screenshot from service worker
    if (chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ action: 'captureTab' }, function(response) {
        if (response && response.screenshot) {
          Topology.setMapSnapshot(ada.id, response.screenshot, boundsData);
          Storage.autoSave();
          showNotification('Harita goruntusu kaydedildi', 'success');
        } else {
          // Fallback: store only bounds (dashboard can use tile layers)
          Topology.setMapSnapshot(ada.id, null, boundsData);
          Storage.autoSave();
        }
      });
    } else {
      // No service worker: store only bounds
      Topology.setMapSnapshot(ada.id, null, boundsData);
      Storage.autoSave();
    }
  }

  function handleAdaBitir() {
    var ada = Topology.getActiveAda();
    if (!ada) { showNotification('Aktif ada yok. Once yeni ada olusturun.', 'error'); return; }
    if (ada.buildings.length === 0) { showNotification('Bu adada henuz bina yok.', 'error'); return; }

    Topology.completeAda(ada);
    Overlay.render();
    refresh();
    Storage.autoSave();

    var oltB = ada.buildings.find(function(b) { return b.id === ada.topology.oltBuildingId; });
    var cap = ada.calculations.oltCapacity;
    showNotification('Ada tamamlandi! OLT: ' + (oltB ? oltB.name : '?') + (cap ? ' (' + cap.requiredPorts + ' port)' : '') + ' | KABLO CIZ ile kabloları duzenleyin', 'success');
  }

  function handleYeniAda() {
    showInlinePrompt('Ada adi (ornek: Bugday Pazari Mah. Ada 1):', function(name) {
      if (!name) return;
      Topology.createAda(name);
      Topology.switchView(Topology.PROJECT.activeAdaId);
      Overlay.render();
      refresh();
      Storage.autoSave();
      showNotification('Ada olusturuldu: ' + name, 'success');
    });
  }

  function handleExportJSON() {
    var blob = new Blob([Topology.exportJSON()], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'ftth-plan-' + Topology.PROJECT.meta.date + '.json';
    a.click();
    URL.revokeObjectURL(url);
    showNotification('JSON indirildi', 'success');
  }

  function handleExportGeoJSON() {
    var geojson = Topology.exportGeoJSON();
    var blob = new Blob([geojson], { type: 'application/geo+json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'ftth-plan-' + Topology.PROJECT.meta.date + '.geojson';
    a.click();
    URL.revokeObjectURL(url);
    showNotification('GeoJSON indirildi', 'success');
  }

  // ─── KABLO CIZ MODE ──────────────────────────────────────────

  var cableState = {
    active: false,
    sourceId: null   // first building clicked
  };

  function handleCableMode() {
    if (typeof Overlay !== 'undefined' && Overlay.isMode && Overlay.isMode('cable')) {
      Overlay.deactivateMode();
    } else if (typeof Overlay !== 'undefined' && Overlay.activateMode) {
      Overlay.activateMode('cable');
    }
  }

  function handleCableClick(buildingId, ada) {
    if (!cableState.active) return false;
    var bldg = ada.buildings.find(function(b) { return b.id === buildingId; });
    if (!bldg) return false;

    if (!cableState.sourceId) {
      // First click: select source
      cableState.sourceId = buildingId;
      showNotification('Kaynak: ' + bldg.name + ' → simdi hedef binaya tikla', 'info');
      refresh();
      return true;
    }

    if (cableState.sourceId === buildingId) {
      // Same building: cancel selection
      cableState.sourceId = null;
      showNotification('Secim iptal', 'info');
      refresh();
      return true;
    }

    // Second click: create cable
    var srcB = ada.buildings.find(function(b) { return b.id === cableState.sourceId; });
    var result = Topology.addManualEdge(ada.id, cableState.sourceId, buildingId);
    cableState.sourceId = null;

    if (result) {
      Storage.autoSave();
      showNotification('Kablo: ' + (srcB ? srcB.name : '?') + ' → ' + bldg.name, 'success');
    } else {
      showNotification('Kablo eklenemedi (zaten var veya gecersiz)', 'error');
    }
    refresh();
    return true;
  }

  function handleCableDelete(fromId, toId, ada) {
    var result = Topology.removeManualEdge(ada.id, fromId, toId);
    if (result) {
      Storage.autoSave();
      var fromB = ada.buildings.find(function(b) { return b.id === fromId; });
      var toB = ada.buildings.find(function(b) { return b.id === toId; });
      showNotification('Kablo silindi: ' + (fromB ? fromB.name : '?') + ' \u2194 ' + (toB ? toB.name : '?'), 'info');
    }
    refresh();
  }

  function handleCableHesapla(ada) {
    PonEngine.recalculateAda(ada);
    Storage.autoSave();
    Overlay.render();
    refresh();
    showNotification('Hesaplama tamamlandi', 'success');
  }

  function _setCableState(active, sourceId) {
    cableState.active = active;
    cableState.sourceId = sourceId || null;
    var btn = document.getElementById('fp-btn-cable-mode');
    if (active) {
      if (btn) { btn.classList.add('fp-btn-draw-active'); btn.textContent = 'KABLO CIZ \u2713'; }
    } else {
      if (btn) { btn.classList.remove('fp-btn-draw-active'); btn.textContent = 'KABLO CIZ'; }
    }
  }

  function handleExportCSV() {
    var blob = new Blob([Topology.exportCSV()], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'ftth-plan-' + Topology.PROJECT.meta.date + '.csv';
    a.click();
    URL.revokeObjectURL(url);
    showNotification('CSV indirildi', 'success');
  }

  return {
    init: init,
    refresh: refresh,
    renderAdaSelector: renderAdaSelector,
    renderBuildingList: renderBuildingList,
    updateStats: updateStats,
    showBuildingContextMenu: showBuildingContextMenu,
    showAdaContextMenu: showAdaContextMenu,
    showNotification: showNotification,
    showInlinePrompt: showInlinePrompt,
    renderTopoPreview: renderTopoPreview,
    _cableActive: function() { return cableState.active; },
    _handleCableClick: handleCableClick,
    _setCableState: _setCableState
  };
})();
