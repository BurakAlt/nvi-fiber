# Mimari - Abone Self-Servis Portal

**Tip:** Web SPA (Single Page Application)
**Dil:** Vanilla JavaScript + HTML + CSS
**Build:** Yok — statik dosya olarak ac

---

## Genel Bakis

Abone self-servis portali, fiber internet abonelerinin faturalarini, paketlerini ve hiz testlerini yonettigi web uygulamasidir. Mock API ile calisir, gercek backend'e gecis icin hazidir.

## Mimari

- **Hash-based routing:** `#dashboard`, `#billing`, `#packages`, `#speedtest`, `#support`, `#wifi`
- **Mobile-first responsive:** 320px, 768px, 1024px breakpoints
- **Dark theme:** CSS custom properties
- **Mock API:** ApiClient IIFE modulu — gercek backend'e swap edilebilir

## Dosya Yapisi

```
portal/
├── index.html          # SPA shell (header, nav, content area)
├── css/
│   └── portal.css      # Dark theme, responsive grid
├── js/
│   ├── api-client.js   # Mock API client
│   ├── portal.js       # SPA controller, hash routing
│   ├── charts.js       # Canvas grafikleri (sparkline, gauge)
│   └── speedtest.js    # Hiz testi motoru (simule)
└── test-portal.html    # Test sayfasi
```

## Sayfalar

| Route | Sayfa | Icerik |
|-------|-------|--------|
| #dashboard | Dashboard | QoS metrikleri, uptime gauge, kullanim grafikleri |
| #billing | Faturalar | Aylik fatura tablosu, odeme durumu |
| #packages | Paketler | Mevcut paket, upgrade secenekleri (50/100/200 Mbps) |
| #speedtest | Hiz Testi | Download/upload gauge, latency/jitter olcumu |
| #support | Destek | Ticket listesi, mesaj thread'i |
| #wifi | WiFi | SSID/sifre yonetimi, bagli cihazlar |

## Mock Aboneler

| Kodu | Ad | Paket | Adres |
|------|-----|-------|-------|
| AB-1001 | Ahmet Yilmaz | Fiber 100 (100 Mbps) | Cumhuriyet Mah. Ataturk Cad. No:15/3, Cankiri |
| AB-1002 | Fatma Demir | Fiber 50 (50 Mbps) | Karatekin Mah. Istasyon Sok. No:8/1, Cankiri |

## SpeedTest Motoru

Canvas tabanli simule edilmis hiz testi:
- **Download:** Rasgele hiz uretimiyle gauge animasyonu
- **Upload:** Benzer simulasyon
- **Latency:** ms cinsinden gecikme
- **Jitter:** ms cinsinden dalgalanma

## Gelecek Planlari

- Mock API → Gercek backend entegrasyonu
- JWT/OAuth kimlik dogrulama
- Gercek SNMP/TR-069 veri cekimi
