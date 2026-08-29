"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { isAdminEmail } from "@/modules/auth/admin-access";

function text(value: FormDataEntryValue | null) { return typeof value === "string" ? value.trim() : ""; }
export async function saveContent(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user || !isAdminEmail(data.user.email)) redirect("/admin/login");
  const campaignUrl = text(formData.get("campaignUrl"));
  if (campaignUrl && !/^https?:\/\//i.test(campaignUrl) && !campaignUrl.startsWith("/")) redirect("/admin/content?error=Kampanya+bağlantısı+geçersiz");
  const { error } = await supabase.from("site_settings").update({ campaign_title: text(formData.get("campaignTitle")) || null, campaign_text: text(formData.get("campaignText")) || null, campaign_url: campaignUrl || null, service_intro: text(formData.get("serviceIntro")) || null, updated_at: new Date().toISOString() }).eq("id", true);
  if (error) redirect("/admin/content?error=İçerik+kaydedilemedi");
  revalidatePath("/"); revalidatePath("/kategori/teknik-servis"); revalidatePath("/admin/content");
  redirect("/admin/content?saved=1");
}
