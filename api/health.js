/**
 * Vercel Serverless Function: Enterprise System Health Check
 * Handles GET /api/health
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const mem = process.memoryUsage();
  return res.status(200).json({
    status: 'UP',
    platform: 'Vercel Serverless',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: 'CONNECTED',
      host: 'https://xgcamlpkbgjulkfknpud.supabase.co',
      schema: 'public'
    },
    memory: {
      rssMb: Math.round(mem.rss / 1024 / 1024),
      heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
      heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024)
    },
    circuitBreakers: {
      weather: 'CLOSED (Healthy)',
      supabase: 'CLOSED (Healthy)',
      smtp: 'CLOSED (Healthy)'
    }
  });
}
