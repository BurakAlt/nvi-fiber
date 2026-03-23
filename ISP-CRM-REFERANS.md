# ISP CRM Sistemi — Kapsamlı Referans Dosyası

> **Proje:** Altıparmak Telekom ISP CRM + NVI FIBER Entegrasyonu
> **Tarih:** 2026-03-14
> **Amaç:** ISP CRM backend'ini portal + harita üzerinden yönetmek, cihazları binalara atamak, arızaları haritada görmek

---

## 1. MEVCUT SİSTEM HARİTASI

### 1.1 ISP CRM Backend (FastAPI)

```
isp-crm-system/isp-crm-system/
├── api/
│   ├── Dockerfile                          # Python 3.11-slim, uvicorn
│   ├── requirements.txt                    # fastapi, sqlalchemy, asyncpg, httpx, passlib, jose, bcrypt
│   └── app/
│       ├── main.py                         # FastAPI app, CORS, router bağlama, lifespan
│       ├── database.py                     # SQLAlchemy async ORM modelleri (6 tablo)
│       ├── models_extra.py                 # AdminUser şablonu (database.py'ye taşınmalı)
│       ├── routers/
│       │   ├── auth.py                     # JWT login, OAuth2, bcrypt, 8 saat token
│       │   ├── subscribers.py              # Abone CRUD, CSV import, telefon normalizasyonu
│       │   ├── payments.py                 # Banka CSV import, fuzzy match, onay/red, MikroTik tetikleme
│       │   ├── mikrotik.py                 # Manuel enable/disable, aktif session, router stats
│       │   ├── whatsapp.py                 # WAHA webhook, Claude AI yanıt, aksiyon tetikleme
│       │   └── admin.py                    # Dashboard stats, konuşma listesi, MikroTik log
│       └── services/
│           ├── payment_matcher.py          # 4 katmanlı fuzzy matching (abone_no → IBAN → isim → eşleşmedi)
│           └── mikrotik_client.py          # RouterOS REST API v7+ (PPPoE + Static IP)
├── db/
│   └── init.sql                            # PostgreSQL şeması (6 tablo + indeksler + örnek admin)
├── nginx/
│   └── nginx.conf                          # Reverse proxy (api:8000, admin:3001)
├── docker-compose.yml                      # 7 servis: postgres, redis, api, waha, worker, admin, nginx
├── .env.example                            # Ortam değişkenleri şablonu
├── ornek-aboneler.csv                      # Örnek veri (4 abone, ; delimiter)
├── PRD.md                                  # Ürün gereksinimleri
├── ARCHITECTURE.md                         # Mimari özet
└── KURULUM.md                              # Kurulum adımları
```

### 1.2 NVI FIBER Mevcut Modüller

```
fiber-chrome/
├── lib/
│   ├── topology.js          # Proje/ada/bina veri modeli — PROJECT singleton
│   ├── pon-engine.js         # GPON hesaplama motoru — splitter, loss, MST, FDH, maliyet
│   ├── live-monitor.js       # UISP + Zabbix canlı izleme (adapter tabanlı)
│   ├── storage.js            # chrome.storage.local + IndexedDB v2
│   ├── map-utils.js          # Pentagon ikonları, kablo stilleri, tile layer
│   ├── financial.js          # ARPU, taahhüt, kampanya
│   ├── review-engine.js      # 6 kategorili kalite skoru
│   └── ...
├── content/
│   ├── overlay.js            # Leaflet harita, toolbar, bina marker, kablo çizimi
│   ├── panels.js             # Sidebar, bina listesi, context menüler
│   ├── scraper.js            # NVI DOM parse
│   └── main.js               # Entry point
├── dashboard/
│   └── dashboard.js          # Tam sayfa CRM dashboard
└── portal/
    └── js/
        ├── portal.js         # SPA router, sayfa render
        ├── api-client.js     # Mock API client (gerçek backend'e bağlanacak)
        ├── charts.js         # Canvas grafik yardımcıları
        └── speedtest.js      # Hız testi motoru
```

---

## 2. VERİTABANI ŞEMASI

### 2.1 Mevcut Tablolar (init.sql)

