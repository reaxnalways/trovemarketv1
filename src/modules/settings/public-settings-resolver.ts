export type PublicSiteSettings = {
  site_name: string;
  site_tagline: string;
  whatsapp_number: string | null;
  whatsapp_default_message: string;
  logo_url: string | null;
  campaign_title: string | null;
  campaign_text: string | null;
  campaign_url: string | null;
  service_intro: string;
};

export const FALLBACK_SITE_SETTINGS: PublicSiteSettings = {
  site_name: "Trove Teknoloji",
  site_tagline: "Teknoloji alışverişi ve servis, tek yerde.",
  whatsapp_number: null,
  whatsapp_default_message: "Merhaba Trove Teknoloji, bilgi almak istiyorum.",
  logo_url: null,
  campaign_title: null,
  campaign_text: null,
  campaign_url: null,
  service_intro: "Telefon, laptop ve bilgisayar servis ihtiyaçların için hızlıca iletişime geç.",
};

export function resolvePublicSiteSettings(data: Partial<PublicSiteSettings> | null): PublicSiteSettings {
  if (!data) return FALLBACK_SITE_SETTINGS;
  return {
    site_name: data.site_name?.trim() || FALLBACK_SITE_SETTINGS.site_name,
    site_tagline: data.site_tagline?.trim() || FALLBACK_SITE_SETTINGS.site_tagline,
    whatsapp_number: data.whatsapp_number?.trim() || null,
    whatsapp_default_message: data.whatsapp_default_message?.trim() || FALLBACK_SITE_SETTINGS.whatsapp_default_message,
    logo_url: data.logo_url?.trim() || null,
    campaign_title: data.campaign_title?.trim() || null,
    campaign_text: data.campaign_text?.trim() || null,
    campaign_url: data.campaign_url?.trim() || null,
    service_intro: data.service_intro?.trim() || FALLBACK_SITE_SETTINGS.service_intro,
  };
}
