# Trove Teknoloji MVP

Trove Teknoloji için geliştirilen mobile-first teknoloji ilan, teknik servis, takas, ürün takip, barkod ve yönetim platformu.

Bu repository MVP sürümünü içerir. Temel yaklaşım: önce sade ve sağlam çalışan sistem, ardından kontrollü ve modüler büyüme.

## Ana ürün akışları

Müşteri tarafı:

- Ana sayfa → kategori/slider → ilan → ürün detayı → WhatsApp/iletişim
- Teknik servis yönlendirmesi ve servis kayıt akışları
- Takas / cihaz değerleme akışları
- PWA desteği, mobil ana ekrana ekleme ve uygulama ikonları

Admin tarafı:

- İlan oluşturma, düzenleme, yayınlama/gizleme ve stok/satıldı yönetimi
- Görsel yönetimi
- Sahibinden/veri kaynağı üzerinden ilan bilgisi alma altyapısı
- Barkod ve ürün kodu yönetimi
- Barkod tarama ve ürün kaydına erişim
- Teknik servis kayıtları ve fiyat referansları
- Takas cihazları, maliyet referansları ve fiyat yönetimi
- Banner/slider, duyuru, marka, logo, uygulama ikonu ve site ayarları
- USD bazlı merkezi fiyat güncelleme sistemi

## Kullanılan teknoloji ve araçlar

### Uygulama

- **Next.js 16.3.3** — App Router tabanlı frontend ve server-side uygulama yapısı
- **React 19.2.8** — kullanıcı arayüzü
- **React DOM 19.2.8** — web rendering
- **TypeScript 5.9+** — tip güvenliği ve sürdürülebilir kod
- **Node.js** — geliştirme, test ve CI çalışma ortamı
- **npm** — bağımlılık ve script yönetimi

### Backend ve veri

- **Supabase** — PostgreSQL veritabanı, Authentication, Storage ve RPC işlevleri
- **PostgreSQL 17** — ana ilişkisel veritabanı
- **Supabase SSR (`@supabase/ssr`)** — server/client auth oturum yönetimi
- **Supabase JS (`@supabase/supabase-js`)** — uygulama ile Supabase servisleri arasındaki istemci
- **Row Level Security (RLS)** — tablo bazlı erişim kontrolü
- **PostgreSQL functions / RPC** — fiyat güncelleme, katalog ve iş mantığı işlemleri
- **Supabase Storage** — ürün görselleri, logo ve uygulama ikonu gibi medya dosyaları

### Production ve dağıtım

- **Cloudflare Workers** — production runtime
- **Vinext** — Next.js uygulamasını Cloudflare Worker uyumlu çıktıya dönüştürme
- **Wrangler** — Cloudflare Worker build/deploy ve binding yönetimi
- **Cloudflare KV** — Vinext data/cache binding altyapısı
- **Cloudflare Images binding** — Cloudflare tarafındaki image optimization entegrasyonu
- **GitHub Actions** — test, build ve otomatik production deploy
- **GitHub** — ana kaynak kod ve sürüm yönetimi

`main` branch'e yapılan push sonrasında production workflow otomatik olarak çalışır. Normal geliştirme akışında yerel bilgisayarda manuel Cloudflare deploy yapılması gerekmez.

### Web/PWA

- **Web App Manifest** — PWA adı, tema, uygulama ikonu ve standalone çalışma bilgileri
- **Apple Web App metadata** — iPhone/iPad ana ekran desteği
- **Next.js Metadata API** — başlık, açıklama, favicon ve app icon tanımları
- **Next ImageResponse / OG altyapısı** — gerektiğinde dinamik görsel üretimi

### Entegrasyonlar

- **WhatsApp bağlantıları** — müşteri iletişim ve teknik servis yönlendirmeleri
- **Harici ilan/veri kaynağı modülü** — Sahibinden benzeri kaynaklardan veri alma işlevlerinin ana sistemden ayrıştırılması
- **Kamera / barkod okuyucu uyumlu tarama yaklaşımı** — admin ürün ve teknik servis kayıt erişimi

## Mimari yaklaşım

Kod mümkün olduğunca bağımsız modüllere ayrılır. UI, iş mantığı, veritabanı erişimi ve harici servisler birbirine gereksiz şekilde bağlanmamalıdır.

Başlıca sorumluluk alanları:

- Frontend / müşteri sitesi
- Admin panel
- Authentication ve admin erişim kontrolü
- Listings / ürünler
- Categories
- Technical Service
- Trade-in / takas
- Pricing
- Homepage sliders / banners / announcements
- Barcode / scanner / label printing
- Image / brand asset storage
- Site settings
- WhatsApp
- External listing/data import
- Supabase database/RLS/RPC
- Cloudflare deployment

## Ana sayfa davranışı

Ana sayfa slider alanları veritabanındaki aktif slider kayıtlarından oluşturulur. Bir slider kategorisinde gösterilecek aktif içerik yoksa o bölüm başlığı ve boş slider alanı kullanıcıya gösterilmez.

Bu davranış hem mobil hem masaüstü görünümde geçerlidir ve boş UI bloklarının oluşmasını engeller.

## Güvenlik

