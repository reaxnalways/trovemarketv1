import Link from "next/link";
import { getPublicSupabaseConfig } from "@/lib/supabase/config";
import { ListingImportForm } from "./listing-import-form";

type NewListingPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NewListingPage({ searchParams }: NewListingPageProps) {
  const { error } = await searchParams;
  const { url, publishableKey } = getPublicSupabaseConfig();

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
        <p className="adminLead">
          Görselleri ekle, Sahibinden linkini gir ve ilan sayfasındaki detayları tek parça kopyalayıp yapıştır. Trove bilgileri otomatik ayırıp taslak ilanı oluşturur.
        </p>

        <ListingImportForm
          initialError={error}
          supabasePublishableKey={publishableKey}
          supabaseUrl={url}
        />
      </section>
    </main>
  );
}
