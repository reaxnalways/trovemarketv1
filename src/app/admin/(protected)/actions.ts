"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { isAdminEmail } from "@/modules/auth/admin-access";
import { buildPublicationUpdate } from "@/modules/listings/publication";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user || !isAdminEmail(data.user.email)) redirect("/admin/login");
  return supabase;
}

export async function logoutAdmin() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function publishListing(formData: FormData) {
  const productId = formData.get("productId");
  if (typeof productId !== "string" || !productId) return;
  const supabase = await requireAdmin();
  const { error } = await supabase.from("products").update(buildPublicationUpdate("published")).eq("id", productId);
  if (error) redirect(`/admin?error=${encodeURIComponent("İlan yayınlanamadı.")}`);
  revalidatePath("/"); revalidatePath("/admin"); revalidatePath("/admin/listings");
  redirect("/admin?published=1");
}

export async function updateListingStatus(formData: FormData) {
  const productId = formData.get("productId");
  const action = formData.get("action");
  if (typeof productId !== "string" || typeof action !== "string") return;
  const supabase = await requireAdmin();
  const updates: Record<string, string | boolean> = {};
  if (action === "publish") updates.publication_status = "published";
  if (action === "hide") updates.publication_status = "hidden";
  if (action === "sold") updates.stock_status = "sold";
  if (action === "in_stock") updates.stock_status = "in_stock";
  if (action === "feature") updates.is_featured = true;
  if (action === "unfeature") updates.is_featured = false;
  if (!Object.keys(updates).length) return;
  const { error } = await supabase.from("products").update(updates).eq("id", productId);
  if (error) redirect(`/admin/listings?error=${encodeURIComponent("Ürün güncellenemedi.")}`);
  revalidatePath("/"); revalidatePath("/admin"); revalidatePath("/admin/listings");
}
