import assert from "node:assert/strict";
import test from "node:test";
import { buildPublicationUpdate } from "./publication.ts";

test("builds a published listing update", () => {
  assert.deepEqual(buildPublicationUpdate("published"), { publication_status: "published" });
});

test("builds a hidden listing update", () => {
  assert.deepEqual(buildPublicationUpdate("hidden"), { publication_status: "hidden" });
});
