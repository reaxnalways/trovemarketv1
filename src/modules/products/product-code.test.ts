import assert from "node:assert/strict";
import test from "node:test";
import { formatProductCode } from "./product-code.ts";

test("formats category-specific Trove product codes", () => {
  assert.equal(formatProductCode("phone", 1), "TEL-001");
  assert.equal(formatProductCode("laptop", 12), "LAP-012");
  assert.equal(formatProductCode("part", 123), "PAR-123");
});

test("rejects invalid product code sequences", () => {
  assert.throws(() => formatProductCode("phone", 0), RangeError);
  assert.throws(() => formatProductCode("phone", 1.5), RangeError);
});
