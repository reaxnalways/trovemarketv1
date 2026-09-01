import Link from "next/link";
import { getPublicSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import type { HomepageSlide } from "@/modules/homepage/slides";
import { HomepageSliderManager } from "./homepage-slider-manager";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ContentPage() {
  const supabase = await createSupabaseServerClient();
  const { url, publishableKey } = getPublicSupabaseConfig();
  const [{ data: slides }, { data: products }, { data: categories }] = await Promise.all([
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
    supabase
      .from("categories")
      .select("id,name,slug,is_active,sort_order")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
  ]);

  return (
    <main className="adminShell adminShellWide">
      <div className="adminPageHeader">
        <div><h1 className="adminPageTitle">Ana Sayfa Sliderları</h1></div>
        <div className="adminTopbarActions"><Link className="adminButton adminButtonSecondary" href="/" target="_blank">Ana sayfayı aç</Link></div>
      </div>
      <HomepageSliderManager
        initialSlides={(slides ?? []) as HomepageSlide[]}
        categories={(categories ?? []).map((category) => ({
          id: String(category.id),
          name: String(category.name),
          slug: String(category.slug),
          isActive: Boolean(category.is_active),
        }))}
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
