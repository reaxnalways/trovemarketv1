import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migrationPath = new URL('../../../supabase/migrations/20260828233509_create_core_catalog.sql', import.meta.url);
const sql = readFileSync(migrationPath, 'utf8');

test('core catalog migration enforces unique product codes and barcode links', () => {
  assert.match(sql, /product_code text not null unique/i);
  assert.match(sql, /barcode text unique/i);
  assert.match(sql, /category_id uuid not null references public\.categories\(id\)/i);
});

test('core catalog migration enables RLS and exposes only published catalog data', () => {
  assert.match(sql, /alter table public\.categories enable row level security/i);
  assert.match(sql, /alter table public\.products enable row level security/i);
  assert.match(sql, /using \(is_active = true\)/i);
  assert.match(sql, /using \(publication_status = 'published'\)/i);
});

test('core catalog migration seeds the four MVP categories', () => {
  for (const prefix of ['TEL', 'SRV', 'LAP', 'PAR']) {
    assert.match(sql, new RegExp(`'${prefix}'`));
  }
});
