import { test, expect } from '../fixtures/electron-fixture';
import type { Page } from '@playwright/test';
import { addSong, selectSongFromPalette } from '../helpers/song-helpers';

const SONG = 'Mirror Song';
const CONTENT = 'Verse\nFirst slide line\n---\nChorus\nSecond slide line\n---\nVerse Chorus';

async function selectFirstSlide(page: Page) {
  await addSong(page, SONG, CONTENT);
  await selectSongFromPalette(page, 'mirror song', SONG);
  const slides = page.locator('[data-testid="song-slide-item"]').filter({ hasText: /\S+/ });
  await slides.first().click();
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur?.());
  return slides;
}

const overlay = (page: Page) => page.getByTestId('presentation-mode');

test.describe('Present on this screen (laptop mirrored to a TV)', () => {
  test('without a projector, F5 presents on this screen and Esc returns to the app', async ({ mainWindow }) => {
    const slides = await selectFirstSlide(mainWindow);

    await mainWindow.keyboard.press('F5');
    await expect(overlay(mainWindow)).toContainText(/first slide line/i);
    await mainWindow.keyboard.press('PageDown');
    await expect(overlay(mainWindow)).toContainText(/second slide line/i);

    await mainWindow.keyboard.press('Escape');
    await expect(overlay(mainWindow)).toHaveCount(0);
    // Leaving presentation mode does not clear the song
    await expect(slides.nth(1)).toHaveAttribute('data-selected', 'true');
  });

  test('the header button works too', async ({ mainWindow }) => {
    await selectFirstSlide(mainWindow);
    await mainWindow.getByRole('button', { name: 'Prezintă pe acest ecran' }).click();
    await expect(overlay(mainWindow)).toContainText(/first slide line/i);
    await mainWindow.keyboard.press('Escape');
    await expect(overlay(mainWindow)).toHaveCount(0);
  });

  test('with a projector configured, F5 keeps its usual meaning', async ({ mainWindow, audienceWindow }) => {
    await selectFirstSlide(mainWindow);
    await expect(audienceWindow.locator('body')).toContainText(/first slide line/i);

    await mainWindow.keyboard.press('F5');
    await mainWindow.waitForTimeout(500);
    await expect(overlay(mainWindow)).toHaveCount(0);

    // Esc still clears the projection as before
    await mainWindow.keyboard.press('Escape');
    await expect(audienceWindow.locator('body')).not.toContainText(/first slide line/i);
  });
});
