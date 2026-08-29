"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { isAdminEmail } from "@/modules/auth/admin-access";

const SERVICE_TYPES = new Set(["phone", "computer", "laptop", "playstation"]);

function requiredText(formData: FormData, key: string, label: string) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) throw new Error(`${label} zorunludur.`);
  return value;
}

function requiredMoney(formData: FormData, key: string, label: string) {
  const raw = String(formData.get(key) ?? "").trim().replace(",", ".");
  if (!raw) throw new Error(`${label} zorunludur.`);
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) throw new Error(`${label} geçerli bir tutar olmalıdır.`);
  return value;
}

function requiredServiceType(formData: FormData) {
  const value = String(formData.get("serviceType") ?? "").trim();
  if (!SERVICE_TYPES.has(value)) throw new Error("Teknik servis türü seçilmelidir.");
  return value;
}

function requiredId(formData: FormData) {
  const value = String(formData.get("recordId") ?? "").trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) throw new Error("Servis kaydı bulunamadı.");
  return value;
}

async function getAdminContext() {
  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user || !isAdminEmail(userData.user.email)) redirect("/admin/login");
  return { supabase, user: userData.user };
}

function readPayload(formData: FormData) {
  return {
    service_type: requiredServiceType(formData),
    first_name: requiredText(formData, "firstName", "Ad"),
    last_name: requiredText(formData, "lastName", "Soyad"),
    phone: requiredText(formData, "phone", "Telefon numarası"),
    complaint: requiredText(formData, "complaint", "Müşteri şikayeti"),
    damage_cost: requiredMoney(formData, "damageCost", "Hasar / maliyet"),
    labor_cost: requiredMoney(formData, "laborCost", "İşçilik"),
    amount_paid: requiredMoney(formData, "amountPaid", "Müşterinin verdiği tutar"),
  };
}

export async function createTechnicalServiceRecord(formData: FormData) {
  const { supabase, user } = await getAdminContext();
  let payload;
  try { payload = { ...readPayload(formData), created_by: user.id }; }
  catch (error) { redirect(`/admin/technical-service?error=${encodeURIComponent(error instanceof Error ? error.message : "Servis kaydı oluşturulamadı.")}`); }
  const { data, error } = await supabase.from("technical_service_records").insert(payload).select("service_code").single();
  if (error || !data) redirect(`/admin/technical-service?error=${encodeURIComponent("Servis kaydı veritabanına kaydedilemedi.")}`);
  redirect(`/admin/technical-service?created=${encodeURIComponent(data.service_code)}`);
}

export async function updateTechnicalServiceRecord(formData: FormData) {
  const { supabase } = await getAdminContext();
  let recordId: string; let payload;
  try { recordId = requiredId(formData); payload = { ...readPayload(formData), updated_at: new Date().toISOString() }; }
  catch (error) { redirect(`/admin/technical-service?error=${encodeURIComponent(error instanceof Error ? error.message : "Servis kaydı güncellenemedi.")}`); }
  const { error } = await supabase.from("technical_service_records").update(payload).eq("id", recordId).is("archived_at", null);
  if (error) redirect(`/admin/technical-service?error=${encodeURIComponent("Servis kaydı güncellenemedi.")}`);
  redirect("/admin/technical-service?updated=1");
}

export async function archiveTechnicalServiceRecord(formData: FormData) {
  const { supabase, user } = await getAdminContext();
  let recordId: string;
  try { recordId = requiredId(formData); }
  catch (error) { redirect(`/admin/technical-service?error=${encodeURIComponent(error instanceof Error ? error.message : "Servis kaydı arşivlenemedi.")}`); }
  const now = new Date().toISOString();
  const { error } = await supabase.from("technical_service_records").update({ archived_at: now, archived_by: user.id, updated_at: now }).eq("id", recordId).is("archived_at", null);
  if (error) redirect(`/admin/technical-service?error=${encodeURIComponent("Servis kaydı arşivlenemedi.")}`);
  redirect("/admin/technical-service?archived=1");
}

export async function restoreTechnicalServiceRecord(formData: FormData) {
  const { supabase } = await getAdminContext();
  let recordId: string;
  try { recordId = requiredId(formData); }
  catch (error) { redirect(`/admin/technical-service?error=${encodeURIComponent(error instanceof Error ? error.message : "Servis kaydı geri yüklenemedi.")}`); }
  const { error } = await supabase.from("technical_service_records").update({ archived_at: null, archived_by: null, updated_at: new Date().toISOString() }).eq("id", recordId).not("archived_at", "is", null);
  if (error) redirect(`/admin/technical-service?error=${encodeURIComponent("Servis kaydı geri yüklenemedi.")}`);
  redirect("/admin/technical-service?restored=1");
}
