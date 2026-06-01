# FitCycle Stabilizasyon — Manuel Doğrulama Checklist

## Completion motoru

- [ ] Takvim, Bugün, Gün detay ve Süreç raporu aynı tamamlanma sonucunu gösteriyor
- [ ] Geçmiş eksik gün takvimde eksik/uyarı olarak işaretli
- [ ] Gelecek günlerde eksik çarpısı yok (`hasIncomplete = false`)
- [ ] Supplement planı var ama task yok → tamamlanmış sayılmıyor
- [ ] Pasif plana bağlı DayTask completion hesabına girmiyor

## DayTask sync

- [ ] Plan pasifleştirildiğinde gelecek günlerin orphan task'ları temizleniyor
- [ ] Geçmiş tamamlanmış task kayıtları silinmiyor
- [ ] Supplement/kür tamamlama yalnızca DayTask checkbox ile güncelleniyor (saveDayLog flag'leri yok)

## Antrenman

- [ ] TRAINING 2026 tek aktif program; Pzt PUSH 7 hareket
- [ ] Pazar antrenman `not_planned`
- [ ] Volume: 10×10 + 20×5 = 200
- [ ] PUSH delta: 1000 → 1300 = +300 (PULL karışmıyor)
- [ ] Tamamlanan session detay sayfası açılıyor

## Import / Export

- [ ] Export JSON v2 indirilebiliyor
- [ ] Import sonrası Plan → DayTask ilişkileri sağlam
- [ ] Import sonrası Session → SetLog ilişkileri sağlam
- [ ] Import post-process: normalize templates, cleanup future tasks, aggregate flags, volume backfill

## Production build

- [ ] Varsayılan build (`ALLOW_DB_PUSH_ON_BUILD` yok/false) yalnızca `prisma generate` + `next build` çalıştırıyor
- [ ] Seed mevcut kullanıcı verisini overwrite etmiyor

## Kalori / Makro

- [ ] Diyet planında hedef kalori/protein/karb/yağ girilebiliyor
- [ ] Gün detayında gerçekleşen makro alanları kaydediliyor
- [ ] Süreç raporunda ort. kalori, hedef, girilen gün sayısı görünüyor

## Performans

- [ ] `/seasons` geçmiş kartları hafif summary kullanıyor (N+1 yok)
- [ ] Aktif süreç kartı tam rapor gösteriyor

## Otomatik testler

```bash
npm test
```

- [ ] Vitest A–G senaryoları geçiyor
