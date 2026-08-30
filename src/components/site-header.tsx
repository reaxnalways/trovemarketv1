import Link from "next/link";
import {
  FALLBACK_SITE_SETTINGS,
  type PublicSiteSettings,
} from "../modules/settings/public-settings";

const navigation = [
  { href: "/kategori/telefon", label: "Telefon" },
  { href: "/kategori/laptop-bilgisayar", label: "Laptop & Bilgisayar" },
  { href: "/kategori/bilgisayar-parcalari", label: "Parçalar" },
  { href: "/kategori/teknik-servis", label: "Teknik Servis" },
];

type SiteHeaderProps = {
  settings?: PublicSiteSettings;
};

export function SiteHeader({ settings = FALLBACK_SITE_SETTINGS }: SiteHeaderProps = {}) {
  const siteName = settings.site_name || "Trove Teknoloji";

  return (
    <header className="siteHeader">
      <div className="siteHeaderInner">
        <Link
          className="siteBrand"
          href="/"
          aria-label={siteName + " ana sayfa"}
          style={{ display: "inline-flex", alignItems: "center", gap: 10, minWidth: 0 }}
        >
          {settings.logo_url ? (
            <img
              src={settings.logo_url}
              alt={siteName + " logo"}
              width={40}
              height={40}
              style={{
                width: "40px",
                height: "40px",
                objectFit: "contain",
                display: "block",
                flex: "0 0 40px",
              }}
            />
          ) : (
            <span className="siteBrandMark">T</span>
          )}

          {settings.brand_wordmark_url ? (
            <img
              src={settings.brand_wordmark_url}
              alt={siteName}
              width={180}
              height={32}
              style={{
                width: "auto",
                height: "32px",
                maxWidth: "180px",
                objectFit: "contain",
                objectPosition: "left center",
                display: "block",
                flexShrink: 1,
              }}
            />
          ) : (
            <span className="siteBrandText">
              <strong>{siteName}</strong>
            </span>
          )}
        </Link>

        <nav className="siteNav" aria-label="Ana navigasyon">
          {navigation.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <Link className="headerServiceButton" href="/kategori/teknik-servis">
          Servis Desteği
        </Link>
      </div>
    </header>
  );
}
