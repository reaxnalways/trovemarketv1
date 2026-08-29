export type ImportedListing = {
  title: string;
  brand: string | null;
  model: string | null;
  price: number | null;
  condition: "new" | "used" | "refurbished" | null;
  storage: string | null;
  color: string | null;
  batteryHealth: string | null;
  description: string | null;
  categorySlug: "telefon" | "laptop-bilgisayar" | "bilgisayar-parcalari";
};

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

type JsonRecord = Record<string, unknown>;

function decodeHtml(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function cleanText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = decodeHtml(value).replace(/\s+/g, " ").trim();
  return cleaned || null;
}

function parseMeta(html: string): Map<string, string> {
  const result = new Map<string, string>();
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];

  for (const tag of tags) {
    const attrs = new Map<string, string>();
    for (const match of tag.matchAll(/([:\w-]+)\s*=\s*["']([^"']*)["']/g)) {
      attrs.set(match[1].toLowerCase(), decodeHtml(match[2]));
    }

    const key = attrs.get("property") ?? attrs.get("name") ?? attrs.get("itemprop");
    const content = attrs.get("content");
    if (key && content) result.set(key.toLowerCase(), content);
  }

  return result;
}

function findJsonLdProduct(value: unknown): JsonRecord | null {
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findJsonLdProduct(item);
      if (found) return found;
    }
    return null;
  }

  const record = value as JsonRecord;
  const type = record["@type"];
  if (type === "Product" || (Array.isArray(type) && type.includes("Product"))) return record;

  for (const child of Object.values(record)) {
    const found = findJsonLdProduct(child);
    if (found) return found;
  }
  return null;
}

function extractJsonLd(html: string): unknown[] {
  const values: unknown[] = [];
  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      values.push(JSON.parse(match[1].trim()));
    } catch {
      // Ignore malformed blocks and continue with metadata fallbacks.
    }
  }
  return values;
}

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : null;
}

function propertyValue(product: JsonRecord | null, names: string[]): string | null {
  const properties = product?.additionalProperty;
  if (!Array.isArray(properties)) return null;

  const wanted = names.map((name) => name.toLocaleLowerCase("tr-TR"));
  for (const item of properties) {
    const record = asRecord(item);
    const name = cleanText(record?.name)?.toLocaleLowerCase("tr-TR");
    if (!name || !wanted.includes(name)) continue;
    return cleanText(record?.value);
  }
  return null;
}

function parsePrice(value: unknown): number | null {
  const text = typeof value === "number" ? String(value) : cleanText(value);
  if (!text) return null;

  let normalized = text.replace(/[^\d,.-]/g, "");
  if (/^\d{1,3}(\.\d{3})+$/.test(normalized)) normalized = normalized.replace(/\./g, "");
  else if (/^\d{1,3}(,\d{3})+$/.test(normalized)) normalized = normalized.replace(/,/g, "");
  else normalized = normalized.replace(/\.(?=.*\.)/g, "").replace(",", ".");

  const price = Number(normalized);
  return Number.isFinite(price) && price >= 0 ? price : null;
}

function inferCondition(text: string, explicit: string | null): ImportedListing["condition"] {
  const source = `${explicit ?? ""} ${text}`.toLocaleLowerCase("tr-TR");
  if (source.includes("yenilenmiş") || source.includes("refurbished")) return "refurbished";
  if (source.includes("2. el") || source.includes("ikinci el") || source.includes("kullanılmış")) return "used";
  if (source.includes("sıfır") || source.includes("yeni")) return "new";
  return null;
}

function inferCategory(text: string): ImportedListing["categorySlug"] {
  const source = text.toLocaleLowerCase("tr-TR");

  if (["ekran kartı", "işlemci", "anakart", "ram", "ssd", "harddisk", "hard disk", "bilgisayar parçası", "bilgisayar bileşeni"].some((term) => source.includes(term))) {
    return "bilgisayar-parcalari";
  }
  if (["cep telefonu", "akıllı telefon", "iphone", "smartphone", "telefon"].some((term) => source.includes(term))) {
    return "telefon";
  }
  if (["macbook", "laptop", "notebook", "dizüstü", "masaüstü bilgisayar", "all in one", "bilgisayar"].some((term) => source.includes(term))) {
    return "laptop-bilgisayar";
  }

  throw new Error("Sahibinden ilan kategorisi Trove kategorileriyle eşleştirilemedi.");
}

