"use client";

import { useRouter } from "next/navigation";
import type { Locale } from "@/modules/i18n";

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const router = useRouter();

  function setLocale(next: Locale) {
    document.cookie = `trove_locale=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    document.documentElement.lang = next;
    router.refresh();
  }

  return (
    <div aria-label="Language" style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", display: "inline-flex", gap: 4, padding: 3, border: "1px solid rgba(255,255,255,.12)", borderRadius: 999, background: "rgba(255,255,255,.04)" }}>
      <button type="button" onClick={() => setLocale("tr")} aria-pressed={locale === "tr"} style={{ border: 0, borderRadius: 999, padding: "6px 9px", cursor: "pointer", background: locale === "tr" ? "rgba(255,255,255,.14)" : "transparent", color: "inherit", fontSize: 11, fontWeight: 800 }}>TR</button>
      <button type="button" onClick={() => setLocale("en")} aria-pressed={locale === "en"} style={{ border: 0, borderRadius: 999, padding: "6px 9px", cursor: "pointer", background: locale === "en" ? "rgba(255,255,255,.14)" : "transparent", color: "inherit", fontSize: 11, fontWeight: 800 }}>EN</button>
    </div>
  );
}
