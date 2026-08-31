import Link from "next/link";
import { SiteHeader } from "../../components/site-header";
import { getPublicSiteSettings } from "../../modules/settings/public-settings";
import { getPublicListingByProductCode } from "../../modules/listings/repository";
import { listPublicTradeInCostOptions, listPublicTradeInDevices } from "../../modules/trade-in/catalog";
import { TradeInForm } from "./trade-in-form";
import "./trade-in.css";

export const dynamic="force-dynamic";

type Props={searchParams?:Promise<{target?:string}>};
export default async function TradeInPage({searchParams}:Props){
 const query=searchParams?await searchParams:{};const targetCode=(query.target??"").trim();
 const [settings,devices,costOptions,targetListing]=await Promise.all([getPublicSiteSettings(),listPublicTradeInDevices(),listPublicTradeInCostOptions(),targetCode?getPublicListingByProductCode(targetCode):Promise.resolve(null)]);
 const digits=settings.whatsapp_number?.replace(/\D/g,"")??"";
 const target=targetListing?{productCode:targetListing.product_code,title:targetListing.title,price:targetListing.price}:null;
 return <><SiteHeader settings={settings}/><main className="shell tradePage"><Link className="backLink" href={targetListing?`/ilan/${encodeURIComponent(targetListing.product_code)}`:"/"}>{targetListing?"← İlana dön":"← Ana sayfa"}</Link><header className="tradeIntro"><span className="tradeEyebrow">TROVE TAKAS</span><h1>{targetListing?"Bu ürünü takasla al":"Cihazın için teklif al"}</h1><p>{targetListing?`${targetListing.title} için mevcut cihazını değerlendir, tahmini takas bedelini gör ve kalan tutar için teklif iste.`:"Satın alabildiğimiz cihazlardan seçim yap, durumunu belirt ve otomatik tahmini fiyatını gör."}</p></header><TradeInForm whatsappNumber={digits} devices={devices} costOptions={costOptions} targetListing={target}/></main></>;
}
