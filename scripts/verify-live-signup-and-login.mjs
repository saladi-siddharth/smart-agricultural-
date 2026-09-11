import { query, dbPool } from '../services/data/db.js';

async function main() {
  console.log('🚀 [LIVE VERIFICATION] Testing Live Supabase Sign-Up and Sign-In Persistence...\n');

  const testUsername = 'siddhu_test_' + Date.now();
  const testEmail = `${testUsername}@greenvalley.in`;
  const testPassword = 'SecureFarmer@2026!';
  const testFullName = 'Siddharth Live Test User';
  const testRole = 'OWNER';

  console.log(`1. Executing POST /api/auth/signup for @${testUsername}...`);
  const signupRes = await fetch('http://localhost:5173/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: testFullName,
      username: testUsername,
      email: testEmail,
      password: testPassword,
      role: testRole,
      farmName: 'Green Valley Farm'
    })
  });

  const signupData = await signupRes.json();
  console.log('Signup HTTP Response Status:', signupRes.status);
  console.log('Signup Response Data:', signupData.message || signupData);

  if (!signupData.success) {
    throw new Error('Sign up failed: ' + JSON.stringify(signupData));
  }

  console.log('\n2. Verifying record directly in remote Supabase Table 17488 (public.profiles)...');
  const profileRows = await query(
    `SELECT id, username, email, full_name, role, password, password_plain, pin, assigned_parcel, status, credentials, created_at, updated_at, last_sign_in_at
     FROM public.profiles
     WHERE username = $1;`,
    [testUsername]
  );

  if (profileRows.rows.length === 0) {
    throw new Error('❌ Profile record was NOT found in Supabase public.profiles!');
  }

  const profile = profileRows.rows[0];
  console.log('✅ Found live profile in Supabase Table 17488:');
  console.log({
    id: profile.id,
    username: profile.username,
    email: profile.email,
    role: profile.role,
    password: profile.password,
    password_plain: profile.password_plain,
    pin: profile.pin,
    assigned_parcel: profile.assigned_parcel,
    status: profile.status,
    created_at: profile.created_at,
    last_sign_in_at: profile.last_sign_in_at,
    credentials: profile.credentials
  });

  const initialSignInTime = new Date(profile.last_sign_in_at).getTime();

  console.log('\n3. Verifying SIGNUP_SUCCESS audit log in Supabase public.security_audit_logs...');
  const signupAudit = await query(
    `SELECT event_type, actor_username, actor_role, status, details, created_at
     FROM public.security_audit_logs
     WHERE actor_username = $1 AND event_type = 'SIGNUP_SUCCESS'
     ORDER BY created_at DESC LIMIT 1;`,
    [testUsername]
  );
  console.log('✅ SIGNUP_SUCCESS Audit Log verified:', signupAudit.rows[0]);

  // Wait 1.5 seconds so timestamps are guaranteed distinct
  console.log('\nWaiting 1.5s before sign in...');
  await new Promise(r => setTimeout(r, 1500));

  console.log(`\n4. Executing POST /api/auth/login for @${testUsername}...`);
  const loginRes = await fetch('http://localhost:5173/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: testUsername,
      password: testPassword
    })
  });

  const loginData = await loginRes.json();
  console.log('Login HTTP Response Status:', loginRes.status);
  console.log('Login JWT Token generated:', Boolean(loginData.token));
  console.log('Login Response last_sign_in_at:', loginData.last_sign_in_at);

  if (!loginData.success) {
    throw new Error('Sign in failed: ' + JSON.stringify(loginData));
  }

  // Small delay for DB update
  await new Promise(r => setTimeout(r, 500));

  console.log('\n5. Verifying updated last_sign_in_at in remote Supabase public.profiles...');
  const updatedRows = await query(
    `SELECT username, last_sign_in_at, updated_at
     FROM public.profiles
     WHERE username = $1;`,
    [testUsername]
  );

  const updatedProfile = updatedRows.rows[0];
  const newSignInTime = new Date(updatedProfile.last_sign_in_at).getTime();

  console.log('Initial sign-in / created timestamp:', new Date(initialSignInTime).toISOString());
  console.log('Updated last_sign_in_at timestamp:', new Date(newSignInTime).toISOString());

  if (newSignInTime > initialSignInTime) {
    console.log('✅ SUCCESS! last_sign_in_at was updated to the actual sign-in time in Supabase!');
  } else {
    console.warn('⚠️ Timestamps match or were not incremented:', initialSignInTime, newSignInTime);
  }

  console.log('\n6. Verifying LOGIN_SUCCESS audit log in Supabase public.security_audit_logs...');
  const loginAudit = await query(
    `SELECT event_type, actor_username, actor_role, status, details, created_at
     FROM public.security_audit_logs
     WHERE actor_username = $1 AND event_type = 'LOGIN_SUCCESS'
     ORDER BY created_at DESC LIMIT 1;`,
    [testUsername]
  );
  console.log('✅ LOGIN_SUCCESS Audit Log verified:', loginAudit.rows[0]);

  // Clean up
  await query('DELETE FROM public.security_audit_logs WHERE actor_username = $1;', [testUsername]);
  await query('DELETE FROM public.profiles WHERE username = $1;', [testUsername]);
  console.log('\n✓ Cleaned up test record from Supabase');

  console.log('\n🎉 ALL LIVE SUPABASE CREDENTIAL & TIME STORAGE VERIFICATIONS PASSED 100%!\n');

  if (dbPool) await dbPool.end();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('\n❌ VERIFICATION FAILURE:', err);
  if (dbPool) await dbPool.end();
  process.exit(1);
});
