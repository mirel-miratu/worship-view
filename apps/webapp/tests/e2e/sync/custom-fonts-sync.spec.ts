import * as fs from 'fs';
import * as path from 'path';
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { closeDevices, logIn, newDevice, signUp } from '../helpers/sync-helpers';
import { isFontRegistered, rendersWithMonospaceFont } from '../helpers/font-helpers';

const FONT_FILE = path.resolve(process.cwd(), '../../assets/fonts/iosevka/iosevka-fixed-regular.woff2');
const FAMILY = 'Biserica Mono';

async function openSettingsTab(page: Page, tab: string) {
  if (!(await page.locator('[role="dialog"]').isVisible())) {
    await page.locator('[data-testid="settings-button"]').click();
  }
  await page.locator('[role="tab"]').filter({ hasText: tab }).first().click();
}

test.describe('Custom fonts sync between devices', () => {
  test.setTimeout(120000);

  test('a font uploaded on one device is available, used and removed on the other', async ({ browser }) => {
    const a = await newDevice(browser);
    const passphrase = await signUp(a);
    const b = await newDevice(browser);
    await logIn(b, passphrase);

    // Upload on device A and use it in the active text style
    await openSettingsTab(a, 'Fonturi');
    await a.locator('#font-file-input').setInputFiles({
      name: 'Biserica-Mono.woff2',
      mimeType: 'font/woff2',
      buffer: fs.readFileSync(FONT_FILE),
    });
    await expect(a.locator('[data-testid="custom-font-item"]')).toContainText(FAMILY, { timeout: 15000 });
    await openSettingsTab(a, 'Stiluri text');
    await a.locator('#style-font').click();
    await a.getByRole('option', { name: FAMILY }).click();
    await a.getByRole('button', { name: 'Salvează' }).click();
    await expect(a.getByRole('button', { name: 'Salvează' })).toBeHidden();

    // Device B gets the file from sync, registers it and really renders with it
    await expect.poll(() => isFontRegistered(b, FAMILY), { timeout: 20000 }).toBe(true);
    expect(await rendersWithMonospaceFont(b, FAMILY)).toBe(true);
    await openSettingsTab(b, 'Fonturi');
    await expect(b.locator('[data-testid="custom-font-item"]')).toContainText('Biserica-Mono.woff2');
    await openSettingsTab(b, 'Stiluri text');
    await expect(b.locator('#style-font')).toContainText(FAMILY);

    // Also after a cold start of device B (loaded from sync, not memory)
    await b.reload();
    await b.waitForSelector('[role="tab"]', { timeout: 30000 });
    await expect.poll(() => isFontRegistered(b, FAMILY), { timeout: 20000 }).toBe(true);

    // Delete on device A: B unregisters it and its style falls back to Montserrat
    await openSettingsTab(a, 'Fonturi');
    await a.getByRole('button', { name: `Șterge fontul ${FAMILY}` }).click();
    await a.getByRole('dialog').filter({ hasText: 'vor reveni la Montserrat' })
      .getByRole('button', { name: 'Șterge', exact: true }).click();
    await expect(a.locator('[data-testid="custom-font-item"]')).toHaveCount(0);

    await expect.poll(() => isFontRegistered(b, FAMILY), { timeout: 20000 }).toBe(false);
    await openSettingsTab(b, 'Stiluri text');
    await expect(b.locator('#style-font')).toContainText('Montserrat', { timeout: 15000 });
    await closeDevices(a, b);
  });
});
