import { useCallback, useEffect, useMemo, useState } from 'react';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import * as fontStore from '../jazz/font-store';
import type { CustomFontResponse } from '../jazz/font-store';
import { useActiveOrganization } from './useActiveOrganization';

const customFontsRefreshTokenAtom = atom(0);

export function useCustomFonts(): CustomFontResponse[] {
  const { activeOrganization } = useActiveOrganization();
  const refreshToken = useAtomValue(customFontsRefreshTokenAtom);

  return useMemo(
    () => fontStore.getCustomFonts(activeOrganization),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refreshToken forces a re-read after local mutations
    [activeOrganization, refreshToken],
  );
}

export function useUploadCustomFont() {
  const { activeOrganization } = useActiveOrganization();
  const bumpRefresh = useSetAtom(customFontsRefreshTokenAtom);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (file: File) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await fontStore.uploadCustomFont(activeOrganization, file);
        bumpRefresh((n) => n + 1);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to upload font');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [activeOrganization, bumpRefresh],
  );

  return { mutate, mutateAsync: mutate, isLoading, error };
}

export function useDeleteCustomFont() {
  const { activeOrganization } = useActiveOrganization();
  const bumpRefresh = useSetAtom(customFontsRefreshTokenAtom);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = fontStore.deleteCustomFont(activeOrganization, id);
        bumpRefresh((n) => n + 1);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to delete font');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [activeOrganization, bumpRefresh],
  );

  return { mutate, mutateAsync: mutate, isLoading, error };
}

// FontFace objects registered by this hook, per document and font id
const registeredFaces = new WeakMap<Document, Map<string, FontFace>>();

/**
 * Registers the organization's custom fonts in `targetDocument` via the
 * FontFace API. Projection windows are separate documents, so each one needs
 * its own registration (stylesheets copied from the main window do not
 * include fonts added this way).
 */
export function useRegisterCustomFonts(targetDocument: Document | null | undefined) {
  const { activeOrganization } = useActiveOrganization();
  const fonts = useCustomFonts();

  useEffect(() => {
    if (!targetDocument) return;
    let cancelled = false;
    let faces = registeredFaces.get(targetDocument);
    if (!faces) {
      faces = new Map();
      registeredFaces.set(targetDocument, faces);
    }
    const registered = faces;

    const wanted = new Set(fonts.map((font) => font.id));
    for (const [id, face] of registered) {
      if (!wanted.has(id)) {
        targetDocument.fonts.delete(face);
        registered.delete(id);
      }
    }

    // Use the target window's constructor: FontFace objects belong to the
    // realm that created them.
    const FontFaceCtor =
      (targetDocument.defaultView as (Window & typeof globalThis) | null)?.FontFace ??
      FontFace;

    for (const font of fonts) {
      if (registered.has(font.id)) continue;
      fontStore
        .loadCustomFontData(activeOrganization, font.id)
        .then(async (data) => {
          if (cancelled || registered.has(font.id)) return;
          const face = new FontFaceCtor(font.family, data);
          await face.load();
          if (cancelled || registered.has(font.id)) return;
          targetDocument.fonts.add(face);
          registered.set(font.id, face);
        })
        .catch((err) => {
          console.error(`Failed to register font "${font.family}":`, err);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [targetDocument, fonts, activeOrganization]);
}

/** Registers custom fonts in the main application window. */
export const useManageCustomFonts = () => {
  useRegisterCustomFonts(typeof document === 'undefined' ? null : document);
};
