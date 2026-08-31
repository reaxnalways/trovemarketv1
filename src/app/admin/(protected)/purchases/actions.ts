"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { isAdminEmail } from "@/modules/auth/admin-access";

const validStatuses = new Set(["new","contacted","awaiting_payment","paid","preparing","shipped","completed","cancelled"]);

export async function updatePurchaseOrder(formData: FormData) {
  const purchaseId = String(formData.get("purchaseId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const adminNote = String(formData.get("adminNote") ?? "").trim().slice(0, 1000);
  const trackingCode = String(formData.get("trackingCode") ?? "").trim().slice(0, 120);
  if (!purchaseId || !validStatuses.has(status)) return;

  const supabase = await createSupabaseServerClient();
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user || !isAdminEmail(data.user.email)) redirect("/admin/login");

  const { error } = await supabase.rpc("update_purchase_order_status", {
    p_purchase_id: purchaseId,
    p_status: status,
    p_admin_note: adminNote || null,
    p_tracking_code: trackingCode || null,
  });
  if (error) {
    const code = error.message.includes("PRODUCT_RESERVED_BY_ANOTHER_ORDER") ? "reserved" : "update";
    redirect(`/admin/purchases/${purchaseId}?error=${code}`);
  }
  revalidatePath("/admin");
  revalidatePath("/admin/listings");
  revalidatePath("/admin/purchases");
  revalidatePath(`/admin/purchases/${purchaseId}`);
  redirect(`/admin/purchases/${purchaseId}?saved=1`);
}
