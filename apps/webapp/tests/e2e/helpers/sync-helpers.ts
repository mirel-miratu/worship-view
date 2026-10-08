import type { Browser, BrowserContext, Page } from '@playwright/test';
import WebSocket from 'ws';
import { expect } from '../fixtures/browser-fixture';

/**
 * Multi-device helpers: each "device" is a separate browser context (own
 * IndexedDB, own Jazz node) running the real JazzReactProvider. The app's
 * wss://cloud.jazz.tools connection is redirected to the local
 * `jazz-run sync --in-memory` server started by playwright.config.ts.
 */
export const LOCAL_SYNC_URL = 'ws://127.0.0.1:4200';

type Connection = { flush: () => void };
const deviceState = new WeakMap<BrowserContext, { online: boolean; connections: Set<Connection> }>();

async function routeJazzToLocalSync(context: BrowserContext) {
  const state = { online: true, connections: new Set<Connection>() };
  deviceState.set(context, state);

  await context.routeWebSocket(/cloud\.jazz\.tools/, (route) => {
    const upstream = new WebSocket(LOCAL_SYNC_URL);
    // While the device is offline, traffic is held in both directions
    const toServer: (string | Buffer)[] = [];
    const toDevice: (string | Buffer)[] = [];
    const flush = () => {
      if (!state.online) return;
      if (upstream.readyState === WebSocket.OPEN) {
        toServer.splice(0).forEach((m) => upstream.send(m));
      }
      toDevice.splice(0).forEach((m) => route.send(m));
    };
    const connection = { flush };
    state.connections.add(connection);

    upstream.on('open', flush);
    upstream.on('message', (data, isBinary) => {
      toDevice.push(isBinary ? (data as Buffer) : data.toString());
      flush();
    });
    const close = () => {
      state.connections.delete(connection);
      route.close().catch(() => undefined);
    };
    upstream.on('close', close);
    upstream.on('error', close);
    route.onMessage((m) => {
      toServer.push(m);
      flush();
    });
    route.onClose(() => upstream.close());
  });
}

/** Simulates losing / regaining the connection to the sync server. */
export function setDeviceOnline(page: Page, online: boolean) {
  const state = deviceState.get(page.context());
  if (!state) throw new Error('Not a sync device');
  state.online = online;
  if (online) state.connections.forEach((connection) => connection.flush());
}

export async function newDevice(browser: Browser): Promise<Page> {
  const context = await browser.newContext({
    baseURL: 'http://localhost:5199',
    viewport: { width: 1280, height: 900 },
  });
  await routeJazzToLocalSync(context);
  const page = await context.newPage();
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('jazz-api-key', JSON.stringify('e2e-local-sync'));
  });
  await page.reload();
  return page;
}

/** Signs up a new account with a new organization; returns the passphrase. */
export async function signUp(page: Page): Promise<string> {
  await page.getByRole('button', { name: 'Înregistrare' }).click();
  const passphrase = await page.locator('textarea[readonly]').inputValue();
  expect(passphrase.split(/\s+/).length).toBeGreaterThan(5);
  await page.getByRole('button', { name: 'Mi-am salvat fraza de acces' }).click();
  await page.getByRole('button', { name: 'Creează organizație nouă' }).click();
  await page.getByPlaceholder('Introduceți numele organizației').fill('E2E Sync Org');
  await page.getByRole('button', { name: 'Creează', exact: true }).click();
  await page.waitForSelector('[role="tab"]', { timeout: 30000 });
  return passphrase;
}

/** Logs a second device into an existing account. */
export async function logIn(page: Page, passphrase: string): Promise<void> {
  await page.locator('#passphrase').fill(passphrase);
  await page.getByRole('button', { name: 'Autentificare' }).click();
  // The app also asks a logged-in device to confirm the passphrase was saved
  const confirmSaved = page.getByRole('button', { name: 'Mi-am salvat fraza de acces' });
  const appTabs = page.locator('[role="tab"]').first();
  await expect(confirmSaved.or(appTabs)).toBeVisible({ timeout: 30000 });
  if (await confirmSaved.isVisible()) await confirmSaved.click();
  await expect(appTabs).toBeVisible({ timeout: 30000 });
}

export async function closeDevices(...pages: Page[]) {
  await Promise.all(pages.map((page) => page.context().close()));
}
