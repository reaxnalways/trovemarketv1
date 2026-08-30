import { NextRequest, NextResponse } from "next/server";
import { getPublicSiteSettings } from "../../../modules/settings/public-settings";

function clean(value: string | null, max = 500) {
  return (value ?? "").trim().slice(0, max);
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const name = clean(searchParams.get("name"), 120);
  const deviceType = clean(searchParams.get("deviceType"), 80);
  const brand = clean(searchParams.get("brand"), 100);
  const model = clean(searchParams.get("model"), 160);
  const complaint = clean(searchParams.get("complaint"), 300);
  const complaintDetail = clean(searchParams.get("complaintDetail"), 800);
  const note = clean(searchParams.get("note"), 800);

  if (!name || !deviceType || !brand || !model || !complaint) {
    return NextResponse.redirect(new URL("/kategori/teknik-servis?form=missing", request.url));
  }

  const settings = await getPublicSiteSettings();
  const digits = settings.whatsapp_number?.replace(/\D/g, "") ?? "";

  if (!digits) {
    return NextResponse.redirect(new URL("/kategori/teknik-servis?form=whatsapp-missing", request.url));
  }

  const message = [
    "Merhaba Trove Teknoloji, teknik servis kaydı oluşturmak istiyorum.",
    "",
    `Ad Soyad: ${name}`,
    `Cihaz Türü: ${deviceType}`,
    `Marka: ${brand}`,
    `Model: ${model}`,
    `Arıza / Şikayet: ${complaint}`,
    complaintDetail ? `Arıza Detayı: ${complaintDetail}` : null,
    note ? `Ek Not: ${note}` : null,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  return NextResponse.redirect(`https://wa.me/${digits}?text=${encodeURIComponent(message)}`);
}
