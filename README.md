# Trove Teknoloji MVP

Mobile-first teknoloji ilan, teknik servis ve ürün takip platformu.

## Lokal geliştirme

```bash
npm install
cp .env.example .env.local
npm run dev
```

Uygulama varsayılan olarak `http://localhost:3000` üzerinde çalışır.

## Hedefli test yaklaşımı

Her değişiklikte yalnızca ilgili modülün testi çalıştırılır:

```bash
npm test -- src/modules/products/product-code.test.ts
```

Tüm testler yalnızca entegrasyon/checkpoint aşamasında gerektiğinde çalıştırılır:

```bash
npm test
```

## Git akışı

```bash
git pull
git status
git diff
npm test -- <ilgili-test-dosyasi>
git add <ilgili-dosyalar>
git commit -m "..."
git push
```

Hatalı ve push edilmiş değişikliklerde geçmişi korumak için öncelik `git revert` kullanmaktır.
