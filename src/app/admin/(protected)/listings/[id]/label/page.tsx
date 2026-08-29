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
    .select("id,product_code,title,brand,model,storage,color,battery_health,device_region")
    .eq("id", id)
    .maybeSingle();

  if (!product) notFound();

  const productName = [product.brand, product.model].filter(Boolean).join(" ") || product.title;
  const details = [
    product.storage || null,
    product.battery_health == null ? null : `PİL %${product.battery_health}`,
    product.color?.toLocaleUpperCase("tr-TR") || null,
    product.device_region === "tr" ? "TR CİHAZ" : product.device_region === "international" ? "YURT DIŞI" : null,
  ].filter(Boolean);

  return (
    <main className="adminShell adminLabelPage">
      <header className="adminPageHeader adminPrintOnlyHidden">
        <div>
          <p className="eyebrow">ZJIONG ZJ-9210</p>
          <h1 className="adminPageTitle">50 × 30 mm Ürün Etiketi</h1>
        </div>
        <div className="adminInlineActions">
          <Link className="adminButton adminButtonSecondary" href={`/admin/listings/${product.id}`}>Ürüne dön</Link>
          <PrintLabelButton />
        </div>
      </header>

      <section className="adminDashboardCard adminLabelControls adminPrintOnlyHidden">
        <strong>Standart Trove etiketi</strong>
        <p>50 × 30 mm, ikonsuz ve ortalanmış şablon. Ürün adı, hafıza, pil sağlığı, renk, TR/Yurt dışı bilgisi, Code 128 barkod, 11 haneli ürün kodu ve TROVE yazısı kullanılır.</p>
      </section>

      <div className="adminLabelPreview">
        <article className="troveThermalLabel troveThermalLabel50x30">
          <div className="troveLabelTitle">{productName}</div>
          <div className="troveLabelDetails">{details.length ? details.join(" • ") : "ÖZELLİK BİLGİSİ YOK"}</div>
          <div className="troveBarcodeArea">
            <Code128Barcode value={product.product_code} height={70} />
          </div>
          <strong className="troveProductCode">{product.product_code}</strong>
          <strong className="troveLabelBrandText">T R O V E</strong>
        </article>
      </div>
    </main>
  );
}
