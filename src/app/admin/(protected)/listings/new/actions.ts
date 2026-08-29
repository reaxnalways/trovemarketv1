"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { isAdminEmail } from "@/modules/auth/admin-access";
import { buildDraftListing } from "@/modules/listings/create-listing";

function formText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function createDraftListing(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user || !isAdminEmail(userData.user.email)) {
    redirect("/admin/login");
  }

  let listing;
  try {
    listing = buildDraftListing({
      categoryId: formText(formData, "categoryId"),
      title: formText(formData, "title"),
      brand: formText(formData, "brand"),
      model: formText(formData, "model"),
      price: formText(formData, "price"),
      condition: formText(formData, "condition"),
      storage: formText(formData, "storage"),
      color: formText(formData, "color"),
      batteryHealth: formText(formData, "batteryHealth"),
      description: formText(formData, "description"),
      sourceUrl: formText(formData, "sourceUrl"),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "İlan bilgileri geçersiz.";
    redirect(`/admin/listings/new?error=${encodeURIComponent(message)}`);
  }

  const { data, error } = await supabase
    .from("products")
    .insert(listing)
    .select("id,product_code")
    .single();

  if (error || !data) {
    redirect(`/admin/listings/new?error=${encodeURIComponent("Taslak ilan kaydedilemedi.")}`);
  }

  redirect(`/admin?created=${encodeURIComponent(data.product_code)}`);
}
