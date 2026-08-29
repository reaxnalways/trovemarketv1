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
