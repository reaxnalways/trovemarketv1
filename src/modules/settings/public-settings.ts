import { createPublicSupabaseClient } from "../../lib/supabase/public-client";
import { FALLBACK_SITE_SETTINGS, resolvePublicSiteSettings, type PublicSiteSettings } from "./public-settings-resolver";

export { FALLBACK_SITE_SETTINGS, resolvePublicSiteSettings, type PublicSiteSettings } from "./public-settings-resolver";

export async function getPublicSiteSettings(): Promise<PublicSiteSettings> {
  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase.from("site_settings").select("site_name,site_tagline,whatsapp_number,whatsapp_default_message,logo_url,brand_wordmark_url,app_icon_url,contact_email,contact_phone,instagram_url,company_address,about_text,purchase_enabled,bank_name,bank_account_holder,iban,legal_company_name,tax_number,mersis_number,kep_address,trade_registry_number,chamber_name,etbis_registered,etbis_site_url,etbis_qr_url,site_meta_title,site_meta_description,pwa_name,campaign_title,campaign_text,campaign_url,service_intro,announcement_enabled,announcement_items,announcement_speed_seconds,announcement_pause_on_hover,slider_autoplay,slider_interval_seconds,slider_transition,slider_reveal_effect,slider_pause_on_hover").eq("id", true).maybeSingle();
  if (error) return FALLBACK_SITE_SETTINGS;
  return resolvePublicSiteSettings(data);
}
