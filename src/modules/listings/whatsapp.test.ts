import assert from "node:assert/strict";
import test from "node:test";
import { buildListingWhatsAppUrl } from "./whatsapp.ts";

test("builds a WhatsApp message containing product code and title", () => {
  const url = buildListingWhatsAppUrl("TEL-001", "Apple iPhone 13");
  assert.match(url, /^https:\/\/wa\.me\/\?text=/);
  assert.match(decodeURIComponent(url), /TEL-001/);
  assert.match(decodeURIComponent(url), /Apple iPhone 13/);
});
