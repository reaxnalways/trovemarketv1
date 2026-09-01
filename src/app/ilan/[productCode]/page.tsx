import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../../components/site-header";
import { dictionary, getLocale } from "../../../modules/i18n";
import { translateText } from "../../../modules/i18n/live-translation";
import { formatListingPrice } from "../../../modules/listings/public-listings";
import { getPublicListingByProductCode } from "../../../modules/listings/repository";
import { buildListingWhatsAppUrl } from "../../../modules/listings/whatsapp";
import { getPublicSiteSettings } from "../../../modules/settings/public-settings";
import { ListingGallery } from "./listing-gallery";
import "./listing-detail.css";

type ListingDetailPageProps = { params: Promise<{ productCode: string }> };

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { productCode } = await params;
  const [listing, settings, locale] = await Promise.all([getPublicListingByProductCode(productCode), getPublicSiteSettings(), getLocale()]);
  if (!listing) notFound();
  const t = dictionary(locale);
  const [displayTitle, displayDescription] = await Promise.all([
    translateText(listing.title, locale),
    listing.description ? translateText(listing.description, locale) : Promise.resolve(""),
  ]);
  const conditionLabels = { new: t.new, used: t.used, refurbished: t.refurbished } as const;
  const stockLabels = { in_stock: t.inStock, reserved: t.reserved, sold: t.sold, out_of_stock: t.outOfStock } as const;
  const details = [[t.brand, listing.brand], [t.model, listing.model], [t.storage, listing.storage], [t.color, listing.color], [t.batteryHealth, listing.battery_health], [t.condition, listing.condition ? conditionLabels[listing.condition] : null], [t.stock, stockLabels[listing.stock_status]]].filter((item) => item[1]);
  const tradeHref = `/takas?target=${encodeURIComponent(listing.product_code)}`;
  const canPurchase = settings.purchase_enabled && listing.stock_status === "in_stock";
  return <><SiteHeader settings={settings} /><main className="shell listingDetailShell"><Link className="backLink" href="/">← {t.backHome}</Link><div className="listingDetailGrid"><section className="listingGallery"><ListingGallery images={listing.images} title={displayTitle} /></section><section className="listingDetailCard"><span className="productCode">{listing.product_code}</span><h1 className="listingDetailTitle">{displayTitle}</h1><strong className="listingDetailPrice">{formatListingPrice(listing.price)}</strong>{details.length ? <dl className="listingSpecs">{details.map(([label, value]) => <div key={String(label)}><dt>{label}</dt><dd>{value}</dd></div>)}</dl> : null}<div className="listingDetailActions">{canPurchase?<Link className="adminButton adminActionLink" href={`/satinal/${encodeURIComponent(listing.product_code)}`}>{t.buy}</Link>:null}<a className="adminButton adminButtonSecondary adminActionLink" href={buildListingWhatsAppUrl(listing.product_code, displayTitle, settings.whatsapp_number)} rel="noreferrer" target="_blank">{t.moreInfo}</a><Link className="adminButton adminButtonSecondary listingTradeButton" href={tradeHref}>{t.tradeIt}</Link></div>{displayDescription ? <div className="listingDescription"><h2>{t.description}</h2><p>{displayDescription}</p></div> : null}</section></div></main></>;
}
