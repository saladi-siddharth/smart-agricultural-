/**
 * Vercel Serverless Function for FarmPilot Automated Agronomic SMTP Email Dispatch
 * Handles POST /api/send-email on Vercel deployments
 */
import tls from 'tls';
import net from 'net';

function buildAgronomicAlertEmailHtml({
  title = 'Field Operation Alert',
  priority = 'HIGH',
  category = 'AGRONOMY',
  farmName = 'Green Valley Main Farm (Krishna Basin)',
  parcel = 'North Block (Plot A)',
  cropCycle = 'Paddy (BPT 5204) - Kharif 2024',
  dueDate = 'Today',
  assignedWorker = 'Ramesh Kumar',
  estimatedCost = 0,
  notes = '',
  healthScore = 82,
  actionUrl = 'https://farmpilot.ag/activities.html'
}) {
  const priorityColor = priority === 'CRITICAL' ? '#DC2626' : priority === 'HIGH' ? '#D97706' : '#059669';
  const priorityBg = priority === 'CRITICAL' ? '#FEF2F2' : priority === 'HIGH' ? '#FFFBEB' : '#ECFDF5';
  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });

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
        <table role="presentation" width="100%" max-width="640" style="max-width: 640px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); border: 1px solid #E2E8F0;" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="background: linear-gradient(135deg, #0D2820 0%, #164E3D 100%); padding: 36px 40px; text-align: left;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #FFFFFF;">FarmPilot <span style="font-size: 11px; font-weight: 700; color: #34D399; text-transform: uppercase; background: rgba(52,211,153,0.15); padding: 2px 6px; border-radius: 4px; margin-left: 4px;">Agronomic OS</span></h1>
              <p style="margin: 4px 0 0; font-size: 12px; color: #A7F3D0;">${farmName}</p>
              <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.15);">
                <span style="display: inline-block; background-color: ${priorityBg}; color: ${priorityColor}; font-size: 11px; font-weight: 800; text-transform: uppercase; padding: 4px 10px; border-radius: 6px;">
                  ● Priority: ${priority}
                </span>
                <h2 style="margin: 10px 0 0; font-size: 20px; font-weight: 800; color: #FFFFFF;">${title}</h2>
                <p style="margin: 6px 0 0; font-size: 13px; color: #D1FAE5;">Scheduled for <strong>${parcel}</strong> • Due: <strong>${dueDate}</strong></p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 28px 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border: 1px solid #E2E8F0; border-radius: 10px; overflow: hidden; margin-bottom: 20px;">
                <tr style="background-color: #F8FAFC;">
                  <td style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: #64748B;">Category</td>
                  <td style="padding: 10px 14px; font-size: 13px; font-weight: 600; color: #0F172A;">${category}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: #64748B;">Crop Cycle</td>
                  <td style="padding: 10px 14px; font-size: 13px; font-weight: 600; color: #0F172A;">${cropCycle}</td>
                </tr>
                <tr style="background-color: #F8FAFC;">
                  <td style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: #64748B;">Assigned Worker</td>
                  <td style="padding: 10px 14px; font-size: 13px; font-weight: 600; color: #0F172A;">${assignedWorker}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: #64748B;">Estimated Cost</td>
                  <td style="padding: 10px 14px; font-size: 13px; font-weight: 700; color: #059669;">₹${Number(estimatedCost || 0).toLocaleString('en-IN')}</td>
                </tr>
              </table>
              <div style="text-align: center; margin-top: 24px;">
                <a href="${actionUrl}" style="display: inline-block; background-color: #059669; color: #FFFFFF; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 8px;">
                  Open in FarmPilot Command Center →
                </a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendSmtpEmail({ to, subject, html }) {
  const host = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || `"FarmPilot Operations" <alerts@farmpilot.ag>`;

  if (!user || !pass || user.includes('your-email')) {
    return { success: true, mode: 'preview', recipient: to };
  }

  return new Promise((resolve, reject) => {
    const isExplicitTls = port === 465;
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
        buffer = lines.pop();

        for (const line of lines) {
          if (!line) continue;
          const code = parseInt(line.substring(0, 3), 10);

          if (step === 0 && code === 220) {
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
            const tlsSocket = tls.connect({ socket: sock, host, rejectUnauthorized: false }, () => {
              handleDialog(tlsSocket);
            });
            return;
          } else if (step === 3 && code === 334) {
            step = 4;
            sendCmd(Buffer.from(user).toString('base64'));
          } else if (step === 4 && code === 334) {
            step = 5;
            sendCmd(Buffer.from(pass).toString('base64'));
          } else if (step === 5 && code === 235) {
            step = 6;
            const fromAddr = from.match(/<([^>]+)>/)?.[1] || user;
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
            const rawMessage = [
              `From: ${from}`,
              `To: ${to}`,
              `Subject: ${subject}`,
              `MIME-Version: 1.0`,
              `Content-Type: multipart/alternative; boundary="${boundary}"`,
              ``,
              `--${boundary}`,
              `Content-Type: text/html; charset=UTF-8`,
              `Content-Transfer-Encoding: 7bit`,
              ``,
              html,
              ``,
              `--${boundary}--`,
              `.`
            ].join('\r\n');
            sendCmd(rawMessage);
          } else if (step === 9 && code === 250) {
            step = 10;
            sendCmd('QUIT');
            resolve({ success: true, mode: 'smtp', recipient: to });
          }
        }
      });

      sock.on('error', (err) => reject(err));
    }

    if (isExplicitTls) {
      socket = tls.connect({ host, port, rejectUnauthorized: false }, () => handleDialog(socket));
    } else {
      socket = net.connect({ host, port }, () => handleDialog(socket));
    }
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const to = body.to || 'manager@greenvalley.ag';
    const subject = body.subject || `[FarmPilot Alert] ${body.priority || 'OPERATIONAL'}: ${body.activityName || 'Field Activity'}`;
    const html = buildAgronomicAlertEmailHtml({
      title: body.activityName,
      priority: body.priority,
      category: body.category,
      farmName: body.farmName,
      parcel: body.parcel,
      cropCycle: body.cropCycle,
      dueDate: body.plannedDate,
      assignedWorker: body.assignedTo,
      estimatedCost: body.estimatedCost,
      notes: body.description
    });

    const result = await sendSmtpEmail({ to, subject, html });
    return res.status(200).json(result);
  } catch (error) {
    console.error('Vercel SMTP Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
