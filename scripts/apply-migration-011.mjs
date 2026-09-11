import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
const envPath = path.resolve(__dirname, '../.env');
const envVars = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [k, ...v] = trimmed.split('=');
    if (k && v) envVars[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
  }
}

const connectionString = envVars.DIRECT_URL || envVars.DATABASE_URL;

async function run() {
  console.log('📡 Connecting to remote Supabase PostgreSQL...');
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('✓ Connected to Supabase!');

  console.log('Applying migration 011_production_hardening_auth_rbac.sql...');
  const sqlPath = path.resolve(__dirname, '../supabase/migrations/011_production_hardening_auth_rbac.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  try {
    await client.query(sql);
    console.log('✓ Migration 011 successfully executed in remote Supabase database!');
    await client.query("INSERT INTO public._migrations (name) VALUES ('011_production_hardening_auth_rbac.sql') ON CONFLICT DO NOTHING;");
  } catch (err) {
    console.error('❌ Migration 011 failed:', err);
  } finally {
    await client.end();
  }
}

run();
