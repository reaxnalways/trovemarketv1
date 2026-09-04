import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { updateListingStatus } from "../actions";

type Props = { searchParams: Promise<{ q?: string; publication?: string; stock?: string; error?: string; deleted?: string }> };

export default async function AdminListingsPage({ searchParams }: Props) {
  const { q, publication, stock, error, deleted } = await searchParams;
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("products").select("id,product_code,title,brand,model,price,stock_status,publication_status,is_featured,created_at", { count: "exact" });
  const search = q?.trim();
  if (search) {
    const safe = search.replace(/[%_,()]/g, " ").trim();
    if (safe) query = query.or(`product_code.ilike.%${safe}%,title.ilike.%${safe}%,brand.ilike.%${safe}%,model.ilike.%${safe}%`);
  }
  if (["draft", "published", "hidden"].includes(publication ?? "")) query = query.eq("publication_status", publication!);
  if (["in_stock", "reserved", "sold", "out_of_stock"].includes(stock ?? "")) query = query.eq("stock_status", stock!);
  const { data: products, count } = await query.order("created_at", { ascending: false }).limit(100);

  return (
    <main className="adminShell adminShellWide">
      <div className="adminPageHeader">
        <div><h1 className="adminPageTitle">Ürünler</h1></div>
        <div className="adminTopbarActions">
          <Link prefetch={false} className="adminButton adminButtonSecondary" href="/" target="_blank">Ana sayfa</Link>
          <Link prefetch={false} className="adminButton adminButtonSecondary" href="/admin/scan">Barkod tara</Link>
          <Link prefetch={false} className="adminButton adminActionLink" href="/admin/listings/new">Yeni ürün</Link>
        </div>
      </div>

      {deleted ? <p className="adminSuccess">Ürün silindi ve müşteri sitesi yenilendi.</p> : null}
      {error ? <p className="adminError">{error}</p> : null}

      <form className="adminDashboardCard adminListingFilters" action="/admin/listings" method="get">
        <label className="adminField">Ara<input name="q" defaultValue={search ?? ""} placeholder="Kod, ürün, marka veya model" /></label>
        <label className="adminField">Yayın<select name="publication" defaultValue={publication ?? ""}><option value="">Tümü</option><option value="published">Yayında</option><option value="draft">Taslak</option><option value="hidden">Gizli</option></select></label>
        <label className="adminField">Stok<select name="stock" defaultValue={stock ?? ""}><option value="">Tümü</option><option value="in_stock">Stokta</option><option value="reserved">Rezerve</option><option value="sold">Satıldı</option><option value="out_of_stock">Stok dışı</option></select></label>
        <button className="adminButton" type="submit">Uygula</button>
        <Link prefetch={false} className="adminButton adminButtonSecondary" href="/admin/listings">Temizle</Link>
      </form>

      <div className="adminToolbar"><span>{count ?? products?.length ?? 0} ürün</span></div>
      <section className="adminTableCard">
        {products?.length ? products.map((product) => (
          <article className="adminProductRow" key={product.id}>
            <div className="adminProductMain">
              <span className="productCode">{product.product_code}</span>
              <Link prefetch={false} className="adminProductTitleLink" href={`/admin/listings/${product.id}`}>{product.title}</Link>
              <small>{[product.brand, product.model].filter(Boolean).join(" · ") || "Ürün bilgisi"}</small>
            </div>
            <div className="adminProductMeta">
              <strong>{product.price == null ? "Fiyat yok" : `${Number(product.price).toLocaleString("tr-TR")} ₺`}</strong>
              <span>{product.stock_status === "sold" ? "Satıldı" : product.stock_status === "reserved" ? "Rezerve" : product.stock_status === "out_of_stock" ? "Stok dışı" : "Stokta"}</span>
              <span>{product.publication_status === "published" ? "Yayında" : product.publication_status === "hidden" ? "Gizli" : "Taslak"}</span>
              {product.is_featured ? <span>Öne çıkan</span> : null}
            </div>
            <div className="adminInlineActions">
              <Link prefetch={false} className="adminButton adminButtonSecondary" href={`/admin/listings/${product.id}`}>Düzenle</Link>
              {product.publication_status === "published" ? <Link prefetch={false} className="adminButton adminButtonSecondary" href={`/ilan/${product.product_code}`} target="_blank">Sitede gör</Link> : null}
              <form action={updateListingStatus} className="adminInlineActions">
                <input type="hidden" name="productId" value={product.id} />
                <button name="action" value={product.publication_status === "published" ? "hide" : "publish"} className="adminButton adminButtonSecondary" type="submit">{product.publication_status === "published" ? "Gizle" : "Yayınla"}</button>
                <button name="action" value={product.stock_status === "sold" ? "in_stock" : "sold"} className="adminButton adminButtonSecondary" type="submit">{product.stock_status === "sold" ? "Stokta" : "Satıldı"}</button>
                <button name="action" value={product.is_featured ? "unfeature" : "feature"} className="adminButton adminButtonSecondary" type="submit">{product.is_featured ? "Öne çıkarmayı kaldır" : "Öne çıkar"}</button>
              </form>
            </div>
          </article>
        )) : <p className="emptyState">Ürün bulunamadı.</p>}
      </section>
    </main>
  );
}
