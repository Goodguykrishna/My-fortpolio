'use client';

import { useEffect, useRef, useState } from 'react';
import { startZombie } from '@/lib/zombie';
import { startRoam } from '@/lib/roam';

// one discipline at a time: whatever matches the project in view
const SKILL: Record<string, [string, string]> = {
  Web: ['Development', 'Full-stack — Next.js, React, Node, Python, n8n'],
  WebGL: ['Creative coding', 'three.js, GLSL, WebGL'],
  Photography: ['Photography', 'Product, model, fashion'],
  Motion: ['Editing', 'Premiere Pro, DaVinci Resolve, After Effects'],
  '3D': ['3D', 'Blender'],
  Brand: ['Brand', 'Identity, logo motion'],
};

const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });

export default function Info({ onHome, cat }: { onHome: () => void; cat: string }) {
  const [label, tools] = SKILL[cat] ?? SKILL.Web;
  const [time, setTime] = useState('');
  const cv = useRef<HTMLCanvasElement>(null);
  const yard = useRef<HTMLDivElement>(null);
  const bubble = useRef<HTMLSpanElement>(null);
  const roam = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    // on big screens it can escape and roam the page's text
    const roams = !calm && matchMedia('(min-width: 900px) and (hover: hover)').matches;
    let endRoam: (() => void) | null = null;
    const z = startZombie(cv.current!, yard.current!, bubble.current!, {
      delay: 1.1, calm,
      onEscape: roams ? at => { endRoam = startRoam(roam.current!, at, () => { endRoam = null; z.comeHome(); }); } : undefined,
    });
    return () => { z.stop(); endRoam?.(); };
  }, []);

  return (
    <aside className="info">
      <div className="info-top">
        <header className="id in" style={{ '--d': 0 } as React.CSSProperties}>
          <h1 className="name"><button onClick={onHome}>Krishna Singh</button></h1>
          <p className="role">Editor, Photographer &amp; Developer</p>
        </header>

        <p className="bio in" style={{ '--d': 1 } as React.CSSProperties}>
          Video editor, photographer and full-stack developer based in Surat, India. I work with brands across
          editing, product and fashion photography, and the web, and build the automation that keeps production moving.
        </p>

        <div className="focus in" style={{ '--d': 2 } as React.CSSProperties} aria-live="polite">
          <h2>Now showing</h2>
          <p key={label} className="focus-skill"><span>{label}</span>{tools}</p>
        </div>
      </div>

      <div className="info-bottom">
        <section className="contact in" style={{ '--d': 3 } as React.CSSProperties}>
          <h2>Contact</h2>
          <a href="mailto:krishnasingh8250172@gmail.com">krishnasingh8250172@gmail.com</a>
          <p>Surat, India <span aria-hidden="true">·</span> <span className="clock">{time || '--:--'}</span> IST</p>
        </section>
        <div className="yard" ref={yard} aria-label="A pixel zombie. Click it for a trick.">
          <canvas ref={cv} />
          <span className="bubble" ref={bubble} aria-hidden="true" />
        </div>
        <canvas className="roam" ref={roam} aria-hidden="true" />
      </div>
    </aside>
  );
}
