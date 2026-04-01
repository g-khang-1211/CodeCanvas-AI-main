import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    root: 'frontend',
    envDir: '../',
    plugins: [react(), tailwindcss()],

    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    },

    build: {
      outDir: '../dist',
      emptyOutDir: true
    },

    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: 'http://localhost:4000',
          changeOrigin: true
        }
      }
    },

    preview: {
      host: true,
      port: 10000,
      allowedHosts: [
        'codecanvas-ai.onrender.com'
      ]
    }
  };
});