```sql
-- ═══ subscribers (Abone Listesi) ═══
id              SERIAL PK
abone_no        VARCHAR(20) UNIQUE NOT NULL      -- "01247"
full_name       VARCHAR(100) NOT NULL
phone           VARCHAR(20)                       -- Ham numara
phone_normalized VARCHAR(20)                      -- "+905551234567"
district        VARCHAR(50)                       -- İlçe
village         VARCHAR(50)                       -- Köy/mahalle
package_name    VARCHAR(50)                       -- "25Mbps"
package_speed   INTEGER                           -- Mbps
connection_type VARCHAR(10) DEFAULT 'pppoe'       -- 'pppoe' | 'static'
mikrotik_user   VARCHAR(100)                      -- PPPoE username
mikrotik_ip     VARCHAR(15)                       -- Static IP
mikrotik_router VARCHAR(50)                       -- Router IP adresi
is_active       BOOLEAN DEFAULT true
payment_status  VARCHAR(20) DEFAULT 'unpaid'      -- 'paid' | 'unpaid' | 'partial'
payment_amount  DECIMAL(10,2)                     -- Aylık aidat
balance         DECIMAL(10,2) DEFAULT 0           -- Fazla ödeme bakiye
last_payment_date DATE
notes           TEXT
created_at      TIMESTAMP
updated_at      TIMESTAMP

-- ═══ bank_transactions (Banka Havaleleri) ═══
id                    SERIAL PK
transaction_date      DATE NOT NULL
sender_name           VARCHAR(200)
sender_iban           VARCHAR(34)
amount                DECIMAL(10,2) NOT NULL
description           TEXT
reference_no          VARCHAR(100)
match_status          VARCHAR(20) DEFAULT 'pending'   -- 'auto_matched' | 'manual_review' | 'unmatched' | 'confirmed' | 'rejected'
match_score           DECIMAL(5,2)                    -- 0-100 fuzzy skor
matched_subscriber_id INTEGER FK → subscribers
match_reason          TEXT
reviewed_by           VARCHAR(50)
reviewed_at           TIMESTAMP
payment_applied       BOOLEAN DEFAULT false
applied_at            TIMESTAMP
created_at            TIMESTAMP

-- ═══ conversations (WhatsApp Konuşmaları) ═══
id              SERIAL PK
wa_chat_id      VARCHAR(50) NOT NULL              -- "905551234567@c.us"
phone_normalized VARCHAR(20)
subscriber_id   INTEGER FK → subscribers
status          VARCHAR(20) DEFAULT 'open'        -- 'open' | 'resolved' | 'escalated'
intent          VARCHAR(50)                       -- 'payment_complaint' | 'speed_issue' | 'info'
message_count   INTEGER DEFAULT 0
last_message_at TIMESTAMP
resolved_at     TIMESTAMP
created_at      TIMESTAMP

-- ═══ messages (Mesaj Logları) ═══
id              SERIAL PK
conversation_id INTEGER FK → conversations
direction       VARCHAR(10)                       -- 'inbound' | 'outbound'
content         TEXT
wa_message_id   VARCHAR(100)
sent_at         TIMESTAMP

-- ═══ mikrotik_actions (Router İşlem Logları) ═══
id              SERIAL PK
subscriber_id   INTEGER FK → subscribers
action          VARCHAR(50)                       -- 'enable' | 'disable' | 'speed_change'
router_ip       VARCHAR(15)
target_user     VARCHAR(100)                      -- PPPoE user veya Static IP
result          VARCHAR(20)                       -- 'success' | 'failed'
error_msg       TEXT
triggered_by    VARCHAR(50)                       -- 'payment_auto' | 'admin' | 'whatsapp'
created_at      TIMESTAMP

-- ═══ admin_users (Admin Kullanıcılar) ═══
id              SERIAL PK
username        VARCHAR(50) UNIQUE NOT NULL
password_hash   VARCHAR(200) NOT NULL             -- bcrypt hash
role            VARCHAR(20) DEFAULT 'staff'       -- 'admin' | 'staff'
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMP
```

### 2.2 Eklenecek Tablolar (Entegrasyon İçin)

