import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trove Teknoloji",
  description: "Teknoloji ilan, teknik servis ve ürün takip platformu",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
