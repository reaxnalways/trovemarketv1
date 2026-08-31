import type { CSSProperties } from "react";
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

export default async function HomePage() {
  const [slides, settings] = await Promise.all([listPublicHomepageSlides(), getPublicSiteSettings()]);
  const motion = {
    slider_autoplay: settings.slider_autoplay,
    slider_interval_seconds: settings.slider_interval_seconds,
    slider_transition: settings.slider_transition,
    slider_reveal_effect: settings.slider_reveal_effect,
    slider_pause_on_hover: settings.slider_pause_on_hover,
  };

  return (
    <>
      <SiteHeader settings={settings} />

      <div className="homeHeaderActionsWrap">
        <nav className="homePrimaryNav homePrimaryNavNotch" aria-label="Ana işlemler">
          <details className="homeProductsMenu">
            <summary>Ürünler <span aria-hidden="true">⌄</span></summary>
            <div className="homeProductsDropdown">
              <Link href="/kategori/telefon">Telefonlar</Link>
              <Link href="/kategori/laptop-bilgisayar">Bilgisayarlar</Link>
              <Link href="/kategori/giyilebilir-teknoloji">Giyilebilir Teknoloji</Link>
              <Link href="/kategori/aksesuar-yedek-parca">Aksesuar & Yedek Parça</Link>
            </div>
          </details>
          <Link href="/takas">Takas</Link>
          <Link href="/kategori/teknik-servis">Teknik Servis</Link>
        </nav>
      </div>

      {settings.announcement_enabled ? (
        <div className={`homeTicker${settings.announcement_pause_on_hover ? "" : " homeTickerNoPause"}`} aria-label="Trove Teknoloji duyuruları" style={{ "--ticker-duration": `${settings.announcement_speed_seconds}s` } as CSSProperties}>
          <div className="homeTickerViewport"><div className="homeTickerTrack">{[0, 1].map((group) => <div className="homeTickerGroup" aria-hidden={group === 1} key={group}>{settings.announcement_items.map((item) => <span className="homeTickerItem" key={`${group}-${item}`}>{item}</span>)}</div>)}</div></div>
        </div>
      ) : null}

      <main className="shell homeShowcase">
        {sections.map((section) => <HomeSlider key={section.key} section={section.key} slides={slides.filter((slide) => slide.section === section.key)} title={section.title} motion={motion} />)}
      </main>

      <footer className="siteFooter">
        <div className="siteFooterInner">
          <div className="siteFooterBrand"><strong>{settings.site_name}</strong><span>{settings.site_tagline || "Teknoloji, ürün ve servis."}</span></div>
          <nav className="siteFooterLinks" aria-label="Alt menü">
            <Link href="/hakkimizda">Hakkımızda</Link>
            <Link href="/iletisim">İletişim</Link>
            <Link href="/kategori/telefon">Ürünler</Link>
            <Link href="/takas">Takas</Link>
            <Link href="/kategori/teknik-servis">Teknik Servis</Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
