import Link from "next/link";
import { getPublicSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { ListingImportForm } from "./listing-import-form";
import { ManualListingForm } from "./manual-listing-form";

type NewListingPageProps = {
  searchParams: Promise<{ error?: string; mode?: string }>;
};

export default async function NewListingPage({ searchParams }: NewListingPageProps) {
  const { error, mode } = await searchParams;
  const activeMode = mode === "manual" ? "manual" : "import";
  const { url, publishableKey } = getPublicSupabaseConfig();
  const supabase = await createSupabaseServerClient();
  const [{ data: categories }, { data: categoryBrands }] = await Promise.all([
    supabase
      .from("categories")
      .select("id,name,slug")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("category_brands")
      .select("category_id,brand,sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("brand", { ascending: true }),
  ]);

  const brandCatalog: Record<string, string[]> = {};
  for (const row of categoryBrands ?? []) {
    if (!brandCatalog[row.category_id]) brandCatalog[row.category_id] = [];
    brandCatalog[row.category_id].push(row.brand);
  }

  return (
    <main className="adminShell">
      <header className="adminTopbar">
        <div>
          <p className="eyebrow">TROVE YÖNETİM</p>
          <h1 className="adminPageTitle">Yeni İlan</h1>
        </div>
        <Link className="adminTextLink" href="/admin" prefetch={false}>Panele dön</Link>
      </header>

      <div className="adminListingModeTabs" role="navigation" aria-label="İlan oluşturma yöntemi">
        <Link className={activeMode === "import" ? "adminButton" : "adminButton adminButtonSecondary"} href="/admin/listings/new" prefetch={false}>Sahibinden'den getir</Link>
        <Link className={activeMode === "manual" ? "adminButton" : "adminButton adminButtonSecondary"} href="/admin/listings/new?mode=manual" prefetch={false}>Manuel ilan oluştur</Link>
      </div>

      <section className="adminDashboardCard" style={{ marginTop: 18 }}>
        {activeMode === "manual" ? (
          <>
            <p className="adminLead">Kategori seçimine göre marka kataloğu ve ürün alanları otomatik değişir. Telefon, giyilebilir teknoloji, laptop, oyun konsolu ve diğer ürün türlerinde yalnızca ilgili bilgiler gösterilir.</p>
            <ManualListingForm
              brandCatalog={brandCatalog}
              categories={(categories ?? []).map((category) => ({ id: category.id, name: category.name, slug: category.slug }))}
              supabasePublishableKey={publishableKey}
              supabaseUrl={url}
            />
          </>
        ) : (
          <>
            <p className="adminLead">Görselleri ekle ve Sahibinden ilan linkini gir. Trove bilgileri linkten otomatik almaya çalışır, taslak oluşturur ve yayınlamadan önce sana kontrol ettirir. Sahibinden erişimi engellerse alttaki yedek metin alanını kullanabilirsin.</p>
            <ListingImportForm
              initialError={error}
              supabasePublishableKey={publishableKey}
              supabaseUrl={url}
            />
          </>
        )}
      </section>
    </main>
  );
}
