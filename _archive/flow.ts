// Live text reflow. A field of words is re-typeset every frame around arbitrary moving shapes:
// rotated rectangles (the wheel's items) and circles (the cursor). CSS can't wrap text around a
// rotated, moving box, so this does its own line breaking: for each line band it intersects every
// polygon with the band, subtracts those spans from the line, and pours words into what is left.

export type Pt = [number, number];
export type Circle = { x: number; y: number; r: number };

const FONT_PX = 10.5, LH = 17, MARGIN = 28, PAD = 22, TOP = 76, BOTTOM = 72, FADE = 56;

export function createFlow(cv: HTMLCanvasElement, text: string) {
  const ctx = cv.getContext('2d')!;
  const words = text.split(/\s+/).filter(Boolean);
  let widths: number[] = [], space = 3, W = 0, H = 0, dpr = 1, font = '';

  function resize(w: number, h: number) {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = w; H = h;
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const family = getComputedStyle(document.body).getPropertyValue('--font-sans').trim() || 'sans-serif';
    font = `400 ${FONT_PX}px ${family}, sans-serif`;
    ctx.font = font;
    widths = words.map(t => ctx.measureText(t).width); // measured once, reused every frame
    space = ctx.measureText(' ').width;
  }

  // x-span of a convex polygon inside the horizontal band [y0, y1]
  function span(poly: Pt[], y0: number, y1: number): [number, number] | null {
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < poly.length; i++) {
      const [ax, ay] = poly[i], [bx, by] = poly[(i + 1) % poly.length];
      if (ay >= y0 && ay <= y1) { lo = Math.min(lo, ax); hi = Math.max(hi, ax); }
      for (const y of [y0, y1]) {
        if ((ay - y) * (by - y) < 0) {
          const x = ax + (bx - ax) * (y - ay) / (by - ay);
          lo = Math.min(lo, x); hi = Math.max(hi, x);
        }
      }
    }
    return lo <= hi ? [lo, hi] : null;
  }

  function draw(polys: Pt[][], circles: Circle[], drift: number, alpha = 1) {
    ctx.clearRect(0, 0, W, H);
    if (!widths.length) return;
    ctx.font = font;
    ctx.textBaseline = 'top';
    const lineShift = Math.floor(drift / LH);
    let wi = ((lineShift * 9) % words.length + words.length) % words.length; // text streams upward with scroll
    for (let y = TOP - ((drift % LH) + LH) % LH; y < H - BOTTOM; y += LH) {
      // lines dissolve into the top bar and the footer instead of running under them
      const edge = Math.min(1, Math.max(0, (y - TOP) / FADE), Math.max(0, (H - BOTTOM - LH - y) / FADE));
      if (edge <= 0) continue;
      ctx.fillStyle = `rgba(13,13,13,${0.17 * alpha * edge})`;
      const y0 = y - 2, y1 = y + LH - 4;
      const blocked: [number, number][] = [];
      for (const p of polys) {
        const s = span(p, y0 - 10, y1 + 10);
        if (s) blocked.push([s[0] - PAD, s[1] + PAD]);
      }
      for (const c of circles) {
        const dy = Math.max(y0, Math.min(c.y, y1)) - c.y;
        if (Math.abs(dy) < c.r) { const hw = Math.sqrt(c.r * c.r - dy * dy); blocked.push([c.x - hw, c.x + hw]); }
      }
      blocked.sort((a, b) => a[0] - b[0]);
      // free spans = the line minus everything blocked
      let x = MARGIN;
      const free: [number, number][] = [];
      for (const [a, b] of blocked) {
        if (a > x) free.push([x, Math.min(a, W - MARGIN)]);
        x = Math.max(x, b);
      }
      if (x < W - MARGIN) free.push([x, W - MARGIN]);
      for (const [a, b] of free) {
        if (b - a < 36) continue;
        let cx = a;
        while (true) {
          const w = widths[wi];
          if (cx + w > b) break;
          ctx.fillText(words[wi], Math.round(cx), Math.round(y));
          cx += w + space;
          wi = (wi + 1) % words.length;
        }
      }
    }
  }

  return { resize, draw };
}
