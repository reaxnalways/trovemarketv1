import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import BarcodeScanner from "./barcode-scanner";

type Props = { searchParams: Promise<{ code?: string }> };

export default async function AdminScanPage({ searchParams }: Props) {
  const { code } = await searchParams;
  const normalized = code?.trim().toUpperCase();

  if (normalized) {
    const supabase = await createSupabaseServerClient();
    const { data: byProductCode } = await supabase.from("products").select("id").eq("product_code", normalized).maybeSingle();
    if (byProductCode?.id) redirect(`/admin/listings/${byProductCode.id}`);

    const { data: byBarcode } = await supabase.from("products").select("id").eq("barcode", code?.trim() ?? "").maybeSingle();
    if (byBarcode?.id) redirect(`/admin/listings/${byBarcode.id}`);
  }

  return (
    <main className="adminShell">
      <div className="adminPageHeader">
        <div><p className="eyebrow">BARKOD TARA</p><h1 className="adminPageTitle">Ürünü anında bul</h1></div>
        <Link className="adminButton adminButtonSecondary" href="/admin">Panele dön</Link>
      </div>

      {normalized ? <p className="adminError">“{code}” ile eşleşen ürün bulunamadı.</p> : null}

      <section className="adminScannerGrid">
        <BarcodeScanner />
        <div className="adminDashboardCard">
          <p className="eyebrow">MANUEL / FİZİKSEL OKUYUCU</p>
          <h2>Ürün kodu veya barkod gir</h2>
          <p>USB/Bluetooth barkod okuyucular genellikle klavye gibi çalışır. İmleç aşağıdaki alandayken okutmanız yeterlidir.</p>
          <form className="adminForm" action="/admin/scan" method="get">
            <label className="adminField">Barkod / ürün kodu<input name="code" autoFocus autoComplete="off" placeholder="TEL-001" required /></label>
            <button className="adminButton" type="submit">Ürünü aç</button>
          </form>
        </div>
      </section>
    </main>
  );
}
