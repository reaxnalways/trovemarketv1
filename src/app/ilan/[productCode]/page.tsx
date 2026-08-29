import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../../components/site-header";
import { formatListingPrice } from "../../../modules/listings/public-listings";
import { getPublicListingByProductCode } from "../../../modules/listings/repository";
import { buildListingWhatsAppUrl } from "../../../modules/listings/whatsapp";
import { getPublicSiteSettings } from "../../../modules/settings/public-settings";

type ListingDetailPageProps = { params: Promise<{ productCode: string }> };
const conditionLabels = { new: "Sıfır", used: "2. El", refurbished: "Yenilenmiş" } as const;
const stockLabels = { in_stock: "Stokta", reserved: "Rezerve", sold: "Satıldı", out_of_stock: "Stokta yok" } as const;

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { productCode } = await params;
  const [listing, settings] = await Promise.all([getPublicListingByProductCode(productCode), getPublicSiteSettings()]);
  if (!listing) notFound();

  const stockLabel = stockLabels[listing.stock_status];
  const details = [["Marka", listing.brand], ["Model", listing.model], ["Hafıza", listing.storage], ["Renk", listing.color], ["Pil sağlığı", listing.battery_health], ["Durum", listing.condition ? conditionLabels[listing.condition] : null]].filter((item) => item[1]);
  const whatsappUrl = buildListingWhatsAppUrl(listing.product_code, listing.title, settings.whatsapp_number);
  const canContactForSale = listing.stock_status !== "sold" && listing.stock_status !== "out_of_stock";

  return <><SiteHeader settings={settings} /><main className="shell listingDetailShell"><Link className="backLink" href="/">← Ana sayfaya dön</Link><div className="listingDetailGrid"><section className="listingGallery">{listing.images.length ? listing.images.map((image, index) => <img alt={`${listing.title} - ${index + 1}`} className="detailImage" key={image} src={image} />) : <div className="detailImagePlaceholder">TROVE</div>}</section><section className="listingDetailCard"><span className="productCode">{listing.product_code}</span><h1 className="listingDetailTitle">{listing.title}</h1><strong className="listingDetailPrice">{formatListingPrice(listing.price)}</strong><p style={{ margin: "10px 0 0", color: listing.stock_status === "in_stock" ? "#aef0ca" : "#cbd1de", fontWeight: 800 }}>{stockLabel}</p>{details.length ? <dl className="listingSpecs">{details.map(([label, value]) => <div key={String(label)}><dt>{label}</dt><dd>{value}</dd></div>)}</dl> : null}{whatsappUrl && canContactForSale ? <a className="adminButton" href={whatsappUrl} rel="noreferrer" style={{ width: "100%", marginTop: 24, minHeight: 52 }} target="_blank">WhatsApp ile bilgi al</a> : whatsappUrl ? <p className="listingMeta" style={{ marginTop: 24 }}>Bu ürün şu anda satışa açık değil. Güncel stok için diğer ilanları inceleyebilirsin.</p> : <p className="listingMeta" style={{ marginTop: 24 }}>WhatsApp iletişim hattı henüz tanımlanmamış.</p>}{listing.description ? <div className="listingDescription"><h2>Açıklama</h2><p>{listing.description}</p></div> : null}</section></div></main></>;
}
