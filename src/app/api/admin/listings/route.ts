import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { isAdminEmail } from "@/modules/auth/admin-access";
import { buildDraftListing } from "@/modules/listings/create-listing";

export const dynamic = "force-dynamic";

type ManualListingPayload = {
  categoryId?: string;
  title?: string;
  brand?: string;
  model?: string;
  price?: string;
  condition?: string;
  storage?: string;
  color?: string;
  batteryHealth?: string;
  deviceRegion?: string;
  description?: string;
  publicationStatus?: string;
  isFeatured?: boolean;
  images?: string[];
};

function validateImageUrls(imageUrls: string[]): string[] {
  const normalized = imageUrls.map((url) => url.trim()).filter(Boolean);
  if (normalized.length === 0) throw new Error("En az bir ürün görseli yüklenmelidir.");
  if (normalized.length > 12) throw new Error("Bir ilana en fazla 12 görsel eklenebilir.");

  for (const value of normalized) {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new Error("Yüklenen görsellerden biri geçersiz.");
    }
    if (url.protocol !== "https:" || !url.pathname.includes("/storage/v1/object/public/product-images/")) {
      throw new Error("Görsel yalnızca Trove ürün deposundan kullanılabilir.");
    }
  }

  return normalized;
}

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) return errorResponse("Oturum bulunamadı. Lütfen yeniden giriş yap.", 401);
    if (!isAdminEmail(userData.user.email)) return errorResponse("Bu işlem için admin yetkisi gerekiyor.", 403);

    let input: ManualListingPayload;
    try {
      input = await request.json() as ManualListingPayload;
    } catch {
      return errorResponse("İstek verisi okunamadı.");
    }

    if (!input.categoryId || !input.title?.trim()) return errorResponse("Kategori ve başlık zorunludur.");

    const images = validateImageUrls(Array.isArray(input.images) ? input.images : []);
    const deviceRegion = ["tr", "passport", "international"].includes(input.deviceRegion ?? "")
      ? input.deviceRegion as "tr" | "passport" | "international"
      : undefined;

    const listing = buildDraftListing({
      categoryId: input.categoryId,
      title: input.title,
      brand: input.brand,
      model: input.model,
      price: input.price,
      condition: input.condition,
      storage: input.storage,
      color: input.color,
      batteryHealth: input.batteryHealth,
      deviceRegion,
      description: input.description,
      images,
    });

    const publicationStatus = input.publicationStatus === "published" ? "published" : "draft";
    const { data, error } = await supabase
      .from("products")
      .insert({ ...listing, publication_status: publicationStatus, is_featured: input.isFeatured === true })
      .select("id,product_code")
      .single();

    if (error || !data) {
      console.error("manual listing insert failed", {
        code: error?.code,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
      });
      return errorResponse(
        error?.message ? `İlan kaydedilemedi: ${error.message}` : "İlan kaydedilemedi.",
        500,
      );
    }

    return NextResponse.json(
      { ok: true, id: data.id, productCode: data.product_code },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("manual listing api failed", error);
    return errorResponse(error instanceof Error ? error.message : "İlan oluşturulurken beklenmeyen bir hata oluştu.", 500);
  }
}
