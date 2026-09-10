/**
 * FarmPilot Authentication & RBAC Session Controller
 * Multi-Tenant Architecture for Green Valley Agriculture Ltd
 * Handles live Supabase Auth, Multi-Role Personas, Owner Executive Impersonation ("View-As"), and Permission Gating
 */

const FARMPILOT_ROLE_PERMISSIONS = Object.freeze({
  OWNER: Object.freeze(['VIEW', 'CREATE', 'EDIT', 'DELETE', 'ASSIGN', 'APPROVE', 'EXPORT', 'UPLOAD', 'COMMENT', 'RECOMMEND', 'MANAGE_USERS', 'MANAGE_ORGANIZATION', 'VIEW_FINANCIALS']),
  MANAGER: Object.freeze(['VIEW', 'CREATE', 'EDIT', 'ASSIGN', 'APPROVE', 'EXPORT', 'UPLOAD', 'COMMENT', 'RECOMMEND', 'VIEW_FINANCIALS']),
  WORKER: Object.freeze(['VIEW_ASSIGNED', 'START_ASSIGNED', 'COMPLETE_ASSIGNED', 'ADD_NOTE_ASSIGNED', 'UPLOAD_EVIDENCE_ASSIGNED', 'REPORT_ISSUE_ASSIGNED', 'COMMENT_ASSIGNED']),
  CONSULTANT: Object.freeze(['VIEW_PERMITTED', 'EXPORT_PERMITTED', 'UPLOAD_ADVISORY', 'COMMENT_PERMITTED', 'RECOMMEND', 'VIEW_FINANCIAL_SUMMARY'])
});

const FARMPILOT_PERMISSION_ALIASES = Object.freeze({
  financials: 'VIEW_FINANCIALS',
  reports: 'EXPORT',
  manage_members: 'MANAGE_USERS',
  org_settings: 'MANAGE_ORGANIZATION',
  operations: 'EDIT',
  task_assignment: 'ASSIGN',
  fields: 'EDIT',
  crops: 'EDIT',
  inputs: 'EDIT',
  expenses: 'VIEW_FINANCIALS',
  irrigation: 'EDIT',
  alerts: 'VIEW',
  today_tasks: 'VIEW_ASSIGNED',
  start_task: 'START_ASSIGNED',
  complete_task: 'COMPLETE_ASSIGNED',
  view_field: 'VIEW_ASSIGNED',
  farm_health: 'VIEW_PERMITTED',
  crop_analytics: 'VIEW_PERMITTED',
  advisory: 'RECOMMEND',
  recommendations: 'RECOMMEND',
  read_reports: 'EXPORT_PERMITTED'
});

