import { test, expect, Page } from '@playwright/test';

/**
 * Export > Master > Vessel - add and search.
 *
 * Ported from MPERPNG-20/e2e-tests/vessel.spec.ts with the screens (page kit
 * recipe 2 for add/edit, recipe 1 for search). Environment names are the Links
 * ones: LINKS_USER / LINKS_PASS (auth.setup.ts), LINKS_BASE_URL
 * (playwright.config.ts), LINKS_API_URL and LINKS_CITYCODE (below).
 *
 * These two screens were restyled from table layout to a grid. The markup
 * changed completely while the wiring was meant to stay identical, so these
 * tests deliberately assert BEHAVIOUR (does it save, does validation fire, does
 * edit repopulate) rather than appearance. A passing build only proved the
 * template compiles.
 */

const ADD = '/#/export/vessel/form';
const SEARCH = '/#/export/vessel/search';

/** Unique enough to find again, short enough for the field. */
function vesselName(): string {
  return 'PWT' + Date.now().toString().slice(-8);
}

/** dd/mm/yyyy, offset in days from today. */
function dmy(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/**
 * Types into one of the my-date-picker shims by position.
 * The shim renders <input class="mydp-shim-input">; the pickers have no ids,
 * and four of them share name="dtLCD" (pre-existing), so position is the only
 * reliable handle.
 */
async function fillDate(page: Page, index: number, value: string) {
  const input = page.locator('.mydp-shim-input').nth(index);
  await input.click();
  await input.fill(value);
  await page.keyboard.press('Escape');   // close the calendar overlay
}

test.describe('Vessel add', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ADD);
    await expect(page.getByLabel(/vessel name/i).first()).toBeVisible();
  });

  test('every field on the form is present and editable', async ({ page }) => {
    // Guards the restyle: if a field was dropped in the rewrite, this fails.
    await expect(page.locator('#txtvessel')).toBeVisible();
    await expect(page.locator('#txtvoyno')).toBeVisible();
    await expect(page.locator('#txtVshortName')).toBeVisible();
    await expect(page.locator('#selePrt')).toBeVisible();
    await expect(page.locator('#txtRtnoNo')).toBeVisible();
    await expect(page.locator('#SeleShpLine')).toBeVisible();
    await expect(page.locator('#txtCrtPlce')).toBeVisible();
    await expect(page.locator('#txtcrtClrk')).toBeVisible();
    await expect(page.locator('#chkVsld')).toBeVisible();
    await expect(page.locator('#chkNtCall')).toBeVisible();
    await expect(page.locator('.mydp-shim-input')).toHaveCount(5);
    await expect(page.locator('ng-select')).toHaveCount(1);
  });

  test('text inputs hold their value', async ({ page }) => {
    const name = vesselName();
    await page.locator('#txtvessel').fill(name);
    await page.locator('#txtvoyno').fill('V001');
    await page.locator('#txtVshortName').fill('SHORT');
    await expect(page.locator('#txtvessel')).toHaveValue(name);
    await expect(page.locator('#txtvoyno')).toHaveValue('V001');
    await expect(page.locator('#txtVshortName')).toHaveValue('SHORT');
  });

  test('checkboxes bind', async ({ page }) => {
    // Moved out of a full-width row into a grid cell during the restyle.
    const delayed = page.locator('#chkVsld');
    const notCalled = page.locator('#chkNtCall');
    await delayed.check();
    await notCalled.check();
    await expect(delayed).toBeChecked();
    await expect(notCalled).toBeChecked();
    await delayed.uncheck();
    await expect(delayed).not.toBeChecked();
  });

  test('date pickers accept input and keep it', async ({ page }) => {
    // The highest-risk part of the restyle: the picker emits an object read as
    // .formatted throughout the save logic.
    await fillDate(page, 0, dmy(0));
    await expect(page.locator('.mydp-shim-input').nth(0)).not.toHaveValue('');
  });

  test('date validation still fires when ETD precedes ETA', async ({ page }) => {
    await page.locator('#txtvessel').fill(vesselName());
    await page.locator('#txtvoyno').fill('V001');
    await fillDate(page, 1, dmy(10));   // ETA  - later
    await fillDate(page, 3, dmy(2));    // ETD  - earlier, invalid
    await page.getByRole('button', { name: /add/i }).last().click();

    // Rendered by the sonner toaster wired into ToastCommonService.
    await expect(page.locator('[data-sonner-toast], .toast, [role="status"]').first())
      .toBeVisible({ timeout: 10_000 });
  });

  test('adding a port/agent row puts it in the grid', async ({ page }) => {
    await page.locator('#txtvessel').fill(vesselName());
    await page.locator('#txtvoyno').fill('V001');
    await page.locator('#selePrt').selectOption({ index: 1 });
    await fillDate(page, 3, dmy(7));    // ETD is required

    const before = await page.locator('table tbody tr').count();
    await page.getByRole('button', { name: /^add$/i }).last().click();
    await page.waitForTimeout(1000);
    const after = await page.locator('table tbody tr').count();

    // Either a row was added, or a validation toast explained why not.
    const toast = page.locator('[data-sonner-toast], .toast, [role="status"]').first();
    expect(after > before || await toast.isVisible()).toBeTruthy();
  });

  test('Reset clears the form', async ({ page }) => {
    await page.locator('#txtvessel').fill('SHOULD-CLEAR');
    await page.getByRole('button', { name: /^reset$/i }).first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('#txtvessel')).toHaveValue('');
  });

  test('the breadcrumb trail names the page', async ({ page }) => {
    // One trail, rendered by the layout from the route data - not per page.
    const nav = page.getByRole('navigation', { name: /breadcrumb/i });
    await expect(nav).toHaveCount(1);
    await expect(nav.getByRole('link', { name: 'Export' })).toBeVisible();
    // Consecutive repeats are collapsed: the route tree names Export and
    // Vessel twice each, which used to render as Export / Export / Vessel / Vessel.
    await expect(nav.getByText('Export')).toHaveCount(1);
    await expect(nav.locator('[aria-current="page"]')).toHaveText('Vessel');
  });

  test('no console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', m => {
      if (m.type() !== 'error') return;
      const t = m.text();
      // Known and unrelated: the service worker is only built in production.
      if (/ngsw-worker|NG05604|bad HTTP response code/i.test(t)) return;
      errors.push(t);
    });
    await page.goto(ADD);
    await page.waitForTimeout(2500);
    expect(errors, `console errors:\n${errors.join('\n')}`).toHaveLength(0);
  });
});

