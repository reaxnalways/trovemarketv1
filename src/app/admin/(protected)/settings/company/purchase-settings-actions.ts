"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { isAdminEmail } from "@/modules/auth/admin-access";

export async function savePurchaseSettings(input: { purchaseEnabled: boolean; bankName: string; accountHolder: string; iban: string }) {
  const bankName = input.bankName.trim();
  const accountHolder = input.accountHolder.trim();
  const iban = input.iban.replace(/\s+/g, "").toUpperCase();
  if (bankName.length > 100) throw new Error("Banka adı en fazla 100 karakter olabilir.");
  if (accountHolder.length > 120) throw new Error("Hesap sahibi en fazla 120 karakter olabilir.");
  if (iban && !/^TR[0-9]{24}$/.test(iban)) throw new Error("IBAN TR ile başlamalı ve 26 karakter olmalıdır.");
  if (input.purchaseEnabled && (!bankName || !accountHolder || !iban)) throw new Error("Satın alma açılmadan önce banka adı, hesap sahibi ve IBAN girilmelidir.");

  const supabase = await createSupabaseServerClient();
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user || !isAdminEmail(data.user.email)) redirect("/admin/login");
  const { error } = await supabase.from("site_settings").update({ purchase_enabled: input.purchaseEnabled, bank_name: bankName || null, bank_account_holder: accountHolder || null, iban: iban || null, updated_at: new Date().toISOString() }).eq("id", true);
  if (error) throw new Error("Satın alma ayarları kaydedilemedi.");
  revalidatePath("/admin/settings/company");
  revalidatePath("/ilan/[productCode]", "page");
  revalidatePath("/satinal/[productCode]", "page");
}
