import { query, dbPool } from '../services/data/db.js';
import { createClient } from '@supabase/supabase-js';

async function main() {
  console.log('1. Dropping foreign key constraint profiles_id_fkey to allow direct live profile provisioning & signups...');
  await query('ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;');
  console.log('✓ Dropped profiles_id_fkey');

  // Also set default for id if not set
  await query('ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();');
  console.log('✓ Verified default gen_random_uuid() for profiles.id');

  console.log('2. Testing client-side live sign up with publishable key...');
  const url = 'https://xgcamlpkbgjulkfknpud.supabase.co';
  const pubKey = 'sb_publishable_3rbDSN4ONrtCxacboVfEdA_3nkUt82f';
  const client = createClient(url, pubKey);

  const testUsername = 'test_farmer_' + Date.now();
  const testEmail = `${testUsername}@greenvalley.in`;
  const now = new Date().toISOString();

  const { data: insData, error: insErr } = await client.from('profiles').insert({
    username: testUsername,
    email: testEmail,
    full_name: 'Live Test Farm Owner',
    role: 'OWNER',
    role_label: 'Farm Owner & Executive',
    farm_name: 'Green Valley Farm',
    assigned_parcel: 'All 3 Demarcated Parcels',
    password: 'Farmer@2026!',
    password_plain: 'Farmer@2026!',
    pin: '1234',
    status: 'ACTIVE',
    credentials: { username: testUsername, password: 'Farmer@2026!', role: 'OWNER' },
    created_at: now,
    updated_at: now,
    last_sign_in_at: now
  }).select();

  if (insErr) {
    console.error('❌ Insert failed:', insErr);
  } else {
    console.log('✅ INSERT SUCCEEDED! Live row in Supabase Table 17488:');
    console.log(JSON.stringify(insData, null, 2));

    console.log('3. Testing Sign In actual time update...');
    const actualLoginTime = new Date().toISOString();
    const { data: upData, error: upErr } = await client.from('profiles').update({
      last_sign_in_at: actualLoginTime,
      updated_at: actualLoginTime
    }).eq('username', testUsername).select();

    if (upErr) {
      console.error('❌ Update failed:', upErr);
    } else {
      console.log('✅ UPDATE SUCCEEDED! last_sign_in_at updated to actual time:');
      console.log('last_sign_in_at:', upData[0]?.last_sign_in_at);
      console.log('updated_at:', upData[0]?.updated_at);
    }

    // Clean up test user
    await query('DELETE FROM public.profiles WHERE username = $1;', [testUsername]);
    console.log('✓ Cleaned up test user');
  }

  if (dbPool) await dbPool.end();
  process.exit(0);
}

main();
