# Altıparmak Telekom ISP CRM — Kurulum Kılavuzu
## Dell R210 / Ubuntu Server 24.04

---

## ADIM 1 — Ubuntu Server Kurulum

```bash
# ISO: https://ubuntu.com/download/server
# Dell R210'a USB'den kur
# Kurulum sırasında: OpenSSH Server seçeneğini işaretle
```

---

## ADIM 2 — Sunucu Hazırlık

```bash
# Sistemi güncelle
sudo apt update && sudo apt upgrade -y

# Docker kur
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Docker Compose
sudo apt install docker-compose-plugin -y

# Proje klasörü
mkdir -p /opt/isp-crm
cd /opt/isp-crm
```

---

## ADIM 3 — Proje Dosyalarını Kopyala

```bash
# Geliştirme makinenizden SCP ile:
scp -r ./isp-crm-system/* user@SUNUCU_IP:/opt/isp-crm/

# Veya git kullan:
git clone <repo> /opt/isp-crm
```

---

## ADIM 4 — Ortam Değişkenlerini Ayarla

```bash
cd /opt/isp-crm
cp .env.example .env
nano .env

# Doldurulacaklar:
# POSTGRES_PASSWORD → güçlü şifre
# CLAUDE_API_KEY → https://console.anthropic.com
# MIKROTIK_HOST → router IP'si
# MIKROTIK_USER → RouterOS API kullanıcısı (admin değil, ayrı user)
# MIKROTIK_PASS → router şifresi
# SECRET_KEY → openssl rand -hex 32
```

---

## ADIM 5 — MikroTik API Kullanıcısı Oluştur

```
RouterOS Terminal:
/user add name=api_user password=guclu_sifre group=full
/ip service enable www-ssl
/ip service set www-ssl port=443
```

---

## ADIM 6 — Sistemi Başlat

```bash
cd /opt/isp-crm
docker compose up -d

# Logları izle
docker compose logs -f api

# Servis durumu
docker compose ps
```

---

## ADIM 7 — WAHA WhatsApp Bağlantısı

```bash
# QR kod tarama sayfasına git:
http://SUNUCU_IP:3000

# Session başlat:
curl -X POST http://SUNUCU_IP:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"name": "altiparmak"}'

# QR kodu tara: http://SUNUCU_IP:3000/dashboard
# WhatsApp Business telefonundan QR okut
```

---

## ADIM 8 — WAHA Webhook Ayarla

```bash
curl -X PUT http://SUNUCU_IP:3000/api/sessions/altiparmak \
  -H "Content-Type: application/json" \
  -d '{
    "webhooks": [{
      "url": "http://SUNUCU_IP:8000/webhook/whatsapp",
      "events": ["message"]
    }]
  }'
```

---

## ADIM 9 — İlk Veri Yükleme

```bash
# CRM abonelerini yükle (CSV)
curl -X POST http://SUNUCU_IP:8000/subscribers/import-csv \
  -F "file=@/path/to/aboneler.csv"

# Banka CSV'si yükle
curl -X POST http://SUNUCU_IP:8000/payments/import-csv \
  -F "file=@/path/to/banka_ekstre.csv"
```

---

## ADIM 10 — Admin Paneli

```
http://SUNUCU_IP:3001
Kullanıcı: admin
Şifre: admin123  ← İLK GİRİŞTE DEĞİŞTİR!
```

---

## Portlar Özeti

| Port | Servis |
|------|--------|
| 8000 | FastAPI (API) |
| 3000 | WAHA (WhatsApp) |
| 3001 | Admin Panel |
| 5432 | PostgreSQL |
| 80   | Nginx (production) |

---

## CSV Format Şablonu (Aboneler)

```csv
abone_no;full_name;phone;district;village;package_name;package_speed;connection_type;mikrotik_user;mikrotik_ip;mikrotik_router;payment_amount
01247;Ahmet Yılmaz;05551234567;Merkez;Kayabasi;25Mbps;25;pppoe;ahmet.yilmaz;;192.168.1.1;250
01248;Mehmet Demir;05559876543;Ilgaz;Camili;50Mbps;50;static;;10.10.1.50;192.168.2.1;350
```

---

## Sorun Giderme

```bash
# API logları
docker compose logs -f api

# Veritabanı bağlantısı test
docker compose exec postgres psql -U ispuser -d ispcrm -c "\dt"

# WAHA durum
curl http://localhost:3000/api/sessions

# Manuel MikroTik test
curl -k -u admin:sifre https://192.168.1.1/rest/ppp/active
```
