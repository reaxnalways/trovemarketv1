import assert from "node:assert/strict";
import test from "node:test";
import { buildListingWhatsAppUrl } from "./whatsapp.ts";

test("builds a WhatsApp message containing product code and title", () => {
  const url = buildListingWhatsAppUrl("TEL-001", "Apple iPhone 13", "+90 555 123 45 67");
  assert.ok(url);
  assert.match(url, /^https:\/\/wa\.me\/905551234567\?text=/);
  assert.match(decodeURIComponent(url), /TEL-001/);
  assert.match(decodeURIComponent(url), /Apple iPhone 13/);
});

test("returns null when WhatsApp number is missing", () => {
  assert.equal(buildListingWhatsAppUrl("TEL-001", "Apple iPhone 13", null), null);
  assert.equal(buildListingWhatsAppUrl("TEL-001", "Apple iPhone 13", ""), null);
});
