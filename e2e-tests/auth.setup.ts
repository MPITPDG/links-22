import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Logs in once and saves the session for every other spec.
 *
 * Credentials come from LINKS_USER / LINKS_PASS in the environment. They are
 * never written to this repo, never printed, and never passed on a command
 * line where they would land in shell history - export them in your shell, or
 * use a .env your tooling loads.
 */
const STATE = path.join('.playwright', 'state.json');

setup('authenticate', async ({ page }) => {
  const user = process.env.LINKS_USER;
  const pass = process.env.LINKS_PASS;

  if (!user || !pass) {
    throw new Error(
      'Set LINKS_USER and LINKS_PASS before running the e2e suite.\n' +
      '  PowerShell:  $env:LINKS_USER="..."; $env:LINKS_PASS="..."; npm run e2e\n' +
      '  bash:        LINKS_USER=... LINKS_PASS=... npm run e2e',
    );
  }

  await page.goto('/#/login');

  // The login form has no stable test ids yet, so target by input type.
  const username = page.locator('input[type="text"], input[name*="user" i]').first();
  const password = page.locator('input[type="password"]').first();

  await username.fill(user);
  await password.fill(pass);
  await page.getByRole('button', { name: /login/i }).click();

  // Landing page after login is the branch picker, or further along if the
  // account only has one of something.
  await expect(page).toHaveURL(/#\/(module|dashboard|branch|company)/, { timeout: 30_000 });

  // The session is NOT usable straight after login: CITYCODE is written only by
  // the branch screen, and CMPTYPE/MODULEID by the company and module screens.
  // Saving state at the branch screen gives a session whose CITYCODE is null,
  // and every request that sends citycode then fails. Walk the same screens a
  // real user walks. Each auto-forwards when there is only one choice, so each
  // step is conditional rather than assumed.
  for (let step = 0; step < 3 && !/#\/(dashboard|export|import|accounts)/.test(page.url()); step++) {
    if (/#\/branch/.test(page.url())) {
      await page.locator('.card-body button').first().click();
    } else if (/#\/company/.test(page.url())) {
      await page.locator('.card-body button, button').first().click();
    } else if (/#\/module/.test(page.url())) {
      await page.locator('.selectormodule li label').first().click();
    } else {
      break;
    }
    await page.waitForTimeout(1500);
  }

  await expect(page, 'login did not reach a module page - the branch/company/module ' +
    'pickers did not complete, so the saved session would have no CITYCODE')
    .toHaveURL(/#\/(dashboard|export|import|accounts)/, { timeout: 30_000 });

  fs.mkdirSync('.playwright', { recursive: true });
  await page.context().storageState({ path: STATE });
});
