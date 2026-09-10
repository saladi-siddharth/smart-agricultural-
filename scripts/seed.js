import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');

let supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
let serviceRoleKey = process.env.SUPABASE_SECRET_KEY;

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [k, ...v] = trimmed.split('=');
    const key = k.trim();
    const val = v.join('=').trim();
    if (key === 'SUPABASE_URL' || key === 'VITE_SUPABASE_URL') supabaseUrl = supabaseUrl || val;
    if (key === 'SUPABASE_SECRET_KEY') serviceRoleKey = serviceRoleKey || val;
  }
}

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function seed() {
  console.log('🌱 Seeding Green Valley Farm demo scenario to Supabase...');

  // 1. Create or get Demo User
  let userId;
  const { data: users, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) throw listErr;

  const existingUser = users?.users?.find(u => u.email === 'farmer@greenvalley.in');
  if (existingUser) {
    userId = existingUser.id;
    console.log(`Found existing user: farmer@greenvalley.in (${userId})`);
  } else {
    const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
      email: 'farmer@greenvalley.in',
      password: 'Password@123',
      email_confirm: true,
      user_metadata: { full_name: 'Rajesh Patel' },
    });
    if (createErr) throw createErr;
    userId = newUser.user.id;
    console.log(`Created demo user: farmer@greenvalley.in (${userId}) with password: Password@123`);
  }

  // 2. Profile
  const { error: profErr } = await supabase.from('profiles').upsert({
    id: userId,
    full_name: 'Rajesh Patel',
    email: 'farmer@greenvalley.in',
    phone: '+91 98480 22334',
    updated_at: new Date().toISOString(),
  });
  if (profErr) console.warn('Profile upsert notice:', profErr.message);

  // 3. Clear existing demo farm data for clean seed
  const { data: existingFarms } = await supabase.from('farms').select('id').eq('owner_id', userId);
  if (existingFarms && existingFarms.length > 0) {
    console.log('Cleaning prior demo data for idempotence...');
    for (const f of existingFarms) {
      await supabase.from('farms').delete().eq('id', f.id);
    }
  }

  // 4. Create Farm
  const { data: farm, error: farmErr } = await supabase.from('farms').insert({
    owner_id: userId,
    name: 'Green Valley Farm',
    location: 'Machilipatnam Coastal Belt',
    district: 'Krishna',
    state: 'Andhra Pradesh',
    total_area: 12.5,
    area_unit: 'acres',
    description: 'Model precision and organic paddy cultivation unit with canal lift and solar drip infrastructure.',
  }).select().single();

  if (farmErr) throw farmErr;
  console.log(`Created farm: ${farm.name} (${farm.id})`);

  // 5. Create Fields
  const { data: fields, error: fieldErr } = await supabase.from('fields').insert([
    {
      farm_id: farm.id,
      name: 'North Field (Parcel A)',
      area: 5.0,
      area_unit: 'acres',
      soil_type: 'Clay Loam',
      irrigation_type: 'Canal + Drip',
      description: 'Prime low-lying paddy parcel with high water retention and nutrient-rich silt.',
    },
    {
      farm_id: farm.id,
      name: 'South Field (Parcel B)',
      area: 4.5,
      area_unit: 'acres',
      soil_type: 'Alluvial Soil',
      irrigation_type: 'Borewell Flood',
      description: 'Centrally drained parcel with dedicated solar borewell pump.',
    },
    {
      farm_id: farm.id,
      name: 'East Canal Field (Parcel C)',
      area: 3.0,
      area_unit: 'acres',
      soil_type: 'Sandy Clay',
      irrigation_type: 'Canal Lift',
      description: 'Border field with direct canal intake sluice gate.',
    },
  ]).select();

  if (fieldErr) throw fieldErr;
  console.log(`Created ${fields.length} fields`);

  const northField = fields.find(f => f.name.includes('North')) || fields[0];
  const southField = fields.find(f => f.name.includes('South')) || fields[1];

  // 6. Create Crop Cycles
  const { data: cropCycles, error: cropErr } = await supabase.from('crop_cycles').insert([
    {
      farm_id: farm.id,
      field_id: northField.id,
      crop_name: 'Paddy (Rice)',
      variety: 'BPT 5204 (Samba Mahsuri)',
      season: 'Kharif',
      start_date: '2026-06-15',
      expected_harvest_date: '2026-11-20',
      status: 'ACTIVE',
      target_yield: 4.5,
      yield_unit: 'tonnes',
      selling_price_per_unit: 28500,
      planned_budget: 62000,
      notes: 'Export quality premium aromatic rice. Applying integrated nutrient and pest management.',
    },
    {
      farm_id: farm.id,
      field_id: southField.id,
      crop_name: 'Black Gram (Urad)',
      variety: 'LBG-752',
      season: 'Rabi',
      start_date: '2025-11-10',
      expected_harvest_date: '2026-02-28',
      status: 'COMPLETED',
      target_yield: 1.8,
      yield_unit: 'tonnes',
      selling_price_per_unit: 74500,
      planned_budget: 28000,
      notes: 'Post-monsoon pulse rotation cycle with high market yield.',
    },
  ]).select();

  if (cropErr) throw cropErr;
  console.log(`Created ${cropCycles.length} crop cycles`);

  const activePaddy = cropCycles.find(c => c.status === 'ACTIVE') || cropCycles[0];
  const pastUrad = cropCycles.find(c => c.status === 'COMPLETED') || cropCycles[1];

  // 7. Create Activities (5 completed, 1 OVERDUE, 2 pending)
  const { error: actErr } = await supabase.from('activities').insert([
    {
      farm_id: farm.id,
      field_id: northField.id,
      crop_cycle_id: activePaddy.id,
      title: 'Summer Ploughing & Field Puddling',
      description: 'Deep tractor ploughing followed by 2 passes of puddling.',
      activity_type: 'LAND_PREPARATION',
      planned_date: '2026-06-18',
      completed_date: '2026-06-18',
      status: 'COMPLETED',
      priority: 'HIGH',
      estimated_cost: 7000,
      actual_cost: 7500,
    },
    {
      farm_id: farm.id,
      field_id: northField.id,
      crop_cycle_id: activePaddy.id,
      title: 'Seed Treatment with Trichoderma',
      description: 'Treating 25 kg BPT 5204 seeds with bio-agent Trichoderma.',
      activity_type: 'SOWING',
      planned_date: '2026-06-22',
      completed_date: '2026-06-22',
      status: 'COMPLETED',
      priority: 'MEDIUM',
      estimated_cost: 1500,
      actual_cost: 1400,
    },
    {
      farm_id: farm.id,
      field_id: northField.id,
      crop_cycle_id: activePaddy.id,
      title: 'Nursery Bed Sowing & Mat Preparation',
      description: 'Raised nursery bed preparation and uniform seed broadcasting.',
      activity_type: 'SOWING',
      planned_date: '2026-06-25',
      completed_date: '2026-06-25',
      status: 'COMPLETED',
      priority: 'HIGH',
      estimated_cost: 3500,
      actual_cost: 3200,
    },
    {
      farm_id: farm.id,
      field_id: northField.id,
      crop_cycle_id: activePaddy.id,
      title: 'Main Field Mechanical Transplantation',
      description: 'Transplanting 21-day seedlings with 20x15 cm hill spacing.',
      activity_type: 'SOWING',
      planned_date: '2026-07-16',
      completed_date: '2026-07-16',
      status: 'COMPLETED',
      priority: 'CRITICAL',
      estimated_cost: 11000,
      actual_cost: 12000,
    },
    {
      farm_id: farm.id,
      field_id: northField.id,
      crop_cycle_id: activePaddy.id,
      title: 'First Mechanical Cono-Weeding',
      description: 'Inter-cultivation weeding between rows and root aeration.',
      activity_type: 'WEEDING',
      planned_date: '2026-08-05',
      completed_date: '2026-08-06',
      status: 'COMPLETED',
      priority: 'HIGH',
      estimated_cost: 4000,
      actual_cost: 4200,
    },
    // The key overdue task!
    {
      farm_id: farm.id,
      field_id: northField.id,
      crop_cycle_id: activePaddy.id,
      title: 'Second Fertilizer Application (NPK 20-20-20 + Zinc)',
      description: 'Active tillering top-dressing with complex NPK and Zinc sulphate.',
      activity_type: 'FERTILIZATION',
      planned_date: '2026-08-28',
      completed_date: null,
      status: 'OVERDUE',
      priority: 'CRITICAL',
      estimated_cost: 6500,
      actual_cost: 0,
      notes: 'Urgent tillering phase requirement.',
    },
    {
      farm_id: farm.id,
      field_id: northField.id,
      crop_cycle_id: activePaddy.id,
      title: 'Secondary Canal Irrigation Round',
      description: 'Maintain 3-5 cm standing water layer in parcel.',
      activity_type: 'IRRIGATION',
      planned_date: '2026-09-12',
      completed_date: null,
      status: 'PENDING',
      priority: 'MEDIUM',
      estimated_cost: 2500,
      actual_cost: 0,
    },
    {
      farm_id: farm.id,
      field_id: northField.id,
      crop_cycle_id: activePaddy.id,
      title: 'Panicle Initiation Pest Scouting (Stem Borer)',
      description: 'Pheromone trap count and scouting for stem borer.',
      activity_type: 'PEST_INSPECTION',
      planned_date: '2026-09-18',
      completed_date: null,
      status: 'PENDING',
      priority: 'HIGH',
      estimated_cost: 1800,
      actual_cost: 0,
    },
  ]);

  if (actErr) throw actErr;
  console.log('Created 8 activities (including 1 overdue task)');

  // 8. Create Expenses
  const { error: expErr } = await supabase.from('expenses').insert([
    { farm_id: farm.id, field_id: northField.id, crop_cycle_id: activePaddy.id, category: 'SEEDS', description: 'Certified BPT 5204 Foundation Seeds', amount: 4800, expense_date: '2026-06-16' },
    { farm_id: farm.id, field_id: northField.id, crop_cycle_id: activePaddy.id, category: 'MACHINERY', description: '45HP Tractor Ploughing & Dual Rotavator', amount: 7500, expense_date: '2026-06-19' },
    { farm_id: farm.id, field_id: northField.id, crop_cycle_id: activePaddy.id, category: 'LABOR', description: 'Transplantation Labor (15 workers @ ₹800)', amount: 12000, expense_date: '2026-07-17' },
    { farm_id: farm.id, field_id: northField.id, crop_cycle_id: activePaddy.id, category: 'FERTILIZER', description: 'Basal Nutrients: DAP & Neem Cake Pack', amount: 5000, expense_date: '2026-07-28' },
    { farm_id: farm.id, field_id: northField.id, crop_cycle_id: activePaddy.id, category: 'LABOR', description: 'First Cono-Weeding Labor (7 workers)', amount: 4200, expense_date: '2026-08-06' },
    { farm_id: farm.id, field_id: northField.id, crop_cycle_id: activePaddy.id, category: 'IRRIGATION', description: 'Solar Borewell Service & Canal Sluice Cess', amount: 2500, expense_date: '2026-08-20' },
  ]);

  if (expErr) throw expErr;
  console.log('Created 6 expense ledgers');

  // 9. Create Inputs
  const { error: inpErr } = await supabase.from('inputs').insert([
    { farm_id: farm.id, field_id: northField.id, crop_cycle_id: activePaddy.id, name: 'Certified BPT 5204 Paddy Seeds', input_type: 'SEED', quantity: 25, unit: 'kg', cost: 4800, used_date: '2026-06-20', supplier: 'AP State Seed Corp' },
    { farm_id: farm.id, field_id: northField.id, crop_cycle_id: activePaddy.id, name: 'DAP (Di-Ammonium Phosphate)', input_type: 'FERTILIZER', quantity: 100, unit: 'kg', cost: 3200, used_date: '2026-07-15', supplier: 'IFFCO Farmers Center' },
    { farm_id: farm.id, field_id: northField.id, crop_cycle_id: activePaddy.id, name: 'Neem Cake Organic Soil Conditioner', input_type: 'ORGANIC_MANURE', quantity: 50, unit: 'kg', cost: 1800, used_date: '2026-07-15', supplier: 'Sri Krishna Bio Agro' },
    { farm_id: farm.id, field_id: northField.id, crop_cycle_id: activePaddy.id, name: 'Zinc Sulphate Heptahydrate', input_type: 'FERTILIZER', quantity: 10, unit: 'kg', cost: 1400, used_date: '2026-08-01', supplier: 'IFFCO Machilipatnam' },
    { farm_id: farm.id, field_id: northField.id, crop_cycle_id: activePaddy.id, name: 'Trichoderma Viride Bio-Fungicide', input_type: 'PESTICIDE', quantity: 2, unit: 'kg', cost: 800, used_date: '2026-06-22', supplier: 'National Seeds Corp' },
  ]);

  if (inpErr) throw inpErr;
  console.log('Created 5 agricultural inputs');

  // 10. Create Irrigation Logs
  const { error: irrErr } = await supabase.from('irrigation_logs').insert([
    { farm_id: farm.id, field_id: northField.id, crop_cycle_id: activePaddy.id, irrigation_date: '2026-07-16', water_source: 'CANAL', duration_minutes: 360, water_quantity: 120000, water_unit: 'liters', cost: 1200, method: 'Controlled Canal Flood' },
    { farm_id: farm.id, field_id: northField.id, crop_cycle_id: activePaddy.id, irrigation_date: '2026-08-04', water_source: 'BOREWELL', duration_minutes: 240, water_quantity: 80000, water_unit: 'liters', cost: 800, method: 'Solar Borewell Flood' },
    { farm_id: farm.id, field_id: northField.id, crop_cycle_id: activePaddy.id, irrigation_date: '2026-08-22', water_source: 'CANAL', duration_minutes: 300, water_quantity: 100000, water_unit: 'liters', cost: 1000, method: 'Canal Lift Sluice' },
  ]);

  if (irrErr) throw irrErr;
  console.log('Created 3 irrigation logs');

  // 11. Create Harvest Records
  const { error: harvErr } = await supabase.from('harvests').insert([
    { farm_id: farm.id, field_id: southField.id, crop_cycle_id: pastUrad.id, harvest_date: '2026-02-28', actual_yield: 1.95, yield_unit: 'tonnes', selling_price: 74500, quality: 'EXCELLENT', buyer: 'Andhra Pradesh State Co-op Marketing Fed' },
  ]);

  if (harvErr) throw harvErr;
  console.log('Created 1 harvest record');

  console.log('✅ Demo scenario successfully seeded to live Supabase!');
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
