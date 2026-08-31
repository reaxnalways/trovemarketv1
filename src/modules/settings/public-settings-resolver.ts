export type SliderTransition = "slide" | "fade" | "zoom" | "flip" | "blur" | "stack";
export type SliderRevealEffect = "rise" | "fade" | "zoom" | "left" | "right" | "blur" | "tilt" | "none";

export type PublicSiteSettings = {
  site_name: string; site_tagline: string; whatsapp_number: string | null; whatsapp_default_message: string;
  logo_url: string | null; brand_wordmark_url: string | null; app_icon_url: string | null;
  contact_email: string | null; contact_phone: string | null; instagram_url: string | null; company_address: string | null; about_text: string | null;
  purchase_enabled: boolean; bank_name: string | null; bank_account_holder: string | null; iban: string | null;
  legal_company_name: string | null; tax_number: string | null; mersis_number: string | null; kep_address: string | null; trade_registry_number: string | null; chamber_name: string | null; etbis_registered: boolean; etbis_site_url: string | null; etbis_qr_url: string | null;
  site_meta_title: string; site_meta_description: string; pwa_name: string;
  campaign_title: string | null; campaign_text: string | null; campaign_url: string | null; service_intro: string;
  announcement_enabled: boolean; announcement_items: string[]; announcement_speed_seconds: number; announcement_pause_on_hover: boolean;
  slider_autoplay: boolean; slider_interval_seconds: number; slider_transition: SliderTransition; slider_reveal_effect: SliderRevealEffect; slider_pause_on_hover: boolean;
};

export const FALLBACK_SITE_SETTINGS: PublicSiteSettings = {
  site_name: "Trove Teknoloji", site_tagline: "Teknoloji alışverişi ve servis, tek yerde.", whatsapp_number: null,
  whatsapp_default_message: "Merhaba Trove Teknoloji, bilgi almak istiyorum.", logo_url: null, brand_wordmark_url: null, app_icon_url: null,
  contact_email: null, contact_phone: null, instagram_url: null, company_address: null, about_text: null,
  purchase_enabled: false, bank_name: null, bank_account_holder: null, iban: null,
  legal_company_name:null,tax_number:null,mersis_number:null,kep_address:null,trade_registry_number:null,chamber_name:null,etbis_registered:false,etbis_site_url:null,etbis_qr_url:null,
  site_meta_title: "Trove Teknoloji", site_meta_description: "Teknoloji ilan, teknik servis ve ürün takip platformu", pwa_name: "Trove Teknoloji",
  campaign_title: null, campaign_text: null, campaign_url: null,
  service_intro: "Telefon, laptop ve bilgisayar servis ihtiyaçların için hızlıca iletişime geç.",
  announcement_enabled: true,
  announcement_items: ["Sıfır & ikinci el telefonlar", "Laptop & bilgisayar", "Bilgisayar parçaları", "Hızlı teknik servis", "WhatsApp iletişim"],
  announcement_speed_seconds: 24, announcement_pause_on_hover: true, slider_autoplay: true, slider_interval_seconds: 3,
  slider_transition: "slide", slider_reveal_effect: "rise", slider_pause_on_hover: true,
};

function numberInRange(value: unknown, fallback: number, min: number, max: number) { const number = Number(value); return Number.isFinite(number) && number >= min && number <= max ? number : fallback; }
const text=(value:unknown)=>typeof value==="string"&&value.trim()?value.trim():null;

export function resolvePublicSiteSettings(data: Partial<PublicSiteSettings> | null): PublicSiteSettings {
  if (!data) return FALLBACK_SITE_SETTINGS;
  const transitions: SliderTransition[] = ["slide", "fade", "zoom", "flip", "blur", "stack"];
  const reveals: SliderRevealEffect[] = ["rise", "fade", "zoom", "left", "right", "blur", "tilt", "none"];
  const transition = transitions.includes(data.slider_transition as SliderTransition) ? data.slider_transition as SliderTransition : "slide";
  const reveal = reveals.includes(data.slider_reveal_effect as SliderRevealEffect) ? data.slider_reveal_effect as SliderRevealEffect : "rise";
  const items = Array.isArray(data.announcement_items) ? data.announcement_items.map((item) => String(item).trim()).filter(Boolean).slice(0, 12) : [];
  return {
    site_name: text(data.site_name) || FALLBACK_SITE_SETTINGS.site_name, site_tagline: text(data.site_tagline) || FALLBACK_SITE_SETTINGS.site_tagline,
    whatsapp_number:text(data.whatsapp_number),whatsapp_default_message:text(data.whatsapp_default_message)||FALLBACK_SITE_SETTINGS.whatsapp_default_message,
    logo_url:text(data.logo_url),brand_wordmark_url:text(data.brand_wordmark_url),app_icon_url:text(data.app_icon_url),contact_email:text(data.contact_email),contact_phone:text(data.contact_phone),instagram_url:text(data.instagram_url),company_address:text(data.company_address),about_text:text(data.about_text),
    purchase_enabled:data.purchase_enabled??false,bank_name:text(data.bank_name),bank_account_holder:text(data.bank_account_holder),iban:text(data.iban)?.replace(/\s+/g,"")||null,
    legal_company_name:text(data.legal_company_name),tax_number:text(data.tax_number),mersis_number:text(data.mersis_number),kep_address:text(data.kep_address),trade_registry_number:text(data.trade_registry_number),chamber_name:text(data.chamber_name),etbis_registered:data.etbis_registered??false,etbis_site_url:text(data.etbis_site_url),etbis_qr_url:text(data.etbis_qr_url),
    site_meta_title:text(data.site_meta_title)||text(data.site_name)||FALLBACK_SITE_SETTINGS.site_meta_title,site_meta_description:text(data.site_meta_description)||text(data.site_tagline)||FALLBACK_SITE_SETTINGS.site_meta_description,pwa_name:text(data.pwa_name)||text(data.site_name)||FALLBACK_SITE_SETTINGS.pwa_name,
    campaign_title:text(data.campaign_title),campaign_text:text(data.campaign_text),campaign_url:text(data.campaign_url),service_intro:text(data.service_intro)||FALLBACK_SITE_SETTINGS.service_intro,
    announcement_enabled:data.announcement_enabled??true,announcement_items:items.length?items:FALLBACK_SITE_SETTINGS.announcement_items,announcement_speed_seconds:numberInRange(data.announcement_speed_seconds,24,8,120),announcement_pause_on_hover:data.announcement_pause_on_hover??true,
    slider_autoplay:data.slider_autoplay??true,slider_interval_seconds:numberInRange(data.slider_interval_seconds,3,2,15),slider_transition:transition,slider_reveal_effect:reveal,slider_pause_on_hover:data.slider_pause_on_hover??true,
  };
}
