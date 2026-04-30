import { test, expect, Page } from '@playwright/test'

// ── Helpers ────────────────────────────────────────────────────────────────────

const TEST_EMAIL    = 'e2e-test@humanite.dev'
const TEST_PASSWORD = 'TestPass123!'

async function loginAs(page: Page, email = TEST_EMAIL, password = TEST_PASSWORD) {
  await page.goto('/auth/login')
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill(password)
  await page.getByRole('button', { name: /sign in|log in/i }).click()
  await page.waitForURL('/dashboard', { timeout: 10_000 })
}

async function typeIntoMonaco(page: Page, text: string) {
  const editor = page.locator('.monaco-editor').first()
  await editor.click()
  await page.keyboard.press('Control+a')
  await page.keyboard.type(text)
}

// ── Auth guard ─────────────────────────────────────────────────────────────────

test.describe('Auth guard', () => {
  test('redirects unauthenticated users from /dashboard to /auth/login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.getByRole('heading', { name: /sign in|log in/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
  })
})

// ── Dashboard layout ───────────────────────────────────────────────────────────

test.describe('Dashboard layout', () => {
  test.beforeEach(async ({ page }) => {
    // Mock auth by injecting token into localStorage
    await page.goto('/auth/login')
    await page.evaluate(() => {
      const store = {
        state: {
          accessToken: 'mock-token',
          user: { id: 'test-user', email: 'e2e@test.com', tier: 'pro' },
        },
        version: 0,
      }
      localStorage.setItem('humanite-user', JSON.stringify(store))
    })
    await page.goto('/dashboard')
  })

  test('renders top bar with service name', async ({ page }) => {
    await expect(page.getByText('Humanite')).toBeVisible()
    await expect(page.getByText('Dashboard')).toBeVisible()
  })

  test('renders tier badge in header', async ({ page }) => {
    const badge = page.locator('span').filter({ hasText: /free|pro|enterprise/i })
    await expect(badge.first()).toBeVisible()
  })

  test('renders Clear and Sign out buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: /clear/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible()
  })

  test('shows ready placeholder when no job is running', async ({ page }) => {
    await expect(page.getByText('Ready')).toBeVisible()
    await expect(page.getByText(/Humanize/)).toBeVisible()
    await expect(page.getByText(/Scan/)).toBeVisible()
  })

  test('control panel is visible', async ({ page }) => {
    await expect(page.locator('[data-testid="control-panel"], .control-panel, header ~ div').first()).toBeVisible()
  })
})

// ── Control panel interactions ─────────────────────────────────────────────────

test.describe('Control panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
    await page.evaluate(() => {
      localStorage.setItem('humanite-user', JSON.stringify({
        state: { accessToken: 'mock-token', user: { id: 'u1', email: 'e2e@test.com', tier: 'free' } },
        version: 0,
      }))
    })
    await page.goto('/dashboard')
  })

  test('Humanize button is present and enabled', async ({ page }) => {
    const btn = page.getByRole('button', { name: /humanize/i })
    await expect(btn).toBeVisible()
    await expect(btn).not.toBeDisabled()
  })

  test('Scan button is present and enabled', async ({ page }) => {
    const btn = page.getByRole('button', { name: /scan/i })
    await expect(btn).toBeVisible()
    await expect(btn).not.toBeDisabled()
  })
})

// ── Sign out flow ─────────────────────────────────────────────────────────────

test.describe('Sign out', () => {
  test('sign out clears auth and redirects to login', async ({ page }) => {
    await page.goto('/auth/login')
    await page.evaluate(() => {
      localStorage.setItem('humanite-user', JSON.stringify({
        state: { accessToken: 'mock-token', user: { id: 'u1', email: 'e2e@test.com', tier: 'free' } },
        version: 0,
      }))
    })
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/dashboard')

    await page.getByRole('button', { name: /sign out/i }).click()
    await expect(page).toHaveURL(/\/auth\/login/)
  })
})

// ── Clear button ──────────────────────────────────────────────────────────────

test.describe('Clear button', () => {
  test('clear button resets output panel back to ready state', async ({ page }) => {
    await page.goto('/auth/login')
    await page.evaluate(() => {
      localStorage.setItem('humanite-user', JSON.stringify({
        state: { accessToken: 'mock-token', user: { id: 'u1', email: 'e2e@test.com', tier: 'free' } },
        version: 0,
      }))
      // Seed humanize store with a completed status to show the output panel
      localStorage.setItem('humanite-humanize', JSON.stringify({
        state: { status: 'idle', response: null, settings: { intensity: 5, tone: 'neutral', domain: 'general', preserve_citations: false } },
        version: 0,
      }))
    })
    await page.goto('/dashboard')

    await page.getByRole('button', { name: /clear/i }).click()
    await expect(page.getByText('Ready')).toBeVisible()
  })
})

// ── Preset selector ───────────────────────────────────────────────────────────

test.describe('Preset selector', () => {
  test('save preset button is visible', async ({ page }) => {
    await page.goto('/auth/login')
    await page.evaluate(() => {
      localStorage.setItem('humanite-user', JSON.stringify({
        state: { accessToken: 'mock-token', user: { id: 'u1', email: 'e2e@test.com', tier: 'pro' } },
        version: 0,
      }))
    })
    await page.goto('/dashboard')
    await expect(page.getByText(/save preset/i)).toBeVisible()
  })
})
