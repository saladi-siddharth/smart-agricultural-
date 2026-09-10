/**
 * Interactive Aerial Parcel Schematic Map Component
 * Vector Demarcation & Biological Health State Engine
 */

window.initParcelMap = function(containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const plots = [
    {
      id: 'plot-a',
      name: 'North Block (Plot A)',
      code: 'SEC-01',
      area: '10.0',
      areaUnit: 'acres',
      cropName: 'Paddy (Rice)',
      variety: 'BPT-5204 (Samba Mahsuri)',
      stage: 'Tillering & Nutrition',
      soilType: 'Clay Loam (pH 6.8)',
      irrigation: 'Canal Lift + Drip',
      status: 'ATTENTION',
      alert: '⚠️ Overdue Zinc Spray (2 days)',
      fill: '#FFFBEB',
      stroke: '#D97706',
      fillSelected: '#FEF3C7',
      path: 'M 20,20 L 260,20 L 260,180 L 20,180 Z'
    },
    {
      id: 'plot-b',
      name: 'Central Sector (Plot B)',
      code: 'SEC-02',
      area: '8.5',
      areaUnit: 'acres',
      cropName: 'Paddy (Rice)',
      variety: 'MTU-1010',
      stage: 'Sowing & Nursery',
      soilType: 'Alluvial Loam (pH 7.1)',
      irrigation: 'Solar Borewell Flood',
      status: 'OPTIMAL',
      alert: '✓ Optimal Moisture & Vigor',
      fill: '#ECFDF5',
      stroke: '#059669',
      fillSelected: '#D1FAE5',
      path: 'M 280,20 L 520,20 L 520,180 L 280,180 Z'
    },
    {
      id: 'plot-c',
      name: 'South Sector (Plot C)',
      code: 'SEC-03',
      area: '6.5',
      areaUnit: 'acres',
      cropName: 'Fallow / Green Manure',
      variety: 'Dhaincha (Nitrogen Fixer)',
      stage: 'Soil Solarization & Prep',
      soilType: 'Black Cotton (pH 7.4)',
      irrigation: 'Rainfed + Canal Line',
      status: 'FALLOW',
      alert: '• Soil Remediation Phase',
      fill: '#F1F5F9',
      stroke: '#94A3B8',
      fillSelected: '#E2E8F0',
      path: 'M 20,200 L 520,200 L 520,290 L 20,290 Z'
    }
  ];

  let selectedPlot = plots[0];

  function render() {
    container.innerHTML = `
      <div class="parcel-map-container animate-fade-in">
        <div class="card-header">
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background-color: #10B981;" class="animate-pulse-glow"></span>
              <h3 style="font-size: 0.9375rem; font-weight: 800; color: var(--color-text-primary);">
                Aerial Parcel Schematic & Field Demarcation
              </h3>
              <span class="badge badge-success">Vector Map</span>
            </div>
            <p style="font-size: 0.75rem; color: var(--color-text-secondary);">
              Interactive topographical parcel sectors showing real-time biological crop states
            </p>
          </div>

          <div style="display: flex; align-items: center; gap: 1rem; font-size: 0.6875rem;">
            <span style="display: flex; align-items: center; gap: 0.35rem;">
              <span style="width: 10px; height: 10px; border-radius: 2px; background-color: #059669;"></span> Optimal
            </span>
            <span style="display: flex; align-items: center; gap: 0.35rem;">
              <span style="width: 10px; height: 10px; border-radius: 2px; background-color: #D97706;"></span> Attention Req.
            </span>
            <span style="display: flex; align-items: center; gap: 0.35rem;">
              <span style="width: 10px; height: 10px; border-radius: 2px; background-color: #94A3B8;"></span> Fallow / Prep
            </span>
          </div>
        </div>

        <div class="parcel-map-grid">
          <!-- Left: SVG Aerial Canvas -->
          <div class="parcel-svg-viewport">
            <!-- Subtle field grid backdrop -->
            <svg viewBox="0 0 540 310" style="width: 100%; max-width: 520px; height: auto;">
              <defs>
                <pattern id="soil-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#CBD5E1" stroke-width="0.5" stroke-dasharray="2 2" opacity="0.4" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#soil-grid)" />

              ${plots.map(p => {
                const isSel = p.id === selectedPlot.id;
                const fill = isSel ? p.fillSelected : p.fill;
                const strokeWidth = isSel ? '3' : '1.5';
                const dash = p.status === 'FALLOW' ? 'stroke-dasharray="4 3"' : '';

                return `
                  <g class="parcel-path ${isSel ? 'selected' : ''}" data-plot-id="${p.id}">
                    <path d="${p.path}" fill="${fill}" stroke="${p.stroke}" stroke-width="${strokeWidth}" ${dash} />
                    ${p.id === 'plot-a' ? `
                      <text x="140" y="80" text-anchor="middle" font-size="13" font-weight="800" fill="#0F172A">${p.name}</text>
                      <text x="140" y="105" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">${p.cropName} • ${p.area} ${p.areaUnit}</text>
                      <text x="140" y="125" text-anchor="middle" font-size="10" font-weight="700" fill="#D97706">${p.alert}</text>
                    ` : ''}
                    ${p.id === 'plot-b' ? `
                      <text x="400" y="80" text-anchor="middle" font-size="13" font-weight="800" fill="#0F172A">${p.name}</text>
                      <text x="400" y="105" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">${p.cropName} • ${p.area} ${p.areaUnit}</text>
                      <text x="400" y="125" text-anchor="middle" font-size="10" font-weight="700" fill="#059669">${p.alert}</text>
                    ` : ''}
                    ${p.id === 'plot-c' ? `
                      <text x="270" y="240" text-anchor="middle" font-size="13" font-weight="800" fill="#0F172A">${p.name}</text>
                      <text x="270" y="260" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">${p.cropName} • ${p.area} ${p.areaUnit}</text>
                    ` : ''}
                  </g>
                `;
              }).join('')}
            </svg>

            <div style="width: 100%; display: flex; justify-content: space-between; font-size: 0.6875rem; color: var(--color-text-secondary); margin-top: 1rem; padding-top: 0.5rem; border-top: 1px solid var(--color-border);">
              <span>Click any parcel sector to inspect micro-telemetry & soil chemistry</span>
              <strong style="color: var(--color-forest);">25.0 Acres Demarcated</strong>
            </div>
          </div>

          <!-- Right: Selected Plot Telemetry Panel -->
          <div class="parcel-telemetry-panel">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                <div>
                  <span class="font-mono" style="font-size: 0.625rem; font-weight: 700; color: var(--color-text-tertiary); text-transform: uppercase;">
                    ${selectedPlot.code}
                  </span>
                  <h4 style="font-size: 1rem; font-weight: 800; color: var(--color-text-primary); margin-top: 0.15rem;">
                    ${selectedPlot.name}
                  </h4>
                </div>
                <span class="badge ${selectedPlot.status === 'OPTIMAL' ? 'badge-success' : selectedPlot.status === 'ATTENTION' ? 'badge-warning' : 'badge-neutral'}">
                  ${selectedPlot.status === 'OPTIMAL' ? 'Healthy' : selectedPlot.status === 'ATTENTION' ? 'Action Req.' : 'Fallow'}
                </span>
              </div>

              <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1rem;">
                <div style="background-color: #FFFFFF; padding: 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--color-border);">
                  <span style="font-size: 0.625rem; font-weight: 700; color: var(--color-text-tertiary); text-transform: uppercase; display: block;">Crop & Stage</span>
                  <p style="font-weight: 800; font-size: 0.875rem; color: var(--color-text-primary); margin-top: 0.2rem;">${selectedPlot.cropName}</p>
                  <p style="font-size: 0.75rem; color: var(--color-text-secondary);">${selectedPlot.variety} • ${selectedPlot.stage}</p>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                  <div style="background-color: #FFFFFF; padding: 0.625rem; border-radius: var(--radius-md); border: 1px solid var(--color-border);">
                    <span style="font-size: 0.625rem; font-weight: 700; color: var(--color-text-tertiary); text-transform: uppercase; display: block;">Acreage</span>
                    <span class="tabular-nums" style="font-weight: 800; font-size: 0.9375rem; color: var(--color-text-primary);">${selectedPlot.area} ${selectedPlot.areaUnit}</span>
                  </div>
                  <div style="background-color: #FFFFFF; padding: 0.625rem; border-radius: var(--radius-md); border: 1px solid var(--color-border);">
                    <span style="font-size: 0.625rem; font-weight: 700; color: var(--color-text-tertiary); text-transform: uppercase; display: block;">Soil Profile</span>
                    <span style="font-weight: 700; font-size: 0.75rem; color: var(--color-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block;">${selectedPlot.soilType}</span>
                  </div>
                </div>

                <div style="background-color: #FFFFFF; padding: 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--color-border);">
                  <span style="font-size: 0.625rem; font-weight: 700; color: var(--color-text-tertiary); text-transform: uppercase; display: block;">Irrigation Network</span>
                  <p style="font-weight: 700; font-size: 0.8125rem; color: var(--color-text-primary); margin-top: 0.15rem;">${selectedPlot.irrigation}</p>
                </div>
              </div>
            </div>

            <div style="margin-top: 1.25rem; pt-3; border-top: 1px solid var(--color-border);">
              <a href="crops.html" class="btn btn-primary" style="width: 100%; font-size: 0.75rem;">
                <span>Inspect Crop Lifecycle</span>
                <span>→</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    `;

    // Attach click handlers
    container.querySelectorAll('.parcel-path').forEach(el => {
      el.addEventListener('click', () => {
        const plotId = el.getAttribute('data-plot-id');
        const match = plots.find(p => p.id === plotId);
        if (match) {
          selectedPlot = match;
          render();
          if (options.onSelect) options.onSelect(match);
        }
      });
    });
  }

  render();
};
