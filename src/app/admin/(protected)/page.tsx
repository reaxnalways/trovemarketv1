import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { logoutAdmin, publishListing } from "./actions";

type AdminHomePageProps = { searchParams: Promise<{ created?: string; published?: string; error?: string }> };

export default async function AdminHomePage({ searchParams }: AdminHomePageProps) {
  const { created, published, error } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: products } = await supabase.from("products").select("id,product_code,title,price,stock_status,publication_status,is_featured,created_at").order("created_at", { ascending: false }).limit(100);
  const drafts = products?.filter((item) => item.publication_status === "draft").slice(0, 8) ?? [];
  const publishedCount = products?.filter((item) => item.publication_status === "published").length ?? 0;
  const soldCount = products?.filter((item) => item.stock_status === "sold").length ?? 0;
  const featuredCount = products?.filter((item) => item.is_featured).length ?? 0;

  const modules = [
    ["İlanlar", "Yayın, stok, satıldı ve öne çıkan durumlarını yönet.", "/admin/listings", "Yönet"],
    ["Yeni ilan", "Görsel → Sahibinden linki → kontrol → yayın akışını başlat.", "/admin/listings/new", "İlan oluştur"],
    ["Barkod tara", "Telefon, tablet, bilgisayar kamerası veya fiziksel okuyucu ile ürünü aç.", "/admin/scan", "Taramayı aç"],
    ["Kategoriler", "Kategori sırası, görünürlük ve ürün kodu gruplarını yönet.", "#", "Yakında"],
    ["Teknik servis", "Servis türleri ve WhatsApp yönlendirme içeriklerini yönet.", "#", "Yakında"],
    ["Banner & kampanya", "Ana sayfa kampanya alanlarını yönetmek için ayrılmış modül.", "#", "Yakında"],
    ["Etiket yazdır", "Ürün kodu ve barkoda bağlı mağaza etiketi modülü.", "#", "Yakında"],
    ["Site ayarları", "Logo, marka, iletişim ve WhatsApp bilgilerini düzenle.", "/admin/settings", "Ayarları aç"],
  ];

  return <main className="adminShell adminShellWide">
    <header className="adminTopbar">
      <div><p className="eyebrow">TROVE YÖNETİM</p><strong>Operasyon paneli</strong></div>
      <div className="adminTopbarActions"><Link className="adminButton adminButtonSecondary" href="/" target="_blank">Siteyi aç</Link><form action={logoutAdmin}><button className="adminButton adminButtonSecondary" type="submit">Çıkış</button></form></div>
    </header>
    {created ? <p className="adminSuccess">Taslak ilan oluşturuldu: <strong>{created}</strong></p> : null}
    {published ? <p className="adminSuccess">İlan yayınlandı ve müşteri sitesinde görünür hale geldi.</p> : null}
    {error ? <p className="adminError">{error}</p> : null}

    <section className="adminDashboardCard adminHeroCard">
      <div><p className="eyebrow">MAĞAZA KONTROL MERKEZİ</p><h1>Günlük işlemler tek ekranda.</h1><p>İlan oluşturma, düzenleme, yayın, stok, barkodla ürün bulma ve marka ayarları teknik bilgi gerektirmeden yönetilebilir. Diğer MVP modülleri bu yapıya bağımsız olarak ekleniyor.</p></div>
      <div className="adminDashboardActions adminDashboardActionRow"><Link className="adminButton adminActionLink" href="/admin/listings/new">+ Yeni ilan oluştur</Link><Link className="adminButton adminButtonSecondary adminActionLink" href="/admin/scan">Barkod tara</Link><Link className="adminButton adminButtonSecondary adminActionLink" href="/admin/listings">İlanları yönet</Link></div>
    </section>

    <section className="adminStatsGrid">
      <div><span>Toplam ürün</span><strong>{products?.length ?? 0}</strong></div><div><span>Yayında</span><strong>{publishedCount}</strong></div><div><span>Taslak</span><strong>{drafts.length}</strong></div><div><span>Satıldı</span><strong>{soldCount}</strong></div><div><span>Öne çıkan</span><strong>{featuredCount}</strong></div>
    </section>

    <section className="listingSection"><div className="sectionHeading"><div><p className="eyebrow">YÖNETİM MODÜLLERİ</p><h2>Hızlı işlemler</h2></div><p>MVP için aktif ekranlar kullanılabilir; sonraki modüller mevcut yapıyı bozmadan eklenebilir.</p></div><div className="adminModuleGrid">{modules.map(([title, description, href, action]) => <article className="adminModuleCard" key={title}><div><h3>{title}</h3><p>{description}</p></div>{href === "#" ? <span className="adminModuleSoon">{action}</span> : <Link className="adminTextLink" href={href}>{action} →</Link>}</article>)}</div></section>

    <section className="listingSection"><div className="sectionHeading"><div><p className="eyebrow">YAYIN BEKLEYENLER</p><h2>Taslak ilanlar</h2></div><Link className="adminTextLink" href="/admin/listings">Tüm ilanlar →</Link></div>{drafts.length ? <div className="adminDraftList">{drafts.map((draft) => <article className="adminDraftItem" key={draft.id}><div><span className="productCode">{draft.product_code}</span><h3>{draft.title}</h3><p>{draft.price == null ? "Fiyat belirtilmedi" : `${Number(draft.price).toLocaleString("tr-TR")} ₺`}</p></div><div className="adminInlineActions"><Link className="adminButton adminButtonSecondary" href={`/admin/listings/${draft.id}`}>Düzenle</Link><form action={publishListing}><input name="productId" type="hidden" value={draft.id}/><button className="adminButton" type="submit">Yayınla</button></form></div></article>)}</div> : <p className="emptyState">Yayın bekleyen taslak ilan yok.</p>}</section>
  </main>;
}
