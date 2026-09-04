"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { isAdminEmail } from "@/modules/auth/admin-access";
import { isPaytrConfigured } from "@/modules/payments/paytr";

type SavePurchaseSettingsResult = { ok: true } | { ok: false; message: string };
type Input = { purchaseEnabled:boolean; bankName:string; accountHolder:string; iban:string; paytrEnabled:boolean; paytrTestMode:boolean; paytrNoInstallment:boolean; paytrMaxInstallment:number };

export async function savePurchaseSettings(input: Input): Promise<SavePurchaseSettingsResult> {
  const bankName=input.bankName.trim(); const accountHolder=input.accountHolder.trim(); const iban=input.iban.replace(/\s+/g,"").toUpperCase();
  if(bankName.length>100)return{ok:false,message:"Banka adı en fazla 100 karakter olabilir."};
  if(accountHolder.length>120)return{ok:false,message:"Hesap sahibi en fazla 120 karakter olabilir."};
  if(iban&&!/^TR[0-9]{24}$/.test(iban))return{ok:false,message:"IBAN TR ile başlamalı ve toplam 26 karakter olmalıdır."};
  if(input.purchaseEnabled&&(!bankName||!accountHolder||!iban))return{ok:false,message:"Mevcut Havale/EFT akışı için satın alma açılmadan önce banka bilgileri girilmelidir."};
  if(!Number.isInteger(input.paytrMaxInstallment)||input.paytrMaxInstallment<0||input.paytrMaxInstallment>12)return{ok:false,message:"PayTR azami taksit 0 ile 12 arasında olmalıdır."};
  if(input.paytrEnabled&&!isPaytrConfigured())return{ok:false,message:"PayTR etkinleştirilemez: sunucu ortamında Merchant ID, Merchant Key, Merchant Salt ve Supabase Service Role Key eksik."};

  const supabase=await createSupabaseServerClient(); const{data,error:userError}=await supabase.auth.getUser();
  if(userError||!data.user||!isAdminEmail(data.user.email))return{ok:false,message:"Oturum yetkisi doğrulanamadı. Admin hesabıyla yeniden giriş yap."};
  const{error}=await supabase.from("site_settings").update({purchase_enabled:input.purchaseEnabled,bank_name:bankName||null,bank_account_holder:accountHolder||null,iban:iban||null,paytr_enabled:input.paytrEnabled,paytr_test_mode:input.paytrTestMode,paytr_no_installment:input.paytrNoInstallment,paytr_max_installment:input.paytrMaxInstallment,updated_at:new Date().toISOString()}).eq("id",true);
  if(error)return{ok:false,message:"Satın alma ayarları kaydedilemedi."};
  revalidatePath("/admin/settings/company"); revalidatePath("/ilan/[productCode]","page"); revalidatePath("/satinal/[productCode]","page"); return{ok:true};
}
