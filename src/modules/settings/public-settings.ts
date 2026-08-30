import { createPublicSupabaseClient } from "../../lib/supabase/public-client";
import {
  FALLBACK_SITE_SETTINGS,
  resolvePublicSiteSettings,
  type PublicSiteSettings,
} from "./public-settings-resolver";

export { FALLBACK_SITE_SETTINGS, resolvePublicSiteSettings, type PublicSiteSettings } from "./public-settings-resolver";

export async function getPublicSiteSettings(): Promise<PublicSiteSettings> {
  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("site_name,site_tagline,whatsapp_number,whatsapp_default_message,logo_url,brand_wordmark_url,campaign_title,campaign_text,campaign_url,service_intro")
    .eq("id", true)
    .maybeSingle();

  if (error) return FALLBACK_SITE_SETTINGS;
  return resolvePublicSiteSettings(data);
}
