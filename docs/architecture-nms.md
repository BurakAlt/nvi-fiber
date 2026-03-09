# Mimari - Network Management System (NMS)

**Tip:** Node.js Backend (Express + WebSocket)
**Dil:** JavaScript (Node.js v18+)
**Port:** 3000 (configurable)
**Cihaz Sayisi:** 108 cihaz, 20 site

---

## Genel Bakis

NVI NMS, 108 ag cihazinin (AP, Link, Switch, Router) real-time ping monitoring'ini yapan bir Network Management System'dir. Express REST API + WebSocket ile calisir, built-in web dashboard sunar.

## Sistem Mimarisi

```
┌─────────────────────────────────────────┐
│           Browser Dashboard             │
│  (public/index.html - WebSocket client) │
└────────────┬───────────────┬────────────┘
             │ REST API      │ WebSocket
┌────────────┴───────────────┴────────────┐
│           server.js                      │
│  Express + HTTP + WebSocket Server       │
├──────────────────────────────────────────┤
│                                          │
│  ┌──────────────┐  ┌─────────────────┐  │
│  │DeviceManager │  │  PingMonitor    │  │
│  │              │  │  (EventEmitter) │  │
│  │ devices[]    │  │  runCycle()     │  │
│  │ status Map   │  │  pingDevice()   │  │
│  │ credentials  │  │  concurrency:10 │  │
│  └──────┬───────┘  └────────┬────────┘  │
│         │                    │           │
│  ┌──────┴────────────────────┴────────┐  │
│  │         config/                     │  │
│  │  devices.json (108 cihaz)          │  │
│  │  credentials.json (auth profiles)  │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
             │
      ┌──────┴──────┐
      │  Network    │
      │  108 cihaz  │
      │  ICMP ping  │
      └─────────────┘
```

## Calisma Akisi

### Baslatma
1. `server.js` baslar
2. `DeviceManager.load()` → `config/devices.json` + `credentials.json` yukle
3. `PingMonitor()` instance + options olustur
4. Express app + WebSocket server setup
5. `monitor.start()` → ilk `runCycle()` + `setInterval()`
6. `server.listen(PORT)` → banner yazdir

### Ping Dongusu (Her 60 saniyede)
1. `runCycle()` baslar
2. `getPingableDevices()` → IP adresi olan ~107 cihaz
3. Cihazlari 10'lu batch'lere bol (concurrency)
4. `Promise.all(batch.map(pingDevice))` → paralel ping
5. Her cihaz icin `updateStatus(alive, responseTime)`
6. `emit('cycle-complete')` → WebSocket broadcast
7. Arizali cihaz varsa `emit('devices-down')` → alarm

### Client Real-time Guncelleme
1. Browser `http://localhost:3000` acar
2. `fetchDevices()` → `GET /api/devices` → tablo render
3. `fetchStats()` → `GET /api/stats` → stat card guncelle
4. `connectWS()` → `ws://localhost:3000` baglantisi
5. WebSocket `ilk-durum` mesaji → durum guncelle
6. Ping cycle tamamlaninca `dongu-tamamlandi` mesaji → re-render
7. Cihaz duserse `alarm` mesaji → log + tablo guncelle

## Modul Detaylari

### DeviceManager (lib/device-manager.js)

**Class:** `DeviceManager`

| Metot | Aciklama |
|-------|----------|
| `load()` | devices.json + credentials.json yukle, status Map'i baslat |
| `updateStatus(id, alive, responseTime)` | Ping sonucunu kaydet, uptime hesapla |
| `getPingableDevices()` | IP adresi olan cihazlari don |
| `getAllWithStatus()` | Tum cihazlari durum bilgisiyle don |
| `getSiteSummary()` | Site bazli ozet (canli/dusuk/bilinmiyor) |
| `getStats()` | Genel istatistikler |
| `getDownDevices()` | Arizali cihaz listesi |