- API key ve özel tokenlar kaynak koda yazılmaz.
- Gizli production değerleri GitHub Actions Secrets veya ilgili platform secret mekanizmalarında tutulur.
- Public olarak kullanılabilecek frontend değerleri ile gerçek secret değerler birbirinden ayrılır.
- Admin işlemlerinde Supabase Authentication, uygulama tarafı admin kontrolü ve veritabanı RLS/policy katmanları birlikte kullanılır.
- Cloudflare API token gibi erişim anahtarları chat, issue, commit veya README içinde paylaşılmaz.

## Ortam değişkenleri

Başlangıç için:

```bash
cp .env.example .env.local
```

`.env.local` Git'e commit edilmemelidir.

Temel frontend Supabase değişkenleri:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Admin erişiminde kullanılan değer:

```text
TROVE_ADMIN_EMAILS
```

Production deploy tarafında Cloudflare erişim bilgileri GitHub Actions Secrets/CI ortamından sağlanır.

## Lokal geliştirme

İlk kurulum:

```bash
npm install
cp .env.example .env.local
npm run dev
```

Uygulama varsayılan olarak:

```text
http://localhost:3000
```

adresinde çalışır.

## Scriptler

```bash
npm run dev
npm run build
npm run start
npm test
```

- `npm run dev`: Next.js geliştirme sunucusu
- `npm run build`: Next.js production build
- `npm run start`: hazırlanmış Next.js build'i çalıştırır
- `npm test`: Node.js native test runner ile testleri çalıştırır

## Test yaklaşımı

Her küçük değişiklikte mümkün olduğunca ilgili modülün hedefli testi tercih edilir:

```bash
npm test -- src/modules/products/product-code.test.ts
```

Entegrasyon/checkpoint aşamalarında tüm testler çalıştırılabilir:

```bash
npm test
```

Production GitHub Actions workflow'u da deploy öncesinde test aşamasını çalıştırır.

## Git ve deployment akışı

Standart geliştirme akışı:

```bash
git pull
git status
git diff
git add <ilgili-dosyalar>
git commit -m "..."
git push origin main
```

`main` push sonrası GitHub Actions:

1. Repository'yi checkout eder.
2. Node ortamını hazırlar.
3. Bağımlılıkları kurar.
4. Testleri çalıştırır.
5. Vinext Cloudflare yapısını hazırlar.
6. Cloudflare binding ve runtime değerlerini yapılandırır.
7. Worker build'i oluşturur.
8. Wrangler ile Cloudflare Workers'a deploy eder.
9. Canlı `/api/health` endpoint'ini kontrol eder.

Push edilmiş hatalı değişikliklerde geçmişi korumak için öncelik `git revert` kullanmaktır.

## Veritabanı değişiklikleri

Şema veya kalıcı DB iş mantığı değişiklikleri Supabase migration olarak tutulmalıdır.

Migration dosyaları:

```text
supabase/migrations/
```

Manuel ve sadece canlı veritabanında kalan, repository'ye yansıtılmamış DDL değişikliklerinden kaçınılmalıdır.

## Ürün kodu, barkod ve etiket prensibi

Her fiziksel ürün tekil bir ürün kaydına bağlıdır. Barkod sadece görsel değildir; ürün kaydını bulmak için kullanılan anahtar zincirinin parçasıdır.

Temel ilişki:

```text
Barkod → Ürün kodu → İlan/ürün ID → Ürün kaydı
```

Etiket sistemi ürün türüne göre marka/model, hafıza, renk, pil sağlığı, cihaz durumu, kayıt bilgisi, barkod ve Trove ürün kodu gösterebilecek şekilde genişletilebilir tasarlanmalıdır.

## Fiyat yönetimi

Merkezi fiyat yönetimi USD baz fiyat ve USD/TRY kuru üzerinden çalışabilecek şekilde tasarlanmıştır. Sistem ürünlerin yanı sıra ilgili takas, maliyet ve teknik servis fiyat referanslarını da merkezi olarak güncelleyebilir.

Fiyat değişikliği kullanıcı onayı olmadan otomatik uygulanmamalıdır. Mevcut TL fiyatlarından USD baz fiyat ilk kez türetilecekse kullanılacak baz kur bilinçli olarak seçilmelidir.

## MVP geliştirme prensipleri

Öncelik sırası:

**Çalışabilirlik → Mobil uyumluluk → Kullanım kolaylığı → Performans → Güvenlik → Temiz kod → Ölçeklenebilirlik**

Yeni özellik eklenirken mevcut çalışan sistem gereksiz yere değiştirilmemeli, mümkünse yeni özellik ayrı bir modül olarak eklenmelidir. Gelecekte kullanıcı hesapları, favoriler, karşılaştırma, ödeme, sepet, sipariş, stok hareketleri, POS, fatura, servis takip ve çoklu mağaza gibi sistemlerin eklenmesini engelleyecek mimari kararlar alınmamalıdır; ancak bu özellikler ihtiyaç oluşmadan MVP'ye eklenmemelidir.

## Proje talimatları

Geliştirme kurallarının ayrıntılı ve güncel hali repository kökündeki `PROJECT_INSTRUCTIONS.md` dosyasında tutulur. Yeni mimari karar veya önemli çalışma kuralı eklendiğinde README ile birlikte bu dosya da güncellenmelidir.
