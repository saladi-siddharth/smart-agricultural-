/**
 * FarmPilot SMTP Email Notification Client
 * Dispatches structured field operations alerts to the backend email service
 */

window.FarmPilotMailer = {
  async sendOperationAlert(activityData) {
    try {
      const activeFarm = window.FarmPilotDB ? await window.FarmPilotDB.getActiveFarm() : null;
      const health = window.FarmPilotDB ? window.FarmPilotDB.getFarmHealth() : null;
      const user = window.FarmPilotAuth ? window.FarmPilotAuth.getUser() : null;

      const payload = {
        title: activityData.title || 'Field Operation',
        category: activityData.category || activityData.activity_type || 'FERTILIZATION',
        field_name: activityData.field_name || 'North Block (Plot A)',
        crop_name: activityData.crop_name || 'Paddy BPT-5204 (Kharif 2026)',
        due_date: activityData.due_date || activityData.planned_date || new Date().toISOString().split('T')[0],
        priority: activityData.priority || 'MEDIUM',
        cost: activityData.cost || activityData.estimated_cost || 0,
        notes: activityData.notes || '',
        assigned_to_name: activityData.assigned_to_name || 'Ravi Kumar (Field Operator)',
        farm_name: activeFarm?.name || 'Green Valley Farm',
        health_score: health?.score || 82,
        recipient: user?.email || undefined
      };

      console.log('📨 FarmPilotMailer: Dispatching SMTP alert for operation:', payload.title);

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const result = await response.json();
      console.log('✓ FarmPilotMailer: Email dispatched successfully:', result);

      if (window.FarmPilotApp) {
        if (result.previewUrl) {
          window.FarmPilotApp.showToast(`✉️ Email alert generated & saved to preview! <a href="${result.previewUrl}" target="_blank" style="color:#34D399;text-decoration:underline;margin-left:4px;">View Email ↗</a>`);
        } else {
          window.FarmPilotApp.showToast(`✉️ SMTP alert dispatched to ${result.recipient || 'estate operator'}!`);
        }
      }

      return result;
    } catch (err) {
      console.warn('FarmPilotMailer notice (falling back gracefully):', err);
      return { success: false, error: err.message };
    }
  }
};
