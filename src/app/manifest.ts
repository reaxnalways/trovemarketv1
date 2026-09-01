import type { MetadataRoute } from "next";
import { getPublicSiteSettings } from "../modules/settings/public-settings";

export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getPublicSiteSettings();
  const appIconUrl = settings.app_icon_url || settings.logo_url || "/api/app-icon?size=512";

  return {
    name: settings.pwa_name,
    short_name: settings.pwa_name.slice(0, 24),
    description: settings.site_meta_description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#080a0f",
    theme_color: "#080a0f",
    icons: [
      { src: appIconUrl, sizes: "any", type: "image/png", purpose: "any" },
      { src: appIconUrl, sizes: "any", type: "image/png", purpose: "maskable" },
    ],
  };
}
