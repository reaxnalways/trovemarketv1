import Link from "next/link";
import { getPublicSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { FALLBACK_SITE_SETTINGS } from "@/modules/settings/public-settings";
import { SiteSettingsForm } from "../site-settings-form";
import { BrandSettingsForm } from "./brand-settings-form";

export default async function SiteSettingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("site_settings").select("site_meta_title,site_meta_description,pwa_name,logo_url,brand_wordmark_url,app_icon_url").eq("id", true).maybeSingle();
  const {url,publishableKey}=getPublicSupabaseConfig();
  return <main className="adminShell adminShellWide">
    <header className="adminTopbar"><div><h1 className="adminPageTitle">Logo & Site Kimliği</h1><p className="adminLead">Görsel marka kimliği, tarayıcı bilgileri, SEO ve ana ekran uygulama adı.</p></div><Link className="adminTextLink" href="/admin/settings">Ayarlar</Link></header>
    <div style={{display:"grid",gap:16}}><BrandSettingsForm supabaseUrl={url} supabasePublishableKey={publishableKey} initial={{logoUrl:data?.logo_url??null,wordmarkUrl:data?.brand_wordmark_url??null,appIconUrl:data?.app_icon_url??null}}/><section className="adminDashboardCard"><div className="adminPageHeader"><div><h2 style={{margin:0}}>Tarayıcı, SEO & PWA</h2><p className="adminLead">Sekme başlığı, arama motoru açıklaması ve ana ekrana eklenen uygulama adı.</p></div></div><SiteSettingsForm initial={{metaTitle:data?.site_meta_title??FALLBACK_SITE_SETTINGS.site_meta_title,metaDescription:data?.site_meta_description??FALLBACK_SITE_SETTINGS.site_meta_description,pwaName:data?.pwa_name??FALLBACK_SITE_SETTINGS.pwa_name}} /></section></div>
  </main>;
}
