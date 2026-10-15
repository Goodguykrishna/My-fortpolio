'use client';

import { useEffect, useRef, useState } from 'react';
import type { Media } from '@/lib/projects';

type Props = { m: Media; alt?: string; fill?: boolean; inCase?: boolean; active?: boolean };

// Shows the file, or a placeholder that prints the path it wants until the file exists.
export default function Slot({ m, alt = '', fill = false, inCase = false, active = true }: Props) {
  const [empty, setEmpty] = useState(false);
  const [liveOn, setLiveOn] = useState(inCase);
  const img = useRef<HTMLImageElement>(null);
  const vid = useRef<HTMLVideoElement>(null);

  // an image that 404'd before hydration never fires onError, so check once mounted
  useEffect(() => {
    const el = img.current;
    if (el && el.complete && el.naturalWidth === 0) setEmpty(true);
  }, []);

  useEffect(() => {
    if (inCase) return;
    if (m.type === 'video' && vid.current) {
      if (active) vid.current.play().catch(() => {});
      else vid.current.pause();
    }
    if (m.type === 'live') {
      if (!active) { setLiveOn(false); return; }
      const t = setTimeout(() => setLiveOn(true), 450); // wait until the wheel settles
      return () => clearTimeout(t);
    }
  }, [active, inCase, m.type]);

  const cls = ['slot', fill && 'fill', m.type === 'live' && 'live', empty && 'empty', liveOn && 'running'].filter(Boolean).join(' ');
  const style = m.ar && !fill ? ({ '--ar': m.ar } as React.CSSProperties) : undefined;

  return (
    <figure className={cls} style={style}>
      <span className="ph">{m.type === 'live' ? 'Live · WebGL' : m.src.replace(/^\//, '')}</span>
      {m.type === 'img' && <img ref={img} src={m.src} alt={alt} onError={() => setEmpty(true)} draggable={false} />}
      {m.type === 'video' && (
        <video
          ref={vid}
          src={m.src}
          poster={m.src.startsWith('/media/clips/') ? m.src.replace(/\.mp4$/, '.jpg') : undefined}
          playsInline loop preload="metadata"
          muted={!(inCase && m.sound)}
          controls={inCase && m.sound}
          autoPlay={inCase && !m.sound}
          onError={() => setEmpty(true)}
        />
      )}
      {m.type === 'live' && liveOn && <iframe src={m.src} title={alt} tabIndex={inCase ? 0 : -1} allow="fullscreen" />}
      {m.type === 'live' && inCase && <a className="full" href={m.src} target="_blank" rel="noopener">Full screen ↗</a>}
    </figure>
  );
}
