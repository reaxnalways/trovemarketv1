"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatListingPrice, type PublicListing } from "../../../modules/listings/public-listings";

type Props = { listings: PublicListing[]; categorySlug: string };

function normalize(value: string | null) { return (value ?? "").trim(); }

export function CategoryListingsClient({ listings, categorySlug }: Props) {
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [query, setQuery] = useState("");
  const gridRef = useRef<HTMLDivElement>(null);

  const brands = useMemo(() => Array.from(new Set(listings.map((item) => normalize(item.brand)).filter(Boolean))).sort((a,b)=>a.localeCompare(b,"tr")), [listings]);
  const models = useMemo(() => Array.from(new Set(listings.filter((item)=>!brand || normalize(item.brand)===brand).map((item)=>normalize(item.model)).filter(Boolean))).sort((a,b)=>a.localeCompare(b,"tr")), [listings, brand]);

  const filtered = useMemo(() => listings.filter((item) => {
    if (brand && normalize(item.brand) !== brand) return false;
    if (model && normalize(item.model) !== model) return false;
    if (query) {
      const haystack = [item.title,item.brand,item.model,item.storage,item.product_code].filter(Boolean).join(" ").toLocaleLowerCase("tr");
      if (!haystack.includes(query.toLocaleLowerCase("tr").trim())) return false;
    }
    return true;
  }), [listings, brand, model, query]);

  useEffect(() => { if (model && !models.includes(model)) setModel(""); }, [brand, model, models]);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cards = Array.from(grid.querySelectorAll<HTMLElement>(".categoryProductCard"));
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add("isVisible"); observer.unobserve(entry.target); }
    }, { threshold: .12 });
    cards.forEach((card, index) => { card.style.setProperty("--card-delay", `${Math.min(index * 45, 260)}ms`); observer.observe(card); });
    return () => observer.disconnect();
  }, [filtered]);

  const isPhone = categorySlug === "telefon";

  return <>
    <section className="categoryFilterBar" aria-label="Ürün filtreleri">
      <label><span>Marka</span><select value={brand} onChange={(event)=>setBrand(event.target.value)}><option value="">Tüm markalar</option>{brands.map((item)=><option key={item} value={item}>{item}</option>)}</select></label>
      <label><span>Model</span><select value={model} onChange={(event)=>setModel(event.target.value)} disabled={!models.length}><option value="">Tüm modeller</option>{models.map((item)=><option key={item} value={item}>{item}</option>)}</select></label>
      <label className="categorySearchField"><span>Ara</span><input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder={isPhone ? "iPhone 15, 256 GB..." : "Ürün ara..."} /></label>
      {(brand || model || query) ? <button type="button" onClick={()=>{setBrand("");setModel("");setQuery("");}}>Filtreleri temizle</button> : null}
    </section>

    <div className="categoryResultsMeta"><strong>{filtered.length}</strong> ürün gösteriliyor</div>

    {filtered.length === 0 ? <div className="emptyState">Seçtiğin filtrelere uygun ürün bulunamadı.</div> : <div className="categoryProductGrid" ref={gridRef}>{filtered.map((listing) => {
      const compactTitle = [listing.model || listing.title, listing.storage].filter(Boolean).join(" ");
      return <Link className="categoryProductCard" href={`/ilan/${listing.product_code}`} key={listing.id}>
        <div className="categoryProductMedia">{listing.images[0] ? <img alt={listing.title} src={listing.images[0]} /> : <span>TROVE</span>}</div>
        <div className="categoryProductBody">
          <span className="categoryProductBrand">{listing.brand || "Trove"}</span>
          <h2>{compactTitle || listing.title}</h2>
          <strong>{formatListingPrice(listing.price)}</strong>
        </div>
      </Link>;
    })}</div>}
  </>;
}
