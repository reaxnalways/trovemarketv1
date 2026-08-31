import Link from "next/link";
import { notFound } from "next/navigation";
import { Code128Barcode } from "@/components/code128-barcode";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { PrintLabelButton } from "./print-label-button";

type Props = { params: Promise<{ id: string }> };

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
  const registrationCode = product.device_region === "tr" ? "TC" : product.device_region === "passport" ? "PK" : product.device_region === "international" ? "YD" : "-";
  const battery = product.battery_health == null ? "-" : `%${product.battery_health}`;

  return (
    <main className="adminShell adminLabelPage">
      <header className="adminPageHeader adminPrintOnlyHidden">
        <div><p className="eyebrow">ZJIONG ZJ-9210</p><h1 className="adminPageTitle">50 × 30 mm Ürün Etiketi</h1></div>
        <div className="adminInlineActions">
          <Link className="adminButton adminButtonSecondary" href={`/admin/listings/${product.id}`}>Ürüne dön</Link>
          <PrintLabelButton />
        </div>
      </header>

      <section className="adminDashboardCard adminLabelControls adminPrintOnlyHidden">
        <strong>Standart Trove etiketi</strong>
        <p>TROVE üstte; model, hafıza, pil, renk ve TC/PK/YD bilgileri sade ve büyük gösterilir.</p>
      </section>

      <div className="adminLabelPreview">
        <article className="troveThermalLabel troveThermalLabel50x30">
          <div className="troveLabelLogo" aria-label="TROVE"><span>TR</span><span className="trovePowerO">O</span><span>VE</span></div>
          <div className="troveLabelTitle">{productName}</div>
          <div className="troveLabelSpecs">
            <div><strong>{product.storage || "-"}</strong><small>HAFIZA</small></div>
            <div><strong>PİL {battery}</strong><small>PİL YÜZDESİ</small></div>
            <div><strong>{product.color?.toLocaleUpperCase("tr-TR") || "-"}</strong><small>RENK</small></div>
            <div><strong>{registrationCode}</strong><small>KAYIT</small></div>
          </div>
          <div className="troveBarcodeArea"><Code128Barcode value={product.product_code} height={70} /></div>
          <strong className="troveProductCode">{product.product_code}</strong>
        </article>
      </div>
    </main>
  );
}
