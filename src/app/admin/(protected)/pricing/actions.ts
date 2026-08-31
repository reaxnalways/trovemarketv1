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

function parsePositiveNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export async function applyBulkPriceUpdate(formData: FormData) {
  const baseRate = parsePositiveNumber(formData.get("baseRate"));
  const targetRate = parsePositiveNumber(formData.get("targetRate"));
  const roundingStep = Number(formData.get("roundingStep"));
  const allowedRounding = [1, 10, 50, 100, 500, 1000];

  if (!baseRate || !targetRate || !allowedRounding.includes(roundingStep)) {
    redirect("/admin/pricing?error=" + encodeURIComponent("Kur veya yuvarlama değeri geçersiz."));
  }

  const supabase = await requireAdmin();
  const { data, error } = await supabase.rpc("bulk_reindex_all_prices", {
    p_base_rate: baseRate,
    p_target_rate: targetRate,
    p_rounding_step: roundingStep,
  });

  if (error) {
    redirect("/admin/pricing?error=" + encodeURIComponent("Toplu fiyat güncellemesi başarısız oldu."));
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/listings");
  revalidatePath("/admin/pricing");
  revalidatePath("/admin/trade-in");
  revalidatePath("/admin/trade-in/costs");
  revalidatePath("/admin/technical-service/prices");
  revalidatePath("/takas");

  redirect(`/admin/pricing?updated=${Number(data ?? 0)}&rate=${encodeURIComponent(String(targetRate))}`);
}
