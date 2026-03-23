# Anomaly Engine — Tasarım Dokümanı

> **Durum:** Devam ediyor (Bölüm 1-4 onaylandı, Bölüm 5-7 bekliyor)
> **Tarih:** 2026-03-16
> **Yaklaşım:** B — Mikro-servis (bağımsız Anomaly Engine)

---

## Gereksinimler Özeti

| Karar | Seçim |
|-------|-------|
| Hedef kitle | Extension (saha mühendisi) + Portal (NOC ekibi) |
| Metrikler | Sinyal + performans + kapasite |
| Bildirim | Uygulama içi + webhook + CRM ticket + SMS/e-posta |
| Trend ufku | 30+ gün prediktif (Prophet tarzı) |
| Kök neden | Çapraz metrik korelasyon + kaskat etki analizi |
| İşleme | Backend-ağırlıklı (sunucu mevcut) |
| İzleme araçları | UISP/Zabbix YOK — doğrudan cihaz API/SNMP |

### Cihaz Parkı (~1000 cihaz)

| Vendor | Cihaz Tipi | Erişim Yöntemi |
|--------|-----------|----------------|
| MikroTik | Router, wireless backhaul/CPE | RouterOS REST API v7+ |
| VSOL | OLT (tek PON, V1600G serisi) | SNMP v2c |
| TP-Link | ONT (çeşitli) | OLT üzerinden SNMP |
| Ubiquiti | Wireless anten | airOS HTTP API |
| Cambium | Wireless anten | SNMP v2c |
| Mimosa | Wireless anten | SNMP v2c |

**Temel hedef:** Müşteri şikayet etmeden önce ağ sorunlarını tespit etmek.

---

## Bölüm 1: Genel Mimari ve Veri Akışı

```
┌──────────── VERİ TOPLAYICILAR (Collectors) ──────────────────┐
│                                                               │
│  MikroTik Collector     VSOL OLT Collector     Ping Collector│
│  (REST API)             (SNMP v2c)             (fping/ICMP)  │
│  • Router metrikleri    • ONT sinyal/durum     • RTT         │
│  • Wireless metrikleri  • OLT sıcaklık         • Paket kaybı │
│  • PPPoE sessions       • PON port yük                       │
│                                                               │
│  UBNT Collector    Cambium Collector    Mimosa Collector      │
│  (airOS HTTP API)  (SNMP v2c)          (SNMP v2c)            │
│  • signal/noise    • RSSI/SNR          • signal/SNR          │
│  • airmax q/c      • throughput        • throughput           │
│  • clients         • clients           • link status          │
└───────────────────────────┬───────────────────────────────────┘
                            ▼
┌─────────────── ANOMALY ENGINE (FastAPI, port 8100) ──────────┐
│                                                               │
│  ┌───────────┐  ┌───────────┐  ┌────────────┐               │
│  │ Normalizer│→ │Rule Engine│→ │ Correlator │               │
│  │(birleştir)│  │(anomali)  │  │(kök neden) │               │
│  └─────┬─────┘  └─────┬─────┘  └─────┬──────┘               │
│        ▼               ▼               ▼                      │
│  ┌─────────────────────────────────────────────┐             │
│  │  TimescaleDB (metrik) + PostgreSQL (alarm)  │             │
│  └─────────────────────────────────────────────┘             │
│                                                               │
│  Celery + Redis                                              │
│  ┌──────────┐  ┌──────────┐  ┌────────────────┐             │
│  │ Prophet  │  │ Baseline │  │ Notification   │             │
│  │ Predictor│  │ Builder  │  │ Hub (WH/SMS/WS)│             │
│  └──────────┘  └──────────┘  └────────────────┘             │
└──────────────────────┬────────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
  Extension (WS)   Portal (WS)   ISP CRM (REST)
  toast + badge    dashboard      auto-ticket
```

### Temel Bileşenler

| Bileşen | Sorumluluk | Teknoloji |
|---------|-----------|-----------|
| **Collector** | Cihazlardan metrik toplama, normalize etme | Python (asyncio, pysnmp, httpx) |
| **Normalizer** | Multi-vendor veriyi standart formata dönüştürme | In-process |
| **Rule Engine** | Tanımlı kurallara göre anlık anomali tespiti | Python, in-process |
| **Correlator** | Topoloji grafiği üzerinde kök neden analizi + kaskat etki | NetworkX |
| **Prophet Worker** | 30+ gün veriyle trend analizi, tahmin, baseline oluşturma | Celery + Prophet |
| **Notification Hub** | Alarm → webhook, email, SMS, WebSocket push | Celery task |
| **TimescaleDB** | Zaman serisi metrik depolama (hypertable, sıkıştırma, retention) | PostgreSQL eklentisi |
| **Redis** | Celery broker + anlık metrik cache + alarm deduplikasyon | Redis 7 |