```sql
-- ═══ network_devices (Ağ Cihazları — Anten/AP/Router/OLT) ═══
id              SERIAL PK
device_type     VARCHAR(30) NOT NULL              -- 'antenna' | 'ap' | 'router' | 'olt' | 'switch'
name            VARCHAR(100) NOT NULL             -- "Kayabaşı-AP-01"
brand           VARCHAR(50)                       -- "MikroTik" | "Ubiquiti" | "Huawei"
model           VARCHAR(100)                      -- "SXTsq Lite5"
ip_address      VARCHAR(15)                       -- Yönetim IP'si
mac_address     VARCHAR(17)                       -- "AA:BB:CC:DD:EE:FF"
serial_number   VARCHAR(100)
firmware        VARCHAR(50)                       -- Firmware versiyonu
lat             DECIMAL(10,7)                     -- Harita konumu
lng             DECIMAL(10,7)
building_id     INTEGER                           -- Atandığı bina (topology.js building.id)
ada_code        VARCHAR(10)                       -- "DA-001" (topology.js ada.code)
router_ip       VARCHAR(15)                       -- Bağlı olduğu MikroTik
frequency       VARCHAR(20)                       -- "5 GHz" | "2.4 GHz" | "Fiber"
signal_threshold DECIMAL(5,2)                     -- Beklenen sinyal eşiği (dBm)
status          VARCHAR(20) DEFAULT 'active'      -- 'active' | 'down' | 'maintenance' | 'planned'
installed_at    DATE
notes           TEXT
created_at      TIMESTAMP
updated_at      TIMESTAMP

-- ═══ device_building_map (Cihaz-Bina Eşleşmesi — N:N) ═══
id              SERIAL PK
device_id       INTEGER FK → network_devices
building_id     INTEGER NOT NULL                  -- topology.js building.id
ada_code        VARCHAR(10)                       -- "DA-001"
coverage_type   VARCHAR(20)                       -- 'primary' | 'backup' | 'relay'
subscriber_count INTEGER DEFAULT 0               -- O binadaki aktif abone sayısı
created_at      TIMESTAMP

-- ═══ alarms (Arıza/Alarm Kayıtları) ═══
id              SERIAL PK
device_id       INTEGER FK → network_devices
alarm_type      VARCHAR(50) NOT NULL              -- 'device_down' | 'high_latency' | 'packet_loss' | 'power_fail' | 'signal_low'
severity        VARCHAR(20) NOT NULL              -- 'critical' | 'warning' | 'info'
message         TEXT
affected_subscribers INTEGER DEFAULT 0           -- Etkilenen abone sayısı
affected_buildings TEXT                           -- JSON: [building_id1, building_id2, ...]
status          VARCHAR(20) DEFAULT 'active'      -- 'active' | 'acknowledged' | 'resolved'
detected_at     TIMESTAMP NOT NULL
acknowledged_at TIMESTAMP
acknowledged_by VARCHAR(50)
resolved_at     TIMESTAMP
resolved_by     VARCHAR(50)
resolution_note TEXT
created_at      TIMESTAMP

-- ═══ device_metrics (Cihaz Metrikleri — Zaman Serisi) ═══
id              SERIAL PK
device_id       INTEGER FK → network_devices
metric_type     VARCHAR(30)                       -- 'signal' | 'latency' | 'packet_loss' | 'throughput' | 'cpu' | 'memory' | 'temperature'
value           DECIMAL(10,2)
unit            VARCHAR(10)                       -- 'dBm' | 'ms' | '%' | 'Mbps' | '°C'
recorded_at     TIMESTAMP NOT NULL
```

### 2.3 İndeksler (Yeni Tablolar İçin)

```sql
CREATE INDEX idx_devices_building ON network_devices(building_id);
CREATE INDEX idx_devices_status ON network_devices(status);
CREATE INDEX idx_devices_type ON network_devices(device_type);
CREATE INDEX idx_device_building_map_device ON device_building_map(device_id);
CREATE INDEX idx_device_building_map_building ON device_building_map(building_id);
CREATE INDEX idx_alarms_device ON alarms(device_id);
CREATE INDEX idx_alarms_status ON alarms(status);
CREATE INDEX idx_alarms_severity ON alarms(severity);
CREATE INDEX idx_alarms_detected ON alarms(detected_at);
CREATE INDEX idx_metrics_device_type ON device_metrics(device_id, metric_type);
CREATE INDEX idx_metrics_recorded ON device_metrics(recorded_at);
```

---

## 3. API ENDPOİNT HARİTASI

### 3.1 Mevcut Endpoint'ler

