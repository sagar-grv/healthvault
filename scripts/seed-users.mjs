/**
 * seed-users.mjs
 *
 * Creates test users in local Docker Supabase via the Admin Auth API.
 * Run after `npm run db:reset` to restore test accounts.
 *
 * Usage: npm run db:seed
 *
 * Test accounts created:
 *   patient@test.com / Test1234!  (role: patient)
 *   doctor@test.com  / Test1234!  (role: doctor)
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));

// Read env from .env.local (which should be pointing to Docker)
function readEnv() {
  try {
    const env = readFileSync(resolve(__dir, '../.env.local'), 'utf8');
    const vars = {};
    for (const line of env.split('\n')) {
      const [key, ...rest] = line.split('=');
      if (key && !key.startsWith('#')) {
        vars[key.trim()] = rest.join('=').trim();
      }
    }
    return vars;
  } catch {
    return {};
  }
}

const env = readEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:56321';
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
  console.error('Run: npm run dev:local (to switch to Docker env) then try again.');
  process.exit(1);
}

const USERS = [
  {
    email: 'patient@test.com',
    password: 'Test1234!',
    user_metadata: { role: 'patient', full_name: 'Test Patient' },
  },
  {
    email: 'doctor@test.com',
    password: 'Test1234!',
    user_metadata: { role: 'doctor', full_name: 'Test Doctor' },
  },
];

async function createUser(user) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...user, email_confirm: true }),
  });

  const data = await res.json();

  if (res.ok) {
    console.log(`  Created: ${user.email} (${user.user_metadata.role})`);
    return true;
  } else if (
    data.message?.includes('already been registered') ||
    data.message?.includes('already exists') ||
    data.msg?.includes('already been registered') ||
    data.msg?.includes('already exists') ||
    data.error_code === 'email_exists'
  ) {
    console.log(`  Exists:  ${user.email} (skipped)`);
    return true;
  } else {
    console.error(`  Failed:  ${user.email} — ${data.message || data.msg || JSON.stringify(data)}`);
    return false;
  }
}

console.log(`\nSeeding test users into ${SUPABASE_URL}...\n`);

const results = await Promise.all(USERS.map(createUser));
const allOk = results.every(Boolean);

console.log('\nTest credentials:');
console.log('  patient@test.com  /  Test1234!');
console.log('  doctor@test.com   /  Test1234!');

if (allOk) {
  console.log('\nDone. Open http://localhost:3000 to test.\n');
} else {
  console.error('\nSome users failed to create. Check the errors above.\n');
  process.exit(1);
}
