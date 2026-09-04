import Link from "next/link";
import "./guide.css";

const sections = [
  ["Genel Bakış", ["Günlük işlemlere Genel Bakış ekranından başla.", "Taslak ürünleri, aktif servisleri ve stok durumlarını buradan takip et."]],
  ["Yeni Ürün", ["Ürün Yönetimi → Yeni ürün ekle bölümünü aç.", "Sahibinden ilanı varsa Sahibinden'den getir, yoksa Manuel ilan oluştur seçeneğini kullan.", "Görselleri yükle; ilk sıradaki görsel kapak olur.", "Kategori seç. Teknik Servis ürün kategorisi değildir ve bu listede gösterilmez.", "Kategori seçilince marka kataloğu ve o ürüne ait alanlar otomatik açılır.", "Telefon için kayıt türü/pil/hafıza; laptop için donanım; oyun konsolu için konsol özellikleri; giyilebilir teknoloji için kendi cihaz özelliklerini doldur.", "İlk fiyat yalnızca ürün oluştururken girilebilir. Daha sonraki fiyat değişikliklerini Fiyat Yönetimi'nden yap.", "Taslak kaydet veya yayınla. Ürün kodu ve barkod otomatik oluşur."]],
  ["Ürünler", ["Arama ve filtrelerle ürünü bul.", "Ürün detayından görselleri, ürün bilgilerini, stok/yayın durumunu ve öne çıkan durumunu yönet.", "Fiyat alanı ürün düzenleme ekranında bulunmaz; Fiyat Yönetimi'ni kullan.", "Satılan ürünü Satıldı yap; gerekirse tekrar Stokta yap."]],
  ["Fiyat Yönetimi", ["Ürün satış fiyatlarının tek yönetim noktası Fiyat Yönetimi'dir.", "Ürün Fiyatları bölümünden tek ürün fiyatını değiştir.", "Takas Fiyatları bölümünden takas referanslarını yönet.", "Fiyat Motoru bölümünden servis/takas katsayıları ve istisnaları yönet.", "Toplu İşlemler bölümünde kapsamı ve oranı kontrol et, önizle, sonra uygula. Gerekirse geçmişten geri al."]],
  ["Barkod ve Etiket", ["Barkod Tara ekranında kamera veya fiziksel barkod okuyucu kullan.", "Okutulan barkod ilgili ürünü doğrudan açar.", "Ürün ekranından etiketi açıp yazdır; ürün kodunu kontrol et."]],
  ["Teknik Servis", ["Teknik Servis menüsünden yeni servis kaydı oluştur; ürün ekleme ekranını kullanma.", "Müşteri, telefon, cihaz, şikayet, arıza ve durum bilgilerini gir.", "Servis barkodunu cihazla eşleştir.", "İş ilerledikçe durumunu güncelle; tamamlanan kayıtları silmek yerine arşivle."]],
  ["Kategori Yönetimi", ["Kategori Yönetimi'nden müşteri sitesindeki ürün kategorilerini yönet.", "Kategori kapatıldığında yeni ürün seçimlerinde ve müşteri tarafında kullanımını kontrol et.", "Teknik Servis ayrı bir operasyon modülüdür; ürün ilan kategorisi olarak kullanılmaz."]],
  ["Site İçeriği", ["Slider ve içerik bölümünden ana sayfa kampanya/slider içeriklerini yönet.", "Şirket & iletişim bölümünden telefon, WhatsApp, e-posta, Instagram ve adres bilgilerini güncelle.", "Logo & site kimliği bölümünden marka görselleri ve site kimliğini yönet."]],
  ["Kontrol", ["Değişikliklerden sonra Müşteri sitesini aç bağlantısıyla sonucu kontrol et.", "Özellikle mobil görünümde kategori, ürün detayı, WhatsApp, takas ve teknik servis akışlarını kontrol et."]],
  ["Günlük Akış", ["Yeni ürün: görsel → kategori → ürün bilgileri → ilk fiyat → yayın → etiket.", "Fiyat değişikliği: Fiyat Yönetimi → ürünü/referansı bul → değiştir.", "Servis: yeni servis kaydı → barkod → durum takibi → arşiv.", "Mağaza işlemi: barkodu tara → ürünü aç → stok/yayın işlemini yap."]],
] as const;

export default function AdminGuidePage() {
  return <main className="adminShell adminShellWide adminGuidePage">
    <header className="adminDashboardHeader"><div><span className="adminDashboardEyebrow">KULLANIM REHBERİ</span><h1>Admin Paneli Kullanımı</h1></div><Link className="adminButton adminButtonSecondary" href="/admin">Genel Bakış</Link></header>
    <div className="adminGuideGrid">{sections.map(([title, items]) => <section className="adminGuideCard" key={title}><h2>{title}</h2><ol>{items.map(item => <li key={item}>{item}</li>)}</ol></section>)}</div>
  </main>;
}