### Veri Akışı (Bir Polling Döngüsü)

1. Collector'lar zamanlanmış aralıklarla cihazlardan veri toplar
2. Normalizer → standart metrik formatına dönüştürür
3. TimescaleDB'ye batch insert
4. Rule Engine → kural değerlendirme → anomali varsa Correlator'a gönder
5. Correlator → topoloji grafiğinde upstream/downstream analiz → etki hesabı
6. Anomali kesinleşirse → alarm oluştur (deduplikasyon kontrolü)
7. Notification Hub → webhook + email + SMS + WS push
8. ISP CRM → POST /api/anomalies (otomatik arıza kaydı)
9. Extension → WS üzerinden anlık toast + badge güncelleme
10. Portal → WS üzerinden dashboard + harita güncelleme

---

## Bölüm 2: Veritabanı Şeması

### TimescaleDB — Metrik Tabloları (Hypertable)

```sql
-- Ana metrik tablosu — tüm cihazlardan gelen ham veriler
CREATE TABLE metrics (
    time        TIMESTAMPTZ NOT NULL,
    device_id   TEXT NOT NULL,          -- 'mikrotik:192.168.1.1' | 'vsol:ont-001'
    device_type TEXT NOT NULL,          -- 'router' | 'olt' | 'ont' | 'wireless_backhaul' | 'wireless_cpe'
    metric_name TEXT NOT NULL,          -- 'signal_rx' | 'bandwidth_down' | 'latency' ...
    value       DOUBLE PRECISION,
    unit        TEXT,                   -- 'dBm' | 'Mbps' | 'ms' | '%' | '°C'
    ada_id      TEXT,                   -- topoloji bağlantısı
    building_key TEXT                   -- bina bağlantısı
);
SELECT create_hypertable('metrics', 'time');

-- Otomatik sıkıştırma: 7 günden eski veri sıkıştır
SELECT add_compression_policy('metrics', INTERVAL '7 days');

-- Retention: 90 gün (Prophet için 30 gün yeterli, 90 gün güvenlik marjı)
SELECT add_retention_policy('metrics', INTERVAL '90 days');

-- Sürekli toplam — saatlik özet (dashboard ve Prophet için)
CREATE MATERIALIZED VIEW metrics_hourly
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', time) AS bucket,
    device_id, metric_name,
    avg(value)   AS avg_val,
    min(value)   AS min_val,
    max(value)   AS max_val,
    stddev(value) AS stddev_val,
    count(*)     AS sample_count
FROM metrics
GROUP BY bucket, device_id, metric_name;
```

### PostgreSQL — Operasyonel Tablolar