```
AUTH
  POST   /auth/token                          → JWT login (OAuth2 form)
  GET    /auth/me                             → Mevcut kullanıcı bilgisi

SUBSCRIBERS (Abone Yönetimi)
  POST   /subscribers/import-csv              → CRM CSV'den toplu import
  GET    /subscribers/                        → Abone listesi (search, district, payment_status, limit, offset)
  GET    /subscribers/{abone_no}              → Tek abone detayı
  PATCH  /subscribers/{id}/payment-status     → Manuel ödeme durumu güncelleme

PAYMENTS (Ödeme Motoru)
  POST   /payments/import-csv                 → Banka CSV import + fuzzy match
  GET    /payments/pending-review             → Manuel onay kuyruğu
  POST   /payments/{tx_id}/approve            → Onayla + MikroTik aç
  POST   /payments/{tx_id}/reject             → Reddet

MIKROTIK (Router Kontrolü)
  POST   /mikrotik/{subscriber_id}/enable     → Aboneyi aktifleştir (auth gerekli)
  POST   /mikrotik/{subscriber_id}/disable    → Aboneyi devre dışı bırak (auth gerekli)
  GET    /mikrotik/active-sessions            → Aktif PPPoE oturumları
  GET    /mikrotik/router-stats               → CPU/RAM/uptime + interface stats

WHATSAPP (AI Chatbot)
  POST   /webhook/whatsapp                    → WAHA webhook (mesaj → Claude → yanıt)

ADMIN (Dashboard)
  GET    /admin/dashboard                     → İstatistik kartları (toplam, aktif, ödenmemiş, bekleyen, konuşma, MikroTik)
  GET    /admin/conversations                 → WhatsApp konuşma listesi
  POST   /admin/conversations/{id}/resolve    → Konuşma çözümle
  GET    /admin/mikrotik-log                  → MikroTik işlem geçmişi

HEALTH
  GET    /health                              → {"status": "ok"}
```

### 3.2 Eklenecek Endpoint'ler (Cihaz + Alarm + Harita)

```
DEVICES (Ağ Cihazları)
  POST   /devices/                            → Yeni cihaz ekle
  GET    /devices/                            → Cihaz listesi (type, status, building_id filtreleri)
  GET    /devices/{id}                        → Cihaz detayı + metrikleri
  PATCH  /devices/{id}                        → Cihaz güncelle
  DELETE /devices/{id}                        → Cihaz sil
  POST   /devices/{id}/assign-building        → Cihazı binaya ata
  DELETE /devices/{id}/unassign-building/{bid} → Bina atamasını kaldır
  GET    /devices/{id}/subscribers            → Bu cihazdaki aboneler
  GET    /devices/{id}/metrics                → Son metrikler (zaman aralığı filtresi)
  POST   /devices/{id}/ping                   → Anlık ping/durum kontrolü

DEVICE-BUILDING MAP (Cihaz-Bina İlişkileri)
  GET    /device-map/building/{building_id}   → Binadaki cihazlar
  GET    /device-map/ada/{ada_code}           → Ada'daki tüm cihaz-bina eşleşmeleri
  GET    /device-map/coverage                 → Kapsama haritası verisi (tüm cihaz-bina çiftleri)

ALARMS (Arıza Yönetimi)
  GET    /alarms/                             → Alarm listesi (status, severity, device_id filtreleri)
  GET    /alarms/active                       → Aktif alarmlar (harita için)
  POST   /alarms/{id}/acknowledge             → Alarmı onayla
  POST   /alarms/{id}/resolve                 → Alarmı çöz (resolution_note ile)
  GET    /alarms/summary                      → Alarm özeti (critical, warning, info sayıları)
  GET    /alarms/affected-subscribers/{alarm_id} → Etkilenen aboneler

MONITORING (Canlı İzleme)
  GET    /monitoring/device-status             → Tüm cihaz durumları (harita overlay için)
  GET    /monitoring/health-check              → Toplu cihaz sağlık kontrolü
  POST   /monitoring/poll                      → Manuel polling tetikle
```

---

## 4. KAYNAK KOD REFERANSI

### 4.1 FastAPI Ana Uygulama (api/app/main.py)

```python
# Lifespan: init_db() → Base.metadata.create_all
# CORS: allow_origins=["*"] (geliştirme)
# Router bağlama sırası: auth → whatsapp → subscribers → payments → mikrotik → admin
# Health endpoint: GET /health
```

**Entegrasyon notu:** Yeni router'lar (devices, alarms, monitoring) buraya eklenecek.

### 4.2 ORM Modelleri (api/app/database.py)

