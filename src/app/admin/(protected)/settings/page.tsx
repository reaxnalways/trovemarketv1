import Link from "next/link";
import { getPublicSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { FALLBACK_SITE_SETTINGS } from "@/modules/settings/public-settings";
import { SettingsForm } from "./settings-form";

export default async function AdminSettingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("site_settings")
    .select("site_name,site_tagline,whatsapp_number,whatsapp_default_message,logo_url")
    .eq("id", true)
    .maybeSingle();

  const { url, publishableKey } = getPublicSupabaseConfig();

  return (
    <main className="adminShell">
      <header className="adminTopbar">
        <div>
          <p className="eyebrow">TROVE YÖNETİM</p>
          <h1 className="adminPageTitle">Site Ayarları</h1>
        </div>
        <Link className="adminTextLink" href="/admin">Panele dön</Link>
      </header>

      <section className="adminDashboardCard">
        <p className="adminLead">Marka bilgilerini, WhatsApp iletişimini ve müşteri tarafında kullanılacak SVG logoyu buradan yönet.</p>
        <SettingsForm
          supabasePublishableKey={publishableKey}
          supabaseUrl={url}
          initial={{
            siteName: data?.site_name ?? FALLBACK_SITE_SETTINGS.site_name,
            siteTagline: data?.site_tagline ?? FALLBACK_SITE_SETTINGS.site_tagline,
            whatsappNumber: data?.whatsapp_number ?? "",
            whatsappDefaultMessage: data?.whatsapp_default_message ?? FALLBACK_SITE_SETTINGS.whatsapp_default_message,
            logoUrl: data?.logo_url ?? null,
          }}
        />
      </section>
    </main>
  );
}
