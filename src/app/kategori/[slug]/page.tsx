import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../../components/site-header";
import { getPublicCategoryBySlug } from "../../../modules/categories/repository";
import { listListingsByCategory } from "../../../modules/listings/repository";
import { getPublicSiteSettings } from "../../../modules/settings/public-settings";
import { CategoryListingsClient } from "./category-listings-client";
import { ServiceFormClient } from "./service-form-client";
import "./category-listings.css";
import "./service-form.css";

const CATALOG_COPY: Record<string, { title: string; text: string }> = {
  telefon: { title: "Telefonlar", text: "Marka ve modele göre filtrele, güncel cihazları incele." },
  "laptop-bilgisayar": { title: "Laptop & Bilgisayar", text: "Marka ve modele göre filtrele, uygun bilgisayarı hızlıca bul." },
  "giyilebilir-teknoloji": { title: "Giyilebilir Teknoloji", text: "Marka ve modele göre filtrele, saat ve giyilebilir teknoloji ürünlerini incele." },
  "aksesuar-yedek-parca": { title: "Aksesuar & Yedek Parça", text: "Marka ve modele göre filtrele, uyumlu aksesuar ve parçaları incele." },
  "bilgisayar-parcalari": { title: "Bilgisayar Parçaları", text: "Marka ve modele göre filtrele, ihtiyacın olan parçayı hızlıca bul." },
};

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
  const copy = CATALOG_COPY[category.slug] ?? { title: category.name, text: category.description ?? "Marka ve modele göre filtrele, yayınlanmış ürünleri incele." };

  return <><SiteHeader settings={settings} /><main className="shell categoryCatalogPage"><Link className="backLink" href="/">← Ana sayfa</Link><section className="categoryCatalogHero"><h1>{copy.title}</h1><p>{copy.text}</p></section>{listings.length === 0 ? <div className="emptyState">Bu kategoride henüz yayınlanmış ürün yok.</div> : <CategoryListingsClient listings={listings} categorySlug={category.slug} />}</main></>;
}
