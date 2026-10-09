import { usePresentationControl } from './presentation.hooks';
import { selectedTabTypeAtom } from '../state/tab.atoms';
import { commandPaletteOpenAtom } from '../state/command.atoms';
import { presentationInputFocusAtom, selectedPresentationSlideAtom, videoPlayingAtom } from '../state/presentation.atoms';
import { useAtom } from 'jotai';
import { useCallback } from 'react';
import useShortcut from '../utils/useShortcut';
import useShortcuts from '../utils/useShortcuts';
import { shouldIgnoreNavigationShortcut } from '../utils/shortcut.guards';
import { NEXT_SLIDE_KEYS, PREVIOUS_SLIDE_KEYS } from '../utils/navigation.keys';


const usePresentationShortcuts = () => {
  const { gotoNextSlide, gotoPreviousSlide } = usePresentationControl();
  const [selectedTabType] = useAtom(selectedTabTypeAtom);
  const [presentationInputFocus] = useAtom(presentationInputFocusAtom);
  const [commandPaletteOpen] = useAtom(commandPaletteOpenAtom);
  const [selectedSlide] = useAtom(selectedPresentationSlideAtom);
  const [isPlaying, setIsPlaying] = useAtom(videoPlayingAtom);

  const next = useCallback((event: KeyboardEvent) => {
    if (shouldIgnoreNavigationShortcut(event)) return;

    if (selectedTabType === 'presentations' && !presentationInputFocus && !commandPaletteOpen) {
      event.preventDefault();
      gotoNextSlide();
    }
  }, [selectedTabType, gotoNextSlide, presentationInputFocus, commandPaletteOpen]);

  const previous = useCallback((event: KeyboardEvent) => {
    if (shouldIgnoreNavigationShortcut(event)) return;

    if (selectedTabType === 'presentations' && !presentationInputFocus && !commandPaletteOpen) {
      event.preventDefault();
      gotoPreviousSlide();
    }
  }, [selectedTabType, gotoPreviousSlide, presentationInputFocus, commandPaletteOpen]);

  const togglePlayPause = useCallback((event: KeyboardEvent) => {
    if (shouldIgnoreNavigationShortcut(event)) return;
    if (selectedTabType !== 'presentations') return;
    if (commandPaletteOpen || presentationInputFocus) return;
    if (selectedSlide?.slideType !== 'video') return;
    event.preventDefault();
    setIsPlaying(!isPlaying);
  }, [selectedTabType, commandPaletteOpen, presentationInputFocus, selectedSlide, isPlaying, setIsPlaying]);

  useShortcuts(PREVIOUS_SLIDE_KEYS, previous);
  useShortcuts(NEXT_SLIDE_KEYS, next);
  useShortcut(' ', togglePlayPause);
};

export default usePresentationShortcuts;
