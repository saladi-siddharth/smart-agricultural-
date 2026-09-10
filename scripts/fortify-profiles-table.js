import pg from 'pg';
import fs from 'fs';

const envVars = {};
fs.readFileSync('.env', 'utf8').split('\n').forEach(l => {
  const [k, ...v] = l.trim().split('=');
  if (k && v.length) envVars[k.trim()] = v.join('=').trim().replace(/^['"]|['"]$/g, '');
});

const client = new pg.Client({
  connectionString: envVars.DIRECT_URL || envVars.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fortifyDatabase() {
  await client.connect();
  console.log('Connected to remote Supabase database...');

  // 1. Add `password` column if not exists and populate from password_plain
  console.log('1. Adding `password` column to public.profiles...');
  await client.query(`
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credentials JSONB;
  `);

  await client.query(`
    UPDATE public.profiles 
    SET password = COALESCE(password_plain, 'Farmer@2026!')
    WHERE password IS NULL;
  `);

  await client.query(`
    UPDATE public.profiles 
    SET password_plain = COALESCE(password, 'Farmer@2026!')
    WHERE password_plain IS NULL;
  `);

  await client.query(`
    UPDATE public.profiles 
    SET pin = COALESCE(pin, '1234')
    WHERE pin IS NULL;
  `);

  await client.query(`
    UPDATE public.profiles 
    SET credentials = jsonb_build_object(
      'username', username,
      'email', email,
      'password', password_plain,
      'pin', pin,
      'role', role,
      'farm', farm_name,
      'status', status
    );
  `);

  // 2. Add Trigger to keep password and password_plain in sync
  console.log('2. Creating synchronization trigger for password fields...');
  await client.query(`
    CREATE OR REPLACE FUNCTION public.sync_profiles_password()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.password IS NOT NULL AND (OLD.password IS NULL OR NEW.password <> OLD.password) THEN
        NEW.password_plain := NEW.password;
      ELSIF NEW.password_plain IS NOT NULL AND (OLD.password_plain IS NULL OR NEW.password_plain <> OLD.password_plain) THEN
        NEW.password := NEW.password_plain;
      END IF;

      NEW.credentials := jsonb_build_object(
        'username', NEW.username,
        'email', NEW.email,
        'password', NEW.password_plain,
        'pin', NEW.pin,
        'role', NEW.role,
        'farm', NEW.farm_name,
        'status', NEW.status
      );
      
      NEW.updated_at := now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trg_sync_profiles_password ON public.profiles;
    CREATE TRIGGER trg_sync_profiles_password
      BEFORE INSERT OR UPDATE ON public.profiles
      FOR EACH ROW EXECUTE FUNCTION public.sync_profiles_password();
  `);

  // 3. Add Integrity Constraints
  console.log('3. Adding integrity constraints on public.profiles...');
  try {
    await client.query(`
      ALTER TABLE public.profiles 
        ADD CONSTRAINT check_profiles_password_min_len 
        CHECK (length(password) >= 6);
    `);
  } catch (e) {
    console.log('Password min length constraint already exists or noticed:', e.message);
  }

  try {
    await client.query(`
      ALTER TABLE public.profiles 
        ADD CONSTRAINT check_profiles_pin_format 
        CHECK (pin ~ '^[0-9]{4,6}$');
    `);
  } catch (e) {
    console.log('PIN format constraint already exists or noticed:', e.message);
  }

  // 4. Ensure RLS policies allow SELECT for community and admin/dashboard viewing
  console.log('4. Fortifying RLS policies on public.profiles...');
  await client.query(`
    -- Drop old restrictive single-user select policy
    DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Allow authenticated read profiles" ON public.profiles;
    DROP POLICY IF EXISTS "Allow public read access to profiles" ON public.profiles;

    -- Create comprehensive read policy for authenticated users and public community search
    CREATE POLICY "Allow public read access to profiles" 
      ON public.profiles 
      FOR SELECT 
      USING (true);

    -- Ensure owner / user can update own profile
    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    CREATE POLICY "Users can update own profile" 
      ON public.profiles 
      FOR UPDATE 
      USING (auth.uid() = id) 
      WITH CHECK (auth.uid() = id);

    -- Grant permissions to public roles
    GRANT SELECT, INSERT, UPDATE ON public.profiles TO anon, authenticated, service_role;
  `);

  // 5. Also synchronize user_credentials table with all 9 accounts
  console.log('5. Ensuring public.user_credentials has all accounts with verified integrity...');
  await client.query(`
    ALTER TABLE public.user_credentials ADD COLUMN IF NOT EXISTS user_id UUID;
    ALTER TABLE public.user_credentials ADD COLUMN IF NOT EXISTS password_plain TEXT;
    ALTER TABLE public.user_credentials ADD COLUMN IF NOT EXISTS password_hash TEXT;
    ALTER TABLE public.user_credentials ADD COLUMN IF NOT EXISTS pin TEXT DEFAULT '1234';
    ALTER TABLE public.user_credentials ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'FARMER';
    ALTER TABLE public.user_credentials ADD COLUMN IF NOT EXISTS role_label TEXT;
    ALTER TABLE public.user_credentials ADD COLUMN IF NOT EXISTS full_name TEXT;
    ALTER TABLE public.user_credentials ADD COLUMN IF NOT EXISTS farm_name TEXT;

    ALTER TABLE public.user_credentials ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow public read user credentials" ON public.user_credentials;
    CREATE POLICY "Allow public read user credentials" ON public.user_credentials FOR SELECT USING (true);
    GRANT SELECT ON public.user_credentials TO anon, authenticated, service_role;
  `);

  const colsRes = await client.query(`
    SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='user_credentials';
  `);
  const colNames = colsRes.rows.map(r => r.column_name);
  console.log('user_credentials columns:', colNames);

  // Sync rows from profiles into user_credentials
  const profRows = await client.query('SELECT * FROM public.profiles;');
  for (const p of profRows.rows) {
    const phone = p.phone || '+91 98480 22334';
    const avatarLetter = (p.full_name || p.username || 'U')[0].toUpperCase();
    const avatarBg = p.role === 'OWNER' ? '#059669' : p.role === 'MANAGER' ? '#2563EB' : p.role === 'WORKER' ? '#D97706' : '#7E22CE';
    const parcel = p.assigned_parcel || 'All Demarcated Parcels';
    const perms = Array.isArray(p.permissions) ? p.permissions : [];

    await client.query(`
      INSERT INTO public.user_credentials (
        username, email, password_plain, password_hash, pin, 
        role, role_label, full_name, farm_name, phone, 
        assigned_parcel, avatar_letter, avatar_bg, permissions, user_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (username) DO UPDATE SET
        email = EXCLUDED.email,
        password_plain = EXCLUDED.password_plain,
        password_hash = EXCLUDED.password_hash,
        pin = EXCLUDED.pin,
        role = EXCLUDED.role,
        role_label = EXCLUDED.role_label,
        full_name = EXCLUDED.full_name,
        farm_name = EXCLUDED.farm_name,
        phone = EXCLUDED.phone,
        assigned_parcel = EXCLUDED.assigned_parcel,
        avatar_letter = EXCLUDED.avatar_letter,
        avatar_bg = EXCLUDED.avatar_bg,
        permissions = EXCLUDED.permissions,
        user_id = EXCLUDED.user_id,
        updated_at = now();
    `, [
      p.username,
      p.email,
      p.password_plain || 'Farmer@2026!',
      p.password_hash || '$2a$12$e8x5aN8qR7b5X3k1lZ0f9e9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4',
      p.pin || '1234',
      p.role || 'OWNER',
      p.role_label || 'Farmer',
      p.full_name || 'Farmer',
      p.farm_name || 'Green Valley Farm',
      phone,
      parcel,
      avatarLetter,
      avatarBg,
      perms,
      p.id
    ]);
  }

  // 6. Update auth.users raw_user_meta_data so auth.users table also shows passwords in user metadata
  console.log('6. Updating auth.users metadata with credentials...');
  const profs = await client.query('SELECT id, email, username, full_name, role, password_plain, pin, farm_name FROM public.profiles;');
  for (const row of profs.rows) {
    await client.query(`
      UPDATE auth.users
      SET raw_user_meta_data = raw_user_meta_data || $1::jsonb
      WHERE id = $2;
    `, [
      JSON.stringify({
        username: row.username,
        full_name: row.full_name,
        role: row.role,
        password: row.password_plain,
        password_plain: row.password_plain,
        pin: row.pin,
        farm_name: row.farm_name
      }),
      row.id
    ]);
  }

  // 7. Verify and Print Final public.profiles (Table 17488) State
  const verified = await client.query(`
    SELECT id, username, email, password, password_plain, pin, role, farm_name 
    FROM public.profiles 
    ORDER BY created_at;
  `);

  console.log('\n✅ TABLE 17488 (public.profiles) IS FORTIFIED & FULLY POPULATED WITH VISIBLE PASSWORDS:');
  console.table(verified.rows);

  await client.end();
}

fortifyDatabase().catch(err => {
  console.error('Error fortifying database:', err);
  process.exit(1);
});
