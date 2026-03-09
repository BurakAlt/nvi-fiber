/**
 * Portal — Abone Self-Servis Portal Ana Kontrol Modulu
 * SPA (Single Page Application) yaklasimi — hash bazli routing
 * Tum sayfalar JS ile render edilir.
 */
const Portal = (() => {
  'use strict';

  // ── Sabitler ──
  var REFRESH_INTERVAL_MS = 60000;   // Dashboard auto-refresh (60s)
  var TOAST_DURATION_MS = 4000;      // Toast bildirimi suresi

  // ── State ──
  let _currentPage = 'dashboard';
  let _subscriberData = null;
  let _refreshTimer = null;

  // HTML escape — XSS onleme
  function _esc(str) {
    if (str == null) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── Init ──
  function init() {
    // Login event
    var loginForm = document.getElementById('p-login-form');
    if (loginForm) loginForm.addEventListener('submit', _handleLogin);

    // Hash routing
    window.addEventListener('hashchange', _onHashChange);

    // ESC ile modal kapatma
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        var overlay = document.getElementById('p-modal-overlay');
        if (overlay && overlay.classList.contains('active')) {
          overlay.classList.remove('active');
        }
      }
    });

    // Demo giris bilgisi
    var demoBtn = document.getElementById('p-demo-login');
    if (demoBtn) demoBtn.addEventListener('click', function() {
      document.getElementById('p-login-subscriber').value = 'AB-1001';
      document.getElementById('p-login-password').value = 'demo';
    });

    // Oturum kontrolu
    if (ApiClient.isAuthenticated()) {
      _showApp();
    }
  }

  // ── Auth ──
  async function _handleLogin(e) {
    e.preventDefault();
    var subNo = document.getElementById('p-login-subscriber').value.trim();
    var pass = document.getElementById('p-login-password').value;
    var errEl = document.getElementById('p-login-error');
    var btn = document.getElementById('p-login-btn');

    if (!subNo || !pass) {
      errEl.textContent = 'Abone no ve sifre gerekli.';
      errEl.style.display = 'block';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Giris yapiliyor...';
    errEl.style.display = 'none';

    var res = await ApiClient.login(subNo, pass);
    btn.disabled = false;
    btn.textContent = 'Giris Yap';

    if (!res.ok) {
      errEl.textContent = res.error;
      errEl.style.display = 'block';
      return;
    }

    _showApp();
  }

  async function _showApp() {
    document.getElementById('p-login-screen').style.display = 'none';
    document.getElementById('p-app').classList.add('active');

    // Profil bilgisi yukle
    var res = await ApiClient.getProfile();
    if (res.ok) {
      _subscriberData = res.data;
      // Header guncelle
      var nameEl = document.getElementById('p-header-name');
      if (nameEl) nameEl.textContent = _subscriberData.name; // textContent zaten safe
      var avatarEl = document.getElementById('p-header-avatar-text');
      if (avatarEl) avatarEl.textContent = _subscriberData.name.charAt(0).toUpperCase();
    }

    // Logout butonu
    var logoutBtn = document.getElementById('p-btn-logout');
    if (logoutBtn) logoutBtn.addEventListener('click', _handleLogout);

    // Nav items
    var navItems = document.querySelectorAll('.p-nav-item');
    for (var i = 0; i < navItems.length; i++) {
      navItems[i].addEventListener('click', _onNavClick);
    }

    // Ilk sayfa
    _onHashChange();

    // Auto-refresh
    _refreshTimer = setInterval(function() {
      if (_currentPage === 'dashboard') _renderDashboard();
    }, REFRESH_INTERVAL_MS);
  }

  function _handleLogout() {
    ApiClient.logout();
    clearInterval(_refreshTimer);
    _refreshTimer = null;
    // Hassas veriyi bellekten temizle
    _subscriberData = null;
    _currentPage = 'dashboard';
    // Content alanini temizle (hassas veriler DOM'da kalmasin)
    var content = document.getElementById('p-content');
    if (content) content.innerHTML = '';
    document.getElementById('p-app').classList.remove('active');
    document.getElementById('p-login-screen').style.display = '';
    document.getElementById('p-login-subscriber').value = '';
    document.getElementById('p-login-password').value = '';
  }

  // ── Navigation ──
  function _onNavClick(e) {
    var page = e.currentTarget.getAttribute('data-page');
    if (page) window.location.hash = '#' + page;
  }

  function _onHashChange() {
    // Session timeout kontrolu
    if (!ApiClient.isAuthenticated()) {
      _handleLogout();
      return;
    }
    var hash = window.location.hash.replace('#', '') || 'dashboard';
    _currentPage = hash;

    // Nav item active
    var navItems = document.querySelectorAll('.p-nav-item');
    for (var i = 0; i < navItems.length; i++) {
      navItems[i].classList.toggle('active', navItems[i].getAttribute('data-page') === hash);
    }

    // Render
    var content = document.getElementById('p-content');
    if (!content) return;
    content.innerHTML = '<div class="p-empty"><div class="p-empty-icon">&#8987;</div><div class="p-empty-text">Yukleniyor...</div></div>';

    // Sayfa isimlerini Turkce label olarak map'le
    var pageLabels = { dashboard: 'Ana Sayfa', billing: 'Faturalar', packages: 'Paketler', speedtest: 'Hiz Testi', support: 'Destek', wifi: 'WiFi' };
    var ariaEl = document.getElementById('p-aria-live');
    if (ariaEl) ariaEl.textContent = (pageLabels[hash] || 'Ana Sayfa') + ' sayfasi yukleniyor';

    switch (hash) {
      case 'dashboard': _renderDashboard(); break;
      case 'billing': _renderBilling(); break;
      case 'packages': _renderPackages(); break;
      case 'speedtest': _renderSpeedTest(); break;
      case 'support': _renderSupport(); break;
      case 'wifi': _renderWifi(); break;
      default: _renderDashboard();
    }
  }

  // ── Helpers ──
  function _el(id) { return document.getElementById(id); }

  function _formatCurrency(amount) {
    return amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL';
  }

  function _formatDate(dateStr) {
    if (!dateStr) return '-';
    var d = new Date(dateStr);
    return d.toLocaleDateString('tr-TR');
  }

  function _formatUptime(seconds) {
    if (!seconds) return '-';
    var d = Math.floor(seconds / 86400);
    var h = Math.floor((seconds % 86400) / 3600);
    if (d > 0) return d + ' gun ' + h + ' saat';
    var m = Math.floor((seconds % 3600) / 60);
    return h + ' saat ' + m + ' dk';
  }

  function _showToast(message, type) {
    type = type || 'info';
    var container = document.getElementById('p-toast-container');
    if (!container) return;
    var toast = document.createElement('div');
    toast.className = 'p-toast ' + type;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(function() { if (toast.parentNode) toast.remove(); }, TOAST_DURATION_MS);
  }

  // ════════════════════════════════════════════════
  // ── DASHBOARD ──
  // ════════════════════════════════════════════════
  async function _renderDashboard() {
    var content = _el('p-content');
    var profile, conn;
    try {
      profile = await ApiClient.getProfile();
      conn = await ApiClient.getConnectionStatus();
    } catch (err) {
      content.innerHTML = '<p class="text-danger">Veri yuklenirken hata olustu.</p>';
      return;
    }
    if (!profile.ok) { content.innerHTML = '<p class="text-danger">Veri yuklenemedi.</p>'; return; }
    var sub = profile.data;
    var c = conn.ok ? conn.data : {};

    var quotaHtml = '';
    if (sub.package.quota) {
      var usedPct = Math.round((sub.usage.quotaUsed || 0));
      var color = usedPct > 90 ? 'var(--p-danger)' : usedPct > 70 ? 'var(--p-warning)' : 'var(--p-success)';
      quotaHtml = '<div class="p-card-sub">Kota: ' + sub.package.quota + ' GB</div>' +
        '<div class="p-progress mt-8"><div class="p-progress-fill" style="width:' + usedPct + '%;background:' + color + '"></div></div>' +
        '<div class="fs-sm text-dim mt-8">%' + usedPct + ' kullanildi</div>';
    } else {
      quotaHtml = '<div class="p-card-sub">Limitsiz</div>';
    }

    content.innerHTML =
      '<div class="p-section-title"><span class="p-icon">&#9638;</span> Hosgeldiniz, ' + _esc(sub.name) + '</div>' +
      '<div class="p-grid">' +
        // Profil
        '<div class="p-card">' +
          '<div class="p-card-header"><span class="p-card-title">Profil</span></div>' +
          '<div><strong>' + _esc(sub.name) + '</strong></div>' +
          '<div class="fs-sm text-dim">' + _esc(sub.address) + '</div>' +
          '<div class="fs-sm text-dim mt-8">Abone No: ' + _esc(sub.id) + '</div>' +
          '<div class="fs-sm text-dim">Baslangic: ' + _formatDate(sub.startDate) + '</div>' +
        '</div>' +
        // Paket
        '<div class="p-card">' +
          '<div class="p-card-header"><span class="p-card-title">Paket</span><span class="p-badge p-badge-blue">' + _esc(sub.package.name) + '</span></div>' +
          '<div class="p-card-value">' + sub.package.downloadMbps + ' <span class="fs-sm fw-600 text-dim">Mbps</span></div>' +
          '<div class="p-card-sub">' + sub.package.uploadMbps + ' Mbps yukle | ' + _formatCurrency(sub.package.price) + '/ay</div>' +
        '</div>' +
        // Kullanim
        '<div class="p-card">' +
          '<div class="p-card-header"><span class="p-card-title">Bu Ay Kullanim</span></div>' +
          '<div class="flex gap-12">' +
            '<div><div class="p-card-value text-info">' + sub.usage.downloadGB + '</div><div class="p-card-sub">GB indirme</div></div>' +
            '<div><div class="p-card-value" style="color:var(--p-accent)">' + sub.usage.uploadGB + '</div><div class="p-card-sub">GB yukleme</div></div>' +
          '</div>' +
          quotaHtml +
        '</div>' +
        // Baglanti
        '<div class="p-card">' +
          '<div class="p-card-header"><span class="p-card-title">Baglanti</span>' +
            '<span class="p-status-dot ' + (c.status || 'offline') + '"></span>' +
          '</div>' +
          '<div class="p-card-value text-success">' + (c.status === 'online' ? 'Cevrimici' : 'Cevrimdisi') + '</div>' +
          '<div class="p-card-sub">IP: ' + _esc(c.ip || '-') + '</div>' +
          '<div class="fs-sm text-dim mt-8">Uptime: ' + _formatUptime(c.uptime) + '</div>' +
        '</div>' +
        // Hizli islemler
        '<div class="p-card">' +
          '<div class="p-card-header"><span class="p-card-title">Hizli Islemler</span></div>' +
          '<div style="display:flex;flex-direction:column;gap:8px">' +
            '<button class="p-btn p-btn-outline p-btn-sm" onclick="location.hash=\'#speedtest\'">&#9889; Hiz Testi Yap</button>' +
            '<button class="p-btn p-btn-outline p-btn-sm" onclick="location.hash=\'#support\'">&#9993; Destek Talebi Ac</button>' +
            '<button class="p-btn p-btn-outline p-btn-sm" onclick="location.hash=\'#billing\'">&#9783; Faturalari Gor</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  // ════════════════════════════════════════════════
  // ── FATURA YONETIMI ──
  // ════════════════════════════════════════════════
  async function _renderBilling() {
    var content = _el('p-content');
    content.innerHTML =
      '<div class="p-section-title"><span class="p-icon">&#9783;</span> Fatura Yonetimi</div>' +
      '<div class="p-tabs">' +
        '<button class="p-tab active" data-tab="invoices">Faturalar</button>' +
        '<button class="p-tab" data-tab="payments">Odeme Gecmisi</button>' +
      '</div>' +
      '<div id="p-billing-content"></div>';

    content.querySelectorAll('.p-tab').forEach(function(t) {
      t.addEventListener('click', function() {
        content.querySelectorAll('.p-tab').forEach(function(x) { x.classList.remove('active'); });
        t.classList.add('active');
        if (t.dataset.tab === 'invoices') _renderInvoices();
        else _renderPayments();
      });
    });

    _renderInvoices();
  }

  async function _renderInvoices() {
    var el = _el('p-billing-content');
    var res = await ApiClient.getInvoices();
    if (!res.ok) { el.innerHTML = '<p class="text-danger">Faturalar yuklenemedi.</p>'; return; }
    var invoices = res.data;

    var rows = '';
    for (var i = 0; i < invoices.length; i++) {
      var inv = invoices[i];
      var statusBadge = inv.status === 'paid'
        ? '<span class="p-badge p-badge-green">Odendi</span>'
        : '<span class="p-badge p-badge-red">Odenmedi</span>';
      rows += '<tr class="p-clickable" data-invoice="' + _esc(inv.id) + '">' +
        '<td>' + _esc(inv.period) + '</td>' +
        '<td>' + _formatDate(inv.issueDate) + '</td>' +
        '<td class="fw-600">' + _formatCurrency(inv.total) + '</td>' +
        '<td>' + statusBadge + '</td>' +
        '<td>' + _formatDate(inv.dueDate) + '</td>' +
        '</tr>';
    }

    el.innerHTML =
      '<div class="p-table-wrap"><table class="p-table"><thead><tr>' +
        '<th>Donem</th><th>Tarih</th><th>Tutar</th><th>Durum</th><th>Son Odeme</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div>';

    el.querySelectorAll('.p-clickable').forEach(function(row) {
      row.addEventListener('click', function() {
        _showInvoiceDetail(row.dataset.invoice);
      });
    });
  }

  async function _showInvoiceDetail(invoiceId) {
    var res = await ApiClient.getInvoiceDetail(invoiceId);
    if (!res.ok) { _showToast('Fatura detayi yuklenemedi.', 'error'); return; }
    var inv = res.data;

    var itemRows = '';
    for (var i = 0; i < inv.items.length; i++) {
      itemRows += '<tr><td>' + _esc(inv.items[i].description) + '</td><td class="text-right fw-600">' + _formatCurrency(inv.items[i].amount) + '</td></tr>';
    }

    var overlay = _el('p-modal-overlay');
    var modal = _el('p-modal');
    modal.innerHTML =
      '<div class="p-modal-title">Fatura Detay — ' + _esc(inv.id) + '</div>' +
      '<div class="fs-sm text-dim mb-16">Donem: ' + _esc(inv.period) + ' | Duzenleme: ' + _formatDate(inv.issueDate) + '</div>' +
      '<div class="p-table-wrap"><table class="p-table"><thead><tr><th>Kalem</th><th class="text-right">Tutar</th></tr></thead>' +
      '<tbody>' + itemRows + '</tbody>' +
      '<tfoot><tr><td class="fw-700">TOPLAM</td><td class="text-right fw-700">' + _formatCurrency(inv.total) + '</td></tr></tfoot></table></div>' +
      '<div class="p-modal-actions">' +
        '<button class="p-btn p-btn-outline p-btn-sm" id="p-modal-close">Kapat</button>' +
        '<button class="p-btn p-btn-primary p-btn-sm" id="p-modal-pdf">PDF Indir</button>' +
      '</div>';
    overlay.classList.add('active');

    _el('p-modal-close').addEventListener('click', function() { overlay.classList.remove('active'); });
    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.classList.remove('active'); });
    _el('p-modal-pdf').addEventListener('click', async function() {
      await ApiClient.downloadInvoicePdf(inv.id);
      _showToast('PDF indirme baslatildi (demo mod)', 'info');
    });
  }

  async function _renderPayments() {
    var el = _el('p-billing-content');
    var res = await ApiClient.getPaymentHistory();
    if (!res.ok) { el.innerHTML = '<p class="text-danger">Odeme gecmisi yuklenemedi.</p>'; return; }
    var payments = res.data;

    var rows = '';
    for (var i = 0; i < payments.length; i++) {
      var p = payments[i];
      rows += '<tr>' +
        '<td>' + _formatDate(p.date) + '</td>' +
        '<td class="fw-600">' + _formatCurrency(p.amount) + '</td>' +
        '<td>' + _esc(p.method) + '</td>' +
        '<td class="text-dim">' + _esc(p.reference) + '</td>' +
        '</tr>';
    }

    el.innerHTML =
      '<div class="p-table-wrap"><table class="p-table"><thead><tr>' +
        '<th>Tarih</th><th>Tutar</th><th>Yontem</th><th>Referans</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  // ════════════════════════════════════════════════
  // ── PAKET YONETIMI ──
  // ════════════════════════════════════════════════
  async function _renderPackages() {
    var content = _el('p-content');
    var currentRes = await ApiClient.getCurrentPackage();
    var allRes = await ApiClient.getPackages();
    if (!currentRes.ok || !allRes.ok) { content.innerHTML = '<p class="text-danger">Paket bilgisi yuklenemedi.</p>'; return; }
    var current = currentRes.data;
    var packages = allRes.data;

    // Mevcut paket
    var html = '<div class="p-section-title"><span class="p-icon">&#9881;</span> Paket Yonetimi</div>' +
      '<div class="p-card mb-16">' +
        '<div class="p-card-header"><span class="p-card-title">Mevcut Paketiniz</span><span class="p-badge p-badge-blue">' + _esc(current.name) + '</span></div>' +
        '<div class="flex gap-12" style="flex-wrap:wrap">' +
          '<div><span class="p-card-value">' + current.downloadMbps + '</span> <span class="text-dim fs-sm">Mbps indirme</span></div>' +
          '<div><span class="p-card-value">' + current.uploadMbps + '</span> <span class="text-dim fs-sm">Mbps yukleme</span></div>' +
          '<div><span class="p-card-value">' + _formatCurrency(current.price) + '</span> <span class="text-dim fs-sm">/ay</span></div>' +
        '</div>' +
        '<div class="mt-8">' + (current.features || []).map(function(f) { return '<span class="p-badge p-badge-gray" style="margin:2px">' + _esc(f) + '</span>'; }).join('') + '</div>' +
      '</div>';

    // Karsilastirma tablosu
    var thCells = '<th>Ozellik</th>';
    for (var i = 0; i < packages.length; i++) {
      var isCurrent = packages[i].id === current.id;
      thCells += '<th style="text-align:center">' + _esc(packages[i].name) + (isCurrent ? ' &#10003;' : '') + '</th>';
    }

    var rows = '';
    // Hiz
    rows += '<tr><td class="fw-600">Indirme Hizi</td>';
    for (var j = 0; j < packages.length; j++) rows += '<td style="text-align:center">' + packages[j].downloadMbps + ' Mbps</td>';
    rows += '</tr>';

    rows += '<tr><td class="fw-600">Yukleme Hizi</td>';
    for (var k = 0; k < packages.length; k++) rows += '<td style="text-align:center">' + packages[k].uploadMbps + ' Mbps</td>';
    rows += '</tr>';

    rows += '<tr><td class="fw-600">Kota</td>';
    for (var m = 0; m < packages.length; m++) rows += '<td style="text-align:center">' + (packages[m].quota ? packages[m].quota + ' GB' : 'Limitsiz') + '</td>';
    rows += '</tr>';

    rows += '<tr><td class="fw-600">Aylik Ucret</td>';
    for (var n = 0; n < packages.length; n++) rows += '<td style="text-align:center;font-weight:700">' + _formatCurrency(packages[n].price) + '</td>';
    rows += '</tr>';

    // Sec butonu
    rows += '<tr><td></td>';
    for (var p = 0; p < packages.length; p++) {
      if (packages[p].id === current.id) {
        rows += '<td style="text-align:center"><span class="p-badge p-badge-green">Mevcut</span></td>';
      } else {
        rows += '<td style="text-align:center"><button class="p-btn p-btn-primary p-btn-sm p-pkg-select" data-pkg="' + packages[p].id + '">Sec</button></td>';
      }
    }
    rows += '</tr>';

    html += '<div class="p-table-wrap"><table class="p-table"><thead><tr>' + thCells + '</tr></thead><tbody>' + rows + '</tbody></table></div>';

    content.innerHTML = html;

    // Paket secimi
    content.querySelectorAll('.p-pkg-select').forEach(function(btn) {
      btn.addEventListener('click', function() { _showPackageChangeConfirm(btn.dataset.pkg, current, packages); });
    });
  }

  function _showPackageChangeConfirm(targetPkgId, current, packages) {
    var target = null;
    for (var i = 0; i < packages.length; i++) { if (packages[i].id === targetPkgId) { target = packages[i]; break; } }
    if (!target) return;

    var diff = target.price - current.price;
    var diffText = diff > 0 ? '+' + _formatCurrency(diff) + ' (yukseltme)' : _formatCurrency(diff) + ' (dusurme)';
    var diffClass = diff > 0 ? 'text-warning' : 'text-success';

    var overlay = _el('p-modal-overlay');
    var modal = _el('p-modal');
    modal.innerHTML =
      '<div class="p-modal-title">Paket Degisikligi Onayi</div>' +
      '<div class="p-card mb-16"><div class="flex-between"><div><div class="fs-sm text-dim">Mevcut</div><div class="fw-700">' + _esc(current.name) + '</div><div class="fs-sm">' + _formatCurrency(current.price) + '/ay</div></div>' +
      '<div style="font-size:1.5rem;color:var(--p-text-muted)">&#8594;</div>' +
      '<div><div class="fs-sm text-dim">Yeni</div><div class="fw-700">' + _esc(target.name) + '</div><div class="fs-sm">' + _formatCurrency(target.price) + '/ay</div></div></div></div>' +
      '<div class="p-card"><div class="flex-between"><span class="text-dim">Fiyat Farki</span><span class="fw-700 ' + diffClass + '">' + diffText + '</span></div>' +
      '<div class="flex-between mt-8"><span class="text-dim">Yururluk</span><span>Sonraki fatura donemi</span></div></div>' +
      '<div class="fs-sm text-dim mt-8">Not: Paket degisikligi talebi onay surecine duser. Onaylama sonrasi bir sonraki fatura doneminden itibaren gecerli olur.</div>' +
      '<div class="p-modal-actions">' +
        '<button class="p-btn p-btn-outline p-btn-sm" id="p-modal-cancel">Vazgec</button>' +
        '<button class="p-btn p-btn-primary p-btn-sm" id="p-modal-confirm">Talep Olustur</button>' +
      '</div>';
    overlay.classList.add('active');

    _el('p-modal-cancel').addEventListener('click', function() { overlay.classList.remove('active'); });
    _el('p-modal-confirm').addEventListener('click', async function() {
      var res = await ApiClient.requestPackageChange(targetPkgId);
      overlay.classList.remove('active');
      if (res.ok) {
        _showToast('Paket degisikligi talebi olusturuldu. Talep No: ' + res.data.requestId, 'success');
      } else {
        _showToast('Hata: ' + res.error, 'error');
      }
    });
  }

  // ════════════════════════════════════════════════
  // ── HIZ TESTI ──
  // ════════════════════════════════════════════════
  async function _renderSpeedTest() {
    var content = _el('p-content');
    content.innerHTML =
      '<div class="p-section-title"><span class="p-icon">&#9889;</span> Hiz Testi</div>' +
      '<div class="p-tabs">' +
        '<button class="p-tab active" data-tab="test">Test</button>' +
        '<button class="p-tab" data-tab="history">Gecmis</button>' +
      '</div>' +
      '<div id="p-speedtest-content"></div>';

    content.querySelectorAll('.p-tab').forEach(function(t) {
      t.addEventListener('click', function() {
        content.querySelectorAll('.p-tab').forEach(function(x) { x.classList.remove('active'); });
        t.classList.add('active');
        if (t.dataset.tab === 'test') _renderSpeedTestUI();
        else _renderSpeedTestHistory();
      });
    });

    _renderSpeedTestUI();
  }

  function _renderSpeedTestUI() {
    var el = _el('p-speedtest-content');
    el.innerHTML =
      '<div class="p-speedtest-wrap">' +
        '<div class="p-chart-container p-speedtest-gauge"><canvas id="p-speed-canvas" style="height:240px"></canvas></div>' +
        '<div class="p-speedtest-phase" id="p-speed-phase">Testi baslatmak icin butona basin</div>' +
        '<button class="p-speedtest-btn" id="p-speed-btn">BASLAT</button>' +
        '<div class="p-speedtest-results" id="p-speed-results" style="display:none">' +
          '<div class="p-speedtest-result"><div class="p-speedtest-result-value" id="p-res-download">-</div><div class="p-speedtest-result-label">Download (Mbps)</div></div>' +
          '<div class="p-speedtest-result"><div class="p-speedtest-result-value" id="p-res-upload">-</div><div class="p-speedtest-result-label">Upload (Mbps)</div></div>' +
          '<div class="p-speedtest-result"><div class="p-speedtest-result-value" id="p-res-latency">-</div><div class="p-speedtest-result-label">Ping (ms)</div></div>' +
          '<div class="p-speedtest-result"><div class="p-speedtest-result-value" id="p-res-jitter">-</div><div class="p-speedtest-result-label">Jitter (ms)</div></div>' +
        '</div>' +
      '</div>';

    var btn = _el('p-speed-btn');
    btn.addEventListener('click', _startSpeedTest);
  }

  async function _startSpeedTest() {
    var btn = _el('p-speed-btn');
    if (SpeedTest.isRunning()) {
      SpeedTest.cancel();
      btn.textContent = 'BASLAT';
      btn.classList.remove('running');
      return;
    }

    btn.textContent = 'IPTAL';
    btn.classList.add('running');
    _el('p-speed-results').style.display = 'none';

    var profile = _subscriberData;
    var planDown = profile ? profile.package.downloadMbps : 100;
    var planUp = profile ? profile.package.uploadMbps : 20;
    var canvas = _el('p-speed-canvas');

    var result;
    try {
      result = await SpeedTest.run({
        planDownload: planDown,
        planUpload: planUp,
        onProgress: function(info) {
          _el('p-speed-phase').textContent = info.message;
          if (info.phase === 'download' || info.phase === 'upload') {
            var maxVal = info.phase === 'download' ? planDown : planUp;
            var curVal = parseFloat(info.message) || 0;
            PortalCharts.speedometer(canvas, curVal, maxVal * 1.2, {
              unit: info.phase === 'download' ? 'Mbps ↓' : 'Mbps ↑'
            });
          }
        }
      });
    } catch (err) {
      _showToast('Hiz testi basarisiz oldu.', 'error');
      _el('p-speed-phase').textContent = 'Test basarisiz oldu.';
      result = { ok: false };
    }

    btn.textContent = 'BASLAT';
    btn.classList.remove('running');

    if (result.ok) {
      var d = result.data;
      _el('p-speed-results').style.display = '';
      _el('p-res-download').textContent = d.download;
      _el('p-res-upload').textContent = d.upload;
      _el('p-res-latency').textContent = d.latency;
      _el('p-res-jitter').textContent = d.jitter;

      // Final gauge
      PortalCharts.speedometer(canvas, d.download, planDown * 1.2, { unit: 'Mbps ↓' });

      // Kaydet
      await ApiClient.saveSpeedTestResult(d);
      _showToast('Hiz testi tamamlandi ve kaydedildi.', 'success');

      _el('p-speed-phase').textContent = 'Test tamamlandi — ' + _formatDate(d.timestamp);
    }
  }

  async function _renderSpeedTestHistory() {
    var el = _el('p-speedtest-content');
    var res = await ApiClient.getSpeedTestHistory();
    if (!res.ok) { el.innerHTML = '<p class="text-danger">Gecmis yuklenemedi.</p>'; return; }
    var history = res.data;

    // Trend grafik
    var downloads = history.map(function(h) { return h.download; }).reverse();
    var html = '<div class="p-card mb-16"><div class="p-card-header"><span class="p-card-title">Download Trendi</span></div>' +
      '<div class="p-chart-container" style="height:120px"><canvas id="p-speed-trend-canvas" style="height:120px"></canvas></div></div>';

    // Tablo
    var rows = '';
    for (var i = 0; i < history.length; i++) {
      var h = history[i];
      rows += '<tr>' +
        '<td>' + _formatDate(h.date) + '</td>' +
        '<td class="fw-600">' + h.download + '</td>' +
        '<td>' + h.upload + '</td>' +
        '<td>' + h.latency + '</td>' +
        '<td>' + h.jitter + '</td>' +
        '<td>' + _qoeGradeBadge(h.qoeScore) + '</td>' +
        '</tr>';
    }

    html += '<div class="p-table-wrap"><table class="p-table"><thead><tr>' +
      '<th>Tarih</th><th>Download</th><th>Upload</th><th>Ping</th><th>Jitter</th><th>QoE</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div>';

    el.innerHTML = html;

    // Trend ciz
    setTimeout(function() {
      var canvas = _el('p-speed-trend-canvas');
      if (canvas) PortalCharts.sparkline(canvas, downloads, { color: '#6366f1', fillAlpha: 0.15, lineWidth: 2 });
    }, 50);
  }

  function _qoeGradeBadge(score) {
    if (score >= 70) return '<span class="p-badge p-badge-green">' + score + '</span>';
    if (score >= 40) return '<span class="p-badge p-badge-yellow">' + score + '</span>';
    return '<span class="p-badge p-badge-red">' + score + '</span>';
  }

  // ════════════════════════════════════════════════
  // ── DESTEK TALEBI ──
  // ════════════════════════════════════════════════
  async function _renderSupport() {
    var content = _el('p-content');
    content.innerHTML =
      '<div class="p-section-title"><span class="p-icon">&#9993;</span> Destek Merkezi</div>' +
      '<div class="p-tabs">' +
        '<button class="p-tab active" data-tab="tickets">Taleplerim</button>' +
        '<button class="p-tab" data-tab="new">Yeni Talep</button>' +
        '<button class="p-tab" data-tab="faq">SSS</button>' +
      '</div>' +
      '<div id="p-support-content"></div>';

    content.querySelectorAll('.p-tab').forEach(function(t) {
      t.addEventListener('click', function() {
        content.querySelectorAll('.p-tab').forEach(function(x) { x.classList.remove('active'); });
        t.classList.add('active');
        var tab = t.dataset.tab;
        if (tab === 'tickets') _renderTicketList();
        else if (tab === 'new') _renderNewTicket();
        else _renderFaq();
      });
    });

    _renderTicketList();
  }

  async function _renderTicketList() {
    var el = _el('p-support-content');
    var res = await ApiClient.getTickets();
    if (!res.ok) { el.innerHTML = '<p class="text-danger">Talepler yuklenemedi.</p>'; return; }
    var tickets = res.data;

    if (tickets.length === 0) {
      el.innerHTML = '<div class="p-empty"><div class="p-empty-icon">&#9993;</div><div class="p-empty-text">Henuz destek talebiniz yok.</div></div>';
      return;
    }

    var rows = '';
    for (var i = 0; i < tickets.length; i++) {
      var t = tickets[i];
      var statusBadge = t.status === 'open' ? '<span class="p-badge p-badge-yellow">Acik</span>'
        : t.status === 'closed' ? '<span class="p-badge p-badge-green">Kapali</span>'
        : '<span class="p-badge p-badge-blue">Beklemede</span>';
      var priBadge = t.priority === 'urgent' ? '<span class="p-badge p-badge-red">Acil</span>' : '';
      rows += '<tr class="p-clickable" data-ticket="' + _esc(t.id) + '">' +
        '<td>' + _esc(t.id) + '</td>' +
        '<td>' + _esc(t.subject) + '</td>' +
        '<td>' + _esc(t.category) + '</td>' +
        '<td>' + statusBadge + ' ' + priBadge + '</td>' +
        '<td>' + _formatDate(t.createdAt) + '</td>' +
        '</tr>';
    }

    el.innerHTML =
      '<div class="p-table-wrap"><table class="p-table"><thead><tr>' +
        '<th>No</th><th>Konu</th><th>Kategori</th><th>Durum</th><th>Tarih</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div>';

    el.querySelectorAll('.p-clickable').forEach(function(row) {
      row.addEventListener('click', function() { _showTicketDetail(row.dataset.ticket); });
    });
  }

  async function _showTicketDetail(ticketId) {
    var res = await ApiClient.getTicketDetail(ticketId);
    if (!res.ok) { _showToast('Talep detayi yuklenemedi.', 'error'); return; }
    var t = res.data;

    var timeline = '';
    for (var i = 0; i < t.messages.length; i++) {
      var m = t.messages[i];
      var cls = m.from === 'subscriber' ? 'subscriber' : 'support';
      var label = m.from === 'subscriber' ? 'Siz' : 'Destek';
      timeline += '<div class="p-timeline-item ' + cls + '">' +
        '<div class="p-timeline-meta">' + label + ' — ' + _formatDate(m.date) + '</div>' +
        '<div class="p-timeline-text">' + _esc(m.text) + '</div>' +
        '</div>';
    }

    var overlay = _el('p-modal-overlay');
    var modal = _el('p-modal');
    modal.innerHTML =
      '<div class="p-modal-title">' + _esc(t.subject) + ' <span class="fs-sm text-dim">(' + _esc(t.id) + ')</span></div>' +
      '<div class="p-timeline">' + timeline + '</div>' +
      (t.status === 'open' ?
        '<div class="mt-16"><label for="p-ticket-reply" class="sr-only">Yanit mesaji</label><textarea class="p-input" id="p-ticket-reply" rows="3" placeholder="Mesajinizi yazin..." maxlength="1000" aria-label="Yanit mesaji"></textarea></div>' +
        '<div class="p-modal-actions">' +
          '<button class="p-btn p-btn-outline p-btn-sm" id="p-modal-close">Kapat</button>' +
          '<button class="p-btn p-btn-primary p-btn-sm" id="p-ticket-send">Gonder</button>' +
        '</div>'
      :
        '<div class="p-modal-actions"><button class="p-btn p-btn-outline p-btn-sm" id="p-modal-close">Kapat</button></div>'
      );
    overlay.classList.add('active');

    _el('p-modal-close').addEventListener('click', function() { overlay.classList.remove('active'); });

    var sendBtn = _el('p-ticket-send');
    if (sendBtn) {
      sendBtn.addEventListener('click', async function() {
        var msg = _el('p-ticket-reply').value.trim();
        if (!msg) return;
        var r = await ApiClient.addTicketMessage(t.id, msg);
        if (r.ok) {
          _showToast('Mesaj gonderildi.', 'success');
          overlay.classList.remove('active');
        }
      });
    }
  }

  function _renderNewTicket() {
    var el = _el('p-support-content');
    el.innerHTML =
      '<div class="p-card">' +
        '<div class="p-card-header"><span class="p-card-title">Yeni Destek Talebi</span></div>' +
        '<div class="p-form-group">' +
          '<label>Kategori</label>' +
          '<select class="p-input" id="p-ticket-category">' +
            '<option value="baglanti">Baglanti Sorunu</option>' +
            '<option value="hiz">Hiz Sorunu</option>' +
            '<option value="fatura">Fatura</option>' +
            '<option value="diger">Diger</option>' +
          '</select>' +
        '</div>' +
        '<div class="p-form-group">' +
          '<label>Konu</label>' +
          '<input class="p-input" id="p-ticket-subject" placeholder="Kisaca sorunuzu belirtin" maxlength="120">' +
        '</div>' +
        '<div class="p-form-group">' +
          '<label>Aciklama</label>' +
          '<textarea class="p-input" id="p-ticket-desc" rows="4" placeholder="Sorunun detaylarini yazin..." maxlength="2000"></textarea>' +
        '</div>' +
        '<div class="p-form-group">' +
          '<label>Oncelik</label>' +
          '<select class="p-input" id="p-ticket-priority">' +
            '<option value="normal">Normal</option>' +
            '<option value="urgent">Acil</option>' +
          '</select>' +
        '</div>' +
        '<div class="flex-between">' +
          '<div class="fs-sm text-dim">Otomatik diagnostik raporu eklenecektir.</div>' +
          '<button class="p-btn p-btn-primary" id="p-ticket-submit">Talebi Gonder</button>' +
        '</div>' +
      '</div>';

    _el('p-ticket-submit').addEventListener('click', async function() {
      var cat = _el('p-ticket-category').value;
      var subj = _el('p-ticket-subject').value.trim();
      var desc = _el('p-ticket-desc').value.trim();
      var pri = _el('p-ticket-priority').value;

      if (!subj || !desc) {
        _showToast('Konu ve aciklama alanlari zorunlu.', 'error');
        return;
      }

      var res = await ApiClient.createTicket({ category: cat, subject: subj, description: desc, priority: pri });
      if (res.ok) {
        _showToast('Destek talebi olusturuldu: ' + res.data.id, 'success');
        _renderTicketList();
        // Tab'i degistir
        var tabs = document.querySelectorAll('.p-tab');
        tabs.forEach(function(t) { t.classList.toggle('active', t.dataset.tab === 'tickets'); });
      } else {
        _showToast('Hata: ' + res.error, 'error');
      }
    });
  }

  async function _renderFaq() {
    var el = _el('p-support-content');
    var res = await ApiClient.getFaq();
    if (!res.ok) { el.innerHTML = '<p class="text-danger">SSS yuklenemedi.</p>'; return; }
    var faqs = res.data;

    var html = '<div class="p-form-group"><label for="p-faq-search" class="sr-only">SSS Ara</label><input class="p-input" id="p-faq-search" placeholder="SSS icinde ara..." aria-label="SSS icinde ara"></div>';

    for (var i = 0; i < faqs.length; i++) {
      html += '<div class="p-faq-item" data-q="' + _esc(faqs[i].q.toLowerCase()) + '">' +
        '<div class="p-faq-q"><span>' + _esc(faqs[i].q) + '</span><span>&#9660;</span></div>' +
        '<div class="p-faq-a">' + _esc(faqs[i].a) + '</div>' +
        '</div>';
    }

    el.innerHTML = html;

    // Toggle
    el.querySelectorAll('.p-faq-q').forEach(function(q) {
      q.addEventListener('click', function() {
        q.parentElement.classList.toggle('open');
      });
    });

    // Arama
    _el('p-faq-search').addEventListener('input', function(e) {
      var query = e.target.value.toLowerCase();
      el.querySelectorAll('.p-faq-item').forEach(function(item) {
        item.style.display = item.dataset.q.indexOf(query) !== -1 ? '' : 'none';
      });
    });
  }

  // ════════════════════════════════════════════════
  // ── WIFI YONETIMI ──
  // ════════════════════════════════════════════════
  async function _renderWifi() {
    var content = _el('p-content');
    var res = await ApiClient.getWifiSettings();
    if (!res.ok) { content.innerHTML = '<p class="text-danger">WiFi bilgisi yuklenemedi.</p>'; return; }
    var wifi = res.data;

    var devRows = '';
    for (var i = 0; i < wifi.devices.length; i++) {
      var d = wifi.devices[i];
      devRows += '<tr>' +
        '<td>' + _esc(d.name) + '</td>' +
        '<td class="text-dim">' + _esc(d.mac) + '</td>' +
        '<td>' + _esc(d.ip) + '</td>' +
        '<td>' + _esc(d.connected) + '</td>' +
        '<td>' + _esc(d.bandwidth) + '</td>' +
        '</tr>';
    }

    content.innerHTML =
      '<div class="p-section-title"><span class="p-icon">&#128246;</span> WiFi Yonetimi</div>' +
      '<div class="p-grid p-grid-2">' +
        // Ayarlar
        '<div class="p-card">' +
          '<div class="p-card-header"><span class="p-card-title">WiFi Ayarlari</span></div>' +
          '<div class="p-wifi-field"><span class="p-wifi-label">Ag Adi (SSID)</span><span class="p-wifi-value">' + _esc(wifi.ssid) + ' <button class="p-btn p-btn-outline p-btn-sm" id="p-wifi-edit-ssid">Degistir</button></span></div>' +
          '<div class="p-wifi-field"><span class="p-wifi-label">Sifre</span><span class="p-wifi-value"><span id="p-wifi-pass-text">••••••••</span> <button class="p-btn p-btn-outline p-btn-sm" id="p-wifi-toggle-pass">Goster</button> <button class="p-btn p-btn-outline p-btn-sm" id="p-wifi-edit-pass">Degistir</button></span></div>' +
          '<div class="p-wifi-field"><span class="p-wifi-label">Kanal</span><span class="p-wifi-value">' + _esc(wifi.channel) + ' (' + _esc(wifi.band) + ')</span></div>' +
          '<div class="p-wifi-field"><span class="p-wifi-label">Guvenlik</span><span class="p-wifi-value">' + _esc(wifi.security) + '</span></div>' +
        '</div>' +
        // Bagli cihazlar
        '<div class="p-card">' +
          '<div class="p-card-header"><span class="p-card-title">Bagli Cihazlar</span><span class="p-badge p-badge-blue">' + wifi.devices.length + ' cihaz</span></div>' +
          '<div class="p-table-wrap"><table class="p-table"><thead><tr>' +
            '<th>Cihaz</th><th>MAC</th><th>IP</th><th>Sure</th><th>Hiz</th>' +
          '</tr></thead><tbody>' + devRows + '</tbody></table></div>' +
        '</div>' +
      '</div>';

    // Sifre goster/gizle
    var passHidden = true;
    _el('p-wifi-toggle-pass').addEventListener('click', function() {
      passHidden = !passHidden;
      _el('p-wifi-pass-text').textContent = passHidden ? '••••••••' : wifi.password;
      this.textContent = passHidden ? 'Goster' : 'Gizle';
    });

    // SSID degistir
    _el('p-wifi-edit-ssid').addEventListener('click', function() {
      _showWifiEditModal('SSID Degistir', 'Yeni SSID', wifi.ssid, async function(val) {
        var r = await ApiClient.updateWifiSsid(val);
        _showToast(r.ok ? r.message : 'Hata: ' + r.error, r.ok ? 'success' : 'error');
      });
    });

    // Sifre degistir
    _el('p-wifi-edit-pass').addEventListener('click', function() {
      _showWifiEditModal('WiFi Sifresi Degistir', 'Yeni Sifre', '', async function(val) {
        if (val.length < 8) { _showToast('Sifre en az 8 karakter olmali.', 'error'); return; }
        var r = await ApiClient.updateWifiPassword(val);
        _showToast(r.ok ? r.message : 'Hata: ' + r.error, r.ok ? 'success' : 'error');
      });
    });
  }

  function _showWifiEditModal(title, placeholder, defaultVal, onConfirm) {
    var overlay = _el('p-modal-overlay');
    var modal = _el('p-modal');
    modal.innerHTML =
      '<div class="p-modal-title">' + title + '</div>' +
      '<div class="p-form-group"><input class="p-input" id="p-wifi-modal-input" placeholder="' + _esc(placeholder) + '" value="' + _esc(defaultVal || '') + '" maxlength="64"></div>' +
      '<div class="p-modal-actions">' +
        '<button class="p-btn p-btn-outline p-btn-sm" id="p-modal-close">Vazgec</button>' +
        '<button class="p-btn p-btn-primary p-btn-sm" id="p-modal-save">Kaydet</button>' +
      '</div>';
    overlay.classList.add('active');

    _el('p-modal-close').addEventListener('click', function() { overlay.classList.remove('active'); });
    _el('p-modal-save').addEventListener('click', function() {
      var val = _el('p-wifi-modal-input').value.trim();
      if (!val) { _showToast('Deger bos olamaz.', 'error'); return; }
      overlay.classList.remove('active');
      onConfirm(val);
    });
  }

  // ── Public API ──
  return {
    init: init
  };
})();

// Auto-init
document.addEventListener('DOMContentLoaded', function() { Portal.init(); });
