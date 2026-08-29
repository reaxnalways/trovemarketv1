import assert from "node:assert/strict";
import test from "node:test";
import { resolvePublicCategories } from "./public-categories.ts";

test("returns public categories from the repository query", async () => {
  const categories = await resolvePublicCategories(async () => ({
    data: [
      {
        id: "category-1",
        name: "2. El & Sıfır Telefon",
        slug: "telefon",
        description: null,
      },
    ],
    error: null,
  }));

  assert.equal(categories.length, 1);
  assert.equal(categories[0]?.slug, "telefon");
});

test("surfaces category query errors", async () => {
  await assert.rejects(
    resolvePublicCategories(async () => ({ data: null, error: { message: "offline" } })),
    /Unable to load public categories: offline/,
  );
});
