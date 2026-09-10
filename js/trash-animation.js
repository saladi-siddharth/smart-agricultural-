/**
 * FarmPilot 3D Origami Paper-Fold & Flying Red Dustbin Engine
 * Exclusively active on: activities.html, inputs.html, expenses.html
 */

window.TrashAnimationEngine = {
  initialized: false,
  disposedCount: 0,
  dustbinDockEl: null,
  dustbinContainerEl: null,

  init(pageId) {
    const allowedPages = ['activities', 'inputs', 'expenses'];
    if (!allowedPages.includes(pageId)) return;
    if (this.initialized) return;

    this.renderDustbin();
    this.initialized = true;
  },

  renderDustbin() {
    if (document.getElementById('farmpilot-dustbin-dock')) return;

    const dock = document.createElement('div');
    dock.id = 'farmpilot-dustbin-dock';
    dock.className = 'farmpilot-red-dustbin-dock animate-fade-in';
    dock.innerHTML = `
      <div class="dustbin-badge-tag" id="dustbin-badge">
        <span>🗑️ Dustbin</span>
        <span class="dustbin-counter-pill" id="dustbin-count">0</span>
      </div>

      <div class="dustbin-container" id="dustbin-container" title="Operations Disposal Hub — Items folded and recycled here">
        <!-- SVG Red Dustbin with Separated Hinged Lid (Compact) -->
        <svg width="32" height="40" viewBox="0 0 54 68" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <!-- Body Gloss Gradient -->
            <linearGradient id="redCanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#991B1B" />
              <stop offset="25%" stop-color="#DC2626" />
              <stop offset="65%" stop-color="#EF4444" />
              <stop offset="90%" stop-color="#DC2626" />
              <stop offset="100%" stop-color="#7F1D1D" />
            </linearGradient>

            <!-- Lid Gradient -->
            <linearGradient id="redLidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#F87171" />
              <stop offset="40%" stop-color="#EF4444" />
              <stop offset="100%" stop-color="#B91C1C" />
            </linearGradient>

            <!-- Metallic Chrome Accent -->
            <linearGradient id="chromeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#94A3B8" />
              <stop offset="50%" stop-color="#FFFFFF" />
              <stop offset="100%" stop-color="#64748B" />
            </linearGradient>

            <filter id="canShadow" x="-10%" y="-10%" width="120%" height="130%">
              <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#000000" flood-opacity="0.2" />
            </filter>
          </defs>

          <!-- Dustbin Body (Group) -->
          <g class="dustbin-body-group" id="dustbin-body">
            <!-- Drop Shadow Base -->
            <ellipse cx="27" cy="65" rx="20" ry="3" fill="rgba(0,0,0,0.18)" />

            <!-- Main Can Barrel -->
            <path d="M7 22 L11 62 Q11 65, 14 65 L40 65 Q43 65, 43 62 L47 22 Z" fill="url(#redCanGrad)" filter="url(#canShadow)" />

            <!-- Metallic Rim Lip -->
            <path d="M6 20 C6 18.5, 48 18.5, 48 20 C48 21.5, 6 21.5, 6 20 Z" fill="url(#chromeGrad)" />

            <!-- Vertical Fluting Grooves -->
            <line x1="19" y1="26" x2="20" y2="58" stroke="#B91C1C" stroke-width="1.5" stroke-linecap="round" />
            <line x1="27" y1="26" x2="27" y2="59" stroke="#FCA5A5" stroke-width="1.2" stroke-linecap="round" opacity="0.8" />
            <line x1="35" y1="26" x2="34" y2="58" stroke="#7F1D1D" stroke-width="1.5" stroke-linecap="round" />

            <!-- Embossed Recycling / Disposal Emblem -->
            <g transform="translate(21, 36) scale(0.65)" opacity="0.9">
              <path d="M9 2L5 7H8V14H10V7H13L9 2Z" fill="#FFFFFF" />
              <path d="M14 9L11.5 13.5L13.2 14.5L10 19L16 16L14.3 15L16.5 10.5L14 9Z" fill="#FFFFFF" />
              <path d="M4 9L1.5 10.5L3.7 15L2 16L8 19L4.8 14.5L6.5 13.5L4 9Z" fill="#FFFFFF" />
            </g>

            <!-- Chrome Foot Pedal -->
            <rect x="23" y="62.5" width="8" height="2.5" rx="1" fill="url(#chromeGrad)" />
          </g>

          <!-- Hinged Lid (Group with Pivot origin on left) -->
          <g class="dustbin-lid-group" id="dustbin-lid">
            <!-- Dome Lid Top -->
            <path d="M5 16 C5 11, 49 11, 49 16 C49 19, 5 19, 5 16 Z" fill="url(#redLidGrad)" filter="url(#canShadow)" />

            <!-- Top Handle (Chrome) -->
            <rect x="23" y="10" width="8" height="2.5" rx="1" fill="url(#chromeGrad)" />
            <path d="M24 12.5 L24 14 M30 12.5 L30 14" stroke="#64748B" stroke-width="1" />

            <!-- Left Hinge Bracket -->
            <circle cx="7" cy="17" r="2" fill="#E2E8F0" stroke="#475569" stroke-width="0.8" />
          </g>
        </svg>
      </div>

      <span style="font-size: 0.5625rem; font-weight: 700; color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: 0.05em;">
        Eco-Recycle
      </span>
    `;

    document.body.appendChild(dock);
    this.dustbinDockEl = dock;
    this.dustbinContainerEl = document.getElementById('dustbin-container');
  },

  openLid() {
    if (this.dustbinContainerEl) {
      this.dustbinContainerEl.classList.add('lid-open');
    }
  },

  closeLid() {
    if (this.dustbinContainerEl) {
      this.dustbinContainerEl.classList.remove('lid-open');
    }
  },

  jiggle() {
    if (this.dustbinContainerEl) {
      this.dustbinContainerEl.classList.add('jiggle');
      setTimeout(() => {
        this.dustbinContainerEl.classList.remove('jiggle');
      }, 400);
    }
  },

  emitSparks(x, y) {
    const colors = ['#EF4444', '#F87171', '#FCD34D', '#10B981', '#FFFFFF'];
    for (let i = 0; i < 8; i++) {
      const p = document.createElement('div');
      p.className = 'dustbin-particle';
      const size = Math.random() * 5 + 3;
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      document.body.appendChild(p);

      const angle = (Math.PI * 2 * i) / 8 + (Math.random() - 0.5) * 0.5;
      const velocity = Math.random() * 35 + 20;
      const targetX = Math.cos(angle) * velocity;
      const targetY = Math.sin(angle) * velocity - 15;

      p.animate([
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        { transform: `translate(${targetX}px, ${targetY}px) scale(0)`, opacity: 0 }
      ], {
        duration: 450 + Math.random() * 200,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
      }).onfinish = () => p.remove();
    }
  },

  /**
   * Main Discard Animation:
   * 1. 3D Folds the source element into a crumpled paper ball
   * 2. Flies in a smooth parabolic arc towards the red dustbin on the right
   * 3. Opens the dustbin lid when nearing the target
   * 4. Drops inside the dustbin
   * 5. Snaps the lid shut with a spring bounce & wobbles the bin
   * 6. Calls onCompleteCallback() to perform actual DB deletion
   */
  animateDiscard(sourceElement, onCompleteCallback) {
    if (!sourceElement) {
      if (onCompleteCallback) onCompleteCallback();
      return;
    }

    // Ensure dustbin exists
    if (!this.dustbinDockEl) {
      this.renderDustbin();
    }

    const sourceRect = sourceElement.getBoundingClientRect();
    const binContainer = document.getElementById('dustbin-container') || this.dustbinDockEl;
    const binRect = binContainer.getBoundingClientRect();

    // 1. Create Floating Proxy Element
    const proxy = document.createElement('div');
    proxy.className = 'origami-paper-proxy';
    proxy.style.left = `${sourceRect.left}px`;
    proxy.style.top = `${sourceRect.top}px`;
    proxy.style.width = `${sourceRect.width}px`;
    proxy.style.height = `${sourceRect.height}px`;

    // Clone content snapshot into proxy
    proxy.innerHTML = `
      <div style="padding: 0.75rem; pointer-events: none; opacity: 0.85; transform: scale(0.95); transform-origin: top left;">
        ${sourceElement.innerHTML}
      </div>
    `;
    document.body.appendChild(proxy);

    // Hide original element smoothly
    sourceElement.style.transition = 'opacity 0.2s ease, max-height 0.3s ease, margin 0.3s ease, padding 0.3s ease';
    sourceElement.style.opacity = '0';
    sourceElement.style.pointerEvents = 'none';

    // Phase 1: 3D Origami Paper Fold & Crumple (Duration: 360ms)
    const foldStartTime = performance.now();
    const foldDuration = 360;

    const foldAnimation = proxy.animate([
      {
        transform: 'perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)',
        borderRadius: '12px',
        opacity: 1
      },
      {
        transform: 'perspective(600px) rotateX(75deg) rotateY(30deg) scale(0.65)',
        borderRadius: '20px',
        filter: 'contrast(1.2) drop-shadow(0 8px 16px rgba(0,0,0,0.18))',
        opacity: 0.95,
        offset: 0.45
      },
      {
        transform: 'perspective(600px) rotateX(120deg) rotateY(65deg) scale(0.35)',
        borderRadius: '32px',
        offset: 0.75
      },
      {
        transform: 'perspective(600px) rotateX(180deg) rotateY(180deg) scale(0.18)',
        borderRadius: '50%',
        opacity: 0.9
      }
    ], {
      duration: foldDuration,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)'
    });

    foldAnimation.onfinish = () => {
      // Transform into pure 3D crumpled paper ball
      proxy.classList.add('origami-paper-ball');
      proxy.innerHTML = ''; // clear inner cloned content

      const currentProxyRect = proxy.getBoundingClientRect();
      const startX = currentProxyRect.left + currentProxyRect.width / 2;
      const startY = currentProxyRect.top + currentProxyRect.height / 2;

      // Target: mouth aperture of the compact red dustbin
      const targetX = binRect.left + binRect.width / 2;
      const targetY = binRect.top + 12;

      // Parabolic Arc Control Point (arches above both start and target)
      const controlX = (startX + targetX) / 2;
      const controlY = Math.min(startY, targetY) - 130;

      // Phase 2: Parabolic Flight Animation (Duration: 550ms)
      const flightDuration = 550;
      const flightStart = performance.now();
      let lidOpened = false;

      function stepFlight(now) {
        const elapsed = now - flightStart;
        const progress = Math.min(elapsed / flightDuration, 1);

        // Bezier formula for parabolic arc
        const t = progress;
        const invT = 1 - t;
        const curX = (invT * invT * startX) + (2 * invT * t * controlX) + (t * t * targetX);
        const curY = (invT * invT * startY) + (2 * invT * t * controlY) + (t * t * targetY);

        // Rotation & Scale progression
        const rot = progress * 720;
        const scale = 1.05 - (progress * 0.35);

        proxy.style.left = `${curX - 10}px`;
        proxy.style.top = `${curY - 10}px`;
        proxy.style.transform = `rotate(${rot}deg) scale(${scale})`;

        // Step 3: Open the dustbin lid when paper gets near (progress >= 0.68)
        if (progress >= 0.68 && !lidOpened) {
          lidOpened = true;
          window.TrashAnimationEngine.openLid();
        }

        if (progress < 1) {
          requestAnimationFrame(stepFlight);
        } else {
          // Phase 4: Paper Drops Straight Inside Bin
          proxy.animate([
            { transform: `rotate(${rot}deg) scale(0.65)`, opacity: 0.95, top: `${targetY - 10}px` },
            { transform: `rotate(${rot + 90}deg) scale(0.2)`, opacity: 0, top: `${targetY + 20}px` }
          ], {
            duration: 140,
            easing: 'ease-in'
          }).onfinish = () => {
            proxy.remove();

            // Phase 5: Snap Lid Closed & Jiggle
            setTimeout(() => {
              window.TrashAnimationEngine.closeLid();
              window.TrashAnimationEngine.jiggle();
              window.TrashAnimationEngine.emitSparks(targetX, targetY);

              // Increment counter
              window.TrashAnimationEngine.disposedCount++;
              const countEl = document.getElementById('dustbin-count');
              if (countEl) countEl.textContent = window.TrashAnimationEngine.disposedCount;

              // Phase 6: Execute Callback to delete from DB
              if (onCompleteCallback) {
                onCompleteCallback();
              }
            }, 60);
          };
        }
      }

      requestAnimationFrame(stepFlight);
    };
  }
};
