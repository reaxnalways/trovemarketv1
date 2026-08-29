import Link from "next/link";
import type { PublicSiteSettings } from "../modules/settings/public-settings";

const navigation = [
  { href: "/kategori/telefon", label: "Telefon" },
  { href: "/kategori/laptop-bilgisayar", label: "Laptop & Bilgisayar" },
  { href: "/kategori/bilgisayar-parcalari", label: "Parçalar" },
  { href: "/kategori/teknik-servis", label: "Teknik Servis" },
];

type SiteHeaderProps = {
  settings: PublicSiteSettings;
};

export function SiteHeader({ settings }: SiteHeaderProps) {
  return (
    <header className="siteHeader">
      <div className="siteHeaderInner">
        <Link className="siteBrand" href="/" aria-label={`${settings.site_name} ana sayfa`}>
          {settings.logo_url ? (
            <img className="siteBrandLogo" src={settings.logo_url} alt={`${settings.site_name} logo`} />
          ) : (
            <span className="siteBrandMark">T</span>
          )}
          <span className="siteBrandText">
            <strong>{settings.site_name}</strong>
            <small>Teknoloji</small>
          </span>
        </Link>

        <nav className="siteNav" aria-label="Ana navigasyon">
          {navigation.map((item) => (
            <Link href={item.href} key={item.href}>{item.label}</Link>
          ))}
        </nav>

        <Link className="headerServiceButton" href="/kategori/teknik-servis">Servis Desteği</Link>
      </div>
    </header>
  );
}
