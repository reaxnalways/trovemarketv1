"use client";

import { createBrowserClient } from "@supabase/ssr";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { HomepageSlide, HomepageSlideSection } from "@/modules/homepage/slides";

const SECTION_LABELS: Record<HomepageSlideSection, string> = {
  campaigns: "Kampanyalar",
  phones: "Telefonlar",
  computers: "Bilgisayarlar",
  wearables: "Giyilebilir Teknoloji",
  accessories: "Aksesuarlar & Yedek Parçalar",
};

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const MAX_BYTES = 10 * 1024 * 1024;

export function HomepageSliderManager({ initialSlides, supabaseUrl, supabasePublishableKey }: { initialSlides: HomepageSlide[]; supabaseUrl: string; supabasePublishableKey: string }) {
  const router = useRouter();
  const [slides, setSlides] = useState(initialSlides);
  const [section, setSection] = useState<HomepageSlideSection>("campaigns");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const supabase = useMemo(() => createBrowserClient(supabaseUrl, supabasePublishableKey), [supabaseUrl, supabasePublishableKey]);

  async function addSlide(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return setMessage("Önce bir görsel seçin.");
    if (!ALLOWED_TYPES.has(file.type)) return setMessage("JPG, PNG, WEBP veya AVIF yükleyin.");
    if (file.size > MAX_BYTES) return setMessage("Görsel 10 MB sınırını aşıyor.");
    const form = new FormData(event.currentTarget);
    setBusy(true); setMessage(null);
    try {
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${section}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("homepage-slides").upload(path, file, { contentType: file.type, cacheControl: "3600" });
      if (uploadError) throw uploadError;
      const { data: publicData } = supabase.storage.from("homepage-slides").getPublicUrl(path);
      const payload = {
        section,
        title: String(form.get("title") || "").trim() || null,
        subtitle: String(form.get("subtitle") || "").trim() || null,
        link_url: String(form.get("linkUrl") || "").trim() || null,
        image_url: publicData.publicUrl,
        sort_order: Number(form.get("sortOrder") || 0),
        is_active: true,
      };
      const { data, error } = await supabase.from("homepage_slides").insert(payload).select("id,section,title,subtitle,image_url,link_url,sort_order,is_active").single();
      if (error) throw error;
      setSlides((current) => [...current, data as HomepageSlide].sort((a,b) => a.sort_order-b.sort_order));
      setFile(null); event.currentTarget.reset(); setSection("campaigns");
      setMessage("Slider görseli eklendi."); router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Görsel eklenemedi.");
    } finally { setBusy(false); }
  }

  async function removeSlide(slide: HomepageSlide) {
    if (!confirm("Bu slider görseli silinsin mi?")) return;
    setBusy(true); setMessage(null);
    const { error } = await supabase.from("homepage_slides").delete().eq("id", slide.id);
    if (error) setMessage(error.message); else { setSlides((current) => current.filter((item) => item.id !== slide.id)); setMessage("Slider görseli silindi."); router.refresh(); }
    setBusy(false);
  }

  async function toggleSlide(slide: HomepageSlide) {
    setBusy(true);
    const { error } = await supabase.from("homepage_slides").update({ is_active: !slide.is_active }).eq("id", slide.id);
    if (error) setMessage(error.message); else { setSlides((current) => current.map((item) => item.id === slide.id ? { ...item, is_active: !item.is_active } : item)); router.refresh(); }
    setBusy(false);
  }

  function chooseFile(event: ChangeEvent<HTMLInputElement>) { setFile(event.target.files?.[0] ?? null); }

  return <div className="adminSliderManager">
    <form className="adminDashboardCard adminListingForm" onSubmit={addSlide}>
      <label className="adminField">Bölüm<select value={section} onChange={(e)=>setSection(e.target.value as HomepageSlideSection)}>{Object.entries(SECTION_LABELS).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label>
      <label className="adminField">Sıra<input name="sortOrder" type="number" defaultValue="0" /></label>
      <label className="adminField adminFieldWide">Görsel<input accept="image/jpeg,image/png,image/webp,image/avif" type="file" onChange={chooseFile} required /></label>
      <label className="adminField">Başlık<input name="title" placeholder="İsteğe bağlı" /></label>
      <label className="adminField">Kısa metin<input name="subtitle" placeholder="İsteğe bağlı" /></label>
      <label className="adminField adminFieldWide">Bağlantı<input name="linkUrl" placeholder="/kategori/telefon veya https://..." /></label>
      <div className="adminFormActions adminFieldWide"><button className="adminButton" disabled={busy} type="submit">{busy ? "Yükleniyor..." : "Slider görseli ekle"}</button></div>
      {message ? <p className="adminLead adminFieldWide">{message}</p> : null}
    </form>

    {Object.entries(SECTION_LABELS).map(([key,label]) => {
      const sectionSlides = slides.filter((slide)=>slide.section===key);
      return <section className="adminDashboardCard" key={key}><div className="sectionHeading"><h2>{label}</h2><span>{sectionSlides.length} görsel</span></div>{sectionSlides.length ? <div className="adminSliderGrid">{sectionSlides.map((slide)=><article className="adminSliderCard" key={slide.id}><img src={slide.image_url} alt={slide.title || label} /><div><strong>{slide.title || "Başlıksız"}</strong><small>Sıra: {slide.sort_order} · {slide.is_active ? "Aktif" : "Pasif"}</small></div><div className="adminInlineActions"><button className="adminButton adminButtonSecondary" disabled={busy} onClick={()=>toggleSlide(slide)} type="button">{slide.is_active ? "Gizle" : "Göster"}</button><button className="adminButton adminDangerButton" disabled={busy} onClick={()=>removeSlide(slide)} type="button">Sil</button></div></article>)}</div> : <p className="emptyState">Henüz görsel eklenmedi. Ana sayfada yer tutucu gösteriliyor.</p>}</section>;
    })}
  </div>;
}
