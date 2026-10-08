import { FC, useEffect, useRef, useState } from 'react';
import MediaBackground from './components/MediaBackground';
import SlideText from './components/SlideText';
import ClockOverlay from './components/ClockOverlay';
import { useRegisterCustomFonts } from '../../../hooks/useCustomFonts';

const AudienceScreen: FC = () => {
  // The screen may be portaled into a projection window, which is a separate
  // document that needs the custom fonts registered on its own.
  const rootRef = useRef<HTMLDivElement>(null);
  const [ownerDocument, setOwnerDocument] = useState<Document | null>(null);
  useEffect(() => {
    setOwnerDocument(rootRef.current?.ownerDocument ?? null);
  }, []);
  useRegisterCustomFonts(ownerDocument);

  return (
    <div ref={rootRef} className="bg-black h-full flex justify-center items-center">
      <SlideText />
      <ClockOverlay />
      <MediaBackground />
    </div>
  );
};

export default AudienceScreen;