| Model | Tablo | İlişkiler |
|-------|-------|-----------|
| `Subscriber` | subscribers | — |
| `BankTransaction` | bank_transactions | → Subscriber (matched_subscriber_id) |
| `Conversation` | conversations | → Subscriber, ↔ Message[] |
| `Message` | messages | → Conversation |
| `MikrotikAction` | mikrotik_actions | → Subscriber |

**EKSİK:** `AdminUser` modeli `database.py`'de yok ama `auth.py` import ediyor. `models_extra.py`'den taşınmalı.

**Eklenecek modeller:**
- `NetworkDevice` — ağ cihazları
- `DeviceBuildingMap` — cihaz-bina N:N ilişkisi
- `Alarm` — arıza/alarm kayıtları
- `DeviceMetric` — zaman serisi metrikler

### 4.3 Fuzzy Matching Motoru (api/app/services/payment_matcher.py)

```python
# 4 Katmanlı Eşleştirme Öncelik Sırası:
# 1. Abone No çıkarma (regex: "abone:1247", "#1247", "01247")
#    → Eşleşirse: %100 skor, auto_matched
#
# 2. IBAN geçmiş kontrolü (aynı IBAN'dan daha önce ödeme?)
#    → Eşleşirse: %95 skor, auto_matched
#
# 3. İsim fuzzy match (SequenceMatcher + token bazlı)
#    → ≥%85: auto_matched
#    → %60-84: manual_review
#    → <%60: unmatched
#
# Normalizasyon: Türkçe→ASCII (ı→i, ğ→g, ö→o, ...) + lowercase + özel karakter temizle
```

**Fonksiyonlar:**
- `normalize_text(text)` → ASCII lowercase, özel karakter yok
- `extract_abone_no(text)` → Regex ile abone numarası çıkarma
- `name_similarity(name1, name2)` → 0-100 benzerlik skoru
- `find_match(tx, db)` → MatchResult (subscriber_id, score, method, reason, status)

### 4.4 MikroTik Client (api/app/services/mikrotik_client.py)

```python
class MikroTikClient:
    # RouterOS REST API v7+ (HTTPS, verify=False)
    # base_url: https://{host}/rest

    # PPPoE İşlemleri:
    #   get_pppoe_secret(username) → secret dict
    #   enable_pppoe(username)     → ActionResult
    #   disable_pppoe(username)    → ActionResult + session disconnect

    # Static IP İşlemleri:
    #   enable_static_ip(ip)       → Firewall kuralını devre dışı bırak + address-list'ten sil
    #   disable_static_ip(ip)      → "blocked" address-list'e ekle

    # Bilgi:
    #   get_interface_stats()      → Tüm interface istatistikleri
    #   get_active_sessions()      → Aktif PPPoE oturumları
    #   get_resource()             → CPU/RAM/uptime

# Yardımcı fonksiyonlar (modül seviyesi):
#   enable_subscriber(subscriber)  → Bağlantı tipine göre otomatik aç
#   disable_subscriber(subscriber) → Bağlantı tipine göre otomatik kapat
```

### 4.5 Router Detayları

#### auth.py
```python
# JWT: HS256, 8 saat expiry
# Şifre: bcrypt
# OAuth2: /auth/token endpoint
# Dependency: get_current_user(token) → AdminUser
```

#### subscribers.py
```python
# CSV Import:
#   - Encoding: utf-8-sig → windows-1254 → utf-8 (sırayla dener)
#   - Delimiter: ';' veya ',' otomatik tespit
#   - normalize_phone(): +90 formatına çevir
#   - Mevcut abone varsa güncelle, yoksa oluştur
#
# Listeleme:
#   - search: full_name, abone_no, phone ILIKE
#   - district, payment_status filtreleri
#   - limit/offset pagination
```

#### payments.py
```python
# CSV Import + Fuzzy Match:
#   - İş Bankası formatı: Tarih;Açıklama;Borç;Alacak;...
#   - Sadece Alacak > 0 kayıtları (gelen ödeme)
#   - Her kayıt için find_match() çalıştır
#   - auto_matched → hemen apply_payment()
#
# apply_payment(tx, subscriber, db):
#   1. payment_status → "paid"
#   2. is_active → True
#   3. Fazla ödeme → balance'a ekle
#   4. MikroTik'te hat aç
#   5. MikrotikAction log kaydet
#
# Manuel onay: POST /payments/{id}/approve (subscriber_id gerekli)
# Red: POST /payments/{id}/reject
```

