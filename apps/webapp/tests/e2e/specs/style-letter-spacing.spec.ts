import { test, expect } from '../fixtures/browser-fixture';

test('letter spacing is editable and applied in the text style preview', async ({ appPage }) => {
  await appPage.locator('[data-testid="settings-button"]').click();
  await appPage.locator('[role="tab"]').filter({ hasText: 'Stiluri text' }).click();

  const input = appPage.locator('#style-letter-spacing');
  await expect(input).toHaveValue('0');
  const previewLine = appPage.getByText('Binecuvântat este Domnul').first();
  const ratio = () =>
    previewLine.evaluate((el) => {
      const css = getComputedStyle(el.parentElement ?? el);
      const spacing = css.letterSpacing === 'normal' ? 0 : parseFloat(css.letterSpacing);
      return Math.round((spacing / parseFloat(css.fontSize)) * 100) / 100;
    });
  expect(await ratio()).toBe(0);

  await input.fill('0.15');
  await expect.poll(ratio).toBe(0.15);

  // Out-of-range values are clamped
  await input.fill('3');
  await expect(input).toHaveValue('0.5');

  await appPage.getByRole('button', { name: 'Salvează' }).click();
  await expect(appPage.getByRole('button', { name: 'Salvează' })).toBeHidden();
  await appPage.keyboard.press('Escape');
  await appPage.locator('[data-testid="settings-button"]').click();
  await appPage.locator('[role="tab"]').filter({ hasText: 'Stiluri text' }).click();
  await expect(appPage.locator('#style-letter-spacing')).toHaveValue('0.5');
});
