import { NextRequest, NextResponse } from "next/server";
import { getPublicSiteSettings } from "../../../modules/settings/public-settings";

function clean(value: string | null, max = 500) {
  return (value ?? "").trim().slice(0, max);
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const name = clean(searchParams.get("name"), 120);
  const phone = clean(searchParams.get("phone"), 40);
  const deviceType = clean(searchParams.get("deviceType"), 80);
  const brandModel = clean(searchParams.get("brandModel"), 160);
  const complaint = clean(searchParams.get("complaint"), 800);
  const note = clean(searchParams.get("note"), 800);

  if (!name || !phone || !deviceType || !brandModel || !complaint) {
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
    `Telefon: ${phone}`,
    `Cihaz Türü: ${deviceType}`,
    `Marka / Model: ${brandModel}`,
    `Şikayet / Arıza: ${complaint}`,
    note ? `Ek Not: ${note}` : null,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  return NextResponse.redirect(`https://wa.me/${digits}?text=${encodeURIComponent(message)}`);
}
