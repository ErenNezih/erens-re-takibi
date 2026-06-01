# Classic Physique Tracker

Kişisel definasyon ve vücut takip paneli — tek kullanıcılı, veritabanlı spor takip uygulaması.

## Teknolojiler

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui bileşenleri
- Prisma ORM
- SQLite (local) / PostgreSQL (production)
- Recharts

## Kurulum

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

Tarayıcıda `http://localhost:3000` — varsayılan şifre: `classic2026`

## Environment Variables

`.env.example` dosyasını `.env` olarak kopyalayın:

| Değişken | Açıklama |
|----------|----------|
| `DATABASE_URL` | SQLite: `file:./dev.db` — Postgres: connection string |
| `APP_PASSWORD` | Uygulama giriş şifresi |
| `SESSION_SECRET` | Oturum token hash secret |

## Vercel Deploy

1. GitHub'a push edin
2. Vercel'de yeni proje oluşturun
3. **Vercel Postgres** veya **Neon Postgres** ekleyin
4. Environment variables ayarlayın:
   - `DATABASE_URL` → Postgres connection string
   - `APP_PASSWORD` → güçlü şifre
   - `SESSION_SECRET` → rastgele string
5. Deploy sonrası: `npx prisma db push` (Vercel build script'te otomatik)

### Production Postgres

`prisma/schema.prisma` içinde provider'ı değiştirin:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## Önemli Not

Bu uygulama tıbbi tavsiye, doz önerisi veya kullanım yönlendirmesi sağlamaz. Sadece kişisel veri kayıt ve süreç takip panelidir.

## Bölümler

- Dashboard — özet kartlar ve grafikler
- Günlük Kayıt — tek sayfadan günlük veri girişi
- Vücut Ölçüleri — tarih bazlı ölçüm takibi
- Kilo Takibi — haftalık trend analizi
- Beslenme — öğün ve makro takibi
- Antrenman — egzersiz kayıtları ve progressive overload
- Takvim / Plan — görev planlama
- Takviye / İlaç — manuel takip (tıbbi tavsiye yok)
- Fotoğraf / Notlar — ilerleme galerisi
- Ayarlar — hedefler, fazlar, export
