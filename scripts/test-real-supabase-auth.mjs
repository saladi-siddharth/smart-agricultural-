import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xgcamlpkbgjulkfknpud.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_3rbDSN4ONrtCxacboVfEdA_3nkUt82f';

async function testAuth() {
  console.log('🧪 Testing Real Supabase Authentication across 4 roles...\n');
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const testAccounts = [
    { email: 'farmer@greenvalley.in', pass: 'Farmer@2026!', role: 'OWNER', name: 'Siddharth Saladi' },
    { email: 'manager@greenvalley.in', pass: 'Manager@2026!', role: 'MANAGER', name: 'Rajesh Patel' },
    { email: 'worker@greenvalley.in', pass: 'Worker@2026!', role: 'WORKER', name: 'Ravi Kumar' },
    { email: 'consultant@greenvalley.in', pass: 'Consultant@2026!', role: 'CONSULTANT', name: 'Dr. Anita Rao' }
  ];

  for (const acc of testAccounts) {
    console.log(`🔐 Signing in as ${acc.role} (${acc.email})...`);
    const { data, error } = await client.auth.signInWithPassword({
      email: acc.email,
      password: acc.pass
    });

    if (error) {
      console.error(`❌ Failed to sign in as ${acc.role}:`, error.message);
      process.exit(1);
    }

    console.log(`  ✓ Successfully signed in with Supabase Auth!`);
    console.log(`  ✓ Auth User ID: ${data.user.id}`);
    console.log(`  ✓ Access Token Issued: ${Boolean(data.session?.access_token)}`);
    console.log(`  ✓ Expires At: ${new Date((data.session?.expires_at || 0) * 1000).toISOString()}`);

    // Verify profile lookup
    const { data: profile, error: pError } = await client
      .from('profiles')
      .select('id, username, full_name, role')
      .eq('id', data.user.id)
      .single();

    if (pError) {
      console.error(`  ❌ Failed to load profile:`, pError.message);
    } else {
      console.log(`  ✓ Profile loaded: @${profile.username} | ${profile.full_name} | Role: ${profile.role}`);
    }

    // Sign out to clean up session
    await client.auth.signOut();
  }

  // Test Invalid Password
  console.log('\n🛡️ Testing Invalid Password rejection...');
  const { data: badData, error: badError } = await client.auth.signInWithPassword({
    email: 'farmer@greenvalley.in',
    password: 'WrongPassword123!'
  });

  if (badError) {
    console.log(`  ✓ Invalid password correctly rejected by Supabase Auth: "${badError.message}"`);
  } else {
    console.error(`  ❌ ERROR: Invalid password was accepted! Session:`, badData);
    process.exit(1);
  }

  console.log('\n🎉 ALL REAL SUPABASE AUTH TESTS PASSED!');
  process.exit(0);
}

testAuth();