```sql
-- Cihaz envanteri
CREATE TABLE devices (
    id          TEXT PRIMARY KEY,       -- 'mikrotik:10.0.0.1' | 'ubnt:10.0.2.5'
    name        TEXT NOT NULL,
    type        TEXT NOT NULL,          -- 'router' | 'olt' | 'ont' | 'wireless_backhaul' | 'wireless_cpe'
    category    TEXT,                   -- 'fiber' | 'wireless' | 'router'
    ip          INET,
    mac         MACADDR,
    model       TEXT,                   -- 'CCR1009' | 'V1600G' | 'LHG XL 5ac' | 'ePMP 1000'
    vendor      TEXT,                   -- 'mikrotik' | 'vsol' | 'tplink' | 'ubnt' | 'cambium' | 'mimosa'
    ada_id      TEXT,
    building_key TEXT,
    parent_id   TEXT REFERENCES devices(id),  -- ONT → OLT, Station → AP ilişkisi
    link_peer_id TEXT REFERENCES devices(id), -- PtP link karşı taraf
    frequency_band TEXT,                -- '2.4GHz' | '5GHz' | '60GHz'
    config      JSONB DEFAULT '{}',     -- SNMP community, API credentials
    status      TEXT DEFAULT 'unknown',
    last_seen   TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- Alarm kuralları
CREATE TABLE alert_rules (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT,
    enabled     BOOLEAN DEFAULT true,
    conditions  JSONB NOT NULL,
    /*  Örnek conditions:
        {
          "all": [
            {"metric": "signal_rx", "op": "<", "value": -25, "duration": "5m"},
            {"metric": "packet_loss", "op": ">", "value": 2}
          ]
        }
    */
    scope       JSONB DEFAULT '{}',     -- {"device_type": ["ont"], "vendor": ["vsol"]}
    severity    TEXT NOT NULL,          -- 'critical' | 'warning' | 'info'
    cooldown    INTERVAL DEFAULT '15 minutes',
    actions     JSONB DEFAULT '[]',     -- ["webhook", "email", "sms", "crm_ticket", "portal_ws"]
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- Alarm geçmişi
CREATE TABLE alarms (
    id              SERIAL PRIMARY KEY,
    rule_id         INTEGER REFERENCES alert_rules(id),
    device_id       TEXT REFERENCES devices(id),
    ada_id          TEXT,
    building_key    TEXT,
    severity        TEXT NOT NULL,
    status          TEXT DEFAULT 'open', -- 'open' | 'acknowledged' | 'resolved' | 'escalated'
    title           TEXT NOT NULL,
    description     TEXT,
    root_cause      JSONB,              -- correlator çıktısı
    /*  Örnek root_cause:
        {
          "type": "upstream_failure",
          "source_device": "vsol:olt-01",
          "affected_devices": ["ont-001", "ont-002"],
          "affected_subscribers": 48,
          "estimated_revenue_impact": 2400,
          "confidence": 0.85,
          "recommendation": "OLT-01 kontrol et"
        }
    */
    affected_count  INTEGER DEFAULT 0,  -- etkilenen abone sayısı
    first_seen      TIMESTAMPTZ NOT NULL,
    last_seen       TIMESTAMPTZ NOT NULL,
    resolved_at     TIMESTAMPTZ,
    acknowledged_by TEXT,
    crm_ticket_id   TEXT,               -- ISP CRM arıza kaydı ID
    notifications   JSONB DEFAULT '[]'  -- gönderilen bildirim logları
);

-- Deduplikasyon indeksi: aynı cihaz + aynı kural = aynı alarm
CREATE UNIQUE INDEX idx_alarms_dedup
ON alarms(device_id, rule_id) WHERE status NOT IN ('resolved');

-- Prophet tahmin sonuçları
CREATE TABLE predictions (
    id          SERIAL PRIMARY KEY,
    device_id   TEXT REFERENCES devices(id),
    metric_name TEXT NOT NULL,
    predicted_at TIMESTAMPTZ DEFAULT now(),
    horizon_days INTEGER DEFAULT 14,
    forecast    JSONB NOT NULL,
    /*  Örnek forecast:
        {
          "trend": "degrading",
          "current_value": -22.5,
          "predicted_value_7d": -25.1,
          "predicted_value_14d": -27.3,
          "breach_date": "2026-04-02",
          "confidence": 0.85
        }
    */
    alert_generated BOOLEAN DEFAULT false
);

-- Baseline (7 gün rolling ortalama, saat+gün bazlı)
CREATE TABLE baselines (
    device_id   TEXT REFERENCES devices(id),
    metric_name TEXT NOT NULL,
    hour_of_day INTEGER,                -- 0-23
    day_of_week INTEGER,                -- 0-6 (Pazartesi=0)
    avg_value   DOUBLE PRECISION,
    stddev_value DOUBLE PRECISION,
    sample_count INTEGER,
    updated_at  TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (device_id, metric_name, hour_of_day, day_of_week)
);
```

### Standart Metrik İsimleri

#### Fiber Metrikleri

| metric_name | Kaynak | Unit | Açıklama |
|-------------|--------|------|----------|
| `signal_rx` | VSOL SNMP | dBm | ONT alıcı sinyal gücü |
| `signal_tx` | VSOL SNMP | dBm | ONT verici sinyal gücü |
| `olt_temperature` | VSOL SNMP | °C | OLT sıcaklık |
| `pon_load` | VSOL SNMP | % | PON port doluluk |
| `ont_status` | VSOL SNMP | - | 1=online, 0=offline |

#### Router Metrikleri

