import { FC, useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import {
  clockOverlayEnabledAtom,
  clockFormatAtom,
  clockPositionAtom,
  clockFontSizeAtom,
  clockColorModeAtom,
  clockCustomColorAtom,
  ClockPosition,
} from '../../../../state/clock.atoms';
import {
  currentProjectionTypeAtom,
  verseProjectionEnabledAtom,
} from '../../../../state/projection.atoms';
import { selectedSongSlideAtom } from '../../../../state/song.atoms';
import { useActiveTextStyle } from '../../../../hooks/useTextStyle';
import { buildTextShadowStyle } from '../../../../jazz/text-style-store';

function formatTime(date: Date, format: '12h' | '24h'): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const mm = String(minutes).padStart(2, '0');

  if (format === '24h') {
    return `${String(hours).padStart(2, '0')}:${mm}`;
  }

  const h12 = hours % 12 || 12;
  const ampm = hours < 12 ? 'AM' : 'PM';
  return `${h12}:${mm} ${ampm}`;
}

function getPositionClasses(position: ClockPosition): string {
  switch (position) {
    case 'top-left':
      return 'top-10 left-10 pt-4 pl-4';
    case 'top-right':
      return 'top-10 right-10 pt-4 pr-4';
    case 'bottom-right':
      return 'bottom-10 right-10 pb-4 pr-4';
    case 'bottom-left':
    default:
      return 'bottom-10 left-10 pb-4 pl-4';
  }
}

const ClockOverlay: FC = () => {
  const [enabled] = useAtom(clockOverlayEnabledAtom);
  const [format] = useAtom(clockFormatAtom);
  const [position] = useAtom(clockPositionAtom);
  const [fontSize] = useAtom(clockFontSizeAtom);
  const [colorMode] = useAtom(clockColorModeAtom);
  const [customColor] = useAtom(clockCustomColorAtom);
  const [currentProjectionType] = useAtom(currentProjectionTypeAtom);
  const [verseProjectionEnabled] = useAtom(verseProjectionEnabledAtom);
  const [selectedSongSlide] = useAtom(selectedSongSlideAtom);
  const activeStyle = useActiveTextStyle();
  const [now, setNow] = useState(() => new Date());
  const shouldHideForProjectedText =
    // Blank boundary slides leave the screen empty, so the clock stays visible
    (currentProjectionType === 'song' &&
      !!selectedSongSlide?.lines.some((line) => line.trim() !== '')) ||
    (currentProjectionType === 'verse' && verseProjectionEnabled);

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [enabled]);

  if (!enabled || shouldHideForProjectedText) return null;

  return (
    <div
      className={`absolute z-20 whitespace-nowrap ${getPositionClasses(position)}`}
      data-testid="clock-overlay"
      style={{
        fontFamily: activeStyle.fontFamily,
        // Large sizes are capped so the clock always fits on smaller projectors
        // ("12:30 PM" is roughly twice as wide as "14:30")
        fontSize: `min(${fontSize}%, ${format === '12h' ? 20 : 36}vw, 55vh)`,
        fontWeight: activeStyle.fontWeight,
        fontStyle: activeStyle.italic ? 'italic' : 'normal',
        color: colorMode === 'custom' ? customColor : activeStyle.fontColor,
        letterSpacing: `${activeStyle.letterSpacing}em`,
        textShadow: buildTextShadowStyle(activeStyle),
      }}
    >
      {formatTime(now, format)}
    </div>
  );
};

export default ClockOverlay;
