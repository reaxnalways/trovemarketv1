import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../../components/site-header";
import { getPublicCategoryBySlug } from "../../../modules/categories/repository";
import { listListingsByCategory } from "../../../modules/listings/repository";
import { getPublicSiteSettings } from "../../../modules/settings/public-settings";
import { listPublicServicePrices } from "../../../modules/technical-service/pricing";
import { CategoryListingsClient } from "./category-listings-client";
import { ServiceOfferForm } from "./service-offer-form";
import "./category-listings.css";
import "./service-form.css";
import "./service-offer.css";
import "../../takas/trade-in.css";

const CATALOG_COPY: Record<string, { title: string; text: string }> = {
  telefon: { title: "Telefonlar", text: "Marka ve modele göre filtrele, güncel cihazları incele." },
  "laptop-bilgisayar": { title: "Laptop & Bilgisayar", text: "Marka ve modele göre filtrele, uygun bilgisayarı hızlıca bul." },
  "giyilebilir-teknoloji": { title: "Giyilebilir Teknoloji", text: "Marka ve modele göre filtrele, saat ve giyilebilir teknoloji ürünlerini incele." },
  "aksesuar-yedek-parca": { title: "Aksesuar & Yedek Parça", text: "Marka ve modele göre filtrele, uyumlu aksesuar ve parçaları incele." },
  "bilgisayar-parcalari": { title: "Bilgisayar Parçaları", text: "Marka ve modele göre filtrele, ihtiyacın olan parçayı hızlıca bul." },
};

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [category, settings] = await Promise.all([getPublicCategoryBySlug(slug), getPublicSiteSettings()]);
  if (!category) notFound();

  if (category.slug === "teknik-servis") {
    const prices = await listPublicServicePrices();
    const digits = settings.whatsapp_number?.replace(/\D/g, "") ?? "";
    return <><SiteHeader settings={settings} /><main className="shell tradePage serviceOfferPage"><Link className="backLink" href="/">← Ana sayfa</Link><header className="tradeIntro"><span className="tradeEyebrow">TROVE TEKNİK SERVİS</span><h1>Servis için tahmini fiyat al</h1><p>Cihazını ve arızayı seç, referans servis fiyat aralığını gör ve detaylı teklif için WhatsApp'tan bize ulaş.</p></header><ServiceOfferForm whatsappNumber={digits} prices={prices}/></main></>;
  }

  const listings = await listListingsByCategory(category.id);
  const copy = CATALOG_COPY[category.slug] ?? { title: category.name, text: category.description ?? "Marka ve modele göre filtrele, yayınlanmış ürünleri incele." };
  return <><SiteHeader settings={settings} /><main className="shell categoryCatalogPage"><Link className="backLink" href="/">← Ana sayfa</Link><section className="categoryCatalogHero"><h1>{copy.title}</h1><p>{copy.text}</p></section>{listings.length === 0 ? <div className="emptyState">Bu kategoride henüz yayınlanmış ürün yok.</div> : <CategoryListingsClient listings={listings} categorySlug={category.slug} />}</main></>;
}
