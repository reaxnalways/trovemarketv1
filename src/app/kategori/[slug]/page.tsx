import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../../components/site-header";
import { getPublicCategoryBySlug } from "../../../modules/categories/repository";
import { formatListingPrice } from "../../../modules/listings/public-listings";
import { listListingsByCategory } from "../../../modules/listings/repository";
import { getPublicSiteSettings } from "../../../modules/settings/public-settings";
import { CategoryListingsClient } from "./category-listings-client";
import { ServiceFormClient } from "./service-form-client";
import "./category-listings.css";
import "./service-form.css";

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams?: Promise<{ form?: string }> }) {
  const { slug } = await params;
  const query = searchParams ? await searchParams : {};
  const [category, settings] = await Promise.all([getPublicCategoryBySlug(slug), getPublicSiteSettings()]);
  if (!category) notFound();

  if (category.slug === "teknik-servis") {
    const hasMissingFields = query.form === "missing";
    const hasMissingWhatsapp = query.form === "whatsapp-missing";
    return <><SiteHeader settings={settings} /><main className="shell categoryPageShell serviceCustomerPage"><Link className="backLink" href="/">← Ana sayfa</Link><section className="categoryHero serviceCustomerHero"><h1>Teknik Servis Formu</h1></section><section className="serviceFormLayout serviceFormLayoutSingle"><form action="/teknik-servis/whatsapp" className="serviceCustomerForm" method="get">{hasMissingFields ? <div className="adminError" role="alert">Lütfen zorunlu alanların tamamını doldur.</div> : null}{hasMissingWhatsapp ? <div className="adminError" role="alert">WhatsApp numarası tanımlı değil.</div> : null}<ServiceFormClient /><div className="serviceFormActions"><button className="primaryCta serviceSubmitButton" type="submit">Fiyat Teklifi Al</button></div></form></section></main></>;
  }

  const listings = await listListingsByCategory(category.id);

  if (category.slug === "telefon") {
    return <><SiteHeader settings={settings} /><main className="shell categoryCatalogPage"><Link className="backLink" href="/">← Ana sayfa</Link><section className="categoryCatalogHero"><h1>Telefonlar</h1><p>Marka ve modele göre filtrele, güncel cihazları incele.</p></section>{listings.length === 0 ? <div className="emptyState">Bu kategoride henüz yayınlanmış ürün yok.</div> : <CategoryListingsClient listings={listings} categorySlug={category.slug} />}</main></>;
  }

  return <><SiteHeader settings={settings} /><main className="shell categoryPageShell"><Link className="backLink" href="/">← Ana sayfaya dön</Link><section className="categoryHero"><p className="eyebrow">{settings.site_name.toUpperCase()} KATEGORİ</p><h1>{category.name}</h1><p className="heroText">{category.description ?? "Yayınlanmış ürünleri incele."}</p></section>{listings.length === 0 ? <div className="emptyState">Bu kategoride henüz yayınlanmış ilan yok.</div> : <div className="listingGrid categoryListingGrid">{listings.map((listing) => <Link className="listingCard listingCardLink" href={`/ilan/${listing.product_code}`} key={listing.id}><div className="listingMedia">{listing.images[0] ? <img alt={listing.title} className="listingImage" src={listing.images[0]} /> : <span>TROVE</span>}</div><div className="listingBody"><span className="productCode">{listing.product_code}</span><h2>{listing.title}</h2><p className="listingMeta">{[listing.brand, listing.model].filter(Boolean).join(" · ") || "Ürün detayları"}</p><strong>{formatListingPrice(listing.price)}</strong></div></Link>)}</div>}</main></>;
}
