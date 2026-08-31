import Link from "next/link";
import { SiteHeader } from "../components/site-header";
import { listPublicHomepageSlides, type HomepageSlideSection } from "../modules/homepage/slides";
import { getPublicSiteSettings } from "../modules/settings/public-settings";
import { HomeSlider } from "./home-slider-client";
import "./home-ticker.css";
import "./home-showcase.css";

export const dynamic = "force-dynamic";

const sections: { key: HomepageSlideSection; title: string }[] = [
  { key: "campaigns", title: "Kampanyalar" },
  { key: "phones", title: "Telefonlar" },
  { key: "computers", title: "Bilgisayarlar" },
  { key: "wearables", title: "Giyilebilir Teknoloji" },
  { key: "accessories", title: "Aksesuarlar & Yedek Parçalar" },
];

const tickerItems = ["Sıfır & ikinci el telefonlar", "Laptop & bilgisayar", "Bilgisayar parçaları", "Hızlı teknik servis", "WhatsApp iletişim"];

export default async function HomePage() {
  const [slides, settings] = await Promise.all([listPublicHomepageSlides(), getPublicSiteSettings()]);
  const digits = settings.whatsapp_number?.replace(/\D/g, "") ?? "";

  return (
    <>
      <SiteHeader settings={settings} />
      <div className="homeTicker" aria-label="Trove Teknoloji duyuruları">
        <div className="homeTickerViewport"><div className="homeTickerTrack">{[0, 1].map((group) => <div className="homeTickerGroup" aria-hidden={group === 1} key={group}>{tickerItems.map((item) => <span className="homeTickerItem" key={`${group}-${item}`}>{item}</span>)}</div>)}</div></div>
      </div>

      <main className="shell homeShowcase">
        <nav className="homePrimaryNav" aria-label="Ana işlemler">
          <Link href="#telefonlar">Ürünler</Link>
          <Link href="/takas">Takas</Link>
          <Link href="/kategori/teknik-servis">Teknik Servis</Link>
        </nav>

        {sections.map((section) => <HomeSlider key={section.key} section={section.key} slides={slides.filter((slide) => slide.section === section.key)} title={section.title} />)}
      </main>

      <footer className="siteFooter">
        <div className="siteFooterInner">
          <div className="siteFooterBrand"><strong>{settings.site_name}</strong><span>{settings.site_tagline || "Teknoloji, ürün ve servis."}</span></div>
          <nav className="siteFooterLinks" aria-label="Alt menü">
            <Link href="#telefonlar">Ürünler</Link><Link href="/takas">Takas</Link><Link href="/kategori/teknik-servis">Teknik Servis</Link>{digits ? <a href={`https://wa.me/${digits}`} rel="noreferrer" target="_blank">WhatsApp</a> : null}
          </nav>
        </div>
      </footer>
    </>
  );
}
