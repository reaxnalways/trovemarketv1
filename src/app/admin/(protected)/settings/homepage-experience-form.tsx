"use client";

import { FormEvent, useState } from "react";
import { saveHomepageExperienceSettings } from "./actions";

type Transition = "slide" | "fade" | "zoom" | "flip" | "blur" | "stack";
type Reveal = "rise" | "fade" | "zoom" | "left" | "right" | "blur" | "tilt" | "none";

type Props = {
  initial: {
    announcementEnabled: boolean; announcementItems: string[]; announcementSpeedSeconds: number; announcementPauseOnHover: boolean;
    sliderAutoplay: boolean; sliderIntervalSeconds: number; sliderTransition: Transition; sliderRevealEffect: Reveal; sliderPauseOnHover: boolean;
  };
};

export function HomepageExperienceForm({ initial }: Props) {
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(null); const form = new FormData(event.currentTarget);
    try {
      await saveHomepageExperienceSettings({
        announcementEnabled: form.get("announcementEnabled") === "on",
        announcementItems: String(form.get("announcementItems") || "").split("\n").map((item)=>item.trim()).filter(Boolean),
        announcementSpeedSeconds: Number(form.get("announcementSpeedSeconds") || 24),
        announcementPauseOnHover: form.get("announcementPauseOnHover") === "on",
        sliderAutoplay: form.get("sliderAutoplay") === "on",
        sliderIntervalSeconds: Number(form.get("sliderIntervalSeconds") || 3),
        sliderTransition: String(form.get("sliderTransition") || "slide") as Transition,
        sliderRevealEffect: String(form.get("sliderRevealEffect") || "rise") as Reveal,
        sliderPauseOnHover: form.get("sliderPauseOnHover") === "on",
      });
      setMessage("Ana sayfa hareket ayarları kaydedildi.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Ayarlar kaydedilemedi."); } finally { setBusy(false); }
  }

  return <form className="adminListingForm" onSubmit={submit}>
    <label className="adminField adminFieldWide">Akan banner metinleri<textarea name="announcementItems" defaultValue={initial.announcementItems.join("\n")} /><small>Her satır ayrı bir kayan mesaj olur.</small></label>
    <label className="adminField">Banner tur süresi (sn)<input name="announcementSpeedSeconds" type="number" min="8" max="120" defaultValue={initial.announcementSpeedSeconds} /></label>
    <label className="adminField">Slider bekleme süresi (sn)<input name="sliderIntervalSeconds" type="number" min="2" max="15" defaultValue={initial.sliderIntervalSeconds} /><small>Bir görselin ekranda kalacağı süre.</small></label>
    <label className="adminField">Slider geçiş efekti<select name="sliderTransition" defaultValue={initial.sliderTransition}><option value="slide">Yana Kaydır</option><option value="fade">Soluk Geçiş</option><option value="zoom">Yakınlaştır</option><option value="flip">3D Çevir</option><option value="blur">Bulanık Geçiş</option><option value="stack">Kart Destesi</option></select></label>
    <label className="adminField">Sayfaya giriş efekti<select name="sliderRevealEffect" defaultValue={initial.sliderRevealEffect}><option value="rise">Aşağıdan Yüksel</option><option value="fade">Soluk Görün</option><option value="zoom">Yakınlaşarak Görün</option><option value="left">Soldan Gel</option><option value="right">Sağdan Gel</option><option value="blur">Bulanıktan Netleş</option><option value="tilt">3D Eğilerek Gel</option><option value="none">Efekt Yok</option></select></label>
    <label className="adminField"><span><input name="announcementEnabled" type="checkbox" defaultChecked={initial.announcementEnabled} /> Akan banner açık</span></label>
    <label className="adminField"><span><input name="announcementPauseOnHover" type="checkbox" defaultChecked={initial.announcementPauseOnHover} /> Banner üzerine gelince dursun</span></label>
    <label className="adminField"><span><input name="sliderAutoplay" type="checkbox" defaultChecked={initial.sliderAutoplay} /> Slider otomatik oynasın</span></label>
    <label className="adminField"><span><input name="sliderPauseOnHover" type="checkbox" defaultChecked={initial.sliderPauseOnHover} /> Slider üzerine gelince dursun</span></label>
    <div className="adminFormActions adminFieldWide"><button className="adminButton" disabled={busy} type="submit">{busy?"Kaydediliyor...":"Ana Sayfa Ayarlarını Kaydet"}</button></div>
    {message ? <p className="adminStatus adminFieldWide">{message}</p> : null}
  </form>;
}
