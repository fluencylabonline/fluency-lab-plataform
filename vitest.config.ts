import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['modules/**/__tests__/**/*.test.ts', 'lib/**/__tests__/**/*.test.ts'],
    alias: {
      '@': path.resolve(__dirname, './'),
      // `server-only` lança fora da condição react-server; nos testes usamos o módulo vazio.
      'server-only': path.resolve(__dirname, './node_modules/server-only/empty.js'),
    },
  },
});
