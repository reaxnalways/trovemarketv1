import Link from "next/link";
import { notFound } from "next/navigation";
import { Code39Barcode } from "@/components/code39-barcode";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { PrintButton } from "./print-button";
import styles from "./label.module.css";

type ProductLabelPageProps = {
  params: Promise<{ productCode: string }>;
};

export default async function ProductLabelPage({ params }: ProductLabelPageProps) {
  const { productCode } = await params;
  if (!/^\d{11}$/.test(productCode)) notFound();

  const supabase = await createSupabaseServerClient();
  const { data: product } = await supabase
    .from("products")
    .select("product_code,barcode,title,brand,model,storage,color,battery_health,condition,device_region")
    .eq("product_code", productCode)
    .maybeSingle();

  if (!product) notFound();
  const barcodeValue = product.barcode || product.product_code;

  return (
    <main className="adminShell">
      <header className="adminTopbar printHidden">
        <div>
          <p className="eyebrow">ÜRÜN ETİKETİ</p>
          <h1 className="adminPageTitle">{product.product_code}</h1>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="adminButton adminButtonSecondary" href={`/admin/scanner?code=${product.product_code}`}>Ürüne dön</Link>
          <PrintButton />
        </div>
      </header>

      <section className={styles.label}>
        <div className={styles.brand}>TROVE TEKNOLOJİ</div>
        <h2>{[product.brand, product.model].filter(Boolean).join(" ") || product.title}</h2>

        <div className={styles.grid}>
          {product.storage ? <p><span>Hafıza</span><strong>{product.storage}</strong></p> : null}
          {product.color ? <p><span>Renk</span><strong>{product.color}</strong></p> : null}
          {product.battery_health != null ? <p><span>Pil</span><strong>%{product.battery_health}</strong></p> : null}
          {product.condition ? <p><span>Durum</span><strong>{product.condition}</strong></p> : null}
          {product.device_region ? <p><span>Cihaz</span><strong>{product.device_region}</strong></p> : null}
        </div>

        <div className={styles.barcode}>
          <Code39Barcode value={barcodeValue} height={72} />
          <strong>{barcodeValue}</strong>
        </div>
        <div className={styles.code}>Ürün Kodu: {product.product_code}</div>
      </section>
    </main>
  );
}
