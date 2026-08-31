import type { Metadata, Viewport } from "next";
import { getPublicSiteSettings } from "../modules/settings/public-settings";
import "./globals.css";

export const viewport: Viewport = { themeColor: "#080a0f" };

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();
  const browserIcon = settings.app_icon_url || settings.logo_url || undefined;
  return {
    title: settings.site_meta_title,
    description: settings.site_meta_description,
    applicationName: settings.pwa_name,
    manifest: "/manifest.webmanifest",
    icons: browserIcon ? {
      icon: [{ url: browserIcon, sizes: "512x512", type: settings.app_icon_url ? "image/png" : "image/svg+xml" }],
      shortcut: browserIcon,
      apple: [{ url: browserIcon, sizes: "180x180" }],
    } : undefined,
    appleWebApp: { capable: true, title: settings.pwa_name, statusBarStyle: "black-translucent" },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body>{children}</body></html>;
}
