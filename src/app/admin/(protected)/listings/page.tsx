import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { updateListingStatus } from "../actions";

export default async function AdminListingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: products } = await supabase
    .from("products")
    .select("id,product_code,title,brand,model,price,stock_status,publication_status,is_featured,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <main className="adminShell">
      <div className="adminPageHeader">
        <div><p className="eyebrow">İLAN YÖNETİMİ</p><h1 className="adminPageTitle">Tüm ilanlar</h1></div>
        <Link className="adminButton adminActionLink" href="/admin/listings/new">Yeni ilan</Link>
      </div>
      <div className="adminToolbar">
        <Link className="adminTextLink" href="/admin">← Panele dön</Link>
        <span>{products?.length ?? 0} ürün gösteriliyor</span>
      </div>
      <section className="adminTableCard">
        {products?.length ? products.map((product) => (
          <article className="adminProductRow" key={product.id}>
            <div className="adminProductMain">
              <span className="productCode">{product.product_code}</span>
              <strong>{product.title}</strong>
              <small>{[product.brand, product.model].filter(Boolean).join(" · ") || "Ürün bilgisi"}</small>
            </div>
            <div className="adminProductMeta">
              <strong>{product.price == null ? "Fiyat yok" : `${Number(product.price).toLocaleString("tr-TR")} ₺`}</strong>
              <span>{product.stock_status === "sold" ? "Satıldı" : product.stock_status === "reserved" ? "Rezerve" : product.stock_status === "out_of_stock" ? "Stok dışı" : "Stokta"}</span>
              <span>{product.publication_status === "published" ? "Yayında" : product.publication_status === "hidden" ? "Gizli" : "Taslak"}</span>
              {product.is_featured ? <span>Öne çıkan</span> : null}
            </div>
            <form className="adminInlineActions" action={updateListingStatus}>
              <input type="hidden" name="productId" value={product.id} />
              <button name="action" value={product.publication_status === "published" ? "hide" : "publish"} className="adminButton adminButtonSecondary" type="submit">{product.publication_status === "published" ? "Gizle" : "Yayınla"}</button>
              <button name="action" value={product.stock_status === "sold" ? "in_stock" : "sold"} className="adminButton adminButtonSecondary" type="submit">{product.stock_status === "sold" ? "Stokta yap" : "Satıldı"}</button>
              <button name="action" value={product.is_featured ? "unfeature" : "feature"} className="adminButton adminButtonSecondary" type="submit">{product.is_featured ? "Öne çıkarmayı kaldır" : "Öne çıkar"}</button>
            </form>
          </article>
        )) : <p className="emptyState">Henüz ürün yok.</p>}
      </section>
    </main>
  );
}
