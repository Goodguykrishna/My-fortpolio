'use client';

import { useEffect } from 'react';
import { LAB, WORK, PROJECTS, indexOf, pad, ratio } from '@/lib/projects';
import { setLook, useSite } from './Providers';
import Slot from './Slot';

// Info pinned on the left, the work running down the right, then the full case study.
export default function CaseStudy({ slug }: { slug: string }) {
  const { navigate, lenis } = useSite();
  const p = PROJECTS[indexOf(slug)];
  const group = p.lab ? LAB : WORK;
  const i = group.indexOf(p);
  const next = group[(i + 1) % group.length];

  useEffect(() => {
    setLook(p.bg, p.fg);
    if (!p.lab) try { sessionStorage.setItem('focus', String(i)); } catch {}
  }, [p, i]);

  const goNext = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/work/${next.slug}/`, { bg: next.bg, fg: next.fg });
  };
  const toStudy = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById('study');
    if (!el) return;
    const l = lenis();
    if (l) l.scrollTo(el, { offset: -80, duration: 1.4 }); else el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <article className="case">
      <div className="case-top">
      <aside className="case-info">
        <span className="case-num">{p.lab ? 'Lab' : 'Work'} {pad(i + 1)}</span>
        <h1>{p.title}</h1>
        <dl>
          <div><dt>Field</dt><dd>{p.tags}</dd></div>
          <div><dt>Role</dt><dd>{p.role}</dd></div>
          <div><dt>Year</dt><dd>{p.year}</dd></div>
        </dl>
        <p className="case-links">
          {p.live && <a href={p.live} target="_blank" rel="noopener">Live website ↗</a>}
          <a href="#study" onClick={toStudy}>Case study ↓</a>
        </p>
        <p className="case-line">{p.line}</p>
      </aside>

      <div className="case-media">
        {p.media.map((m, k) => (
          <div key={m.src + k} className={`case-fig${ratio(m.ar) < 1 ? ' tall' : ''}`} style={{ '--k': k } as React.CSSProperties}>
            <Slot m={m} alt={`${p.title} — ${k + 1}`} inCase />
          </div>
        ))}
      </div>
      </div>

      <section className="study" id="study" aria-label="Case study">
        <h2 className="study-title">Case study</h2>
        <div className="study-row">
          <h3>Challenge</h3>
          <p className="study-lead">{p.study.challenge}</p>
        </div>
        <div className="study-row">
          <h3>Approach</h3>
          <ol className="study-steps">{p.study.approach.map(t => <li key={t}>{t}</li>)}</ol>
        </div>
        <div className="study-row">
          <h3>What I built</h3>
          <ul className="study-built">{p.study.built.map(t => <li key={t}>{t}</li>)}</ul>
        </div>
        <div className="study-row">
          <h3>Outcome</h3>
          <p className="study-lead">{p.study.outcome}</p>
        </div>
        <a className="case-next" href={`/work/${next.slug}/`} onClick={goNext}>
          <span>Next {p.lab ? 'experiment' : 'project'}</span>
          <b>{next.title}</b>
        </a>
      </section>
    </article>
  );
}
