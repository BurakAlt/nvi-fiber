# Altıparmak Telekom — ISP CRM Sistemi
## Tam Mimari Dökümanı

### Servisler
1. **api/** — FastAPI ana backend
2. **bot/** — WhatsApp mesaj işleme + Claude AI
3. **mikrotik/** — RouterOS REST API client
4. **payment/** — Banka CSV parser + fuzzy matching
5. **admin/** — React dashboard (onay kuyruğu)
6. **db/** — PostgreSQL şemaları

### Akışlar
- WhatsApp → webhook → bot → Claude → cevap
- Banka CSV → fuzzy match → otomatik onay VEYA manuel kuyruk
- MikroTik → PPPoE/Static enable/disable
