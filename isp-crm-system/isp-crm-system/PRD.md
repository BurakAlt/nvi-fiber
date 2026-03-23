# Altıparmak Telekom ISP CRM Sistemi
## Ürün Gereksinimleri Dokümanı (PRD) v1.0
**Tarih:** Mart 2026  
**Proje:** ISP CRM + WhatsApp Otomasyon + MikroTik Entegrasyonu

---

## 1. Proje Özeti

Altıparmak Telekom'un (~889 abone, 12 ilçe) mevcut manuel operasyonlarını otomatize eden, WhatsApp üzerinden 7/24 AI destekli müşteri hizmeti sunan, banka ödemelerini otomatik eşleştirip MikroTik üzerinde hat açan entegre bir platform.

---

## 2. Mevcut Durum (As-Is)

| Problem | Etki |
|---------|------|
| Banka havalesi isim uyuşmazlığı | Paket açılmıyor, müşteri mağdur |
| WhatsApp'a manuel cevap | Mesai dışı cevap yok, gecikmeler |
| CRM CSV export | Gerçek zamanlı veri yok |
| MikroTik manuel müdahale | Operasyon yükü yüksek |
| Müşteri profili yok | Pazarlama kör yapılıyor |

---

## 3. Hedef Durum (To-Be)

```
Banka CSV → Fuzzy Match → Otomatik hat açma
WhatsApp → Claude AI → Anlık cevap + hat açma
MikroTik → REST API → Programatik kontrol
Dashboard → Onay kuyruğu + analitik
```

---

## 4. Tamamlanan Modüller ✅

### 4.1 Backend Altyapı
- **FastAPI** async REST API
- **PostgreSQL** veritabanı (6 tablo)
- **Docker Compose** (6 servis)
- **JWT Auth** (admin girişi)
- **Nginx** reverse proxy

