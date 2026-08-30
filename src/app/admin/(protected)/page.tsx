import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { publishListing } from "./actions";

type AdminHomePageProps = { searchParams: Promise<{ created?: string; published?: string; error?: string }> };

export default async function AdminHomePage({ searchParams }: AdminHomePageProps) {
  const { created, published, error } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const [draftResult, totalResult, publishedResult, soldResult, featuredResult, activeServiceResult] = await Promise.all([
    supabase.from("products").select("id,product_code,title,price,created_at").eq("publication_status", "draft").order("created_at", { ascending: false }).limit(6),
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("publication_status", "published"),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("stock_status", "sold"),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("is_featured", true),
    supabase.from("technical_service_records").select("id", { count: "exact", head: true }).is("archived_at", null),
  ]);

  const drafts = draftResult.data ?? [];

  return (
    <main className="adminShell adminShellWide">
      <header className="adminTopbar">
        <div><strong>Trove Yönetim</strong></div>
        <Link className="adminTextLink adminSiteLink" href="/" target="_blank">Ana sayfayı aç →</Link>
      </header>

      {created ? <p className="adminSuccess">Taslak oluşturuldu: <strong>{created}</strong></p> : null}
      {published ? <p className="adminSuccess">Ürün yayınlandı ve ana sayfa verileri yenilendi.</p> : null}
      {error ? <p className="adminError">{error}</p> : null}

      <section className="adminDashboardCard adminHeroCard">
        <div>
          <h1>Mağaza yönetimi</h1>
          <div className="adminQuickLinks">
            <Link className="adminButton" href="/admin/listings/new">Yeni ürün</Link>
            <Link className="adminButton adminButtonSecondary" href="/admin/listings">Ürünler</Link>
            <Link className="adminButton adminButtonSecondary" href="/admin/scan">Barkod tara</Link>
            <Link className="adminButton adminButtonSecondary" href="/admin/technical-service">Teknik servis</Link>
          </div>
        </div>
      </section>

      <section className="adminStatsGrid">
        <Link href="/admin/listings"><span>Toplam ürün</span><strong>{totalResult.count ?? 0}</strong></Link>
        <Link href="/admin/listings?publication=published"><span>Yayında</span><strong>{publishedResult.count ?? 0}</strong></Link>
        <Link href="/admin/listings?stock=sold"><span>Satıldı</span><strong>{soldResult.count ?? 0}</strong></Link>
        <Link href="/admin/listings"><span>Öne çıkan</span><strong>{featuredResult.count ?? 0}</strong></Link>
        <Link href="/admin/technical-service"><span>Aktif servis</span><strong>{activeServiceResult.count ?? 0}</strong></Link>
      </section>

      <section className="adminDashboardCard adminHomeBridge">
        <div>
          <h2 style={{ margin: 0 }}>Ana sayfa</h2>
          <p className="adminLead">Yayın, stok ve öne çıkarma değişiklikleri müşteri sitesine doğrudan yansır.</p>
        </div>
        <div className="adminHomeBridgeActions">
          <Link className="adminButton adminButtonSecondary" href="/admin/listings?publication=published">Yayındaki ürünler</Link>
          <Link className="adminButton adminButtonSecondary" href="/admin/content">Kampanya</Link>
          <Link className="adminButton adminButtonSecondary" href="/admin/settings">Site ayarları</Link>
          <Link className="adminButton" href="/" target="_blank">Siteyi gör</Link>
        </div>
      </section>

      <section className="listingSection">
        <div className="sectionHeading">
          <div><h2>Taslak ürünler</h2></div>
          <Link className="adminTextLink" href="/admin/listings?publication=draft">Tümünü gör →</Link>
        </div>
        {drafts.length ? (
          <div className="adminDraftList">
            {drafts.map((draft) => (
              <article className="adminDraftItem" key={draft.id}>
                <div>
                  <span className="productCode">{draft.product_code}</span>
                  <h3>{draft.title}</h3>
                  <p>{draft.price == null ? "Fiyat yok" : `${Number(draft.price).toLocaleString("tr-TR")} ₺`}</p>
                </div>
                <div className="adminInlineActions">
                  <Link className="adminButton adminButtonSecondary" href={`/admin/listings/${draft.id}`}>Düzenle</Link>
                  <form action={publishListing}>
                    <input name="productId" type="hidden" value={draft.id} />
                    <button className="adminButton" type="submit">Yayınla</button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        ) : <p className="emptyState">Taslak ürün yok.</p>}
      </section>
    </main>
  );
}
