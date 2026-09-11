import { query, dbPool } from '../services/data/db.js';

async function main() {
  const res = await query("SELECT tablename, policyname, cmd, qual, with_check FROM pg_policies WHERE tablename IN ('conversations', 'conversation_members')");
  console.log('Policies:', res.rows);
  if (dbPool) await dbPool.end();
  process.exit(0);
}

main();
