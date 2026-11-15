import { type Page, expect, test } from '@playwright/test'

async function interpret(page: Page, formula: string): Promise<void> {
  await page.getByRole('textbox', { name: 'Formula', exact: true }).fill(formula)
  await page.getByRole('button', { name: 'Interpret' }).click()
}

async function assign(page: Page, variable: string, value: 'True' | 'False'): Promise<void> {
  await page.getByRole('radiogroup', { name: variable }).getByRole('radio', { name: value }).check()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('offers an interpretation only once the formula is complete', async ({ page }) => {
  const field = page.getByRole('textbox', { name: 'Formula', exact: true })
  await field.fill('(p ∧')

  await expect(page.getByRole('button', { name: 'Interpret' })).toBeHidden()

  await field.fill('(p ∧ q)')

  await expect(page.getByRole('button', { name: 'Interpret' })).toBeVisible()
})

test('evaluates the formula once every variable has a value', async ({ page }) => {
  await interpret(page, '((¬p) ∨ q)')

  await expect(page.getByText('Choose a value for every variable (2 left)')).toBeVisible()

  await assign(page, 'p', 'True')

  await expect(page.getByText('Choose a value for every variable (1 left)')).toBeVisible()
  await expect(page.getByRole('img', { name: 'single node ¬: False' })).toBeVisible()

  await assign(page, 'q', 'False')

  await expect(page.getByText('The formula is false under this interpretation')).toBeVisible()
  await expect(page.getByRole('img', { name: 'double node ∨: False' })).toBeVisible()

  await assign(page, 'q', 'True')

  await expect(page.getByText('The formula is true under this interpretation')).toBeVisible()
})

test('lists every step of the evaluation', async ({ page }) => {
  await interpret(page, '((¬p) ∨ q)')
  await assign(page, 'p', 'False')
  await assign(page, 'q', 'False')
  await page.getByText('Step-by-step evaluation').click()

  const steps = page.getByRole('listitem')

  await expect(steps).toHaveCount(2)
  await expect(steps.nth(0)).toContainText('(¬p)')
  await expect(steps.nth(0)).toContainText('¬F')
  await expect(steps.nth(1)).toContainText('T ∨ F')
})

test('clears the values', async ({ page }) => {
  await interpret(page, '(p → q)')
  await assign(page, 'p', 'True')
  await page.getByRole('button', { name: 'Clear the values' }).click()

  await expect(page.getByText('Choose a value for every variable (2 left)')).toBeVisible()
})

test('returns to editing the formula', async ({ page }) => {
  await interpret(page, '(p → q)')
  await page.getByRole('button', { name: 'Edit formula' }).click()

  await expect(page.getByRole('textbox', { name: 'Formula', exact: true })).toHaveValue('(p → q)')
})
