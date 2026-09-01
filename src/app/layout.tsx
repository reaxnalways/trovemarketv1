import type { Metadata, Viewport } from "next";
import { getLocale } from "../modules/i18n";
import { getPublicSiteSettings } from "../modules/settings/public-settings";
import { SiteFooter } from "../components/site-footer";
import "./globals.css";

export const viewport: Viewport = { themeColor: "#080a0f" };

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();
  const appIconUrl = settings.app_icon_url || settings.logo_url || "/api/app-icon?size=512";

  return {
    title: settings.site_meta_title,
    description: settings.site_meta_description,
    applicationName: settings.pwa_name,
    manifest: "/manifest.webmanifest",
    icons: {
      icon: [{ url: appIconUrl, type: "image/png" }],
      shortcut: appIconUrl,
      apple: [{ url: appIconUrl, type: "image/png" }],
    },
    appleWebApp: { capable: true, title: settings.pwa_name, statusBarStyle: "black-translucent" },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  return <html lang={locale}><body>{children}<SiteFooter /></body></html>;
}
