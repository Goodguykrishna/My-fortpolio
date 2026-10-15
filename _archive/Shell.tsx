'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Lenis from 'lenis';
import { PROJECTS, indexOf, pad } from '@/lib/projects';
import { setSound, wakeAudio } from '@/lib/tick';
import Info from './Info';
import Wheel, { type WheelApi } from './Wheel';
import IndexPanel from './IndexPanel';

export default function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const slug = pathname?.match(/^\/work\/([^/]+)/)?.[1] ?? null;
  const lenis = useRef<Lenis | null>(null);
  const wheel = useRef<WheelApi | null>(null);
  const caseEl = useRef<HTMLDivElement>(null);
  const [indexOpen, setIndexOpen] = useState(false);
  const [focusCat, setFocusCat] = useState<string>(PROJECTS[0].cat);
  const [sound, setSoundState] = useState(true);
  // keep the last case rendered while the panel slides away
  const [caseNode, setCaseNode] = useState<ReactNode>(slug ? children : null);

  useEffect(() => {
    if (slug) { setCaseNode(children); return; }
    const t = setTimeout(() => setCaseNode(null), 700);
    return () => clearTimeout(t);
  }, [slug, children]);

  useEffect(() => {
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (calm) return;
    const l = new Lenis({ autoRaf: true, lerp: 0.085, wheelMultiplier: 0.8, touchMultiplier: 1.2 });
    lenis.current = l;
    return () => { l.destroy(); lenis.current = null; };
  }, []);

  // the page underneath stays put while a panel is open
  useEffect(() => {
    const l = lenis.current;
    if (!l) return;
    if (slug || indexOpen) l.stop(); else l.start();
  }, [slug, indexOpen]);

  // sound: remembered per visitor, woken by the first click/tap/key (browser rule)
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

  // a case opened (or next-project'd) parks the wheel on it, so closing lands there
  useEffect(() => {
    if (!slug) return;
    const i = indexOf(slug);
    if (i >= 0) requestAnimationFrame(() => wheel.current?.go(i, true));
    caseEl.current?.scrollTo(0, 0);
  }, [slug]);

  const toggleSound = () => {
    const on = !sound;
    setSoundState(on);
    setSound(on);
    try { localStorage.setItem('sound', on ? 'on' : 'off'); } catch {}
  };

  const home = useCallback(() => {
    setIndexOpen(false);
    if (slug) router.push('/', { scroll: false });
    wheel.current?.go(0);
  }, [slug, router]);

  const open = useCallback((s: string) => router.push(`/work/${s}/`, { scroll: false }), [router]);
  const close = useCallback(() => router.push('/', { scroll: false }), [router]);

  const pick = (i: number) => {
    setIndexOpen(false);
    if (slug) router.push('/', { scroll: false });
    wheel.current?.go(i);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (indexOpen) setIndexOpen(false);
      else if (slug) close();
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [indexOpen, slug, close]);

  const i = slug ? indexOf(slug) : -1;

  return (
    <>
      <Info onHome={home} cat={focusCat} />

      <nav className={`bar${slug || indexOpen ? ' solid' : ''}`} aria-label="Site">
        <button className="bar-btn" onClick={slug ? close : home}>
          {slug ? '← Back' : 'Home'}
        </button>
        {slug && <span className="bar-pos">{pad(i + 1)} / {pad(PROJECTS.length)}</span>}
        <div className="bar-right">
          <button className="bar-btn" aria-expanded={indexOpen} onClick={() => setIndexOpen(v => !v)}>
            {indexOpen ? 'Close' : 'Index'}
          </button>
          <button className={`bar-btn sound${sound ? ' on' : ''}`} aria-pressed={sound} onClick={toggleSound}>
            <i aria-hidden="true"><b /><b /><b /></i>Sound
          </button>
        </div>
      </nav>

      <Wheel api={wheel} lenis={lenis} paused={!!slug || indexOpen} onOpen={open} onFocusChange={i => setFocusCat(PROJECTS[i].cat)} />

      <IndexPanel open={indexOpen} onPick={pick} />

      <div ref={caseEl} className={`case${slug ? ' open' : ''}`} data-lenis-prevent aria-hidden={!slug}>
        {caseNode}
      </div>
    </>
  );
}
