import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../../components/site-header";
import { getPublicCategoryBySlug } from "../../../modules/categories/repository";
import { formatListingPrice } from "../../../modules/listings/public-listings";
import { listListingsByCategory } from "../../../modules/listings/repository";
import { getPublicSiteSettings } from "../../../modules/settings/public-settings";

function whatsappHref(number: string | null, message: string) {
  const digits = number?.replace(/\D/g, "") ?? "";
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [category, settings] = await Promise.all([getPublicCategoryBySlug(slug), getPublicSiteSettings()]);
  if (!category) notFound();

  if (category.slug === "teknik-servis") {
    const services = [
      ["Telefon Servisi", "telefon servis"],
      ["Laptop Servisi", "laptop servis"],
      ["Bilgisayar Servisi", "bilgisayar servis"],
      ["Arıza Tespiti", "arıza tespiti"],
    ] as const;
    const hasWhatsapp = Boolean(settings.whatsapp_number?.replace(/\D/g, ""));
    return <><SiteHeader settings={settings} /><main className="shell categoryPageShell"><Link className="backLink" href="/">← Ana sayfaya dön</Link><section className="categoryHero"><p className="eyebrow">{settings.site_name.toUpperCase()} TEKNİK SERVİS</p><h1>{category.name}</h1><p className="heroText">Servis türünü seç; hazırlanmış mesajla doğrudan Trove Teknoloji WhatsApp hattına geç.</p></section>{hasWhatsapp ? <section className="categories homeCategories" aria-label="Teknik servis türleri">{services.map(([label, subject]) => <a className="card categoryLink" href={whatsappHref(settings.whatsapp_number, `Merhaba Trove Teknoloji, ${subject} hakkında bilgi almak istiyorum.`) ?? undefined} key={label} rel="noreferrer" target="_blank"><div><h2>{label}</h2><p>Hızlı bilgi ve servis yönlendirmesi al.</p></div><span className="categoryAction">WhatsApp →</span></a>)}</section> : <div className="emptyState" style={{ marginTop: 24 }}>Teknik servis WhatsApp hattı henüz tanımlanmamış. Lütfen daha sonra tekrar kontrol et.</div>}</main></>;
  }

  const listings = await listListingsByCategory(category.id);
  return <><SiteHeader settings={settings} /><main className="shell categoryPageShell"><Link className="backLink" href="/">← Ana sayfaya dön</Link><section className="categoryHero"><p className="eyebrow">{settings.site_name.toUpperCase()} KATEGORİ</p><h1>{category.name}</h1><p className="heroText">{category.description ?? "Yayınlanmış ürünleri incele."}</p></section>{listings.length === 0 ? <div className="emptyState">Bu kategoride henüz yayınlanmış ilan yok.</div> : <div className="listingGrid categoryListingGrid">{listings.map((listing) => <Link className="listingCard listingCardLink" href={`/ilan/${listing.product_code}`} key={listing.id}><div className="listingMedia">{listing.images[0] ? <img alt={listing.title} className="listingImage" src={listing.images[0]} /> : <span>TROVE</span>}</div><div className="listingBody"><span className="productCode">{listing.product_code}</span><h2>{listing.title}</h2><p className="listingMeta">{[listing.brand, listing.model].filter(Boolean).join(" · ") || "Ürün detayları"}</p><strong>{formatListingPrice(listing.price)}</strong></div></Link>)}</div>}</main></>;
}
