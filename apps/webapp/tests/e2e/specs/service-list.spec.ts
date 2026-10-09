import { test, expect } from '../fixtures/browser-fixture';
import {
  addSong,
  searchSongInPalette,
  closeCommandPalette,
} from '../helpers/song-helpers';
import type { Page } from '@playwright/test';

const SONG_NAME = 'Service List Test Song';
const SONG_CONTENT = `Verse
Praise the Lord all ye nations
Praise him all ye people
---
Chorus
For his merciful kindness is great
And the truth of the Lord endures forever
---
Verse Chorus`;

async function ensureDefaultServiceListExpanded(page: Page, expectedText?: string) {
  const contentLocator = expectedText
    ? page.locator('li').filter({ hasText: expectedText })
    : page.locator('text=Niciun cântec în această listă');

  if (await contentLocator.isVisible()) {
    return contentLocator;
  }

  await page.getByText('Lista de melodii', { exact: true }).click();
  await expect(contentLocator).toBeVisible({ timeout: 5000 });
  return contentLocator;
}

test.describe('Service List', () => {
  test('can add a song to the service list', async ({ appPage }) => {
    await addSong(appPage, SONG_NAME, SONG_CONTENT);

    // Search for the song in the command palette
    await searchSongInPalette(appPage, 'service list test');

    const songItem = appPage.locator('[cmdk-item]').filter({ hasText: SONG_NAME });
    await expect(songItem).toBeVisible({ timeout: 5000 });

    // Hover to reveal the add-to-service-list button
    await songItem.hover();
    await appPage.locator(`button[aria-label="Adaugă ${SONG_NAME} la lista de melodii"]`).click();
    await appPage.waitForTimeout(500);

    // Close the command palette
    await closeCommandPalette(appPage);

    // Verify the song appears in the service list (left panel)
    await ensureDefaultServiceListExpanded(appPage, SONG_NAME);
  });

  test('service list song is clickable to select', async ({ appPage }) => {
    await addSong(appPage, SONG_NAME, SONG_CONTENT);

    // Add song to service list via palette
    await searchSongInPalette(appPage, 'service list test');
    const songItem = appPage.locator('[cmdk-item]').filter({ hasText: SONG_NAME });
    await songItem.hover();
    await appPage.locator(`button[aria-label="Adaugă ${SONG_NAME} la lista de melodii"]`).click();
    await appPage.waitForTimeout(500);
    await closeCommandPalette(appPage);

    // Click the song name in the service list
    const serviceListItem = await ensureDefaultServiceListExpanded(appPage, SONG_NAME);
    const serviceListSong = serviceListItem.locator('span.flex-1');
    await serviceListSong.click();
    await appPage.waitForTimeout(500);

    // Slides panel should now show slides for this song
    // Filter for content slides (non-empty text) since the app adds empty boundary slides
    const slides = appPage.locator('[data-testid="song-slide-item"]').filter({ hasText: /\S+/ });
    await expect(slides.first()).toBeVisible({ timeout: 10000 });
  });

  test('can remove a song from service list', async ({ appPage }) => {
    await addSong(appPage, SONG_NAME, SONG_CONTENT);

    // Add song to service list
    await searchSongInPalette(appPage, 'service list test');
    const songItem = appPage.locator('[cmdk-item]').filter({ hasText: SONG_NAME });
    await songItem.hover();
    await appPage.locator(`button[aria-label="Adaugă ${SONG_NAME} la lista de melodii"]`).click();
    await appPage.waitForTimeout(500);
    await closeCommandPalette(appPage);

    // Verify the song is in the service list
    const serviceListItem = await ensureDefaultServiceListExpanded(appPage, SONG_NAME);

    // Hover the service list item and click the remove button
    await serviceListItem.hover();
    await appPage.locator(`button[aria-label="Elimină ${SONG_NAME} din listă"]`).click();
    await appPage.waitForTimeout(500);

    // Song should be gone from service list
    await expect(serviceListItem).not.toBeVisible({ timeout: 5000 });

    // Empty state text should appear
    await expect(appPage.locator('text=Niciun cântec în această listă')).toBeVisible();
  });

  test('service list persists after tab switch', async ({ appPage }) => {
    await addSong(appPage, SONG_NAME, SONG_CONTENT);

    // Add song to service list
    await searchSongInPalette(appPage, 'service list test');
    const songItem = appPage.locator('[cmdk-item]').filter({ hasText: SONG_NAME });
    await songItem.hover();
    await appPage.locator(`button[aria-label="Adaugă ${SONG_NAME} la lista de melodii"]`).click();
    await appPage.waitForTimeout(500);
    await closeCommandPalette(appPage);

    // Verify song is in service list
    await ensureDefaultServiceListExpanded(appPage, SONG_NAME);

    // Switch to Bible tab
    await appPage.locator('[role="tab"]').filter({ hasText: 'Biblie' }).click();
    await appPage.waitForTimeout(500);

    // Switch back to Songs tab
    await appPage.locator('[role="tab"]').filter({ hasText: 'Melodii' }).click();
    await appPage.waitForTimeout(500);

    // Song should still be in the service list
    await ensureDefaultServiceListExpanded(appPage, SONG_NAME);
  });

  test('empty state shows when no songs in service list', async ({ appPage }) => {
    // Initially, service list should be empty
    await ensureDefaultServiceListExpanded(appPage);
  });

  test('reordering by drag keeps each song once in the new order', async ({ appPage }) => {
    const names = ['Reorder Alfa', 'Reorder Beta', 'Reorder Gama', 'Reorder Delta'];
    for (const name of names) {
      await addSong(appPage, name, SONG_CONTENT);
    }
    for (const name of names) {
      await searchSongInPalette(appPage, name.toLowerCase());
      const item = appPage.locator('[cmdk-item]').filter({ hasText: name });
      await item.hover();
      await appPage.locator(`button[aria-label="Adaugă ${name} la lista de melodii"]`).click();
      await appPage.waitForTimeout(300);
      await closeCommandPalette(appPage);
    }
    await ensureDefaultServiceListExpanded(appPage, names[0]);

    const grip = '[aria-label="Trageți pentru a reordona"]';
    const rows = appPage.locator('li').filter({ has: appPage.locator(grip) });
    const order = () => rows.locator('span.flex-1').allInnerTexts();

    await rows.nth(0).locator(grip).dragTo(rows.nth(2));
    await expect.poll(order).toEqual(['Reorder Beta', 'Reorder Gama', 'Reorder Alfa', 'Reorder Delta']);

    await rows.nth(3).locator(grip).dragTo(rows.nth(0));
    await expect.poll(order).toEqual(['Reorder Delta', 'Reorder Beta', 'Reorder Gama', 'Reorder Alfa']);

    await rows.nth(1).locator(grip).dragTo(rows.nth(2));
    await expect.poll(order).toEqual(['Reorder Delta', 'Reorder Gama', 'Reorder Beta', 'Reorder Alfa']);
  });
});
