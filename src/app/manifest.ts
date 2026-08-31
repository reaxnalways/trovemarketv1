import type { MetadataRoute } from "next";
import { getPublicSiteSettings } from "@/modules/settings/public-settings";

export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getPublicSiteSettings();
  const description = settings.siteTagline || "Teknoloji ilan, teknik servis ve ürün takip platformu";

  return {
    name: settings.siteName,
    short_name: settings.siteName.length > 12 ? "Trove" : settings.siteName,
    description,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#111111",
    icons: [
      {
        src: "/api/app-icon?size=192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/api/app-icon?size=512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };
}
