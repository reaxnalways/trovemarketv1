"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { isAdminEmail } from "@/modules/auth/admin-access";

async function adminClient() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user || !isAdminEmail(data.user.email)) redirect("/admin/login");
  return supabase;
}

export async function saveCompanyContactSettings(input:{siteName:string;siteTagline:string;aboutText:string;contactEmail:string;contactPhone:string;whatsappNumber:string;instagramUrl:string;companyAddress:string;whatsappDefaultMessage:string}) {
  const siteName=input.siteName.trim(); const siteTagline=input.siteTagline.trim(); const aboutText=input.aboutText.trim();
  if(siteName.length<2||siteName.length>80) return {ok:false,message:"Marka adı 2-80 karakter olmalıdır."};
  const supabase=await adminClient();
  const {error}=await supabase.from("site_settings").update({site_name:siteName,site_tagline:siteTagline||null,about_text:aboutText||null,contact_email:input.contactEmail.trim()||null,contact_phone:input.contactPhone.trim()||null,whatsapp_number:input.whatsappNumber.replace(/[^0-9]/g,"")||null,instagram_url:input.instagramUrl.trim()||null,company_address:input.companyAddress.trim()||null,whatsapp_default_message:input.whatsappDefaultMessage.trim(),updated_at:new Date().toISOString()}).eq("id",true);
  if(error) return {ok:false,message:"Şirket ve iletişim bilgileri kaydedilemedi."};
  revalidatePath("/"); revalidatePath("/hakkimizda"); revalidatePath("/iletisim"); revalidatePath("/admin/settings/company");
  return {ok:true,message:"Şirket ve iletişim bilgileri kaydedildi."};
}

export async function saveEtbisSettings(input:{legalCompanyName:string;taxNumber:string;mersisNumber:string;kepAddress:string;tradeRegistryNumber:string;chamberName:string;etbisRegistered:boolean;etbisSiteUrl:string;etbisQrUrl:string}) {
  const values={legal_company_name:input.legalCompanyName.trim()||null,tax_number:input.taxNumber.replace(/\s+/g,"")||null,mersis_number:input.mersisNumber.replace(/\s+/g,"")||null,kep_address:input.kepAddress.trim()||null,trade_registry_number:input.tradeRegistryNumber.trim()||null,chamber_name:input.chamberName.trim()||null,etbis_registered:input.etbisRegistered,etbis_site_url:input.etbisSiteUrl.trim()||null,etbis_qr_url:input.etbisQrUrl.trim()||null,updated_at:new Date().toISOString()};
  if(input.etbisRegistered&&(!values.legal_company_name||!values.tax_number||!values.mersis_number||!values.kep_address)) return {ok:false,message:"ETBİS kayıtlı olarak işaretlemek için ticaret unvanı, vergi no, MERSİS ve KEP bilgileri gereklidir."};
  const supabase=await adminClient(); const {error}=await supabase.from("site_settings").update(values).eq("id",true);
  if(error) return {ok:false,message:"Yasal / ETBİS bilgileri kaydedilemedi."};
  revalidatePath("/iletisim"); revalidatePath("/admin/settings/company"); return {ok:true,message:"Yasal ve ETBİS bilgileri kaydedildi."};
}
