const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const DeviceManager = require('./lib/device-manager');
const PingMonitor = require('./lib/ping-monitor');

// ─── Yapilandirma ─────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const PING_INTERVAL = parseInt(process.env.PING_INTERVAL) || 60;   // saniye
const PING_CONCURRENCY = parseInt(process.env.PING_CONCURRENCY) || 10;
const PING_TIMEOUT = parseInt(process.env.PING_TIMEOUT) || 3;      // saniye

// ─── Baslat ───────────────────────────────────────────────
const dm = new DeviceManager();
dm.load();

const monitor = new PingMonitor(dm, {
  interval: PING_INTERVAL,
  concurrency: PING_CONCURRENCY,
  timeout: PING_TIMEOUT
});

// ─── Express ──────────────────────────────────────────────
const app = express();
app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Statik dosyalar (dashboard frontend)
app.use(express.static(path.join(__dirname, 'public')));

// ─── REST API ─────────────────────────────────────────────

// Genel istatistikler
app.get('/api/stats', (req, res) => {
  res.json({
    ...dm.getStats(),
    monitor: monitor.getInfo(),
    zaman: new Date().toISOString()
  });
});

// Tum cihazlar (filtrelenebilir)
app.get('/api/devices', (req, res) => {
  let devices = dm.getAllWithStatus();

  // Filtreler
  if (req.query.site) {
    devices = devices.filter(d => d.site === req.query.site);
  }
  if (req.query.tip) {
    devices = devices.filter(d => d.tip === req.query.tip);
  }
  if (req.query.marka) {
    devices = devices.filter(d => d.marka === req.query.marka);
  }
  if (req.query.durum) {
    if (req.query.durum === 'canli') devices = devices.filter(d => d.alive === true);
    else if (req.query.durum === 'dusuk') devices = devices.filter(d => d.alive === false);
    else if (req.query.durum === 'bilinmiyor') devices = devices.filter(d => d.alive === null);
  }

  // Siralama
  if (req.query.sirala === 'ping') {
    devices.sort((a, b) => (a.responseTime || 999) - (b.responseTime || 999));
  } else if (req.query.sirala === 'ad') {
    devices.sort((a, b) => a.ad.localeCompare(b.ad));
  } else if (req.query.sirala === 'uptime') {
    devices.sort((a, b) => (b.uptimePercent || 0) - (a.uptimePercent || 0));
  }

  res.json({
    toplam: devices.length,
    devices
  });
});

// Tek cihaz detayi
app.get('/api/devices/:id', (req, res) => {
  const all = dm.getAllWithStatus();
  const dev = all.find(d => d.id === req.params.id);
  if (!dev) return res.status(404).json({ hata: 'Cihaz bulunamadi' });
  res.json(dev);
});

// Dusuk cihazlar
app.get('/api/alerts', (req, res) => {
  res.json({
    dusukCihazlar: dm.getDownDevices(),
    zaman: new Date().toISOString()
  });
});

// Site ozeti
app.get('/api/sites', (req, res) => {
  res.json(dm.getSiteSummary());
});

// Monitor kontrolu
app.post('/api/monitor/start', (req, res) => {
  monitor.start();
  res.json({ durum: 'baslatildi', ...monitor.getInfo() });
});

app.post('/api/monitor/stop', (req, res) => {
  monitor.stop();
  res.json({ durum: 'durduruldu', ...monitor.getInfo() });
});

// Manuel tekli ping
app.post('/api/ping/:id', async (req, res) => {
  const dev = dm.devices.find(d => d.id === req.params.id);
  if (!dev) return res.status(404).json({ hata: 'Cihaz bulunamadi' });
  if (!dev.ip) return res.status(400).json({ hata: 'IP adresi yok' });

  const result = await monitor.pingDevice(dev);
  res.json(result);
});

// ─── HTTP + WebSocket Sunucusu ────────────────────────────
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Bagli istemcileri takip et
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`[WS] Yeni baglanti (toplam: ${clients.size})`);

  // Baglanti saglandiktan sonra mevcut durumu gonder
  ws.send(JSON.stringify({
    tip: 'ilk-durum',
    stats: dm.getStats(),
    monitor: monitor.getInfo()
  }));

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[WS] Baglanti kapandi (toplam: ${clients.size})`);
  });
});

// WebSocket uzerinden guncelleme gonder
function broadcast(data) {
  const msg = JSON.stringify(data);
  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  }
}

// Monitor eventlerini WS'ye yonlendir
monitor.on('cycle-complete', (data) => {
  broadcast({
    tip: 'dongu-tamamlandi',
    stats: dm.getStats(),
    monitor: monitor.getInfo(),
    sonuc: {
      canli: data.alive,
      dusuk: data.down,
      sure: data.elapsed
    },
    zaman: new Date().toISOString()
  });
});

monitor.on('devices-down', (downDevices) => {
  broadcast({
    tip: 'alarm',
    dusukCihazlar: downDevices,
    zaman: new Date().toISOString()
  });
});

// ─── Sunucuyu Baslat ──────────────────────────────────────
server.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║       NVI FIBER - Network Monitor v1.0      ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  HTTP API:  http://localhost:${PORT}/api/stats  ║`);
  console.log(`║  Dashboard: http://localhost:${PORT}            ║`);
  console.log(`║  WebSocket: ws://localhost:${PORT}              ║`);
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  Cihaz: ${String(dm.devices.length).padEnd(4)} | Site: ${String(Object.keys(dm.sites).length).padEnd(3)} | Ping: ${PING_INTERVAL}s     ║`);
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  // Monitoring'i otomatik baslat
  monitor.start();
});
