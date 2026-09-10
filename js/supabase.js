/**
 * FarmPilot Supabase Data Service
 * Live Backend Connection with Resilient LocalStorage Sync
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
      } catch (e) {
        console.warn('Supabase initialization fallback:', e);
      }
    }
  }

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
    
    async getFarms() {
      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient.from('farms').select('*');
          if (!error && data && data.length > 0) {
            setLocal('farms', data);
            return data;
          }
        } catch (err) {
          console.warn('Using cached farms data:', err);
        }
      }
      return getLocal('farms', [window.FARMPILOT_CONFIG.DEFAULT_FARM]);
    },

    async createFarm(farmData) {
      const newFarm = {
        id: 'farm-' + Date.now(),
        ...farmData,
        created_at: new Date().toISOString()
      };
      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient.from('farms').insert(farmData).select().single();
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
      const list = getLocal('farms', []);
      list.unshift(newFarm);
      setLocal('farms', list);
      return newFarm;
    },

    async getFields(farmId) {
      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient.from('fields').select('*');
          if (!error && data && data.length > 0) {
            setLocal('fields', data);
            return data;
          }
        } catch (err) {
          console.warn('Using cached fields data:', err);
        }
      }
      return getLocal('fields', window.FARMPILOT_CONFIG.DEFAULT_FIELDS);
    },

    async createField(fieldData) {
      const newField = {
        id: 'field-' + Date.now(),
        ...fieldData,
        created_at: new Date().toISOString()
      };
      const list = getLocal('fields', []);
      list.push(newField);
      setLocal('fields', list);
      return newField;
    },

    async getCropCycle() {
      return getLocal('crop_cycle', window.FARMPILOT_CONFIG.DEFAULT_CROP_CYCLE);
    },

    async getActivities() {
      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient.from('activity_logs').select('*');
          if (!error && data && data.length > 0) {
            setLocal('activities', data);
            return data;
          }
        } catch (err) {
          console.warn('Using cached activities data:', err);
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
      if (supabaseClient) {
        try {
          await supabaseClient.from('activity_logs').update({ status: 'COMPLETED' }).eq('id', activityId);
        } catch (e) {
          console.warn('Failed to sync completeActivity to Supabase:', e);
        }
      }
      return item;
    },

    async createActivity(data) {
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

    async getInputs() {
      return getLocal('inputs', window.FARMPILOT_CONFIG.DEFAULT_INPUTS);
    },

    async createInput(data) {
      const newInp = {
        id: 'inp-' + Date.now(),
        ...data,
        total_cost: (parseFloat(data.quantity) || 0) * (parseFloat(data.unit_cost) || 0),
        created_at: new Date().toISOString()
      };
      const list = getLocal('inputs', []);
      list.unshift(newInp);
      setLocal('inputs', list);
      return newInp;
    },

    async getExpenses() {
      return getLocal('expenses', window.FARMPILOT_CONFIG.DEFAULT_EXPENSES);
    },

    async createExpense(data) {
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
