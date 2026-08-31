import type { Metadata, Viewport } from "next";
import { getPublicSiteSettings } from "@/modules/settings/public-settings";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();
  const iconUrl = "/api/app-icon?size=512";

  return {
    title: settings.siteName,
    description: settings.siteTagline || "Teknoloji ilan, teknik servis ve ürün takip platformu",
    applicationName: settings.siteName,
    manifest: "/manifest.webmanifest",
    icons: {
      icon: [{ url: iconUrl, type: "image/png" }],
      shortcut: iconUrl,
      apple: [{ url: "/api/app-icon?size=180", type: "image/png", sizes: "180x180" }],
    },
    appleWebApp: {
      capable: true,
      title: settings.siteName,
      statusBarStyle: "default",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#111111",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
