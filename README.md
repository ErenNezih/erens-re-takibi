# FitCycle Mobile Tracker

Mobil öncelikli spor, diyet, supplement, kür ve antrenman takip uygulaması. Tek kullanıcı, şifre korumalı, takvim merkezli.

## Özellikler

- **Takvim** — Aylık görünüm, gün durum noktaları (kilo, diyet, antrenman, supplement, kür, kan)
- **Bugün** — Hızlı kilo girişi, checkbox'lar, antrenmana başla
- **Gün Detay** — Kilo, diyet, supplement/kür tikleri, kan tahlili, not
- **Planlar** — Diyet, supplement, kür/ilaç, kan tahlili, antrenman şablonları
- **Antrenman** — Set set ağırlık/tekrar girişi, progressive overload geçmişi
- **Ayarlar** — JSON export/import, tema

## Kurulum

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

Şifre: `.env` içindeki `APP_PASSWORD` (varsayılan: `classic2026`)

## Vercel Deploy

| Env | Açıklama |
|-----|----------|
| `DATABASE_URL` | Neon pooled URL |
| `DIRECT_URL` | Neon unpooled URL (otomatik fallback var) |
| `APP_PASSWORD` | Giriş şifresi |
| `SESSION_SECRET` | Oturum secret |

Build sırasında `prisma db push --accept-data-loss` otomatik çalışır.

## Sağlık Notu

Bu uygulama tıbbi tavsiye, doz önerisi veya kullanım yönlendirmesi vermez. Kür/ilaç kayıtları yalnızca kişisel takip içindir.

## Alt Menü

Takvim | Bugün | Antrenman | Planlar | Ayarlar
