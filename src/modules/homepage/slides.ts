import { createPublicSupabaseClient } from "../../lib/supabase/public-client";

export type HomepageSlideSection = "campaigns" | "phones" | "computers" | "wearables" | "accessories";
export type HomepageSlideTransition = "slide" | "fade" | "zoom" | "flip" | "blur" | "stack";

export type HomepageSlide = {
  id: string;
  section: HomepageSlideSection;
  title: string | null;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
  transition_effect: HomepageSlideTransition | null;
};

export async function listPublicHomepageSlides(): Promise<HomepageSlide[]> {
  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase
    .from("homepage_slides")
    .select("id,section,title,subtitle,image_url,link_url,sort_order,is_active,transition_effect")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return [];
  return (data ?? []) as HomepageSlide[];
}
