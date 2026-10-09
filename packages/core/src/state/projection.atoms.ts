import { atom } from 'jotai';
import { ProjectionType } from '../types/projection.types';

export const currentProjectionTypeAtom = atom<ProjectionType>('none');
export const verseProjectionEnabledAtom = atom<boolean>(false);
export const presentationProjectionEnabledAtom = atom<boolean>(true);

// "Blank screen" (presenter remote B / "." button): hides everything on the
// audience screen except the clock while keeping the current selection.
export const projectionBlankedAtom = atom<boolean>(false);