window.FarmPilotAuth = {
  ROLE_PERMISSIONS: FARMPILOT_ROLE_PERMISSIONS,
  PERMISSION_ALIASES: FARMPILOT_PERMISSION_ALIASES,
  /**
   * Retrieves current authenticated user session.
   * Returns null if user explicitly logged out or has no valid session.
   */
  getUser() {
    try {
      const isLoggedOut = localStorage.getItem('fp_logged_out');
      if (isLoggedOut === 'true') {
        return null;
      }

      const session = localStorage.getItem('fp_auth_session');
      if (session) {
        return JSON.parse(session);
      }
    } catch (e) {
      console.error('Session parse error:', e);
    }
    return null;
  },

  /**
   * Persists session and fires reactive event
   */
  setUser(userObj) {
    try {
      if (!userObj) {
        localStorage.removeItem('fp_auth_session');
        return;
      }
      localStorage.removeItem('fp_logged_out');
      localStorage.setItem('fp_auth_session', JSON.stringify(userObj));
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('farmpilot:persona-changed', { detail: userObj }));
      }
    } catch (e) {
      console.error('Error saving user session:', e);
    }
  },

  isAuthenticated() {
    return !!this.getUser();
  },

  /**
   * Effective role considers Owner Executive Impersonation
   */
  getEffectiveRole() {
    const user = this.getUser();
    if (!user) return 'OWNER';
    return user.impersonating_role || user.role || 'OWNER';
  },

  getRole() {
    return this.getEffectiveRole();
  },

  getAuthenticatedRole() {
    const user = this.getUser();
    return user?.role || user?.original_role || null;
  },

  isDemoMode() {
    return this.getUser()?.demo_mode === true;
  },

  getAuthorizationContext() {
    const user = this.getUser();
    return {
      userId: user?.id || null,
      role: this.getEffectiveRole(),
      authenticatedRole: this.getAuthenticatedRole(),
      organizationId: user?.organization_id || window.FARMPILOT_CONFIG?.DEFAULT_ORGANIZATION?.id || null,
      farmId: user?.farm_id || window.FarmPilotDB?.getActiveFarmId?.() || null,
      isDemoMode: this.isDemoMode()
    };
  },

  /**
   * Checks if user is currently impersonating another role
   */
  isImpersonating() {
    const user = this.getUser();
    if (!user) return false;
    const baseRole = user.original_role || user.role;
    return !!user.impersonating_role && user.impersonating_role !== baseRole;
  },

  /**
   * Executive Owner View-As Mode:
   * Enables the Farm Owner to view, test, and experience the application as any role
   * (Field Manager, Labour/Worker, Consultant) within Green Valley Agriculture Ltd.
   */
  viewAsRole(targetRole) {
    const user = this.getUser();
    if (!user) return;

    // Only OWNER (or original owner) can impersonate
    const baseRole = user.original_role || user.role;
    if (baseRole !== 'OWNER') {
      alert('Impersonation privilege is restricted to Farm Owners & Enterprise Administrators.');
      return;
    }

    if (targetRole === 'OWNER') {
      this.exitImpersonation();
      return;
    }

    const persona = window.FARMPILOT_CONFIG?.PERSONAS?.[targetRole];
    if (!persona) return;

    user.original_role = 'OWNER';
    user.impersonating_role = targetRole;
    user.impersonating_name = persona.full_name;
    user.impersonating_label = persona.roleLabel;
    user.permissions = [...persona.permissions];

    this.setUser(user);

    // Record in audit trail if audit system is loaded
    if (window.FarmPilotAudit) {
      window.FarmPilotAudit.log({
        module: 'Security & Access',
        action: 'ROLE_IMPERSONATION',
        field: 'Executive View-As',
        old_value: 'OWNER (Direct)',
        new_value: `${targetRole} (${persona.full_name})`,
        reason: 'Owner initiated executive role inspection mode'
      });
    }

    console.log(`👑 Owner Executive Impersonation: Now viewing as ${targetRole} (${persona.full_name})`);

    // Route if necessary
    if (targetRole === 'WORKER') {
      window.location.href = 'worker.html';
    } else if (window.location.pathname.includes('worker.html')) {
      window.location.href = 'dashboard.html';
    } else {
      window.location.reload();
    }
  },

  /**
   * Exits impersonation and restores full Owner privileges
   */
  exitImpersonation() {
    const user = this.getUser();
    if (!user) return;

    delete user.impersonating_role;
    delete user.impersonating_name;
    delete user.impersonating_label;
    user.role = 'OWNER';
    user.permissions = [...(window.FARMPILOT_CONFIG?.PERSONAS?.OWNER?.permissions || [
      'financials', 'org_settings', 'all_farms', 'reports', 'alerts', 'manage_members', 'operations', 'labour', 'irrigation', 'audit'
    ])];

    this.setUser(user);

    if (window.FarmPilotAudit) {
      window.FarmPilotAudit.log({
        module: 'Security & Access',
        action: 'ROLE_IMPERSONATION_EXIT',
        field: 'Executive View-As',
        old_value: 'Impersonation Mode',
        new_value: 'OWNER (Restored)',
        reason: 'Owner exited executive role inspection'
      });
    }

    console.log('👑 Restored full Owner & Executive privileges');
    if (window.location.pathname.includes('worker.html')) {
      window.location.href = 'dashboard.html';
    } else {
      window.location.reload();
    }
  },

  /**
   * Checks permission against effective role
   */
  can(permissionKey) {
    const user = this.getUser();
    if (!user) return false;
    const effectiveRole = this.getEffectiveRole();
    const canonicalPermission = FARMPILOT_PERMISSION_ALIASES[permissionKey] || permissionKey;
    if (FARMPILOT_ROLE_PERMISSIONS[effectiveRole]?.includes(canonicalPermission)) return true;
    return Array.isArray(user.permissions) && user.permissions.some(permission => (
      permission === permissionKey || FARMPILOT_PERMISSION_ALIASES[permission] === canonicalPermission
    ));
  },

  canAny(...permissions) {
    return permissions.some(permission => this.can(permission));
  },

  canAll(...permissions) {
    return permissions.every(permission => this.can(permission));
  },

  isOwner() { return this.getEffectiveRole() === 'OWNER'; },
  isManager() { return this.getEffectiveRole() === 'MANAGER'; },
  isWorker() { return this.getEffectiveRole() === 'WORKER'; },
  isConsultant() { return this.getEffectiveRole() === 'CONSULTANT'; },

  /**
   * 1-Click Hackathon Persona Switcher (Owner, Manager, Worker, Consultant)
   */
  switchPersona(roleName) {
    const persona = window.FARMPILOT_CONFIG?.PERSONAS?.[roleName];
    if (!persona) return;

    localStorage.removeItem('fp_logged_out');
    const userSession = {
      ...persona,
      original_role: roleName,
      demo_mode: true
    };
    const savedAvatar = localStorage.getItem('fp_user_avatar_' + persona.email);
    if (savedAvatar) userSession.avatar_image = savedAvatar;

    this.setUser(userSession);
    console.log(`✓ FarmPilot RBAC: Switched persona to ${roleName} (${persona.full_name})`);

    if (window.FarmPilotAudit) {
      window.FarmPilotAudit.log({
        module: 'Authentication',
        action: 'PERSONA_SWITCH',
        field: 'Active User Session',
        old_value: 'Previous Session',
        new_value: `${roleName} (${persona.full_name})`,
        reason: 'Hackathon 1-Click Persona selection'
      });
    }

    // Adaptive redirection based on role responsibilities
    const isWorkerPage = window.location.pathname.includes('worker');
    if (roleName === 'WORKER' && !isWorkerPage) {
      window.location.href = 'worker.html';
    } else if (roleName !== 'WORKER' && isWorkerPage) {
      window.location.href = 'dashboard.html';
    } else {
      window.location.reload();
    }
  },

  updateProfileImage(dataUrl) {
    const user = this.getUser();
    if (!user) return;
    user.avatar_image = dataUrl;
    if (user.email) {
      try {
        localStorage.setItem('fp_user_avatar_' + user.email, dataUrl);
      } catch (e) {
        console.warn('Could not cache avatar locally:', e);
      }
    }
    this.setUser(user);
  },

  resetPassword(email, newPassword) {
    try {
      localStorage.setItem('fp_custom_pwd_' + email.toLowerCase().trim(), newPassword);
      return true;
    } catch (e) {
      console.error('Error saving new password:', e);
      return false;
    }
  },

  loginWithGoogle(googleUser) {
    localStorage.removeItem('fp_logged_out');
    const email = googleUser.email || 'siddharth.saladi@gmail.com';
    const fullName = googleUser.name || 'Siddharth Saladi';
    const picture = googleUser.picture || null;

    const userSession = {
      id: 'goog-' + (googleUser.sub || Date.now()),
      email: email,
      full_name: fullName,
      role: 'OWNER',
      original_role: 'OWNER',
      roleLabel: 'Farm Owner & Executive',
      badge: 'Owner (Google Verified)',
      badgeClass: 'badge-success',
      avatar: fullName.charAt(0).toUpperCase(),
      avatar_image: picture,
      permissions: ['financials', 'org_settings', 'all_farms', 'reports', 'alerts', 'manage_members', 'operations', 'labour', 'irrigation', 'audit']
    };

    if (picture) {
      try {
        localStorage.setItem('fp_user_avatar_' + email, picture);
      } catch (e) {}
    }

    this.setUser(userSession);
    return { success: true, user: userSession };
  },

  getAuthToken() {
    try {
      return localStorage.getItem('fp_auth_token') || sessionStorage.getItem('fp_auth_token') || null;
    } catch (e) {
      return null;
    }
  },

  setAuthToken(token) {
    try {
      if (token) {
        localStorage.setItem('fp_auth_token', token);
        sessionStorage.setItem('fp_auth_token', token);
      } else {
        localStorage.removeItem('fp_auth_token');
        sessionStorage.removeItem('fp_auth_token');
      }
    } catch (e) {}
  },

  async login(identifier, password) {
    localStorage.removeItem('fp_logged_out');
    const input = (identifier || '').trim();
    const cleanUsername = input.replace(/^@/, '').toLowerCase();
    const normalizedEmail = input.toLowerCase();

    // 0. Server-Side Cryptographic JWT Authentication Attempt
    try {
      const serverRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: input, password })
      });
      if (serverRes.ok) {
        const data = await serverRes.json();
        if (data.success && data.user) {
          this.setAuthToken(data.token);
          this.setUser(data.user);
          return { success: true, user: data.user, token: data.token };
        }
      } else if (serverRes.status === 429) {
        const errData = await serverRes.json().catch(() => ({}));
        return { success: false, error: errData.error || 'Account locked due to too many failed attempts.' };
      }
    } catch (netErr) {
      console.warn('Backend /api/auth/login unavailable, continuing to client fallback:', netErr.message);
    }

    // 1. Check custom workers created by Owner
    try {
      const customWorkers = JSON.parse(localStorage.getItem('farmpilot_custom_workers') || '[]');
      const matchedWorker = customWorkers.find(w => 
        (w.username && w.username.toLowerCase() === cleanUsername) || 
        (w.email && w.email.toLowerCase() === normalizedEmail)
      );
      if (matchedWorker) {
        if (!password || password === matchedWorker.pin || password === '1234' || password === matchedWorker.password) {
          const userSession = {
            id: matchedWorker.id || 'usr-worker-' + Date.now(),
            username: matchedWorker.username,
            full_name: matchedWorker.full_name,
            email: matchedWorker.email || `${matchedWorker.username}@greenvalley.in`,
            role: 'WORKER',
            original_role: 'WORKER',
            roleLabel: 'Field Operations Operator',
            farm_name: matchedWorker.farm_name || 'Green Valley Farm',
            assigned_field: matchedWorker.assigned_field || 'North Block (Plot A)',
            badge: 'Worker',
            badgeClass: 'badge-warning',
            avatar: (matchedWorker.full_name || 'W').charAt(0).toUpperCase(),
            pin: matchedWorker.pin || '1234',
            permissions: ['today_tasks', 'start_task', 'complete_task', 'view_field']
          };
          this.setUser(userSession);
          return { success: true, user: userSession };
        }
      }
    } catch (e) {}

    // 2. Check registered accounts from Sign Up tab
    try {
      const registeredUsers = JSON.parse(localStorage.getItem('farmpilot_registered_users') || '[]');
      const matchedUser = registeredUsers.find(u => 
        (u.username && u.username.toLowerCase() === cleanUsername) || 
        (u.email && u.email.toLowerCase() === normalizedEmail)
      );
      if (matchedUser) {
        const userSession = { ...matchedUser, original_role: matchedUser.role };
        this.setUser(userSession);
        return { success: true, user: userSession };
      }
    } catch (e) {}

    // 3. Match against configured Personas by Username OR Email
    for (const roleKey of Object.keys(window.FARMPILOT_CONFIG.PERSONAS)) {
      const p = window.FARMPILOT_CONFIG.PERSONAS[roleKey];
      const matchUsername = p.username && p.username.toLowerCase() === cleanUsername;
      const matchEmail = p.email && p.email.toLowerCase() === normalizedEmail;
      
      if (matchUsername || matchEmail) {
        const userSession = { ...p, original_role: p.role };
        const savedAvatar = localStorage.getItem('fp_user_avatar_' + p.email);
        if (savedAvatar) userSession.avatar_image = savedAvatar;
        this.setUser(userSession);
        return { success: true, user: userSession };
      }
    }

    // 4. Try Supabase Auth if email format
    if (normalizedEmail.includes('@') && window.supabase && window.FARMPILOT_CONFIG) {
      try {
        const client = window.supabase.createClient(
          window.FARMPILOT_CONFIG.SUPABASE_URL,
          window.FARMPILOT_CONFIG.SUPABASE_ANON_KEY
        );
        const { data, error } = await client.auth.signInWithPassword({ email: normalizedEmail, password });
        if (!error && data?.user) {
          const userSession = {
            id: data.user.id,
            email: data.user.email,
            username: data.user.user_metadata?.username || cleanUsername,
            full_name: data.user.user_metadata?.full_name || 'Farm Operator',
            role: 'OWNER',
            original_role: 'OWNER',
            roleLabel: 'Farm Owner & Executive',
            badge: 'Owner',
            badgeClass: 'badge-success',
            avatar: (data.user.user_metadata?.full_name || 'U').charAt(0).toUpperCase(),
            permissions: ['financials', 'org_settings', 'all_farms', 'reports', 'alerts', 'manage_members', 'operations', 'labour', 'irrigation', 'audit']
          };
          this.setUser(userSession);
          return { success: true, user: userSession };
        }
      } catch (err) {
        console.warn('Supabase auth attempt failed, checking fallback:', err);
      }
    }

    // 5. Permissive fallback for demonstration credentials
    if (cleanUsername === 'ramu' || cleanUsername === 'worker' || normalizedEmail.includes('worker')) {
      const p = window.FARMPILOT_CONFIG.PERSONAS.WORKER;
      const userSession = { ...p, original_role: 'WORKER' };
      this.setUser(userSession);
      return { success: true, user: userSession };
    }

    if (cleanUsername === 'siddharth' || cleanUsername === 'owner' || cleanUsername === 'farmer') {
      const p = window.FARMPILOT_CONFIG.PERSONAS.OWNER;
      const userSession = { ...p, original_role: 'OWNER' };
      this.setUser(userSession);
      return { success: true, user: userSession };
    }

    if (input && password) {
      const userSession = {
        id: 'usr-' + Date.now(),
        email: normalizedEmail.includes('@') ? normalizedEmail : `${cleanUsername}@greenvalley.in`,
        username: cleanUsername,
        full_name: input.split('@')[0],
        role: 'OWNER',
        original_role: 'OWNER',
        roleLabel: 'Farm Owner & Executive',
        badge: 'Owner',
        badgeClass: 'badge-success',
        avatar: cleanUsername.charAt(0).toUpperCase(),
        permissions: ['financials', 'org_settings', 'all_farms', 'reports', 'alerts', 'manage_members', 'operations', 'labour', 'irrigation', 'audit']
      };
      this.setUser(userSession);
      return { success: true, user: userSession };
    }

    return { success: false, error: 'Invalid username/email or password.' };
  },

  /**
   * User Sign Up with mandatory @username
   */
  async signUp({ fullName, username, email, password, farmName = 'Green Valley Farm', role = 'OWNER' }) {
    localStorage.removeItem('fp_logged_out');
    const cleanUsername = (username || fullName.split(' ')[0] || 'farmer').replace(/^@/, '').toLowerCase().trim();
    const normalizedEmail = (email || `${cleanUsername}@greenvalley.in`).toLowerCase().trim();
    
    const personaConfig = window.FARMPILOT_CONFIG?.PERSONAS?.[role] || window.FARMPILOT_CONFIG?.PERSONAS?.OWNER;
    
    const userSession = {
      id: 'usr-' + Date.now(),
      email: normalizedEmail,
      username: cleanUsername,
      full_name: fullName || cleanUsername,
      role: role,
      original_role: role,
      roleLabel: personaConfig?.roleLabel || (role === 'WORKER' ? 'Field Operations Operator' : 'Farm Owner & Executive'),
      farm_name: farmName,
      badge: role.charAt(0) + role.slice(1).toLowerCase(),
      badgeClass: role === 'OWNER' ? 'badge-success' : role === 'WORKER' ? 'badge-warning' : 'badge-primary',
      avatar: (fullName || cleanUsername).charAt(0).toUpperCase(),
      pin: password,
      permissions: personaConfig?.permissions || ['today_tasks', 'start_task', 'complete_task', 'view_field']
    };

    // Save to registered accounts in localStorage
    try {
      const existing = JSON.parse(localStorage.getItem('farmpilot_registered_users') || '[]');
      existing.push(userSession);
      localStorage.setItem('farmpilot_registered_users', JSON.stringify(existing));
    } catch (e) {}

    // Dual-sync to Supabase profiles table if accessible
    if (window.supabase && window.FARMPILOT_CONFIG) {
      try {
        const client = window.supabase.createClient(
          window.FARMPILOT_CONFIG.SUPABASE_URL,
          window.FARMPILOT_CONFIG.SUPABASE_ANON_KEY
        );
        await client.from('profiles').upsert({
          id: userSession.id,
          username: cleanUsername,
          full_name: userSession.full_name,
          email: normalizedEmail
        });
      } catch (err) {
        console.warn('Supabase profile sync skipped:', err);
      }
    }

    this.setUser(userSession);
    return { success: true, user: userSession };
  },

  /**
   * Explicit Logout:
   * Sets fp_logged_out = 'true', purges session tokens, and bounces directly to login.html
   */
  logout() {
    localStorage.setItem('fp_logged_out', 'true');
    localStorage.removeItem('fp_auth_session');
    sessionStorage.removeItem('fp_auth_session');
    console.log('🚪 FarmPilot Session Terminated: Logged out successfully.');
    window.location.href = 'login.html';
  },

  /**
   * Route Guard:
   * Verifies authentication status before rendering protected pages.
   */
  checkAuth(requireAuth = true) {
    const user = this.getUser();
    if (requireAuth && !user) {
      console.warn('⚠️ FarmPilot Access Denied: Authentication required. Redirecting to login.html');
      window.location.href = 'login.html';
    } else if (!requireAuth && user) {
      if (this.getEffectiveRole() === 'WORKER') {
        window.location.href = 'worker.html';
      } else {
        window.location.href = 'dashboard.html';
      }
    }
  }
};
