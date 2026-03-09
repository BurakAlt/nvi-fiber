const fs = require('fs');
const path = require('path');

class DeviceManager {
  constructor(configDir) {
    this.configDir = configDir || path.join(__dirname, '..', 'config');
    this.devices = [];
    this.credentials = {};
    this.sites = {};
    this.status = new Map(); // id -> { alive, lastSeen, lastDown, responseTime, uptimePercent, checkCount, aliveCount }
  }

  load() {
    // Cihaz listesini yukle
    const devFile = path.join(this.configDir, 'devices.json');
    const devData = JSON.parse(fs.readFileSync(devFile, 'utf8'));
    this.devices = devData.devices;
    this.sites = devData.sites;

    // Credential profillerini yukle
    const credFile = path.join(this.configDir, 'credentials.json');
    if (fs.existsSync(credFile)) {
      const credData = JSON.parse(fs.readFileSync(credFile, 'utf8'));
      this.credentials = credData.profiles;
    }

    // Her cihaz icin baslangic durumu olustur
    for (const dev of this.devices) {
      if (!this.status.has(dev.id)) {
        this.status.set(dev.id, {
          alive: null,       // null = henuz kontrol edilmedi
          lastSeen: null,    // son gorunme zamani
          lastDown: null,    // son dusme zamani
          responseTime: null,// ms cinsinden ping suresi
          uptimePercent: 0,  // uptime yuzdesi
          checkCount: 0,     // toplam kontrol sayisi
          aliveCount: 0      // canli sayisi
        });
      }
    }

    console.log(`[DeviceManager] ${this.devices.length} cihaz yuklendi, ${Object.keys(this.sites).length} site`);
    return this;
  }

  // Ping sonucunu guncelle
  updateStatus(deviceId, alive, responseTime) {
    const st = this.status.get(deviceId);
    if (!st) return;

    const now = new Date().toISOString();
    st.checkCount++;

    if (alive) {
      st.alive = true;
      st.lastSeen = now;
      st.responseTime = responseTime;
      st.aliveCount++;
    } else {
      // Onceden canli idiyse veya ilk kontrol ise
      if (st.alive !== false) {
        st.lastDown = now;
      }
      st.alive = false;
      st.responseTime = null;
    }

    st.uptimePercent = st.checkCount > 0
      ? Math.round((st.aliveCount / st.checkCount) * 10000) / 100
      : 0;
  }

  // IP adresi olan cihazlari dondur (ping yapilabilir)
  getPingableDevices() {
    return this.devices.filter(d => d.ip && d.ip !== null);
  }

  // Tum cihazlari durumuyla birlikte dondur
  getAllWithStatus() {
    return this.devices.map(dev => {
      const st = this.status.get(dev.id) || {};
      const site = this.sites[dev.site] || {};
      return {
        id: dev.id,
        ad: dev.ad,
        ip: dev.ip,
        tip: dev.tip,
        marka: dev.marka,
        model: dev.model,
        site: dev.site,
        siteAd: site.ad || dev.site,
        rol: dev.rol,
        notlar: dev.notlar,
        // Durum bilgileri
        alive: st.alive,
        lastSeen: st.lastSeen,
        lastDown: st.lastDown,
        responseTime: st.responseTime,
        uptimePercent: st.uptimePercent,
        checkCount: st.checkCount
      };
    });
  }

  // Site bazli ozet
  getSiteSummary() {
    const summary = {};
    for (const dev of this.devices) {
      const siteKey = dev.site || 'diger';
      if (!summary[siteKey]) {
        const siteInfo = this.sites[siteKey] || { ad: siteKey };
        summary[siteKey] = {
          ad: siteInfo.ad,
          toplam: 0,
          canli: 0,
          dusuk: 0,
          bilinmiyor: 0,
          cihazlar: { AP: 0, LINK: 0, SW: 0, 'POE-SW': 0, ROUTER: 0 }
        };
      }

      const s = summary[siteKey];
      s.toplam++;

      const st = this.status.get(dev.id);
      if (st) {
        if (st.alive === true) s.canli++;
        else if (st.alive === false) s.dusuk++;
        else s.bilinmiyor++;
      }

      if (s.cihazlar[dev.tip] !== undefined) s.cihazlar[dev.tip]++;
      else s.cihazlar[dev.tip] = 1;
    }
    return summary;
  }

  // Genel istatistikler
  getStats() {
    let canli = 0, dusuk = 0, bilinmiyor = 0, ipYok = 0;
    for (const dev of this.devices) {
      if (!dev.ip) { ipYok++; continue; }
      const st = this.status.get(dev.id);
      if (!st || st.alive === null) bilinmiyor++;
      else if (st.alive) canli++;
      else dusuk++;
    }
    return {
      toplam: this.devices.length,
      canli,
      dusuk,
      bilinmiyor,
      ipYok,
      siteSayisi: Object.keys(this.sites).length
    };
  }

  // Dusuk cihazlari dondur (alarm icin)
  getDownDevices() {
    return this.devices
      .filter(d => {
        const st = this.status.get(d.id);
        return st && st.alive === false;
      })
      .map(d => ({
        id: d.id,
        ad: d.ad,
        ip: d.ip,
        site: d.site,
        siteAd: (this.sites[d.site] || {}).ad || d.site,
        tip: d.tip,
        lastSeen: (this.status.get(d.id) || {}).lastSeen,
        lastDown: (this.status.get(d.id) || {}).lastDown
      }));
  }
}

module.exports = DeviceManager;
