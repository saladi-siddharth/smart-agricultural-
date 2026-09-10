/**
 * Vercel Serverless Function: Real-time Microclimate Weather Proxy
 * Powered by WeatherAPI.com
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const lat = req.query.lat || '16.1809';
  const lon = req.query.lon || '81.1378';
  const apiKey = process.env.WEATHER_API_KEY || '60fa809504254064809123619261009';

  try {
    const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${lat},${lon}&aqi=no`;
    const response = await fetch(url);
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Weather API Proxy Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
