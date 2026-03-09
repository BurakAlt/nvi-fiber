const ping = require('ping');
const EventEmitter = require('events');

class PingMonitor extends EventEmitter {
  constructor(deviceManager, options = {}) {
    super();
    this.dm = deviceManager;
    this.interval = options.interval || 60;     // saniye
    this.timeout = options.timeout || 3;         // saniye
    this.concurrency = options.concurrency || 10; // ayni anda max ping
    this.timer = null;
    this.running = false;
    this.cycleCount = 0;
  }

  start() {
    if (this.running) return;
    this.running = true;
    console.log(`[PingMonitor] Baslatildi - ${this.interval}s aralik, ${this.concurrency} es zamanli`);

    // Ilk taramayi hemen baslat
    this.runCycle();

    // Periyodik tarama
    this.timer = setInterval(() => this.runCycle(), this.interval * 1000);
  }

  stop() {
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log('[PingMonitor] Durduruldu');
  }

  async runCycle() {
    const devices = this.dm.getPingableDevices();
    const startTime = Date.now();
    this.cycleCount++;

    console.log(`[PingMonitor] Dongu #${this.cycleCount} - ${devices.length} cihaz taranacak`);

    // Cihazlari concurrency kadar grupla
    const results = [];
    for (let i = 0; i < devices.length; i += this.concurrency) {
      const batch = devices.slice(i, i + this.concurrency);
      const batchResults = await Promise.all(
        batch.map(dev => this.pingDevice(dev))
      );
      results.push(...batchResults);
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const alive = results.filter(r => r.alive).length;
    const down = results.filter(r => !r.alive).length;

    console.log(`[PingMonitor] Dongu #${this.cycleCount} tamamlandi: ${alive} canli, ${down} dusuk (${elapsed}s)`);

    // Durum degisikligi eventi
    this.emit('cycle-complete', {
      cycle: this.cycleCount,
      total: devices.length,
      alive,
      down,
      elapsed: parseFloat(elapsed),
      results
    });

    // Dusuk cihazlar icin alarm eventi
    const downDevices = this.dm.getDownDevices();
    if (downDevices.length > 0) {
      this.emit('devices-down', downDevices);
    }
  }

  async pingDevice(device) {
    try {
      // IP adresinden port numarasini cikar (195.214.166.129:8218 gibi)
      const ip = device.ip.split(':')[0];

      const res = await ping.promise.probe(ip, {
        timeout: this.timeout,
        extra: process.platform === 'win32' ? ['-n', '1'] : ['-c', '1']
      });

      const responseTime = res.alive ? parseFloat(res.time) || null : null;
      this.dm.updateStatus(device.id, res.alive, responseTime);

      return {
        id: device.id,
        ad: device.ad,
        ip: device.ip,
        alive: res.alive,
        responseTime
      };
    } catch (err) {
      this.dm.updateStatus(device.id, false, null);
      return {
        id: device.id,
        ad: device.ad,
        ip: device.ip,
        alive: false,
        responseTime: null,
        error: err.message
      };
    }
  }

  getInfo() {
    return {
      running: this.running,
      interval: this.interval,
      concurrency: this.concurrency,
      cycleCount: this.cycleCount,
      timeout: this.timeout
    };
  }
}

module.exports = PingMonitor;
