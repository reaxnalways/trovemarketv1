"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { isAdminEmail } from "@/modules/auth/admin-access";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user || !isAdminEmail(data.user.email)) redirect("/admin/login");
  return supabase;
}

function optional(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized || null;
}

function validateProductImages(imageUrls: string[]) {
  const images = imageUrls.map((value) => value.trim()).filter(Boolean);
  if (images.length === 0) throw new Error("Üründe en az bir görsel olmalıdır.");
  if (images.length > 12) throw new Error("Bir üründe en fazla 12 görsel olabilir.");

  for (const value of images) {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new Error("Görsellerden biri geçersiz.");
    }
    if (url.protocol !== "https:" || !url.pathname.includes("/storage/v1/object/public/product-images/")) {
      throw new Error("Yalnızca Trove ürün deposundaki görseller kullanılabilir.");
    }
  }

  return images;
}

function revalidateProductPaths(productId: string) {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/listings");
  revalidatePath(`/admin/listings/${productId}`);
  revalidatePath(`/admin/listings/${productId}/label`);
}

export async function updateListingImages(productId: string, imageUrls: string[]) {
  const normalizedProductId = productId.trim();
  if (!normalizedProductId) throw new Error("Ürün kimliği eksik.");
  const images = validateProductImages(imageUrls);
  const supabase = await requireAdmin();
  const { error } = await supabase.from("products").update({ images }).eq("id", normalizedProductId);
  if (error) throw new Error("Ürün görselleri kaydedilemedi.");

  revalidateProductPaths(normalizedProductId);
}

export async function updateListing(formData: FormData) {
  const productId = optional(formData.get("productId"));
  const title = optional(formData.get("title"));
  if (!productId || !title) return;

  const rawBattery = optional(formData.get("batteryHealth"));
  const batteryHealth = rawBattery === null ? null : Number(rawBattery);
  const deviceRegion = optional(formData.get("deviceRegion"));
  const intent = optional(formData.get("actionIntent"));

  if (batteryHealth !== null && (!Number.isInteger(batteryHealth) || batteryHealth < 0 || batteryHealth > 100)) redirect(`/admin/listings/${productId}?error=${encodeURIComponent("Pil sağlığı 0-100 arasında olmalıdır.")}`);
  if (deviceRegion !== null && !["tr", "passport", "international"].includes(deviceRegion)) redirect(`/admin/listings/${productId}?error=${encodeURIComponent("Geçersiz cihaz kayıt türü.")}`);

  const publicationStatus = intent === "publish"
    ? "published"
    : optional(formData.get("publicationStatus")) ?? "draft";

  const updates = {
    title,
    brand: optional(formData.get("brand")),
    model: optional(formData.get("model")),
    condition: optional(formData.get("condition")),
    storage: optional(formData.get("storage")),
    color: optional(formData.get("color")),
    battery_health: batteryHealth,
    device_region: deviceRegion,
    description: optional(formData.get("description")),
    source_url: optional(formData.get("sourceUrl")),
    stock_status: optional(formData.get("stockStatus")) ?? "in_stock",
    publication_status: publicationStatus,
    is_featured: formData.get("isFeatured") === "on",
  };

  const supabase = await requireAdmin();
  const { error } = await supabase.from("products").update(updates).eq("id", productId);
  if (error) redirect(`/admin/listings/${productId}?error=${encodeURIComponent("Ürün kaydedilemedi.")}`);

  revalidateProductPaths(productId);
  redirect(`/admin/listings/${productId}?saved=1${intent === "publish" ? "&published=1" : ""}`);
}

export async function quickUpdateListingStatus(formData: FormData) {
  const productId = optional(formData.get("productId"));
  const intent = optional(formData.get("quickIntent"));
  if (!productId || !intent) return;

  let updates: { stock_status?: string; publication_status?: string };
  let result = "updated";

  if (intent === "sold") {
    updates = { stock_status: "sold" };
    result = "sold";
  } else if (intent === "hide") {
    updates = { publication_status: "hidden" };
    result = "hidden";
  } else if (intent === "in_stock") {
    updates = { stock_status: "in_stock" };
    result = "in_stock";
  } else if (intent === "publish") {
    updates = { publication_status: "published" };
    result = "published";
  } else {
    redirect(`/admin/listings/${productId}?error=${encodeURIComponent("Geçersiz hızlı işlem.")}`);
  }

  const supabase = await requireAdmin();
  const { error } = await supabase.from("products").update(updates).eq("id", productId);
  if (error) redirect(`/admin/listings/${productId}?error=${encodeURIComponent("Hızlı işlem uygulanamadı.")}`);

  revalidateProductPaths(productId);
  redirect(`/admin/listings/${productId}?quick=${result}`);
}

export async function deleteListing(formData: FormData) {
  const productId = optional(formData.get("productId"));
  if (!productId) return;
  const supabase = await requireAdmin();
  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) redirect(`/admin/listings/${productId}?error=${encodeURIComponent("Ürün silinemedi.")}`);
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/listings");
  redirect("/admin/listings?deleted=1");
}
