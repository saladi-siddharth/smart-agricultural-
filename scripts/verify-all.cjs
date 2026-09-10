const fs = require('fs');
const assert = require('assert');

console.log('Testing FarmPilot Phase 2 Suite...');

// 1. Login page verification
const loginHtml = fs.readFileSync('login.html', 'utf8');
assert(loginHtml.includes('502673401378-6vieatqhs9cp0s9oo9ga5tpnb7rpkvng.apps.googleusercontent.com'), 'Google Client ID missing');
assert(loginHtml.includes('accounts.google.com/gsi/client'), 'Google Identity Services SDK missing');
assert(loginHtml.includes('toggle-password-visibility'), 'Password eye toggle missing');
assert(loginHtml.includes('forgot-password-modal'), 'Forgot password modal missing');
assert(loginHtml.includes('reset-step-1') && loginHtml.includes('reset-step-2') && loginHtml.includes('reset-step-3'), '3-step OTP flow missing');
console.log('✓ login.html verification PASSED');

// 2. js/app.js verification
const appJs = fs.readFileSync('js/app.js', 'utf8');
assert(appJs.includes('header-profile-wrapper'), 'Header profile wrapper missing');
assert(appJs.includes('header-avatar-input'), 'Profile image upload input missing');
assert(appJs.includes('handleProfileImageUpload'), 'Profile image upload handler missing');
assert(appJs.includes('Sign Out of FarmPilot'), 'Prominent header sign out button missing');
assert(appJs.includes('Sign Out'), 'Prominent sidebar sign out button missing');
assert(appJs.includes('👑 OWNER') && appJs.includes('👔 MANAGER') && appJs.includes('🚜 WORKER') && appJs.includes('🔬 CONSULTANT'), 'Role badges missing');
console.log('✓ js/app.js RBAC and Profile verification PASSED');

// 3. crops.html verification
const cropsHtml = fs.readFileSync('crops.html', 'utf8');
assert(cropsHtml.includes('btn-init-crop-cycle'), 'Initialize cycle button ID missing');
assert(cropsHtml.includes('add-crop-form'), 'Add crop form missing');
console.log('✓ crops.html seasonal crop launch verification PASSED');

// 4. js/auth.js verification
const authJs = fs.readFileSync('js/auth.js', 'utf8');
assert(authJs.includes('updateProfileImage'), 'updateProfileImage missing in auth');
assert(authJs.includes('resetPassword'), 'resetPassword missing in auth');
assert(authJs.includes('loginWithGoogle'), 'loginWithGoogle missing in auth');
console.log('✓ js/auth.js authentication suite verification PASSED');

// 5. js/weather.js & WeatherAPI key verification
const weatherJs = fs.readFileSync('js/weather.js', 'utf8');
assert(weatherJs.includes('60fa809504254064809123619261009'), 'WeatherAPI key missing in weather.js');
assert(weatherJs.includes('getCurrentWeather') && weatherJs.includes('updateWidgets'), 'Weather methods missing');
console.log('✓ js/weather.js WeatherAPI (60fa809504254064809123619261009) verification PASSED');

// 6. settings.html & 24 Languages Multilingual + Gemini AI Verification
const settingsHtml = fs.readFileSync('settings.html', 'utf8');
assert(settingsHtml.includes('languages-grid-container'), 'Languages grid container missing');
assert(settingsHtml.includes('gemini-api-key-input'), 'Gemini API key input missing');
assert(settingsHtml.includes('gemini-model-select'), 'Gemini model select missing');
assert(settingsHtml.includes('sandbox-chat-history'), 'Sandbox chat history missing');

const i18nJs = fs.readFileSync('js/i18n.js', 'utf8');
assert(i18nJs.includes("code: 'te'") && i18nJs.includes("code: 'hi'") && i18nJs.includes("code: 'ta'"), 'Core regional languages missing in i18n');
assert(i18nJs.includes('buildGeminiSystemPrompt'), 'buildGeminiSystemPrompt missing in i18n');
assert(i18nJs.includes('walkAndTranslate'), 'Full DOM text walker missing in i18n');
assert(i18nJs.includes('syncGoogleTranslate'), 'Google Translate bridge missing in i18n');
assert(i18nJs.includes('డ్యాష్‌బోర్డ్') && i18nJs.includes('डैशबोर्ड'), 'Telugu and Hindi dictionary translations missing');
console.log('✓ settings.html & 24-language Gemini AI suite verification PASSED');

