const PAYTR_TOKEN_ENDPOINT = "https://www.paytr.com/odeme/api/get-token";
const PAYTR_IFRAME_BASE = "https://www.paytr.com/odeme/guvenli";
const encoder = new TextEncoder();

type Env = Record<string, string | undefined>;

export type PaytrConfig = {
  merchantId: string;
  merchantKey: string;
  merchantSalt: string;
};

export type PaytrTokenRequest = {
  userIp: string;
  merchantOid: string;
  email: string;
  paymentAmount: number;
  userBasket: string;
  noInstallment: boolean;
  maxInstallment: number;
  currency: "TL" | "USD" | "EUR" | "GBP" | "RUB";
  testMode: boolean;
  merchantOkUrl: string;
  merchantFailUrl: string;
  userName: string;
  userAddress: string;
  userPhone: string;
};

export function isPaytrConfigured(env: Env = process.env) {
  return Boolean(env.PAYTR_MERCHANT_ID?.trim() && env.PAYTR_MERCHANT_KEY?.trim() && env.PAYTR_MERCHANT_SALT?.trim() && env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

export function getPaytrConfig(env: Env = process.env): PaytrConfig {
  const merchantId = env.PAYTR_MERCHANT_ID?.trim();
  const merchantKey = env.PAYTR_MERCHANT_KEY?.trim();
  const merchantSalt = env.PAYTR_MERCHANT_SALT?.trim();
  if (!merchantId || !merchantKey || !merchantSalt) throw new Error("PayTR credentials are missing.");
  return { merchantId, merchantKey, merchantSalt };
}

function base64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function base64Utf8(value: string) {
  return base64(encoder.encode(value));
}

async function hmacBase64(value: string, key: string) {
  const cryptoKey = await crypto.subtle.importKey("raw", encoder.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(value));
  return base64(new Uint8Array(signature));
}

function sameAscii(a: string, b: string) {
  let diff = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i += 1) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export function buildUserBasket(productTitle: string, unitPrice: number, quantity = 1) {
  const basket = [[productTitle.slice(0, 200), unitPrice.toFixed(2), quantity]];
  return base64Utf8(JSON.stringify(basket));
}

export async function requestPaytrIframeToken(input: PaytrTokenRequest, config = getPaytrConfig()) {
  const hashString = [
    config.merchantId,
    input.userIp,
    input.merchantOid,
    input.email,
    String(input.paymentAmount),
    input.userBasket,
    input.noInstallment ? "1" : "0",
    String(input.maxInstallment),
    input.currency,
    input.testMode ? "1" : "0",
  ].join("");
  const paytrToken = await hmacBase64(hashString + config.merchantSalt, config.merchantKey);
  const body = new URLSearchParams({
    merchant_id: config.merchantId,
    user_ip: input.userIp,
    merchant_oid: input.merchantOid,
    email: input.email,
    payment_amount: String(input.paymentAmount),
    paytr_token: paytrToken,
    user_basket: input.userBasket,
    debug_on: input.testMode ? "1" : "0",
    no_installment: input.noInstallment ? "1" : "0",
    max_installment: String(input.maxInstallment),
    user_name: input.userName,
    user_address: input.userAddress,
    user_phone: input.userPhone,
    merchant_ok_url: input.merchantOkUrl,
    merchant_fail_url: input.merchantFailUrl,
    timeout_limit: "30",
    currency: input.currency,
    test_mode: input.testMode ? "1" : "0",
    lang: "tr",
  });
  const response = await fetch(PAYTR_TOKEN_ENDPOINT, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body, cache: "no-store" });
  const payload = await response.json().catch(() => null) as { status?: string; token?: string; reason?: string } | null;
  if (!response.ok || payload?.status !== "success" || !payload.token) throw new Error(payload?.reason || "PayTR token could not be created.");
  return { token: payload.token, iframeUrl: `${PAYTR_IFRAME_BASE}/${encodeURIComponent(payload.token)}` };
}

export async function verifyPaytrCallbackHash(input: { merchantOid: string; status: string; totalAmount: string; hash: string }, config = getPaytrConfig()) {
  const expected = await hmacBase64(input.merchantOid + config.merchantSalt + input.status + input.totalAmount, config.merchantKey);
  return sameAscii(expected, input.hash);
}
