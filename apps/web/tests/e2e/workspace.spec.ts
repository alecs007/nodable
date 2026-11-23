import { type Page, expect, test } from '@playwright/test'

async function createFormula(page: Page): Promise<void> {
  await page.locator('nav.dock').getByRole('button', { name: 'New formula' }).click()

  const dialog = page.getByRole('dialog', { name: 'New formula' })

  await dialog.getByRole('button', { name: 'Create' }).click()
  await expect(dialog).toHaveCount(0)
}

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
  await expect(page).toHaveTitle(/Syntax trees and truth tables/)

  await page.getByRole('button', { name: 'Language' }).click()
  await expect(page.getByRole('textbox', { name: 'Formulă', exact: true })).toBeVisible()
  await expect(page).toHaveTitle(/Arbori sintactici și tabele de adevăr/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'ro')

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
  await createFormula(page)
  await field.fill('(r → s)')

  await page.getByRole('button', { name: /(r → s)/ }).click()
  await page.getByRole('button', { name: /^Seminar one/ }).click()

  await expect(field).toHaveValue('(p ∧ q)')
})

test('names the downloaded file after the formula', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Formula', exact: true }).fill('(p ∧ q)')
  await page.getByRole('textbox', { name: 'Formula name' }).fill('Seminar one')

  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Transfer' }).click()
  await page.getByRole('button', { name: /Plain text/ }).click()

  expect((await download).suggestedFilename()).toBe('seminar-one.txt')
})

test('deletes the active formula', async ({ page }) => {
  const field = page.getByRole('textbox', { name: 'Formula', exact: true })
  await field.fill('(p ∧ q)')
  await createFormula(page)
  await field.fill('(r → s)')

  await page.getByRole('button', { name: 'Transfer' }).click()
  await page.getByRole('button', { name: /Remove formula/ }).click()

  await expect(field).toHaveValue('(p ∧ q)')
})

test('files formulas into folders and finds them by search', async ({ page }) => {
  const field = page.getByRole('textbox', { name: 'Formula', exact: true })
  await field.fill('(p ∧ q)')
  await page.getByRole('textbox', { name: 'Formula name' }).fill('Seminar one')
  await createFormula(page)
  await field.fill('(r → s)')

  await page.getByRole('button', { name: 'Formulas' }).click()
  await page.getByRole('button', { name: 'New folder' }).click()
  await page.keyboard.type('Lecture 4')
  await page.keyboard.press('Enter')

  await page.getByRole('button', { name: 'Actions for Seminar one' }).click()
  await page.getByRole('button', { name: 'Move' }).click()
  await page.locator('.targets').getByRole('button', { name: 'Lecture 4' }).click()

  await expect(page.locator('.folder .toggle')).toContainText('Lecture 4 1')

  await page.getByRole('searchbox').fill('->')

  const dialog = page.getByRole('dialog')

  await expect(dialog.getByRole('button', { name: /^Seminar one/ })).toHaveCount(0)
  await expect(dialog.getByRole('button', { name: /^Untitled \(r → s\)/ })).toHaveCount(1)

  await page.getByRole('searchbox').fill('')
  await page.getByRole('button', { name: /^Seminar one/ }).click()

  await expect(field).toHaveValue('(p ∧ q)')
})

async function centerOf(page: Page, selector: string): Promise<{ x: number; y: number }> {
  const box = await page.locator(selector).first().boundingBox()

  return { x: (box?.x ?? 0) + (box?.width ?? 0) / 2, y: (box?.y ?? 0) + (box?.height ?? 0) / 2 }
}

test('drags a formula into a folder and out again', async ({ page }) => {
  const field = page.getByRole('textbox', { name: 'Formula', exact: true })
  await field.fill('(p ∧ q)')
  await page.getByRole('textbox', { name: 'Formula name' }).fill('Seminar one')
  await createFormula(page)
  await field.fill('(r → s)')
  await page.getByRole('button', { name: /^Formulas/ }).click()
  await page.getByRole('button', { name: 'New folder' }).click()
  await page.keyboard.type('Lecture 4')
  await page.keyboard.press('Enter')

  const from = await centerOf(page, '.pick:has-text("Seminar one")')
  const into = await centerOf(page, '.folder .head')
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  await page.mouse.move(into.x, into.y, { steps: 10 })
  await expect(page.locator('.folder')).toHaveClass(/over/)
  await page.mouse.up()

  await expect(page.locator('.folder .toggle')).toContainText('Lecture 4 1')
  expect(await page.evaluate(() => String(window.getSelection()))).toBe('')
  await page.waitForTimeout(400)

  const back = await centerOf(page, '.folder .pick')
  const out = await centerOf(page, '.loose .pick')
  await page.mouse.move(back.x, back.y)
  await page.mouse.down()
  await page.mouse.move(out.x, out.y, { steps: 10 })
  await page.mouse.up()

  await expect(page.locator('.folder .toggle')).toContainText('Lecture 4 0')
  await expect(page.getByRole('dialog')).toBeVisible()
})