### 4.2 Abone Yönetimi
- CSV import (CRM'den)
- Telefon normalizasyonu (+90 format)
- CRUD operasyonları
- Filtreleme (ilçe, ödeme durumu, arama)

### 4.3 Ödeme Motoru
- İş Bankası CSV parser (Windows-1254 encoding)
- **Fuzzy Matching Engine:**
  - Abone no çıkarma (regex)
  - IBAN geçmiş eşleştirme
  - İsim benzerliği (SequenceMatcher + token)
  - Otomatik onay (≥%85) / Manuel kuyruk (%60-84) / Eşleşmedi (<%60)
- Manuel onay/red endpoint'leri
- Ödeme uygulandığında otomatik hat açma

### 4.4 MikroTik Entegrasyonu
- RouterOS REST API client
- PPPoE enable/disable + session kesme
- Static IP firewall kural yönetimi
- Karma yapı desteği (PPPoE + Static aynı sistemde)
- İşlem loglama

### 4.5 WhatsApp + AI
- WAHA webhook entegrasyonu
- Konuşma ve mesaj loglama
- **Claude AI yanıt motoru:**
  - Abone profili context olarak verilir
  - Ödeme durumu kontrolü
  - Hat açma kararı (ACTION:enable_connection)
  - Türkçe kişiselleştirilmiş yanıt
- Otomatik hat açma tetikleme

### 4.6 Admin API
- Dashboard istatistikleri
- Konuşma listesi + çözümleme
- MikroTik log görüntüleme
- Manuel hat açma/kapama

---

## 5. Eksik / Yapılacak Modüller ❌

### 5.1 Admin Dashboard UI (React) — ÖNCELİK: YÜKSEK
**Kapsam:**
- Login sayfası (JWT)
- Ana dashboard (istatistik kartları)
- Ödeme onay kuyruğu (manuel eşleştirme UI)
- Abone listesi + detay sayfası
- WhatsApp konuşma görüntüleyici
- MikroTik canlı durum paneli

**Teknoloji:** React + Tailwind CSS  
**Tahmini süre:** 3-5 gün

---

### 5.2 Kalıcı Ağ Yapılandırması — ÖNCELİK: YÜKSEK
**Kapsam:**
- Ubuntu netplan static IP ayarı (100.68.0.10)
- DNS kalıcı yapılandırma
- Reboot sonrası IP korunması

**Tahmini süre:** 30 dakika

---

### 5.3 WAHA WhatsApp Bağlantısı — ÖNCELİK: YÜKSEK
**Kapsam:**
- WAHA container ayağa kaldırma
- WhatsApp Business QR tarama
- Webhook URL yapılandırması
- Test mesajı gönderme/alma

**Tahmini süre:** 1 saat

---

### 5.4 MikroTik Canlı Network Monitor — ÖNCELİK: ORTA
**Kapsam:**
- Prometheus + Grafana kurulumu
- MikroTik SNMP / API veri toplama
- Dashboard: bant genişliği, aktif session, uptime
- Aboneye özel trafik grafiği

**Teknoloji:** Prometheus + Grafana (Docker)  
**Tahmini süre:** 2-3 gün

---

### 5.5 Müşteri Segmentasyon & Pazarlama Profili — ÖNCELİK: ORTA
**Kapsam:**
- Konuşma geçmişinden intent analizi
- Paket upgrade adayları tespiti
- İlçe/köy bazlı penetrasyon haritası
- Churn riski skoru (ödeme gecikmesi + şikayet)
- CSV/Excel export (kampanya listesi)

**Teknoloji:** Python analitik + QGIS entegrasyonu  
**Tahmini süre:** 3-4 gün

---

### 5.6 Ödeme Entegrasyonu (İyzico/PayTR) — ÖNCELİK: DÜŞÜK
**Kapsam:**
- Online ödeme linki üretme
- Webhook ile otomatik onay
- WhatsApp'tan ödeme linki gönderme

**Tahmini süre:** 2 gün

---

### 5.7 Çoklu Router Desteği — ÖNCELİK: DÜŞÜK
**Kapsam:**
- 12 ilçe = birden fazla MikroTik
- Router registry (IP + ilçe eşleştirme)
- Abone → doğru router yönlendirme

**Tahmini süre:** 1 gün

---

### 5.8 SSL / Domain — ÖNCELİK: ORTA
**Kapsam:**
- Let's Encrypt sertifikası
- Domain yönlendirmesi
- WAHA için public URL (WhatsApp webhook zorunluluğu)

**Tahmini süre:** 2 saat

---

## 6. Deployment Durumu

| Adım | Durum |
|------|-------|
| Dell R210 II donanım | ✅ Hazır |
| VMware ESXi 7.0 | ✅ Çalışıyor |
| Ubuntu VM oluşturma | ✅ Tamamlandı |
| Ubuntu kurulumu | ✅ Tamamlandı |
| SSH erişimi | ✅ Çalışıyor |
| Docker kurulumu | ✅ v29.3.0 |
| Proje deploy | ⏳ Bekliyor |
| .env yapılandırması | ⏳ Bekliyor |
| WAHA QR bağlantısı | ⏳ Bekliyor |
| İlk CSV import | ⏳ Bekliyor |

---

## 7. Teknik Borç

1. `database.py`'ye `AdminUser` modeli eklenmeli
2. Celery worker şu an pasif — async job'lar için aktifleştirilmeli
3. MikroTik SSL sertifikası (self-signed) için `verify=False` — prodüksiyonda sertifika pin'lenmeli
4. CSV encoding otomatik tespiti test edilmeli (İş Bankası formatı doğrulanmalı)

---

## 8. Sıradaki Sprint

**Sprint 1 (Bu hafta):**
1. Kalıcı ağ ayarı (netplan)
2. Proje deploy (docker compose up)
3. İlk CSV import testi
4. WAHA WhatsApp bağlantısı

**Sprint 2:**
1. Admin Dashboard UI (React)
2. Manuel ödeme onay kuyruğu

**Sprint 3:**
1. Grafana network monitor
2. Müşteri segmentasyon modülü
