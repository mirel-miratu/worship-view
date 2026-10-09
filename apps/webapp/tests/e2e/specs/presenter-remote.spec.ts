import { test, expect } from '../fixtures/browser-fixture';
import { addSong, selectSongFromPalette } from '../helpers/song-helpers';

// Logitech R400 keys: PageDown / PageUp, F5 / Esc, "." or "b"

test.describe('Presenter remote (Logitech R400)', () => {
  test('PageDown / PageUp move between song slides', async ({ appPage }) => {
    await addSong(appPage, 'Remote Web Song', 'Verse\nFirst slide line\n---\nChorus\nSecond slide line\n---\nVerse Chorus');
    await selectSongFromPalette(appPage, 'remote web song', 'Remote Web Song');
    const slides = appPage.locator('[data-testid="song-slide-item"]').filter({ hasText: /\S+/ });
    await slides.first().click();
    await expect(slides.first()).toHaveAttribute('data-selected', 'true');
    await appPage.evaluate(() => (document.activeElement as HTMLElement | null)?.blur?.());

    await appPage.keyboard.press('PageDown');
    await expect(slides.nth(1)).toHaveAttribute('data-selected', 'true');
    await appPage.keyboard.press('PageUp');
    await expect(slides.first()).toHaveAttribute('data-selected', 'true');
  });

  test('F5 from the remote does not reload the web app', async ({ appPage }) => {
    await appPage.evaluate(() => ((window as unknown as { __noReload: boolean }).__noReload = true));
    await appPage.keyboard.press('F5');
    await appPage.keyboard.press('Shift+F5');
    await appPage.waitForTimeout(500);
    expect(await appPage.evaluate(() => (window as unknown as { __noReload?: boolean }).__noReload)).toBe(true);
  });

  test('settings show which keys the remote sends', async ({ appPage }) => {
    await appPage.locator('[data-testid="settings-button"]').click();
    await appPage.locator('[role="tab"]').filter({ hasText: 'Telecomandă' }).click();
    await expect(appPage.getByText('Nicio tastă apăsată încă.')).toBeVisible();

    await appPage.keyboard.press('PageUp');
    await appPage.keyboard.press('x');
    const log = appPage.getByTestId('remote-key-log');
    await expect(log.locator('li').nth(0)).toContainText('Nicio acțiune');
    await expect(log.locator('li').nth(1)).toContainText('PageUp');
    await expect(log.locator('li').nth(1)).toContainText('Slide anterior');
  });
});