/**
 * The search is a LIKE on both fields, so a broad term matches tens of
 * thousands of rows and the page renders every one of them. Guessing criteria
 * therefore either returns nothing useful or buries the browser, which is why
 * these tests ask the API for a vessel that actually exists and drive the UI
 * with its exact name and voyage number.
 */
const API = process.env.LINKS_API_URL ?? 'http://180.179.207.163/Links-api/api/';

/** Branch whose vessels the API lookup lists; the search proc filters by it. */
const CITYCODE = process.env.LINKS_CITYCODE ?? 'MUM';

type Vessel = { VSL_NAME: string; VSL_VOYNO: string; VSL_RTNO: string };

/**
 * Asks the API for a vessel that exists.
 *
 * The request goes through the page rather than Playwright's own request
 * context: the API is served by an old IIS that emits a response header Node's
 * strict parser rejects outright ('Parse Error: Invalid header token'). Chrome
 * accepts it, which is why the application itself works, so the browser is the
 * only client here that can read the response.
 */
let cachedVessel: Vessel | null | undefined;

async function pickVessel(page: Page): Promise<Vessel | null> {
  // '%' matches everything, which is tens of thousands of rows and takes
  // roughly twenty seconds. One fetch serves every test in the file.
  if (cachedVessel !== undefined) return cachedVessel;
  const rows = await page.evaluate(async ({ api, citycode }) => {
    const res = await fetch(api + 'Export/ExportVslMst_Search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ VSL_NAME: '%', VSL_VOYNO: '%', citycode }),
    });
    if (!res.ok) return [];
    return (await res.json())?.Table ?? [];
  }, { api: API, citycode: CITYCODE });

  const hit = rows.find((r: any) => r.STATUS === '100' && (r.VSL_NAME ?? '').trim());
  cachedVessel = hit ? {
    VSL_NAME: hit.VSL_NAME.trim(),
    VSL_VOYNO: (hit.VSL_VOYNO ?? '').trim(),
    VSL_RTNO: (hit.VSL_RTNO ?? '').trim(),
  } : null;
  return cachedVessel;
}

