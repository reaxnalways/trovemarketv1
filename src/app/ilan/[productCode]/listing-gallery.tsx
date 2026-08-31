"use client";

import { useRef, useState } from "react";

type Props = { images: string[]; title: string };

export function ListingGallery({ images, title }: Props) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);

  function goTo(index: number) {
    const rail = railRef.current;
    if (!rail) return;
    const next = Math.max(0, Math.min(images.length - 1, index));
    const card = rail.children[next] as HTMLElement | undefined;
    if (!card) return;
    rail.scrollTo({ left: card.offsetLeft - rail.offsetLeft, behavior: "smooth" });
    setActive(next);
  }

  function syncActive() {
    const rail = railRef.current;
    if (!rail || !rail.clientWidth) return;
    const center = rail.scrollLeft + rail.clientWidth / 2;
    let best = 0;
    let distance = Number.POSITIVE_INFINITY;
    Array.from(rail.children).forEach((node, index) => {
      const card = node as HTMLElement;
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const nextDistance = Math.abs(cardCenter - center);
      if (nextDistance < distance) { best = index; distance = nextDistance; }
    });
    setActive(best);
  }

  if (!images.length) return <div className="detailImagePlaceholder">TROVE</div>;

  return <div className="listingGallerySlider">
    <div className="listingGalleryRail" ref={railRef} onScroll={syncActive}>
      {images.map((image, index) => <div className="listingGallerySlide" key={`${image}-${index}`}><img alt={`${title} - ${index + 1}`} className="detailImage" src={image} /></div>)}
    </div>
    {images.length > 1 ? <>
      <button className="listingGalleryArrow listingGalleryArrowPrev" type="button" aria-label="Önceki görsel" disabled={active === 0} onClick={() => goTo(active - 1)}>‹</button>
      <button className="listingGalleryArrow listingGalleryArrowNext" type="button" aria-label="Sonraki görsel" disabled={active === images.length - 1} onClick={() => goTo(active + 1)}>›</button>
      <div className="listingGalleryDots" aria-label="Görsel seçimi">{images.map((_, index) => <button key={index} type="button" className={index === active ? "isActive" : ""} aria-label={`${index + 1}. görsel`} onClick={() => goTo(index)} />)}</div>
      <span className="listingGalleryCounter">{active + 1} / {images.length}</span>
    </> : null}
  </div>;
}
