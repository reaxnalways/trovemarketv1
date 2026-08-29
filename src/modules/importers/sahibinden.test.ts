import assert from "node:assert/strict";
import test from "node:test";
import { assertSahibindenUrl, parseSahibindenHtml, parseSahibindenText } from "./sahibinden.ts";

const SAMPLE_HTML = `<!doctype html>
<html><head>
<meta property="og:title" content="Apple iPhone 15 Pro 256 GB - sahibinden.com" />
<meta property="og:description" content="Temiz kullanılmış iPhone, pil sağlığı yüksek." />
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Apple iPhone 15 Pro 256 GB",
  "brand": {"@type":"Brand","name":"Apple"},
  "model": "iPhone 15 Pro",
  "description": "Temiz kullanılmış iPhone.",
  "offers": {"@type":"Offer","price":"49.999"},
  "additionalProperty": [
    {"name":"Dahili Hafıza","value":"256 GB"},
    {"name":"Renk","value":"Siyah"},
    {"name":"Pil Sağlığı","value":"%92"},
    {"name":"Durumu","value":"İkinci El"}
  ]
}
</script>
<script type="application/ld+json">
{"@type":"BreadcrumbList","itemListElement":[{"name":"Cep Telefonu"}]}
</script>
</head><body></body></html>`;

const SAMPLE_TEXT = `
Cep Telefonu
Apple iPhone 15 Pro 256 GB
49.999 TL
Marka
Apple
Model
iPhone 15 Pro
Dahili Hafıza
256 GB
Renk
Siyah
Pil Sağlığı
%92
Durumu
İkinci El
Açıklama
Cihaz temiz kullanılmıştır. Kutusu mevcuttur.
`;

test("accepts only HTTPS sahibinden.com URLs", () => {
  assert.equal(assertSahibindenUrl("https://www.sahibinden.com/ilan/123").hostname, "www.sahibinden.com");
  assert.throws(() => assertSahibindenUrl("https://example.com/ilan/123"), /sahibinden\.com/);
  assert.throws(() => assertSahibindenUrl("http://www.sahibinden.com/ilan/123"), /sahibinden\.com/);
});

test("extracts listing fields from pasted Sahibinden text", () => {
  const listing = parseSahibindenText(SAMPLE_TEXT);

  assert.equal(listing.title, "Apple iPhone 15 Pro 256 GB");
  assert.equal(listing.brand, "Apple");
  assert.equal(listing.model, "iPhone 15 Pro");
  assert.equal(listing.price, 49999);
  assert.equal(listing.storage, "256 GB");
  assert.equal(listing.color, "Siyah");
  assert.equal(listing.batteryHealth, "%92");
  assert.equal(listing.condition, "used");
  assert.equal(listing.categorySlug, "telefon");
  assert.match(listing.description ?? "", /Kutusu mevcuttur/);
});

test("rejects pasted text that is too short", () => {
  assert.throws(() => parseSahibindenText("iPhone"), /çok kısa/);
});

test("keeps HTML parser available for a future authorized source adapter", () => {
  const listing = parseSahibindenHtml(SAMPLE_HTML);
  assert.equal(listing.price, 49999);
  assert.equal(listing.categorySlug, "telefon");
});
