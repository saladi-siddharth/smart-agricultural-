import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import fs from 'fs';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = resolve(src, entry.name);
    const destPath = resolve(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function copyStaticAssetsPlugin() {
  return {
    name: 'copy-static-assets-plugin',
    closeBundle() {
      copyDirSync(resolve(rootDir, 'js'), resolve(rootDir, 'dist/js'));
      copyDirSync(resolve(rootDir, 'css'), resolve(rootDir, 'dist/css'));
      if (fs.existsSync(resolve(rootDir, 'public'))) {
        copyDirSync(resolve(rootDir, 'public'), resolve(rootDir, 'dist'));
      }
      console.log('✓ Successfully copied js/ and css/ assets into dist/ for Vercel deployment');
    }
  };
}

export default defineConfig({
  plugins: [copyStaticAssetsPlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(rootDir, 'index.html'),
        dashboard: resolve(rootDir, 'dashboard.html'),
        login: resolve(rootDir, 'login.html'),
        farms: resolve(rootDir, 'farms.html'),
        crops: resolve(rootDir, 'crops.html'),
        activities: resolve(rootDir, 'activities.html'),
        worker: resolve(rootDir, 'worker.html'),
        alerts: resolve(rootDir, 'alerts.html'),
        inputs: resolve(rootDir, 'inputs.html'),
        expenses: resolve(rootDir, 'expenses.html'),
        intelligence: resolve(rootDir, 'intelligence.html'),
        reports: resolve(rootDir, 'reports.html')
      }
    }
  },
  server: {
    port: 5173
  }
});
