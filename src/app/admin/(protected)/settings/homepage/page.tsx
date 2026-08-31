import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { FALLBACK_SITE_SETTINGS } from "@/modules/settings/public-settings";
import { HomepageExperienceForm } from "../homepage-experience-form";

export default async function HomepageSettingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("site_settings").select("announcement_enabled,announcement_items,announcement_speed_seconds,announcement_pause_on_hover,slider_autoplay,slider_interval_seconds,slider_transition,slider_reveal_effect,slider_pause_on_hover").eq("id", true).maybeSingle();
  return <main className="adminShell">
    <header className="adminTopbar"><div><h1 className="adminPageTitle">Ana Sayfa Ayarları</h1><p className="adminLead">Banner, slider süreleri ve animasyon davranışları.</p></div><Link className="adminTextLink" href="/admin/settings">Ayarlar</Link></header>
    <section className="adminDashboardCard"><HomepageExperienceForm initial={{announcementEnabled:data?.announcement_enabled??FALLBACK_SITE_SETTINGS.announcement_enabled,announcementItems:data?.announcement_items??FALLBACK_SITE_SETTINGS.announcement_items,announcementSpeedSeconds:data?.announcement_speed_seconds??FALLBACK_SITE_SETTINGS.announcement_speed_seconds,announcementPauseOnHover:data?.announcement_pause_on_hover??FALLBACK_SITE_SETTINGS.announcement_pause_on_hover,sliderAutoplay:data?.slider_autoplay??FALLBACK_SITE_SETTINGS.slider_autoplay,sliderIntervalSeconds:data?.slider_interval_seconds??FALLBACK_SITE_SETTINGS.slider_interval_seconds,sliderTransition:(data?.slider_transition??FALLBACK_SITE_SETTINGS.slider_transition) as "slide"|"fade"|"zoom",sliderRevealEffect:(data?.slider_reveal_effect??FALLBACK_SITE_SETTINGS.slider_reveal_effect) as "rise"|"fade"|"zoom"|"none",sliderPauseOnHover:data?.slider_pause_on_hover??FALLBACK_SITE_SETTINGS.slider_pause_on_hover}} /></section>
    <section className="adminDashboardCard" style={{marginTop:18}}><h2>Slider Görselleri</h2><p className="adminLead">Görsel ekleme, sıralama, gizleme ve silme işlemlerini ayrı içerik ekranından yönet.</p><Link className="adminButton adminButtonSecondary" href="/admin/content">Slider görsellerini yönet</Link></section>
  </main>;
}
