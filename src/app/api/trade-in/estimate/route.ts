import { NextResponse } from "next/server";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const deviceId = String(body.deviceId ?? "");
    if (!deviceId) return NextResponse.json({ error: "Cihaz seçilmedi." }, { status: 400 });

    const supabase = createPublicSupabaseClient();
    const { data, error } = await supabase.rpc("estimate_trade_in", {
      p_device_id: deviceId,
      p_cosmetic: String(body.cosmetic ?? ""),
      p_working: String(body.working ?? ""),
      p_screen: String(body.screen ?? ""),
      p_body: String(body.body ?? ""),
      p_battery: String(body.battery ?? ""),
      p_repairs: String(body.repairs ?? ""),
      p_accessories: String(body.accessories ?? ""),
    });

    if (error || !data?.length) return NextResponse.json({ error: "Bu cihaz için otomatik tahmin oluşturulamadı." }, { status: 404 });
    const row = data[0];
    return NextResponse.json({
      estimate: Number(row.estimate),
      min: Number(row.estimate_min),
      max: Number(row.estimate_max),
      confidence: row.confidence,
    });
  } catch {
    return NextResponse.json({ error: "Tahmini fiyat hesaplanamadı." }, { status: 500 });
  }
}
