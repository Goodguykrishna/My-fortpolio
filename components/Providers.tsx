'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Lenis from 'lenis';
import { setSound, wakeAudio } from '@/lib/tick';
import Brackets from './Brackets';
import Chrome from './Chrome';

export type Mode = 'vertical' | 'horizontal';
type Ctx = {
  navigate: (href: string, look?: { bg?: string; fg?: string }) => void;
  mode: Mode;
  setMode: (m: Mode) => void;
  sound: boolean;
  toggleSound: () => void;
  lenis: () => Lenis | null;
};
const C = createContext<Ctx | null>(null);
export const useSite = () => useContext(C)!;

// the whole page takes a project's colours; CSS transitions the change
export function setLook(bg = '#ffffff', fg = '#0d0d0d') {
  const r = document.documentElement.style;
  r.setProperty('--bg', bg);
  r.setProperty('--fg', fg);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg);
}

export default function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const lenis = useRef<Lenis | null>(null);
  const [mode, setMode] = useState<Mode>('vertical');
  const [sound, setSoundState] = useState(true);
  const [veil, setVeil] = useState<{ on: boolean; bg: string; fg: string; out: boolean }>({ on: false, bg: '#000', fg: '#fff', out: false });
  const busy = useRef(false);

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const l = new Lenis({ autoRaf: true, lerp: 0.09, wheelMultiplier: 0.9 });
    lenis.current = l;
    return () => { l.destroy(); lenis.current = null; };
  }, []);

  useEffect(() => {
    let on = true;
    try { on = localStorage.getItem('sound') !== 'off'; } catch {}
    setSoundState(on);
    setSound(on);
    const wake = () => wakeAudio();
    addEventListener('pointerdown', wake);
    addEventListener('keydown', wake);
    return () => { removeEventListener('pointerdown', wake); removeEventListener('keydown', wake); };
  }, []);

  // a route arrived: lift the veil
  useEffect(() => {
    if (!busy.current) return;
    const t = setTimeout(() => {
      setVeil(v => ({ ...v, out: true }));
      setTimeout(() => { setVeil(v => ({ ...v, on: false, out: false })); busy.current = false; }, 700);
    }, 160);
    return () => clearTimeout(t);
  }, [pathname]);

  // brackets close over the next page's colour, a hairline loads across the top, then the route swaps
  const navigate = useCallback((href: string, look?: { bg?: string; fg?: string }) => {
    if (busy.current) return;
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (calm) { router.push(href); return; }
    busy.current = true;
    setVeil({ on: true, out: false, bg: look?.bg ?? '#ffffff', fg: look?.fg ?? '#0d0d0d' });
    setTimeout(() => { router.push(href); scrollTo(0, 0); lenis.current?.scrollTo(0, { immediate: true }); }, 780);
  }, [router]);

  const toggleSound = () => {
    const on = !sound;
    setSoundState(on);
    setSound(on);
    try { localStorage.setItem('sound', on ? 'on' : 'off'); } catch {}
  };

  return (
    <C.Provider value={{ navigate, mode, setMode, sound, toggleSound, lenis: () => lenis.current }}>
      <Chrome />
      {children}
      {veil.on && (
        <div className={`veil${veil.out ? ' out' : ''}`} style={{ background: veil.bg, color: veil.fg }} aria-hidden="true">
          <span className="veil-bar" />
          <Brackets className="veil-mark" w={120} h={75} />
        </div>
      )}
    </C.Provider>
  );
}
