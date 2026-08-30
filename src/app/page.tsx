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

const categoryDescriptions: Record<string, string> = {
  telefon: "Sıfır ve ikinci el telefonları keşfet.",
  "teknik-servis": "Telefon ve bilgisayar için hızlı destek al.",
  "laptop-bilgisayar": "Laptop ve bilgisayar ilanlarını incele.",
  "bilgisayar-parcalari": "Parça ve bileşen seçeneklerini keşfet.",
};

const tickerItems = [
  "Sıfır & ikinci el telefonlar",
  "Laptop & bilgisayar",
  "Bilgisayar parçaları",
  "Hızlı teknik servis",
  "Güncel ürünler",
  "WhatsApp üzerinden hızlı iletişim",
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

  const firstShopCategory = categories.find((category) => category.slug !== "teknik-servis");

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
            <p className="eyebrow">TROVE TEKNOLOJİ</p>
            <h1>İhtiyacını bul. Hızlıca ilerle.</h1>
            <p>
              Telefon, bilgisayar, parça ve teknik servis seçeneklerini tek akışta keşfet.
              Ürünü incele, detaylarını karşılaştır ve doğrudan iletişime geç.
            </p>
          </div>

          <div className="homeQuickNav" aria-label="Hızlı kategori seçimi">
            <div className="homeQuickNavTrack">
              {categories.map((category, index) => (
                <Link className="homeQuickCard" href={`/kategori/${category.slug}`} key={category.id}>
                  <span className="homeQuickNumber">0{index + 1}</span>
                  <strong>{category.name}</strong>
                  <span>Keşfet →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="homeFeaturePanel">
          <div>
            <p className="eyebrow">TEKNOLOJİYİ KOLAYLAŞTIR</p>
            <h2>Aradığın ürüne birkaç dokunuşta ulaş.</h2>
            <p>
              Güncel ilanları incele, ürün detaylarını gör ve satın alma öncesi Trove Teknoloji ile hızlıca iletişime geç.
            </p>
            <div className="homeFeatureActions">
              {firstShopCategory ? (
                <Link className="primaryCta" href={`/kategori/${firstShopCategory.slug}`}>
                  Ürünleri keşfet
                </Link>
              ) : null}
              <Link className="secondaryCta" href="/kategori/teknik-servis">
                Teknik servis
              </Link>
            </div>
          </div>
          <div className="homeFeatureMeta" aria-label="Trove avantajları">
            <div><strong>Güncel</strong><span>Yayındaki ürünler</span></div>
            <div><strong>Hızlı</strong><span>WhatsApp iletişimi</span></div>
            <div><strong>Kolay</strong><span>Mobil öncelikli akış</span></div>
          </div>
        </section>

        {settings.campaign_title ? (
          <section className="hero homeCampaign">
            <div className="heroCopy">
              <p className="eyebrow">KAMPANYA</p>
              <h2>{settings.campaign_title}</h2>
              {settings.campaign_text ? <p className="heroText">{settings.campaign_text}</p> : null}
              {settings.campaign_url ? (
                <div className="heroActions">
                  <a className="primaryCta" href={settings.campaign_url}>Kampanyayı incele</a>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        <ListingSection
          title="Öne çıkanlar"
          eyebrow="SENİN İÇİN SEÇTİK"
          description="Öne çıkardığımız ürünleri kaydırarak hızlıca incele."
          listings={featuredListings}
        />

        <ListingSection
          title="Yeni gelenler"
          eyebrow="YENİ EKLENENLER"
          description="Mağazaya en son eklenen ürünleri kaçırma."
          listings={recentListings}
        />

        <section className="homeTwoColumn">
          <article className="homeActionPanel homeActionPanelAccent">
            <p className="eyebrow">TEKNİK SERVİS</p>
            <h2>Cihazın için hızlı destek.</h2>
            <p>{settings.service_intro}</p>
            <div className="heroActions">
              <Link className="primaryCta" href="/kategori/teknik-servis">Servis seçenekleri</Link>
            </div>
          </article>

          <article className="homeActionPanel">
            <p className="eyebrow">WHATSAPP</p>
            <h2>Sor, stok öğren, hızlıca karar ver.</h2>
            <p>Ürün, fiyat, stok veya servis hakkında Trove Teknoloji ile doğrudan iletişime geç.</p>
            {settings.whatsapp_number ? (
              <div className="heroActions">
                <a className="primaryCta" href={whatsappUrl} rel="noreferrer" target="_blank">
                  WhatsApp&apos;ta yaz
                </a>
              </div>
            ) : null}
          </article>
        </section>

        <section className="homeConfidence" aria-label="Trove Teknoloji alışveriş deneyimi">
          <div><strong>Net ürün bilgisi</strong><span>Temel ürün detaylarını tek ekranda gör.</span></div>
          <div><strong>Doğrudan iletişim</strong><span>Aracı olmadan Trove Teknoloji ile konuş.</span></div>
          <div><strong>Servis desteği</strong><span>Satışın yanında teknik servis seçeneklerine de ulaş.</span></div>
        </section>
      </main>
    </>
  );
}

type ListingSectionProps = {
  title: string;
  eyebrow: string;
  description: string;
  listings: Awaited<ReturnType<typeof listRecentListings>>;
};

function ListingSection({ title, eyebrow, description, listings }: ListingSectionProps) {
  return (
    <section className="homeSection">
      <div className="homeSectionHeader">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
        <p>{description}</p>
      </div>

      {listings.length === 0 ? (
        <div className="emptyState">Henüz yayınlanmış ilan bulunmuyor.</div>
      ) : (
        <div className="homeListingRail">
          {listings.map((listing) => (
            <Link className="listingCard listingCardLink" href={`/ilan/${listing.product_code}`} key={listing.id}>
              <div className="listingMedia">
                {listing.images[0] ? (
                  <img alt={listing.title} className="listingImage" src={listing.images[0]} />
                ) : (
                  <span>TROVE</span>
                )}
              </div>
              <div className="listingBody">
                <span className="productCode">{listing.product_code}</span>
                <h3>{listing.title}</h3>
                <p className="listingMeta">
                  {[listing.brand, listing.model].filter(Boolean).join(" · ") || "Ürün detayları"}
                </p>
                <div className="listingFooter">
                  <strong>{formatListingPrice(listing.price)}</strong>
                  <span>Detay →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