| metric_name | Kaynak | Unit | Açıklama |
|-------------|--------|------|----------|
| `bandwidth_down` | MikroTik API | Mbps | Download throughput |
| `bandwidth_up` | MikroTik API | Mbps | Upload throughput |
| `cpu_load` | MikroTik API | % | Router CPU kullanımı |
| `memory_usage` | MikroTik API | % | Router RAM kullanımı |
| `pppoe_active` | MikroTik API | count | Aktif PPPoE oturum sayısı |
| `uptime` | MikroTik/SNMP | seconds | Cihaz çalışma süresi |

#### Wireless Metrikleri

| metric_name | Kaynak | Unit | Açıklama |
|-------------|--------|------|----------|
| `signal_strength` | Tüm vendor | dBm | Alıcı sinyal gücü |
| `noise_floor` | Tüm vendor | dBm | Gürültü tabanı |
| `snr` | Tüm vendor | dB | Signal-to-Noise Ratio |
| `ccq` | MikroTik | % | Client Connection Quality |
| `airmax_quality` | UBNT | % | airMAX kalite skoru |
| `airmax_capacity` | UBNT | % | airMAX kapasite skoru |
| `tx_signal` | Tüm vendor | dBm | Verici sinyal gücü |
| `tx_rate` | Tüm vendor | Mbps | Modülasyon hızı |
| `rx_rate` | Tüm vendor | Mbps | Modülasyon hızı |
| `frequency` | Tüm vendor | MHz | Çalışma frekansı |
| `channel_width` | Tüm vendor | MHz | Kanal genişliği |
| `connected_clients` | AP'ler | count | Bağlı istemci sayısı |
| `link_uptime` | Tüm vendor | seconds | Link çalışma süresi |
| `distance` | MikroTik/UBNT | km | Link mesafesi |

#### Genel Metrikler

| metric_name | Kaynak | Unit | Açıklama |
|-------------|--------|------|----------|
| `ping_rtt` | ICMP | ms | Round-trip time |
| `ping_loss` | ICMP | % | Paket kaybı |

### Varsayılan Alarm Kuralları (Seed Data)

#### Fiber Alarmları

| Kural | Koşul | Severity | Cooldown |
|-------|-------|----------|----------|
| ONT sinyal düşük | `signal_rx < -25 dBm, 5dk` | warning | 15dk |
| ONT sinyal kritik | `signal_rx < -27 dBm, 2dk` | critical | 5dk |
| ONT offline | `ont_status = 0, 3dk` | critical | 10dk |
| OLT sıcaklık | `olt_temperature > 65°C` | warning | 30dk |
| PON port aşırı yük | `pon_load > 80%` | warning | 30dk |
| Toplu ONT offline | `3+ ONT aynı OLT, offline, 5dk` | critical | 5dk |
| Sinyal trend kötüleşme | Prophet: `breach_date < 14 gün` | warning | 24saat |

#### Wireless Alarmları

| Kural | Koşul | Severity | Cooldown |
|-------|-------|----------|----------|
| Wireless sinyal düşük | `signal_strength < -75 dBm, 5dk` | warning | 15dk |
| Wireless sinyal kritik | `signal_strength < -80 dBm, 2dk` | critical | 5dk |
| CCQ/airMAX düşük | `ccq < 60% VEYA airmax_quality < 50%, 5dk` | warning | 15dk |
| Noise floor yüksek | `noise_floor > -85 dBm` | warning | 30dk |
| Link koptu | `link_uptime = 0 (reset), 3dk` | critical | 5dk |
| Kapasite doygunluk | `connected_clients > threshold, 10dk` | warning | 30dk |
| PtP asimetri | `signal farkı AP↔STA > 10 dB` | warning | 1saat |
| SNR kritik | `snr < 15 dB, 5dk` | critical | 10dk |

#### Genel Alarmlar

| Kural | Koşul | Severity | Cooldown |
|-------|-------|----------|----------|
| Yüksek paket kaybı | `ping_loss > 2%, 5dk` | warning | 15dk |
| Yüksek latency | `ping_rtt > 100ms, 5dk` | warning | 15dk |

---

## Bölüm 3: Collector Detayları

### 3.1 MikroTik Collector

MikroTik RouterOS 7+ REST API kullanır. ISP CRM'deki mevcut `mikrotik_client.py` temel alınır.

