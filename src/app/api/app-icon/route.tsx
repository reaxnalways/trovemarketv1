import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { getPublicSiteSettings } from "../../../modules/settings/public-settings";

export const dynamic = "force-dynamic";

const ALLOWED_SIZES = new Set([180, 192, 512]);

export async function GET(request: NextRequest) {
  const requestedSize = Number(request.nextUrl.searchParams.get("size"));
  const size = ALLOWED_SIZES.has(requestedSize) ? requestedSize : 512;
  const settings = await getPublicSiteSettings();
  const logoUrl = settings.logo_url || settings.app_icon_url || new URL("/app-icon.svg", request.url).toString();

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff", padding: "12%" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl} alt="" width={Math.round(size * 0.76)} height={Math.round(size * 0.76)} style={{ objectFit: "contain" }} />
      </div>
    ),
    { width: size, height: size, headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
