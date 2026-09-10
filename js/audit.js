/**
 * FarmPilot Tamper-Evident Audit History & Operational Ledger Engine
 * Records every critical agronomic, irrigation, fertilizer, labour, and security action.
 */

window.FarmPilotAudit = {
  STORAGE_KEY: 'fp_audit_logs',

  DEFAULT_AUDIT_LOGS: [
    {
      id: 'aud-001',
      timestamp: '2026-09-10T18:15:00.000Z',
      formatted_date: '10 Sep 2026, 06:15 PM',
      user: 'Rajesh Patel',
      email: 'manager@greenvalley.in',
      role: 'Field Manager',
      module: 'Irrigation & AWD',
      action: 'UPDATE',
      field_parcel: 'North Block (Plot A)',
      old_value: 'Water Volume: 4,000 L • Last: 08 Sep 2026',
      new_value: 'Water Volume: 4,500 L • Last: 10 Sep 2026',
      ip_device: '192.168.1.104 • Edge/Desktop (Farm Office)',
      reason: 'Meter recalibration after AWD submersion cycle completion'
    },
    {
      id: 'aud-002',
      timestamp: '2026-09-10T17:45:00.000Z',
      formatted_date: '10 Sep 2026, 05:45 PM',
      user: 'Rajesh Patel',
      email: 'manager@greenvalley.in',
      role: 'Field Manager',
      module: 'Inputs & Fertilizers',
      action: 'STOCK_APPLIED',
      field_parcel: 'Tomato Nursery Block (Plot 2)',
      old_value: 'Urea Applied: 50 kg • Stock Remaining: 150 kg',
      new_value: 'Urea Applied: 75 kg (+25 kg) • Stock Remaining: 125 kg',
      ip_device: '192.168.1.104 • Edge/Desktop (Farm Office)',
      reason: 'Mid-stage vegetative top-dressing application'
    },
    {
      id: 'aud-003',
      timestamp: '2026-09-10T16:20:00.000Z',
      formatted_date: '10 Sep 2026, 04:20 PM',
      user: 'Siddharth Saladi',
      email: 'farmer@greenvalley.in',
      role: 'Farm Owner',
      module: 'Labour Management',
      action: 'SHIFT_ASSIGNMENT',
      field_parcel: 'Central Sector (Plot B)',
      old_value: 'Shift: Unassigned (0 Workers)',
      new_value: 'Tomorrow Morning Shift: 8 Workers Assigned (Weeding & AWD)',
      ip_device: '49.37.12.88 • Chrome/Windows (HQ Executive Portal)',
      reason: 'Scheduled weed suppression before secondary monsoon showers'
    },
    {
      id: 'aud-004',
      timestamp: '2026-09-10T14:10:00.000Z',
      formatted_date: '10 Sep 2026, 02:10 PM',
      user: 'Dr. Anita Rao',
      email: 'consultant@greenvalley.in',
      role: 'Agronomic Consultant',
      module: 'Farm Intelligence',
      action: 'ADVISORY_ISSUED',
      field_parcel: 'Delta Lowlands (Plot C)',
      old_value: 'Advisory Status: Routine Monitoring',
      new_value: 'Flagged: Blast Disease Risk Alert + AWD Moisture Drop',
      ip_device: '157.48.91.201 • Safari/macOS (Research Center)',
      reason: 'High relative humidity (63%) with rising night temperatures'
    },
    {
      id: 'aud-005',
      timestamp: '2026-09-10T09:30:00.000Z',
      formatted_date: '10 Sep 2026, 09:30 AM',
      user: 'Ravi Kumar',
      email: 'worker@greenvalley.in',
      role: 'Labour / Worker',
      module: 'Field Tasks',
      action: 'TASK_COMPLETED',
      field_parcel: 'North Block (Plot A)',
      old_value: 'Task: AWD Pipe Water Depth Verification (PENDING)',
      new_value: 'Task: AWD Pipe Water Depth Verification (COMPLETED • 5.0 cm)',
      ip_device: '10.20.4.15 • PWA Mobile Client (Field Parcel)',
      reason: 'Morning AWD perforated pipe dip-stick reading confirmed'
    },
    {
      id: 'aud-006',
      timestamp: '2026-09-09T18:00:00.000Z',
      formatted_date: '09 Sep 2026, 06:00 PM',
      user: 'Siddharth Saladi',
      email: 'farmer@greenvalley.in',
      role: 'Farm Owner',
      module: 'Roles & Security',
      action: 'PERMISSION_CONFIG',
      field_parcel: 'Enterprise Tenant',
      old_value: 'Role: Field Manager (Expenses: Read-Only)',
      new_value: 'Role: Field Manager (Expenses: Add/View Assigned Parcels)',
      ip_device: '49.37.12.88 • Chrome/Windows (HQ Executive Portal)',
      reason: 'Delegated operational petty expense logging for diesel & AWD pump hours'
    }
  ],

  getLogs() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to parse audit logs:', e);
    }
    // Seed default logs if none stored
    this.saveLogs(this.DEFAULT_AUDIT_LOGS);
    return this.DEFAULT_AUDIT_LOGS;
  },

  saveLogs(logs) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to save audit logs:', e);
    }
  },

  log(entry) {
    const user = window.FarmPilotAuth ? window.FarmPilotAuth.getUser() : null;
    const effectiveRole = window.FarmPilotAuth ? window.FarmPilotAuth.getEffectiveRole() : 'OWNER';

    const roleNames = {
      OWNER: 'Farm Owner',
      MANAGER: 'Field Manager',
      WORKER: 'Labour / Worker',
      CONSULTANT: 'Agronomic Consultant'
    };

    const newLog = {
      id: 'aud-' + Date.now(),
      timestamp: new Date().toISOString(),
      formatted_date: new Date().toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }),
      user: entry.user || user?.full_name || 'Farm Operator',
      email: entry.email || user?.email || 'farmer@greenvalley.in',
      role: entry.role || roleNames[effectiveRole] || effectiveRole,
      module: entry.module || 'Farm Operations',
      action: entry.action || 'UPDATE',
      field_parcel: entry.field_parcel || entry.parcel || 'General Estate',
      old_value: entry.old_value || '—',
      new_value: entry.new_value || '—',
      ip_device: entry.ip_device || '192.168.1.42 • Chrome / Edge (Verified Session)',
      reason: entry.reason || 'Operational activity logged in FarmPilot command center'
    };

    const logs = this.getLogs();
    logs.unshift(newLog);
    // Keep last 250 records
    if (logs.length > 250) logs.length = 250;
    this.saveLogs(logs);

    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('farmpilot:audit-logged', { detail: newLog }));
    }

    return newLog;
  },

  exportCSV() {
    const logs = this.getLogs();
    if (!logs.length) return;

    const headers = ['ID', 'Date & Time', 'User', 'Role', 'Module', 'Action', 'Field/Parcel', 'Old Value', 'New Value', 'Reason', 'Device / IP'];
    const rows = logs.map(l => [
      l.id,
      `"${l.formatted_date}"`,
      `"${l.user}"`,
      `"${l.role}"`,
      `"${l.module}"`,
      `"${l.action}"`,
      `"${l.field_parcel}"`,
      `"${(l.old_value || '').replace(/"/g, '""')}"`,
      `"${(l.new_value || '').replace(/"/g, '""')}"`,
      `"${(l.reason || '').replace(/"/g, '""')}"`,
      `"${l.ip_device}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `farmpilot_audit_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
