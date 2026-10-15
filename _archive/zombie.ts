// A 1-bit pixel zombie. Drawn from a tiny skeleton every frame, so one rig does every trick.
// Smoothness: the body is built from fat "pixels" (blocks) but positioned on the device-pixel grid,
// speed eases in and out, and poses blend between states instead of snapping.

type P = [number, number];
type Pose = { hip: P; sh: P; feet: [P, P]; hands: [P, P]; head: P };

const INK = '#0b0b0b', SOFT = '#d6d6d6', WHITE = '#ffffff';
const UNIT = 3; // CSS px per zombie pixel

export function startZombie(cv: HTMLCanvasElement, yard: HTMLElement, bubble: HTMLElement, opts: { delay?: number; calm?: boolean; onEscape?: (at: { x: number; y: number }) => void } = {}) {
  // one zombie per canvas, even if React mounts twice or hot-reloads
  (cv as unknown as { __stop?: () => void }).__stop?.();
  const ctx = cv.getContext('2d')!;
  let U = UNIT, LW = 100, LH = 30, G = 26;

  const size = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.round(cv.clientWidth * dpr);
    cv.height = Math.round(cv.clientHeight * dpr);
    U = Math.round(UNIT * dpr); // whole device pixels per zombie pixel, so blocks never smear
    LW = cv.width / U;
    LH = cv.height / U;
    G = LH - 4;
  };

  const block = (x: number, y: number, w = 1, h = 1, c = INK) => {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x * U), Math.round(y * U), Math.round(w * U), Math.round(h * U));
  };
  const line = (a: P, b: P, w = 1, c = INK) => {
    const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * 1.5));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      block(a[0] + (b[0] - a[0]) * t - w / 2, a[1] + (b[1] - a[1]) * t - w / 2, w, w, c);
    }
  };
  const rand = (a: number, b: number) => a + Math.random() * (b - a);
  const ease = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
  const damp = (k: number, dt: number) => 1 - Math.exp(-k * dt);

  const z = {
    x: 14, v: 0, dir: 1, phase: 0, state: 'wait', t: 0, dur: 0, target: 0,
    angle: 0, rise: 1, hasHead: true, holding: false,
    head: null as null | { x: number; y: number; vx: number; vy: number; spin: number; rest?: boolean },
  };
  let cursorX: number | null = null;
  let bubbleUntil = 0;
  let cur: Pose | null = null;

  const say = (text: string, secs = 1.6) => {
    bubble.textContent = text;
    bubble.classList.add('on');
    bubbleUntil = performance.now() + secs * 1000;
  };
  const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

  function set(state: string, extra: Partial<typeof z> = {}) {
    Object.assign(z, { state, t: 0 }, extra);
    if (state === 'groan') say(pick(['BRAAAINS...', 'UUURGH', 'BRAINS?', 'HUNGRY']), 1.8);
    if (state === 'headoff') {
      z.hasHead = false;
      z.head = { x: z.x + z.dir * 4, y: G - 18, vx: z.dir * rand(14, 22), vy: -38, spin: 0 };
      say('MY HEAD!', 1.4);
    }
    if (state === 'sleep') say('Z z z', 3.4);
    if (state === 'dance') say('LA LA LA', 1.6);
    if (state === 'escape') say('LET ME OUT', 1.1);
  }

  let lastEscape = performance.now();
  function next() {
    const r = Math.random();
    if (opts.onEscape && performance.now() - lastEscape > 45000 && r < 0.18) return set('escape');
    if (r < 0.46) set('walk', { target: rand(12, LW - 6) });
    else if (r < 0.62) set('idle', { dur: rand(1, 2.4) });
    else if (r < 0.72) set('groan');
    else if (r < 0.8) set('dance');
    else if (r < 0.88) set('trip');
    else if (r < 0.94) set('sleep');
    else set('headoff');
  }

  let deck: string[] = [];
  const trick = () => {
    if (['wait', 'rise', 'headoff', 'fetch', 'escape', 'gone'].includes(z.state)) return;
    if (!deck.length) deck = ['trip', 'headoff', 'dance', 'groan', 'sleep', ...(opts.onEscape ? ['escape'] : [])].sort(() => Math.random() - 0.5);
    set(deck.pop()!);
  };

  function update(dt: number) {
    z.t += dt;
    const scared = cursorX !== null && Math.abs(cursorX - z.x) < 15;
    if (scared && ['walk', 'idle', 'groan', 'dance'].includes(z.state)) {
      z.dir = Math.sign(z.x - cursorX!) || 1;
      set('run', { dur: 1.3 });
      say(pick(['!!', 'NOPE', 'AAAH']), 0.9);
    }

    let want = 0; // target velocity, eased into
    switch (z.state) {
      case 'wait': if (z.t > (opts.delay ?? 0)) set('rise'); break;
      case 'rise':
        z.rise = 1 - ease(z.t / 1.8);
        if (z.t > 1.8) { z.rise = 0; set('groan'); }
        break;
      case 'walk': {
        const d = z.target - z.x;
        z.dir = Math.sign(d) || z.dir;
        want = z.dir * Math.min(7, Math.abs(d) * 3);
        if (Math.abs(d) < 0.4) next();
        break;
      }
      case 'run':
        want = z.dir * 30;
        if (z.x < 5) { z.x = 5; z.dir = 1; z.v = Math.abs(z.v); }
        if (z.x > LW - 5) { z.x = LW - 5; z.dir = -1; z.v = -Math.abs(z.v); }
        if (z.t > z.dur && !scared) set('idle', { dur: 0.8 });
        break;
      case 'idle': if (z.t > z.dur) next(); break;
      case 'escape':
        if (z.t > 1) {
          const r = cv.getBoundingClientRect();
          lastEscape = performance.now();
          set('gone');
          bubble.classList.remove('on');
          opts.onEscape?.({ x: r.left + z.x * UNIT, y: r.top + G * UNIT });
        }
        break;
      case 'gone': break;
      case 'groan': if (z.t > 1.9) next(); break;
      case 'dance': z.phase = z.t * 5; if (z.t > 3.2) next(); break;
      case 'trip':
        want = z.t < 0.5 ? z.dir * 10 : 0;
        z.angle = z.t < 0.3 ? 0.25 * ease(z.t / 0.3)
          : z.t < 0.55 ? 0.25 + 1.32 * ease((z.t - 0.3) / 0.25)
          : z.t < 1.9 ? 1.57 : 1.57 * (1 - ease((z.t - 1.9) / 0.5));
        if (z.t > 0.55 && z.t - dt <= 0.55) say('OW', 1);
        if (z.t > 2.4) { z.angle = 0; next(); }
        break;
      case 'sleep':
        z.angle = z.t < 0.6 ? -1.57 * ease(z.t / 0.6) : z.t < 3.6 ? -1.57 : -1.57 * (1 - ease((z.t - 3.6) / 0.5));
        if (z.t > 4.1) { z.angle = 0; next(); }
        break;
      case 'headoff':
        if (z.t > 1.2 && z.head?.rest) set('fetch');
        break;
      case 'fetch': {
        const h = z.head!;
        if (z.holding) {
          if (z.t > 0.6) { z.hasHead = true; z.holding = false; z.head = null; say('BETTER', 1); next(); }
        } else {
          const d = h.x - z.x;
          z.dir = Math.sign(d) || z.dir;
          want = z.dir * Math.min(10, Math.abs(d) * 4);
          if (Math.abs(d) < 0.8) { z.holding = true; z.t = 0; }
        }
        break;
      }
    }

    z.v += (want - z.v) * damp(z.state === 'run' ? 9 : 6, dt);
    z.x += z.v * dt;
    if (z.state !== 'dance') z.phase += Math.abs(z.v) * dt * 0.62;

    const h = z.head;
    if (h && !h.rest && !z.holding) {
      h.vy += 150 * dt;
      h.x += h.vx * dt;
      h.y += h.vy * dt;
      h.spin += h.vx * dt * 0.4;
      if (h.y > G - 3) {
        h.y = G - 3;
        h.vy *= -0.42;
        h.vx *= 0.6;
        if (Math.abs(h.vy) < 6) { h.vy = 0; if (Math.abs(h.vx) < 1.5) h.rest = true; }
      }
      if (h.x < 3 || h.x > LW - 3) { h.x = Math.min(LW - 3, Math.max(3, h.x)); h.vx *= -0.6; }
    }
  }

  function pose(): Pose {
    const f = z.dir, ph = z.phase, st = z.state;
    const speed = Math.abs(z.v);
    const run = st === 'run';
    const gait = Math.min(1, speed / 6); // legs open up as it speeds up, close as it stops
    const stride = (run ? 4 : 2.6) * gait, lift = (run ? 2.4 : 1.2) * gait;
    let bob = Math.abs(Math.sin(ph)) * (run ? 1.4 : 0.8) * gait;
    if (st === 'dance') bob = (Math.sin(ph * Math.PI) + 1);
    const hip: P = [z.x, G - 7 - bob];
    const lean = 1.5 + Math.min(1, speed / 30);
    const sh: P = [z.x + f * lean, hip[1] - 7];
    let feet: [P, P], hands: [P, P];
    const s = Math.sin(ph), c = Math.cos(ph);
    if (st === 'dance') {
      const k = Math.sin(ph * Math.PI);
      feet = [[z.x - 2.5 - k, G], [z.x + 2.5 + k, G - Math.max(0, k) * 2]];
    } else {
      const spread = 2.5 * (1 - gait);
      feet = [[z.x + f * s * stride - spread, G - Math.max(0, c) * lift], [z.x - f * s * stride + spread, G - (run ? Math.max(0, -c) * lift : 0)]];
    }

    if (run) {
      hands = [[sh[0] - f * 5 + s * 2, sh[1] - 2 + c * 3], [sh[0] + f * 5 - s * 2, sh[1] - 3 - c * 3]];
    } else if (st === 'dance') {
      const k = Math.sin(ph * Math.PI);
      hands = [[sh[0] - 5, sh[1] - 2 - k * 4], [sh[0] + 5, sh[1] - 2 + k * 4]];
    } else if (st === 'headoff') {
      const w = Math.sin(z.t * 14) * 2;
      hands = [[sh[0] - f * 2, sh[1] - 6 + w], [sh[0] + f * 3, sh[1] - 6 - w]];
    } else if (st === 'groan') {
      const w = Math.sin(z.t * 10);
      hands = [[sh[0] + f * 7, sh[1] - 2 + w], [sh[0] + f * 8, sh[1] - 1 - w]];
    } else if (z.holding) {
      hands = [[sh[0] + f * 6, sh[1] + 2], [sh[0] + f * 3, sh[1] - 7]];
    } else {
      // the classic: both arms straight out in front
      const sway = Math.sin(ph * 0.5 + z.t * 1.3) * 0.7;
      hands = [[sh[0] + f * 7, sh[1] + 2 + sway], [sh[0] + f * 8, sh[1] + 1 - sway * 0.6]];
    }
    const tilt = st === 'idle' ? Math.sin(z.t * 1.5) : 0;
    return { hip, sh, feet, hands, head: [sh[0] + f * 2.5, sh[1] - 3 + tilt] };
  }

  // ease every joint toward the target pose, so state changes never snap
  function blend(target: Pose, dt: number): Pose {
    if (!cur) return (cur = structuredClone(target));
    const k = damp(22, dt);
    const mix = (a: P, b: P) => { a[0] += (b[0] - a[0]) * k; a[1] += (b[1] - a[1]) * k; };
    mix(cur.hip, target.hip); mix(cur.sh, target.sh); mix(cur.head, target.head);
    mix(cur.feet[0], target.feet[0]); mix(cur.feet[1], target.feet[1]);
    mix(cur.hands[0], target.hands[0]); mix(cur.hands[1], target.hands[1]);
    return cur;
  }

  function drawHead(c: P, f: number, rot = 0) {
    // the face snaps to the pixel grid as one unit, so eyes and mouth never drift against the head
    const hx = Math.round(c[0] * U) / U, hy = Math.round(c[1] * U) / U;
    block(hx - 3, hy - 3, 6, 6);
    block(hx - 2, hy - 4); block(hx, hy - 4); block(hx + 1, hy - 5);
    if (Math.abs(Math.sin(rot)) > 0.7) { block(hx - 1, hy - 1, 1, 1, WHITE); block(hx + 1, hy - 1, 1, 1, WHITE); block(hx, hy + 1, 1, 1, WHITE); return; }
    const k = Math.cos(rot) < 0 ? -f : f, o = k > 0 ? 0 : -1;
    block(hx + o, hy - 1, 1, 1, WHITE);
    block(hx + o + k * 2, hy - 1, 1, 2, WHITE);
    block(hx + o, hy + 1, 1, 1, WHITE); block(hx + o + k * 2, hy + 1, 1, 1, WHITE);
  }

  const rotate = (p: P, piv: P, a: number): P => {
    const c = Math.cos(a), s = Math.sin(a), x = p[0] - piv[0], y = p[1] - piv[1];
    return [piv[0] + x * c - y * s, piv[1] + x * s + y * c];
  };

  function draw(p: Pose) {
    ctx.clearRect(0, 0, cv.width, cv.height);
    const gx = 4;
    block(gx, G - 7, 6, 8, SOFT);
    block(gx + 1, G - 8, 4, 1, SOFT);
    block(gx + 2.5, G - 6, 1, 3, WHITE); block(gx + 1.5, G - 5, 3, 1, WHITE);

    if (z.state === 'gone') { ctx.clearRect(0, Math.round((G + 1) * U), cv.width, cv.height); block(0, G + 1, LW, 1 / UNIT * 2, SOFT); return; }
    const f = z.dir, a = z.angle * f, piv: P = [z.x, G];
    const dy = z.state === 'wait' ? 30 : z.rise * 22;
    const shake = z.rise > 0 && z.state === 'rise' ? Math.sin(z.t * 40) * 0.4 : 0;
    const T = (q: P): P => { const r = rotate(q, piv, a); return [r[0] + shake, r[1] + dy]; };

    line(T([p.sh[0], p.sh[1] + 1]), T(p.hands[0]), 2);
    line(T([p.hip[0] - 1, p.hip[1]]), T(p.feet[0]), 2);
    line(T(p.hip), T(p.sh), 4);
    block(...T([p.hip[0] + f, p.hip[1] + 0.5]), 1, 1, WHITE);
    block(...T([p.hip[0] - f, p.hip[1] - 3]), 1, 1, WHITE);
    line(T([p.hip[0] + 1, p.hip[1]]), T(p.feet[1]), 2);
    if (z.hasHead) drawHead(T(p.head), f, a);
    else block(...T([p.sh[0] + f, p.sh[1] - 1]));
    line(T(p.sh), T(p.hands[1]), 2);
    if (z.holding) drawHead(T([p.hands[1][0], p.hands[1][1] - 3]), f);
    if (z.head && !z.holding) drawHead([z.head.x, z.head.y], -Math.sign(z.head.vx || f), z.head.spin);

    // ground (also hides whatever is still underground)
    ctx.clearRect(0, Math.round((G + 1) * U), cv.width, cv.height);
    block(0, G + 1, LW, 1 / UNIT * 2, SOFT);
    for (let x = 17; x < LW; x += 23) { block(x, G, 1, 1, SOFT); block(x + 1, G - 1, 1, 1, SOFT); block(x + 2, G, 1, 1, SOFT); }

    if (bubble.classList.contains('on')) {
      const hp = z.hasHead ? T(p.head) : z.head ? [z.head.x, z.head.y] : T(p.sh);
      bubble.style.transform = `translate3d(${hp[0] * UNIT}px, ${cv.offsetTop + (hp[1] - 4.5) * UNIT}px, 0) translate(-50%, -100%)`;
      if (performance.now() > bubbleUntil) bubble.classList.remove('on');
    }
  }

  let last = performance.now(), visible = true, raf = 0;
  const loop = (t: number) => {
    const dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    if (visible) {
      if (!opts.calm) update(dt);
      draw(blend(pose(), dt));
    }
    raf = requestAnimationFrame(loop);
  };

  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    const r = cv.getBoundingClientRect();
    cursorX = (e.clientX - r.left) / r.width * LW;
  };
  const onLeave = () => { cursorX = null; };
  const onClick = () => (opts.calm ? say('BRAINS?') : trick());
  yard.addEventListener('pointermove', onMove);
  yard.addEventListener('pointerleave', onLeave);
  yard.addEventListener('click', onClick);
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  io.observe(yard);
  const ro = new ResizeObserver(size);
  ro.observe(cv);

  size();
  if (opts.calm) { z.rise = 0; z.state = 'idle'; z.dur = Infinity; }
  raf = requestAnimationFrame(loop);

  // back from the page: climb out of the grave again
  const comeHome = () => Object.assign(z, { state: 'rise', t: 0, rise: 1, x: 14, v: 0, angle: 0, hasHead: true, head: null, holding: false });

  if (process.env.NODE_ENV === 'development') (window as unknown as { zombieEscape: () => void }).zombieEscape = () => set('escape');

  const stop = () => {
    cancelAnimationFrame(raf);
    io.disconnect();
    ro.disconnect();
    yard.removeEventListener('pointermove', onMove);
    yard.removeEventListener('pointerleave', onLeave);
    yard.removeEventListener('click', onClick);
  };
  (cv as unknown as { __stop?: () => void }).__stop = stop;
  return { stop, comeHome };
}
