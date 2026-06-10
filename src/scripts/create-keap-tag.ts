/**
 * Create Keap tags from a spec, following the WGS naming convention.
 *
 * Companion to the `keap-tag-builder` skill. This is the DEVELOPER-ONLY path —
 * most team members just use the skill to generate names and create them by hand
 * in Keap. Only use this when a developer explicitly wants the tags created via API.
 *
 * Safety: DRY-RUN by default. Keap REST v1 has NO tag-delete endpoint, so a tag
 * created via API is permanent (removable only by hand in the Keap UI). Always show
 * the dry-run plan and confirm before passing --confirm. Creation is deduped by name
 * within category, so re-running is a safe no-op.
 *
 * Usage:
 *   npm run keap:create-tag -- --spec ./tags.json              # dry-run (default)
 *   npm run keap:create-tag -- --spec ./tags.json --confirm    # actually create
 *   npm run keap:create-tag -- --tags '[{"name":"...","category":"02. WGS History"}]'
 *
 * Spec = JSON array of { name: string, category: string | number }.
 *   `category` may be the EXACT category name (resolved by scanning existing tags)
 *   or a numeric category id.
 *
 * Requires KEAP_SERVICE_ACCOUNT_KEY in .env.local.
 */
import { readFileSync } from 'node:fs';

try {
  process.loadEnvFile?.('.env.local');
} catch {
  /* env vars expected to be present already */
}

const KEAP_BASE_URL = 'https://api.infusionsoft.com/crm/rest/v1';
const CONFIRM = process.argv.includes('--confirm');

interface TagSpec {
  name: string;
  category: string | number;
}

function parseArgs(): TagSpec[] {
  const argv = process.argv.slice(2);
  const specFlag = argv.indexOf('--spec');
  const tagsFlag = argv.indexOf('--tags');
  let raw: string;
  if (specFlag !== -1 && argv[specFlag + 1]) {
    raw = readFileSync(argv[specFlag + 1], 'utf8');
  } else if (tagsFlag !== -1 && argv[tagsFlag + 1]) {
    raw = argv[tagsFlag + 1];
  } else {
    throw new Error('Provide --spec <file.json> or --tags \'<json>\' (array of { name, category }).');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Spec is not valid JSON. Expected an array of { name, category }.');
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Spec must be a non-empty array of { name, category }.');
  }
  for (const t of parsed) {
    if (!t || typeof t.name !== 'string' || (typeof t.category !== 'string' && typeof t.category !== 'number')) {
      throw new Error(`Bad spec entry: ${JSON.stringify(t)} — needs { name: string, category: string | number }.`);
    }
  }
  return parsed as TagSpec[];
}

function authHeader(): string {
  const key = process.env.KEAP_SERVICE_ACCOUNT_KEY;
  if (!key) throw new Error('KEAP_SERVICE_ACCOUNT_KEY is not set in .env.local');
  return `Bearer ${key}`;
}

async function keap<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${KEAP_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Keap ${method} ${path} failed (${res.status}): ${text.slice(0, 500)}`);
  }
  return res.json() as Promise<T>;
}

interface KeapTag {
  id: number;
  name: string;
  category?: { id: number; name: string };
}

/** Read every tag (paged) so we can resolve category names and dedupe. */
async function fetchAllTags(): Promise<KeapTag[]> {
  let offset = 0;
  const all: KeapTag[] = [];
  for (;;) {
    const j = await keap<{ tags?: KeapTag[] }>('GET', `/tags?limit=1000&offset=${offset}`);
    const tags = j.tags ?? [];
    all.push(...tags);
    if (tags.length < 1000) break;
    offset += 1000;
  }
  return all;
}

async function main() {
  const specs = parseArgs();
  const allTags = await fetchAllTags();

  // category name -> id, and existing tag names per category id (for dedupe).
  const catNameToId = new Map<string, number>();
  const catIdToName = new Map<number, string>();
  const existingByCatId = new Map<number, Set<string>>();
  for (const t of allTags) {
    if (t.category) {
      catNameToId.set(t.category.name, t.category.id);
      catIdToName.set(t.category.id, t.category.name);
      if (!existingByCatId.has(t.category.id)) existingByCatId.set(t.category.id, new Set());
      existingByCatId.get(t.category.id)!.add(t.name);
    }
  }

  // Resolve each spec entry's category to an id; collect errors.
  const resolved: Array<{ name: string; categoryId: number; categoryName: string }> = [];
  const errors: string[] = [];
  for (const s of specs) {
    let id: number | undefined;
    if (typeof s.category === 'number') {
      id = catIdToName.has(s.category) ? s.category : undefined;
      if (id === undefined) errors.push(`Unknown category id ${s.category} for "${s.name}".`);
    } else {
      id = catNameToId.get(s.category);
      if (id === undefined) {
        errors.push(`Category "${s.category}" not found (no existing tag uses it) for "${s.name}". ` +
          `Create the category in Keap first, or use a numeric id.`);
      }
    }
    if (id !== undefined) resolved.push({ name: s.name, categoryId: id, categoryName: catIdToName.get(id)! });
  }

  if (errors.length) {
    console.error('✋ Cannot proceed — category resolution errors:\n');
    errors.forEach((e) => console.error('  - ' + e));
    process.exit(1);
  }

  // Plan: create vs already-exists.
  const plan = resolved.map((r) => {
    const exists = existingByCatId.get(r.categoryId)?.has(r.name) ?? false;
    return { ...r, exists };
  });

  console.log(`${CONFIRM ? '' : '[dry-run] '}Keap tag creation plan:\n`);
  for (const p of plan) {
    console.log(`  ${p.exists ? '= exists ' : '+ create '}\t[${p.categoryName}]\t${p.name}`);
  }

  if (!CONFIRM) {
    const toCreate = plan.filter((p) => !p.exists).length;
    console.log(`\n[dry-run] ${toCreate} would be created, ${plan.length - toCreate} already exist.`);
    console.log('Re-run with --confirm to create. (Tags cannot be deleted via API — they are permanent.)');
    return;
  }

  // Create.
  const created: KeapTag[] = [];
  for (const p of plan) {
    if (p.exists) continue;
    const tag = await keap<KeapTag>('POST', '/tags', { name: p.name, category: { id: p.categoryId } });
    created.push(tag);
    existingByCatId.get(p.categoryId)!.add(tag.name); // keep guard fresh within run
  }

  console.log(`\n✅ ${created.length} created, ${plan.length - created.length} already existed.`);
  if (created.length) {
    console.log('\nArchive record (paste into the project tag log):\n');
    console.log('| Keap ID | Category | Tag name |');
    console.log('|---|---|---|');
    for (const t of created) {
      console.log(`| ${t.id} | ${t.category?.name ?? catIdToName.get(plan.find((p) => p.name === t.name)!.categoryId)} | ${t.name} |`);
    }
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
