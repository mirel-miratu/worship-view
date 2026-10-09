import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { addSong, searchSongInPalette, closeCommandPalette } from '../helpers/song-helpers';
import { closeDevices, logIn, newDevice, setDeviceOnline, signUp } from '../helpers/sync-helpers';

const SONGS = ['Sync Song AA', 'Sync Song BB', 'Sync Song CC', 'Sync Song DD', 'Sync Song EE', 'Sync Song FF'];
const CONTENT = `Verse
Line one of the song
---
Verse`;
const GRIP = '[aria-label="Trageți pentru a reordona"]';

const rows = (page: Page) => page.locator('li').filter({ has: page.locator(GRIP) });
const order = (page: Page) => () => rows(page).locator('span.flex-1').allInnerTexts();

async function expandList(page: Page) {
  if ((await rows(page).count()) === 0) {
    await page.getByText('Lista de melodii', { exact: true }).click();
  }
}

/** Two devices on the same account, both showing a list with SONGS in order. */
async function setUpTwoDevices(browser: import('@playwright/test').Browser) {
  const a = await newDevice(browser);
  const passphrase = await signUp(a);
  await a.getByRole('button', { name: 'Listă nouă' }).click();
  await a.getByPlaceholder('Numele listei...').fill('Lista de melodii');
  await a.keyboard.press('Enter');
  for (const name of SONGS) await addSong(a, name, CONTENT);
  for (const name of SONGS) {
    await searchSongInPalette(a, name.toLowerCase());
    await a.locator('[cmdk-item]').filter({ hasText: name }).hover();
    await a.locator(`button[aria-label="Adaugă ${name} la lista de melodii"]`).click();
    await closeCommandPalette(a);
  }
  await expandList(a);
  await expect.poll(order(a)).toEqual(SONGS);

  const b = await newDevice(browser);
  await logIn(b, passphrase);
  await expandList(b);
  await expect.poll(order(b), { timeout: 20000 }).toEqual(SONGS);
  return { a, b };
}

/** Drags the row of `song` onto the row currently at `toIndex`. */
async function move(page: Page, song: string, toIndex: number) {
  const source = rows(page).filter({ hasText: song });
  await source.locator(GRIP).dragTo(rows(page).nth(toIndex));
}

test.describe('Service list sync between devices', () => {
  test.setTimeout(120000);

  test('a reorder on one device shows up on the other', async ({ browser }) => {
    const { a, b } = await setUpTwoDevices(browser);
    await move(a, 'Sync Song AA', 3);
    const expected = ['Sync Song BB', 'Sync Song CC', 'Sync Song DD', 'Sync Song AA', 'Sync Song EE', 'Sync Song FF'];
    await expect.poll(order(a)).toEqual(expected);
    await expect.poll(order(b), { timeout: 15000 }).toEqual(expected);
    await closeDevices(a, b);
  });

  test('moves of different songs made offline are both kept after syncing, without duplicates', async ({ browser }) => {
    const { a, b } = await setUpTwoDevices(browser);

    // B is offline while both devices edit, so neither sees the other's move
    setDeviceOnline(b, false);
    await move(a, 'Sync Song AA', 3);
    await move(b, 'Sync Song FF', 1);
    await expect.poll(order(b)).toEqual(['Sync Song AA', 'Sync Song FF', 'Sync Song BB', 'Sync Song CC', 'Sync Song DD', 'Sync Song EE']);
    setDeviceOnline(b, true);

    const expected = ['Sync Song FF', 'Sync Song BB', 'Sync Song CC', 'Sync Song DD', 'Sync Song AA', 'Sync Song EE'];
    await expect.poll(order(a), { timeout: 15000 }).toEqual(expected);
    await expect.poll(order(b), { timeout: 15000 }).toEqual(expected);

    await b.reload();
    await b.waitForSelector('[role="tab"]', { timeout: 30000 });
    await expandList(b);
    await expect.poll(order(b), { timeout: 15000 }).toEqual(expected);
    await closeDevices(a, b);
  });

  test('moves of the same song made offline converge to the latest move', async ({ browser }) => {
    const { a, b } = await setUpTwoDevices(browser);

    setDeviceOnline(b, false);
    await move(a, 'Sync Song AA', 2);
    await a.waitForTimeout(50);
    await move(b, 'Sync Song AA', 4);
    setDeviceOnline(b, true);

    // B's move is the latest write, so both devices settle on it
    const expected = ['Sync Song BB', 'Sync Song CC', 'Sync Song DD', 'Sync Song EE', 'Sync Song AA', 'Sync Song FF'];
    await expect.poll(order(a), { timeout: 15000 }).toEqual(expected);
    await expect.poll(order(b), { timeout: 15000 }).toEqual(expected);
    await closeDevices(a, b);
  });

  // Known Jazz limitation (cojson 0.19.18 up to 0.20.19): CoValueCore.compareTransactions
  // returns 0 for writes from different sessions with the same `madeAt` millisecond, so
  // each device keeps the remote write as the winner until it reloads. Two devices moving
  // the same song in the same millisecond therefore disagree until a refresh.
  test.fixme('moves of the same song in the same millisecond converge without reload', async ({ browser }) => {
    const { a, b } = await setUpTwoDevices(browser);
    await Promise.all([move(a, 'Sync Song AA', 2), move(b, 'Sync Song AA', 4)]);
    await expect
      .poll(async () => (await order(a)()).join('|') === (await order(b)()).join('|'), { timeout: 15000 })
      .toBe(true);
    await closeDevices(a, b);
  });

  test('a song removed on another device during a drag does not shift the dragged song', async ({ browser }) => {
    const { a, b } = await setUpTwoDevices(browser);

    // B starts dragging FF...
    const source = await rows(b).filter({ hasText: 'Sync Song FF' }).locator(GRIP).boundingBox();
    await b.mouse.move(source!.x + source!.width / 2, source!.y + source!.height / 2);
    await b.mouse.down();
    await b.mouse.move(source!.x + 20, source!.y - 20, { steps: 5 });

    // ...while A removes CC, and B receives the removal mid-drag (indexes shift)
    await rows(a).filter({ hasText: 'Sync Song CC' }).hover();
    await a.locator('button[aria-label="Elimină Sync Song CC din listă"]').click();
    await expect.poll(order(b), { timeout: 15000 }).not.toContain('Sync Song CC');

    // B drops FF on the first row
    const target = await rows(b).nth(0).boundingBox();
    await b.mouse.move(target!.x + 60, target!.y + target!.height / 2, { steps: 10 });
    await b.mouse.up();

    const expected = ['Sync Song FF', 'Sync Song AA', 'Sync Song BB', 'Sync Song DD', 'Sync Song EE'];
    await expect.poll(order(b), { timeout: 15000 }).toEqual(expected);
    await expect.poll(order(a), { timeout: 15000 }).toEqual(expected);
    await closeDevices(a, b);
  });
});
