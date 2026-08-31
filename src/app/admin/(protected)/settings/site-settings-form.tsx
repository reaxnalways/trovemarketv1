"use client";

import { FormEvent, useState } from "react";
import { saveSiteIdentitySettings } from "./actions";

export function SiteSettingsForm({ initial }: { initial: { metaTitle: string; metaDescription: string; pwaName: string } }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage(null);
    const form = new FormData(event.currentTarget);
    try {
      await saveSiteIdentitySettings({
        metaTitle: String(form.get("metaTitle") || ""),
        metaDescription: String(form.get("metaDescription") || ""),
        pwaName: String(form.get("pwaName") || ""),
      });
      setMessage("Site ayarları kaydedildi.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ayarlar kaydedilemedi.");
    } finally { setBusy(false); }
  }

  return <form className="adminListingForm" onSubmit={submit}>
    <label className="adminField adminFieldWide">Sekme / SEO başlığı<input name="metaTitle" maxLength={80} defaultValue={initial.metaTitle} /><small>Tarayıcı sekmesinde ve arama sonuçlarında kullanılan başlık.</small></label>
    <label className="adminField adminFieldWide">Site açıklaması<textarea name="metaDescription" maxLength={180} defaultValue={initial.metaDescription} /><small>Arama motorları ve uygulama manifesti için kısa açıklama.</small></label>
    <label className="adminField">Ana ekrana ekleme adı<input name="pwaName" maxLength={40} defaultValue={initial.pwaName} /><small>Telefon ana ekranına eklenince görünen uygulama adı.</small></label>
    <div className="adminFormActions adminFieldWide"><button className="adminButton" disabled={busy} type="submit">{busy ? "Kaydediliyor..." : "Site Ayarlarını Kaydet"}</button></div>
    {message ? <p className="adminStatus adminFieldWide">{message}</p> : null}
  </form>;
}
