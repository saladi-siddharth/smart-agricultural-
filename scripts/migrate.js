import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env
const envPath = path.resolve(__dirname, '../.env');
const envVars = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [k, ...v] = trimmed.split('=');
    if (k && v) envVars[k.trim()] = v.join('=').trim();
  }
}

const directUrl = process.env.DIRECT_URL || envVars.DIRECT_URL;
const databaseUrl = process.env.DATABASE_URL || envVars.DATABASE_URL;

const connectionConfigs = [
  ...(directUrl ? [{ name: 'Direct / Session Pooler', connectionString: directUrl, ssl: { rejectUnauthorized: false } }] : []),
  ...(databaseUrl ? [{ name: 'Transaction Pooler', connectionString: databaseUrl, ssl: { rejectUnauthorized: false } }] : []),
];

async function tryConnect() {
  for (const cfg of connectionConfigs) {
    console.log(`Attempting connection via ${cfg.name}...`);
    const client = new pg.Client({
      connectionString: cfg.connectionString,
      ssl: cfg.ssl,
      connectionTimeoutMillis: 8000,
    });
    try {
      await client.connect();
      console.log(`Connected successfully via ${cfg.name}!`);
      return client;
    } catch (err) {
      console.warn(`Failed connecting via ${cfg.name}: ${err.message}`);
      await client.end().catch(() => {});
    }
  }
  throw new Error('All connection attempts failed. Check network or database password.');
}

async function runMigrations() {
  let client;
  try {
    client = await tryConnect();

    const migrationsDir = path.resolve(__dirname, '../supabase/migrations');
    const files = [
      '001_initial_schema.sql',
      '002_rls_policies.sql',
      '003_database_functions.sql',
    ];

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      console.log(`Running migration: ${file}...`);
      const sql = fs.readFileSync(filePath, 'utf8');
      await client.query(sql);
      console.log(`Completed: ${file}`);
    }

    console.log('All migrations applied successfully to Supabase PostgreSQL!');

    // Check tables created
    const res = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    console.log('Public tables in Supabase:', res.rows.map(r => r.table_name).join(', '));

  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  } finally {
    if (client) await client.end();
  }
}

runMigrations();