**Status Object:**
```javascript
{
  alive: true|false|null,
  lastSeen: "ISO string"|null,
  lastDown: "ISO string"|null,
  responseTime: 12.5,  // ms
  uptimePercent: 98.5,
  checkCount: 150,
  aliveCount: 148
}
```

### PingMonitor (lib/ping-monitor.js)

**Class:** `PingMonitor extends EventEmitter`

| Metot | Aciklama |
|-------|----------|
| `start()` | Periyodik taramayi baslat |
| `stop()` | Taramayi durdur |
| `runCycle()` | Tek ping dongusu calistir |
| `pingDevice(device)` | Tekli cihaz ping (IP:port ayirma dahil) |
| `getInfo()` | Monitor durumu bilgisi |

**Events:**
| Event | Data | Aciklama |
|-------|------|----------|
| `cycle-complete` | `{ cycle, total, alive, down, elapsed, results }` | Ping dongusu tamamlandi |
| `devices-down` | `{ dusukCihazlar, zaman }` | Arizali cihaz alarmi |

## Konfigürasyon

### Ortam Degiskenleri

| Degisken | Varsayilan | Aciklama |
|----------|-----------|----------|
| `PORT` | 3000 | Server portu |
| `PING_INTERVAL` | 60 | Ping araligi (saniye) |
| `PING_CONCURRENCY` | 10 | Es zamanli ping sayisi |
| `PING_TIMEOUT` | 3 | Ping timeout (saniye) |

### devices.json Semasi

```json
{
  "meta": { "version": "2.0", "toplam_cihaz": 108 },
  "sites": {
    "verici": { "ad": "Verici Tepe", "tip": "bts" },
    "esentepe": { "ad": "Esentepe", "tip": "bts" },
    ...
  },
  "devices": [
    {
      "id": "ESENTEPE_AF60LR",
      "ad": "ESENTEPE_AF_60_LR",
      "ip": "10.249.251.19",
      "tip": "LINK",
      "marka": "ubiquiti",
      "model": "AF60 LR",
      "credential": "ubnt-default",
      "site": "esentepe",
      "rol": "ptp-station",
      "notlar": "Esentepe-Verici 60GHz link"
    }
  ]
}
```

### credentials.json (GIZLI)

```json
{
  "ubnt-default": { "username": "ubnt", "password": "***", "protocol": "ssh" },
  "admin-default": { "username": "admin", "password": "***", "protocol": "http" },
  "burak-router": { "username": "burak", "password": "***", "protocol": "winbox" }
}
```

## Cihaz Envanteri

| Tip | Sayi | Aciklama |
|-----|------|----------|
| AP | ~60 | Wireless Access Point |
| LINK | ~15 | PtP/60GHz backhaul |
| SW | ~5 | Core switch |
| POE-SW | ~10 | PoE switch |
| ROUTER | ~3 | MikroTik router |

**Markalar:** Ubiquiti, MikroTik, Mimosa, Generic
**Siteler:** 20 site (Verici, Esentepe, Kale, Akif, Azam, Billurbey, Tuzlu, Ballica, Civi, Damla, Oge, Tugay, Simsekler, vb.)

## Dashboard UI (public/index.html)

Inline HTML + CSS + JS (single file):
- **Dark theme** CSS variables
- **Responsive grid** auto-fit layout
- **Status renkleri:** Yesil (up), Kirmizi (down), Sari (unknown)
- **Pulse animation** durum indikatoru
- **Site kartlari:** Grid gorunum, bar grafik
- **Cihaz tablosu:** Siralanabilir, filtrelenebilir, aranabilir
- **Log paneli:** Max 50 entry, real-time
- **Fallback polling:** WebSocket duserse 30s interval REST polling

## Gelecek Planlari

- SNMP entegrasyonu (bant genisligi, CPU, bellek metrikleri)
- TR-069/ACS entegrasyonu (fiber ONT yonetimi)
- Gercek veritabani (PostgreSQL/SQLite)
- Alarm gecmisi ve raporlama
- Kullanici kimlik dogrulama
- Cihaz konfigürasyon yedekleme
