# NMS API Sozlesmeleri

**Tarih:** 2026-03-08

Bu dokuman NMS (Network Management System) sunucusunun tum REST API endpoint'lerini ve WebSocket mesaj formatlarini detayli olarak belgelemektedir.

---

## Genel Bilgi

| Ozellik | Deger |
|---------|-------|
| Temel URL | `http://localhost:3000` |
| Protokol | HTTP/1.1 + WebSocket |
| Icerik Tipi | `application/json` |
| Kimlik Dogrulama | Yok (yerel ag) |
| CORS | `Access-Control-Allow-Origin: *` |

---

## REST API Endpoint'leri

### GET /api/stats

Genel sistem istatistiklerini dondurur.

**Istek:** Parametre yok

**Yanit:**
```json
{
  "toplam": 108,
  "canli": 85,
  "dusuk": 12,
  "bilinmiyor": 5,
  "ipYok": 6,
  "siteSayisi": 20,
  "monitor": {
    "running": true,
    "interval": 60,
    "concurrency": 10,
    "cycleCount": 42,
    "timeout": 3
  },
  "zaman": "2026-03-08T14:30:00.000Z"
}
```

| Alan | Tip | Aciklama |
|------|-----|----------|
| toplam | number | Toplam kayitli cihaz sayisi |
| canli | number | Son taramada erisilebilir cihazlar |
| dusuk | number | Son taramada erisilemez cihazlar |
| bilinmiyor | number | Henuz taranmamis cihazlar |
| ipYok | number | IP adresi tanimlanmamis cihazlar |
| siteSayisi | number | Toplam site (lokasyon) sayisi |
| monitor.running | boolean | Ping monitor calisma durumu |
| monitor.interval | number | Tarama araligi (saniye) |
| monitor.concurrency | number | Ayni anda max ping |
| monitor.cycleCount | number | Tamamlanan tarama dongusu sayisi |
| monitor.timeout | number | Tek ping zaman asimi (saniye) |
| zaman | string | ISO 8601 zaman damgasi |

---

### GET /api/devices

Tum cihazlari durum bilgisiyle dondurur. Filtreleme ve siralama destekler.

**Query Parametreleri:**

| Parametre | Tip | Degerler | Aciklama |
|-----------|-----|----------|----------|
| site | string | site anahtari | Site bazli filtre (ornek: `esentepe`) |
| tip | string | `AP`, `LINK`, `SW`, `POE-SW`, `ROUTER` | Cihaz tipi filtresi |
| marka | string | `ubiquiti`, `mikrotik`, `tplink`, ... | Marka filtresi |
| durum | string | `canli`, `dusuk`, `bilinmiyor` | Erisilebilirlik filtresi |
| sirala | string | `ping`, `ad`, `uptime` | Siralama alani |

**Ornek Istek:**
```
GET /api/devices?site=esentepe&durum=canli&sirala=ping
```

**Yanit:**
```json
{
  "toplam": 12,
  "devices": [
    {
      "id": "ESENTEPE_AF60LR",
      "ad": "ESENTEPE_AF_60_LR",
      "ip": "10.249.251.19",
      "tip": "LINK",
      "marka": "ubiquiti",
      "model": "AF60 LR",
      "site": "esentepe",
      "siteAd": "Esentepe",
      "rol": "ptp-station",
      "notlar": "Esentepe-Verici 60GHz link",
      "alive": true,
      "lastSeen": "2026-03-08T14:29:55.000Z",
      "lastDown": null,
      "responseTime": 2.5,
      "uptimePercent": 99.85,
      "checkCount": 672
    }
  ]
}
```

**Cihaz Alanlari:**

| Alan | Tip | Aciklama |
|------|-----|----------|
| id | string | Benzersiz cihaz ID'si |
| ad | string | Gorsel cihaz adi |
| ip | string\|null | IP adresi (port dahil olabilir: `x.x.x.x:port`) |
| tip | string | Cihaz tipi: AP, LINK, SW, POE-SW, ROUTER |
| marka | string | Uretici |
| model | string | Model adi |
| site | string | Site anahtari |
| siteAd | string | Site gorsel adi |
| rol | string | Ag rolu: ap, ptp-station, ptp-master, switch, router |
| notlar | string | Serbest metin aciklama |
| alive | boolean\|null | Canli mi? null=henuz kontrol edilmedi |
| lastSeen | string\|null | Son erisilebilirlik zamani (ISO 8601) |
| lastDown | string\|null | Son dusme zamani (ISO 8601) |
| responseTime | number\|null | Ping suresi (ms) |
| uptimePercent | number | Uptime yuzdesi (0-100, 2 ondalik) |
| checkCount | number | Toplam ping kontrolu sayisi |

---

