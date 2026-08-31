import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { FALLBACK_SITE_SETTINGS } from "@/modules/settings/public-settings";
import { SiteSettingsForm } from "../site-settings-form";

export default async function SiteSettingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("site_settings").select("site_meta_title,site_meta_description,pwa_name").eq("id", true).maybeSingle();
  return <main className="adminShell">
    <header className="adminTopbar"><div><h1 className="adminPageTitle">Site Ayarları</h1><p className="adminLead">Sekme, SEO ve ana ekrana ekleme bilgileri.</p></div><Link className="adminTextLink" href="/admin/settings">Ayarlar</Link></header>
    <section className="adminDashboardCard"><SiteSettingsForm initial={{metaTitle:data?.site_meta_title??FALLBACK_SITE_SETTINGS.site_meta_title,metaDescription:data?.site_meta_description??FALLBACK_SITE_SETTINGS.site_meta_description,pwaName:data?.pwa_name??FALLBACK_SITE_SETTINGS.pwa_name}} /></section>
  </main>;
}
