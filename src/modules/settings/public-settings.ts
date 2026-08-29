import { createPublicSupabaseClient } from "../../lib/supabase/public-client";

export type PublicSiteSettings = {
  site_name: string;
  site_tagline: string;
  whatsapp_number: string | null;
  whatsapp_default_message: string;
  logo_url: string | null;
};

export const FALLBACK_SITE_SETTINGS: PublicSiteSettings = {
  site_name: "Trove Teknoloji",
  site_tagline: "Teknoloji alışverişi ve servis, tek yerde.",
  whatsapp_number: null,
  whatsapp_default_message: "Merhaba Trove Teknoloji, bilgi almak istiyorum.",
  logo_url: null,
};

export function resolvePublicSiteSettings(data: Partial<PublicSiteSettings> | null): PublicSiteSettings {
  if (!data) return FALLBACK_SITE_SETTINGS;

  return {
    site_name: data.site_name?.trim() || FALLBACK_SITE_SETTINGS.site_name,
    site_tagline: data.site_tagline?.trim() || FALLBACK_SITE_SETTINGS.site_tagline,
    whatsapp_number: data.whatsapp_number?.trim() || null,
    whatsapp_default_message: data.whatsapp_default_message?.trim() || FALLBACK_SITE_SETTINGS.whatsapp_default_message,
    logo_url: data.logo_url?.trim() || null,
  };
}

export async function getPublicSiteSettings(): Promise<PublicSiteSettings> {
  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("site_name,site_tagline,whatsapp_number,whatsapp_default_message,logo_url")
    .eq("id", true)
    .maybeSingle();

  if (error) return FALLBACK_SITE_SETTINGS;
  return resolvePublicSiteSettings(data);
}
