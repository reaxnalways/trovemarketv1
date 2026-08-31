"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { isAdminEmail } from "@/modules/auth/admin-access";

async function adminClient(){const supabase=await createSupabaseServerClient();const {data,error}=await supabase.auth.getUser();if(error||!data.user||!isAdminEmail(data.user.email))redirect("/admin/login");return supabase}
function text(form:FormData,key:string){return String(form.get(key)??"").trim()}
function price(form:FormData,key:string){const value=Number(text(form,key).replace(",","."));if(!Number.isFinite(value)||value<0)throw new Error("Geçerli fiyat gir.");return value}

export async function createTradeInDevice(form:FormData){
 const supabase=await adminClient();const base=price(form,"baseEstimate"),min=price(form,"minEstimate"),max=price(form,"maxEstimate");if(max<min)throw new Error("Maksimum fiyat minimum fiyattan küçük olamaz.");
 const {error}=await supabase.from("trade_in_devices").insert({device_type:text(form,"deviceType"),brand:text(form,"brand"),model:text(form,"model"),storage:text(form,"storage"),base_estimate:base,min_estimate:min,max_estimate:max,is_active:true});if(error)throw new Error(error.code==="23505"?"Bu cihaz/varyant zaten listede.":"Cihaz eklenemedi.");revalidatePath("/takas");revalidatePath("/admin/trade-in");
}
export async function toggleTradeInDevice(form:FormData){const supabase=await adminClient();const id=text(form,"id"),active=text(form,"active")==="true";const {error}=await supabase.from("trade_in_devices").update({is_active:!active,updated_at:new Date().toISOString()}).eq("id",id);if(error)throw new Error("Durum güncellenemedi.");revalidatePath("/takas");revalidatePath("/admin/trade-in")}
export async function deleteTradeInDevice(form:FormData){const supabase=await adminClient();const {error}=await supabase.from("trade_in_devices").delete().eq("id",text(form,"id"));if(error)throw new Error("Cihaz silinemedi.");revalidatePath("/takas");revalidatePath("/admin/trade-in")}
