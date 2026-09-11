/**
 * Vercel Serverless Function: Staff & Workforce Directory API
 * Handles GET /api/workers and POST /api/workers
 */

const DEFAULT_WORKERS = [
  {
    id: '33dd8f01-e3c5-42a8-9194-a92504a75246',
    username: 'siddharth',
    full_name: 'Siddharth Saladi',
    role: 'OWNER',
    role_label: 'Farm Owner & Executive',
    email: 'farmer@greenvalley.in',
    pin: '1234',
    password_plain: 'Farmer@2026!',
    assigned_field: 'Estate Portfolio (25.0 Acres)',
    farm_name: 'Green Valley Farm',
    status: 'ACTIVE'
  },
  {
    id: '4b893f02-a1b2-4c3d-8e4f-5a6b7c8d9e0f',
    username: 'rajesh',
    full_name: 'Rajesh Patel',
    role: 'MANAGER',
    role_label: 'Estate Operations Manager',
    email: 'manager@greenvalley.in',
    pin: '1234',
    password_plain: 'Manager@2026!',
    assigned_field: 'North & East Blocks (18.5 Acres)',
    farm_name: 'Green Valley Farm',
    status: 'ACTIVE'
  },
  {
    id: '12f2a103-05d5-498f-b187-406bf7f634cd',
    username: 'ramu',
    full_name: 'Ravi Kumar',
    role: 'WORKER',
    role_label: 'Field Operations Operator',
    email: 'worker@greenvalley.in',
    pin: '1234',
    password_plain: 'Worker@2026!',
    assigned_field: 'North Block Plot A (Paddy BPT-5204)',
    farm_name: 'Green Valley Farm',
    status: 'ACTIVE'
  },
  {
    id: '7e61b504-f3e4-4d5c-b6a7-8c9d0e1f2a3b',
    username: 'anita',
    full_name: 'Dr. Anita Rao',
    role: 'CONSULTANT',
    role_label: 'Principal Agronomist & Advisor',
    email: 'consultant@greenvalley.in',
    pin: '1234',
    password_plain: 'Consultant@2026!',
    assigned_field: 'Regional Agronomy & Diagnostics',
    farm_name: 'Delta Agronomy Advisory',
    status: 'ACTIVE'
  },
  {
    id: '8f72c605-04f5-4e6d-c7b8-9d0e1f2a3b4c',
    username: 'venkat',
    full_name: 'Venkat Reddy',
    role: 'OWNER',
    role_label: 'Commercial Paddy Producer',
    email: 'venkat@krishnadelta.in',
    pin: '1234',
    password_plain: 'Venkat@2026!',
    assigned_field: 'Tenali Wet Belt (40.0 Acres)',
    farm_name: 'Krishna Delta Farm',
    status: 'ACTIVE'
  },
  {
    id: '9a83d706-15a6-4f7e-d8c9-0e1f2a3b4c5d',
    username: 'laxmi',
    full_name: 'Laxmi Devi',
    role: 'OWNER',
    role_label: 'Organic Horticulture Farmer',
    email: 'laxmi@godavariagri.in',
    pin: '1234',
    password_plain: 'Laxmi@2026!',
    assigned_field: 'Godavari Alluvial Parcel (15.0 Acres)',
    farm_name: 'Godavari Bio-Agri',
    status: 'ACTIVE'
  },
  {
    id: 'ab94e807-26b7-4a8f-e9da-1f2a3b4c5d6e',
    username: 'kiran',
    full_name: 'Kiran Kumar',
    role: 'OWNER',
    role_label: 'Dryland Millet Cultivator',
    email: 'kiran@rayalaseema.in',
    pin: '1234',
    password_plain: 'Kiran@2026!',
    assigned_field: 'Red Soil Parcel (12.0 Acres)',
    farm_name: 'Rayalaseema Agri-Tech',
    status: 'ACTIVE'
  },
  {
    id: 'bc05f908-37c8-4b9a-faeb-2a3b4c5d6e7f',
    username: 'subba',
    full_name: 'Subba Rao',
    role: 'MANAGER',
    role_label: 'Irrigation & Plantation Manager',
    email: 'subba@andhrafarms.in',
    pin: '1234',
    password_plain: 'Subba@2026!',
    assigned_field: 'Canal Irrigation Zone (18.0 Acres)',
    farm_name: 'Andhra Integrated Farms',
    status: 'ACTIVE'
  }
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ success: true, workers: DEFAULT_WORKERS });
  }

  if (req.method === 'POST') {
    const payload = req.body || {};
    const fullName = (payload.full_name || payload.name || '').trim();
    const rawUsername = (payload.username || payload.id || '').trim();
    const cleanUsername = rawUsername.replace(/^@/, '').toLowerCase().trim();
    const role = (payload.role || 'WORKER').toUpperCase();
    const password = payload.password || payload.password_plain || 'Worker@2026!';
    const pin = payload.pin || '1234';
    const assignedField = payload.assigned_field || payload.assigned_parcel || 'North Block (Plot A)';
    const farmName = payload.farm_name || 'Green Valley Farm';

    if (!cleanUsername || !fullName) {
      return res.status(400).json({ success: false, error: 'Full name and username are required' });
    }

    const workerRecord = {
      id: payload.id || `usr-${role.toLowerCase()}-${Date.now()}`,
      username: cleanUsername,
      full_name: fullName,
      role: role,
      role_label: `${role} Specialist`,
      email: payload.email || `${cleanUsername}@greenvalley.in`,
      pin: pin,
      password_plain: password,
      assigned_field: assignedField,
      farm_name: farmName,
      status: 'ACTIVE'
    };

    return res.status(201).json({ success: true, worker: workerRecord });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
