import { selectedTabTypeAtom } from '../state/tab.atoms';
import { commandPaletteOpenAtom } from '../state/command.atoms';
import useShortcuts from '../utils/useShortcuts';
import { shouldIgnoreNavigationShortcut } from '../utils/shortcut.guards';
import { NEXT_SLIDE_KEYS, PREVIOUS_SLIDE_KEYS } from '../utils/navigation.keys';
import { useAtom } from 'jotai';
import { useCallback } from 'react';
import { verseInputFocusAtom } from '../state/verse.atoms';
import { useVerseControll } from './verse.hooks';


const useVerseShortcuts = () => {
  useVerseControllShortcuts();
};

export default useVerseShortcuts;

const useVerseControllShortcuts = () => {
  const { gotoNextVerse, gotoPreviousVerse } = useVerseControll();
  const [selectedTabType] = useAtom(selectedTabTypeAtom);
  const [verseInputFocus] = useAtom(verseInputFocusAtom);
  const [commandPaletteOpen] = useAtom(commandPaletteOpenAtom);
  const next = useCallback((event: KeyboardEvent) => {
    if (shouldIgnoreNavigationShortcut(event)) return;

    if (!verseInputFocus && selectedTabType === 'bible' && !commandPaletteOpen) {
      event.preventDefault();
      gotoNextVerse();
    }
  }, [verseInputFocus, gotoNextVerse, selectedTabType, commandPaletteOpen]);
  const previous = useCallback((event: KeyboardEvent) => {
    if (shouldIgnoreNavigationShortcut(event)) return;

    if (!verseInputFocus && selectedTabType === 'bible' && !commandPaletteOpen) {
      event.preventDefault();
      gotoPreviousVerse();
    }
  }, [verseInputFocus, gotoPreviousVerse, selectedTabType, commandPaletteOpen]);
  useShortcuts(PREVIOUS_SLIDE_KEYS, previous);
  useShortcuts(NEXT_SLIDE_KEYS, next);
};
