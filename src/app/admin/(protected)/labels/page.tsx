import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

type Props = { searchParams: Promise<{ code?: string; error?: string }> };

export default async function AdminLabelsPage({ searchParams }: Props) {
  const { code } = await searchParams;
  const normalized = code?.trim().toUpperCase();

  if (normalized) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("products")
      .select("id")
      .or(`product_code.eq.${normalized},barcode.eq.${normalized}`)
      .limit(1)
      .maybeSingle();

    if (data?.id) redirect(`/admin/listings/${data.id}/label`);
  }

  return (
    <main className="adminShell">
      <div className="adminPageHeader">
        <div><p className="eyebrow">BARKOD & ETİKET</p><h1 className="adminPageTitle">Etiket Yazdır</h1></div>
      </div>
      <section className="adminDashboardCard adminLabelLookup">
        <h2>Ürünü bul</h2>
        <p>Ürün kodunu veya barkodu okut/gir. Eşleşen ürünün yazdırılabilir etiketi açılır.</p>
        {normalized ? <p className="adminError">“{normalized}” için ürün bulunamadı.</p> : null}
        <form method="get" className="adminLabelLookupForm">
          <label className="adminField">
            Ürün kodu / barkod
            <input name="code" autoFocus autoComplete="off" placeholder="TEL-001" />
          </label>
          <button className="adminButton" type="submit">Etiketi aç</button>
        </form>
      </section>
    </main>
  );
}
