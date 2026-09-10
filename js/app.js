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
    const role = user.role || 'OWNER';

    // Role-based route guard
    if (role === 'WORKER' && ['expenses', 'farms', 'reports', 'dashboard', 'crops', 'inputs'].includes(this.activePage)) {
      window.location.href = 'worker.html';
      return;
    }
    if (role === 'CONSULTANT' && ['expenses', 'farms'].includes(this.activePage)) {
      window.location.href = 'crops.html';
      return;
    }
    if (role === 'MANAGER' && ['reports'].includes(this.activePage)) {
      window.location.href = 'dashboard.html';
      return;
    }

    let navItems = [];

    if (role === 'WORKER') {
      // 3 Links Total
      navItems = [
        {
          group: 'Field Worker Shift',
          items: [
            { id: 'worker', label: "Today's Shift", icon: '🚜', href: 'worker.html', badge: 'Active Shift', badgeType: 'success' },
            { id: 'activities', label: 'Field Tasks & AWD', icon: '📋', href: 'activities.html', badge: '1 Overdue', badgeType: 'danger' }
          ]
        },
        {
          group: 'Field Notifications',
          items: [
            { id: 'alerts', label: 'Alert Center', icon: '🔔', href: 'alerts.html', badge: '1 Urgent', badgeType: 'danger' }
          ]
        }
      ];
    } else if (role === 'CONSULTANT') {
      // 7 Links Total
      navItems = [
        {
          group: 'Agronomic Overview',
          items: [
            { id: 'dashboard', label: 'Dashboard', icon: '📊', href: 'dashboard.html' },
            { id: 'crops', label: 'Crop Cycles & Phenology', icon: '🌱', href: 'crops.html', badge: 'Active' }
          ]
        },
        {
          group: 'Field Management',
          items: [
            { id: 'activities', label: 'Field Operations & AWD', icon: '📋', href: 'activities.html', badge: '1 Overdue', badgeType: 'danger' },
            { id: 'inputs', label: 'Inputs & Stock', icon: '📦', href: 'inputs.html' }
          ]
        },
        {
          group: 'Advisory & Intel',
          items: [
            { id: 'alerts', label: 'Alert Center', icon: '🔔', href: 'alerts.html', badge: '1 Urgent', badgeType: 'danger' },
            { id: 'intelligence', label: 'Farm Health & Soil', icon: '🧠', href: 'intelligence.html', badge: '82/100', badgeType: 'success' },
            { id: 'reports', label: 'Agronomic Reports', icon: '📑', href: 'reports.html' }
          ]
        }
      ];
    } else if (role === 'MANAGER') {
      // 9 Links Total
      navItems = [
        {
          group: 'Operations Command',
          items: [
            { id: 'dashboard', label: 'Dashboard', icon: '📊', href: 'dashboard.html' },
            { id: 'farms', label: 'Farms Portfolio', icon: '🚜', href: 'farms.html' },
            { id: 'crops', label: 'Crop Cycles', icon: '🌱', href: 'crops.html', badge: 'Active' }
          ]
        },
        {
          group: 'Field & Logistics',
          items: [
            { id: 'activities', label: 'Field Operations & AWD', icon: '📋', href: 'activities.html', badge: '1 Overdue', badgeType: 'danger' },
            { id: 'inputs', label: 'Inputs & Stock', icon: '📦', href: 'inputs.html' },
            { id: 'expenses', label: 'Financials & Budget', icon: '💰', href: 'expenses.html' }
          ]
        },
        {
          group: 'Intelligence',
          items: [
            { id: 'alerts', label: 'Alert Center', icon: '🔔', href: 'alerts.html', badge: '1 Urgent', badgeType: 'danger' },
            { id: 'intelligence', label: 'Farm Health', icon: '🧠', href: 'intelligence.html', badge: '82/100', badgeType: 'success' }
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
      // OWNER (10 Links Total - Full enterprise oversight)
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
          group: 'Operations & Ledgers',
          items: [
            { id: 'activities', label: 'Field Operations & AWD', icon: '📋', href: 'activities.html', badge: '1 Overdue', badgeType: 'danger' },
            { id: 'inputs', label: 'Inputs & Stock', icon: '📦', href: 'inputs.html' },
            { id: 'expenses', label: 'Financials & Budget', icon: '💰', href: 'expenses.html' }
          ]
        },
        {
          group: 'Intelligence & SaaS',
          items: [
            { id: 'alerts', label: 'Alert Center', icon: '🔔', href: 'alerts.html', badge: '1 Urgent', badgeType: 'danger' },
            { id: 'intelligence', label: 'Farm Health', icon: '🧠', href: 'intelligence.html', badge: '82/100', badgeType: 'success' },
            { id: 'reports', label: 'Executive Reports', icon: '📑', href: 'reports.html' }
          ]
        },
        {
          group: 'Field Staff View',
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
            <div class="nav-group-title">${g.group}</div>
            ${g.items.map(item => `
              <a href="${item.href}" class="nav-item ${this.activePage === item.id ? 'active' : ''}">
                <span style="font-size: 1rem;">${item.icon}</span>
                <span>${item.label}</span>
                ${item.badge ? `
                  <span class="nav-badge ${item.badgeType || 'success'}">${item.badge}</span>
                ` : ''}
              </a>
            `).join('')}
          </div>
        `).join('')}

        <!-- Microclimate Weather Telemetry Widget -->
        <div class="weather-telemetry-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
            <span style="font-weight: 800; color: var(--color-forest); display: flex; align-items: center; gap: 0.35rem;">
              ☀️ Field Microclimate
            </span>
            <span class="font-mono" style="font-size: 0.5625rem; font-weight: 800; background: #FFFFFF; padding: 0.1rem 0.35rem; border-radius: 4px; color: #059669;">
              LIVE
            </span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.4rem;">
            <span class="tabular-nums font-mono" style="font-size: 1.125rem; font-weight: 800; color: var(--color-text-primary);">28°C</span>
            <span style="font-size: 0.6875rem; font-weight: 700; color: var(--color-emerald-dark);">Sunny • Optimal</span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.25rem; font-size: 0.625rem; color: var(--color-text-secondary); pt-1; border-top: 1px solid rgba(220, 252, 231, 0.8);">
            <span>💧 64% Humid</span>
            <span>💨 12 km/h WNW</span>
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
  },

  async renderHeader() {
    const headerEl = document.getElementById('app-header');
    if (!headerEl) return;

    const pageTitles = {
      dashboard: 'Dashboard Command Center',
      farms: 'Farms & Land Holdings',
      crops: 'Seasonal Crop Cycles',
      activities: 'Operations & Field Tasks',
      inputs: 'Agronomic Inputs & Stocks',
      expenses: 'Financial Outlay & Ledgers',
      intelligence: 'Farm Health & Intelligence',
      alerts: 'Centralized Alert Center',
      reports: 'Executive Reports & Analytics',
      worker: "Field Worker Shift"
    };

    const currentTitle = pageTitles[this.activePage] || 'Command Center';
    const user = window.FarmPilotAuth.getUser() || window.FARMPILOT_CONFIG.PERSONAS.OWNER;
    const role = user.role || 'OWNER';
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

      <!-- Right: Role Switcher & Profile Button (Replaces Search Bar) -->
      <div style="display: flex; align-items: center; gap: 0.65rem;">
        <!-- Demo Role Switcher Dropdown -->
        <div style="display: flex; align-items: center; gap: 0.35rem; background: #FEF3C7; border: 1px solid #FCD34D; padding: 0.2rem 0.6rem; border-radius: var(--radius-md);" title="Switch Role Persona for Live Demo">
          <span style="font-size: 0.6875rem; font-weight: 800; color: #92400E;">ROLE:</span>
          <select id="role-persona-select" style="background: transparent; border: none; font-size: 0.75rem; font-weight: 800; color: #78350F; cursor: pointer; outline: none;" onchange="window.FarmPilotAuth.switchPersona(this.value)">
            <option value="OWNER" ${role === 'OWNER' ? 'selected' : ''}>👑 Owner (Siddharth)</option>
            <option value="MANAGER" ${role === 'MANAGER' ? 'selected' : ''}>👔 Manager (Rajesh)</option>
            <option value="CONSULTANT" ${role === 'CONSULTANT' ? 'selected' : ''}>🔬 Consultant (Dr. Anita)</option>
            <option value="WORKER" ${role === 'WORKER' ? 'selected' : ''}>🚜 Worker (Ravi)</option>
          </select>
        </div>

        <!-- PROFILE BUTTON & COMPREHENSIVE USER MENU (Replaces Search Bar) -->
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
          <div id="header-profile-dropdown" style="display: none; position: absolute; right: 0; top: calc(100% + 8px); width: 285px; background: #FFFFFF; border: 1px solid var(--color-border); border-radius: var(--radius-lg); box-shadow: 0 12px 28px -5px rgba(0,0,0,0.18), 0 8px 10px -6px rgba(0,0,0,0.1); z-index: 9999; padding: 1rem; animation: fadeIn 0.15s ease-out;">
            
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
              <a href="alerts.html" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.35rem 0.5rem; border-radius: 4px; color: var(--color-text-primary); text-decoration: none; font-weight: 600; font-size: 0.75rem;" onmouseover="this.style.background='#F8FAFC'" onmouseout="this.style.background='transparent'">
                <span>🔔</span>
                <span>Notification Settings</span>
              </a>
              <a href="intelligence.html" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.35rem 0.5rem; border-radius: 4px; color: var(--color-text-primary); text-decoration: none; font-weight: 600; font-size: 0.75rem;" onmouseover="this.style.background='#F8FAFC'" onmouseout="this.style.background='transparent'">
                <span>🛡️</span>
                <span>Security & Telemetry</span>
              </a>
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

    // Close profile dropdown on outside click
    document.addEventListener('click', (e) => {
      const wrapper = document.getElementById('header-profile-wrapper');
      const dropdown = document.getElementById('header-profile-dropdown');
      if (dropdown && wrapper && !wrapper.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });
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
