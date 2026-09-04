import { NextResponse } from "next/server";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";

const MAX_DEDUCTION_RATIO = 0.45;
const ALLOWED_REGIONS = new Set(["tr", "passport", "international"]);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const deviceId = String(body.deviceId ?? "").trim();
    const region = String(body.region ?? "").trim();
    if (!deviceId) return NextResponse.json({ error: "Cihaz seçilmedi." }, { status: 400 });
    if (!ALLOWED_REGIONS.has(region)) return NextResponse.json({ error: "Geçerli bir cihaz bölgesi seçilmedi." }, { status: 400 });

    const accessoryCostCodes = Array.isArray(body.accessoryCostCodes)
      ? Array.from(new Set(body.accessoryCostCodes.map((value: unknown) => String(value).trim()).filter(Boolean))).join(",")
      : String(body.accessoryCostCode ?? "").trim();
    const faultCodes = Array.isArray(body.faultCodes)
      ? Array.from(new Set(body.faultCodes.map((value: unknown) => String(value).trim()).filter((code: string) => Boolean(code) && code !== "ok"))).join(",")
      : "";

    const supabase = createPublicSupabaseClient();
    const { data, error } = await supabase.rpc("estimate_trade_in", {
      p_device_id: deviceId,
      p_region: region,
      p_cosmetic: "",
      p_working: "",
      p_screen: String(body.screen ?? ""),
      p_body: String(body.body ?? ""),
      p_battery: String(body.battery ?? ""),
      p_repair_cost_code: String(body.repairCostCode ?? ""),
      p_accessory_cost_code: accessoryCostCodes,
      p_fault_codes: faultCodes,
    });
    if (error || !data?.length) return NextResponse.json({ error: "Bu cihaz için otomatik tahmin oluşturulamadı." }, { status: 404 });

    const row = data[0];
    const marketPrice = Number(row.market_price);
    const deductions = Number(row.deductions);
    const requiresStoreReview = Number.isFinite(marketPrice) && marketPrice > 0 && Number.isFinite(deductions) && deductions / marketPrice >= MAX_DEDUCTION_RATIO;

    if (requiresStoreReview) {
      return NextResponse.json({
        requiresStoreReview: true,
        message: "Cihazınızın mevcut durumu nedeniyle sistem üzerinden sağlıklı bir fiyat oluşturamıyoruz. Detaylı değerlendirme ve net teklif için cihazınızla birlikte mağazamızı ziyaret etmenizi rica ederiz.",
      });
    }

    return NextResponse.json({ estimate: Number(row.estimate), min: Number(row.estimate_min), max: Number(row.estimate_max), confidence: row.confidence, requiresStoreReview: false });
  } catch {
    return NextResponse.json({ error: "Tahmini fiyat hesaplanamadı." }, { status: 500 });
  }
}
