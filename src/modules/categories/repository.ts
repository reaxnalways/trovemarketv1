import { createPublicSupabaseClient } from "../../lib/supabase/public-client";
import { resolvePublicCategories } from "./public-categories";

export async function listPublicCategories() {
  const supabase = createPublicSupabaseClient();

  return resolvePublicCategories(async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("id,name,slug,description")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    return { data, error };
  });
}

export async function getPublicCategoryBySlug(slug: string) {
  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,slug,description")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw new Error(`Unable to load public category: ${error.message}`);
  return data;
}
