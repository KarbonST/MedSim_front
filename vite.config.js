import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    allowedHosts: ['multiply-alert-moray.cloudpub.ru'],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
      '/ws/team-chat': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
