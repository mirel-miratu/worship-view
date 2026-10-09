import {
  currentProjectionTypeAtom,
  presentationProjectionEnabledAtom,
  projectionBlankedAtom,
  verseProjectionEnabledAtom,
} from '../state/projection.atoms';
import { useSongControll } from './song.hooks';
import { selectedTabTypeAtom } from '../state/tab.atoms';
import { verseInputFocusAtom } from '../state/verse.atoms';
import { commandPaletteOpenAtom } from '../state/command.atoms';
import { presentationInputFocusAtom, selectedPresentationSlideAtom } from '../state/presentation.atoms';
import { useVerseControll } from './verse.hooks';
import { useAtom } from 'jotai';
import { useCallback } from 'react';
import useShortcut from '../utils/useShortcut';
import useShortcuts from '../utils/useShortcuts';
import { BLANK_SCREEN_KEYS, SHOW_PROJECTION_KEYS } from '../utils/navigation.keys';
import { usePresentationModeShortcuts } from '../components/presentation-mode/PresentationMode';
import { shouldIgnoreNavigationShortcut } from '../utils/shortcut.guards';

const useProjectionShortcuts = () => {
  usePresentationModeShortcuts();
  useEnableProjectionShortcut();
  useClearScreenShortcut();
  useBlankScreenShortcut();
};

export default useProjectionShortcuts;

const useEnableProjectionShortcut = () => {
  const [verseInputFocus] = useAtom(verseInputFocusAtom);
  const [presentationInputFocus] = useAtom(presentationInputFocusAtom);
  const [selectedPresentationSlide] = useAtom(selectedPresentationSlideAtom);
  const [selectedTabType] = useAtom(selectedTabTypeAtom);
  const [commandPaletteOpen] = useAtom(commandPaletteOpenAtom);
  const [, setVerseProjectionEnabled] = useAtom(verseProjectionEnabledAtom);
  const [, setPresentationProjectionEnabled] = useAtom(presentationProjectionEnabledAtom);
  const [, setCurrentProjectionType] = useAtom(currentProjectionTypeAtom);
  const [, setProjectionBlanked] = useAtom(projectionBlankedAtom);
  const enableProjection = useCallback((event: KeyboardEvent) => {
    // F5 must never reload the web app, even when the shortcut is ignored
    if (event.key === 'F5') event.preventDefault();
    if (event.defaultPrevented && event.key !== 'F5') return;
    if (commandPaletteOpen) return;
    if (shouldIgnoreNavigationShortcut(event)) return;

    setProjectionBlanked(false);

    if (!verseInputFocus && selectedTabType === 'bible')
      setVerseProjectionEnabled(true);

    if (!presentationInputFocus && selectedTabType === 'presentations' && selectedPresentationSlide) {
      event.preventDefault();
      setPresentationProjectionEnabled(true);
      setCurrentProjectionType('presentation');
    }
  }, [
    verseInputFocus,
    setVerseProjectionEnabled,
    selectedTabType,
    commandPaletteOpen,
    presentationInputFocus,
    selectedPresentationSlide,
    setPresentationProjectionEnabled,
    setCurrentProjectionType,
    setProjectionBlanked,
  ]);

  useShortcuts(SHOW_PROJECTION_KEYS, enableProjection);
};

const useClearScreenShortcut = () => {
  const { clearSong } = useSongControll();
  const { disableVerse } = useVerseControll();
  const [commandPaletteOpen] = useAtom(commandPaletteOpenAtom);
  const [, setPresentationProjectionEnabled] = useAtom(presentationProjectionEnabledAtom);
  const [, setProjectionBlanked] = useAtom(projectionBlankedAtom);
  const clear = useCallback((event: KeyboardEvent) => {
    if (event.defaultPrevented) return;
    if (shouldIgnoreNavigationShortcut(event)) return;
    if (commandPaletteOpen) return;
    clearSong();
    disableVerse();
    setPresentationProjectionEnabled(false);
    setProjectionBlanked(false);
  }, [clearSong, disableVerse, commandPaletteOpen, setPresentationProjectionEnabled, setProjectionBlanked]);

  useShortcut('Escape', clear);
};

const useBlankScreenShortcut = () => {
  const [commandPaletteOpen] = useAtom(commandPaletteOpenAtom);
  const [, setProjectionBlanked] = useAtom(projectionBlankedAtom);
  const toggleBlank = useCallback((event: KeyboardEvent) => {
    if (event.defaultPrevented || event.repeat) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (shouldIgnoreNavigationShortcut(event)) return;
    if (commandPaletteOpen) return;
    event.preventDefault();
    setProjectionBlanked((blanked) => !blanked);
  }, [commandPaletteOpen, setProjectionBlanked]);

  useShortcuts(BLANK_SCREEN_KEYS, toggleBlank);
};
