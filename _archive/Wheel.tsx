'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import type Lenis from 'lenis';
import { PROJECTS, pad, ratio } from '@/lib/projects';
import { tick } from '@/lib/tick';
import { createFlow, type Pt } from '@/lib/flow';
import Slot from './Slot';

export type WheelApi = { go: (i: number, immediate?: boolean) => void };
type Props = { api: RefObject<WheelApi | null>; lenis: RefObject<Lenis | null>; paused: boolean; onOpen: (slug: string) => void; onFocusChange?: (i: number) => void };

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const outQuart = (t: number) => 1 - Math.pow(1 - clamp(t, 0, 1), 4);
const N = PROJECTS.length;

export default function Wheel({ api, lenis, paused, onOpen, onFocusChange }: Props) {
  const onFocusRef = useRef(onFocusChange);
  onFocusRef.current = onFocusChange;
  const work = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const circle = useRef<SVGCircleElement>(null);
  const flowCv = useRef<HTMLCanvasElement>(null);
  const pill = useRef<HTMLSpanElement>(null);
  const items = useRef<(HTMLLIElement | null)[]>([]);
  const medias = useRef<(HTMLSpanElement | null)[]>([]);
  const metas = useRef<(HTMLSpanElement | null)[]>([]);
  const ticks = useRef<(SVGLineElement | null)[]>([]);
  const [focus, setFocus] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const focusRef = useRef(0);

  useEffect(() => {
    const g = { W: 0, H: 0, STEP: 260, R: 600, CX: 0, CY: 0, apex: 0, ROW: 22, narrow: false };
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ars = PROJECTS.map(p => ratio(p.ar));
    let dirty = true;
    // the text sea behind the wheel: every project's notes, re-typeset around the items each frame
    const flow = createFlow(flowCv.current!, PROJECTS.map(p => `${p.title} — ${p.line} ${p.body.join(' ')} ${p.points.join('. ')}.`).join(' ').repeat(3));
    let rowW: number[] = [], metaW: number[] = [];
    const pointer = { x: -999, y: -999, on: false };

    const layout = () => {
      const s = stage.current!;
      g.W = s.clientWidth;
      g.H = s.clientHeight;
      g.narrow = innerWidth < 900;
      g.STEP = clamp(g.H * 0.3, 170, 290);
      g.R = g.H * (g.narrow ? 0.86 : 0.68);
      // hub sits off the right edge; the focused card's right edge is the apex, so the card lands centred
      g.apex = g.narrow ? g.W - 44 : (g.W + g.W * 0.56) / 2;
      g.CX = g.apex + g.R;
      g.CY = g.H / 2 + (g.narrow ? 24 : 0);
      g.ROW = items.current[0]?.querySelector<HTMLElement>('.it-row')?.offsetHeight || 22;
      document.documentElement.style.setProperty('--wheel-track', `${(N - 1) * g.STEP}px`);
      circle.current?.setAttribute('cx', String(g.CX));
      circle.current?.setAttribute('cy', String(g.CY));
      circle.current?.setAttribute('r', String(g.R - 44));
      flow.resize(g.W, g.H);
      rowW = items.current.map(li => li?.querySelector<HTMLElement>('.it-row')?.offsetWidth ?? 0);
      metaW = items.current.map(li => li?.querySelector<HTMLElement>('.it-line')?.offsetWidth ?? 0);
      dirty = true;
    };

    const mediaSize = (ar: number): [number, number] => {
      const maxW = g.narrow ? g.W - 64 : g.W * 0.56;
      const maxH = g.H * (ar < 1 ? 0.5 : 0.42);
      const h = Math.min(maxH, maxW / ar);
      return [h * ar, h];
    };

    const top = () => (work.current?.offsetTop ?? 0);
    const target = () => clamp((scrollY - top()) / g.STEP, 0, N - 1);
    const go = (i: number, immediate = false) => {
      const y = top() + clamp(i, 0, N - 1) * g.STEP;
      if (lenis.current) lenis.current.scrollTo(y, { duration: 1.1, immediate, force: true });
      else scrollTo({ top: y, behavior: immediate || calm ? 'auto' : 'smooth' });
    };
    api.current = { go };

    // ---- per-frame render ----
    const t0 = performance.now();
    let shown = 0, prevShown = 0, lastSub = 0, lastT = t0, raf = 0;
    const px = { x: 0, y: 0, tx: 0, ty: 0, on: false };

    const render = (introE: number) => {
      const w: number[] = [], mh: number[] = [], mw: number[] = [], size: number[] = [];
      for (let i = 0; i < N; i++) {
        const x = Math.max(0, 1 - Math.abs(i - shown));
        w[i] = x * x * (3 - 2 * x);
        const [sw, sh] = mediaSize(ars[i]);
        mw[i] = sw * w[i];
        mh[i] = sh * w[i];
        size[i] = g.ROW + mh[i] + w[i] * (g.narrow ? 60 : 40);
      }
      // stack along the arc: each item takes its own height, the focused one is tall
      const GAP = g.narrow ? 26 : 32, pos = [0];
      for (let i = 1; i < N; i++) pos[i] = pos[i - 1] + (size[i - 1] + size[i]) / 2 + GAP;
      const k = clamp(Math.floor(shown), 0, N - 1), f = clamp(shown - k, -3, 1);
      const P = k + 1 < N ? pos[k] + f * (pos[k + 1] - pos[k]) : pos[k] + f * (pos[k] - pos[k - 1] || 0);
      const polys: Pt[][] = [];

      for (let i = 0; i < N; i++) {
        const li = items.current[i], md = medias.current[i], mt = metas.current[i], tk = ticks.current[i];
        if (!li || !md || !mt || !tk) continue;
        const th = (pos[i] - P) / g.R;
        const deg = Math.abs(th) * 57.3;
        const fade = clamp(1 - (deg - (g.narrow ? 24 : 34)) / (g.narrow ? 30 : 38), 0, 1) * introE;
        const dim = 0.28 + 0.72 * Math.max(w[i], 1 - Math.min(1, Math.abs(i - shown) / 5));
        const x = g.CX - g.R * Math.cos(th), y = g.CY + g.R * Math.sin(th);
        li.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${(-th).toFixed(4)}rad) translate(-100%, -50%)`;
        li.style.opacity = (fade * dim).toFixed(3);
        li.style.visibility = fade > 0.001 ? 'visible' : 'hidden';
        md.style.width = `${mw[i].toFixed(1)}px`;
        md.style.height = `${mh[i].toFixed(1)}px`;
        md.style.marginBottom = `${(w[i] * 16).toFixed(1)}px`;
        mt.style.opacity = String(Math.max(0, w[i] * 2.2 - 1.2));
        const c = Math.cos(th), s = Math.sin(th), r0 = g.R - 44, r1 = r0 - 6 - w[i] * 10;
        tk.setAttribute('x1', (g.CX - r0 * c).toFixed(1));
        tk.setAttribute('y1', (g.CY + r0 * s).toFixed(1));
        tk.setAttribute('x2', (g.CX - r1 * c).toFixed(1));
        tk.setAttribute('y2', (g.CY + r1 * s).toFixed(1));
        tk.style.opacity = String(fade * (0.35 + 0.65 * w[i]));
        // this item's exact rotated box, as an obstacle for the text
        if (fade > 0.05) {
          const left = Math.max(rowW[i], mw[i], w[i] > 0.05 ? Math.min(metaW[i], g.W) : 0);
          const hh = (g.ROW + mh[i] + w[i] * 40) / 2;
          const ca = Math.cos(-th), sa = Math.sin(-th);
          polys.push(([[-left, -hh], [34, -hh], [34, hh], [-left, hh]] as Pt[]).map(([lx, ly]) => [x + lx * ca - ly * sa, y + lx * sa + ly * ca] as Pt));
        }
      }
      flow.draw(polys, pointer.on ? [{ x: pointer.x, y: pointer.y, r: 64 }] : [], shown * 38, introE);
      const now = clamp(Math.round(shown), 0, N - 1);
      if (now !== focusRef.current) { focusRef.current = now; setFocus(now); onFocusRef.current?.(now); }
    };

    const loop = (t: number) => {
      const dt = Math.max(1, t - lastT) / 1000;
      lastT = t;
      const introE = calm ? 1 : outQuart((t - t0) / 1700);
      shown = target() - (1 - introE) * 2.6; // the dial spins up into place on load
      if (shown !== prevShown || dirty) {
        render(introE);
        // tick on every quarter-project; faster scroll = faster ticks
        const sub = Math.floor(shown * 4 + 0.5);
        if (introE === 1 && sub !== lastSub) tick(sub % 4 === 0, Math.abs(shown - prevShown) / dt);
        lastSub = sub;
        prevShown = shown;
        dirty = false;
      }
      // "View" pill eases after the cursor
      if (pill.current) {
        px.x += (px.tx - px.x) * 0.22;
        px.y += (px.ty - px.y) * 0.22;
        pill.current.style.transform = `translate3d(${px.x.toFixed(1)}px, ${px.y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${px.on ? 1 : 0.5})`;
      }
      raf = requestAnimationFrame(loop);
    };

    // settle on the nearest project once the scroll comes to rest
    let snapTimer = 0;
    const onScroll = () => {
      if (scrollY > top() + 4) setScrolled(true);
      clearTimeout(snapTimer);
      snapTimer = window.setTimeout(() => {
        if (pausedRef.current) return;
        const tp = target(), r = Math.round(tp);
        if (scrollY >= top() - 2 && Math.abs(tp - r) > 0.004) go(r);
      }, 140);
    };
    const onKey = (e: KeyboardEvent) => {
      if (pausedRef.current) return;
      if (e.key === 'ArrowDown' || e.key === 'j') { e.preventDefault(); go(focusRef.current + 1); }
      if (e.key === 'ArrowUp' || e.key === 'k') { e.preventDefault(); go(focusRef.current - 1); }
    };
    const onMove = (e: PointerEvent) => {
      px.tx = e.clientX;
      px.ty = e.clientY;
      const sr = stage.current!.getBoundingClientRect();
      pointer.x = e.clientX - sr.left; pointer.y = e.clientY - sr.top; pointer.on = true; dirty = true;
      const on = !!(e.target as Element).closest?.('.item.on .it');
      if (on !== px.on) { px.on = on; pill.current?.classList.toggle('on', on); }
      if (!px.x) { px.x = px.tx; px.y = px.ty; }
    };
    const onLeave = () => { px.on = false; pill.current?.classList.remove('on'); pointer.on = false; dirty = true; };
    // phones fire resize when the URL bar slides; only re-park on a real width change inside the wheel
    let lastW = innerWidth;
    const onResize = () => {
      const i = focusRef.current, inWheel = scrollY >= top() - 2, widthChanged = innerWidth !== lastW;
      lastW = innerWidth;
      layout();
      if (inWheel && widthChanged) go(i, true);
    };

    layout();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('keydown', onKey);
    addEventListener('resize', onResize);
    stage.current!.addEventListener('pointermove', onMove);
    stage.current!.addEventListener('pointerleave', onLeave);
    document.fonts?.ready.then(layout);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(snapTimer);
      removeEventListener('scroll', onScroll);
      removeEventListener('keydown', onKey);
      removeEventListener('resize', onResize);
    };
  }, [api, lenis]);

  return (
    <main className="work" id="work" ref={work}>
      <div className="stage" ref={stage}>
        <canvas className="flow" ref={flowCv} aria-hidden="true" />
        <svg className="dial" aria-hidden="true">
          <circle ref={circle} pathLength={1} />
          {PROJECTS.map((p, i) => <line key={p.slug} ref={el => { ticks.current[i] = el; }} className={i === focus ? 'on' : ''} />)}
        </svg>
        <ol className="wheel" aria-label="Projects">
          {PROJECTS.map((p, i) => (
            <li key={p.slug} ref={el => { items.current[i] = el; }} className={`item${i === focus ? ' on' : ''}`}>
              <button
                className="it"
                aria-label={`${p.title} — ${p.cat}, ${p.year}`}
                onClick={() => (i === focus ? onOpen(p.slug) : api.current?.go(i))}
                onFocus={() => { if (i !== focusRef.current) api.current?.go(i); }}
              >
                <span className="it-media" ref={el => { medias.current[i] = el; }}>
                  <Slot m={p.cover} alt={p.title} fill active={i === focus && !paused} />
                </span>
                <span className="it-row">
                  <span className="it-tag">{p.cat} · {p.year}</span>
                  <span className="it-title">{p.title}</span>
                  <span className="it-n">{pad(i + 1)}</span>
                </span>
                <span className="it-meta" ref={el => { metas.current[i] = el; }}>
                  <span className="it-line">{p.line}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
        <p className="count" aria-hidden="true"><span>{pad(focus + 1)}</span> / {pad(N)}</p>
        <p className={`hint${scrolled ? ' gone' : ''}`} aria-hidden="true"><i />Scroll</p>
        <span className="pill" ref={pill} aria-hidden="true">View</span>
      </div>
      <div className="track" />
    </main>
  );
}
