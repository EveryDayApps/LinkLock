import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

// Plugin to copy and rename manifest file based on browser
function manifestPlugin(browser: 'chrome' | 'firefox') {
  return {
    name: 'manifest-plugin',
    writeBundle() {
      const manifestSrc = resolve(__dirname, `public/manifest.${browser}.json`);
      const manifestDest = resolve(__dirname, `dist-${browser}/manifest.json`);

      if (fs.existsSync(manifestSrc)) {
        fs.copyFileSync(manifestSrc, manifestDest);
        console.log(`✓ Copied manifest.${browser}.json → dist-${browser}/manifest.json`);
      }
    }
  };
}

// Plugin to copy public assets
function copyPublicPlugin(browser: 'chrome' | 'firefox') {
  return {
    name: 'copy-public-plugin',
    writeBundle() {
      const publicDir = resolve(__dirname, 'public');
      const distDir = resolve(__dirname, `dist-${browser}`);

      // Copy icons directory if it exists
      const iconsDir = resolve(publicDir, 'icons');
      const distIconsDir = resolve(distDir, 'icons');

      if (fs.existsSync(iconsDir)) {
        if (!fs.existsSync(distIconsDir)) {
          fs.mkdirSync(distIconsDir, { recursive: true });
        }

        const files = fs.readdirSync(iconsDir);
        files.forEach(file => {
          fs.copyFileSync(
            resolve(iconsDir, file),
            resolve(distIconsDir, file)
          );
        });
        console.log(`✓ Copied icons to dist-${browser}/icons`);
      }
    }
  };
}

export default defineConfig(({ mode }) => {
  const browser = (process.env.BROWSER || 'chrome') as 'chrome' | 'firefox';

  return {
    plugins: [
      react({
        babel: {
          plugins: [['babel-plugin-react-compiler']],
        },
      }),
      manifestPlugin(browser),
      copyPublicPlugin(browser),
    ],
    build: {
      outDir: `dist-${browser}`,
      rollupOptions: {
        input: {
          popup: resolve(__dirname, 'popup.html'),
          options: resolve(__dirname, 'options.html'),
          unlock: resolve(__dirname, 'unlock.html'),
          background: resolve(__dirname, 'src/background/index.ts'),
        },
        output: {
          entryFileNames: (chunkInfo) => {
            // Background script should not have hash
            if (chunkInfo.name === 'background') {
              return 'background.js';
            }
            return 'assets/[name]-[hash].js';
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
      // Don't minify background script for easier debugging
      minify: mode === 'production' ? 'esbuild' : false,
      sourcemap: mode === 'development' ? 'inline' : false,
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
  };
});
