import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { FALLBACK_SITE_SETTINGS } from "@/modules/settings/public-settings";
import { CompanyContactForm } from "./company-contact-form";
import { EtbisSettingsForm } from "./etbis-settings-form";
import { PurchaseSettingsForm } from "./purchase-settings-form";

export default async function CompanySettingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("site_settings").select("site_name,site_tagline,whatsapp_number,whatsapp_default_message,contact_email,contact_phone,instagram_url,company_address,about_text,purchase_enabled,bank_name,bank_account_holder,iban,legal_company_name,tax_number,mersis_number,kep_address,trade_registry_number,chamber_name,etbis_registered,etbis_site_url,etbis_qr_url").eq("id", true).maybeSingle();
  return <main className="adminShell adminShellWide">
    <header className="adminTopbar"><div><h1 className="adminPageTitle">Şirket, İletişim & Yasal</h1><p className="adminLead">Müşteri iletişimi, şirket bilgileri, ödeme ve ETBİS altyapısı.</p></div><Link className="adminTextLink" href="/admin/settings">Ayarlar</Link></header>
    <div style={{display:"grid",gap:16}}>
      <CompanyContactForm initial={{siteName:data?.site_name??FALLBACK_SITE_SETTINGS.site_name,siteTagline:data?.site_tagline??FALLBACK_SITE_SETTINGS.site_tagline,aboutText:data?.about_text??"",contactEmail:data?.contact_email??"",contactPhone:data?.contact_phone??"",whatsappNumber:data?.whatsapp_number??"",instagramUrl:data?.instagram_url??"",companyAddress:data?.company_address??"",whatsappDefaultMessage:data?.whatsapp_default_message??FALLBACK_SITE_SETTINGS.whatsapp_default_message}} />
      <EtbisSettingsForm initial={{legalCompanyName:data?.legal_company_name??"",taxNumber:data?.tax_number??"",mersisNumber:data?.mersis_number??"",kepAddress:data?.kep_address??"",tradeRegistryNumber:data?.trade_registry_number??"",chamberName:data?.chamber_name??"",etbisRegistered:data?.etbis_registered??false,etbisSiteUrl:data?.etbis_site_url??"",etbisQrUrl:data?.etbis_qr_url??""}} />
      <PurchaseSettingsForm initial={{purchaseEnabled:data?.purchase_enabled??false,bankName:data?.bank_name??"",accountHolder:data?.bank_account_holder??"",iban:data?.iban??""}} />
    </div>
  </main>;
}
