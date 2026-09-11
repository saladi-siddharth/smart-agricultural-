/**
 * FarmPilot — 🏆 National Hackathon Judge Tour & 3-Minute Fast-Track Pitch Walkthrough
 * Built specifically for Swarnandhra College National Hackathon 2026 Judges & Evaluators.
 * Guides judges sequentially through the 6 core pillars:
 * 1. Real Agronomic Problem & Multi-Parcel Context
 * 2. Multi-Role RBAC & Vernacular Experience
 * 3. Smart Irrigation & Drip Alert Center
 * 4. AI Pathology Leaf Scanner & ICAR Soil Health Card
 * 5. Enterprise Resilience & The 8 Real-World Failure Scenarios
 * 6. FPO Commercial SaaS & AWD Methane Carbon Credit Monetization
 */

(function () {
  'use strict';

  const TOUR_SCENES = [
    {
      step: 1,
      badge: "Agronomic Foundation",
      badgeColor: "#059669",
      title: "Real-World Agronomic Problem & Multi-Farm Context",
      subtitle: "Green Valley Farm (25.0 Acres Paddy BPT-5204 & Maize)",
      pitch: "“In India, 82% of smallholders manage crop operations through memory and paper notes. FarmPilot transforms raw field reality into a precision agricultural operating system—tracking AWD water tube levels (-4.0 cm), soil zinc chlorosis, and break-even harvest economics.”",
      highlights: [
        "🌱 Multi-parcel cadastral mapping: North Block (Clay Loam) & Central Sector",
        "🌾 Alternate Wetting & Drying (AWD) water level telemetry",
        "💰 Real-time break-even yield calculation: 1.81 Tonnes/Acre @ ₹25.50/kg",
        "🔒 PostgreSQL Row-Level Security (RLS) across all tenant parcels"
      ],
      targetUrl: "dashboard.html",
      actionLabel: "Explore Command Dashboard →"
    },
    {
      step: 2,
      badge: "Authorization & Access",
      badgeColor: "#2563EB",
      title: "Dynamic Multi-Role RBAC & Vernacular Field Work",
      subtitle: "1-Click Role Switcher: Owner • Manager • Worker • Consultant",
      pitch: "“Enterprise agriculture requires strict organizational boundaries. The farm owner controls budgets and land titles; the manager schedules shifts; the field worker gets a distraction-free mobile view in Telugu/Hindi; and the consulting agronomist advises across multiple estates.”",
      highlights: [
        "👑 OWNER: Siddharth (Full executive oversight & financial controls)",
        "👔 MANAGER: Rajesh (Inventory, sluice gates, and staff scheduling)",
        "🚜 WORKER: Ravi (Assigned shifts, vernacular speech, financial amounts strictly hidden)",
        "🔬 CONSULTANT: Dr. Anita (Multi-farm soil health & agronomic advisory)"
      ],
      targetUrl: "roles.html",
      actionLabel: "Inspect Roles & Permissions Matrix →"
    },
    {
      step: 3,
      badge: "IoT & Hydrology",
      badgeColor: "#0284C7",
      title: "Smart Irrigation Drip Matrix & Alert Center",
      subtitle: "Penman-Monteith Evapotranspiration ($ET_c = 5.52\\text{ mm/day}$) & AWD Sluice Control",
      pitch: "“Rather than generic on/off timers, FarmPilot calculates daily crop water deficits using the FAO-56 Penman-Monteith equation, monitors live LoRaWAN pressure drops, and executes Alternate Wetting and Drying (AWD) to conserve 14,200 Liters of water per cycle.”",
      highlights: [
        "💧 Full-field micro-drip & automated canal sluice valve matrix",
        "🚨 Anomaly Alert Center: Panicle moisture deficit mitigation & line pressure drops",
        "⏱️ Diurnal window optimization: 05:30 AM – 07:30 AM low-evaporation scheduling",
        "🛑 1-Click Master Emergency All-Zones Valve Shutoff"
      ],
      targetUrl: "irrigation.html",
      actionLabel: "Open Irrigation & Drip Alert Center →"
    },
    {
      step: 4,
      badge: "AI & Soil Science",
      badgeColor: "#7C3AED",
      title: "AI Crop Pathology Scanner & Digital Soil Health Card",
      subtitle: "Computer Vision Leaf Diagnostics & Govt-Compliant SHC Export",
      pitch: "“Farmers can snap photos of infected leaves for instant pathology diagnosis (Rice Blast, Zinc chlorosis) with ICAR-approved bio-organic treatments. Furthermore, our Soil Health Center exports print-ready Soil Health Cards for bank crop loans and insurance verification.”",
      highlights: [
        "🌿 AI Leaf Disease Vision Scanner with lesion heat maps & 96.8% confidence",
        "🧪 ICAR-compliant Digital Soil Health Card with 1-click Print/PDF export",
        "💊 Dual-prescription engine: Organic bio-control vs. chemical intervention",
        "🛡️ Safety dosage guardrail preventing toxic chemical hallucinations"
      ],
      targetUrl: "soil.html",
      actionLabel: "View Soil Health & Pathology Center →"
    },
    {
      step: 5,
      badge: "Hackathon Rubric Trap",
      badgeColor: "#DC2626",
      title: "Enterprise Resilience & The 8 Real-World Failure Modes",
      subtitle: "Page 2 Guideline Principle: Edge-Case Handling & Fault Tolerance",
      pitch: "“National hackathon judges explicitly state that a sunny-day dashboard is not enough. We built an interactive resilience sandbox demonstrating how FarmPilot survives sensor failures, API 503 outages, duplicate webhooks, and farmer overrides.”",
      highlights: [
        "📡 Sensor Outage: Automatic Penman-Monteith data imputation & confidence flagging",
        "🌐 Offline PWA: Full IndexedDB mutation queue syncing when network restores",
        "⚡ Weather API Outage: Circuit breaker trips OPEN with local 7-day model fallback",
        "👨‍🌾 Farmer AI Override: Immutable audit trail logging farmer expertise"
      ],
      targetUrl: "intelligence.html#resilience-simulator",
      actionLabel: "Launch Interactive 8-Failure Simulator →"
    },
    {
      step: 6,
      badge: "Commercial Viability",
      badgeColor: "#D97706",
      title: "FPO Enterprise Aggregation & AWD Carbon Monetization",
      subtitle: "Methane Abatement ($1.1\\text{ Tonnes } CO_2e/\\text{Ha}$) & Commercial SaaS",
      pitch: "“FarmPilot is a viable agritech business. By reducing rice paddy methane emissions via Alternate Wetting and Drying (AWD), we generate verifiable carbon credits (₹38,500 extra income for Green Valley Farm) alongside a 3-tier SaaS pricing model for FPOs and commercial estates.”",
      highlights: [
        "🌍 AWD Methane Abatement: 27.5 Verified Carbon Credits generated per season",
        "👥 FPO Cooperative Enterprise Tier: Bulk purchasing & multi-member aggregation",
        "💳 Flexible monetization: Free for marginal farmers (< 2 Ac), ₹499/mo Pro, ₹4,999/mo FPO",
        "📜 Verra / Gold Standard compliant carbon offset audit certification"
      ],
      targetUrl: "reports.html#carbon-credits",
      actionLabel: "View Carbon Monetization & SaaS Plans →"
    }
  ];

  class HackathonJudgeTour {
    constructor() {
      this.currentIdx = 0;
      this.modalEl = null;
      this.init();
    }

    init() {
      this.injectStyles();
      this.createModal();
      this.bindKeyboard();
    }

    injectStyles() {
      if (document.getElementById('farmpilot-tour-styles')) return;
      const style = document.createElement('style');
      style.id = 'farmpilot-tour-styles';
      style.textContent = `
        .tour-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(10, 25, 20, 0.82);
          backdrop-filter: blur(6px);
          z-index: 999999;
          align-items: center;
          justify-content: center;
          padding: 1.25rem;
          opacity: 0;
          transition: opacity 0.25s ease;
        }
        .tour-overlay.active {
          display: flex;
          opacity: 1;
        }
        .tour-dialog {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 18px;
          max-width: 680px;
          width: 100%;
          box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.35);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          animation: tourSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes tourSlideUp {
          from { transform: translateY(24px) scale(0.97); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        .tour-header {
          background: linear-gradient(135deg, #0A2F23 0%, #134E3F 100%);
          color: #FFFFFF;
          padding: 1.25rem 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #059669;
        }
        .tour-progress-bar {
          height: 4px;
          background: #E2E8F0;
          width: 100%;
          position: relative;
        }
        .tour-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #10B981, #059669);
          transition: width 0.3s ease;
        }
        .tour-body {
          padding: 1.5rem;
          max-height: 70vh;
          overflow-y: auto;
        }
        .tour-footer {
          padding: 1rem 1.5rem;
          background: #F8FAFC;
          border-top: 1px solid #E2E8F0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .tour-pill-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          background: linear-gradient(135deg, #F59E0B, #D97706);
          color: #FFFFFF;
          border: 1.5px solid #FDE68A;
          border-radius: 9999px;
          padding: 0.35rem 0.85rem;
          font-size: 0.75rem;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(217, 119, 6, 0.28);
          transition: all 0.2s;
        }
        .tour-pill-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(217, 119, 6, 0.38);
        }
        .tour-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #CBD5E1;
          cursor: pointer;
          transition: all 0.2s;
        }
        .tour-dot.active {
          background: #059669;
          transform: scale(1.3);
        }
      `;
      document.head.appendChild(style);
    }

    createModal() {
      if (document.getElementById('hackathon-tour-modal')) return;
      const overlay = document.createElement('div');
      overlay.id = 'hackathon-tour-modal';
      overlay.className = 'tour-overlay';
      overlay.innerHTML = `
        <div class="tour-dialog" role="dialog" aria-modal="true">
          <!-- Header -->
          <div class="tour-header">
            <div style="display: flex; align-items: center; gap: 0.65rem;">
              <span style="font-size: 1.35rem;">🏆</span>
              <div>
                <h3 style="margin: 0; font-size: 1.05rem; font-weight: 800; color: #FFFFFF; letter-spacing: -0.01em;">
                  FarmPilot — National 1 Lakh Hackathon Pitch Tour
                </h3>
                <span style="font-size: 0.7rem; color: #A7F3D0; font-weight: 600;">
                  Swarnandhra 2026 Evaluation Flow • 3-Minute Fast Track
                </span>
              </div>
            </div>
            <button onclick="window.FarmPilotTour.close()" style="background: none; border: none; color: #A7F3D0; font-size: 1.35rem; cursor: pointer; padding: 0.25rem; line-height: 1;">✕</button>
          </div>

          <!-- Progress Bar -->
          <div class="tour-progress-bar">
            <div class="tour-progress-fill" id="tour-progress-fill" style="width: 16.66%;"></div>
          </div>

          <!-- Content Body -->
          <div class="tour-body" id="tour-body-content">
            <!-- Populated dynamically -->
          </div>

          <!-- Footer Navigation -->
          <div class="tour-footer">
            <div style="display: flex; align-items: center; gap: 0.5rem;" id="tour-dots-container">
              <!-- Dots injected dynamically -->
            </div>

            <div style="display: flex; align-items: center; gap: 0.65rem;">
              <button type="button" id="tour-prev-btn" onclick="window.FarmPilotTour.prev()" class="btn btn-sm btn-outline" style="font-weight: 700;">
                ← Back
              </button>
              <button type="button" id="tour-action-btn" onclick="window.FarmPilotTour.jumpToTarget()" class="btn btn-sm btn-primary" style="background: #0284C7; border-color: #0284C7; font-weight: 800;">
                <span id="tour-action-label">Explore Feature</span>
              </button>
              <button type="button" id="tour-next-btn" onclick="window.FarmPilotTour.next()" class="btn btn-sm btn-primary" style="background: #059669; border-color: #059669; font-weight: 800;">
                Next Scene →
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);
      this.modalEl = overlay;
    }

    renderScene(idx) {
      this.currentIdx = idx;
      const s = TOUR_SCENES[idx];
      const body = document.getElementById('tour-body-content');
      const progressFill = document.getElementById('tour-progress-fill');
      const dotsContainer = document.getElementById('tour-dots-container');
      const prevBtn = document.getElementById('tour-prev-btn');
      const nextBtn = document.getElementById('tour-next-btn');
      const actionLabel = document.getElementById('tour-action-label');

      if (!body) return;

      // Progress bar
      const pct = Math.round(((idx + 1) / TOUR_SCENES.length) * 100);
      if (progressFill) progressFill.style.width = `${pct}%`;

      // Scene content
      body.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <span class="badge" style="background: ${s.badgeColor}15; color: ${s.badgeColor}; border: 1.5px solid ${s.badgeColor}40; font-size: 0.6875rem; font-weight: 800;">
            ${s.badge}
          </span>
          <span style="font-size: 0.75rem; font-weight: 700; color: #64748B;">
            Scene ${s.step} of ${TOUR_SCENES.length}
          </span>
        </div>

        <h2 style="font-size: 1.3rem; font-weight: 800; color: #0F172A; margin: 0 0 0.25rem 0; line-height: 1.3;">
          ${s.title}
        </h2>
        <div style="font-size: 0.8125rem; font-weight: 600; color: #059669; margin-bottom: 1rem;">
          ${s.subtitle}
        </div>

        <!-- Pitch Card -->
        <div style="background: #F8FAFC; border-left: 4px solid ${s.badgeColor}; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; font-style: italic; color: #1E293B; font-size: 0.875rem; line-height: 1.6;">
          ${s.pitch}
        </div>

        <!-- Key Engineering Highlights -->
        <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 10px; padding: 1rem;">
          <div style="font-size: 0.6875rem; font-weight: 800; text-transform: uppercase; color: #64748B; margin-bottom: 0.5rem; letter-spacing: 0.04em;">
            Audited Hackathon Highlights & Rubric Alignment:
          </div>
          <ul style="margin: 0; padding-left: 1.25rem; font-size: 0.8125rem; color: #334155; line-height: 1.6;">
            ${s.highlights.map(h => `<li style="margin-bottom: 0.35rem;">${h}</li>`).join('')}
          </ul>
        </div>
      `;

      // Update Action Button
      if (actionLabel) actionLabel.textContent = s.actionLabel;

      // Update Dots
      if (dotsContainer) {
        dotsContainer.innerHTML = TOUR_SCENES.map((_, i) => `
          <div class="tour-dot ${i === idx ? 'active' : ''}" onclick="window.FarmPilotTour.goTo(${i})" title="Scene ${i + 1}"></div>
        `).join('');
      }

      // Prev / Next button states
      if (prevBtn) prevBtn.disabled = idx === 0;
      if (nextBtn) {
        if (idx === TOUR_SCENES.length - 1) {
          nextBtn.textContent = 'Finish Tour 🏁';
          nextBtn.style.background = '#059669';
        } else {
          nextBtn.textContent = 'Next Scene →';
          nextBtn.style.background = '#059669';
        }
      }
    }

    start() {
      if (!this.modalEl) this.createModal();
      this.renderScene(0);
      this.modalEl.classList.add('active');
    }

    close() {
      if (this.modalEl) this.modalEl.classList.remove('active');
    }

    next() {
      if (this.currentIdx < TOUR_SCENES.length - 1) {
        this.renderScene(this.currentIdx + 1);
      } else {
        this.close();
      }
    }

    prev() {
      if (this.currentIdx > 0) {
        this.renderScene(this.currentIdx - 1);
      }
    }

    goTo(idx) {
      if (idx >= 0 && idx < TOUR_SCENES.length) {
        this.renderScene(idx);
      }
    }

    jumpToTarget() {
      const s = TOUR_SCENES[this.currentIdx];
      if (s && s.targetUrl) {
        this.close();
        window.location.href = s.targetUrl;
      }
    }

    bindKeyboard() {
      document.addEventListener('keydown', (e) => {
        if (!this.modalEl || !this.modalEl.classList.contains('active')) return;
        if (e.key === 'ArrowRight') this.next();
        if (e.key === 'ArrowLeft') this.prev();
        if (e.key === 'Escape') this.close();
      });
    }
  }

  // Global instance
  window.FarmPilotTour = new HackathonJudgeTour();
})();
