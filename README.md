# Classic Physique Tracker

Kişisel definasyon ve vücut takip paneli — tek kullanıcılı, veritabanlı spor takip uygulaması.

## Teknolojiler

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui bileşenleri
- Prisma ORM + PostgreSQL
- Recharts

## Kurulum (Local)

1. **Neon** veya **Vercel Postgres** ücretsiz veritabanı oluşturun
2. `.env.example` dosyasını `.env` olarak kopyalayın
3. `DATABASE_URL` değerini Postgres connection string ile doldurun

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

Tarayıcıda `http://localhost:3000` — varsayılan şifre: `classic2026`

## Environment Variables

| Değişken | Açıklama |
|----------|----------|
| `DATABASE_URL` | PostgreSQL connection string (zorunlu) |
| `APP_PASSWORD` | Uygulama giriş şifresi |
| `SESSION_SECRET` | Oturum token hash secret |

## Vercel Deploy

### 1. Postgres ekle

Vercel Dashboard → Projeniz → **Storage** → **Create Database** → **Postgres**

### 2. Environment Variables ayarla

**Settings → Environment Variables** bölümüne şunları ekleyin:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Vercel Postgres `.env.local` sekmesindeki **`POSTGRES_PRISMA_URL`** değeri |
| `APP_PASSWORD` | Güçlü bir şifre (örn. rastgele 32 karakter) |
| `SESSION_SECRET` | Rastgele uzun string |

> **Önemli:** `DATABASE_URL` boş bırakılırsa build şu hatayı verir:  
> `Environment variable not found: DATABASE_URL`

### 3. Redeploy

Env değişkenlerini ekledikten sonra **Deployments → Redeploy** yapın.

Build sırasında `prisma db push` otomatik çalışır ve tablolar oluşturulur.  
İlk deploy sonrası seed için bir kez Vercel CLI veya local'den:

```bash
DATABASE_URL="..." npm run db:seed
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
