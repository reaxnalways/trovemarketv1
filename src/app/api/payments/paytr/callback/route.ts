import { createSupabaseServiceClient } from "@/lib/supabase/service-client";
import { isPaytrConfigured, verifyPaytrCallbackHash } from "@/modules/payments/paytr";

function text(body: string, status = 200) { return new Response(body, { status, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } }); }
function numberValue(value: FormDataEntryValue | null) { const parsed = Number(String(value ?? "")); return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : null; }

export async function POST(request: Request) {
  try {
    if (!isPaytrConfigured()) return text("configuration error", 503);
    const form = await request.formData();
    const merchantOid = String(form.get("merchant_oid") ?? "");
    const status = String(form.get("status") ?? "");
    const totalAmountRaw = String(form.get("total_amount") ?? "");
    const hash = String(form.get("hash") ?? "");
    if (!merchantOid || !["success", "failed"].includes(status) || !totalAmountRaw || !hash) return text("bad request", 400);
    if (!(await verifyPaytrCallbackHash({ merchantOid, status, totalAmount: totalAmountRaw, hash }))) return text("bad hash", 400);

    const paymentAmount = numberValue(form.get("payment_amount"));
    const totalAmount = numberValue(form.get("total_amount"));
    if (paymentAmount == null || totalAmount == null) return text("bad amount", 400);

    const supabase = createSupabaseServiceClient();
    const { error } = await supabase.rpc("process_paytr_callback", {
      p_merchant_oid: merchantOid,
      p_status: status,
      p_payment_amount: paymentAmount,
      p_total_amount: totalAmount,
      p_currency: String(form.get("currency") ?? "TL"),
      p_payment_type: String(form.get("payment_type") ?? ""),
      p_failure_code: String(form.get("failed_reason_code") ?? "") || null,
      p_failure_message: String(form.get("failed_reason_msg") ?? "") || null,
      p_test_mode: String(form.get("test_mode") ?? "0") === "1",
    });
    if (error) return text("processing error", 500);
    return text("OK");
  } catch {
    return text("processing error", 500);
  }
}
