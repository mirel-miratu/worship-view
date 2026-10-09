import { useEffect, useState } from 'react';
import {
  BLANK_SCREEN_KEYS,
  NEXT_SLIDE_KEYS,
  PREVIOUS_SLIDE_KEYS,
  SHOW_PROJECTION_KEYS,
} from '../../utils/navigation.keys';

const REMOTE_BUTTONS = [
  { button: 'Înainte', keys: 'PageDown', action: 'Slide / verset următor' },
  { button: 'Înapoi', keys: 'PageUp', action: 'Slide / verset anterior' },
  {
    button: 'Pornire / oprire prezentare',
    keys: 'F5, apoi Esc (alternativ)',
    action:
      'Fără proiector (sau pe web): pornește / oprește prezentarea pe acest ecran. Cu proiector: F5 reafișează proiecția, Esc o ascunde',
  },
  { button: 'Ecran negru', keys: '. sau B', action: 'Ascunde / reafișează tot de pe ecranul audienței' },
];

function describeKey(key: string): string {
  if (NEXT_SLIDE_KEYS.includes(key)) return 'Slide următor';
  if (PREVIOUS_SLIDE_KEYS.includes(key)) return 'Slide anterior';
  if (BLANK_SCREEN_KEYS.includes(key)) return 'Ecran negru';
  if (key === 'F5') return 'Prezintă / afișează proiecția';
  if (SHOW_PROJECTION_KEYS.includes(key)) return 'Afișează proiecția';
  if (key === 'Escape') return 'Ascunde proiecția';
  return 'Nicio acțiune';
}

type PressedKey = { id: number; key: string; code: string; action: string };

export function SettingsRemote() {
  const [pressed, setPressed] = useState<PressedKey[]>([]);

  useEffect(() => {
    let nextId = 0;
    const onKeyDown = (event: KeyboardEvent) => {
      // PageUp/PageDown would otherwise jump to the first/last settings tab
      if (event.key === 'PageUp' || event.key === 'PageDown') event.preventDefault();
      if (event.repeat) return;
      const entry = {
        id: nextId++,
        key: event.key,
        code: event.code,
        action: describeKey(event.key),
      };
      setPressed((previous) => [entry, ...previous].slice(0, 8));
    };
    // Capture phase so the key is shown even if a dialog handles it
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, []);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Telecomandă</h3>
      <p className="text-sm text-muted-foreground">
        Telecomenzile de prezentare (de exemplu Logitech R400) funcționează ca o tastatură. Cu
        Setările închise, butoanele controlează cântările, versetele și prezentările.
      </p>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-2 pr-3 font-medium">Buton</th>
            <th className="py-2 pr-3 font-medium">Tastă trimisă</th>
            <th className="py-2 font-medium">Acțiune</th>
          </tr>
        </thead>
        <tbody>
          {REMOTE_BUTTONS.map((row) => (
            <tr key={row.button} className="border-b last:border-0">
              <td className="py-2 pr-3">{row.button}</td>
              <td className="py-2 pr-3 font-mono text-xs">{row.keys}</td>
              <td className="py-2">{row.action}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="rounded-lg border p-3">
        <div className="text-sm font-medium">Test telecomandă</div>
        <p className="mb-2 text-xs text-muted-foreground">
          Apăsați butoanele telecomenzii: aici apare ce primește aplicația. Butonul de pornire /
          oprire trimite și Esc, care închide această fereastră.
        </p>
        {pressed.length === 0 ? (
          <div className="py-3 text-center text-sm text-muted-foreground">
            Nicio tastă apăsată încă.
          </div>
        ) : (
          <ul className="space-y-1" data-testid="remote-key-log">
            {pressed.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between text-sm">
                <span className="font-mono">
                  {entry.key === ' ' ? 'Space' : entry.key}
                  <span className="ml-2 text-xs text-muted-foreground">{entry.code}</span>
                </span>
                <span
                  className={
                    entry.action === 'Nicio acțiune' ? 'text-muted-foreground' : 'font-medium'
                  }
                >
                  {entry.action}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
