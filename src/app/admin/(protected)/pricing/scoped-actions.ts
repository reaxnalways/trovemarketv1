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

function rpcArgs(input: ScopedBulkInput) {
  return {
    p_scope_type: input.scopeType,
    p_targets: input.targets,
    p_percentage: input.percentage,
    p_category_id: input.categoryId || null,
    p_device_type: input.deviceType || null,
    p_brand: input.brand?.trim() || null,
    p_model: input.model?.trim() || null,
    p_product_ids: input.productIds ?? [],
    p_include_protected_overrides: Boolean(input.includeProtectedOverrides),
  };
}

function validate(input: ScopedBulkInput) {
  if (!Number.isFinite(input.percentage) || input.percentage === 0 || input.percentage <= -90 || input.percentage > 500) throw new Error("Oran -90 ile 500 arasında ve sıfırdan farklı olmalı.");
  if (!input.targets?.length) throw new Error("En az bir fiyat alanı seç.");
  if (input.scopeType === "selected_products" && !(input.productIds?.length)) throw new Error("En az bir ürün seç.");
}

function refreshScopedPricing() {
  ["/", "/admin/pricing", "/admin/listings", "/takas", "/kategori/teknik-servis"].forEach((path) => revalidatePath(path));
}

export async function previewScopedBulk(input: ScopedBulkInput) {
  validate(input);
  const supabase = await adminClient();
  const { data, error } = await supabase.rpc("preview_scoped_price_adjustment", rpcArgs(input));
  if (error) throw new Error(error.message || "Önizleme oluşturulamadı.");
  return data as { counts?: Record<string, number>; samples?: Array<{ id: string; label: string; before: number; after: number }>; warning?: string | null };
}

export async function applyScopedBulk(input: ScopedBulkInput) {
  validate(input);
  const supabase = await adminClient();
  const { data, error } = await supabase.rpc("apply_scoped_price_adjustment", rpcArgs(input));
  if (error) throw new Error(error.message || "Toplu fiyat işlemi uygulanamadı.");
  refreshScopedPricing();
  return String(data);
}

export async function rollbackScopedBulk(id: string) {
  const supabase = await adminClient();
  const { data, error } = await supabase.rpc("rollback_scoped_price_adjustment", { p_history_id: id });
  if (error || data !== true) throw new Error("Toplu fiyat işlemi geri alınamadı.");
  refreshScopedPricing();
  return true;
}
