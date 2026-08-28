import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migrationPath = new URL('../../../supabase/migrations/20260828233646_add_atomic_product_codes.sql', import.meta.url);
const sql = readFileSync(migrationPath, 'utf8');

test('product codes use a private per-category counter', () => {
  assert.match(sql, /create table private\.product_code_counters/i);
  assert.match(sql, /category_id uuid primary key references public\.categories\(id\)/i);
  assert.match(sql, /last_value = private\.product_code_counters\.last_value \+ 1/i);
});

test('product code assignment is generated in a before-insert trigger', () => {
  assert.match(sql, /new\.product_code := v_prefix \|\| '-' \|\| lpad\(v_next::text, 3, '0'\)/i);
  assert.match(sql, /before insert on public\.products/i);
  assert.match(sql, /execute function private\.assign_product_code\(\)/i);
});

test('private generator is not executable by public client roles', () => {
  assert.match(sql, /revoke all on schema private from public, anon, authenticated/i);
  assert.match(sql, /revoke all on function private\.assign_product_code\(\) from public, anon, authenticated/i);
});
