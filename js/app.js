/**
 * Universal FarmPilot App Shell & Layout Controller — Phase 2 Enterprise
 * Multi-Tenant Organization, Farm Selector, Role Persona Switcher, and Nav Badges
 */

window.FarmPilotApp = {
  activePage: '',

  async init(activePageName) {
    this.activePage = activePageName;
    
    // Protect route if on private pages
    if (activePageName !== 'landing' && activePageName !== 'login') {
      window.FarmPilotAuth.checkAuth(true);
    }

    this.renderImpersonationBanner();
    await this.renderSidebar();
    await this.renderHeader();
    this.setupShortcuts();
    
    // Auto-update health across the application whenever changes occur
    window.addEventListener('farmpilot:health-updated', (e) => {
      this.updateHealthUI(e.detail);
    });

    window.addEventListener('farmpilot:persona-changed', () => {
      window.location.reload();
    });

    this.updateHealthUI();

    if (window.FarmPilotWeather) {
      window.FarmPilotWeather.updateWidgets();
    }

    if (window.FarmPilotI18n) {
      window.FarmPilotI18n.applyTranslations();
    } else {
      const script = document.createElement('script');
      script.src = 'js/i18n.js';
      script.onload = () => {
        if (window.FarmPilotI18n) {
          window.FarmPilotI18n.applyTranslations();
          this.renderHeader();
          this.renderSidebar();
        }
      };
      document.head.appendChild(script);
    }

    window.addEventListener('farmpilot:language-changed', (e) => {
      this.renderHeader();
      this.renderSidebar();
      if (window.FarmPilotI18n) window.FarmPilotI18n.applyTranslations(e?.detail?.code);
    });
  },

  renderImpersonationBanner() {
    let banner = document.getElementById('owner-impersonation-banner');
    if (window.FarmPilotAuth && window.FarmPilotAuth.isImpersonating()) {
      const user = window.FarmPilotAuth.getUser();
      const roleLabel = user?.impersonating_label || user?.impersonating_role || 'Executive Role';
      const roleName = user?.impersonating_name || 'Assigned Persona';
      
      if (!banner) {
        banner = document.createElement('div');
        banner.id = 'owner-impersonation-banner';
        document.body.prepend(banner);
      }
      banner.style.cssText = 'background: linear-gradient(90deg, #1E3A8A 0%, #2563EB 100%); color: #FFFFFF; padding: 0.65rem 1.5rem; display: flex; align-items: center; justify-content: space-between; font-size: 0.8125rem; font-weight: 700; box-shadow: 0 4px 12px rgba(37,99,235,0.35); position: sticky; top: 0; z-index: 99999; border-bottom: 2px solid #60A5FA;';
      banner.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span style="font-size: 1.25rem;">👑</span>
          <div>
            <span style="font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; background: rgba(255,255,255,0.22); padding: 0.15rem 0.5rem; border-radius: 4px; margin-right: 0.5rem; font-size: 0.6875rem;">
              Executive Owner Impersonation
            </span>
            <span>
              Viewing Green Valley Agriculture Ltd as <strong>${roleLabel}</strong> (${roleName}). Interface and permissions match this role.
            </span>
          </div>
        </div>
        <button onclick="window.FarmPilotAuth.exitImpersonation()" style="background: #FFFFFF; color: #1E3A8A; border: none; padding: 0.35rem 0.85rem; border-radius: 6px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; box-shadow: 0 2px 5px rgba(0,0,0,0.15); transition: all 0.2s;" onmouseover="this.style.background='#EFF6FF'" onmouseout="this.style.background='#FFFFFF'">
          <span>Exit Role View</span>
          <span>✕</span>
        </button>
      `;
    } else if (banner) {
      banner.remove();
    }
  },

  updateHealthUI(healthData) {
    if (!healthData && window.FarmPilotDB) {
      healthData = window.FarmPilotDB.getFarmHealth();
    }
    if (!healthData) return;

    // 1. Sidebar indicator
    const miniInd = document.querySelector('.mini-health-indicator .tabular-nums');
    if (miniInd) {
      miniInd.textContent = `${healthData.score}/100`;
      miniInd.style.color = healthData.score >= 90 ? '#059669' : healthData.score >= 75 ? '#10B981' : '#D97706';
    }

    // 2. Intelligence nav badge
    const healthNavBadge = document.querySelector('a[href="intelligence.html"] .nav-badge');
    if (healthNavBadge) {
      healthNavBadge.textContent = `${healthData.score}/100`;
    }

    // 3. Activities nav badge
    const actNavBadge = document.querySelector('a[href="activities.html"] .nav-badge');
    if (actNavBadge) {
      if (healthData.overdueCount > 0) {
        actNavBadge.textContent = `${healthData.overdueCount} Overdue`;
        actNavBadge.className = 'nav-badge danger';
        actNavBadge.style.display = 'inline-block';
      } else if (healthData.pendingCount > 0) {
        actNavBadge.textContent = `${healthData.pendingCount} Pending`;
        actNavBadge.className = 'nav-badge success';
        actNavBadge.style.display = 'inline-block';
      } else {
        actNavBadge.style.display = 'none';
      }
    }

    // 4. Alerts nav badge
    const alertNavBadge = document.querySelector('a[href="alerts.html"] .nav-badge');
    if (alertNavBadge) {
      alertNavBadge.textContent = healthData.overdueCount > 0 ? 'Action Req' : 'Optimal';
      alertNavBadge.className = healthData.overdueCount > 0 ? 'nav-badge danger' : 'nav-badge success';
    }
  },

  showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    toast.innerHTML = `<span style="font-weight:bold;">${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  },

  async renderSidebar() {
    const sidebarEl = document.getElementById('app-sidebar');
    if (!sidebarEl) return;

    const user = window.FarmPilotAuth.getUser() || window.FARMPILOT_CONFIG.PERSONAS.OWNER;
    const role = window.FarmPilotAuth.getEffectiveRole();

    // Role-based route guard: Workers strictly locked out of executive & financial dashboards
    if (role === 'WORKER' && ['expenses', 'farms', 'reports', 'dashboard', 'crops', 'inputs', 'roles', 'audit', 'labour', 'intelligence'].includes(this.activePage)) {
      window.location.href = 'worker.html';
      return;
    }
    if (role === 'CONSULTANT' && ['expenses', 'farms', 'roles', 'labour'].includes(this.activePage)) {
      window.location.href = 'crops.html';
      return;
    }
    if (role === 'MANAGER' && ['roles'].includes(this.activePage)) {
      window.location.href = 'dashboard.html';
      return;
    }

    let navItems = [];

    if (role === 'WORKER') {
      navItems = [
        {
          group: 'Field Worker Shift',
          items: [
            { id: 'worker', label: "Today's Shift", icon: '🚜', href: 'worker.html', badge: 'Active Shift', badgeType: 'success' },
            { id: 'activities', label: 'Field Tasks & AWD', icon: '📋', href: 'activities.html', badge: '1 Overdue', badgeType: 'danger' }
          ]
        },
        {
          group: 'Communication & Alerts',
          items: [
            { id: 'community', label: 'Community Ag Exchange', icon: '🌐', href: 'community.html', badge: 'Live', badgeType: 'primary' },
            { id: 'alerts', label: 'Alert Center', icon: '🔔', href: 'alerts.html', badge: '1 Urgent', badgeType: 'danger' },
            { id: 'settings', label: 'Language & Settings', icon: '⚙️', href: 'settings.html', badge: '24 Langs', badgeType: 'primary' }
          ]
        }
      ];
    } else if (role === 'CONSULTANT') {
      navItems = [
        {
          group: 'Agronomic Overview',
          items: [
            { id: 'dashboard', label: 'Dashboard', icon: '📊', href: 'dashboard.html' },
            { id: 'crops', label: 'Crop Cycles & Phenology', icon: '🌱', href: 'crops.html', badge: 'Active' },
            { id: 'soil', label: 'Soil & Land Health', icon: '🧪', href: 'soil.html', badge: 'SHC Lab', badgeType: 'success' },
            { id: 'community', label: 'Community Ag Exchange', icon: '🌐', href: 'community.html', badge: 'Live', badgeType: 'primary' }
          ]
        },
        {
          group: 'Field & Inputs',
          items: [
            { id: 'activities', label: 'Field Operations & AWD', icon: '📋', href: 'activities.html', badge: '1 Overdue', badgeType: 'danger' },
            { id: 'inputs', label: 'Inputs & Stock', icon: '📦', href: 'inputs.html' }
          ]
        },
        {
          group: 'Advisory & Auditing',
          items: [
            { id: 'alerts', label: 'Alert Center', icon: '🔔', href: 'alerts.html', badge: '1 Urgent', badgeType: 'danger' },
            { id: 'intelligence', label: 'Farm Health & Soil', icon: '🧠', href: 'intelligence.html', badge: '82/100', badgeType: 'success' },
            { id: 'reports', label: 'Agronomic Reports', icon: '📑', href: 'reports.html' },
            { id: 'settings', label: 'Settings & FarmPilot AI', icon: '⚙️', href: 'settings.html', badge: '24 Langs', badgeType: 'primary' },
            { id: 'audit', label: 'Audit History', icon: '📜', href: 'audit.html' }
          ]
        }
      ];
    } else if (role === 'MANAGER') {
      navItems = [
        {
          group: 'Operations Command',
          items: [
            { id: 'dashboard', label: 'Dashboard', icon: '📊', href: 'dashboard.html' },
            { id: 'farms', label: 'Farms Portfolio', icon: '🚜', href: 'farms.html' },
            { id: 'crops', label: 'Crop Cycles', icon: '🌱', href: 'crops.html', badge: 'Active' },
            { id: 'soil', label: 'Soil & Land Health', icon: '🧪', href: 'soil.html', badge: 'SHC Lab', badgeType: 'success' },
            { id: 'community', label: 'Community Ag Exchange', icon: '🌐', href: 'community.html', badge: 'Live', badgeType: 'primary' }
          ]
        },
        {
          group: 'Field & Logistics',
          items: [
            { id: 'activities', label: 'Field Operations & AWD', icon: '📋', href: 'activities.html', badge: '1 Overdue', badgeType: 'danger' },
            { id: 'labour', label: 'Labour Management', icon: '👷', href: 'labour.html', badge: '24 Today', badgeType: 'primary' },
            { id: 'inputs', label: 'Inputs & Stock', icon: '📦', href: 'inputs.html' },
            { id: 'expenses', label: 'Financials & Budget', icon: '💰', href: 'expenses.html' }
          ]
        },
        {
          group: 'Intelligence & Audit',
          items: [
            { id: 'alerts', label: 'Alert Center', icon: '🔔', href: 'alerts.html', badge: '1 Urgent', badgeType: 'danger' },
            { id: 'intelligence', label: 'Farm Health', icon: '🧠', href: 'intelligence.html', badge: '82/100', badgeType: 'success' },
            { id: 'settings', label: 'Settings & FarmPilot AI', icon: '⚙️', href: 'settings.html', badge: '24 Langs', badgeType: 'primary' },
            { id: 'audit', label: 'Audit History', icon: '📜', href: 'audit.html' }
          ]
        },
        {
          group: 'Staff Mode',
          items: [
            { id: 'worker', label: 'Mobile Worker View', icon: '📱', href: 'worker.html' }
          ]
        }
      ];
    } else {
      // OWNER (Enterprise Oversight)
      navItems = [
        {
          group: 'Executive Overview',
          items: [
            { id: 'dashboard', label: 'Dashboard', icon: '📊', href: 'dashboard.html' },
            { id: 'farms', label: 'Farms Portfolio', icon: '🚜', href: 'farms.html' },
            { id: 'crops', label: 'Crop Cycles', icon: '🌱', href: 'crops.html', badge: 'Active' }
          ]
        },
        {
          group: 'Operations & Resources',
          items: [
            { id: 'activities', label: 'Field Operations & AWD', icon: '📋', href: 'activities.html', badge: '1 Overdue', badgeType: 'danger' },
            { id: 'soil', label: 'Soil & Land Health', icon: '🧪', href: 'soil.html', badge: 'SHC Lab', badgeType: 'success' },
            { id: 'labour', label: 'Labour & Shifts', icon: '👷', href: 'labour.html', badge: '24 Today', badgeType: 'primary' },
            { id: 'inputs', label: 'Inputs & Stock', icon: '📦', href: 'inputs.html' },
            { id: 'expenses', label: 'Financials & Budget', icon: '💰', href: 'expenses.html' },
            { id: 'community', label: 'Community Ag Exchange', icon: '🌐', href: 'community.html', badge: 'Live', badgeType: 'primary' }
          ]
        },
        {
          group: 'Intelligence & SaaS',
          items: [
            { id: 'intelligence', label: 'Farm Action Center', icon: '🧠', href: 'intelligence.html', badge: '82/100', badgeType: 'success' },
            { id: 'alerts', label: 'Alert Center', icon: '🔔', href: 'alerts.html', badge: '1 Urgent', badgeType: 'danger' },
            { id: 'reports', label: 'Agronomic Reports', icon: '📑', href: 'reports.html' },
            { id: 'roles', label: 'Roles & Staff Matrix', icon: '👥', href: 'roles.html' },
            { id: 'settings', label: 'Settings & FarmPilot AI', icon: '⚙️', href: 'settings.html', badge: '24 Langs', badgeType: 'primary' },
            { id: 'audit', label: 'Audit History', icon: '📜', href: 'audit.html' }
          ]
        },
        {
          group: 'Staff Mode',
          items: [
            { id: 'worker', label: 'Mobile Worker View', icon: '📱', href: 'worker.html' }
          ]
        }
      ];
    }

    // Role badge color scheme
    const roleBadges = {
      OWNER: { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0', dot: '#10B981', label: '👑 OWNER' },
      MANAGER: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', dot: '#3B82F6', label: '👔 MANAGER' },
      WORKER: { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A', dot: '#F59E0B', label: '🚜 WORKER' },
      CONSULTANT: { bg: '#FAF5FF', text: '#7E22CE', border: '#E9D5FF', dot: '#A855F7', label: '🔬 CONSULTANT' }
    };
    const badgeStyle = roleBadges[role] || roleBadges.OWNER;

    const avatarHtml = user.avatar_image ? `
      <img src="${user.avatar_image}" alt="${user.full_name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
    ` : `
      <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background-color: var(--color-forest); color: #FFFFFF; font-weight: 800; font-size: 0.8125rem;">
        ${user.avatar || (user.full_name ? user.full_name.charAt(0).toUpperCase() : 'F')}
      </div>
    `;

    sidebarEl.innerHTML = `
      <!-- Brand Header -->
      <div class="sidebar-header">
        <a href="dashboard.html" class="sidebar-brand">
          <div class="sidebar-brand-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M7 20h10"/>
              <path d="M10 20c0-4 2-7 6-7s4 2 4 4"/>
              <path d="M4 14c2.5-3 5-3 7-1"/>
              <path d="M12 7c-2 0-4.5 1.5-5 4"/>
            </svg>
          </div>
          <div class="sidebar-brand-text">
            <h2>FarmPilot</h2>
            <span>Agronomic SaaS</span>
          </div>
        </a>
      </div>

      <!-- Navigation Section -->
      <nav class="sidebar-nav">
        ${navItems.map(g => `
          <div>
            <div class="nav-group-title">${window.FarmPilotI18n ? window.FarmPilotI18n.t(g.group, g.group) : g.group}</div>
            ${g.items.map(item => `
              <a href="${item.href}" class="nav-item ${this.activePage === item.id ? 'active' : ''}">
                <span style="font-size: 1rem;">${item.icon}</span>
                <span>${window.FarmPilotI18n ? window.FarmPilotI18n.t(item.label, item.label) : item.label}</span>
                ${item.badge ? `
                  <span class="nav-badge ${item.badgeType || 'success'}">${item.badge}</span>
                ` : ''}
              </a>
            `).join('')}
          </div>
        `).join('')}

        <!-- Microclimate Weather Telemetry Widget -->
        <div class="weather-telemetry-card" id="sidebar-weather-widget">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
            <span style="font-weight: 800; color: var(--color-forest); display: flex; align-items: center; gap: 0.35rem;">
              <span id="weather-icon">☀️</span> Field Microclimate
            </span>
            <span class="font-mono" id="weather-status-badge" style="font-size: 0.5625rem; font-weight: 800; background: #FFFFFF; padding: 0.1rem 0.35rem; border-radius: 4px; color: #059669;">
              LIVE
            </span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.4rem;">
            <span class="tabular-nums font-mono" id="weather-temp" style="font-size: 1.125rem; font-weight: 800; color: var(--color-text-primary);">31.5°C</span>
            <span id="weather-desc" style="font-size: 0.6875rem; font-weight: 700; color: var(--color-emerald-dark);">Overcast • Optimal</span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.25rem; font-size: 0.625rem; color: var(--color-text-secondary); pt-1; border-top: 1px solid rgba(220, 252, 231, 0.8);">
            <span id="weather-humidity">💧 63% Humid</span>
            <span id="weather-wind">💨 21.6 km/h NNW</span>
          </div>
        </div>
      </nav>

      <!-- Sidebar Footer with Persona Profile & Prominent Sign Out Button -->
      <div class="sidebar-footer">
        <!-- Farm Health Index -->
        <div class="mini-health-indicator">
          <span style="font-size: 0.6875rem; font-weight: 800; color: var(--color-text-primary); display: flex; align-items: center; gap: 0.35rem;">
            📈 Health Index
          </span>
          <span class="tabular-nums font-mono" style="font-size: 0.75rem; font-weight: 800; color: #059669;">
            82/100
          </span>
        </div>

        <!-- User Profile Card -->
        <div style="padding: 0.625rem; border-radius: var(--radius-md); background-color: var(--color-surface-secondary); border: 1px solid var(--color-border); margin-top: 0.35rem;">
          <div style="display: flex; align-items: center; gap: 0.6rem; min-width: 0;">
            <div style="width: 34px; height: 34px; border-radius: 50%; overflow: hidden; border: 1.5px solid var(--color-border); flex-shrink: 0; position: relative;">
              ${avatarHtml}
            </div>
            <div style="min-width: 0; flex: 1;">
              <p style="font-size: 0.8125rem; font-weight: 800; color: var(--color-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2;">
                ${user.full_name || 'Farm Operator'}
              </p>
              <p style="font-size: 0.6875rem; color: var(--color-text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.1; margin-bottom: 0.25rem;">
                ${user.email || 'user@farmpilot.in'}
              </p>
              <span style="display: inline-block; font-size: 0.625rem; font-weight: 800; padding: 0.1rem 0.45rem; border-radius: 4px; background: ${badgeStyle.bg}; color: ${badgeStyle.text}; border: 1px solid ${badgeStyle.border};">
                ${badgeStyle.label}
              </span>
            </div>
          </div>

          <!-- PROMINENT SIGN OUT BUTTON -->
          <button onclick="window.FarmPilotAuth.logout()" class="btn" style="width: 100%; margin-top: 0.65rem; display: flex; align-items: center; justify-content: center; gap: 0.45rem; background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA; padding: 0.45rem 0.75rem; border-radius: var(--radius-md); font-size: 0.75rem; font-weight: 800; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#FEE2E2'; this.style.borderColor='#F87171';" onmouseout="this.style.background='#FEF2F2'; this.style.borderColor='#FECACA';">
            <span style="font-size: 0.875rem;">🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    `;

    if (window.FarmPilotWeather) {
      window.FarmPilotWeather.updateWidgets();
    }
  },

  async renderHeader() {
    const headerEl = document.getElementById('app-header');
    if (!headerEl) return;

    const pageTitles = {
      dashboard: 'Dashboard Command Center',
      farms: 'Farms & Land Holdings',
      crops: 'Seasonal Crop Cycles',
      activities: 'Operations & Field Tasks',
      labour: 'Labour & Shift Management',
      inputs: 'Agronomic Inputs & Stocks',
      expenses: 'Financial Outlay & Ledgers',
      intelligence: 'Farm Health & Intelligence',
      alerts: 'Centralized Alert Center',
      reports: 'Executive Reports & Analytics',
      roles: 'Roles & Permissions Matrix',
      settings: 'Settings & Farm Intelligence Integration',
      audit: 'Tamper-Evident Audit History',
      worker: "Field Worker Shift"
    };

    const currentTitle = pageTitles[this.activePage] || 'Command Center';
    const user = window.FarmPilotAuth.getUser() || window.FARMPILOT_CONFIG.PERSONAS.OWNER;
    const role = window.FarmPilotAuth.getEffectiveRole();
    const activeFarm = window.FarmPilotDB ? await window.FarmPilotDB.getActiveFarm() : window.FARMPILOT_CONFIG.DEFAULT_FARMS[0];
    const farms = window.FarmPilotDB ? await window.FarmPilotDB.getFarms() : window.FARMPILOT_CONFIG.DEFAULT_FARMS;

    const roleBadges = {
      OWNER: { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0', label: '👑 OWNER' },
      MANAGER: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', label: '👔 MANAGER' },
      WORKER: { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A', label: '🚜 WORKER' },
      CONSULTANT: { bg: '#FAF5FF', text: '#7E22CE', border: '#E9D5FF', label: '🔬 CONSULTANT' }
    };
    const badgeStyle = roleBadges[role] || roleBadges.OWNER;

    const headerAvatar = user.avatar_image ? `
      <img src="${user.avatar_image}" alt="${user.full_name}" style="width: 100%; height: 100%; object-fit: cover;">
    ` : `
      <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: var(--color-forest); color: #FFFFFF; font-weight: 800; font-size: 0.75rem;">
        ${user.avatar || (user.full_name ? user.full_name.charAt(0).toUpperCase() : 'F')}
      </div>
    `;

    headerEl.innerHTML = `
      <!-- Left: Breadcrumb & Title -->
      <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem;">
        <span style="color: var(--color-text-tertiary); font-weight: 500;">Green Valley Agri</span>
        <span style="color: #CBD5E1;">/</span>
        <span style="color: var(--color-text-primary); font-weight: 800;">${currentTitle}</span>
      </div>

      <!-- Center: Farm Portfolio Selector -->
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0.65rem; border-radius: var(--radius-full); background-color: var(--color-surface-secondary); border: 1px solid var(--color-border); font-size: 0.75rem;">
          <span style="width: 6px; height: 6px; border-radius: 50%; background-color: #10B981;" class="animate-pulse-glow"></span>
          <select id="farm-selector-select" style="background: transparent; border: none; font-size: 0.75rem; font-weight: 800; color: var(--color-text-primary); cursor: pointer; outline: none;">
            ${farms.map(f => `
              <option value="${f.id}" ${f.id === activeFarm.id ? 'selected' : ''}>
                🚜 ${f.name} (${f.total_area} Ac)
              </option>
            `).join('')}
          </select>
          <span style="font-size: 0.625rem; font-weight: 700; background-color: var(--color-emerald-light); color: var(--color-forest); padding: 0.1rem 0.4rem; border-radius: 4px;">
            Kharif 2026
          </span>
        </div>
      </div>

      <!-- Right: Install App, Language Switcher, Role Switcher & Profile Button -->
      <div style="display: flex; align-items: center; gap: 0.65rem;">
        <!-- Install Web App Button -->
        <button onclick="window.FarmPilotOffline ? window.FarmPilotOffline.promptInstall() : null" id="header-install-app-btn" style="display: flex; align-items: center; gap: 0.35rem; background: #ECFDF5; border: 1.5px solid #A7F3D0; padding: 0.28rem 0.65rem; border-radius: var(--radius-full); cursor: pointer; font-size: 0.75rem; font-weight: 800; color: #065F46; box-shadow: var(--shadow-sm); transition: all 0.2s;" title="Install FarmPilot as native desktop or mobile web app">
          <span>📲</span>
          <span>Install App</span>
        </button>

        <!-- Multilingual Language Selector (24 Languages Supported) -->
        <div style="position: relative;" id="header-lang-wrapper">
          <button id="header-lang-btn" onclick="FarmPilotApp.toggleLangMenu(event)" style="display: flex; align-items: center; gap: 0.35rem; background: var(--color-surface); border: 1.5px solid var(--color-border); padding: 0.28rem 0.65rem; border-radius: var(--radius-full); cursor: pointer; font-size: 0.75rem; font-weight: 800; color: var(--color-text-primary); box-shadow: var(--shadow-sm); transition: all 0.2s;" title="Switch Language (24 Agricultural Languages)">
            <span>${window.FarmPilotI18n ? window.FarmPilotI18n.getCurrentLanguage().flag : '🌐'}</span>
            <span style="max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${window.FarmPilotI18n ? window.FarmPilotI18n.getCurrentLanguage().native : 'English'}
            </span>
            <span style="font-size: 0.625rem; color: var(--color-text-tertiary);">▾</span>
          </button>

          <!-- Floating Language Picker Dropdown -->
          <div id="header-lang-dropdown" style="display: none; position: absolute; right: 0; top: calc(100% + 8px); width: 290px; max-height: 380px; overflow-y: auto; background: #FFFFFF; border: 1px solid var(--color-border); border-radius: var(--radius-lg); box-shadow: 0 14px 30px -5px rgba(0,0,0,0.2); z-index: 99999; padding: 0.5rem;">
            <div style="padding: 0.4rem 0.6rem; border-bottom: 1px solid #E2E8F0; margin-bottom: 0.35rem; font-size: 0.6875rem; font-weight: 800; color: var(--color-forest); display: flex; justify-content: space-between; align-items: center;">
              <span>🌐 SELECT LANGUAGE (24)</span>
              <a href="settings.html" style="color: #059669; text-decoration: none; font-weight: 700;">Settings ⚙️</a>
            </div>
            ${(window.FarmPilotI18n ? window.FarmPilotI18n.getLanguages() : []).map(l => {
              const isCurrent = window.FarmPilotI18n && window.FarmPilotI18n.getCurrentLanguage().code === l.code;
              return `
                <button onclick="FarmPilotApp.switchLanguage('${l.code}')" style="display: flex; align-items: center; justify-content: space-between; width: 100%; text-align: left; padding: 0.45rem 0.6rem; border: none; background: ${isCurrent ? '#ECFDF5' : 'transparent'}; border-radius: 6px; cursor: pointer; font-size: 0.75rem; transition: background 0.15s;" onmouseover="if(!${isCurrent}) this.style.background='#F8FAFC'" onmouseout="if(!${isCurrent}) this.style.background='transparent'">
                  <span style="display: flex; align-items: center; gap: 0.45rem; font-weight: ${isCurrent ? '800' : '600'}; color: ${isCurrent ? '#065F46' : '#1E293B'};">
                    <span>${l.flag}</span>
                    <span>${l.name}</span>
                    <span style="color: #64748B; font-size: 0.7rem;">(${l.native})</span>
                  </span>
                  ${isCurrent ? '<span style="color: #059669; font-weight: 800;">✓</span>' : ''}
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Locked Authentic Role Badge (Non-switchable from menu per RBAC security policy) -->
        <div style="display: flex; align-items: center; gap: 0.4rem; background: ${role === 'OWNER' ? '#ECFDF5' : role === 'WORKER' ? '#FEF3C7' : role === 'MANAGER' ? '#EFF6FF' : '#FAF5FF'}; border: 1.5px solid ${role === 'OWNER' ? '#86EFAC' : role === 'WORKER' ? '#FCD34D' : role === 'MANAGER' ? '#93C5FD' : '#D8B4FE'}; padding: 0.22rem 0.65rem; border-radius: var(--radius-full);" title="Active Role: ${user.roleLabel || role}">
          <span style="font-size: 0.8125rem;">${role === 'OWNER' ? '👑' : role === 'WORKER' ? '🚜' : role === 'MANAGER' ? '👔' : '🔬'}</span>
          <span style="font-size: 0.6875rem; font-weight: 800; color: ${role === 'OWNER' ? '#047857' : role === 'WORKER' ? '#92400E' : role === 'MANAGER' ? '#1E40AF' : '#6B21A8'}; letter-spacing: 0.02em;">
            ${role} ${user.username ? `(@${user.username})` : ''}
          </span>
        </div>

        <!-- PROFILE BUTTON & COMPREHENSIVE USER MENU -->
        <div style="position: relative;" id="header-profile-wrapper">
          <button id="header-profile-btn" onclick="FarmPilotApp.toggleProfileMenu(event)" style="display: flex; align-items: center; gap: 0.5rem; background: var(--color-surface); border: 1.5px solid var(--color-border); padding: 0.25rem 0.6rem 0.25rem 0.35rem; border-radius: var(--radius-full); cursor: pointer; box-shadow: var(--shadow-sm); transition: all 0.2s;" onmouseover="this.style.borderColor='var(--color-emerald-light)'" onmouseout="this.style.borderColor='var(--color-border)'">
            <div style="width: 28px; height: 28px; border-radius: 50%; overflow: hidden; border: 1px solid var(--color-border); flex-shrink: 0;">
              ${headerAvatar}
            </div>
            <span style="font-size: 0.8125rem; font-weight: 800; color: var(--color-text-primary); max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${user.full_name ? user.full_name.split(' ')[0] : 'Profile'}
            </span>
            <span style="font-size: 0.625rem; color: var(--color-text-tertiary);">▾</span>
          </button>

          <!-- Floating Comprehensive Profile Dropdown -->
          <div id="header-profile-dropdown" style="display: none; position: absolute; right: 0; top: calc(100% + 8px); width: 295px; background: #FFFFFF; border: 1px solid var(--color-border); border-radius: var(--radius-lg); box-shadow: 0 12px 28px -5px rgba(0,0,0,0.18), 0 8px 10px -6px rgba(0,0,0,0.1); z-index: 9999; padding: 1rem; animation: fadeIn 0.15s ease-out;">
            
            <!-- User Photo, Name & Image Upload Trigger -->
            <div style="display: flex; flex-direction: column; align-items: center; text-align: center; padding-bottom: 0.875rem; border-bottom: 1px solid var(--color-border);">
              <div style="position: relative; width: 68px; height: 68px; margin-bottom: 0.5rem;">
                <div style="width: 68px; height: 68px; border-radius: 50%; overflow: hidden; border: 2.5px solid #10B981; box-shadow: var(--shadow-sm); background: #F1F5F9;">
                  ${user.avatar_image ? `
                    <img src="${user.avatar_image}" alt="Profile Photo" style="width: 100%; height: 100%; object-fit: cover;">
                  ` : `
                    <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: var(--color-forest); color: #FFFFFF; font-size: 1.5rem; font-weight: 800;">
                      ${user.avatar || (user.full_name ? user.full_name.charAt(0).toUpperCase() : 'F')}
                    </div>
                  `}
                </div>
                <!-- Camera icon trigger for instant image upload -->
                <label for="header-avatar-input" title="Upload Custom Profile Picture" style="position: absolute; bottom: 0; right: 0; background: #059669; color: #FFFFFF; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; cursor: pointer; border: 2px solid #FFFFFF; box-shadow: 0 2px 5px rgba(0,0,0,0.25);">
                  📷
                </label>
                <input type="file" id="header-avatar-input" accept="image/*" style="display: none;" onchange="FarmPilotApp.handleProfileImageUpload(event)">
              </div>

              <h4 style="margin: 0; font-size: 0.9375rem; font-weight: 800; color: var(--color-text-primary); line-height: 1.2;">
                ${user.full_name || 'Farm Executive'}
              </h4>
              <p style="margin: 2px 0 6px; font-size: 0.75rem; color: var(--color-text-secondary); word-break: break-all;">
                ${user.email || 'farmer@greenvalley.in'}
              </p>
              
              <span style="font-size: 0.6875rem; font-weight: 800; padding: 2px 8px; border-radius: 4px; background: ${badgeStyle.bg}; color: ${badgeStyle.text}; border: 1px solid ${badgeStyle.border}; margin-bottom: 0.5rem;">
                ${badgeStyle.label}
              </span>

              <label for="header-avatar-input" class="btn btn-outline btn-sm" style="font-size: 0.6875rem; padding: 0.25rem 0.65rem; border-radius: 20px; color: #059669; border-color: #A7F3D0; cursor: pointer; display: flex; align-items: center; gap: 0.35rem;">
                <span>📷</span>
                <span>Upload Profile Photo</span>
              </label>
            </div>

            <!-- Features & Profile Capabilities List -->
            <div style="padding: 0.75rem 0; border-bottom: 1px solid var(--color-border); font-size: 0.8125rem;">
              <a href="dashboard.html" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.35rem 0.5rem; border-radius: 4px; color: var(--color-text-primary); text-decoration: none; font-weight: 600; font-size: 0.75rem;" onmouseover="this.style.background='#F8FAFC'" onmouseout="this.style.background='transparent'">
                <span>📊</span>
                <span>Dashboard Overview</span>
              </a>
              <a href="roles.html" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.35rem 0.5rem; border-radius: 4px; color: var(--color-text-primary); text-decoration: none; font-weight: 600; font-size: 0.75rem;" onmouseover="this.style.background='#F8FAFC'" onmouseout="this.style.background='transparent'">
                <span>👥</span>
                <span>Roles & Permissions Matrix</span>
              </a>
              <a href="audit.html" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.35rem 0.5rem; border-radius: 4px; color: var(--color-text-primary); text-decoration: none; font-weight: 600; font-size: 0.75rem;" onmouseover="this.style.background='#F8FAFC'" onmouseout="this.style.background='transparent'">
                <span>📜</span>
                <span>Tamper-Evident Audit History</span>
              </a>
              <a href="labour.html" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.35rem 0.5rem; border-radius: 4px; color: var(--color-text-primary); text-decoration: none; font-weight: 600; font-size: 0.75rem;" onmouseover="this.style.background='#F8FAFC'" onmouseout="this.style.background='transparent'">
                <span>👷</span>
                <span>Labour & Shift Management</span>
              </a>
              <a href="alerts.html" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.35rem 0.5rem; border-radius: 4px; color: var(--color-text-primary); text-decoration: none; font-weight: 600; font-size: 0.75rem;" onmouseover="this.style.background='#F8FAFC'" onmouseout="this.style.background='transparent'">
                <span>🔔</span>
                <span>Notification Settings</span>
              </a>
              <a href="intelligence.html" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.35rem 0.5rem; border-radius: 4px; color: var(--color-text-primary); text-decoration: none; font-weight: 600; font-size: 0.75rem;" onmouseover="this.style.background='#F8FAFC'" onmouseout="this.style.background='transparent'">
                <span>🛡️</span>
                <span>Security & Telemetry</span>
              </a>
              <a href="settings.html" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.35rem 0.5rem; border-radius: 4px; color: var(--color-forest); text-decoration: none; font-weight: 800; font-size: 0.75rem; background: #F0FDF4;" onmouseover="this.style.background='#DCFCE7'" onmouseout="this.style.background='#F0FDF4'">
                <span>⚙️</span>
                <span>Settings & FarmPilot AI (24 Langs)</span>
              </a>
              <button onclick="window.FarmPilotOffline ? window.FarmPilotOffline.promptInstall() : null" style="display: flex; align-items: center; gap: 0.5rem; width: 100%; border: none; background: #ECFDF5; padding: 0.4rem 0.5rem; border-radius: 4px; color: #047857; font-weight: 800; font-size: 0.75rem; cursor: pointer; text-align: left; margin-top: 0.25rem;" onmouseover="this.style.background='#D1FAE5'" onmouseout="this.style.background='#ECFDF5'">
                <span>📲</span>
                <span>Install Offline Web App</span>
              </button>
            </div>

            <!-- PROMINENT HEADER SIGN OUT BUTTON -->
            <div style="padding-top: 0.75rem;">
              <button onclick="window.FarmPilotAuth.logout()" class="btn" style="width: 100%; background: #DC2626; color: #FFFFFF; font-weight: 800; font-size: 0.8125rem; padding: 0.55rem; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; gap: 0.5rem; border: none; cursor: pointer; box-shadow: 0 2px 6px rgba(220, 38, 38, 0.25); transition: background 0.2s;" onmouseover="this.style.background='#B91C1C'" onmouseout="this.style.background='#DC2626'">
                <span>🚪</span>
                <span>Sign Out of FarmPilot</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Farm change event listener
    const farmSelect = document.getElementById('farm-selector-select');
    if (farmSelect) {
      farmSelect.addEventListener('change', async (e) => {
        await window.FarmPilotDB.setActiveFarm(e.target.value);
        window.location.reload();
      });
    }

    // Close profile & language dropdown on outside click
    document.addEventListener('click', (e) => {
      const wrapper = document.getElementById('header-profile-wrapper');
      const dropdown = document.getElementById('header-profile-dropdown');
      if (dropdown && wrapper && !wrapper.contains(e.target)) {
        dropdown.style.display = 'none';
      }

      const langWrapper = document.getElementById('header-lang-wrapper');
      const langDropdown = document.getElementById('header-lang-dropdown');
      if (langDropdown && langWrapper && !langWrapper.contains(e.target)) {
        langDropdown.style.display = 'none';
      }
    });
  },

  toggleLangMenu(e) {
    if (e) e.stopPropagation();
    const dropdown = document.getElementById('header-lang-dropdown');
    if (dropdown) {
      const isVisible = dropdown.style.display === 'block';
      dropdown.style.display = isVisible ? 'none' : 'block';
    }
  },

  switchLanguage(code) {
    let lang = null;
    if (window.FarmPilotI18n) {
      lang = window.FarmPilotI18n.setLanguage(code);
    }
    const dropdown = document.getElementById('header-lang-dropdown');
    if (dropdown) dropdown.style.display = 'none';
    this.renderHeader();
    this.renderSidebar();
    if (window.FarmPilotI18n) {
      window.FarmPilotI18n.applyTranslations(code);
    }
    if (lang) {
      this.showToast(`🌐 ${lang.name} (${lang.native})`, 'success');
    }
  },

  toggleProfileMenu(e) {
    if (e) e.stopPropagation();
    const dropdown = document.getElementById('header-profile-dropdown');
    if (dropdown) {
      const isVisible = dropdown.style.display === 'block';
      dropdown.style.display = isVisible ? 'none' : 'block';
    }
  },

  handleProfileImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.showToast('Please select a valid image file.', 'danger');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      this.showToast('Image file size must be under 3MB.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      window.FarmPilotAuth.updateProfileImage(dataUrl);
      this.showToast('Profile photo successfully updated! 📸', 'success');
      this.renderHeader();
      this.renderSidebar();
    };
    reader.readAsDataURL(file);
  },

  setupShortcuts() {
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this.openCommandPalette();
      }
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });
  },

  openCommandPalette() {
    let modal = document.getElementById('command-palette-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'command-palette-modal';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 480px; padding: 0; overflow: hidden;">
          <div style="padding: 0.875rem 1rem; border-bottom: 1px solid var(--color-border); display: flex; align-items: center; gap: 0.5rem;">
            <span>🔍</span>
            <input type="text" id="cmd-input" placeholder="Type a command or jump to page..." style="border: none; outline: none; width: 100%; font-size: 0.875rem; background: transparent;">
            <kbd class="font-mono" style="font-size: 0.625rem; color: #94A3B8;">ESC</kbd>
          </div>
          <div style="padding: 0.5rem; display: flex; flex-direction: column; gap: 0.25rem; max-height: 320px; overflow-y: auto;">
            <a href="dashboard.html" class="nav-item" style="padding: 0.5rem 0.75rem;">📊 Dashboard Command Center</a>
            <a href="farms.html" class="nav-item" style="padding: 0.5rem 0.75rem;">🚜 Farms & Land Holdings</a>
            <a href="crops.html" class="nav-item" style="padding: 0.5rem 0.75rem;">🌱 Crop Cycles Operational Workspace</a>
            <a href="activities.html" class="nav-item" style="padding: 0.5rem 0.75rem;">📋 Field Operations Ledger</a>
            <a href="worker.html" class="nav-item" style="padding: 0.5rem 0.75rem;">📱 Mobile Worker Shift View</a>
            <a href="alerts.html" class="nav-item" style="padding: 0.5rem 0.75rem;">🔔 Centralized Alert Center</a>
            <a href="reports.html" class="nav-item" style="padding: 0.5rem 0.75rem;">📑 Executive Reports & CSV Export</a>
            <a href="inputs.html" class="nav-item" style="padding: 0.5rem 0.75rem;">📦 Agronomic Inputs & Stock</a>
            <a href="expenses.html" class="nav-item" style="padding: 0.5rem 0.75rem;">💰 Financial Ledger & Budget</a>
            <a href="intelligence.html" class="nav-item" style="padding: 0.5rem 0.75rem;">🧠 Farm Health & Advisory</a>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
      });
    }

    modal.classList.add('active');
    setTimeout(() => {
      const input = document.getElementById('cmd-input');
      if (input) input.focus();
    }, 50);
  },

  closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    const profileDropdown = document.getElementById('header-profile-dropdown');
    if (profileDropdown) profileDropdown.style.display = 'none';
  }
};
