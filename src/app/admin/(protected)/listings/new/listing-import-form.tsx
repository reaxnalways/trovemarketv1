"use client";

import { createBrowserClient } from "@supabase/ssr";
import { FormEvent, useState } from "react";
import { createImportedDraftListing } from "./actions";

type ListingImportFormProps = {
  supabaseUrl: string;
  supabasePublishableKey: string;
  initialError?: string;
};

const MAX_IMAGES = 12;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

function fileExtension(file: File): string {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension && /^[a-z0-9]+$/.test(extension)) return extension;
  return file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : file.type === "image/avif" ? "avif" : "jpg";
}

export function ListingImportForm({ supabaseUrl, supabasePublishableKey, initialError }: ListingImportFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [sourceUrl, setSourceUrl] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setClientError(null);

    if (!sourceUrl.trim()) {
      setClientError("Sahibinden ilan linki zorunludur.");
      return;
    }
    if (files.length === 0) {
      setClientError("En az bir ürün görseli seçmelisin.");
      return;
    }
    if (files.length > MAX_IMAGES) {
      setClientError(`En fazla ${MAX_IMAGES} görsel yükleyebilirsin.`);
      return;
    }

    for (const file of files) {
      if (!ALLOWED_TYPES.has(file.type)) {
        setClientError("Görseller JPG, PNG, WEBP veya AVIF olmalıdır.");
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setClientError(`${file.name} 10 MB sınırını aşıyor.`);
        return;
      }
    }

    setBusy(true);
    const supabase = createBrowserClient(supabaseUrl, supabasePublishableKey);
    const imageUrls: string[] = [];

    try {
      setStatus("Görseller yükleniyor...");
      for (const file of files) {
        const path = `drafts/${crypto.randomUUID()}.${fileExtension(file)}`;
        const { error } = await supabase.storage.from("product-images").upload(path, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false,
        });
        if (error) throw new Error(`Görsel yüklenemedi: ${error.message}`);

        const { data } = supabase.storage.from("product-images").getPublicUrl(path);
        imageUrls.push(data.publicUrl);
      }

      setStatus("Sahibinden bilgileri alınıyor ve taslak oluşturuluyor...");
      await createImportedDraftListing(sourceUrl.trim(), imageUrls);
    } catch (error) {
      setBusy(false);
      setStatus(null);
      setClientError(error instanceof Error ? error.message : "İlan oluşturulamadı.");
    }
  }

  return (
    <form className="adminImportForm" onSubmit={handleSubmit}>
      <div className="adminFlowSteps" aria-label="İlan oluşturma adımları">
        <span>1. Görseller</span>
        <span>2. Sahibinden linki</span>
        <span>3. Bilgileri çek & kaydet</span>
      </div>

      {initialError ? <p className="adminError">{initialError}</p> : null}
      {clientError ? <p className="adminError">{clientError}</p> : null}
      {status ? <p className="adminStatus">{status}</p> : null}

      <label className="adminField adminUploadBox">
        Ürün görselleri
        <input
          accept="image/jpeg,image/png,image/webp,image/avif"
          disabled={busy}
          multiple
          onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
          type="file"
        />
        <small>{files.length ? `${files.length} görsel seçildi` : `En fazla ${MAX_IMAGES} görsel, görsel başına 10 MB`}</small>
      </label>

      <label className="adminField">
        Sahibinden ilan linki
        <input
          disabled={busy}
          onChange={(event) => setSourceUrl(event.target.value)}
          placeholder="https://www.sahibinden.com/ilan/..."
          type="url"
          value={sourceUrl}
        />
        <small>Başlık, fiyat, marka/model, açıklama ve uygun ürün detayları linkten alınır.</small>
      </label>

      <button className="adminButton adminImportButton" disabled={busy} type="submit">
        {busy ? "İşleniyor..." : "Bilgileri Çek ve Taslak Oluştur"}
      </button>
    </form>
  );
}
