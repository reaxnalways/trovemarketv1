import { createPublicSupabaseClient } from "../../lib/supabase/public-client";
import { resolvePublicListings } from "./public-listings";

const PUBLIC_LISTING_FIELDS = [
  "id",
  "product_code",
  "title",
  "brand",
  "model",
  "price",
  "images",
  "stock_status",
  "is_featured",
  "created_at",
].join(",");

export async function listFeaturedListings(limit = 6) {
  const supabase = createPublicSupabaseClient();

  return resolvePublicListings(async () => {
    const { data, error } = await supabase
      .from("products")
      .select(PUBLIC_LISTING_FIELDS)
      .eq("publication_status", "published")
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    return { data, error };
  });
}

export async function listRecentListings(limit = 8) {
  const supabase = createPublicSupabaseClient();

  return resolvePublicListings(async () => {
    const { data, error } = await supabase
      .from("products")
      .select(PUBLIC_LISTING_FIELDS)
      .eq("publication_status", "published")
      .order("created_at", { ascending: false })
      .limit(limit);

    return { data, error };
  });
}
