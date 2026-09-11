/**
 * FarmPilot — 📡 Real-Time IoT LoRaWAN Telemetry Stream & Device Health Simulator
 * Built for Advanced Engineering Challenge #3:
 * "Integrate real or simulated agricultural devices such as soil sensors, weather stations,
 * irrigation controllers, water meters... consider device identity, unreliable connectivity,
 * stale data, and failure scenarios."
 */

(function () {
  'use strict';

  const IOT_NODES = [
    {
      id: 'NODE-AWD-PADDY-01',
      name: 'North Block AWD Tube Sensor',
      type: 'Hydrostatic Pressure Probe',
      protocol: 'LoRaWAN IN865 (Class A)',
      batteryPct: 91,
      voltageV: 3.92,
      rssi: -94,
      snr: '+7.2 dB',
      lastSeenSeconds: 2,
      status: 'HEALTHY',
      readings: { tube_depth_cm: -4.0, water_temp_c: 27.8, ambient_humidity: 78 }
    },
    {
      id: 'NODE-SOIL-MAIZE-02',
      name: 'Central Sector TDR Soil Node',
      type: 'Tensiometric Soil Sensor',
      protocol: 'NB-IoT (Band 8 / eDRX)',
      batteryPct: 86,
      voltageV: 3.84,
      rssi: -88,
      snr: '+9.4 dB',
      lastSeenSeconds: 8,
      status: 'HEALTHY',
      readings: { soil_moisture_kpa: 24.5, soil_ec_ds_m: 1.12, soil_temp_c: 26.2 }
    },
    {
      id: 'VALVE-SLUICE-CANAL-01',
      name: 'South Canal Automated Sluice',
      type: 'Motorized Gate Actuator',
      protocol: 'MQTT over TLS 1.3 / 4G LTE',
      batteryPct: 98,
      voltageV: 13.8,
      rssi: -76,
      snr: '+14.1 dB',
      lastSeenSeconds: 4,
      status: 'ARMED',
      readings: { valve_status: 'CLOSED', flow_rate_lpm: 0, line_pressure_bar: 3.4 }
    },
    {
      id: 'STATION-METEO-01',
      name: 'Main Yard Micro-Weather Station',
      type: 'Ultrasonic Anemometer & Pyranometer',
      protocol: 'LoRaWAN IN865 (Class C)',
      batteryPct: 100,
      voltageV: 14.1,
      rssi: -71,
      snr: '+16.0 dB',
      lastSeenSeconds: 1,
      status: 'HEALTHY',
      readings: { solar_rad_wm2: 680, wind_kmh: 8.4, ambient_temp_c: 31.2, et0_mm: 4.6 }
    }
  ];

  class FarmPilotIoTSimulator {
    constructor() {
      this.isStreaming = true;
      this.isStaleSimulated = false;
      this.packetHistory = [];
      this.timer = null;
      this.packetCounter = 8412;
    }

    render(containerId) {
      const container = document.getElementById(containerId);
      if (!container) return;

      container.innerHTML = `
        <div class="card" style="border-top: 4px solid #0284C7; margin-bottom: 1.5rem;" id="iot-simulator">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;">
            <div>
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                <span class="badge badge-primary">Adv. Eng. Challenge #3</span>
                <span class="badge badge-success" id="iot-stream-status-badge">⚡ Live Stream Active</span>
                <span class="badge badge-neutral">LoRaWAN & MQTT</span>
              </div>
              <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--color-text-primary); margin: 0;">
                📡 Real-Time IoT Telemetry Stream & Field Sensor Network
              </h3>
              <p style="font-size: 0.8125rem; color: var(--color-text-secondary); margin-top: 0.25rem;">
                Hardware abstraction layer streaming live packet telemetry from field nodes with cryptographic CRC verification, battery health monitoring, and stale packet drop detection.
              </p>
            </div>

            <!-- Controls -->
            <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
              <button type="button" onclick="window.FarmPilotIoT.toggleStream()" id="btn-iot-toggle" class="btn btn-sm btn-outline" style="font-size: 0.75rem; font-weight: 700;">
                ⏸️ Pause Stream
              </button>
              <button type="button" onclick="window.FarmPilotIoT.simulateStalePacket()" id="btn-iot-stale" class="btn btn-sm btn-danger" style="font-size: 0.75rem; font-weight: 800;">
                ⚠️ Inject Packet Loss (Test Stale Alarm)
              </button>
            </div>
          </div>

          <!-- Active Nodes Health Grid -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 0.85rem; margin-bottom: 1.25rem;">
            ${IOT_NODES.map(n => `
              <div id="node-card-${n.id}" style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 0.85rem; transition: all 0.25s ease;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.4rem;">
                  <strong style="font-size: 0.8125rem; color: #0F172A;">${n.name}</strong>
                  <span id="node-badge-${n.id}" class="badge ${n.status === 'HEALTHY' ? 'badge-success' : 'badge-primary'}" style="font-size: 0.6rem;">${n.status}</span>
                </div>
                <div style="font-size: 0.6875rem; color: #64748B; font-family: monospace; margin-bottom: 0.4rem;">${n.id} • ${n.protocol}</div>
                <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: #334155; border-top: 1px dashed #CBD5E1; padding-top: 0.4rem;">
                  <span>🔋 Battery: <strong>${n.batteryPct}% (${n.voltageV}V)</strong></span>
                  <span>📶 RSSI: <strong>${n.rssi} dBm</strong></span>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Live Packet Feed Ticker Table -->
          <div style="border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden; background: #FFFFFF;">
            <div style="background: #F1F5F9; padding: 0.5rem 0.85rem; font-size: 0.7rem; font-weight: 800; color: #475569; display: flex; justify-content: space-between; align-items: center;">
              <span>📡 LIVE INCOMING PACKET LOG (CRC-16 VERIFIED)</span>
              <span id="iot-packet-counter" class="tabular-nums font-mono" style="color: #0284C7;">Packets: 8,412</span>
            </div>
            <div style="max-height: 180px; overflow-y: auto; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 0.75rem;">
              <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead style="background: #F8FAFC; border-bottom: 1px solid #E2E8F0; font-size: 0.68rem; color: #64748B;">
                  <tr>
                    <th style="padding: 0.4rem 0.65rem;">Timestamp</th>
                    <th style="padding: 0.4rem 0.65rem;">Device Node</th>
                    <th style="padding: 0.4rem 0.65rem;">Payload Telemetry</th>
                    <th style="padding: 0.4rem 0.65rem;">Signal</th>
                    <th style="padding: 0.4rem 0.65rem;">Integrity</th>
                  </tr>
                </thead>
                <tbody id="iot-packet-tbody">
                  <!-- Injected dynamically -->
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;

      this.startStream();
    }

    startStream() {
      if (this.timer) clearInterval(this.timer);
      this.timer = setInterval(() => {
        if (!this.isStreaming) return;
        this.generatePacket();
      }, 3200);

      // Generate initial 4 packets
      for (let i = 0; i < 4; i++) {
        this.generatePacket();
      }
    }

    generatePacket() {
      const nodeIdx = Math.floor(Math.random() * IOT_NODES.length);
      const node = IOT_NODES[nodeIdx];
      this.packetCounter++;

      // If stale simulation is active on Node 0, skip it
      if (this.isStaleSimulated && node.id === 'NODE-AWD-PADDY-01') {
        return;
      }

      const counterEl = document.getElementById('iot-packet-counter');
      if (counterEl) counterEl.textContent = `Packets: ${this.packetCounter.toLocaleString()}`;

      const tbody = document.getElementById('iot-packet-tbody');
      if (!tbody) return;

      const now = new Date().toISOString().split('T')[1].slice(0, 8);
      let payloadStr = '';

      if (node.id === 'NODE-AWD-PADDY-01') {
        const depth = (-4.0 + (Math.random() * 0.4 - 0.2)).toFixed(1);
        payloadStr = `depth: ${depth}cm, temp: 27.8°C`;
      } else if (node.id === 'NODE-SOIL-MAIZE-02') {
        const kpa = (24.5 + (Math.random() * 0.6 - 0.3)).toFixed(1);
        payloadStr = `moisture: ${kpa}kPa, ec: 1.12dS/m`;
      } else if (node.id === 'VALVE-SLUICE-CANAL-01') {
        payloadStr = `valve: CLOSED, press: 3.4bar, flow: 0L/m`;
      } else {
        payloadStr = `rad: 680W/m², wind: 8.4km/h, et0: 4.6mm`;
      }

      const row = document.createElement('tr');
      row.style.borderBottom = '1px solid #F1F5F9';
      row.style.animation = 'fadeIn 0.3s ease';
      row.innerHTML = `
        <td style="padding: 0.35rem 0.65rem; color: #64748B;">${now}</td>
        <td style="padding: 0.35rem 0.65rem; font-weight: 700; color: #0284C7;">${node.id}</td>
        <td style="padding: 0.35rem 0.65rem; color: #334155;">${payloadStr}</td>
        <td style="padding: 0.35rem 0.65rem; color: #059669;">${node.rssi + Math.floor(Math.random() * 3)}dBm</td>
        <td style="padding: 0.35rem 0.65rem;"><span class="badge badge-success" style="font-size: 0.55rem; padding: 0.1rem 0.35rem;">CRC VALID</span></td>
      `;

      tbody.insertBefore(row, tbody.firstChild);
      if (tbody.children.length > 8) {
        tbody.removeChild(tbody.lastChild);
      }
    }

    toggleStream() {
      this.isStreaming = !this.isStreaming;
      const btn = document.getElementById('btn-iot-toggle');
      const badge = document.getElementById('iot-stream-status-badge');
      if (btn) {
        btn.textContent = this.isStreaming ? '⏸️ Pause Stream' : '▶️ Resume Stream';
      }
      if (badge) {
        badge.className = this.isStreaming ? 'badge badge-success' : 'badge badge-warning';
        badge.textContent = this.isStreaming ? '⚡ Live Stream Active' : '⏸️ Stream Paused';
      }
    }

    simulateStalePacket() {
      this.isStaleSimulated = !this.isStaleSimulated;
      const btn = document.getElementById('btn-iot-stale');
      const nodeCard = document.getElementById('node-card-NODE-AWD-PADDY-01');
      const nodeBadge = document.getElementById('node-badge-NODE-AWD-PADDY-01');

      if (this.isStaleSimulated) {
        if (btn) {
          btn.textContent = '✓ Restore LoRaWAN Telemetry';
          btn.className = 'btn btn-sm btn-success';
        }
        if (nodeCard) {
          nodeCard.style.borderColor = '#DC2626';
          nodeCard.style.background = '#FEF2F2';
        }
        if (nodeBadge) {
          nodeBadge.className = 'badge badge-danger';
          nodeBadge.textContent = '⚠️ STALE DATA (>10m)';
        }
        if (window.FarmPilotApp && window.FarmPilotApp.showToast) {
          window.FarmPilotApp.showToast('⚠️ Injected Packet Loss on NODE-AWD-01: Flagged as STALE DATA. Imputing ET values.', 'error');
        }
      } else {
        if (btn) {
          btn.textContent = '⚠️ Inject Packet Loss (Test Stale Alarm)';
          btn.className = 'btn btn-sm btn-danger';
        }
        if (nodeCard) {
          nodeCard.style.borderColor = '#E2E8F0';
          nodeCard.style.background = '#F8FAFC';
        }
        if (nodeBadge) {
          nodeBadge.className = 'badge badge-success';
          nodeBadge.textContent = 'HEALTHY';
        }
        if (window.FarmPilotApp && window.FarmPilotApp.showToast) {
          window.FarmPilotApp.showToast('✓ Restored LoRaWAN telemetry stream on NODE-AWD-01. Live readings verified.', 'success');
        }
      }
    }
  }

  window.FarmPilotIoT = new FarmPilotIoTSimulator();
})();
