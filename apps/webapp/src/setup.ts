import {
  useManageProjection,
  useSongShortcuts,
  useVerseShortcuts,
  useProjectionShortcuts,
  useCommandPaletteShortcuts,
  useAutoModeShortcuts,
  useManageSongs,
  useVersesHistory,
  useThemeSettings,
  useManageCustomFonts,
} from '@worship-view/core';

export const useWebappSetup = () => {
  useManageProjection();
  useManageSongs();
  useVersesHistory();
  useSetupShortcuts();
  useThemeSettings();
  useManageCustomFonts();
};

const useSetupShortcuts = () => {
  useVerseShortcuts();
  useSongShortcuts();
  useProjectionShortcuts();
  useCommandPaletteShortcuts();
  useAutoModeShortcuts();
};