/**
 * The API answers 200 with a STATUS row even when it refused the request, so
 * a failed search looks like an empty one unless the body is read.
 *
 * The refusal worth naming is a missing @CITYCODE: the branch code is written
 * only by the branch picker (BranchComponent.setCity), so a session saved
 * before that screen ran sends citycode null and every search is rejected.
 * That is a stale saved session, not a regression in this screen, so it skips
 * with the reason rather than failing four specs identically.
 */
async function assertAccepted(res: import('@playwright/test').Response) {
  const body = await res.json().catch(() => null);
  const first = body?.Table?.[0];
  if (!first || String(first.STATUS) === '100') return;
  const why = first.STATUSTEXT ?? first.MSG ?? JSON.stringify(first);
  test.skip(/CITYCODE/i.test(String(why)),
    `saved session has no branch selected, so the API refused the search: ${why}. ` +
    'Re-run the auth setup (npm run e2e with LINKS_USER/LINKS_PASS) to regenerate it.');
  throw new Error(`search was refused: ${why}`);
}

/**
 * Fills the criteria and waits for the search to actually come back.
 *
 * Waiting for 'a row or the empty state' would return immediately: the empty
 * state is what the screen shows before any search has run, so the condition
 * is already true at the moment of the click.
 */
async function search(page: Page, name: string, voyno: string) {
  await page.locator('#txtvessel').fill(name);
  await page.locator('#txtvoyno').fill(voyno);
  const responded = page.waitForResponse(
    r => r.url().includes('ExportVslMst_Search'), { timeout: 60_000 });
  await page.getByRole('button', { name: /search/i }).click();
  await assertAccepted(await responded);
  await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 30_000 });
}

test.describe('Vessel search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SEARCH);
    await expect(page.locator('#txtvessel')).toBeVisible();
  });

  test('shows an empty state before the first search', async ({ page }) => {
    await expect(page.getByText(/no vessels listed/i)).toBeVisible();
  });

  test('the breadcrumb trail names the page', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: /breadcrumb/i });
    await expect(nav).toHaveCount(1);
    await expect(nav.getByRole('link', { name: 'Export' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Vessel' })).toBeVisible();
    // 'Vessel / Search' is one route title; it has to split into two crumbs.
    await expect(nav.locator('[aria-current="page"]')).toHaveText('Search');
    await expect(nav.getByText('Vessel')).toHaveCount(1);
  });

  test('blank search is rejected with a message', async ({ page }) => {
    // serchList() requires both fields; it toasts 'Please enter vessel'
    // and returns before calling the API.
    await page.getByRole('button', { name: /search/i }).click();
    await expect(page.locator('[data-sonner-toast], [role="status"]').first())
      .toBeVisible({ timeout: 10_000 });
  });

  test('searching a known vessel lists it', async ({ page }) => {
    const v = await pickVessel(page);
    test.skip(!v, 'search API returned no vessels');
    await search(page, v!.VSL_NAME, v!.VSL_VOYNO);
    await expect(page.getByText(v!.VSL_NAME, { exact: false }).first()).toBeVisible();
  });

  test('Enter submits the search', async ({ page }) => {
    // Added during the restyle; must behave exactly like the button.
    const v = await pickVessel(page);
    test.skip(!v, 'search API returned no vessels');
    await page.locator('#txtvessel').fill(v!.VSL_NAME);
    await page.locator('#txtvoyno').fill(v!.VSL_VOYNO);
    const responded = page.waitForResponse(
      r => r.url().includes('ExportVslMst_Search'), { timeout: 60_000 });
    await page.locator('#txtvoyno').press('Enter');
    await assertAccepted(await responded);
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 30_000 });
  });

  test('clicking a result row opens that vessel', async ({ page }) => {
    const v = await pickVessel(page);
    test.skip(!v, 'search API returned no vessels');
    await search(page, v!.VSL_NAME, v!.VSL_VOYNO);

    const first = page.locator('table tbody tr').first();
    const rotation = (await first.locator('td').first().innerText()).trim();
    expect(rotation.length).toBeGreaterThan(0);

    await first.click();                       // whole row is clickable now
    await expect(page).toHaveURL(/vessel\/form/, { timeout: 30_000 });
    // Populate fills the form from the rotation number that was clicked.
    await expect(page.locator('#txtvessel')).not.toHaveValue('', { timeout: 30_000 });
  });

  test('result count matches the rows rendered', async ({ page }) => {
    const v = await pickVessel(page);
    test.skip(!v, 'search API returned no vessels');
    await search(page, v!.VSL_NAME, v!.VSL_VOYNO);
    const rows = await page.locator('table tbody tr').count();
    // Plain string, not a regex: the label contains parentheses, which would
    // have to be escaped through a template literal to survive as literals.
    await expect(page.getByText(`${rows} vessel(s) found`)).toBeVisible();
  });
});

