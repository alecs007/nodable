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

  await expect(page.getByText('Choose a value for every variable (2 left)')).toBeAttached()

  await assign(page, 'p', 'True')

  await expect(page.getByText('Choose a value for every variable (1 left)')).toBeAttached()
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
  await page.getByRole('button', { name: 'Step-by-step evaluation' }).click()

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

test('classifies a complete formula', async ({ page }) => {
  const field = page.getByRole('textbox', { name: 'Formula', exact: true })

  await field.fill('((P → Q) ∨ (Q → P))')
  await expect(page.getByText('Satisfiable, valid')).toBeVisible()

  await field.fill('(((P ∨ Q) ∧ (¬P)) ∧ (¬Q))')
  await expect(page.getByText('Unsatisfiable, not valid')).toBeVisible()

  await field.fill('(P → (Q ∧ R))')
  await expect(page.getByText('Satisfiable, not valid')).toBeVisible()
})

test('loads a counter-model into the interpretation', async ({ page }) => {
  await interpret(page, '(P → (Q ∧ R))')

  await page.getByRole('button', { name: 'Classification' }).click()

  await expect(page.getByText(/True under 5 of 8 interpretations/)).toBeVisible()

  await page.getByRole('button', { name: /Counter-model/ }).click()

  await expect(page.getByText('The formula is false under this interpretation')).toBeVisible()
  await expect(
    page.getByRole('radiogroup', { name: 'R' }).getByRole('radio', { name: 'False' }),
  ).toBeChecked()
})

test('shows the truth table and loads a row of it', async ({ page }) => {
  await interpret(page, '((¬p) ∨ q)')
  await page.getByRole('button', { name: 'Truth table' }).click()

  const dialog = page.getByRole('dialog', { name: 'Truth table' })

  await expect(dialog.getByRole('columnheader')).toHaveText(['#', 'p', 'q', '(¬p)', '((¬p) ∨ q)'])
  await expect(dialog.getByRole('row').nth(2)).toHaveText(/2\s*T\s*F\s*F\s*F/)

  await dialog.getByRole('button', { name: '2', exact: true }).click()

  await expect(dialog).toHaveCount(0)
  await expect(
    page.getByRole('radiogroup', { name: 'q' }).getByRole('radio', { name: 'False' }),
  ).toBeChecked()
  await expect(page.getByText('The formula is false under this interpretation')).toBeAttached()
})

test('exports the truth table', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Formula', exact: true }).fill('(p → q)')
  await page.getByRole('textbox', { name: 'Formula name' }).fill('Lecture 4')
  await page.getByRole('button', { name: 'Transfer' }).click()

  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: /CSV table/ }).click()

  expect((await download).suggestedFilename()).toBe('lecture-4-table.csv')
})
