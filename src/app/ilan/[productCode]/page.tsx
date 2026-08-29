import Link from "next/link";
import { notFound } from "next/navigation";
import { formatListingPrice } from "../../../modules/listings/public-listings";
import { getPublicListingByProductCode } from "../../../modules/listings/repository";
import { buildListingWhatsAppUrl } from "../../../modules/listings/whatsapp";

type ListingDetailPageProps = { params: Promise<{ productCode: string }> };

const conditionLabels = { new: "Sıfır", used: "2. El", refurbished: "Yenilenmiş" } as const;
const stockLabels = { in_stock: "Stokta", reserved: "Rezerve", sold: "Satıldı", out_of_stock: "Stokta yok" } as const;

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { productCode } = await params;
  const listing = await getPublicListingByProductCode(productCode);
  if (!listing) notFound();

  const details = [
    ["Marka", listing.brand],
    ["Model", listing.model],
    ["Hafıza", listing.storage],
    ["Renk", listing.color],
    ["Pil sağlığı", listing.battery_health],
    ["Durum", listing.condition ? conditionLabels[listing.condition] : null],
    ["Stok", stockLabels[listing.stock_status]],
  ].filter((item) => item[1]);

  return (
    <main className="shell listingDetailShell">
      <Link className="backLink" href="/">← Ana sayfaya dön</Link>
      <div className="listingDetailGrid">
        <section className="listingGallery">
          {listing.images.length ? listing.images.map((image, index) => (
            <img alt={`${listing.title} - ${index + 1}`} className="detailImage" key={image} src={image} />
          )) : <div className="detailImagePlaceholder">TROVE</div>}
        </section>
        <section className="listingDetailCard">
          <span className="productCode">{listing.product_code}</span>
          <h1 className="listingDetailTitle">{listing.title}</h1>
          <strong className="listingDetailPrice">{formatListingPrice(listing.price)}</strong>
          {details.length ? <dl className="listingSpecs">{details.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl> : null}
          <a className="adminButton adminActionLink" href={buildListingWhatsAppUrl(listing.product_code, listing.title)}>WhatsApp ile bilgi al</a>
          {listing.description ? <div className="listingDescription"><h2>Açıklama</h2><p>{listing.description}</p></div> : null}
        </section>
      </div>
    </main>
  );
}
