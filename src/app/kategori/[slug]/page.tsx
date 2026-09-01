import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../../components/site-header";
import { getPublicCategoryBySlug } from "../../../modules/categories/repository";
import { dictionary, getLocale } from "../../../modules/i18n";
import { translateText } from "../../../modules/i18n/live-translation";
import { listListingsByCategory } from "../../../modules/listings/repository";
import { getPublicSiteSettings } from "../../../modules/settings/public-settings";
import { listPublicServicePrices } from "../../../modules/technical-service/pricing";
import { CategoryListingsClient } from "./category-listings-client";
import { ServiceOfferForm } from "./service-offer-form";
import "./category-listings.css";
import "./service-form.css";
import "./service-offer.css";
import "../../takas/trade-in.css";

const CATALOG_COPY = {
  tr: {
    telefon: { title: "Telefonlar", text: "Marka ve modele göre filtrele, güncel cihazları incele." },
    "laptop-bilgisayar": { title: "Laptop & Bilgisayar", text: "Marka ve modele göre filtrele, uygun bilgisayarı hızlıca bul." },
    "giyilebilir-teknoloji": { title: "Giyilebilir Teknoloji", text: "Marka ve modele göre filtrele, saat ve giyilebilir teknoloji ürünlerini incele." },
    "aksesuar-yedek-parca": { title: "Aksesuar & Yedek Parça", text: "Marka ve modele göre filtrele, uyumlu aksesuar ve parçaları incele." },
    "bilgisayar-parcalari": { title: "Bilgisayar Parçaları", text: "Marka ve modele göre filtrele, ihtiyacın olan parçayı hızlıca bul." },
  },
  en: {
    telefon: { title: "Phones", text: "Filter by brand and model and browse current devices." },
    "laptop-bilgisayar": { title: "Laptops & Computers", text: "Filter by brand and model and quickly find the right computer." },
    "giyilebilir-teknoloji": { title: "Wearable Technology", text: "Browse smart watches, headphones and wearable technology products." },
    "aksesuar-yedek-parca": { title: "Accessories & Spare Parts", text: "Find compatible accessories and spare parts by brand and model." },
    "bilgisayar-parcalari": { title: "Computer Parts", text: "Filter by brand and model and find the part you need." },
  },
} as const;

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [category, settings, locale] = await Promise.all([getPublicCategoryBySlug(slug), getPublicSiteSettings(), getLocale()]);
  if (!category) notFound();
  const t = dictionary(locale);

  if (category.slug === "teknik-servis") {
    const rawPrices = await listPublicServicePrices();
    const prices = await Promise.all(rawPrices.map(async (price) => ({ ...price, fault_label: await translateText(price.fault_label, locale) })));
    const digits = settings.whatsapp_number?.replace(/\D/g, "") ?? "";
    return <><SiteHeader settings={settings} /><main className="shell tradePage serviceOfferPage"><Link className="backLink" href="/">← {t.home}</Link><header className="tradeIntro"><span className="tradeEyebrow">{t.serviceEyebrow}</span><h1>{t.serviceTitle}</h1><p>{t.serviceText}</p></header><ServiceOfferForm whatsappNumber={digits} prices={prices} locale={locale}/></main></>;
  }

  const rawListings = await listListingsByCategory(category.id);
  const listings = await Promise.all(rawListings.map(async (listing) => ({
    ...listing,
    title: await translateText(listing.title, locale),
    description: listing.description ? await translateText(listing.description, locale) : listing.description,
  })));
  const manualCopy = CATALOG_COPY[locale][category.slug as keyof typeof CATALOG_COPY.tr];
  const copy = manualCopy ?? {
    title: await translateText(category.name, locale),
    text: category.description ? await translateText(category.description, locale) : t.browsePublished,
  };
  return <><SiteHeader settings={settings} /><main className="shell categoryCatalogPage"><Link className="backLink" href="/">← {t.home}</Link><section className="categoryCatalogHero"><h1>{copy.title}</h1><p>{copy.text}</p></section>{listings.length === 0 ? <div className="emptyState">{t.emptyCategory}</div> : <CategoryListingsClient listings={listings} categorySlug={category.slug} locale={locale} />}</main></>;
}
