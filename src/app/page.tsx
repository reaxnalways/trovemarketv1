import Link from "next/link";
import { SiteHeader } from "../components/site-header";
import { listPublicCategories } from "../modules/categories/repository";
import {
  listFeaturedListings,
  listRecentListings,
} from "../modules/listings/repository";
import { formatListingPrice } from "../modules/listings/public-listings";
import { getPublicSiteSettings } from "../modules/settings/public-settings";
import "./home-ticker.css";
import "./home-flow.css";

export const dynamic = "force-dynamic";

const tickerItems = [
  "Sıfır & ikinci el telefonlar",
  "Laptop & bilgisayar",
  "Bilgisayar parçaları",
  "Hızlı teknik servis",
  "WhatsApp iletişim",
];

export default async function HomePage() {
  const [categories, featuredListings, recentListings, settings] =
    await Promise.all([
      listPublicCategories(),
      listFeaturedListings(),
      listRecentListings(),
      getPublicSiteSettings(),
    ]);

  const digits = settings.whatsapp_number?.replace(/\D/g, "") ?? "";
  const whatsappUrl = `https://wa.me/${digits}?text=${encodeURIComponent(
    settings.whatsapp_default_message,
  )}`;

  return (
    <>
      <SiteHeader settings={settings} />

      <div className="homeTicker" aria-label="Trove Teknoloji duyuruları">
        <div className="homeTickerViewport">
          <div className="homeTickerTrack">
            {[0, 1].map((group) => (
              <div className="homeTickerGroup" aria-hidden={group === 1} key={group}>
                {tickerItems.map((item) => (
                  <span className="homeTickerItem" key={`${group}-${item}`}>
                    {item}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="shell homeExperience">
        <section className="homeDiscovery">
          <div className="homeDiscoveryCopy">
            <h1>Teknoloji ürünleri ve teknik servis.</h1>
          </div>

          <div className="homeQuickNav" aria-label="Kategori seçimi">
            <div className="homeQuickNavTrack">
              {categories.map((category) => (
                <Link className="homeQuickCard" href={`/kategori/${category.slug}`} key={category.id}>
                  <strong>{category.name}</strong>
                  <span>İncele →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {settings.campaign_title ? (
          <section className="hero homeCampaign">
            <div className="heroCopy">
              <h2>{settings.campaign_title}</h2>
              {settings.campaign_text ? <p className="heroText">{settings.campaign_text}</p> : null}
              {settings.campaign_url ? (
                <div className="heroActions">
                  <a className="primaryCta" href={settings.campaign_url}>Kampanyayı gör</a>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        <ListingSection title="Öne çıkan ürünler" listings={featuredListings} />
        <ListingSection title="Yeni eklenenler" listings={recentListings} />

        <section className="homeTwoColumn">
          <article className="homeActionPanel homeActionPanelAccent">
            <h2>Teknik servis</h2>
            <div className="heroActions">
              <Link className="primaryCta" href="/kategori/teknik-servis">Fiyat teklifi al</Link>
            </div>
          </article>

          {settings.whatsapp_number ? (
            <article className="homeActionPanel">
              <h2>WhatsApp</h2>
              <div className="heroActions">
                <a className="primaryCta" href={whatsappUrl} rel="noreferrer" target="_blank">
                  Mesaj gönder
                </a>
              </div>
            </article>
          ) : null}
        </section>
      </main>
    </>
  );
}

type ListingSectionProps = {
  title: string;
  listings: Awaited<ReturnType<typeof listRecentListings>>;
};

function ListingSection({ title, listings }: ListingSectionProps) {
  return (
    <section className="homeSection">
      <div className="homeSectionHeader">
        <h2>{title}</h2>
      </div>

      {listings.length === 0 ? (
        <div className="emptyState">Henüz yayınlanmış ürün bulunmuyor.</div>
      ) : (
        <div className="homeListingRail">
          {listings.map((listing) => {
            const productName = listing.model || listing.title;
            const compactDetails = [productName, listing.storage].filter(Boolean).join(" ");

            return (
              <Link className="listingCard listingCardLink" href={`/ilan/${listing.product_code}`} key={listing.id}>
                <div className="listingMedia">
                  {listing.images[0] ? (
                    <img alt={listing.title} className="listingImage" src={listing.images[0]} />
                  ) : (
                    <span>TROVE</span>
                  )}
                </div>
                <div className="listingBody">
                  <h3>{compactDetails || listing.title}</h3>
                  <div className="listingFooter">
                    <strong>{formatListingPrice(listing.price)}</strong>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