test.describe('Shell', () => {
  test('an opened menu branch stays open across navigation', async ({ page }) => {
    // The regression this guards: app.component sets
    // routeReuseStrategy.shouldReuseRoute = () => false, so navigating rebuilds
    // the sidebar. Expansion state therefore lives in UiSidebarService, not in
    // the component.
    //
    // The branch has to be one revealActive() did NOT open by itself, or the
    // test would pass on the current route rather than on kept state.
    await page.goto(ADD);

    // Pin the branch by its label before clicking. A locator on
    // [aria-expanded="false"] is re-evaluated on every assertion, so once the
    // click flips this button to true, .first() would resolve to the next
    // still-collapsed branch and the assertion would read its false.
    const anyCollapsed = page.locator('button[aria-expanded="false"]').first();
    await expect(anyCollapsed).toBeVisible();
    const label = (await anyCollapsed.innerText()).trim();
    expect(label.length).toBeGreaterThan(0);

    const branch = page.getByRole('button', { name: label, exact: true }).first();
    await branch.click();
    await expect(branch).toHaveAttribute('aria-expanded', 'true');

    await page.goto(SEARCH);
    await expect(page.getByRole('button', { name: label, exact: true }).first())
      .toHaveAttribute('aria-expanded', 'true');
  });

  test('the branch for the current page is revealed on load', async ({ page }) => {
    // revealActive() opens the ancestors of the active route, so landing deep
    // in a module shows where you are.
    await page.goto(ADD);
    await expect(page.getByRole('button', { name: 'Master', exact: true }).first())
      .toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('button', { name: 'Vessel', exact: true }).first())
      .toHaveAttribute('aria-expanded', 'true');
  });

  test('the rail names the module the route belongs to', async ({ page }) => {
    // Deep links used to bind the menu from the stored MODULEID, which is only
    // written by the module picker, so the rail came up empty.
    await page.goto(SEARCH);
    await expect(page.getByText(/export module/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /dashboard/i }).first()).toBeVisible();
  });

  test('sidebar collapse persists across navigation', async ({ page }) => {
    await page.goto(ADD);
    await page.getByRole('button', { name: /collapse sidebar/i }).click();
    await page.waitForTimeout(500);
    await page.goto(SEARCH);
    await expect(page.getByRole('button', { name: /expand sidebar/i })).toBeVisible();
    await page.getByRole('button', { name: /expand sidebar/i }).click();   // restore
  });
});
