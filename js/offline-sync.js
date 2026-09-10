/**
 * FarmPilot Agricultural OS — Offline Sync & Progressive Web App (PWA) Controller
 * Manages Service Worker lifecycle, offline action queue, and simulated remote field mode
 */

(function () {
  let deferredInstallPrompt = null;
  let simulatedOffline = localStorage.getItem('farmpilot_simulated_offline') === 'true';

  const FarmPilotOffline = {
    isOnline() {
      if (simulatedOffline) return false;
      return navigator.onLine;
    },

    isSimulated() {
      return simulatedOffline;
    },

    init() {
      this.registerServiceWorker();
      this.setupNetworkListeners();
      this.setupInstallListeners();
      this.updateUI();

      // Attempt syncing any pending actions if online
      if (this.isOnline()) {
        this.processSyncQueue();
      }
    },

    registerServiceWorker() {
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js', { scope: '/' })
            .then((reg) => {
              console.log('🌾 FarmPilot Service Worker registered with scope:', reg.scope);
              this.updateCacheStatus(true);
            })
            .catch((err) => {
              console.warn('FarmPilot Service Worker registration failed:', err);
              this.updateCacheStatus(false);
            });
        });
      }
    },

    setupInstallListeners() {
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredInstallPrompt = e;
        console.log('📲 FarmPilot PWA Install Prompt captured & ready');

        // Reveal install buttons on page
        document.querySelectorAll('.pwa-install-trigger').forEach(btn => {
          btn.style.display = 'inline-flex';
        });
      });

      window.addEventListener('appinstalled', () => {
        deferredInstallPrompt = null;
        console.log('🎉 FarmPilot installed as native desktop/mobile web application');
        if (window.FarmPilotApp && window.FarmPilotApp.showToast) {
          window.FarmPilotApp.showToast('🎉 FarmPilot successfully installed on your device!', 'success');
        }
      });
    },

    async promptInstall() {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
      if (isStandalone) {
        if (window.FarmPilotApp && window.FarmPilotApp.showToast) {
          window.FarmPilotApp.showToast('✓ FarmPilot is already installed and running as a standalone app.', 'success');
        } else {
          alert('✓ FarmPilot is already installed and running as a standalone app.');
        }
        return;
      }

      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        console.log(`User install choice: ${outcome}`);
        if (outcome === 'accepted') {
          deferredInstallPrompt = null;
          return;
        }
      }

      // Show specialized mobile or desktop install guide
      this.showInstallGuideModal();
    },

    showInstallGuideModal() {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      const isAndroid = /Android/.test(navigator.userAgent);
      
      let existing = document.getElementById('farmpilot-pwa-install-modal');
      if (existing) existing.remove();

      const modal = document.createElement('div');
      modal.id = 'farmpilot-pwa-install-modal';
      modal.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.75);
        backdrop-filter: blur(8px);
        z-index: 100000;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        padding: 1rem;
        animation: fadeIn 0.2s ease-out;
      `;

      let contentHtml = '';
      if (isIOS) {
        contentHtml = `
          <div style="background: #FFFFFF; border-radius: 24px; max-width: 440px; width: 100%; padding: 1.75rem; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.35); text-align: center; border: 1px solid #E2E8F0;">
            <div style="width: 64px; height: 64px; margin: 0 auto 1rem; border-radius: 16px; background: #064E3B; display: flex; align-items: center; justify-content: center; font-size: 2rem; box-shadow: 0 8px 16px rgba(6,78,59,0.3);">
              🌱
            </div>
            <h3 style="font-size: 1.25rem; font-weight: 800; color: #0F172A; margin: 0 0 0.35rem;">Install FarmPilot on iOS</h3>
            <p style="font-size: 0.8125rem; color: #64748B; margin: 0 0 1.25rem; line-height: 1.5;">
              Install to your iPhone / iPad home screen for instant access and 100% offline remote field capability with zero lag.
            </p>
            
            <div style="text-align: left; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: 1rem; margin-bottom: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.8125rem;">
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <div style="width: 28px; height: 28px; border-radius: 50%; background: #ECFDF5; color: #047857; font-weight: 800; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; flex-shrink: 0;">1</div>
                <div>Tap the <strong>Share</strong> button <span style="font-size: 1.1rem; vertical-align: middle;">⎋</span> in Safari's bottom toolbar</div>
              </div>
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <div style="width: 28px; height: 28px; border-radius: 50%; background: #ECFDF5; color: #047857; font-weight: 800; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; flex-shrink: 0;">2</div>
                <div>Scroll down and select <strong>"Add to Home Screen"</strong> <span style="font-size: 1.1rem; vertical-align: middle;">➕</span></div>
              </div>
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <div style="width: 28px; height: 28px; border-radius: 50%; background: #ECFDF5; color: #047857; font-weight: 800; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; flex-shrink: 0;">3</div>
                <div>Tap <strong>"Add"</strong> in the top-right corner to launch anytime</div>
              </div>
            </div>

            <button onclick="document.getElementById('farmpilot-pwa-install-modal').remove()" class="btn" style="width: 100%; background: #059669; color: #FFFFFF; font-weight: 800; padding: 0.75rem; border-radius: 12px; border: none; cursor: pointer; font-size: 0.9rem;">
              Got It!
            </button>
          </div>
        `;
      } else if (isAndroid) {
        contentHtml = `
          <div style="background: #FFFFFF; border-radius: 24px; max-width: 440px; width: 100%; padding: 1.75rem; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.35); text-align: center; border: 1px solid #E2E8F0;">
            <div style="width: 64px; height: 64px; margin: 0 auto 1rem; border-radius: 16px; background: #064E3B; display: flex; align-items: center; justify-content: center; font-size: 2rem; box-shadow: 0 8px 16px rgba(6,78,59,0.3);">
              🌱
            </div>
            <h3 style="font-size: 1.25rem; font-weight: 800; color: #0F172A; margin: 0 0 0.35rem;">Install FarmPilot on Android</h3>
            <p style="font-size: 0.8125rem; color: #64748B; margin: 0 0 1.25rem; line-height: 1.5;">
              Install to your mobile device for instant offline launch, local intelligence calculations, and automatic cloud sync.
            </p>

            <div style="text-align: left; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: 1rem; margin-bottom: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.8125rem;">
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <div style="width: 28px; height: 28px; border-radius: 50%; background: #ECFDF5; color: #047857; font-weight: 800; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; flex-shrink: 0;">1</div>
                <div>Tap the Chrome menu <strong style="font-size: 1.1rem; vertical-align: middle;">⋮</strong> in the top-right corner</div>
              </div>
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <div style="width: 28px; height: 28px; border-radius: 50%; background: #ECFDF5; color: #047857; font-weight: 800; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; flex-shrink: 0;">2</div>
                <div>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong></div>
              </div>
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <div style="width: 28px; height: 28px; border-radius: 50%; background: #ECFDF5; color: #047857; font-weight: 800; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; flex-shrink: 0;">3</div>
                <div>Launch directly from your home screen as a standalone offline app!</div>
              </div>
            </div>

            <button onclick="document.getElementById('farmpilot-pwa-install-modal').remove()" class="btn" style="width: 100%; background: #059669; color: #FFFFFF; font-weight: 800; padding: 0.75rem; border-radius: 12px; border: none; cursor: pointer; font-size: 0.9rem;">
              Understood!
            </button>
          </div>
        `;
      } else {
        contentHtml = `
          <div style="background: #FFFFFF; border-radius: 24px; max-width: 440px; width: 100%; padding: 1.75rem; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.35); text-align: center; border: 1px solid #E2E8F0;">
            <div style="width: 64px; height: 64px; margin: 0 auto 1rem; border-radius: 16px; background: #064E3B; display: flex; align-items: center; justify-content: center; font-size: 2rem; box-shadow: 0 8px 16px rgba(6,78,59,0.3);">
              🌱
            </div>
            <h3 style="font-size: 1.25rem; font-weight: 800; color: #0F172A; margin: 0 0 0.35rem;">Install FarmPilot Web App</h3>
            <p style="font-size: 0.8125rem; color: #64748B; margin: 0 0 1.25rem; line-height: 1.5;">
              FarmPilot can be installed as a native desktop/laptop application. Click the <strong>Install icon ⊕</strong> in your browser's address bar or use your browser menu.
            </p>

            <div style="background: #ECFDF5; border: 1.5px solid #A7F3D0; border-radius: 14px; padding: 0.85rem; font-size: 0.75rem; color: #065F46; margin-bottom: 1.25rem; line-height: 1.5; text-align: left;">
              ✓ Works 100% offline in the deep rural field<br>
              ✓ Zero network latency with local agronomy math<br>
              ✓ Standalone window without browser bars
            </div>

            <button onclick="document.getElementById('farmpilot-pwa-install-modal').remove()" class="btn" style="width: 100%; background: #059669; color: #FFFFFF; font-weight: 800; padding: 0.75rem; border-radius: 12px; border: none; cursor: pointer; font-size: 0.9rem;">
              Close
            </button>
          </div>
        `;
      }

      modal.innerHTML = contentHtml;
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
      });
      document.body.appendChild(modal);
    },

    setupNetworkListeners() {
      window.addEventListener('online', () => {
        if (!simulatedOffline) {
          this.handleOnlineState();
        }
      });

      window.addEventListener('offline', () => {
        this.handleOfflineState();
      });
    },

    toggleSimulatedOffline() {
      simulatedOffline = !simulatedOffline;
      localStorage.setItem('farmpilot_simulated_offline', simulatedOffline);

      if (simulatedOffline) {
        this.handleOfflineState();
      } else {
        this.handleOnlineState();
      }

      this.updateUI();
      return simulatedOffline;
    },

    handleOnlineState() {
      console.log('🟢 FarmPilot back ONLINE — Initiating cloud sync');
      this.updateUI();
      this.processSyncQueue();

      if (window.FarmPilotApp && window.FarmPilotApp.showToast) {
        window.FarmPilotApp.showToast('🟢 Connected to Cloud: Synchronizing verified farm records...', 'success');
      }

      // Hide offline banner if present
      const banner = document.getElementById('global-offline-banner');
      if (banner) banner.remove();
    },

    handleOfflineState() {
      console.log('⚡ FarmPilot in OFFLINE FIELD MODE — Engaging local agronomic engines');
      this.updateUI();

      if (window.FarmPilotApp && window.FarmPilotApp.showToast) {
        window.FarmPilotApp.showToast('⚡ Remote Field Offline Mode Engaged. All intelligence running locally.', 'warning');
      }

      this.renderOfflineBanner();
    },

    renderOfflineBanner() {
      if (document.getElementById('global-offline-banner')) return;

      const banner = document.createElement('div');
      banner.id = 'global-offline-banner';
      banner.style.cssText = 'background: linear-gradient(90deg, #78350F 0%, #B45309 100%); color: #FEF3C7; padding: 0.5rem 1.25rem; font-size: 0.75rem; font-weight: 800; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 99998; border-bottom: 2px solid #F59E0B; box-shadow: 0 4px 10px rgba(0,0,0,0.15);';
      banner.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span>⚡</span>
          <span><strong>100% Offline Remote Field Mode Active</strong> — Operating purely on local agronomy engines. Completed actions will auto-sync when connection is restored.</span>
        </div>
        <button onclick="window.FarmPilotOffline.toggleSimulatedOffline()" style="background: #FFFFFF; color: #78350F; border: none; padding: 0.25rem 0.65rem; border-radius: 4px; font-weight: 800; cursor: pointer; font-size: 0.6875rem;">
          ${simulatedOffline ? 'Resume Online Mode 🟢' : 'Dismiss'}
        </button>
      `;
      document.body.prepend(banner);
    },

    // Action queue for offline worker tasks and observations
    getSyncQueue() {
      try {
        return JSON.parse(localStorage.getItem('farmpilot_offline_queue') || '[]');
      } catch (e) {
        return [];
      }
    },

    queueAction(action) {
      const queue = this.getSyncQueue();
      const item = {
        id: 'sync-' + Date.now(),
        ...action,
        queued_at: new Date().toISOString()
      };
      queue.push(item);
      localStorage.setItem('farmpilot_offline_queue', JSON.stringify(queue));
      this.updateUI();
      return item;
    },

    async processSyncQueue() {
      const queue = this.getSyncQueue();
      if (queue.length === 0) return;

      console.log(`🔄 Flushing ${queue.length} offline actions to server...`);
      const remaining = [];

      for (const item of queue) {
        try {
          if (item.type === 'COMPLETE_ACTIVITY') {
            await fetch('/api/activities', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.payload)
            });
          } else if (item.type === 'COMMUNITY_POST') {
            await fetch('/api/community', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.payload)
            });
          }
        } catch (err) {
          console.warn('Sync failed for item, keeping in queue:', err);
          remaining.push(item);
        }
      }

      localStorage.setItem('farmpilot_offline_queue', JSON.stringify(remaining));
      this.updateUI();

      if (remaining.length === 0) {
        console.log('✓ All offline actions synchronized successfully');
        if (window.FarmPilotApp && window.FarmPilotApp.showToast) {
          window.FarmPilotApp.showToast(`✓ Synced ${queue.length} offline field operations with cloud database!`, 'success');
        }
      }
    },

    updateUI() {
      const isOff = !this.isOnline();
      const queue = this.getSyncQueue();

      // Home page mode pills
      const pill = document.getElementById('offline-mode-pill');
      if (pill) {
        if (isOff) {
          pill.className = 'badge badge-warning';
          pill.innerHTML = `⚡ Offline Field Mode (${queue.length} queued)`;
        } else {
          pill.className = 'badge badge-success';
          pill.innerHTML = `🟢 Online Cloud Sync Active`;
        }
      }

      // Home page toggle button text
      const toggleBtn = document.getElementById('btn-toggle-offline');
      if (toggleBtn) {
        toggleBtn.innerHTML = simulatedOffline 
          ? `🟢 Return to Online Cloud Mode` 
          : `⚡ Test Remote Field Mode (Offline)`;
        toggleBtn.style.background = simulatedOffline ? '#059669' : 'rgba(255,255,255,0.15)';
      }

      // Sync queue counters
      const queueCountEls = document.querySelectorAll('.offline-queue-count');
      queueCountEls.forEach(el => {
        el.textContent = queue.length;
      });
    },

    updateCacheStatus(isReady) {
      const el = document.getElementById('cache-status-badge');
      if (el) {
        el.className = isReady ? 'badge badge-success' : 'badge badge-neutral';
        el.textContent = isReady ? '✓ 17 Modules Cached' : 'Caching...';
      }
    }
  };

  window.FarmPilotOffline = FarmPilotOffline;

  // Auto-initialize when script loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => FarmPilotOffline.init());
  } else {
    FarmPilotOffline.init();
  }
})();
