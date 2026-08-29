export type PublicListing = {
  id: string;
  product_code: string;
  title: string;
  brand: string | null;
  model: string | null;
  price: number | null;
  images: string[];
  stock_status: "in_stock" | "reserved" | "sold" | "out_of_stock";
  is_featured: boolean;
  created_at: string;
};

export type ListingQueryResult = {
  data: PublicListing[] | null;
  error: { message: string } | null;
};

export async function resolvePublicListings(
  query: () => Promise<ListingQueryResult>,
): Promise<PublicListing[]> {
  const { data, error } = await query();

  if (error) {
    throw new Error(`Unable to load public listings: ${error.message}`);
  }

  return data ?? [];
}

export function formatListingPrice(price: number | null): string {
  if (price === null) return "Fiyat için iletişime geç";

  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(price);
}
