/**
 * Admin account provisioning (spec 005, US1 / task T020).
 *
 * Public sign-up is disabled — dashboard accounts are created only by running
 * this one-off script. The set of created `auth.users` rows IS the allowlist
 * (research R2). Uses the service role key; never run from request handlers.
 *
 * Usage:
 *   npm run admin:provision -- --email charl@worshipguitarskills.com
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
 */
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { createClient } from '@supabase/supabase-js';

// Load .env.local (Node 20.12+). Ignore if unavailable — env may already be set.
try {
  process.loadEnvFile?.('.env.local'); // Node 20.12+
} catch {
  /* env vars expected to be present already */
}

function getArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const inline = process.argv.find((a) => a.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const flagIdx = process.argv.indexOf(`--${name}`);
  return flagIdx !== -1 ? process.argv[flagIdx + 1] : undefined;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (.env.local).',
    );
    process.exit(1);
  }

  const email = getArg('email');
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    console.error('Provide a valid email: npm run admin:provision -- --email you@example.com');
    process.exit(1);
  }

  const rl = createInterface({ input: stdin, output: stdout });
  const password = await rl.question(`Initial password for ${email}: `);
  rl.close();
  if (password.length < 12) {
    console.error('Password must be at least 12 characters.');
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    console.error(`Failed to create account: ${error.message}`);
    process.exit(1);
  }

  console.log(`✓ Admin account provisioned: ${data.user?.email} (${data.user?.id})`);
}

main();
