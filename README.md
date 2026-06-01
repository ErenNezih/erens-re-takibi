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

## Vercel + Neon Deploy

### 1. Neon entegrasyonu (ekran görüntüsündeki modal)

| Alan | Ne seç |
|------|--------|
| Connect a Project | `projeclassic` |
| Environments | **Production** + **Preview** işaretle |
| Custom Prefix | **`STORAGE` değil — boş bırak veya `DATABASE` yaz** |
| Sensitive | Açık kalabilir |

> Prefix `STORAGE` olursa değişken `STORAGE_URL` olur; Prisma **`DATABASE_URL`** arar. Prefix boş → `DATABASE_URL` otomatik oluşur.

**Connect** → **Continue** ile bitir.

### 2. Vercel Environment Variables (manuel kontrol)

Neon bağlandıktan sonra **Settings → Environment Variables** içinde şunlar olmalı:

| Key | Neon'dan hangi değer |
|-----|----------------------|
| `DATABASE_URL` | `POSTGRES_PRISMA_URL` (pooler + `connect_timeout=15`) |
| `DIRECT_URL` | `DATABASE_URL_UNPOOLED` veya `POSTGRES_URL_NON_POOLING` |
| `APP_PASSWORD` | Kendi giriş şifren |
| `SESSION_SECRET` | Rastgele uzun string |

Neon otomatik eklemediyse yukarıdaki iki DB değişkenini Neon dashboard → Connection string sekmesinden kopyala-yapıştır.

### 3. Redeploy

Env kayıtlıyken **Deployments → Redeploy**. Build sırasında `prisma db push` tabloları oluşturur.

### 4. İlk seed (bir kez)

Deploy sonrası local'den veya Vercel CLI ile:

```bash
npm run db:seed
```

(`DATABASE_URL` ve `DIRECT_URL` ortamda tanımlı olmalı)

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
