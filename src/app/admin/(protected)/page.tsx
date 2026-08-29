import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { publishListing } from "./actions";

type AdminHomePageProps = { searchParams: Promise<{ created?: string; published?: string; error?: string }> };

export default async function AdminHomePage({ searchParams }: AdminHomePageProps) {
  const { created, published, error } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const [draftResult, totalResult, publishedResult, soldResult, featuredResult, activeServiceResult, complaintResult] = await Promise.all([
    supabase.from("products").select("id,product_code,title,price,stock_status,publication_status,is_featured,created_at").eq("publication_status", "draft").order("created_at", { ascending: false }).limit(8),
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("publication_status", "published"),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("stock_status", "sold"),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("is_featured", true),
    supabase.from("technical_service_records").select("id", { count: "exact", head: true }).is("archived_at", null),
    supabase.from("technical_service_records").select("id", { count: "exact", head: true }).is("archived_at", null).not("complaint", "is", null),
  ]);
  const drafts = draftResult.data ?? [];
  const draftCountResult = await supabase.from("products").select("id", { count: "exact", head: true }).eq("publication_status", "draft");

  return <main className="adminShell adminShellWide">
    <header className="adminTopbar"><div><p className="eyebrow">TROVE YÖNETİM</p><strong>Operasyon paneli</strong></div></header>
    {created ? <p className="adminSuccess">Taslak ilan oluşturuldu: <strong>{created}</strong></p> : null}
    {published ? <p className="adminSuccess">İlan yayınlandı ve müşteri sitesinde görünür hale geldi.</p> : null}
    {error ? <p className="adminError">{error}</p> : null}

    <section className="adminDashboardCard adminHeroCard"><div><p className="eyebrow">MAĞAZA KONTROL MERKEZİ</p><h1>Günlük işlemler tek ekranda.</h1><p>Yeni ilan, barkod tarama, teknik servis, şikayet ve stok işlemlerini hızlıca yönetin.</p></div></section>

    <section className="adminStatsGrid">
      <div><span>Toplam ürün</span><strong>{totalResult.count ?? 0}</strong></div>
      <div><span>Yayında</span><strong>{publishedResult.count ?? 0}</strong></div>
      <div><span>Taslak</span><strong>{draftCountResult.count ?? 0}</strong></div>
      <div><span>Satıldı</span><strong>{soldResult.count ?? 0}</strong></div>
      <div><span>Öne çıkan</span><strong>{featuredResult.count ?? 0}</strong></div>
      <div><span>Aktif servis</span><strong>{activeServiceResult.count ?? 0}</strong></div>
      <div><span>Şikayet kaydı</span><strong>{complaintResult.count ?? 0}</strong></div>
    </section>

    <section className="adminDashboardCard">
      <div className="sectionHeading"><div><p className="eyebrow">TEKNİK SERVİS</p><h2>Servis işlemleri</h2></div></div>
      <div className="adminInlineActions">
        <Link className="adminButton" href="/admin/technical-service#yeni-kayit">Yeni servis kaydı</Link>
        <Link className="adminButton adminButtonSecondary" href="/admin/technical-service#servis-kayitlari">Servis kayıtları</Link>
        <Link className="adminButton adminButtonSecondary" href="/admin/technical-service#sikayetler">Şikayetler</Link>
        <Link className="adminButton adminButtonSecondary" href="/admin/technical-service#arsiv">Arşiv</Link>
      </div>
    </section>

    <section className="listingSection"><div className="sectionHeading"><div><p className="eyebrow">YAYIN BEKLEYENLER</p><h2>Taslak ilanlar</h2></div><Link className="adminTextLink" href="/admin/listings?publication=draft">Tüm taslaklar →</Link></div>{drafts.length ? <div className="adminDraftList">{drafts.map((draft) => <article className="adminDraftItem" key={draft.id}><div><span className="productCode">{draft.product_code}</span><h3>{draft.title}</h3><p>{draft.price == null ? "Fiyat belirtilmedi" : `${Number(draft.price).toLocaleString("tr-TR")} ₺`}</p></div><div className="adminInlineActions"><Link className="adminButton adminButtonSecondary" href={`/admin/listings/${draft.id}`}>Düzenle</Link><form action={publishListing}><input name="productId" type="hidden" value={draft.id}/><button className="adminButton" type="submit">Yayınla</button></form></div></article>)}</div> : <p className="emptyState">Yayın bekleyen taslak ilan yok.</p>}</section>
  </main>;
}