#### mikrotik.py
```python
# POST /{subscriber_id}/enable  → enable_subscriber() + log + is_active=True
# POST /{subscriber_id}/disable → disable_subscriber() + log + is_active=False
# GET  /active-sessions          → MikroTikClient.get_active_sessions()
# GET  /router-stats             → get_resource() + get_interface_stats()
# Tüm endpoint'ler auth gerektirir (get_current_user dependency)
```

#### whatsapp.py
```python
# WAHA Webhook Akışı:
#   1. POST /webhook/whatsapp alır
#   2. Grup mesajları atlanır (@g.us)
#   3. Telefon normalize edilir
#   4. background_tasks ile async işlenir
#
# process_message() Akışı:
#   1. Aboneyi phone_normalized ile bul
#   2. Konuşma bul/oluştur (open durumda)
#   3. Mesajı kaydet
#   4. Son 10 mesajı getir (context)
#   5. Claude API'ye gönder (subscriber context + history)
#   6. [ACTION:enable_connection] → MikroTik aç (sadece paid ise)
#   7. [ACTION:escalate] → (henüz işlenmemiş)
#   8. Yanıtı kaydet + WAHA ile gönder
#
# Claude System Prompt:
#   - Altıparmak Telekom destek asistanı
#   - Abone profili context olarak verilir
#   - Kısa, samimi, Türkçe yanıt
#   - Hat açma yetkisi (ödeme yapılmışsa)
```

#### admin.py
```python
# GET /admin/dashboard:
#   - total_subscribers, active_subscribers
#   - unpaid_subscribers, pending_payment_reviews
#   - open_whatsapp_conversations
#   - mikrotik_actions_30d (son 30 gün)
#
# GET /admin/conversations: WhatsApp konuşmaları (status filtresi)
# POST /admin/conversations/{id}/resolve: Konuşma çözümle
# GET /admin/mikrotik-log: Son işlemler (limit)
```

---

## 5. DOCKER COMPOSE YAPISI

```yaml
services:
  postgres:     # PostgreSQL 16 Alpine — port 5432
  redis:        # Redis 7 Alpine — dahili (6379)
  api:          # FastAPI — port 8000
  waha:         # WAHA WhatsApp — port 3000
  worker:       # Celery Worker — async jobs (henüz pasif)
  admin:        # React Admin UI — port 3001 (henüz yok)
  nginx:        # Reverse Proxy — port 80/443

volumes:
  postgres_data:  # DB kalıcı veri
  waha_data:      # WhatsApp session verisi

networks:
  isp_net: bridge  # Tüm servisler aynı ağda
```

### Ortam Değişkenleri (.env)

```
POSTGRES_PASSWORD=<güçlü_şifre>
CLAUDE_API_KEY=sk-ant-api03-...
MIKROTIK_HOST=192.168.1.1
MIKROTIK_USER=api_user
MIKROTIK_PASS=<router_şifre>
WAHA_SESSION=altiparmak
SECRET_KEY=<32+_karakter_random>
```

---

## 6. ENTEGRASYON MİMARİSİ

### 6.1 Hedef Sistem Topolojisi

```
┌─────────────────────────────────────────────────────────┐
│                    NVI FIBER Ekosistemi                   │
│                                                          │
│  ┌──────────────────┐    ┌──────────────────────────┐   │
│  │ Chrome Extension  │    │    Portal (Web App)       │   │
│  │ fiber-chrome/     │    │    portal/                │   │
│  │                   │    │                           │   │
│  │ • NVI DOM scrape  │    │ • ISP Yönetim Paneli      │   │
│  │ • Fiber planlama  │    │ • Cihaz yönetimi          │   │
│  │ • Harita overlay  │    │ • Arıza takibi            │   │
│  │ • Cihaz→Bina      │    │ • Abone yönetimi          │   │
│  │   harita görünümü │    │ • Ödeme onay kuyruğu      │   │
│  │ • Arıza gösterimi │    │ • WhatsApp konuşmalar     │   │
│  └────────┬─────────┘    │ • Network monitoring      │   │
│           │               │ • Harita görünümü          │   │
│           │               └────────────┬──────────────┘   │
│           │                            │                  │
│           └────────────┬───────────────┘                  │
│                        │                                  │
│              ┌─────────▼──────────┐                       │
│              │  ISP CRM Backend   │                       │
│              │  FastAPI + PG      │                       │
│              │                    │                       │
│              │ • Abone CRUD       │                       │
│              │ • Ödeme motoru     │                       │
│              │ • MikroTik kontrol │                       │
│              │ • WhatsApp AI      │                       │
│              │ • Cihaz yönetimi   │◄──── MikroTik Router  │
│              │ • Alarm sistemi    │◄──── UISP / Zabbix    │
│              │ • Metrik toplama   │◄──── WAHA (WhatsApp)  │
│              └────────────────────┘                       │
└─────────────────────────────────────────────────────────┘
```

