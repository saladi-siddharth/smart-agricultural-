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
    const isWorker = user.role === 'WORKER';

    const navItems = isWorker ? [
      {
        group: 'Worker Shift',
        items: [
          { id: 'worker', label: "Today's Tasks", icon: '🚜', href: 'worker.html', badge: 'Active Shift', badgeType: 'success' },
          { id: 'activities', label: 'All Field Tasks', icon: '📋', href: 'activities.html' }
        ]
      }
    ] : [
      {
        group: 'Overview',
        items: [
          { id: 'dashboard', label: 'Dashboard', icon: '📊', href: 'dashboard.html' },
          { id: 'farms', label: 'Farms Portfolio', icon: '🚜', href: 'farms.html' },
          { id: 'crops', label: 'Crop Cycles', icon: '🌱', href: 'crops.html', badge: 'Active' }
        ]
      },
      {
        group: 'Operations',
        items: [
          { id: 'activities', label: 'Field Operations', icon: '📋', href: 'activities.html', badge: '1 Overdue', badgeType: 'danger' },
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
          { id: 'worker', label: "Mobile Worker View", icon: '📱', href: 'worker.html' }
        ]
      }
    ];

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

      <!-- Sidebar Footer -->
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

        <!-- User Profile & Sign Out -->
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem; border-radius: var(--radius-md); background-color: var(--color-surface-secondary); border: 1px solid var(--color-border);">
          <div style="display: flex; align-items: center; gap: 0.5rem; min-width: 0;">
            <div style="width: 28px; height: 28px; border-radius: var(--radius-sm); background-color: var(--color-forest); color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; flex-shrink: 0;">
              ${user.avatar || (user.full_name ? user.full_name.charAt(0).toUpperCase() : 'F')}
            </div>
            <div style="min-width: 0;">
              <p style="font-size: 0.75rem; font-weight: 800; color: var(--color-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.1;">
                ${user.full_name || 'Farm Operator'}
              </p>
              <p style="font-size: 0.625rem; color: var(--color-emerald-dark); font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${user.roleLabel || user.role}
              </p>
            </div>
          </div>
          <button onclick="window.FarmPilotAuth.logout()" title="Sign out" style="color: #94A3B8; hover:color: #EF4444; font-size: 0.75rem; background:none; border:none; cursor:pointer;">
            🚪
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
    const activeFarm = window.FarmPilotDB ? await window.FarmPilotDB.getActiveFarm() : window.FARMPILOT_CONFIG.DEFAULT_FARMS[0];
    const farms = window.FarmPilotDB ? await window.FarmPilotDB.getFarms() : window.FARMPILOT_CONFIG.DEFAULT_FARMS;

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

      <!-- Right: Demo Persona Switcher & Search -->
      <div style="display: flex; align-items: center; gap: 0.65rem;">
        <!-- Demo Persona Switcher Dropdown -->
        <div style="display: flex; align-items: center; gap: 0.35rem; background: #FEF3C7; border: 1px solid #FCD34D; padding: 0.2rem 0.6rem; border-radius: var(--radius-md);" title="Switch Role Persona for Live Demo">
          <span style="font-size: 0.6875rem; font-weight: 800; color: #92400E;">ROLE:</span>
          <select id="role-persona-select" style="background: transparent; border: none; font-size: 0.75rem; font-weight: 800; color: #78350F; cursor: pointer; outline: none;" onchange="window.FarmPilotAuth.switchPersona(this.value)">
            <option value="OWNER" ${user.role === 'OWNER' ? 'selected' : ''}>👑 Owner (Siddharth)</option>
            <option value="MANAGER" ${user.role === 'MANAGER' ? 'selected' : ''}>🛠️ Manager (Rajesh)</option>
            <option value="WORKER" ${user.role === 'WORKER' ? 'selected' : ''}>🚜 Worker (Ravi)</option>
            <option value="CONSULTANT" ${user.role === 'CONSULTANT' ? 'selected' : ''}>🔬 Consultant (Swaminathan)</option>
          </select>
        </div>

        <button onclick="FarmPilotApp.openCommandPalette()" class="btn btn-secondary btn-sm" style="display: flex; align-items: center; gap: 0.35rem; color: var(--color-text-secondary);">
          <span>🔍</span>
          <span>Search</span>
          <kbd class="font-mono" style="background: #FFFFFF; border: 1px solid #CBD5E1; padding: 0.1rem 0.35rem; border-radius: 4px; font-size: 0.625rem;">⌘K</kbd>
        </button>
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
  }
};
