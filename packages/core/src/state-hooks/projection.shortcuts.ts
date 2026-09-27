import { currentProjectionTypeAtom, presentationProjectionEnabledAtom, verseProjectionEnabledAtom } from '../state/projection.atoms';
import { useSongControll } from './song.hooks';
import { selectedTabTypeAtom } from '../state/tab.atoms';
import { verseInputFocusAtom } from '../state/verse.atoms';
import { commandPaletteOpenAtom } from '../state/command.atoms';
import { presentationInputFocusAtom, selectedPresentationSlideAtom } from '../state/presentation.atoms';
import { useVerseControll } from './verse.hooks';
import { useAtom } from 'jotai';
import { useCallback } from 'react';
import useShortcut from '../utils/useShortcut';
import { shouldIgnoreNavigationShortcut } from '../utils/shortcut.guards';

const useProjectionShortcuts = () => {
  useEnableProjectionShortcut();
  useClearScreenShortcut();
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
  const enableProjection = useCallback((event: KeyboardEvent) => {
    if (event.defaultPrevented || commandPaletteOpen) return;
    if (shouldIgnoreNavigationShortcut(event)) return;

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
  ]);

  useShortcut('Enter', enableProjection);
};

const useClearScreenShortcut = () => {
  const { clearSong } = useSongControll();
  const { disableVerse } = useVerseControll();
  const [commandPaletteOpen] = useAtom(commandPaletteOpenAtom);
  const [, setPresentationProjectionEnabled] = useAtom(presentationProjectionEnabledAtom);
  const clear = useCallback((event: KeyboardEvent) => {
    if (event.defaultPrevented) return;
    if (shouldIgnoreNavigationShortcut(event)) return;
    if (commandPaletteOpen) return;
    clearSong();
    disableVerse();
    setPresentationProjectionEnabled(false);
  }, [clearSong, disableVerse, commandPaletteOpen, setPresentationProjectionEnabled]);

  useShortcut('Escape', clear);
};
