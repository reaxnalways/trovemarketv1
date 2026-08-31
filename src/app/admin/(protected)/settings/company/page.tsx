import Link from "next/link";
import { getPublicSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { FALLBACK_SITE_SETTINGS } from "@/modules/settings/public-settings";
import { SettingsForm } from "../settings-form";
import { PurchaseSettingsForm } from "./purchase-settings-form";

export default async function CompanySettingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("site_settings").select("site_name,site_tagline,whatsapp_number,whatsapp_default_message,logo_url,brand_wordmark_url,app_icon_url,contact_email,contact_phone,instagram_url,company_address,about_text,purchase_enabled,bank_name,bank_account_holder,iban").eq("id", true).maybeSingle();
  const { url, publishableKey } = getPublicSupabaseConfig();
  return <main className="adminShell">
    <header className="adminTopbar"><div><h1 className="adminPageTitle">Şirket Ayarları</h1><p className="adminLead">Marka, iletişim, sosyal medya, banka ve satın alma ayarları.</p></div><Link className="adminTextLink" href="/admin/settings">Ayarlar</Link></header>
    <section className="adminDashboardCard"><SettingsForm supabasePublishableKey={publishableKey} supabaseUrl={url} initial={{siteName:data?.site_name??FALLBACK_SITE_SETTINGS.site_name,siteTagline:data?.site_tagline??FALLBACK_SITE_SETTINGS.site_tagline,whatsappNumber:data?.whatsapp_number??"",whatsappDefaultMessage:data?.whatsapp_default_message??FALLBACK_SITE_SETTINGS.whatsapp_default_message,contactEmail:data?.contact_email??"",contactPhone:data?.contact_phone??"",instagramUrl:data?.instagram_url??"",companyAddress:data?.company_address??"",aboutText:data?.about_text??"",logoUrl:data?.logo_url??null,brandWordmarkUrl:data?.brand_wordmark_url??null,appIconUrl:data?.app_icon_url??null}} /></section>
    <PurchaseSettingsForm initial={{purchaseEnabled:data?.purchase_enabled??false,bankName:data?.bank_name??"",accountHolder:data?.bank_account_holder??"",iban:data?.iban??""}} />
  </main>;
}
