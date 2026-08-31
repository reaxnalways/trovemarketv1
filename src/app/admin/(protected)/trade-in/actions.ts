"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { isAdminEmail } from "@/modules/auth/admin-access";

async function adminClient(){const supabase=await createSupabaseServerClient();const {data,error}=await supabase.auth.getUser();if(error||!data.user||!isAdminEmail(data.user.email))redirect("/admin/login");return supabase}
function text(form:FormData,key:string){return String(form.get(key)??"").trim()}
function number(form:FormData,key:string){const value=Number(text(form,key).replace(",","."));if(!Number.isFinite(value)||value<0)throw new Error("Geçerli sayısal değer gir.");return value}
function deviceValues(form:FormData){
 const tr=number(form,"marketPriceTr"),passport=number(form,"marketPricePassport"),international=number(form,"marketPriceInternational"),margin=number(form,"profitMarginPct");
 if(margin>60)throw new Error("Kâr marjı %60'tan büyük olamaz.");
 return {device_type:text(form,"deviceType"),brand:text(form,"brand"),model:text(form,"model"),storage:text(form,"storage"),base_estimate:tr,min_estimate:0,max_estimate:Math.max(tr,passport,international),market_price_tr:tr,market_price_passport:passport,market_price_international:international,profit_margin_pct:margin,updated_at:new Date().toISOString()};
}
export async function createTradeInDevice(form:FormData){const supabase=await adminClient();const {error}=await supabase.from("trade_in_devices").insert({...deviceValues(form),is_active:true});if(error)throw new Error(error.code==="23505"?"Bu cihaz/varyant zaten listede.":"Cihaz eklenemedi.");revalidatePath("/takas");revalidatePath("/admin/trade-in")}
export async function updateTradeInDevice(form:FormData){const supabase=await adminClient();const {error}=await supabase.from("trade_in_devices").update(deviceValues(form)).eq("id",text(form,"id"));if(error)throw new Error("Cihaz fiyatları güncellenemedi.");revalidatePath("/takas");revalidatePath("/admin/trade-in")}
export async function toggleTradeInDevice(form:FormData){const supabase=await adminClient();const id=text(form,"id"),active=text(form,"active")==="true";const {error}=await supabase.from("trade_in_devices").update({is_active:!active,updated_at:new Date().toISOString()}).eq("id",id);if(error)throw new Error("Durum güncellenemedi.");revalidatePath("/takas");revalidatePath("/admin/trade-in")}
export async function deleteTradeInDevice(form:FormData){const supabase=await adminClient();const {error}=await supabase.from("trade_in_devices").delete().eq("id",text(form,"id"));if(error)throw new Error("Cihaz silinemedi.");revalidatePath("/takas");revalidatePath("/admin/trade-in")}
