"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { isAdminEmail } from "@/modules/auth/admin-access";
import { normalizeSiteSettings } from "@/modules/settings/site-settings";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user || !isAdminEmail(data.user.email)) redirect("/admin/login");
  return supabase;
}

export async function saveSiteSettings(input: {
  siteName: string; siteTagline: string; whatsappNumber: string; whatsappDefaultMessage: string;
  contactEmail: string; contactPhone: string; instagramUrl: string; companyAddress: string; aboutText: string;
  logoUrl: string | null; brandWordmarkUrl: string | null; appIconUrl: string | null;
}) {
  const values = normalizeSiteSettings(input);
  const supabase = await requireAdmin();
  const { error } = await supabase.from("site_settings").update({
    site_name: values.siteName,
    site_tagline: values.siteTagline,
    whatsapp_number: values.whatsappNumber || null,
    whatsapp_default_message: values.whatsappDefaultMessage,
    contact_email: values.contactEmail || null,
    contact_phone: values.contactPhone || null,
    instagram_url: values.instagramUrl || null,
    company_address: values.companyAddress || null,
    about_text: values.aboutText || null,
    logo_url: values.logoUrl,
    brand_wordmark_url: values.brandWordmarkUrl,
    app_icon_url: values.appIconUrl,
    updated_at: new Date().toISOString(),
  }).eq("id", true);
  if (error) throw new Error("Şirket ayarları kaydedilemedi.");
  revalidatePath("/"); revalidatePath("/hakkimizda"); revalidatePath("/manifest.webmanifest"); revalidatePath("/kategori/[slug]", "page"); revalidatePath("/ilan/[productCode]", "page"); revalidatePath("/admin/settings/company");
}

export async function saveSiteIdentitySettings(input: { metaTitle: string; metaDescription: string; pwaName: string }) {
  const metaTitle = input.metaTitle.trim(); const metaDescription = input.metaDescription.trim(); const pwaName = input.pwaName.trim();
  if (metaTitle.length < 2 || metaTitle.length > 80) throw new Error("Sekme başlığı 2-80 karakter olmalıdır.");
  if (metaDescription.length < 10 || metaDescription.length > 180) throw new Error("Site açıklaması 10-180 karakter olmalıdır.");
  if (pwaName.length < 2 || pwaName.length > 40) throw new Error("Uygulama adı 2-40 karakter olmalıdır.");
  const supabase = await requireAdmin();
  const { error } = await supabase.from("site_settings").update({ site_meta_title: metaTitle, site_meta_description: metaDescription, pwa_name: pwaName, updated_at: new Date().toISOString() }).eq("id", true);
  if (error) throw new Error("Site ayarları kaydedilemedi.");
  revalidatePath("/"); revalidatePath("/manifest.webmanifest"); revalidatePath("/admin/settings/site");
}

export async function saveHomepageExperienceSettings(input: {
  announcementEnabled: boolean; announcementItems: string[]; announcementSpeedSeconds: number; announcementPauseOnHover: boolean;
  sliderAutoplay: boolean; sliderIntervalSeconds: number;
  sliderTransition: "slide" | "fade" | "zoom" | "flip" | "blur" | "stack";
  sliderRevealEffect: "rise" | "fade" | "zoom" | "left" | "right" | "blur" | "tilt" | "none";
  sliderPauseOnHover: boolean;
}) {
  const items = input.announcementItems.map((item) => item.trim()).filter(Boolean).slice(0, 12);
  const bannerSpeed = Math.min(120, Math.max(8, Math.round(input.announcementSpeedSeconds || 24)));
  const interval = Math.min(15, Math.max(2, Math.round(input.sliderIntervalSeconds || 3)));
  if (!["slide", "fade", "zoom", "flip", "blur", "stack"].includes(input.sliderTransition)) throw new Error("Geçersiz slider efekti.");
  if (!["rise", "fade", "zoom", "left", "right", "blur", "tilt", "none"].includes(input.sliderRevealEffect)) throw new Error("Geçersiz giriş efekti.");
  const supabase = await requireAdmin();
  const { error } = await supabase.from("site_settings").update({
    announcement_enabled: input.announcementEnabled, announcement_items: items.length ? items : ["Trove Teknoloji"], announcement_speed_seconds: bannerSpeed,
    announcement_pause_on_hover: input.announcementPauseOnHover, slider_autoplay: input.sliderAutoplay, slider_interval_seconds: interval,
    slider_transition: input.sliderTransition, slider_reveal_effect: input.sliderRevealEffect, slider_pause_on_hover: input.sliderPauseOnHover, updated_at: new Date().toISOString(),
  }).eq("id", true);
  if (error) throw new Error("Ana sayfa ayarları kaydedilemedi.");
  revalidatePath("/"); revalidatePath("/admin/settings/homepage");
}
