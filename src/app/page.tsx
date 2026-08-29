import Link from "next/link";
import { SiteHeader } from "../components/site-header";
import { listPublicCategories } from "../modules/categories/repository";
import { listFeaturedListings, listRecentListings } from "../modules/listings/repository";
import { formatListingPrice } from "../modules/listings/public-listings";

const categoryDescriptions: Record<string, string> = {
  telefon: "İkinci el ve sıfır telefonları karşılaştır.",
  "teknik-servis": "Telefon ve bilgisayar için hızlı destek al.",
  "laptop-bilgisayar": "Laptop ve bilgisayar ilanlarını incele.",
  "bilgisayar-parcalari": "Parça ve bileşen seçeneklerini keşfet.",
};

export default async function HomePage() {
  const [categories, featuredListings, recentListings] = await Promise.all([
    listPublicCategories(),
    listFeaturedListings(),
    listRecentListings(),
  ]);

  return (
    <>
      <SiteHeader />
      <main className="shell homeShell">
        <section className="hero homeHero">
          <div className="heroCopy">
            <p className="eyebrow">TROVE TEKNOLOJİ</p>
            <h1>Teknolojiyi bulmak da, destek almak da kolay.</h1>
            <p className="heroText">
              Güncel ürün ilanlarını keşfet, cihaz detaylarını incele ve ihtiyacın olduğunda Trove Teknoloji ile hızlıca iletişime geç.
            </p>
            <div className="heroActions">
              <Link className="primaryCta" href="/kategori/telefon">Telefonları incele</Link>
              <Link className="secondaryCta" href="/kategori/teknik-servis">Teknik servis</Link>
            </div>
          </div>
          <div className="heroTrust" aria-label="Trove avantajları">
            <div><strong>Hızlı</strong><span>WhatsApp iletişimi</span></div>
            <div><strong>Güncel</strong><span>Yayınlanan ilanlar</span></div>
            <div><strong>Kolay</strong><span>Mobil kullanım</span></div>
          </div>
        </section>

        <section className="homeSectionIntro">
          <div>
            <p className="eyebrow">KATEGORİLER</p>
            <h2>Ne arıyorsun?</h2>
          </div>
          <p>İhtiyacına uygun bölüme doğrudan geç.</p>
        </section>

        <section className="categories homeCategories" aria-label="Ana kategoriler">
          {categories.map((category, index) => (
            <Link className="card categoryLink" href={`/kategori/${category.slug}`} key={category.id}>
              <span className="categoryIndex">0{index + 1}</span>
              <div>
                <h2>{category.name}</h2>
                <p>{category.description ?? categoryDescriptions[category.slug] ?? "Kategoriyi görüntüle"}</p>
              </div>
              <span className="categoryAction">İncele <span aria-hidden="true">→</span></span>
            </Link>
          ))}
        </section>

        <ListingSection title="Öne Çıkan İlanlar" description="Trove Teknoloji tarafından öne çıkarılan ürünler." listings={featuredListings} />
        <ListingSection title="Yeni Eklenenler" description="En son yayınlanan ürünleri hızlıca keşfet." listings={recentListings} />
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
        <div><p className="eyebrow">TROVE SEÇKİSİ</p><h2>{title}</h2></div>
        <p>{description}</p>
      </div>

      {listings.length === 0 ? (
        <div className="emptyState">Henüz yayınlanmış ilan bulunmuyor.</div>
      ) : (
        <div className="listingGrid">
          {listings.map((listing) => (
            <Link className="listingCard listingCardLink" href={`/ilan/${listing.product_code}`} key={listing.id}>
              <div className="listingMedia">
                {listing.images[0] ? <img alt={listing.title} className="listingImage" src={listing.images[0]} /> : <span>TROVE</span>}
              </div>
              <div className="listingBody">
                <span className="productCode">{listing.product_code}</span>
                <h3>{listing.title}</h3>
                <p className="listingMeta">{[listing.brand, listing.model].filter(Boolean).join(" · ") || "Ürün detayları"}</p>
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
