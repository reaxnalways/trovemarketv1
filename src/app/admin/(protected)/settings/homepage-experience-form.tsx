"use client";

import { FormEvent, useState } from "react";
import { saveHomepageExperienceSettings } from "./actions";

type Props = {
  initial: {
    announcementEnabled: boolean;
    announcementItems: string[];
    announcementSpeedSeconds: number;
    announcementPauseOnHover: boolean;
    sliderAutoplay: boolean;
    sliderIntervalSeconds: number;
    sliderTransition: "slide" | "fade" | "zoom";
    sliderRevealEffect: "rise" | "fade" | "zoom" | "none";
    sliderPauseOnHover: boolean;
  };
};

export function HomepageExperienceForm({ initial }: Props) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage(null);
    const form = new FormData(event.currentTarget);
    try {
      await saveHomepageExperienceSettings({
        announcementEnabled: form.get("announcementEnabled") === "on",
        announcementItems: String(form.get("announcementItems") || "").split("\n").map((item) => item.trim()).filter(Boolean),
        announcementSpeedSeconds: Number(form.get("announcementSpeedSeconds") || 24),
        announcementPauseOnHover: form.get("announcementPauseOnHover") === "on",
        sliderAutoplay: form.get("sliderAutoplay") === "on",
        sliderIntervalSeconds: Number(form.get("sliderIntervalSeconds") || 3),
        sliderTransition: String(form.get("sliderTransition") || "slide") as "slide" | "fade" | "zoom",
        sliderRevealEffect: String(form.get("sliderRevealEffect") || "rise") as "rise" | "fade" | "zoom" | "none",
        sliderPauseOnHover: form.get("sliderPauseOnHover") === "on",
      });
      setMessage("Ana sayfa hareket ayarları kaydedildi.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ayarlar kaydedilemedi.");
    } finally { setBusy(false); }
  }

  return <form className="adminListingForm" onSubmit={submit}>
    <label className="adminField adminFieldWide">Akan banner metinleri<textarea name="announcementItems" defaultValue={initial.announcementItems.join("\n")} /><small>Her satır ayrı bir kayan mesaj olur. En fazla 12 satır önerilir.</small></label>
    <label className="adminField">Banner tur süresi (sn)<input name="announcementSpeedSeconds" type="number" min="8" max="120" defaultValue={initial.announcementSpeedSeconds} /></label>
    <label className="adminField">Slider geçiş süresi (sn)<input name="sliderIntervalSeconds" type="number" min="2" max="15" defaultValue={initial.sliderIntervalSeconds} /></label>
    <label className="adminField">Slider geçiş efekti<select name="sliderTransition" defaultValue={initial.sliderTransition}><option value="slide">Yana kaydır</option><option value="fade">Soluk geçiş</option><option value="zoom">Yakınlaştır</option></select></label>
    <label className="adminField">Sayfaya giriş efekti<select name="sliderRevealEffect" defaultValue={initial.sliderRevealEffect}><option value="rise">Aşağıdan yüksel</option><option value="fade">Soluk görün</option><option value="zoom">Yakınlaşarak görün</option><option value="none">Efekt yok</option></select></label>
    <label className="adminField"><span><input name="announcementEnabled" type="checkbox" defaultChecked={initial.announcementEnabled} /> Akan banner açık</span></label>
    <label className="adminField"><span><input name="announcementPauseOnHover" type="checkbox" defaultChecked={initial.announcementPauseOnHover} /> Banner üzerine gelince dursun</span></label>
    <label className="adminField"><span><input name="sliderAutoplay" type="checkbox" defaultChecked={initial.sliderAutoplay} /> Slider otomatik oynasın</span></label>
    <label className="adminField"><span><input name="sliderPauseOnHover" type="checkbox" defaultChecked={initial.sliderPauseOnHover} /> Slider üzerine gelince dursun</span></label>
    <div className="adminFormActions adminFieldWide"><button className="adminButton" disabled={busy} type="submit">{busy ? "Kaydediliyor..." : "Banner & Slider Ayarlarını Kaydet"}</button></div>
    {message ? <p className="adminStatus adminFieldWide">{message}</p> : null}
  </form>;
}
