// The zombie gets out. It treats every live line of text on the page as a floor: walks it, jumps
// between lines, bites letters out of words, sheds crumbs that bounce down the page, then goes home.
// Nothing in the DOM is changed: lines and single glyphs are measured with Range rects every few
// frames, and bites are white pixel notches painted over the exact glyph, healing as they fade.

type Plat = { x0: number; x1: number; y: number };
type Bite = { x: number; y: number; r: number; seed: number; t: number };
type Crumb = { x: number; y: number; vx: number; vy: number; t: number; rest: boolean };

const INK = '#0b0b0b', WHITE = '#ffffff';
const U = 3; // CSS px per zombie pixel, same as the yard
const G = 2200, WALK = 70, HEIGHT = 21 * U;
const SOURCES = '.name, .role, .bio, .focus-skill, .contact a, .contact p, .bar-btn, .item.on .it-title, .item.on .it-meta, .count';

export function startRoam(cv: HTMLCanvasElement, from: { x: number; y: number }, done: () => void) {
  (cv as unknown as { __stop?: () => void }).__stop?.();
  const ctx = cv.getContext('2d')!;
  let dpr = 1, W = 0, H = 0;
  const size = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  size();

  // ---- level geometry: the tops of real text lines ----
  let plats: Plat[] = [];
  let textNodes: Text[] = [];
  const scan = () => {
    textNodes = [];
    plats = [];
    document.querySelectorAll(SOURCES).forEach(el => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
        if (!n.data.trim()) continue;
        textNodes.push(n);
        const r = document.createRange();
        r.selectNodeContents(n);
        for (const b of r.getClientRects()) {
          if (b.width < 24 || b.height > 40 || b.bottom < 0 || b.top > H) continue;
          plats.push({ x0: b.left, x1: b.right, y: b.top + b.height * 0.18 });
        }
      }
    });
    plats.push({ x0: 0, x1: W, y: H - 2 }); // the bottom of the screen is a floor too
  };

  // find one real glyph under the mouth, in screen space
  const glyphAt = (x: number, y: number) => {
    let best: DOMRect | null = null, bd = 28;
    for (const n of textNodes) {
      const r = document.createRange();
      for (let i = 0; i < n.data.length; i++) {
        if (n.data[i] === ' ') continue;
        r.setStart(n, i); r.setEnd(n, i + 1);
        const b = r.getBoundingClientRect();
        if (Math.abs(b.top - y) > 10) continue;
        const d = Math.abs(b.left + b.width / 2 - x);
        if (d < bd) { bd = d; best = b; }
      }
    }
    return best;
  };

  // ---- the zombie ----
  const z = { x: from.x, y: from.y, vx: 0, vy: 0, dir: 1, phase: 0, on: null as Plat | null, state: 'walk', t: 0, target: 0, bites: 0, born: performance.now() };
  const bites: Bite[] = [];
  const crumbs: Crumb[] = [];
  let lastScan = 0, raf = 0, stopped = false;
  const rand = (a: number, b: number) => a + Math.random() * (b - a);

  const standing = () => plats.find(p => z.x >= p.x0 - 2 && z.x <= p.x1 + 2 && Math.abs(p.y - z.y) < 3) ?? null;

  // pick a line to jump to: reachable, preferably higher, never the one we're on
  const pickJump = () => {
    const goingHome = z.state === 'home';
    const opts = plats.filter(p => p !== z.on && p.x1 - p.x0 > 30).map(p => {
      const tx = Math.min(p.x1 - 12, Math.max(p.x0 + 12, z.x + rand(-60, 60)));
      const dx = tx - z.x, dy = p.y - z.y;
      return { p, tx, dx, dy };
    }).filter(o => Math.abs(o.dx) < 260 && o.dy > -150 && (goingHome ? o.dy > 0 : o.dy < 160));
    if (!opts.length) return null;
    opts.sort((a, b) => (goingHome ? b.dy - a.dy : a.dy - b.dy) + rand(-60, 60));
    return opts[0];
  };

  const jumpTo = (tx: number, ty: number) => {
    const rise = Math.max(24, z.y - ty + 26);
    const vy = -Math.sqrt(2 * G * rise);
    // time to come down onto ty: solve y = vy t + g t²/2
    const a = G / 2, b = vy, c = z.y - ty;
    const t = (-b + Math.sqrt(Math.max(0, b * b - 4 * a * c))) / (2 * a);
    z.vy = vy; z.vx = (tx - z.x) / Math.max(0.2, t);
    z.dir = Math.sign(z.vx) || z.dir;
    z.on = null; z.state = z.state === 'home' ? 'home' : 'air'; z.t = 0;
  };

  const bite = () => {
    const g = glyphAt(z.x + z.dir * 10, z.y - 12);
    if (!g) return false;
    bites.push({ x: g.left + g.width * rand(0.3, 0.7), y: g.top + g.height * rand(0.2, 0.45), r: Math.max(4, g.height * 0.32), seed: Math.random() * 99, t: 0 });
    for (let i = 0; i < 7; i++) crumbs.push({ x: g.left + g.width / 2, y: g.top + 4, vx: rand(-90, 90), vy: rand(-260, -60), t: 0, rest: false });
    z.bites++;
    return true;
  };

  function update(dt: number, now: number) {
    if (now - lastScan > 160) { scan(); lastScan = now; }
    z.t += dt;
    const overlay = document.querySelector('.case.open, .index.open');
    if (overlay || now - z.born > 32000 || z.bites >= 7) if (z.state !== 'home' && z.state !== 'leave') { z.state = 'home'; z.t = 0; }

    if (z.on) {
      // the line may have scrolled or reflowed under us: stick to it, or fall
      const s = standing() ?? plats.find(p => z.x >= p.x0 && z.x <= p.x1 && Math.abs(p.y - z.y) < 40);
      if (s) { z.y = s.y; z.on = s; } else { z.on = null; }
    }

    if (!z.on) {
      z.vy += G * dt;
      const ny = z.y + z.vy * dt;
      z.x += z.vx * dt;
      if (z.vy > 0) {
        const land = plats.find(p => z.x >= p.x0 && z.x <= p.x1 && z.y <= p.y + 1 && ny >= p.y);
        if (land) { z.y = land.y; z.vy = 0; z.vx = 0; z.on = land; if (z.state === 'air') { z.state = 'walk'; z.t = 0; z.target = rand(land.x0 + 8, land.x1 - 8); } }
        else z.y = ny;
      } else z.y = ny;
      z.phase += dt * 6;
      if (z.y > H + 200) { z.y = H - 2; }
      return;
    }

    const p = z.on;
    switch (z.state) {
      case 'walk': {
        const d = z.target - z.x;
        z.dir = Math.sign(d) || z.dir;
        z.x += Math.sign(d) * Math.min(Math.abs(d), WALK * dt);
        z.phase += dt * 7;
        if (Math.abs(d) < 1) {
          const r = Math.random();
          if (p.y < H - 10 && r < 0.45) { z.state = 'eat'; z.t = 0; }
          else { const j = pickJump(); if (j) jumpTo(j.tx, j.p.y); else z.target = rand(p.x0 + 8, p.x1 - 8); }
        }
        break;
      }
      case 'eat':
        // three chomps, a bite on the second
        if (z.t > 0.45 && z.t - dt <= 0.45 && !bite()) { z.state = 'walk'; z.target = rand(p.x0 + 8, p.x1 - 8); }
        if (z.t > 1.2) { const j = pickJump(); if (j) jumpTo(j.tx, j.p.y); else { z.state = 'walk'; z.target = rand(p.x0 + 8, p.x1 - 8); } }
        break;
      case 'home': {
        if (p.y < H - 10) { const j = pickJump(); if (j) jumpTo(j.tx, j.p.y); else { z.on = null; z.vx = z.dir * 40; } break; }
        const d = from.x - z.x;
        z.dir = Math.sign(d) || z.dir;
        z.x += Math.sign(d) * Math.min(Math.abs(d), WALK * 1.3 * dt);
        z.phase += dt * 9;
        if (Math.abs(d) < 2) { z.state = 'leave'; z.t = 0; }
        break;
      }
      case 'leave': if (z.t > 0.3) finish(); break;
    }
  }

  function crumbsUpdate(dt: number) {
    for (const c of crumbs) {
      c.t += dt;
      if (c.rest) continue;
      c.vy += G * 0.6 * dt;
      const ny = c.y + c.vy * dt;
      c.x += c.vx * dt;
      if (c.vy > 0) {
        const land = plats.find(p => c.x >= p.x0 && c.x <= p.x1 && c.y <= p.y + 1 && ny >= p.y);
        if (land) { c.y = land.y; c.vy *= -0.35; c.vx *= 0.6; if (Math.abs(c.vy) < 40) { c.vy = 0; c.rest = true; } continue; }
      }
      c.y = ny;
    }
    for (let i = crumbs.length - 1; i >= 0; i--) if (crumbs[i].t > 6 || crumbs[i].y > H + 20) crumbs.splice(i, 1);
  }

  // ---- drawing (same fat-pixel language as the yard) ----
  const block = (x: number, y: number, w = 1, h = 1, c = INK) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x * dpr) / dpr, Math.round(y * dpr) / dpr, w * U, h * U); };
  const line = (ax: number, ay: number, bx: number, by: number, w = 2) => {
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / U * 1.5));
    for (let i = 0; i <= n; i++) { const t = i / n; block(ax + (bx - ax) * t - (w * U) / 2, ay + (by - ay) * t - (w * U) / 2, w, w); }
  };

  function drawZombie() {
    const f = z.dir, air = !z.on, ph = z.phase;
    const eating = z.state === 'eat';
    const bob = air ? 0 : Math.abs(Math.sin(ph)) * U * 0.8;
    const hipX = z.x, hipY = z.y - 7 * U - bob;
    const shX = hipX + f * 1.6 * U, shY = hipY - 7 * U;
    const chomp = eating ? (Math.sin(z.t * 18) > 0 ? 1 : 0) : 0;
    const snap = (v: number) => Math.round(v * dpr) / dpr; // face snaps to device pixels as one unit
    const hx = snap(shX + f * (eating ? 4 : 2.5) * U), hy = snap(shY - (eating ? 1 + chomp : 3) * U);
    const s = Math.sin(ph) * (air ? 0 : 1);
    // legs
    if (air) { line(hipX - U, hipY, hipX - f * 2 * U, hipY + 5 * U); line(hipX + U, hipY, hipX + f * 3 * U, hipY + 4 * U); }
    else { line(hipX - U, hipY, hipX + f * s * 2.6 * U - U, z.y); line(hipX + U, hipY, hipX - f * s * 2.6 * U + U, z.y); }
    // torso + torn shirt
    line(hipX, hipY, shX, shY, 4);
    block(hipX + f * U, hipY + U * 0.5, 1, 1, WHITE);
    // arms: straight out, up in the air when jumping
    const ay = air ? -6 * U : (eating ? 3 * U : U);
    line(shX, shY + U, shX + f * 7 * U, shY + ay + U);
    line(shX, shY, shX + f * 8 * U, shY + ay);
    // head with eyes and a chomping mouth
    block(hx - 3 * U, hy - 3 * U, 6, 6);
    block(hx - 2 * U, hy - 4 * U); block(hx, hy - 4 * U); block(hx + U, hy - 5 * U);
    const o = f > 0 ? 0 : -U;
    block(hx + o, hy - U, 1, 1, WHITE);
    block(hx + o + f * 2 * U, hy - U, 1, 2, WHITE);
    block(hx + o, hy + U + chomp * U, 1, 1, WHITE); block(hx + o + f * 2 * U, hy + U + chomp * U, 1, 1, WHITE);
  }

  function drawBites(dt: number) {
    for (let i = bites.length - 1; i >= 0; i--) {
      const b = bites[i];
      b.t += dt;
      const heal = Math.max(0, Math.min(1, (b.t - 9) / 3)); // bites heal after ~9 s
      if (heal >= 1) { bites.splice(i, 1); continue; }
      ctx.globalAlpha = 1 - heal;
      ctx.fillStyle = WHITE;
      // a pixelated tooth-edged notch
      const k = Math.ceil(b.r / 2);
      for (let yy = -k; yy <= k; yy++) for (let xx = -k; xx <= k; xx++) {
        const d = Math.hypot(xx, yy) + (Math.sin(b.seed + xx * 3.1 + yy * 1.7) * 0.6);
        if (d <= k) ctx.fillRect(b.x + xx * 2, b.y + yy * 2, 2, 2);
      }
      ctx.globalAlpha = 1;
    }
  }

  function finish() {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(raf);
    ctx.clearRect(0, 0, W, H);
    removeEventListener('resize', size);
    done();
  }

  let last = performance.now();
  const loop = (now: number) => {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    try { update(dt, now); crumbsUpdate(dt); } catch { finish(); return; }
    ctx.clearRect(0, 0, W, H);
    drawBites(dt);
    for (const c of crumbs) { ctx.globalAlpha = Math.max(0, 1 - Math.max(0, c.t - 4) / 2); ctx.fillStyle = INK; ctx.fillRect(Math.round(c.x), Math.round(c.y) - 2, 2, 2); }
    ctx.globalAlpha = 1;
    drawZombie();
    if (!stopped) raf = requestAnimationFrame(loop);
  };

  if (process.env.NODE_ENV === 'development') Object.assign(window, { __roam: { z, bites, crumbs, plats: () => plats } });
  scan();
  // start with a hop out of the yard onto the nearest line above
  const first = plats.filter(p => p.y < from.y - 20 && Math.abs((p.x0 + p.x1) / 2 - from.x) < 260).sort((a, b) => b.y - a.y)[0];
  if (first) jumpTo(Math.min(first.x1 - 10, Math.max(first.x0 + 10, from.x + 30)), first.y);
  addEventListener('resize', size);
  raf = requestAnimationFrame(loop);
  (cv as unknown as { __stop?: () => void }).__stop = finish;
  return finish;
}
