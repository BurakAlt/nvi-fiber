/**
 * ApiClient — Abone Self-Servis Portal Backend API Client
 * Mock implementation: gercek backend hazir olana kadar demo veri saglar.
 * Gercek backend'e geciste sadece bu dosya degisecek.
 */
const ApiClient = (() => {
  'use strict';

  // ── Config ──
  let _config = {
    baseUrl: '/api/v1',
    token: null,
    refreshToken: null,
    tokenExpiry: 0,
    timeout: 15000
  };

  // ── Mock Abone Veritabani ──
  const _mockSubscribers = {
    'AB-1001': {
      id: 'AB-1001', name: 'Ahmet Yilmaz', tc: '12345678901', phone: '05321234567',
      address: 'Cumhuriyet Mah. Ataturk Cad. No:15/3, Cankiri',
      package: { id: 'PKT-100', name: 'Fiber 100', downloadMbps: 100, uploadMbps: 20, quota: null, price: 449.90, features: ['Limitsiz Internet', 'Statik IP', 'Modem Dahil'] },
      startDate: '2024-06-15', status: 'active',
      connection: { status: 'online', ip: '10.0.1.101', uptime: 864000, lastRestart: '2026-02-23T08:30:00Z', mac: '00:1A:2B:3C:4D:5E', ontSerial: 'ALCLF1234567' },
      usage: { downloadGB: 245.8, uploadGB: 38.2, quotaUsed: null }
    },
    'AB-1002': {
      id: 'AB-1002', name: 'Fatma Demir', tc: '98765432100', phone: '05559876543',
      address: 'Karatekin Mah. Istasyon Sok. No:8/1, Cankiri',
      package: { id: 'PKT-50', name: 'Fiber 50', downloadMbps: 50, uploadMbps: 10, quota: 300, price: 299.90, features: ['300 GB Kota', 'Modem Dahil'] },
      startDate: '2025-01-10', status: 'active',
      connection: { status: 'online', ip: '10.0.1.102', uptime: 432000, lastRestart: '2026-02-28T14:00:00Z', mac: '00:1A:2B:3C:4D:6F', ontSerial: 'ALCLF7654321' },
      usage: { downloadGB: 178.3, uploadGB: 22.1, quotaUsed: 59.4 }
    }
  };

  // Mock paket katalogu
  const _mockPackages = [
    { id: 'PKT-25', name: 'Fiber 25', downloadMbps: 25, uploadMbps: 5, quota: 150, price: 199.90, features: ['150 GB Kota', 'Modem Dahil'] },
    { id: 'PKT-50', name: 'Fiber 50', downloadMbps: 50, uploadMbps: 10, quota: 300, price: 299.90, features: ['300 GB Kota', 'Modem Dahil'] },
    { id: 'PKT-100', name: 'Fiber 100', downloadMbps: 100, uploadMbps: 20, quota: null, price: 449.90, features: ['Limitsiz Internet', 'Statik IP', 'Modem Dahil'] },
    { id: 'PKT-200', name: 'Fiber 200', downloadMbps: 200, uploadMbps: 50, quota: null, price: 649.90, features: ['Limitsiz Internet', 'Statik IP', 'Modem Dahil', 'Oncelikli Destek'] }
  ];

  // Mock fatura verileri
  function _generateInvoices(subscriberId) {
    var invoices = [];
    var now = new Date();
    for (var i = 0; i < 12; i++) {
      var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      var base = subscriberId === 'AB-1001' ? 449.90 : 299.90;
      var kdv = base * 0.20;
      var oiv = base * 0.10;
      var toplam = base + kdv + oiv;
      invoices.push({
        id: 'FTR-' + (2400 + i),
        subscriberId: subscriberId,
        period: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'),
        issueDate: new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString().split('T')[0],
        dueDate: new Date(d.getFullYear(), d.getMonth() + 1, 15).toISOString().split('T')[0],
        items: [
          { description: 'Abonelik Ucreti', amount: base },
          { description: 'KDV (%20)', amount: kdv },
          { description: 'OIV (%10)', amount: oiv }
        ],
        total: Math.round(toplam * 100) / 100,
        status: i === 0 ? 'unpaid' : 'paid',
        paidDate: i === 0 ? null : new Date(d.getFullYear(), d.getMonth() + 1, 10 + Math.floor(Math.random() * 5)).toISOString().split('T')[0],
        paymentMethod: i === 0 ? null : (Math.random() > 0.5 ? 'Kredi Karti' : 'Havale/EFT')
      });
    }
    return invoices;
  }

  // Mock destek talepleri
  function _generateTickets(subscriberId) {
    return [
      { id: 'TKT-301', subscriberId: subscriberId, category: 'baglanti', subject: 'Internet kesintisi', status: 'closed', priority: 'urgent', createdAt: '2026-02-15T09:00:00Z', updatedAt: '2026-02-15T14:30:00Z',
        messages: [
          { from: 'subscriber', text: 'Sabahtan beri internet baglantim yok.', date: '2026-02-15T09:00:00Z' },
          { from: 'support', text: 'Merhaba, OLT portunuzda hata tespit ettik. Mudahale ediliyor.', date: '2026-02-15T10:15:00Z' },
          { from: 'support', text: 'Sorun giderildi. Baglantiniz aktif.', date: '2026-02-15T14:30:00Z' }
        ]},
      { id: 'TKT-310', subscriberId: subscriberId, category: 'hiz', subject: 'Dusuk indirme hizi', status: 'open', priority: 'normal', createdAt: '2026-03-01T16:00:00Z', updatedAt: '2026-03-02T09:00:00Z',
        messages: [
          { from: 'subscriber', text: '100 Mbps paketim var ama hiz testinde 40 Mbps cikar.', date: '2026-03-01T16:00:00Z' },
          { from: 'support', text: 'Inceleme baslatildi. QoE skorunuz kontrol ediliyor.', date: '2026-03-02T09:00:00Z' }
        ]}
    ];
  }

  // Mock hiz testi gecmisi
  function _generateSpeedHistory(subscriberId) {
    var results = [];
    for (var i = 0; i < 10; i++) {
      var d = new Date();
      d.setDate(d.getDate() - i * 3);
      var planDown = subscriberId === 'AB-1001' ? 100 : 50;
      var planUp = subscriberId === 'AB-1001' ? 20 : 10;
      results.push({
        id: 'ST-' + (500 + i),
        date: d.toISOString(),
        download: Math.round((planDown * (0.7 + Math.random() * 0.3)) * 10) / 10,
        upload: Math.round((planUp * (0.7 + Math.random() * 0.3)) * 10) / 10,
        latency: Math.round(5 + Math.random() * 25),
        jitter: Math.round((1 + Math.random() * 8) * 10) / 10,
        qoeScore: Math.round(60 + Math.random() * 40)
      });
    }
    return results;
  }

  // Mock WiFi verileri
  function _getWifiData(subscriberId) {
    return {
      ssid: subscriberId === 'AB-1001' ? 'YilmazNet_5G' : 'DemirWiFi',
      password: 'Gizli1234!',
      channel: 36,
      security: 'WPA3',
      band: '5GHz',
      devices: [
        { name: 'iPhone 15', mac: 'AA:BB:CC:11:22:33', ip: '192.168.1.10', connected: '4 saat', bandwidth: '12.5 Mbps' },
        { name: 'Samsung TV', mac: 'DD:EE:FF:44:55:66', ip: '192.168.1.20', connected: '2 gun', bandwidth: '25.0 Mbps' },
        { name: 'Laptop', mac: '11:22:33:AA:BB:CC', ip: '192.168.1.30', connected: '1 saat', bandwidth: '45.0 Mbps' }
      ]
    };
  }

  // Mock SSS verileri
  const _mockFaq = [
    { category: 'baglanti', q: 'Internet baglantim kesildi, ne yapmaliyim?', a: 'Once modeminizi kapatip 10 saniye bekleyin, tekrar acin. Sorun devam ederse destek talebi acin.' },
    { category: 'baglanti', q: 'Modemimin isiklari ne anlama geliyor?', a: 'PON isigi yesil yaniyorsa fiber baglanti aktif, kirmizi yanip sonuyorsa fiber sinyal sorunu var.' },
    { category: 'hiz', q: 'Neden paketimden dusuk hiz aliyorum?', a: 'WiFi uzerinden hiz kaybi normaldir. Kablo ile baglanti yapip test edin. Sorun devam ederse destek talebi acin.' },
    { category: 'fatura', q: 'Faturami nasil odeyebilirim?', a: 'Kredi karti, havale/EFT veya otomatik odeme ile faturanizi odeyebilirsiniz.' },
    { category: 'fatura', q: 'Fatura itirazimi nasil yaparim?', a: 'Destek talebi acarak "Fatura" kategorisi secin ve itiraz nedeninizi belirtin.' },
    { category: 'wifi', q: 'WiFi sifemi nasil degistirebilirim?', a: 'Portal uzerinden WiFi Yonetimi sayfasindan sifrenizi degistirebilirsiniz.' },
    { category: 'paket', q: 'Paket degisikligi ne zaman gecerli olur?', a: 'Paket degisikligi talebi onaylandiktan sonra bir sonraki fatura doneminin basindan itibaren gecerli olur.' }
  ];

  // ── Auth ──
  let _currentSubscriberId = null;

  function _delay(ms) {
    return new Promise(function(resolve) { setTimeout(resolve, ms || 200 + Math.random() * 300); });
  }

  async function login(subscriberNo, password) {
    await _delay(500);
    var sub = _mockSubscribers[subscriberNo];
    if (!sub) return { ok: false, error: 'Abone bulunamadi. Abone numaranizi kontrol edin.' };
    // Mock: herhangi bir sifre kabul
    _currentSubscriberId = subscriberNo;
    var token = 'mock-jwt-' + subscriberNo + '-' + Date.now();
    _config.token = token;
    _config.tokenExpiry = Date.now() + 30 * 60 * 1000; // 30dk
    return { ok: true, token: token, subscriber: { id: sub.id, name: sub.name } };
  }

  function logout() {
    _config.token = null;
    _config.refreshToken = null;
    _config.tokenExpiry = 0;
    _currentSubscriberId = null;
  }

  function isAuthenticated() {
    return !!_config.token && Date.now() < _config.tokenExpiry;
  }

  function getCurrentSubscriberId() { return _currentSubscriberId; }

  // ── Subscriber API ──
  async function getProfile() {
    await _delay();
    if (!_currentSubscriberId) return { ok: false, error: 'Oturum acilmamis' };
    var sub = _mockSubscribers[_currentSubscriberId];
    return { ok: true, data: sub };
  }

  async function getUsage() {
    await _delay();
    if (!_currentSubscriberId) return { ok: false, error: 'Oturum acilmamis' };
    var sub = _mockSubscribers[_currentSubscriberId];
    return { ok: true, data: sub.usage };
  }

  async function getConnectionStatus() {
    await _delay();
    if (!_currentSubscriberId) return { ok: false, error: 'Oturum acilmamis' };
    var sub = _mockSubscribers[_currentSubscriberId];
    return { ok: true, data: sub.connection };
  }

  // ── Billing API ──
  async function getInvoices() {
    await _delay();
    if (!_currentSubscriberId) return { ok: false, error: 'Oturum acilmamis' };
    return { ok: true, data: _generateInvoices(_currentSubscriberId) };
  }

  async function getInvoiceDetail(invoiceId) {
    await _delay();
    var invoices = _generateInvoices(_currentSubscriberId);
    var inv = null;
    for (var i = 0; i < invoices.length; i++) { if (invoices[i].id === invoiceId) { inv = invoices[i]; break; } }
    if (!inv) return { ok: false, error: 'Fatura bulunamadi' };
    return { ok: true, data: inv };
  }

  async function downloadInvoicePdf(invoiceId) {
    await _delay(800);
    // Mock: PDF indirme simule et
    return { ok: true, message: 'PDF indirme baslatildi (demo mod)' };
  }

  async function getPaymentHistory() {
    await _delay();
    var invoices = _generateInvoices(_currentSubscriberId);
    var payments = [];
    for (var i = 0; i < invoices.length; i++) {
      if (invoices[i].status === 'paid') {
        payments.push({
          date: invoices[i].paidDate,
          amount: invoices[i].total,
          method: invoices[i].paymentMethod,
          reference: 'REF-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
          invoiceId: invoices[i].id
        });
      }
    }
    return { ok: true, data: payments };
  }

  // ── Package API ──
  async function getPackages() {
    await _delay();
    return { ok: true, data: _mockPackages };
  }

  async function getCurrentPackage() {
    await _delay();
    if (!_currentSubscriberId) return { ok: false, error: 'Oturum acilmamis' };
    return { ok: true, data: _mockSubscribers[_currentSubscriberId].package };
  }

  async function requestPackageChange(targetPackageId) {
    await _delay(600);
    var pkg = null;
    for (var i = 0; i < _mockPackages.length; i++) { if (_mockPackages[i].id === targetPackageId) { pkg = _mockPackages[i]; break; } }
    if (!pkg) return { ok: false, error: 'Paket bulunamadi' };
    return { ok: true, data: { requestId: 'PD-' + Date.now(), targetPackage: pkg, status: 'pending', estimatedDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0] } };
  }

  // ── Speed Test API ──
  async function getSpeedTestHistory() {
    await _delay();
    if (!_currentSubscriberId) return { ok: false, error: 'Oturum acilmamis' };
    return { ok: true, data: _generateSpeedHistory(_currentSubscriberId) };
  }

  async function saveSpeedTestResult(result) {
    await _delay();
    return { ok: true, data: { id: 'ST-' + Date.now(), saved: true } };
  }

  // ── Support API ──
  async function getTickets() {
    await _delay();
    if (!_currentSubscriberId) return { ok: false, error: 'Oturum acilmamis' };
    return { ok: true, data: _generateTickets(_currentSubscriberId) };
  }

  async function getTicketDetail(ticketId) {
    await _delay();
    var tickets = _generateTickets(_currentSubscriberId);
    var t = null;
    for (var i = 0; i < tickets.length; i++) { if (tickets[i].id === ticketId) { t = tickets[i]; break; } }
    if (!t) return { ok: false, error: 'Talep bulunamadi' };
    return { ok: true, data: t };
  }

  async function createTicket(data) {
    await _delay(500);
    return { ok: true, data: {
      id: 'TKT-' + Date.now(),
      subscriberId: _currentSubscriberId,
      category: data.category,
      subject: data.subject,
      status: 'open',
      priority: data.priority || 'normal',
      createdAt: new Date().toISOString(),
      messages: [{ from: 'subscriber', text: data.description, date: new Date().toISOString() }]
    }};
  }

  async function addTicketMessage(ticketId, message) {
    await _delay();
    return { ok: true, data: { ticketId: ticketId, from: 'subscriber', text: message, date: new Date().toISOString() } };
  }

  async function getFaq() {
    await _delay(100);
    return { ok: true, data: _mockFaq };
  }

  // ── WiFi API ──
  async function getWifiSettings() {
    await _delay();
    if (!_currentSubscriberId) return { ok: false, error: 'Oturum acilmamis' };
    return { ok: true, data: _getWifiData(_currentSubscriberId) };
  }

  async function updateWifiSsid(newSsid) {
    await _delay(1000);
    return { ok: true, message: 'SSID degisikligi CPE cihazina gonderildi.' };
  }

  async function updateWifiPassword(newPassword) {
    await _delay(1000);
    return { ok: true, message: 'WiFi sifresi CPE cihazina gonderildi.' };
  }

  async function updateWifiChannel(channel) {
    await _delay(1000);
    return { ok: true, message: 'WiFi kanali degistirildi: ' + channel };
  }

  // ── Public API ──
  return {
    // Auth
    login: login,
    logout: logout,
    isAuthenticated: isAuthenticated,
    getCurrentSubscriberId: getCurrentSubscriberId,
    // Subscriber
    getProfile: getProfile,
    getUsage: getUsage,
    getConnectionStatus: getConnectionStatus,
    // Billing
    getInvoices: getInvoices,
    getInvoiceDetail: getInvoiceDetail,
    downloadInvoicePdf: downloadInvoicePdf,
    getPaymentHistory: getPaymentHistory,
    // Packages
    getPackages: getPackages,
    getCurrentPackage: getCurrentPackage,
    requestPackageChange: requestPackageChange,
    // Speed Test
    getSpeedTestHistory: getSpeedTestHistory,
    saveSpeedTestResult: saveSpeedTestResult,
    // Support
    getTickets: getTickets,
    getTicketDetail: getTicketDetail,
    createTicket: createTicket,
    addTicketMessage: addTicketMessage,
    getFaq: getFaq,
    // WiFi
    getWifiSettings: getWifiSettings,
    updateWifiSsid: updateWifiSsid,
    updateWifiPassword: updateWifiPassword,
    updateWifiChannel: updateWifiChannel
  };
})();
