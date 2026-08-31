"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { isAdminEmail } from "@/modules/auth/admin-access";

async function adminClient(){const supabase=await createSupabaseServerClient();const {data,error}=await supabase.auth.getUser();if(error||!data.user||!isAdminEmail(data.user.email))redirect("/admin/login");return supabase}
function text(form:FormData,key:string){return String(form.get(key)??"").trim()}
function number(form:FormData,key:string){const value=Number(text(form,key).replace(",","."));if(!Number.isFinite(value)||value<0)throw new Error("Geçerli fiyat gir.");return value}

export async function createServicePrice(form:FormData){const supabase=await adminClient();const min=number(form,"minPrice"),max=number(form,"maxPrice");if(max<min)throw new Error("Maksimum fiyat minimumdan küçük olamaz.");const label=text(form,"faultLabel");const code=text(form,"faultCode")||label.toLocaleLowerCase("tr-TR").replace(/[^a-z0-9çğıöşü]+/g,"-").replace(/^-|-$/g,"");const {error}=await supabase.from("service_price_references").insert({device_type:text(form,"deviceType"),fault_code:code,fault_label:label,min_price:min,max_price:max,is_active:true});if(error)throw new Error(error.code==="23505"?"Bu cihaz türü ve arıza zaten kayıtlı.":"Referans eklenemedi.");revalidatePath("/kategori/teknik-servis");revalidatePath("/admin/technical-service/prices")}
export async function updateServicePrice(form:FormData){const supabase=await adminClient();const min=number(form,"minPrice"),max=number(form,"maxPrice");if(max<min)throw new Error("Maksimum fiyat minimumdan küçük olamaz.");const {error}=await supabase.from("service_price_references").update({min_price:min,max_price:max,updated_at:new Date().toISOString()}).eq("id",text(form,"id"));if(error)throw new Error("Fiyat güncellenemedi.");revalidatePath("/kategori/teknik-servis");revalidatePath("/admin/technical-service/prices")}
export async function toggleServicePrice(form:FormData){const supabase=await adminClient();const active=text(form,"active")==="true";const {error}=await supabase.from("service_price_references").update({is_active:!active,updated_at:new Date().toISOString()}).eq("id",text(form,"id"));if(error)throw new Error("Durum güncellenemedi.");revalidatePath("/kategori/teknik-servis");revalidatePath("/admin/technical-service/prices")}
export async function deleteServicePrice(form:FormData){const supabase=await adminClient();const {error}=await supabase.from("service_price_references").delete().eq("id",text(form,"id"));if(error)throw new Error("Referans silinemedi.");revalidatePath("/kategori/teknik-servis");revalidatePath("/admin/technical-service/prices")}
