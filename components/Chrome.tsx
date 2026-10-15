'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSite } from './Providers';

const fmt = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
const EMAIL = 'krishnasingh8250172@gmail.com';

// what stays on screen across every page: wordmark, nav, clock, grid toggle, sound
export default function Chrome() {
  const { navigate, mode, setMode, sound, toggleSound } = useSite();
  const path = usePathname() ?? '/';
  const home = path === '/';
  const [time, setTime] = useState('');

  // transparent nav slides away while reading down a page, returns on the way back up
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    let last = scrollY;
    const onScroll = () => {
      const y = scrollY;
      if (Math.abs(y - last) > 6) { setHidden(y > last && y > 120); last = y; }
    };
    addEventListener('scroll', onScroll, { passive: true });
    return () => removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => { setHidden(false); }, [path]);

  useEffect(() => {
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, []);

  const go = (href: string) => (e: React.MouseEvent) => { e.preventDefault(); if (href !== path) navigate(href); };

  return (
    <>
      {home && (
        <a href="/" onClick={go('/')} className="mark" aria-label="Krishna Singh — home">
          <span className="mark-in">Krishna Singh<sup>®</sup></span>
        </a>
      )}

      <header className={`top${home ? '' : ' inner'}${hidden ? ' away' : ''}`}>
        {!home && <a href="/" onClick={go('/')} className="top-name">Krishna Singh®</a>}
        <nav className="top-nav" aria-label="Site">
          <a href="/" onClick={go('/')} aria-current={home ? 'page' : undefined}>Work</a>,{' '}
          <a href="/lab/" onClick={go('/lab/')} aria-current={path.startsWith('/lab') ? 'page' : undefined}>Lab</a>,{' '}
          <a href="/about/" onClick={go('/about/')} aria-current={path.startsWith('/about') ? 'page' : undefined}>About</a>
        </nav>
        <span className="top-time">IST {time || '--:--'}</span>
        <a className="top-contact" href={`mailto:${EMAIL}`}>Contact</a>
        {home && (
          <div className="top-blurb">
            <p>Video editor, photographer and full-stack developer in Surat, India. I work with brands on edits,
              product and fashion photography and the web, and build the automation behind them.</p>
            <p><span>Contact</span><br /><a href={`mailto:${EMAIL}`}>{EMAIL}</a></p>
          </div>
        )}
      </header>

      <footer className="foot">
        {home ? (
          <div className="grid-toggle" role="group" aria-label="Layout">
            <button aria-pressed={mode === 'vertical'} onClick={() => setMode('vertical')}>Vertical</button>,{' '}
            <button aria-pressed={mode === 'horizontal'} onClick={() => setMode('horizontal')}>Horizontal</button> Grid
          </div>
        ) : <span />}
        <div className="foot-right">
          <button className={`sound${sound ? ' on' : ''}`} aria-pressed={sound} onClick={toggleSound}>
            <i aria-hidden="true"><b /><b /><b /></i>Sound {sound ? 'on' : 'off'}
          </button>
          <span className="copy">© 2026 Krishna Singh</span>
        </div>
      </footer>
    </>
  );
}
