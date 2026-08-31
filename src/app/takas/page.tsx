import Link from "next/link";
import { SiteHeader } from "../../components/site-header";
import { getPublicSiteSettings } from "../../modules/settings/public-settings";
import { TradeInForm } from "./trade-in-form";
import "./trade-in.css";

export const dynamic = "force-dynamic";

export default async function TradeInPage() {
  const settings = await getPublicSiteSettings();
  const digits = settings.whatsapp_number?.replace(/\D/g, "") ?? "";
  return <>
    <SiteHeader settings={settings}/>
    <main className="shell tradePage">
      <Link className="backLink" href="/">← Ana sayfa</Link>
      <header className="tradeIntro"><span className="tradeEyebrow">TROVE TAKAS</span><h1>Cihazın için teklif al</h1><p>Üç kısa adımda cihazını anlat. Bilgiler tamamlandığında teklif talebin WhatsApp mesajı olarak hazırlanır.</p></header>
      <TradeInForm whatsappNumber={digits}/>
    </main>
  </>;
}