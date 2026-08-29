"use client";

import { createBrowserClient } from "@supabase/ssr";
import { FormEvent, useEffect, useMemo, useState } from "react";
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

function moveItem<T>(items: T[], from: number, to: number) {
  const copy = [...items];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

export function ListingImportForm({ supabaseUrl, supabasePublishableKey, initialError }: ListingImportFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);

  useEffect(() => {
    return () => previews.forEach((preview) => URL.revokeObjectURL(preview.url));
  }, [previews]);

  function addFiles(selected: File[]) {
    setClientError(null);
    const next = [...files, ...selected];
    if (next.length > MAX_IMAGES) {
      setClientError(`En fazla ${MAX_IMAGES} görsel yükleyebilirsin.`);
      return;
    }
    setFiles(next);
  }

  function removeFile(index: number) {
    if (busy) return;
    setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function moveFile(index: number, direction: -1 | 1) {
    if (busy) return;
    const target = index + direction;
    if (target < 0 || target >= files.length) return;
    setFiles((current) => moveItem(current, index, target));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setClientError(null);

    if (!sourceUrl.trim()) {
      setClientError("Sahibinden ilan linki zorunludur.");
      return;
    }
    if (sourceText.trim().length < 20) {
      setClientError("Sahibinden ilan detaylarını kopyalayıp ilan metni alanına yapıştırmalısın.");
      return;
    }
    if (files.length === 0) {
      setClientError("En az bir ürün görseli seçmelisin.");
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
      setStatus("Görseller seçtiğin sırayla yükleniyor...");
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

      setStatus("Bilgiler ayrıştırılıyor, taslak hazırlanıyor ve kontrol ekranı açılıyor...");
      await createImportedDraftListing(sourceUrl.trim(), sourceText.trim(), imageUrls);
    } catch (error) {
      setBusy(false);
      setStatus(null);
      setClientError(error instanceof Error ? error.message : "İlan oluşturulamadı.");
    }
  }

  return (
    <form className="adminImportForm" onSubmit={handleSubmit}>
      <div className="adminFlowSteps" aria-label="İlan oluşturma adımları">
        <span>1. Görsel yükle</span>
        <span>2. Sahibinden linki</span>
        <span>3. Bilgileri ayır</span>
        <span>4. Kontrol et</span>
        <span>5. Yayınla</span>
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
          onChange={(event) => {
            addFiles(Array.from(event.target.files ?? []));
            event.currentTarget.value = "";
          }}
          type="file"
        />
        <small>{files.length ? `${files.length}/${MAX_IMAGES} görsel seçildi. İlk görsel kapak görselidir.` : `En fazla ${MAX_IMAGES} görsel, görsel başına 10 MB`}</small>
      </label>

      {previews.length ? (
        <div className="adminImagePreviewGrid" aria-label="Seçilen ürün görselleri">
          {previews.map((preview, index) => (
            <article className="adminImagePreviewCard" key={`${preview.file.name}-${preview.file.lastModified}-${index}`}>
              <div className="adminImagePreviewMedia">
                <img src={preview.url} alt={`${index + 1}. ürün görseli`} />
                <span className="adminImageOrder">{index === 0 ? "KAPAK" : index + 1}</span>
              </div>
              <div className="adminImagePreviewActions">
                <button disabled={busy || index === 0} onClick={() => moveFile(index, -1)} type="button" aria-label="Görseli sola taşı">←</button>
                <button disabled={busy || index === files.length - 1} onClick={() => moveFile(index, 1)} type="button" aria-label="Görseli sağa taşı">→</button>
                <button disabled={busy} onClick={() => removeFile(index)} type="button">Kaldır</button>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <label className="adminField">
        Sahibinden ilan linki
        <input
          disabled={busy}
          onChange={(event) => setSourceUrl(event.target.value)}
          placeholder="https://www.sahibinden.com/ilan/..."
          type="url"
          value={sourceUrl}
        />
        <small>Link kaynak referansı olarak ilan kaydında saklanır.</small>
      </label>

      <label className="adminField">
        Sahibinden ilan metni
        <textarea
          disabled={busy}
          onChange={(event) => setSourceText(event.target.value)}
          placeholder="Sahibinden ilan sayfasındaki başlık, fiyat, özellikler ve açıklama bölümünü kopyalayıp buraya yapıştır."
          rows={12}
          value={sourceText}
        />
        <small>Pil sağlığı ve cihaz kayıt bilgisi metinde varsa Trove bunları da ayırmaya çalışır. Taslak kaydedildikten sonra tüm alanları kontrol edebilirsin.</small>
      </label>

      <button className="adminButton adminImportButton" disabled={busy} type="submit">
        {busy ? "İşleniyor..." : "Taslak Oluştur ve Kontrol Et"}
      </button>
    </form>
  );
}
