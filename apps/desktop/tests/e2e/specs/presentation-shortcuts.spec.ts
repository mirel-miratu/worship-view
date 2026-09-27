import { test as base, expect } from '../fixtures/electron-fixture';
import { selectVerseFromPalette } from '../helpers/song-helpers';

const test = base.extend({
  mainWindow: async ({ mainWindow }, use) => {
    await mainWindow.evaluate(() => localStorage.setItem('test-seed-presentations', 'true'));
    await mainWindow.reload();
    await mainWindow.getByRole('tab', { name: 'Prezentări' }).waitFor();
    await use(mainWindow);
  },
});

test('Escape hides the presentation and Enter restores the selected slide', async ({ mainWindow, audienceWindow }) => {
  await mainWindow.getByRole('tab', { name: 'Prezentări' }).click();
  await mainWindow.getByRole('button', { name: 'Presentation Shortcuts' }).click();
  await mainWindow.getByRole('button', { name: 'Slide 2 2', exact: true }).click();
  await expect(audienceWindow.getByText('2/2', { exact: true })).toBeVisible();
  await expect(audienceWindow.locator('img')).toBeVisible();

  // Keep focus on the presentation list button: Enter must not activate it
  // and reset the selected slide to the beginning.
  await mainWindow.getByRole('button', { name: 'Presentation Shortcuts' }).focus();
  for (let cycle = 0; cycle < 2; cycle++) {
    await mainWindow.keyboard.press('Escape');
    await expect(audienceWindow.locator('img')).toHaveCount(0);
    await expect(audienceWindow.getByText('2/2', { exact: true })).toHaveCount(0);
    await expect(mainWindow.getByRole('button', { name: 'Slide 2 2', exact: true })).toBeVisible();

    await mainWindow.keyboard.press('Enter');
    await expect(audienceWindow.locator('img')).toBeVisible();
    await expect(audienceWindow.getByText('2/2', { exact: true })).toBeVisible();
  }

  await mainWindow.keyboard.press('Escape');
  await mainWindow.keyboard.press('ArrowLeft');
  await expect(audienceWindow.locator('img')).toHaveCount(0);
  await mainWindow.keyboard.press('Enter');
  await expect(audienceWindow.getByText('1/2', { exact: true })).toBeVisible();

  await mainWindow.keyboard.press('Escape');
  await mainWindow.getByRole('button', { name: 'Another Presentation' }).click();
  await expect(audienceWindow.locator('img')).toBeVisible();
  await expect(audienceWindow.getByText('1/2', { exact: true })).toBeVisible();
});

test('presentation shortcuts respect editing, dialogs and the command palette', async ({ mainWindow, audienceWindow }) => {
  await mainWindow.getByRole('tab', { name: 'Prezentări' }).click();
  const presentation = mainWindow.getByRole('button', { name: 'Presentation Shortcuts' });
  await presentation.click();
  await expect(audienceWindow.locator('img')).toBeVisible();

  await presentation.getByRole('button', { name: 'Redenumeste' }).click();
  await mainWindow.getByRole('textbox').press('Escape');
  await expect(audienceWindow.locator('img')).toBeVisible();

  await mainWindow.getByRole('button', { name: 'Sterge slide 1', exact: true }).click();
  await expect(mainWindow.getByRole('dialog')).toBeVisible();
  await mainWindow.keyboard.press('Escape');
  await expect(mainWindow.getByRole('dialog')).toHaveCount(0);
  await expect(audienceWindow.locator('img')).toBeVisible();

  await mainWindow.keyboard.press('F2');
  await expect(mainWindow.locator('[cmdk-input]')).toBeVisible();
  await mainWindow.keyboard.press('Escape');
  await expect(mainWindow.locator('[cmdk-input]')).toHaveCount(0);
  await expect(audienceWindow.locator('img')).toBeVisible();

  await presentation.focus();
  await mainWindow.keyboard.press('Escape');
  await expect(audienceWindow.locator('img')).toHaveCount(0);
  await presentation.getByRole('button', { name: 'Redenumeste' }).click();
  await mainWindow.getByRole('textbox').press('Enter');
  await expect(audienceWindow.locator('img')).toHaveCount(0);
});

test('Enter restores a hidden presentation after projecting a Bible verse', async ({ mainWindow, audienceWindow }) => {
  await mainWindow.getByRole('tab', { name: 'Prezentări' }).click();
  await mainWindow.getByRole('button', { name: 'Presentation Shortcuts' }).click();
  await mainWindow.getByRole('button', { name: 'Slide 2 2', exact: true }).click();
  await mainWindow.keyboard.press('Escape');

  await selectVerseFromPalette(mainWindow, 'ioan 3 16', 'IOAN 3:16');
  await mainWindow.evaluate(() => (document.activeElement as HTMLElement)?.blur());
  await mainWindow.keyboard.press('Enter');
  await expect(audienceWindow.locator('body')).toContainText('Dumnezeu');

  await mainWindow.getByRole('tab', { name: 'Prezentări' }).click();
  await mainWindow.keyboard.press('Enter');
  await expect(audienceWindow.locator('img')).toBeVisible();
  await expect(audienceWindow.getByText('2/2', { exact: true })).toBeVisible();
  await expect(audienceWindow.locator('body')).not.toContainText('Dumnezeu');
});
