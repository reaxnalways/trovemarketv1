import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getPublicListingByProductCode } from "@/modules/listings/repository";
import { formatListingPrice } from "@/modules/listings/public-listings";
import { getPublicSiteSettings } from "@/modules/settings/public-settings";
import { PurchaseForm } from "./purchase-form";
import "./purchase.css";

type Props = { params: Promise<{ productCode: string }>; searchParams: Promise<{ success?: string; error?: string }> };

export default async function PurchasePage({ params, searchParams }: Props) {
  const { productCode } = await params;
  const query = await searchParams;
  const [listing, settings] = await Promise.all([getPublicListingByProductCode(productCode), getPublicSiteSettings()]);
  if (!listing) notFound();
  if (!settings.purchase_enabled || listing.stock_status !== "in_stock") return <><SiteHeader settings={settings}/><main className="shell purchasePage"><Link className="backLink" href={`/ilan/${listing.product_code}`}>← İlana dön</Link><section className="purchaseCard"><h1>Satın alma şu anda kapalı</h1><p>Bu ürün için online satın alma talebi şu anda kullanılamıyor.</p></section></main></>;

  return <><SiteHeader settings={settings}/><main className="shell purchasePage"><Link className="backLink" href={`/ilan/${listing.product_code}`}>← İlana dön</Link><div className="purchaseGrid"><section className="purchaseCard purchaseSummary"><span>{listing.product_code}</span><h1>{listing.title}</h1><strong>{formatListingPrice(listing.price)}</strong><p>3 adımda bilgilerini tamamla. Talep mağaza tarafından kontrol edildikten sonra ödeme süreci başlatılır.</p></section><section className="purchaseCard"><h2>Satın Alma Formu</h2>{query.success?<p className="purchaseSuccess">Talebin alındı. Referans: {query.success}</p>:null}{query.error?<p className="purchaseError">Talep oluşturulamadı. Bilgileri kontrol edip tekrar dene.</p>:null}<PurchaseForm productCode={listing.product_code} bankName={settings.bank_name || ""} accountHolder={settings.bank_account_holder || ""} iban={settings.iban || ""}/></section></div></main></>;
}
