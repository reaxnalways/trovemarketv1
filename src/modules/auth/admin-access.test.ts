import assert from "node:assert/strict";
import test from "node:test";
import { isAdminEmail, parseAdminEmails } from "./admin-access.ts";

test("normalizes configured admin email addresses", () => {
  assert.deepEqual(
    [...parseAdminEmails(" ADMIN@example.com,owner@example.com ")],
    ["admin@example.com", "owner@example.com"],
  );
});

test("accepts an admin email case-insensitively", () => {
  assert.equal(
    isAdminEmail("Admin@Example.com", "admin@example.com,owner@example.com"),
    true,
  );
});

test("rejects an authenticated email that is not configured as admin", () => {
  assert.equal(isAdminEmail("staff@example.com", "admin@example.com"), false);
});

test("rejects missing email and empty admin configuration", () => {
  assert.equal(isAdminEmail(null, "admin@example.com"), false);
  assert.equal(isAdminEmail("admin@example.com", ""), false);
});
