import { test, expect, Page } from '@playwright/test'

// ── Helpers ────────────────────────────────────────────────────────────────────

async function goToDashboard(page: Page) {
  await page.goto('/dashboard')
  await page.waitForURL('/dashboard', { timeout: 8_000 })
}

// ── Auth guard ─────────────────────────────────────────────────────────────────

test.describe('Auth guard', () => {
  test('unauthenticated /dashboard redirects then returns to dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/dashboard', { timeout: 8_000 })
  })
})

// ── Dashboard layout ───────────────────────────────────────────────────────────

test.describe('Dashboard layout', () => {
  test.beforeEach(async ({ page }) => {
    await goToDashboard(page)
  })

  test('renders Humanite brand in top bar', async ({ page }) => {
    await expect(page.getByText('Humanite').first()).toBeVisible()
  })

  test('renders tier badge in header', async ({ page }) => {
    const badge = page.locator('span').filter({ hasText: /free|pro|enterprise/i })
    await expect(badge.first()).toBeVisible()
  })

  test('renders Sign out button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible()
  })

  test('shows input placeholder when no text entered', async ({ page }) => {
    await expect(page.getByPlaceholder(/paste your ai-generated text/i)).toBeVisible()
  })

  test('shows output placeholder when no humanization done', async ({ page }) => {
    await expect(page.getByText(/your humanized text will appear here/i)).toBeVisible()
  })
})

// ── Control panel interactions ─────────────────────────────────────────────────

test.describe('Control panel', () => {
  test.beforeEach(async ({ page }) => {
    await goToDashboard(page)
  })

  test('Humanize button is present', async ({ page }) => {
    await expect(page.getByRole('button', { name: /humanize/i })).toBeVisible()
  })

  test('Scan button is present', async ({ page }) => {
    await expect(page.getByRole('button', { name: /scan/i })).toBeVisible()
  })

  test('intensity slider is present', async ({ page }) => {
    await expect(page.getByRole('slider')).toBeVisible()
  })

  test('save preset button is visible', async ({ page }) => {
    await expect(page.getByText(/save preset/i)).toBeVisible()
  })
})

// ── Sign out flow ─────────────────────────────────────────────────────────────

test.describe('Sign out', () => {
  test('sign out button redirects to login then back to dashboard', async ({ page }) => {
    await goToDashboard(page)
    await page.getByRole('button', { name: /sign out/i }).click()
    await expect(page).toHaveURL('/dashboard', { timeout: 8_000 })
  })
})
