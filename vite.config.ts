import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { defineConfig, type UserConfig } from 'vite'

export default defineConfig(({ mode }): UserConfig => {
  const isExtension = mode === 'chrome' || mode === 'firefox'

  return {
    plugins: [
      react({
        babel: {
          plugins: [['babel-plugin-react-compiler']],
        },
      }),
    ],

    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },

    publicDir: isExtension ? false : 'public',
    build: isExtension
      ? {
        outDir: mode === 'chrome' ? 'dist_chrome' : 'dist_firefox',
        rollupOptions: {
          input: {
            popup: resolve(__dirname, 'index.html'),
          },
        },
      }
      : undefined,
  }
})
