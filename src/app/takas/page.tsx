import Link from "next/link";
import { SiteHeader } from "../../components/site-header";
import { getPublicSiteSettings } from "../../modules/settings/public-settings";
import { listPublicTradeInCostOptions, listPublicTradeInDevices } from "../../modules/trade-in/catalog";
import { TradeInForm } from "./trade-in-form";
import "./trade-in.css";

export const dynamic="force-dynamic";
export default async function TradeInPage(){const[settings,devices,costOptions]=await Promise.all([getPublicSiteSettings(),listPublicTradeInDevices(),listPublicTradeInCostOptions()]);const digits=settings.whatsapp_number?.replace(/\D/g,"")??"";return <><SiteHeader settings={settings}/><main className="shell tradePage"><Link className="backLink" href="/">← Ana sayfa</Link><header className="tradeIntro"><span className="tradeEyebrow">TROVE TAKAS</span><h1>Cihazın için teklif al</h1><p>Satın alabildiğimiz cihazlardan seçim yap, durumunu belirt ve otomatik tahmini fiyatını gör.</p></header><TradeInForm whatsappNumber={digits} devices={devices} costOptions={costOptions}/></main></>}
