import Link from "next/link";
import { SiteHeader } from "../../components/site-header";
import { getPublicSiteSettings } from "../../modules/settings/public-settings";

export default async function TradeInPage() {
  const settings = await getPublicSiteSettings();
  const digits = settings.whatsapp_number?.replace(/\D/g, "") ?? "";
  const message = encodeURIComponent("Merhaba Trove Teknoloji, takas için bilgi almak istiyorum.");

  return (
    <>
      <SiteHeader settings={settings} />
      <main className="shell categoryPageShell">
        <Link className="backLink" href="/">← Ana sayfa</Link>
        <section className="categoryHero">
          <h1>Takas</h1>
          <p className="heroText">Cihazını takasa vermek için Trove Teknoloji ile iletişime geç.</p>
          {digits ? <div className="heroActions"><a className="primaryCta" href={`https://wa.me/${digits}?text=${message}`} rel="noreferrer" target="_blank">Takas teklifi al</a></div> : null}
        </section>
      </main>
    </>
  );
}
