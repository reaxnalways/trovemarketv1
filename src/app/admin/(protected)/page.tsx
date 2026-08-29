import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { publishListing } from "./actions";

type AdminHomePageProps = { searchParams: Promise<{ created?: string; published?: string; error?: string }> };

export default async function AdminHomePage({ searchParams }: AdminHomePageProps) {
  const { created, published, error } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: products } = await supabase.from("products").select("id,product_code,title,price,stock_status,publication_status,is_featured,created_at").order("created_at", { ascending: false }).limit(100);
  const draftProducts = products?.filter((item) => item.publication_status === "draft") ?? [];
  const drafts = draftProducts.slice(0, 8);
  const publishedCount = products?.filter((item) => item.publication_status === "published").length ?? 0;
  const soldCount = products?.filter((item) => item.stock_status === "sold").length ?? 0;
  const featuredCount = products?.filter((item) => item.is_featured).length ?? 0;

  return <main className="adminShell adminShellWide">
    <header className="adminTopbar">
      <div><p className="eyebrow">TROVE YÖNETİM</p><strong>Operasyon paneli</strong></div>
    </header>
    {created ? <p className="adminSuccess">Taslak ilan oluşturuldu: <strong>{created}</strong></p> : null}
    {published ? <p className="adminSuccess">İlan yayınlandı ve müşteri sitesinde görünür hale geldi.</p> : null}
    {error ? <p className="adminError">{error}</p> : null}

    <section className="adminDashboardCard adminHeroCard">
      <div><p className="eyebrow">MAĞAZA KONTROL MERKEZİ</p><h1>Günlük işlemler tek ekranda.</h1><p>Yönetim modülleri artık soldaki panelde gruplu ve açılır menüler halinde bulunuyor. İçerik alanı günlük operasyonlara odaklanıyor.</p></div>
    </section>

    <section className="adminStatsGrid">
      <div><span>Toplam ürün</span><strong>{products?.length ?? 0}</strong></div><div><span>Yayında</span><strong>{publishedCount}</strong></div><div><span>Taslak</span><strong>{draftProducts.length}</strong></div><div><span>Satıldı</span><strong>{soldCount}</strong></div><div><span>Öne çıkan</span><strong>{featuredCount}</strong></div>
    </section>

    <section className="listingSection"><div className="sectionHeading"><div><p className="eyebrow">YAYIN BEKLEYENLER</p><h2>Taslak ilanlar</h2></div><Link className="adminTextLink" href="/admin/listings">Tüm ilanlar →</Link></div>{drafts.length ? <div className="adminDraftList">{drafts.map((draft) => <article className="adminDraftItem" key={draft.id}><div><span className="productCode">{draft.product_code}</span><h3>{draft.title}</h3><p>{draft.price == null ? "Fiyat belirtilmedi" : `${Number(draft.price).toLocaleString("tr-TR")} ₺`}</p></div><div className="adminInlineActions"><Link className="adminButton adminButtonSecondary" href={`/admin/listings/${draft.id}`}>Düzenle</Link><form action={publishListing}><input name="productId" type="hidden" value={draft.id}/><button className="adminButton" type="submit">Yayınla</button></form></div></article>)}</div> : <p className="emptyState">Yayın bekleyen taslak ilan yok.</p>}</section>
  </main>;
}
