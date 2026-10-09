import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { SongSlideSize } from '../types/settings.song.types';

export const settingsSongSlideSizeAtom = atom<SongSlideSize>(4);

// Minimum characters typed in the command palette before songs are searched
export const SONG_SEARCH_MIN_LENGTH_OPTIONS = [3, 4, 5, 6, 7] as const;
export const DEFAULT_SONG_SEARCH_MIN_LENGTH = 7;

export const songSearchMinLengthAtom = atomWithStorage<number>(
  'worship-view-song-search-min-length',
  DEFAULT_SONG_SEARCH_MIN_LENGTH,
);