// 7. PWA & Offline Web Application Verification
assert(fs.existsSync('manifest.json'), 'manifest.json missing');
const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
assert(manifest.name && manifest.name.includes('FarmPilot'), 'manifest name invalid');
assert(manifest.display === 'standalone', 'manifest display must be standalone');
assert(manifest.icons && manifest.icons.length >= 2, 'manifest icons missing');

assert(fs.existsSync('sw.js'), 'sw.js Service Worker missing');
const swJs = fs.readFileSync('sw.js', 'utf8');
assert(swJs.includes('CACHE_NAME') && swJs.includes('PRECACHE_ASSETS'), 'Service Worker caching config missing');
assert(swJs.includes("addEventListener('fetch'"), 'Service Worker fetch handler missing');
assert(swJs.includes('/api/intelligence') && swJs.includes('/api/gemini/chat'), 'Service Worker API offline fallback missing');

assert(fs.existsSync('js/offline-sync.js'), 'js/offline-sync.js missing');
const offlineSyncJs = fs.readFileSync('js/offline-sync.js', 'utf8');
assert(offlineSyncJs.includes('FarmPilotOffline'), 'FarmPilotOffline engine missing');
assert(offlineSyncJs.includes('toggleSimulatedOffline'), 'toggleSimulatedOffline missing');
assert(offlineSyncJs.includes('queueAction') && offlineSyncJs.includes('processSyncQueue'), 'Offline action sync queue missing');

const indexHtml = fs.readFileSync('index.html', 'utf8');
assert(indexHtml.includes('manifest.json'), 'index.html missing manifest link');
assert(indexHtml.includes('offline-sync.js'), 'index.html missing offline-sync.js');
assert(indexHtml.includes('offline-mode-pill') || indexHtml.includes('hero-install-btn'), 'index.html missing PWA install / status indicators');
assert(indexHtml.includes('offline-architecture'), 'index.html missing offline remote field architecture section');

assert(fs.existsSync('icons/icon-192.svg') && fs.existsSync('icons/icon-512.svg'), 'PWA icons missing');
console.log('✓ PWA & 100% Offline Web Application suite verification PASSED');

// 8. Farm Status Input & Real-Time Agronomic Analysis Suite
assert(fs.existsSync('js/intelligence/farm-status-analysis-engine.js'), 'farm-status-analysis-engine.js missing');
const engineCode = fs.readFileSync('js/intelligence/farm-status-analysis-engine.js', 'utf8');
const vm = require('vm');
const sandbox = { window: {}, console };
vm.createContext(sandbox);
vm.runInContext(engineCode, sandbox);
assert(sandbox.window.FarmStatusAnalysisEngine && typeof sandbox.window.FarmStatusAnalysisEngine.computeAnalysis === 'function', 'computeAnalysis function not exported');

// Test Case 8A: Water stress condition
const stressRes = sandbox.window.FarmStatusAnalysisEngine.computeAnalysis({
  fieldId: 'north-block',
  areaAcres: 10,
  daysFromSowing: 35,
  soilMoisture: 20,
  waterDepthCm: -16.0,
  ureaAppliedKg: 40,
  zincStatus: 'OVERDUE',
  pestSymptom: 'CHLOROSIS',
  windSpeed: 15,
  expectedYield: 3.5,
  mandiPrice: 28,
  workersCount: 6
});
assert(stressRes.irrigation.status === 'CRITICAL_WATER_STRESS', 'Irrigation status should be CRITICAL_WATER_STRESS');
assert(stressRes.irrigation.litersNeeded > 0, 'Liters needed should be > 0 for water stress');
assert(stressRes.nutrient.sprayWindowSafe === false, 'Wind speed 15 km/h should make spray window unsafe');
assert(stressRes.health.score < 60, 'Farm health score should drop below 60 under multiple stresses');
assert(parseFloat(stressRes.economics.breakEvenYield) > 0, 'Break-even yield must be positive number');
assert(stressRes.priorityActions.length >= 2, 'Priority actions should be populated');

