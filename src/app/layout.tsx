import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trove Teknoloji",
  description: "Teknoloji ilan, teknik servis ve ürün takip platformu",
  applicationName: "Trove Teknoloji",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/app-icon.svg", type: "image/svg+xml" }],
    shortcut: "/app-icon.svg",
    apple: [{ url: "/app-icon.svg", type: "image/svg+xml" }],
  },
  appleWebApp: {
    capable: true,
    title: "Trove",
    statusBarStyle: "default",
  },
};

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
