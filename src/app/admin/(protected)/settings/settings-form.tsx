"use client";

import { createBrowserClient } from "@supabase/ssr";
import { FormEvent, useState } from "react";
import { saveSiteSettings } from "./actions";

type SettingsFormProps = {
  supabaseUrl: string;
  supabasePublishableKey: string;
  initial: {
    siteName: string;
    siteTagline: string;
    whatsappNumber: string;
    whatsappDefaultMessage: string;
    logoUrl: string | null;
  };
};

const MAX_LOGO_BYTES = 1024 * 1024;

export function SettingsForm({ supabaseUrl, supabasePublishableKey, initial }: SettingsFormProps) {
  const [siteName, setSiteName] = useState(initial.siteName);
  const [siteTagline, setSiteTagline] = useState(initial.siteTagline);
  const [whatsappNumber, setWhatsappNumber] = useState(initial.whatsappNumber);
  const [whatsappDefaultMessage, setWhatsappDefaultMessage] = useState(initial.whatsappDefaultMessage);
  const [logoUrl, setLogoUrl] = useState<string | null>(initial.logoUrl);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setStatus(null);

    try {
      let nextLogoUrl = logoUrl;

      if (logoFile) {
        if (logoFile.type !== "image/svg+xml" && !logoFile.name.toLowerCase().endsWith(".svg")) {
          throw new Error("Logo yalnızca SVG formatında olmalıdır.");
        }
        if (logoFile.size > MAX_LOGO_BYTES) throw new Error("SVG logo en fazla 1 MB olabilir.");

        setStatus("Logo yükleniyor...");
        const supabase = createBrowserClient(supabaseUrl, supabasePublishableKey);
        const path = `logo/trove-logo-${Date.now()}.svg`;
        const { error: uploadError } = await supabase.storage.from("brand-assets").upload(path, logoFile, {
          contentType: "image/svg+xml",
          cacheControl: "3600",
          upsert: false,
        });
        if (uploadError) throw new Error(`Logo yüklenemedi: ${uploadError.message}`);

        const { data } = supabase.storage.from("brand-assets").getPublicUrl(path);
        nextLogoUrl = data.publicUrl;
      }

      setStatus("Ayarlar kaydediliyor...");
      await saveSiteSettings({
        siteName,
        siteTagline,
        whatsappNumber,
        whatsappDefaultMessage,
        logoUrl: nextLogoUrl,
      });
      setLogoUrl(nextLogoUrl);
      setLogoFile(null);
      setStatus("Ayarlar kaydedildi. Logo müşteri sayfalarında güncellendi.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Ayarlar kaydedilemedi.");
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="adminImportForm" onSubmit={handleSubmit}>
      {error ? <p className="adminError">{error}</p> : null}
      {status ? <p className="adminStatus">{status}</p> : null}

      <div className="adminLogoPreview" style={{ minHeight: 96, display: "flex", alignItems: "center" }}>
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Mevcut site logosu"
            width={180}
            height={72}
            style={{ width: "auto", height: "auto", maxWidth: 180, maxHeight: 72, objectFit: "contain", display: "block" }}
          />
        ) : <span>Henüz logo yok</span>}
      </div>

      <label className="adminField adminUploadBox">
        SVG logo
        <input
          accept="image/svg+xml,.svg"
          disabled={busy}
          onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)}
          type="file"
        />
        <small>Yalnızca SVG, en fazla 1 MB. Kaydettiğinde header ve müşteri sayfalarında kullanılır.</small>
      </label>

      <label className="adminField">
        Site adı
        <input disabled={busy} maxLength={80} onChange={(event) => setSiteName(event.target.value)} value={siteName} />
      </label>

      <label className="adminField">
        Ana slogan
        <input disabled={busy} maxLength={180} onChange={(event) => setSiteTagline(event.target.value)} value={siteTagline} />
      </label>

      <label className="adminField">
        WhatsApp numarası
        <input disabled={busy} onChange={(event) => setWhatsappNumber(event.target.value)} placeholder="905551234567" value={whatsappNumber} />
      </label>

      <label className="adminField">
        Varsayılan WhatsApp mesajı
        <textarea disabled={busy} maxLength={500} onChange={(event) => setWhatsappDefaultMessage(event.target.value)} value={whatsappDefaultMessage} />
      </label>

      <button className="adminButton adminImportButton" disabled={busy} type="submit">
        {busy ? "Kaydediliyor..." : "Ayarları Kaydet"}
      </button>
    </form>
  );
}