test('deletes a folder together with its formulas after a confirmation', async ({ page }) => {
  const field = page.getByRole('textbox', { name: 'Formula', exact: true })
  await field.fill('(p ∧ q)')
  await page.getByRole('textbox', { name: 'Formula name' }).fill('Seminar one')
  await createFormula(page)
  await field.fill('(r → s)')
  await page.getByRole('button', { name: /^Formulas/ }).click()
  await page.getByRole('button', { name: 'Actions for Seminar one' }).click()
  await page.getByRole('button', { name: 'Move' }).click()
  await page.locator('.targets').getByRole('button', { name: 'New folder' }).click()
  await page.keyboard.type('Lecture 4')
  await page.keyboard.press('Enter')

  await page.getByRole('button', { name: 'Actions for Lecture 4' }).click()
  await page.getByRole('button', { name: 'Delete folder' }).click()

  await expect(page.locator('.folder')).toHaveCount(1)

  await page.getByRole('button', { name: 'Delete for good?' }).click()

  await expect(page.locator('.folder')).toHaveCount(0)
  await expect(page.getByRole('dialog').getByRole('button', { name: /^Seminar one/ })).toHaveCount(
    0,
  )
  await expect(field).toHaveValue('(r → s)')
})

test('closes the actions of a formula when something else is pressed', async ({ page }) => {
  const field = page.getByRole('textbox', { name: 'Formula', exact: true })
  await field.fill('(p ∧ q)')
  await page.getByRole('textbox', { name: 'Formula name' }).fill('Seminar one')
  await createFormula(page)
  await page.getByRole('button', { name: /^Formulas/ }).click()
  await page.getByRole('button', { name: 'New folder' }).click()
  await page.keyboard.press('Enter')

  await page.getByRole('button', { name: 'Actions for Seminar one' }).click()
  await expect(page.getByRole('button', { name: 'Duplicate' })).toBeVisible()

  await page.getByRole('searchbox').click()
  await expect(page.getByRole('button', { name: 'Duplicate' })).toBeHidden()

  await page.getByRole('button', { name: 'Actions for New folder' }).click()
  await expect(page.getByRole('button', { name: 'Delete folder' })).toBeVisible()

  await page.locator('.folder .toggle').click()
  await expect(page.getByRole('button', { name: 'Delete folder' })).toBeHidden()
})

test('names a new formula in a modal and lets it stay unnamed', async ({ page }) => {
  const field = page.getByRole('textbox', { name: 'Formula', exact: true })
  await field.fill('(p ∧ q)')

  await page.locator('nav.dock').getByRole('button', { name: 'New formula' }).click()
  const dialog = page.getByRole('dialog', { name: 'New formula' })
  await dialog.getByRole('textbox').fill('Lecture 5')
  await page.keyboard.press('Enter')

  await expect(dialog).toHaveCount(0)
  await expect(page.getByRole('textbox', { name: 'Formula name' })).toHaveValue('Lecture 5')
  await expect(field).toBeFocused()
  await expect(field).toHaveValue('')

  await page.locator('nav.dock').getByRole('button', { name: 'New formula' }).click()
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).toHaveCount(0)
  await expect(page.getByRole('textbox', { name: 'Formula name' })).toHaveValue('Lecture 5')
})

test('creates a formula inside a folder from the list', async ({ page }) => {
  const field = page.getByRole('textbox', { name: 'Formula', exact: true })
  await field.fill('(p ∧ q)')
  await createFormula(page)
  await page.getByRole('button', { name: /^Formulas/ }).click()
  await page.getByRole('button', { name: 'New folder' }).click()
  await page.keyboard.type('Lecture 4')
  await page.keyboard.press('Enter')

  await expect(page.locator('.folder .toggle')).toHaveAttribute('aria-expanded', 'false')

  await page.getByRole('button', { name: 'Actions for Lecture 4' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'New formula' }).last().click()
  await page.keyboard.type('Exercise 1')
  await page.keyboard.press('Enter')

  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('textbox', { name: 'Formula name' })).toHaveValue('Exercise 1')

  await page.getByRole('button', { name: /^Formulas/ }).click()
  await expect(page.locator('.folder .toggle')).toContainText('Lecture 4 1')
  await expect(page.locator('.folder .toggle')).toHaveAttribute('aria-expanded', 'false')
})
