import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('switches the theme and keeps the choice after a reload', async ({ page }) => {
  const root = page.locator('html')
  const detected = await root.getAttribute('data-theme')
  const other = detected === 'dark' ? 'light' : 'dark'

  expect(detected === 'light' || detected === 'dark').toBe(true)

  await page.getByRole('button', { name: /^Theme/ }).click()
  await expect(root).toHaveAttribute('data-theme', other)

  await page.reload()
  await expect(root).toHaveAttribute('data-theme', other)
})

test('switches the language and keeps the choice after a reload', async ({ page }) => {
  await expect(page.getByRole('textbox', { name: 'Formula', exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Language' }).click()
  await expect(page.getByRole('textbox', { name: 'Formulă', exact: true })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('textbox', { name: 'Formulă', exact: true })).toBeVisible()
})

test('keeps the formulas of the workspace after a reload', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Formula', exact: true }).fill('((¬p) ∨ q)')
  await page.waitForTimeout(900)
  await page.reload()

  await expect(page.getByRole('textbox', { name: 'Formula', exact: true })).toHaveValue(
    '((¬p) ∨ q)',
  )
})

test('keeps several formulas and switches between them', async ({ page }) => {
  const field = page.getByRole('textbox', { name: 'Formula', exact: true })
  await field.fill('(p ∧ q)')
  await page.getByRole('textbox', { name: 'Formula name' }).fill('Seminar one')
  await page.getByRole('button', { name: 'New formula' }).click()
  await field.fill('(r → s)')

  await page.getByRole('button', { name: /(r → s)/ }).click()
  await page.getByRole('button', { name: 'Seminar one' }).click()

  await expect(field).toHaveValue('(p ∧ q)')
})

test('names the downloaded file after the formula', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Formula', exact: true }).fill('(p ∧ q)')
  await page.getByRole('textbox', { name: 'Formula name' }).fill('Seminar one')

  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Transfer' }).click()
  await page.getByRole('menuitem', { name: 'Plain text' }).click()

  expect((await download).suggestedFilename()).toBe('seminar-one.txt')
})

test('deletes the active formula', async ({ page }) => {
  const field = page.getByRole('textbox', { name: 'Formula', exact: true })
  await field.fill('(p ∧ q)')
  await page.getByRole('button', { name: 'New formula' }).click()
  await field.fill('(r → s)')

  await page.getByRole('button', { name: 'Transfer' }).click()
  await page.getByRole('menuitem', { name: 'Remove formula' }).click()

  await expect(field).toHaveValue('(p ∧ q)')
})
