import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

type AdminListingsPageProps = {
  searchParams: Promise<{ q?: string; status?: string }>;
};

function normalize(value: string) {
  return value.toLocaleLowerCase("tr-TR").replace(/\s+/g, " ").trim();
}

function publicationLabel(value: string) {
  if (value === "published") return "Yayında";
  if (value === "hidden") return "Gizli";
  return "Taslak";
}

function stockLabel(value: string) {
  if (value === "sold") return "Satıldı";
  if (value === "reserved") return "Rezerve";
  if (value === "out_of_stock") return "Stok dışı";
  return "Stokta";
}

export default async function AdminListingsPage({ searchParams }: AdminListingsPageProps) {
  const { q, status } = await searchParams;
  const search = normalize(q ?? "");
  const selectedStatus = ["draft", "published", "hidden", "sold", "in_stock"].includes(status ?? "") ? status : "";
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("products")
    .select("id,product_code,title,brand,model,price,barcode,stock_status,publication_status,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(500);

  const products = (data ?? []).filter((product) => {
    const matchesSearch = !search || normalize(`${product.product_code} ${product.barcode ?? ""} ${product.title} ${product.brand ?? ""} ${product.model ?? ""}`).includes(search);
    const matchesStatus = !selectedStatus
      || (selectedStatus === "sold" ? product.stock_status === "sold" : selectedStatus === "in_stock" ? product.stock_status === "in_stock" : product.publication_status === selectedStatus);
    return matchesSearch && matchesStatus;
  });

  return (
    <main className="adminShell">
      <header className="adminTopbar">
        <div>
          <p className="eyebrow">İLAN YÖNETİMİ</p>
          <h1 className="adminPageTitle">Tüm ilanlar</h1>
        </div>
        <Link className="adminButton adminButtonSecondary adminActionLink" href="/admin">Panele dön</Link>
      </header>

      <section className="adminDashboardCard">
        <form method="get" className="adminListingForm">
          <label className="adminField">
            Ara
            <input name="q" type="search" defaultValue={q ?? ""} placeholder="Ürün kodu, başlık, marka veya model" />
          </label>
          <label className="adminField">
            Durum
            <select name="status" defaultValue={selectedStatus ?? ""}>
              <option value="">Tümü</option>
              <option value="draft">Taslak</option>
              <option value="published">Yayında</option>
              <option value="hidden">Gizli</option>
              <option value="in_stock">Stokta</option>
              <option value="sold">Satıldı</option>
            </select>
          </label>
          <div className="adminFormActions adminFieldWide" style={{ gap: 10, flexWrap: "wrap" }}>
            <button className="adminButton" type="submit">Filtrele</button>
            <Link className="adminButton adminButtonSecondary" href="/admin/listings">Temizle</Link>
            <Link className="adminButton adminButtonSecondary" href="/admin/listings/new">Yeni ilan</Link>
          </div>
        </form>
      </section>

      <section className="listingSection">
        <div className="sectionHeading">
          <div>
            <p className="eyebrow">KAYITLAR</p>
            <h2>{products.length} ilan</h2>
          </div>
          <p>Ürünü düzenlemek, stok veya yayın durumunu değiştirmek için ürün yönetimine gir.</p>
        </div>

        {products.length ? (
          <div className="adminDraftList">
            {products.map((product) => (
              <article className="adminDraftItem" key={product.id}>
                <div>
                  <span className="productCode">{product.product_code}</span>
                  <h3>{product.title}</h3>
                  <p>{[product.brand, product.model].filter(Boolean).join(" ") || "Marka/model belirtilmedi"}</p>
                  <p>
                    {product.price == null ? "Fiyat belirtilmedi" : `${Number(product.price).toLocaleString("tr-TR")} ₺`}
                    {` · ${stockLabel(product.stock_status)} · ${publicationLabel(product.publication_status)}`}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Link className="adminButton" href={`/admin/scanner?code=${product.product_code}`}>Yönet</Link>
                  <Link className="adminButton adminButtonSecondary" href={`/admin/labels/${product.product_code}`}>Etiket</Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="emptyState">Filtreye uygun ilan bulunamadı.</p>
        )}
      </section>
    </main>
  );
}