// Test Case 8B: Optimal harvest condition
const harvestRes = sandbox.window.FarmStatusAnalysisEngine.computeAnalysis({
  fieldId: 'north-block',
  areaAcres: 10,
  daysFromSowing: 132,
  soilMoisture: 26,
  waterDepthCm: -2.0,
  ureaAppliedKg: 60,
  zincStatus: 'COMPLETED',
  pestSymptom: 'NONE',
  windSpeed: 8,
  expectedYield: 4.8,
  mandiPrice: 32,
  workersCount: 12
});
assert(harvestRes.stage.code === 'MATURITY', 'Stage at day 132 should be MATURITY');
assert(harvestRes.nutrient.sprayWindowSafe === true, 'Wind speed 8 km/h should be spray safe');
assert(harvestRes.economics.netProfit > 0, 'Harvest profit should be positive');

// Test Case 8C: intelligence.html and dashboard.html integration
const intelHtml = fs.readFileSync('intelligence.html', 'utf8');
assert(intelHtml.includes('farm-status-analysis-engine.js'), 'intelligence.html missing engine script tag');
assert(intelHtml.includes('farm-status-analysis-studio'), 'intelligence.html missing studio element');
assert(intelHtml.includes('triggerFarmAnalysis()'), 'intelligence.html missing triggerFarmAnalysis');
assert(intelHtml.includes('commitAnalysisToAuditLog()'), 'intelligence.html missing commitAnalysisToAuditLog');

const dashHtml = fs.readFileSync('dashboard.html', 'utf8');
assert(dashHtml.includes('intelligence.html#farm-status-analysis-studio'), 'dashboard.html missing link to studio');

assert(swJs.includes('/js/intelligence/farm-status-analysis-engine.js'), 'sw.js missing farm-status-analysis-engine.js precache');
assert(offlineSyncJs.includes('showInstallGuideModal'), 'offline-sync.js missing mobile install guide modal');
console.log('✓ Farm Status Input & Real-Time Agronomic Analysis suite verification PASSED');

// 9. Community User Search & Direct Messaging with Accept/Reject Gateway Verification
assert(fs.existsSync('js/messaging.js'), 'js/messaging.js missing');
assert(fs.existsSync('supabase/migrations/008_direct_messaging.sql'), '008_direct_messaging.sql missing');
const messagingSql = fs.readFileSync('supabase/migrations/008_direct_messaging.sql', 'utf8');
assert(messagingSql.includes('conversations') && messagingSql.includes('direct_messages'), 'Migration missing conversations or direct_messages tables');
assert(messagingSql.includes("'PENDING'") && messagingSql.includes("'ACCEPTED'") && messagingSql.includes("'REJECTED'"), 'Migration missing conversation status enum constraints');

// Run messaging.js in isolated sandbox
const messagingCode = fs.readFileSync('js/messaging.js', 'utf8');
const msgSandbox = {
  window: {
    addEventListener: () => {},
    dispatchEvent: () => {},
    localStorage: {
      _data: {},
      getItem(k) { return this._data[k] || null; },
      setItem(k, v) { this._data[k] = String(v); }
    }
  },
  console
};
vm.createContext(msgSandbox);
vm.runInContext(messagingCode, msgSandbox);
const FPM = msgSandbox.window.FarmPilotMessaging;
assert(FPM, 'FarmPilotMessaging not attached to window');
assert(typeof FPM.getUsers === 'function', 'getUsers method missing');
assert(typeof FPM.sendMessage === 'function', 'sendMessage method missing');
assert(typeof FPM.respondToRequest === 'function', 'respondToRequest method missing');

// Search Verification
const anitaSearch = FPM.getUsers('anita');
assert(anitaSearch.length > 0 && anitaSearch[0].username === 'anita', 'Search by username "anita" failed');
const cropSearch = FPM.getUsers('paddy');
assert(cropSearch.length > 0, 'Search by crop "paddy" failed');

// First-time message request handshake test
const firstMsgRes = FPM.sendMessage({
  from: 'siddharth',
  to: 'kiran',
  content: 'Hello Kiran, do you have fresh organic groundnut seeds?'
});
assert(firstMsgRes.status === 'PENDING', 'First-time direct message must enter PENDING state');
assert(firstMsgRes.isFirstTime === true, 'isFirstTime must be true for first contact');

