import Link from "next/link";
import { getPublicSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import type { HomepageSlide } from "@/modules/homepage/slides";
import { HomepageSliderManager } from "./homepage-slider-manager";

export default async function ContentPage() {
  const supabase = await createSupabaseServerClient();
  const { url, publishableKey } = getPublicSupabaseConfig();
  const { data } = await supabase
    .from("homepage_slides")
    .select("id,section,title,subtitle,image_url,link_url,sort_order,is_active,transition_effect")
    .order("section")
    .order("sort_order", { ascending: true });

  return (
    <main className="adminShell adminShellWide">
      <div className="adminPageHeader">
        <div><h1 className="adminPageTitle">Ana Sayfa Sliderları</h1></div>
        <div className="adminTopbarActions"><Link className="adminButton adminButtonSecondary" href="/" target="_blank">Ana sayfayı aç</Link></div>
      </div>
      <HomepageSliderManager
        initialSlides={(data ?? []) as HomepageSlide[]}
        supabasePublishableKey={publishableKey}
        supabaseUrl={url}
      />
    </main>
  );
}
