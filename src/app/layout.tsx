import type { Metadata, Viewport } from "next";
import { getPublicSiteSettings } from "../modules/settings/public-settings";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#080a0f",
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();
  const icon = settings.logo_url || undefined;
  return {
    title: settings.site_meta_title,
    description: settings.site_meta_description,
    applicationName: settings.pwa_name,
    manifest: "/manifest.webmanifest",
    icons: icon ? { icon, shortcut: icon, apple: icon } : undefined,
    appleWebApp: {
      capable: true,
      title: settings.pwa_name,
      statusBarStyle: "black-translucent",
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
