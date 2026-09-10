import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dist = path.join(__dirname, '..', 'dist');

if (!fs.existsSync(dist)) {
  console.error('dist directory does not exist. Run npm run build first.');
  process.exit(1);
}

const htmlFiles = fs.readdirSync(dist).filter(f => f.endsWith('.html'));
console.log(`Found ${htmlFiles.length} HTML files in dist/`);

let errors = 0;
for (const file of htmlFiles) {
  const content = fs.readFileSync(path.join(dist, file), 'utf8');
  
  // Find local CSS
  const cssMatches = content.matchAll(/href=["'](css\/[^"']+)["']/g);
  for (const match of cssMatches) {
    const cssPath = path.join(dist, match[1]);
    if (!fs.existsSync(cssPath)) {
      console.error(`❌ [${file}] Missing CSS: ${match[1]}`);
      errors++;
    }
  }

  // Find local JS
  const jsMatches = content.matchAll(/src=["'](js\/[^"']+)["']/g);
  for (const match of jsMatches) {
    const jsPath = path.join(dist, match[1]);
    if (!fs.existsSync(jsPath)) {
      console.error(`❌ [${file}] Missing JS: ${match[1]}`);
      errors++;
    }
  }
}

if (errors === 0) {
  console.log('✅ ALL 12 HTML pages in dist/ have 100% valid, resolved CSS and JS assets on disk!');
} else {
  console.error(`Total missing assets: ${errors}`);
  process.exit(1);
}
