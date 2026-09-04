export type DraftListingInput = {
  categoryId: string;
  title: string;
  brand?: string;
  model?: string;
  price?: string;
  condition?: string;
  storage?: string;
  color?: string;
  batteryHealth?: string;
  deviceRegion?: "tr" | "passport" | "international";
  description?: string;
  sourceUrl?: string;
  images?: string[];
  attributes?: Record<string, string>;
};

export type DraftListingRecord = {
  category_id: string;
  title: string;
  brand: string | null;
  model: string | null;
  price: number | null;
  condition: "new" | "used" | "refurbished" | null;
  storage: string | null;
  color: string | null;
  battery_health: string | null;
  device_region: "tr" | "passport" | "international" | null;
  description: string | null;
  source_url: string | null;
  images: string[];
  attributes: Record<string, string>;
  stock_status: "in_stock";
  publication_status: "draft";
};

const CONDITIONS = new Set(["new", "used", "refurbished"]);
const DEVICE_REGIONS = new Set(["tr", "passport", "international"]);

function optionalText(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function parsePrice(value: string | undefined): number | null {
  const normalized = value?.trim().replace(",", ".");
  if (!normalized) return null;

  const price = Number(normalized);
  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Fiyat geçerli ve sıfırdan büyük olmalıdır.");
  }

  return price;
}

function normalizeImages(images: string[] | undefined): string[] {
  return (images ?? []).map((image) => image.trim()).filter(Boolean);
}

function normalizeAttributes(attributes: Record<string, string> | undefined): Record<string, string> {
  return Object.fromEntries(
    Object.entries(attributes ?? {})
      .map(([key, value]) => [key.trim(), String(value).trim()] as const)
      .filter(([key, value]) => key && value),
  );
}

export function buildDraftListing(input: DraftListingInput): DraftListingRecord {
  const categoryId = input.categoryId.trim();
  const title = input.title.trim();

  if (!categoryId) {
    throw new Error("Kategori seçilmelidir.");
  }

  if (title.length < 3) {
    throw new Error("Başlık en az 3 karakter olmalıdır.");
  }

  const condition = optionalText(input.condition);
  if (condition && !CONDITIONS.has(condition)) {
    throw new Error("Geçersiz ürün durumu.");
  }

  const deviceRegion = input.deviceRegion ?? null;
  if (deviceRegion && !DEVICE_REGIONS.has(deviceRegion)) {
    throw new Error("Geçersiz cihaz kayıt türü.");
  }

  return {
    category_id: categoryId,
    title,
    brand: optionalText(input.brand),
    model: optionalText(input.model),
    price: parsePrice(input.price),
    condition: condition as DraftListingRecord["condition"],
    storage: optionalText(input.storage),
    color: optionalText(input.color),
    battery_health: optionalText(input.batteryHealth),
    device_region: deviceRegion,
    description: optionalText(input.description),
    source_url: optionalText(input.sourceUrl),
    images: normalizeImages(input.images),
    attributes: normalizeAttributes(input.attributes),
    stock_status: "in_stock",
    publication_status: "draft",
  };
}
