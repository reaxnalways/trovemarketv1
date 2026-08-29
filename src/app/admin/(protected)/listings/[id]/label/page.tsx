import Link from "next/link";
import { notFound } from "next/navigation";
import { Code128Barcode } from "@/components/code128-barcode";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { PrintLabelButton } from "./print-label-button";

type Props = {
  params: Promise<{ id: string }>;
};

function colorSwatchClass(color: string | null) {
  const normalized = color?.trim().toLocaleLowerCase("tr-TR") ?? "";
  if (normalized.includes("mavi") || normalized.includes("blue")) return "labelColorBlue";
  if (normalized.includes("kırmızı") || normalized.includes("red")) return "labelColorRed";
  if (normalized.includes("yeşil") || normalized.includes("green")) return "labelColorGreen";
  if (normalized.includes("beyaz") || normalized.includes("white")) return "labelColorWhite";
  if (normalized.includes("gri") || normalized.includes("gray") || normalized.includes("grey")) return "labelColorGray";
  return "labelColorBlack";
}

export default async function ProductLabelPage({ params }: Props) {
  const { id } = await params;
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

  const barcodeValue = product.product_code;
  const productName = [product.brand, product.model].filter(Boolean).join(" ") || product.title;
  const storage = product.storage || "—";
  const battery = product.battery_health == null ? "—" : `%${product.battery_health}`;
  const color = product.color || "—";

  return (
    <main className="adminShell adminLabelPage">
      <header className="adminPageHeader adminPrintOnlyHidden">
        <div>
          <p className="eyebrow">ZJIONG ZJ-9210</p>
          <h1 className="adminPageTitle">60 × 40 mm Ürün Etiketi</h1>
        </div>
        <div className="adminInlineActions">
          <Link className="adminButton adminButtonSecondary" href={`/admin/listings/${product.id}`}>Ürüne dön</Link>
          <PrintLabelButton />
        </div>
      </header>

      <section className="adminDashboardCard adminLabelControls adminPrintOnlyHidden">
        <strong>Yazıcı ayarı</strong>
        <p>ZJIONG ZJ-9210 için kağıt boyutunu 60 × 40 mm, ölçeği %100 ve kenar boşluklarını yok olarak seç. Barkod Code 128 formatında ve veritabanındaki 11 haneli ürün kodundan üretilir.</p>
      </section>

      <div className="adminLabelPreview">
        <article className="troveThermalLabel">
          <div className="troveLabelTitle">{productName}</div>
          <div className="troveLabelDivider"><span /></div>

          <div className="troveLabelSpecs">
            <div className="troveLabelSpec">
              <strong>{storage}</strong>
              <span>DEPOLAMA</span>
            </div>

            <div className="troveLabelSpec troveBatterySpec">
              <div className="troveBatteryIcon" aria-hidden="true"><i /><i /><i /><i /></div>
              <div>
                <strong>{battery}</strong>
                <span>PİL</span>
              </div>
            </div>

            <div className="troveLabelSpec troveColorSpec">
              <span className={`troveColorDot ${colorSwatchClass(product.color)}`} aria-hidden="true" />
              <div>
                <strong>{color.toLocaleUpperCase("tr-TR")}</strong>
                <span>RENK</span>
              </div>
            </div>
          </div>

          <div className="troveLabelRule" />

          <div className="troveBarcodeArea">
            <Code128Barcode value={barcodeValue} height={66} />
          </div>

          <div className="troveLabelBottom">
            <strong className="troveProductCode">{product.product_code}</strong>
            <div className="troveLabelBrand">
              {settings?.logo_url ? <img src={settings.logo_url} alt={settings?.site_name || "Trove Teknoloji"} /> : <strong>TROVE</strong>}
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}