### 6.2 Veri Akış Diyagramı

```
CİHAZ ATAMA AKIŞI:
  Portal/Extension UI → Cihaz seç → Bina seç
    → POST /devices/{id}/assign-building
    → device_building_map kaydı oluştur
    → Harita üzerinde cihaz ikonu binaya bağlı göster

ARIZA TESPİT AKIŞI:
  MikroTik Polling (her 60s)
    → GET /rest/system/resource + /interface + /ppp/active
    → Cihaz erişilemez? → Alarm oluştur (device_down, critical)
    → device_building_map'ten etkilenen binaları bul
    → Etkilenen aboneleri say (subscriber_count)
    → Haritada binayı kırmızıya boya
    → Portal'da alarm kartı göster

ARIZA ÇÖZÜM AKIŞI:
  Admin alarm listesini görür
    → POST /alarms/{id}/acknowledge
    → Müdahale eder
    → POST /alarms/{id}/resolve (resolution_note ile)
    → Haritada bina rengi normale döner
    → Etkilenen abonelere WhatsApp bildirim (opsiyonel)
```

### 6.3 Harita Üzerinde Cihaz+Arıza Görünümü

```
BİNA MARKER DURUMU:
  Normal (arızasız):
    • Pentagon ikon, standart renk (BB sayısına göre)
    • Tooltip: "Bina Adı | 12 BB | 8 Abone | AP: Kayabaşı-01"

  Arızalı (aktif alarm):
    • Pentagon ikon, kırmızı pulse animasyonu
    • Tooltip: "⚠ ARIZA | Bina Adı | 8 abone etkilendi | 15dk önce"
    • Tıklama: Alarm detay popup

  Bakımda:
    • Pentagon ikon, sarı çerçeve
    • Tooltip: "🔧 BAKIM | Bina Adı"

CİHAZ MARKER (anten/AP üzeri):
  Online:  Yeşil daire + sinyal ikonu
  Offline: Kırmızı daire + çarpı ikonu
  Uyarı:   Turuncu daire + ünlem ikonu

CİHAZ-BİNA BAĞLANTI ÇİZGİSİ:
  Aktif:   Yeşil kesikli çizgi (cihaz → hizmet verdiği binalar)
  Arızalı: Kırmızı kesikli çizgi
```

---

## 7. BİNA-CİHAZ-ABONE İLİŞKİ MODELİ

```
topology.js Building
  ├── id: 42
  ├── name: "Akasya Sitesi B Blok"
  ├── bb: 24 (bağımsız bölüm)
  ├── lat/lng: koordinatlar
  │
  ├── network_devices[] (API'den gelir)
  │   ├── { id: 1, type: 'antenna', name: 'Kayabaşı-AP-01', status: 'active' }
  │   └── { id: 2, type: 'switch',  name: 'B-Blok-SW-01',   status: 'active' }
  │
  ├── subscribers[] (API'den gelir)
  │   ├── { abone_no: '01247', name: 'Ahmet Yılmaz', is_active: true,  package: '25Mbps' }
  │   ├── { abone_no: '01248', name: 'Fatma Kaya',   is_active: true,  package: '50Mbps' }
  │   └── { abone_no: '01249', name: 'Ali Çelik',    is_active: false, package: '25Mbps' }
  │
  └── alarms[] (API'den gelir)
      └── { id: 5, type: 'device_down', severity: 'critical', device: 'Kayabaşı-AP-01' }
```

### 7.1 Haritada Bina Bilgi Kartı (Tıklama Popup)

