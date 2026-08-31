"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { isAdminEmail } from "@/modules/auth/admin-access";

async function adminClient(){const supabase=await createSupabaseServerClient();const {data,error}=await supabase.auth.getUser();if(error||!data.user||!isAdminEmail(data.user.email))redirect("/admin/login");return supabase}
function text(form:FormData,key:string){return String(form.get(key)??"").trim()}
export async function updateTradeInCost(form:FormData){const amount=Number(text(form,"amount").replace(",","."));if(!Number.isFinite(amount)||amount<0)throw new Error("Geçerli masraf tutarı gir.");const supabase=await adminClient();const {error}=await supabase.from("trade_in_cost_references").update({amount,updated_at:new Date().toISOString()}).eq("code",text(form,"code"));if(error)throw new Error("Masraf referansı güncellenemedi.");revalidatePath("/admin/trade-in/costs");revalidatePath("/takas")}
