# Review: Story 7.1 (Canli Izleme Harita Katmani)

## ONCEKI REVIEW GECERSIZ

> Bu dosya onceden "UISP Cihaz Durum Entegrasyonu" olarak review edilmisti.
> Story 7.1, 2026-03-05 tarihinde tamamen yeniden yazildi:
> **"Canli Izleme Harita Katmani"** — adaptor mimarisi, birlesik Device modeli, Steve Jobs tasarim felsefesi.
>
> Mevcut implementasyon (v1) yeni vizyonla uyumlu olmayan alanlar iceriyor.
> Yeni story dokumanina gore implementasyon revizyonu GEREKIYOR.
> Bu review dosyasi, revizyon tamamlandiginda yeniden yazilacaktir.

## Onceki Review Ozeti (Arsiv)

Onceki review'da tespit edilen sorunlar:
1. **proxyFetch eksikligi (CRITICAL)** — background.js'de handler yoktu → sonradan eklendi, cozuldu
2. **Scope creep** — Zabbix kodlari 7.1'de zamansiz yuklenmis → yeni vizyonda bu BEKLENEN bir durum (adaptor mimarisi)
3. **testConnection sayi tutarsizligi (MEDIUM)** — parse oncesi vs sonrasi fark → hala gecerli

## Yeni Vizyon Icin Revizyon Gereksinimleri

Story 7.1 yeniden yazildiktan sonra mevcut koddaki su alanlarin revizyonu gerekiyor:

1. **Adaptor deseni:** Mevcut kod UISP ve Zabbix'i ayri private state olarak barindiriyor ama formal DataAdapter arayuzu yok. Adaptor arayuzune gecis gerekli.
2. **Birlesik Device modeli:** UISP device ve Zabbix host ayri nesneler — tek Device nesnesinde normalize edilmeli.
3. **Harita katmani UX:** "Tek bakista durum" felsefesi — mevcut UI'nin sadelesterilmesi, durum halkasi + popup tek kart tasarimi.
4. **Yapilandirma rehberi:** Mevcut dogrudan config formu → adim adim rehber deneyimine donusmeli.

---
*Bu review, Story 7.1 revizyon implementasyonu tamamlandiginda guncellenecektir.*
