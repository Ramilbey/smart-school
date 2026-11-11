/** The Smart Schools mark from the pitch deck: four arcs for the four connected systems. */
export function Logo({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="-130 -130 260 260" className={className} aria-hidden="true">
      <path d="M12.5 -89.1 A90 90 0 0 1 89.1 -12.5" stroke="#2DE2C4" strokeWidth="24" fill="none" strokeLinecap="round" />
      <path d="M89.1 12.5 A90 90 0 0 1 12.5 89.1" stroke="#5B8CFF" strokeWidth="24" fill="none" strokeLinecap="round" />
      <path d="M-12.5 89.1 A90 90 0 0 1 -89.1 12.5" stroke="#FF6B5B" strokeWidth="24" fill="none" strokeLinecap="round" />
      <path d="M-89.1 -12.5 A90 90 0 0 1 -12.5 -89.1" stroke="#FFB547" strokeWidth="24" fill="none" strokeLinecap="round" />
      <circle r="20" fill="currentColor" />
    </svg>
  );
}

export type OwlMood = 'idle' | 'happy' | 'think' | 'cheer';

/** Zukko, the Grade 1–4 learning companion. */
export function Owl({ size = 72, mood = 'idle' }: { size?: number; mood?: OwlMood }) {
  const happy = mood === 'happy' || mood === 'cheer';
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className={`owl owl-${mood}`} aria-hidden="true">
      <ellipse cx="60" cy="112" rx="30" ry="5" fill="rgba(30,33,64,.12)" />
      {/* wings */}
      <g className="owl-wing owl-wing-l">
        <path d="M26 62 C10 70 12 92 30 98 C30 84 32 72 26 62Z" fill="#3B4296" />
      </g>
      <g className="owl-wing owl-wing-r">
        <path d="M94 62 C110 70 108 92 90 98 C90 84 88 72 94 62Z" fill="#3B4296" />
      </g>
      {/* body */}
      <path d="M60 18 C88 18 98 40 98 66 C98 92 82 106 60 106 C38 106 22 92 22 66 C22 40 32 18 60 18Z" fill="#4A54B8" />
      <path d="M60 52 C78 52 84 66 84 80 C84 96 74 102 60 102 C46 102 36 96 36 80 C36 66 42 52 60 52Z" fill="#FFE7B8" />
      <path d="M50 80 q5 4 10 0 q5 4 10 0 M46 90 q7 5 14 0 q7 5 14 0" stroke="#F2C77A" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* ear tufts */}
      <path d="M36 26 L30 10 L48 22Z" fill="#4A54B8" />
      <path d="M84 26 L90 10 L72 22Z" fill="#4A54B8" />
      {/* eyes */}
      <circle cx="44" cy="46" r="15" fill="#fff" />
      <circle cx="76" cy="46" r="15" fill="#fff" />
      {happy ? (
        <>
          <path d="M36 48 q8 -9 16 0" stroke="#1E2140" strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <path d="M68 48 q8 -9 16 0" stroke="#1E2140" strokeWidth="4.5" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <g className="owl-eyes">
          <circle cx={mood === 'think' ? 48 : 45} cy={mood === 'think' ? 42 : 47} r="6.5" fill="#1E2140" />
          <circle cx={mood === 'think' ? 80 : 77} cy={mood === 'think' ? 42 : 47} r="6.5" fill="#1E2140" />
          <circle cx={mood === 'think' ? 50 : 47} cy={mood === 'think' ? 40 : 45} r="2" fill="#fff" />
          <circle cx={mood === 'think' ? 82 : 79} cy={mood === 'think' ? 40 : 45} r="2" fill="#fff" />
        </g>
      )}
      {/* beak */}
      <path d="M55 56 L65 56 L60 66Z" fill="#FFB547" />
      {/* cheeks */}
      <circle cx="34" cy="60" r="5" fill="#FF8A7C" opacity=".55" />
      <circle cx="86" cy="60" r="5" fill="#FF8A7C" opacity=".55" />
    </svg>
  );
}

