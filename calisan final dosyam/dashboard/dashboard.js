/**
 * FiberPlan Dashboard - Full-page CRM-style FTTH planning dashboard
 * Chrome extension page using shared lib/ modules + IndexedDB
 * ES5+ compatible (var/function)
 */

var Dashboard = (function() {
  'use strict';

  var activeSection = 'overview';
  var activeAdaId = null;
  var customCatalog = null;
  var inventorySubTab = 'cost';

  // ─── TIA-598 Fiber Color Code ─────────────────────────────────
  var TIA_COLORS = [
    { name: 'Mavi',    hex: '#0000FF' },
    { name: 'Turuncu', hex: '#FF8C00' },
    { name: 'Yesil',   hex: '#00AA00' },
    { name: 'Kahve',   hex: '#8B4513' },
    { name: 'Gri',     hex: '#808080' },
    { name: 'Beyaz',   hex: '#FFFFFF' },
    { name: 'Kirmizi', hex: '#FF0000' },
    { name: 'Siyah',   hex: '#222222' },
    { name: 'Sari',    hex: '#FFD700' },
    { name: 'Mor',     hex: '#9400D3' },
    { name: 'Pembe',   hex: '#FF69B4' },
    { name: 'Turkuaz', hex: '#00CED1' }
  ];

  // ─── WIZARD STEPS ─────────────────────────────────────────────
  var WIZARD_STEPS = [
    { title: 'FiberPlan\'a Hosgeldiniz', desc: 'FTTH fiber ag planlama araciniz hazir. Bu dashboard, projenizdeki tum adalari, binalari, hesaplamalari ve raporlari tek bir yerde gormenizi saglar.' },
    { title: 'NVI Portal Kullanimi', desc: 'adres.nvi.gov.tr adresine gidin ve adres arayin. FiberPlan, NVI portal uzerindeki bina bilgilerini otomatik olarak algilayacaktir.' },
    { title: 'Ada Olusturma', desc: 'NVI portalda bina tablosu gorundigunde, binalar otomatik olarak aktif adaya eklenir. Yeni ada olusturmak icin toolbar\'daki "+ ADA" butonunu kullanin.' },
    { title: 'Ada Tamamlama', desc: '"ADA BITIR" butonuna tikladiginizda OLT yerlesimi, splitter hesaplari, kayip butcesi ve maliyet analizi otomatik hesaplanir.' },
    { title: 'Disari Aktarma', desc: 'GeoJSON butonuyla projenizi indirip QGIS\'te acabilirsiniz. QGIS\'te "Layer > Add Layer > Add Vector Layer" ile GeoJSON dosyasini yukleyin.' }
  ];

  // ─── INIT ─────────────────────────────────────────────────────

  function init() {
    Storage.init().then(function() {
      return Storage.autoLoad();
    }).then(function(loaded) {
      if (loaded) {
        Topology.recalculateAll();
      }
      return Storage.loadCatalog();
    }).then(function(custom) {
      customCatalog = custom;
      updateHeaderMeta();
      bindNavigation();
      bindHeaderActions();
      render();
      checkOnboarding();
    }).catch(function(err) {
      console.error('[Dashboard] Init error:', err);
      showToast('Yukleme hatasi: ' + err.message, 'error');
    });
  }

  function updateHeaderMeta() {
    var meta = Topology.PROJECT.meta;
    var el = document.getElementById('db-header-meta');
    if (!el) return;
    var parts = [];
    if (meta.city) parts.push(meta.city);
    if (meta.district) parts.push(meta.district);
    parts.push(meta.date);
    el.textContent = parts.join(' · ');

    var nameEl = document.getElementById('db-project-name');
    if (nameEl && meta.name) nameEl.textContent = meta.name;
  }

  // ─── NAVIGATION ───────────────────────────────────────────────

  function bindNavigation() {
    var items = document.querySelectorAll('.db-nav-item');
    for (var i = 0; i < items.length; i++) {
      items[i].addEventListener('click', function() {
        navigateTo(this.dataset.section);
      });
    }
  }

  function bindHeaderActions() {
    var refreshBtn = document.getElementById('db-btn-refresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', function() {
        Topology.recalculateAll();
        render();
        showToast('Veriler yenilendi', 'success');
      });
    }
  }

  function navigateTo(section) {
    activeSection = section;
    // Update nav active state
    var items = document.querySelectorAll('.db-nav-item');
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle('active', items[i].dataset.section === section);
    }
    render();
  }

  // ─── RENDER DISPATCHER ────────────────────────────────────────

  function render() {
    var el = document.getElementById('db-content');
    if (!el) return;

    var P = Topology.PROJECT;
    if (P.adas.length === 0 && activeSection !== 'export') {
      el.innerHTML = emptyState('&#9670;', 'Henuz ada yok', 'NVI Portal\'dan bina ekleyerek baslayin.', 'https://adres.nvi.gov.tr/VatandasIslemleri/AdresSorgu', 'NVI Portal Ac');
      return;
    }

    switch (activeSection) {
      case 'overview':  renderOverview(el); break;
      case 'ada':       renderAdaManagement(el); break;
      case 'topology':  renderTopology(el); break;
      case 'loss':      renderLossBudget(el); break;
      case 'cable':     renderCablePlan(el); break;
      case 'inventory': renderInventory(el); break;
      case 'export':    renderExport(el); break;
      case 'gdrive':    renderGDrive(el); break;
      default:          renderOverview(el);
    }
  }

  // ─── HELPERS ──────────────────────────────────────────────────

  function emptyState(icon, title, desc, href, btnText) {
    return '<div class="db-empty">' +
      '<div class="db-empty-icon">' + icon + '</div>' +
      '<div class="db-empty-title">' + title + '</div>' +
      '<div class="db-empty-desc">' + desc + '</div>' +
      (href ? '<a class="db-empty-btn" href="' + href + '" target="_blank">' + btnText + '</a>' : '') +
      '</div>';
  }

  /**
   * Render a reusable ada dropdown selector
   * @param {string} containerId - DOM id for the dropdown container
   * @param {Object} options - { adas, activeId, onSelect, filterCompleted }
   * @returns {string} HTML string for the dropdown
   */
  function renderAdaSelector(containerId, options) {
    var adas = options.adas || Topology.PROJECT.adas;
    if (options.filterCompleted) {
      adas = adas.filter(function(a) { return a.status === 'completed'; });
    }
    var selId = options.activeId || activeAdaId;
    var sel = adas.find(function(a) { return a.id == selId; });
    if (!sel && adas.length > 0) sel = adas[0];
    if (sel) { activeAdaId = sel.id; }

    var adaBB = sel ? sel.buildings.reduce(function(s, b) { return s + b.bb; }, 0) : 0;
    var adaEffBB = 0;
    if (sel) {
      for (var ei = 0; ei < sel.buildings.length; ei++) {
        adaEffBB += PonEngine.getEffectiveBB(sel.buildings[ei], sel);
      }
    }

    var html = '<div class="db-ada-dropdown" id="' + containerId + '">';
    // Trigger
    html += '<div class="db-ada-dropdown-trigger" id="' + containerId + '-trigger">';
    html += '<span class="db-ada-dd-code">' + (sel ? (sel.code || '?') : '-') + '</span>';
    html += '<span class="db-ada-dd-name">' + (sel ? sel.name : 'Ada sec') + '</span>';
    html += '<span class="db-ada-dd-meta">' + (sel ? sel.buildings.length + ' bina · ' + adaEffBB + ' BB' : '') + '</span>';
    html += '<span class="db-ada-dd-arrow">&#9660;</span>';
    html += '</div>';
    // Panel
    html += '<div class="db-ada-dropdown-panel" id="' + containerId + '-panel">';
    html += '<input type="text" class="db-ada-dd-search" placeholder="Ara..." id="' + containerId + '-search">';
    for (var i = 0; i < adas.length; i++) {
      var a = adas[i];
      var abb = a.buildings.reduce(function(s, b) { return s + b.bb; }, 0);
      var aEffBB = 0;
      for (var j = 0; j < a.buildings.length; j++) { aEffBB += PonEngine.getEffectiveBB(a.buildings[j], a); }
      var isSel = sel && a.id === sel.id;
      var badgeCls = a.status === 'completed' ? 'done' : 'plan';
      var badgeTxt = a.status === 'completed' ? 'Tamam' : 'Planlama';
      html += '<div class="db-ada-dd-item' + (isSel ? ' selected' : '') + '" data-ada-id="' + a.id + '">';
      html += '<span class="db-ada-dd-code">' + (a.code || '?') + '</span>';
      html += '<div class="db-ada-dd-item-info">';
      html += '<div class="db-ada-dd-item-name">' + a.name + '</div>';
      html += '<div class="db-ada-dd-item-stats">' + a.buildings.length + ' bina · ' + aEffBB + '/' + abb + ' BB</div>';
      html += '</div>';
      html += '<span class="db-ada-dd-badge ' + badgeCls + '">' + badgeTxt + '</span>';
      html += '</div>';
    }
    html += '</div>';
    html += '</div>';
    return html;
  }

  /**
   * Bind dropdown interactions after rendering
   * @param {string} containerId - DOM id prefix
   * @param {Function} onSelect - callback(adaId)
   */
  function bindAdaDropdown(containerId, onSelect) {
    var trigger = document.getElementById(containerId + '-trigger');
    var panel = document.getElementById(containerId + '-panel');
    var search = document.getElementById(containerId + '-search');
    if (!trigger || !panel) return;

    // Remove previous outside-click handler if exists
    if (renderAdaSelector._closeHandler) {
      document.removeEventListener('mousedown', renderAdaSelector._closeHandler);
    }

    function openPanel() {
      trigger.classList.add('open');
      panel.classList.add('open');
      if (search) { search.value = ''; search.focus(); filterItems(''); }
    }
    function closePanel() {
      trigger.classList.remove('open');
      panel.classList.remove('open');
    }

    trigger.addEventListener('click', function(e) {
      e.stopPropagation();
      if (panel.classList.contains('open')) { closePanel(); } else { openPanel(); }
    });

    // Item click
    var items = panel.querySelectorAll('.db-ada-dd-item');
    for (var i = 0; i < items.length; i++) {
      items[i].addEventListener('click', function() {
        var id = parseInt(this.dataset.adaId, 10);
        activeAdaId = id;
        closePanel();
        if (onSelect) onSelect(id);
      });
    }

    // Search filter
    function filterItems(q) {
      q = q.toLowerCase();
      var allItems = panel.querySelectorAll('.db-ada-dd-item');
      for (var i = 0; i < allItems.length; i++) {
        var name = allItems[i].querySelector('.db-ada-dd-item-name');
        var code = allItems[i].querySelector('.db-ada-dd-code');
        var text = ((name ? name.textContent : '') + ' ' + (code ? code.textContent : '')).toLowerCase();
        allItems[i].style.display = text.indexOf(q) >= 0 ? '' : 'none';
      }
    }
    if (search) {
      search.addEventListener('input', function() { filterItems(this.value); });
    }

    // Outside click
    renderAdaSelector._closeHandler = function(ev) {
      var dd = document.getElementById(containerId);
      if (dd && !dd.contains(ev.target)) closePanel();
    };
    document.addEventListener('mousedown', renderAdaSelector._closeHandler);

    // Escape key
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) {
        closePanel();
        document.removeEventListener('keydown', escHandler);
      }
    });
  }

  function kpi(value, label, color, tooltip) {
    var tip = tooltip ? ' title="' + tooltip.replace(/"/g, '&quot;') + '"' : '';
    return '<div class="db-kpi-card"' + tip + '>' +
      '<div class="db-kpi-value" style="color:' + (color || 'var(--fp-accent)') + '">' + value + '</div>' +
      '<div class="db-kpi-label">' + label + '</div>' +
      '</div>';
  }

  function scoreColor(score) {
    if (score >= 80) return 'var(--fp-success)';
    if (score >= 50) return '#f59e0b';
    return 'var(--fp-danger)';
  }

  function scoreClass(score) {
    if (score >= 80) return 'pass';
    if (score >= 50) return 'warning';
    return 'fail';
  }

  // ─── OVERVIEW ─────────────────────────────────────────────────

  function renderOverview(el) {
    var P = Topology.PROJECT;
    var totalAda = P.adas.length;
    var completed = P.adas.filter(function(a) { return a.status === 'completed'; }).length;
    var totalBldg = P.adas.reduce(function(s, a) { return s + a.buildings.length; }, 0);
    var totalBB = P.adas.reduce(function(s, a) { return s + a.buildings.reduce(function(s2, b) { return s2 + b.bb; }, 0); }, 0);
    var totalEffBB = 0;
    for (var ei = 0; ei < P.adas.length; ei++) {
      for (var ebi = 0; ebi < P.adas[ei].buildings.length; ebi++) {
        totalEffBB += PonEngine.getEffectiveBB(P.adas[ei].buildings[ebi], P.adas[ei]);
      }
    }
    var totalCost = P.adas.reduce(function(s, a) { return s + (a.calculations.costs && a.calculations.costs.total ? a.calculations.costs.total : 0); }, 0);
    var totalCable = P.adas.reduce(function(s, a) { return s + (a.calculations.cables || []).reduce(function(s2, c) { return s2 + c.distanceM; }, 0); }, 0);
    var totalPorts = P.adas.reduce(function(s, a) { return s + (a.calculations.oltCapacity ? a.calculations.oltCapacity.requiredPorts : 0); }, 0);

    var html = '';

    // Progress
    html += '<div class="db-progress-wrap">';
    html += '<div class="db-progress-text">' + completed + '/' + totalAda + ' ada tamamlandi</div>';
    html += '<div class="db-progress-bar"><div class="db-progress-fill" style="width:' + (totalAda > 0 ? Math.round(completed / totalAda * 100) : 0) + '%"></div></div>';
    if (completed < totalAda) {
      var nextAda = P.adas.find(function(a) { return a.status !== 'completed'; });
      if (nextAda) html += '<div class="db-progress-hint">Sonraki adim: ' + nextAda.name + '\'i tamamlayin</div>';
    }
    html += '</div>';

    // KPI row
    var costPerBB = totalEffBB > 0 ? Math.round(totalCost / totalEffBB) : 0;
    html += '<div class="db-kpi-row">';
    html += kpi(totalAda, 'ADA', null, 'Projede tanimlanan toplam ada sayisi');
    html += kpi(totalBldg, 'BINA', null, 'Tum adalardaki toplam bina sayisi');
    html += kpi(totalBB, 'HAM BB', null, 'Penetrasyon uygulanmadan onceki toplam bagimsiz bolum');
    html += kpi(totalEffBB, 'EFEKTIF BB', 'var(--fp-success)', 'Penetrasyon orani uygulanmis toplam bagimsiz bolum');
    html += kpi(totalPorts, 'PON PORT', 'var(--fp-olt)', 'Tum adalarda gereken toplam OLT PON port sayisi');
    html += kpi((totalCable / 1000).toFixed(1) + ' km', 'FIBER', null, 'Toplam fiber kablo uzunlugu (backbone + dagitim + drop)');
    html += kpi(MapUtils.formatTL(totalCost), 'MALIYET', null, 'Tum adalarin toplam tahmini maliyet');
    html += kpi(costPerBB > 0 ? costPerBB.toLocaleString('tr-TR') + ' TL' : '-', 'MALIYET/BB', '#f59e0b', 'Efektif bagimsiz bolum basina dussen maliyet');
    html += '</div>';

    // Cost summary horizontal bars
    if (totalCost > 0) {
      var CATS = PonEngine.CATALOG_CATEGORIES;
      var catLabels2 = { aktif: 'Aktif', pasif: 'Pasif', kablo: 'Kablo', aksesuar: 'Aksesuar' };
      var catColors = { aktif: '#a78bfa', pasif: '#3b82f6', kablo: '#f97316', aksesuar: '#22c55e' };
      var catTotals2 = { aktif: 0, pasif: 0, kablo: 0, aksesuar: 0 };
      for (var ci2 = 0; ci2 < P.adas.length; ci2++) {
        var aInv = P.adas[ci2].calculations.inventory || [];
        for (var ii2 = 0; ii2 < aInv.length; ii2++) {
          var cat2 = CATS[aInv[ii2].key] || 'aksesuar';
          catTotals2[cat2] = (catTotals2[cat2] || 0) + aInv[ii2].total;
        }
      }
      html += '<div class="db-card" style="margin-bottom:16px"><div class="db-card-header"><span class="db-card-dot" style="background:var(--fp-accent)"></span><span class="db-card-title">Maliyet Dagilimi</span></div><div class="db-card-body">';
      var catKeys2 = ['aktif', 'pasif', 'kablo', 'aksesuar'];
      for (var ck2 = 0; ck2 < catKeys2.length; ck2++) {
        var key2 = catKeys2[ck2];
        var pct2 = totalCost > 0 ? Math.round(catTotals2[key2] / totalCost * 100) : 0;
        html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">';
        html += '<span style="font-family:\'JetBrains Mono\',monospace;font-size:.72rem;color:var(--fp-text-dim);min-width:52px">' + catLabels2[key2] + '</span>';
        html += '<div style="flex:1;height:14px;background:var(--fp-surface2);border-radius:7px;overflow:hidden"><div style="height:100%;width:' + pct2 + '%;background:' + catColors[key2] + ';border-radius:7px;transition:width .3s"></div></div>';
        html += '<span style="font-family:\'JetBrains Mono\',monospace;font-size:.72rem;color:var(--fp-text);min-width:80px;text-align:right">' + catTotals2[key2].toLocaleString('tr-TR') + ' TL</span>';
        html += '</div>';
      }
      html += '</div></div>';
    }

    // Two-column: Ada summary + Review
    html += '<div class="db-grid-2">';

    // Ada summary table
    html += '<div class="db-card"><div class="db-card-header"><span class="db-card-dot"></span><span class="db-card-title">Ada Ozeti</span></div><div class="db-card-body">';
    if (P.adas.length > 0) {
      html += '<table class="fp-table"><thead><tr><th>Ada</th><th>Bina</th><th>BB</th><th>Maliyet</th><th>Durum</th><th>Marj</th></tr></thead><tbody>';
      for (var i = 0; i < P.adas.length; i++) {
        var a = P.adas[i];
        var adaBB = a.buildings.reduce(function(s, b) { return s + b.bb; }, 0);
        var adaCost = a.calculations.costs && a.calculations.costs.total ? a.calculations.costs.total : 0;
        var worst = (a.calculations.lossBudget || []).length > 0
          ? a.calculations.lossBudget.reduce(function(w, l) { return l.totalLoss > w.totalLoss ? l : w; }, a.calculations.lossBudget[0])
          : null;
        var statusBadge = a.status === 'completed'
          ? '<span class="fp-badge info">Tamam</span>'
          : '<span class="fp-badge splitter">Planlama</span>';
        html += '<tr><td><b>' + (a.code || '') + '</b> ' + a.name + '</td><td>' + a.buildings.length + '</td><td>' + adaBB + '</td>';
        html += '<td>' + (adaCost > 0 ? adaCost.toLocaleString('tr-TR') + ' TL' : '-') + '</td>';
        html += '<td>' + statusBadge + '</td>';
        html += '<td class="' + (worst && worst.margin < 0 ? 'fp-margin-fail' : 'fp-margin-ok') + '">' + (worst ? worst.margin + ' dB' : '-') + '</td></tr>';
      }
      html += '</tbody></table>';
    }
    html += '</div></div>';

    // Review radar
    html += '<div class="db-card"><div class="db-card-header"><span class="db-card-dot" style="background:var(--fp-info)"></span><span class="db-card-title">Kalite Degerlendirmesi</span></div><div class="db-card-body">';
    var completedAdas = P.adas.filter(function(a) { return a.status === 'completed'; });
    if (completedAdas.length > 0) {
      var review = ReviewEngine.reviewAll(completedAdas);
      html += '<div style="text-align:center;margin-bottom:12px"><span style="font-family:\'JetBrains Mono\',monospace;font-size:2rem;font-weight:700;color:' + scoreColor(review.overallScore) + '">' + review.overallScore + '</span><span style="font-family:\'JetBrains Mono\',monospace;font-size:0.82rem;color:var(--fp-text-muted)">/100</span></div>';
      // Render radar for first completed ada
      html += '<div class="db-radar-wrap" id="db-radar-container"></div>';
      // Category breakdown
      var firstReview = ReviewEngine.reviewAda(completedAdas[0]);
      for (var j = 0; j < firstReview.categories.length; j++) {
        var cat = firstReview.categories[j];
        var cls = scoreClass(cat.score);
        html += '<div class="db-review-row">';
        html += '<span class="db-review-icon">' + cat.icon + '</span>';
        html += '<span class="db-review-name">' + cat.name + '</span>';
        html += '<span class="db-review-score score-' + cls + '">' + cat.score + '</span>';
        html += '<div class="db-review-bar"><div class="db-review-bar-fill bar-' + cls + '" style="width:' + cat.score + '%"></div></div>';
        html += '</div>';
      }
    } else {
      html += '<div class="db-empty" style="padding:30px"><div class="db-empty-icon">&#9733;</div><div class="db-empty-desc">Ada tamamlandiginda kalite degerlendirmesi gorunur</div></div>';
    }
    html += '</div></div>';

    html += '</div>'; // grid-2

    el.innerHTML = html;

    // Render radar SVG after DOM is ready
    if (completedAdas.length > 0) {
      var radarEl = document.getElementById('db-radar-container');
      if (radarEl) {
        renderRadarChart(radarEl, ReviewEngine.reviewAda(completedAdas[0]));
      }
    }
  }

  // ─── ADA MANAGEMENT ───────────────────────────────────────────

  function renderAdaManagement(el) {
    var P = Topology.PROJECT;
    if (P.adas.length === 0) {
      el.innerHTML = emptyState('&#9964;', 'Henuz ada yok', 'NVI Portal\'dan bina ekleyerek baslayin.');
      return;
    }

    // Default to first ada (use == for loose comparison in case of string/number mismatch)
    if (!activeAdaId || !P.adas.find(function(a) { return a.id == activeAdaId; })) {
      activeAdaId = P.adas[0].id;
    }

    var html = '';

    // Ada dropdown selector
    html += renderAdaSelector('ada-mgmt-dd', { adas: P.adas, activeId: activeAdaId });

    // Active ada content
    var ada = P.adas.find(function(x) { return x.id == activeAdaId; });
    if (!ada) { el.innerHTML = html; return; }

    var adaBB = ada.buildings.reduce(function(s, b) { return s + b.bb; }, 0);
    var adaEffBBKpi = 0;
    for (var eki = 0; eki < ada.buildings.length; eki++) {
      adaEffBBKpi += PonEngine.getEffectiveBB(ada.buildings[eki], ada);
    }
    var cap = ada.calculations.oltCapacity;
    var oltB = ada.buildings.find(function(b) { return b.id === ada.topology.oltBuildingId; });
    var adaCostTotal = ada.calculations.costs && ada.calculations.costs.total ? ada.calculations.costs.total : 0;

    // Ada header area: Code + status + creation date + total cost
    var adaStatusLabel = ada.status === 'completed' ? 'Tamamlandi' : 'Planlama';
    var adaStatusColor = ada.status === 'completed' ? 'var(--fp-success)' : '#f59e0b';
    var adaDate = ada.createdAt ? new Date(ada.createdAt).toLocaleDateString('tr-TR') : '-';
    html += '<div class="db-ada-header">';
    html += '<span class="db-ada-header-code">' + (ada.code || '') + '</span>';
    html += '<span class="db-ada-header-name">' + ada.name + '</span>';
    html += '<span class="db-ada-header-status" style="color:' + adaStatusColor + '">' + adaStatusLabel + '</span>';
    html += '<span class="db-ada-header-date">' + adaDate + '</span>';
    html += '<span class="db-ada-header-cost">' + (adaCostTotal > 0 ? adaCostTotal.toLocaleString('tr-TR') + ' TL' : '-') + '</span>';
    html += '</div>';

    // KPI for this ada
    html += '<div class="db-kpi-row">';
    html += kpi(ada.buildings.length, 'BINA', null, 'Bu adadaki toplam bina sayisi');
    html += kpi(adaBB, 'HAM BB', null, 'Penetrasyon oncesi toplam bagimsiz bolum');
    html += kpi(adaEffBBKpi, 'EFEKTIF BB', 'var(--fp-success)', 'Penetrasyon uygulanmis bagimsiz bolum (ONT sayisi)');
    html += kpi(oltB ? oltB.name : '-', 'OLT', 'var(--fp-olt)', 'OLT cihazinin konumlandigi bina');
    html += kpi(cap ? cap.requiredPorts + 'P' : '-', 'PORT', null, 'Bu ada icin gereken minimum PON port sayisi');
    html += kpi(ada.status === 'completed' ? 'Tamam' : 'Planlama', 'DURUM', ada.status === 'completed' ? 'var(--fp-success)' : '#f59e0b', 'Ada tamamlanma durumu');
    html += '</div>';

    // OLT Port Config card
    html += '<div class="db-card"><div class="db-card-header"><span class="db-card-dot" style="background:var(--fp-olt)"></span><span class="db-card-title">OLT PON Port Ayari</span></div><div class="db-card-body">';
    var portCfg = ada.topology.oltConfig || {};
    var manualPorts = portCfg.manualPorts;
    var isManual = manualPorts !== null && manualPorts !== undefined;
    var autoVal = cap ? cap.autoRequired || cap.requiredPorts : 1;
    html += '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">';
    html += '<label style="font-family:\'JetBrains Mono\',monospace;font-size:.78rem;color:var(--fp-text-dim)">PON Port Sayisi:</label>';
    html += '<select id="db-olt-port-select" style="padding:5px 10px;background:var(--fp-surface2);border:1px solid var(--fp-border);border-radius:4px;color:var(--fp-text);font-family:\'JetBrains Mono\',monospace;font-size:.82rem;cursor:pointer">';
    html += '<option value="auto"' + (!isManual ? ' selected' : '') + '>Otomatik (' + autoVal + ')</option>';
    var portOpts = [1, 2, 4, 8];
    for (var pi = 0; pi < portOpts.length; pi++) {
      var pv = portOpts[pi];
      html += '<option value="' + pv + '"' + (isManual && manualPorts === pv ? ' selected' : '') + '>' + pv + ' Port</option>';
    }
    html += '</select>';
    if (isManual && cap && manualPorts < autoVal) {
      html += '<span style="color:var(--fp-danger);font-family:\'JetBrains Mono\',monospace;font-size:.78rem;font-weight:700">Yetersiz! (min ' + autoVal + ' gerekli)</span>';
    }
    html += '</div>';
    html += '</div></div>';

    // Penetration Rate card
    var adaPen = ada.topology.defaultPenetrationRate || 70;
    var adaTotalBB = ada.buildings.reduce(function(s, b) { return s + b.bb; }, 0);
    var adaTotalEffBB = 0;
    for (var pi = 0; pi < ada.buildings.length; pi++) {
      adaTotalEffBB += PonEngine.getEffectiveBB(ada.buildings[pi], ada);
    }

    html += '<div class="db-card db-pen-card"><div class="db-card-header"><span class="db-card-dot" style="background:var(--fp-success)"></span><span class="db-card-title">Penetrasyon Orani</span></div><div class="db-card-body">';
    html += '<div class="db-pen-slider-wrap">';
    html += '<label>Ada Varsayilani:</label>';
    html += '<input type="range" id="db-pen-slider" min="10" max="100" step="5" value="' + adaPen + '">';
    html += '<span class="db-pen-val" id="db-pen-val">%' + adaPen + '</span>';
    html += '</div>';
    html += '<div class="db-pen-summary">';
    html += '<span>Ham BB: <b>' + adaTotalBB + '</b></span>';
    html += '<span>Efektif BB: <b>' + adaTotalEffBB + '</b></span>';
    html += '<span>ONT: <b>' + adaTotalEffBB + '</b></span>';
    html += '</div>';
    html += '</div></div>';

    // Equipment Selection card
    var eqSel = ada.topology.equipmentSelections || {};
    var DB = PonEngine.DEVICE_DB;
    html += '<div class="db-card"><div class="db-card-header"><span class="db-card-dot" style="background:var(--fp-info)"></span><span class="db-card-title">Ekipman Secimi</span></div><div class="db-card-body">';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">';

    // OLT Device
    html += '<div><label style="font-family:\'JetBrains Mono\',monospace;font-size:.68rem;color:var(--fp-text-dim);display:block;margin-bottom:4px">OLT CIHAZI</label>';
    html += '<select class="db-eq-select" data-eq="oltDevice" style="width:100%;padding:5px 8px;background:var(--fp-surface2);border:1px solid var(--fp-border);border-radius:4px;color:var(--fp-text);font-family:\'JetBrains Mono\',monospace;font-size:.78rem">';
    html += '<option value="">Varsayilan</option>';
    for (var oi = 0; oi < DB.olt.length; oi++) {
      var o = DB.olt[oi];
      var olbl = o.brand + (o.model ? ' ' + o.model : '') + (o.price ? ' (' + o.price.toLocaleString('tr-TR') + ' TL)' : '');
      var osel = eqSel.oltDevice && eqSel.oltDevice.brand === o.brand && eqSel.oltDevice.model === o.model ? ' selected' : '';
      html += '<option value="' + oi + '"' + osel + '>' + olbl + '</option>';
    }
    html += '</select></div>';

    // ONT Device
    html += '<div><label style="font-family:\'JetBrains Mono\',monospace;font-size:.68rem;color:var(--fp-text-dim);display:block;margin-bottom:4px">ONT CIHAZI</label>';
    html += '<select class="db-eq-select" data-eq="ontDevice" style="width:100%;padding:5px 8px;background:var(--fp-surface2);border:1px solid var(--fp-border);border-radius:4px;color:var(--fp-text);font-family:\'JetBrains Mono\',monospace;font-size:.78rem">';
    html += '<option value="">Varsayilan</option>';
    for (var oni = 0; oni < DB.ont.length; oni++) {
      var on = DB.ont[oni];
      var onlbl = on.brand + (on.model ? ' ' + on.model : '') + (on.price ? ' (' + on.price.toLocaleString('tr-TR') + ' TL)' : '');
      var onsel = eqSel.ontDevice && eqSel.ontDevice.brand === on.brand && eqSel.ontDevice.model === on.model ? ' selected' : '';
      html += '<option value="' + oni + '"' + onsel + '>' + onlbl + '</option>';
    }
    html += '</select></div>';

    // Splitter Brand
    html += '<div><label style="font-family:\'JetBrains Mono\',monospace;font-size:.68rem;color:var(--fp-text-dim);display:block;margin-bottom:4px">SPLITTER</label>';
    html += '<select class="db-eq-select" data-eq="splitterBrand" style="width:100%;padding:5px 8px;background:var(--fp-surface2);border:1px solid var(--fp-border);border-radius:4px;color:var(--fp-text);font-family:\'JetBrains Mono\',monospace;font-size:.78rem">';
    html += '<option value="">Varsayilan</option>';
    var splBrands = {};
    for (var si = 0; si < DB.splitter.length; si++) {
      var sb = DB.splitter[si];
      if (splBrands[sb.brand]) continue;
      splBrands[sb.brand] = true;
      var sbsel = eqSel.splitterBrand === sb.brand ? ' selected' : '';
      html += '<option value="' + sb.brand + '"' + sbsel + '>' + sb.brand + '</option>';
    }
    html += '</select></div>';

    // SFP Module
    html += '<div><label style="font-family:\'JetBrains Mono\',monospace;font-size:.68rem;color:var(--fp-text-dim);display:block;margin-bottom:4px">SFP MODUL</label>';
    html += '<select class="db-eq-select" data-eq="sfpModule" style="width:100%;padding:5px 8px;background:var(--fp-surface2);border:1px solid var(--fp-border);border-radius:4px;color:var(--fp-text);font-family:\'JetBrains Mono\',monospace;font-size:.78rem">';
    html += '<option value="">Varsayilan</option>';
    for (var sfi = 0; sfi < DB.sfp.length; sfi++) {
      var sf = DB.sfp[sfi];
      var sflbl = sf.brand + (sf.model ? ' ' + sf.model : '') + (sf.price ? ' (' + sf.price.toLocaleString('tr-TR') + ' TL)' : '');
      var sfsel = eqSel.sfpModule && eqSel.sfpModule.brand === sf.brand && eqSel.sfpModule.model === sf.model ? ' selected' : '';
      html += '<option value="' + sfi + '"' + sfsel + '>' + sflbl + '</option>';
    }
    html += '</select></div>';

    html += '</div>'; // grid
    html += '</div></div>';

    // Help card (collapsible)
    html += '<div class="db-edu-card">';
    html += '<button class="db-edu-toggle" id="db-help-toggle">';
    html += '<span class="db-edu-toggle-icon">&#9432;</span>';
    html += '<span class="db-edu-toggle-title">Yardim: Temel Kavramlar</span>';
    html += '<span class="db-edu-toggle-arrow">&#9660;</span>';
    html += '</button>';
    html += '<div class="db-edu-body" id="db-help-body">';
    html += '<div class="db-edu-grid">';
    html += '<div class="db-edu-item"><div class="db-edu-item-title">Penetrasyon Orani</div>';
    html += '<div class="db-edu-item-desc">Bir binadaki toplam bagimsiz bolumun yuzde kaci fiber abone olacak? Varsayilan %70. Her bina icin ayri ayarlanabilir. Dusuk penetrasyon = daha az ONT = daha az splitter portu gerekir.</div></div>';
    html += '<div class="db-edu-item"><div class="db-edu-item-title">PON Port</div>';
    html += '<div class="db-edu-item-desc">OLT uzerindeki GPON portlari. Her port 1:128 aboneye kadar hizmet verir. Port sayisi = toplam efektif BB / port basi kapasite. Otomatik hesaplanir, manuel olarak artirabilirsiniz.</div></div>';
    html += '<div class="db-edu-item"><div class="db-edu-item-title">OLT Yerlesimi</div>';
    html += '<div class="db-edu-item-desc">OLT, tum binalara en kisa toplam mesafe ile erisen binaya otomatik yerlestirilir (MST agirlik merkezi). FDH binalarinda splitter dagitimi yapilir.</div></div>';
    html += '<div class="db-edu-item"><div class="db-edu-item-title">Splitter Cascade</div>';
    html += '<div class="db-edu-item-desc">Buyuk binalarda tek splitter yetmez. Ornegin 1:8 + 1:4 cascade = 32 port, ama kayip artar. Sistem otomatik olarak en uygun cascadeyi secer.</div></div>';
    html += '</div>'; // edu-grid
    html += '</div></div>'; // edu-body + edu-card

    // Building table with penetration editing
    html += '<div class="db-section-title">BINALAR</div>';
    if (ada.buildings.length === 0) {
      html += '<div class="db-empty" style="padding:24px"><div class="db-empty-desc">Bu adada henuz bina yok</div></div>';
    } else {
      html += '<div class="db-card"><div class="db-card-body" style="padding:8px 12px">';
      html += '<table class="db-pen-table"><thead><tr><th>Bina</th><th>Ham BB</th><th>Pen %</th><th>Eff BB</th><th>Splitter</th><th>Marj</th><th></th></tr></thead><tbody>';
      for (var j = 0; j < ada.buildings.length; j++) {
        var b = ada.buildings[j];
        var isOLT = b.id === ada.topology.oltBuildingId;
        var isFDH = ada.topology.fdhNodes && ada.topology.fdhNodes.some(function(f) { return f.buildingId === b.id; });
        var bPen = Topology.getEffectivePenetration(b, ada);
        var bEffBB = PonEngine.getEffectiveBB(b, ada);
        var splData = (ada.calculations.splitters || []).find(function(s) { return s.buildingId === b.id; });
        var cascadeStr = '';
        if (splData && splData.cascade && splData.cascade.level1) {
          cascadeStr = '1:' + splData.cascade.level1.ratio + '+1:' + splData.cascade.level2.ratio;
        } else if (splData && splData.splitters) {
          cascadeStr = splData.splitters.map(function(s) { return '1:' + s.ratio; }).join('+');
        }
        var lossData = (ada.calculations.lossBudget || []).find(function(l) { return l.buildingId === b.id; });
        var marginStr = lossData ? lossData.margin + ' dB' : '-';
        var marginCls = lossData ? (lossData.margin >= 0 ? 'fp-margin-ok' : 'fp-margin-fail') : '';
        var isCustom = b.customPenetration;
        var rowStyle = isOLT ? ' style="background:rgba(139,92,246,0.05)"' : isFDH ? ' style="background:rgba(59,130,246,0.04)"' : '';
        var rowCls = isCustom ? ' class="db-bldg-custom-pen"' : '';

        html += '<tr' + rowCls + rowStyle + '>';
        html += '<td>';
        if (isOLT) html += '<span class="fp-badge olt" style="margin-right:4px">OLT</span>';
        if (isFDH) html += '<span class="fp-badge fdh" style="margin-right:4px">FDH</span>';
        html += b.name + '</td>';
        html += '<td>' + b.bb + '</td>';
        html += '<td><input type="number" class="db-pen-input" data-bldg-id="' + b.id + '" min="10" max="100" step="5" value="' + bPen + '"></td>';
        html += '<td><b>' + bEffBB + '</b></td>';
        html += '<td><span class="fp-badge splitter">' + cascadeStr + '</span></td>';
        html += '<td class="' + marginCls + '">' + marginStr + '</td>';
        html += '<td>' + (isCustom ? '<button class="db-pen-reset" data-bldg-id="' + b.id + '" title="Varsayilana don">&times;</button>' : '') + '</td>';
        html += '</tr>';
      }
      html += '</tbody></table>';
      html += '</div></div>';
    }

    el.innerHTML = html;

    // Bind ada dropdown
    bindAdaDropdown('ada-mgmt-dd', function() { renderAdaManagement(el); });

    // Bind OLT port select
    var portSelect = document.getElementById('db-olt-port-select');
    if (portSelect && ada) {
      portSelect.addEventListener('change', function() {
        var val = this.value;
        var count = val === 'auto' ? null : parseInt(val, 10);
        Topology.setOltPortCount(ada.id, count);
        Storage.autoSave();
        renderAdaManagement(el);
        showToast('PON port ayari guncellendi', 'success');
      });
    }

    // Bind penetration slider
    var penSlider = document.getElementById('db-pen-slider');
    if (penSlider && ada) {
      penSlider.addEventListener('input', function() {
        var valEl = document.getElementById('db-pen-val');
        if (valEl) valEl.textContent = '%' + this.value;
      });
      penSlider.addEventListener('change', function() {
        var rate = parseInt(this.value, 10);
        Topology.setAdaPenetrationRate(ada.id, rate);
        Storage.autoSave();
        renderAdaManagement(el);
        showToast('Penetrasyon orani: %' + rate, 'success');
      });
    }

    // Bind per-building penetration inputs
    var penInputs = el.querySelectorAll('.db-pen-input');
    for (var pi2 = 0; pi2 < penInputs.length; pi2++) {
      penInputs[pi2].addEventListener('change', function() {
        var bldgId = parseInt(this.dataset.bldgId, 10);
        var rate = parseInt(this.value, 10);
        if (isNaN(rate) || rate < 10) rate = 10;
        if (rate > 100) rate = 100;
        Topology.setBuildingPenetrationRate(ada.id, bldgId, rate);
        Storage.autoSave();
        renderAdaManagement(el);
        showToast('Bina penetrasyon orani guncellendi', 'success');
      });
    }

    // Bind penetration reset buttons
    var penResets = el.querySelectorAll('.db-pen-reset');
    for (var pr = 0; pr < penResets.length; pr++) {
      penResets[pr].addEventListener('click', function() {
        var bldgId = parseInt(this.dataset.bldgId, 10);
        Topology.resetBuildingPenetrationRate(ada.id, bldgId);
        Storage.autoSave();
        renderAdaManagement(el);
        showToast('Varsayilana donuldu', 'info');
      });
    }

    // Bind equipment selection dropdowns
    var eqSelects = el.querySelectorAll('.db-eq-select');
    for (var eqi = 0; eqi < eqSelects.length; eqi++) {
      eqSelects[eqi].addEventListener('change', function() {
        var field = this.dataset.eq;
        var val = this.value;
        if (!ada.topology.equipmentSelections) ada.topology.equipmentSelections = {};
        var DB = PonEngine.DEVICE_DB;

        if (field === 'oltDevice') {
          if (val === '') { delete ada.topology.equipmentSelections.oltDevice; }
          else { var d = DB.olt[parseInt(val, 10)]; ada.topology.equipmentSelections.oltDevice = { brand: d.brand, model: d.model, price: d.price, ports: d.ports }; }
        } else if (field === 'ontDevice') {
          if (val === '') { delete ada.topology.equipmentSelections.ontDevice; }
          else { var d2 = DB.ont[parseInt(val, 10)]; ada.topology.equipmentSelections.ontDevice = { brand: d2.brand, model: d2.model, price: d2.price }; }
        } else if (field === 'splitterBrand') {
          if (val === '') { delete ada.topology.equipmentSelections.splitterBrand; }
          else { ada.topology.equipmentSelections.splitterBrand = val; }
        } else if (field === 'sfpModule') {
          if (val === '') { delete ada.topology.equipmentSelections.sfpModule; }
          else { var d3 = DB.sfp[parseInt(val, 10)]; ada.topology.equipmentSelections.sfpModule = { brand: d3.brand, model: d3.model, price: d3.price }; }
        }

        Storage.autoSave();
        showToast('Ekipman secimi kaydedildi', 'success');
      });
    }

    // Bind help toggle
    var helpToggle = document.getElementById('db-help-toggle');
    var helpBody = document.getElementById('db-help-body');
    if (helpToggle && helpBody) {
      helpToggle.addEventListener('click', function() {
        helpToggle.classList.toggle('open');
        helpBody.classList.toggle('open');
      });
    }
  }

  // ─── TOPOLOGY ─────────────────────────────────────────────────

  // Topology interaction state
  var topoState = {
    viewBox: { x: 0, y: 0, w: 1400, h: 600 },
    scale: 1,
    isPanning: false,
    isDragging: false,
    panStart: null,
    dragNode: null,
    dragOffset: null,
    geoView: false,
    cableMode: false,    // KABLO CIZ mode active
    cableSource: null    // first node selected (buildingId)
  };

  function resetTopoState() {
    topoState.viewBox = { x: 0, y: 0, w: 1400, h: 600 };
    topoState.scale = 1;
    topoState.isPanning = false;
    topoState.isDragging = false;
  }

  function renderTopology(el) {
    var P = Topology.PROJECT;
    var completedAdas = P.adas.filter(function(a) { return a.status === 'completed'; });

    if (completedAdas.length === 0) {
      el.innerHTML = emptyState('&#9676;', 'Topoloji diyagrami yok', 'Ada tamamlandiginda ring topoloji diyagrami burada gorunur.');
      return;
    }

    if (!activeAdaId || !completedAdas.find(function(a) { return a.id == activeAdaId; })) {
      activeAdaId = completedAdas[0].id;
    }
    var html = renderAdaSelector('topo-dd', { adas: P.adas, activeId: activeAdaId, filterCompleted: true });

    // Resolve active ada early so we can check geo data
    var ada = completedAdas.find(function(x) { return x.id === activeAdaId; });

    // View mode toggle: Diagram vs Geo Map
    var hasGeoData = ada && ada.buildings.some(function(b) { return b.lat && b.lng; });
    var hasSnapshot = ada && ada.mapSnapshot && ada.mapSnapshot.screenshot;
    var geoViewActive = (hasGeoData || hasSnapshot) && topoState.geoView;

    var hasManual = ada && ada.topology.manualEdges && ada.topology.manualEdges.length > 0;

    html += '<div class="db-card"><div class="db-card-header"><span class="db-card-dot" style="background:var(--fp-olt)"></span><span class="db-card-title">Interaktif Topoloji</span>' +
      '<div style="margin-left:auto;display:flex;gap:6px;align-items:center">' +
      '<button class="fp-btn fp-btn-sm' + (topoState.cableMode ? ' fp-btn-danger' : ' fp-btn-ada') + '" id="db-topo-cable-mode" title="Binalar arasi kablo ciz">' + (topoState.cableMode ? 'KABLO CIZ \u2713' : 'KABLO CIZ') + '</button>' +
      (hasManual ? '<span style="font-size:.7rem;color:#94a3b8">' + ada.topology.manualEdges.length + ' kablo</span>' : '') +
      (hasManual ? '<button class="fp-btn fp-btn-sm fp-btn-ada" id="db-topo-hesapla" title="Manuel kablolar uzerinden splitter, loss budget ve maliyet hesapla" style="background:#06b6d4;border-color:#06b6d4;color:#000;font-weight:700">HESAPLA</button>' : '') +
      (hasManual ? '<button class="fp-btn fp-btn-sm" id="db-topo-auto-mst" title="Manuel kablolari temizle, otomatik MST\'ye don" style="color:#f97316">OTOMATIK</button>' : '') +
      ((hasGeoData || hasSnapshot) ? '<button class="fp-btn fp-btn-sm' + (geoViewActive ? ' fp-btn-ada' : '') + '" id="db-topo-geo-toggle" title="Harita gorunumu">' + (geoViewActive ? 'DIYAGRAM' : 'HARITA') + '</button>' : '') +
      '<button class="fp-btn fp-btn-sm" id="db-topo-reset-pos" title="Pozisyonlari sifirla">Sifirla</button>' +
      '</div></div>' +
      '<div class="db-card-body" style="padding:0"><div class="db-topo-viewport" id="db-topo-viewport">' +
      '<div class="db-topo-controls" id="db-topo-controls">' +
      '<button id="db-topo-zin" title="Yakinlastir">+</button>' +
      '<button id="db-topo-zout" title="Uzaklastir">-</button>' +
      '<button id="db-topo-zreset" title="Sifirla" style="font-size:.7rem">R</button>' +
      '</div>' +
      '<div id="db-topo-container"></div>' +
      '</div></div></div>';

    // PTP table placeholder
    html += '<div id="db-ptp-table-container"></div>';

    el.innerHTML = html;

    resetTopoState();

    // Render topology SVG (diagram or geo view)
    if (ada) {
      var topoEl = document.getElementById('db-topo-container');
      if (topoEl) {
        if (geoViewActive) {
          renderGeoTopology(topoEl, ada);
        } else {
          renderTopologySVG(topoEl, ada);
        }
        bindTopoInteractions(ada);
      }
    }

    // Bind ada dropdown
    bindAdaDropdown('topo-dd', function() { renderTopology(el); });

    // KABLO CIZ toggle button
    var cableModeBtn = document.getElementById('db-topo-cable-mode');
    if (cableModeBtn && ada) {
      cableModeBtn.addEventListener('click', function() {
        topoState.cableMode = !topoState.cableMode;
        topoState.cableSource = null;
        // First time entering cable mode: copy current MST as manual edges
        if (topoState.cableMode && (!ada.topology.manualEdges || ada.topology.manualEdges.length === 0)) {
          Topology.copyMstToManualEdges(ada.id);
          Storage.autoSave();
        }
        renderTopology(el);
        if (topoState.cableMode) {
          showToast('KABLO CIZ: Bina tikla → bina tikla = kablo ekle | Kabloya tikla = sil', 'info');
        }
      });
    }

    // HESAPLA button - run full recalculation on manual edges
    var hesaplaBtn = document.getElementById('db-topo-hesapla');
    if (hesaplaBtn && ada) {
      hesaplaBtn.addEventListener('click', function() {
        PonEngine.recalculateAda(ada);
        Storage.autoSave();
        renderTopology(el);
        showToast('Hesaplama tamamlandi: splitter, kayip butcesi, maliyet guncellendi', 'success');
      });
    }

    // OTOMATIK button (clear manual edges, revert to auto MST)
    var autoMstBtn = document.getElementById('db-topo-auto-mst');
    if (autoMstBtn && ada) {
      autoMstBtn.addEventListener('click', function() {
        if (!confirm('Manuel kablolar silinecek ve otomatik MST\'ye donulecek. Emin misiniz?')) return;
        Topology.clearManualEdges(ada.id);
        Storage.autoSave();
        topoState.cableMode = false;
        topoState.cableSource = null;
        renderTopology(el);
        showToast('Otomatik MST\'ye donuldu', 'info');
      });
    }

    // Geo-view toggle button
    var geoToggleBtn = document.getElementById('db-topo-geo-toggle');
    if (geoToggleBtn) {
      geoToggleBtn.addEventListener('click', function() {
        topoState.geoView = !topoState.geoView;
        renderTopology(el);
      });
    }

    // Render PTP table
    if (ada) {
      var ptpEl = document.getElementById('db-ptp-table-container');
      var ptpL = ada.topology.ptpLinks || [];
      if (ptpEl && ptpL.length > 0) {
        var ptpHtml = '<div class="db-card" style="margin-top:16px"><div class="db-card-header"><span class="db-card-dot" style="background:#ef4444"></span><span class="db-card-title">PTP Kablosuz Baglantilar</span></div><div class="db-card-body">';
        ptpHtml += '<table class="fp-table"><thead><tr><th>Kaynak</th><th>Hedef</th><th>Cihaz</th><th>Frekans</th><th>Mesafe</th><th>Hiz</th></tr></thead><tbody>';
        for (var tpi = 0; tpi < ptpL.length; tpi++) {
          var tp = ptpL[tpi];
          var tpFrom = ada.buildings.find(function(x) { return x.id === tp.fromBuildingId; });
          var tpTo = ada.buildings.find(function(x) { return x.id === tp.toBuildingId; });
          ptpHtml += '<tr>';
          ptpHtml += '<td>' + (tpFrom ? tpFrom.name : '?') + '</td>';
          ptpHtml += '<td>' + (tpTo ? tpTo.name : '?') + '</td>';
          ptpHtml += '<td>' + tp.device + '</td>';
          ptpHtml += '<td>' + tp.freqGHz + ' GHz</td>';
          ptpHtml += '<td>' + tp.distanceM + 'm</td>';
          ptpHtml += '<td>' + tp.throughputMbps + ' Mbps</td>';
          ptpHtml += '</tr>';
        }
        ptpHtml += '</tbody></table></div></div>';
        ptpEl.innerHTML = ptpHtml;
      }
    }

    // Reset positions button
    var resetBtn = document.getElementById('db-topo-reset-pos');
    if (resetBtn && ada) {
      resetBtn.addEventListener('click', function() {
        ada.topology.svgPositions = {};
        resetTopoState();
        var topoEl2 = document.getElementById('db-topo-container');
        if (topoEl2) {
          if (topoState.geoView) {
            renderGeoTopology(topoEl2, ada);
          } else {
            renderTopologySVG(topoEl2, ada);
          }
          bindTopoInteractions(ada);
        }
        Storage.autoSave();
        showToast('Pozisyonlar sifirlandi', 'info');
      });
    }
  }

  // ─── LOSS BUDGET ──────────────────────────────────────────────

  function renderLossBudget(el) {
    var P = Topology.PROJECT;
    var completedAdas = P.adas.filter(function(a) { return a.status === 'completed'; });

    if (completedAdas.length === 0) {
      el.innerHTML = emptyState('&#9735;', 'Kayip butcesi yok', 'Ada tamamlandiginda kayip hesaplari burada gorunur.');
      return;
    }

    if (!activeAdaId || !completedAdas.find(function(a) { return a.id == activeAdaId; })) {
      activeAdaId = completedAdas[0].id;
    }

    // Education card
    var eduHtml = '<div class="db-edu-card">';
    eduHtml += '<button class="db-edu-toggle" id="db-loss-edu-toggle">';
    eduHtml += '<span class="db-edu-toggle-icon">&#9432;</span>';
    eduHtml += '<span class="db-edu-toggle-title">GPON Kayip Butcesi Nedir?</span>';
    eduHtml += '<span class="db-edu-toggle-arrow">&#9660;</span>';
    eduHtml += '</button>';
    eduHtml += '<div class="db-edu-body" id="db-loss-edu-body">';
    eduHtml += '<div class="db-edu-grid">';
    eduHtml += '<div class="db-edu-item"><div class="db-edu-item-title">Splitter Kaybi</div><div class="db-edu-item-desc">1:4 = 7.0 dB | 1:8 = 10.5 dB | 1:16 = 14.0 dB | 1:32 = 17.5 dB<br>Isigi bolen pasif eleman. Oran arttikca kayip artar.</div></div>';
    eduHtml += '<div class="db-edu-item"><div class="db-edu-item-title">Fiber Kaybi</div><div class="db-edu-item-desc">0.35 dB/km (1310nm)<br>Fiber kablonun mesafeye bagli dogal isik kaybi.</div></div>';
    eduHtml += '<div class="db-edu-item"><div class="db-edu-item-title">Konnektor Kaybi</div><div class="db-edu-item-desc">0.5 dB / adet (SC/APC)<br>Fiber birlestirme noktalarindaki kayip (4 adet varsayilan).</div></div>';
    eduHtml += '<div class="db-edu-item"><div class="db-edu-item-title">Ekleme (Splice) Kaybi</div><div class="db-edu-item-desc">0.1 dB / adet<br>Fiber fusion ekleme noktalarindaki kayip (2 adet varsayilan).</div></div>';
    eduHtml += '</div>';
    eduHtml += '<div class="db-edu-schematic">OLT ----backbone----> FDH ----dagitim----> BINA ----drop----> ONT\n(Santral)   96 kor     1:8     24 kor      1:16    4 kor\n                    splitter             splitter</div>';
    eduHtml += '<div style="margin-bottom:8px;font-family:\'JetBrains Mono\',monospace;font-size:.72rem;color:var(--fp-text-dim)">GPON Class B+ Toplam Butce: <b style="color:var(--fp-accent)">28 dB</b></div>';
    eduHtml += '<div class="db-edu-budget-bar"><div class="db-edu-budget-fill" style="width:93%;background:linear-gradient(90deg,#22c55e,#f59e0b)"></div><span class="db-edu-budget-label">26/28 dB (ornek)</span></div>';
    eduHtml += '</div></div>';

    var html = eduHtml;
    html += renderAdaSelector('loss-dd', { adas: P.adas, activeId: activeAdaId, filterCompleted: true });

    var ada = completedAdas.find(function(x) { return x.id == activeAdaId; });
    if (!ada) { el.innerHTML = html; return; }

    var items = ada.calculations.lossBudget || [];
    if (items.length > 0) {
      html += '<div class="db-card"><div class="db-card-header"><span class="db-card-dot"></span><span class="db-card-title">' + ada.name + ' - Kayip Butcesi</span></div><div class="db-card-body">';
      html += '<table class="fp-table"><thead><tr><th>Bina</th><th>BB</th><th>Yol</th><th>Kus Ucusu</th><th>Splitter</th><th>Fiber</th><th>Toplam</th><th>Marj</th></tr></thead><tbody>';

      for (var j = 0; j < items.length; j++) {
        var l = items[j];
        html += '<tr>';
        html += '<td><b>' + l.buildingName + '</b></td>';
        html += '<td>' + l.bb + '</td>';
        html += '<td>' + l.distanceM + 'm</td>';
        html += '<td style="color:#94a3b8;font-size:.7rem">' + (l.directDistanceM || l.distanceM) + 'm</td>';
        html += '<td><span class="fp-splitter-badge">' + l.splitterLoss + ' dB</span></td>';
        html += '<td>' + l.fiberLoss + ' dB</td>';
        html += '<td><b>' + l.totalLoss + ' dB</b></td>';
        html += '<td class="' + (l.margin >= 0 ? 'fp-margin-ok' : 'fp-margin-fail') + '">' + l.margin + ' dB ' + (l.margin >= 0 ? '\u2713' : '\u2717') + '</td>';
        html += '</tr>';
      }
      html += '</tbody></table>';
      html += '<div style="font-size:.68rem;color:var(--fp-text-muted);margin-top:8px;font-family:\'JetBrains Mono\',monospace">GPON Class B+ Butce: 28 dB &middot; Fiber: 0.35 dB/km &middot; Kon: 0.5 dB &middot; Ek: 0.1 dB</div>';
      html += '</div></div>';
    }

    el.innerHTML = html;
    bindAdaDropdown('loss-dd', function() { renderLossBudget(el); });

    // Education card toggle
    var eduToggle = document.getElementById('db-loss-edu-toggle');
    var eduBody = document.getElementById('db-loss-edu-body');
    if (eduToggle && eduBody) {
      eduToggle.addEventListener('click', function() {
        var isOpen = eduBody.classList.contains('open');
        eduBody.classList.toggle('open');
        eduToggle.classList.toggle('open');
      });
    }
  }

  // ─── CABLE PLAN ───────────────────────────────────────────────

  function renderCablePlan(el) {
    var P = Topology.PROJECT;
    var completedAdas = P.adas.filter(function(a) { return a.status === 'completed'; });
    var typeLabels = { backbone: 'Backbone', distribution: 'Dagitim', drop: 'Drop', ring: 'Ring' };

    if (completedAdas.length === 0) {
      el.innerHTML = emptyState('&#8212;', 'Kablo plani yok', 'Ada tamamlandiginda kablo segmentleri burada gorunur.');
      return;
    }

    if (!activeAdaId || !completedAdas.find(function(a) { return a.id == activeAdaId; })) {
      activeAdaId = completedAdas[0].id;
    }

    var html = renderAdaSelector('cable-dd', { adas: P.adas, activeId: activeAdaId, filterCompleted: true });

    var ada = completedAdas.find(function(x) { return x.id == activeAdaId; });
    if (!ada) { el.innerHTML = html; return; }

    var cables = ada.calculations.cables || [];

    // Cable plan SVG schematic
    if (cables.length > 0) {
      var oltB = ada.buildings.find(function(b) { return b.id === ada.topology.oltBuildingId; });
      var fdhCount = (ada.topology.fdhNodes || []).length;
      var backboneCable = cables.find(function(c) { return c.type === 'backbone'; });
      var distCables = cables.filter(function(c) { return c.type === 'distribution'; });
      var totalDistM = distCables.reduce(function(s, c) { return s + c.distanceM; }, 0);
      var bbCores = backboneCable ? backboneCable.cores : 96;
      var avgDistCores = distCables.length > 0 ? Math.round(distCables.reduce(function(s, c) { return s + c.cores; }, 0) / distCables.length) : 12;

      var schW = 700, schH = 80;
      var schSvg = '<svg viewBox="0 0 ' + schW + ' ' + schH + '" style="width:100%;height:80px;display:block;margin-bottom:12px">';
      // Background
      schSvg += '<rect x="0" y="0" width="' + schW + '" height="' + schH + '" rx="6" fill="var(--fp-surface2)"/>';

      // Nodes
      var nodes = [
        { x: 40, label: 'SANTRAL', sub: '(OLT)', color: '#a78bfa' },
        { x: 220, label: 'FDH', sub: fdhCount + ' adet', color: '#3b82f6' },
        { x: 430, label: 'BINA', sub: ada.buildings.length + ' adet', color: '#f59e0b' },
        { x: 620, label: 'ONT', sub: 'Abone', color: '#22c55e' }
      ];

      for (var ni = 0; ni < nodes.length; ni++) {
        var n = nodes[ni];
        schSvg += '<rect x="' + (n.x - 32) + '" y="15" width="64" height="30" rx="4" fill="' + n.color + '" opacity="0.15" stroke="' + n.color + '" stroke-width="1"/>';
        schSvg += '<text x="' + n.x + '" y="33" text-anchor="middle" font-size="9" font-weight="700" fill="' + n.color + '">' + n.label + '</text>';
        schSvg += '<text x="' + n.x + '" y="58" text-anchor="middle" font-size="7" fill="#94a3b8">' + n.sub + '</text>';
      }

      // Cables
      var cableSegs = [
        { x1: 72, x2: 188, label: bbCores + ' kor', sub: (backboneCable ? backboneCable.distanceM : 500) + 'm', color: '#a855f7' },
        { x1: 252, x2: 398, label: avgDistCores + ' kor', sub: Math.round(totalDistM / Math.max(1, distCables.length)) + 'm ort', color: '#3b82f6' },
        { x1: 462, x2: 588, label: '2-4 kor', sub: 'drop', color: '#f97316' }
      ];

      for (var ci2 = 0; ci2 < cableSegs.length; ci2++) {
        var cs = cableSegs[ci2];
        var my = 30;
        schSvg += '<line x1="' + cs.x1 + '" y1="' + my + '" x2="' + cs.x2 + '" y2="' + my + '" stroke="' + cs.color + '" stroke-width="2.5" stroke-dasharray="6 3"/>';
        schSvg += '<text x="' + ((cs.x1 + cs.x2) / 2) + '" y="' + (my - 6) + '" text-anchor="middle" font-size="7" font-weight="600" fill="' + cs.color + '">' + cs.label + '</text>';
        schSvg += '<text x="' + ((cs.x1 + cs.x2) / 2) + '" y="' + (my + 30) + '" text-anchor="middle" font-size="6.5" fill="#64748b">' + cs.sub + '</text>';
        // Arrow
        schSvg += '<polygon points="' + cs.x2 + ',' + my + ' ' + (cs.x2 - 6) + ',' + (my - 4) + ' ' + (cs.x2 - 6) + ',' + (my + 4) + '" fill="' + cs.color + '"/>';
      }

      schSvg += '</svg>';
      html += schSvg;
    }

    if (cables.length > 0) {
      html += '<div class="db-card"><div class="db-card-header"><span class="db-card-dot" style="background:var(--fp-orange)"></span><span class="db-card-title">' + ada.name + ' - Kablo Plani</span></div><div class="db-card-body">';
      html += '<table class="fp-table"><thead><tr><th>Segment</th><th>Kor</th><th>Tip</th><th>Mesafe</th></tr></thead><tbody>';

      var totalM = 0;
      for (var j = 0; j < cables.length; j++) {
        var c = cables[j];
        totalM += c.distanceM;
        var korCls = c.cores >= 12 ? 'fp-kor-12' : c.cores >= 8 ? 'fp-kor-8' : c.cores >= 4 ? 'fp-kor-4' : 'fp-kor-2';
        html += '<tr>';
        html += '<td>' + c.fromName + ' \u2192 ' + c.toName + '</td>';
        html += '<td><span class="fp-kor-badge ' + korCls + '">\u25CF ' + c.cores + ' kor</span></td>';
        html += '<td>' + (typeLabels[c.type] || c.type) + '</td>';
        html += '<td>' + c.distanceM + 'm</td>';
        html += '</tr>';
      }
      html += '<tr class="fp-total-row"><td>TOPLAM</td><td></td><td></td><td><b>' + totalM + 'm (' + (totalM / 1000).toFixed(2) + ' km)</b></td></tr>';
      html += '</tbody></table>';
      html += '</div></div>';
    }

    // TIA-598 Fiber Color Code
    html += '<div class="db-card"><div class="db-card-header"><span class="db-card-dot" style="background:#FF69B4"></span><span class="db-card-title">TIA-598 Fiber Renk Semasi</span></div><div class="db-card-body">';
    for (var k = 0; k < TIA_COLORS.length; k++) {
      html += '<div class="db-color-row">';
      html += '<span class="db-color-dot" style="background:' + TIA_COLORS[k].hex + '"></span>';
      html += '<span class="db-color-label">' + (k + 1) + '. ' + TIA_COLORS[k].name + '</span>';
      html += '</div>';
    }
    html += '</div></div>';

    el.innerHTML = html;
    bindAdaDropdown('cable-dd', function() { renderCablePlan(el); });
  }

  // ─── INVENTORY ────────────────────────────────────────────────

  function getMergedCatalog() {
    return PonEngine.getCatalog(customCatalog);
  }

  function getMergedInventory() {
    var P = Topology.PROJECT;
    var mergedCat = getMergedCatalog();
    var merged = {};
    var totalCost = 0;
    var totalBB = 0;

    for (var i = 0; i < P.adas.length; i++) {
      var ada = P.adas[i];
      totalBB += ada.buildings.reduce(function(s, b) { return s + b.bb; }, 0);
      var inv = PonEngine.calcInventory(ada, mergedCat);
      for (var j = 0; j < inv.length; j++) {
        var item = inv[j];
        if (!merged[item.key]) {
          merged[item.key] = { key: item.key, name: item.name, unit: item.unit, price: item.price || 0, qty: 0, total: 0 };
        }
        merged[item.key].qty += item.qty;
        merged[item.key].total += item.total;
        totalCost += item.total;
      }
    }

    return { items: Object.values(merged), totalCost: totalCost, totalBB: totalBB };
  }

  function renderInventory(el) {
    var html = '';

    // Sub-tabs
    html += '<div class="db-inv-tabs">';
    html += '<button class="db-inv-tab ' + (inventorySubTab === 'cost' ? 'active' : '') + '" data-tab="cost">Maliyet Ozeti</button>';
    html += '<button class="db-inv-tab ' + (inventorySubTab === 'materials' ? 'active' : '') + '" data-tab="materials">Malzeme Listesi</button>';
    html += '<button class="db-inv-tab ' + (inventorySubTab === 'per-ada' ? 'active' : '') + '" data-tab="per-ada">Ada Bazli</button>';
    html += '</div>';

    html += '<div id="db-inv-content"></div>';
    el.innerHTML = html;

    // Bind sub-tab clicks
    var tabs = el.querySelectorAll('.db-inv-tab');
    for (var t = 0; t < tabs.length; t++) {
      tabs[t].addEventListener('click', function() {
        inventorySubTab = this.dataset.tab;
        renderInventory(el);
      });
    }

    var contentEl = document.getElementById('db-inv-content');
    if (inventorySubTab === 'cost') {
      renderCostSummary(contentEl);
    } else if (inventorySubTab === 'per-ada') {
      renderPerAdaCost(contentEl);
    } else {
      renderMaterialsEditor(contentEl);
    }
  }

  function renderCostSummary(el) {
    var data = getMergedInventory();
    var items = data.items;
    var totalCost = data.totalCost;
    var totalBB = data.totalBB;

    if (items.length === 0) {
      el.innerHTML = emptyState('&#9744;', 'Envanter yok', 'Ada tamamlandiginda malzeme listesi burada gorunur.');
      return;
    }

    var html = '';
    // Calculate total effective BB across all adas
    var P2 = Topology.PROJECT;
    var targetSubs = 0;
    for (var ti = 0; ti < P2.adas.length; ti++) {
      for (var tbi = 0; tbi < P2.adas[ti].buildings.length; tbi++) {
        targetSubs += PonEngine.getEffectiveBB(P2.adas[ti].buildings[tbi], P2.adas[ti]);
      }
    }

    // KPI row
    html += '<div class="db-kpi-row">';
    html += kpi(totalCost.toLocaleString('tr-TR') + ' TL', 'TOPLAM MALIYET');
    html += kpi(totalBB > 0 ? Math.round(totalCost / totalBB).toLocaleString('tr-TR') + ' TL' : '-', 'BB BASI', 'var(--fp-info)');
    html += kpi(targetSubs > 0 ? Math.round(totalCost / targetSubs).toLocaleString('tr-TR') + ' TL' : '-', 'ABONE BASI', 'var(--fp-success)');
    html += '</div>';

    // Group by category
    var CATS = PonEngine.CATALOG_CATEGORIES;
    var catLabels = { aktif: 'Aktif Ekipman', pasif: 'Pasif Ekipman', kablo: 'Kablo', aksesuar: 'Aksesuar' };
    var catOrder = ['aktif', 'pasif', 'kablo', 'aksesuar'];
    var grouped = {};
    var catTotals = {};

    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var cat = CATS[it.key] || 'aksesuar';
      if (!grouped[cat]) { grouped[cat] = []; catTotals[cat] = 0; }
      grouped[cat].push(it);
      catTotals[cat] += it.total;
    }

    html += '<div class="db-card"><div class="db-card-header"><span class="db-card-dot"></span><span class="db-card-title">Kategorili Maliyet Ozeti</span></div><div class="db-card-body">';
    html += '<table class="fp-table"><thead><tr><th>Ekipman</th><th>Miktar</th><th>Birim Fiyat</th><th>Toplam</th></tr></thead><tbody>';

    for (var c = 0; c < catOrder.length; c++) {
      var catKey = catOrder[c];
      var catItems = grouped[catKey];
      if (!catItems || catItems.length === 0) continue;

      html += '<tr class="fp-cat-header"><td colspan="4">' + (catLabels[catKey] || catKey) + '</td></tr>';
      for (var j = 0; j < catItems.length; j++) {
        var ci = catItems[j];
        html += '<tr><td>' + ci.name + '</td><td>' + ci.qty + ' ' + ci.unit + '</td><td>' + ci.price.toLocaleString('tr-TR') + ' TL</td><td><b>' + ci.total.toLocaleString('tr-TR') + ' TL</b></td></tr>';
      }
      html += '<tr style="background:var(--fp-surface2)"><td colspan="3" style="text-align:right;font-size:.72rem;color:var(--fp-text-dim)">' + (catLabels[catKey] || catKey) + ' Toplami</td><td><b>' + catTotals[catKey].toLocaleString('tr-TR') + ' TL</b></td></tr>';
    }

    html += '<tr class="fp-total-row"><td colspan="3">GENEL TOPLAM</td><td><b>' + totalCost.toLocaleString('tr-TR') + ' TL</b></td></tr>';
    html += '</tbody></table>';
    html += '</div></div>';

    el.innerHTML = html;
  }

  function renderPerAdaCost(el) {
    var P = Topology.PROJECT;
    var mergedCat = getMergedCatalog();
    var CATS = PonEngine.CATALOG_CATEGORIES;
    var catLabels = { aktif: 'Aktif Ekipman', pasif: 'Pasif Ekipman', kablo: 'Kablo', aksesuar: 'Aksesuar' };
    var catOrder = ['aktif', 'pasif', 'kablo', 'aksesuar'];

    var completedAdas = P.adas.filter(function(a) { return a.status === 'completed'; });
    if (completedAdas.length === 0) {
      el.innerHTML = emptyState('&#9744;', 'Ada bazli maliyet yok', 'Ada tamamlandiginda maliyet analizi gorunur.');
      return;
    }

    // Ada dropdown
    if (!activeAdaId || !completedAdas.find(function(a) { return a.id == activeAdaId; })) {
      activeAdaId = completedAdas[0].id;
    }

    var html = renderAdaSelector('inv-ada-dd', { adas: P.adas, activeId: activeAdaId, filterCompleted: true });

    var ada = completedAdas.find(function(x) { return x.id == activeAdaId; });
    if (!ada) { el.innerHTML = html; return; }

    // Compute per-ada inventory
    var inv = PonEngine.calcInventory(ada, mergedCat);
    var totalCost = inv.reduce(function(s, i) { return s + i.total; }, 0);
    var adaBB = ada.buildings.reduce(function(s, b) { return s + b.bb; }, 0);
    var adaEffBB = 0;
    for (var ei = 0; ei < ada.buildings.length; ei++) {
      adaEffBB += PonEngine.getEffectiveBB(ada.buildings[ei], ada);
    }

    // KPI
    html += '<div class="db-kpi-row">';
    html += kpi(totalCost.toLocaleString('tr-TR') + ' TL', 'ADA MALIYETI');
    html += kpi(adaBB > 0 ? Math.round(totalCost / adaBB).toLocaleString('tr-TR') + ' TL' : '-', 'BB BASI', 'var(--fp-info)');
    html += kpi(adaEffBB > 0 ? Math.round(totalCost / adaEffBB).toLocaleString('tr-TR') + ' TL' : '-', 'ABONE BASI', 'var(--fp-success)');
    html += '</div>';

    // Categorized cost table
    var grouped = {};
    var catTotals = {};
    for (var i = 0; i < inv.length; i++) {
      var it = inv[i];
      var cat = CATS[it.key] || 'aksesuar';
      if (!grouped[cat]) { grouped[cat] = []; catTotals[cat] = 0; }
      grouped[cat].push(it);
      catTotals[cat] += it.total;
    }

    html += '<div class="db-card"><div class="db-card-header"><span class="db-card-dot"></span><span class="db-card-title">' + ada.name + ' - Kategorili Maliyet</span></div><div class="db-card-body">';
    html += '<table class="fp-table"><thead><tr><th>Ekipman</th><th>Miktar</th><th>Birim Fiyat</th><th>Toplam</th></tr></thead><tbody>';
    for (var c = 0; c < catOrder.length; c++) {
      var catKey = catOrder[c];
      var catItems = grouped[catKey];
      if (!catItems || catItems.length === 0) continue;
      html += '<tr class="fp-cat-header"><td colspan="4">' + (catLabels[catKey] || catKey) + '</td></tr>';
      for (var j = 0; j < catItems.length; j++) {
        var ci = catItems[j];
        html += '<tr><td>' + ci.name + '</td><td>' + ci.qty + ' ' + ci.unit + '</td><td>' + (ci.price || 0).toLocaleString('tr-TR') + ' TL</td><td><b>' + ci.total.toLocaleString('tr-TR') + ' TL</b></td></tr>';
      }
      html += '<tr style="background:var(--fp-surface2)"><td colspan="3" style="text-align:right;font-size:.72rem;color:var(--fp-text-dim)">' + (catLabels[catKey] || catKey) + ' Toplami</td><td><b>' + (catTotals[catKey] || 0).toLocaleString('tr-TR') + ' TL</b></td></tr>';
    }
    html += '<tr class="fp-total-row"><td colspan="3">GENEL TOPLAM</td><td><b>' + totalCost.toLocaleString('tr-TR') + ' TL</b></td></tr>';
    html += '</tbody></table>';
    html += '</div></div>';

    // Comparison table: all adas
    html += '<div class="db-card"><div class="db-card-header"><span class="db-card-dot" style="background:var(--fp-info)"></span><span class="db-card-title">Tum Adalar Karsilastirma</span></div><div class="db-card-body">';
    html += '<table class="fp-table"><thead><tr><th>Ada</th><th>Bina</th><th>BB</th><th>Eff BB</th><th>Maliyet</th><th>Maliyet/BB</th></tr></thead><tbody>';
    for (var ai = 0; ai < completedAdas.length; ai++) {
      var ca = completedAdas[ai];
      var caInv = PonEngine.calcInventory(ca, mergedCat);
      var caCost = caInv.reduce(function(s, x) { return s + x.total; }, 0);
      var caBB = ca.buildings.reduce(function(s, b) { return s + b.bb; }, 0);
      var caEffBB = 0;
      for (var cbi = 0; cbi < ca.buildings.length; cbi++) {
        caEffBB += PonEngine.getEffectiveBB(ca.buildings[cbi], ca);
      }
      var isSelected = ca.id == activeAdaId;
      html += '<tr' + (isSelected ? ' style="background:rgba(250,204,21,0.06)"' : '') + '>';
      html += '<td><b>' + ca.name + '</b></td>';
      html += '<td>' + ca.buildings.length + '</td>';
      html += '<td>' + caBB + '</td>';
      html += '<td>' + caEffBB + '</td>';
      html += '<td>' + caCost.toLocaleString('tr-TR') + ' TL</td>';
      html += '<td>' + (caBB > 0 ? Math.round(caCost / caBB).toLocaleString('tr-TR') : '-') + ' TL</td>';
      html += '</tr>';
    }
    html += '</tbody></table>';
    html += '</div></div>';

    el.innerHTML = html;
    bindAdaDropdown('inv-ada-dd', function() {
      var contentEl = document.getElementById('db-inv-content');
      if (contentEl) renderPerAdaCost(contentEl);
    });
  }

  function renderMaterialsEditor(el) {
    var mergedCat = getMergedCatalog();
    var defaultCat = PonEngine.CATALOG;
    var CATS = PonEngine.CATALOG_CATEGORIES;
    var catLabels = { aktif: 'Aktif Ekipman', pasif: 'Pasif Ekipman', kablo: 'Kablo', aksesuar: 'Aksesuar' };
    var catOrder = ['aktif', 'pasif', 'kablo', 'aksesuar'];

    // Build full item list: default + custom keys
    var allKeys = {};
    var key;
    for (key in defaultCat) { if (defaultCat.hasOwnProperty(key)) allKeys[key] = true; }
    if (customCatalog) {
      for (key in customCatalog) { if (customCatalog.hasOwnProperty(key)) allKeys[key] = true; }
    }

    // Group items by category
    var grouped = {};
    for (key in allKeys) {
      if (!allKeys.hasOwnProperty(key)) continue;
      var cat = CATS[key] || 'aksesuar';
      if (!grouped[cat]) grouped[cat] = [];
      var item = mergedCat[key] || defaultCat[key] || {};
      var isCustomKey = !defaultCat[key]; // completely custom item
      var isEdited = customCatalog && customCatalog[key] && !isCustomKey;
      grouped[cat].push({ key: key, name: item.name || key, unit: item.unit || 'adet', price: item.price || 0, isCustom: isCustomKey, isEdited: isEdited });
    }

    var html = '';
    html += '<div class="db-card"><div class="db-card-header"><span class="db-card-dot" style="background:var(--fp-info)"></span><span class="db-card-title">Malzeme Fiyat Duzenleyici</span></div><div class="db-card-body">';
    html += '<table class="fp-table" id="db-mat-table"><thead><tr><th>Malzeme</th><th>Birim</th><th>Fiyat (TL)</th><th>Durum</th><th></th></tr></thead><tbody>';

    for (var c = 0; c < catOrder.length; c++) {
      var catKey = catOrder[c];
      var catItems = grouped[catKey];
      if (!catItems || catItems.length === 0) continue;

      html += '<tr class="fp-cat-header"><td colspan="5">' + (catLabels[catKey] || catKey) + '</td></tr>';
      for (var j = 0; j < catItems.length; j++) {
        var it = catItems[j];
        var nameDisabled = it.isCustom ? '' : ' disabled';
        var unitDisabled = it.isCustom ? '' : ' disabled';
        var badgeCls = it.isCustom ? 'custom' : it.isEdited ? 'edited' : 'default';
        var badgeText = it.isCustom ? 'Ozel' : it.isEdited ? 'Duzenlendi' : 'Varsayilan';
        var showReset = it.isCustom || it.isEdited;

        html += '<tr data-key="' + it.key + '">';
        html += '<td><input class="fp-mat-input fp-mat-name" data-field="name" value="' + it.name + '"' + nameDisabled + '></td>';
        html += '<td><input class="fp-mat-input fp-mat-unit" data-field="unit" value="' + it.unit + '"' + unitDisabled + '></td>';
        html += '<td><input class="fp-mat-input fp-mat-price" data-field="price" type="number" min="0" step="0.5" value="' + it.price + '"></td>';
        html += '<td><span class="fp-mat-badge ' + badgeCls + '">' + badgeText + '</span></td>';
        html += '<td>' + (showReset ? '<button class="fp-mat-reset" data-key="' + it.key + '" title="Varsayilana don">x</button>' : '') + '</td>';
        html += '</tr>';
      }
    }

    html += '</tbody></table>';

    html += '<div class="db-mat-actions">';
    html += '<button class="fp-btn db-mat-add" id="db-btn-mat-add">+ Yeni Malzeme Ekle</button>';
    html += '<button class="fp-btn fp-btn-ada" id="db-btn-mat-save">Kaydet</button>';
    html += '</div>';
    html += '</div></div>';

    el.innerHTML = html;
    bindMaterialEditorEvents(el);
  }

  function bindMaterialEditorEvents(el) {
    // Save button
    var saveBtn = document.getElementById('db-btn-mat-save');
    if (saveBtn) {
      saveBtn.addEventListener('click', function() {
        saveMaterialChanges(el);
      });
    }

    // Add new material
    var addBtn = document.getElementById('db-btn-mat-add');
    if (addBtn) {
      addBtn.addEventListener('click', function() {
        var timestamp = Date.now();
        var newKey = 'custom_' + timestamp;
        if (!customCatalog) customCatalog = {};
        customCatalog[newKey] = { name: 'Yeni Malzeme', unit: 'adet', price: 0 };
        // Add to categories
        PonEngine.CATALOG_CATEGORIES[newKey] = 'aksesuar';
        var contentEl = document.getElementById('db-inv-content');
        if (contentEl) renderMaterialsEditor(contentEl);
      });
    }

    // Reset buttons
    var resetBtns = el.querySelectorAll('.fp-mat-reset');
    for (var i = 0; i < resetBtns.length; i++) {
      resetBtns[i].addEventListener('click', function() {
        var key = this.dataset.key;
        if (!customCatalog) return;
        var isCustomKey = !PonEngine.CATALOG[key];
        if (isCustomKey) {
          delete customCatalog[key];
          delete PonEngine.CATALOG_CATEGORIES[key];
        } else {
          delete customCatalog[key];
        }
        Storage.saveCatalog(customCatalog).then(function() {
          showToast('Varsayilana donuldu', 'info');
          var contentEl = document.getElementById('db-inv-content');
          if (contentEl) renderMaterialsEditor(contentEl);
        });
      });
    }
  }

  function saveMaterialChanges(el) {
    var table = document.getElementById('db-mat-table');
    if (!table) return;

    var rows = table.querySelectorAll('tr[data-key]');
    var changes = {};
    var hasChanges = false;

    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var key = row.dataset.key;
      var priceInput = row.querySelector('input[data-field="price"]');
      var nameInput = row.querySelector('input[data-field="name"]');
      var unitInput = row.querySelector('input[data-field="unit"]');

      var newPrice = parseFloat(priceInput.value) || 0;
      var isCustomKey = !PonEngine.CATALOG[key];
      var defaultItem = PonEngine.CATALOG[key];

      if (isCustomKey) {
        // Custom item - always save
        changes[key] = {
          name: nameInput.value.trim() || key,
          unit: unitInput.value.trim() || 'adet',
          price: newPrice
        };
        hasChanges = true;
      } else if (defaultItem && newPrice !== defaultItem.price) {
        // Default item with changed price
        changes[key] = { price: newPrice };
        hasChanges = true;
      } else if (customCatalog && customCatalog[key]) {
        // Was edited, now back to default -> keep as change to check
        if (newPrice !== defaultItem.price) {
          changes[key] = { price: newPrice };
          hasChanges = true;
        }
      }
    }

    customCatalog = Object.keys(changes).length > 0 ? changes : null;
    Storage.saveCatalog(customCatalog).then(function() {
      showToast('Fiyatlar kaydedildi', 'success');
    }).catch(function(err) {
      showToast('Kayit hatasi: ' + err.message, 'error');
    });
  }

  // ─── EXPORT ───────────────────────────────────────────────────

  function renderExport(el) {
    var html = '<div class="db-section-title">DISARI AKTAR</div>';

    html += '<div class="db-export-grid">';

    html += '<div class="db-export-card" id="db-exp-geojson">';
    html += '<div class="db-export-icon">&#127758;</div>';
    html += '<div class="db-export-title">GeoJSON</div>';
    html += '<div class="db-export-desc">QGIS, Google Earth, geojson.io ile uyumlu</div>';
    html += '</div>';

    html += '<div class="db-export-card" id="db-exp-csv">';
    html += '<div class="db-export-icon">&#128196;</div>';
    html += '<div class="db-export-title">CSV</div>';
    html += '<div class="db-export-desc">Excel / Google Sheets ile ac</div>';
    html += '</div>';

    html += '<div class="db-export-card" id="db-exp-json">';
    html += '<div class="db-export-icon">&#128230;</div>';
    html += '<div class="db-export-title">JSON</div>';
    html += '<div class="db-export-desc">Tam proje verisi (yedekleme/aktarim)</div>';
    html += '</div>';

    html += '</div>';

    // QGIS Guide
    html += '<div class="db-guide">';
    html += '<h3>QGIS\'te GeoJSON Nasil Acilir?</h3>';
    html += '<ol>';
    html += '<li>Yukardaki <code>GeoJSON</code> butonuna tiklayin</li>';
    html += '<li>QGIS\'i acin</li>';
    html += '<li><code>Layer > Add Layer > Add Vector Layer</code> secin</li>';
    html += '<li>Indirilen <code>.geojson</code> dosyasini secin</li>';
    html += '<li>CRS olarak <code>EPSG:4326 (WGS 84)</code> secili oldugundan emin olun</li>';
    html += '<li>Bina noktalari ve kablo cizgileri haritada gorunecektir</li>';
    html += '</ol>';
    html += '</div>';

    el.innerHTML = html;

    // Bind export buttons
    document.getElementById('db-exp-geojson').addEventListener('click', function() {
      downloadFile(Topology.exportGeoJSON(), 'ftth-plan-' + Topology.PROJECT.meta.date + '.geojson', 'application/geo+json');
      showToast('GeoJSON indirildi', 'success');
    });
    document.getElementById('db-exp-csv').addEventListener('click', function() {
      downloadFile(Topology.exportCSV(), 'ftth-plan-' + Topology.PROJECT.meta.date + '.csv', 'text/csv;charset=utf-8');
      showToast('CSV indirildi', 'success');
    });
    document.getElementById('db-exp-json').addEventListener('click', function() {
      downloadFile(Topology.exportJSON(), 'ftth-plan-' + Topology.PROJECT.meta.date + '.json', 'application/json');
      showToast('JSON indirildi', 'success');
    });
  }

  // ─── GOOGLE DRIVE ───────────────────────────────────────────

  var gdriveState = { fileId: null, fileName: null, authenticated: false };

  function renderGDrive(el) {
    var html = '<div class="db-section-title">GOOGLE DRIVE ARSIVLEME</div>';

    html += '<div class="db-card"><div class="db-card-header"><span class="db-card-dot" style="background:var(--fp-info)"></span><span class="db-card-title">Hesap Baglantisi</span></div><div class="db-card-body" id="db-gdrive-auth">';
    html += '<div style="text-align:center;padding:12px"><span style="color:var(--fp-text-dim)">Kontrol ediliyor...</span></div>';
    html += '</div></div>';

    html += '<div class="db-card"><div class="db-card-header"><span class="db-card-dot"></span><span class="db-card-title">Kaydet / Yukle</span></div><div class="db-card-body" id="db-gdrive-actions">';
    html += '</div></div>';

    html += '<div class="db-card"><div class="db-card-header"><span class="db-card-dot" style="background:var(--fp-orange)"></span><span class="db-card-title">Kayitli Projeler</span></div><div class="db-card-body" id="db-gdrive-files">';
    html += '<div style="text-align:center;color:var(--fp-text-dim);font-size:.82rem;padding:20px">Once Google ile baglanin</div>';
    html += '</div></div>';

    el.innerHTML = html;

    // Check auth status
    if (typeof GDrive !== 'undefined') {
      GDrive.isAuthenticated().then(function(authed) {
        gdriveState.authenticated = authed;
        renderGDriveAuth();
        if (authed) {
          renderGDriveActions();
          refreshGDriveFiles();
        }
      }).catch(function() {
        renderGDriveAuth();
      });
    } else {
      var authEl = document.getElementById('db-gdrive-auth');
      if (authEl) authEl.innerHTML = '<div style="color:var(--fp-danger);padding:12px">GDrive modulu yuklenemedi</div>';
    }
  }

  function renderGDriveAuth() {
    var el = document.getElementById('db-gdrive-auth');
    if (!el) return;

    if (gdriveState.authenticated) {
      el.innerHTML = '<div style="display:flex;align-items:center;gap:12px">' +
        '<span style="color:var(--fp-success);font-weight:700;font-family:\'JetBrains Mono\',monospace;font-size:.82rem">&#10003; Bagli</span>' +
        '<button class="fp-btn fp-btn-sm" id="db-gdrive-logout" style="margin-left:auto">Cikis Yap</button>' +
        '</div>';
      document.getElementById('db-gdrive-logout').addEventListener('click', function() {
        GDrive.revokeToken().then(function() {
          gdriveState.authenticated = false;
          gdriveState.fileId = null;
          renderGDriveAuth();
          var actEl = document.getElementById('db-gdrive-actions');
          if (actEl) actEl.innerHTML = '';
          var filesEl = document.getElementById('db-gdrive-files');
          if (filesEl) filesEl.innerHTML = '<div style="text-align:center;color:var(--fp-text-dim);font-size:.82rem;padding:20px">Once Google ile baglanin</div>';
          showToast('Google Drive baglantisi kesildi', 'info');
        });
      });
    } else {
      el.innerHTML = '<div style="text-align:center">' +
        '<button class="fp-btn fp-btn-ada" id="db-gdrive-login" style="padding:10px 24px">Google ile Baglan</button>' +
        '<div style="color:var(--fp-text-muted);font-size:.72rem;margin-top:8px">Projelerinizi Google Drive\'a kaydedin</div>' +
        '</div>';
      document.getElementById('db-gdrive-login').addEventListener('click', function() {
        GDrive.getToken(true).then(function() {
          gdriveState.authenticated = true;
          renderGDriveAuth();
          renderGDriveActions();
          refreshGDriveFiles();
          showToast('Google Drive baglantisi kuruldu', 'success');
        }).catch(function(err) {
          showToast('Baglanti hatasi: ' + err.message, 'error');
        });
      });
    }
  }

  function renderGDriveActions() {
    var el = document.getElementById('db-gdrive-actions');
    if (!el) return;

    var meta = Topology.PROJECT.meta;
    var defaultName = 'FiberPlan_' + (meta.name || '').replace(/[^a-zA-Z0-9_-]/g, '_') + '_' + meta.date + '.json';

    el.innerHTML = '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
      '<input type="text" id="db-gdrive-filename" value="' + defaultName + '" style="flex:1;min-width:200px;padding:6px 10px;background:var(--fp-surface2);border:1px solid var(--fp-border);border-radius:4px;color:var(--fp-text);font-family:\'JetBrains Mono\',monospace;font-size:.82rem">' +
      '<button class="fp-btn fp-btn-ada" id="db-gdrive-save">Drive\'a Kaydet</button>' +
      '</div>' +
      (gdriveState.fileId ? '<div style="color:var(--fp-text-muted);font-size:.72rem;margin-top:6px">Son kayit: ' + (gdriveState.fileName || gdriveState.fileId) + '</div>' : '');

    document.getElementById('db-gdrive-save').addEventListener('click', function() {
      var name = document.getElementById('db-gdrive-filename').value.trim();
      if (!name) name = defaultName;
      if (!name.endsWith('.json')) name += '.json';

      var btn = this;
      btn.disabled = true;
      btn.textContent = 'Kaydediliyor...';

      var data = Topology.getState();
      GDrive.saveProject(data, gdriveState.fileId, name).then(function(file) {
        gdriveState.fileId = file.id;
        gdriveState.fileName = file.name;
        btn.disabled = false;
        btn.textContent = 'Drive\'a Kaydet';
        renderGDriveActions();
        refreshGDriveFiles();
        showToast('Proje kaydedildi: ' + file.name, 'success');
      }).catch(function(err) {
        btn.disabled = false;
        btn.textContent = 'Drive\'a Kaydet';
        showToast('Kayit hatasi: ' + err.message, 'error');
      });
    });
  }

  function refreshGDriveFiles() {
    var el = document.getElementById('db-gdrive-files');
    if (!el) return;

    el.innerHTML = '<div style="text-align:center;color:var(--fp-text-dim);padding:12px">Yukleniyor...</div>';

    GDrive.listProjects().then(function(files) {
      if (files.length === 0) {
        el.innerHTML = '<div style="text-align:center;color:var(--fp-text-muted);font-size:.82rem;padding:20px">Henuz kayitli proje yok</div>';
        return;
      }

      var html = '<table class="fp-table"><thead><tr><th>Dosya</th><th>Tarih</th><th></th></tr></thead><tbody>';
      for (var i = 0; i < files.length; i++) {
        var f = files[i];
        var date = f.modifiedTime ? new Date(f.modifiedTime).toLocaleString('tr-TR') : '-';
        html += '<tr>';
        html += '<td><b>' + f.name + '</b></td>';
        html += '<td style="font-size:.72rem;color:var(--fp-text-dim)">' + date + '</td>';
        html += '<td style="white-space:nowrap">';
        html += '<button class="fp-btn fp-btn-sm db-gdrive-load" data-id="' + f.id + '" data-name="' + f.name + '" style="margin-right:4px">Yukle</button>';
        html += '<button class="fp-btn fp-btn-sm db-gdrive-ver" data-id="' + f.id + '" style="margin-right:4px">Surumler</button>';
        html += '<button class="fp-btn fp-btn-sm db-gdrive-del" data-id="' + f.id + '" data-name="' + f.name + '" style="color:var(--fp-danger);border-color:var(--fp-danger)">Sil</button>';
        html += '</td></tr>';
      }
      html += '</tbody></table>';
      el.innerHTML = html;

      // Bind load buttons
      var loadBtns = el.querySelectorAll('.db-gdrive-load');
      for (var li = 0; li < loadBtns.length; li++) {
        loadBtns[li].addEventListener('click', function() {
          var fId = this.dataset.id;
          var fName = this.dataset.name;
          if (!confirm(fName + ' yuklensin mi? Mevcut proje degistirilecek.')) return;

          GDrive.loadProject(fId).then(function(data) {
            if (data && data.adas) {
              Topology.loadState(data);
              Topology.recalculateAll();
              gdriveState.fileId = fId;
              gdriveState.fileName = fName;
              render();
              navigateTo('overview');
              showToast('Proje yuklendi: ' + fName, 'success');
              Storage.autoSave();
            } else {
              showToast('Gecersiz proje dosyasi', 'error');
            }
          }).catch(function(err) {
            showToast('Yukleme hatasi: ' + err.message, 'error');
          });
        });
      }

      // Bind version buttons
      var verBtns = el.querySelectorAll('.db-gdrive-ver');
      for (var vi = 0; vi < verBtns.length; vi++) {
        verBtns[vi].addEventListener('click', function() {
          showVersions(this.dataset.id);
        });
      }

      // Bind delete buttons
      var delBtns = el.querySelectorAll('.db-gdrive-del');
      for (var di = 0; di < delBtns.length; di++) {
        delBtns[di].addEventListener('click', function() {
          var dId = this.dataset.id;
          var dName = this.dataset.name;
          if (!confirm(dName + ' silinsin mi?')) return;

          GDrive.deleteProject(dId).then(function() {
            if (gdriveState.fileId === dId) {
              gdriveState.fileId = null;
              gdriveState.fileName = null;
            }
            refreshGDriveFiles();
            showToast(dName + ' silindi', 'success');
          }).catch(function(err) {
            showToast('Silme hatasi: ' + err.message, 'error');
          });
        });
      }
    }).catch(function(err) {
      el.innerHTML = '<div style="color:var(--fp-danger);padding:12px">Listeleme hatasi: ' + err.message + '</div>';
    });
  }

  function showVersions(fileId) {
    GDrive.listRevisions(fileId).then(function(result) {
      var revisions = result.revisions || [];
      if (revisions.length === 0) {
        showToast('Surum gecmisi bulunamadi', 'info');
        return;
      }

      var html = '<table class="fp-table"><thead><tr><th>Surum</th><th>Tarih</th><th></th></tr></thead><tbody>';
      for (var i = 0; i < revisions.length; i++) {
        var rev = revisions[i];
        var date = rev.modifiedTime ? new Date(rev.modifiedTime).toLocaleString('tr-TR') : '-';
        html += '<tr><td>v' + (i + 1) + '</td><td>' + date + '</td>';
        html += '<td><button class="fp-btn fp-btn-sm db-gdrive-rev-load" data-fid="' + fileId + '" data-rid="' + rev.id + '">Yukle</button></td></tr>';
      }
      html += '</tbody></table>';

      var filesEl = document.getElementById('db-gdrive-files');
      if (filesEl) {
        filesEl.innerHTML = '<div style="margin-bottom:12px"><button class="fp-btn fp-btn-sm" id="db-gdrive-back-list">&#8592; Listeye Don</button></div>' + html;

        document.getElementById('db-gdrive-back-list').addEventListener('click', function() {
          refreshGDriveFiles();
        });

        var revLoadBtns = filesEl.querySelectorAll('.db-gdrive-rev-load');
        for (var ri = 0; ri < revLoadBtns.length; ri++) {
          revLoadBtns[ri].addEventListener('click', function() {
            var fId = this.dataset.fid;
            var rId = this.dataset.rid;
            GDrive.loadRevision(fId, rId).then(function(data) {
              if (data && data.adas) {
                Topology.loadState(data);
                Topology.recalculateAll();
                render();
                navigateTo('overview');
                showToast('Surum yuklendi', 'success');
                Storage.autoSave();
              } else {
                showToast('Gecersiz surum verisi', 'error');
              }
            }).catch(function(err) {
              showToast('Surum yukleme hatasi: ' + err.message, 'error');
            });
          });
        }
      }
    }).catch(function(err) {
      showToast('Surum listesi alinamadi: ' + err.message, 'error');
    });
  }

  function downloadFile(content, filename, type) {
    var blob = new Blob([content], { type: type });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ─── RADAR CHART (SVG) ────────────────────────────────────────

  function renderRadarChart(el, reviewData) {
    if (!reviewData || !reviewData.categories || reviewData.categories.length === 0) return;

    var cats = reviewData.categories;
    var n = cats.length;
    var cx = 120, cy = 120, maxR = 90;
    var svg = '<svg width="240" height="240" viewBox="0 0 240 240">';

    // Background rings
    for (var ring = 1; ring <= 4; ring++) {
      var r = maxR * ring / 4;
      var pts = [];
      for (var j = 0; j < n; j++) {
        var angle = (j * 360 / n - 90) * Math.PI / 180;
        pts.push(Math.round(cx + r * Math.cos(angle)) + ',' + Math.round(cy + r * Math.sin(angle)));
      }
      svg += '<polygon points="' + pts.join(' ') + '" fill="none" stroke="var(--fp-border)" stroke-width="0.5"/>';
    }

    // Axes
    for (var k = 0; k < n; k++) {
      var axAngle = (k * 360 / n - 90) * Math.PI / 180;
      var ex = Math.round(cx + maxR * Math.cos(axAngle));
      var ey = Math.round(cy + maxR * Math.sin(axAngle));
      svg += '<line x1="' + cx + '" y1="' + cy + '" x2="' + ex + '" y2="' + ey + '" stroke="var(--fp-border)" stroke-width="0.5"/>';

      // Labels
      var lx = Math.round(cx + (maxR + 18) * Math.cos(axAngle));
      var ly = Math.round(cy + (maxR + 18) * Math.sin(axAngle));
      var anchor = lx < cx - 10 ? 'end' : lx > cx + 10 ? 'start' : 'middle';
      svg += '<text x="' + lx + '" y="' + (ly + 3) + '" text-anchor="' + anchor + '" font-size="8" fill="var(--fp-text-dim)">' + cats[k].icon + '</text>';
    }

    // Data polygon
    var dataPts = [];
    for (var m = 0; m < n; m++) {
      var score = cats[m].score / 100;
      var dAngle = (m * 360 / n - 90) * Math.PI / 180;
      dataPts.push(Math.round(cx + maxR * score * Math.cos(dAngle)) + ',' + Math.round(cy + maxR * score * Math.sin(dAngle)));
    }
    svg += '<polygon points="' + dataPts.join(' ') + '" fill="rgba(250,204,21,0.15)" stroke="var(--fp-accent)" stroke-width="2"/>';

    // Score dots
    for (var p = 0; p < n; p++) {
      var sc = cats[p].score / 100;
      var sAngle = (p * 360 / n - 90) * Math.PI / 180;
      var sx = Math.round(cx + maxR * sc * Math.cos(sAngle));
      var sy = Math.round(cy + maxR * sc * Math.sin(sAngle));
      svg += '<circle cx="' + sx + '" cy="' + sy + '" r="3" fill="var(--fp-accent)"/>';
    }

    svg += '</svg>';
    el.innerHTML = svg;
  }

  // ─── TOPOLOGY SVG DIAGRAM (Tree layout - MST hierarchy) ───

  /**
   * Compute tree layout: OLT at top, MST children branch downward
   * Each subtree is sized by its leaf count for balanced spacing
   */
  function computeHorizontalLayout(ada) {
    var blds = ada.buildings;
    var oltB = blds.find(function(b) { return b.id === ada.topology.oltBuildingId; });
    if (!oltB) return { nodes: [], cables: [] };

    var savedPos = ada.topology.svgPositions || {};
    var manDist = ada.topology.manualDistances || {};
    var nodeW = 100, nodeH = 50;
    var gapX = 120, gapY = 100;

    // Use stored two-level MST edges, fallback to simple MST
    var mstEdges = ada.topology.mstEdges || PonEngine.buildMST(blds, oltB.id);
    var childrenMap = {};
    for (var e = 0; e < mstEdges.length; e++) {
      var edge = mstEdges[e];
      if (!childrenMap[edge.from]) childrenMap[edge.from] = [];
      childrenMap[edge.from].push(edge.to);
    }

    // Leaf count cache for subtree width
    var leafCache = {};
    function leafCount(nodeId) {
      if (leafCache[nodeId] !== undefined) return leafCache[nodeId];
      var ch = childrenMap[nodeId] || [];
      if (ch.length === 0) { leafCache[nodeId] = 1; return 1; }
      var total = 0;
      for (var i = 0; i < ch.length; i++) total += leafCount(ch[i]);
      leafCache[nodeId] = total;
      return total;
    }

    var nodes = [];
    var nodeMap = {};
    var branchMap = {};  // nodeId → which OLT-child branch index

    // Recursive: position children first, then center parent above them
    function positionSubtree(nodeId, leftX, depth, branchIdx) {
      var b = blds.find(function(x) { return x.id === nodeId; });
      if (!b) return leftX;

      var ch = childrenMap[nodeId] || [];
      var myLeaves = leafCount(nodeId);
      var x, y = 80 + depth * gapY;

      if (ch.length === 0) {
        // Leaf node: place at center of its slot
        x = leftX + gapX / 2;
      } else {
        // Position children first
        var childLeft = leftX;
        for (var i = 0; i < ch.length; i++) {
          childLeft = positionSubtree(ch[i], childLeft, depth + 1, branchIdx);
        }
        // Center this node above its children
        x = (nodeMap[ch[0]].x + nodeMap[ch[ch.length - 1]].x) / 2;
      }

      var pos = savedPos[b.id] || { x: x, y: y };
      branchMap[b.id] = branchIdx;
      var isOLT = b.id === oltB.id;
      var arm = isOLT ? 'olt' : (branchIdx % 2 === 0 ? 'left' : 'right');
      var node = { b: b, x: pos.x, y: pos.y, isOLT: isOLT, arm: arm };
      nodes.push(node);
      nodeMap[b.id] = node;

      return leftX + myLeaves * gapX;
    }

    // Position entire tree starting from OLT children
    var oltChildren = childrenMap[oltB.id] || [];
    var totalLeaves = leafCount(oltB.id);
    var totalWidth = totalLeaves * gapX;
    var startX = 700 - totalWidth / 2;  // Center tree around x=700

    if (oltChildren.length === 0) {
      // Single building (OLT only)
      var oltPos = savedPos[oltB.id] || { x: 700, y: 80 };
      nodes.push({ b: oltB, x: oltPos.x, y: oltPos.y, isOLT: true, arm: 'olt' });
      nodeMap[oltB.id] = nodes[0];
    } else {
      // Position children subtrees first
      var childLeft = startX;
      for (var ci = 0; ci < oltChildren.length; ci++) {
        childLeft = positionSubtree(oltChildren[ci], childLeft, 1, ci);
      }
      // OLT centered above all children
      var firstChild = nodeMap[oltChildren[0]];
      var lastChild = nodeMap[oltChildren[oltChildren.length - 1]];
      var oltX = (firstChild.x + lastChild.x) / 2;
      var oltPos2 = savedPos[oltB.id] || { x: oltX, y: 80 };
      var oltNode = { b: oltB, x: oltPos2.x, y: oltPos2.y, isOLT: true, arm: 'olt' };
      nodes.unshift(oltNode);
      nodeMap[oltB.id] = oltNode;
    }

    // Build cable segments from MST edges
    var cables = [];
    for (var ei = 0; ei < mstEdges.length; ei++) {
      var me = mstEdges[ei];
      var fromNode = nodeMap[me.from];
      var toNode = nodeMap[me.to];
      if (!fromNode || !toNode) continue;
      var fromB = blds.find(function(x) { return x.id === me.from; });
      var toB = blds.find(function(x) { return x.id === me.to; });
      var dist = fromB && toB ? Math.round(PonEngine.getDistance(fromB, toB, manDist)) : me.distance;
      var cableData = (ada.calculations.cables || []).find(function(c) {
        return c.from === me.from && c.to === me.to;
      });
      var cores = cableData ? cableData.cores : (me.from === oltB.id ? 24 : 12);
      cables.push({
        from: fromNode, to: toNode, distance: dist, cores: cores,
        fromId: me.from, toId: me.to, arm: toNode.arm, type: 'distribution'
      });
    }

    // Ring closure
    if (ada.topology.ringCable) {
      var rf = nodeMap[ada.topology.ringCable.from];
      var rt = nodeMap[ada.topology.ringCable.to];
      if (rf && rt) {
        var rfB = blds.find(function(x) { return x.id === ada.topology.ringCable.from; });
        var rtB = blds.find(function(x) { return x.id === ada.topology.ringCable.to; });
        var ringDist = rfB && rtB ? Math.round(PonEngine.getDistance(rfB, rtB, manDist)) : 0;
        cables.push({
          from: rf, to: rt, distance: ringDist, cores: 4,
          fromId: ada.topology.ringCable.from, toId: ada.topology.ringCable.to,
          arm: 'ring', type: 'ring'
        });
      }
    }

    return { nodes: nodes, cables: cables, nodeW: nodeW, nodeH: nodeH, nodeMap: nodeMap };
  }

  /**
   * Convert GeoJSON polygon [lng,lat] coords to SVG path string
   * Fits polygon around node bounding box with equirectangular projection
   */
  function polygonToSVGPath(geoCoords, nodes) {
    if (!geoCoords || geoCoords.length < 3 || !nodes || nodes.length === 0) return null;

    // Compute geo centroid
    var sumLng = 0, sumLat = 0;
    for (var i = 0; i < geoCoords.length; i++) {
      sumLng += geoCoords[i][0];
      sumLat += geoCoords[i][1];
    }
    var cLng = sumLng / geoCoords.length;
    var cLat = sumLat / geoCoords.length;

    // Compute geo extents (relative to centroid)
    var cosLat = Math.cos(cLat * Math.PI / 180);
    var geoXMin = Infinity, geoXMax = -Infinity, geoYMin = Infinity, geoYMax = -Infinity;
    for (var g = 0; g < geoCoords.length; g++) {
      var gx = (geoCoords[g][0] - cLng) * cosLat;
      var gy = geoCoords[g][1] - cLat;
      if (gx < geoXMin) geoXMin = gx;
      if (gx > geoXMax) geoXMax = gx;
      if (gy < geoYMin) geoYMin = gy;
      if (gy > geoYMax) geoYMax = gy;
    }
    var geoW = geoXMax - geoXMin || 0.0001;
    var geoH = geoYMax - geoYMin || 0.0001;

    // Compute node bounding box
    var nxMin = Infinity, nxMax = -Infinity, nyMin = Infinity, nyMax = -Infinity;
    for (var n = 0; n < nodes.length; n++) {
      if (nodes[n].x < nxMin) nxMin = nodes[n].x;
      if (nodes[n].x > nxMax) nxMax = nodes[n].x;
      if (nodes[n].y < nyMin) nyMin = nodes[n].y;
      if (nodes[n].y > nyMax) nyMax = nodes[n].y;
    }
    var padding = 60;
    nxMin -= padding; nxMax += padding;
    nyMin -= padding; nyMax += padding;
    var svgW = nxMax - nxMin || 200;
    var svgH = nyMax - nyMin || 200;
    var svgCx = (nxMin + nxMax) / 2;
    var svgCy = (nyMin + nyMax) / 2;

    // Scale: map geo extents to SVG bounding box
    var scaleX = svgW / geoW;
    var scaleY = svgH / geoH;
    var scale = Math.min(scaleX, scaleY);

    // Build SVG path
    var d = '';
    for (var p = 0; p < geoCoords.length; p++) {
      var px = svgCx + ((geoCoords[p][0] - cLng) * cosLat - (geoXMin + geoW / 2)) * scale;
      var py = svgCy - ((geoCoords[p][1] - cLat) - (geoYMin + geoH / 2)) * scale; // Y inverted
      d += (p === 0 ? 'M ' : ' L ') + Math.round(px) + ' ' + Math.round(py);
    }
    d += ' Z';
    return d;
  }

  // ─── GEO-POSITIONED TOPOLOGY VIEW ───────────────────────────
  // Shows buildings at their real geographic positions with optional
  // NVI map screenshot as background. Cables follow MST edges.

  function renderGeoTopology(el, ada) {
    var blds = ada.buildings;
    if (blds.length === 0) { el.innerHTML = '<div class="db-empty-desc">Bu adada bina yok</div>'; return; }

    var oltB = blds.find(function(b) { return b.id === ada.topology.oltBuildingId; });
    if (!oltB) { el.innerHTML = '<div class="db-empty-desc">OLT atanmamis</div>'; return; }

    // Collect buildings with valid coordinates
    var geoBlds = blds.filter(function(b) { return b.lat && b.lng; });
    if (geoBlds.length === 0) {
      el.innerHTML = '<div class="db-empty-desc">Binalarin koordinatlari yok.<br>NVI portalda Dogrula butonuna tiklayarak koordinat alin.</div>';
      return;
    }

    // Determine bounds from buildings or snapshot
    var snap = ada.mapSnapshot;
    var bounds;
    if (snap && snap.bounds) {
      bounds = snap.bounds;
    } else {
      // Auto-compute from building coords with padding
      var lats = geoBlds.map(function(b) { return b.lat; });
      var lngs = geoBlds.map(function(b) { return b.lng; });
      var latPad = (Math.max.apply(null, lats) - Math.min.apply(null, lats)) * 0.15 || 0.001;
      var lngPad = (Math.max.apply(null, lngs) - Math.min.apply(null, lngs)) * 0.15 || 0.001;
      bounds = {
        north: Math.max.apply(null, lats) + latPad,
        south: Math.min.apply(null, lats) - latPad,
        east: Math.max.apply(null, lngs) + lngPad,
        west: Math.min.apply(null, lngs) - lngPad
      };
    }

    // SVG dimensions
    var svgW = 1400, svgH = 800;
    var padding = 80;

    // Geo → SVG coordinate mapping
    var latRange = bounds.north - bounds.south;
    var lngRange = bounds.east - bounds.west;
    var cosLat = Math.cos((bounds.north + bounds.south) / 2 * Math.PI / 180);

    function geoToSvg(lat, lng) {
      var x = padding + ((lng - bounds.west) / lngRange) * (svgW - padding * 2);
      var y = padding + ((bounds.north - lat) / latRange) * (svgH - padding * 2);
      return { x: x, y: y };
    }

    var nW = 90, nH = 40;

    var vb = topoState.viewBox;
    vb.w = svgW;
    vb.h = svgH;
    var svg = '<svg class="db-topo-svg" viewBox="' + vb.x + ' ' + vb.y + ' ' + vb.w + ' ' + vb.h + '" id="db-topo-svg">';

    // Defs
    svg += '<defs>';
    svg += '<filter id="glow-olt-geo" x="-50%" y="-50%" width="200%" height="200%">';
    svg += '<feGaussianBlur stdDeviation="3" result="blur"/>';
    svg += '<feComposite in="SourceGraphic" in2="blur" operator="over"/>';
    svg += '</filter>';
    svg += '</defs>';

    // Background: screenshot or dark grid
    if (snap && snap.screenshot) {
      svg += '<image href="' + snap.screenshot + '" x="0" y="0" width="' + svgW + '" height="' + svgH + '" preserveAspectRatio="xMidYMid slice" opacity="0.4"/>';
      // Dark overlay for readability
      svg += '<rect x="0" y="0" width="' + svgW + '" height="' + svgH + '" fill="rgba(15,23,42,0.55)"/>';
    } else {
      svg += '<rect x="0" y="0" width="' + svgW + '" height="' + svgH + '" fill="rgba(15,23,42,0.9)"/>';
      // Grid
      svg += '<defs><pattern id="geo-grid" width="50" height="50" patternUnits="userSpaceOnUse">';
      svg += '<path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(30,41,59,0.3)" stroke-width="0.5"/>';
      svg += '</pattern></defs>';
      svg += '<rect x="0" y="0" width="' + svgW + '" height="' + svgH + '" fill="url(#geo-grid)"/>';
    }

    // Build node positions from geo coordinates
    var nodeMap = {};
    for (var ni = 0; ni < blds.length; ni++) {
      var b = blds[ni];
      var pos;
      if (b.lat && b.lng) {
        pos = geoToSvg(b.lat, b.lng);
      } else {
        // Buildings without coords: place near OLT with offset
        var oltPos = geoToSvg(oltB.lat || bounds.south, oltB.lng || bounds.west);
        pos = { x: oltPos.x + (ni * 30) % 200, y: oltPos.y + Math.floor(ni / 6) * 30 };
      }
      nodeMap[b.id] = { x: pos.x, y: pos.y, b: b };
    }

    // ── Cables layer (MST edges) ──
    var mstEdges = ada.topology.mstEdges || [];
    svg += '<g class="topo-cables">';
    for (var ci = 0; ci < mstEdges.length; ci++) {
      var edge = mstEdges[ci];
      var fromNode = nodeMap[edge.from];
      var toNode = nodeMap[edge.to];
      if (!fromNode || !toNode) continue;

      var x1 = fromNode.x, y1 = fromNode.y;
      var x2 = toNode.x, y2 = toNode.y;

      // Determine cable type: feeder (OLT→FDH) vs distribution
      var isFromFDH = ada.topology.fdhNodes && ada.topology.fdhNodes.some(function(f) { return f.buildingId === edge.from; });
      var isToFDH = ada.topology.fdhNodes && ada.topology.fdhNodes.some(function(f) { return f.buildingId === edge.to; });
      var isFeeder = (edge.from === ada.topology.oltBuildingId) || isFromFDH || isToFDH;
      var cableColor = isFeeder ? '#a855f7' : '#3b82f6';
      var cableWidth = isFeeder ? 2.5 : 1.8;

      svg += '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + cableColor + '" stroke-width="' + cableWidth + '" opacity="0.7"/>';
      // Hit area
      svg += '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" class="topo-cable-hit" data-from="' + edge.from + '" data-to="' + edge.to + '" data-dist="' + (edge.distance || 0) + '" data-cores="' + (edge.cores || 0) + '"/>';
      // Distance label at midpoint
      if (edge.distance) {
        var mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        svg += '<text x="' + mx + '" y="' + (my - 4) + '" text-anchor="middle" font-size="8" fill="#94a3b8" style="paint-order:stroke" stroke="rgba(15,23,42,0.8)" stroke-width="3">' + edge.distance + 'm</text>';
      }
    }
    svg += '</g>';

    // ── Nodes layer (compact mini cards) ──
    svg += '<g class="topo-nodes">';
    for (var bi = 0; bi < blds.length; bi++) {
      var b2 = blds[bi];
      var nd = nodeMap[b2.id];
      if (!nd) continue;
      var nx = nd.x - nW / 2, ny = nd.y - nH / 2;
      var isOLT = b2.id === ada.topology.oltBuildingId;
      var isFDH = ada.topology.fdhNodes && ada.topology.fdhNodes.some(function(f) { return f.buildingId === b2.id; });

      var borderColor = isOLT ? '#a78bfa' : isFDH ? '#3b82f6' : '#475569';
      var bgColor = isOLT ? 'rgba(139,92,246,0.15)' : isFDH ? 'rgba(59,130,246,0.12)' : 'rgba(15,23,42,0.85)';

      var nodeCls = 'topo-bldg' + (isOLT ? ' is-olt' : '') + (isFDH ? ' is-fdh' : '');
      svg += '<g class="' + nodeCls + '" data-id="' + b2.id + '" transform="translate(0,0)">';

      if (isOLT) {
        svg += '<circle cx="' + nd.x + '" cy="' + nd.y + '" r="30" fill="none" stroke="rgba(139,92,246,0.1)" stroke-width="10" filter="url(#glow-olt-geo)"/>';
      }

      svg += '<rect x="' + nx + '" y="' + ny + '" width="' + nW + '" height="' + nH + '" rx="5" fill="' + bgColor + '" stroke="' + borderColor + '" stroke-width="1"/>';

      // Row 1: Badge + truncated name
      var row1Y = ny + 12;
      if (isOLT) {
        svg += '<rect x="' + (nx + 3) + '" y="' + (row1Y - 7) + '" width="18" height="10" rx="2" fill="rgba(139,92,246,0.3)" stroke="#a78bfa" stroke-width="0.3"/>';
        svg += '<text x="' + (nx + 12) + '" y="' + (row1Y + 1) + '" text-anchor="middle" font-size="5.5" font-weight="700" fill="#a78bfa">OLT</text>';
      } else if (isFDH) {
        svg += '<rect x="' + (nx + 3) + '" y="' + (row1Y - 7) + '" width="18" height="10" rx="2" fill="rgba(59,130,246,0.25)" stroke="#3b82f6" stroke-width="0.3"/>';
        svg += '<text x="' + (nx + 12) + '" y="' + (row1Y + 1) + '" text-anchor="middle" font-size="5.5" font-weight="700" fill="#93c5fd">FDH</text>';
      }
      var nameX2 = (isOLT || isFDH) ? nx + 24 : nx + 4;
      var maxChars2 = Math.floor((nW - (nameX2 - nx) - 3) / 4);
      svg += '<text x="' + nameX2 + '" y="' + row1Y + '" font-size="6.5" font-weight="700" fill="#e2e8f0">' + b2.name.substring(0, maxChars2) + '</text>';

      // Row 2: EffBB/BB
      var effBB = PonEngine.getEffectiveBB(b2, ada);
      svg += '<text x="' + nd.x + '" y="' + (ny + 28) + '" text-anchor="middle" font-size="11" font-weight="700" fill="' + (isOLT ? '#a78bfa' : '#f8fafc') + '">' + effBB + '/' + b2.bb + '</text>';

      // Row 3: Splitter
      var splData2 = (ada.calculations.splitters || []).find(function(s) { return s.buildingId === b2.id; });
      var cascStr2 = '';
      if (splData2 && splData2.cascade && splData2.cascade.level1) {
        cascStr2 = isFDH ? '1:' + splData2.cascade.level1.ratio + '+1:' + splData2.cascade.level2.ratio : '1:' + splData2.cascade.level2.ratio;
      } else if (splData2 && splData2.cascade && splData2.cascade.level2) {
        cascStr2 = '1:' + splData2.cascade.level2.ratio;
      }
      if (cascStr2) {
        svg += '<text x="' + nd.x + '" y="' + (ny + nH - 3) + '" text-anchor="middle" font-size="5.5" font-weight="600" fill="#67e8f9">' + cascStr2 + '</text>';
      }

      svg += '</g>';
    }
    svg += '</g>';

    // ── Compass + Scale ──
    svg += '<text x="' + (svgW - 30) + '" y="30" text-anchor="middle" font-size="14" fill="#64748b">N</text>';
    svg += '<text x="' + (svgW - 30) + '" y="42" text-anchor="middle" font-size="10" fill="#64748b">\u2191</text>';

    // Legend
    svg += '<g transform="translate(10,' + (svgH - 30) + ')">';
    svg += '<rect x="0" y="0" width="240" height="24" rx="4" fill="rgba(15,23,42,0.9)" stroke="rgba(51,65,85,0.5)" stroke-width="0.5"/>';
    svg += '<line x1="8" y1="12" x2="28" y2="12" stroke="#a855f7" stroke-width="2.5"/>';
    svg += '<text x="32" y="15" font-size="7" fill="#94a3b8">Feeder</text>';
    svg += '<line x1="68" y1="12" x2="88" y2="12" stroke="#3b82f6" stroke-width="1.8"/>';
    svg += '<text x="92" y="15" font-size="7" fill="#94a3b8">Dagitim</text>';
    svg += '<text x="140" y="15" font-size="7" fill="#64748b">Harita gorunumu · Surukle: kaydır · Scroll: zoom</text>';
    svg += '</g>';

    svg += '</svg>';
    el.innerHTML = svg;
  }

  function renderTopologySVG(el, ada) {
    var blds = ada.buildings;
    if (blds.length === 0) { el.innerHTML = '<div class="db-empty-desc">Bu adada bina yok</div>'; return; }

    var oltB = blds.find(function(b) { return b.id === ada.topology.oltBuildingId; });
    if (!oltB) { el.innerHTML = '<div class="db-empty-desc">OLT atanmamis</div>'; return; }

    var layout = computeHorizontalLayout(ada);
    var nodes = layout.nodes;
    var cables = layout.cables;
    var nW = layout.nodeW, nH = layout.nodeH;

    var vb = topoState.viewBox;
    var svg = '<svg class="db-topo-svg" viewBox="' + vb.x + ' ' + vb.y + ' ' + vb.w + ' ' + vb.h + '" id="db-topo-svg">';

    // Defs
    svg += '<defs>';
    svg += '<pattern id="topo-grid" width="40" height="40" patternUnits="userSpaceOnUse">';
    svg += '<path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(30,41,59,0.4)" stroke-width="0.5"/>';
    svg += '</pattern>';
    svg += '<linearGradient id="grad-left" x1="1" y1="0" x2="0" y2="0">';
    svg += '<stop offset="0%" stop-color="#a855f7"/><stop offset="100%" stop-color="#3b82f6"/>';
    svg += '</linearGradient>';
    svg += '<linearGradient id="grad-right" x1="0" y1="0" x2="1" y2="0">';
    svg += '<stop offset="0%" stop-color="#f97316"/><stop offset="100%" stop-color="#ef4444"/>';
    svg += '</linearGradient>';
    svg += '<filter id="glow-olt" x="-50%" y="-50%" width="200%" height="200%">';
    svg += '<feGaussianBlur stdDeviation="4" result="blur"/>';
    svg += '<feComposite in="SourceGraphic" in2="blur" operator="over"/>';
    svg += '</filter>';
    svg += '</defs>';

    // Background grid
    svg += '<rect x="' + (vb.x - 100) + '" y="' + (vb.y - 100) + '" width="' + (vb.w + 200) + '" height="' + (vb.h + 200) + '" fill="url(#topo-grid)"/>';

    // ── Ada Boundary Polygon Background ──
    if (ada.boundary && ada.boundary.coordinates && ada.boundary.coordinates[0] && nodes.length > 0) {
      var svgPath = polygonToSVGPath(ada.boundary.coordinates[0], nodes);
      if (svgPath) {
        svg += '<path d="' + svgPath + '" fill="rgba(250,204,21,0.04)" stroke="#facc15" stroke-width="1.5" stroke-dasharray="8 5" opacity="0.6"/>';
        // Ada name label at top of polygon
        var labelX = nodes[0].x, labelY = nodes[0].y - 80;
        svg += '<text x="' + labelX + '" y="' + labelY + '" text-anchor="middle" font-size="11" fill="#facc15" opacity="0.5">' + ada.name + ' siniri</text>';
      }
    }

    // ── Cables layer ──
    svg += '<g class="topo-cables">';
    for (var ci = 0; ci < cables.length; ci++) {
      var cab = cables[ci];
      var x1 = cab.from.x, y1 = cab.from.y;
      var x2 = cab.to.x, y2 = cab.to.y;

      if (cab.type === 'ring') {
        // Ring closure: curved path below
        var midX = (x1 + x2) / 2;
        var belowY = Math.max(y1, y2) + 180;
        svg += '<path d="M ' + x1 + ' ' + (y1 + nH / 2) + ' Q ' + x1 + ' ' + belowY + ', ' + midX + ' ' + belowY + ' Q ' + x2 + ' ' + belowY + ', ' + x2 + ' ' + (y2 + nH / 2) + '"' +
          ' class="topo-cable ring" data-from="' + cab.fromId + '" data-to="' + cab.toId + '"/>';
        // Hit area
        svg += '<path d="M ' + x1 + ' ' + (y1 + nH / 2) + ' Q ' + x1 + ' ' + belowY + ', ' + midX + ' ' + belowY + ' Q ' + x2 + ' ' + belowY + ', ' + x2 + ' ' + (y2 + nH / 2) + '"' +
          ' class="topo-cable-hit" data-from="' + cab.fromId + '" data-to="' + cab.toId + '" data-dist="' + cab.distance + '" data-cores="' + cab.cores + '"/>';
        // Ring label
        svg += '<text x="' + midX + '" y="' + (belowY + 16) + '" text-anchor="middle" font-size="10" fill="#86efac">RING KAPAMA · ' + cab.cores + ' kor' + (cab.distance ? ' · ' + cab.distance + 'm' : '') + '</text>';
      } else {
        // Distribution cable: smooth curve from parent to child
        var armClass = cab.arm === 'left' ? 'arm-left' : 'arm-right';
        var ctrlY = y1 + (y2 - y1) * 0.5;
        var cablePath = 'M ' + x1 + ' ' + (y1 + nH / 2) + ' C ' + x1 + ' ' + ctrlY + ', ' + x2 + ' ' + ctrlY + ', ' + x2 + ' ' + (y2 - nH / 2);
        svg += '<path d="' + cablePath + '" fill="none" class="topo-cable ' + armClass + '" data-from="' + cab.fromId + '" data-to="' + cab.toId + '"/>';
        // Hit area
        svg += '<path d="' + cablePath + '" fill="none" class="topo-cable-hit" data-from="' + cab.fromId + '" data-to="' + cab.toId + '" data-dist="' + cab.distance + '" data-cores="' + cab.cores + '"/>';
        // Cable label (cores + distance) - offset to the side
        var mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        var lblColor = cab.arm === 'left' ? '#c084fc' : '#fdba74';
        var lblOffX = x1 === x2 ? 30 : 0;
        svg += '<text x="' + (mx + lblOffX) + '" y="' + (my - 6) + '" text-anchor="middle" font-size="9" font-weight="600" fill="' + lblColor + '">' + cab.cores + 'F</text>';
        if (cab.distance) {
          svg += '<text x="' + (mx + lblOffX) + '" y="' + (my + 6) + '" text-anchor="middle" font-size="8" fill="#94a3b8">' + cab.distance + 'm</text>';
        }
        // Down arrow
        svg += '<text x="' + (mx + lblOffX) + '" y="' + (my + 20) + '" text-anchor="middle" font-size="11" fill="' + lblColor + '" opacity="0.5">\u2193</text>';
      }
    }
    svg += '</g>';

    // ── PTP Links layer ──
    var ptpLinks = ada.topology.ptpLinks || [];
    if (ptpLinks.length > 0 && layout.nodeMap) {
      svg += '<g class="topo-ptp">';
      for (var pi = 0; pi < ptpLinks.length; pi++) {
        var ptp = ptpLinks[pi];
        var pFrom = layout.nodeMap[ptp.fromBuildingId];
        var pTo = layout.nodeMap[ptp.toBuildingId];
        if (!pFrom || !pTo) continue;
        var pmx = (pFrom.x + pTo.x) / 2;
        var pmy = Math.min(pFrom.y, pTo.y) - 100;
        svg += '<path d="M ' + pFrom.x + ' ' + (pFrom.y - nH / 2) + ' Q ' + pmx + ' ' + pmy + ', ' + pTo.x + ' ' + (pTo.y - nH / 2) + '"' +
          ' fill="none" stroke="#ef4444" stroke-width="2.5" stroke-dasharray="8 5" opacity="0.8"/>';
        // PTP label
        var plx = pmx, ply = pmy - 8;
        svg += '<text x="' + plx + '" y="' + ply + '" text-anchor="middle" font-size="8" fill="#fca5a5">' + ptp.device + ' · ' + ptp.throughputMbps + ' Mbps</text>';
        // Wireless icon
        svg += '<text x="' + plx + '" y="' + (ply - 12) + '" text-anchor="middle" font-size="12" fill="#ef4444">&#9687;</text>';
      }
      svg += '</g>';
    }

    // ── Nodes layer (compact mini building cards) ──
    svg += '<g class="topo-nodes">';
    for (var ni = 0; ni < nodes.length; ni++) {
      var nd = nodes[ni];
      var b = nd.b;
      var nx = nd.x - nW / 2, ny = nd.y - nH / 2;
      var isOLT = nd.isOLT;
      var isFDH = ada.topology.fdhNodes && ada.topology.fdhNodes.some(function(f) { return f.buildingId === b.id; });
      var splData = (ada.calculations.splitters || []).find(function(s) { return s.buildingId === b.id; });
      var nodeEffBB = PonEngine.getEffectiveBB(b, ada);
      var cascadeStr = '';
      if (splData && splData.cascade && splData.cascade.level1) {
        cascadeStr = isFDH ? '1:' + splData.cascade.level1.ratio + '+1:' + splData.cascade.level2.ratio : '1:' + splData.cascade.level2.ratio;
      } else if (splData && splData.cascade && splData.cascade.level2) {
        cascadeStr = '1:' + splData.cascade.level2.ratio;
      } else {
        var spl = PonEngine.calcSplitter(nodeEffBB);
        cascadeStr = spl.map(function(s) { return '1:' + s.ratio; }).join('+');
      }

      // Card colors
      var isCableSrc = topoState.cableMode && topoState.cableSource === b.id;
      var borderColor = isCableSrc ? '#22c55e' : isOLT ? '#a78bfa' : isFDH ? '#3b82f6' : '#334155';
      var bgColor = isCableSrc ? 'rgba(34,197,94,0.15)' : isOLT ? 'rgba(139,92,246,0.08)' : isFDH ? 'rgba(59,130,246,0.06)' : 'rgba(30,41,59,0.7)';

      var nodeCls = 'topo-bldg' + (isOLT ? ' is-olt' : '') + (isFDH ? ' is-fdh' : '');
      svg += '<g class="' + nodeCls + '" data-id="' + b.id + '" transform="translate(0,0)">';

      // OLT glow
      if (isOLT) {
        svg += '<circle cx="' + nd.x + '" cy="' + nd.y + '" r="35" fill="none" stroke="rgba(139,92,246,0.08)" stroke-width="12" filter="url(#glow-olt)"/>';
      }

      // Card background
      svg += '<rect x="' + nx + '" y="' + ny + '" width="' + nW + '" height="' + nH + '" rx="6" fill="' + bgColor + '" stroke="' + borderColor + '" stroke-width="1.2"/>';

      // Tooltip with full details
      var lossData = (ada.calculations.lossBudget || []).find(function(l) { return l.buildingId === b.id; });
      var tooltipLines = b.name;
      if (b.addr) tooltipLines += '\n' + b.addr;
      if (b.lat && b.lng) tooltipLines += '\n' + Number(b.lat).toFixed(5) + ', ' + Number(b.lng).toFixed(5);
      tooltipLines += '\n' + b.floor + ' kat' + (b.hasElectric ? ' | Elektrik var' : '');
      tooltipLines += '\nPenetrasyon: %' + (b.customPenetration ? b.penetrationRate : (ada.topology.defaultPenetrationRate || 70));
      if (lossData) tooltipLines += '\nKayip: ' + lossData.totalLoss + ' dB | Marj: ' + lossData.margin + ' dB';
      svg += '<title>' + tooltipLines + '</title>';

      // Row 1: Badge + name (7.5px, truncated)
      var row1Y = ny + 13;
      if (isOLT) {
        svg += '<rect x="' + (nx + 3) + '" y="' + (row1Y - 8) + '" width="22" height="11" rx="2" fill="rgba(139,92,246,0.3)" stroke="#a78bfa" stroke-width="0.4"/>';
        svg += '<text x="' + (nx + 14) + '" y="' + (row1Y + 1) + '" text-anchor="middle" font-size="6.5" font-weight="700" fill="#a78bfa">OLT</text>';
      } else if (isFDH) {
        svg += '<rect x="' + (nx + 3) + '" y="' + (row1Y - 8) + '" width="22" height="11" rx="2" fill="rgba(59,130,246,0.25)" stroke="#3b82f6" stroke-width="0.4"/>';
        svg += '<text x="' + (nx + 14) + '" y="' + (row1Y + 1) + '" text-anchor="middle" font-size="6.5" font-weight="700" fill="#93c5fd">FDH</text>';
      }
      var nameX = (isOLT || isFDH) ? nx + 28 : nx + 4;
      var maxChars = Math.floor((nW - (nameX - nx) - 3) / 4.5);
      svg += '<text x="' + nameX + '" y="' + row1Y + '" font-size="7.5" font-weight="700" fill="#e2e8f0">' + b.name.substring(0, maxChars) + '</text>';

      // Row 2: EffBB/RawBB (bold center)
      var row2Y = ny + 30;
      var bbColor = isOLT ? '#a78bfa' : '#f8fafc';
      svg += '<text x="' + nd.x + '" y="' + row2Y + '" text-anchor="middle" font-size="14" font-weight="700" fill="' + bbColor + '">' + nodeEffBB + '/' + b.bb + ' BB</text>';

      // Row 3: Splitter cascade (6.5px cyan)
      var row3Y = ny + nH - 5;
      if (cascadeStr) {
        svg += '<text x="' + nd.x + '" y="' + row3Y + '" text-anchor="middle" font-size="6.5" font-weight="600" fill="#67e8f9">' + cascadeStr + '</text>';
      }

      svg += '</g>';
    }
    svg += '</g>';

    // ── Legend ──
    svg += '<g class="topo-legend" transform="translate(' + (vb.x + 20) + ',' + (vb.y + vb.h - 60) + ')">';
    svg += '<rect x="0" y="0" width="320" height="50" rx="6" fill="rgba(17,24,39,0.9)" stroke="rgba(30,41,59,0.6)" stroke-width="0.5"/>';
    // OLT
    svg += '<rect x="10" y="8" width="10" height="10" rx="2" fill="rgba(139,92,246,0.3)" stroke="#a78bfa" stroke-width="1"/>';
    svg += '<text x="24" y="17" font-size="8" fill="#94a3b8">OLT</text>';
    // FDH
    svg += '<rect x="52" y="8" width="10" height="10" rx="2" fill="rgba(59,130,246,0.3)" stroke="#3b82f6" stroke-width="1"/>';
    svg += '<text x="66" y="17" font-size="8" fill="#94a3b8">FDH</text>';
    // Distribution cable
    svg += '<line x1="100" y1="13" x2="124" y2="13" stroke="#a855f7" stroke-width="2.5"/>';
    svg += '<text x="130" y="17" font-size="8" fill="#94a3b8">Dagitim</text>';
    // Ring
    svg += '<line x1="174" y1="13" x2="198" y2="13" stroke="#22c55e" stroke-width="2" stroke-dasharray="4 3"/>';
    svg += '<text x="204" y="17" font-size="8" fill="#94a3b8">Ring</text>';
    // PTP
    if (ptpLinks.length > 0) {
      svg += '<line x1="238" y1="13" x2="262" y2="13" stroke="#ef4444" stroke-width="2" stroke-dasharray="6 4"/>';
      svg += '<text x="268" y="17" font-size="8" fill="#94a3b8">PTP</text>';
    }
    // Click hint
    var hintText = topoState.cableMode
      ? 'KABLO CIZ: Kaynak bina tikla → Hedef bina tikla | Kabloya tikla: sil | ESC: iptal'
      : 'Kabloya tikla: mesafe gir | Node surukle: pozisyon degistir | Scroll: zoom';
    svg += '<text x="12" y="42" font-size="7" fill="' + (topoState.cableMode ? '#22c55e' : '#64748b') + '">' + hintText + '</text>';
    svg += '</g>';

    svg += '</svg>';
    el.innerHTML = svg;
  }

  // ─── TOPOLOGY INTERACTIONS ─────────────────────────────────────

  function bindTopoInteractions(ada) {
    var viewport = document.getElementById('db-topo-viewport');
    var svgEl = document.getElementById('db-topo-svg');
    if (!viewport || !svgEl) return;

    // Cable mode: crosshair cursor + ESC key handler
    if (topoState.cableMode) {
      viewport.style.cursor = 'crosshair';
      var escHandler = function(e) {
        if (e.key === 'Escape' && topoState.cableMode) {
          topoState.cableSource = null;
          var topoElEsc = document.getElementById('db-topo-container');
          if (topoElEsc) {
            renderTopologySVG(topoElEsc, ada);
            bindTopoInteractions(ada);
          }
          showToast('Secim iptal edildi', 'info');
          document.removeEventListener('keydown', escHandler);
        }
      };
      document.addEventListener('keydown', escHandler);
    } else {
      viewport.style.cursor = '';
    }

    // ── Cable click → distance popup OR delete in cable mode ──
    var hitLines = svgEl.querySelectorAll('.topo-cable-hit');
    for (var i = 0; i < hitLines.length; i++) {
      hitLines[i].addEventListener('click', function(e) {
        e.stopPropagation();
        var fromId = parseInt(this.dataset.from, 10);
        var toId = parseInt(this.dataset.to, 10);
        var dist = parseInt(this.dataset.dist, 10) || 0;
        var cores = parseInt(this.dataset.cores, 10) || 0;
        var fromB = ada.buildings.find(function(x) { return x.id === fromId; });
        var toB = ada.buildings.find(function(x) { return x.id === toId; });
        if (!fromB || !toB) return;

        // In cable mode: click cable to delete it
        if (topoState.cableMode) {
          Topology.removeManualEdge(ada.id, fromId, toId);
          Storage.autoSave();
          var topoElDel = document.getElementById('db-topo-container');
          if (topoElDel) {
            renderTopologySVG(topoElDel, ada);
            bindTopoInteractions(ada);
          }
          showToast('Kablo silindi: ' + fromB.name + ' \u2194 ' + toB.name, 'info');
          return;
        }

        var rect = viewport.getBoundingClientRect();
        var popX = e.clientX - rect.left + 10;
        var popY = e.clientY - rect.top - 60;

        showDistancePopup(ada, fromB, toB, dist, cores, popX, popY);
      });
    }

    // ── Node click (cable mode) or drag (normal mode) ──
    var nodeGroups = svgEl.querySelectorAll('.topo-bldg');
    for (var j = 0; j < nodeGroups.length; j++) {
      // Cable mode: single click to select source/target
      nodeGroups[j].addEventListener('click', function(e) {
        if (!topoState.cableMode) return;
        e.stopPropagation();
        var bId = parseInt(this.dataset.id, 10);
        var bldg = ada.buildings.find(function(x) { return x.id === bId; });
        if (!bldg) return;

        if (!topoState.cableSource) {
          // First click: select source
          topoState.cableSource = bId;
          // Visual feedback: highlight source node
          var rect = this.querySelector('rect');
          if (rect) {
            rect.setAttribute('stroke', '#22c55e');
            rect.setAttribute('stroke-width', '3');
          }
          showToast('Kaynak: ' + bldg.name + ' → simdi hedef binaya tikla', 'info');
        } else if (topoState.cableSource === bId) {
          // Clicked same node: cancel
          topoState.cableSource = null;
          var topoElC = document.getElementById('db-topo-container');
          if (topoElC) {
            renderTopologySVG(topoElC, ada);
            bindTopoInteractions(ada);
          }
          showToast('Secim iptal edildi', 'info');
        } else {
          // Second click: create cable
          var srcId = topoState.cableSource;
          var srcB = ada.buildings.find(function(x) { return x.id === srcId; });
          var result = Topology.addManualEdge(ada.id, srcId, bId);
          topoState.cableSource = null;
          if (result) {
            Storage.autoSave();
            var topoElC2 = document.getElementById('db-topo-container');
            if (topoElC2) {
              renderTopologySVG(topoElC2, ada);
              bindTopoInteractions(ada);
            }
            showToast('Kablo eklendi: ' + (srcB ? srcB.name : srcId) + ' → ' + bldg.name, 'success');
          } else {
            showToast('Kablo eklenemedi (kopya veya gecersiz)', 'error');
          }
        }
      });

      nodeGroups[j].addEventListener('mousedown', function(e) {
        if (e.button !== 0) return;
        if (topoState.cableMode) return; // Cable mode: don't drag
        e.stopPropagation();
        e.preventDefault();
        var bId = parseInt(this.dataset.id, 10);
        var pt = svgPoint(svgEl, e);
        var node = this;
        topoState.isDragging = true;
        topoState.dragNode = { el: node, id: bId, startPt: pt };
        viewport.classList.add('is-dragging');
      });
      nodeGroups[j].addEventListener('touchstart', function(e) {
        if (e.touches.length !== 1) return;
        if (topoState.cableMode) return; // Cable mode: handled by click
        e.stopPropagation();
        e.preventDefault();
        var bId = parseInt(this.dataset.id, 10);
        var pt = svgPoint(svgEl, e.touches[0]);
        topoState.isDragging = true;
        topoState.dragNode = { el: this, id: bId, startPt: pt };
        viewport.classList.add('is-dragging');
      }, { passive: false });
    }

    // Mouse/touch move for drag and pan
    function onMove(e) {
      if (topoState.isDragging && topoState.dragNode) {
        var touch = e.touches ? e.touches[0] : e;
        var pt = svgPoint(svgEl, touch);
        var dx = pt.x - topoState.dragNode.startPt.x;
        var dy = pt.y - topoState.dragNode.startPt.y;
        topoState.dragNode.el.setAttribute('transform', 'translate(' + dx + ',' + dy + ')');
        topoState.dragNode.dx = dx;
        topoState.dragNode.dy = dy;
        // Update connected cables in real-time
        updateCablesForDrag(svgEl, topoState.dragNode.id, dx, dy);
      } else if (topoState.isPanning && topoState.panStart) {
        var touch2 = e.touches ? e.touches[0] : e;
        var ddx = (touch2.clientX - topoState.panStart.cx) * topoState.scale;
        var ddy = (touch2.clientY - topoState.panStart.cy) * topoState.scale;
        topoState.viewBox.x = topoState.panStart.vx - ddx;
        topoState.viewBox.y = topoState.panStart.vy - ddy;
        updateViewBox(svgEl);
      }
    }

    function onEnd() {
      if (topoState.isDragging && topoState.dragNode) {
        // Save final position
        var dn = topoState.dragNode;
        // Find original node position from layout
        var layout = computeHorizontalLayout(ada);
        var origNode = layout.nodes.find(function(n) { return n.b.id === dn.id; });
        if (origNode && dn.dx !== undefined) {
          var finalX = origNode.x + dn.dx;
          var finalY = origNode.y + dn.dy;
          Topology.setSvgPosition(ada.id, dn.id, finalX, finalY);
          Storage.autoSave();
          // Re-render to settle positions
          var topoEl = document.getElementById('db-topo-container');
          if (topoEl) {
            renderTopologySVG(topoEl, ada);
            bindTopoInteractions(ada);
          }
        }
        viewport.classList.remove('is-dragging');
      }
      topoState.isDragging = false;
      topoState.dragNode = null;
      if (topoState.isPanning) {
        topoState.isPanning = false;
        topoState.panStart = null;
        viewport.classList.remove('is-panning');
      }
    }

    viewport.addEventListener('mousemove', onMove);
    viewport.addEventListener('touchmove', onMove, { passive: false });
    viewport.addEventListener('mouseup', onEnd);
    viewport.addEventListener('touchend', onEnd);
    viewport.addEventListener('mouseleave', onEnd);

    // ── Pan (mousedown on empty area) ──
    viewport.addEventListener('mousedown', function(e) {
      if (e.button !== 0) return;
      if (topoState.isDragging) return;
      topoState.isPanning = true;
      topoState.panStart = { cx: e.clientX, cy: e.clientY, vx: topoState.viewBox.x, vy: topoState.viewBox.y };
      viewport.classList.add('is-panning');
    });
    viewport.addEventListener('touchstart', function(e) {
      if (e.touches.length !== 1) return;
      if (topoState.isDragging) return;
      topoState.isPanning = true;
      topoState.panStart = { cx: e.touches[0].clientX, cy: e.touches[0].clientY, vx: topoState.viewBox.x, vy: topoState.viewBox.y };
      viewport.classList.add('is-panning');
    }, { passive: false });

    // ── Zoom (wheel) ──
    viewport.addEventListener('wheel', function(e) {
      e.preventDefault();
      var factor = e.deltaY > 0 ? 1.1 : 0.9;
      applyZoom(svgEl, factor, e);
    }, { passive: false });

    // ── Zoom buttons ──
    var zinBtn = document.getElementById('db-topo-zin');
    var zoutBtn = document.getElementById('db-topo-zout');
    var zresetBtn = document.getElementById('db-topo-zreset');
    if (zinBtn) zinBtn.addEventListener('click', function() { applyZoom(svgEl, 0.8); });
    if (zoutBtn) zoutBtn.addEventListener('click', function() { applyZoom(svgEl, 1.25); });
    if (zresetBtn) zresetBtn.addEventListener('click', function() {
      resetTopoState();
      updateViewBox(svgEl);
    });
  }

  function svgPoint(svgEl, evt) {
    var pt = svgEl.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    var ctm = svgEl.getScreenCTM();
    if (ctm) return pt.matrixTransform(ctm.inverse());
    return { x: evt.clientX, y: evt.clientY };
  }

  function updateViewBox(svgEl) {
    var vb = topoState.viewBox;
    svgEl.setAttribute('viewBox', vb.x + ' ' + vb.y + ' ' + vb.w + ' ' + vb.h);
  }

  function applyZoom(svgEl, factor, evt) {
    var vb = topoState.viewBox;
    var newW = vb.w * factor;
    var newH = vb.h * factor;
    // Clamp scale
    var minW = 400, maxW = 5000;
    if (newW < minW || newW > maxW) return;

    // Zoom toward mouse position or center
    var cx = vb.x + vb.w / 2, cy = vb.y + vb.h / 2;
    if (evt) {
      var pt = svgPoint(svgEl, evt);
      cx = pt.x;
      cy = pt.y;
    }
    vb.x = cx - (cx - vb.x) * factor;
    vb.y = cy - (cy - vb.y) * factor;
    vb.w = newW;
    vb.h = newH;
    topoState.scale = newW / 1400;
    updateViewBox(svgEl);
  }

  function updateCablesForDrag(svgEl, nodeId, dx, dy) {
    // Update cable endpoints connected to this node
    var cables = svgEl.querySelectorAll('.topo-cable, .topo-cable-hit');
    for (var i = 0; i < cables.length; i++) {
      var c = cables[i];
      var fromId = parseInt(c.dataset.from, 10);
      var toId = parseInt(c.dataset.to, 10);
      if (fromId !== nodeId && toId !== nodeId) continue;

      var tag = c.tagName.toLowerCase();
      if (tag === 'line') {
        if (fromId === nodeId) {
          var ox1 = parseFloat(c.getAttribute('x1')) || 0;
          var oy1 = parseFloat(c.getAttribute('y1')) || 0;
          // Store original if not stored
          if (!c._origX1) { c._origX1 = ox1; c._origY1 = oy1; }
          c.setAttribute('x1', c._origX1 + dx);
          c.setAttribute('y1', c._origY1 + dy);
        }
        if (toId === nodeId) {
          var ox2 = parseFloat(c.getAttribute('x2')) || 0;
          var oy2 = parseFloat(c.getAttribute('y2')) || 0;
          if (!c._origX2) { c._origX2 = ox2; c._origY2 = oy2; }
          c.setAttribute('x2', c._origX2 + dx);
          c.setAttribute('y2', c._origY2 + dy);
        }
      }
      // For path elements (ring), re-render will handle it on drop
    }
  }

  function showDistancePopup(ada, fromB, toB, currentDist, cores, popX, popY) {
    // Remove existing popup
    var existing = document.querySelector('.db-topo-popup');
    if (existing) existing.remove();

    var popup = document.createElement('div');
    popup.className = 'db-topo-popup';
    popup.style.left = popX + 'px';
    popup.style.top = popY + 'px';
    popup.innerHTML = '<div class="db-topo-popup-label">MESAFE (METRE)</div>' +
      '<div class="db-topo-popup-segment">' + fromB.name + ' \u2194 ' + toB.name + ' (' + cores + 'F)</div>' +
      '<input type="number" id="db-topo-dist-input" min="1" value="' + currentDist + '" placeholder="metre">' +
      '<div class="db-topo-popup-actions">' +
      '<button class="cancel-btn" id="db-topo-dist-cancel">Iptal</button>' +
      '<button class="save-btn" id="db-topo-dist-save">Kaydet</button>' +
      '</div>';

    var viewport = document.getElementById('db-topo-viewport');
    if (viewport) viewport.appendChild(popup);

    var input = document.getElementById('db-topo-dist-input');
    if (input) { input.focus(); input.select(); }

    function doSave() {
      if (!input) { popup.remove(); return; }
      var val = parseInt(input.value, 10);
      if (!val || val < 1) { popup.remove(); return; }
      Topology.setManualDistance(ada.id, fromB.id, toB.id, val);
      PonEngine.recalculateAda(ada);
      Storage.autoSave();
      popup.remove();
      // Re-render
      var topoEl = document.getElementById('db-topo-container');
      if (topoEl) {
        renderTopologySVG(topoEl, ada);
        bindTopoInteractions(ada);
      }
      showToast('Mesafe kaydedildi: ' + val + 'm', 'success');
    }

    var saveBtn = document.getElementById('db-topo-dist-save');
    var cancelBtn = document.getElementById('db-topo-dist-cancel');
    if (saveBtn) saveBtn.addEventListener('click', doSave);
    if (cancelBtn) cancelBtn.addEventListener('click', function() { popup.remove(); });
    if (input) {
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') doSave();
        if (e.key === 'Escape') popup.remove();
      });
    }

    // Close on outside click (delayed)
    setTimeout(function() {
      function closePopup(ev) {
        if (!popup.contains(ev.target)) {
          popup.remove();
          document.removeEventListener('mousedown', closePopup);
        }
      }
      document.addEventListener('mousedown', closePopup);
    }, 100);
  }

  // ─── TOAST ────────────────────────────────────────────────────

  function showToast(msg, type) {
    var container = document.getElementById('db-toast-container');
    if (!container) return;

    var toast = document.createElement('div');
    toast.className = 'db-toast ' + (type || 'info');
    toast.textContent = msg;
    container.appendChild(toast);

    setTimeout(function() {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(function() { toast.remove(); }, 300);
    }, 4000);
  }

  // ─── ONBOARDING WIZARD ────────────────────────────────────────

  function checkOnboarding() {
    try {
      if (localStorage.getItem('fp_onboarding_done')) return;
    } catch (e) { return; }
    showWizard();
  }

  function showWizard() {
    var overlay = document.getElementById('db-wizard-overlay');
    var stepEl = document.getElementById('db-wizard-step');
    var titleEl = document.getElementById('db-wizard-title');
    var descEl = document.getElementById('db-wizard-desc');
    var skipBtn = document.getElementById('db-wizard-skip');
    var nextBtn = document.getElementById('db-wizard-next');

    if (!overlay) return;

    var currentStep = 0;

    function showStep() {
      var step = WIZARD_STEPS[currentStep];
      stepEl.textContent = (currentStep + 1) + '/' + WIZARD_STEPS.length;
      titleEl.textContent = step.title;
      descEl.textContent = step.desc;
      nextBtn.textContent = currentStep === WIZARD_STEPS.length - 1 ? 'Baslayalim!' : 'Sonraki';
    }

    function closeWizard() {
      overlay.style.display = 'none';
      try { localStorage.setItem('fp_onboarding_done', '1'); } catch (e) {}
    }

    skipBtn.addEventListener('click', closeWizard);
    nextBtn.addEventListener('click', function() {
      currentStep++;
      if (currentStep >= WIZARD_STEPS.length) {
        closeWizard();
      } else {
        showStep();
      }
    });

    overlay.style.display = 'flex';
    showStep();
  }

  // ─── PUBLIC API ───────────────────────────────────────────────

  return {
    init: init,
    navigateTo: navigateTo,
    showToast: showToast
  };
})();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  Dashboard.init();
});
