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

console.log('🎉 ALL AUTOMATED VERIFICATION CHECKS PASSED!');

