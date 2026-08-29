import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import BarcodeScanner from "./barcode-scanner";
import { updateScannedProductPrice, updateScannedProductStatus } from "./actions";

type Props = {
  searchParams: Promise<{
    code?: string;
    priceSaved?: string;
    statusSaved?: string;
    error?: string;
  }>;
};

function money(value: number | null) {
  if (value === null) return "Fiyat belirtilmedi";
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(value);
}

export default async function AdminScanPage({ searchParams }: Props) {
  const { code, priceSaved, statusSaved, error } = await searchParams;
  const rawCode = code?.trim() ?? "";
  const normalized = rawCode.toUpperCase();
  let product: {
    id: string;
    product_code: string;
    barcode: string | null;
    title: string;
    brand: string | null;
    model: string | null;
    price: number | null;
    stock_status: string;
    publication_status: string;
    images: string[] | null;
  } | null = null;

  if (normalized) {
    const supabase = await createSupabaseServerClient();
    const { data: byProductCode } = await supabase
      .from("products")
      .select("id,product_code,barcode,title,brand,model,price,stock_status,publication_status,images")
      .eq("product_code", normalized)
      .maybeSingle();

    if (byProductCode) product = byProductCode;
    else {
      const { data: byBarcode } = await supabase
        .from("products")
        .select("id,product_code,barcode,title,brand,model,price,stock_status,publication_status,images")
        .eq("barcode", rawCode)
        .maybeSingle();
      if (byBarcode) product = byBarcode;
    }
  }

  const cover = Array.isArray(product?.images) ? product.images[0] : null;

  return (
    <main className="adminShell">
      <div className="adminPageHeader">
        <div><p className="eyebrow">BARKOD TARA</p><h1 className="adminPageTitle">Ürünü anında bul ve işlem yap</h1></div>
        <Link className="adminButton adminButtonSecondary" href="/admin">Panele dön</Link>
      </div>

      {priceSaved ? <p className="adminSuccess">Fiyat güncellendi.</p> : null}
      {statusSaved ? <p className="adminSuccess">Ürün durumu güncellendi.</p> : null}
      {error ? <p className="adminError">{error}</p> : null}
      {normalized && !product ? <p className="adminError">“{code}” ile eşleşen ürün bulunamadı.</p> : null}

      {product ? (
        <section className="adminDashboardCard adminScanResultCard">
          <div className="adminScanResultMain">
            {cover ? <img className="adminScanResultImage" src={cover} alt="" /> : <div className="adminScanResultImage adminScanResultPlaceholder">TROVE</div>}
            <div>
              <p className="eyebrow">BULUNAN ÜRÜN</p>
              <h2>{product.brand || product.model ? [product.brand, product.model].filter(Boolean).join(" ") : product.title}</h2>
              <p className="adminScanProductCode">{product.product_code}</p>
              <strong className="adminScanPrice">{money(product.price)}</strong>
              <div className="adminProductMeta">
                <span>{product.stock_status}</span>
                <span>{product.publication_status}</span>
                <span>Barkod: {product.barcode || product.product_code}</span>
              </div>
            </div>
          </div>

          <div className="adminScanQuickGrid">
            <form className="adminScanPriceForm" action={updateScannedProductPrice}>
              <input type="hidden" name="productId" value={product.id} />
              <input type="hidden" name="code" value={rawCode || product.product_code} />
              <label className="adminField">Yeni fiyat
                <input name="price" inputMode="decimal" defaultValue={product.price ?? ""} placeholder="0" required />
              </label>
              <button className="adminButton" type="submit">Fiyatı Güncelle</button>
            </form>

            <form className="adminScanActionButtons" action={updateScannedProductStatus}>
              <input type="hidden" name="productId" value={product.id} />
              <input type="hidden" name="code" value={rawCode || product.product_code} />
              <button className="adminButton" name="action" value="sold" type="submit">Satıldı Yap</button>
              <button className="adminButton adminButtonSecondary" name="action" value="in_stock" type="submit">Stokta Yap</button>
              <button className="adminButton adminButtonSecondary" name="action" value="publish" type="submit">Yayına Al</button>
              <button className="adminButton adminButtonSecondary" name="action" value="hide" type="submit">Yayından Kaldır</button>
            </form>

            <div className="adminScanNavigation">
              <Link className="adminButton" href={`/admin/listings/${product.id}`}>Ürünü Düzenle</Link>
              <Link className="adminButton adminButtonSecondary" href={`/admin/listings/${product.id}/label`}>Etiket Yazdır</Link>
              <Link className="adminTextLink" href="/admin/scan">Yeni barkod tara</Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="adminScannerGrid">
          <BarcodeScanner />
          <div className="adminDashboardCard">
            <p className="eyebrow">MANUEL / FİZİKSEL OKUYUCU</p>
            <h2>Ürün kodu veya barkod gir</h2>
            <p>USB/Bluetooth barkod okuyucular klavye gibi çalışır. İmleç aşağıdaki alandayken okutmanız yeterlidir.</p>
            <form className="adminForm" action="/admin/scan" method="get">
              <label className="adminField">Barkod / ürün kodu<input name="code" autoFocus autoComplete="off" inputMode="numeric" placeholder="10000000001" required /></label>
              <button className="adminButton" type="submit">Ürünü Bul</button>
            </form>
          </div>
        </section>
      )}
    </main>
  );
}
