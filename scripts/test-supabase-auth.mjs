import { query, dbPool } from '../services/data/db.js';
import { createClient } from '@supabase/supabase-js';

async function main() {
  console.log('Updating auth.users password using crypt(..., gen_salt("bf"))...');
  await query("UPDATE auth.users SET encrypted_password = crypt('Farmer@2026!', gen_salt('bf')) WHERE email = 'farmer@greenvalley.in';");
  console.log('✓ Password hash updated for farmer@greenvalley.in');

  const url = 'https://xgcamlpkbgjulkfknpud.supabase.co';
  const pubKey = 'sb_publishable_3rbDSN4ONrtCxacboVfEdA_3nkUt82f';
  const client = createClient(url, pubKey);

  console.log('Calling client.auth.signInWithPassword()...');
  const { data, error } = await client.auth.signInWithPassword({
    email: 'farmer@greenvalley.in',
    password: 'Farmer@2026!'
  });

  if (error) {
    console.error('❌ Supabase Auth SignIn Error:', error.message);
  } else {
    console.log('🎉 REAL SUPABASE AUTH SUCCESSFUL!');
    console.log('User ID:', data.user.id);
    console.log('Email:', data.user.email);
    console.log('Session Access Token exists:', Boolean(data.session?.access_token));
    console.log('Expires at:', data.session?.expires_at);
  }

  if (dbPool) await dbPool.end();
  process.exit(0);
}

main();
