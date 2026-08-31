import type { MetadataRoute } from "next";
import { getPublicSiteSettings } from "../modules/settings/public-settings";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getPublicSiteSettings();
  const icon = settings.app_icon_url || settings.logo_url;
  return {
    name: settings.pwa_name,
    short_name: settings.pwa_name.slice(0, 24),
    description: settings.site_meta_description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#080a0f",
    theme_color: "#080a0f",
    icons: icon ? [{ src: icon, sizes: settings.app_icon_url ? "512x512" : "any", type: settings.app_icon_url ? "image/png" : "image/svg+xml", purpose: settings.app_icon_url ? "maskable" : "any" }] : [],
  };
}
