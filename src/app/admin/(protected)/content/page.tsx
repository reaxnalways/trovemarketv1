import Link from "next/link";
import { getPublicSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import type { HomepageSlide } from "@/modules/homepage/slides";
import { HomepageSliderManager } from "./homepage-slider-manager";

export default async function ContentPage() {
  const supabase = await createSupabaseServerClient();
  const { url, publishableKey } = getPublicSupabaseConfig();
  const [{ data: slides }, { data: products }] = await Promise.all([
    supabase
      .from("homepage_slides")
      .select("id,section,title,subtitle,image_url,link_url,sort_order,is_active,transition_effect")
      .order("section")
      .order("sort_order", { ascending: true }),
    supabase
      .from("products")
      .select("product_code,title,brand,model")
      .eq("publication_status", "published")
      .order("created_at", { ascending: false })
      .limit(300),
  ]);

  return (
    <main className="adminShell adminShellWide">
      <div className="adminPageHeader">
        <div><h1 className="adminPageTitle">Ana Sayfa Sliderları</h1></div>
        <div className="adminTopbarActions"><Link className="adminButton adminButtonSecondary" href="/" target="_blank">Ana sayfayı aç</Link></div>
      </div>
      <HomepageSliderManager
        initialSlides={(slides ?? []) as HomepageSlide[]}
        products={(products ?? []).map((product) => ({
          productCode: String(product.product_code ?? ""),
          title: String(product.title ?? "Ürün"),
          brand: String(product.brand ?? ""),
          model: String(product.model ?? ""),
        })).filter((product) => product.productCode)}
        supabasePublishableKey={publishableKey}
        supabaseUrl={url}
      />
    </main>
  );
}
