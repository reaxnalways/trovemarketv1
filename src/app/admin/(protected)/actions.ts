"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { isAdminEmail } from "@/modules/auth/admin-access";
import { buildPublicationUpdate } from "@/modules/listings/publication";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user || !isAdminEmail(data.user.email)) {
    redirect("/admin/login");
  }

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
  const { error } = await supabase
    .from("products")
    .update(buildPublicationUpdate("published"))
    .eq("id", productId);

  if (error) {
    redirect(`/admin?error=${encodeURIComponent("İlan yayınlanamadı.")}`);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin?published=1");
}
