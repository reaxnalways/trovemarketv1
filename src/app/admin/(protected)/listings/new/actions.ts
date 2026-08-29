"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { isAdminEmail } from "@/modules/auth/admin-access";
import { inferDeviceRegion } from "@/modules/importers/device-registration";
import { assertSahibindenUrl, parseSahibindenText } from "@/modules/importers/sahibinden";
import { buildDraftListing } from "@/modules/listings/create-listing";

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

export async function createImportedDraftListing(sourceUrl: string, sourceText: string, imageUrls: string[]) {
  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user || !isAdminEmail(userData.user.email)) {
    redirect("/admin/login");
  }

  let images: string[];
  let imported;
  try {
    assertSahibindenUrl(sourceUrl);
    images = validateImageUrls(imageUrls);
    imported = parseSahibindenText(sourceText);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sahibinden ilanı içe aktarılamadı.";
    redirect(`/admin/listings/new?error=${encodeURIComponent(message)}`);
  }

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", imported.categorySlug)
    .eq("is_active", true)
    .single();

  if (categoryError || !category) {
    redirect(`/admin/listings/new?error=${encodeURIComponent("İlan kategorisi Trove tarafında bulunamadı.")}`);
  }

  const listing = buildDraftListing({
    categoryId: category.id,
    title: imported.title,
    brand: imported.brand ?? undefined,
    model: imported.model ?? undefined,
    price: imported.price === null ? undefined : String(imported.price),
    condition: imported.condition ?? undefined,
    storage: imported.storage ?? undefined,
    color: imported.color ?? undefined,
    batteryHealth: imported.batteryHealth ?? undefined,
    deviceRegion: inferDeviceRegion(sourceText) ?? undefined,
    description: imported.description ?? undefined,
    sourceUrl,
    images,
  });

  const { data, error } = await supabase
    .from("products")
    .insert(listing)
    .select("id,product_code")
    .single();

  if (error || !data) {
    redirect(`/admin/listings/new?error=${encodeURIComponent("İlan bilgileri ayrıştırıldı ancak taslak kaydedilemedi.")}`);
  }

  redirect(`/admin/listings/${data.id}?created=1`);
}
