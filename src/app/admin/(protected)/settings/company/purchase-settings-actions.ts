"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { isAdminEmail } from "@/modules/auth/admin-access";

type SavePurchaseSettingsResult =
  | { ok: true }
  | { ok: false; message: string };

export async function savePurchaseSettings(input: { purchaseEnabled: boolean; bankName: string; accountHolder: string; iban: string }): Promise<SavePurchaseSettingsResult> {
  const bankName = input.bankName.trim();
  const accountHolder = input.accountHolder.trim();
  const iban = input.iban.replace(/\s+/g, "").toUpperCase();

  if (bankName.length > 100) return { ok: false, message: "Banka adı en fazla 100 karakter olabilir." };
  if (accountHolder.length > 120) return { ok: false, message: "Hesap sahibi en fazla 120 karakter olabilir." };
  if (iban && !/^TR[0-9]{24}$/.test(iban)) return { ok: false, message: "IBAN TR ile başlamalı ve toplam 26 karakter olmalıdır. Örnek: TR00 0000 0000 0000 0000 0000 00" };
  if (input.purchaseEnabled && (!bankName || !accountHolder || !iban)) return { ok: false, message: "Satın alma açılmadan önce banka adı, hesap sahibi ve IBAN girilmelidir." };

  const supabase = await createSupabaseServerClient();
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user || !isAdminEmail(data.user.email)) return { ok: false, message: "Oturum yetkisi doğrulanamadı. Admin hesabıyla yeniden giriş yap." };

  const { error } = await supabase.from("site_settings").update({
    purchase_enabled: input.purchaseEnabled,
    bank_name: bankName || null,
    bank_account_holder: accountHolder || null,
    iban: iban || null,
    updated_at: new Date().toISOString(),
  }).eq("id", true);

  if (error) return { ok: false, message: "Satın alma ayarları kaydedilemedi." };

  revalidatePath("/admin/settings/company");
  revalidatePath("/ilan/[productCode]", "page");
  revalidatePath("/satinal/[productCode]", "page");
  return { ok: true };
}
