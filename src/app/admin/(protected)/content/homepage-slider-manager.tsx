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

const SECTION_GUIDES: Record<HomepageSlideSection, { size: string; ratio: number; link: string; note: string }> = {
  campaigns: { size: "1680 × 720 px", ratio: 21 / 9, link: "/kategori/telefon", note: "Kampanya bannerı. Geniş yatay görsel kullan; önemli metinleri görselin kenarlarına yaslama." },
  phones: { size: "1600 × 900 px", ratio: 16 / 9, link: "/kategori/telefon", note: "Telefon kampanyası, marka veya ürün grubu görselleri için." },
  computers: { size: "1600 × 900 px", ratio: 16 / 9, link: "/kategori/laptop-bilgisayar", note: "Laptop ve bilgisayar ürün grubu görselleri için." },
  wearables: { size: "1600 × 900 px", ratio: 16 / 9, link: "/kategori/giyilebilir-teknoloji", note: "Saat, kulaklık ve diğer giyilebilir teknoloji görselleri için." },
  accessories: { size: "1600 × 900 px", ratio: 16 / 9, link: "/kategori/aksesuar-yedek-parca", note: "Aksesuar ve yedek parça ürün grubu görselleri için." },
};

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const MAX_BYTES = 10 * 1024 * 1024;

function validLink(value: string) {
  return !value || value.startsWith("/") || value.startsWith("https://") || value.startsWith("http://");
}

