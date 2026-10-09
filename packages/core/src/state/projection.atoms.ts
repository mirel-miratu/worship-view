import { atom } from 'jotai';
import { ProjectionType } from '../types/projection.types';

export const currentProjectionTypeAtom = atom<ProjectionType>('none');
export const verseProjectionEnabledAtom = atom<boolean>(false);
export const presentationProjectionEnabledAtom = atom<boolean>(true);

// "Blank screen" (presenter remote B / "." button): hides everything on the
// audience screen except the clock while keeping the current selection.
export const projectionBlankedAtom = atom<boolean>(false);

// "Present on this screen": the audience screen fills the main window, for a
// single screen mirrored to a TV (no extended display).
export const presentationModeAtom = atom<boolean>(false);

// Set by the desktop app when a projector/TV is configured as audience display.
// Without one (or on the web), the remote's F5/Esc start and stop presentation mode.
export const externalAudienceDisplayConfiguredAtom = atom<boolean>(false);
