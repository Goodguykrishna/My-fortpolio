// Every project. Order here = order in the home column (main work) and on the Lab page (lab: true).
// A media src that doesn't exist yet renders as a placeholder printing its path: drop the file in and it shows.

export type Media =
  | { type: 'img'; src: string; ar?: string }
  | { type: 'video'; src: string; ar?: string; sound?: boolean }
  | { type: 'live'; src: string; ar?: string };

export type Study = { challenge: string; approach: string[]; built: string[]; outcome: string };

export type Project = {
  slug: string;
  title: string;
  cat: 'Web' | 'WebGL' | 'Photography' | 'Motion' | '3D' | 'Brand';
  year: number;
  ar: string;
  line: string;
  role: string;
  tags: string;
  bg: string; // the colour the whole page turns
  fg: string;
  live?: string;
  lab?: boolean; // shown on the Lab page instead of the home column
  study: Study;
  cover: Media;
  media: Media[];
};

const imgs = (dir: string, ar = '16/10') =>
  [1, 2, 3, 4].map(n => ({ type: 'img' as const, src: `/images/${dir}/0${n}.jpg`, ar }));
const still = (n: number) => `/media/stills/${String(n).padStart(2, '0')}.jpg`;
const live = (name: string) => `/work/${name}.html?bare`;

