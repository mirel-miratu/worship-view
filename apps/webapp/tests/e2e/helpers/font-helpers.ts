import type { Page } from '@playwright/test';

/**
 * Measures how text actually renders in `family` (falling back to serif).
 * The test font (Iosevka Fixed) is monospaced, so "iiii" and "MMMM" have the
 * same width only when its glyphs are really used; serif proves the fallback
 * differs. This checks rendering, not just the CSS font-family string.
 */
export async function measureFontRendering(page: Page, family: string) {
  return page.evaluate(async (fontFamily) => {
    await document.fonts.ready;
    const width = (text: string, css: string) => {
      const span = document.createElement('span');
      span.style.cssText = `position:absolute;left:-9999px;font-size:40px;white-space:pre;font-family:${css}`;
      span.textContent = text;
      document.body.appendChild(span);
      const result = span.getBoundingClientRect().width;
      span.remove();
      return result;
    };
    const css = `"${fontFamily}", serif`;
    return {
      narrow: width('iiiiiiiiii', css),
      wide: width('MMMMMMMMMM', css),
      serifNarrow: width('iiiiiiiiii', 'serif'),
      serifWide: width('MMMMMMMMMM', 'serif'),
    };
  }, family);
}

export async function rendersWithMonospaceFont(page: Page, family: string): Promise<boolean> {
  const m = await measureFontRendering(page, family);
  return Math.abs(m.narrow - m.wide) < 1 && Math.abs(m.serifNarrow - m.serifWide) > 20;
}

export function isFontRegistered(page: Page, family: string) {
  return page.evaluate(
    (f) =>
      Array.from(document.fonts).some(
        (face) => face.family.replace(/"/g, '') === f && face.status === 'loaded',
      ),
    family,
  );
}
