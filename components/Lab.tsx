'use client';

import { useEffect, useRef, useState } from 'react';
import { LAB, pad } from '@/lib/projects';
import { setLook, useSite } from './Providers';
import Slot from './Slot';

// Experiments that sit off the main column: WebGL pieces and motion tests.
export default function Lab() {
  const { navigate } = useSite();
  const [hover, setHover] = useState<number | null>(null);
  const peek = useRef<HTMLDivElement>(null);

  useEffect(() => { setLook('#ececea', '#0d0d0d'); }, []);

  const move = (e: React.PointerEvent) => {
    if (peek.current) peek.current.style.transform = `translate3d(${e.clientX + 28}px, ${e.clientY - 90}px, 0)`;
  };

  return (
    <article className="lab" onPointerMove={move}>
      <header className="lab-head">
        <h1>Lab</h1>
        <p>Experiments: real-time WebGL, shaders and motion tests. Each one runs live.</p>
      </header>
      <ol className="lab-list">
        {LAB.map((p, i) => (
          <li key={p.slug} style={{ '--k': i } as React.CSSProperties}>
            <a
              href={`/work/${p.slug}/`}
              onClick={e => { e.preventDefault(); navigate(`/work/${p.slug}/`, { bg: p.bg, fg: p.fg }); }}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(null)}
            >
              <span className="lab-n">{pad(i + 1)}</span>
              <span className="lab-title">{p.title}</span>
              <span className="lab-tags">{p.tags}</span>
              <span className="lab-year">{p.year}</span>
            </a>
          </li>
        ))}
      </ol>
      <div className={`lab-peek${hover !== null ? ' on' : ''}`} ref={peek} aria-hidden="true">
        {hover !== null && <Slot key={hover} m={{ ...LAB[hover].cover, ar: '16/10' }} active />}
      </div>
    </article>
  );
}
