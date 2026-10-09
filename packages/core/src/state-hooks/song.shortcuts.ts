import { useSongControll } from './song.hooks';
import { selectedTabTypeAtom } from '../state/tab.atoms';
import { commandPaletteOpenAtom } from '../state/command.atoms';
import { useAtom } from 'jotai';
import { useCallback } from 'react';
import useShortcuts from '../utils/useShortcuts';
import { shouldIgnoreNavigationShortcut } from '../utils/shortcut.guards';
import { NEXT_SLIDE_KEYS, PREVIOUS_SLIDE_KEYS } from '../utils/navigation.keys';
import { songInputFocusAtom } from '../state/song.atoms';


const useSongShortcuts = () => {
  useSongControllerShortcuts();
  useStartSongSearchShortcut();
};
export default useSongShortcuts;

const useSongControllerShortcuts = () => {
  const { gotoNextSlide, gotoPreviousSlide } = useSongControll();
  const [selectedTabType] = useAtom(selectedTabTypeAtom);
  const [songInputFocus] = useAtom(songInputFocusAtom);
  const [commandPaletteOpen] = useAtom(commandPaletteOpenAtom);

  const next = useCallback((event: KeyboardEvent) => {
    if (shouldIgnoreNavigationShortcut(event)) return;

    if (selectedTabType === 'songs' && !songInputFocus && !commandPaletteOpen) {
      event.preventDefault();
      gotoNextSlide();
    }
  }, [selectedTabType, gotoNextSlide, songInputFocus, commandPaletteOpen]);
  const previous = useCallback((event: KeyboardEvent) => {
    if (shouldIgnoreNavigationShortcut(event)) return;

    if (selectedTabType === 'songs' && !songInputFocus && !commandPaletteOpen) {
      event.preventDefault();
      gotoPreviousSlide();
    }
  }, [selectedTabType, gotoPreviousSlide, songInputFocus, commandPaletteOpen]);
  useShortcuts(PREVIOUS_SLIDE_KEYS, previous);
  useShortcuts(NEXT_SLIDE_KEYS, next);
};

const useStartSongSearchShortcut = () => {
  // F1 shortcut is now handled by command palette
  // This function is kept for potential future use but does nothing
};
