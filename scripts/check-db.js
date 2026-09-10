import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function check() {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected to DB');

  const cols = await client.query(`
    SELECT column_name, data_type, is_nullable, column_default 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' 
    ORDER BY ordinal_position;
  `);
  console.log('Columns in profiles:');
  console.table(cols.rows);

  const rows = await client.query(`
    SELECT id, username, full_name, email, role, role_label, password_plain, pin, phone, farm_name 
    FROM public.profiles;
  `);
  console.log('Rows in profiles (' + rows.rows.length + '):');
  console.table(rows.rows);

  // Check user_credentials table if it exists
  const credsCheck = await client.query(`
    SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name='user_credentials';
  `);
  if (credsCheck.rows.length > 0) {
    const credRows = await client.query(`SELECT * FROM public.user_credentials;`);
    console.log('Rows in user_credentials (' + credRows.rows.length + '):');
    console.table(credRows.rows);
  }

  // Also check RLS on profiles
  const rlsCheck = await client.query(`
    SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles';
  `);
  console.log('RLS on profiles:', rlsCheck.rows);

  // Check policies on profiles
  const polCheck = await client.query(`
    SELECT policyname, permissive, roles, cmd, qual, with_check 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles';
  `);
  console.log('Policies on profiles:');
  console.table(polCheck.rows);

  await client.end();
}

check().catch(console.error);
