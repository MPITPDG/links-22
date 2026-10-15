import { test, expect } from '@playwright/test';

/**
 * Export > Master > Vessel - behaviour smoke test.
 *
 * Asserts behaviour only (fields exist, inputs bind, reset clears), so it holds
 * for both the legacy screen and the redesigned one. When this screen is
 * redesigned, port the full suite from MPERPNG-20/e2e-tests/vessel.spec.ts.
 */

const ADD = '/#/export/vessel/form';
const SEARCH = '/#/export/vessel/search';

test.describe('Vessel add', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ADD);
    await expect(page.locator('#txtvessel')).toBeVisible();
  });

  test('every field on the form is present', async ({ page }) => {
    for (const id of ['txtvessel', 'txtvoyno', 'txtVshortName', 'selePrt', 'txtRtnoNo',
                      'SeleShpLine', 'txtCrtPlce', 'txtcrtClrk', 'chkVsld', 'chkNtCall']) {
      await expect(page.locator('#' + id), id).toBeVisible();
    }
    await expect(page.locator('.mydp-shim-input')).toHaveCount(5);
  });

  test('text inputs and checkboxes bind', async ({ page }) => {
    const name = 'PWT' + Date.now().toString().slice(-8);
    await page.locator('#txtvessel').fill(name);
    await page.locator('#txtvoyno').fill('V001');
    await expect(page.locator('#txtvessel')).toHaveValue(name);
    await expect(page.locator('#txtvoyno')).toHaveValue('V001');

    await page.locator('#chkVsld').check();
    await page.locator('#chkNtCall').check();
    await expect(page.locator('#chkVsld')).toBeChecked();
    await expect(page.locator('#chkNtCall')).toBeChecked();
  });

  test('reset clears the form', async ({ page }) => {
    await page.locator('#txtvessel').fill('SHOULD-CLEAR');
    await page.getByRole('button', { name: /reset/i }).last().click();
    await expect(page.locator('#txtvessel')).toHaveValue('');
  });
});

test.describe('Vessel search', () => {
  test('search screen loads its filters', async ({ page }) => {
    await page.goto(SEARCH);
    await expect(page.locator('#txtvessel')).toBeVisible();
  });
});
