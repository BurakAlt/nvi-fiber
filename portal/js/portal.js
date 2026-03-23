/**
 * Portal — ISP Yonetim Paneli Ana Kontrol Modulu
 * SPA (Single Page Application) yaklasimi — hash bazli routing
 * Tum sayfalar JS ile render edilir.
 *
 * Onceki abone self-servis portali admin paneline donusturuldu.
 * ApiClient (abone API) korunuyor, AdminApi (yonetim API) kullaniliyor.
 */
const Portal = (() => {
  'use strict';

  // ── Sabitler ──
  var REFRESH_INTERVAL_MS = 30000;   // Dashboard auto-refresh (30s)
  var TOAST_DURATION_MS = 4000;      // Toast bildirimi suresi

  // ── State ──
  let _currentPage = 'dashboard';
  let _currentUser = null;
  let _refreshTimer = null;
  let _leafletMap = null; // Harita sayfasi icin

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
      document.getElementById('p-login-username').value = 'admin';
      document.getElementById('p-login-password').value = 'admin123';
    });

    // Oturum kontrolu
    if (AdminApi.isAuthenticated()) {
      _currentUser = AdminApi.getCurrentUser();
      _showApp();
    }
  }

  // ── Auth ──
  async function _handleLogin(e) {
    e.preventDefault();
    var username = document.getElementById('p-login-username').value.trim();
    var pass = document.getElementById('p-login-password').value;
    var errEl = document.getElementById('p-login-error');
    var btn = document.getElementById('p-login-btn');

    if (!username || !pass) {
      errEl.textContent = 'Kullanici adi ve sifre gerekli.';
      errEl.style.display = 'block';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Giris yapiliyor...';
    errEl.style.display = 'none';

    var res = await AdminApi.login(username, pass);
    btn.disabled = false;
    btn.textContent = 'Giris Yap';

    if (!res.ok) {
      errEl.textContent = res.error;
      errEl.style.display = 'block';
      return;
    }

    _currentUser = res.user;
    _showApp();
  }

  function _showApp() {
    document.getElementById('p-login-screen').style.display = 'none';
    document.getElementById('p-app').classList.add('active');

    // Header guncelle
    if (_currentUser) {
      var nameEl = document.getElementById('p-header-name');
      if (nameEl) nameEl.textContent = _currentUser.fullName || _currentUser.username;
      var avatarEl = document.getElementById('p-header-avatar-text');
      if (avatarEl) avatarEl.textContent = (_currentUser.fullName || _currentUser.username).charAt(0).toUpperCase();
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
    AdminApi.logout();
    clearInterval(_refreshTimer);
    _refreshTimer = null;
    _currentUser = null;
    _currentPage = 'dashboard';
    _leafletMap = null;
    var content = document.getElementById('p-content');
    if (content) content.innerHTML = '';
    document.getElementById('p-app').classList.remove('active');
    document.getElementById('p-login-screen').style.display = '';
    document.getElementById('p-login-username').value = '';
    document.getElementById('p-login-password').value = '';
  }

  // ── Navigation ──
  function _onNavClick(e) {
    var page = e.currentTarget.getAttribute('data-page');
    if (page) window.location.hash = '#' + page;
  }

  function _onHashChange() {
    if (!AdminApi.isAuthenticated()) {
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
    _showLoading(content);

    // Sayfa isimlerini Turkce label olarak map'le
    var pageLabels = {
      dashboard: 'Dashboard', subscribers: 'Aboneler', payments: 'Odemeler',
      devices: 'Cihazlar', alarms: 'Alarmlar', map: 'Harita',
      whatsapp: 'WhatsApp', mikrotik: 'MikroTik'
    };
    var ariaEl = document.getElementById('p-aria-live');
    if (ariaEl) ariaEl.textContent = (pageLabels[hash] || 'Dashboard') + ' sayfasi yukleniyor';

    // Leaflet haritasi temizle (sayfa degistiginde)
    if (hash !== 'map' && _leafletMap) {
      _leafletMap.remove();
      _leafletMap = null;
    }

    switch (hash) {
      case 'dashboard': _renderDashboard(); break;
      case 'subscribers': _renderSubscribers(); break;
      case 'payments': _renderPayments(); break;
      case 'devices': _renderDevices(); break;
      case 'alarms': _renderAlarms(); break;
      case 'map': _renderMap(); break;
      case 'whatsapp': _renderWhatsapp(); break;
      case 'mikrotik': _renderMikrotik(); break;
      default: _renderDashboard();
    }
  }

  // ── Helpers ──
  function _el(id) { return document.getElementById(id); }

  function _formatCurrency(amount) {
    if (amount == null) return '-';
    return Number(amount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL';
  }

  function _formatDate(dateStr) {
    if (!dateStr) return '-';
    var d = new Date(dateStr);
    return d.toLocaleDateString('tr-TR');
  }

  function _formatDateTime(dateStr) {
    if (!dateStr) return '-';
    var d = new Date(dateStr);
    return d.toLocaleDateString('tr-TR') + ' ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  }

  function _formatUptime(seconds) {
    if (!seconds) return '-';
    var d = Math.floor(seconds / 86400);
    var h = Math.floor((seconds % 86400) / 3600);
    if (d > 0) return d + ' gun ' + h + ' saat';
    var m = Math.floor((seconds % 3600) / 60);
    return h + ' saat ' + m + ' dk';
  }

  function _timeAgo(dateStr) {
    if (!dateStr) return '-';
    var now = new Date();
    var d = new Date(dateStr);
    var diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'Az once';
    if (diff < 3600) return Math.floor(diff / 60) + ' dk once';
    if (diff < 86400) return Math.floor(diff / 3600) + ' saat once';
    return Math.floor(diff / 86400) + ' gun once';
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

  function _showLoading(el) {
    el.innerHTML =
      '<div class="p-stat-grid">' +
        '<div class="p-skeleton p-skeleton-card"></div>'.repeat(3) +
      '</div>' +
      '<div style="margin-top:16px">' +
        '<div class="p-skeleton p-skeleton-line" style="width:60%"></div>' +
        '<div class="p-skeleton p-skeleton-line" style="width:80%"></div>' +
        '<div class="p-skeleton p-skeleton-line" style="width:40%"></div>' +
      '</div>';
  }

  function _showModal(html) {
    var overlay = _el('p-modal-overlay');
    var modal = _el('p-modal');
    modal.innerHTML = html;
    overlay.classList.add('active');

    // Backdrop tiklama ile kapatma
    var closeHandler = function(e) {
      if (e.target === overlay) {
        overlay.classList.remove('active');
        overlay.removeEventListener('click', closeHandler);
      }
    };
    overlay.addEventListener('click', closeHandler);
  }

  function _closeModal() {
    var overlay = _el('p-modal-overlay');
    if (overlay) overlay.classList.remove('active');
  }

  function _severityBadge(severity) {
    var colors = { critical: 'red', warning: 'yellow', info: 'blue' };
    var labels = { critical: 'Kritik', warning: 'Uyari', info: 'Bilgi' };
    return '<span class="p-badge p-badge-' + (colors[severity] || 'gray') + '">' + _esc(labels[severity] || severity) + '</span>';
  }

  function _statusBadge(status) {
    if (status === 'online') return '<span class="p-device-status online">Online</span>';
    if (status === 'offline') return '<span class="p-device-status offline">Offline</span>';
    if (status === 'warning') return '<span class="p-device-status warning">Uyari</span>';
    return '<span class="p-badge p-badge-gray">' + _esc(status) + '</span>';
  }

  function _paymentStatusBadge(status) {
    if (status === 'paid') return '<span class="p-badge p-badge-green">Odendi</span>';
    if (status === 'unpaid') return '<span class="p-badge p-badge-red">Odenmedi</span>';
    return '<span class="p-badge p-badge-gray">' + _esc(status) + '</span>';
  }

  function _deviceTypeLabel(type) {
    var labels = { olt: 'OLT', router: 'Router', switch: 'Switch', ap: 'Access Point', antenna: 'Anten' };
    return labels[type] || type;
  }

  function _deviceTypeIcon(type) {
    var icons = { olt: '&#9655;', router: '&#8644;', switch: '&#9783;', ap: '&#9737;', antenna: '&#9880;' };
    return icons[type] || '&#9881;';
  }

  function _actionBadge(action) {
    var map = {
      pppoe_disconnect: { cls: 'disconnect', label: 'Kesinti' },
      pppoe_reconnect: { cls: 'reconnect', label: 'Baglanti' },
      speed_limit: { cls: 'speed_limit', label: 'Hiz Limit' },
      speed_restore: { cls: 'speed_restore', label: 'Hiz Acma' },
      firewall_block: { cls: 'firewall_block', label: 'Engel' },
      firmware_update: { cls: 'firmware_update', label: 'Guncelleme' }
    };
    var info = map[action] || { cls: '', label: action };
    return '<span class="p-action-badge ' + info.cls + '">' + _esc(info.label) + '</span>';
  }

  // ════════════════════════════════════════════════
  // ── DASHBOARD ──
  // ════════════════════════════════════════════════
  async function _renderDashboard() {
    var content = _el('p-content');
    var statsRes, alarmsRes, logRes;
    try {
      statsRes = await AdminApi.getDashboardStats();
      alarmsRes = await AdminApi.getAlarms({ status: 'active' });
      logRes = await AdminApi.getMikrotikLog(5);
    } catch (err) {
      content.innerHTML = '<p class="text-danger">Veri yuklenirken hata olustu.</p>';
      return;
    }
    if (!statsRes.ok) { content.innerHTML = '<p class="text-danger">Dashboard verisi yuklenemedi.</p>'; return; }

    var s = statsRes.data;
    var alarms = alarmsRes.ok ? alarmsRes.data.slice(0, 5) : [];
    var logs = logRes.ok ? logRes.data : [];

    content.innerHTML =
      '<div class="p-section-title"><span class="p-icon">&#9638;</span> Dashboard</div>' +

      // Istatistik kartlari
      '<div class="p-stat-grid" style="grid-template-columns: repeat(auto-fit, minmax(160px, 1fr))">' +
        _statCard('Toplam Abone', s.total_subscribers, null, 'subscribers') +
        _statCard('Aktif Abone', s.active_subscribers, 'text-success', 'subscribers') +
        _statCard('Odenmemis', s.unpaid_subscribers, 'text-danger', 'subscribers') +
        _statCard('Bekleyen Odeme', s.pending_payment_reviews, 'text-warning', 'payments') +
        _statCard('Acik Konusma', s.open_whatsapp_conversations, 'text-info', 'whatsapp') +
        _statCard('MikroTik Islem', s.mikrotik_actions_30d, 'text-dim', 'mikrotik') +
      '</div>' +

      // Son alarmlar ve MikroTik islemleri
      '<div class="p-grid p-grid-2 mt-16">' +
        '<div class="p-card">' +
          '<div class="p-card-header"><span class="p-card-title">Son Alarmlar</span>' +
            '<button class="p-btn p-btn-outline p-btn-sm" onclick="location.hash=\'#alarms\'">Tumu</button>' +
          '</div>' +
          _renderAlarmList(alarms) +
        '</div>' +
        '<div class="p-card">' +
          '<div class="p-card-header"><span class="p-card-title">Son MikroTik Islemleri</span>' +
            '<button class="p-btn p-btn-outline p-btn-sm" onclick="location.hash=\'#mikrotik\'">Tumu</button>' +
          '</div>' +
          _renderLogList(logs) +
        '</div>' +
      '</div>';

    // Stat kart tiklama
    content.querySelectorAll('.p-stat-card[data-page]').forEach(function(card) {
      card.addEventListener('click', function() {
        location.hash = '#' + card.dataset.page;
      });
    });
  }

  function _statCard(label, value, colorClass, page) {
    return '<div class="p-stat-card" data-page="' + _esc(page) + '">' +
      '<div class="p-stat-label">' + _esc(label) + '</div>' +
      '<div class="p-stat-value ' + (colorClass || '') + '">' + _esc(String(value)) + '</div>' +
    '</div>';
  }

  function _renderAlarmList(alarms) {
    if (!alarms || alarms.length === 0) return '<div class="p-empty"><div class="p-empty-text">Aktif alarm yok</div></div>';
    var html = '';
    for (var i = 0; i < alarms.length; i++) {
      var a = alarms[i];
      html += '<div style="padding:8px 0;border-bottom:1px solid var(--p-border);display:flex;justify-content:space-between;align-items:center">' +
        '<div><span class="fw-600">' + _esc(a.device_name) + '</span> ' + _severityBadge(a.severity) +
        '<div class="fs-sm text-dim">' + _esc(a.message).substring(0, 60) + '...</div></div>' +
        '<div class="fs-sm text-muted">' + _timeAgo(a.created_at) + '</div>' +
      '</div>';
    }
    return html;
  }

  function _renderLogList(logs) {
    if (!logs || logs.length === 0) return '<div class="p-empty"><div class="p-empty-text">Islem yok</div></div>';
    var html = '';
    for (var i = 0; i < logs.length; i++) {
      var l = logs[i];
      html += '<div style="padding:8px 0;border-bottom:1px solid var(--p-border);display:flex;justify-content:space-between;align-items:center">' +
        '<div>' + _actionBadge(l.action) + ' <span class="fw-600">' + _esc(l.target_user || l.router_ip) + '</span>' +
        '<div class="fs-sm text-dim">' + _esc(l.reason).substring(0, 50) + '</div></div>' +
        '<div class="fs-sm text-muted">' + _timeAgo(l.timestamp) + '</div>' +
      '</div>';
    }
    return html;
  }

  // ════════════════════════════════════════════════
  // ── ABONELER ──
  // ════════════════════════════════════════════════
  async function _renderSubscribers() {
    var content = _el('p-content');
    content.innerHTML =
      '<div class="p-section-title"><span class="p-icon">&#9787;</span> Abone Yonetimi</div>' +
      '<div class="p-filter-bar">' +
        '<input class="p-input" id="p-sub-search" placeholder="Ara: isim, abone no, telefon..." type="search">' +
        '<select class="p-input" id="p-sub-district">' +
          '<option value="all">Tum Ilceler</option>' +
          '<option value="Merkez">Merkez</option>' +
          '<option value="Ilgaz">Ilgaz</option>' +
          '<option value="Sabanozü">Sabanozü</option>' +
          '<option value="Atkaracalar">Atkaracalar</option>' +
          '<option value="Cerkes">Cerkes</option>' +
        '</select>' +
        '<select class="p-input" id="p-sub-payment">' +
          '<option value="all">Tum Durum</option>' +
          '<option value="paid">Odenmis</option>' +
          '<option value="unpaid">Odenmemis</option>' +
        '</select>' +
        '<button class="p-btn p-btn-outline p-btn-sm" id="p-sub-csv-btn">CSV Import</button>' +
        '<input type="file" id="p-sub-csv-file" accept=".csv" style="display:none">' +
      '</div>' +
      '<div id="p-sub-table-wrap"></div>';

    // CSV import
    _el('p-sub-csv-btn').addEventListener('click', function() { _el('p-sub-csv-file').click(); });
    _el('p-sub-csv-file').addEventListener('change', async function(e) {
      if (e.target.files.length === 0) return;
      var res = await AdminApi.importSubscribersCsv(e.target.files[0]);
      if (res.ok) {
        var d = res.data;
        _showToast('CSV import: ' + d.created + ' olusturuldu, ' + d.updated + ' guncellendi' + (d.errors.length > 0 ? ', ' + d.errors.length + ' hata' : ''), 'success');
        _loadSubscriberTable();
      } else {
        _showToast('Import hatasi: ' + res.error, 'error');
      }
    });

    // Filtre event'leri
    var debounceTimer = null;
    _el('p-sub-search').addEventListener('input', function() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(_loadSubscriberTable, 300);
    });
    _el('p-sub-district').addEventListener('change', _loadSubscriberTable);
    _el('p-sub-payment').addEventListener('change', _loadSubscriberTable);

    _loadSubscriberTable();
  }

  async function _loadSubscriberTable() {
    var wrap = _el('p-sub-table-wrap');
    if (!wrap) return;

    var params = {
      search: (_el('p-sub-search') || {}).value || '',
      district: (_el('p-sub-district') || {}).value || 'all',
      payment_status: (_el('p-sub-payment') || {}).value || 'all'
    };

    var res = await AdminApi.getSubscribers(params);
    if (!res.ok) { wrap.innerHTML = '<p class="text-danger">Aboneler yuklenemedi.</p>'; return; }
    var subs = res.data;

    if (subs.length === 0) {
      wrap.innerHTML = '<div class="p-empty"><div class="p-empty-icon">&#9787;</div><div class="p-empty-text">Sonuc bulunamadi</div></div>';
      return;
    }

    var rows = '';
    for (var i = 0; i < subs.length; i++) {
      var s = subs[i];
      rows += '<tr class="p-clickable" data-abone="' + _esc(s.abone_no) + '">' +
        '<td>' + _esc(s.abone_no) + '</td>' +
        '<td class="fw-600">' + _esc(s.full_name) + '</td>' +
        '<td>' + _esc(s.phone) + '</td>' +
        '<td>' + _esc(s.district) + '</td>' +
        '<td>' + _esc(s.package_name) + '</td>' +
        '<td>' + (s.is_active ? '<span class="p-badge p-badge-green">Aktif</span>' : '<span class="p-badge p-badge-red">Pasif</span>') + '</td>' +
        '<td>' + _paymentStatusBadge(s.payment_status) + '</td>' +
      '</tr>';
    }

    wrap.innerHTML =
      '<div class="p-table-wrap"><table class="p-table"><thead><tr>' +
        '<th>Abone No</th><th>Ad Soyad</th><th>Telefon</th><th>Ilce</th><th>Paket</th><th>Durum</th><th>Odeme</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<div class="fs-sm text-dim mt-8">Toplam: ' + res.total + ' abone</div>';

    wrap.querySelectorAll('.p-clickable').forEach(function(row) {
      row.addEventListener('click', function() { _showSubscriberDetail(row.dataset.abone); });
    });
  }

  async function _showSubscriberDetail(abone_no) {
    var res = await AdminApi.getSubscriber(abone_no);
    if (!res.ok) { _showToast('Abone detayi yuklenemedi.', 'error'); return; }
    var s = res.data;

    // Cihaz listesi
    var devHtml = '';
    if (s.devices && s.devices.length > 0) {
      for (var i = 0; i < s.devices.length; i++) {
        var d = s.devices[i];
        devHtml += '<div style="padding:4px 0" class="fs-sm">' + _esc(d.name) + ' (' + _esc(d.ip_address) + ') ' + _statusBadge(d.status) + '</div>';
      }
    } else {
      devHtml = '<div class="fs-sm text-dim">Atanmis cihaz yok</div>';
    }

    // Aktif alarm listesi
    var almHtml = '';
    if (s.active_alarms && s.active_alarms.length > 0) {
      for (var j = 0; j < s.active_alarms.length; j++) {
        var a = s.active_alarms[j];
        almHtml += '<div style="padding:4px 0" class="fs-sm">' + _severityBadge(a.severity) + ' ' + _esc(a.message).substring(0, 50) + '</div>';
      }
    } else {
      almHtml = '<div class="fs-sm text-dim">Aktif alarm yok</div>';
    }

    _showModal(
      '<div class="p-modal-title">' + _esc(s.full_name) + ' <span class="fs-sm text-dim">(' + _esc(s.abone_no) + ')</span></div>' +
      '<div class="p-grid p-grid-2" style="gap:16px">' +
        '<div>' +
          '<div class="fs-sm text-dim mb-8">Iletisim</div>' +
          '<div class="fs-sm">' + _esc(s.phone) + '</div>' +
          '<div class="fs-sm text-dim mt-8">' + _esc(s.address) + '</div>' +
          '<div class="fs-sm text-dim">' + _esc(s.district) + ' / ' + _esc(s.village) + '</div>' +
        '</div>' +
        '<div>' +
          '<div class="fs-sm text-dim mb-8">Abonelik</div>' +
          '<div class="fs-sm">Paket: <span class="fw-600">' + _esc(s.package_name) + '</span> (' + _esc(s.package_speed) + ')</div>' +
          '<div class="fs-sm">Baglanti: ' + _esc(s.connection_type) + '</div>' +
          '<div class="fs-sm">Baslangic: ' + _formatDate(s.start_date) + '</div>' +
          '<div class="fs-sm mt-8">Durum: ' + (s.is_active ? '<span class="p-badge p-badge-green">Aktif</span>' : '<span class="p-badge p-badge-red">Pasif</span>') + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="p-grid p-grid-2 mt-16" style="gap:16px">' +
        '<div>' +
          '<div class="fs-sm text-dim mb-8">MikroTik</div>' +
          '<div class="fs-sm">User: ' + _esc(s.mikrotik_user) + '</div>' +
          '<div class="fs-sm">IP: ' + _esc(s.mikrotik_ip) + '</div>' +
          '<div class="fs-sm">Router: ' + _esc(s.mikrotik_router) + '</div>' +
        '</div>' +
        '<div>' +
          '<div class="fs-sm text-dim mb-8">Odeme</div>' +
          '<div class="fs-sm">' + _paymentStatusBadge(s.payment_status) + ' ' + _formatCurrency(s.payment_amount) + '/ay</div>' +
          '<div class="fs-sm">Bakiye: <span class="' + (s.balance < 0 ? 'text-danger fw-600' : 'text-success') + '">' + _formatCurrency(s.balance) + '</span></div>' +
        '</div>' +
      '</div>' +
      '<div class="mt-16"><div class="fs-sm text-dim mb-8">Bagli Cihazlar</div>' + devHtml + '</div>' +
      '<div class="mt-16"><div class="fs-sm text-dim mb-8">Aktif Alarmlar</div>' + almHtml + '</div>' +
      '<div class="p-modal-actions">' +
        '<button class="p-btn p-btn-outline p-btn-sm" id="p-modal-close">Kapat</button>' +
      '</div>'
    );

    _el('p-modal-close').addEventListener('click', _closeModal);
  }

  // ════════════════════════════════════════════════
  // ── ODEMELER ──
  // ════════════════════════════════════════════════
  async function _renderPayments() {
    var content = _el('p-content');
    content.innerHTML =
      '<div class="p-section-title"><span class="p-icon">&#8378;</span> Odeme Yonetimi</div>' +
      '<div class="p-tabs">' +
        '<button class="p-tab active" data-tab="pending">Onay Bekleyen</button>' +
      '</div>' +
      '<div id="p-payment-content"></div>';

    _loadPendingPayments();
  }

  async function _loadPendingPayments() {
    var el = _el('p-payment-content');
    if (!el) return;

    var res = await AdminApi.getPendingPayments();
    if (!res.ok) { el.innerHTML = '<p class="text-danger">Odemeler yuklenemedi.</p>'; return; }
    var payments = res.data;

    if (payments.length === 0) {
      el.innerHTML = '<div class="p-empty"><div class="p-empty-icon">&#10003;</div><div class="p-empty-text">Onay bekleyen odeme yok</div></div>';
      return;
    }

    var rows = '';
    for (var i = 0; i < payments.length; i++) {
      var p = payments[i];
      var matchColor = p.match_score >= 0.9 ? 'var(--p-success)' : p.match_score >= 0.7 ? 'var(--p-warning)' : 'var(--p-danger)';
      var matchPct = Math.round(p.match_score * 100);

      rows += '<tr>' +
        '<td>' + _formatDateTime(p.date) + '</td>' +
        '<td class="fw-600">' + _esc(p.sender_name) + '</td>' +
        '<td class="fw-600">' + _formatCurrency(p.amount) + '</td>' +
        '<td>' +
          (p.matched_subscriber_name
            ? _esc(p.matched_subscriber_name) + ' <span class="fs-sm text-dim">(' + _esc(p.matched_subscriber_abone_no) + ')</span>'
            : '<span class="text-dim">Eslestirilemedi</span>') +
        '</td>' +
        '<td>' +
          '<div class="p-match-score">' +
            '<div class="p-match-score-bar"><div class="p-match-score-fill" style="width:' + matchPct + '%;background:' + matchColor + '"></div></div>' +
            '<span class="p-match-score-text">%' + matchPct + '</span>' +
          '</div>' +
        '</td>' +
        '<td>' +
          '<div class="flex gap-8">' +
            '<button class="p-btn p-btn-success p-btn-sm p-pay-approve" data-tx="' + _esc(p.tx_id) + '" data-sub="' + (p.matched_subscriber_id || '') + '">Onayla</button>' +
            '<button class="p-btn p-btn-danger p-btn-sm p-pay-reject" data-tx="' + _esc(p.tx_id) + '">Reddet</button>' +
          '</div>' +
        '</td>' +
      '</tr>';
    }

    el.innerHTML =
      '<div class="p-table-wrap"><table class="p-table"><thead><tr>' +
        '<th>Tarih</th><th>Gonderen</th><th>Tutar</th><th>Onerilen Abone</th><th>Eslesme</th><th>Islem</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div>';

    // Onayla/Reddet butonlari
    el.querySelectorAll('.p-pay-approve').forEach(function(btn) {
      btn.addEventListener('click', async function() {
        var txId = btn.dataset.tx;
        var subId = btn.dataset.sub ? parseInt(btn.dataset.sub) : null;
        var res = await AdminApi.approvePayment(txId, subId);
        if (res.ok) {
          _showToast('Odeme onaylandi.', 'success');
          _loadPendingPayments();
        } else {
          _showToast('Hata: ' + res.error, 'error');
        }
      });
    });

    el.querySelectorAll('.p-pay-reject').forEach(function(btn) {
      btn.addEventListener('click', async function() {
        var txId = btn.dataset.tx;
        var res = await AdminApi.rejectPayment(txId);
        if (res.ok) {
          _showToast('Odeme reddedildi.', 'info');
          _loadPendingPayments();
        } else {
          _showToast('Hata: ' + res.error, 'error');
        }
      });
    });
  }

  // ════════════════════════════════════════════════
  // ── CIHAZLAR ──
  // ════════════════════════════════════════════════
  async function _renderDevices() {
    var content = _el('p-content');
    content.innerHTML =
      '<div class="p-section-title"><span class="p-icon">&#9881;</span> Cihaz Yonetimi</div>' +
      '<div class="p-filter-bar">' +
        '<select class="p-input" id="p-dev-type">' +
          '<option value="all">Tum Tipler</option>' +
          '<option value="olt">OLT</option>' +
          '<option value="router">Router</option>' +
          '<option value="switch">Switch</option>' +
          '<option value="ap">Access Point</option>' +
          '<option value="antenna">Anten</option>' +
        '</select>' +
        '<select class="p-input" id="p-dev-status">' +
          '<option value="all">Tum Durum</option>' +
          '<option value="online">Online</option>' +
          '<option value="offline">Offline</option>' +
          '<option value="warning">Uyari</option>' +
        '</select>' +
        '<button class="p-btn p-btn-primary p-btn-sm" id="p-dev-new" style="width:auto">+ Yeni Cihaz</button>' +
      '</div>' +
      '<div id="p-dev-grid"></div>';

    _el('p-dev-type').addEventListener('change', _loadDeviceGrid);
    _el('p-dev-status').addEventListener('change', _loadDeviceGrid);
    _el('p-dev-new').addEventListener('click', _showNewDeviceModal);

    _loadDeviceGrid();
  }

  async function _loadDeviceGrid() {
    var grid = _el('p-dev-grid');
    if (!grid) return;

    var params = {
      type: (_el('p-dev-type') || {}).value || 'all',
      status: (_el('p-dev-status') || {}).value || 'all'
    };

    var res = await AdminApi.getDevices(params);
    if (!res.ok) { grid.innerHTML = '<p class="text-danger">Cihazlar yuklenemedi.</p>'; return; }
    var devices = res.data;

    if (devices.length === 0) {
      grid.innerHTML = '<div class="p-empty"><div class="p-empty-icon">&#9881;</div><div class="p-empty-text">Cihaz bulunamadi</div></div>';
      return;
    }

    var html = '<div class="p-device-grid">';
    for (var i = 0; i < devices.length; i++) {
      var d = devices[i];
      html += '<div class="p-device-card" data-dev-id="' + _esc(d.id) + '">' +
        '<div class="p-device-card-header">' +
          '<div style="display:flex;align-items:center;gap:10px">' +
            '<div class="p-device-type-icon">' + _deviceTypeIcon(d.device_type) + '</div>' +
            '<div>' +
              '<div class="p-device-card-name">' + _esc(d.name) + '</div>' +
              '<div class="fs-sm text-dim">' + _esc(d.brand) + ' ' + _esc(d.model) + '</div>' +
            '</div>' +
          '</div>' +
          _statusBadge(d.status) +
        '</div>' +
        '<div class="p-device-card-info">' +
          'IP: ' + _esc(d.ip_address) + '<br>' +
          'Tip: ' + _esc(_deviceTypeLabel(d.device_type)) +
          (d.building_id ? '<br>Bina: ' + _esc(d.building_id) : '') +
          (d.ada_code ? ' | Ada: ' + _esc(d.ada_code) : '') +
        '</div>' +
      '</div>';
    }
    html += '</div>';
    grid.innerHTML = html;

    grid.querySelectorAll('.p-device-card').forEach(function(card) {
      card.addEventListener('click', function() { _showDeviceDetail(card.dataset.devId); });
    });
  }

  async function _showDeviceDetail(deviceId) {
    var res = await AdminApi.getDevice(deviceId);
    if (!res.ok) { _showToast('Cihaz detayi yuklenemedi.', 'error'); return; }
    var d = res.data;

    // Alarm gecmisi
    var almHtml = '';
    if (d.alarms && d.alarms.length > 0) {
      for (var i = 0; i < d.alarms.length; i++) {
        var a = d.alarms[i];
        almHtml += '<div style="padding:4px 0" class="fs-sm">' +
          _severityBadge(a.severity) + ' ' + _esc(a.message).substring(0, 60) +
          (a.resolved ? ' <span class="p-badge p-badge-green">Cozuldu</span>' : '') +
        '</div>';
      }
    } else {
      almHtml = '<div class="fs-sm text-dim">Alarm gecmisi yok</div>';
    }

    // Bagli aboneler (router ise)
    var subHtml = '';
    if (d.subscribers && d.subscribers.length > 0) {
      subHtml = '<div class="p-table-wrap mt-8"><table class="p-table"><thead><tr><th>Abone</th><th>IP</th><th>Durum</th></tr></thead><tbody>';
      for (var j = 0; j < d.subscribers.length; j++) {
        var s = d.subscribers[j];
        subHtml += '<tr><td>' + _esc(s.full_name) + ' <span class="text-dim fs-sm">(' + _esc(s.abone_no) + ')</span></td>' +
          '<td>' + _esc(s.mikrotik_ip) + '</td>' +
          '<td>' + (s.is_active ? '<span class="p-badge p-badge-green">Aktif</span>' : '<span class="p-badge p-badge-red">Pasif</span>') + '</td></tr>';
      }
      subHtml += '</tbody></table></div>';
    }

    _showModal(
      '<div class="p-modal-title">' + _esc(d.name) + ' ' + _statusBadge(d.status) + '</div>' +
      '<div class="p-grid p-grid-2" style="gap:16px">' +
        '<div>' +
          '<div class="fs-sm text-dim mb-8">Cihaz Bilgileri</div>' +
          '<div class="fs-sm">Tip: ' + _esc(_deviceTypeLabel(d.device_type)) + '</div>' +
          '<div class="fs-sm">Marka/Model: ' + _esc(d.brand) + ' ' + _esc(d.model) + '</div>' +
          '<div class="fs-sm">IP: ' + _esc(d.ip_address) + '</div>' +
          '<div class="fs-sm">MAC: ' + _esc(d.mac_address) + '</div>' +
          (d.frequency ? '<div class="fs-sm">Frekans: ' + _esc(d.frequency) + '</div>' : '') +
        '</div>' +
        '<div>' +
          '<div class="fs-sm text-dim mb-8">Metrikler</div>' +
          '<div class="fs-sm">Uptime: ' + _formatUptime(d.uptime) + '</div>' +
          (d.cpu_usage != null ? '<div class="fs-sm">CPU: <span class="' + (d.cpu_usage > 80 ? 'text-danger' : '') + '">' + d.cpu_usage + '%</span></div>' : '') +
          (d.ram_usage != null ? '<div class="fs-sm">RAM: ' + d.ram_usage + '%</div>' : '') +
          (d.building_id ? '<div class="fs-sm mt-8">Bina: ' + _esc(d.building_id) + '</div>' : '') +
          (d.ada_code ? '<div class="fs-sm">Ada: ' + _esc(d.ada_code) + '</div>' : '') +
        '</div>' +
      '</div>' +
      '<div class="mt-16"><div class="fs-sm text-dim mb-8">Alarm Gecmisi</div>' + almHtml + '</div>' +
      (subHtml ? '<div class="mt-16"><div class="fs-sm text-dim mb-8">Bagli Aboneler</div>' + subHtml + '</div>' : '') +
      '<div class="p-modal-actions">' +
        '<button class="p-btn p-btn-outline p-btn-sm" id="p-modal-close">Kapat</button>' +
        '<button class="p-btn p-btn-danger p-btn-sm" id="p-dev-delete" data-id="' + _esc(d.id) + '">Sil</button>' +
      '</div>'
    );

    _el('p-modal-close').addEventListener('click', _closeModal);
    _el('p-dev-delete').addEventListener('click', async function() {
      if (!confirm('Bu cihazi silmek istediginize emin misiniz?')) return;
      var r = await AdminApi.deleteDevice(d.id);
      if (r.ok) {
        _showToast('Cihaz silindi.', 'success');
        _closeModal();
        _loadDeviceGrid();
      } else {
        _showToast('Hata: ' + r.error, 'error');
      }
    });
  }

  function _showNewDeviceModal() {
    _showModal(
      '<div class="p-modal-title">Yeni Cihaz Ekle</div>' +
      '<div class="p-form-row">' +
        '<div class="p-form-group"><label>Cihaz Adi</label><input class="p-input" id="p-ndev-name" placeholder="MikroTik-YeniPOP" maxlength="64"></div>' +
        '<div class="p-form-group"><label>Cihaz Tipi</label><select class="p-input" id="p-ndev-type">' +
          '<option value="router">Router</option><option value="olt">OLT</option><option value="switch">Switch</option><option value="ap">Access Point</option><option value="antenna">Anten</option>' +
        '</select></div>' +
      '</div>' +
      '<div class="p-form-row">' +
        '<div class="p-form-group"><label>Marka</label><input class="p-input" id="p-ndev-brand" placeholder="MikroTik" maxlength="32"></div>' +
        '<div class="p-form-group"><label>Model</label><input class="p-input" id="p-ndev-model" placeholder="CCR1009-7G-1C-1S+" maxlength="64"></div>' +
      '</div>' +
      '<div class="p-form-row">' +
        '<div class="p-form-group"><label>IP Adresi</label><input class="p-input" id="p-ndev-ip" placeholder="10.0.0.10" maxlength="15"></div>' +
        '<div class="p-form-group"><label>MAC Adresi</label><input class="p-input" id="p-ndev-mac" placeholder="AA:BB:CC:DD:EE:FF" maxlength="17"></div>' +
      '</div>' +
      '<div class="p-form-row">' +
        '<div class="p-form-group"><label>Enlem (Lat)</label><input class="p-input" id="p-ndev-lat" placeholder="40.6013" type="number" step="0.0001"></div>' +
        '<div class="p-form-group"><label>Boylam (Lng)</label><input class="p-input" id="p-ndev-lng" placeholder="33.6134" type="number" step="0.0001"></div>' +
      '</div>' +
      '<div class="p-form-row">' +
        '<div class="p-form-group"><label>Frekans (opsiyonel)</label><input class="p-input" id="p-ndev-freq" placeholder="5 GHz" maxlength="20"></div>' +
        '<div class="p-form-group"><label>Sinyal Esigi (dBm, opsiyonel)</label><input class="p-input" id="p-ndev-signal" placeholder="-70" type="number"></div>' +
      '</div>' +
      '<div class="p-modal-actions">' +
        '<button class="p-btn p-btn-outline p-btn-sm" id="p-modal-close">Vazgec</button>' +
        '<button class="p-btn p-btn-primary p-btn-sm" id="p-ndev-save" style="width:auto">Kaydet</button>' +
      '</div>'
    );

    _el('p-modal-close').addEventListener('click', _closeModal);
    _el('p-ndev-save').addEventListener('click', async function() {
      var name = (_el('p-ndev-name').value || '').trim();
      var ip = (_el('p-ndev-ip').value || '').trim();
      if (!name || !ip) { _showToast('Cihaz adi ve IP adresi zorunlu.', 'error'); return; }

      var data = {
        name: name,
        device_type: _el('p-ndev-type').value,
        brand: (_el('p-ndev-brand').value || '').trim(),
        model: (_el('p-ndev-model').value || '').trim(),
        ip_address: ip,
        mac_address: (_el('p-ndev-mac').value || '').trim(),
        lat: parseFloat(_el('p-ndev-lat').value) || null,
        lng: parseFloat(_el('p-ndev-lng').value) || null,
        frequency: (_el('p-ndev-freq').value || '').trim() || null,
        signal_threshold: parseInt(_el('p-ndev-signal').value) || null
      };

      var res = await AdminApi.createDevice(data);
      if (res.ok) {
        _showToast('Cihaz olusturuldu: ' + res.data.id, 'success');
        _closeModal();
        _loadDeviceGrid();
      } else {
        _showToast('Hata: ' + res.error, 'error');
      }
    });
  }

  // ════════════════════════════════════════════════
  // ── ALARMLAR ──
  // ════════════════════════════════════════════════
  async function _renderAlarms() {
    var content = _el('p-content');
    content.innerHTML =
      '<div class="p-section-title"><span class="p-icon">&#9888;</span> Alarm Yonetimi</div>' +
      '<div id="p-alarm-summary"></div>' +
      '<div class="p-tabs">' +
        '<button class="p-tab active" data-tab="active">Aktif</button>' +
        '<button class="p-tab" data-tab="resolved">Cozulmus</button>' +
      '</div>' +
      '<div id="p-alarm-content"></div>';

    // Ozet yukleme
    var summaryRes = await AdminApi.getAlarmSummary();
    if (summaryRes.ok) {
      var sm = summaryRes.data;
      _el('p-alarm-summary').innerHTML =
        '<div class="p-alarm-summary">' +
          '<div class="p-alarm-summary-item critical"><div><div class="p-alarm-summary-count text-danger">' + sm.critical + '</div><div class="p-alarm-summary-label">Kritik</div></div></div>' +
          '<div class="p-alarm-summary-item warning"><div><div class="p-alarm-summary-count text-warning">' + sm.warning + '</div><div class="p-alarm-summary-label">Uyari</div></div></div>' +
          '<div class="p-alarm-summary-item info"><div><div class="p-alarm-summary-count text-info">' + sm.info + '</div><div class="p-alarm-summary-label">Bilgi</div></div></div>' +
        '</div>';
    }

    // Tab event
    content.querySelectorAll('.p-tab').forEach(function(t) {
      t.addEventListener('click', function() {
        content.querySelectorAll('.p-tab').forEach(function(x) { x.classList.remove('active'); });
        t.classList.add('active');
        _loadAlarmList(t.dataset.tab);
      });
    });

    _loadAlarmList('active');
  }

  async function _loadAlarmList(status) {
    var el = _el('p-alarm-content');
    if (!el) return;

    var res = await AdminApi.getAlarms({ status: status });
    if (!res.ok) { el.innerHTML = '<p class="text-danger">Alarmlar yuklenemedi.</p>'; return; }
    var alarms = res.data;

    if (alarms.length === 0) {
      el.innerHTML = '<div class="p-empty"><div class="p-empty-icon">&#10003;</div><div class="p-empty-text">' +
        (status === 'active' ? 'Aktif alarm yok' : 'Cozulmus alarm yok') + '</div></div>';
      return;
    }

    var rows = '';
    for (var i = 0; i < alarms.length; i++) {
      var a = alarms[i];
      var affectedCount = a.affected_subscriber_ids ? a.affected_subscriber_ids.length : 0;

      rows += '<tr>' +
        '<td class="fw-600">' + _esc(a.device_name) + '</td>' +
        '<td>' + _esc(a.alarm_type.replace(/_/g, ' ')) + '</td>' +
        '<td>' + _severityBadge(a.severity) + '</td>' +
        '<td class="fs-sm">' + _esc(a.message).substring(0, 60) + '</td>' +
        '<td>' + _timeAgo(a.created_at) + '</td>' +
        '<td>' + (affectedCount > 0 ? '<span class="p-badge p-badge-red">' + affectedCount + ' abone</span>' : '-') + '</td>' +
        '<td>';

      if (!a.resolved) {
        rows += '<div class="flex gap-8">';
        if (!a.acknowledged) {
          rows += '<button class="p-btn p-btn-outline p-btn-sm p-alm-ack" data-id="' + _esc(a.id) + '">Onayla</button>';
        }
        rows += '<button class="p-btn p-btn-success p-btn-sm p-alm-resolve" data-id="' + _esc(a.id) + '">Coz</button>';
        rows += '</div>';
      } else {
        rows += '<span class="p-badge p-badge-green">Cozuldu</span>';
        if (a.resolved_note) rows += '<div class="fs-sm text-dim mt-8">' + _esc(a.resolved_note) + '</div>';
      }

      rows += '</td></tr>';
    }

    el.innerHTML =
      '<div class="p-table-wrap"><table class="p-table"><thead><tr>' +
        '<th>Cihaz</th><th>Tip</th><th>Seviye</th><th>Mesaj</th><th>Zaman</th><th>Etkilenen</th><th>Islem</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div>';

    // Acknowledge butonlari
    el.querySelectorAll('.p-alm-ack').forEach(function(btn) {
      btn.addEventListener('click', async function() {
        var r = await AdminApi.acknowledgeAlarm(btn.dataset.id);
        if (r.ok) { _showToast('Alarm onaylandi.', 'info'); _loadAlarmList(status); }
      });
    });

    // Resolve butonlari
    el.querySelectorAll('.p-alm-resolve').forEach(function(btn) {
      btn.addEventListener('click', function() {
        _showResolveModal(btn.dataset.id, status);
      });
    });
  }

  function _showResolveModal(alarmId, currentTab) {
    _showModal(
      '<div class="p-modal-title">Alarmi Coz</div>' +
      '<div class="p-form-group">' +
        '<label>Cozum Notu</label>' +
        '<textarea class="p-input" id="p-resolve-note" rows="3" placeholder="Sorunun nasil cozuldugunu aciklayin..." maxlength="500"></textarea>' +
      '</div>' +
      '<div class="p-modal-actions">' +
        '<button class="p-btn p-btn-outline p-btn-sm" id="p-modal-close">Vazgec</button>' +
        '<button class="p-btn p-btn-success p-btn-sm" id="p-resolve-save" style="width:auto">Coz ve Kapat</button>' +
      '</div>'
    );

    _el('p-modal-close').addEventListener('click', _closeModal);
    _el('p-resolve-save').addEventListener('click', async function() {
      var note = (_el('p-resolve-note').value || '').trim();
      var r = await AdminApi.resolveAlarm(alarmId, note);
      if (r.ok) {
        _showToast('Alarm cozuldu.', 'success');
        _closeModal();
        _loadAlarmList(currentTab);
        // Ozeti guncelle
        var summaryRes = await AdminApi.getAlarmSummary();
        if (summaryRes.ok) {
          var sm = summaryRes.data;
          var sumEl = _el('p-alarm-summary');
          if (sumEl) {
            sumEl.innerHTML =
              '<div class="p-alarm-summary">' +
                '<div class="p-alarm-summary-item critical"><div><div class="p-alarm-summary-count text-danger">' + sm.critical + '</div><div class="p-alarm-summary-label">Kritik</div></div></div>' +
                '<div class="p-alarm-summary-item warning"><div><div class="p-alarm-summary-count text-warning">' + sm.warning + '</div><div class="p-alarm-summary-label">Uyari</div></div></div>' +
                '<div class="p-alarm-summary-item info"><div><div class="p-alarm-summary-count text-info">' + sm.info + '</div><div class="p-alarm-summary-label">Bilgi</div></div></div>' +
              '</div>';
          }
        }
      } else {
        _showToast('Hata: ' + r.error, 'error');
      }
    });
  }

  // ════════════════════════════════════════════════
  // ── HARITA ──
  // ════════════════════════════════════════════════
  async function _renderMap() {
    var content = _el('p-content');
    content.innerHTML =
      '<div class="p-section-title"><span class="p-icon">&#9873;</span> Cihaz Haritasi</div>' +
      '<div class="p-map-container" id="p-map-div"></div>';

    // Leaflet kontrolu
    if (typeof L === 'undefined') {
      content.innerHTML += '<p class="text-danger mt-16">Leaflet kutuphanesi yuklenemedi. Internet baglantinizi kontrol edin.</p>';
      return;
    }

    // Haritayi baslat — Cankiri merkez
    setTimeout(async function() {
      var mapDiv = _el('p-map-div');
      if (!mapDiv) return;

      _leafletMap = L.map(mapDiv).setView([40.6013, 33.6134], 10);

      // Esri World Imagery
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Esri World Imagery',
        maxZoom: 19
      }).addTo(_leafletMap);

      // Cihazlari yukle
      var res = await AdminApi.getDevices();
      if (!res.ok) return;
      var devices = res.data;

      for (var i = 0; i < devices.length; i++) {
        var d = devices[i];
        if (!d.lat || !d.lng) continue;

        var color = d.status === 'online' ? '#22c55e' : d.status === 'offline' ? '#ef4444' : '#f59e0b';
        var radius = d.device_type === 'olt' ? 10 : d.device_type === 'router' ? 8 : 6;

        var marker = L.circleMarker([d.lat, d.lng], {
          radius: radius,
          fillColor: color,
          color: '#fff',
          weight: 2,
          fillOpacity: 0.9
        }).addTo(_leafletMap);

        marker.bindPopup(
          '<div style="font-family:Inter,sans-serif;font-size:13px">' +
            '<strong>' + _esc(d.name) + '</strong><br>' +
            _esc(_deviceTypeLabel(d.device_type)) + ' | ' + _esc(d.brand) + ' ' + _esc(d.model) + '<br>' +
            'IP: ' + _esc(d.ip_address) + '<br>' +
            'Durum: ' + (d.status === 'online' ? 'Online' : d.status === 'offline' ? 'Offline' : 'Uyari') +
          '</div>'
        );
      }

      // Harita boyutunu guncelle (container gorunur oldugunda)
      _leafletMap.invalidateSize();
    }, 100);
  }

  // ════════════════════════════════════════════════
  // ── WHATSAPP ──
  // ════════════════════════════════════════════════
  async function _renderWhatsapp() {
    var content = _el('p-content');
    content.innerHTML =
      '<div class="p-section-title"><span class="p-icon">&#9993;</span> WhatsApp Konusmalari</div>' +
      '<div class="p-tabs">' +
        '<button class="p-tab active" data-tab="open">Acik</button>' +
        '<button class="p-tab" data-tab="resolved">Cozulmus</button>' +
        '<button class="p-tab" data-tab="all">Tumu</button>' +
      '</div>' +
      '<div id="p-wa-content"></div>';

    content.querySelectorAll('.p-tab').forEach(function(t) {
      t.addEventListener('click', function() {
        content.querySelectorAll('.p-tab').forEach(function(x) { x.classList.remove('active'); });
        t.classList.add('active');
        _loadConversations(t.dataset.tab);
      });
    });

    _loadConversations('open');
  }

  async function _loadConversations(status) {
    var el = _el('p-wa-content');
    if (!el) return;

    var res = await AdminApi.getConversations(status);
    if (!res.ok) { el.innerHTML = '<p class="text-danger">Konusmalar yuklenemedi.</p>'; return; }
    var convos = res.data;

    if (convos.length === 0) {
      el.innerHTML = '<div class="p-empty"><div class="p-empty-icon">&#9993;</div><div class="p-empty-text">Konusma yok</div></div>';
      return;
    }

    var html = '<div class="p-card" style="padding:0">';
    for (var i = 0; i < convos.length; i++) {
      var c = convos[i];
      html += '<div class="p-conversation-item">' +
        '<div class="p-conversation-left">' +
          '<div class="p-conversation-name">' + _esc(c.subscriber_name) + '</div>' +
          '<div class="p-conversation-phone">' + _esc(c.phone) + '</div>' +
          '<div class="p-conversation-preview">' + _esc(c.last_message) + '</div>' +
        '</div>' +
        '<div class="p-conversation-right">' +
          '<div class="p-conversation-date">' + _timeAgo(c.last_message_date) + '</div>' +
          (c.status === 'open'
            ? '<div class="p-conversation-count">' + c.message_count + '</div>' +
              '<button class="p-btn p-btn-outline p-btn-sm p-wa-resolve" data-id="' + _esc(c.id) + '">Cozumle</button>'
            : '<span class="p-badge p-badge-green">Cozuldu</span>') +
        '</div>' +
      '</div>';
    }
    html += '</div>';
    el.innerHTML = html;

    el.querySelectorAll('.p-wa-resolve').forEach(function(btn) {
      btn.addEventListener('click', async function(e) {
        e.stopPropagation();
        var r = await AdminApi.resolveConversation(btn.dataset.id);
        if (r.ok) {
          _showToast('Konusma cozumlendi.', 'success');
          _loadConversations(status);
        }
      });
    });
  }

  // ════════════════════════════════════════════════
  // ── MIKROTIK ──
  // ════════════════════════════════════════════════
  async function _renderMikrotik() {
    var content = _el('p-content');
    content.innerHTML =
      '<div class="p-section-title"><span class="p-icon">&#8644;</span> MikroTik Yonetimi</div>' +
      '<div class="p-tabs">' +
        '<button class="p-tab active" data-tab="routers">Router Istatistikleri</button>' +
        '<button class="p-tab" data-tab="sessions">Aktif Sessionlar</button>' +
        '<button class="p-tab" data-tab="log">Islem Gecmisi</button>' +
      '</div>' +
      '<div id="p-mk-content"></div>';

    content.querySelectorAll('.p-tab').forEach(function(t) {
      t.addEventListener('click', function() {
        content.querySelectorAll('.p-tab').forEach(function(x) { x.classList.remove('active'); });
        t.classList.add('active');
        var tab = t.dataset.tab;
        if (tab === 'routers') _loadRouterStats();
        else if (tab === 'sessions') _loadActiveSessions();
        else _loadMikrotikLog();
      });
    });

    _loadRouterStats();
  }

  async function _loadRouterStats() {
    var el = _el('p-mk-content');
    if (!el) return;

    // Tum router'lari bul
    var devRes = await AdminApi.getDevices({ type: 'router' });
    if (!devRes.ok) { el.innerHTML = '<p class="text-danger">Router bilgisi yuklenemedi.</p>'; return; }
    var routers = devRes.data;

    var html = '';
    for (var i = 0; i < routers.length; i++) {
      var r = routers[i];
      var statsRes = await AdminApi.getRouterStats(r.ip_address);
      if (!statsRes.ok) continue;
      var st = statsRes.data;

      var cpuColor = st.cpu_usage > 80 ? 'text-danger' : st.cpu_usage > 50 ? 'text-warning' : 'text-success';
      var ramColor = st.ram_usage > 80 ? 'text-danger' : st.ram_usage > 50 ? 'text-warning' : 'text-success';

      html += '<div class="p-card mb-16">' +
        '<div class="p-card-header"><span class="p-card-title">' + _esc(st.name) + '</span>' + _statusBadge(r.status) + '</div>' +
        '<div class="fs-sm text-dim mb-8">' + _esc(st.model) + ' | ' + _esc(st.ip) + ' | ' + _esc(st.version) + '</div>' +
        '<div class="p-router-stats">' +
          '<div class="p-router-stat"><div class="p-router-stat-value ' + cpuColor + '">' + st.cpu_usage + '%</div><div class="p-router-stat-label">CPU</div></div>' +
          '<div class="p-router-stat"><div class="p-router-stat-value ' + ramColor + '">' + st.ram_usage + '%</div><div class="p-router-stat-label">RAM</div></div>' +
          '<div class="p-router-stat"><div class="p-router-stat-value">' + _formatUptime(st.uptime) + '</div><div class="p-router-stat-label">Uptime</div></div>' +
          '<div class="p-router-stat"><div class="p-router-stat-value text-info">' + st.active_sessions + '</div><div class="p-router-stat-label">Sessionlar</div></div>' +
        '</div>';

      // Interface istatistikleri
      if (st.interfaces && st.interfaces.length > 0) {
        html += '<div class="p-table-wrap"><table class="p-table"><thead><tr><th>Interface</th><th>RX</th><th>TX</th><th>Durum</th></tr></thead><tbody>';
        for (var j = 0; j < st.interfaces.length; j++) {
          var iface = st.interfaces[j];
          html += '<tr><td class="fw-600">' + _esc(iface.name) + '</td><td>' + _esc(iface.rx_rate) + '</td><td>' + _esc(iface.tx_rate) + '</td>' +
            '<td>' + (iface.status === 'up' ? '<span class="p-badge p-badge-green">Up</span>' : '<span class="p-badge p-badge-red">Down</span>') + '</td></tr>';
        }
        html += '</tbody></table></div>';
      }

      html += '</div>';
    }

    el.innerHTML = html || '<div class="p-empty"><div class="p-empty-text">Router bulunamadi</div></div>';
  }

  async function _loadActiveSessions() {
    var el = _el('p-mk-content');
    if (!el) return;

    // Ilk online router'in session'larini goster (secim eklenebilir)
    var devRes = await AdminApi.getDevices({ type: 'router', status: 'online' });
    if (!devRes.ok) { el.innerHTML = '<p class="text-danger">Router bilgisi yuklenemedi.</p>'; return; }
    var routers = devRes.data;

    // Router secici
    var selectHtml = '<div class="p-form-group mb-16"><label>Router Sec</label><select class="p-input" id="p-mk-router-select">';
    for (var i = 0; i < routers.length; i++) {
      selectHtml += '<option value="' + _esc(routers[i].ip_address) + '">' + _esc(routers[i].name) + ' (' + _esc(routers[i].ip_address) + ')</option>';
    }
    selectHtml += '</select></div><div id="p-mk-session-table"></div>';

    el.innerHTML = selectHtml;

    _el('p-mk-router-select').addEventListener('change', function() {
      _loadSessionTable(this.value);
    });

    if (routers.length > 0) _loadSessionTable(routers[0].ip_address);
  }

  async function _loadSessionTable(routerIp) {
    var el = _el('p-mk-session-table');
    if (!el) return;

    var res = await AdminApi.getActiveSessions(routerIp);
    if (!res.ok) { el.innerHTML = '<p class="text-danger">Session bilgisi yuklenemedi.</p>'; return; }
    var sessions = res.data;

    if (sessions.length === 0) {
      el.innerHTML = '<div class="p-empty"><div class="p-empty-text">Aktif session yok</div></div>';
      return;
    }

    var rows = '';
    for (var i = 0; i < sessions.length; i++) {
      var s = sessions[i];
      rows += '<tr>' +
        '<td class="fw-600">' + _esc(s.username) + '</td>' +
        '<td>' + _esc(s.ip) + '</td>' +
        '<td>' + _formatUptime(s.uptime) + '</td>' +
        '<td class="text-success">' + _esc(s.rx_rate) + '</td>' +
        '<td class="text-info">' + _esc(s.tx_rate) + '</td>' +
        '<td class="fs-sm text-dim">' + _esc(s.caller_id) + '</td>' +
      '</tr>';
    }

    el.innerHTML =
      '<div class="p-table-wrap"><table class="p-table"><thead><tr>' +
        '<th>Kullanici</th><th>IP</th><th>Uptime</th><th>RX</th><th>TX</th><th>MAC</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  async function _loadMikrotikLog() {
    var el = _el('p-mk-content');
    if (!el) return;

    var res = await AdminApi.getMikrotikLog();
    if (!res.ok) { el.innerHTML = '<p class="text-danger">Islem gecmisi yuklenemedi.</p>'; return; }
    var logs = res.data;

    if (logs.length === 0) {
      el.innerHTML = '<div class="p-empty"><div class="p-empty-text">Islem gecmisi bos</div></div>';
      return;
    }

    var rows = '';
    for (var i = 0; i < logs.length; i++) {
      var l = logs[i];
      rows += '<tr>' +
        '<td>' + _formatDateTime(l.timestamp) + '</td>' +
        '<td>' + _actionBadge(l.action) + '</td>' +
        '<td>' + _esc(l.router_ip) + '</td>' +
        '<td class="fw-600">' + _esc(l.target_user || '-') + '</td>' +
        '<td>' + _esc(l.target_ip || '-') + '</td>' +
        '<td class="fs-sm">' + _esc(l.reason) + '</td>' +
        '<td>' + _esc(l.performed_by) + '</td>' +
        '<td>' + (l.success ? '<span class="p-badge p-badge-green">Basarili</span>' : '<span class="p-badge p-badge-red">Basarisiz</span>') + '</td>' +
      '</tr>';
    }

    el.innerHTML =
      '<div class="p-table-wrap"><table class="p-table"><thead><tr>' +
        '<th>Tarih</th><th>Islem</th><th>Router</th><th>Hedef User</th><th>Hedef IP</th><th>Neden</th><th>Yapan</th><th>Sonuc</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  // ── Public API ──
  return {
    init: init
  };
})();

// Auto-init
document.addEventListener('DOMContentLoaded', function() { Portal.init(); });
