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

function requiredId(formData: FormData) {
  const value = String(formData.get("recordId") ?? "").trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error("Servis kaydı bulunamadı.");
  }
  return value;
}

async function getAdminContext() {
  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user || !isAdminEmail(userData.user.email)) {
    redirect("/admin/login");
  }

  return { supabase, user: userData.user };
}

function readPayload(formData: FormData) {
  return {
    first_name: requiredText(formData, "firstName", "Ad"),
    last_name: requiredText(formData, "lastName", "Soyad"),
    phone: requiredText(formData, "phone", "Telefon numarası"),
    damage_cost: requiredMoney(formData, "damageCost", "Hasar / maliyet"),
    labor_cost: requiredMoney(formData, "laborCost", "İşçilik"),
    amount_paid: requiredMoney(formData, "amountPaid", "Müşterinin verdiği tutar"),
  };
}

export async function createTechnicalServiceRecord(formData: FormData) {
  const { supabase, user } = await getAdminContext();

  let payload;
  try {
    payload = { ...readPayload(formData), created_by: user.id };
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

export async function updateTechnicalServiceRecord(formData: FormData) {
  const { supabase } = await getAdminContext();

  let recordId: string;
  let payload;
  try {
    recordId = requiredId(formData);
    payload = { ...readPayload(formData), updated_at: new Date().toISOString() };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Servis kaydı güncellenemedi.";
    redirect(`/admin/technical-service?error=${encodeURIComponent(message)}`);
  }

  const { error } = await supabase
    .from("technical_service_records")
    .update(payload)
    .eq("id", recordId);

  if (error) {
    redirect(`/admin/technical-service?error=${encodeURIComponent("Servis kaydı güncellenemedi.")}`);
  }

  redirect("/admin/technical-service?updated=1");
}

export async function deleteTechnicalServiceRecord(formData: FormData) {
  const { supabase } = await getAdminContext();

  let recordId: string;
  try {
    recordId = requiredId(formData);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Servis kaydı silinemedi.";
    redirect(`/admin/technical-service?error=${encodeURIComponent(message)}`);
  }

  const { error } = await supabase.from("technical_service_records").delete().eq("id", recordId);

  if (error) {
    redirect(`/admin/technical-service?error=${encodeURIComponent("Servis kaydı silinemedi.")}`);
  }

  redirect("/admin/technical-service?deleted=1");
}
