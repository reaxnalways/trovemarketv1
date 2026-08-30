import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../../components/site-header";
import { getPublicCategoryBySlug } from "../../../modules/categories/repository";
import { formatListingPrice } from "../../../modules/listings/public-listings";
import { listListingsByCategory } from "../../../modules/listings/repository";
import { getPublicSiteSettings } from "../../../modules/settings/public-settings";

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams?: Promise<{ form?: string }> }) {
  const { slug } = await params;
  const query = searchParams ? await searchParams : {};
  const [category, settings] = await Promise.all([getPublicCategoryBySlug(slug), getPublicSiteSettings()]);
  if (!category) notFound();

  if (category.slug === "teknik-servis") {
    const hasMissingFields = query.form === "missing";
    const hasMissingWhatsapp = query.form === "whatsapp-missing";

    return (
      <>
        <SiteHeader settings={settings} />
        <main className="shell categoryPageShell serviceCustomerPage">
          <Link className="backLink" href="/">← Ana sayfaya dön</Link>

          <section className="categoryHero serviceCustomerHero">
            <p className="eyebrow">{settings.site_name.toUpperCase()} TEKNİK SERVİS</p>
            <h1>Servis talebini oluştur.</h1>
            <p className="heroText">
              Cihaz bilgilerini ve yaşadığın sorunu yaz. Form tamamlandığında bilgiler hazır mesaj olarak Trove Teknoloji WhatsApp hattına aktarılır.
            </p>
          </section>

          <section className="serviceFormLayout">
            <form action="/teknik-servis/whatsapp" className="serviceCustomerForm" method="get">
              <div className="serviceFormHeading">
                <p className="eyebrow">SERVİS FORMU</p>
                <h2>Cihaz bilgileri</h2>
                <p>Zorunlu alanları doldur; son adımda WhatsApp açılacak.</p>
              </div>

              {hasMissingFields ? (
                <div className="adminError" role="alert">Lütfen zorunlu alanların tamamını doldur.</div>
              ) : null}

              {hasMissingWhatsapp ? (
                <div className="adminError" role="alert">WhatsApp numarası henüz tanımlı değil. Lütfen Trove Teknoloji ile iletişime geç.</div>
              ) : null}

              <div className="serviceFormGrid">
                <label className="serviceField">
                  <span>Ad Soyad *</span>
                  <input autoComplete="name" maxLength={120} name="name" placeholder="Adınız ve soyadınız" required type="text" />
                </label>

                <label className="serviceField">
                  <span>Telefon *</span>
                  <input autoComplete="tel" inputMode="tel" maxLength={40} name="phone" placeholder="05xx xxx xx xx" required type="tel" />
                </label>

                <label className="serviceField">
                  <span>Cihaz Türü *</span>
                  <select defaultValue="" name="deviceType" required>
                    <option disabled value="">Cihaz türünü seç</option>
                    <option value="Telefon">Telefon</option>
                    <option value="Laptop">Laptop</option>
                    <option value="Masaüstü Bilgisayar">Masaüstü Bilgisayar</option>
                    <option value="Tablet">Tablet</option>
                    <option value="Diğer">Diğer</option>
                  </select>
                </label>

                <label className="serviceField">
                  <span>Marka / Model *</span>
                  <input maxLength={160} name="brandModel" placeholder="Örn. iPhone 15 Pro" required type="text" />
                </label>

                <label className="serviceField serviceFieldWide">
                  <span>Şikayet / Arıza *</span>
                  <textarea maxLength={800} name="complaint" placeholder="Cihazda yaşadığınız sorunu mümkün olduğunca açık yazın." required rows={5} />
                </label>

                <label className="serviceField serviceFieldWide">
                  <span>Ek Not</span>
                  <textarea maxLength={800} name="note" placeholder="Varsa eklemek istediğiniz bilgi" rows={3} />
                </label>
              </div>

              <div className="serviceFormActions">
                <button className="primaryCta serviceSubmitButton" type="submit">WhatsApp ile servis talebi oluştur</button>
                <small>Gönder butonuna bastığınızda bilgileriniz WhatsApp mesajına eklenir; mesajı siz gönderirsiniz.</small>
              </div>
            </form>

            <aside className="serviceFormAside">
              <div>
                <p className="eyebrow">NASIL ÇALIŞIR?</p>
                <h2>3 adımda hızlı servis.</h2>
              </div>
              <ol className="serviceSteps">
                <li><strong>1</strong><span><b>Formu doldur</b>Cihaz ve arıza bilgilerini gir.</span></li>
                <li><strong>2</strong><span><b>WhatsApp&apos;a geç</b>Bilgiler hazır mesaj olarak açılır.</span></li>
                <li><strong>3</strong><span><b>Mesajı gönder</b>Servis ekibi seninle iletişime geçsin.</span></li>
              </ol>
              <p className="servicePrivacyNote">Form bilgileri bu adımda sitede servis kaydı olarak tutulmaz; yalnızca WhatsApp mesajını hazırlamak için kullanılır.</p>
            </aside>
          </section>
        </main>
      </>
    );
  }

  const listings = await listListingsByCategory(category.id);
  return <><SiteHeader settings={settings} /><main className="shell categoryPageShell"><Link className="backLink" href="/">← Ana sayfaya dön</Link><section className="categoryHero"><p className="eyebrow">{settings.site_name.toUpperCase()} KATEGORİ</p><h1>{category.name}</h1><p className="heroText">{category.description ?? "Yayınlanmış ürünleri incele."}</p></section>{listings.length === 0 ? <div className="emptyState">Bu kategoride henüz yayınlanmış ilan yok.</div> : <div className="listingGrid categoryListingGrid">{listings.map((listing) => <Link className="listingCard listingCardLink" href={`/ilan/${listing.product_code}`} key={listing.id}><div className="listingMedia">{listing.images[0] ? <img alt={listing.title} className="listingImage" src={listing.images[0]} /> : <span>TROVE</span>}</div><div className="listingBody"><span className="productCode">{listing.product_code}</span><h2>{listing.title}</h2><p className="listingMeta">{[listing.brand, listing.model].filter(Boolean).join(" · ") || "Ürün detayları"}</p><strong>{formatListingPrice(listing.price)}</strong></div></Link>)}</div>}</main></>;
}
