"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { isAdminEmail } from "@/modules/auth/admin-access";

async function adminClient() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user || !isAdminEmail(data.user.email)) redirect("/admin/login");
  return supabase;
}

export type ScopedBulkInput = {
  scopeType: "all" | "category" | "brand" | "model" | "selected_products";
  targets: string[];
  percentage: number;
  categoryId?: string | null;
  deviceType?: string | null;
  brand?: string | null;
  model?: string | null;
  productIds?: string[];
  includeProtectedOverrides?: boolean;
};

const allowedTargets = new Set(["product_price", "trade_in_market", "service_rules", "trade_in_rules", "overrides"]);

function normalized(input: ScopedBulkInput): ScopedBulkInput {
  const restricted = input.scopeType !== "all";
  let targets = Array.from(new Set((input.targets ?? []).filter((target) => allowedTargets.has(target))));
  if (restricted) targets = targets.filter((target) => target !== "service_rules" && target !== "trade_in_rules");
  if (input.scopeType === "selected_products") targets = targets.filter((target) => target === "product_price");
  return {
    ...input,
    targets,
    categoryId: input.scopeType === "category" ? input.categoryId || null : null,
    deviceType: input.scopeType === "category" ? input.deviceType || null : null,
    brand: input.scopeType === "brand" || input.scopeType === "model" ? input.brand?.trim() || null : null,
    model: input.scopeType === "model" ? input.model?.trim() || null : null,
    productIds: input.scopeType === "selected_products" ? Array.from(new Set(input.productIds ?? [])) : [],
    includeProtectedOverrides: Boolean(input.includeProtectedOverrides),
  };
}

function rpcArgs(input: ScopedBulkInput) {
  return {
    p_scope_type: input.scopeType,
    p_targets: input.targets,
    p_percentage: input.percentage,
    p_category_id: input.categoryId || null,
    p_device_type: input.deviceType || null,
    p_brand: input.brand || null,
    p_model: input.model || null,
    p_product_ids: input.productIds ?? [],
    p_include_protected_overrides: Boolean(input.includeProtectedOverrides),
  };
}

function validate(input: ScopedBulkInput) {
  if (!Number.isFinite(input.percentage) || input.percentage === 0 || input.percentage <= -90 || input.percentage > 500) throw new Error("Oran -90 ile 500 arasında ve sıfırdan farklı olmalı.");
  if (!input.targets.length) throw new Error("En az bir uygun fiyat alanı seç.");
  if (input.scopeType === "category" && !input.categoryId) throw new Error("Kategori seç.");
  if (input.scopeType === "brand" && !input.brand) throw new Error("Marka seç.");
  if (input.scopeType === "model" && (!input.brand || !input.model)) throw new Error("Marka ve model seç.");
  if (input.scopeType === "selected_products" && !input.productIds?.length) throw new Error("En az bir ürün seç.");
  if (input.scopeType === "category" && input.targets.some((target) => target === "trade_in_market" || target === "overrides") && !input.deviceType) {
    throw new Error("Bu kategori Takas/Servis cihaz türüyle eşleşmiyor. Bu kapsamda yalnızca ürün satış fiyatını güncelle.");
  }
}

function prepare(input: ScopedBulkInput) {
  const safe = normalized(input);
  validate(safe);
  return safe;
}

function refreshScopedPricing() {
  ["/", "/admin/pricing", "/admin/listings", "/takas", "/kategori/teknik-servis"].forEach((path) => revalidatePath(path));
}

export async function previewScopedBulk(input: ScopedBulkInput) {
  const safe = prepare(input);
  const supabase = await adminClient();
  const { data, error } = await supabase.rpc("preview_scoped_price_adjustment", rpcArgs(safe));
  if (error) throw new Error(error.message || "Önizleme oluşturulamadı.");
  return data as { counts?: Record<string, number>; samples?: Array<{ id: string; label: string; before: number; after: number }>; warning?: string | null };
}

export async function applyScopedBulk(input: ScopedBulkInput) {
  const safe = prepare(input);
  const supabase = await adminClient();
  const { data, error } = await supabase.rpc("apply_scoped_price_adjustment", rpcArgs(safe));
  if (error) throw new Error(error.message || "Toplu fiyat işlemi uygulanamadı.");
  refreshScopedPricing();
  return String(data);
}

export async function rollbackScopedBulk(id: string) {
  const supabase = await adminClient();
  const { data, error } = await supabase.rpc("rollback_scoped_price_adjustment", { p_history_id: id });
  if (error) {
    if (String(error.message ?? "").includes("ROLLBACK_CONFLICT")) throw new Error("Bu işlemden sonra bazı fiyatlar ayrıca değiştirildi. Veri kaybını önlemek için otomatik geri alma durduruldu.");
    throw new Error(error.message || "Toplu fiyat işlemi geri alınamadı.");
  }
  if (data !== true) throw new Error("Toplu fiyat işlemi geri alınamadı.");
  refreshScopedPricing();
  return true;
}
