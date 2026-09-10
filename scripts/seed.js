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
  console.log('🌱 Seeding FarmPilot Phase 2 Multi-Tenant SaaS scenario to Supabase...');

  // 1. Create or get Demo Personas
  const personas = [
    { email: 'farmer@greenvalley.in', name: 'Siddharth Saladi', role: 'OWNER' },
    { email: 'manager@greenvalley.in', name: 'Rajesh Patel', role: 'MANAGER' },
    { email: 'worker@greenvalley.in', name: 'Ravi Kumar', role: 'WORKER' },
    { email: 'consultant@greenvalley.in', name: 'Dr. M. S. Swaminathan', role: 'CONSULTANT' },
  ];

  const userIds = {};
  const { data: userList } = await supabase.auth.admin.listUsers();
  const existingUsers = userList?.users || [];

  for (const p of personas) {
    const found = existingUsers.find(u => u.email === p.email);
    if (found) {
      userIds[p.role] = found.id;
    } else {
      const { data: created, error } = await supabase.auth.admin.createUser({
        email: p.email,
        password: 'Password@123',
        email_confirm: true,
        user_metadata: { full_name: p.name },
      });
      if (error) {
        console.warn(`User creation note for ${p.email}:`, error.message);
      } else {
        userIds[p.role] = created.user.id;
      }
    }

    if (userIds[p.role]) {
      await supabase.from('profiles').upsert({
        id: userIds[p.role],
        full_name: p.name,
        email: p.email,
        phone: '+91 98480 22334',
        updated_at: new Date().toISOString(),
      });
    }
  }

  const ownerId = userIds['OWNER'] || existingUsers[0]?.id;
  const managerId = userIds['MANAGER'] || ownerId;
  const workerId = userIds['WORKER'] || ownerId;
  const consultantId = userIds['CONSULTANT'] || ownerId;

  console.log(`✓ Configured Personas (Owner: ${ownerId}, Worker: ${workerId})`);

  // 2. Organization: Green Valley Agriculture Ltd
  const { data: org, error: orgErr } = await supabase.from('organizations').upsert({
    name: 'Green Valley Agriculture Ltd',
    slug: 'green-valley-agri',
    owner_id: ownerId,
    plan: 'PROFESSIONAL',
    updated_at: new Date().toISOString()
  }, { onConflict: 'slug' }).select().single();

  if (orgErr) throw orgErr;
  console.log(`✓ Organization: ${org.name} (${org.id}) [Plan: ${org.plan}]`);

  // 3. Organization Memberships (RBAC)
  const memberships = [
    { organization_id: org.id, user_id: ownerId, role: 'OWNER', status: 'ACTIVE' },
    { organization_id: org.id, user_id: managerId, role: 'MANAGER', status: 'ACTIVE' },
    { organization_id: org.id, user_id: workerId, role: 'WORKER', status: 'ACTIVE' },
    { organization_id: org.id, user_id: consultantId, role: 'CONSULTANT', status: 'ACTIVE' },
  ];

  for (const m of memberships) {
    await supabase.from('organization_members').upsert(m, { onConflict: 'organization_id,user_id' });
  }
  console.log('✓ RBAC Memberships seeded for Owner, Manager, Worker, Consultant');

  // 4. Clean prior demo farms for idempotence
  await supabase.from('farms').delete().eq('organization_id', org.id);

  // 5. Create Portfolio of 3 Farms
  const farmsToCreate = [
    {
      organization_id: org.id,
      owner_id: ownerId,
      name: 'Green Valley Farm',
      location: 'Machilipatnam Delta Belt',
      district: 'Krishna',
      state: 'Andhra Pradesh',
      total_area: 25.0,
      area_unit: 'acres',
      description: 'Primary commercial paddy and pulse production estate with canal-lift and solar drip infrastructure.',
    },
    {
      organization_id: org.id,
      owner_id: ownerId,
      name: 'Krishna Delta Farm',
      location: 'Tenali Lowland Sector',
      district: 'Guntur',
      state: 'Andhra Pradesh',
      total_area: 18.5,
      area_unit: 'acres',
      description: 'High-clay soil agro-plot dedicated to precision flood and AWD organic rice cultivation.',
    },
    {
      organization_id: org.id,
      owner_id: ownerId,
      name: 'Godavari Organic Estate',
      location: 'Rajahmundry Alluvial Basin',
      district: 'East Godavari',
      state: 'Andhra Pradesh',
      total_area: 30.0,
      area_unit: 'acres',
      description: 'Certified organic agroforestry and pulse rotation block with integrated micro-sprinklers.',
    }
  ];

  const { data: farms, error: farmsErr } = await supabase.from('farms').insert(farmsToCreate).select();
  if (farmsErr) throw farmsErr;
  console.log(`✓ Created ${farms.length} portfolio farms`);

  const primaryFarm = farms.find(f => f.name === 'Green Valley Farm') || farms[0];

  // 6. Create Demarcated Parcels for Green Valley Farm (Total 25.0 Ac)
  const fieldsData = [
    {
      farm_id: primaryFarm.id,
      name: 'North Block (Plot A)',
      area: 10.0,
      area_unit: 'acres',
      soil_type: 'Clay Loam (pH 6.8)',
      irrigation_type: 'Canal Lift + Drip',
      description: 'High-tillering sector with automated AWD water monitoring and sub-surface drainage.',
    },
    {
      farm_id: primaryFarm.id,
      name: 'Central Sector (Plot B)',
      area: 8.5,
      area_unit: 'acres',
      soil_type: 'Alluvial Loam (pH 7.1)',
      irrigation_type: 'Solar Borewell Flood',
      description: 'Centrally drained parcel with dedicated solar borewell pump and weather telemetry node.',
    },
    {
      farm_id: primaryFarm.id,
      name: 'South Sector (Plot C)',
      area: 6.5,
      area_unit: 'acres',
      soil_type: 'Black Cotton Soil (pH 7.4)',
      irrigation_type: 'Rainfed + Canal Line',
      description: 'Soil preparation and green manuring parcel slated for Rabi rotation pulses.',
    }
  ];

  const { data: fields, error: fieldsErr } = await supabase.from('fields').insert(fieldsData).select();
  if (fieldsErr) throw fieldsErr;
  console.log(`✓ Created ${fields.length} demarcated field parcels (25.0 Total Acres)`);

  const northPlot = fields.find(f => f.name.includes('North')) || fields[0];
  const centralPlot = fields.find(f => f.name.includes('Central')) || fields[1];
  const southPlot = fields.find(f => f.name.includes('South')) || fields[2];

  // 7. Create Crop Cycles
  const { data: cropCycles, error: cropErr } = await supabase.from('crop_cycles').insert([
    {
      farm_id: primaryFarm.id,
      field_id: northPlot.id,
      crop_name: 'Paddy (Rice)',
      variety: 'BPT-5204 (Samba Mahsuri)',
      season: 'Kharif',
      start_date: '2026-06-15',
      expected_harvest_date: '2026-11-20',
      status: 'ACTIVE',
      target_yield: 4.2,
      yield_unit: 'tonnes',
      selling_price_per_unit: 29000,
      planned_budget: 50000,
      notes: 'Premium superfine slender grain paddy. Target MSP: ₹29,000/Tonne with 4.2 Tonnes target yield.',
    },
    {
      farm_id: primaryFarm.id,
      field_id: centralPlot.id,
      crop_name: 'Paddy (Rice)',
      variety: 'MTU-1010 (Cottondora Sannalu)',
      season: 'Kharif',
      start_date: '2026-07-01',
      expected_harvest_date: '2026-11-10',
      status: 'ACTIVE',
      target_yield: 3.8,
      yield_unit: 'tonnes',
      selling_price_per_unit: 28000,
      planned_budget: 42000,
      notes: 'Short duration blast-resistant variety for Central sector nursery.',
    },
    {
      farm_id: primaryFarm.id,
      field_id: southPlot.id,
      crop_name: 'Dhaincha (Green Manure)',
      variety: 'Sesbania bispinosa',
      season: 'Kharif',
      start_date: '2026-08-01',
      expected_harvest_date: '2026-09-30',
      status: 'PLANNED',
      target_yield: 12.0,
      yield_unit: 'tonnes',
      selling_price_per_unit: 0,
      planned_budget: 8000,
      notes: 'Bio-fertilizer cover crop for in-situ nitrogen fixation.',
    }
  ]).select();

  if (cropErr) throw cropErr;
  console.log(`✓ Created ${cropCycles.length} active and planned crop cycles`);
  const activeCrop = cropCycles[0];

  // 8. Create Activities (Operations Queue with Lifecycle & Assignment)
  const today = new Date().toISOString().split('T')[0];
  const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 1 * 86400000).toISOString().split('T')[0];
  const inThreeDays = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
  const inFiveDays = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];

  const activitiesData = [
    {
      farm_id: primaryFarm.id,
      field_id: northPlot.id,
      crop_cycle_id: activeCrop.id,
      assigned_to: workerId,
      title: 'Zinc Sulfate Foliar Spray (0.5%)',
      description: 'North Block (Plot A)',
      activity_type: 'FERTILIZATION',
      planned_date: twoDaysAgo,
      status: 'OVERDUE',
      priority: 'HIGH',
      estimated_cost: 1400,
      notes: 'Soil test shows zinc level at 0.4 ppm (critical threshold <0.6 ppm). Foliar application urgently needed to avert interveinal chlorosis and tillering stunt.',
    },
    {
      farm_id: primaryFarm.id,
      field_id: northPlot.id,
      crop_cycle_id: activeCrop.id,
      assigned_to: workerId,
      title: 'Nitrogen Top-Dressing (Urea 45kg/ha)',
      description: 'North Block (Plot A)',
      activity_type: 'FERTILIZATION',
      planned_date: tomorrow,
      status: 'PENDING',
      priority: 'MEDIUM',
      estimated_cost: 2800,
      notes: 'Split application at active tillering peak after drainage.',
    },
    {
      farm_id: primaryFarm.id,
      field_id: centralPlot.id,
      crop_cycle_id: cropCycles[1].id,
      assigned_to: workerId,
      title: 'Stem Borer Pheromone Trap Inspection',
      description: 'Central Sector (Plot B)',
      activity_type: 'PEST_INSPECTION',
      planned_date: inThreeDays,
      status: 'PENDING',
      priority: 'LOW',
      estimated_cost: 450,
      notes: 'Check 4 lure traps across central perimeter; record moth counts.',
    },
    {
      farm_id: primaryFarm.id,
      field_id: northPlot.id,
      crop_cycle_id: activeCrop.id,
      assigned_to: workerId,
      title: 'AWD Field Submersion & Moisture Check',
      description: 'North Block (Plot A)',
      activity_type: 'IRRIGATION',
      planned_date: inFiveDays,
      status: 'PENDING',
      priority: 'MEDIUM',
      estimated_cost: 350,
      notes: 'Monitor field water tube (perforated PVC); irrigate when water level drops 15cm below soil surface.',
    },
    // Completed Activities (preserving operational history!)
    {
      farm_id: primaryFarm.id,
      field_id: northPlot.id,
      crop_cycle_id: activeCrop.id,
      assigned_to: workerId,
      title: 'Basal Soil Puddling & Land Preparation',
      description: 'North Block (Plot A)',
      activity_type: 'LAND_PREPARATION',
      planned_date: '2026-06-15',
      completed_date: '2026-06-15',
      status: 'COMPLETED',
      priority: 'HIGH',
      estimated_cost: 6500,
      actual_cost: 6200,
      notes: 'Two tractor passes followed by leveling board for uniform submergence.',
    },
    {
      farm_id: primaryFarm.id,
      field_id: northPlot.id,
      crop_cycle_id: activeCrop.id,
      assigned_to: workerId,
      title: 'Seedling Transplanting (25-Day Old Nursery)',
      description: 'North Block (Plot A)',
      activity_type: 'SOWING',
      planned_date: '2026-07-04',
      completed_date: '2026-07-04',
      status: 'COMPLETED',
      priority: 'HIGH',
      estimated_cost: 5600,
      actual_cost: 5600,
      notes: 'Transplanted 2-3 seedlings per hill at 20x15 cm spacing.',
    }
  ];

  const { data: activities, error: actErr } = await supabase.from('activities').insert(activitiesData).select();
  if (actErr) throw actErr;
  console.log(`✓ Created ${activities.length} activities (including 1 Overdue and 2 Completed history records)`);

  // 9. Create Agricultural Inputs
  const inputsData = [
    {
      farm_id: primaryFarm.id,
      crop_cycle_id: activeCrop.id,
      name: 'Certified Paddy Seed (BPT-5204)',
      input_type: 'SEED',
      quantity: 75,
      unit: 'kg',
      cost: 3600,
      used_date: '2026-06-10',
      supplier: 'AP State Seeds Development Corp',
      notes: 'Foundation grade with 98% germination guarantee.',
    },
    {
      farm_id: primaryFarm.id,
      crop_cycle_id: activeCrop.id,
      name: 'Di-Ammonium Phosphate (DAP 18-46-0)',
      input_type: 'FERTILIZER',
      quantity: 300,
      unit: 'kg',
      cost: 8100,
      used_date: '2026-06-22',
      supplier: 'Kisan Krishi Kendra, Guntur',
      notes: 'Applied as basal fertilizer during final puddle leveling.',
    },
    {
      farm_id: primaryFarm.id,
      crop_cycle_id: activeCrop.id,
      name: 'Urea (46% Nitrogen)',
      input_type: 'FERTILIZER',
      quantity: 250,
      unit: 'kg',
      cost: 1625,
      used_date: '2026-07-18',
      supplier: 'IFFCO Farmers Service Center',
      notes: 'First top dressing at early tillering.',
    },
    {
      farm_id: primaryFarm.id,
      crop_cycle_id: activeCrop.id,
      name: 'Zinc Sulfate Monohydrate (33% Zn)',
      input_type: 'FERTILIZER',
      quantity: 25,
      unit: 'kg',
      cost: 1400,
      used_date: today,
      supplier: 'Coromandel Agritech',
      notes: 'Acquired for foliar application.',
    }
  ];

  await supabase.from('inputs').insert(inputsData);
  console.log('✓ Created agricultural input inventory records');

  // 10. Create Expenses (Category Outlay for Financial Matrix)
  const expensesData = [
    {
      farm_id: primaryFarm.id,
      crop_cycle_id: activeCrop.id,
      category: 'SEEDS',
      description: 'Certified BPT-5204 Foundation Seed Stock (75 kg)',
      amount: 3600,
      expense_date: '2026-06-10',
      notes: 'APSSDC Certified Lot #9822',
    },
    {
      farm_id: primaryFarm.id,
      crop_cycle_id: activeCrop.id,
      category: 'FERTILIZER',
      description: 'Basal DAP & Urea Nutrients Batch 1',
      amount: 8100,
      expense_date: '2026-06-22',
      notes: 'DAP 6 bags + Potash',
    },
    {
      farm_id: primaryFarm.id,
      crop_cycle_id: activeCrop.id,
      category: 'LABOR',
      description: 'Transplanting Labor (14 Workers x 2 Days)',
      amount: 5600,
      expense_date: '2026-07-04',
      notes: 'Manual transplanting labor wage settlement',
    },
    {
      farm_id: primaryFarm.id,
      crop_cycle_id: activeCrop.id,
      category: 'IRRIGATION',
      description: 'Canal Lift Pump Diesel & Solar Inverter Maintenance',
      amount: 1200,
      expense_date: '2026-07-20',
      notes: 'Seasonal canal sluice operator fee',
    }
  ];

  await supabase.from('expenses').insert(expensesData);
  console.log('✓ Created expense ledgers');

  // 11. Create Deduplicated Alerts
  const alertsData = [
    {
      organization_id: org.id,
      owner_id: ownerId,
      farm_id: primaryFarm.id,
      crop_cycle_id: activeCrop.id,
      reference_id: 'act-zinc-spray',
      alert_type: 'OVERDUE_TASK',
      severity: 'CRITICAL',
      title: 'Zinc Deficiency Remediation Overdue',
      message: 'Zinc Sulfate foliar spray in North Block is 2 days overdue. Tillering chlorosis risk elevated.',
      recommendation: 'Spray 0.5% Zinc Sulfate + 0.25% lime solution immediately to secure tillering yield potential.',
      source_data: 'Soil zinc level: 0.4 ppm (threshold 0.6 ppm)',
      is_read: false,
      is_resolved: false,
    },
    {
      organization_id: org.id,
      owner_id: ownerId,
      farm_id: primaryFarm.id,
      crop_cycle_id: activeCrop.id,
      reference_id: 'fin-budget-variance',
      alert_type: 'COST_WARNING',
      severity: 'WARNING',
      title: 'Fertilizer Budget Variance (+14.3%)',
      message: 'Micronutrient application added ₹1,400 unplanned outlay to Kharif fertilization budget.',
      recommendation: 'Reallocate ₹1,400 from weed management contingency to maintain target net margin of 60%.',
      source_data: 'Actual fertilizer spend: ₹9,500 vs Planned: ₹8,100',
      is_read: false,
      is_resolved: false,
    },
    {
      organization_id: org.id,
      owner_id: ownerId,
      farm_id: primaryFarm.id,
      crop_cycle_id: activeCrop.id,
      reference_id: 'pos-tillering-vigor',
      alert_type: 'POSITIVE',
      severity: 'SUCCESS',
      title: 'Transplanting Survival at 96%',
      message: 'North Block vegetative tillering density has reached 24 tillers/hill on scheduled trajectory.',
      recommendation: 'Initiate scheduled Alternate Wetting and Drying (AWD) cycle to promote deep root aeration.',
      source_data: 'Field scouting report #12',
      is_read: true,
      is_resolved: true,
    }
  ];

  await supabase.from('alerts').insert(alertsData);
  console.log('✓ Created deduplicated alert center records');

  console.log('🎉 FarmPilot Phase 2 Multi-Tenant Data Seed Completed Successfully!');
}

seed().catch(err => {
  console.error('Seed execution error:', err);
  process.exit(1);
});