### GET /api/devices/:id

Tek cihaz detayini dondurur.

**Parametreler:**
- `:id` — Cihaz ID'si (ornek: `ESENTEPE_AF60LR`)

**Basarili Yanit (200):**
```json
{
  "id": "ESENTEPE_AF60LR",
  "ad": "ESENTEPE_AF_60_LR",
  "ip": "10.249.251.19",
  ...
}
```

**Hata Yaniti (404):**
```json
{
  "hata": "Cihaz bulunamadi"
}
```

---

### GET /api/alerts

Dusuk (erisilemez) cihazlarin listesini dondurur.

**Yanit:**
```json
{
  "dusukCihazlar": [
    {
      "id": "DAMLA_LHG60",
      "ad": "DAMLA_LHG_60",
      "ip": "10.249.251.10",
      "site": "damla",
      "siteAd": "Damla",
      "tip": "LINK",
      "lastSeen": "2026-03-08T10:15:00.000Z",
      "lastDown": "2026-03-08T10:16:00.000Z"
    }
  ],
  "zaman": "2026-03-08T14:30:00.000Z"
}
```

---

### GET /api/sites

Site bazli ozet istatistik dondurur.

**Yanit:**
```json
{
  "esentepe": {
    "ad": "Esentepe",
    "toplam": 8,
    "canli": 7,
    "dusuk": 1,
    "bilinmiyor": 0,
    "cihazlar": {
      "AP": 3,
      "LINK": 2,
      "SW": 1,
      "POE-SW": 1,
      "ROUTER": 1
    }
  },
  "verici": { ... },
  "kale": { ... }
}
```

---

### POST /api/monitor/start

Ping monitor'u baslatir.

**Istek gövdesi:** Yok

**Yanit:**
```json
{
  "durum": "baslatildi",
  "running": true,
  "interval": 60,
  "concurrency": 10,
  "cycleCount": 0,
  "timeout": 3
}
```

---

### POST /api/monitor/stop

Ping monitor'u durdurur.

**Yanit:**
```json
{
  "durum": "durduruldu",
  "running": false,
  "interval": 60,
  "concurrency": 10,
  "cycleCount": 42,
  "timeout": 3
}
```

---

### POST /api/ping/:id

Tek bir cihaza manuel ping gonderir.

**Parametreler:**
- `:id` — Cihaz ID'si

**Basarili Yanit (200):**
```json
{
  "id": "ESENTEPE_AF60LR",
  "ad": "ESENTEPE_AF_60_LR",
  "ip": "10.249.251.19",
  "alive": true,
  "responseTime": 2.3
}
```

**Hata Yanitlari:**

| Kod | Yanit | Kosul |
|-----|-------|-------|
| 404 | `{"hata": "Cihaz bulunamadi"}` | Gecersiz ID |
| 400 | `{"hata": "IP adresi yok"}` | IP tanimlanmamis |

---

## WebSocket Protokolu

### Baglanti

```
ws://localhost:3000
```

Baglanti kuruldugunda sunucu otomatik olarak `ilk-durum` mesaji gonderir.

### Sunucudan Istemciye Mesajlar

#### tip: "ilk-durum"

Baglanti sonrasi ilk durum bildirimi.

```json
{
  "tip": "ilk-durum",
  "stats": {
    "toplam": 108,
    "canli": 85,
    "dusuk": 12,
    "bilinmiyor": 5,
    "ipYok": 6,
    "siteSayisi": 20
  },
  "monitor": {
    "running": true,
    "interval": 60,
    "concurrency": 10,
    "cycleCount": 42,
    "timeout": 3
  }
}
```

#### tip: "dongu-tamamlandi"

Her ping tarama dongusu tamamlandiginda gonderilir.

```json
{
  "tip": "dongu-tamamlandi",
  "stats": {
    "toplam": 108,
    "canli": 87,
    "dusuk": 10,
    "bilinmiyor": 5,
    "ipYok": 6,
    "siteSayisi": 20
  },
  "monitor": {
    "running": true,
    "interval": 60,
    "concurrency": 10,
    "cycleCount": 43,
    "timeout": 3
  },
  "sonuc": {
    "canli": 87,
    "dusuk": 10,
    "sure": 6.2
  },
  "zaman": "2026-03-08T14:31:00.000Z"
}
```

| Alan | Tip | Aciklama |
|------|-----|----------|
| sonuc.canli | number | Bu dongude erisilebilir cihaz sayisi |
| sonuc.dusuk | number | Bu dongude erisilemez cihaz sayisi |
| sonuc.sure | number | Dongu suresi (saniye) |

#### tip: "alarm"

Dusuk cihaz tespit edildiginde gonderilir (her dongu sonrasi, dusuk cihaz varsa).

