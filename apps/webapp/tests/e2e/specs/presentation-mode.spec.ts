import { test, expect } from '../fixtures/browser-fixture';
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

test.describe('Present on this screen', () => {
  test('header button shows the projection full window and the remote keeps working', async ({ appPage }) => {
    const slides = await selectFirstSlide(appPage);
    await appPage.getByRole('button', { name: 'Prezintă pe acest ecran' }).click();

    await expect(overlay(appPage)).toBeVisible();
    await expect(overlay(appPage)).toContainText(/first slide line/i);
    const box = await overlay(appPage).boundingBox();
    const viewport = appPage.viewportSize()!;
    expect(box).toMatchObject({ x: 0, y: 0, width: viewport.width, height: viewport.height });

    // Remote: next / previous / blank screen
    await appPage.keyboard.press('PageDown');
    await expect(overlay(appPage)).toContainText(/second slide line/i);
    await appPage.keyboard.press('.');
    await expect(overlay(appPage)).not.toContainText(/slide line/i);
    await appPage.keyboard.press('.');
    await expect(overlay(appPage)).toContainText(/second slide line/i);

    // Esc leaves presentation mode but keeps the projection
    await appPage.keyboard.press('Escape');
    await expect(overlay(appPage)).toHaveCount(0);
    await expect(slides.nth(1)).toHaveAttribute('data-selected', 'true');
  });

  test('F5 (remote slideshow button) starts it and Esc ends it', async ({ appPage }) => {
    await selectFirstSlide(appPage);
    await appPage.keyboard.press('F5');
    await expect(overlay(appPage)).toContainText(/first slide line/i);
    await appPage.keyboard.press('F5'); // pressing again does not toggle off
    await expect(overlay(appPage)).toBeVisible();
    await appPage.keyboard.press('Escape');
    await expect(overlay(appPage)).toHaveCount(0);
  });

  test('exit button appears when the mouse moves', async ({ appPage }) => {
    await appPage.getByRole('button', { name: 'Prezintă pe acest ecran' }).click();
    const exit = appPage.getByRole('button', { name: 'Ieși din modul prezentare' });
    await expect(exit).toHaveCSS('opacity', '0');
    await appPage.mouse.move(300, 300);
    await appPage.mouse.move(320, 320);
    await expect(exit).toHaveCSS('opacity', '1');
    await exit.click();
    await expect(overlay(appPage)).toHaveCount(0);
  });
});
