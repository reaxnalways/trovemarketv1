export type SliderTransition = "slide" | "fade" | "zoom";
export type SliderRevealEffect = "rise" | "fade" | "zoom" | "none";

export type PublicSiteSettings = {
  site_name: string;
  site_tagline: string;
  whatsapp_number: string | null;
  whatsapp_default_message: string;
  logo_url: string | null;
  brand_wordmark_url: string | null;
  site_meta_title: string;
  site_meta_description: string;
  pwa_name: string;
  campaign_title: string | null;
  campaign_text: string | null;
  campaign_url: string | null;
  service_intro: string;
  announcement_enabled: boolean;
  announcement_items: string[];
  announcement_speed_seconds: number;
  announcement_pause_on_hover: boolean;
  slider_autoplay: boolean;
  slider_interval_seconds: number;
  slider_transition: SliderTransition;
  slider_reveal_effect: SliderRevealEffect;
  slider_pause_on_hover: boolean;
};

export const FALLBACK_SITE_SETTINGS: PublicSiteSettings = {
  site_name: "Trove Teknoloji",
  site_tagline: "Teknoloji alışverişi ve servis, tek yerde.",
  whatsapp_number: null,
  whatsapp_default_message: "Merhaba Trove Teknoloji, bilgi almak istiyorum.",
  logo_url: null,
  brand_wordmark_url: null,
  site_meta_title: "Trove Teknoloji",
  site_meta_description: "Teknoloji ilan, teknik servis ve ürün takip platformu",
  pwa_name: "Trove Teknoloji",
  campaign_title: null,
  campaign_text: null,
  campaign_url: null,
  service_intro: "Telefon, laptop ve bilgisayar servis ihtiyaçların için hızlıca iletişime geç.",
  announcement_enabled: true,
  announcement_items: ["Sıfır & ikinci el telefonlar", "Laptop & bilgisayar", "Bilgisayar parçaları", "Hızlı teknik servis", "WhatsApp iletişim"],
  announcement_speed_seconds: 24,
  announcement_pause_on_hover: true,
  slider_autoplay: true,
  slider_interval_seconds: 3,
  slider_transition: "slide",
  slider_reveal_effect: "rise",
  slider_pause_on_hover: true,
};

function numberInRange(value: unknown, fallback: number, min: number, max: number) {
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? number : fallback;
}

export function resolvePublicSiteSettings(data: Partial<PublicSiteSettings> | null): PublicSiteSettings {
  if (!data) return FALLBACK_SITE_SETTINGS;
  const transition: SliderTransition = data.slider_transition === "fade" || data.slider_transition === "zoom" ? data.slider_transition : "slide";
  const reveal: SliderRevealEffect = ["rise", "fade", "zoom", "none"].includes(String(data.slider_reveal_effect)) ? data.slider_reveal_effect as SliderRevealEffect : "rise";
  const items = Array.isArray(data.announcement_items) ? data.announcement_items.map((item) => String(item).trim()).filter(Boolean).slice(0, 12) : [];
  return {
    site_name: data.site_name?.trim() || FALLBACK_SITE_SETTINGS.site_name,
    site_tagline: data.site_tagline?.trim() || FALLBACK_SITE_SETTINGS.site_tagline,
    whatsapp_number: data.whatsapp_number?.trim() || null,
    whatsapp_default_message: data.whatsapp_default_message?.trim() || FALLBACK_SITE_SETTINGS.whatsapp_default_message,
    logo_url: data.logo_url?.trim() || null,
    brand_wordmark_url: data.brand_wordmark_url?.trim() || null,
    site_meta_title: data.site_meta_title?.trim() || data.site_name?.trim() || FALLBACK_SITE_SETTINGS.site_meta_title,
    site_meta_description: data.site_meta_description?.trim() || data.site_tagline?.trim() || FALLBACK_SITE_SETTINGS.site_meta_description,
    pwa_name: data.pwa_name?.trim() || data.site_name?.trim() || FALLBACK_SITE_SETTINGS.pwa_name,
    campaign_title: data.campaign_title?.trim() || null,
    campaign_text: data.campaign_text?.trim() || null,
    campaign_url: data.campaign_url?.trim() || null,
    service_intro: data.service_intro?.trim() || FALLBACK_SITE_SETTINGS.service_intro,
    announcement_enabled: data.announcement_enabled ?? FALLBACK_SITE_SETTINGS.announcement_enabled,
    announcement_items: items.length ? items : FALLBACK_SITE_SETTINGS.announcement_items,
    announcement_speed_seconds: numberInRange(data.announcement_speed_seconds, 24, 8, 120),
    announcement_pause_on_hover: data.announcement_pause_on_hover ?? true,
    slider_autoplay: data.slider_autoplay ?? true,
    slider_interval_seconds: numberInRange(data.slider_interval_seconds, 3, 2, 15),
    slider_transition: transition,
    slider_reveal_effect: reveal,
    slider_pause_on_hover: data.slider_pause_on_hover ?? true,
  };
}
