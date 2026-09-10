/* FarmPilot shared collaboration workflows. RLS remains the authorization boundary. */
(function () {
  const localKey = 'farmpilot_collaboration_events';

  function getClient() {
    if (!window.supabase || !window.FARMPILOT_CONFIG) return null;
    if (!window.__farmPilotSupabaseClient) {
      window.__farmPilotSupabaseClient = window.supabase.createClient(
        window.FARMPILOT_CONFIG.SUPABASE_URL,
        window.FARMPILOT_CONFIG.SUPABASE_ANON_KEY
      );
    }
    return window.__farmPilotSupabaseClient;
  }

  function fallbackEvents() {
    try {
      return JSON.parse(localStorage.getItem(localKey) || '[]');
    } catch (error) {
      return [];
    }
  }

  function saveFallback(event) {
    const events = [event, ...fallbackEvents()].slice(0, 100);
    localStorage.setItem(localKey, JSON.stringify(events));
    return event;
  }

  async function insert(table, payload, fallbackType) {
    const client = getClient();
    if (client) {
      const { data, error } = await client.from(table).insert(payload).select().single();
      if (!error) return data;
      console.warn(`FarmPilot ${table} fallback:`, error.message);
    }
    return saveFallback({ id: `demo-${Date.now()}`, type: fallbackType, ...payload, created_at: new Date().toISOString() });
  }

  async function list(table, query = {}) {
    const client = getClient();
    if (client) {
      let request = client.from(table).select('*').order('created_at', { ascending: false });
      Object.entries(query).forEach(([column, value]) => { request = request.eq(column, value); });
      const { data, error } = await request;
      if (!error) return data || [];
      console.warn(`FarmPilot ${table} list fallback:`, error.message);
    }
    return fallbackEvents().filter((event) => Object.entries(query).every(([key, value]) => event[key] === value));
  }

  async function update(table, id, changes, fallbackType) {
    const client = getClient();
    if (client) {
      const { data, error } = await client.from(table).update(changes).eq('id', id).select().single();
      if (!error) return data;
      console.warn(`FarmPilot ${table} update fallback:`, error.message);
    }
    return saveFallback({ id, type: fallbackType, ...changes, updated_at: new Date().toISOString() });
  }

  window.FarmPilotCollaboration = {
    submitObservation(payload) {
      return insert('field_observations', {
        ...payload,
        submitted_by: payload.submitted_by || window.FarmPilotAuth?.getUser()?.id
      }, 'FIELD_OBSERVATION_SUBMITTED');
    },

    reportIssue(payload) {
      return insert('farm_issues', {
        ...payload,
        reported_by: payload.reported_by || window.FarmPilotAuth?.getUser()?.id
      }, 'ISSUE_REPORTED');
    },

    addComment(payload) {
      return insert('comments', {
        ...payload,
        author_id: payload.author_id || window.FarmPilotAuth?.getUser()?.id
      }, 'COMMENT_ADDED');
    },

    createAdvisoryNote(payload) {
      return insert('advisory_notes', {
        ...payload,
        created_by: payload.created_by || window.FarmPilotAuth?.getUser()?.id
      }, 'ADVISORY_NOTE_CREATED');
    },

    acceptAdvisory(id) {
      return update('advisory_notes', id, {
        status: 'ACCEPTED',
        decided_by: window.FarmPilotAuth?.getUser()?.id,
        decided_at: new Date().toISOString()
      }, 'ADVISORY_ACCEPTED');
    },

    getNotifications(recipientId = window.FarmPilotAuth?.getUser()?.id) {
      return list('notifications', { recipient_id: recipientId });
    },

    getFarmMemory(farmId) {
      return list('operational_journal', { farm_id: farmId });
    }
  };
})();
