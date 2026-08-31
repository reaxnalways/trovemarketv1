"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { isAdminEmail } from "@/modules/auth/admin-access";

async function adminClient(){const supabase=await createSupabaseServerClient();const{data,error}=await supabase.auth.getUser();if(error||!data.user||!isAdminEmail(data.user.email))redirect("/admin/login");return supabase}
function text(form:FormData,key:string){return String(form.get(key)??"").trim()}
function amount(form:FormData){const value=Number(text(form,"amount").replace(",","."));if(!Number.isFinite(value)||value<0)throw new Error("Geçerli masraf tutarı gir.");return value}
function slug(value:string){return value.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ı/g,"i").replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"")}
function refresh(){revalidatePath("/admin/trade-in/costs");revalidatePath("/takas")}

export async function createTradeInCost(form:FormData){const supabase=await adminClient();const label=text(form,"label");const category=text(form,"category")||"system";const code=text(form,"code")||slug(label);const selectable=category==="repair"||category==="accessory";const{error}=await supabase.from("trade_in_cost_references").insert({code,label,amount:amount(form),category,selectable,is_active:true,sort_order:0});if(error)throw new Error(error.code==="23505"?"Bu referans kodu zaten kullanılıyor.":"Masraf referansı eklenemedi.");refresh()}
export async function updateTradeInCost(form:FormData){const supabase=await adminClient();const{error}=await supabase.from("trade_in_cost_references").update({label:text(form,"label"),amount:amount(form),updated_at:new Date().toISOString()}).eq("code",text(form,"code"));if(error)throw new Error("Masraf referansı güncellenemedi.");refresh()}
export async function toggleTradeInCost(form:FormData){const supabase=await adminClient();const active=text(form,"active")==="true";const{error}=await supabase.from("trade_in_cost_references").update({is_active:!active,updated_at:new Date().toISOString()}).eq("code",text(form,"code"));if(error)throw new Error("Durum güncellenemedi.");refresh()}
export async function deleteTradeInCost(form:FormData){const supabase=await adminClient();const{error}=await supabase.from("trade_in_cost_references").delete().eq("code",text(form,"code"));if(error)throw new Error("Masraf referansı silinemedi.");refresh()}
