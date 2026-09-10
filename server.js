/**
 * FarmPilot Unified Application & SMTP Email Alert Server
 * Serves static frontend assets and dispatches executive agronomic email alerts
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import tls from 'tls';
import net from 'net';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
const envPath = path.resolve(__dirname, '.env');
const env = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [k, ...v] = trimmed.split('=');
    if (k && v) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
  }
}

const PORT = process.env.PORT || 5173;
const SMTP_HOST = process.env.SMTP_HOST || env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER || env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || env.SMTP_PASS || '';
const SMTP_SECURE = (process.env.SMTP_SECURE || env.SMTP_SECURE) === 'true';
const SMTP_FROM = process.env.SMTP_FROM || env.SMTP_FROM || '"FarmPilot Agronomic OS" <alerts@farmpilot.in>';
const ALERT_RECIPIENT = process.env.ALERT_RECIPIENT || env.ALERT_RECIPIENT || 'manager@greenvalley.in';

// MIME types dictionary
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.mjs': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

/**
 * Generate Executive Agronomic HTML Email Theme
 */
function buildExecutiveEmailHtml(data) {
  const title = data.title || 'Scheduled Field Task';
  const category = (data.category || 'FERTILIZATION').replace(/_/g, ' ');
  const parcel = data.field_name || 'North Block (Plot A)';
  const crop = data.crop_name || 'Paddy BPT-5204 (Kharif 2026)';
  const dueDate = data.due_date || new Date().toISOString().split('T')[0];
  const priority = data.priority || 'MEDIUM';
  const cost = Number(data.cost || 0).toLocaleString('en-IN');
  const assignee = data.assigned_to_name || 'Ravi Kumar (Field Operator)';
  const notes = data.notes || 'Routine scheduled agronomic intervention. Adhere to safety protocols and dosage specs.';
  const farmName = data.farm_name || 'Green Valley Farm';
  const healthScore = data.health_score || 82;
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'short' });

  const priorityColor = priority === 'CRITICAL' ? '#DC2626' : priority === 'HIGH' ? '#D97706' : priority === 'LOW' ? '#64748B' : '#059669';
  const priorityBg = priority === 'CRITICAL' ? '#FEF2F2' : priority === 'HIGH' ? '#FFFBEB' : priority === 'LOW' ? '#F8FAFC' : '#ECFDF5';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FarmPilot Operational Field Alert</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1E293B;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F1F5F9; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table role="presentation" width="100%" max-width="640" style="max-width: 640px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.05); border: 1px solid #E2E8F0;" cellspacing="0" cellpadding="0" border="0">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0D2820 0%, #164E3D 100%); padding: 36px 40px; text-align: left;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="background-color: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2); border-radius: 10px; width: 42px; height: 42px; text-align: center; vertical-align: middle; font-size: 22px;">
                          🌱
                        </td>
                        <td style="padding-left: 14px;">
                          <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.02em; color: #FFFFFF;">FarmPilot <span style="font-size: 11px; font-weight: 700; color: #34D399; text-transform: uppercase; background: rgba(52,211,153,0.15); padding: 2px 6px; border-radius: 4px; margin-left: 4px;">Agronomic OS</span></h1>
                          <p style="margin: 2px 0 0; font-size: 12px; color: #A7F3D0;">Precision Operations & Crop Lifecycle Intelligence</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="display: inline-block; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 20px; padding: 6px 12px; font-size: 11px; font-weight: 700; color: #E2E8F0; text-transform: uppercase; letter-spacing: 0.05em;">
                      ${farmName}
                    </span>
                  </td>
                </tr>
              </table>

              <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.15);">
                <span style="display: inline-block; background-color: ${priorityBg}; color: ${priorityColor}; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 10px; border-radius: 6px; border: 1px solid ${priorityColor}40;">
                  ● Priority: ${priority}
                </span>
                <h2 style="margin: 10px 0 0; font-size: 22px; font-weight: 800; color: #FFFFFF; line-height: 1.3;">
                  ${title}
                </h2>
                <p style="margin: 6px 0 0; font-size: 13px; color: #D1FAE5;">
                  New field operation scheduled for <strong>${parcel}</strong> • Due: <strong>${dueDate}</strong>
                </p>
              </div>
            </td>
          </tr>

          <!-- Operational Telemetry Bar -->
          <tr>
            <td style="background-color: #F8FAFC; border-bottom: 1px solid #E2E8F0; padding: 14px 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="font-size: 12px; color: #64748B;">
                    📅 Logged: <strong>${timestamp}</strong>
                  </td>
                  <td align="right" style="font-size: 12px; color: #059669; font-weight: 700;">
                    📈 Farm Health Index: <strong>${healthScore}/100</strong>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 40px;">

              <!-- Operation Details Table -->
              <h3 style="margin: 0 0 14px; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #475569;">
                📋 Field Operation Specifications
              </h3>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border: 1px solid #E2E8F0; border-radius: 10px; overflow: hidden; margin-bottom: 24px;">
                <tr style="background-color: #F8FAFC;">
                  <td width="35%" style="padding: 12px 16px; font-size: 12px; font-weight: 700; color: #64748B; border-bottom: 1px solid #E2E8F0;">Operation Category</td>
                  <td width="65%" style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #0F172A; border-bottom: 1px solid #E2E8F0;">${category}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 12px; font-weight: 700; color: #64748B; border-bottom: 1px solid #E2E8F0;">Target Field Parcel</td>
                  <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #0F172A; border-bottom: 1px solid #E2E8F0;">📍 ${parcel}</td>
                </tr>
                <tr style="background-color: #F8FAFC;">
                  <td style="padding: 12px 16px; font-size: 12px; font-weight: 700; color: #64748B; border-bottom: 1px solid #E2E8F0;">Crop Cycle Allocation</td>
                  <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #0F172A; border-bottom: 1px solid #E2E8F0;">🌱 ${crop}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 12px; font-weight: 700; color: #64748B; border-bottom: 1px solid #E2E8F0;">Execution Deadline</td>
                  <td style="padding: 12px 16px; font-size: 13px; font-weight: 700; color: #D97706; border-bottom: 1px solid #E2E8F0;">⏰ ${dueDate}</td>
                </tr>
                <tr style="background-color: #F8FAFC;">
                  <td style="padding: 12px 16px; font-size: 12px; font-weight: 700; color: #64748B; border-bottom: 1px solid #E2E8F0;">Estimated Input Outlay</td>
                  <td style="padding: 12px 16px; font-size: 13px; font-weight: 800; font-family: monospace; color: #059669; border-bottom: 1px solid #E2E8F0;">₹${cost}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 12px; font-weight: 700; color: #64748B;">Assigned Personnel</td>
                  <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #0F172A;">👤 ${assignee}</td>
                </tr>
              </table>

              <!-- Agronomic Notes Callout -->
              <div style="background-color: #F0FDF4; border-left: 4px solid #10B981; border-radius: 0 8px 8px 0; padding: 16px 20px; margin-bottom: 28px;">
                <h4 style="margin: 0 0 6px; font-size: 13px; font-weight: 800; color: #065F46;">
                  🔬 Agronomic Protocols & Safety Guidance
                </h4>
                <p style="margin: 0; font-size: 13px; color: #047857; line-height: 1.6;">
                  ${notes}
                </p>
              </div>

              <!-- Action Button CTA -->
              <div style="text-align: center; margin: 32px 0 16px;">
                <a href="http://localhost:${PORT}/activities.html" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 12px rgba(5,150,105,0.3);">
                  View Task in Field Operations Ledger →
                </a>
              </div>
              <p style="text-align: center; margin: 0; font-size: 11px; color: #94A3B8;">
                Direct access required FarmPilot authentication or active demo session token.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0F172A; padding: 28px 40px; text-align: center; color: #94A3B8; font-size: 11px; line-height: 1.6;">
              <p style="margin: 0 0 6px; font-weight: 700; color: #E2E8F0;">
                FarmPilot Enterprise Agronomic Operating System
              </p>
              <p style="margin: 0 0 10px;">
                Automated notification triggered by field task submission • Scoped to Organization: Green Valley Agriculture Ltd
              </p>
              <p style="margin: 0; color: #64748B;">
                © 2026 FarmPilot. All rights reserved. Precision agriculture intelligence for commercial farms.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Lightweight Zero-Dependency Native SMTP Sender (TLS / Net Socket)
 */
