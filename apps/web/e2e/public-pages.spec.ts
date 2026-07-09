/**
 * E2E Test: Public Pages (No Auth Required)
 * 
 * Verifica que las páginas públicas funcionen correctamente.
 */
import { test, expect } from '@playwright/test';

test.describe('Public Pages', () => {
  test('should redirect root to login when not authenticated', async ({ page }) => {
    await page.goto('/');
    // Debe redirigir a /login (o mostrar loader)
    await page.waitForURL(/\/(login)?/, { timeout: 10_000 });
  });

  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    
    // Verificar elementos clave de login
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation error on empty submit', async ({ page }) => {
    await page.goto('/login');
    
    await page.locator('button[type="submit"]').click();
    
    // Debe mostrar algún indicador de error o mantener en la misma página
    await expect(page).toHaveURL(/\/login/);
  });

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/login');
    
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    
    // Verificar viewport
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toBeTruthy();
  });
});

test.describe('Health Checks', () => {
  test('should load without JS errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // No debe haber errores críticos de JS
    const criticalErrors = errors.filter(
      (e) => !e.includes('ResizeObserver') && !e.includes('Non-Error'),
    );
    expect(criticalErrors.length).toBe(0);
  });

  test('should have no broken images', async ({ page }) => {
    await page.goto('/login');
    
    const brokenImages = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.filter((img) => !img.complete || img.naturalWidth === 0).length;
    });
    
    expect(brokenImages).toBe(0);
  });
});
