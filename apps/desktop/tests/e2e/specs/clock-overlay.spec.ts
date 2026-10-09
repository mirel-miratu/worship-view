import { test, expect } from '../fixtures/electron-fixture';
import { addSong, selectSongFromPalette, selectVerseFromPalette } from '../helpers/song-helpers';
import type { Page } from '@playwright/test';

const SONG_NAME = 'Clock Overlay Song';
const SONG_CONTENT = `Verse
Amazing grace how sweet the sound
That saved a wretch like me
---
Chorus
Through many dangers toils and snares
I have already come
---
Verse Chorus`;

async function enableClock(page: Page) {
  await page.locator('[data-testid="settings-button"]').click();
  await page.locator('[role="tab"]').filter({ hasText: 'Ceas' }).click();
  const row = page.locator('div.rounded-lg.border').filter({ hasText: 'Afișează ceasul' });
  await row.locator('button').click();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
}

async function focusAppWindow(page: Page) {
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur?.();
    window.focus();
  });
  await page.waitForTimeout(200);
}

function getClock(audience: Page) {
  return audience.locator('div.z-20').filter({ hasText: /^\d{1,2}:\d{2}/ });
}

function getContentSlides(page: Page) {
  return page.locator('[data-testid="song-slide-item"]').filter({ hasText: /\S+/ });
}

async function projectSong(main: Page, audience: Page) {
  await addSong(main, SONG_NAME, SONG_CONTENT);
  await selectSongFromPalette(main, 'clock overlay song', SONG_NAME);
  const slides = getContentSlides(main);
  await expect(slides.first()).toBeVisible({ timeout: 10000 });
  await slides.first().click();
  await expect(audience.locator('body')).toContainText(/amazing grace/i, { timeout: 5000 });
}

async function hideSong(main: Page, audience: Page) {
  await focusAppWindow(main);
  await main.keyboard.press('Escape');
  await expect(audience.locator('body')).not.toContainText(/amazing grace/i, { timeout: 5000 });
}

test.describe('Clock Overlay', () => {
  test('clock hides while a song slide is projected and returns after Escape', async ({ mainWindow, audienceWindow }) => {
    await enableClock(mainWindow);
    await expect(getClock(audienceWindow)).toHaveCount(1, { timeout: 5000 });

    await projectSong(mainWindow, audienceWindow);
    await expect(getClock(audienceWindow)).toHaveCount(0);

    await hideSong(mainWindow, audienceWindow);
    await expect(getClock(audienceWindow)).toHaveCount(1, { timeout: 3000 });
  });

  test('clock returns after hiding a song when a verse was selected before', async ({ mainWindow, audienceWindow }) => {
    await enableClock(mainWindow);
    await selectVerseFromPalette(mainWindow, 'ioan 3 16', 'IOAN 3:16');
    await mainWindow.waitForTimeout(500);
    await expect(getClock(audienceWindow)).toHaveCount(1, { timeout: 5000 });

    await projectSong(mainWindow, audienceWindow);
    await expect(getClock(audienceWindow)).toHaveCount(0);

    await hideSong(mainWindow, audienceWindow);
    await expect(getClock(audienceWindow)).toHaveCount(1, { timeout: 3000 });
  });

  test('clock stays visible on blank song slides', async ({ mainWindow, audienceWindow }) => {
    await enableClock(mainWindow);
    await addSong(mainWindow, SONG_NAME, SONG_CONTENT);
    await selectSongFromPalette(mainWindow, 'clock overlay song', SONG_NAME);

    // Selecting a song starts on the blank boundary slide: nothing is shown yet
    await expect(getContentSlides(mainWindow).first()).toBeVisible({ timeout: 10000 });
    await expect(getClock(audienceWindow)).toHaveCount(1, { timeout: 3000 });

    await getContentSlides(mainWindow).first().click();
    await expect(getClock(audienceWindow)).toHaveCount(0, { timeout: 3000 });
  });
});
