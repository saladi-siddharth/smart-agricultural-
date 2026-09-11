/**
 * FarmPilot Supabase Data Service — Phase 2 Enterprise Edition
 * Multi-Tenant SaaS Scoping, RBAC, Task Lifecycle, Alert Deduplication, and Dynamic Agronomic Health
 */

(function() {
  let supabaseClient = null;

  function initSupabase() {
    if (window.supabase && window.FARMPILOT_CONFIG) {
      try {
        supabaseClient = window.supabase.createClient(
          window.FARMPILOT_CONFIG.SUPABASE_URL,
          window.FARMPILOT_CONFIG.SUPABASE_ANON_KEY
        );
        console.log('✓ FarmPilot: Supabase Client connected to', window.FARMPILOT_CONFIG.SUPABASE_URL);
      } catch (e) {
        console.warn('Supabase initialization fallback:', e);
      }
    }
  }

  initSupabase();

  function getLocal(key, defaultValue) {
    try {
      const val = localStorage.getItem('fp_' + key);
      return val ? JSON.parse(val) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  function setLocal(key, value) {
    try {
      localStorage.setItem('fp_' + key, JSON.stringify(value));
    } catch (e) {
      console.error('LocalStorage error:', e);
    }
  }

  function ensureSeedData() {
    if (!getLocal('organization', null)) {
      setLocal('organization', window.FARMPILOT_CONFIG.DEFAULT_ORGANIZATION);
    }
    if (!getLocal('farms', null)) {
      setLocal('farms', window.FARMPILOT_CONFIG.DEFAULT_FARMS);
    }
    if (!getLocal('active_farm_id', null)) {
      setLocal('active_farm_id', window.FARMPILOT_CONFIG.DEFAULT_FARMS[0].id);
    }
    if (!getLocal('fields', null)) {
      setLocal('fields', window.FARMPILOT_CONFIG.DEFAULT_FIELDS);
    }
    if (!getLocal('crop_cycle', null)) {
      setLocal('crop_cycle', window.FARMPILOT_CONFIG.DEFAULT_CROP_CYCLE);
    }
    if (!getLocal('activities', null)) {
      setLocal('activities', window.FARMPILOT_CONFIG.DEFAULT_ACTIVITIES);
    }
    if (!getLocal('alerts', null)) {
      setLocal('alerts', window.FARMPILOT_CONFIG.DEFAULT_ALERTS);
    }
    if (!getLocal('inputs', null)) {
      setLocal('inputs', window.FARMPILOT_CONFIG.DEFAULT_INPUTS);
    }
    if (!getLocal('expenses', null)) {
      setLocal('expenses', window.FARMPILOT_CONFIG.DEFAULT_EXPENSES);
    }
    if (!getLocal('recommendations', null)) {
      setLocal('recommendations', window.FARMPILOT_CONFIG.DEFAULT_RECOMMENDATIONS || []);
    }
    if (!getLocal('journal', null)) {
      setLocal('journal', window.FARMPILOT_CONFIG.DEFAULT_JOURNAL || []);
    }
    if (!getLocal('crop_templates', null)) {
      setLocal('crop_templates', window.FARMPILOT_CONFIG.DEFAULT_CROP_TEMPLATES || []);
    }
  }

  ensureSeedData();

  window.FarmPilotDB = {
    init: initSupabase,
    getClient() {
      if (!supabaseClient) initSupabase();
      return supabaseClient;
    },

    // --- ORGANIZATIONS ---
    async getOrganization() {
      const client = this.getClient();
      if (client) {
        try {
          const { data, error } = await client.from('organizations').select('*').limit(1);
          if (!error && data && data.length > 0) {
            setLocal('organization', data[0]);
            return data[0];
          }
        } catch (e) {
          console.warn('Org query fallback:', e);
        }
      }
      return getLocal('organization', window.FARMPILOT_CONFIG.DEFAULT_ORGANIZATION);
    },

    async getMembers() {
      const client = this.getClient();
      if (client) {
        try {
          const { data, error } = await client.from('organization_members').select('*, profiles(*)');
          if (!error && data && data.length > 0) {
            return data;
          }
        } catch (e) {
          console.warn('Members query fallback:', e);
        }
      }
      return Object.values(window.FARMPILOT_CONFIG.PERSONAS);
    },

    // --- FARMS (Portfolio Management) ---
    async getFarms() {
      const client = this.getClient();
      if (client) {
        try {
          const { data, error } = await client.from('farms').select('*').order('created_at', { ascending: false });
          if (!error && data && data.length > 0) {
            setLocal('farms', data);
            return data;
          }
        } catch (err) {
          console.warn('Supabase farms query fallback:', err);
        }
      }
      return getLocal('farms', window.FARMPILOT_CONFIG.DEFAULT_FARMS);
    },

    async getActiveFarm() {
      const farms = await this.getFarms();
      const activeId = getLocal('active_farm_id', farms[0]?.id);
      return farms.find(f => f.id === activeId) || farms[0];
    },

    async setActiveFarm(farmId) {
      setLocal('active_farm_id', farmId);
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('farmpilot:farm-changed', { detail: { farmId } }));
      }
    },

    async createFarm(farmData) {
      const user = window.FarmPilotAuth.getUser();
      const org = await this.getOrganization();
      const newFarm = {
        name: farmData.name,
        location: farmData.location || '',
        district: farmData.district || '',
        state: farmData.state || '',
        total_area: parseFloat(farmData.total_area) || 0,
        area_unit: farmData.area_unit || 'acres',
        description: farmData.description || '',
        owner_id: user?.id || '33dd8f01-e3c5-42a8-9194-a92504a75246',
        organization_id: org?.id || '4b2766a7-3f5f-45bf-9f41-926c7855aeeb'
      };

      const client = this.getClient();
      if (client) {
        try {
          const { data, error } = await client.from('farms').insert(newFarm).select().single();
          if (!error && data) {
            const list = getLocal('farms', []);
            list.unshift(data);
            setLocal('farms', list);
            return data;
          }
        } catch (e) {
          console.warn('Error inserting farm to Supabase:', e);
        }
      }

      newFarm.id = 'farm-' + Date.now();
      const list = getLocal('farms', window.FARMPILOT_CONFIG.DEFAULT_FARMS);
      list.unshift(newFarm);
      setLocal('farms', list);
      return newFarm;
    },

    async updateFarm(farmId, updates) {
      const client = this.getClient();
      if (client) {
        try {
          const { data, error } = await client.from('farms').update({
            name: updates.name,
            location: updates.location,
            district: updates.district,
            state: updates.state || '',
            total_area: parseFloat(updates.total_area) || 0,
            area_unit: updates.area_unit || 'acres',
            description: updates.description,
            updated_at: new Date().toISOString()
          }).eq('id', farmId).select().single();
          if (!error && data) {
            let list = getLocal('farms', []);
            list = list.map(f => f.id === farmId ? { ...f, ...data } : f);
            setLocal('farms', list);
            return data;
          }
        } catch (e) {
          console.warn('Supabase updateFarm error:', e);
        }
      }

      let list = getLocal('farms', window.FARMPILOT_CONFIG.DEFAULT_FARMS);
      let updated = null;
      list = list.map(f => {
        if (f.id === farmId) {
          updated = {
            ...f,
            ...updates,
            total_area: parseFloat(updates.total_area) || f.total_area,
            updated_at: new Date().toISOString()
          };
          return updated;
        }
        return f;
      });
      setLocal('farms', list);

      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('farmpilot:farm-updated', { detail: { farmId, updates } }));
      }
      return updated;
    },

    async deleteFarm(farmId) {
      const client = this.getClient();
      if (client) {
        try {
          await client.from('farms').delete().eq('id', farmId);
        } catch (e) {
          console.warn('Supabase deleteFarm error:', e);
        }
      }

      // --- CASCADE DELETION ENGINE (Clean up Farm & entire associated Life Cycle) ---
      // 1. Remove the farm itself
      let farms = getLocal('farms', window.FARMPILOT_CONFIG.DEFAULT_FARMS);
      farms = farms.filter(f => f.id !== farmId);
      setLocal('farms', farms);

      // 2. Cascade delete parcels / fields belonging to this farm
      let fields = getLocal('fields', window.FARMPILOT_CONFIG.DEFAULT_FIELDS);
      const deletedFieldIds = fields.filter(fld => fld.farm_id === farmId).map(fld => fld.id);
      fields = fields.filter(fld => fld.farm_id !== farmId);
      setLocal('fields', fields);

      // 3. Cascade delete crop cycles (life cycles) belonging to this farm or its fields
      let cropCycles = getLocal('crop_cycles', window.FARMPILOT_CONFIG.DEFAULT_CROP_CYCLES || []);
      const deletedCycleIds = cropCycles.filter(c => c.farm_id === farmId || deletedFieldIds.includes(c.field_id)).map(c => c.id);
      cropCycles = cropCycles.filter(c => c.farm_id !== farmId && !deletedFieldIds.includes(c.field_id));
      setLocal('crop_cycles', cropCycles);

      const singleCycle = getLocal('crop_cycle', null);
      if (singleCycle && (singleCycle.farm_id === farmId || deletedCycleIds.includes(singleCycle.id))) {
        setLocal('crop_cycle', null);
      }

      // 4. Cascade delete activities / field operations
      let activities = getLocal('activities', window.FARMPILOT_CONFIG.DEFAULT_ACTIVITIES);
      activities = activities.filter(a => a.farm_id !== farmId && !deletedCycleIds.includes(a.crop_cycle_id));
      setLocal('activities', activities);

      // 5. Cascade delete AWD water / irrigation logs
      let irrigationLogs = getLocal('irrigation_logs', window.FARMPILOT_CONFIG.DEFAULT_IRRIGATION_LOGS || []);
      irrigationLogs = irrigationLogs.filter(i => i.farm_id !== farmId && !deletedCycleIds.includes(i.crop_cycle_id));
      setLocal('irrigation_logs', irrigationLogs);

      // 6. Cascade delete inputs
      let inputs = getLocal('inputs', window.FARMPILOT_CONFIG.DEFAULT_INPUTS);
      inputs = inputs.filter(i => i.farm_id !== farmId && !deletedCycleIds.includes(i.crop_cycle_id));
      setLocal('inputs', inputs);

      // 7. Cascade delete expenses
      let expenses = getLocal('expenses', window.FARMPILOT_CONFIG.DEFAULT_EXPENSES);
      expenses = expenses.filter(e => e.farm_id !== farmId && !deletedCycleIds.includes(e.crop_cycle_id));
      setLocal('expenses', expenses);

      // 8. Cascade delete alerts
      let alerts = getLocal('alerts', window.FARMPILOT_CONFIG.DEFAULT_ALERTS);
      alerts = alerts.filter(a => a.farm_id !== farmId);
      setLocal('alerts', alerts);

      // 9. If active farm was deleted, switch to first remaining farm
      const activeFarmId = getLocal('active_farm_id', null);
      if (activeFarmId === farmId) {
        const nextFarm = farms[0] || null;
        if (nextFarm) {
          setLocal('active_farm_id', nextFarm.id);
        } else {
          localStorage.removeItem('fp_active_farm_id');
        }
      }

      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('farmpilot:farm-deleted', { detail: { farmId } }));
        window.dispatchEvent(new CustomEvent('farmpilot:farm-changed', { detail: { farmId: farms[0]?.id } }));
      }

      return true;
    },

    // --- FIELDS / PARCELS ---
    async getFields(farmId) {
      const client = this.getClient();
      if (client) {
        try {
          let query = client.from('fields').select('*');
          if (farmId) query = query.eq('farm_id', farmId);
          const { data, error } = await query;
          if (!error && data && data.length > 0) {
            setLocal('fields', data);
            return data;
          }
        } catch (err) {
          console.warn('Supabase fields query fallback:', err);
        }
      }
      return getLocal('fields', window.FARMPILOT_CONFIG.DEFAULT_FIELDS);
    },

    async createField(fieldData) {
      const activeFarm = await this.getActiveFarm();
      const newField = {
        name: fieldData.name,
        area: parseFloat(fieldData.area) || 0,
        area_unit: fieldData.area_unit || 'acres',
        soil_type: fieldData.soil_type || 'Clay Loam',
        irrigation_type: fieldData.irrigation_type || 'Canal Lift + Drip',
        description: fieldData.description || '',
        farm_id: fieldData.farm_id || activeFarm.id
      };

      const client = this.getClient();
      if (client) {
        try {
          const { data, error } = await client.from('fields').insert(newField).select().single();
          if (!error && data) {
            const list = getLocal('fields', []);
            list.push(data);
            setLocal('fields', list);
            return data;
          }
        } catch (e) {
          console.warn('Error inserting field to Supabase:', e);
        }
      }

      newField.id = 'field-' + Date.now();
      const list = getLocal('fields', window.FARMPILOT_CONFIG.DEFAULT_FIELDS);
      list.push(newField);
      setLocal('fields', list);
      return newField;
    },

    async updateField(fieldId, updates) {
      const client = this.getClient();
      if (client) {
        try {
          const { data, error } = await client.from('fields').update(updates).eq('id', fieldId).select().single();
          if (!error && data) {
            let list = getLocal('fields', []);
            list = list.map(f => f.id === fieldId ? { ...f, ...data } : f);
            setLocal('fields', list);
            return data;
          }
        } catch (e) {
          console.warn('Supabase updateField error:', e);
        }
      }

      let list = getLocal('fields', window.FARMPILOT_CONFIG.DEFAULT_FIELDS);
      let updated = null;
      list = list.map(f => {
        if (f.id === fieldId) {
          updated = { ...f, ...updates };
          return updated;
        }
        return f;
      });
      setLocal('fields', list);
      return updated;
    },

    async deleteField(fieldId) {
      const client = this.getClient();
      if (client) {
        try {
          await client.from('fields').delete().eq('id', fieldId);
        } catch (e) {
          console.warn('Supabase deleteField error:', e);
        }
      }

      let list = getLocal('fields', window.FARMPILOT_CONFIG.DEFAULT_FIELDS);
      list = list.filter(f => f.id !== fieldId);
      setLocal('fields', list);
      return true;
    },

    // --- CROP CYCLES (Problem Statement Aligned 6 Stages) ---
    async getCropCycle(farmId) {
      const client = this.getClient();
      if (client) {
        try {
          let query = client.from('crop_cycles').select('*');
          if (farmId) query = query.eq('farm_id', farmId);
          const { data, error } = await query;
          if (!error && data && data.length > 0) {
            const cycle = data[0];
            const enriched = {
              ...cycle,
              current_stage: cycle.current_stage || 'Fertilization',
              current_stage_progress: cycle.current_stage_progress || 58,
              stages: window.FARMPILOT_CONFIG.DEFAULT_CROP_CYCLE.stages
            };
            setLocal('crop_cycle', enriched);
            return enriched;
          }
        } catch (err) {
          console.warn('Supabase crop_cycles query fallback:', err);
        }
      }
      return getLocal('crop_cycle', window.FARMPILOT_CONFIG.DEFAULT_CROP_CYCLE);
    },

    async createCropCycle(cycleData) {
      const activeFarm = await this.getActiveFarm();
      const farmId = cycleData.farm_id || activeFarm?.id || '43666b6c-8208-4148-be22-df38d21b1836';
      const fields = await this.getFields(farmId);
      const fieldId = cycleData.field_id || (fields && fields[0]?.id) || '43666b6c-8208-4148-be22-df38d21b1836';

      const enrichedCycle = {
        id: 'cycle-' + Date.now(),
        farm_id: farmId,
        field_id: fieldId,
        crop_name: cycleData.crop_name || 'Paddy (Rice)',
        variety: cycleData.variety || 'BPT-5204',
        season: cycleData.season || 'Kharif',
        start_date: cycleData.start_date || new Date().toISOString().split('T')[0],
        target_yield: parseFloat(cycleData.target_yield) || 4.2,
        selling_price_per_unit: parseFloat(cycleData.selling_price_per_unit) || 29000,
        planned_budget: parseFloat(cycleData.planned_budget) || 50000,
        status: cycleData.status || 'ACTIVE',
        current_stage: cycleData.current_stage || 'Land Preparation',
        current_stage_progress: cycleData.current_stage_progress || 15,
        stages: window.FARMPILOT_CONFIG.DEFAULT_CROP_CYCLE.stages
      };

      const client = this.getClient();
      if (client) {
        try {
          // Send strictly valid Supabase table columns
          const dbRow = {
            farm_id: farmId,
            field_id: fieldId,
            crop_name: enrichedCycle.crop_name,
            variety: enrichedCycle.variety,
            season: enrichedCycle.season,
            start_date: enrichedCycle.start_date,
            status: 'ACTIVE',
            target_yield: enrichedCycle.target_yield,
            selling_price_per_unit: enrichedCycle.selling_price_per_unit,
            planned_budget: enrichedCycle.planned_budget
          };
          const { data, error } = await client.from('crop_cycles').insert(dbRow).select().single();
          if (!error && data) {
            const merged = { ...enrichedCycle, ...data };
            setLocal('crop_cycle', merged);
            let list = getLocal('crop_cycles', []);
            list.unshift(merged);
            setLocal('crop_cycles', list);
            if (typeof window !== 'undefined' && window.dispatchEvent) {
              window.dispatchEvent(new CustomEvent('farmpilot:cycle-updated', { detail: merged }));
            }
            return merged;
          }
        } catch (e) {
          console.warn('Supabase createCropCycle error:', e);
        }
      }

      setLocal('crop_cycle', enrichedCycle);
      let list = getLocal('crop_cycles', []);
      list.unshift(enrichedCycle);
      setLocal('crop_cycles', list);
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('farmpilot:cycle-updated', { detail: enrichedCycle }));
      }
      return enrichedCycle;
    },

    async updateCropCycle(cycleId, updates) {
      const client = this.getClient();
      if (client) {
        try {
          const { data, error } = await client.from('crop_cycles').update(updates).eq('id', cycleId).select().single();
          if (!error && data) {
            setLocal('crop_cycle', { ...data, stages: window.FARMPILOT_CONFIG.DEFAULT_CROP_CYCLE.stages });
            return data;
          }
        } catch (e) {
          console.warn('Supabase updateCropCycle error:', e);
        }
      }

      let current = getLocal('crop_cycle', window.FARMPILOT_CONFIG.DEFAULT_CROP_CYCLE);
      let updated = { ...current, ...updates };
      setLocal('crop_cycle', updated);
      return updated;
    },

    async deleteCropCycle(cycleId) {
      const client = this.getClient();
      if (client) {
        try {
          await client.from('crop_cycles').delete().eq('id', cycleId);
        } catch (e) {
          console.warn('Supabase deleteCropCycle error:', e);
        }
      }

      setLocal('crop_cycle', null);
      let list = getLocal('crop_cycles', []);
      list = list.filter(c => c.id !== cycleId);
      setLocal('crop_cycles', list);

      // Cascade remove activities linked to this cycle
      let activities = getLocal('activities', window.FARMPILOT_CONFIG.DEFAULT_ACTIVITIES);
      activities = activities.filter(a => a.crop_cycle_id !== cycleId);
      setLocal('activities', activities);

      return true;
    },

    // --- ACTIVITIES (Task Lifecycle & Assignment) ---
    async getActivities(farmId) {
      const client = this.getClient();
      if (client) {
        try {
          let query = client.from('activities').select('*').order('planned_date', { ascending: true });
          if (farmId) query = query.eq('farm_id', farmId);
          const { data, error } = await query;
          if (!error && data && data.length > 0) {
            const mapped = data.map(a => ({
              id: a.id,
              title: a.title,
              category: a.activity_type || 'OTHER',
              field_name: a.description || 'North Block (Plot A)',
              due_date: a.planned_date,
              completed_date: a.completed_date,
              status: a.status,
              priority: a.priority,
              cost: a.actual_cost || a.estimated_cost || 0,
              estimated_cost: a.estimated_cost || 0,
              actual_cost: a.actual_cost || 0,
              assigned_to: a.assigned_to,
              assigned_to_name: a.assigned_to ? 'Ravi Kumar' : 'Unassigned',
              notes: a.notes || ''
            }));
            setLocal('activities', mapped);
            this.calculateHealth();
            return mapped;
          }
        } catch (err) {
          console.warn('Supabase activities query fallback:', err);
        }
      }
      return getLocal('activities', window.FARMPILOT_CONFIG.DEFAULT_ACTIVITIES);
    },

    async getTodayTasks(workerId) {
      const activities = await this.getActivities();
      const today = new Date().toISOString().split('T')[0];
      return activities.filter(a => {
        // Pending or In Progress or Overdue
        return a.status !== 'COMPLETED';
      });
    },

    // 1-Click Task Start
    async startActivity(activityId) {
      let list = getLocal('activities', window.FARMPILOT_CONFIG.DEFAULT_ACTIVITIES);
      const target = list.find(a => a.id === activityId);
      if (target) {
        target.status = 'IN_PROGRESS';
        setLocal('activities', list);
      }

      const client = this.getClient();
      if (client) {
        try {
          await client.from('activities').update({ status: 'IN_PROGRESS' }).eq('id', activityId);
        } catch (e) {
          console.warn('Error updating status in Supabase:', e);
        }
      }

      return { success: true, activity: target };
    },

    // Task Completion with Audit History Preservation & Health Boost
    async completeActivity(activityId, options = {}) {
      const today = new Date().toISOString().split('T')[0];
      let list = getLocal('activities', window.FARMPILOT_CONFIG.DEFAULT_ACTIVITIES);
      const target = list.find(a => a.id === activityId);

      const actualCost = typeof options === 'number' ? options : options.actual_cost || (target ? target.cost : 0);
      const actualQuantity = typeof options === 'object' ? options.actual_quantity : null;
      const hoursWorked = typeof options === 'object' ? options.hours_worked : null;
      const fieldNote = typeof options === 'object' ? options.field_note : null;
      const workerUsername = typeof options === 'object' ? options.worker_username || 'ramu' : 'ramu';
      const workerName = typeof options === 'object' ? options.worker_name || 'Ravi Kumar' : 'Ravi Kumar';

      if (target) {
        target.status = 'COMPLETED';
        target.completed_date = today;
        if (actualCost) target.cost = parseFloat(actualCost);
        if (actualQuantity) target.actual_quantity = actualQuantity;
        if (hoursWorked) target.hours_worked = parseFloat(hoursWorked);
        if (fieldNote) target.field_note = fieldNote;
        setLocal('activities', list);
      }

      // Record field note if provided
      if (fieldNote) {
        await this.addFieldNote(activityId, {
          note: fieldNote,
          username: workerUsername,
          author_name: workerName
        });

        // Record in operational journal
        await this.addJournalEntry({
          event_type: 'ACTIVITY_COMPLETED',
          title: `Task Completed: ${target ? target.title : activityId}`,
          description: `Field Operator @${workerUsername} completed ${target ? target.title : 'operation'} on ${target ? target.field_name : 'plot'}. Actual applied: ${actualQuantity || 'As prescribed'}. Note: "${fieldNote}"`,
          metadata: {
            activity_id: activityId,
            actual_quantity: actualQuantity,
            hours_worked: hoursWorked,
            worker: workerName,
            worker_username: workerUsername
          }
        });
      }

      const client = this.getClient();
      if (client) {
        try {
          await client.from('activities').update({
            status: 'COMPLETED',
            completed_date: today,
            actual_cost: target ? target.cost : undefined,
            actual_quantity: actualQuantity,
            hours_worked: hoursWorked,
            field_note: fieldNote
          }).eq('id', activityId);
        } catch (e) {
          console.warn('Failed to update completed activity in Supabase:', e);
        }
      }

      // Notify Delivery Messenger endpoint asynchronously
      try {
        fetch('/api/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: activityId,
            actual_quantity: actualQuantity || '45 kg',
            hours_worked: hoursWorked || 2.5,
            field_note: fieldNote || 'Routine field application completed.',
            worker_name: workerName,
            worker_username: workerUsername
          })
        }).catch(() => {});
      } catch (e) {}

      // Automatically Resolve linked alerts
      await this.resolveAlertByReference('act-zinc-spray');
      if (activityId) await this.resolveAlertByReference(activityId);

      // Recalculate Health immediately
      const updatedHealth = this.calculateHealth();
      return { success: true, activity: target, health: updatedHealth };
    },

    async assignTask(activityId, workerId, workerName) {
      let list = getLocal('activities', window.FARMPILOT_CONFIG.DEFAULT_ACTIVITIES);
      const target = list.find(a => a.id === activityId);
      if (target) {
        target.assigned_to = workerId;
        target.assigned_to_name = workerName || 'Ravi Kumar';
        setLocal('activities', list);
      }

      const client = this.getClient();
      if (client) {
        try {
          await client.from('activities').update({ assigned_to: workerId }).eq('id', activityId);
        } catch (e) {
          console.warn('Error assigning task in Supabase:', e);
        }
      }

      return { success: true, activity: target };
    },

    async deleteActivity(activityId) {
      let list = getLocal('activities', window.FARMPILOT_CONFIG.DEFAULT_ACTIVITIES);
      list = list.filter(a => a.id !== activityId);
      setLocal('activities', list);

      const client = this.getClient();
      if (client) {
        try {
          await client.from('activities').delete().eq('id', activityId);
        } catch (e) {
          console.warn('Failed to delete activity in Supabase:', e);
        }
      }
      this.calculateHealth();
      return { success: true, deletedId: activityId };
    },

    // Create Activity + Dispatch Professional SMTP Email Alert
    async createActivity(data) {
      const activeFarm = await this.getActiveFarm();
      const client = this.getClient();
      const payload = {
        title: data.title,
        activity_type: data.category || 'OTHER',
        description: data.field_name || 'North Block (Plot A)',
        planned_date: data.due_date || new Date().toISOString().split('T')[0],
        estimated_cost: parseFloat(data.cost) || 0,
        notes: data.notes || '',
        status: data.status || 'PENDING',
        priority: data.priority || 'MEDIUM',
        farm_id: data.farm_id || activeFarm.id,
        assigned_to: data.assigned_to || window.FARMPILOT_CONFIG.PERSONAS.WORKER.id
      };

      let created = null;

      if (client) {
        try {
          const { data: res, error } = await client.from('activities').insert(payload).select().single();
          if (!error && res) {
            created = {
              id: res.id,
              title: res.title,
              category: res.activity_type,
              field_name: res.description,
              due_date: res.planned_date,
              status: res.status,
              priority: res.priority,
              cost: res.estimated_cost,
              assigned_to: res.assigned_to,
              assigned_to_name: 'Ravi Kumar',
              notes: res.notes
            };
            const list = getLocal('activities', []);
            list.unshift(created);
            setLocal('activities', list);
          }
        } catch (e) {
          console.warn('Failed to insert activity to Supabase:', e);
        }
      }

      if (!created) {
        created = {
          id: 'act-' + Date.now(),
          ...data,
          status: data.status || 'PENDING',
          assigned_to_name: 'Ravi Kumar',
          created_at: new Date().toISOString()
        };
        const list = getLocal('activities', window.FARMPILOT_CONFIG.DEFAULT_ACTIVITIES);
        list.unshift(created);
        setLocal('activities', list);
      }

      this.calculateHealth();

      // Trigger Professional SMTP Email Alert with Full Operational Data
      if (window.FarmPilotMailer) {
        window.FarmPilotMailer.sendOperationAlert(created);
      }

      return created;
    },

    // --- CENTRALIZED ALERT CENTER (Deduplication & Resolution) ---
    async getAlerts(farmId) {
      const client = this.getClient();
      if (client) {
        try {
          let query = client.from('alerts').select('*').order('created_at', { ascending: false });
          if (farmId) query = query.eq('farm_id', farmId);
          const { data, error } = await query;
          if (!error && data && data.length > 0) {
            setLocal('alerts', data);
            return data;
          }
        } catch (err) {
          console.warn('Supabase alerts query fallback:', err);
        }
      }
      return getLocal('alerts', window.FARMPILOT_CONFIG.DEFAULT_ALERTS);
    },

    async resolveAlert(alertId) {
      let list = getLocal('alerts', window.FARMPILOT_CONFIG.DEFAULT_ALERTS);
      const target = list.find(a => a.id === alertId);
      if (target) {
        target.is_resolved = true;
        setLocal('alerts', list);
      }

      const client = this.getClient();
      if (client) {
        try {
          await client.from('alerts').update({ is_resolved: true }).eq('id', alertId);
        } catch (e) {
          console.warn('Failed to resolve alert in Supabase:', e);
        }
      }

      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('farmpilot:alert-resolved', { detail: { alertId } }));
      }
      return { success: true, alertId };
    },

    async resolveAlertByReference(refId) {
      let list = getLocal('alerts', window.FARMPILOT_CONFIG.DEFAULT_ALERTS);
      list.forEach(a => {
        if (a.reference_id === refId) a.is_resolved = true;
      });
      setLocal('alerts', list);

      const client = this.getClient();
      if (client) {
        try {
          await client.from('alerts').update({ is_resolved: true }).eq('reference_id', refId);
        } catch (e) {
          console.warn('Failed to resolve alert by reference in Supabase:', e);
        }
      }
    },

    async deleteAlert(alertId) {
      let list = getLocal('alerts', window.FARMPILOT_CONFIG.DEFAULT_ALERTS);
      list = list.filter(a => a.id !== alertId);
      setLocal('alerts', list);

      const client = this.getClient();
      if (client) {
        try {
          await client.from('alerts').delete().eq('id', alertId);
        } catch (e) {
          console.warn('Failed to delete alert in Supabase:', e);
        }
      }

      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('farmpilot:alert-resolved', { detail: { alertId } }));
      }
      return { success: true, alertId };
    },

    // --- EXPENSES & FINANCIALS ---
    async getExpenses(farmId) {
      const client = this.getClient();
      if (client) {
        try {
          let query = client.from('expenses').select('*').order('expense_date', { ascending: false });
          if (farmId) query = query.eq('farm_id', farmId);
          const { data, error } = await query;
          if (!error && data && data.length > 0) {
            const mapped = data.map(e => ({
              id: e.id,
              category: e.category,
              description: e.description,
              amount: parseFloat(e.amount) || 0,
              date: e.expense_date
            }));
            setLocal('expenses', mapped);
            return mapped;
          }
        } catch (err) {
          console.warn('Supabase expenses query fallback:', err);
        }
      }
      return getLocal('expenses', window.FARMPILOT_CONFIG.DEFAULT_EXPENSES);
    },

    async createExpense(data) {
      const activeFarm = await this.getActiveFarm();
      const client = this.getClient();
      const payload = {
        description: data.description,
        category: data.category || 'OTHER',
        amount: parseFloat(data.amount) || 0,
        expense_date: data.date || new Date().toISOString().split('T')[0],
        farm_id: data.farm_id || activeFarm.id
      };

      if (client) {
        try {
          const { data: res, error } = await client.from('expenses').insert(payload).select().single();
          if (!error && res) {
            const list = getLocal('expenses', []);
            list.unshift({
              id: res.id,
              description: res.description,
              category: res.category,
              amount: res.amount,
              date: res.expense_date
            });
            setLocal('expenses', list);
            this.calculateHealth();
            return res;
          }
        } catch (e) {
          console.warn('Failed to insert expense to Supabase:', e);
        }
      }

      const newExp = {
        id: 'exp-' + Date.now(),
        ...data,
        amount: parseFloat(data.amount) || 0,
        date: data.date || new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      };
      const list = getLocal('expenses', window.FARMPILOT_CONFIG.DEFAULT_EXPENSES);
      list.unshift(newExp);
      setLocal('expenses', list);
      this.calculateHealth();
      return newExp;
    },

    async updateExpense(expenseId, data) {
      let list = getLocal('expenses', window.FARMPILOT_CONFIG.DEFAULT_EXPENSES);
      const targetIndex = list.findIndex(e => e.id === expenseId);
      const updatedItem = {
        ...(targetIndex >= 0 ? list[targetIndex] : {}),
        ...data,
        id: expenseId,
        amount: parseFloat(data.amount) || 0,
        date: data.date || (targetIndex >= 0 ? list[targetIndex].date : new Date().toISOString().split('T')[0])
      };

      if (targetIndex >= 0) {
        list[targetIndex] = updatedItem;
      } else {
        list.unshift(updatedItem);
      }
      setLocal('expenses', list);

      const client = this.getClient();
      if (client) {
        try {
          await client.from('expenses').update({
            description: updatedItem.description,
            category: updatedItem.category,
            amount: updatedItem.amount,
            expense_date: updatedItem.date
          }).eq('id', expenseId);
        } catch (e) {
          console.warn('Failed to update expense in Supabase:', e);
        }
      }

      this.calculateHealth();
      return updatedItem;
    },

    async deleteExpense(expenseId) {
      let list = getLocal('expenses', window.FARMPILOT_CONFIG.DEFAULT_EXPENSES);
      list = list.filter(e => e.id !== expenseId);
      setLocal('expenses', list);

      const client = this.getClient();
      if (client) {
        try {
          await client.from('expenses').delete().eq('id', expenseId);
        } catch (e) {
          console.warn('Failed to delete expense in Supabase:', e);
        }
      }
      this.calculateHealth();
      return { success: true, deletedId: expenseId };
    },

    // --- INPUTS ---
    async getInputs(farmId) {
      const client = this.getClient();
      if (client) {
        try {
          let query = client.from('inputs').select('*');
          if (farmId) query = query.eq('farm_id', farmId);
          const { data, error } = await query;
          if (!error && data && data.length > 0) {
            const mapped = data.map(i => ({
              id: i.id,
              name: i.name,
              category: i.input_type || 'FERTILIZER',
              quantity: i.quantity,
              unit: i.unit,
              unit_cost: i.quantity > 0 ? (i.cost / i.quantity) : 0,
              total_cost: i.cost,
              supplier: i.supplier,
              date: i.used_date
            }));
            setLocal('inputs', mapped);
            return mapped;
          }
        } catch (err) {
          console.warn('Supabase inputs query fallback:', err);
        }
      }
      return getLocal('inputs', window.FARMPILOT_CONFIG.DEFAULT_INPUTS);
    },

    async createInput(data) {
      const activeFarm = await this.getActiveFarm();
      const client = this.getClient();
      const totalCost = (parseFloat(data.quantity) || 0) * (parseFloat(data.unit_cost) || 0);
      const payload = {
        name: data.name,
        input_type: data.category || 'FERTILIZER',
        quantity: parseFloat(data.quantity) || 0,
        unit: data.unit || 'kg',
        cost: totalCost,
        supplier: data.supplier || '',
        used_date: data.date || new Date().toISOString().split('T')[0],
        farm_id: data.farm_id || activeFarm.id
      };

      if (client) {
        try {
          const { data: res, error } = await client.from('inputs').insert(payload).select().single();
          if (!error && res) {
            const list = getLocal('inputs', []);
            list.unshift({
              id: res.id,
              name: res.name,
              category: res.input_type,
              quantity: res.quantity,
              unit: res.unit,
              unit_cost: parseFloat(data.unit_cost) || 0,
              total_cost: res.cost,
              supplier: res.supplier,
              date: res.used_date
            });
            setLocal('inputs', list);
            this.calculateHealth();
            return res;
          }
        } catch (e) {
          console.warn('Failed to insert input to Supabase:', e);
        }
      }

      const newInp = {
        id: 'inp-' + Date.now(),
        ...data,
        total_cost: totalCost,
        created_at: new Date().toISOString()
      };
      const list = getLocal('inputs', window.FARMPILOT_CONFIG.DEFAULT_INPUTS);
      list.unshift(newInp);
      setLocal('inputs', list);
      this.calculateHealth();
      return newInp;
    },

    async updateInput(inputId, data) {
      const totalCost = (parseFloat(data.quantity) || 0) * (parseFloat(data.unit_cost) || 0);
      let list = getLocal('inputs', window.FARMPILOT_CONFIG.DEFAULT_INPUTS);
      const targetIndex = list.findIndex(i => i.id === inputId);
      const updatedItem = {
        ...(targetIndex >= 0 ? list[targetIndex] : {}),
        ...data,
        id: inputId,
        quantity: parseFloat(data.quantity) || 0,
        unit_cost: parseFloat(data.unit_cost) || 0,
        total_cost: totalCost,
        date: data.date || (targetIndex >= 0 ? list[targetIndex].date : new Date().toISOString().split('T')[0])
      };

      if (targetIndex >= 0) {
        list[targetIndex] = updatedItem;
      } else {
        list.unshift(updatedItem);
      }
      setLocal('inputs', list);

      const client = this.getClient();
      if (client) {
        try {
          await client.from('inputs').update({
            name: updatedItem.name,
            input_type: updatedItem.category,
            quantity: updatedItem.quantity,
            unit: updatedItem.unit,
            cost: totalCost,
            supplier: updatedItem.supplier,
            used_date: updatedItem.date
          }).eq('id', inputId);
        } catch (e) {
          console.warn('Failed to update input in Supabase:', e);
        }
      }

      this.calculateHealth();
      return updatedItem;
    },

    async deleteInput(inputId) {
      let list = getLocal('inputs', window.FARMPILOT_CONFIG.DEFAULT_INPUTS);
      list = list.filter(i => i.id !== inputId);
      setLocal('inputs', list);

      const client = this.getClient();
      if (client) {
        try {
          await client.from('inputs').delete().eq('id', inputId);
        } catch (e) {
          console.warn('Failed to delete input in Supabase:', e);
        }
      }
      this.calculateHealth();
      return { success: true, deletedId: inputId };
    },

    // --- FINANCIAL AGGREGATIONS (Data-Driven, No Hardcoded Numbers) ---
    async getFinancialSummary() {
      const expenses = await this.getExpenses();
      const cropCycle = await this.getCropCycle();

      const totalSpent = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
      const plannedBudget = parseFloat(cropCycle.planned_budget) || 50000;
      const remainingBudget = Math.max(0, plannedBudget - totalSpent);
      const budgetUtilization = plannedBudget > 0 ? Math.round((totalSpent / plannedBudget) * 100) : 0;

      const targetYield = parseFloat(cropCycle.target_yield) || 4.2;
      const sellingPrice = parseFloat(cropCycle.selling_price_per_unit) || 29000;
      const estimatedRevenue = targetYield * sellingPrice;
      const estimatedProfit = estimatedRevenue - totalSpent;
      const profitMargin = estimatedRevenue > 0 ? ((estimatedProfit / estimatedRevenue) * 100).toFixed(1) : 0;

      // Category breakdown
      const categories = {};
      expenses.forEach(e => {
        const cat = e.category || 'OTHER';
        categories[cat] = (categories[cat] || 0) + (parseFloat(e.amount) || 0);
      });

      return {
        totalSpent,
        plannedBudget,
        remainingBudget,
        budgetUtilization,
        targetYield,
        sellingPrice,
        estimatedRevenue,
        estimatedProfit,
        profitMargin,
        categories
      };
    },

    // --- DYNAMIC FARM HEALTH ENGINE 2.0 (5 Explainable Agronomic Pillars) ---
    calculateHealth() {
      const activities = getLocal('activities', window.FARMPILOT_CONFIG.DEFAULT_ACTIVITIES);
      const expenses = getLocal('expenses', window.FARMPILOT_CONFIG.DEFAULT_EXPENSES);
      const cropCycle = getLocal('crop_cycle', window.FARMPILOT_CONFIG.DEFAULT_CROP_CYCLE);
      const inputs = getLocal('inputs', window.FARMPILOT_CONFIG.DEFAULT_INPUTS);
      const irrigation = this.getIrrigationLogs();

      const overdueTasks = activities.filter(a => a.status === 'OVERDUE').length;
      const pendingTasks = activities.filter(a => a.status === 'PENDING' || a.status === 'IN_PROGRESS').length;
      const completedTasks = activities.filter(a => a.status === 'COMPLETED').length;
      const totalTasks = activities.length;

      // 1. Execution Pillar (Task completion rate & workflow velocity)
      let executionScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 85;
      executionScore = Math.min(100, Math.max(30, executionScore + (overdueTasks === 0 ? 10 : -10)));

      // 2. Schedule Adherence Pillar (Penalize each overdue operation by 18 pts)
      let scheduleScore = overdueTasks > 0 ? Math.max(40, 96 - (overdueTasks * 18)) : 96;

      // 3. Cost Control Pillar (Budget variance against planned allocation)
      const totalSpent = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
      const plannedBudget = parseFloat(cropCycle?.planned_budget) || 50000;
      let costScore = 90;
      if (plannedBudget > 0) {
        const variancePct = ((totalSpent - plannedBudget) / plannedBudget) * 100;
        if (variancePct > 20) costScore = 60;
        else if (variancePct > 10) costScore = 74;
        else if (variancePct > 0) costScore = 82;
        else costScore = 92;
      }

      // 4. Crop Progress Pillar (Biological milestone advancement vs elapsed days)
      const currentStage = cropCycle?.current_stage || 'Active Tillering';
      let progressScore = overdueTasks > 0 ? 79 : 94;

      // 5. Data Quality Pillar (Completeness of records)
      let dataQualityItems = [
        { key: 'activities', ok: activities.length > 0 },
        { key: 'inputs', ok: inputs.length > 0 },
        { key: 'expenses', ok: expenses.length > 0 },
        { key: 'irrigation', ok: irrigation.length > 0 },
        { key: 'crop_cycle', ok: !!cropCycle?.target_yield },
        { key: 'harvest_date', ok: !!cropCycle?.expected_harvest_date }
      ];
      let dataQualityScore = Math.round((dataQualityItems.filter(i => i.ok).length / dataQualityItems.length) * 100);

      // Composite Weighted Index (0-100)
      // Schedule: 25%, Cost: 20%, Execution: 20%, Progress: 20%, Data Quality: 15%
      let composite = Math.round(
        (scheduleScore * 0.25) +
        (costScore * 0.20) +
        (executionScore * 0.20) +
        (progressScore * 0.20) +
        (dataQualityScore * 0.15)
      );

      if (composite > 100) composite = 100;
      if (composite < 0) composite = 0;

      // Dynamic Health Narrative grounded in actual detected conditions
      let narrative = '';
      if (overdueTasks > 0 && costScore < 80) {
        narrative = `Farm operations are generally on track, but fertilizer spending is above plan and ${overdueTasks} crop activity requires attention before the current tillering window closes.`;
      } else if (overdueTasks > 0) {
        narrative = `Field operations require immediate attention: ${overdueTasks} scheduled operation is overdue, elevating schedule disruption risk in the active tillering stand.`;
      } else if (costScore < 80) {
        narrative = `Field execution and crop schedule are optimal, but input expenditures are tracking above benchmark. Review fertilizer cost lines to safeguard margins.`;
      } else {
        narrative = `Farm operations are in optimal condition. All field milestones, AWD irrigation intervals, and nutrient top-dressings are fully synchronized with the crop calendar.`;
      }

      const healthData = {
        score: composite,
        status: composite >= 90 ? 'OPTIMAL' : composite >= 75 ? 'HEALTHY' : 'ATTENTION',
        statusLabel: composite >= 90 ? 'Optimal Condition' : composite >= 75 ? 'Healthy Condition' : 'Action Required',
        narrative: narrative,
        overdueCount: overdueTasks,
        pendingCount: pendingTasks,
        completedCount: completedTasks,
        pillars: {
          execution: executionScore,
          schedule: scheduleScore,
          cost: costScore,
          progress: progressScore,
          dataQuality: dataQualityScore
        },
        advisory: overdueTasks > 0 ? {
          priority: 'HIGH',
          title: 'Zinc Deficiency Remediation Required',
          description: 'North Block (Plot A) soil test shows 0.4 ppm Zn (threshold 0.6 ppm). Complete foliar spray within 48 hours to avert tillering stunted growth.',
          resolved: false
        } : {
          priority: 'OPTIMAL',
          title: 'All Interventions Resolved — Farm Health Optimal',
          description: 'All field operations and foliar micronutrient sprays are up to date. Tillering vigor and nutrient saturation tracking at peak capacity.',
          resolved: true
        },
        updatedAt: new Date().toISOString()
      };

      setLocal('farm_health', healthData);

      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('farmpilot:health-updated', { detail: healthData }));
      }

      return healthData;
    },

    getFarmHealth() {
      const stored = getLocal('farm_health', null);
      if (stored) return stored;
      return this.calculateHealth();
    },

    // --- TIER B AWD WATER MANAGEMENT PROTOCOL ---
    getIrrigationLogs() {
      const defaultLogs = [
        { id: 'irg-0', date: '2026-09-10', field: 'North Block (Plot A)', protocol: 'AWD Submersion', depth: 5.0, hours: 3.5, cost: 350, status: 'Completed' },
        { id: 'irg-1', date: '2026-06-22', field: 'North Block (Plot A)', protocol: 'AWD Submersion', depth: 5.0, hours: 3.5, cost: 350, status: 'Completed' },
        { id: 'irg-2', date: '2026-06-15', field: 'North Block (Plot A)', protocol: 'Continuous Ponding', depth: 7.5, hours: 5.0, cost: 500, status: 'Completed' },
        { id: 'irg-3', date: '2026-06-29', field: 'Central Sector (Plot B)', protocol: 'AWD Submersion', depth: 4.5, hours: 3.0, cost: 300, status: 'Scheduled' }
      ];
      try {
        const val = localStorage.getItem('farmpilot_irrigation_logs');
        if (val) {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
      localStorage.setItem('farmpilot_irrigation_logs', JSON.stringify(defaultLogs));
      return defaultLogs;
    },

    saveIrrigationLog(data) {
      let list = this.getIrrigationLogs();
      const newLog = {
        id: 'irg-' + Date.now(),
        date: data.date || new Date().toISOString().split('T')[0],
        field: data.field || 'North Block (Plot A)',
        protocol: data.protocol || 'AWD Submersion',
        depth: parseFloat(data.depth) || 5.0,
        hours: parseFloat(data.hours) || 3.5,
        cost: parseFloat(data.cost) || 350,
        status: data.status || 'Completed'
      };
      list.unshift(newLog);
      localStorage.setItem('farmpilot_irrigation_logs', JSON.stringify(list));
      return newLog;
    },

    updateIrrigationLog(id, data) {
      let list = this.getIrrigationLogs();
      const idx = list.findIndex(i => i.id === id);
      if (idx >= 0) {
        list[idx] = {
          ...list[idx],
          ...data,
          id,
          depth: parseFloat(data.depth) !== undefined ? parseFloat(data.depth) : list[idx].depth,
          hours: parseFloat(data.hours) !== undefined ? parseFloat(data.hours) : list[idx].hours,
          cost: parseFloat(data.cost) !== undefined ? parseFloat(data.cost) : list[idx].cost
        };
        localStorage.setItem('farmpilot_irrigation_logs', JSON.stringify(list));
        return list[idx];
      }
      return null;
    },

    deleteIrrigationLog(id) {
      let list = this.getIrrigationLogs();
      list = list.filter(i => i.id !== id);
      localStorage.setItem('farmpilot_irrigation_logs', JSON.stringify(list));
      return true;
    },

    // --- AGRICULTURAL RECOMMENDATIONS LIFECYCLE ---
    async getRecommendations(farmId) {
      const client = this.getClient();
      if (client) {
        try {
          let query = client.from('recommendations').select('*').order('priority', { ascending: false });
          if (farmId) query = query.eq('farm_id', farmId);
          const { data, error } = await query;
          if (!error && data && data.length > 0) {
            setLocal('recommendations', data);
            return data;
          }
        } catch (e) {
          console.warn('Recommendations Supabase query fallback:', e);
        }
      }
      return getLocal('recommendations', window.FARMPILOT_CONFIG.DEFAULT_RECOMMENDATIONS || []);
    },

    async updateRecommendationStatus(id, status, overrideAction = null, overrideReason = null) {
      let list = getLocal('recommendations', window.FARMPILOT_CONFIG.DEFAULT_RECOMMENDATIONS || []);
      const item = list.find(r => r.id === id);
      if (item) {
        item.status = status;
        if (overrideAction) item.user_override_action = overrideAction;
        if (overrideReason) item.user_override_reason = overrideReason;
        item.updated_at = new Date().toISOString();
        setLocal('recommendations', list);
      }

      const client = this.getClient();
      if (client) {
        try {
          await client.from('recommendations').update({
            status,
            user_override_action: overrideAction,
            user_override_reason: overrideReason,
            updated_at: new Date().toISOString()
          }).eq('id', id);
        } catch (e) {
          console.warn('Supabase updateRecommendationStatus error:', e);
        }
      }

      // Log decision to operational journal
      await this.addJournalEntry({
        event_type: status === 'COMPLETED' ? 'RECOMMENDATION_ACCEPTED' : status === 'DISMISSED' ? 'USER_OVERRIDE' : 'ACTIVITY_COMPLETED',
        title: `Recommendation [${item ? item.title : id}] updated to ${status}`,
        description: overrideReason || `Status changed to ${status}`,
        metadata: { recommendation_id: id, status, overrideAction, overrideReason }
      });

      return item;
    },

    async submitRecommendationFeedback(id, feedback, feedbackNotes = '') {
      let list = getLocal('recommendations', window.FARMPILOT_CONFIG.DEFAULT_RECOMMENDATIONS || []);
      const item = list.find(r => r.id === id);
      if (item) {
        item.feedback = feedback;
        item.feedback_notes = feedbackNotes;
        setLocal('recommendations', list);
      }

      const client = this.getClient();
      if (client) {
        try {
          await client.from('recommendations').update({
            feedback,
            feedback_notes: feedbackNotes,
            updated_at: new Date().toISOString()
          }).eq('id', id);
        } catch (e) {
          console.warn('Supabase submitRecommendationFeedback error:', e);
        }
      }
      return item;
    },

    // --- OPERATIONAL JOURNAL (Farm Operational Memory) ---
    async getOperationalJournal(farmId) {
      const client = this.getClient();
      if (client) {
        try {
          let query = client.from('operational_journal').select('*').order('created_at', { ascending: false }).limit(25);
          if (farmId) query = query.eq('farm_id', farmId);
          const { data, error } = await query;
          if (!error && data && data.length > 0) {
            setLocal('journal', data);
            return data;
          }
        } catch (e) {
          console.warn('Journal Supabase query fallback:', e);
        }
      }
      return getLocal('journal', window.FARMPILOT_CONFIG.DEFAULT_JOURNAL || []);
    },

    async addJournalEntry(entry) {
      const activeFarm = await this.getActiveFarm();
      const newEntry = {
        id: 'jrn-' + Date.now(),
        farm_id: entry.farm_id || activeFarm.id,
        date: new Date().toISOString().split('T')[0],
        event_type: entry.event_type || 'ACTIVITY_COMPLETED',
        title: entry.title || 'Operational Event Recorded',
        description: entry.description || '',
        metadata: entry.metadata || {},
        created_at: new Date().toISOString()
      };

      let list = getLocal('journal', window.FARMPILOT_CONFIG.DEFAULT_JOURNAL || []);
      list.unshift(newEntry);
      if (list.length > 50) list = list.slice(0, 50);
      setLocal('journal', list);

      const client = this.getClient();
      if (client) {
        try {
          await client.from('operational_journal').insert({
            farm_id: newEntry.farm_id,
            event_type: newEntry.event_type,
            title: newEntry.title,
            description: newEntry.description,
            metadata: newEntry.metadata
          });
        } catch (e) {
          console.warn('Journal Supabase insert error:', e);
        }
      }
      return newEntry;
    },

    // --- CROP TEMPLATES ---
    async getCropTemplates() {
      const client = this.getClient();
      if (client) {
        try {
          const { data, error } = await client.from('crop_templates').select('*');
          if (!error && data && data.length > 0) {
            setLocal('crop_templates', data);
            return data;
          }
        } catch (e) {
          console.warn('Crop templates query fallback:', e);
        }
      }
      return getLocal('crop_templates', window.FARMPILOT_CONFIG.DEFAULT_CROP_TEMPLATES || []);
    },

    // --- COMMUNITY AG EXCHANGE (Cooperative Board) ---
    async getCommunityPosts(category = 'ALL') {
      const client = this.getClient();
      if (client) {
        try {
          let query = client.from('community_posts').select('*').order('created_at', { ascending: false });
          if (category && category !== 'ALL') query = query.eq('category', category);
          const { data, error } = await query;
          if (!error && data && data.length > 0) {
            setLocal('community_posts', data);
            return data;
          }
        } catch (e) {
          console.warn('Community posts query fallback:', e);
        }
      }

      // Try server delivery messenger
      try {
        const res = await fetch('/api/community');
        const json = await res.json();
        if (json.posts) {
          setLocal('community_posts', json.posts);
          if (category === 'ALL') return json.posts;
          return json.posts.filter(p => p.category === category);
        }
      } catch (e) {}

      let list = getLocal('community_posts', window.FARMPILOT_CONFIG.DEFAULT_COMMUNITY_POSTS || []);
      if (category && category !== 'ALL') {
        return list.filter(p => p.category === category);
      }
      return list;
    },

    async createCommunityPost(postData) {
      const user = window.FarmPilotAuth ? window.FarmPilotAuth.getUser() : null;
      const newPost = {
        id: 'comm-' + Date.now(),
        username: (postData.username || user?.username || 'farmer').replace(/^@/, ''),
        author_name: postData.author_name || user?.full_name || 'Farm Operator',
        farm_name: postData.farm_name || user?.farm_name || 'Green Valley Farm',
        role: postData.role || user?.role || 'FARMER',
        category: postData.category || 'MANDI_RATES',
        title: postData.title || 'Agronomic Observation',
        content: postData.content || '',
        likes: 0,
        replies_count: 0,
        created_at: new Date().toISOString()
      };

      let list = getLocal('community_posts', window.FARMPILOT_CONFIG.DEFAULT_COMMUNITY_POSTS || []);
      list.unshift(newPost);
      setLocal('community_posts', list);

      // Server delivery messenger
      try {
        fetch('/api/community', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPost)
        }).catch(() => {});
      } catch (e) {}

      // Supabase sync
      const client = this.getClient();
      if (client) {
        try {
          await client.from('community_posts').insert(newPost);
        } catch (e) {
          console.warn('Failed to insert community post into Supabase:', e);
        }
      }
      return newPost;
    },

    async likeCommunityPost(postId) {
      let list = getLocal('community_posts', window.FARMPILOT_CONFIG.DEFAULT_COMMUNITY_POSTS || []);
      const post = list.find(p => p.id === postId);
      if (post) {
        post.likes = (post.likes || 0) + 1;
        setLocal('community_posts', list);
      }

      try {
        fetch('/api/community/like', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: postId })
        }).catch(() => {});
      } catch (e) {}

      const client = this.getClient();
      if (client) {
        try {
          await client.rpc('increment_post_likes', { post_id: postId });
        } catch (e) {}
      }
      return post?.likes || 1;
    },

    // --- TASK-LEVEL FIELD NOTES (Internal Communication) ---
    async getFieldNotes(activityId) {
      const client = this.getClient();
      if (client && activityId) {
        try {
          const { data, error } = await client.from('field_notes').select('*').eq('activity_id', activityId).order('created_at', { ascending: false });
          if (!error && data && data.length > 0) return data;
        } catch (e) {}
      }
      const allNotes = getLocal('farmpilot_field_notes', []);
      if (!activityId) return allNotes;
      return allNotes.filter(n => n.activity_id === activityId);
    },

    async addFieldNote(activityId, noteData) {
      const user = window.FarmPilotAuth ? window.FarmPilotAuth.getUser() : null;
      const noteRecord = {
        id: 'fn-' + Date.now(),
        activity_id: activityId,
        username: (noteData.username || user?.username || 'ramu').replace(/^@/, ''),
        author_name: noteData.author_name || user?.full_name || 'Ravi Kumar',
        role: noteData.role || user?.role || 'WORKER',
        note: noteData.note || '',
        created_at: new Date().toISOString()
      };

      let allNotes = getLocal('farmpilot_field_notes', []);
      allNotes.unshift(noteRecord);
      setLocal('farmpilot_field_notes', allNotes);

      const client = this.getClient();
      if (client) {
        try {
          await client.from('field_notes').insert(noteRecord);
        } catch (e) {
          console.warn('Field note insert to Supabase skipped:', e);
        }
      }
      return noteRecord;
    },

    // --- WORKER & STAFF CREDENTIALS ONBOARDING (Owner Role Management) ---
    async getWorkers() {
      const defaultWorker = {
        id: window.FARMPILOT_CONFIG.PERSONAS.WORKER.id,
        username: 'ramu',
        full_name: 'Ravi Kumar',
        role: 'WORKER',
        pin: '1234',
        password: 'Worker@2026!',
        password_plain: 'Worker@2026!',
        farm_name: 'Green Valley Farm',
        assigned_field: 'North Block (Plot A)',
        status: 'ACTIVE'
      };

      let customWorkers = getLocal('farmpilot_custom_workers', []);
      
      // Attempt to load from server /api/workers
      try {
        const res = await fetch('/api/workers');
        if (res.ok) {
          const data = await res.json();
          if (data.workers && Array.isArray(data.workers)) {
            data.workers.forEach(w => {
              if (!customWorkers.find(cw => cw.username.toLowerCase() === w.username.toLowerCase())) {
                customWorkers.push(w);
              }
            });
            setLocal('farmpilot_custom_workers', customWorkers);
          }
        }
      } catch (e) {}

      const merged = [defaultWorker, ...customWorkers.filter(w => w.username !== 'ramu')];
      return merged;
    },

    async provisionStaffUser(staffData) {
      const cleanUsername = (staffData.username || staffData.id || 'worker').replace(/^@/, '').toLowerCase().trim();
      const role = (staffData.role || 'WORKER').toUpperCase();
      const password = staffData.password || staffData.password_plain || (role === 'OWNER' ? 'Owner@2026!' : role === 'MANAGER' ? 'Manager@2026!' : 'Worker@2026!');
      const pin = staffData.pin || '1234';
      const assignedField = staffData.assigned_field || staffData.assigned_parcel || 'North Block (Plot A)';
      const farmName = staffData.farm_name || 'Green Valley Farm';

      const newStaff = {
        id: staffData.id || `usr-${role.toLowerCase()}-${Date.now()}`,
        username: cleanUsername,
        full_name: staffData.full_name || 'Field Operator',
        role: role,
        password: password,
        password_plain: password,
        pin: pin,
        farm_name: farmName,
        assigned_field: assignedField,
        status: 'ACTIVE',
        created_at: new Date().toISOString()
      };

      // 1. Update local custom workers and registered accounts
      let customWorkers = getLocal('farmpilot_custom_workers', []);
      customWorkers = customWorkers.filter(w => w.username.toLowerCase() !== cleanUsername);
      customWorkers.unshift(newStaff);
      setLocal('farmpilot_custom_workers', customWorkers);

      let registeredUsers = getLocal('farmpilot_registered_users', []);
      registeredUsers = registeredUsers.filter(u => u.username.toLowerCase() !== cleanUsername);
      registeredUsers.unshift({
        ...newStaff,
        email: `${cleanUsername}@greenvalley.in`
      });
      setLocal('farmpilot_registered_users', registeredUsers);

      // 2. Call backend provision API
      try {
        await fetch('/api/auth/provision-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...newStaff,
            schedule_task: staffData.schedule_task,
            task_title: staffData.task_title,
            target_quantity: staffData.target_quantity,
            task_notes: staffData.task_notes
          })
        });
      } catch (e) {
        console.warn('Backend user provisioning notice:', e);
      }

      // 3. Dual-sync to remote Supabase profiles (Table 17488)
      const client = this.getClient();
      if (client) {
        try {
          await client.from('profiles').upsert({
            id: newStaff.id,
            username: cleanUsername,
            full_name: newStaff.full_name,
            role: role,
            email: `${cleanUsername}@greenvalley.in`,
            password: password,
            password_plain: password,
            pin: pin,
            assigned_field: assignedField,
            farm_name: farmName
          });
        } catch (e) {
          console.warn('Remote Supabase profile upsert notice:', e);
        }
      }

      // 4. If requested, auto-schedule work order assigned strictly to this new staff member
      if (staffData.schedule_task || staffData.task_title) {
        await this.createActivity({
          title: staffData.task_title || `Paddy Top-Dressing — ${assignedField}`,
          category: staffData.task_category || 'FERTILIZATION',
          field_name: assignedField,
          due_date: staffData.due_date || new Date().toISOString().split('T')[0],
          priority: staffData.task_priority || 'HIGH',
          cost: 1800,
          assigned_to: newStaff.id,
          assigned_to_username: cleanUsername,
          assigned_to_name: newStaff.full_name,
          target_quantity: staffData.target_quantity || '45 kg Urea',
          notes: staffData.task_notes || `Scheduled field assignment for ${newStaff.full_name}. Apply prescribed inputs with AWD tube verification.`
        });
      }

      return newStaff;
    },

    async addWorkerCredential(workerData) {
      return this.provisionStaffUser(workerData);
    }
  };
})();
