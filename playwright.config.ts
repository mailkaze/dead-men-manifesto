import { defineConfig, devices } from '@playwright/test';

// Pruebas en un móvil emulado contra el servidor de desarrollo.
export default defineConfig({
  testDir: 'e2e',
  testMatch: '*.e2e.ts',
  use: { ...devices['Pixel 7'], baseURL: 'http://localhost:5173' },
  webServer: { command: 'npm run dev', url: 'http://localhost:5173', reuseExistingServer: true },
});
