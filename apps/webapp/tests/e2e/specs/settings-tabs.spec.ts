import { test, expect } from '../fixtures/browser-fixture';
import { importFiles } from '../helpers/import-helpers';

async function openSettings(page: import('@playwright/test').Page) {
  await page.locator('[data-testid="settings-button"]').click();
  await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
}

test.describe('Settings Tab Content', () => {
  test('cantece tab renders content', async ({ appPage }) => {
    await openSettings(appPage);
    await appPage.getByRole('tab', { name: 'Cântece', exact: true }).click();

    await expect(appPage.locator('input[placeholder="Caută cântece..."]')).toBeVisible();
    await expect(appPage.getByText('Previzualizare', { exact: true })).toBeVisible();
    await expect(appPage.getByText('Nu există cântece în bibliotecă.', { exact: true })).toBeVisible();
  });

  test('cantece tab list scrolls when the library is long', async ({ appPage }) => {
    const count = 60;
    await importFiles(
      appPage,
      Array.from({ length: count }, (_, i) => ({
        name: `scroll-${i + 1}.xml`,
        content: `<?xml version="1.0" encoding="UTF-8"?>
<song>
  <title>Scroll Song ${String(i + 1).padStart(2, '0')}</title>
  <presentation>V1</presentation>
  <lyrics>
[V1]
 Line ${i + 1}
</lyrics>
</song>`,
      })),
    );

    await openSettings(appPage);
    await appPage.getByRole('tab', { name: 'Cântece', exact: true }).click();
    await expect(appPage.getByText('Scroll Song 01', { exact: true })).toBeVisible({ timeout: 10000 });

    const list = appPage.locator('[role="dialog"] div.overflow-y-auto.border.rounded-lg').first();
    const { clientHeight, scrollHeight } = await list.evaluate((el) => ({
      clientHeight: el.clientHeight,
      scrollHeight: el.scrollHeight,
    }));
    expect(scrollHeight).toBeGreaterThan(clientHeight);

    await list.hover();
    await appPage.mouse.wheel(0, 3000);
    await expect.poll(() => list.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
    await expect(appPage.getByText(`Scroll Song ${count}`, { exact: true })).toBeInViewport();
  });
});
