import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service-client";
import { buildUserBasket, isPaytrConfigured, requestPaytrIframeToken } from "@/modules/payments/paytr";

function clientIp(request: Request) {
  return request.headers.get("cf-connecting-ip")?.trim() || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
}

function siteOrigin(request: Request) {
  const configured = process.env.TROVE_SITE_URL?.trim();
  return configured ? configured.replace(/\/$/, "") : new URL(request.url).origin;
}

export async function POST(request: Request) {
  let purchaseId = "";
  let merchantOid = "";
  try {
    if (!isPaytrConfigured()) return NextResponse.json({ error: "PayTR henüz yapılandırılmadı." }, { status: 503 });
    const body = await request.json();
    purchaseId = String(body.purchaseId ?? "").trim();
    const checkoutToken = String(body.checkoutToken ?? "").trim();
    if (!/^[0-9a-f-]{36}$/i.test(purchaseId) || !/^[0-9a-f-]{36}$/i.test(checkoutToken)) return NextResponse.json({ error: "Geçersiz ödeme oturumu." }, { status: 400 });

    const supabase = createSupabaseServiceClient();
    const { data: settings, error: settingsError } = await supabase.from("site_settings").select("paytr_enabled,paytr_test_mode,paytr_no_installment,paytr_max_installment").eq("id", true).maybeSingle();
    if (settingsError || !settings?.paytr_enabled) return NextResponse.json({ error: "PayTR ödemesi şu anda kapalı." }, { status: 503 });

    merchantOid = `TRV${Date.now()}${purchaseId.replace(/-/g, "").slice(0, 16)}`;
    const { data, error } = await supabase.rpc("prepare_paytr_payment", { p_purchase_id: purchaseId, p_checkout_token: checkoutToken, p_merchant_oid: merchantOid });
    const order = Array.isArray(data) ? data[0] : null;
    if (error || !order) return NextResponse.json({ error: "Sipariş ödeme için hazırlanamadı." }, { status: 409 });

    try {
      const origin = siteOrigin(request);
      const result = await requestPaytrIframeToken({
        userIp: clientIp(request), merchantOid, email: String(order.customer_email), paymentAmount: Number(order.requested_amount),
        userBasket: buildUserBasket(String(order.product_title), Number(order.product_price), 1),
        noInstallment: Boolean(settings.paytr_no_installment), maxInstallment: Number(settings.paytr_max_installment ?? 0), currency: "TL",
        testMode: Boolean(settings.paytr_test_mode), merchantOkUrl: `${origin}/odeme/basarili`, merchantFailUrl: `${origin}/odeme/basarisiz`,
        userName: String(order.customer_name), userAddress: String(order.customer_address), userPhone: String(order.customer_phone),
      });
      return NextResponse.json(result, { headers: { "cache-control": "no-store" } });
    } catch (error) {
      await supabase.rpc("abort_paytr_payment", { p_purchase_id: purchaseId, p_merchant_oid: merchantOid, p_reason: error instanceof Error ? error.message : "PayTR token request failed" });
      return NextResponse.json({ error: "PayTR ödeme ekranı başlatılamadı." }, { status: 502 });
    }
  } catch {
    return NextResponse.json({ error: "Ödeme oturumu oluşturulamadı." }, { status: 500 });
  }
}
