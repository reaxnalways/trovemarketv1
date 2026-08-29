import Link from "next/link";
import { notFound } from "next/navigation";
import { Code39Barcode } from "@/components/code39-barcode";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { PrintLabelButton } from "./print-label-button";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ size?: string }>;
};

const labelSizes = {
  "60x40": { label: "60 × 40 mm", className: "productLabel60x40" },
  "50x30": { label: "50 × 30 mm", className: "productLabel50x30" },
} as const;

type LabelSize = keyof typeof labelSizes;

function conditionLabel(value: string | null) {
  if (value === "new") return "Sıfır";
  if (value === "used") return "İkinci el";
  if (value === "refurbished") return "Yenilenmiş";
  return null;
}

export default async function ProductLabelPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { size } = await searchParams;
  const selectedSize: LabelSize = size === "50x30" ? "50x30" : "60x40";
  const supabase = await createSupabaseServerClient();

  const [{ data: product }, { data: settings }] = await Promise.all([
    supabase
      .from("products")
      .select("id,product_code,barcode,title,brand,model,price,condition,storage,color,battery_health,stock_status")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("site_settings")
      .select("site_name,logo_url")
      .eq("id", true)
      .maybeSingle(),
  ]);

  if (!product) notFound();

  const barcode = product.barcode || product.product_code;
  const productName = [product.brand, product.model].filter(Boolean).join(" ") || product.title;
  const attributes = [
    product.storage,
    product.color,
    product.battery_health == null ? null : `Pil %${product.battery_health}`,
    conditionLabel(product.condition),
  ].filter(Boolean);

  return (
    <main className="adminShell adminLabelPage">
      <header className="adminPageHeader adminPrintOnlyHidden">
        <div>
          <p className="eyebrow">ÜRÜN ETİKETİ</p>
          <h1 className="adminPageTitle">{product.product_code}</h1>
        </div>
        <div className="adminInlineActions">
          <Link className="adminButton adminButtonSecondary" href={`/admin/listings/${product.id}`}>Ürüne dön</Link>
          <PrintLabelButton />
        </div>
      </header>

      <section className="adminDashboardCard adminLabelControls adminPrintOnlyHidden">
        <strong>Etiket ölçüsü</strong>
        <div className="adminInlineActions">
          {(Object.keys(labelSizes) as LabelSize[]).map((key) => (
            <Link
              className={`adminButton ${selectedSize === key ? "" : "adminButtonSecondary"}`}
              href={`/admin/listings/${product.id}/label?size=${key}`}
              key={key}
            >
              {labelSizes[key].label}
            </Link>
          ))}
        </div>
        <p>Yazdırma ekranında ölçeği %100 kullan. Barkod değeri doğrudan ürünün veritabanındaki barkod alanından gelir.</p>
      </section>

      <div className="adminLabelPreview">
        <article className={`productLabel ${labelSizes[selectedSize].className}`}>
          <div className="productLabelBrand">
            {settings?.logo_url ? <img src={settings.logo_url} alt="" /> : <span className="productLabelLogoFallback">T</span>}
            <div>
              <strong>{settings?.site_name || "Trove Teknoloji"}</strong>
              <small>Ürün Etiketi</small>
            </div>
          </div>

          <div className="productLabelProduct">
            <strong>{productName}</strong>
            {attributes.length ? <span>{attributes.join(" • ")}</span> : null}
          </div>

          <Code39Barcode value={barcode} height={58} narrow={1.8} />

          <div className="productLabelFooter">
            <strong>{product.product_code}</strong>
            {product.price == null ? <span>Fiyat belirtilmedi</span> : <span>{Number(product.price).toLocaleString("tr-TR")} ₺</span>}
          </div>
        </article>
      </div>
    </main>
  );
}
