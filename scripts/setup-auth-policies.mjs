import { dbPool, query } from '../services/data/db.js';

async function main() {
  console.log('Applying RLS policies & schema updates to Supabase...');
  try {
    // 1. Ensure last_sign_in_at exists
    await query('ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_sign_in_at TIMESTAMPTZ;');
    console.log('✓ Column last_sign_in_at verified on public.profiles');

    // 2. Profiles policies
    await query('DROP POLICY IF EXISTS "Allow public insert to profiles" ON public.profiles;');
    await query('CREATE POLICY "Allow public insert to profiles" ON public.profiles FOR INSERT TO anon, authenticated WITH CHECK (true);');
    console.log('✓ Policy "Allow public insert to profiles" created');

    await query('DROP POLICY IF EXISTS "Allow public update to profiles" ON public.profiles;');
    await query('CREATE POLICY "Allow public update to profiles" ON public.profiles FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);');
    console.log('✓ Policy "Allow public update to profiles" created');

    // 3. Security Audit Logs policies
    await query('DROP POLICY IF EXISTS "Allow public insert to security_audit_logs" ON public.security_audit_logs;');
    await query('CREATE POLICY "Allow public insert to security_audit_logs" ON public.security_audit_logs FOR INSERT TO anon, authenticated WITH CHECK (true);');
    console.log('✓ Policy "Allow public insert to security_audit_logs" created');

    await query('DROP POLICY IF EXISTS "Allow public select to security_audit_logs" ON public.security_audit_logs;');
    await query('CREATE POLICY "Allow public select to security_audit_logs" ON public.security_audit_logs FOR SELECT TO anon, authenticated USING (true);');
    console.log('✓ Policy "Allow public select to security_audit_logs" created');

    console.log('🎉 All policies and schema enhancements successfully applied to remote Supabase!');
  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    if (dbPool) await dbPool.end();
    process.exit(0);
  }
}

main();
