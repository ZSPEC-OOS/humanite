import { test, expect, Page } from '@playwright/test'

// ── Helpers ────────────────────────────────────────────────────────────────────

const CORRECT_PIN = '5522'

async function enterPin(page: Page, pin: string) {
  for (const digit of pin) {
    await page.getByRole('button', { name: digit, exact: true }).click()
    await page.waitForTimeout(60)
  }
}

async function loginWithPin(page: Page) {
  await page.goto('/auth/login')
  await enterPin(page, CORRECT_PIN)
  await page.waitForURL('/dashboard', { timeout: 8_000 })
}

// ── Auth guard ─────────────────────────────────────────────────────────────────

test.describe('Auth guard', () => {
  test('redirects unauthenticated users from /dashboard to /auth/login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('PIN login page renders correctly', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.getByText('Humanite')).toBeVisible()
    await expect(page.getByText(/enter pin/i)).toBeVisible()
    for (const d of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']) {
      await expect(page.getByRole('button', { name: d, exact: true })).toBeVisible()
    }
  })

  test('correct PIN navigates to dashboard', async ({ page }) => {
    await page.goto('/auth/login')
    await enterPin(page, CORRECT_PIN)
    await expect(page).toHaveURL('/dashboard', { timeout: 8_000 })
  })

  test('wrong PIN shows error and resets', async ({ page }) => {
    await page.goto('/auth/login')
    await enterPin(page, '0000')
    await expect(page.getByText(/incorrect pin/i)).toBeVisible()
    await page.waitForTimeout(700)
    await expect(page).toHaveURL(/\/auth\/login/)
  })
})

// ── Dashboard layout ───────────────────────────────────────────────────────────

test.describe('Dashboard layout', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithPin(page)
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
    await loginWithPin(page)
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
  test('sign out clears auth and redirects to login', async ({ page }) => {
    await loginWithPin(page)
    await expect(page).toHaveURL('/dashboard')
    await page.getByRole('button', { name: /sign out/i }).click()
    await expect(page).toHaveURL(/\/auth\/login/)
  })
})