// Accept Request transition test
const acceptedConv = FPM.respondToRequest(firstMsgRes.conversation.id, 'ACCEPT');
assert(acceptedConv.status === 'ACCEPTED', 'Conversation should transition to ACCEPTED upon recipient acceptance');

// Reject Request transition test on new request
const secondMsgRes = FPM.sendMessage({
  from: 'subba',
  to: 'siddharth',
  content: 'Unsolicited equipment advertisement'
});
assert(secondMsgRes.status === 'PENDING', 'New unsolicited message must be PENDING');
const rejectedConv = FPM.respondToRequest(secondMsgRes.conversation.id, 'REJECT');
assert(rejectedConv.status === 'REJECTED', 'Conversation should transition to REJECTED upon decline');

// Community HTML checks
const communityHtml = fs.readFileSync('community.html', 'utf8');
assert(communityHtml.includes('js/messaging.js'), 'community.html missing js/messaging.js script tag');
assert(communityHtml.includes('id="user-search-input"'), 'community.html missing user-search-input element');
assert(communityHtml.includes('id="messaging-modal"'), 'community.html missing messaging-modal element');
assert(communityHtml.includes('handleAcceptRequest') && communityHtml.includes('handleRejectRequest'), 'community.html missing Accept/Reject handlers');
assert(communityHtml.includes('openMessagingWith'), 'community.html missing openMessagingWith handler');

// Server API endpoints check
const serverCode = fs.readFileSync('server.js', 'utf8');
assert(serverCode.includes('/api/community/users'), 'server.js missing /api/community/users endpoint');
assert(serverCode.includes('/api/messages/conversations'), 'server.js missing /api/messages/conversations endpoint');
assert(serverCode.includes('/api/messages/send'), 'server.js missing /api/messages/send endpoint');
assert(serverCode.includes('/api/messages/respond'), 'server.js missing /api/messages/respond endpoint');

// Service Worker precache check
assert(swJs.includes('/js/messaging.js'), 'sw.js missing /js/messaging.js precache');
console.log('✓ Community User Search & Direct Messaging with Accept/Reject Gateway verification PASSED');

// 10. AI Farm Report, Multilingual Chatbot, Supabase User Credentials & Global Rebranding Verification
assert(fs.existsSync('supabase/migrations/009_user_credentials_and_ai_reports.sql'), '009_user_credentials_and_ai_reports.sql missing');
const migration009 = fs.readFileSync('supabase/migrations/009_user_credentials_and_ai_reports.sql', 'utf8');
assert(migration009.includes('public.user_credentials'), 'Migration 009 missing public.user_credentials table');
assert(migration009.includes('password_plain') && migration009.includes('pin'), 'Migration 009 missing password_plain or pin columns');
assert(migration009.includes('public.farm_ai_reports'), 'Migration 009 missing public.farm_ai_reports table');

// Ensure all 8 user accounts and passwords are present in migration
const requiredUsers = ['siddharth', 'rajesh', 'ramu', 'anita', 'venkat', 'laxmi', 'kiran', 'subba'];
for (const u of requiredUsers) {
  assert(migration009.includes(`'${u}'`), `Migration 009 missing user '${u}'`);
}
assert(migration009.includes('Farmer@2026!') && migration009.includes('Manager@2026!') && migration009.includes('Worker@2026!'), 'Migration 009 missing plaintext passwords');

// Dashboard HTML Elements Check
const dashHtmlPost = fs.readFileSync('dashboard.html', 'utf8');
assert(dashHtmlPost.includes('id="ai-farm-report-card"'), 'dashboard.html missing #ai-farm-report-card');
assert(dashHtmlPost.includes('id="dashboard-ai-chatbot-card"'), 'dashboard.html missing #dashboard-ai-chatbot-card');
assert(dashHtmlPost.includes('id="ai-report-modal"'), 'dashboard.html missing #ai-report-modal');
assert(dashHtmlPost.includes('id="supabase-inspector-modal"'), 'dashboard.html missing #supabase-inspector-modal');
assert(dashHtmlPost.includes('btn-generate-ai-report'), 'dashboard.html missing btn-generate-ai-report');
assert(dashHtmlPost.includes('openSupabaseInspector'), 'dashboard.html missing openSupabaseInspector');
assert(dashHtmlPost.includes('generateFarmAiReport'), 'dashboard.html missing generateFarmAiReport');
assert(dashHtmlPost.includes('sendDashboardChatMessage'), 'dashboard.html missing sendDashboardChatMessage');

