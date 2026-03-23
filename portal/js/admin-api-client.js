/**
 * AdminApi — ISP Yonetim Paneli Backend API Client
 * Mock implementation: gercek FastAPI backend hazir olana kadar demo veri saglar.
 * Gercek backend'e geciste sadece bu dosya degisecek.
 *
 * Tum mock verileri birbiriyle tutarli:
 * - Alarm'daki device_id gercek bir cihazi gosterir
 * - Abone'deki mikrotik_router gercek router IP'siyle eslesir
 * - WhatsApp konusmalarindaki telefon numaralari abonelerle eslesir
 */
const AdminApi = (() => {
  'use strict';

  // ── Config ──
  let _config = {
    baseUrl: 'http://localhost:8000',
    token: null,
    tokenExpiry: 0
  };

  // ── Mock Admin Kullanicilari ──
  const _mockAdmins = {
    'admin': { username: 'admin', password: 'admin123', role: 'superadmin', fullName: 'Burak Yilmaz' },
    'tekniker': { username: 'tekniker', password: 'tek123', role: 'technician', fullName: 'Emre Kaya' }
  };

  // ── Mock Abone Veritabani (15+ abone, Cankiri ilceleri) ──
  const _mockSubscribers = [
    { id: 1, abone_no: 'AB-1001', full_name: 'Ahmet Yilmaz', phone: '05321234567', district: 'Merkez', village: 'Cumhuriyet Mah.', package_name: 'Fiber 100', package_speed: '100/20', connection_type: 'FTTH', mikrotik_user: 'ahmet.yilmaz', mikrotik_ip: '10.0.1.101', mikrotik_router: '10.0.0.1', is_active: true, payment_status: 'paid', payment_amount: 449.90, balance: 0, start_date: '2024-06-15', address: 'Cumhuriyet Mah. Ataturk Cad. No:15/3' },
    { id: 2, abone_no: 'AB-1002', full_name: 'Fatma Demir', phone: '05559876543', district: 'Merkez', village: 'Karatekin Mah.', package_name: 'Fiber 50', package_speed: '50/10', connection_type: 'FTTH', mikrotik_user: 'fatma.demir', mikrotik_ip: '10.0.1.102', mikrotik_router: '10.0.0.1', is_active: true, payment_status: 'unpaid', payment_amount: 299.90, balance: -299.90, start_date: '2025-01-10', address: 'Karatekin Mah. Istasyon Sok. No:8/1' },
    { id: 3, abone_no: 'AB-1003', full_name: 'Mehmet Ozturk', phone: '05441112233', district: 'Ilgaz', village: 'Yukari Mah.', package_name: 'Fiber 100', package_speed: '100/20', connection_type: 'FTTH', mikrotik_user: 'mehmet.ozturk', mikrotik_ip: '10.0.2.101', mikrotik_router: '10.0.0.2', is_active: true, payment_status: 'paid', payment_amount: 449.90, balance: 0, start_date: '2024-09-01', address: 'Yukari Mah. Ilgaz Cad. No:22' },
    { id: 4, abone_no: 'AB-1004', full_name: 'Ayse Celik', phone: '05367778899', district: 'Ilgaz', village: 'Asagi Mah.', package_name: 'Fiber 25', package_speed: '25/5', connection_type: 'FTTH', mikrotik_user: 'ayse.celik', mikrotik_ip: '10.0.2.102', mikrotik_router: '10.0.0.2', is_active: true, payment_status: 'paid', payment_amount: 199.90, balance: 0, start_date: '2025-02-20', address: 'Asagi Mah. Cumhuriyet Sok. No:5' },
    { id: 5, abone_no: 'AB-1005', full_name: 'Hasan Sahin', phone: '05423334455', district: 'Sabanozü', village: 'Merkez', package_name: 'Fiber 50', package_speed: '50/10', connection_type: 'FTTH', mikrotik_user: 'hasan.sahin', mikrotik_ip: '10.0.3.101', mikrotik_router: '10.0.0.3', is_active: true, payment_status: 'unpaid', payment_amount: 299.90, balance: -599.80, start_date: '2024-11-05', address: 'Merkez Mah. Belediye Cad. No:11' },
    { id: 6, abone_no: 'AB-1006', full_name: 'Zeynep Kara', phone: '05539990011', district: 'Sabanozü', village: 'Yeni Mah.', package_name: 'Fiber 100', package_speed: '100/20', connection_type: 'FTTH', mikrotik_user: 'zeynep.kara', mikrotik_ip: '10.0.3.102', mikrotik_router: '10.0.0.3', is_active: true, payment_status: 'paid', payment_amount: 449.90, balance: 0, start_date: '2025-03-01', address: 'Yeni Mah. Okul Sok. No:7' },
    { id: 7, abone_no: 'AB-1007', full_name: 'Ali Yildiz', phone: '05312223344', district: 'Atkaracalar', village: 'Merkez', package_name: 'Fiber 25', package_speed: '25/5', connection_type: 'FTTB', mikrotik_user: 'ali.yildiz', mikrotik_ip: '10.0.4.101', mikrotik_router: '10.0.0.4', is_active: false, payment_status: 'unpaid', payment_amount: 199.90, balance: -399.80, start_date: '2024-08-10', address: 'Merkez Mah. Hukumet Cad. No:3' },
    { id: 8, abone_no: 'AB-1008', full_name: 'Elif Arslan', phone: '05465556677', district: 'Atkaracalar', village: 'Koylu Mah.', package_name: 'Fiber 50', package_speed: '50/10', connection_type: 'FTTH', mikrotik_user: 'elif.arslan', mikrotik_ip: '10.0.4.102', mikrotik_router: '10.0.0.4', is_active: true, payment_status: 'paid', payment_amount: 299.90, balance: 0, start_date: '2025-01-15', address: 'Koylu Mah. Dere Sok. No:9' },
    { id: 9, abone_no: 'AB-1009', full_name: 'Mustafa Dogan', phone: '05378889900', district: 'Cerkes', village: 'Cumhuriyet Mah.', package_name: 'Fiber 200', package_speed: '200/50', connection_type: 'FTTH', mikrotik_user: 'mustafa.dogan', mikrotik_ip: '10.0.5.101', mikrotik_router: '10.0.0.5', is_active: true, payment_status: 'paid', payment_amount: 649.90, balance: 0, start_date: '2024-07-20', address: 'Cumhuriyet Mah. Ataturk Blv. No:45' },
    { id: 10, abone_no: 'AB-1010', full_name: 'Hatice Koç', phone: '05541112244', district: 'Cerkes', village: 'Yenidogan Mah.', package_name: 'Fiber 100', package_speed: '100/20', connection_type: 'FTTH', mikrotik_user: 'hatice.koc', mikrotik_ip: '10.0.5.102', mikrotik_router: '10.0.0.5', is_active: true, payment_status: 'unpaid', payment_amount: 449.90, balance: -449.90, start_date: '2025-04-01', address: 'Yenidogan Mah. Okul Cad. No:12' },
    { id: 11, abone_no: 'AB-1011', full_name: 'Ibrahim Tas', phone: '05323334466', district: 'Merkez', village: 'Baglar Mah.', package_name: 'Fiber 50', package_speed: '50/10', connection_type: 'FTTH', mikrotik_user: 'ibrahim.tas', mikrotik_ip: '10.0.1.103', mikrotik_router: '10.0.0.1', is_active: true, payment_status: 'paid', payment_amount: 299.90, balance: 0, start_date: '2024-12-01', address: 'Baglar Mah. Cicek Sok. No:18' },
    { id: 12, abone_no: 'AB-1012', full_name: 'Sultan Erdem', phone: '05557778811', district: 'Merkez', village: 'Inonu Mah.', package_name: 'Fiber 200', package_speed: '200/50', connection_type: 'FTTH', mikrotik_user: 'sultan.erdem', mikrotik_ip: '10.0.1.104', mikrotik_router: '10.0.0.1', is_active: true, payment_status: 'paid', payment_amount: 649.90, balance: 0, start_date: '2025-02-01', address: 'Inonu Mah. Istiklal Cad. No:30' },
    { id: 13, abone_no: 'AB-1013', full_name: 'Kemal Bulut', phone: '05449990033', district: 'Ilgaz', village: 'Dag Mah.', package_name: 'Fiber 25', package_speed: '25/5', connection_type: 'FTTB', mikrotik_user: 'kemal.bulut', mikrotik_ip: '10.0.2.103', mikrotik_router: '10.0.0.2', is_active: true, payment_status: 'paid', payment_amount: 199.90, balance: 0, start_date: '2025-05-01', address: 'Dag Mah. Cinar Sok. No:2' },
    { id: 14, abone_no: 'AB-1014', full_name: 'Derya Akin', phone: '05366665544', district: 'Sabanozü', village: 'Bahce Mah.', package_name: 'Fiber 100', package_speed: '100/20', connection_type: 'FTTH', mikrotik_user: 'derya.akin', mikrotik_ip: '10.0.3.103', mikrotik_router: '10.0.0.3', is_active: true, payment_status: 'paid', payment_amount: 449.90, balance: 0, start_date: '2025-03-15', address: 'Bahce Mah. Gul Sok. No:6' },
    { id: 15, abone_no: 'AB-1015', full_name: 'Omer Gunes', phone: '05421113355', district: 'Cerkes', village: 'Pinar Mah.', package_name: 'Fiber 50', package_speed: '50/10', connection_type: 'FTTH', mikrotik_user: 'omer.gunes', mikrotik_ip: '10.0.5.103', mikrotik_router: '10.0.0.5', is_active: false, payment_status: 'unpaid', payment_amount: 299.90, balance: -899.70, start_date: '2024-05-10', address: 'Pinar Mah. Su Sok. No:14' },
    { id: 16, abone_no: 'AB-1016', full_name: 'Sibel Yalcin', phone: '05538887766', district: 'Merkez', village: 'Kale Mah.', package_name: 'Fiber 100', package_speed: '100/20', connection_type: 'FTTH', mikrotik_user: 'sibel.yalcin', mikrotik_ip: '10.0.1.105', mikrotik_router: '10.0.0.1', is_active: true, payment_status: 'paid', payment_amount: 449.90, balance: 0, start_date: '2025-06-01', address: 'Kale Mah. Hisar Cad. No:25' }
  ];

  // ── Mock Cihaz Veritabani (10+ cihaz — MikroTik, Ubiquiti, TP-Link modelleri) ──
  const _mockDevices = [
    { id: 'DEV-001', device_type: 'olt', name: 'OLT-Merkez-1', brand: 'Huawei', model: 'MA5608T', ip_address: '10.0.0.100', mac_address: 'AA:BB:CC:01:01:01', lat: 40.6013, lng: 33.6134, building_id: 'BIN-001', ada_code: 'ADA-101', router_ip: '10.0.0.1', frequency: null, status: 'online', signal_threshold: -25, uptime: 2592000, cpu_usage: 35, ram_usage: 48 },
    { id: 'DEV-002', device_type: 'router', name: 'MikroTik-Merkez', brand: 'MikroTik', model: 'CCR1036-8G-2S+', ip_address: '10.0.0.1', mac_address: 'AA:BB:CC:02:02:02', lat: 40.6015, lng: 33.6140, building_id: 'BIN-001', ada_code: 'ADA-101', router_ip: null, frequency: null, status: 'online', signal_threshold: null, uptime: 5184000, cpu_usage: 22, ram_usage: 61 },
    { id: 'DEV-003', device_type: 'router', name: 'MikroTik-Ilgaz', brand: 'MikroTik', model: 'CCR1009-7G-1C-1S+', ip_address: '10.0.0.2', mac_address: 'AA:BB:CC:03:03:03', lat: 40.9200, lng: 33.6300, building_id: 'BIN-020', ada_code: 'ADA-201', router_ip: null, frequency: null, status: 'online', signal_threshold: null, uptime: 3456000, cpu_usage: 18, ram_usage: 42 },
    { id: 'DEV-004', device_type: 'router', name: 'MikroTik-Sabanozü', brand: 'MikroTik', model: 'RB4011iGS+RM', ip_address: '10.0.0.3', mac_address: 'AA:BB:CC:04:04:04', lat: 40.4700, lng: 33.3800, building_id: 'BIN-030', ada_code: 'ADA-301', router_ip: null, frequency: null, status: 'online', signal_threshold: null, uptime: 1728000, cpu_usage: 30, ram_usage: 55 },
    { id: 'DEV-005', device_type: 'router', name: 'MikroTik-Atkaracalar', brand: 'MikroTik', model: 'hEX S (RB760iGS)', ip_address: '10.0.0.4', mac_address: 'AA:BB:CC:05:05:05', lat: 40.8100, lng: 33.1200, building_id: 'BIN-040', ada_code: 'ADA-401', router_ip: null, frequency: null, status: 'offline', signal_threshold: null, uptime: 0, cpu_usage: 0, ram_usage: 0 },
    { id: 'DEV-006', device_type: 'router', name: 'MikroTik-Cerkes', brand: 'MikroTik', model: 'CCR2004-1G-12S+2XS', ip_address: '10.0.0.5', mac_address: 'AA:BB:CC:06:06:06', lat: 40.8200, lng: 32.9000, building_id: 'BIN-050', ada_code: 'ADA-501', router_ip: null, frequency: null, status: 'online', signal_threshold: null, uptime: 4320000, cpu_usage: 15, ram_usage: 38 },
    { id: 'DEV-007', device_type: 'antenna', name: 'PTP-Ilgaz-Link', brand: 'Ubiquiti', model: 'airFiber 60 LR', ip_address: '10.0.10.1', mac_address: 'AA:BB:CC:07:07:07', lat: 40.8500, lng: 33.5800, building_id: null, ada_code: null, router_ip: '10.0.0.2', frequency: '60 GHz', status: 'online', signal_threshold: -65, uptime: 2160000, cpu_usage: 12, ram_usage: 25 },
    { id: 'DEV-008', device_type: 'antenna', name: 'PTP-Cerkes-Link', brand: 'Ubiquiti', model: 'airFiber 5XHD', ip_address: '10.0.10.2', mac_address: 'AA:BB:CC:08:08:08', lat: 40.8300, lng: 32.9500, building_id: null, ada_code: null, router_ip: '10.0.0.5', frequency: '5 GHz', status: 'warning', signal_threshold: -70, uptime: 864000, cpu_usage: 28, ram_usage: 35 },
    { id: 'DEV-009', device_type: 'switch', name: 'SW-Merkez-Core', brand: 'MikroTik', model: 'CRS326-24G-2S+RM', ip_address: '10.0.0.10', mac_address: 'AA:BB:CC:09:09:09', lat: 40.6014, lng: 33.6136, building_id: 'BIN-001', ada_code: 'ADA-101', router_ip: '10.0.0.1', frequency: null, status: 'online', signal_threshold: null, uptime: 5184000, cpu_usage: 8, ram_usage: 22 },
    { id: 'DEV-010', device_type: 'ap', name: 'AP-Merkez-Ofis', brand: 'Ubiquiti', model: 'UniFi U6 Pro', ip_address: '10.0.1.200', mac_address: 'AA:BB:CC:10:10:10', lat: 40.6016, lng: 33.6138, building_id: 'BIN-002', ada_code: 'ADA-101', router_ip: '10.0.0.1', frequency: '2.4/5 GHz', status: 'online', signal_threshold: -75, uptime: 2592000, cpu_usage: 15, ram_usage: 30 },
    { id: 'DEV-011', device_type: 'olt', name: 'OLT-Cerkes-1', brand: 'Huawei', model: 'MA5608T', ip_address: '10.0.0.101', mac_address: 'AA:BB:CC:11:11:11', lat: 40.8205, lng: 32.9010, building_id: 'BIN-050', ada_code: 'ADA-501', router_ip: '10.0.0.5', frequency: null, status: 'online', signal_threshold: -25, uptime: 4320000, cpu_usage: 28, ram_usage: 40 },
    { id: 'DEV-012', device_type: 'switch', name: 'SW-Ilgaz-Dist', brand: 'TP-Link', model: 'TL-SG3428XMP', ip_address: '10.0.0.20', mac_address: 'AA:BB:CC:12:12:12', lat: 40.9205, lng: 33.6310, building_id: 'BIN-020', ada_code: 'ADA-201', router_ip: '10.0.0.2', frequency: null, status: 'online', signal_threshold: null, uptime: 3456000, cpu_usage: 5, ram_usage: 18 }
  ];

  // ── Mock Alarm Veritabani ──
  const _mockAlarms = [
    { id: 'ALM-001', device_id: 'DEV-005', device_name: 'MikroTik-Atkaracalar', alarm_type: 'device_down', severity: 'critical', message: 'Cihaz erisime kapali. Son gorulme: 2 saat once.', created_at: '2026-03-14T08:30:00Z', acknowledged: false, resolved: false, resolved_at: null, resolved_note: null, affected_subscriber_ids: [7, 8] },
    { id: 'ALM-002', device_id: 'DEV-008', device_name: 'PTP-Cerkes-Link', alarm_type: 'signal_low', severity: 'warning', message: 'Sinyal seviyesi -68 dBm (esik: -65 dBm). Hava kosullari etkili olabilir.', created_at: '2026-03-14T06:15:00Z', acknowledged: true, resolved: false, resolved_at: null, resolved_note: null, affected_subscriber_ids: [9, 10, 15] },
    { id: 'ALM-003', device_id: 'DEV-002', device_name: 'MikroTik-Merkez', alarm_type: 'high_cpu', severity: 'warning', message: 'CPU kullanimi son 15 dakikada %85 uzerine cikti. PPPoE session sayisi yuksek.', created_at: '2026-03-13T22:00:00Z', acknowledged: false, resolved: false, resolved_at: null, resolved_note: null, affected_subscriber_ids: [1, 2, 11, 12, 16] },
    { id: 'ALM-004', device_id: 'DEV-001', device_name: 'OLT-Merkez-1', alarm_type: 'high_latency', severity: 'info', message: 'OLT ortalama yanit suresi 15ms (normal: <10ms). Izleniyor.', created_at: '2026-03-13T18:45:00Z', acknowledged: true, resolved: false, resolved_at: null, resolved_note: null, affected_subscriber_ids: [] },
    // Cozulmus alarmlar
    { id: 'ALM-005', device_id: 'DEV-003', device_name: 'MikroTik-Ilgaz', alarm_type: 'device_down', severity: 'critical', message: 'Elektrik kesintisi sonrasi cihaz yeniden basladi.', created_at: '2026-03-12T14:00:00Z', acknowledged: true, resolved: true, resolved_at: '2026-03-12T14:35:00Z', resolved_note: 'Elektrik kesintisi sona erdi, cihaz otomatik ayaga kalkti.', affected_subscriber_ids: [3, 4, 13] },
    { id: 'ALM-006', device_id: 'DEV-007', device_name: 'PTP-Ilgaz-Link', alarm_type: 'signal_low', severity: 'warning', message: 'Yogun sis nedeniyle sinyal dusuk.', created_at: '2026-03-11T06:00:00Z', acknowledged: true, resolved: true, resolved_at: '2026-03-11T12:00:00Z', resolved_note: 'Hava kosullari duzeldikten sonra sinyal normale dondu.', affected_subscriber_ids: [] }
  ];

  // ── Mock Odeme Islemleri (Onay Bekleyen) ──
  const _mockPendingPayments = [
    { tx_id: 'TX-5001', date: '2026-03-14T09:22:00Z', sender_name: 'FATMA DEMIR', sender_iban: 'TR12 0001 0012 3456 7890 1234 56', amount: 299.90, match_status: 'manual_review', matched_subscriber_id: 2, match_score: 0.92, note: 'Ad soyad eslesiyor, tutar dogru' },
    { tx_id: 'TX-5002', date: '2026-03-14T10:05:00Z', sender_name: 'HASAN S.', sender_iban: 'TR33 0006 4000 0011 2233 4455 66', amount: 599.80, match_status: 'manual_review', matched_subscriber_id: 5, match_score: 0.75, note: 'Kismi isim eslesmesi, tutar 2 aylik borca uygun' },
    { tx_id: 'TX-5003', date: '2026-03-13T16:40:00Z', sender_name: 'HATICE KOC', sender_iban: 'TR55 0001 0098 7654 3210 9876 54', amount: 449.90, match_status: 'manual_review', matched_subscriber_id: 10, match_score: 0.95, note: 'Ad soyad ve tutar tam eslesiyor' },
    { tx_id: 'TX-5004', date: '2026-03-13T14:15:00Z', sender_name: 'ALI YILDIZ', sender_iban: 'TR77 0064 0000 1122 3344 5566 77', amount: 399.80, match_status: 'manual_review', matched_subscriber_id: 7, match_score: 0.88, note: 'Tutar 2 aylik borca uygun' },
    { tx_id: 'TX-5005', date: '2026-03-12T11:30:00Z', sender_name: 'MEHMET', sender_iban: 'TR99 0010 0000 9988 7766 5544 33', amount: 300.00, match_status: 'unmatched', matched_subscriber_id: null, match_score: 0, note: 'Eslestirilemedi — gonderen adi tek kelime, tutar yaklasik' },
    { tx_id: 'TX-5006', date: '2026-03-12T09:00:00Z', sender_name: 'OMER GUNES', sender_iban: 'TR11 0062 0000 5544 3322 1100 88', amount: 899.70, match_status: 'manual_review', matched_subscriber_id: 15, match_score: 0.90, note: '3 aylik borc odemesi' }
  ];

  // ── Mock WhatsApp Konusmalari ──
  const _mockConversations = [
    { id: 'WA-001', phone: '05559876543', subscriber_name: 'Fatma Demir', subscriber_id: 2, status: 'open', message_count: 4, last_message: 'Faturami odedim ama hala borçlu gorunuyor', last_message_date: '2026-03-14T09:30:00Z' },
    { id: 'WA-002', phone: '05423334455', subscriber_name: 'Hasan Sahin', subscriber_id: 5, status: 'open', message_count: 2, last_message: 'Internet hizim cok yavas', last_message_date: '2026-03-14T08:15:00Z' },
    { id: 'WA-003', phone: '05312223344', subscriber_name: 'Ali Yildiz', subscriber_id: 7, status: 'open', message_count: 6, last_message: 'Ne zaman aktif edilecek internetim?', last_message_date: '2026-03-13T19:00:00Z' },
    { id: 'WA-004', phone: '05321234567', subscriber_name: 'Ahmet Yilmaz', subscriber_id: 1, status: 'resolved', message_count: 3, last_message: 'Tesekkurler sorun cozuldu', last_message_date: '2026-03-12T15:00:00Z' },
    { id: 'WA-005', phone: '05441112233', subscriber_name: 'Mehmet Ozturk', subscriber_id: 3, status: 'resolved', message_count: 2, last_message: 'Tamam anladim tesekkurler', last_message_date: '2026-03-11T10:00:00Z' }
  ];

  // ── Mock MikroTik Islem Gecmisi ──
  const _mockMikrotikLog = [
    { id: 'MK-001', action: 'pppoe_disconnect', router_ip: '10.0.0.4', target_user: 'ali.yildiz', target_ip: '10.0.4.101', performed_by: 'admin', timestamp: '2026-03-14T07:00:00Z', reason: 'Borc nedeniyle devre disi birakildi', success: true },
    { id: 'MK-002', action: 'speed_limit', router_ip: '10.0.0.1', target_user: 'fatma.demir', target_ip: '10.0.1.102', performed_by: 'admin', timestamp: '2026-03-13T16:00:00Z', reason: 'Odenmemis fatura — hiz sinirlamasi uygulandi (5/1 Mbps)', success: true },
    { id: 'MK-003', action: 'pppoe_reconnect', router_ip: '10.0.0.2', target_user: 'mehmet.ozturk', target_ip: '10.0.2.101', performed_by: 'tekniker', timestamp: '2026-03-13T10:30:00Z', reason: 'Abone sikayet — session yeniden baslatildi', success: true },
    { id: 'MK-004', action: 'firewall_block', router_ip: '10.0.0.5', target_user: 'omer.gunes', target_ip: '10.0.5.103', performed_by: 'admin', timestamp: '2026-03-12T14:00:00Z', reason: '3 aylik borc — erisim engellendi', success: true },
    { id: 'MK-005', action: 'speed_restore', router_ip: '10.0.0.1', target_user: 'ibrahim.tas', target_ip: '10.0.1.103', performed_by: 'admin', timestamp: '2026-03-12T09:00:00Z', reason: 'Odeme alindi — hiz limiti kaldirildi', success: true },
    { id: 'MK-006', action: 'pppoe_disconnect', router_ip: '10.0.0.3', target_user: 'hasan.sahin', target_ip: '10.0.3.101', performed_by: 'admin', timestamp: '2026-03-11T08:00:00Z', reason: '2 aylik borc — gecici kesinti', success: true },
    { id: 'MK-007', action: 'pppoe_reconnect', router_ip: '10.0.0.3', target_user: 'hasan.sahin', target_ip: '10.0.3.101', performed_by: 'admin', timestamp: '2026-03-11T15:00:00Z', reason: 'Abone arayarak soz verdi — gecici acildi', success: true },
    { id: 'MK-008', action: 'firmware_update', router_ip: '10.0.0.1', target_user: null, target_ip: null, performed_by: 'admin', timestamp: '2026-03-10T02:00:00Z', reason: 'RouterOS 7.16 surumune guncelleme', success: true }
  ];

  // ── Yardimci ──
  function _delay(ms) {
    return new Promise(function(resolve) { setTimeout(resolve, ms || 150 + Math.random() * 250); });
  }

  let _currentUser = null;

  // ════════════════════════════════════
  // ── AUTH ──
  // ════════════════════════════════════
  async function login(username, password) {
    await _delay(400);
    var admin = _mockAdmins[username];
    if (!admin || admin.password !== password) {
      return { ok: false, error: 'Kullanici adi veya sifre hatali.' };
    }
    _currentUser = { username: admin.username, role: admin.role, fullName: admin.fullName };
    _config.token = 'mock-admin-jwt-' + Date.now();
    _config.tokenExpiry = Date.now() + 8 * 60 * 60 * 1000; // 8 saat
    return { ok: true, token: _config.token, user: _currentUser };
  }

  function logout() {
    _config.token = null;
    _config.tokenExpiry = 0;
    _currentUser = null;
  }

  function isAuthenticated() {
    return !!_config.token && Date.now() < _config.tokenExpiry;
  }

  function getCurrentUser() {
    return _currentUser;
  }

  // ════════════════════════════════════
  // ── DASHBOARD ──
  // ════════════════════════════════════
  async function getDashboardStats() {
    await _delay();
    var activeCount = _mockSubscribers.filter(function(s) { return s.is_active; }).length;
    var unpaidCount = _mockSubscribers.filter(function(s) { return s.payment_status === 'unpaid'; }).length;
    var openConvos = _mockConversations.filter(function(c) { return c.status === 'open'; }).length;
    return {
      ok: true,
      data: {
        total_subscribers: _mockSubscribers.length,
        active_subscribers: activeCount,
        unpaid_subscribers: unpaidCount,
        pending_payment_reviews: _mockPendingPayments.filter(function(p) { return p.match_status !== 'approved' && p.match_status !== 'rejected'; }).length,
        open_whatsapp_conversations: openConvos,
        mikrotik_actions_30d: _mockMikrotikLog.length
      }
    };
  }

  // ════════════════════════════════════
  // ── SUBSCRIBERS (Abone Yonetimi) ──
  // ════════════════════════════════════
  async function getSubscribers(params) {
    await _delay();
    params = params || {};
    var list = _mockSubscribers.slice();

    // Arama
    if (params.search) {
      var q = params.search.toLowerCase();
      list = list.filter(function(s) {
        return s.full_name.toLowerCase().indexOf(q) !== -1 ||
               s.abone_no.toLowerCase().indexOf(q) !== -1 ||
               s.phone.indexOf(q) !== -1;
      });
    }

    // Ilce filtresi
    if (params.district && params.district !== 'all') {
      list = list.filter(function(s) { return s.district === params.district; });
    }

    // Odeme durumu filtresi
    if (params.payment_status && params.payment_status !== 'all') {
      list = list.filter(function(s) { return s.payment_status === params.payment_status; });
    }

    var total = list.length;
    var offset = params.offset || 0;
    var limit = params.limit || 50;
    list = list.slice(offset, offset + limit);

    return { ok: true, data: list, total: total };
  }

  async function getSubscriber(abone_no) {
    await _delay();
    var sub = null;
    for (var i = 0; i < _mockSubscribers.length; i++) {
      if (_mockSubscribers[i].abone_no === abone_no) { sub = _mockSubscribers[i]; break; }
    }
    if (!sub) return { ok: false, error: 'Abone bulunamadi' };

    // Aboneye ait cihazlar ve alarmlar
    var devices = _mockDevices.filter(function(d) {
      return d.ip_address === sub.mikrotik_router;
    });
    var alarms = _mockAlarms.filter(function(a) {
      return a.affected_subscriber_ids && a.affected_subscriber_ids.indexOf(sub.id) !== -1 && !a.resolved;
    });

    return { ok: true, data: Object.assign({}, sub, { devices: devices, active_alarms: alarms }) };
  }

  async function updatePaymentStatus(subscriber_id, status) {
    await _delay(300);
    for (var i = 0; i < _mockSubscribers.length; i++) {
      if (_mockSubscribers[i].id === subscriber_id) {
        _mockSubscribers[i].payment_status = status;
        if (status === 'paid') _mockSubscribers[i].balance = 0;
        return { ok: true, data: _mockSubscribers[i] };
      }
    }
    return { ok: false, error: 'Abone bulunamadi' };
  }

  async function importSubscribersCsv(file) {
    await _delay(1000);
    // Mock: CSV import simule et
    return { ok: true, data: { created: 3, updated: 2, errors: ['Satir 5: Gecersiz telefon formati'] } };
  }

  // ════════════════════════════════════
  // ── PAYMENTS (Odeme Motoru) ──
  // ════════════════════════════════════
  async function getPendingPayments() {
    await _delay();
    var pending = _mockPendingPayments.filter(function(p) {
      return p.match_status === 'manual_review' || p.match_status === 'unmatched';
    });
    // Eslesen abone bilgisini ekle
    var enriched = pending.map(function(p) {
      var sub = null;
      if (p.matched_subscriber_id) {
        for (var i = 0; i < _mockSubscribers.length; i++) {
          if (_mockSubscribers[i].id === p.matched_subscriber_id) { sub = _mockSubscribers[i]; break; }
        }
      }
      return Object.assign({}, p, {
        matched_subscriber_name: sub ? sub.full_name : null,
        matched_subscriber_abone_no: sub ? sub.abone_no : null
      });
    });
    return { ok: true, data: enriched };
  }

  async function approvePayment(tx_id, subscriber_id) {
    await _delay(400);
    for (var i = 0; i < _mockPendingPayments.length; i++) {
      if (_mockPendingPayments[i].tx_id === tx_id) {
        _mockPendingPayments[i].match_status = 'approved';
        // Abonenin bakiyesini guncelle
        if (subscriber_id) {
          for (var j = 0; j < _mockSubscribers.length; j++) {
            if (_mockSubscribers[j].id === subscriber_id) {
              _mockSubscribers[j].balance += _mockPendingPayments[i].amount;
              if (_mockSubscribers[j].balance >= 0) {
                _mockSubscribers[j].payment_status = 'paid';
                _mockSubscribers[j].balance = 0;
              }
              break;
            }
          }
        }
        return { ok: true, data: { tx_id: tx_id, status: 'approved' } };
      }
    }
    return { ok: false, error: 'Islem bulunamadi' };
  }

  async function rejectPayment(tx_id) {
    await _delay(300);
    for (var i = 0; i < _mockPendingPayments.length; i++) {
      if (_mockPendingPayments[i].tx_id === tx_id) {
        _mockPendingPayments[i].match_status = 'rejected';
        return { ok: true, data: { tx_id: tx_id, status: 'rejected' } };
      }
    }
    return { ok: false, error: 'Islem bulunamadi' };
  }

  // ════════════════════════════════════
  // ── DEVICES (Cihaz Yonetimi) ──
  // ════════════════════════════════════
  async function getDevices(params) {
    await _delay();
    params = params || {};
    var list = _mockDevices.slice();

    if (params.type && params.type !== 'all') {
      list = list.filter(function(d) { return d.device_type === params.type; });
    }
    if (params.status && params.status !== 'all') {
      list = list.filter(function(d) { return d.status === params.status; });
    }

    return { ok: true, data: list };
  }

  async function getDevice(id) {
    await _delay();
    var dev = null;
    for (var i = 0; i < _mockDevices.length; i++) {
      if (_mockDevices[i].id === id) { dev = _mockDevices[i]; break; }
    }
    if (!dev) return { ok: false, error: 'Cihaz bulunamadi' };

    // Cihaza ait alarmlar
    var alarms = _mockAlarms.filter(function(a) { return a.device_id === id; });
    // Cihaza bagli aboneler (router ise)
    var subscribers = [];
    if (dev.device_type === 'router') {
      subscribers = _mockSubscribers.filter(function(s) { return s.mikrotik_router === dev.ip_address; });
    }

    return { ok: true, data: Object.assign({}, dev, { alarms: alarms, subscribers: subscribers }) };
  }

  async function createDevice(data) {
    await _delay(400);
    var newDev = Object.assign({
      id: 'DEV-' + String(100 + _mockDevices.length).padStart(3, '0'),
      status: 'offline',
      uptime: 0,
      cpu_usage: 0,
      ram_usage: 0
    }, data);
    _mockDevices.push(newDev);
    return { ok: true, data: newDev };
  }

  async function updateDevice(id, data) {
    await _delay(300);
    for (var i = 0; i < _mockDevices.length; i++) {
      if (_mockDevices[i].id === id) {
        Object.assign(_mockDevices[i], data);
        return { ok: true, data: _mockDevices[i] };
      }
    }
    return { ok: false, error: 'Cihaz bulunamadi' };
  }

  async function deleteDevice(id) {
    await _delay(300);
    for (var i = 0; i < _mockDevices.length; i++) {
      if (_mockDevices[i].id === id) {
        _mockDevices.splice(i, 1);
        return { ok: true };
      }
    }
    return { ok: false, error: 'Cihaz bulunamadi' };
  }

  async function assignDeviceToBuilding(device_id, building_id, ada_code, coverage_type) {
    await _delay(300);
    for (var i = 0; i < _mockDevices.length; i++) {
      if (_mockDevices[i].id === device_id) {
        _mockDevices[i].building_id = building_id;
        _mockDevices[i].ada_code = ada_code;
        return { ok: true, data: _mockDevices[i] };
      }
    }
    return { ok: false, error: 'Cihaz bulunamadi' };
  }

  async function unassignDevice(device_id, building_id) {
    await _delay(200);
    for (var i = 0; i < _mockDevices.length; i++) {
      if (_mockDevices[i].id === device_id) {
        _mockDevices[i].building_id = null;
        _mockDevices[i].ada_code = null;
        return { ok: true };
      }
    }
    return { ok: false, error: 'Cihaz bulunamadi' };
  }

  async function getDevicesByBuilding(building_id) {
    await _delay();
    var list = _mockDevices.filter(function(d) { return d.building_id === building_id; });
    return { ok: true, data: list };
  }

  async function getDevicesByAda(ada_code) {
    await _delay();
    var list = _mockDevices.filter(function(d) { return d.ada_code === ada_code; });
    return { ok: true, data: list };
  }

  // ════════════════════════════════════
  // ── ALARMS (Ariza/Alarm) ──
  // ════════════════════════════════════
  async function getAlarms(params) {
    await _delay();
    params = params || {};
    var list = _mockAlarms.slice();

    if (params.status === 'active') {
      list = list.filter(function(a) { return !a.resolved; });
    } else if (params.status === 'resolved') {
      list = list.filter(function(a) { return a.resolved; });
    }

    if (params.severity && params.severity !== 'all') {
      list = list.filter(function(a) { return a.severity === params.severity; });
    }

    return { ok: true, data: list };
  }

  async function getActiveAlarms() {
    await _delay();
    var active = _mockAlarms.filter(function(a) { return !a.resolved; });
    return { ok: true, data: active };
  }

  async function acknowledgeAlarm(id) {
    await _delay(200);
    for (var i = 0; i < _mockAlarms.length; i++) {
      if (_mockAlarms[i].id === id) {
        _mockAlarms[i].acknowledged = true;
        return { ok: true, data: _mockAlarms[i] };
      }
    }
    return { ok: false, error: 'Alarm bulunamadi' };
  }

  async function resolveAlarm(id, note) {
    await _delay(300);
    for (var i = 0; i < _mockAlarms.length; i++) {
      if (_mockAlarms[i].id === id) {
        _mockAlarms[i].resolved = true;
        _mockAlarms[i].resolved_at = new Date().toISOString();
        _mockAlarms[i].resolved_note = note || '';
        return { ok: true, data: _mockAlarms[i] };
      }
    }
    return { ok: false, error: 'Alarm bulunamadi' };
  }

  async function getAlarmSummary() {
    await _delay(100);
    var active = _mockAlarms.filter(function(a) { return !a.resolved; });
    return {
      ok: true,
      data: {
        critical: active.filter(function(a) { return a.severity === 'critical'; }).length,
        warning: active.filter(function(a) { return a.severity === 'warning'; }).length,
        info: active.filter(function(a) { return a.severity === 'info'; }).length
      }
    };
  }

  async function getAffectedSubscribers(alarm_id) {
    await _delay();
    var alarm = null;
    for (var i = 0; i < _mockAlarms.length; i++) {
      if (_mockAlarms[i].id === alarm_id) { alarm = _mockAlarms[i]; break; }
    }
    if (!alarm) return { ok: false, error: 'Alarm bulunamadi' };

    var subs = [];
    for (var j = 0; j < _mockSubscribers.length; j++) {
      if (alarm.affected_subscriber_ids.indexOf(_mockSubscribers[j].id) !== -1) {
        subs.push(_mockSubscribers[j]);
      }
    }
    return { ok: true, data: subs };
  }

  // ════════════════════════════════════
  // ── MONITORING ──
  // ════════════════════════════════════
  async function getDeviceStatuses() {
    await _delay();
    var statuses = _mockDevices.map(function(d) {
      return { id: d.id, name: d.name, device_type: d.device_type, status: d.status, ip_address: d.ip_address };
    });
    return { ok: true, data: statuses };
  }

  async function getRouterStats(router_ip) {
    await _delay();
    var router = null;
    for (var i = 0; i < _mockDevices.length; i++) {
      if (_mockDevices[i].ip_address === router_ip && _mockDevices[i].device_type === 'router') {
        router = _mockDevices[i]; break;
      }
    }
    if (!router) return { ok: false, error: 'Router bulunamadi' };

    var subscriberCount = _mockSubscribers.filter(function(s) { return s.mikrotik_router === router_ip && s.is_active; }).length;

    return {
      ok: true,
      data: {
        name: router.name,
        model: router.model,
        ip: router.ip_address,
        cpu_usage: router.cpu_usage + Math.round(Math.random() * 10 - 5),
        ram_usage: router.ram_usage + Math.round(Math.random() * 5 - 2),
        uptime: router.uptime,
        version: 'RouterOS 7.16',
        active_sessions: subscriberCount,
        interfaces: [
          { name: 'ether1-WAN', rx_rate: '245.8 Mbps', tx_rate: '48.2 Mbps', status: 'up' },
          { name: 'ether2-LAN', rx_rate: '198.3 Mbps', tx_rate: '210.5 Mbps', status: 'up' },
          { name: 'sfp1-Uplink', rx_rate: '412.0 Mbps', tx_rate: '385.7 Mbps', status: 'up' }
        ]
      }
    };
  }

  async function getActiveSessions(router_ip) {
    await _delay();
    var sessions = _mockSubscribers
      .filter(function(s) { return s.mikrotik_router === router_ip && s.is_active; })
      .map(function(s) {
        return {
          username: s.mikrotik_user,
          ip: s.mikrotik_ip,
          uptime: Math.floor(Math.random() * 86400 * 7) + 3600,
          rx_rate: Math.round(Math.random() * 50 * 10) / 10 + ' Mbps',
          tx_rate: Math.round(Math.random() * 10 * 10) / 10 + ' Mbps',
          caller_id: 'AA:BB:' + Math.random().toString(16).substr(2, 11).toUpperCase().match(/.{2}/g).join(':')
        };
      });
    return { ok: true, data: sessions };
  }

  // ════════════════════════════════════
  // ── WHATSAPP ──
  // ════════════════════════════════════
  async function getConversations(status) {
    await _delay();
    var list = _mockConversations.slice();
    if (status && status !== 'all') {
      list = list.filter(function(c) { return c.status === status; });
    }
    return { ok: true, data: list };
  }

  async function resolveConversation(id) {
    await _delay(200);
    for (var i = 0; i < _mockConversations.length; i++) {
      if (_mockConversations[i].id === id) {
        _mockConversations[i].status = 'resolved';
        return { ok: true, data: _mockConversations[i] };
      }
    }
    return { ok: false, error: 'Konusma bulunamadi' };
  }

  // ════════════════════════════════════
  // ── MIKROTIK LOG ──
  // ════════════════════════════════════
  async function getMikrotikLog(limit) {
    await _delay();
    var list = _mockMikrotikLog.slice();
    if (limit) list = list.slice(0, limit);
    return { ok: true, data: list };
  }

  // ── Public API ──
  return {
    // Auth
    login: login,
    logout: logout,
    isAuthenticated: isAuthenticated,
    getCurrentUser: getCurrentUser,
    // Dashboard
    getDashboardStats: getDashboardStats,
    // Subscribers
    getSubscribers: getSubscribers,
    getSubscriber: getSubscriber,
    updatePaymentStatus: updatePaymentStatus,
    importSubscribersCsv: importSubscribersCsv,
    // Payments
    getPendingPayments: getPendingPayments,
    approvePayment: approvePayment,
    rejectPayment: rejectPayment,
    // Devices
    getDevices: getDevices,
    getDevice: getDevice,
    createDevice: createDevice,
    updateDevice: updateDevice,
    deleteDevice: deleteDevice,
    assignDeviceToBuilding: assignDeviceToBuilding,
    unassignDevice: unassignDevice,
    getDevicesByBuilding: getDevicesByBuilding,
    getDevicesByAda: getDevicesByAda,
    // Alarms
    getAlarms: getAlarms,
    getActiveAlarms: getActiveAlarms,
    acknowledgeAlarm: acknowledgeAlarm,
    resolveAlarm: resolveAlarm,
    getAlarmSummary: getAlarmSummary,
    getAffectedSubscribers: getAffectedSubscribers,
    // Monitoring
    getDeviceStatuses: getDeviceStatuses,
    getRouterStats: getRouterStats,
    getActiveSessions: getActiveSessions,
    // WhatsApp
    getConversations: getConversations,
    resolveConversation: resolveConversation,
    // MikroTik Log
    getMikrotikLog: getMikrotikLog
  };
})();
