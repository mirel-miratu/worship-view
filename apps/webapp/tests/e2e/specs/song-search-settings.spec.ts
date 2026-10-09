import { test, expect } from '../fixtures/browser-fixture';
import type { Page } from '@playwright/test';
import { addSong, closeCommandPalette, openCommandPalette } from '../helpers/song-helpers';

const TITLE_SONG = 'Mare e Domnul';
const LYRICS_SONG = 'Cantare de toamna';
const LYRICS_CONTENT = `Verse
Strangem roadele recoltei
Multumim pentru harvest
---
Verse`;

async function setMinLength(page: Page, length: number) {
  await page.locator('[data-testid="settings-button"]').click();
  await page.getByRole('tab', { name: 'Cântece', exact: true }).click();
  await page.locator('#song-search-min-length').click();
  await page.getByRole('option', { name: `Minim ${length} caractere` }).click();
  await expect(page.locator('#song-search-min-length')).toContainText(`Minim ${length} caractere`);
  await page.keyboard.press('Escape');
  await expect(page.locator('[role="dialog"]')).toHaveCount(0);
}

async function search(page: Page, query: string) {
  await openCommandPalette(page);
  await page.locator('[cmdk-input]').fill(query);
  await page.waitForTimeout(300);
}

const songOption = (page: Page, name: string) =>
  page.locator('[cmdk-item]').filter({ hasText: name });

test.describe('Song search minimum length setting', () => {
  test('defaults to 7 characters', async ({ appPage }) => {
    await addSong(appPage, TITLE_SONG, `Verse\nMare e Domnul\n---\nVerse`);

    await search(appPage, 'mare e');
    await expect(appPage.getByText('Tastați cel puțin 7 caractere pentru a căuta cântece...')).toBeVisible();
    await expect(songOption(appPage, TITLE_SONG)).toHaveCount(0);

    await appPage.locator('[cmdk-input]').fill('mare e d');
    await expect(songOption(appPage, TITLE_SONG)).toBeVisible();
    await closeCommandPalette(appPage);

    await appPage.locator('[data-testid="settings-button"]').click();
    await appPage.getByRole('tab', { name: 'Cântece', exact: true }).click();
    await expect(appPage.locator('#song-search-min-length')).toContainText('Minim 7 caractere');
  });

  test('with 3 characters, titles match from 3 and lyrics from 5 characters', async ({ appPage }) => {
    await addSong(appPage, TITLE_SONG, `Verse\nMare e Domnul\n---\nVerse`);
    await addSong(appPage, LYRICS_SONG, LYRICS_CONTENT);
    await setMinLength(appPage, 3);

    await search(appPage, 'ma');
    await expect(appPage.getByText('Tastați cel puțin 3 caractere pentru a căuta cântece...')).toBeVisible();

    await appPage.locator('[cmdk-input]').fill('mar');
    await expect(songOption(appPage, TITLE_SONG)).toBeVisible();

    // Short queries only search titles: "harv" is in the lyrics only
    await appPage.locator('[cmdk-input]').fill('harv');
    await appPage.waitForTimeout(300);
    await expect(songOption(appPage, LYRICS_SONG)).toHaveCount(0);

    await appPage.locator('[cmdk-input]').fill('harve');
    await expect(songOption(appPage, LYRICS_SONG)).toBeVisible();
    await closeCommandPalette(appPage);
  });

  test('the setting is kept after a restart', async ({ appPage }) => {
    await setMinLength(appPage, 4);

    await appPage.reload();
    await appPage.waitForSelector('[role="tab"]', { timeout: 30000 });

    await search(appPage, 'abc');
    await expect(appPage.getByText('Tastați cel puțin 4 caractere pentru a căuta cântece...')).toBeVisible();
    await closeCommandPalette(appPage);

    await appPage.locator('[data-testid="settings-button"]').click();
    await appPage.getByRole('tab', { name: 'Cântece', exact: true }).click();
    await expect(appPage.locator('#song-search-min-length')).toContainText('Minim 4 caractere');
  });
});
