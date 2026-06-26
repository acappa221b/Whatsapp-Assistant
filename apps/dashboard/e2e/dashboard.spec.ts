import { test, expect } from '@playwright/test'

test.describe('Assistant-01A — Rebranding', () => {
  test('root redirects to /dashboard', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/dashboard$/)
  })

  test('dashboard shows Sumário title', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: 'Sumário' })).toBeVisible()
  })

  test('sidebar shows 4 nav items only', async ({ page }) => {
    await page.goto('/dashboard')
    const nav = page.getByRole('navigation')
    await expect(nav.getByRole('link', { name: 'Dashboard' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Mensagens' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'WhatsApp' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Relatórios' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Pipeline' })).toHaveCount(0)
    await expect(nav.getByRole('link', { name: 'Despesas' })).toHaveCount(0)
  })

  test('reports placeholder loads', async ({ page }) => {
    await page.goto('/dashboard/reports')
    await expect(page.getByText('Módulo em desenvolvimento')).toBeVisible()
  })
})
