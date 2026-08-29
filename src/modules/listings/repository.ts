import { createPublicSupabaseClient } from "../../lib/supabase/public-client";
import { resolvePublicListings, type ListingQueryResult, type PublicListing } from "./public-listings";

const PUBLIC_LISTING_FIELDS = [
  "id", "product_code", "title", "brand", "model", "price", "images", "stock_status", "is_featured", "created_at",
].join(",");

const PUBLIC_LISTING_DETAIL_FIELDS = [
  "id", "product_code", "title", "brand", "model", "price", "condition", "storage", "color", "battery_health", "description", "images", "stock_status", "created_at",
].join(",");

function asListingQueryResult(data: unknown, error: { message: string } | null): ListingQueryResult {
  return { data: data as PublicListing[] | null, error };
}

export async function listFeaturedListings(limit = 6) {
  const supabase = createPublicSupabaseClient();
  return resolvePublicListings(async () => {
    const { data, error } = await supabase.from("products").select(PUBLIC_LISTING_FIELDS).eq("publication_status", "published").eq("is_featured", true).order("created_at", { ascending: false }).limit(limit);
    return asListingQueryResult(data, error);
  });
}

export async function listRecentListings(limit = 8) {
  const supabase = createPublicSupabaseClient();
  return resolvePublicListings(async () => {
    const { data, error } = await supabase.from("products").select(PUBLIC_LISTING_FIELDS).eq("publication_status", "published").order("created_at", { ascending: false }).limit(limit);
    return asListingQueryResult(data, error);
  });
}

export async function listListingsByCategory(categoryId: string, limit = 24) {
  const supabase = createPublicSupabaseClient();
  return resolvePublicListings(async () => {
    const { data, error } = await supabase
      .from("products")
      .select(PUBLIC_LISTING_FIELDS)
      .eq("category_id", categoryId)
      .eq("publication_status", "published")
      .order("created_at", { ascending: false })
      .limit(limit);
    return asListingQueryResult(data, error);
  });
}

export type PublicListingDetail = {
  id: string;
  product_code: string;
  title: string;
  brand: string | null;
  model: string | null;
  price: number | null;
  condition: "new" | "used" | "refurbished" | null;
  storage: string | null;
  color: string | null;
  battery_health: string | null;
  description: string | null;
  images: string[];
  stock_status: "in_stock" | "reserved" | "sold" | "out_of_stock";
  created_at: string;
};

export async function getPublicListingByProductCode(productCode: string): Promise<PublicListingDetail | null> {
  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select(PUBLIC_LISTING_DETAIL_FIELDS)
    .eq("product_code", productCode.trim().toUpperCase())
    .eq("publication_status", "published")
    .maybeSingle();

  if (error) throw new Error(`Unable to load public listing: ${error.message}`);
  return data as PublicListingDetail | null;
}