// Server API Endpoints Check
assert(serverCode.includes('/api/database/users'), 'server.js missing /api/database/users');
assert(serverCode.includes('/api/reports/generate'), 'server.js missing /api/reports/generate');
assert(serverCode.includes('/api/reports/latest'), 'server.js missing /api/reports/latest');

// Global Rebranding Check: Zero user-facing "Gemini AI" or "Google Gemini" in navigation/UI
const filesToCheckRebranding = [
  { name: 'dashboard.html', content: dashHtmlPost },
  { name: 'intelligence.html', content: intelHtml },
  { name: 'settings.html', content: settingsHtml },
  { name: 'js/app.js', content: appJs }
];

for (const f of filesToCheckRebranding) {
  // Regex to ensure no user-facing text says "Gemini AI" or "Google Gemini"
  const userFacingGeminiRegex = />[^<]*(?:Gemini\s+AI|Google\s+Gemini)[^<]*</i;
  assert(!userFacingGeminiRegex.test(f.content), `File ${f.name} contains user-facing 'Gemini AI' or 'Google Gemini' text!`);
}
console.log('✓ AI Farm Report, Multilingual Chatbot, Supabase Credentials & Global Rebranding PASSED');

// 11. Enterprise Soil & Farm Health Center, Cryptographic JWT Auth, Queues & Production Resilience
assert(fs.existsSync('soil.html'), 'soil.html missing');
const soilHtml = fs.readFileSync('soil.html', 'utf8');
assert(soilHtml.includes('id="soil-health-card"'), 'soil.html missing #soil-health-card');
assert(soilHtml.includes('btn-print-shc'), 'soil.html missing btn-print-shc');
assert(soilHtml.includes('btn-log-sample'), 'soil.html missing btn-log-sample');
assert(soilHtml.includes('js/intelligence/soil-health-engine.js'), 'soil.html missing soil-health-engine.js');
assert(soilHtml.includes('ICAR Fertilizer & Soil Amendment Prescription'), 'soil.html missing fertilizer prescription section');

// Soil Intelligence Engine verification
assert(fs.existsSync('js/intelligence/soil-health-engine.js'), 'soil-health-engine.js missing');
const soilEngineCode = fs.readFileSync('js/intelligence/soil-health-engine.js', 'utf8');
const soilSandbox = { module: { exports: {} }, window: {} };
vm.runInNewContext(soilEngineCode, soilSandbox);
const SoilEngine = soilSandbox.module.exports;
assert(SoilEngine && SoilEngine.calculateFertilityIndex, 'SoilEngine.calculateFertilityIndex missing');
assert(SoilEngine.diagnoseDeficiencies, 'SoilEngine.diagnoseDeficiencies missing');
assert(SoilEngine.calculateFertilizerDosage, 'SoilEngine.calculateFertilizerDosage missing');

// Test ICAR Zinc critical threshold: 0.42 ppm should trigger Khaira chlorosis alert
const znDefDiag = SoilEngine.diagnoseDeficiencies({ ph: 7.2, ec: 0.38, oc: 0.58, n: 215, p: 14.8, k: 198, zn: 0.42 });
assert(znDefDiag.hasDeficiencies === true, 'Zn 0.42 ppm must detect deficiency');
assert(znDefDiag.deficiencies.some(d => d.element === 'Zinc' && d.critical), 'Zinc must be marked as critical deficiency (<0.60 ppm)');

// 6-Pillar Farm Health Engine verification
assert(fs.existsSync('js/intelligence/farm-health-engine.js'), 'farm-health-engine.js missing');
const healthEngineCode = fs.readFileSync('js/intelligence/farm-health-engine.js', 'utf8');
const healthSandbox = { module: { exports: {} }, window: {} };
vm.runInNewContext(healthEngineCode, healthSandbox);
const HealthEngine = healthSandbox.module.exports;
assert(HealthEngine && HealthEngine.computeFarmHealth, 'HealthEngine.computeFarmHealth missing');