```
MikroTik Router (REST API, port 443)
    │
    ├── GET /rest/ppp/active      → Aktif PPPoE oturumları
    │     { name, address, uptime, caller-id, service }
    │
    ├── GET /rest/interface        → Interface traffic
    │     { name, rx-byte, tx-byte, running, type }
    │
    ├── GET /rest/system/resource  → CPU, RAM, uptime
    │     { cpu-load, free-memory, total-memory, uptime, board-name }
    │
    ├── GET /rest/queue/simple     → Abone bant genişliği
    │     { name, target, rate, bytes, packet-drops }
    │
    ├── GET /rest/interface/wireless/registration-table  → Wireless clients
    │     { signal-strength, tx-signal-strength, noise-floor, ccq, uptime }
    │
    └── GET /rest/interface/wireless  → Wireless interface info
          { frequency, band, channel-width, mode }
```

**Polling stratejisi:**

| Veri | Interval | Neden |
|------|----------|-------|
| PPPoE sessions | 60s | Oturum düşmeleri hızlı tespit |
| Interface traffic | 60s | BW anomali tespiti |
| Wireless registration | 60s | Link kopma tespiti |
| System resource | 300s | Yavaş değişir, 5dk yeterli |
| Queue stats | 300s | Trend analizi için |

**Çoklu cihaz konfigürasyonu:**

```yaml
# config.yaml
mikrotik_devices:
  - name: "Core Router 1"
    host: "10.0.0.1"
    username: "api-readonly"
    password: "..."
    role: "core"            # core | distribution | access

  - name: "Access Router Mahalle-A"
    host: "10.0.0.2"
    username: "api-readonly"
    password: "..."
    role: "access"
```

### 3.2 VSOL OLT Collector

VSOL V1600G tek PON — SNMP v2c ile ONT metriklerini çeker.

```
VSOL OLT (SNMP v2c, port 161)
    │
    ├── OLT Sistem
    │   ├── sysUpTime.0                    → OLT uptime
    │   ├── 1.3.6.1.4.1.37950.1.1.5.1.0   → OLT sıcaklık
    │   └── 1.3.6.1.4.1.37950.1.1.1.1.0   → PON port durumu
    │
    ├── ONT Listesi (SNMP Walk)
    │   ├── 1.3.6.1.4.1.37950.1.1.3.1.1.2  → ONT MAC adresleri
    │   ├── 1.3.6.1.4.1.37950.1.1.3.1.1.3  → ONT durumu (1=online)
    │   └── 1.3.6.1.4.1.37950.1.1.3.1.1.5  → ONT model/açıklama
    │
    └── ONT Optik Sinyal
        ├── 1.3.6.1.4.1.37950.1.1.3.2.1.2  → ONT Rx power (dBm×10)
        ├── 1.3.6.1.4.1.37950.1.1.3.2.1.3  → ONT Tx power (dBm×10)
        └── 1.3.6.1.4.1.37950.1.1.3.2.1.4  → OLT Rx from ONT (dBm×10)
```

**VSOL SNMP dikkat noktaları:**
- Sinyal değerleri **×10 gelir** → -225 = -22.5 dBm
- ONT index = PON port × 256 + ONT sıra no
- Community string varsayılan: `public` (değiştirilmeli)
- SNMP Walk yavaş olabilir (1000 ONT ~15-20s)

**Polling stratejisi:**

| Veri | Interval | Neden |
|------|----------|-------|
| ONT durumu | 120s | Offline tespiti 2dk içinde |
| ONT sinyal (Rx/Tx) | 300s | Trend analizi için yeterli |
| OLT sistem | 300s | Sıcaklık ve uptime |

**Çoklu OLT konfigürasyonu:**

```yaml
vsol_devices:
  - name: "OLT Merkez"
    host: "10.0.1.1"
    community: "fiber_ro"
    pon_ports: 1

  - name: "OLT Mahalle-B"
    host: "10.0.1.2"
    community: "fiber_ro"
    pon_ports: 1
```

### 3.3 Ubiquiti Collector

airOS HTTP API (session cookie auth):

```
UBNT Device (HTTPS, port 443)
    │
    ├── POST /api/auth       → { username, password } → session cookie
    ├── GET  /status.cgi     → tüm sistem + wireless bilgisi
    │     wireless.signal, wireless.noisef, wireless.ccq,
    │     wireless.airmaxQuality, wireless.airmaxCapacity,
    │     wireless.txrate, wireless.rxrate, wireless.distance
    └── GET  /sta.cgi        → bağlı station listesi (AP modda)
```

### 3.4 Cambium Collector (SNMP v2c)

