// Product CTA Cards (spec 009, US3/US4) — admin-side CRUD data helpers.
// Runs as the authenticated dashboard user (RLS permits authenticated
// select/insert/update on products). Reads/writes the products table and maps
// between the snake_case row and the camelCase Product type.
import { createClient } from '@/lib/supabase/server';
import { generateProductCode } from '@/lib/products/code';
import type { ProductInput } from '@/lib/products/schema';
import type { Product } from '@/lib/products/types';

const SELECT_COLUMNS =
  'id,code,name,status,headline,sub_headline,video_url,eyebrow,cta_headline,cta_copy,cta_button_label,cta_button_url,created_at,updated_at';

interface ProductRow {
  id: string;
  code: string;
  name: string;
  status: 'draft' | 'active';
  headline: string;
  sub_headline: string | null;
  video_url: string | null;
  eyebrow: string;
  cta_headline: string;
  cta_copy: string;
  cta_button_label: string;
  cta_button_url: string;
  created_at: string;
  updated_at: string;
}

export function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    status: row.status,
    headline: row.headline,
    subHeadline: row.sub_headline,
    videoUrl: row.video_url,
    eyebrow: row.eyebrow,
    ctaHeadline: row.cta_headline,
    ctaCopy: row.cta_copy,
    ctaButtonLabel: row.cta_button_label,
    ctaButtonUrl: row.cta_button_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Map a validated authoring payload to the DB row shape (omitting absent keys). */
function toRow(input: Partial<ProductInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.name !== undefined) row.name = input.name;
  if (input.status !== undefined) row.status = input.status;
  if (input.code !== undefined) row.code = input.code;
  if (input.headline !== undefined) row.headline = input.headline;
  if (input.subHeadline !== undefined) row.sub_headline = input.subHeadline ?? null;
  if (input.videoUrl !== undefined) row.video_url = input.videoUrl ?? null;
  if (input.eyebrow !== undefined) row.eyebrow = input.eyebrow;
  if (input.ctaHeadline !== undefined) row.cta_headline = input.ctaHeadline;
  if (input.ctaCopy !== undefined) row.cta_copy = input.ctaCopy;
  if (input.ctaButtonLabel !== undefined) row.cta_button_label = input.ctaButtonLabel;
  if (input.ctaButtonUrl !== undefined) row.cta_button_url = input.ctaButtonUrl;
  return row;
}

/** Postgres unique-violation code (duplicate product code). */
const UNIQUE_VIOLATION = '23505';
const MAX_CODE_ATTEMPTS = 8;

export class ProductCodeTaken extends Error {
  constructor() {
    super('code_taken');
    this.name = 'ProductCodeTaken';
  }
}

/** List all products (draft + active), newest first. */
export async function listProducts(): Promise<Product[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('products')
    .select(SELECT_COLUMNS)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`listProducts failed: ${error.message}`);
  return ((data ?? []) as unknown as ProductRow[]).map(toProduct);
}

/** Fetch one product by id, or null. */
export async function getProduct(id: string): Promise<Product | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('products')
    .select(SELECT_COLUMNS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`getProduct failed: ${error.message}`);
  return data ? toProduct(data as unknown as ProductRow) : null;
}

/**
 * Create a product. When `code` is omitted, auto-generate a unique short code,
 * retrying on collision. When `code` is provided, a collision throws
 * ProductCodeTaken (the caller returns 409).
 */
export async function createProduct(input: ProductInput): Promise<Product> {
  const supabase = createClient();
  const base = toRow(input);
  const manualCode = typeof input.code === 'string';

  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    const code = manualCode ? (input.code as string) : generateProductCode();
    const { data, error } = await supabase
      .from('products')
      .insert({ ...base, code })
      .select(SELECT_COLUMNS)
      .single();

    if (!error) return toProduct(data as unknown as ProductRow);
    if (error.code === UNIQUE_VIOLATION) {
      if (manualCode) throw new ProductCodeTaken();
      continue; // auto-code collided — try another
    }
    throw new Error(`createProduct failed: ${error.message}`);
  }
  throw new Error('createProduct failed: could not allocate a unique code');
}

/** Update a product (partial). Bumps updated_at. Code collision throws ProductCodeTaken. */
export async function updateProduct(
  id: string,
  input: Partial<ProductInput>,
): Promise<Product | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('products')
    .update({ ...toRow(input), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(SELECT_COLUMNS)
    .maybeSingle();

  if (error) {
    if (error.code === UNIQUE_VIOLATION) throw new ProductCodeTaken();
    throw new Error(`updateProduct failed: ${error.message}`);
  }
  return data ? toProduct(data as unknown as ProductRow) : null;
}
