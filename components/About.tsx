'use client';

import { useEffect } from 'react';
import { setLook } from './Providers';

const SERVICES: [string, string][] = [
  ['Editing', 'Premiere Pro, DaVinci Resolve, After Effects'],
  ['Photography', 'Product, model, fashion'],
  ['Development', 'Full-stack: Next.js, React, Node, three.js'],
  ['3D', 'Blender'],
  ['Automation', 'Python, n8n, AI scripting'],
  ['Brand', 'Identity, logo motion'],
];

export default function About() {
  useEffect(() => { setLook('#0d0d0d', '#f1f1ee'); }, []);

  return (
    <article className="about">
      <p className="about-lead">
        I edit film, photograph product and fashion, and build websites end to end. Most of my work sits where those
        three meet: a shoot that becomes an edit that becomes a site, with the slow parts automated.
      </p>
      <dl className="about-list">
        {SERVICES.map(([k, v], i) => (
          <div key={k} style={{ '--k': i } as React.CSSProperties}><dt>{k}</dt><dd>{v}</dd></div>
        ))}
      </dl>
      <p className="about-contact">
        <span>Contact</span>
        <a href="mailto:krishnasingh8250172@gmail.com">krishnasingh8250172@gmail.com</a>
        <span>Surat, India</span>
      </p>
    </article>
  );
}
