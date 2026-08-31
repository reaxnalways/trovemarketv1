import Link from "next/link";
import {
  FALLBACK_SITE_SETTINGS,
  type PublicSiteSettings,
} from "../modules/settings/public-settings";

type SiteHeaderProps = {
  settings?: PublicSiteSettings;
};

export function SiteHeader({ settings = FALLBACK_SITE_SETTINGS }: SiteHeaderProps = {}) {
  const siteName = settings.site_name || "Trove Teknoloji";

  return (
    <header className="siteHeader">
      <div className="siteHeaderInner" style={{ justifyContent: "center" }}>
        <Link
          className="siteBrand"
          href="/"
          aria-label={siteName + " ana sayfa"}
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10, minWidth: 0 }}
        >
          {settings.logo_url ? (
            <img
              src={settings.logo_url}
              alt={siteName + " logo"}
              width={40}
              height={40}
              style={{ width: 40, height: 40, objectFit: "contain", display: "block", flex: "0 0 40px" }}
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
              style={{ width: "auto", height: 32, maxWidth: 180, objectFit: "contain", objectPosition: "center", display: "block", flexShrink: 1 }}
            />
          ) : (
            <span className="siteBrandText"><strong>{siteName}</strong></span>
          )}
        </Link>
      </div>
    </header>
  );
}
