import * as fs from 'fs';
import * as path from 'path';
import { test, expect } from '../fixtures/browser-fixture';
import type { Page } from '@playwright/test';

const FONT_FILE = path.resolve(process.cwd(), '../../assets/fonts/iosevka/iosevka-fixed-regular.woff2');
const FAMILY = 'Biserica Sans';

async function openSettingsTab(page: Page, tab: string) {
  await page.locator('[data-testid="settings-button"]').click();
  await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
  await page.locator('[role="tab"]').filter({ hasText: tab }).first().click();
}

async function uploadFont(page: Page, name = 'Biserica_Sans.woff2', buffer = fs.readFileSync(FONT_FILE)) {
  await openSettingsTab(page, 'Fonturi');
  await page.locator('#font-file-input').setInputFiles({ name, mimeType: 'font/woff2', buffer });
}

function fontLoaded(page: Page, family: string) {
  return () => page.evaluate((f) => document.fonts.check(`16px "${f}"`, 'A') &&
    Array.from(document.fonts).some((face) => face.family.replace(/"/g, '') === f), family);
}

async function chooseFontForActiveStyle(page: Page, family: string) {
  await page.locator('[role="tab"]').filter({ hasText: 'Stiluri text' }).click();
  await page.locator('#style-font').click();
  await page.getByRole('option', { name: family }).click();
  await expect(page.locator('#style-font')).toContainText(family);
  await page.getByRole('button', { name: 'Salvează' }).click();
  await expect(page.getByRole('button', { name: 'Salvează' })).toBeHidden();
}

test.describe('Custom Fonts', () => {
  test('uploaded font is listed and registered in the app', async ({ appPage: mainWindow }) => {
    await uploadFont(mainWindow);
    const item = mainWindow.locator('[data-testid="custom-font-item"]').filter({ hasText: FAMILY });
    await expect(item).toBeVisible({ timeout: 10000 });
    await expect(item).toContainText('Biserica_Sans.woff2');
    await expect.poll(fontLoaded(mainWindow, FAMILY), { timeout: 10000 }).toBe(true);
  });

  test('invalid font file is rejected', async ({ appPage: mainWindow }) => {
    await uploadFont(mainWindow, 'broken.ttf', Buffer.from('not a font'));
    await expect(mainWindow.getByText('Unele fonturi nu au fost încărcate')).toBeVisible({ timeout: 5000 });
    await expect(mainWindow.getByText('Fișierul nu este un font valid.', { exact: false })).toBeVisible();
    await expect(mainWindow.locator('[data-testid="custom-font-item"]')).toHaveCount(0);
  });

  test('deleting a font used by a style reverts the style to Montserrat', async ({ appPage: mainWindow }) => {
    await uploadFont(mainWindow);
    await expect(mainWindow.locator('[data-testid="custom-font-item"]')).toHaveCount(1, { timeout: 10000 });
    await chooseFontForActiveStyle(mainWindow, FAMILY);

    await mainWindow.locator('[role="tab"]').filter({ hasText: 'Fonturi' }).click();
    await mainWindow.getByRole('button', { name: `Șterge fontul ${FAMILY}` }).click();
    const confirm = mainWindow.getByRole('dialog').filter({ hasText: 'vor reveni la Montserrat' });
    await expect(confirm).toBeVisible();
    await confirm.getByRole('button', { name: 'Șterge', exact: true }).click();
    await expect(mainWindow.locator('[data-testid="custom-font-item"]')).toHaveCount(0);

    await mainWindow.locator('[role="tab"]').filter({ hasText: 'Stiluri text' }).click();
    await expect(mainWindow.locator('#style-font')).toContainText('Montserrat');
  });
});
