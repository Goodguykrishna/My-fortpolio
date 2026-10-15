'use client';

import { useRef, useState } from 'react';
import { CATS, PROJECTS, pad } from '@/lib/projects';
import Slot from './Slot';

export default function IndexPanel({ open, onPick }: { open: boolean; onPick: (i: number) => void }) {
  const [cat, setCat] = useState<string>('All');
  const [hover, setHover] = useState<number | null>(null);
  const peek = useRef<HTMLDivElement>(null);
  const rows = PROJECTS.map((p, i) => ({ p, i })).filter(({ p }) => cat === 'All' || p.cat === cat);

  // a small preview of the cover floats beside the cursor
  const move = (e: React.PointerEvent) => {
    if (peek.current) peek.current.style.transform = `translate3d(${e.clientX + 24}px, ${e.clientY - 60}px, 0)`;
  };

  return (
    <section className={`index${open ? ' open' : ''}`} aria-hidden={!open} data-lenis-prevent onPointerMove={move}>
      <div className="index-filters" role="tablist" aria-label="Filter">
        {CATS.map(c => (
          <button key={c} role="tab" aria-selected={cat === c} onClick={() => setCat(c)} tabIndex={open ? 0 : -1}>
            {c}<sup>{c === 'All' ? PROJECTS.length : PROJECTS.filter(p => p.cat === c).length}</sup>
          </button>
        ))}
      </div>
      <ol className="index-list">
        {rows.map(({ p, i }, k) => (
          <li key={p.slug} style={{ '--k': k } as React.CSSProperties}>
            <button
              onClick={() => onPick(i)}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(null)}
              tabIndex={open ? 0 : -1}
            >
              <span className="ix-n">{pad(i + 1)}</span>
              <span className="ix-title">{p.title}</span>
              <span className="ix-cat">{p.cat}</span>
              <span className="ix-year">{p.year}</span>
            </button>
          </li>
        ))}
      </ol>
      <div className={`index-peek${hover !== null && PROJECTS[hover].cover.type !== 'live' ? ' on' : ''}`} ref={peek} aria-hidden="true">
        {hover !== null && PROJECTS[hover].cover.type !== 'live' && (
          <Slot key={hover} m={{ ...PROJECTS[hover].cover, ar: PROJECTS[hover].ar }} active />
        )}
      </div>
    </section>
  );
}
