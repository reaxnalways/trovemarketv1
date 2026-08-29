import Link from "next/link";
import { notFound } from "next/navigation";
import { Code128Barcode } from "@/components/code128-barcode";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { PrintLabelButton } from "./print-label-button";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProductLabelPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: product } = await supabase
    .from("products")
    .select("id,product_code,title,brand,model,storage,color,battery_health")
    .eq("id", id)
    .maybeSingle();

  if (!product) notFound();

  const productName = [product.brand, product.model].filter(Boolean).join(" ") || product.title;
  const storage = product.storage || "—";
  const battery = product.battery_health == null ? "—" : `%${product.battery_health}`;
  const color = product.color?.toLocaleUpperCase("tr-TR") || "—";

  return (
    <main className="adminShell adminLabelPage">
      <header className="adminPageHeader adminPrintOnlyHidden">
        <div>
          <p className="eyebrow">ZJIONG ZJ-9210</p>
          <h1 className="adminPageTitle">50 × 20 mm Ürün Etiketi</h1>
        </div>
        <div className="adminInlineActions">
          <Link className="adminButton adminButtonSecondary" href={`/admin/listings/${product.id}`}>Ürüne dön</Link>
          <PrintLabelButton />
        </div>
      </header>

      <section className="adminDashboardCard adminLabelControls adminPrintOnlyHidden">
        <strong>Standart Trove etiketi</strong>
        <p>Bu şablon 50 × 20 mm için sabittir. İkon kullanılmaz; ürün adı, özellikler, Code 128 barkod, 11 haneli ürün kodu ve TROVE yazısı ortalanır.</p>
      </section>

      <div className="adminLabelPreview">
        <article className="troveThermalLabel">
          <div className="troveLabelTitle">{productName}</div>

          <div className="troveLabelSpecs troveLabelSpecsTextOnly">
            <span>{storage}</span>
            <span>{battery} PİL</span>
            <span>{color}</span>
          </div>

          <div className="troveBarcodeArea">
            <Code128Barcode value={product.product_code} height={58} />
          </div>

          <strong className="troveProductCode">{product.product_code}</strong>
          <strong className="troveLabelBrandText">TROVE</strong>
        </article>
      </div>
    </main>
  );
}
