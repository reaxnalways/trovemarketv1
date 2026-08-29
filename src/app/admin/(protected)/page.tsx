import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { logoutAdmin, publishListing } from "./actions";

type AdminHomePageProps = {
  searchParams: Promise<{ created?: string; published?: string; error?: string }>;
};

export default async function AdminHomePage({ searchParams }: AdminHomePageProps) {
  const { created, published, error } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: drafts } = await supabase
    .from("products")
    .select("id,product_code,title,price,created_at")
    .eq("publication_status", "draft")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <main className="adminShell">
      <header className="adminTopbar">
        <p className="eyebrow">TROVE YÖNETİM</p>
        <form action={logoutAdmin}>
          <button className="adminButton adminButtonSecondary" type="submit">Çıkış</button>
        </form>
      </header>

      {created ? <p className="adminSuccess">Taslak ilan oluşturuldu: <strong>{created}</strong></p> : null}
      {published ? <p className="adminSuccess">İlan yayınlandı ve ana sayfada görünür hale geldi.</p> : null}
      {error ? <p className="adminError">{error}</p> : null}

      <section className="adminDashboardCard">
        <h1>Yönetim paneli</h1>
        <p>Yeni ilan oluştur, barkodla ürün bul, teknik servis kayıtlarını yönet ve site ayarlarını tek panelden kontrol et.</p>
        <div className="adminDashboardActions adminDashboardActionRow">
          <Link className="adminButton adminActionLink" href="/admin/listings/new">Yeni ilan oluştur</Link>
          <Link className="adminButton adminButtonSecondary adminActionLink" href="/admin/scanner">Barkod Tara</Link>
          <Link className="adminButton adminButtonSecondary adminActionLink" href="/admin/technical-service">Teknik servis kaydı</Link>
          <Link className="adminButton adminButtonSecondary adminActionLink" href="/admin/settings">Site ayarları</Link>
        </div>
      </section>

      <section className="listingSection">
        <div className="sectionHeading">
          <div>
            <p className="eyebrow">YAYIN BEKLEYENLER</p>
            <h2>Taslak ilanlar</h2>
          </div>
        </div>

        {drafts?.length ? (
          <div className="adminDraftList">
            {drafts.map((draft) => (
              <article className="adminDraftItem" key={draft.id}>
                <div>
                  <span className="productCode">{draft.product_code}</span>
                  <h3>{draft.title}</h3>
                  <p>{draft.price == null ? "Fiyat belirtilmedi" : `${Number(draft.price).toLocaleString("tr-TR")} ₺`}</p>
                </div>
                <form action={publishListing}>
                  <input name="productId" type="hidden" value={draft.id} />
                  <button className="adminButton" type="submit">Yayınla</button>
                </form>
              </article>
            ))}
          </div>
        ) : (
          <p className="emptyState">Yayın bekleyen taslak ilan yok.</p>
        )}
      </section>
    </main>
  );
}
