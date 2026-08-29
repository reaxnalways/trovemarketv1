import assert from "node:assert/strict";
import test from "node:test";
import { formatListingPrice } from "./public-listings.ts";

test("formats listing price for public card and detail page", () => {
  assert.match(formatListingPrice(49999), /49\.999/);
  assert.equal(formatListingPrice(null), "Fiyat için iletişime geç");
});
