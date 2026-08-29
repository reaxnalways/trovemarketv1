"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { isAdminEmail } from "@/modules/auth/admin-access";

function requiredText(formData: FormData, key: string, label: string) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) throw new Error(`${label} zorunludur.`);
  return value;
}

function requiredMoney(formData: FormData, key: string, label: string) {
  const raw = String(formData.get(key) ?? "").trim().replace(",", ".");
  if (!raw) throw new Error(`${label} zorunludur.`);

  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} geçerli bir tutar olmalıdır.`);
  }

  return value;
}

export async function createTechnicalServiceRecord(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user || !isAdminEmail(userData.user.email)) {
    redirect("/admin/login");
  }

  let payload;
  try {
    payload = {
      first_name: requiredText(formData, "firstName", "Ad"),
      last_name: requiredText(formData, "lastName", "Soyad"),
      phone: requiredText(formData, "phone", "Telefon numarası"),
      damage_cost: requiredMoney(formData, "damageCost", "Hasar / maliyet"),
      labor_cost: requiredMoney(formData, "laborCost", "İşçilik"),
      amount_paid: requiredMoney(formData, "amountPaid", "Müşterinin verdiği tutar"),
      created_by: userData.user.id,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Servis kaydı oluşturulamadı.";
    redirect(`/admin/technical-service?error=${encodeURIComponent(message)}`);
  }

  const { error } = await supabase.from("technical_service_records").insert(payload);

  if (error) {
    redirect(`/admin/technical-service?error=${encodeURIComponent("Servis kaydı veritabanına kaydedilemedi.")}`);
  }

  redirect("/admin/technical-service?created=1");
}
