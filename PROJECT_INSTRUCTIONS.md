# Trove Teknoloji — Güncel Proje Talimatları

Bu dosya Trove Teknoloji MVP projesinin kalıcı geliştirme kurallarını, mimari sınırlarını ve operasyon yaklaşımını tanımlar. Yeni geliştirmeler bu kurallarla uyumlu olmalıdır.

## 1. Projenin amacı

Trove Teknoloji için modern, hızlı, premium görünümlü ve tamamen mobile-first bir teknoloji ilan, teknik servis, takas ve ürün takip platformu geliştirilmektedir.

MVP sade tutulur ancak mimari; ileride kullanıcı hesapları, favoriler, karşılaştırma, ödeme, sepet, sipariş, stok hareketleri, POS, fatura, bildirimler, gelişmiş teknik servis takibi ve çoklu mağaza gibi sistemleri eklemeye engel olmamalıdır.

Temel prensip:

**Önce sade ve sağlam çalışan MVP, ardından kontrollü büyüme.**

## 2. Öncelik sırası

Her geliştirmede aşağıdaki sıra korunur:

**Çalışabilirlik → Mobil uyumluluk → Kullanım kolaylığı → Performans → Güvenlik → Temiz kod → Ölçeklenebilirlik**

Kısa vadeli hız uğruna ileride sistemi yeniden yazdıracak mimariler kullanılmaz.

## 3. Kullanıcı tarafı

Ana müşteri akışı:

**Site → Ana sayfa/kategori → İlanlar → Ürün detayı → WhatsApp/iletişim**

Ana müşteri alanları:

- Telefon
- Laptop & bilgisayar
- Giyilebilir teknoloji
- Aksesuar & yedek parça
- Teknik servis
- Takas / cihaz değerleme

Ana sayfa; slider/banner alanları, duyurular, ürün yönlendirmeleri, teknik servis, takas ve iletişim akışlarına giriş sağlar.

### Ana sayfa slider kuralı

Bir slider kategorisinde gösterilecek aktif içerik yoksa:

- bölüm başlığı gösterilmez,
- boş slider container oluşturulmaz,
- gereksiz dikey boşluk bırakılmaz.

Bu davranış mobil ve masaüstünde aynı şekilde uygulanmalıdır.

## 4. Admin panel

Admin panel müşteri sitesinden ayrıdır ve `/admin` altında çalışır.

Admin panelin temel sorumlulukları:

- İlan ekleme, düzenleme, silme
- Yayınlama/gizleme
- Satıldı/stokta yönetimi
- Fiyat değiştirme
- Görsel yönetimi
- Kategori yönetimi
- Slider/banner yönetimi
- Duyuru yönetimi
- Teknik servis kayıtları
- Teknik servis fiyat referansları
- Takas cihaz ve maliyet referansları
- Merkezi fiyat yönetimi
- Barkod tarama
- Etiket oluşturma/yazdırma
- WhatsApp bilgileri
- Logo ve uygulama ikonu
- Genel site/PWA ayarları

Panel teknik bilgisi olmayan bir kişinin kullanabileceği sadelikte tasarlanmalıdır.

## 5. İlan oluşturma akışı

Tercih edilen akış:

**Görsel yükle → Kaynak ilan URL'si ekle → Bilgileri çek → Kontrol et → Yayınla**

Harici ilan/veri alma katmanı ana ürün modülünden bağımsız tutulmalıdır. Sahibinden veya başka bir kaynak değiştiğinde sitenin geri kalanını yeniden yazmak gerekmemelidir.

## 6. Ürün kodu ve barkod

Her fiziksel ürün/ilan tekil ürün koduna sahip olmalıdır. Aynı kod iki üründe kullanılamaz.

Barkod ilişkisi:

**Barkod → Ürün kodu → Ürün/ilan ID → Veritabanı kaydı**

Barkod yalnızca basılan bir görsel değil, ürün kaydını bulmak için sistemsel bir anahtar olmalıdır.

Admin barkod tarama ekranı telefon, tablet ve bilgisayar kamerası ile; mümkün olan durumlarda klavye gibi çalışan fiziksel barkod okuyucularla uyumlu tasarlanmalıdır.

