// Krishna's mark: a camera viewfinder, four corner marks around whatever is in frame.
// It is the logo, the preloader and the frame around the project in focus.

export function cornersPath(w: number, h: number, arm = Math.min(w, h) * 0.22) {
  const a = Math.min(arm, w / 2, h / 2);
  return `M0 ${a}V0H${a}M${w - a} 0H${w}V${a}M${w} ${h - a}V${h}H${w - a}M${a} ${h}H0V${h - a}`;
}

export default function Brackets({ w, h, className, weight = 2 }: { w: number; h: number; className?: string; weight?: number }) {
  return (
    <svg className={className} width={w} height={h} viewBox={`-2 -2 ${w + 4} ${h + 4}`} aria-hidden="true" overflow="visible">
      <path d={cornersPath(w, h)} fill="none" stroke="currentColor" strokeWidth={weight} strokeLinecap="square" pathLength={1} />
      <circle cx={w / 2} cy={h / 2} r={2} fill="currentColor" />
    </svg>
  );
}