/** A stacked fraction, read by screen readers as "3 over 4". */
export function Frac({ n, d, className }: { n: number | string; d: number | string; className?: string }) {
  return (
    <span className={`frac ${className ?? ''}`} role="math" aria-label={`${n}/${d}`}>
      <span className="frac-n">{n}</span>
      <span className="frac-bar" aria-hidden="true" />
      <span className="frac-d">{d}</span>
    </span>
  );
}

/** Renders "3/4" labels as stacked fractions and leaves other text as is. */
export function MathLabel({ text }: { text: string }) {
  const m = /^(\d+)\/(\d+)$/.exec(text.trim());
  if (m) return <Frac n={m[1]} d={m[2]} />;
  return <>{text}</>;
}

/** The turquoise band of eight-point stars from the plate cards: the school's mark along the top and bottom of a screen. */
export function TileBand({ height = 22, className }: { height?: number; className?: string }) {
  return (
    <svg className={`tile-band ${className ?? ''}`} width="100%" height={height} aria-hidden="true">
      <defs>
        <pattern id="ss-band" width="22" height="22" patternUnits="userSpaceOnUse">
          <rect width="22" height="22" fill="#139a8c" />
          <rect x="5.5" y="5.5" width="11" height="11" fill="#fff4d9" />
          <rect x="5.5" y="5.5" width="11" height="11" fill="#fff4d9" transform="rotate(45 11 11)" />
          <circle cx="11" cy="11" r="2.6" fill="#ff6b5b" />
        </pattern>
      </defs>
      <rect width="100%" height={height} fill="url(#ss-band)" />
    </svg>
  );
}

const polarDeg = (deg: number, r: number): [number, number] => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [r * Math.cos(a), r * Math.sin(a)];
};

/**
 * A Rishtan plate painted one sector at a time. Each finished station paints a sector (progress as a fraction, in a picture),
 * and `fresh` is the sector that was just painted, which glows.
 */
export function RishtanPlate({ parts, painted, size = 240, fresh, label }: { parts: number; painted: number; size?: number; fresh?: number; label?: string }) {
  const R = 118;
  const step = 360 / parts;
  return (
    <svg viewBox="-150 -150 300 300" width={size} height={size} className="rishtan-plate" role="img" aria-label={label}>
      <circle r="146" fill="#ffffff" stroke="#050914" strokeWidth="5" />
      <circle r="136" fill="none" stroke="#1d44a3" strokeWidth="9" strokeDasharray="2 13" strokeLinecap="round" />
      <circle r="126" fill="none" stroke="#1d44a3" strokeWidth="2.5" />
      <circle r={R + 4} fill="#f4f1e8" />
      {Array.from({ length: parts }, (_, i) => {
        const [x1, y1] = polarDeg(i * step, R);
        const [x2, y2] = polarDeg((i + 1) * step, R);
        const on = i < painted;
        const [px, py] = polarDeg((i + 0.5) * step, R * 0.66);
        return (
          <g key={i}>
            <path d={`M0 0 L${x1} ${y1} A${R} ${R} 0 0 1 ${x2} ${y2} Z`} fill={on ? '#1d44a3' : '#f4f1e8'} stroke={on ? '#ffffff' : '#cdbd92'} strokeWidth="2.5" strokeDasharray={on ? undefined : '5 5'} strokeLinejoin="round" />
            <ellipse transform={`translate(${px} ${py}) rotate(${(i + 0.5) * step})`} rx="12" ry="22" fill={on ? '#ffffff' : '#e7dfc9'} />
            {fresh === i && <path d={`M0 0 L${x1} ${y1} A${R} ${R} 0 0 1 ${x2} ${y2} Z`} fill="none" stroke="#ffb547" strokeWidth="5" strokeLinejoin="round" />}
          </g>
        );
      })}
      <circle r="28" fill="#ffffff" stroke="#1d44a3" strokeWidth="4" />
      <rect x="-12" y="-12" width="24" height="24" fill="#1d44a3" />
      <rect x="-12" y="-12" width="24" height="24" fill="#1d44a3" transform="rotate(45)" />
      <circle r="5.5" fill="#ffb547" />
    </svg>
  );
}
