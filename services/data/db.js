/**
 * FarmPilot PostgreSQL Database Connection Pool
 * Connects securely to remote Supabase instance for data queries,
 * authentication verification, and audit logging.
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
const envPath = path.resolve(__dirname, '../../.env');
const env = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [k, ...v] = trimmed.split('=');
    if (k && v) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
  }
}

const connectionString = (env.DIRECT_URL || env.DATABASE_URL || '').replace('?sslmode=require', '');

export const dbPool = connectionString
  ? new pg.Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    })
  : null;

if (dbPool) {
  dbPool.on('error', (err) => {
    console.warn('[PostgreSQL Pool Warning]:', err.message);
  });
}

/**
 * Execute a query with graceful fallback
 */
export async function query(text, params = []) {
  if (!dbPool) return { rows: [], rowCount: 0 };
  try {
    return await dbPool.query(text, params);
  } catch (err) {
    console.warn(`[Database Query Failed]: ${err.message} (Query: ${text.slice(0, 60)}...)`);
    throw err;
  }
}
