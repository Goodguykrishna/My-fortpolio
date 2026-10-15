'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { FLICKER, WORK as PROJECTS, pad } from '@/lib/projects';
import { tick } from '@/lib/tick';
import { setLook, useSite } from './Providers';
import Brackets, { cornersPath } from './Brackets';
import Slot from './Slot';

const N = PROJECTS.length;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const outExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(t, 0, 1)));

/* ---------- preloader: the mark draws itself, work flickers inside it, a counter runs ---------- */
function Preloader({ done }: { done: () => void }) {
  const [n, setN] = useState(0);
  const [img, setImg] = useState(0);
  const [out, setOut] = useState(false);

  useEffect(() => {
    // warm the cache with the flicker images while the count runs
    const loads = FLICKER.map(src => new Promise<void>(r => { const i = new Image(); i.onload = i.onerror = () => r(); i.src = src; }));
    let loaded = false;
    Promise.all(loads).then(() => { loaded = true; });
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const p = clamp((t - t0) / 2600, 0, loaded ? 1 : 0.92);
      setN(Math.round(outExpo(p) * 100 * (p >= 1 ? 1 : 0.999)));
      if (t - t0 > 900) setImg(Math.floor((t - t0) / 85) % FLICKER.length);
      if (p >= 1) { setOut(true); setTimeout(done, 380); return; }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [done]);

  return (
    <div className={`loader${out ? ' out' : ''}`} aria-hidden="true">
      <div className="loader-mark">
        <Brackets w={96} h={60} className="loader-line" />
        <span className="loader-flick" style={{ backgroundImage: `url(${FLICKER[img]})` }} />
      </div>
      <span className="loader-count">{String(n).padStart(2, '0')}</span>
    </div>
  );
}

export default function Home() {
  const { navigate, mode } = useSite();
  const root = useRef<HTMLDivElement>(null);
  const cells = useRef<(HTMLLIElement | null)[]>([]);
  const names = useRef<(HTMLLIElement | null)[]>([]);
  const frameSvg = useRef<SVGSVGElement>(null);
  const framePath = useRef<SVGPathElement>(null);
  const frameClip = useRef<SVGRectElement>(null);
  const [focus, setFocus] = useState(0);
  const [phase, setPhase] = useState<'load' | 'intro' | 'ready'>('load');
  const api = useRef<{ go: (i: number) => void; relayout: () => void } | null>(null);
  const focusRef = useRef(0);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const modeRef = useRef(mode);
  modeRef.current = mode;

  // first visit this session gets the preloader; coming back from a project goes straight in
  useEffect(() => {
    let start = 0;
    try { start = Number(sessionStorage.getItem('focus') ?? 0) || 0; } catch {}
    focusRef.current = start;
    setFocus(start);
    setLook(PROJECTS[start].bg, PROJECTS[start].fg);
    let seen = false;
    try { seen = sessionStorage.getItem('seen') === '1'; } catch {}
    if (seen || matchMedia('(prefers-reduced-motion: reduce)').matches) setPhase('intro');
    document.documentElement.classList.add('locked');
    return () => document.documentElement.classList.remove('locked');
  }, []);

  useEffect(() => { document.body.dataset.phase = phase; }, [phase]);
  useEffect(() => () => { delete document.body.dataset.phase; }, []);

  useEffect(() => {
    const el = root.current!;
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const g = { W: 0, H: 0, cx: 0, cy: 0, vertical: true, narrow: false, size: [] as [number, number][], c: [] as number[], L: 1, gap: 32, row: 15 };
    const s = { target: 0, cur: 0, lastInput: 0, introT: -1, fw: 0, fh: 0, ft: 0, lastSub: 0, lastCur: 0 };
    const wrap = (d: number) => ((((d + g.L / 2) % g.L) + g.L) % g.L) - g.L / 2;
    const wrapN = (k: number) => ((((k + N / 2) % N) + N) % N) - N / 2;

    const layout = () => {
      g.W = innerWidth; g.H = innerHeight;
      g.cx = g.W < 760 ? g.W * 0.68 : g.W / 2; g.cy = g.H / 2;
      g.vertical = modeRef.current === 'vertical' || g.W < 760;
      g.narrow = g.W < 760;
      // every cell is the same 16:10 landscape, so the frame never pumps between sizes
      const colW = clamp(g.W * (g.narrow ? 0.5 : 0.15), 150, 250);
      const rowH = clamp(g.H * 0.16, 100, 170);
      g.size = PROJECTS.map(() => (g.vertical ? [colW, colW / 1.6] : [rowH * 1.6, rowH]) as [number, number]);
      const along = g.size.map(([w, h]) => (g.vertical ? h : w));
      let x = 0;
      g.c = along.map(a => { const c = x + a / 2; x += a + g.gap; return c; });
      g.L = x;
      s.cur = s.target = g.c[focusRef.current];
    };

    const go = (i: number) => { s.target += wrap(g.c[((i % N) + N) % N] - s.target); s.lastInput = performance.now(); };
    api.current = { go, relayout: layout };

    const open = (i: number) => {
      try { sessionStorage.setItem('focus', String(i)); } catch {}
      navigate(`/work/${PROJECTS[i].slug}/`, { bg: PROJECTS[i].bg, fg: PROJECTS[i].fg });
    };

    // ---- input: wheel, touch drag with a flick, keys ----
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (phaseRef.current === 'load') return;
      s.target += (g.vertical ? e.deltaY : e.deltaY + e.deltaX) * 0.9;
      s.lastInput = performance.now();
    };
    let touch: { p: number; t: number; v: number } | null = null;
    const axis = (e: TouchEvent) => (g.vertical ? e.touches[0].clientY : e.touches[0].clientX);
    const onTouchStart = (e: TouchEvent) => { touch = { p: axis(e), t: performance.now(), v: 0 }; };
    const onTouchMove = (e: TouchEvent) => {
      if (!touch) return;
      e.preventDefault();
      const p = axis(e), now = performance.now(), d = touch.p - p;
      s.target += d * 1.25;
      touch.v = d / Math.max(1, now - touch.t);
      touch.p = p; touch.t = now;
      s.lastInput = now;
    };
    const onTouchEnd = () => { if (touch) s.target += touch.v * 240; touch = null; s.lastInput = performance.now(); };
    const onKey = (e: KeyboardEvent) => {
      if (phaseRef.current === 'load') return;
      if (['ArrowDown', 'ArrowRight', 'j'].includes(e.key)) { e.preventDefault(); go(focusRef.current + 1); }
      if (['ArrowUp', 'ArrowLeft', 'k'].includes(e.key)) { e.preventDefault(); go(focusRef.current - 1); }
      if (e.key === 'Enter' && (e.target as Element).tagName !== 'BUTTON' && (e.target as Element).tagName !== 'A') open(focusRef.current);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    addEventListener('keydown', onKey);
    addEventListener('resize', layout);
    el.addEventListener('click', e => {
      const li = (e.target as Element).closest<HTMLElement>('[data-i]');
      if (!li) return;
      const i = Number(li.dataset.i);
      if (i === focusRef.current) open(i); else go(i);
    });

    layout();
    let raf = 0, last = performance.now();
    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      // settle on the nearest project once input stops
      if (t - s.lastInput > 150) {
        let best = 0, bd = Infinity;
        for (let i = 0; i < N; i++) { const d = Math.abs(wrap(g.c[i] - s.target)); if (d < bd) { bd = d; best = i; } }
        s.target += wrap(g.c[best] - s.target);
      }
      s.cur += (s.target - s.cur) * (calm ? 1 : 1 - Math.exp(-dt * 8));

      // intro: the column slides in from beyond the edge, nearest first
      if (phaseRef.current !== 'load' && s.introT < 0) s.introT = t;
      const it = s.introT < 0 ? 0 : (t - s.introT) / 1000;
      if (phaseRef.current === 'intro' && it > 1.8) setPhase('ready');

      let fi = 0, fd = Infinity;
      for (let i = 0; i < N; i++) {
        const li = cells.current[i];
        if (!li) continue;
        const d = wrap(g.c[i] - s.cur);
        if (Math.abs(d) < Math.abs(fd)) { fd = d; fi = i; }
        const [w, h] = g.size[i];
        const delay = Math.min(0.6, Math.abs(d) / (g.vertical ? g.H : g.W) * 0.7);
        const k = calm ? 1 : outExpo((it - delay) / 1.1);
        const enter = (1 - k) * (g.vertical ? g.H : g.W) * (d >= 0 ? 1 : -1) * 1.1;
        const along = (g.vertical ? g.cy : g.cx) + d + enter;
        li.style.transform = g.vertical
          ? `translate3d(${(g.cx - w / 2).toFixed(1)}px, ${(along - h / 2).toFixed(1)}px, 0)`
          : `translate3d(${(along - w / 2).toFixed(1)}px, ${(g.cy - h / 2).toFixed(1)}px, 0)`;
        li.style.width = `${w}px`;
        li.style.height = `${h}px`;
      }

      if (fi !== focusRef.current) {
        focusRef.current = fi;
        setFocus(fi);
        setLook(PROJECTS[fi].bg, PROJECTS[fi].fg);
      }

      // the brackets ease to the size of whatever is in focus
      const [w, h] = g.size[fi];
      const kf = phaseRef.current === 'load' ? 0 : outExpo(it / 1.2);
      const b = g.narrow ? 10 : 14;
      const tw = (w + 2 * b) * kf, th = (h + 2 * b) * kf;
      s.fw += (tw - s.fw) * (calm ? 1 : 1 - Math.exp(-dt * 14));
      s.fh += (th - s.fh) * (calm ? 1 : 1 - Math.exp(-dt * 14));
      s.ft += (b * kf - s.ft) * (calm ? 1 : 1 - Math.exp(-dt * 14));
      if (frameSvg.current && framePath.current && frameClip.current && s.fw > 1) {
        frameSvg.current.setAttribute('width', s.fw.toFixed(1));
        frameSvg.current.setAttribute('height', s.fh.toFixed(1));
        frameSvg.current.setAttribute('viewBox', `0 0 ${s.fw.toFixed(1)} ${s.fh.toFixed(1)}`);
        frameClip.current.setAttribute('width', s.fw.toFixed(1));
        frameClip.current.setAttribute('height', s.fh.toFixed(1));
        framePath.current.setAttribute('d', cornersPath(s.fw, s.fh, 22));
      }

      // the name list slides so the project in focus always sits on the centre line
      const span = (g.vertical ? g.size[fi][1] : g.size[fi][0]) + g.gap;
      const idx = fi - fd / span;
      for (let i = 0; i < N; i++) {
        const li = names.current[i];
        if (!li) continue;
        const kk = wrapN(i - idx);
        li.style.transform = `translate3d(0, ${(kk * g.row).toFixed(1)}px, 0)`;
        li.style.opacity = String(Math.max(0, 1 - Math.abs(kk) / 9));
      }

      // tick as projects pass the frame; faster scroll ticks faster
      const sub = Math.floor(idx * 2 + 0.5);
      if (phaseRef.current === 'ready' && sub !== s.lastSub) tick(sub % 2 === 0, Math.abs(s.cur - s.lastCur) / dt / span);
      s.lastSub = sub;
      s.lastCur = s.cur;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      removeEventListener('keydown', onKey);
      removeEventListener('resize', layout);
    };
  }, [navigate]);

  // switching Vertical / Horizontal keeps the same project in focus
  useEffect(() => { api.current?.relayout(); }, [mode]);

  const p = PROJECTS[focus];
  const loaded = useCallback(() => { try { sessionStorage.setItem('seen', '1'); } catch {} setPhase('intro'); }, []);

  return (
    <div className={`home ${mode}`} ref={root}>
      {phase === 'load' && <Preloader done={loaded} />}

      <ol className="col" aria-label="Projects">
        {PROJECTS.map((pr, i) => (
          <li key={pr.slug} ref={el => { cells.current[i] = el; }} data-i={i} className={i === focus ? 'on' : ''}>
            <button className="cell" aria-label={`${pr.title}, ${pr.tags}${i === focus ? '. Open project' : ''}`} tabIndex={i === focus ? 0 : -1}>
              <Slot m={pr.cover} alt={pr.title} fill active={i === focus && phase === 'ready'} />
            </button>
          </li>
        ))}
      </ol>

      <svg className="frame" ref={frameSvg} width="0" height="0" aria-hidden="true">
        <defs><clipPath id="frame-clip"><rect ref={frameClip} width="0" height="0" /></clipPath></defs>
        <path ref={framePath} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
      </svg>

      <ol className="names" aria-hidden="true">
        {PROJECTS.map((pr, i) => (
          <li key={pr.slug} ref={el => { names.current[i] = el; }} data-i={i} className={i === focus ? 'on' : ''}>{pr.title}</li>
        ))}
      </ol>

      <p className="tags" key={`t${focus}`}>{p.tags}</p>
      <p className="svc" key={`s${focus}`}>{p.role}</p>
      <span className="num" key={`n${focus}`}>{pad(focus + 1)}</span>
      <span className="sr-only" aria-live="polite">{p.title}</span>
    </div>
  );
}
