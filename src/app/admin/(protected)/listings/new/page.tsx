import Link from "next/link";
import { getPublicSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { ListingImportForm } from "./listing-import-form";
import { ManualListingForm } from "./manual-listing-form";

type NewListingPageProps = {
  searchParams: Promise<{ error?: string; mode?: string }>;
};

function isProductCategory(category: { name: string; slug: string | null }) {
  const value = `${category.slug ?? ""} ${category.name}`.toLocaleLowerCase("tr-TR");
  return !value.includes("teknik servis") && !value.includes("teknik-servis");
}

export default async function NewListingPage({ searchParams }: NewListingPageProps) {
  const { error, mode } = await searchParams;
  const activeMode = mode === "manual" ? "manual" : "import";
  const { url, publishableKey } = getPublicSupabaseConfig();
  const supabase = await createSupabaseServerClient();
  const [{ data: categoryRows }, { data: categoryBrands }] = await Promise.all([
    supabase.from("categories").select("id,name,slug").eq("is_active", true).order("sort_order", { ascending: true }),
    supabase.from("category_brands").select("category_id,brand,sort_order").eq("is_active", true).order("sort_order", { ascending: true }).order("brand", { ascending: true }),
  ]);

  const categories = (categoryRows ?? []).filter(isProductCategory);
  const productCategoryIds = new Set(categories.map((category) => category.id));
  const brandCatalog: Record<string, string[]> = {};
  for (const row of categoryBrands ?? []) {
    if (!productCategoryIds.has(row.category_id)) continue;
    if (!brandCatalog[row.category_id]) brandCatalog[row.category_id] = [];
    brandCatalog[row.category_id].push(row.brand);
  }

  return (
    <main className="adminShell">
      <header className="adminTopbar">
        <div><p className="eyebrow">TROVE YÖNETİM</p><h1 className="adminPageTitle">Yeni İlan</h1></div>
        <Link className="adminTextLink" href="/admin" prefetch={false}>Panele dön</Link>
      </header>

      <div className="adminListingModeTabs" role="navigation" aria-label="İlan oluşturma yöntemi">
        <Link className={activeMode === "import" ? "adminButton" : "adminButton adminButtonSecondary"} href="/admin/listings/new" prefetch={false}>Sahibinden'den getir</Link>
        <Link className={activeMode === "manual" ? "adminButton" : "adminButton adminButtonSecondary"} href="/admin/listings/new?mode=manual" prefetch={false}>Manuel ilan oluştur</Link>
      </div>

      <section className="adminDashboardCard" style={{ marginTop: 18 }}>
        {activeMode === "manual" ? (
          <ManualListingForm brandCatalog={brandCatalog} categories={categories.map((category) => ({ id: category.id, name: category.name, slug: category.slug }))} supabasePublishableKey={publishableKey} supabaseUrl={url} />
        ) : (
          <ListingImportForm initialError={error} supabasePublishableKey={publishableKey} supabaseUrl={url} />
        )}
      </section>
    </main>
  );
}
