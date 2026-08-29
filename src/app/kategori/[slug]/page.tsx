import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../../components/site-header";
import { getPublicCategoryBySlug } from "../../../modules/categories/repository";
import { formatListingPrice } from "../../../modules/listings/public-listings";
import { listListingsByCategory } from "../../../modules/listings/repository";
import { getPublicSiteSettings } from "../../../modules/settings/public-settings";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [category, settings] = await Promise.all([
    getPublicCategoryBySlug(slug),
    getPublicSiteSettings(),
  ]);
  if (!category) notFound();

  if (category.slug === "teknik-servis") {
    return (
      <>
        <SiteHeader settings={settings} />
        <main className="shell categoryPageShell">
          <Link className="backLink" href="/">← Ana sayfaya dön</Link>
          <section className="categoryHero">
            <p className="eyebrow">{settings.site_name.toUpperCase()} TEKNİK SERVİS</p>
            <h1>{category.name}</h1>
            <p className="heroText">Telefon, laptop ve bilgisayar servis ihtiyaçların için hızlıca iletişime geç.</p>
            <a className="whatsappButton" href={`https://wa.me/?text=${encodeURIComponent(settings.whatsapp_default_message || "Merhaba Trove Teknoloji, teknik servis hakkında bilgi almak istiyorum.")}`} rel="noreferrer" target="_blank">WhatsApp ile iletişime geç</a>
          </section>
        </main>
      </>
    );
  }

  const listings = await listListingsByCategory(category.id);

  return (
    <>
      <SiteHeader settings={settings} />
      <main className="shell categoryPageShell">
        <Link className="backLink" href="/">← Ana sayfaya dön</Link>
        <section className="categoryHero">
          <p className="eyebrow">{settings.site_name.toUpperCase()} KATEGORİ</p>
          <h1>{category.name}</h1>
          <p className="heroText">{category.description ?? "Yayınlanmış ürünleri incele."}</p>
        </section>

        {listings.length === 0 ? <div className="emptyState">Bu kategoride henüz yayınlanmış ilan yok.</div> : (
          <div className="listingGrid categoryListingGrid">
            {listings.map((listing) => (
              <Link className="listingCard listingCardLink" href={`/ilan/${listing.product_code}`} key={listing.id}>
                <div className="listingMedia">
                  {listing.images[0] ? <img alt={listing.title} className="listingImage" src={listing.images[0]} /> : <span>TROVE</span>}
                </div>
                <div className="listingBody">
                  <span className="productCode">{listing.product_code}</span>
                  <h2>{listing.title}</h2>
                  <p className="listingMeta">{[listing.brand, listing.model].filter(Boolean).join(" · ") || "Ürün detayları"}</p>
                  <strong>{formatListingPrice(listing.price)}</strong>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
