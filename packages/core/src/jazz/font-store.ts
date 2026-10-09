import { v4 as uuidv4 } from 'uuid';
import { co, getLoadedOrUndefined } from 'jazz-tools';
import {
  CustomFont,
  CustomFontType,
  OrganizationType,
  TextStyleType,
  getFontsArray,
  getOrganizationGroup,
  getTextStylesArray,
  pushCoListItem,
  removeCoListItem,
  setCoMapProperty,
} from '@worship-view/schema';
import { AVAILABLE_FONTS } from './text-style-store';

export const MAX_FONT_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const FONT_FILE_EXTENSIONS = ['.ttf', '.otf', '.woff', '.woff2'];
const FALLBACK_FONT_FAMILY = 'Montserrat';

// CSS-wide keywords and generic families cannot be used as font-family names
const RESERVED_FAMILY_NAMES = new Set([
  'inherit',
  'initial',
  'unset',
  'revert',
  'default',
  'serif',
  'sans-serif',
  'monospace',
  'cursive',
  'fantasy',
  'system-ui',
  'math',
  'emoji',
]);

export interface CustomFontResponse {
  id: string;
  family: string;
  fileName: string;
  sizeBytes: number;
}

function getFontsFromOrg(
  organization: OrganizationType | null | undefined,
): CustomFontType[] {
  return getFontsArray(organization).filter(
    (font): font is CustomFontType =>
      font !== null && typeof font.family === 'string',
  );
}

function fontToResponse(font: CustomFontType): CustomFontResponse {
  return {
    id: font.id,
    family: font.family,
    fileName: font.fileName,
    sizeBytes: font.sizeBytes,
  };
}

export function getCustomFonts(
  organization: OrganizationType | null | undefined,
): CustomFontResponse[] {
  return getFontsFromOrg(organization)
    .map(fontToResponse)
    .sort((a, b) => a.family.localeCompare(b.family));
}

export function validateFontFile(file: File): { valid: boolean; error?: string } {
  const lowerName = file.name.toLowerCase();
  if (!FONT_FILE_EXTENSIONS.some((ext) => lowerName.endsWith(ext))) {
    return {
      valid: false,
      error: `Format neacceptat. Folosiți un fișier ${FONT_FILE_EXTENSIONS.join(', ')}.`,
    };
  }
  if (file.size > MAX_FONT_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Fișierul este prea mare (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum 10MB.`,
    };
  }
  return { valid: true };
}

/**
 * Builds a font-family name from the file name that can be used unquoted in
 * inline styles and does not clash with built-in or already uploaded fonts.
 */
export function deriveFontFamily(fileName: string, takenFamilies: string[]): string {
  const base =
    fileName
      .replace(/\.[^.]+$/, '')
      .replace(/[_-]+/g, ' ')
      .replace(/[^\p{L}\p{N} ]+/gu, '')
      .replace(/\s+/g, ' ')
      .trim() || 'Font';
  let family = /^\p{L}/u.test(base) ? base : `Font ${base}`;
  if (RESERVED_FAMILY_NAMES.has(family.toLowerCase())) {
    family = `${family} Font`;
  }

  const taken = new Set(
    [...AVAILABLE_FONTS, ...takenFamilies].map((name) => name.toLowerCase()),
  );
  let candidate = family;
  for (let n = 2; taken.has(candidate.toLowerCase()); n++) {
    candidate = `${family} ${n}`;
  }
  return candidate;
}

export async function uploadCustomFont(
  organization: OrganizationType | null | undefined,
  file: File,
): Promise<CustomFontResponse> {
  if (!organization) {
    throw new Error('No active organization');
  }

  const validation = validateFontFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Reject files the browser cannot parse before storing them
  const data = await file.arrayBuffer();
  try {
    await new FontFace('worship-view-font-check', data).load();
  } catch {
    throw new Error('Fișierul nu este un font valid.');
  }

  if (!organization.$jazz.has('fonts')) {
    organization.$jazz.set('fonts', []);
  }
  const loaded = (await organization.$jazz.ensureLoaded({
    resolve: { fonts: { $each: true } },
  })) as OrganizationType;

  const orgGroup = getOrganizationGroup(loaded);
  const fileStream = await co.fileStream().createFromBlob(file, {
    owner: orgGroup,
  });
  const family = deriveFontFamily(
    file.name,
    getFontsFromOrg(loaded).map((font) => font.family),
  );
  const font = CustomFont.create(
    {
      id: uuidv4(),
      family,
      fileName: file.name,
      sizeBytes: file.size,
      file: fileStream,
    },
    { owner: orgGroup },
  );
  pushCoListItem(loaded.fonts, font);

  return fontToResponse(font);
}

/**
 * Deletes a custom font. Text styles that used it switch back to the default
 * font so the projection never silently falls back to a browser font.
 */
export function deleteCustomFont(
  organization: OrganizationType | null | undefined,
  id: string,
): { success: boolean; updatedStyles: number } {
  if (!organization) {
    throw new Error('No active organization');
  }

  const font = getFontsFromOrg(organization).find((f) => f.id === id);
  if (!font) {
    throw new Error('Font not found');
  }

  let updatedStyles = 0;
  getTextStylesArray(organization).forEach((style: TextStyleType | null) => {
    if (style && style.fontFamily === font.family) {
      setCoMapProperty(style, 'fontFamily', FALLBACK_FONT_FAMILY);
      updatedStyles++;
    }
  });

  removeCoListItem(
    organization.fonts,
    (f: CustomFontType | null) => f?.id === id,
  );

  return { success: true, updatedStyles };
}

export function countTextStylesUsingFont(
  organization: OrganizationType | null | undefined,
  family: string,
): number {
  return getTextStylesArray(organization).filter(
    (style) => style?.fontFamily === family,
  ).length;
}

/**
 * Loads the font file bytes. Results are cached per font id because fonts are
 * immutable once uploaded and are registered in several documents (main
 * window and projection windows).
 */
const fontDataCache = new Map<string, Promise<ArrayBuffer>>();

export function loadCustomFontData(
  organization: OrganizationType | null | undefined,
  id: string,
): Promise<ArrayBuffer> {
  const cached = fontDataCache.get(id);
  if (cached) return cached;

  const font = getFontsFromOrg(organization).find((f) => f.id === id);
  if (!font) {
    return Promise.reject(new Error('Font not found'));
  }

  const promise = (async () => {
    const loaded = (await font.$jazz.ensureLoaded({
      resolve: { file: true },
    })) as CustomFontType;
    const fileStreamId = getLoadedOrUndefined(loaded.file)?.$jazz.id;
    if (!fileStreamId) {
      throw new Error('Font file is not available');
    }
    const blob = await co.fileStream().loadAsBlob(fileStreamId);
    if (!blob) {
      throw new Error('Font file is not available');
    }
    return blob.arrayBuffer();
  })();

  fontDataCache.set(id, promise);
  promise.catch(() => fontDataCache.delete(id));
  return promise;
}
