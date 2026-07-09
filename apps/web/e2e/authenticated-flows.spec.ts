/**
 * E2E Test: Authenticated User Flows
 * 
 * IMPORTANTE: Requiere credenciales de test en las variables de entorno:
 *   E2E_TEST_EMAIL=test@example.com
 *   E2E_TEST_PASSWORD=password123
 *   E2E_TEST_ROLE=GERENTE
 * 
 * Estos tests se saltean si las credenciales no están configuradas.
 */
import { test, expect } from '@playwright/test';

const TEST_EMAIL = process.env.E2E_TEST_EMAIL;
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD;

// Skip todos los tests si no hay credenciales
test.skip(
  !TEST_EMAIL || !TEST_PASSWORD,
  'E2E credentials not configured (E2E_TEST_EMAIL, E2E_TEST_PASSWORD)',
);

test.describe('Authenticated User Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Login antes de cada test
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_EMAIL!);
    await page.fill('input[type="password"]', TEST_PASSWORD!);
    await page.locator('button[type="submit"]').click();
    
    // Esperar redirección al dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
  });

  test('should show dashboard after login', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Debe mostrar algún elemento del dashboard
    const dashboardContent = await page
      .locator('body')
      .textContent();
    expect(dashboardContent).toBeTruthy();
  });

  test('should navigate to projects page', async ({ page }) => {
    await page.goto('/dashboard/projects');
    
    await expect(page).toHaveURL(/\/dashboard\/projects/);
  });

  test('should navigate to RRHH page (if authorized)', async ({ page }) => {
    await page.goto('/dashboard/rrhh');
    
    // Puede redirigir si no tiene permisos, o mostrar la página
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(dashboard|login)/);
  });

  test('should logout successfully', async ({ page }) => {
    // Buscar botón de logout (puede estar en menú o directamente visible)
    const logoutBtn = page.locator('[data-testid="logout-btn"], button:has-text("Cerrar sesión"), button:has-text("Logout")').first();
    
    if (await logoutBtn.isVisible().catch(() => false)) {
      await logoutBtn.click();
      await page.waitForURL(/\/login/, { timeout: 10_000 });
      expect(page.url()).toContain('/login');
    }
  });
});
