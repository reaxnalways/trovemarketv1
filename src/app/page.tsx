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

export const dynamic = "force-dynamic";

const categoryDescriptions: Record<string, string> = {
  telefon: "İkinci el ve sıfır telefonları karşılaştır.",
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

  return (
    <>
      <SiteHeader settings={settings} />

      <div className="homeTicker" aria-label="Trove Teknoloji duyuruları">
        <div className="homeTickerViewport">
          <div className="homeTickerTrack">
            {[0, 1].map((group) => (
              <div
                className="homeTickerGroup"
                aria-hidden={group === 1}
                key={group}
              >
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

      <main className="shell homeShell">
        <section className="homeSectionIntro">
          <div>
            <p className="eyebrow">KATEGORİLER</p>
            <h2>Ne arıyorsun?</h2>
          </div>
          <p>İhtiyacına uygun bölüme doğrudan geç.</p>
        </section>

        <section className="categories homeCategories">
          {categories.map((category, index) => (
            <Link
              className="card categoryLink"
              href={`/kategori/${category.slug}`}
              key={category.id}
            >
              <span className="categoryIndex">0{index + 1}</span>
              <div>
                <h2>{category.name}</h2>
                <p>
                  {category.description ??
                    categoryDescriptions[category.slug] ??
                    "Kategoriyi görüntüle"}
                </p>
              </div>
              <span className="categoryAction">İncele →</span>
            </Link>
          ))}
        </section>

        {settings.campaign_title ? (
          <section className="hero homeHero">
            <div className="heroCopy">
              <p className="eyebrow">KAMPANYA</p>
              <h2>{settings.campaign_title}</h2>
              {settings.campaign_text ? (
                <p className="heroText">{settings.campaign_text}</p>
              ) : null}
              {settings.campaign_url ? (
                <div className="heroActions">
                  <a className="primaryCta" href={settings.campaign_url}>
                    Kampanyayı incele
                  </a>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        <ListingSection
          title="Öne Çıkan İlanlar"
          description="Trove Teknoloji tarafından öne çıkarılan ürünler."
          listings={featuredListings}
        />

        <ListingSection
          title="Yeni Eklenenler"
          description="En son yayınlanan ürünleri hızlıca keşfet."
          listings={recentListings}
        />

        <section className="hero homeHero">
          <div className="heroCopy">
            <p className="eyebrow">TEKNİK SERVİS</p>
            <h2>Cihazında sorun mu var?</h2>
            <p className="heroText">{settings.service_intro}</p>
            <div className="heroActions">
              <Link className="primaryCta" href="/kategori/teknik-servis">
                Servis seçenekleri
              </Link>
            </div>
          </div>
        </section>

        <section className="hero homeHero">
          <div className="heroCopy">
            <p className="eyebrow">WHATSAPP</p>
            <h2>Trove Teknoloji ile iletişime geç.</h2>
            <p className="heroText">
              Ürün, stok, fiyat veya servis hakkında hızlıca bilgi al.
            </p>
            {settings.whatsapp_number ? (
              <div className="heroActions">
                <a
                  className="primaryCta"
                  href={whatsappUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  WhatsApp&apos;ta yaz
                </a>
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </>
  );
}

type ListingSectionProps = {
  title: string;
  description: string;
  listings: Awaited<ReturnType<typeof listRecentListings>>;
};

function ListingSection({ title, description, listings }: ListingSectionProps) {
  return (
    <section className="listingSection">
      <div className="sectionHeading">
        <div>
          <p className="eyebrow">TROVE SEÇKİSİ</p>
          <h2>{title}</h2>
        </div>
        <p>{description}</p>
      </div>

      {listings.length === 0 ? (
        <div className="emptyState">Henüz yayınlanmış ilan bulunmuyor.</div>
      ) : (
        <div className="listingGrid">
          {listings.map((listing) => (
            <Link
              className="listingCard listingCardLink"
              href={`/ilan/${listing.product_code}`}
              key={listing.id}
            >
              <div className="listingMedia">
                {listing.images[0] ? (
                  <img
                    alt={listing.title}
                    className="listingImage"
                    src={listing.images[0]}
                  />
                ) : (
                  <span>TROVE</span>
                )}
              </div>
              <div className="listingBody">
                <span className="productCode">{listing.product_code}</span>
                <h3>{listing.title}</h3>
                <p className="listingMeta">
                  {[listing.brand, listing.model].filter(Boolean).join(" · ") ||
                    "Ürün detayları"}
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
