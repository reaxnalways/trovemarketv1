import { NextResponse } from "next/server";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const deviceType = String(body.deviceType ?? "").trim();
    const faultCodes = Array.isArray(body.faultCodes) ? body.faultCodes.map(String).filter(Boolean) : [];
    if (!deviceType || !faultCodes.length) return NextResponse.json({ error: "Cihaz ve arıza seçimi gerekli." }, { status: 400 });
    const supabase = createPublicSupabaseClient();
    const { data, error } = await supabase.rpc("estimate_service_price", { p_device_type: deviceType, p_fault_codes: faultCodes });
    if (error || !data?.length) return NextResponse.json({ error: "Tahmini servis fiyatı oluşturulamadı." }, { status: 404 });
    return NextResponse.json({ min: Number(data[0].estimate_min), max: Number(data[0].estimate_max) });
  } catch {
    return NextResponse.json({ error: "Tahmini servis fiyatı hesaplanamadı." }, { status: 500 });
  }
}