export function HomepageSliderManager({ initialSlides, supabaseUrl, supabasePublishableKey }: { initialSlides: HomepageSlide[]; supabaseUrl: string; supabasePublishableKey: string }) {
  const router = useRouter();
  const [slides, setSlides] = useState(initialSlides);
  const [section, setSection] = useState<HomepageSlideSection>("campaigns");
  const [file, setFile] = useState<File | null>(null);
  const [fileHint, setFileHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const supabase = useMemo(() => createBrowserClient(supabaseUrl, supabasePublishableKey), [supabaseUrl, supabasePublishableKey]);
  const guide = SECTION_GUIDES[section];

  async function addSlide(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!file) return setMessage("Önce bir görsel seçin.");
    if (!ALLOWED_TYPES.has(file.type)) return setMessage("JPG, PNG, WEBP veya AVIF yükleyin.");
    if (file.size > MAX_BYTES) return setMessage("Görsel 10 MB sınırını aşıyor.");
    const form = new FormData(formElement);
    const linkUrl = String(form.get("linkUrl") || "").trim();
    if (!validLink(linkUrl)) return setMessage("Bağlantı /kategori/telefon gibi / ile veya https:// ile başlamalıdır.");

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
        link_url: linkUrl || null,
        image_url: publicData.publicUrl,
        sort_order: Number(form.get("sortOrder") || 0),
        is_active: true,
      };
      const { data, error } = await supabase.from("homepage_slides").insert(payload).select("id,section,title,subtitle,image_url,link_url,sort_order,is_active").single();
      if (error) throw error;
      setSlides((current) => [...current, data as HomepageSlide].sort((a,b) => a.sort_order-b.sort_order));
      setFile(null); setFileHint(null); formElement.reset(); setSection("campaigns");
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

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected); setFileHint(null);
    if (!selected || !ALLOWED_TYPES.has(selected.type)) return;
    const url = URL.createObjectURL(selected);
    const image = new Image();
    image.onload = () => {
      const actualRatio = image.naturalWidth / image.naturalHeight;
      const difference = Math.abs(actualRatio - guide.ratio) / guide.ratio;
      setFileHint(difference > 0.08
        ? `Seçilen görsel ${image.naturalWidth} × ${image.naturalHeight}px. Önerilen oran ${guide.size}; mevcut görsel kırpılabilir.`
        : `Görsel oranı uygun: ${image.naturalWidth} × ${image.naturalHeight}px.`);
      URL.revokeObjectURL(url);
    };
    image.onerror = () => URL.revokeObjectURL(url);
    image.src = url;
  }

  return <div className="adminSliderManager">
    <section className="adminDashboardCard" style={{marginBottom:18}}>
      <h2 style={{marginTop:0}}>Slider ekleme yönergesi</h2>
      <p className="adminLead"><strong>{SECTION_LABELS[section]}</strong> için önerilen görsel: <strong>{guide.size}</strong>. WEBP/AVIF tercih et; dosyayı mümkünse 1 MB altında tut. Başlık ve kısa metin isteğe bağlıdır.</p>
      <div className="adminFlowSteps">
        <span>1. Bölümü seç</span><span>2. Doğru oranda görsel yükle</span><span>3. Gerekirse bağlantı ekle</span>
      </div>
      <p className="adminLead" style={{marginBottom:0}}>{guide.note}<br />Örnek bağlantı: <code>{guide.link}</code>. Diğer geçerli örnekler: <code>/takas</code>, <code>/kategori/teknik-servis</code>, <code>/ilan/TEL-001</code> veya tam bir <code>https://...</code> adresi. Bağlantı boş bırakılırsa görsel tıklanmaz.</p>
    </section>

    <form className="adminDashboardCard adminListingForm" onSubmit={addSlide}>
      <label className="adminField">Bölüm<select value={section} onChange={(e)=>{setSection(e.target.value as HomepageSlideSection);setFileHint(null);}}>{Object.entries(SECTION_LABELS).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label>
      <label className="adminField">Sıra<input name="sortOrder" type="number" defaultValue="0" /><small>0 ilk sıradır. 1, 2, 3 diye devam edebilirsin.</small></label>
      <label className="adminField adminFieldWide">Görsel<input accept="image/jpeg,image/png,image/webp,image/avif" type="file" onChange={chooseFile} required /><small>Önerilen: {guide.size} · JPG/PNG/WEBP/AVIF · Maksimum 10 MB.</small>{fileHint ? <small>{fileHint}</small> : null}</label>
      <label className="adminField">Başlık<input name="title" placeholder="İsteğe bağlı" /></label>
      <label className="adminField">Kısa metin<input name="subtitle" placeholder="İsteğe bağlı" /></label>
      <label className="adminField adminFieldWide">Bağlantı (isteğe bağlı)<input name="linkUrl" placeholder={guide.link} /><small>Site içi bağlantılar / ile başlamalıdır. Örn: {guide.link}</small></label>
      <div className="adminFormActions adminFieldWide"><button className="adminButton" disabled={busy} type="submit">{busy ? "Yükleniyor..." : "Slider görseli ekle"}</button></div>
      {message ? <p className="adminLead adminFieldWide">{message}</p> : null}
    </form>

    {Object.entries(SECTION_LABELS).map(([key,label]) => {
      const sectionSlides = slides.filter((slide)=>slide.section===key);
      return <section className="adminDashboardCard" key={key}><div className="sectionHeading"><h2>{label}</h2><span>{sectionSlides.length} görsel</span></div>{sectionSlides.length ? <div className="adminSliderGrid">{sectionSlides.map((slide)=><article className="adminSliderCard" key={slide.id}><img src={slide.image_url} alt={slide.title || label} /><div><strong>{slide.title || "Başlıksız"}</strong><small>Sıra: {slide.sort_order} · {slide.is_active ? "Aktif" : "Pasif"}{slide.link_url ? ` · ${slide.link_url}` : " · Bağlantı yok"}</small></div><div className="adminInlineActions"><button className="adminButton adminButtonSecondary" disabled={busy} onClick={()=>toggleSlide(slide)} type="button">{slide.is_active ? "Gizle" : "Göster"}</button><button className="adminButton adminDangerButton" disabled={busy} onClick={()=>removeSlide(slide)} type="button">Sil</button></div></article>)}</div> : <p className="emptyState">Henüz görsel eklenmedi. Ana sayfada yer tutucu gösteriliyor.</p>}</section>;
    })}
  </div>;
}
