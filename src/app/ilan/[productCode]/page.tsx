import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../../components/site-header";
import { formatListingPrice } from "../../../modules/listings/public-listings";
import { getPublicListingByProductCode } from "../../../modules/listings/repository";
import { buildListingWhatsAppUrl } from "../../../modules/listings/whatsapp";
import { getPublicSiteSettings } from "../../../modules/settings/public-settings";
import { ListingGallery } from "./listing-gallery";
import "./listing-detail.css";

type ListingDetailPageProps = { params: Promise<{ productCode: string }> };
const conditionLabels = { new: "Sıfır", used: "2. El", refurbished: "Yenilenmiş" } as const;
const stockLabels = { in_stock: "Stokta", reserved: "Rezerve", sold: "Satıldı", out_of_stock: "Stokta yok" } as const;

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { productCode } = await params;
  const [listing, settings] = await Promise.all([getPublicListingByProductCode(productCode), getPublicSiteSettings()]);
  if (!listing) notFound();
  const details = [["Marka", listing.brand], ["Model", listing.model], ["Hafıza", listing.storage], ["Renk", listing.color], ["Pil sağlığı", listing.battery_health], ["Durum", listing.condition ? conditionLabels[listing.condition] : null], ["Stok", stockLabels[listing.stock_status]]].filter((item) => item[1]);
  const tradeHref = `/takas?target=${encodeURIComponent(listing.product_code)}`;
  const canPurchase = settings.purchase_enabled && listing.stock_status === "in_stock";
  return <><SiteHeader settings={settings} /><main className="shell listingDetailShell"><Link className="backLink" href="/">← Ana sayfaya dön</Link><div className="listingDetailGrid"><section className="listingGallery"><ListingGallery images={listing.images} title={listing.title} /></section><section className="listingDetailCard"><span className="productCode">{listing.product_code}</span><h1 className="listingDetailTitle">{listing.title}</h1><strong className="listingDetailPrice">{formatListingPrice(listing.price)}</strong>{details.length ? <dl className="listingSpecs">{details.map(([label, value]) => <div key={String(label)}><dt>{label}</dt><dd>{value}</dd></div>)}</dl> : null}<div className="listingDetailActions">{canPurchase?<Link className="adminButton adminActionLink" href={`/satinal/${encodeURIComponent(listing.product_code)}`}>Satın Al</Link>:null}<a className="adminButton adminButtonSecondary adminActionLink" href={buildListingWhatsAppUrl(listing.product_code, listing.title, settings.whatsapp_number)} rel="noreferrer" target="_blank">Daha Fazla Bilgi Al</a><Link className="adminButton adminButtonSecondary listingTradeButton" href={tradeHref}>Takas Et</Link></div>{listing.description ? <div className="listingDescription"><h2>Açıklama</h2><p>{listing.description}</p></div> : null}</section></div></main></>;
}
