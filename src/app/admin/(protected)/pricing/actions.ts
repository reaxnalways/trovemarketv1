"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { isAdminEmail } from "@/modules/auth/admin-access";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user || !isAdminEmail(data.user.email)) redirect("/admin/login");
  return supabase;
}

function text(formData: FormData, key: string) { return String(formData.get(key) ?? "").trim(); }
function parsePositiveNumber(value: FormDataEntryValue | null) { if (typeof value !== "string") return null; const parsed = Number(value.replace(",", ".")); return Number.isFinite(parsed) && parsed > 0 ? parsed : null; }
function parseNumber(formData: FormData, key: string, min = 0) { const value = Number(text(formData, key).replace(",", ".")); if (!Number.isFinite(value) || value < min) throw new Error("Geçerli bir sayı gir."); return value; }
function parseOptionalNumber(formData: FormData, key: string) { const raw = text(formData, key); if (!raw) return null; const value = Number(raw.replace(",", ".")); if (!Number.isFinite(value) || value < 0) throw new Error("Geçerli bir tutar gir."); return value; }
function refreshPricing() { ["/","/admin/pricing","/admin/listings","/admin/trade-in","/admin/trade-in/costs","/admin/technical-service/prices","/takas","/kategori/teknik-servis"].forEach((path) => revalidatePath(path)); }

