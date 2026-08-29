import assert from "node:assert/strict";
import test from "node:test";
import { buildDraftListing } from "./create-listing.ts";

test("builds a normalized draft listing", () => {
  const listing = buildDraftListing({
    categoryId: "category-1",
    title: "  iPhone 15 Pro  ",
    brand: " Apple ",
    price: "49999,90",
    condition: "used",
    images: [" https://example.supabase.co/storage/v1/object/public/product-images/one.jpg "],
  });

  assert.equal(listing.title, "iPhone 15 Pro");
  assert.equal(listing.brand, "Apple");
  assert.equal(listing.price, 49999.9);
  assert.deepEqual(listing.images, ["https://example.supabase.co/storage/v1/object/public/product-images/one.jpg"]);
  assert.equal(listing.publication_status, "draft");
  assert.equal(listing.stock_status, "in_stock");
});

test("keeps optional listing fields nullable", () => {
  const listing = buildDraftListing({ categoryId: "category-1", title: "MacBook Air" });

  assert.equal(listing.price, null);
  assert.equal(listing.model, null);
  assert.equal(listing.condition, null);
  assert.deepEqual(listing.images, []);
});

test("rejects missing category and short titles", () => {
  assert.throws(() => buildDraftListing({ categoryId: "", title: "iPhone" }), /Kategori/);
  assert.throws(() => buildDraftListing({ categoryId: "category-1", title: " x " }), /Başlık/);
});

test("rejects invalid prices and conditions", () => {
  assert.throws(
    () => buildDraftListing({ categoryId: "category-1", title: "iPhone", price: "abc" }),
    /Fiyat/,
  );
  assert.throws(
    () => buildDraftListing({ categoryId: "category-1", title: "iPhone", condition: "broken" }),
    /Geçersiz/,
  );
});
