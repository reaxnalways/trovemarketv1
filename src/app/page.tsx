import { listPublicCategories } from "../modules/categories/repository";
import {
  listFeaturedListings,
  listRecentListings,
} from "../modules/listings/repository";
import { formatListingPrice } from "../modules/listings/public-listings";

const categoryDescriptions: Record<string, string> = {
  telefon: "Telefon ilanlarını keşfet",
  "teknik-servis": "Hızlı servis desteği al",
  "laptop-bilgisayar": "Bilgisayar ilanlarını incele",
  "bilgisayar-parcalari": "Parça ve bileşenleri görüntüle",
};

export default async function HomePage() {
  const [categories, featuredListings, recentListings] = await Promise.all([
    listPublicCategories(),
    listFeaturedListings(),
    listRecentListings(),
  ]);

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">TROVE TEKNOLOJİ</p>
        <h1>Teknoloji alışverişi ve servis, tek yerde.</h1>
        <p className="heroText">
          İlanları keşfet, teknik servis desteği al ve Trove Teknoloji ile hızlıca iletişime geç.
        </p>
      </section>

      <section className="categories" aria-label="Ana kategoriler">
        {categories.map((category) => (
          <article className="card" key={category.id}>
            <h2>{category.name}</h2>
            <p>
              {category.description ??
                categoryDescriptions[category.slug] ??
                "Kategoriyi görüntüle"}
            </p>
          </article>
        ))}
      </section>

      <ListingSection
        title="Öne Çıkan İlanlar"
        description="Trove Teknoloji tarafından öne çıkarılan ürünler."
        listings={featuredListings}
      />

      <ListingSection
        title="Yeni Eklenenler"
        description="En son yayınlanan ürünleri keşfet."
        listings={recentListings}
      />
    </main>
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
            <article className="listingCard" key={listing.id}>
              <div className="listingMedia" aria-hidden="true">
                {listing.images[0] ? "Ürün görseli" : "TROVE"}
              </div>
              <div className="listingBody">
                <span className="productCode">{listing.product_code}</span>
                <h3>{listing.title}</h3>
                <p className="listingMeta">
                  {[listing.brand, listing.model].filter(Boolean).join(" · ") ||
                    "Ürün detayları"}
                </p>
                <strong>{formatListingPrice(listing.price)}</strong>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