function inferBrand(title: string, explicit: string | null): string | null {
  if (explicit) return explicit;
  const brands = ["Apple", "Samsung", "Xiaomi", "Huawei", "Oppo", "Vivo", "Realme", "Honor", "Asus", "Lenovo", "HP", "Dell", "Acer", "MSI", "Monster", "Casper", "Gigabyte"];
  return brands.find((brand) => new RegExp(`\\b${brand}\\b`, "i").test(title)) ?? null;
}

function extractBreadcrumbText(values: unknown[]): string {
  const names: string[] = [];
  const visit = (value: unknown) => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) return value.forEach(visit);
    const record = value as JsonRecord;
    if (record["@type"] === "BreadcrumbList" && Array.isArray(record.itemListElement)) {
      for (const entry of record.itemListElement) {
        const entryRecord = asRecord(entry);
        const itemRecord = asRecord(entryRecord?.item);
        const name = cleanText(entryRecord?.name) ?? cleanText(itemRecord?.name);
        if (name) names.push(name);
      }
    }
    Object.values(record).forEach(visit);
  };
  values.forEach(visit);
  return names.join(" ");
}

export function assertSahibindenUrl(value: string): URL {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("Geçerli bir Sahibinden ilan linki girilmelidir.");
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (url.protocol !== "https:" || host !== "sahibinden.com") {
    throw new Error("Yalnızca sahibinden.com ilan linkleri destekleniyor.");
  }
  return url;
}

export function parseSahibindenHtml(html: string): ImportedListing {
  const meta = parseMeta(html);
  const jsonValues = extractJsonLd(html);
  const product = jsonValues.map(findJsonLdProduct).find(Boolean) ?? null;

  const rawTitle = cleanText(product?.name) ?? cleanText(meta.get("og:title")) ?? cleanText(meta.get("twitter:title"));
  if (!rawTitle) throw new Error("İlan başlığı Sahibinden sayfasından okunamadı.");
  const title = rawTitle.replace(/\s*[-|]\s*sahibinden\.com.*$/i, "").trim();

  const description = cleanText(product?.description) ?? cleanText(meta.get("og:description")) ?? cleanText(meta.get("description"));
  const brandRecord = asRecord(product?.brand);
  const brandExplicit = cleanText(brandRecord?.name) ?? cleanText(product?.brand) ?? propertyValue(product, ["Marka"]);
  const model = cleanText(product?.model) ?? propertyValue(product, ["Model"]);
  const storage = propertyValue(product, ["Dahili Hafıza", "Hafıza", "Depolama"]);
  const color = propertyValue(product, ["Renk"]);
  const batteryHealth = propertyValue(product, ["Pil Sağlığı", "Batarya Sağlığı"]);
  const conditionText = propertyValue(product, ["Durumu", "Cihaz Durumu"]);
  const offers = asRecord(product?.offers);
  const price = parsePrice(offers?.price ?? meta.get("product:price:amount") ?? meta.get("price"));
  const breadcrumb = extractBreadcrumbText(jsonValues);
  const categoryText = [title, description ?? "", breadcrumb].join(" ");

  return {
    title,
    brand: inferBrand(title, brandExplicit),
    model,
    price,
    condition: inferCondition(categoryText, conditionText),
    storage,
    color,
    batteryHealth,
    description,
    categorySlug: inferCategory(categoryText),
  };
}

export async function importSahibindenListing(sourceUrl: string, fetcher: FetchLike = fetch): Promise<ImportedListing> {
  const url = assertSahibindenUrl(sourceUrl);
  const response = await fetcher(url.toString(), {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "Mozilla/5.0 (compatible; TroveTeknoloji/1.0; +https://trovemarket.local)",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Sahibinden ilanı okunamadı (HTTP ${response.status}).`);
  }

  const html = await response.text();
  if (!html.trim()) throw new Error("Sahibinden ilanından içerik alınamadı.");
  return parseSahibindenHtml(html);
}
