import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('replaces aliases with canonical symbols while typing', async ({ page }) => {
  const field = page.getByRole('textbox', { name: 'Formula', exact: true })
  await field.fill('(p -> q)')

  await expect(field).toHaveValue('(p → q)')
})

test('renders the tree of a complete formula', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Formula', exact: true }).fill('((!p) | q)')

  await expect(page.getByRole('img', { name: 'double node ∨' })).toBeVisible()
  await expect(page.getByRole('img', { name: 'single node ¬' })).toBeVisible()
  await expect(page.getByRole('img', { name: 'variable p' })).toBeVisible()
  await expect(page.getByRole('img', { name: 'variable q' })).toBeVisible()
  await expect(page.getByText('The formula is complete')).toBeVisible()
})

test('accepts a variable that starts with an uppercase letter', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Formula', exact: true }).fill('(P1 ∧ p1)')

  await expect(page.getByRole('img', { name: 'variable P1', exact: true })).toBeVisible()
  await expect(page.getByRole('img', { name: 'variable p1', exact: true })).toBeVisible()
})

test('shows both possible shapes while the arity of a group is undecided', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Formula', exact: true }).fill('(')

  await expect(page.getByText('Variant 1')).toBeVisible()
  await expect(page.getByText('Variant 2')).toBeVisible()
  await expect(page.getByRole('img', { name: 'empty slot' }).first()).toBeVisible()
})

test('reports an error with its diagnostic code', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Formula', exact: true }).fill('p q')

  await expect(page.getByText('Unexpected input after the end of the formula')).toBeVisible()
})

test('replays the build one step at a time', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Formula', exact: true }).fill('(p ∧ q)')

  const slider = page.getByRole('slider', { name: 'Build step' })
  await expect(slider).toHaveValue('5')

  await slider.fill('1')

  await expect(page.getByText('Variant 2')).toBeVisible()
  await expect(page.getByRole('img', { name: 'double node ∧' })).toBeHidden()
})

test('clears the formula with the escape key', async ({ page }) => {
  const field = page.getByRole('textbox', { name: 'Formula', exact: true })
  await field.fill('(p ∧ q)')
  await field.press('Escape')

  await expect(field).toHaveValue('')
})
