/**
 * FarmPilot Labour Management & Shift Allocation Engine
 * Tracks real-time labour attendance, shift breakdown, hourly costs, and next shift planning.
 */

window.FarmPilotLabour = {
  STORAGE_KEY: 'fp_labour_data',

  DEFAULT_DATA: {
    shifts_summary: {
      total_workers: 24,
      morning: 12,
      afternoon: 8,
      night: 4,
      today_cost: 12450,
      cost_change_pct: '+8.4%',
      crop_total_cost: 124500,
      crop_budget: 150000
    },
    today_workers: [
      {
        id: 'w-01',
        name: 'Ravi Kumar',
        shift: 'Morning (06:00 - 12:00)',
        field: 'North Block (Plot A)',
        crop: 'Paddy BPT-5204',
        task: 'Weeding & AWD Pipe Check',
        hours: 6,
        rate: 250,
        total_cost: 1500,
        status: 'Completed',
        payment: 'Paid'
      },
      {
        id: 'w-02',
        name: 'Kumar Swamy',
        shift: 'Morning (06:00 - 12:00)',
        field: 'Central Sector (Plot B)',
        crop: 'Tomato (NS-501)',
        task: 'Fertilizer Top-Dressing (Urea)',
        hours: 5,
        rate: 250,
        total_cost: 1250,
        status: 'Completed',
        payment: 'Paid'
      },
      {
        id: 'w-03',
        name: 'Suresh Varma',
        shift: 'Afternoon (13:00 - 19:00)',
        field: 'North Block (Plot A)',
        crop: 'Paddy BPT-5204',
        task: 'AWD Submersion Irrigation',
        hours: 6,
        rate: 250,
        total_cost: 1500,
        status: 'Working',
        payment: 'Pending'
      },
      {
        id: 'w-04',
        name: 'Ramesh Naidu',
        shift: 'Tomorrow Morning (06:00)',
        field: 'Delta Lowlands (Plot C)',
        crop: 'Chilli Teja',
        task: 'Harvesting & Grading',
        hours: 6,
        rate: 250,
        total_cost: 1500,
        status: 'Assigned',
        payment: 'Pending'
      },
      {
        id: 'w-05',
        name: 'Anil Reddy',
        shift: 'Morning (06:00 - 12:00)',
        field: 'North Block (Plot A)',
        crop: 'Paddy BPT-5204',
        task: 'Canal Silt Removal',
        hours: 6,
        rate: 250,
        total_cost: 1500,
        status: 'Completed',
        payment: 'Paid'
      },
      {
        id: 'w-06',
        name: 'Venkatesh Rao',
        shift: 'Afternoon (13:00 - 19:00)',
        field: 'Central Sector (Plot B)',
        crop: 'Tomato (NS-501)',
        task: 'Staking & Trellising',
        hours: 6,
        rate: 250,
        total_cost: 1500,
        status: 'Working',
        payment: 'Pending'
      },
      {
        id: 'w-07',
        name: 'Gopal Krishna',
        shift: 'Night / AWD Guard (20:00 - 02:00)',
        field: 'North Block (Plot A)',
        crop: 'Paddy BPT-5204',
        task: 'Solar Pump & Inflow Sluice Monitoring',
        hours: 6,
        rate: 280,
        total_cost: 1680,
        status: 'Assigned',
        payment: 'Pending'
      }
    ],
    next_shift: {
      date: 'Tomorrow — Morning Shift',
      time: '06:00 AM - 12:00 PM',
      total_labourers: 8,
      plan: [
        { field: 'North Block (Plot A)', workers: 3, task: 'Manual Weeding', status: 'Scheduled' },
        { field: 'North Block (Plot A)', workers: 2, task: 'AWD Sluice & Irrigation', status: 'Scheduled' },
        { field: 'North Block (Plot A)', workers: 1, task: 'Fertilizer Application', status: 'Scheduled' },
        { field: 'Central Sector (Plot B)', workers: 2, task: 'Tomato First Picking (Harvest)', status: 'Scheduled' }
      ]
    }
  },

  getData() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to parse labour data:', e);
    }
    this.saveData(this.DEFAULT_DATA);
    return this.DEFAULT_DATA;
  },

  saveData(data) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save labour data:', e);
    }
  },

  assignWorker({ name, shift, field, crop, task, hours, rate }) {
    const data = this.getData();
    const cost = (parseFloat(hours) || 6) * (parseFloat(rate) || 250);

    const newWorker = {
      id: 'w-' + Date.now(),
      name: name || 'Labourer',
      shift: shift || 'Morning (06:00 - 12:00)',
      field: field || 'North Block (Plot A)',
      crop: crop || 'Paddy BPT-5204',
      task: task || 'Field Maintenance',
      hours: parseFloat(hours) || 6,
      rate: parseFloat(rate) || 250,
      total_cost: cost,
      status: 'Assigned',
      payment: 'Pending'
    };

    data.today_workers.unshift(newWorker);
    data.shifts_summary.total_workers += 1;
    data.shifts_summary.today_cost += cost;
    data.shifts_summary.crop_total_cost += cost;

    this.saveData(data);

    // Audit trail logging
    if (window.FarmPilotAudit) {
      window.FarmPilotAudit.log({
        module: 'Labour Management',
        action: 'WORKER_ASSIGNED',
        field: newWorker.field,
        old_value: 'Unassigned',
        new_value: `${newWorker.name} assigned to ${newWorker.task} (${newWorker.hours}h • ₹${cost})`,
        reason: 'Shift supervisor dispatched field worker'
      });
    }

    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('farmpilot:labour-updated', { detail: data }));
    }

    return newWorker;
  }
};