export async function updateProductPrice(formData: FormData) {
  const id = text(formData, "id");
  if (!id) throw new Error("Ürün kimliği eksik.");
  const price = parseOptionalNumber(formData, "price");
  const supabase = await requireAdmin();
  const { error } = await supabase.from("products").update({ price, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error("Ürün fiyatı güncellenemedi.");
  refreshPricing();
}

export async function createTradeInDevicePrice(formData: FormData) {
  const deviceType = text(formData, "deviceType");
  const brand = text(formData, "brand");
  const model = text(formData, "model");
  if (!deviceType || !brand || !model) throw new Error("Cihaz türü, marka ve model zorunludur.");
  const tr = parseNumber(formData, "marketPriceTr");
  const passport = parseNumber(formData, "marketPricePassport");
  const international = parseNumber(formData, "marketPriceInternational");
  const margin = parseNumber(formData, "profitMarginPct");
  if (margin > 60) throw new Error("Kâr marjı %60'tan büyük olamaz.");
  const supabase = await requireAdmin();
  const { error } = await supabase.from("trade_in_devices").insert({
    device_type: deviceType,
    brand,
    model,
    storage: text(formData, "storage"),
    base_estimate: tr,
    min_estimate: 0,
    max_estimate: Math.max(tr, passport, international),
    market_price_tr: tr,
    market_price_passport: passport,
    market_price_international: international,
    profit_margin_pct: margin,
    is_active: true,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.code === "23505" ? "Bu cihaz/varyant zaten listede." : "Takas cihazı eklenemedi.");
  refreshPricing();
}

export async function updateTradeInDevicePrice(formData: FormData) {
  const id = text(formData, "id");
  if (!id) throw new Error("Takas cihazı kimliği eksik.");
  const tr = parseNumber(formData, "marketPriceTr");
  const passport = parseNumber(formData, "marketPricePassport");
  const international = parseNumber(formData, "marketPriceInternational");
  const margin = parseNumber(formData, "profitMarginPct");
  if (margin > 60) throw new Error("Kâr marjı %60'tan büyük olamaz.");
  const supabase = await requireAdmin();
  const { error } = await supabase.from("trade_in_devices").update({
    market_price_tr: tr,
    market_price_passport: passport,
    market_price_international: international,
    base_estimate: tr,
    max_estimate: Math.max(tr, passport, international),
    profit_margin_pct: margin,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) throw new Error("Takas cihazı fiyatları güncellenemedi.");
  refreshPricing();
}

export async function applyBulkPriceUpdate(formData: FormData) {
  const baseRate = parsePositiveNumber(formData.get("baseRate")); const targetRate = parsePositiveNumber(formData.get("targetRate")); const roundingStep = Number(formData.get("roundingStep")); const allowedRounding = [1,10,50,100,500,1000];
  if (!baseRate || !targetRate || !allowedRounding.includes(roundingStep)) redirect("/admin/pricing?error=" + encodeURIComponent("Kur veya yuvarlama değeri geçersiz."));
  const supabase = await requireAdmin(); const { data, error } = await supabase.rpc("bulk_reindex_all_prices", { p_base_rate: baseRate, p_target_rate: targetRate, p_rounding_step: roundingStep });
  if (error) redirect("/admin/pricing?error=" + encodeURIComponent("Toplu fiyat güncellemesi başarısız oldu."));
  refreshPricing();
  redirect(`/admin/pricing?updated=${Number(data ?? 0)}&rate=${encodeURIComponent(String(targetRate))}`);
}

export async function updatePricingRule(formData: FormData) {
  const supabase = await requireAdmin(); const id = text(formData,"id");
  const servicePct = parseNumber(formData,"servicePct"); const tradeInPct = parseNumber(formData,"tradeInPct");
  const { error } = await supabase.from("pricing_fault_rules").update({ service_pct: servicePct, trade_in_pct: tradeInPct, min_service_price: parseOptionalNumber(formData,"minServicePrice"), max_service_price: parseOptionalNumber(formData,"maxServicePrice"), min_trade_in_deduction: parseOptionalNumber(formData,"minTradeInDeduction"), max_trade_in_deduction: parseOptionalNumber(formData,"maxTradeInDeduction"), updated_at: new Date().toISOString() }).eq("id",id);
  if (error) throw new Error("Katsayı güncellenemedi."); refreshPricing();
}

export async function updateSegmentRule(formData: FormData) {
  const supabase = await requireAdmin(); const code = text(formData,"code"); const multiplier = parseNumber(formData,"multiplier",0.01);
  const { error } = await supabase.from("pricing_segment_rules").update({ multiplier, updated_at: new Date().toISOString() }).eq("code",code);
  if (error) throw new Error("Segment katsayısı güncellenemedi."); refreshPricing();
}

export async function createPricingOverride(formData: FormData) {
  const supabase = await requireAdmin(); const serviceFaultCode = text(formData,"serviceFaultCode") || null; const tradeInCostCode = text(formData,"tradeInCostCode") || null;
  if (!serviceFaultCode && !tradeInCostCode) throw new Error("Servis veya takas kalemi seç.");
  const serviceMin = parseOptionalNumber(formData,"serviceMinPrice"); const serviceMax = parseOptionalNumber(formData,"serviceMaxPrice"); const tradeDeduction = parseOptionalNumber(formData,"tradeInDeduction");
  if (serviceFaultCode && (serviceMin == null || serviceMax == null)) throw new Error("Servis istisnası için min ve max fiyat gerekli.");
  if (serviceMin != null && serviceMax != null && serviceMax < serviceMin) throw new Error("Maksimum fiyat minimumdan küçük olamaz.");
  if (tradeInCostCode && tradeDeduction == null) throw new Error("Takas istisnası için kesinti tutarı gerekli.");
  const { error } = await supabase.from("pricing_overrides").insert({ device_type:text(formData,"deviceType"), brand:text(formData,"brand"), model:text(formData,"model"), service_fault_code:serviceFaultCode, trade_in_cost_code:tradeInCostCode, service_min_price:serviceMin, service_max_price:serviceMax, trade_in_deduction:tradeDeduction, exclude_from_bulk:formData.get("excludeFromBulk")==="on", note:text(formData,"note"), is_active:true });
  if (error) throw new Error(error.code==="23505"?"Bu model ve kalem için istisna zaten var.":"İstisna eklenemedi."); refreshPricing();
}

export async function deletePricingOverride(formData: FormData) {
  const supabase = await requireAdmin(); const { error } = await supabase.from("pricing_overrides").delete().eq("id",text(formData,"id")); if (error) throw new Error("İstisna silinemedi."); refreshPricing();
}

export async function applyHybridBulkAdjustment(formData: FormData) {
  const supabase = await requireAdmin(); const percentage = Number(text(formData,"percentage").replace(",",".")); const target = text(formData,"target") || "all"; const includeOverrides = formData.get("includeOverrides")==="on";
  if (!Number.isFinite(percentage) || percentage===0 || percentage<=-90 || percentage>500) throw new Error("Oran -90 ile 500 arasında ve sıfırdan farklı olmalı.");
  const { error } = await supabase.rpc("apply_pricing_bulk_adjustment",{p_target:target,p_percentage:percentage,p_include_overrides:includeOverrides}); if (error) throw new Error("Toplu katsayı güncellemesi uygulanamadı."); refreshPricing();
}

export async function rollbackHybridBulkAdjustment(formData: FormData) {
  const supabase = await requireAdmin(); const { data, error } = await supabase.rpc("rollback_pricing_bulk_adjustment",{p_history_id:text(formData,"id")}); if (error || data!==true) throw new Error("Bu toplu işlem geri alınamadı."); refreshPricing();
}
