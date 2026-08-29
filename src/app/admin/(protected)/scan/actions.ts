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

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

function returnTo(code: string, state: string) {
  redirect(`/admin/scan?code=${encodeURIComponent(code)}&${state}=1`);
}

export async function updateScannedProductPrice(formData: FormData) {
  const productId = value(formData, "productId");
  const code = value(formData, "code");
  const rawPrice = value(formData, "price").replace(",", ".");
  const price = Number(rawPrice);

  if (!productId || !code || !rawPrice || !Number.isFinite(price) || price < 0) {
    redirect(`/admin/scan?code=${encodeURIComponent(code)}&error=${encodeURIComponent("Geçerli bir fiyat girin.")}`);
  }

  const supabase = await requireAdmin();
  const { error } = await supabase.from("products").update({ price }).eq("id", productId);
  if (error) redirect(`/admin/scan?code=${encodeURIComponent(code)}&error=${encodeURIComponent("Fiyat güncellenemedi.")}`);

  revalidatePath("/");
  revalidatePath("/admin/listings");
  revalidatePath(`/admin/listings/${productId}`);
  returnTo(code, "priceSaved");
}

export async function updateScannedProductStatus(formData: FormData) {
  const productId = value(formData, "productId");
  const code = value(formData, "code");
  const action = value(formData, "action");
  if (!productId || !code) return;

  const updates =
    action === "sold" ? { stock_status: "sold" } :
    action === "in_stock" ? { stock_status: "in_stock" } :
    action === "hide" ? { publication_status: "hidden" } :
    action === "publish" ? { publication_status: "published", stock_status: "in_stock" } : null;

  if (!updates) redirect(`/admin/scan?code=${encodeURIComponent(code)}&error=${encodeURIComponent("Geçersiz hızlı işlem.")}`);

  const supabase = await requireAdmin();
  const { error } = await supabase.from("products").update(updates).eq("id", productId);
  if (error) redirect(`/admin/scan?code=${encodeURIComponent(code)}&error=${encodeURIComponent("Ürün durumu güncellenemedi.")}`);

  revalidatePath("/");
  revalidatePath("/admin/listings");
  revalidatePath(`/admin/listings/${productId}`);
  returnTo(code, "statusSaved");
}