```
cambiumAPConnectedSTACount  .1.3.6.1.4.1.17713.21.1.2.3
cambiumSTADLSNR             .1.3.6.1.4.1.17713.21.1.2.10
cambiumSTAULSNR             .1.3.6.1.4.1.17713.21.1.2.11
cambiumSTADLRSSI            .1.3.6.1.4.1.17713.21.1.2.12
cambiumSTATxRate             .1.3.6.1.4.1.17713.21.3.1.1.9
cambiumSTARxRate             .1.3.6.1.4.1.17713.21.3.1.1.10
```

### 3.5 Mimosa Collector (SNMP v2c)

```
mimosaSignalStrength    .1.3.6.1.4.1.43356.2.1.2.6.1.1
mimosaNoiseFloor        .1.3.6.1.4.1.43356.2.1.2.6.1.2
mimosaPHYTxRate         .1.3.6.1.4.1.43356.2.1.2.6.1.5
mimosaPHYRxRate         .1.3.6.1.4.1.43356.2.1.2.6.1.6
mimosaLinkUptime        .1.3.6.1.4.1.43356.2.1.2.1.1.10
```

### 3.6 Ping Collector

Tüm cihazlara ICMP ping — fping ile toplu (1000 cihaz ~5-10 saniye):

```bash
fping -c 3 -q -f device_list.txt
# Çıktı: IP : xmt/rcv/%loss = 3/3/0%, min/avg/max = 1.2/2.1/3.0
```

| Veri | Interval | Neden |
|------|----------|-------|
| ICMP ping (3 paket) | 60s | Hızlı kesinti tespiti |

### 3.7 Collector Orchestrator

```
┌─── Collector Orchestrator (APScheduler) ────────────────┐
│                                                          │
│  Her 60s:  MikroTik PPPoE + Interface + Wireless + Ping │
│  Her 120s: VSOL ONT durumu                               │
│  Her 300s: VSOL sinyal + MikroTik system + Queue         │
│            + UBNT + Cambium + Mimosa                     │
│                                                          │
│  Akış:                                                   │
│  1. Collector çalışır → ham veri                          │
│  2. Normalizer → standart metric formatına çevir         │
│  3. TimescaleDB'ye batch insert (500 metrik/batch)       │
│  4. Rule Engine'e ilet (anomali kontrolü)                │
│  5. Başarısız collector → retry (3x) → alarm             │
│                                                          │
│  Safeguard:                                              │
│  - Collector timeout: 30s                                │
│  - SNMP Walk timeout: 45s (büyük OLT için)              │
│  - Backpressure: kuyruk > 10K → eski veriyi at          │
└──────────────────────────────────────────────────────────┘
```

### 3.8 Normalize Edilen Metrik Formatı

Tüm collector'lar aynı formata dönüştürür:

```json
{
    "time": "2026-03-16T14:30:00Z",
    "device_id": "vsol:10.0.1.1:ont-042",
    "device_type": "ont",
    "metric_name": "signal_rx",
    "value": -22.5,
    "unit": "dBm",
    "ada_id": "ada-merkez-001",
    "building_key": "bina-A12"
}
```

### 3.9 Cihaz-Bina Eşleştirme

ONT'leri ve antenleri binalara/lokasyonlara bağlama (anomali → abone etkisi):

```
Eşleştirme Yöntemleri (öncelik sırasıyla):
1. Manuel atama — Portal/Extension UI'dan cihaz → bina eşleştir
2. MikroTik PPPoE username → ISP CRM abone → adres → bina
3. OLT ONT açıklama alanı — "Bina-A12-Kat3-D5" gibi isimlendirme
4. MAC/IP tabanlı — ISP CRM'den MAC→abone→adres zinciri
```

---

## Bölüm 4: Rule Engine + Correlator

### 4.1 Rule Engine Akışı

```
Metrik geldi (Collector → Normalizer)
    │
    ▼
┌─── Rule Engine ─────────────────────────────────────────┐
│                                                          │
│  1. ANLIK EŞİK KONTROLÜ (her metrikte)                  │
│     metric_value vs threshold → ihlal var mı?            │
│                                                          │
│  2. SÜRE KONTROLÜ (duration window)                     │
│     ihlal süresi >= min_duration? (geçici spike filtre)  │
│                                                          │
│  3. KOŞUL BİRLEŞTİRME (composite rules)                │
│     all: [koşul1 AND koşul2]                             │
│     any: [koşul1 OR koşul2]                              │
│                                                          │
│  4. DEDUPLİKASYON                                       │
│     aynı cihaz + aynı kural = mevcut alarm güncelle     │
│     yeni = yeni alarm oluştur                            │
│                                                          │
│  5. COOLDOWN                                             │
│     son bildirimden bu yana >= cooldown? → bildir        │
│     değilse → alarm güncelle ama bildirim gönderme      │
│                                                          │
│  Anomali → Correlator'a gönder                           │
└──────────────────────────────────────────────────────────┘
```

