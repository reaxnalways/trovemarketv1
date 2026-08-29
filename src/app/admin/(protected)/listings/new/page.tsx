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

      <div className="adminListingModeTabs" role="navigation" aria-label="İlan oluşturma yöntemi">
        <Link className={activeMode === "import" ? "adminButton" : "adminButton adminButtonSecondary"} href="/admin/listings/new">Sahibinden'den getir</Link>
        <Link className={activeMode === "manual" ? "adminButton" : "adminButton adminButtonSecondary"} href="/admin/listings/new?mode=manual">Manuel ilan oluştur</Link>
      </div>

      <section className="adminDashboardCard" style={{ marginTop: 18 }}>
        {activeMode === "manual" ? (
          <>
            <p className="adminLead">Sahibinden'e girmeyeceğin ürünleri buradan doğrudan Trove'a ekle. Kaynak linki gerekmez; görsel, fiyat ve cihaz bilgilerini kendin gir.</p>
            <ManualListingForm
              categories={(categories ?? []).map((category) => ({ id: category.id, name: category.name }))}
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