## 7. Teknik servis

Teknik servis kayıtları mağaza içi operasyon için ürün ilanlarından ayrı yönetilebilir.

Kayıtlarda ihtiyaca göre:

- müşteri adı,
- telefon numarası,
- cihaz tipi,
- arıza/şikayet,
- servis durumu,
- teknik servise özel kayıt/barkod numarası,
- işlem notları

tutulabilir.

Durum yapısı operasyonel takip için açık ve sade olmalıdır; örneğin yapılmakta, tamamlandı ve müşteriye haber verilecek benzeri aşamalar desteklenebilir.

## 8. Takas ve fiyat referansları

Takas sistemi ürün satışından bağımsız bir iş alanı olarak tutulur.

Takas tarafında:

- cihaz piyasa referansları,
- TR/pasaport/yurtdışı benzeri fiyat türleri,
- maliyet/kesinti referansları,
- kâr marjları

ayrı veri alanlarında yönetilebilir.

## 9. Merkezi fiyat yönetimi

Sistem USD bazlı fiyat referansı kullanabilecek şekilde geliştirilmiştir.

Genel formül:

**USD baz fiyat × hedef USD/TRY kuru → yeni TL fiyat**

İsteğe bağlı yuvarlama adımı uygulanabilir.

Merkezi fiyat güncelleme sistemi aşağıdaki grupları kapsayabilir:

- ürünler,
- takas cihaz piyasa referansları,
- takas maliyet referansları,
- teknik servis min/max fiyat referansları.

Fiyat değişikliği kullanıcı onayı olmadan uygulanmamalıdır. Geçmiş TL fiyatlarından USD baz fiyat ilk kez türetilecekse kullanılan baz kur bilinçli şekilde seçilmelidir; sistem tarihsel kuru tahmin etmemelidir.

## 10. PWA, favicon ve uygulama ikonları

Site PWA uyumlu tutulur.

Kullanılan mekanizmalar:

- Next.js Metadata API
- Web App Manifest
- Apple Web App metadata
- `theme-color`
- favicon/browser icon
- Apple touch icon
- PWA app icon

Admin panelde yüklenen `app_icon_url`, browser favicon ve mobil/PWA ikonlarında birincil ikon kaynağı olarak kullanılmalıdır. Gereksiz dinamik yeniden üretim katmanları production runtime'da uyumluluk sorunu çıkarıyorsa doğrudan kayıtlı statik/public görsel URL'si tercih edilir.

## 11. Teknoloji yığını

### Uygulama

- Next.js 16.x App Router
- React 19
- TypeScript 5.9+
- Node.js
- npm

### Backend

- Supabase
- PostgreSQL 17
- Supabase Authentication
- Supabase Storage
- Supabase SSR
- Supabase JS
- PostgreSQL RPC/functions
- Row Level Security

### Production

- Cloudflare Workers
- Vinext
- Wrangler
- Cloudflare KV
- Cloudflare Images binding
- GitHub Actions

### Kaynak kod ve CI

- GitHub repository
- `main` production branch
- GitHub Actions automatic production deployment

## 12. Modüler mimari

Sistem mümkün olduğunca aşağıdaki sorumluluklara ayrılır:

- Frontend
- Backend/API
- Database
- Authentication
- Listings
- Categories
- Homepage sliders/banners
- Technical Service
- Trade-in
- Pricing
- External Data Import
- Barcode
- Scanner
- Label Printing
- Image/Asset Storage
- WhatsApp
- Admin Panel
- Site Settings
- PWA/Metadata
- Deployment

UI, iş mantığı, DB erişimi ve harici servisler gereksiz şekilde birbirine bağlanmamalıdır.

## 13. Supabase kuralları

Kalıcı şema değişiklikleri migration olarak tutulmalıdır.

Migration yolu:

`supabase/migrations/`

Yeni tablo, kolon, index, RLS policy veya function değişikliği canlı DB'ye uygulanıyorsa repository'de de karşılığı bulunmalıdır.

