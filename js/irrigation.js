/**
 * FarmPilot Irrigation & Alternate Wetting and Drying (AWD) Water Balance Engine
 * Manages live irrigation schedules, water volume metrics, next-irrigation countdown reminders,
 * and rule-based Smart Irrigation Recommendations powered by live weather telemetry.
 */

window.FarmPilotIrrigation = {
  STORAGE_KEY: 'fp_irrigation_data',

  DEFAULT_DATA: {
    status: {
      field: 'North Block (Plot A)',
      crop: 'Paddy BPT-5204',
      last_irrigation: '10 Sep 2026 • 06:30 AM',
      next_irrigation: '12 Sep 2026 • 06:30 AM',
      hours_remaining: 36,
      reminder_status: 'UPCOMING', // DUE_NOW | UPCOMING | COMPLETED
      water_used_latest: '4,500 L',
      water_used_cycle: '28,500 L',
      method: 'Alternate Wetting & Drying (AWD) Sluice',
      soil_moisture_pct: 31,
      water_depth_cm: 5.0,
      responsible: 'Rajesh Patel (Field Manager)'
    },
    recommendation: {
      field: 'North Block (Plot A)',
      crop: 'Paddy BPT-5204 (Panicle Stage)',
      soil_moisture: '31%',
      temp: '31.5°C',
      humidity: '63%',
      action_window: 'Next 18 Hours',
      suggested_volume: '4,200 – 4,600 Litres',
      protocol: 'AWD Field Submersion (Maintain 5 cm depth for 48 hrs)',
      reason: 'Soil water tension approaching critical aeration threshold. Machilipatnam forecast indicates zero rain next 24h.'
    },
    records: [
      {
        id: 'irr-01',
        field: 'North Block (Plot A)',
        crop: 'Paddy BPT-5204',
        date: '2026-09-10',
        start_time: '06:30 AM',
        end_time: '08:00 AM',
        water_quantity: '4,500 L',
        water_depth: '5.0 cm',
        method: 'AWD Submersion Sluice',
        person: 'Ravi Kumar (Operator)',
        weather: '31.5°C Overcast • Calm Winds',
        status: 'Completed',
        next_irrigation: '2026-09-12'
      },
      {
        id: 'irr-02',
        field: 'Central Sector (Plot B)',
        crop: 'Tomato (NS-501)',
        date: '2026-09-09',
        start_time: '05:30 AM',
        end_time: '07:00 AM',
        water_quantity: '7,000 L',
        water_depth: 'N/A (Drip)',
        method: 'Precision Solar Drip',
        person: 'Kumar Swamy',
        weather: '32.0°C Sunny • 18 km/h Wind',
        status: 'Due Tomorrow',
        next_irrigation: '2026-09-11'
      },
      {
        id: 'irr-03',
        field: 'Delta Lowlands (Plot C)',
        crop: 'Chilli Teja',
        date: '2026-09-08',
        start_time: '06:00 AM',
        end_time: '07:15 AM',
        water_quantity: '3,000 L',
        water_depth: 'N/A (Furrow)',
        method: 'Micro-Furrow Inflow',
        person: 'Suresh Varma',
        weather: '33.5°C Clear • 20 km/h Wind',
        status: 'Overdue',
        next_irrigation: '2026-09-10'
      }
    ]
  },

  getData() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Error reading irrigation data:', e);
    }
    this.saveData(this.DEFAULT_DATA);
    return this.DEFAULT_DATA;
  },

  saveData(data) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Error saving irrigation data:', e);
    }
  },

  logIrrigation({ field, crop, water_quantity, method, person, notes }) {
    const data = this.getData();
    const now = new Date();
    const nextDate = new Date(now.getTime() + 48 * 3600 * 1000); // 48h later

    const newRecord = {
      id: 'irr-' + Date.now(),
      field: field || 'North Block (Plot A)',
      crop: crop || 'Paddy BPT-5204',
      date: now.toISOString().slice(0, 10),
      start_time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      end_time: new Date(now.getTime() + 90 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      water_quantity: water_quantity ? `${water_quantity} L` : '4,500 L',
      water_depth: '5.0 cm',
      method: method || 'AWD Submersion Sluice',
      person: person || (window.FarmPilotAuth?.getUser()?.full_name || 'Field Manager'),
      weather: 'Optimal Microclimate',
      notes: notes || 'AWD submersion cycle refreshed',
      status: 'Completed',
      next_irrigation: nextDate.toISOString().slice(0, 10)
    };

    data.records.unshift(newRecord);
    data.status.last_irrigation = `${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} • ${newRecord.start_time}`;
    data.status.next_irrigation = `${nextDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} • ${newRecord.start_time}`;
    data.status.water_used_latest = newRecord.water_quantity;
    data.status.reminder_status = 'COMPLETED';

    this.saveData(data);

    // Audit trail logging
    if (window.FarmPilotAudit) {
      window.FarmPilotAudit.log({
        module: 'Irrigation & AWD',
        action: 'IRRIGATION_LOGGED',
        field: newRecord.field,
        old_value: 'Scheduled Event',
        new_value: `Completed: ${newRecord.water_quantity} via ${newRecord.method}`,
        reason: 'Water meter and pump run completed'
      });
    }

    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('farmpilot:irrigation-logged', { detail: newRecord }));
    }

    return newRecord;
  }
};
