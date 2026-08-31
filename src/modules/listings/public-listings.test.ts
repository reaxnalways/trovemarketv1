import assert from "node:assert/strict";
import test from "node:test";
import { formatListingPrice, resolvePublicListings } from "./public-listings.ts";

test("returns public listings from the repository query", async () => {
  const listings = await resolvePublicListings(async () => ({
    data: [
      {
        id: "product-1",
        product_code: "TEL-001",
        title: "iPhone 15 Pro",
        brand: "Apple",
        model: "iPhone 15 Pro",
        storage: "256 GB",
        price: 50000,
        images: [],
        stock_status: "in_stock",
        is_featured: true,
        created_at: "2026-08-29T00:00:00Z",
      },
    ],
    error: null,
  }));

  assert.equal(listings[0]?.product_code, "TEL-001");
});

test("surfaces listing query errors", async () => {
  await assert.rejects(
    resolvePublicListings(async () => ({ data: null, error: { message: "offline" } })),
    /Unable to load public listings: offline/,
  );
});

test("formats TRY prices and supports contact-only pricing", () => {
  assert.match(formatListingPrice(50000), /50\.000/);
  assert.equal(formatListingPrice(null), "Fiyat için iletişime geç");
});