export const PROJECTS: Project[] = [
  {
    slug: 'vara', title: 'VÄRA', cat: 'Web', year: 2026, ar: '16/10',
    line: 'Storefront for a garment house with no seasons.',
    role: 'Design, development', tags: 'Fashion, E-commerce', bg: '#d6cfbf', fg: '#1b1a17',
    live: 'https://vara.nulllab.in',
    study: {
      challenge: 'VÄRA makes garments without a calendar: no drops, no seasons, small fixed runs. Commerce interfaces are built for the opposite, fifty-two micro-seasons a year of new-in badges, countdown timers and restock alerts. Using that language would have contradicted the brand on every page.',
      approach: [
        'Pace the site like the supply chain. The looks sit on one rail that advances with the scroll, walked at the visitor’s speed rather than pushed at them.',
        'State scarcity once, as a fact: the run size. Nothing on the site counts down.',
        'Collapse the catalogue and the product page into one view, so browsing never feels like being funnelled.',
        'Make the material the campaign. The cloth names run as a marquee and the factories are named on the site, not just on the label.',
      ],
      built: ['The Rail: eight looks on one horizontal run, four in view', 'Catalogue and product page as a single page', 'Materials marquee', 'Named factories and run sizes', 'Footer with the index, a Lisboa address and a live local clock'],
      outcome: 'A storefront whose structure says what the brand says. The seasonless claim survives contact with the interface, because nothing on it behaves like a sale.',
    },
    cover: { type: 'img', src: '/images/vara/cover.jpg' },
    media: imgs('vara'),
  },
  {
    slug: 'ananta', title: 'ANANTA', cat: 'Web', year: 2026, ar: '16/10',
    line: 'Website for a wedding film studio that never stages a moment.',
    role: 'Design, development, motion', tags: 'Weddings, Film', bg: '#5e1616', fg: '#f3e6d4',
    live: 'https://ananta.nulllab.in',
    study: {
      challenge: 'ANANTA films weddings without staging anything. A standard portfolio gallery treats every frame as interchangeable and reduces each wedding to highlights, which is the exact opposite of what the studio promises.',
      approach: [
        'Let the interaction argue what the copy claims. The hero film is driven by scroll position: it runs as you scroll and rests on a photograph when you stop, so it never autoplays at the visitor.',
        'Hand the viewer the playhead. Every film is scrubbed by dragging instead of pressing play.',
        'Give each wedding its own editorial page with its place and year, instead of pooling frames into a shared gallery.',
        'Set Devanagari alongside Latin, because the families and the films live in both.',
      ],
      built: ['Scroll-driven hero film', 'Drag-to-scrub player on every film', 'Twelve weddings documented in full', 'Bilingual type marquee', 'A phone layout where the film still fills the screen'],
      outcome: 'An archive that holds a real, unposed day without tidying it. Each photograph appears at the size it was made for, not as a thumbnail.',
    },
    cover: { type: 'img', src: '/images/ananta/cover.jpg' },
    media: imgs('ananta'),
  },
  {
    slug: 'musee-centennial', title: 'Musée Centennial', cat: 'Web', year: 2026, ar: '16/10',
    line: 'A century of graphic design, rebuilt in the browser.',
    role: 'Creative direction, design, development', tags: 'Culture, Design history', bg: '#e5402b', fg: '#111111',
    live: 'https://musee.nulllab.in',
    study: {
      challenge: 'A hundred years of graphic design is usually shown as a wall of scans. A scan shows what a poster looked like and nothing about how it was built, and for design history the construction is the whole subject.',
      approach: [
        'Rebuild the posters instead of photographing them: Lissitzky’s wedge, Bayer’s alphabet, Cassandre’s Nord Express, all reconstructed in markup. Rebuilding forces the original decisions back into view, the grid, the diagonal, the two-colour limit.',
        'Make each decade a hall built in that decade’s visual language, so the page argues its subject instead of describing it.',
        'Credit every piece explicitly as “after” its original designer.',
      ],
      built: ['Posters reconstructed in HTML and CSS, never scanned', 'One typographic voice per decade', 'A decade scrubber pinned at the foot', 'A phone layout where the specimen row stays a horizontal run'],
      outcome: 'An exhibition made of live type and geometry. Every piece stays sharp at any zoom, and the whole century weighs almost nothing to load.',
    },
    cover: { type: 'img', src: '/images/musee/cover.jpg' },
    media: imgs('musee'),
  },
  {
    slug: 'showreel', title: 'Showreel', cat: 'Motion', year: 2026, ar: '16/9',
    line: 'The next edit lands here.',
    role: 'Edit, colour, sound', tags: 'Film, Edit', bg: '#111111', fg: '#f1f1ee',
    study: {
      challenge: 'Space reserved for the next reel.',
      approach: ['Add the edit at public/images/reel/reel.mp4 and a still at public/images/reel/cover.jpg.'],
      built: ['Premiere Pro, DaVinci Resolve, After Effects'],
      outcome: 'Coming soon.',
    },
    cover: { type: 'img', src: '/images/reel/cover.jpg' },
    media: [{ type: 'video', src: '/images/reel/reel.mp4', ar: '16/9', sound: true }],
  },
  {
    slug: 'rings-on-hand', title: 'Rings, on hand', cat: 'Photography', year: 2026, ar: '4/5',
    line: 'Halo ring, photographed on hand in soft daylight.',
    role: 'Photography', tags: 'Jewellery, Photography', bg: '#a7ae98', fg: '#141612',
    study: {
      challenge: 'On-model jewellery shots tend to look staged: a stiff hand placed in the middle of a frame. The brief was a halo ring that reads as worn, not displayed.',
      approach: [
        'Shoot in daylight, with no studio setup, so the skin and metal stay true.',
        'Direct gestures rather than poses: resting, tucked into the arm, running through hair, touching the collar.',
        'Keep the wardrobe quiet. The sage shirt gives the stone something calm to sit against.',
      ],
      built: ['Six selects', 'Shot RAW on Canon', 'Framed for product pages and social'],
      outcome: 'A set that works as a product page and as social posts without a reshoot.',
    },
    cover: { type: 'img', src: still(9) },
    media: [6, 7, 8, 9, 10, 11].map(n => ({ type: 'img' as const, src: still(n), ar: '2/3' })),
  },
  {
    slug: 'shelfmark', title: 'Shelfmark', cat: 'Web', year: 2026, ar: '16/10',
    line: 'B2B sourcing platform that vouches for the factory.',
    role: 'Design, full-stack development', tags: 'Manufacturing, B2B', bg: '#c8a674', fg: '#1d1913',
    study: {
      challenge: 'Brand founders, procurement teams and importers come to sourcing with the same fear. It isn’t price; it’s not knowing who is actually making their product, or what they will be committed to before they find out.',
      approach: [
        'Put the factory first. Every product leads back to the maker behind it.',
        'Show cost and minimum order quantity early, so nobody discovers the commitment at the quote stage.',
        'Make the request for quote the end of a clear path, not a contact form.',
      ],
      built: ['Industry index', 'Maker listings and profiles', 'Product pages with drawings and MOQ', 'An RFQ flow for desktop and phone', 'Next.js, Prisma, Tailwind'],
      outcome: 'One path from “what do I need made” to a quote, with the maker visible at every step.',
    },
    cover: { type: 'img', src: '/images/shelfmark/cover.jpg' },
    media: imgs('shelfmark'),
  },
  {
    slug: 'studs-in-the-dark', title: 'Studs, in the dark', cat: 'Photography', year: 2026, ar: '4/5',
    line: 'Diamond studs lit low so the fire does the work.',
    role: 'Photography', tags: 'Jewellery, Photography', bg: '#0b0b0b', fg: '#ececec',
    study: {
      challenge: 'Small stones vanish in flat, even light. They read as grey dots instead of diamonds.',
      approach: [
        'Shoot on a black surface in low light and expose for the stone, not the scene.',
        'Let the reflections and the spectral flare stay in frame instead of cleaning them out.',
        'Finish with the presentation box, so the set runs from detail to packaging.',
      ],
      built: ['Six selects', 'Shot RAW on Canon', 'Detail, pair and packaging frames'],
      outcome: 'The fire carries the image. Each frame reads as a diamond at thumbnail size.',
    },
    cover: { type: 'img', src: still(1) },
    media: [0, 1, 2, 3, 4, 5].map(n => ({ type: 'img' as const, src: still(n), ar: '2/3' })),
  },
  {
    slug: 'jewellery-in-motion', title: 'Jewellery in motion', cat: 'Motion', year: 2026, ar: '16/9',
    line: 'Product b-roll at 50p, slowed to half speed.',
    role: 'Camera, edit', tags: 'Jewellery, Film', bg: '#e8e3db', fg: '#151515',
    study: {
      challenge: 'Product video for rings, studs and pendants needs movement that feels handled, not mechanical, and it has to cut cleanly into reels.',
      approach: [
        'Shoot everything at 50 frames a second so any move can drop to half speed without a stutter.',
        'Keep hands in frame: fastening a clasp, turning a stud, stacking a ring.',
        'Conform to 25p in the edit, giving every shot a slow-motion option.',
      ],
      built: ['1080p50 capture, conformed to 25p', 'Four selects', 'Cut-ready lengths for reels'],
      outcome: 'A library of b-roll that drops straight into social edits.',
    },
    cover: { type: 'video', src: '/media/clips/stack.mp4' },
    media: ['stack', 'ear', 'studs', 'pendant'].map(c => ({ type: 'video' as const, src: `/media/clips/${c}.mp4`, ar: '16/9' })),
  },
  {
    slug: 'rota', title: 'ROTA', cat: 'Brand', year: 2026, ar: '4/5',
    line: 'Concept identity and logo sting for a coffee roaster.',
    role: 'Identity, motion', tags: 'Coffee, Identity', bg: '#c0472a', fg: '#efe5d4',
    study: {
      challenge: 'A concept identity for a coffee roaster. It had to read on a cup lid, a bag and a screen, and come alive in motion.',
      approach: [
        'Build the mark on a single arc, so it holds at small sizes.',
        'Keep three colourways only: bone, ember and ink.',
        'Animate the mark as a three-second sting, built in Resolve Fusion.',
      ],
      built: ['Mark, wordmark and lockups', 'Letter set', 'Three colourways', 'Logo sting, 1080 × 1920'],
      outcome: 'A small system that stays recognisable from a cup lid to a reel.',
    },
    cover: { type: 'img', src: '/media/rota/sheet.png' },
    media: [{ type: 'img', src: '/media/rota/sheet.png', ar: '4/5' }, { type: 'video', src: '/media/rota/stinger.mp4', ar: '9/16' }],
  },
  {
    slug: 'bloom', title: 'Bloom', cat: '3D', year: 2026, ar: '9/16',
    line: 'A procedural flower on a loop.',
    role: '3D, render', tags: 'Nature, 3D', bg: '#d5dcea', fg: '#1e296a',
    study: {
      challenge: 'A short loop that feels organic but is built entirely from rules.',
      approach: ['Model the petals, stem and gradient procedurally in Blender.', 'Time the motion so the loop runs continuously.'],
      built: ['42-second loop', 'Procedural Blender setup'],
      outcome: 'A loop that reads as grown rather than modelled.',
    },
    cover: { type: 'video', src: '/media/clips/bloom.mp4' },
    media: [{ type: 'video', src: '/media/clips/bloom.mp4', ar: '9/16' }],
  },
  {
    slug: 'dragon', title: 'Dragon', cat: '3D', year: 2026, ar: '16/9',
    line: 'Creature look development, lit like a film still.',
    role: '3D, lighting, render', tags: 'Fantasy, 3D', bg: '#121720', fg: '#e3693b',
    study: {
      challenge: 'Look development for a creature: making a model read as a film still rather than a render test.',
      approach: ['Model, texture and light the creature in Blender.', 'Light for mood first, then detail: a cold key, a warm glow from the mouth.'],
      built: ['Five renders: hero, wings, head, maw, menace'],
      outcome: 'A set of stills that reads like frames from a film.',
    },
    cover: { type: 'img', src: '/media/clips/dragon-hero.jpg' },
    media: ['hero', 'wings', 'head', 'maw', 'menace'].map(r => ({ type: 'img' as const, src: `/media/clips/dragon-${r}.jpg`, ar: '16/9' })),
  },

  // ---------- Lab: experiments, off the main column ----------
  {
    slug: 'kintsugi', title: 'Kintsugi', cat: 'WebGL', year: 2026, ar: '16/10', lab: true,
    line: 'A bowl that breaks and mends in gold, in real time.',
    role: 'Concept, shaders, three.js', tags: 'Craft, Experiment', bg: '#16130f', fg: '#d7b46a',
    study: { challenge: 'Kintsugi repairs broken pottery with lacquer and gold and never hides the fracture.', approach: ['Simulate the break and the gold repair live in the browser.'], built: ['Custom GLSL on three.js', 'Drag to turn, tap to strike'], outcome: 'First in a series of four WebGL pieces.' },
    cover: { type: 'live', src: live('kintsugi') },
    media: [{ type: 'live', src: live('kintsugi'), ar: '16/10' }],
  },
  {
    slug: 'brilliant-cut', title: 'Brilliant Cut', cat: 'WebGL', year: 2026, ar: '16/10', lab: true,
    line: 'A round brilliant you can turn in your hand.',
    role: 'Concept, shaders, three.js', tags: 'Jewellery, Experiment', bg: '#0e1220', fg: '#dce5f4',
    study: { challenge: 'The stone has no colour of its own; it separates what is already in the light.', approach: ['Write the refraction and dispersion as shaders.'], built: ['Refraction and dispersion in GLSL', 'Six-prong solitaire setting'], outcome: 'Second in the series.' },
    cover: { type: 'live', src: live('brilliant-cut') },
    media: [{ type: 'live', src: live('brilliant-cut'), ar: '16/10' }],
  },
  {
    slug: 'slime-mould', title: 'Slime Mould', cat: 'WebGL', year: 2026, ar: '16/10', lab: true,
    line: 'One cell, no neurons, solving a maze.',
    role: 'Concept, simulation, three.js', tags: 'Science, Experiment', bg: '#e6d24a', fg: '#19190f',
    study: { challenge: 'Physarum finds the shortest path to food without a brain.', approach: ['Thousands of agents leave trails and follow one another until a network appears.'], built: ['Agent simulation on the GPU', 'Trails, diffusion, decay'], outcome: 'Third in the series.' },
    cover: { type: 'live', src: live('slime-mould') },
    media: [{ type: 'live', src: live('slime-mould'), ar: '16/10' }],
  },
  {
    slug: 'containment', title: 'Containment', cat: 'WebGL', year: 2026, ar: '16/10', lab: true,
    line: 'Something in the glass that will not be held.',
    role: 'Concept, shaders, three.js', tags: 'Experiment, Interaction', bg: '#0c1317', fg: '#bdd2da',
    study: { challenge: 'A shape pressed against its container.', approach: ['Press on it and it presses back.'], built: ['Pointer-driven interaction', 'Custom glass shader'], outcome: 'Fourth in the series.' },
    cover: { type: 'live', src: live('containment') },
    media: [{ type: 'live', src: live('containment'), ar: '16/10' }],
  },
  {
    slug: 'paper-puja', title: 'Paper Puja', cat: 'Motion', year: 2026, ar: '9/16', lab: true,
    line: 'A festive short, built from cut paper.',
    role: 'Animation, edit', tags: 'Festival, Animation', bg: '#a81d1a', fg: '#fbe6c2',
    study: { challenge: 'A festive vertical short in a paper-cut world.', approach: ['Grain, garlands and lamps that breathe, cut to the music.'], built: ['27 seconds, 1080 × 1920'], outcome: 'An animation experiment.' },
    cover: { type: 'video', src: '/media/clips/puja.mp4' },
    media: [{ type: 'video', src: '/media/clips/puja.mp4', ar: '9/16', sound: true }],
  },
];

export const WORK = PROJECTS.filter(p => !p.lab);
export const LAB = PROJECTS.filter(p => p.lab);
export const CATS = ['All', ...Array.from(new Set(PROJECTS.map(p => p.cat)))] as const;
export const indexOf = (slug: string) => PROJECTS.findIndex(p => p.slug === slug);
export const ratio = (ar = '16/10') => { const [w, h] = ar.split('/').map(Number); return w / h; };
export const pad = (n: number) => String(n).padStart(2, '0');

// real images only, for the preloader flicker
export const FLICKER = ['09', '01', '03', '06', '10', '04'].map(n => `/media/stills/${n}.jpg`)
  .concat(['dragon-hero', 'stack', 'bloom', 'ear', 'dragon-maw', 'pendant', 'studs'].map(n => `/media/clips/${n}.jpg`), '/media/rota/sheet.png');
