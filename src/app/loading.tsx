import { SiteHeader } from "../components/site-header";

function SkeletonCard() {
  return (
    <div className="skeletonCard" aria-hidden="true">
      <div className="skeletonBlock skeletonMedia" />
      <div className="skeletonBody">
        <div className="skeletonLine skeletonLineShort" />
        <div className="skeletonLine" />
        <div className="skeletonLine skeletonLineMedium" />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <>
      <SiteHeader />
      <main className="shell homeShell" aria-busy="true" aria-label="İçerik yükleniyor">
        <section className="hero homeHero">
          <div className="skeletonLine skeletonEyebrow" />
          <div className="skeletonLine skeletonHeroTitle" />
          <div className="skeletonLine skeletonHeroTitle skeletonHeroTitleSmall" />
          <div className="skeletonLine skeletonHeroText" />
        </section>

        <section className="categories homeCategories">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="card skeletonCategory" key={index} aria-hidden="true">
              <div className="skeletonLine skeletonLineMedium" />
              <div className="skeletonLine" />
            </div>
          ))}
        </section>

        <section className="listingSection">
          <div className="sectionHeading">
            <div>
              <div className="skeletonLine skeletonEyebrow" />
              <div className="skeletonLine skeletonSectionTitle" />
            </div>
          </div>
          <div className="listingGrid">
            {Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} />)}
          </div>
        </section>
      </main>
    </>
  );
}
