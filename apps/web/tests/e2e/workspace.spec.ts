import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('switches the theme and keeps the choice after a reload', async ({ page }) => {
  const root = page.locator('html')
  await expect(root).toHaveAttribute('data-theme', /light|dark/)

  await page.getByRole('button', { name: /^Theme/ }).click()
  await expect(root).toHaveAttribute('data-theme', 'light')

  await page.reload()
  await expect(root).toHaveAttribute('data-theme', 'light')
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

test('holds several formulas and shows them all at once', async ({ page }) => {
  const field = page.getByRole('textbox', { name: 'Formula', exact: true })
  await field.fill('(p ∧ q)')
  await page.getByRole('button', { name: 'Add formula' }).click()
  await field.fill('(r → s)')

  await page.getByRole('button', { name: 'All trees' }).click()

  const gallery = page.getByRole('main')

  await expect(gallery.getByRole('button', { name: /\(p ∧ q\)/ })).toBeVisible()
  await expect(gallery.getByRole('button', { name: /\(r → s\)/ })).toBeVisible()
})

test('names a formula and deletes it from the gallery', async ({ page }) => {
  const field = page.getByRole('textbox', { name: 'Formula', exact: true })
  await field.fill('(p ∧ q)')
  await page.getByRole('textbox', { name: 'Formula name' }).fill('Seminar one')
  await page.getByRole('button', { name: 'Add formula' }).click()
  await field.fill('(r → s)')

  await page.getByRole('button', { name: 'All trees' }).click()

  const gallery = page.getByRole('main')
  await expect(gallery.getByText('Seminar one')).toBeVisible()

  await gallery.getByRole('button', { name: 'Delete this formula' }).first().click()

  await expect(gallery.getByText('Seminar one')).toBeHidden()
})

test('zooms the workspace in and out', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Formula', exact: true }).fill('(p ∧ q)')

  await page.getByRole('button', { name: 'Zoom in' }).click()

  await expect(page.getByRole('button', { name: 'Reset the zoom' })).toHaveText('120%')

  await page.getByRole('button', { name: 'Reset the zoom' }).click()

  await expect(page.getByRole('button', { name: 'Reset the zoom' })).toHaveText('100%')
})

test('moves a node with the keyboard', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Formula', exact: true }).fill('(p ∧ q)')

  const node = page.getByRole('button', { name: 'Move this node' }).nth(1)
  const before = await node.boundingBox()

  await node.focus()
  await node.press('ArrowRight')
  await node.press('ArrowRight')

  const after = await node.boundingBox()

  expect(after?.x ?? 0).toBeGreaterThan(before?.x ?? 0)
})