```json
{
  "tip": "alarm",
  "dusukCihazlar": [
    {
      "id": "DAMLA_LHG60",
      "ad": "DAMLA_LHG_60",
      "ip": "10.249.251.10",
      "site": "damla",
      "siteAd": "Damla",
      "tip": "LINK",
      "lastSeen": "2026-03-08T10:15:00.000Z",
      "lastDown": "2026-03-08T10:16:00.000Z"
    }
  ],
  "zaman": "2026-03-08T14:31:00.000Z"
}
```

### Istemciden Sunucuya

Simdilik istemciden sunucuya mesaj destegi **yoktur**. Tum kontrol REST API uzerinden yapilir.

---

## Cihaz Envanteri Semasi (devices.json)

### Ust Yapi

```json
{
  "meta": {
    "version": "1.0.0",
    "olusturulma": "2026-03-08",
    "guncelleme": "2026-03-08",
    "toplam_cihaz": 108,
    "aciklama": "NVI FIBER ag cihaz envanteri"
  },
  "sites": { ... },
  "devices": [ ... ]
}
```

### Site Nesnesi

```json
{
  "site-anahtari": {
    "ad": "Gorsel ad",
    "aciklama": "Site aciklamasi",
    "tip": "bts|sektor|uzak|merkez|diger"
  }
}
```

**Site Tipleri:**

| Tip | Aciklama | Ornek |
|-----|----------|-------|
| bts | Baz istasyonu / verici | Verici Tepe, Esentepe, Kale |
| sektor | Sektor bolgesi | Akif, Azam, Billurbey, Tuzlu |
| uzak | Uzak nokta / koy | Ballica, Civi, Damla, Oge, Tugay |
| merkez | Merkez / backbone | Merkez Ofis, Backbone |
| diger | Kategorize edilmemis | — |

### Cihaz Nesnesi

```json
{
  "id": "BENZERSIZ_ID",
  "ad": "Gorsel_Ad",
  "ip": "10.x.x.x",
  "tip": "LINK",
  "marka": "ubiquiti",
  "model": "AF60 LR",
  "credential": "ubnt-default",
  "site": "esentepe",
  "rol": "ptp-station",
  "notlar": "Aciklama"
}
```

**Cihaz Tipleri:**

| Tip | Aciklama | Ornek Markalar |
|-----|----------|----------------|
| AP | Access Point (kablosuz erisim noktasi) | Ubiquiti, TP-Link |
| LINK | Noktadan noktaya link (PtP) | Ubiquiti AF60 LR, LHG 60 |
| SW | Switch (aganahtari) | MikroTik CSS610 |
| POE-SW | PoE Switch | MikroTik netPower |
| ROUTER | Yonlendirici | MikroTik RB, CCR |

**Roller:**

| Rol | Aciklama |
|-----|----------|
| ap | Access point istemci erisimi |
| ptp-station | PtP link station tarafi |
| ptp-master | PtP link AP/master tarafi |
| switch | L2 switch |
| router | L3 yonlendirici |
| core | Omurga cihazi |

### Credential Profilleri (credentials.json)

```json
{
  "profiles": {
    "ubnt-default": {
      "username": "...",
      "password": "..."
    },
    "mikrotik-admin": {
      "username": "...",
      "password": "..."
    }
  }
}
```

> **GIZLI DOSYA** — Bu dosya kaynak kontrolune eklenmemelidir.

---

## Envanter Istatistikleri

| Metrik | Deger |
|--------|-------|
| Toplam cihaz | 108 |
| Toplam site | 20 |
| Site tipleri | 3 BTS, 4 Sektor, 9 Uzak, 2 Merkez, 2 Diger |
| Cihaz tipleri | AP, LINK, SW, POE-SW, ROUTER |
| Markalar | Ubiquiti, MikroTik, TP-Link |
| IP atanmis | ~102 cihaz |
| IP atanmamis | ~6 cihaz |

---

## Hata Kodlari

| HTTP Kodu | Durum | Aciklama |
|-----------|-------|----------|
| 200 | OK | Basarili istek |
| 400 | Bad Request | Eksik parametre (ornek: IP adresi yok) |
| 404 | Not Found | Cihaz bulunamadi |

---

## Gelecek Gelistirmeler (Henuz Uygulanmamis)

- [ ] SNMP entegrasyonu (cihaz detay metrikleri)
- [ ] Gecmis veri saklama (uptime grafikleri)
- [ ] Webhook alarm bildirimleri (Telegram, e-posta)
- [ ] Kimlik dogrulama (JWT/token)
- [ ] Rate limiting
- [ ] Cihaz CRUD API (POST/PUT/DELETE /api/devices)
- [ ] Ping sonuc gecmisi API (GET /api/devices/:id/history)
