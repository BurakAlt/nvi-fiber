# Story 5.3: Toplam Yatirim Maliyeti Hesabi

Status: done

## Story

As a saha muhendisi,
I want tum yatirim kalemlerini (fiber + aktif ekipman + modem + kampanya) tek bir toplam maliyet olarak gorebilmek,
So that projenin gercek toplam yatirim tutarini net olarak bilir ve butce planlamasi yapabilirim.

## Acceptance Criteria

1. **AC1 — Kategori Bazli Toplam Yatirim (FR30):**
   Given fiber, aktif ekipman ve modem maliyetleri hesaplandiginda
   When toplam yatirim maliyeti gosterildiginde
   Then tum kalemler tek toplam olarak birlestirilmeli:
   - Fiber altyapi: PonEngine kategori bazli (aktif/pasif/kablo/aksesuar)
   - Aktif ekipman: Financial kategori bazli (olt/anten/diger)
   - Modem maliyeti (ucretsiz modem gideri)
   And kategori bazli alt toplamlar ve genel toplam gosterilmeli

2. **AC2 — Birim Yatirim Metrikleri (FR31):**
   Given toplam yatirim maliyeti hesaplandiginda
   When detayli ozet gosterildiginde
   Then birim yatirim maliyeti hesaplanmali:
   - TL/BB (toplam BB basina)
   - TL/abone (efektif abone basina)
   And yatirim dagilimi gorsel bar olarak gosterilmeli

3. **AC3 — Anlik Guncelleme:**
   Given herhangi bir yatirim kaleminde degisiklik yapildiginda
   When kalem guncellendikten
   Then toplam yatirim aninda yeniden hesaplanmali
   And tum metriklerin guncel degerle yansimali

## Tasks / Subtasks

- [x] Task 1: Financial.js detayli yatirim hesabi (AC: #1, #2)
  - [x] 1.1 getDetailedInvestment(ada) — fiber alt kategorileri + ekipman + modem + kampanya (placeholder)
  - [x] 1.2 Birim metrikleri: perBB, perSubscriber (efektif abone)
  - [x] 1.3 Yatirim dagilim yuzdeleri

- [x] Task 2: Panels.js detayli yatirim goruntuleme (AC: #1, #2, #3)
  - [x] 2.1 Investment summary karti genisletme — kategori bazli acilir detay
  - [x] 2.2 Yatirim dagilimi gorsel bar
  - [x] 2.3 Birim metrikleri satiri (TL/BB + TL/abone)

- [x] Task 3: CSS stilleri
  - [x] 3.1 Detayli yatirim ozeti stilleri
  - [x] 3.2 Dagilim bar stilleri

- [x] Task 4: Testler
  - [x] 4.1 getDetailedInvestment testleri
  - [x] 4.2 Birim metrik testleri
  - [x] 4.3 Fiber alt kategori testleri

## Dev Notes

### Mevcut Durum

getTotalInvestment(ada) zaten var:
- fiberCost, equipmentCost, modemCost, totalInvestment, perBB, byCategory
- Yeni fonksiyon getDetailedInvestment() fiber'i PonEngine kategorilerine ayiracak

### PonEngine Fiber Alt Kategorileri

```
CATALOG_CATEGORIES:
  aktif:    olt_port, sfp_module, ont
  pasif:    splitter_*, fdh_cabinet, odf_panel, splice_closure
  kablo:    fiber_96, fiber_48, fiber_24, fiber_12, fiber_4, fiber_2
  aksesuar: connector, splice_tray, patch_cord, fusion_splice, anten, anten_pole, ptp_*
```

### Yatirim Yapisi

```
Toplam Yatirim = Fiber Altyapi + Aktif Ekipman + Modem + Kampanya

Fiber Altyapi (PonEngine):
  ├─ Aktif (OLT port, SFP, ONT)
  ├─ Pasif (splitter, FDH, ODF)
  ├─ Kablo (fiber kablolar)
  └─ Aksesuar (konnektor, ek kaseti, patch kord)

Aktif Ekipman (Financial):
  ├─ OLT & Moduller
  ├─ Anten & Montaj
  └─ Diger Aktif Ekipman

Modem (Financial):
  └─ Ucretsiz modem gideri

Kampanya (placeholder = 0):
  └─ Story 5.5'te implement edilecek
```

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Node.js test runner: 20/20 test PASS (6 suite)
- Syntax check: financial.js, panels.js — OK

### Completion Notes List

- getDetailedInvestment(): PonEngine CATALOG_CATEGORIES ile fiber alt kategorilere ayirma (aktif/pasif/kablo/aksesuar)
- Birim metrikleri: perBB (toplam BB basina) + perSubscriber (efektif abone basina)
- Breakdown dizisi: her segment label, value, color, percent — gorsel bar icin
- Collapsible detay: Fiber Altyapi ve Aktif Ekipman satirlari tiklanarak alt detaylari acilir
- campaign.total = 0 placeholder — Story 5.5'te implement edilecek
- getTotalInvestment() ile tutarlilik saglanmis (regression test)

### Change Log

- 2026-03-01: 4 task implement edildi, 20/20 test gecti, story review'e alindi

### File List

| File | Action | Description |
|------|--------|-------------|
| lib/financial.js | MODIFIED | getDetailedInvestment() eklendi — fiber sub-kategoriler, birim metrikleri, dagilim |
| content/panels.js | MODIFIED | Investment summary genisletildi — collapsible detay, gorsel bar, TL/abone metrigi |
| styles/overlay.css | MODIFIED | Clickable rows, detail panel, bar container, legend stilleri |
| dashboard/test-financial.html | MODIFIED | 9 yeni test (getDetailedInvestment suite) eklendi |