Admin erişiminde uygulama tarafı kontrol ile DB tarafı RLS/policy mekanizmaları birlikte kullanılmalıdır.

Public RPC fonksiyonlarının yetkileri değiştirilirken fonksiyonun gerçekten müşteri tarafından anonim kullanılmasının gerekip gerekmediği kontrol edilmelidir.

## 14. Güvenlik

- API token, şifre ve gerçek secret kaynak koda yazılmaz.
- Cloudflare API token GitHub Actions Secrets içinde tutulur.
- Admin e-posta listesi gibi hassas operasyon değerleri secret/env üzerinden sağlanır.
- `NEXT_PUBLIC_*` değerlerinin tarayıcıya açık olduğu unutulmamalıdır.
- Secret değerler README, issue, chat veya commit mesajlarında paylaşılmamalıdır.
- Daha önce yanlışlıkla paylaşılmış tokenlar revoke edilip yenilenmelidir.

## 15. Deployment kuralı

Production dağıtımı GitHub Actions üzerinden otomatik yapılır.

Normal akış:

**Kod → `main` commit/push → GitHub Actions test/build → Vinext → Wrangler → Cloudflare Workers → health check**

Rutin güncellemelerde geliştiricinin yerel bilgisayarında manuel Cloudflare deploy veya production build çalıştırması gerekmez.

Production workflow deploy sonrasında `/api/health` endpoint'ini kontrol etmelidir.

## 16. Git çalışma prensibi

- Küçük ve anlaşılır commitler tercih edilir.
- Mevcut çalışan sistemi gereksiz yere yeniden düzenleme.
- Yeni özellik mümkünse bağımsız modül olarak eklenir.
- Push edilmiş hatalı değişikliklerde geçmişi korumak için `git revert` tercih edilir.
- Production branch `main`dir.

## 17. Test yaklaşımı

Küçük geliştirmelerde önce hedefli test çalıştırılır. Entegrasyon/checkpoint veya production CI aşamasında tüm testler çalıştırılabilir.

Testler mevcut davranışı korumalı, özellikle ürün kodu benzersizliği, fiyat hesapları, yetki ve kritik admin akışları regresyona karşı korunmalıdır.

## 18. Responsive/mobile-first kuralı

Tüm müşteri ve admin ekranları telefon, tablet, laptop ve masaüstünde sorunsuz çalışmalıdır.

Mobil uyumluluk sonradan eklenen CSS düzeltmesi değil, component ve layout kararlarının temelidir.

## 19. Performans

- Boş UI blokları render edilmez.
- Gereksiz DB sorgularından kaçınılır.
- Aynı veri tekrar tekrar filtrelenip hesaplanacaksa mümkün olduğunda tek adımda gruplanır/hazırlanır.
- Büyük medya dosyaları optimize edilir.
- Ana sayfa ve kategori deneyiminde içerik yüklenirken düzen kayması minimumda tutulur.

## 20. Gelecekte büyüme

Mimari şu özelliklerin eklenmesini engellememelidir:

- kullanıcı hesapları,
- favoriler,
- ürün karşılaştırma,
- gelişmiş filtreleme,
- online ödeme,
- sepet,
- sipariş,
- stok hareketleri,
- satış geçmişi,
- kasa/POS,
- fatura entegrasyonları,
- kampanyalar,
- bildirimler,
- gelişmiş servis cihaz takibi,
- yeni kategoriler,
- çoklu mağaza/şube.

Bu özellikler ihtiyaç oluşmadan MVP'ye eklenmez.

## 21. Dokümantasyon kuralı

Mimari, deployment, ana teknoloji yığını veya ana operasyon akışında önemli bir değişiklik yapıldığında:

1. `PROJECT_INSTRUCTIONS.md` güncellenir.
2. Kullanıcı/geliştirici için anlamlıysa `README.md` de güncellenir.
3. Yeni environment variable veya external dependency eklenmişse dokümantasyonda açıkça belirtilir.

Dokümantasyon gerçek çalışan sistemi tarif etmelidir; planlanan ama henüz uygulanmamış özellikler uygulanmış gibi yazılmamalıdır.
