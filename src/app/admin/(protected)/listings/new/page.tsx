import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { createDraftListing } from "./actions";

type NewListingPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NewListingPage({ searchParams }: NewListingPageProps) {
  const { error } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id,name")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (
    <main className="adminShell">
      <header className="adminTopbar">
        <div>
          <p className="eyebrow">TROVE YÖNETİM</p>
          <h1 className="adminPageTitle">Yeni İlan</h1>
        </div>
        <Link className="adminTextLink" href="/admin">Panele dön</Link>
      </header>

      <section className="adminDashboardCard">
        <p className="adminLead">İlk kayıt taslak olarak oluşturulur. Ürün kodu veritabanı tarafından otomatik atanır.</p>
        {error ? <p className="adminError">{error}</p> : null}

        <form action={createDraftListing} className="adminListingForm">
          <label className="adminField">
            Kategori
            <select name="categoryId" required defaultValue="">
              <option value="" disabled>Kategori seç</option>
              {(categories ?? []).map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>

          <label className="adminField adminFieldWide">
            İlan başlığı
            <input name="title" required minLength={3} placeholder="Örn. iPhone 15 Pro 256 GB" />
          </label>

          <label className="adminField">Marka<input name="brand" placeholder="Apple" /></label>
          <label className="adminField">Model<input name="model" placeholder="iPhone 15 Pro" /></label>
          <label className="adminField">Fiyat (₺)<input name="price" inputMode="decimal" placeholder="49999" /></label>
          <label className="adminField">
            Durum
            <select name="condition" defaultValue="">
              <option value="">Belirtilmedi</option>
              <option value="new">Sıfır</option>
              <option value="used">2. El</option>
              <option value="refurbished">Yenilenmiş</option>
            </select>
          </label>
          <label className="adminField">Hafıza<input name="storage" placeholder="256 GB" /></label>
          <label className="adminField">Renk<input name="color" placeholder="Siyah" /></label>
          <label className="adminField">Pil sağlığı<input name="batteryHealth" placeholder="%92" /></label>
          <label className="adminField adminFieldWide">Sahibinden / kaynak URL<input name="sourceUrl" type="url" placeholder="https://..." /></label>
          <label className="adminField adminFieldWide">Açıklama<textarea name="description" rows={6} placeholder="Ürün detayları" /></label>

          <div className="adminFieldWide adminFormActions">
            <button className="adminButton" type="submit">Taslak ilanı kaydet</button>
          </div>
        </form>
      </section>
    </main>
  );
}
