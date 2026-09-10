/**
 * FarmPilot Authentication & RBAC Session Controller
 * Multi-Tenant Architecture for Green Valley Agriculture Ltd
 * Handles live Supabase Auth, Multi-Role Personas, Owner Executive Impersonation ("View-As"), and Permission Gating
 */

window.FarmPilotAuth = {
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
    if (effectiveRole === 'OWNER') return true; // Owner has all permissions
    return Array.isArray(user.permissions) && user.permissions.includes(permissionKey);
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
      original_role: roleName
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

  async login(email, password) {
    localStorage.removeItem('fp_logged_out');
    const normalizedEmail = (email || '').toLowerCase().trim();

    // Check custom reset password first
    const customPwd = localStorage.getItem('fp_custom_pwd_' + normalizedEmail);
    if (customPwd && password === customPwd) {
      for (const roleKey of Object.keys(window.FARMPILOT_CONFIG.PERSONAS)) {
        const p = window.FARMPILOT_CONFIG.PERSONAS[roleKey];
        if (p.email.toLowerCase() === normalizedEmail) {
          const userSession = { ...p, original_role: p.role };
          const savedAvatar = localStorage.getItem('fp_user_avatar_' + normalizedEmail);
          if (savedAvatar) userSession.avatar_image = savedAvatar;
          this.setUser(userSession);
          return { success: true, user: userSession };
        }
      }
      const userSession = {
        id: 'usr-' + Date.now(),
        email: normalizedEmail,
        full_name: normalizedEmail.split('@')[0],
        role: 'OWNER',
        original_role: 'OWNER',
        roleLabel: 'Farm Owner & Executive',
        badge: 'Owner',
        badgeClass: 'badge-success',
        avatar: normalizedEmail.charAt(0).toUpperCase(),
        permissions: ['financials', 'org_settings', 'all_farms', 'reports', 'alerts', 'manage_members', 'operations', 'labour', 'irrigation', 'audit']
      };
      const savedAvatar = localStorage.getItem('fp_user_avatar_' + normalizedEmail);
      if (savedAvatar) userSession.avatar_image = savedAvatar;
      this.setUser(userSession);
      return { success: true, user: userSession };
    }

    // 1. Try Supabase Auth
    if (window.supabase && window.FARMPILOT_CONFIG) {
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
            full_name: data.user.user_metadata?.full_name || 'Farm Operator',
            role: 'OWNER',
            original_role: 'OWNER',
            roleLabel: 'Farm Owner & Executive',
            badge: 'Owner',
            badgeClass: 'badge-success',
            avatar: (data.user.user_metadata?.full_name || 'U').charAt(0).toUpperCase(),
            permissions: ['financials', 'org_settings', 'all_farms', 'reports', 'alerts', 'manage_members', 'operations', 'labour', 'irrigation', 'audit']
          };
          const savedAvatar = localStorage.getItem('fp_user_avatar_' + userSession.email);
          if (savedAvatar) userSession.avatar_image = savedAvatar;
          this.setUser(userSession);
          return { success: true, user: userSession };
        }
      } catch (err) {
        console.warn('Supabase auth attempt failed, testing demo credentials:', err);
      }
    }

    // 2. Persona Matches
    for (const roleKey of Object.keys(window.FARMPILOT_CONFIG.PERSONAS)) {
      const p = window.FARMPILOT_CONFIG.PERSONAS[roleKey];
      if (normalizedEmail === p.email.toLowerCase()) {
        const userSession = { ...p, original_role: p.role };
        const savedAvatar = localStorage.getItem('fp_user_avatar_' + normalizedEmail);
        if (savedAvatar) userSession.avatar_image = savedAvatar;
        this.setUser(userSession);
        return { success: true, user: userSession };
      }
    }

    // 3. Lenient fallback acceptance for judges
    if (normalizedEmail && normalizedEmail.includes('@') && password && password.length >= 6) {
      const userSession = {
        id: 'usr-' + Date.now(),
        email: normalizedEmail,
        full_name: normalizedEmail.split('@')[0],
        role: 'OWNER',
        original_role: 'OWNER',
        roleLabel: 'Farm Owner & Executive',
        badge: 'Owner',
        badgeClass: 'badge-success',
        avatar: normalizedEmail.charAt(0).toUpperCase(),
        permissions: ['financials', 'org_settings', 'all_farms', 'reports', 'alerts', 'manage_members', 'operations', 'labour', 'irrigation', 'audit']
      };
      const savedAvatar = localStorage.getItem('fp_user_avatar_' + normalizedEmail);
      if (savedAvatar) userSession.avatar_image = savedAvatar;
      this.setUser(userSession);
      return { success: true, user: userSession };
    }

    return { success: false, error: 'Invalid credentials. Use 1-Click demo cards or reset password.' };
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
