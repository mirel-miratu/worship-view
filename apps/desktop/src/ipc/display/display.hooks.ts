import { settingsAudienceDisplaysAtom } from '../settings/settings.display.atoms';
import { externalAudienceDisplayConfiguredAtom } from '@worship-view/core';
import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { Display } from 'electron';
import { getApiClient } from '../index';
import { availableDisplaysAtom, mainWindowDisplayIdAtom } from './display.atoms';

const useGetDisplays = () => {
  const { getDisplays, getMainWindowDisplayId, onDisplaysChanged } =
    getApiClient();
  const [, setAvailableDisplays] = useAtom(availableDisplaysAtom);
  const [, setMainWindowDisplayId] = useAtom(mainWindowDisplayIdAtom);

  useEffect(() => {
    getDisplays().then((displays: Display[]) => {
      setAvailableDisplays(displays);
    });
    getMainWindowDisplayId().then((id: number) => {
      setMainWindowDisplayId(id);
    });
  }, [getDisplays, getMainWindowDisplayId, setAvailableDisplays, setMainWindowDisplayId]);

  useEffect(() => {
    const cleanup = onDisplaysChanged((displays: Display[]) => {
      setAvailableDisplays(displays);
      getMainWindowDisplayId().then((id: number) => {
        setMainWindowDisplayId(id);
      });
    });
    return cleanup;
  }, [onDisplaysChanged, getMainWindowDisplayId, setAvailableDisplays, setMainWindowDisplayId]);
};

export default useGetDisplays;

/**
 * Tells the shared presentation-mode logic whether a projector/TV is set up as
 * audience display; without one the remote's F5 presents on this screen.
 */
export const useSyncExternalAudienceDisplay = () => {
  const [audienceDisplays] = useAtom(settingsAudienceDisplaysAtom);
  const [, setConfigured] = useAtom(externalAudienceDisplayConfiguredAtom);
  useEffect(() => {
    setConfigured(audienceDisplays.length > 0);
  }, [audienceDisplays, setConfigured]);
};
