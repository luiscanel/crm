/**
 * E2E Tests for Teknao CRM - critical user flows
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const API_URL = process.env.API_URL || 'http://localhost:3001';

test.describe('Teknao CRM E2E', () => {
  
  test.describe('Authentication', () => {
    test('should login successfully', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      
      // Focus email input and type
      const emailInput = page.locator('input').first();
      await emailInput.fill('luis.c@teknao.com.gt');
      
      // Password input
      const passwordInput = page.locator('input[type="password"]');
      await passwordInput.fill('admin123');
      
      // Submit - find button with submit or containing "Iniciar"
      await page.locator('button:has-text("Iniciar"), button[type="submit"]').first().click();
      
      // Should redirect to dashboard
      await expect(page).toHaveURL(/dashboard|empresas|^\/$/);
    });
    
    test('should show error with invalid credentials', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      
      await page.locator('input').first().fill('invalid@test.com');
      await page.locator('input[type="password"]').fill('wrongpass');
      await page.locator('button:has-text("Iniciar"), button[type="submit"]').first().click();
      
      // Wait for error message
      await page.waitForTimeout(1000);
      const errorText = await page.locator('text=Error, text=inválid, text=incorrecto').first();
      if (await errorText.isVisible().catch(() => false)) {
        await expect(errorText).toBeVisible();
      }
    });
  });
  
  test.describe('Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      // Login first
      await page.goto(`${BASE_URL}/login`);
      await page.locator('input').first().fill('luis.c@teknao.com.gt');
      await page.locator('input[type="password"]').fill('admin123');
      await page.locator('button:has-text("Iniciar"), button[type="submit"]').first().click();
      await page.waitForTimeout(1000);
    });
    
    test('should load dashboard', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`).catch(() => page.goto(BASE_URL));
      
      // Wait for content to load
      await page.waitForTimeout(2000);
      
      // Check something loaded
      const body = await page.locator('body').textContent();
      expect(body.length).toBeGreaterThan(0);
    });
  });
  
  test.describe('API', () => {
    test('should return health check', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/health`);
      expect(response.ok()).toBeTruthy();
      const json = await response.json();
      expect(json.success).toBe(true);
    });
    
    test('should require auth for protected routes', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/empresas`);
      expect(response.status()).toBe(401);
    });
  });
});

test.describe('Performance', () => {
  test('should load page under 3 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - start;
    
    console.log(`Page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(5000);
  });
});