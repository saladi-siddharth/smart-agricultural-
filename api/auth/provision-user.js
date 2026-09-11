/**
 * Vercel Serverless Function: Owner Role Provisioning API
 * Handles POST /api/auth/provision-user
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const payload = req.body || {};
  const fullName = (payload.full_name || payload.name || '').trim();
  const rawUsername = (payload.username || payload.id || '').trim();
  const cleanUsername = rawUsername.replace(/^@/, '').toLowerCase().trim();
  const role = (payload.role || 'WORKER').toUpperCase();
  const password = payload.password || payload.password_plain || 'Worker@2026!';
  const pin = payload.pin || '1234';
  const assignedField = payload.assigned_field || payload.assigned_parcel || 'North Block (Plot A)';
  const farmName = payload.farm_name || 'Green Valley Farm';
  const email = payload.email || `${cleanUsername}@greenvalley.in`;

  if (!cleanUsername || !fullName) {
    return res.status(400).json({ success: false, error: 'Full name and username are required' });
  }

  const newStaff = {
    id: payload.id || `usr-${role.toLowerCase()}-${Date.now()}`,
    username: cleanUsername,
    full_name: fullName,
    role: role,
    role_label: `${role} Specialist`,
    email: email.toLowerCase(),
    pin: pin,
    password_plain: password,
    assigned_field: assignedField,
    farm_name: farmName,
    status: 'ACTIVE'
  };

  return res.status(201).json({
    success: true,
    message: `Staff member @${cleanUsername} successfully provisioned with role ${role}.`,
    user: newStaff
  });
}
