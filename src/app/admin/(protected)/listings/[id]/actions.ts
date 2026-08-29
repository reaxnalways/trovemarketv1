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

export async function updateListing(formData: FormData) {
  const productId = optional(formData.get("productId"));
  const title = optional(formData.get("title"));
  if (!productId || !title) return;

  const rawPrice = optional(formData.get("price"));
  const rawBattery = optional(formData.get("batteryHealth"));
  const price = rawPrice === null ? null : Number(rawPrice.replace(",", "."));
  const batteryHealth = rawBattery === null ? null : Number(rawBattery);
  const deviceRegion = optional(formData.get("deviceRegion"));

  if (price !== null && (!Number.isFinite(price) || price < 0)) redirect(`/admin/listings/${productId}?error=${encodeURIComponent("Geçersiz fiyat.")}`);
  if (batteryHealth !== null && (!Number.isInteger(batteryHealth) || batteryHealth < 0 || batteryHealth > 100)) redirect(`/admin/listings/${productId}?error=${encodeURIComponent("Pil sağlığı 0-100 arasında olmalıdır.")}`);
  if (deviceRegion !== null && !["tr", "passport", "international"].includes(deviceRegion)) redirect(`/admin/listings/${productId}?error=${encodeURIComponent("Geçersiz cihaz kayıt türü.")}`);

  const updates = {
    title,
    brand: optional(formData.get("brand")),
    model: optional(formData.get("model")),
    price,
    condition: optional(formData.get("condition")),
    storage: optional(formData.get("storage")),
    color: optional(formData.get("color")),
    battery_health: batteryHealth,
    device_region: deviceRegion,
    description: optional(formData.get("description")),
    source_url: optional(formData.get("sourceUrl")),
    stock_status: optional(formData.get("stockStatus")) ?? "in_stock",
    publication_status: optional(formData.get("publicationStatus")) ?? "draft",
    is_featured: formData.get("isFeatured") === "on",
  };

  const supabase = await requireAdmin();
  const { error } = await supabase.from("products").update(updates).eq("id", productId);
  if (error) redirect(`/admin/listings/${productId}?error=${encodeURIComponent("Ürün kaydedilemedi.")}`);

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/listings");
  revalidatePath(`/admin/listings/${productId}`);
  revalidatePath(`/admin/listings/${productId}/label`);
  redirect(`/admin/listings/${productId}?saved=1`);
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
