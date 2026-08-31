"use client";

import { useEffect, useRef } from "react";
import type { HomepageSlide, HomepageSlideSection } from "../modules/homepage/slides";

export function HomeSlider({ section, title, slides }: { section: HomepageSlideSection; title: string; slides: HomepageSlide[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const id = section === "phones" ? "telefonlar" : section;
  const displaySlides: Array<HomepageSlide | null> = slides.length ? slides : [null, null, null];

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
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
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail || slides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let index = 0;
    const timer = window.setInterval(() => {
      const cards = Array.from(rail.querySelectorAll<HTMLElement>(".homeSlideCard"));
      if (!cards.length) return;
      index = (index + 1) % cards.length;
      cards[index]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
    }, 3000);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  return (
    <section ref={sectionRef} className={`homeSliderSection homeReveal homeSliderSection${section === "campaigns" ? "Campaigns" : ""}`} id={id}>
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
