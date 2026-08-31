import Link from "next/link";
import { getPublicSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { FALLBACK_SITE_SETTINGS } from "@/modules/settings/public-settings";
import { SettingsForm } from "../settings-form";

export default async function CompanySettingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("site_settings").select("site_name,site_tagline,whatsapp_number,whatsapp_default_message,logo_url,brand_wordmark_url,app_icon_url").eq("id", true).maybeSingle();
  const { url, publishableKey } = getPublicSupabaseConfig();
  return <main className="adminShell">
    <header className="adminTopbar"><div><h1 className="adminPageTitle">Şirket Ayarları</h1><p className="adminLead">Marka, logo, mobil uygulama simgesi ve iletişim bilgileri.</p></div><Link className="adminTextLink" href="/admin/settings">Ayarlar</Link></header>
    <section className="adminDashboardCard"><SettingsForm supabasePublishableKey={publishableKey} supabaseUrl={url} initial={{siteName:data?.site_name??FALLBACK_SITE_SETTINGS.site_name,siteTagline:data?.site_tagline??FALLBACK_SITE_SETTINGS.site_tagline,whatsappNumber:data?.whatsapp_number??"",whatsappDefaultMessage:data?.whatsapp_default_message??FALLBACK_SITE_SETTINGS.whatsapp_default_message,logoUrl:data?.logo_url??null,brandWordmarkUrl:data?.brand_wordmark_url??null,appIconUrl:data?.app_icon_url??null}} /></section>
  </main>;
}
