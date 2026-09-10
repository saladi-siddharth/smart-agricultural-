import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, 'dist');

// 1. Clean / create dist directory
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Helper to copy directory recursively
function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 2. Copy all root HTML files intact
const rootFiles = fs.readdirSync(__dirname);
let htmlCount = 0;
for (const file of rootFiles) {
  if (file.endsWith('.html')) {
    fs.copyFileSync(path.join(__dirname, file), path.join(distDir, file));
    htmlCount++;
  }
}
console.log(`✓ Copied ${htmlCount} HTML pages intact to dist/`);

// 3. Copy css and js folders
copyDirSync(path.join(__dirname, 'css'), path.join(distDir, 'css'));
console.log('✓ Copied css/ design system and components to dist/css/');

copyDirSync(path.join(__dirname, 'js'), path.join(distDir, 'js'));
console.log('✓ Copied js/ application controllers and assets to dist/js/');

// 4. Copy SVG assets and PWA files if present
const staticAssets = ['favicon.svg', 'icons.svg', 'manifest.json', 'sw.js'];
for (const asset of staticAssets) {
  const assetPath = path.join(__dirname, asset);
  if (fs.existsSync(assetPath)) {
    fs.copyFileSync(assetPath, path.join(distDir, asset));
    console.log(`✓ Copied ${asset} to dist/`);
  }
}

// 4b. Copy icons/ folder for PWA
if (fs.existsSync(path.join(__dirname, 'icons'))) {
  copyDirSync(path.join(__dirname, 'icons'), path.join(distDir, 'icons'));
  console.log('✓ Copied icons/ directory to dist/icons/');
}

// 5. Copy public/ if present
const publicDir = path.join(__dirname, 'public');
if (fs.existsSync(publicDir)) {
  copyDirSync(publicDir, distDir);
  console.log('✓ Copied public/ directory assets to dist/');
}

console.log('🎉 FarmPilot Vercel production build completed successfully!');
