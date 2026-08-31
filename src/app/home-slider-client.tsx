"use client";

import { useEffect, useRef, useState } from "react";
import type { HomepageSlide, HomepageSlideSection } from "../modules/homepage/slides";
import type { PublicSiteSettings } from "../modules/settings/public-settings";

type Props = {
  section: HomepageSlideSection;
  title: string;
  slides: HomepageSlide[];
  motion: Pick<PublicSiteSettings, "slider_autoplay" | "slider_interval_seconds" | "slider_transition" | "slider_reveal_effect" | "slider_pause_on_hover">;
};

export function HomeSlider({ section, title, slides, motion }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const id = section === "phones" ? "telefonlar" : section;
  const displaySlides: Array<HomepageSlide | null> = slides.length ? slides : [null, null, null];

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    if (motion.slider_reveal_effect === "none" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      node.classList.add("isVisible");
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        node.classList.add("isVisible");
        observer.disconnect();
      }
    }, { threshold: 0.16 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [motion.slider_reveal_effect]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail || !motion.slider_autoplay || paused || slides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let index = 0;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      const cards = Array.from(rail.querySelectorAll<HTMLElement>(".homeSlideCard"));
      if (!cards.length) return;

      index = (index + 1) % cards.length;
      const card = cards[index];
      if (!card) return;

      rail.dataset.transitioning = "true";
      // scrollIntoView sayfanın dikey konumunu da değiştirebildiği için yalnızca
      // slider rayının yatay scroll değerini hareket ettiriyoruz.
      rail.scrollTo({ left: card.offsetLeft - rail.offsetLeft, behavior: "smooth" });
      window.setTimeout(() => { if (rail) delete rail.dataset.transitioning; }, 520);
    }, motion.slider_interval_seconds * 1000);

    return () => window.clearInterval(timer);
  }, [motion.slider_autoplay, motion.slider_interval_seconds, paused, slides.length]);

  return (
    <section
      ref={sectionRef}
      className={`homeSliderSection homeReveal reveal-${motion.slider_reveal_effect} transition-${motion.slider_transition} homeSliderSection${section === "campaigns" ? "Campaigns" : ""}`}
      id={id}
      onMouseEnter={() => motion.slider_pause_on_hover && setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="homeSliderHeader"><h2>{title}</h2></div>
      <div ref={railRef} className="homeSliderRail">
        {displaySlides.map((slide, index) => {
          if (!slide) return <div className="homeSlideCard" key={`placeholder-${section}-${index}`}><div className="homeSlidePlaceholder"><div><strong>{title}</strong><span>Görsel admin panelinden eklenecek</span></div></div></div>;
          const content = <><img alt={slide.title || title} src={slide.image_url} />{slide.title || slide.subtitle ? <div className="homeSlideOverlay">{slide.title ? <strong>{slide.title}</strong> : null}{slide.subtitle ? <span>{slide.subtitle}</span> : null}</div> : null}</>;
          return slide.link_url ? <a className="homeSlideCard" href={slide.link_url} key={slide.id}>{content}</a> : <div className="homeSlideCard" key={slide.id}>{content}</div>;
        })}
      </div>
    </section>
  );
}