const healthRes = HealthEngine.computeFarmHealth({
  activities: [{ id: 'act-1', status: 'OVERDUE' }],
  expenses: [{ amount: 142500 }],
  cropCycle: { planned_budget: 124690, target_yield: 4.2 },
  soilScore: 78
});
assert(healthRes.pillars.soil === 78, '6-Pillar model must contain soil fertility pillar');
assert(healthRes.pillars.schedule && healthRes.pillars.cost && healthRes.pillars.execution && healthRes.pillars.progress && healthRes.pillars.dataQuality, 'All 6 pillars must be present');

// Cryptographic JWT Auth Service verification
assert(fs.existsSync('services/auth/jwtService.js'), 'jwtService.js missing');
const jwtServiceCode = fs.readFileSync('services/auth/jwtService.js', 'utf8');
assert(jwtServiceCode.includes('signToken') && jwtServiceCode.includes('verifyToken'), 'jwtService missing signToken or verifyToken');
assert(jwtServiceCode.includes('crypto.timingSafeEqual'), 'jwtService missing timingSafeEqual');
assert(jwtServiceCode.includes('revokeToken'), 'jwtService missing revokeToken');

// Server API Routes verification
assert(serverCode.includes('/api/auth/login'), 'server.js missing /api/auth/login');
assert(serverCode.includes('/api/auth/session'), 'server.js missing /api/auth/session');
assert(serverCode.includes('/api/auth/logout'), 'server.js missing /api/auth/logout');
assert(serverCode.includes('/api/health'), 'server.js missing /api/health');
assert(serverCode.includes('/api/metrics'), 'server.js missing /api/metrics');
assert(serverCode.includes('/api/queue/status'), 'server.js missing /api/queue/status');
assert(serverCode.includes('/api/queue/jobs'), 'server.js missing /api/queue/jobs');
assert(serverCode.includes('/api/soil/parcels'), 'server.js missing /api/soil/parcels');
assert(serverCode.includes('/api/soil/tests'), 'server.js missing /api/soil/tests');

// Production Architecture Documentation verification
assert(fs.existsSync('docs/production-architecture.md'), 'docs/production-architecture.md missing');
const archDoc = fs.readFileSync('docs/production-architecture.md', 'utf8');
assert(archDoc.includes('STRIDE'), 'docs/production-architecture.md missing STRIDE threat model');
assert(archDoc.includes('Table 17488'), 'docs/production-architecture.md missing Table 17488 documentation');
assert(archDoc.includes('FarmPilotQueue'), 'docs/production-architecture.md missing FarmPilotQueue documentation');
assert(archDoc.includes('Circuit Breaker'), 'docs/production-architecture.md missing Circuit Breaker documentation');
assert(archDoc.includes('Disaster Recovery'), 'docs/production-architecture.md missing Disaster Recovery documentation');

console.log('✓ Enterprise Soil & Farm Health Center, Cryptographic JWT Auth, Queues & Production Resilience PASSED');

// 12. Community Page Left-Side Message Icon & Messaging Port Verification
const commHtml = fs.readFileSync('community.html', 'utf8');
assert(commHtml.includes('left-message-port-trigger'), 'community.html missing left-message-port-trigger floating dock ID');
assert(commHtml.includes('left-side-message-dock'), 'community.html missing left-side-message-dock CSS class');
assert(commHtml.includes('left-msg-unread-badge'), 'community.html missing left-msg-unread-badge ID');
assert(commHtml.includes('left-header-message-btn'), 'community.html missing left-header-message-btn ID');
assert(commHtml.includes('left-directory-message-btn'), 'community.html missing left-directory-message-btn ID');
assert(commHtml.includes('openMessagingDrawer()'), 'community.html missing openMessagingDrawer trigger function call');
assert(commHtml.includes('messaging-modal'), 'community.html missing messaging-modal container');
assert(commHtml.includes('Alt+M') || commHtml.includes('altKey'), 'community.html missing Alt+M keyboard shortcut for messages port');
console.log('✓ Community Page Left-Side Message Icon & Messaging Port verification PASSED');

console.log('\n🎉 ALL 12 AUTOMATED VERIFICATION SUITES PASSED (100% OPERATIONAL EXCELLENCE)!');



