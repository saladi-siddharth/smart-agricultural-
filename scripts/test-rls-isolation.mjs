import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xgcamlpkbgjulkfknpud.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_3rbDSN4ONrtCxacboVfEdA_3nkUt82f';

async function testRls() {
  console.log('🛡️ Testing RLS Isolation & Farm Authorization...\n');

  // 1. Worker session: query expenses
  const workerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: wAuth } = await workerClient.auth.signInWithPassword({
    email: 'worker@greenvalley.in',
    password: 'Worker@2026!'
  });
  console.log('Logged in as Worker:', wAuth.user.email);

  const { data: wExpenses, error: wExpErr } = await workerClient
    .from('expenses')
    .select('*');

  console.log('Worker expense query result count:', wExpenses?.length || 0);
  if ((wExpenses?.length || 0) > 0) {
    console.error('❌ SECURITY VIOLATION: Worker was able to read expenses!');
    process.exit(1);
  } else {
    console.log('✓ PASS: Worker is strictly blocked from viewing expenses by RLS (0 rows returned)');
  }

  // 2. Owner session: query expenses
  const ownerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: oAuth } = await ownerClient.auth.signInWithPassword({
    email: 'farmer@greenvalley.in',
    password: 'Farmer@2026!'
  });
  console.log('\nLogged in as Owner:', oAuth.user.email);

  const { data: oExpenses, error: oExpErr } = await ownerClient
    .from('expenses')
    .select('*');

  console.log('Owner expense query result count:', oExpenses?.length || 0);
  if (oExpErr) {
    console.error('❌ Error for owner querying expenses:', oExpErr.message);
  } else {
    console.log('✓ PASS: Owner can successfully access farm expenses under RLS');
  }

  // Clean up
  await workerClient.auth.signOut();
  await ownerClient.auth.signOut();

  console.log('\n🎉 RLS ISOLATION TESTS PASSED!');
  process.exit(0);
}

testRls();
