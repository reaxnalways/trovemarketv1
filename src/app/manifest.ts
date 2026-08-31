import type { MetadataRoute } from "next";
import { getPublicSiteSettings } from "../modules/settings/public-settings";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getPublicSiteSettings();
  return {
    name: settings.pwa_name,
    short_name: settings.pwa_name.slice(0, 24),
    description: settings.site_meta_description,
    start_url: "/",
    display: "standalone",
    background_color: "#080a0f",
    theme_color: "#080a0f",
    icons: settings.logo_url ? [{ src: settings.logo_url, sizes: "any", type: "image/svg+xml", purpose: "any" }] : [],
  };
}
