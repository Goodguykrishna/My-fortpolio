// Synthesised dial tick: a 6 ms noise burst through a resonant band-pass, like a watch crown.
// Browsers only allow audio after a click/tap/key, so the context wakes on the first gesture.

let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;
let out: GainNode | null = null;
let last = 0;
let enabled = true;

function init() {
  if (ctx) return;
  ctx = new AudioContext();
  noise = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.006), ctx.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  out = ctx.createGain();
  out.gain.value = 0.55;
  out.connect(ctx.destination);
}

export function wakeAudio() {
  init();
  if (ctx?.state === 'suspended') ctx.resume();
}

export function setSound(on: boolean) { enabled = on; if (on) wakeAudio(); }
export const soundOn = () => enabled;

/** major = landing on a project; speed = |projects per second|, faster scroll ticks brighter */
export function tick(major: boolean, speed: number) {
  if (!enabled || !ctx || !noise || !out || ctx.state !== 'running') return;
  const now = ctx.currentTime;
  if (now - last < 0.022) return; // ~45 ticks/s ceiling
  last = now;
  const s = Math.min(1, speed / 6);
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = (major ? 2300 : 3400 + s * 1400) * (0.97 + Math.random() * 0.06);
  bp.Q.value = major ? 6 : 9;
  const g = ctx.createGain();
  const peak = (major ? 0.5 : 0.22) * (0.6 + s * 0.6);
  g.gain.setValueAtTime(peak, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + (major ? 0.05 : 0.025));
  src.connect(bp).connect(g).connect(out);
  src.start(now);
  src.stop(now + 0.06);
}
