"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { isAdminEmail } from "@/modules/auth/admin-access";

async function getAdminContext() {
  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user || !isAdminEmail(userData.user.email)) redirect("/admin/login");
  return supabase;
}

function requiredCode(formData: FormData) {
  const code = String(formData.get("productCode") ?? "").trim();
  if (!/^\d{11}$/.test(code)) throw new Error("Geçersiz ürün kodu.");
  return code;
}

function optionalText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

export async function updateScannedProduct(formData: FormData) {
  const supabase = await getAdminContext();

  let productCode: string;
  try {
    productCode = requiredCode(formData);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ürün güncellenemedi.";
    redirect(`/admin/scanner?error=${encodeURIComponent(message)}`);
  }

  const title = String(formData.get("title") ?? "").trim();
  const rawPrice = String(formData.get("price") ?? "").trim().replace(",", ".");
  const rawBatteryHealth = String(formData.get("batteryHealth") ?? "").trim();
  const price = rawPrice === "" ? null : Number(rawPrice);
  const batteryHealth = rawBatteryHealth === "" ? null : Number(rawBatteryHealth);
  const condition = String(formData.get("condition") ?? "");
  const deviceRegion = String(formData.get("deviceRegion") ?? "");
  const stockStatus = String(formData.get("stockStatus") ?? "");
  const publicationStatus = String(formData.get("publicationStatus") ?? "");

  if (title.length < 3) redirect(`/admin/scanner?code=${productCode}&error=${encodeURIComponent("Başlık en az 3 karakter olmalıdır.")}`);
  if (price !== null && (!Number.isFinite(price) || price < 0)) redirect(`/admin/scanner?code=${productCode}&error=${encodeURIComponent("Fiyat geçersiz.")}`);
  if (batteryHealth !== null && (!Number.isInteger(batteryHealth) || batteryHealth < 0 || batteryHealth > 100)) redirect(`/admin/scanner?code=${productCode}&error=${encodeURIComponent("Pil sağlığı 0-100 arasında olmalıdır.")}`);
  if (!["", "new", "used", "refurbished"].includes(condition)) redirect(`/admin/scanner?code=${productCode}&error=${encodeURIComponent("Ürün durumu geçersiz.")}`);
  if (!["", "tr", "passport", "international"].includes(deviceRegion)) redirect(`/admin/scanner?code=${productCode}&error=${encodeURIComponent("Cihaz bölgesi geçersiz.")}`);
  if (!["in_stock", "reserved", "sold", "out_of_stock"].includes(stockStatus)) redirect(`/admin/scanner?code=${productCode}&error=${encodeURIComponent("Stok durumu geçersiz.")}`);
  if (!["draft", "published", "hidden"].includes(publicationStatus)) redirect(`/admin/scanner?code=${productCode}&error=${encodeURIComponent("Yayın durumu geçersiz.")}`);

  const { error } = await supabase
    .from("products")
    .update({
      title,
      brand: optionalText(formData, "brand"),
      model: optionalText(formData, "model"),
      storage: optionalText(formData, "storage"),
      color: optionalText(formData, "color"),
      battery_health: batteryHealth,
      condition: condition || null,
      device_region: deviceRegion || null,
      price,
      stock_status: stockStatus,
      publication_status: publicationStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("product_code", productCode);

  if (error) redirect(`/admin/scanner?code=${productCode}&error=${encodeURIComponent("Ürün güncellenemedi.")}`);
  redirect(`/admin/scanner?code=${productCode}&updated=1`);
}