### 4.2 Kural Formatı (Declarative JSON)

```json
// Basit kural — tek koşul
{
    "id": "rule-ont-signal-low",
    "name": "ONT sinyal düşük",
    "conditions": {
        "all": [
            {"metric": "signal_rx", "op": "<", "value": -25, "duration": "5m"}
        ]
    },
    "scope": {"device_type": ["ont"]},
    "severity": "warning",
    "cooldown": "15m",
    "actions": ["webhook", "portal_ws"]
}

// Bileşik kural — çapraz metrik
{
    "id": "rule-splitter-suspect",
    "name": "Muhtemel splitter arızası",
    "conditions": {
        "all": [
            {"metric": "signal_rx", "op": "<", "value": -25, "duration": "5m"},
            {"metric": "ping_loss", "op": ">", "value": 2, "duration": "5m"},
            {"context": "same_fdh", "min_devices": 2}
        ]
    },
    "scope": {"device_type": ["ont"]},
    "severity": "critical",
    "cooldown": "5m",
    "actions": ["webhook", "email", "sms", "crm_ticket"]
}

// Toplu kural — grup bazlı
{
    "id": "rule-mass-offline",
    "name": "Toplu ONT offline (OLT arızası şüphesi)",
    "conditions": {
        "all": [
            {"metric": "ont_status", "op": "==", "value": 0, "duration": "3m"},
            {"context": "same_olt", "min_devices": 5}
        ]
    },
    "scope": {"device_type": ["ont"]},
    "severity": "critical",
    "cooldown": "5m",
    "actions": ["webhook", "email", "sms", "crm_ticket"]
}

// Wireless PtP asimetri
{
    "id": "rule-ptp-asymmetry",
    "name": "PtP link sinyal asimetrisi",
    "conditions": {
        "all": [
            {"metric": "signal_strength", "op": "<", "value": -75, "duration": "5m"},
            {"computed": "peer_signal_diff", "op": ">", "value": 10}
        ]
    },
    "scope": {"device_type": ["wireless_backhaul"]},
    "severity": "warning",
    "cooldown": "1h",
    "actions": ["webhook"]
}
```

### 4.3 Süre Penceresi (Duration Window)

Geçici spike'ları filtreleme — toleranslı sliding window:

```
Metrik akışı:   -20  -22  -26  -24  -27  -28  -27  -26  -21
Eşik (-25):      ok   ok  İHL   ok  İHL  İHL  İHL  İHL   ok
                           ↑              ↑─────────↑
                        başla          5dk doldu → ALARM

Duration window = 5dk, polling = 60s → 5 ardışık ihlal gerekli
Tolerans: 5 örnekten 4'ü ihlal ise = alarm (%80 tolerans, 1 ok spike izni)
```

### 4.4 Correlator — Kök Neden Analizi

