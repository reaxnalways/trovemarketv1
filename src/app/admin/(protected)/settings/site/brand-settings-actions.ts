"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { isAdminEmail } from "@/modules/auth/admin-access";

export async function saveBrandSettings(input:{logoUrl:string|null;brandWordmarkUrl:string|null;appIconUrl:string|null}){
  const supabase=await createSupabaseServerClient(); const {data,error:userError}=await supabase.auth.getUser();
  if(userError||!data.user||!isAdminEmail(data.user.email)) redirect("/admin/login");
  const allowed=(value:string|null)=>!value||value.includes("/storage/v1/object/public/brand-assets/");
  if(!allowed(input.logoUrl)||!allowed(input.brandWordmarkUrl)||!allowed(input.appIconUrl)) return {ok:false,message:"Marka dosyaları yalnızca Trove marka deposundan seçilebilir."};
  const {error}=await supabase.from("site_settings").update({logo_url:input.logoUrl,brand_wordmark_url:input.brandWordmarkUrl,app_icon_url:input.appIconUrl,updated_at:new Date().toISOString()}).eq("id",true);
  if(error) return {ok:false,message:"Logo ve marka kimliği kaydedilemedi."};
  revalidatePath("/"); revalidatePath("/manifest.webmanifest"); revalidatePath("/admin/settings/site"); return {ok:true,message:"Logo ve marka kimliği kaydedildi."};
}
