import { defineConfig, devices } from '@playwright/test';

// Pruebas en un móvil emulado contra un servidor de desarrollo propio, en otro puerto,
// para que los estados que envían los tests no lleguen al móvil de quien está probando en el 5173.
const PORT = 5174;

export default defineConfig({
  testDir: 'e2e',
  testMatch: '*.e2e.ts',
  // De uno en uno: /__dev/goto mueve a todas las páginas conectadas.
  workers: 1,
  use: { ...devices['Pixel 7'], baseURL: `http://localhost:${PORT}` },
  webServer: { command: `npx vite --port ${PORT}`, url: `http://localhost:${PORT}`, reuseExistingServer: true },
});
