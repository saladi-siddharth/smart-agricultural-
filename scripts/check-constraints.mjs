import { query, dbPool } from '../services/data/db.js';

async function main() {
  const res = await query(`
    SELECT conname, contype, pg_get_constraintdef(c.oid) as def
    FROM pg_constraint c
    WHERE conrelid = 'public.profiles'::regclass;
  `);
  console.log('Constraints on public.profiles:');
  console.log(JSON.stringify(res.rows, null, 2));
  if (dbPool) await dbPool.end();
  process.exit(0);
}

main();
