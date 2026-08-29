import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { ScannerClient } from "./scanner-client";
import { updateScannedProduct } from "./actions";

type ScannerPageProps = {
  searchParams: Promise<{ code?: string; updated?: string; error?: string }>;
};

function formatMoney(value: number | string | null) {
  if (value == null) return "Belirtilmedi";
  return `${Number(value).toLocaleString("tr-TR")} ₺`;
}

export default async function ScannerPage({ searchParams }: ScannerPageProps) {
  const { code, updated, error } = await searchParams;
  const normalizedCode = String(code ?? "").replace(/[^0-9]/g, "");
  const supabase = await createSupabaseServerClient();

  let product = null;
  if (normalizedCode) {
    const { data } = await supabase
      .from("products")
      .select("id,product_code,barcode,title,brand,model,price,condition,storage,color,battery_health,device_region,stock_status,publication_status")
      .or(`product_code.eq.${normalizedCode},barcode.eq.${normalizedCode}`)
      .maybeSingle();
    product = data;
  }

  return (
    <main className="adminShell">
      <header className="adminTopbar">
        <div>
          <p className="eyebrow">ÜRÜN YÖNETİMİ</p>
          <h1 className="adminPageTitle">Barkod Tara</h1>
        </div>
        <Link className="adminButton adminButtonSecondary adminActionLink" href="/admin">Panele dön</Link>
      </header>

      {updated ? <p className="adminSuccess">Ürün bilgileri güncellendi.</p> : null}
      {error ? <p className="adminError">{error}</p> : null}

      <ScannerClient />

      {normalizedCode && !product ? (
        <p className="adminError" style={{ marginTop: 18 }}>Bu barkod veya ürün koduyla eşleşen ürün bulunamadı.</p>
      ) : null}

      {product ? (
        <section className="listingSection">
          <div className="sectionHeading">
            <div>
              <p className="eyebrow">BULUNAN ÜRÜN</p>
              <h2>{product.title}</h2>
            </div>
            <span className="productCode">{product.product_code}</span>
          </div>

          <div className="adminDashboardCard">
            <p><strong>Marka / model:</strong> {[product.brand, product.model].filter(Boolean).join(" ") || "Belirtilmedi"}</p>
            <p><strong>Hafıza:</strong> {product.storage || "Belirtilmedi"}</p>
            <p><strong>Renk:</strong> {product.color || "Belirtilmedi"}</p>
            <p><strong>Pil sağlığı:</strong> {product.battery_health == null ? "Belirtilmedi" : `%${product.battery_health}`}</p>
            <p><strong>Cihaz bölgesi:</strong> {product.device_region || "Belirtilmedi"}</p>
            <p><strong>Mevcut fiyat:</strong> {formatMoney(product.price)}</p>
            <p><strong>Barkod:</strong> {product.barcode || product.product_code}</p>

            <form action={updateScannedProduct} className="adminListingForm" style={{ marginTop: 20 }}>
              <input name="productCode" type="hidden" value={product.product_code} />

              <label className="adminField">
                Fiyat
                <input name="price" type="number" inputMode="decimal" min="0" step="0.01" defaultValue={product.price == null ? "" : Number(product.price)} />
              </label>

              <label className="adminField">
                Stok durumu
                <select name="stockStatus" defaultValue={product.stock_status}>
                  <option value="in_stock">Stokta</option>
                  <option value="reserved">Rezerve</option>
                  <option value="sold">Satıldı</option>
                </select>
              </label>

              <label className="adminField">
                Yayın durumu
                <select name="publicationStatus" defaultValue={product.publication_status}>
                  <option value="draft">Taslak</option>
                  <option value="published">Yayında</option>
                  <option value="hidden">Gizli</option>
                </select>
              </label>

              <div className="adminFormActions adminFieldWide" style={{ gap: 10, flexWrap: "wrap" }}>
                <button className="adminButton" type="submit">Değişiklikleri kaydet</button>
                <Link className="adminButton adminButtonSecondary" href={`/admin/labels/${product.product_code}`}>Etiketi yazdır</Link>
                <Link className="adminButton adminButtonSecondary" href={`/ilan/${product.product_code}`}>İlanı aç</Link>
              </div>
            </form>
          </div>
        </section>
      ) : null}
    </main>
  );
}
