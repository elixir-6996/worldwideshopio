import { expect, test } from '@playwright/test'

/**
 * Smoke test: verifies the application boots and the home page renders without
 * a runtime error. Deeper user-flow coverage will be added per feature.
 */
test('home page loads successfully', async ({ page }) => {
  const response = await page.goto('/')
  expect(response?.ok()).toBeTruthy()
  await expect(page).toHaveTitle(/.+/)
  await expect(page.locator('body')).toBeVisible()
})