```
┌─────────────────────────────────────┐
│ 🏢 Akasya Sitesi B Blok            │
│ DA-003 | Ada 574, Parsel 246       │
├─────────────────────────────────────┤
│ BB: 24  |  Abone: 8/24  |  Kat: 7  │
│ Paket Dağılımı: 5×25M, 2×50M, 1×100M│
├─────────────────────────────────────┤
│ 📡 CİHAZLAR                         │
│ ✅ Kayabaşı-AP-01 (5GHz, -58dBm)   │
│ ✅ B-Blok-SW-01 (MikroTik CRS)     │
├─────────────────────────────────────┤
│ ⚠ ALARMLAR                          │
│ 🔴 AP bağlantı koptu (15dk önce)   │
│    → 8 abone etkilendi             │
├─────────────────────────────────────┤
│ [Abone Listesi] [Cihaz Detay] [Log]│
└─────────────────────────────────────┘
```

---

## 8. TEKNİK BORÇ & YAPILACAKLAR

### 8.1 Kritik (Hemen)

| # | Görev | Dosya |
|---|-------|-------|
| 1 | `AdminUser` modelini `database.py`'ye taşı | api/app/database.py |
| 2 | Yeni modelleri ekle (NetworkDevice, Alarm, DeviceMetric, DeviceBuildingMap) | api/app/database.py |
| 3 | Yeni router'ları oluştur (devices, alarms, monitoring) | api/app/routers/ |
| 4 | Portal API client'ı mock'tan gerçek backend'e bağla | portal/js/api-client.js |
| 5 | Portal'a ISP yönetim sayfaları ekle | portal/js/portal.js |

### 8.2 Önemli (Sprint 2)

| # | Görev | Dosya |
|---|-------|-------|
| 6 | Overlay'de cihaz marker ve arıza gösterimi | fiber-chrome/content/overlay.js |
| 7 | Cihaz polling servisi (MikroTik + SNMP) | api/app/services/device_monitor.py |
| 8 | Alarm tetikleme motoru | api/app/services/alarm_engine.py |
| 9 | WhatsApp arıza bildirimi | api/app/routers/whatsapp.py |

### 8.3 İyileştirme (Sprint 3)

| # | Görev |
|---|-------|
| 10 | MikroTik SSL sertifika pinleme (verify=False kaldır) |
| 11 | Celery worker aktifleştir (async cihaz polling) |
| 12 | Prometheus + Grafana entegrasyonu |
| 13 | Müşteri segmentasyon modülü |
| 14 | Çoklu router registry (12 ilçe) |

---

## 9. ÖRNEK VERİ

### 9.1 Abone CSV Formatı

```csv
abone_no;full_name;phone;district;village;package_name;package_speed;connection_type;mikrotik_user;mikrotik_ip;mikrotik_router;payment_amount
01247;Ahmet Yılmaz;05551234567;Merkez;Kayabaşı;25Mbps;25;pppoe;ahmet.yilmaz;;192.168.1.1;250
01248;Mehmet Demir;05559876543;Ilgaz;Camili;50Mbps;50;static;;10.10.1.50;192.168.2.1;350
01249;Fatma Kaya;05553334455;Şabanözü;Merkez;25Mbps;25;pppoe;fatma.kaya;;192.168.1.1;250
01250;Ali Çelik;05557778899;Atkaracalar;Yukarı;100Mbps;100;pppoe;ali.celik;;192.168.3.1;450
```

### 9.2 Cihaz Örnek Verisi

```json
[
  {
    "device_type": "antenna",
    "name": "Kayabaşı-AP-01",
    "brand": "MikroTik",
    "model": "SXTsq Lite5",
    "ip_address": "10.10.1.1",
    "lat": 40.6013,
    "lng": 33.6134,
    "building_id": 42,
    "ada_code": "DA-003",
    "router_ip": "192.168.1.1",
    "frequency": "5 GHz",
    "signal_threshold": -65.0,
    "status": "active"
  },
  {
    "device_type": "router",
    "name": "Merkez-MikroTik-01",
    "brand": "MikroTik",
    "model": "CCR1036-8G-2S+",
    "ip_address": "192.168.1.1",
    "lat": 40.5998,
    "lng": 33.6122,
    "building_id": 1,
    "ada_code": "DA-001",
    "status": "active"
  }
]
```

---

## 10. DEĞİŞİKLİK GÜNLÜĞÜ

| Tarih | Değişiklik | Kim |
|-------|-----------|-----|
| 2026-03-14 | Referans dosyası oluşturuldu, ISP CRM kodları belgelendi | BURAK + Claude |
| — | Portal entegrasyon mimarisi tasarlandı | — |
| — | Cihaz-bina-alarm veri modeli tanımlandı | — |
