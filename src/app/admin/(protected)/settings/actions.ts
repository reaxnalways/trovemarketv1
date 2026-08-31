"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { isAdminEmail } from "@/modules/auth/admin-access";
import { normalizeSiteSettings } from "@/modules/settings/site-settings";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user || !isAdminEmail(data.user.email)) redirect("/admin/login");
  return supabase;
}

export async function saveSiteSettings(input: {
  siteName: string;
  siteTagline: string;
  whatsappNumber: string;
  whatsappDefaultMessage: string;
  logoUrl: string | null;
}) {
  const values = normalizeSiteSettings(input);
  const supabase = await requireAdmin();

  const { error } = await supabase
    .from("site_settings")
    .update({
      site_name: values.siteName,
      site_tagline: values.siteTagline,
      whatsapp_number: values.whatsappNumber || null,
      whatsapp_default_message: values.whatsappDefaultMessage,
      logo_url: values.logoUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);

  if (error) throw new Error("Site ayarları kaydedilemedi.");

  revalidatePath("/");
  revalidatePath("/manifest.webmanifest");
  revalidatePath("/api/app-icon");
  revalidatePath("/kategori/[slug]", "page");
  revalidatePath("/ilan/[productCode]", "page");
  revalidatePath("/admin/settings");
}
