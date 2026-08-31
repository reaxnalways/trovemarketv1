import Link from "next/link";
import { getPublicSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { FALLBACK_SITE_SETTINGS } from "@/modules/settings/public-settings";
import { SettingsForm } from "./settings-form";
import { HomepageExperienceForm } from "./homepage-experience-form";

export default async function AdminSettingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("site_settings")
    .select("site_name,site_tagline,whatsapp_number,whatsapp_default_message,logo_url,brand_wordmark_url,announcement_enabled,announcement_items,announcement_speed_seconds,announcement_pause_on_hover,slider_autoplay,slider_interval_seconds,slider_transition,slider_reveal_effect,slider_pause_on_hover")
    .eq("id", true)
    .maybeSingle();

  const { url, publishableKey } = getPublicSupabaseConfig();

  return (
    <main className="adminShell">
      <header className="adminTopbar"><div><h1 className="adminPageTitle">Site Ayarları</h1></div><Link className="adminTextLink" href="/admin">Panele dön</Link></header>

      <section className="adminDashboardCard">
        <h2>Marka & İletişim</h2>
        <SettingsForm
          supabasePublishableKey={publishableKey}
          supabaseUrl={url}
          initial={{
            siteName: data?.site_name ?? FALLBACK_SITE_SETTINGS.site_name,
            siteTagline: data?.site_tagline ?? FALLBACK_SITE_SETTINGS.site_tagline,
            whatsappNumber: data?.whatsapp_number ?? "",
            whatsappDefaultMessage: data?.whatsapp_default_message ?? FALLBACK_SITE_SETTINGS.whatsapp_default_message,
            logoUrl: data?.logo_url ?? null,
            brandWordmarkUrl: data?.brand_wordmark_url ?? null,
          }}
        />
      </section>

      <section className="adminDashboardCard" style={{ marginTop: 18 }}>
        <h2>Banner & Slider Davranışı</h2>
        <p className="adminLead">Akan üst banner metinlerini, hızını ve ana sayfa slider animasyonlarını buradan yönet.</p>
        <HomepageExperienceForm initial={{
          announcementEnabled: data?.announcement_enabled ?? FALLBACK_SITE_SETTINGS.announcement_enabled,
          announcementItems: data?.announcement_items ?? FALLBACK_SITE_SETTINGS.announcement_items,
          announcementSpeedSeconds: data?.announcement_speed_seconds ?? FALLBACK_SITE_SETTINGS.announcement_speed_seconds,
          announcementPauseOnHover: data?.announcement_pause_on_hover ?? FALLBACK_SITE_SETTINGS.announcement_pause_on_hover,
          sliderAutoplay: data?.slider_autoplay ?? FALLBACK_SITE_SETTINGS.slider_autoplay,
          sliderIntervalSeconds: data?.slider_interval_seconds ?? FALLBACK_SITE_SETTINGS.slider_interval_seconds,
          sliderTransition: (data?.slider_transition ?? FALLBACK_SITE_SETTINGS.slider_transition) as "slide" | "fade" | "zoom",
          sliderRevealEffect: (data?.slider_reveal_effect ?? FALLBACK_SITE_SETTINGS.slider_reveal_effect) as "rise" | "fade" | "zoom" | "none",
          sliderPauseOnHover: data?.slider_pause_on_hover ?? FALLBACK_SITE_SETTINGS.slider_pause_on_hover,
        }} />
      </section>

      <section className="adminDashboardCard" style={{ marginTop: 18 }}>
        <h2>Slider Görselleri</h2>
        <p className="adminLead">Bölümlere görsel ekleme, sıralama, gizleme ve silme işlemleri içerik ekranındadır.</p>
        <Link className="adminButton adminButtonSecondary" href="/admin/content">Slider görsellerini yönet</Link>
      </section>
    </main>
  );
}