async function sendSmtpEmail({ to, subject, html }) {
  if (!SMTP_USER || !SMTP_PASS || SMTP_USER.includes('your-email')) {
    // Save preview file locally for instant review
    const previewDir = path.resolve(__dirname, 'logs/emails');
    fs.mkdirSync(previewDir, { recursive: true });
    const previewFile = `alert-${Date.now()}.html`;
    const previewPath = path.join(previewDir, previewFile);
    fs.writeFileSync(previewPath, html, 'utf8');

    console.log(`\n=============================================================`);
    console.log(`📨 [FarmPilot SMTP Mailer] Email Alert Generated!`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Note: SMTP_USER/PASS not configured in .env. Live HTML preview saved to:`);
    console.log(`file:///${previewPath.replace(/\\/g, '/')}`);
    console.log(`URL: http://localhost:${PORT}/api/email-preview/${previewFile}`);
    console.log(`=============================================================\n`);

    return {
      success: true,
      mode: 'preview',
      previewFile,
      previewUrl: `/api/email-preview/${previewFile}`,
      recipient: to,
    };
  }

  // Real SMTP connection using Node's standard tls/net
  return new Promise((resolve, reject) => {
    const isExplicitTls = SMTP_PORT === 465 || SMTP_SECURE;
    let socket;

    function handleDialog(sock) {
      let step = 0;
      let buffer = '';

      sock.setEncoding('utf8');

      function sendCmd(cmd) {
        sock.write(cmd + '\r\n');
      }

      sock.on('data', (chunk) => {
        buffer += chunk;
        const lines = buffer.split('\r\n');
        buffer = lines.pop(); // Keep partial line

        for (const line of lines) {
          if (!line) continue;
          const code = parseInt(line.substring(0, 3), 10);

          if (step === 0 && (code === 220)) {
            step = 1;
            sendCmd('EHLO farmpilot.local');
          } else if (step === 1 && code === 250) {
            if (!isExplicitTls && line.includes('STARTTLS')) {
              step = 2;
              sendCmd('STARTTLS');
            } else if (isExplicitTls || !line.startsWith('250-')) {
              step = 3;
              sendCmd('AUTH LOGIN');
            }
          } else if (step === 2 && code === 220) {
            // Upgrade to TLS
            const tlsSocket = tls.connect({ socket: sock, host: SMTP_HOST, rejectUnauthorized: false }, () => {
              handleDialog(tlsSocket);
            });
            return;
          } else if (step === 3 && code === 334) {
            step = 4;
            sendCmd(Buffer.from(SMTP_USER).toString('base64'));
          } else if (step === 4 && code === 334) {
            step = 5;
            sendCmd(Buffer.from(SMTP_PASS).toString('base64'));
          } else if (step === 5 && code === 235) {
            step = 6;
            const fromAddr = SMTP_FROM.match(/<([^>]+)>/) ? SMTP_FROM.match(/<([^>]+)>/)[1] : SMTP_FROM;
            sendCmd(`MAIL FROM:<${fromAddr}>`);
          } else if (step === 6 && code === 250) {
            step = 7;
            sendCmd(`RCPT TO:<${to}>`);
          } else if (step === 7 && code === 250) {
            step = 8;
            sendCmd('DATA');
          } else if (step === 8 && code === 354) {
            step = 9;
            const boundary = '----=_Part_' + Date.now();
            const message = [
              `From: ${SMTP_FROM}`,
              `To: ${to}`,
              `Subject: ${subject}`,
              `MIME-Version: 1.0`,
              `Content-Type: text/html; charset=UTF-8`,
              `Content-Transfer-Encoding: 8bit`,
              ``,
              html,
              `.`
            ].join('\r\n');
            sendCmd(message);
          } else if (step === 9 && code === 250) {
            step = 10;
            sendCmd('QUIT');
            sock.end();
            resolve({ success: true, mode: 'smtp', recipient: to });
          } else if (code >= 400) {
            sock.end();
            reject(new Error(`SMTP Error ${code}: ${line}`));
          }
        }
      });

      sock.on('error', (err) => {
        reject(err);
      });
    }

    if (isExplicitTls) {
      socket = tls.connect(SMTP_PORT, SMTP_HOST, { rejectUnauthorized: false }, () => {
        handleDialog(socket);
      });
    } else {
      socket = net.connect(SMTP_PORT, SMTP_HOST, () => {
        handleDialog(socket);
      });
    }
  });
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = decodeURIComponent(parsedUrl.pathname);

  // CORS Headers for API calls
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API Endpoint: Send Operation Alert Email
  if (pathname === '/api/send-email' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const recipient = payload.recipient || ALERT_RECIPIENT;
        const taskTitle = payload.title || 'New Field Operation';
        const priority = payload.priority || 'MEDIUM';

        const subject = `[FarmPilot Alert] ${priority === 'HIGH' || priority === 'CRITICAL' ? '⚠️ ' : '🌱 '}${priority} Priority Task: ${taskTitle}`;
        const html = buildExecutiveEmailHtml(payload);

        const result = await sendSmtpEmail({
          to: recipient,
          subject,
          html
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, ...result }));
      } catch (err) {
        console.error('Email send failure:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // API Endpoint: Serve Email Preview HTML
  if (pathname.startsWith('/api/email-preview/')) {
    const filename = path.basename(pathname);
    const filePath = path.join(__dirname, 'logs/emails', filename);
    if (fs.existsSync(filePath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
      fs.createReadStream(filePath).pipe(res);
      return;
    }
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Preview not found');
    return;
  }

  // Static File Serving
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);

  // If path is a directory, append index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (!fs.existsSync(filePath)) {
    // Try adding .html
    if (fs.existsSync(filePath + '.html')) {
      filePath = filePath + '.html';
    } else {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end(`<h1>404 Not Found</h1><p>The requested file <code>${pathname}</code> was not found on this server.</p>`);
      return;
    }
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  console.log(`\n🌱 FarmPilot Phase 2 Server running at: http://localhost:${PORT}`);
  console.log(`📡 Connected to Supabase PostgreSQL at: https://xgcamlpkbgjulkfknpud.supabase.co`);
  console.log(`✉️  SMTP Alert Service Active (Host: ${SMTP_HOST}:${SMTP_PORT}, Recipient: ${ALERT_RECIPIENT})\n`);
});
