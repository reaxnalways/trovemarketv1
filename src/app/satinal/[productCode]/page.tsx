import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getPublicListingByProductCode } from "@/modules/listings/repository";
import { formatListingPrice } from "@/modules/listings/public-listings";
import { getPublicSiteSettings } from "@/modules/settings/public-settings";
import { submitPurchaseRequest } from "./actions";
import "./purchase.css";

type Props = { params: Promise<{ productCode: string }>; searchParams: Promise<{ success?: string; error?: string }> };

export default async function PurchasePage({ params, searchParams }: Props) {
  const { productCode } = await params;
  const query = await searchParams;
  const [listing, settings] = await Promise.all([getPublicListingByProductCode(productCode), getPublicSiteSettings()]);
  if (!listing) notFound();
  if (!settings.purchase_enabled || listing.stock_status !== "in_stock") {
    return <><SiteHeader settings={settings}/><main className="shell purchasePage"><Link className="backLink" href={`/ilan/${listing.product_code}`}>← İlana dön</Link><section className="purchaseCard"><h1>Satın alma şu anda kapalı</h1><p>Bu ürün için online satın alma talebi şu anda kullanılamıyor. Daha fazla bilgi için ilan sayfasındaki iletişim seçeneğini kullanabilirsin.</p></section></main></>;
  }

  return <><SiteHeader settings={settings}/><main className="shell purchasePage"><Link className="backLink" href={`/ilan/${listing.product_code}`}>← İlana dön</Link><div className="purchaseGrid"><section className="purchaseCard purchaseSummary"><span>{listing.product_code}</span><h1>{listing.title}</h1><strong>{formatListingPrice(listing.price)}</strong><div className="purchaseBankBox"><span>Ödeme yöntemi</span><b>Havale / EFT</b><dl><div><dt>Banka</dt><dd>{settings.bank_name || "-"}</dd></div><div><dt>Hesap sahibi</dt><dd>{settings.bank_account_holder || "-"}</dd></div><div><dt>IBAN</dt><dd>{settings.iban || "-"}</dd></div></dl><small>Formu göndermen ödeme yapıldığı anlamına gelmez. Talep mağaza tarafından kontrol edildikten sonra ödeme teyidi ve teslimat süreci yürütülür.</small></div></section><section className="purchaseCard"><h2>Satın Alma Formu</h2>{query.success?<p className="purchaseSuccess">Talebin alındı. Referans: {query.success}</p>:null}{query.error?<p className="purchaseError">Talep oluşturulamadı. Bilgileri kontrol edip tekrar dene.</p>:null}<form action={submitPurchaseRequest} className="purchaseForm"><input type="hidden" name="productCode" value={listing.product_code}/><fieldset><legend>Müşteri bilgileri</legend><label>Ad Soyad<input name="customerName" required maxLength={120}/></label><label>Telefon<input name="customerPhone" required inputMode="tel" maxLength={30}/></label><label>E-posta<input name="customerEmail" required type="email" maxLength={160}/></label></fieldset><fieldset><legend>Teslimat adresi</legend><label className="wide">Açık adres<textarea name="addressLine" required minLength={10} maxLength={500}/></label><label>İlçe<input name="district" required maxLength={80}/></label><label>İl<input name="city" required maxLength={80}/></label><label>Posta kodu<input name="postalCode" inputMode="numeric" maxLength={10}/></label></fieldset><fieldset><legend>Fatura bilgileri</legend><label>Fatura tipi<select name="invoiceType" defaultValue="individual"><option value="individual">Bireysel</option><option value="company">Kurumsal</option></select></label><label>Fatura adı / ünvanı<input name="invoiceName" required maxLength={160}/></label><label>Firma adı<input name="invoiceCompany" maxLength={160}/></label><label>Vergi dairesi<input name="taxOffice" maxLength={120}/></label><label>Vergi numarası<input name="taxNumber" maxLength={30}/></label></fieldset><label className="purchaseNote">Sipariş notu<textarea name="customerNote" maxLength={1000}/></label><button type="submit">Satın Alma Talebi Oluştur</button></form></section></div></main></>;
}
