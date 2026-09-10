/**
 * FarmPilot Supabase Data Service
 * Real-time connection to Supabase backend with offline fallback resilience
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

  // Attempt auto-init immediately
  initSupabase();

  // Local Storage Helper
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

  // Initial Seed from Config if empty
  function ensureSeedData() {
    if (!getLocal('farms', null)) {
      setLocal('farms', [window.FARMPILOT_CONFIG.DEFAULT_FARM]);
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
    if (!getLocal('inputs', null)) {
      setLocal('inputs', window.FARMPILOT_CONFIG.DEFAULT_INPUTS);
    }
    if (!getLocal('expenses', null)) {
      setLocal('expenses', window.FARMPILOT_CONFIG.DEFAULT_EXPENSES);
    }
  }

  ensureSeedData();

  window.FarmPilotDB = {
    init: initSupabase,
    getClient() {
      if (!supabaseClient) initSupabase();
      return supabaseClient;
    },
    
    // --- FARMS ---
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
      return getLocal('farms', [window.FARMPILOT_CONFIG.DEFAULT_FARM]);
    },

    async createFarm(farmData) {
      const user = window.FarmPilotAuth.getUser();
      const newFarm = {
        name: farmData.name,
        location: farmData.location || '',
        district: farmData.district || '',
        state: farmData.state || '',
        total_area: parseFloat(farmData.total_area) || 0,
        area_unit: farmData.area_unit || 'acres',
        description: farmData.description || '',
        owner_id: user?.id || '43666b6c-8208-4148-be22-df38d21b1836'
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
      const list = getLocal('farms', []);
      list.unshift(newFarm);
      setLocal('farms', list);
      return newFarm;
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
      const newField = {
        name: fieldData.name,
        area: parseFloat(fieldData.area) || 0,
        area_unit: fieldData.area_unit || 'acres',
        soil_type: fieldData.soil_type || '',
        irrigation_type: fieldData.irrigation_type || '',
        description: fieldData.description || '',
        farm_id: fieldData.farm_id || window.FARMPILOT_CONFIG.DEFAULT_FARM.id
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
      const list = getLocal('fields', []);
      list.push(newField);
      setLocal('fields', list);
      return newField;
    },

    // --- CROP CYCLES ---
    async getCropCycle(farmId) {
      const client = this.getClient();
      if (client) {
        try {
          let query = client.from('crop_cycles').select('*');
          if (farmId) query = query.eq('farm_id', farmId);
          const { data, error } = await query;
          if (!error && data && data.length > 0) {
            setLocal('crop_cycle', data[0]);
            return data[0];
          }
        } catch (err) {
          console.warn('Supabase crop_cycles query fallback:', err);
        }
      }
      return getLocal('crop_cycle', window.FARMPILOT_CONFIG.DEFAULT_CROP_CYCLE);
    },

    async createCropCycle(cycleData) {
      const newCycle = {
        crop_name: cycleData.crop_name,
        variety: cycleData.variety || '',
        season: cycleData.season || 'Kharif',
        start_date: cycleData.start_date || new Date().toISOString().split('T')[0],
        target_yield: parseFloat(cycleData.target_yield) || 0,
        yield_unit: cycleData.yield_unit || 'tonnes',
        selling_price_per_unit: parseFloat(cycleData.selling_price_per_unit) || 29000,
        planned_budget: parseFloat(cycleData.planned_budget) || 50000,
        farm_id: cycleData.farm_id || window.FARMPILOT_CONFIG.DEFAULT_FARM.id,
        field_id: cycleData.field_id || window.FARMPILOT_CONFIG.DEFAULT_FIELDS[0].id,
        status: 'ACTIVE'
      };

      const client = this.getClient();
      if (client) {
        try {
          const { data, error } = await client.from('crop_cycles').insert(newCycle).select().single();
          if (!error && data) {
            setLocal('crop_cycle', data);
            return data;
          }
        } catch (e) {
          console.warn('Error inserting crop_cycle to Supabase:', e);
        }
      }

      newCycle.id = 'crop-' + Date.now();
      setLocal('crop_cycle', newCycle);
      return newCycle;
    },

    // --- ACTIVITIES (Table: activities) ---
    async getActivities(farmId) {
      const client = this.getClient();
      if (client) {
        try {
          let query = client.from('activities').select('*').order('planned_date', { ascending: true });
          if (farmId) query = query.eq('farm_id', farmId);
          const { data, error } = await query;
          if (!error && data && data.length > 0) {
            // Map table fields to uniform display
            const mapped = data.map(a => ({
              id: a.id,
              title: a.title,
              category: a.activity_type || 'OTHER',
              field_name: a.description || 'North Block (Plot A)',
              due_date: a.planned_date,
              status: a.status,
              priority: a.priority,
              cost: a.estimated_cost || a.actual_cost || 0,
              notes: a.notes || ''
            }));
            setLocal('activities', mapped);
            return mapped;
          }
        } catch (err) {
          console.warn('Supabase activities query fallback:', err);
        }
      }
      return getLocal('activities', window.FARMPILOT_CONFIG.DEFAULT_ACTIVITIES);
    },

    async completeActivity(activityId) {
      const list = getLocal('activities', []);
      const item = list.find(a => a.id === activityId);
      if (item) {
        item.status = 'COMPLETED';
        setLocal('activities', list);
      }
      const client = this.getClient();
      if (client) {
        try {
          await client.from('activities').update({
            status: 'COMPLETED',
            completed_date: new Date().toISOString().split('T')[0]
          }).eq('id', activityId);
        } catch (e) {
          console.warn('Failed to sync completeActivity to Supabase:', e);
        }
      }
      return item;
    },

    async createActivity(data) {
      const client = this.getClient();
      const payload = {
        title: data.title,
        activity_type: data.category || 'OTHER',
        planned_date: data.due_date || new Date().toISOString().split('T')[0],
        estimated_cost: parseFloat(data.cost) || 0,
        notes: data.notes || '',
        status: data.status || 'PENDING',
        priority: data.priority || 'MEDIUM',
        farm_id: data.farm_id || window.FARMPILOT_CONFIG.DEFAULT_FARM.id
      };

      if (client) {
        try {
          const { data: res, error } = await client.from('activities').insert(payload).select().single();
          if (!error && res) {
            const list = getLocal('activities', []);
            list.unshift({
              id: res.id,
              title: res.title,
              category: res.activity_type,
              field_name: data.field_name || 'North Block (Plot A)',
              due_date: res.planned_date,
              status: res.status,
              priority: res.priority,
              cost: res.estimated_cost,
              notes: res.notes
            });
            setLocal('activities', list);
            return res;
          }
        } catch (e) {
          console.warn('Failed to insert activity to Supabase:', e);
        }
      }

      const newAct = {
        id: 'act-' + Date.now(),
        ...data,
        status: data.status || 'PENDING',
        created_at: new Date().toISOString()
      };
      const list = getLocal('activities', []);
      list.unshift(newAct);
      setLocal('activities', list);
      return newAct;
    },

    // --- INPUTS (Table: inputs) ---
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
        farm_id: data.farm_id || window.FARMPILOT_CONFIG.DEFAULT_FARM.id
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
      const list = getLocal('inputs', []);
      list.unshift(newInp);
      setLocal('inputs', list);
      return newInp;
    },

    // --- EXPENSES (Table: expenses) ---
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
              amount: e.amount,
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
      const client = this.getClient();
      const payload = {
        description: data.description,
        category: data.category || 'OTHER',
        amount: parseFloat(data.amount) || 0,
        expense_date: data.date || new Date().toISOString().split('T')[0],
        farm_id: data.farm_id || window.FARMPILOT_CONFIG.DEFAULT_FARM.id
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
      const list = getLocal('expenses', []);
      list.unshift(newExp);
      setLocal('expenses', list);
      return newExp;
    }
  };
})();