```
Alarm geldi (Rule Engine'den)
    │
    ▼
┌─── Correlator ──────────────────────────────────────────┐
│                                                          │
│  ADIM 1: Topoloji Grafiği (NetworkX)                    │
│                                                          │
│      Internet                                            │
│         │                                                │
│     [MikroTik Core]                                     │
│       /         \                                        │
│   [Backhaul-A] [Backhaul-B]  ← wireless PtP             │
│      │              │                                    │
│   [OLT-1]       [OLT-2]                                │
│    / | \          / | \                                  │
│  ONT ONT ONT   ONT ONT ONT  ← fiber                    │
│   │   │   │     │   │   │                               │
│  🏠  🏠  🏠   🏠  🏠  🏠   ← binalar/aboneler          │
│                                                          │
│  ADIM 2: Upstream Yürüyüşü                              │
│  Alarm: ONT-005 offline                                 │
│  → parent: OLT-1 → parent: Backhaul-A → parent: Core   │
│  → Her seviyede alarm var mı kontrol et                  │
│                                                          │
│  ADIM 3: Kök Neden Tespiti                              │
│                                                          │
│  Senaryo A: Backhaul-A da alarm                          │
│    → kök neden = Backhaul, ONT alarmaları suppress       │
│                                                          │
│  Senaryo B: Sadece ONT-005                               │
│    → Lokal arıza (fiber kesik, ONT bozuk)               │
│                                                          │
│  Senaryo C: Aynı FDH'de 3 ONT alarm                    │
│    → Grup korelasyonu → muhtemel splitter arızası        │
│                                                          │
│  ADIM 4: Etki Analizi                                   │
│  → Downstream: kaç cihaz etkileniyor?                    │
│  → ISP CRM: kaç abone etkileniyor?                      │
│  → Gelir etkisi: abone × aylık ücret / 30              │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 4.5 Korelasyon Desenleri

| Desen | Tespit Kriteri | Kök Neden | Aksiyon |
|-------|---------------|-----------|---------|
| **upstream_failure** | Aynı parent altında %50+ cihaz alarmlı | Parent cihaz | Alt alarmları suppress, tek üst alarm |
| **splitter_failure** | Aynı FDH'de 2+ ONT sinyal düşük + paket kaybı | FDH splitter | Saha müdahale, FDH lokasyonu |
| **fiber_degradation** | Tek ONT sinyal trend kötü (Prophet) + diğerleri normal | Bina drop fiber | OTDR testi öner |
| **power_outage** | Aynı ada/bölgede 5+ cihaz aynı anda offline | Bölgesel elektrik | Elektrik kesintisi alarmı |
| **backhaul_degradation** | Wireless backhaul CCQ/SNR düşük + downstream latency artışı | Wireless backhaul | Anten hizalama / frekans değişikliği |
| **capacity_saturation** | AP client > threshold + latency artışı + throughput düşüşü | AP kapasite aşımı | Sektör bölme / yeni AP |

### 4.6 Alarm Yaşam Döngüsü

```
    ┌──────┐   kural tetiklendi    ┌──────┐
    │ YOK  │ ───────────────────→  │ OPEN │
    └──────┘                       └──┬───┘
                                      │
                          ┌───────────┼───────────┐
                          ▼           ▼           ▼
                    NOC tıkladı   tetik devam   tetik bitti
                    ┌──────────┐     │         ┌──────────┐
                    │   ACK    │  güncelle     │ RESOLVED │
                    └────┬─────┘  last_seen    └──────────┘
                         │           │
                     çözüldü    süre > 30dk + critical
                         ▼      ┌──────────┐
                    ┌──────────┐│ ESCALATED│
                    │ RESOLVED ││          │
                    └──────────┘└──────────┘
```

### 4.7 Zenginleştirilmiş Alarm Örneği (Correlator Çıktısı)

```json
{
    "device_id": "vsol:10.0.1.1:ont-042",
    "rule_id": "rule-ont-signal-low",
    "severity": "critical",
    "title": "Muhtemel splitter arızası — FDH-Merkez-03",
    "root_cause": {
        "type": "splitter_failure",
        "source": "FDH-Merkez-03",
        "confidence": 0.82,
        "evidence": [
            "ONT-042: signal_rx = -26.5 dBm (normal: -19.2 dBm)",
            "ONT-043: signal_rx = -27.1 dBm (normal: -18.8 dBm)",
            "ONT-041: signal_rx = -25.8 dBm (normal: -20.1 dBm)",
            "Aynı FDH altında 3/5 ONT sinyal anomalisi"
        ],
        "recommendation": "FDH-Merkez-03 splitter kontrol et"
    },
    "impact": {
        "affected_devices": 3,
        "affected_subscribers": 24,
        "affected_buildings": ["Bina-A12", "Bina-A13", "Bina-A14"],
        "ada": "Merkez Mah. 1234 Ada",
        "estimated_revenue_impact_daily": 320
    },
    "location": {
        "lat": 39.925,
        "lng": 32.866,
        "address": "Merkez Mah. 1234 Ada, FDH-03 önü"
    }
}
```

---

## Kalan Bölümler (Devam Edecek)

- **Bölüm 5:** Prophet Prediktif Analiz + Baseline Oluşturma
- **Bölüm 6:** Notification Hub (Webhook, Email, SMS, WebSocket)
- **Bölüm 7:** Extension + Portal UI Entegrasyonu
- **Bölüm 8:** Docker Compose Deployment
- **Bölüm 9:** ISP CRM Entegrasyonu
