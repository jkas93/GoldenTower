/**
 * Playwright Configuration for E2E Tests
 * 
 * Ejecuta tests E2E contra la aplicación desplegada o local.
 * 
 * Uso:
 *   npx playwright test              # Ejecutar todos los tests
 *   npx playwright test --ui         # UI mode
 *   npx playwright test --headed     # Con navegador visible
 *   npx playwright test --debug      # Modo debug
 * 
 * Configuración de entorno:
 *   PLAYWRIGHT_BASE_URL=http://localhost:3000  # Para local
 *   PLAYWRIGHT_BASE_URL=https://goldentowerc.vercel.app  # Para prod
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'e2e-results.json' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Fixture: timeout global de 30s
    actionTimeout: 30_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 15'] },
    },
  ],

  // Web server para tests locales (opcional)
  ...(process.env.PLAYWRIGHT_START_SERVER === 'true'
    ? {
        webServer: {
          command: 'npm run dev',
          url: 'http://localhost:3000',
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      }
    : {}),
});
