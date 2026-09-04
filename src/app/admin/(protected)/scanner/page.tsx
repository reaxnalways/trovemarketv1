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
            <p><strong>Mevcut fiyat:</strong> {formatMoney(product.price)}</p>
            <p><strong>Barkod:</strong> {product.barcode || product.product_code}</p>
            <p className="adminLead">Fiyat değişikliği yalnızca <Link href="/admin/pricing">Fiyat Yönetimi</Link> ekranından yapılır.</p>

            <form action={updateScannedProduct} className="adminListingForm" style={{ marginTop: 20 }}>
              <input name="productCode" type="hidden" value={product.product_code} />

              <label className="adminField adminFieldWide">Başlık<input name="title" type="text" minLength={3} defaultValue={product.title} required /></label>
              <label className="adminField">Marka<input name="brand" type="text" defaultValue={product.brand ?? ""} /></label>
              <label className="adminField">Model<input name="model" type="text" defaultValue={product.model ?? ""} /></label>
              <label className="adminField">Hafıza<input name="storage" type="text" defaultValue={product.storage ?? ""} /></label>
              <label className="adminField">Renk<input name="color" type="text" defaultValue={product.color ?? ""} /></label>
              <label className="adminField">Pil sağlığı (%)<input name="batteryHealth" type="number" inputMode="numeric" min="0" max="100" step="1" defaultValue={product.battery_health ?? ""} /></label>
              <label className="adminField">Ürün durumu<select name="condition" defaultValue={product.condition ?? ""}><option value="">Belirtilmedi</option><option value="new">Sıfır</option><option value="used">İkinci el</option><option value="refurbished">Yenilenmiş</option></select></label>
              <label className="adminField">Cihaz bölgesi<select name="deviceRegion" defaultValue={product.device_region ?? ""}><option value="">Belirtilmedi</option><option value="tr">TR cihaz</option><option value="passport">Pasaport kayıtlı</option><option value="international">Yurt dışı</option></select></label>
              <label className="adminField">Stok durumu<select name="stockStatus" defaultValue={product.stock_status}><option value="in_stock">Stokta</option><option value="reserved">Rezerve</option><option value="sold">Satıldı</option><option value="out_of_stock">Stok dışı</option></select></label>
              <label className="adminField">Yayın durumu<select name="publicationStatus" defaultValue={product.publication_status}><option value="draft">Taslak</option><option value="published">Yayında</option><option value="hidden">Gizli</option></select></label>

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
