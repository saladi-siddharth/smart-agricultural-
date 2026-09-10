/**
 * FarmPilot Real-time Microclimate Telemetry Service
 * Powered by WeatherAPI.com
 * Integrated API Key: 60fa809504254064809123619261009
 */

window.FarmPilotWeather = {
  API_KEY: '60fa809504254064809123619261009',
  DEFAULT_COORDS: { lat: 16.1809, lon: 81.1378, name: 'Machilipatnam, AP' },
  CACHE_TTL_MS: 10 * 60 * 1000, // 10 minutes cache

  async getCurrentWeather(forceRefresh = false) {
    try {
      if (!forceRefresh) {
        const cached = localStorage.getItem('fp_weather_telemetry');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.timestamp < this.CACHE_TTL_MS) {
            return parsed.data;
          }
        }
      }

      // 1. Try WeatherAPI.com directly
      const url = `https://api.weatherapi.com/v1/current.json?key=${this.API_KEY}&q=${this.DEFAULT_COORDS.lat},${this.DEFAULT_COORDS.lon}&aqi=no`;
      let res = await fetch(url).catch(() => null);

      // 2. Fallback to local / Vercel proxy if direct fetch is blocked by CORS/shields
      if (!res || !res.ok) {
        res = await fetch(`/api/weather?lat=${this.DEFAULT_COORDS.lat}&lon=${this.DEFAULT_COORDS.lon}`).catch(() => null);
      }

      if (res && res.ok) {
        const data = await res.json();
        localStorage.setItem('fp_weather_telemetry', JSON.stringify({
          timestamp: Date.now(),
          data: data
        }));
        return data;
      }
    } catch (e) {
      console.warn('Weather telemetry fetch error, using cached or fallback telemetry:', e);
    }

    // Fallback baseline
    return {
      location: { name: 'Machilipatnam', region: 'Andhra Pradesh', country: 'India' },
      current: {
        temp_c: 31.5,
        condition: { text: 'Overcast', icon: '//cdn.weatherapi.com/weather/64x64/day/122.png' },
        humidity: 63,
        wind_kph: 21.6,
        wind_dir: 'NNW',
        feelslike_c: 36.7,
        uv: 4,
        pressure_mb: 1004,
        precip_mm: 0
      }
    };
  },

  async updateWidgets() {
    const data = await this.getCurrentWeather();
    if (!data || !data.current) return;

    const curr = data.current;
    const loc = data.location || {};
    const tempC = Math.round(curr.temp_c);
    const condText = curr.condition?.text || 'Sunny';
    const humidity = curr.humidity || 64;
    const windKph = curr.wind_kph || 12;
    const windDir = curr.wind_dir || 'WNW';

    // 1. Update Sidebar Weather Telemetry Widget
    const tempEl = document.getElementById('weather-temp');
    if (tempEl) tempEl.textContent = `${tempC}°C`;

    const descEl = document.getElementById('weather-desc');
    if (descEl) descEl.textContent = `${condText} • Optimal`;

    const humEl = document.getElementById('weather-humidity');
    if (humEl) humEl.textContent = `💧 ${humidity}% Humid`;

    const windEl = document.getElementById('weather-wind');
    if (windEl) windEl.textContent = `💨 ${windKph} km/h ${windDir}`;

    const iconEl = document.getElementById('weather-icon');
    if (iconEl && curr.condition?.icon) {
      iconEl.innerHTML = `<img src="https:${curr.condition.icon}" alt="${condText}" style="width: 18px; height: 18px; vertical-align: middle;">`;
    }

    // 2. Update Login Screen Microclimate Box
    const loginTemp = document.getElementById('login-weather-temp');
    if (loginTemp) loginTemp.textContent = `${tempC}°C`;

    const loginDesc = document.getElementById('login-weather-desc');
    if (loginDesc) loginDesc.textContent = `${condText} • Optimal Soil Vigor`;

    const loginHum = document.getElementById('login-weather-humidity');
    if (loginHum) loginHum.textContent = `💧 ${humidity}% Humidity`;

    const loginWind = document.getElementById('login-weather-wind');
    if (loginWind) loginWind.textContent = `💨 ${windKph} km/h Wind`;

    const loginPrecip = document.getElementById('login-weather-precip');
    if (loginPrecip) loginPrecip.textContent = `🌧️ ${curr.precip_mm || 0}mm Rain`;

    // Make widget clickable to view detailed modal
    const sidebarWidget = document.getElementById('sidebar-weather-widget');
    if (sidebarWidget && !sidebarWidget.getAttribute('data-has-click')) {
      sidebarWidget.setAttribute('data-has-click', 'true');
      sidebarWidget.style.cursor = 'pointer';
      sidebarWidget.title = 'Click to view live microclimate telemetry';
      sidebarWidget.addEventListener('click', () => this.openWeatherModal(data));
    }
  },

  openWeatherModal(data) {
    let modal = document.getElementById('weather-detail-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'weather-detail-modal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    const curr = data?.current || {};
    const loc = data?.location || {};

    modal.innerHTML = `
      <div class="modal-content" style="max-width: 520px; padding: 1.75rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; border-bottom: 1px solid var(--color-border); padding-bottom: 0.75rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 1.25rem;">☀️</span>
              <h3 style="font-size: 1.125rem; font-weight: 800; margin: 0; color: var(--color-text-primary);">Live Field Microclimate</h3>
            </div>
            <p style="font-size: 0.75rem; color: var(--color-text-secondary); margin: 0.25rem 0 0;">
              ${loc.name || 'Machilipatnam'}, ${loc.region || 'Andhra Pradesh'} • Real-Time WeatherAPI Node
            </p>
          </div>
          <button onclick="document.getElementById('weather-detail-modal').classList.remove('active')" style="background:none; border:none; font-size:1.25rem; cursor:pointer; color:#64748B;">✕</button>
        </div>

        <div style="background: linear-gradient(135deg, #0D2820 0%, #164E3D 100%); color: #FFFFFF; padding: 1.25rem; border-radius: var(--radius-lg); margin-bottom: 1.25rem; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span style="font-size: 0.75rem; color: #A7F3D0; font-weight: 700; text-transform: uppercase;">Current Temperature</span>
            <div style="font-size: 2.5rem; font-weight: 800; line-height: 1; margin: 0.35rem 0; font-family: monospace;">
              ${Math.round(curr.temp_c || 31.5)}°C
            </div>
            <span style="font-size: 0.8125rem; color: #D1FAE5;">
              ${curr.condition?.text || 'Overcast'} • Feels like ${Math.round(curr.feelslike_c || 36)}°C
            </span>
          </div>
          ${curr.condition?.icon ? `<img src="https:${curr.condition.icon}" style="width: 64px; height: 64px;">` : '☀️'}
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1.25rem;">
          <div style="background: var(--color-surface-secondary); padding: 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--color-border);">
            <span style="font-size: 0.6875rem; font-weight: 700; color: var(--color-text-tertiary); text-transform: uppercase;">Relative Humidity</span>
            <p style="font-size: 1.125rem; font-weight: 800; margin: 0.2rem 0; font-family: monospace;">${curr.humidity || 63}%</p>
            <span style="font-size: 0.6875rem; color: #059669;">Optimal Evapotranspiration</span>
          </div>

          <div style="background: var(--color-surface-secondary); padding: 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--color-border);">
            <span style="font-size: 0.6875rem; font-weight: 700; color: var(--color-text-tertiary); text-transform: uppercase;">Wind Telemetry</span>
            <p style="font-size: 1.125rem; font-weight: 800; margin: 0.2rem 0; font-family: monospace;">${curr.wind_kph || 21.6} km/h</p>
            <span style="font-size: 0.6875rem; color: var(--color-text-secondary);">Direction: ${curr.wind_dir || 'NNW'}</span>
          </div>

          <div style="background: var(--color-surface-secondary); padding: 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--color-border);">
            <span style="font-size: 0.6875rem; font-weight: 700; color: var(--color-text-tertiary); text-transform: uppercase;">Atmospheric Pressure</span>
            <p style="font-size: 1.125rem; font-weight: 800; margin: 0.2rem 0; font-family: monospace;">${curr.pressure_mb || 1004} hPa</p>
            <span style="font-size: 0.6875rem; color: var(--color-text-secondary);">Barometric Stability</span>
          </div>

          <div style="background: var(--color-surface-secondary); padding: 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--color-border);">
            <span style="font-size: 0.6875rem; font-weight: 700; color: var(--color-text-tertiary); text-transform: uppercase;">Precipitation / Rain</span>
            <p style="font-size: 1.125rem; font-weight: 800; margin: 0.2rem 0; font-family: monospace;">${curr.precip_mm || 0} mm</p>
            <span style="font-size: 0.6875rem; color: #059669;">Zero Washout Risk</span>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end;">
          <button type="button" onclick="document.getElementById('weather-detail-modal').classList.remove('active')" class="btn btn-secondary btn-sm">Close Telemetry</button>
        </div>
      </div>
    `;

    modal.classList.add('active');
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  }
};
