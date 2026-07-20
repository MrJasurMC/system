// Original stylized anime-style character (not based on any copyrighted design).
// Body proportions widen from skinny -> lean -> athletic -> V-taper as level rises,
// and a glow/aura is added at higher tiers to sell the "growing stronger" feel.

const TIERS = [{
  label: 'skinny',
  shoulder: 34,
  waist: 32,
  arm: 8,
  legGap: 7,
  abLines: 0,
  glow: 0,
  skin: '#e8c4a0',
  suit: '#2b3648',
  suitShadow: '#212a38',
  hair: '#1b2230',
  eye: '#3fa9f5'
}, {
  label: 'lean',
  shoulder: 42,
  waist: 30,
  arm: 10,
  legGap: 8,
  abLines: 0,
  glow: 0.15,
  skin: '#e8c4a0',
  suit: '#243250',
  suitShadow: '#1b2740',
  hair: '#1b2230',
  eye: '#4fc3f7'
}, {
  label: 'athletic',
  shoulder: 50,
  waist: 27,
  arm: 13,
  legGap: 9,
  abLines: 2,
  glow: 0.35,
  skin: '#e8c4a0',
  suit: '#1f2d52',
  suitShadow: '#16213e',
  hair: '#181f2c',
  eye: '#7cc5ff'
}, {
  label: 'v-taper',
  shoulder: 58,
  waist: 23,
  arm: 16,
  legGap: 10,
  abLines: 3,
  glow: 0.6,
  skin: '#e8c4a0',
  suit: '#1a2a5e',
  suitShadow: '#0f1c42',
  hair: '#15192a',
  eye: '#8b5cf6'
}];
export function tierForLevel(level) {
  if (level >= 50) return TIERS[3];
  if (level >= 25) return TIERS[2];
  if (level >= 10) return TIERS[1];
  return TIERS[0];
}
export function CharacterPortrait({
  level
}) {
  const t = tierForLevel(level);
  const cx = 100;
  const shoulderY = 108;
  const waistY = 178;
  const legBottom = 300;
  return <svg viewBox="0 0 200 320" width="100%" height="260" style={{
    display: 'block',
    margin: '0 auto'
  }}>
      <defs>
        <radialGradient id="aura" cx="50%" cy="42%" r="55%">
          <stop offset="0%" stopColor={t.eye} stopOpacity={t.glow} />
          <stop offset="100%" stopColor={t.eye} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3fa9f5" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#3fa9f5" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* aura */}
      {t.glow > 0 && <circle cx={cx} cy="150" r="130" fill="url(#aura)" />}

      {/* ground glow */}
      <ellipse cx={cx} cy="308" rx="60" ry="9" fill="url(#floor)" />

      {/* legs */}
      <rect x={cx - t.legGap - 14} y={waistY} width="14" height={legBottom - waistY} rx="6" fill={t.suitShadow} />
      <rect x={cx + t.legGap} y={waistY} width="14" height={legBottom - waistY} rx="6" fill={t.suit} />
      {/* boots */}
      <rect x={cx - t.legGap - 16} y={legBottom - 14} width="18" height="16" rx="4" fill="#0c1220" />
      <rect x={cx + t.legGap - 2} y={legBottom - 14} width="18" height="16" rx="4" fill="#0c1220" />

      {/* arms (behind torso) */}
      <rect x={cx - t.shoulder - t.arm + 2} y={shoulderY + 4} width={t.arm} height={78} rx={t.arm / 2} fill={t.suitShadow} />
      <rect x={cx + t.shoulder - 2} y={shoulderY + 4} width={t.arm} height={78} rx={t.arm / 2} fill={t.suit} />
      {/* hands */}
      <circle cx={cx - t.shoulder - t.arm / 2 + 2} cy={shoulderY + 84} r={t.arm / 2 + 2} fill={t.skin} />
      <circle cx={cx + t.shoulder - t.arm / 2 + 2} cy={shoulderY + 84} r={t.arm / 2 + 2} fill={t.skin} />

      {/* torso: trapezoid shoulder -> waist (wrapped in a group for breathing) */}
      <g className="avatar-breathe">
        <polygon points={`
            ${cx - t.shoulder},${shoulderY}
            ${cx + t.shoulder},${shoulderY}
            ${cx + t.waist},${waistY}
            ${cx - t.waist},${waistY}
          `} fill={t.suit} />
        {/* torso shadow half */}
        <polygon points={`
            ${cx},${shoulderY}
            ${cx + t.shoulder},${shoulderY}
            ${cx + t.waist},${waistY}
            ${cx},${waistY}
          `} fill={t.suitShadow} opacity="0.5" />
        {/* collar */}
        <polygon points={`${cx - 10},${shoulderY} ${cx + 10},${shoulderY} ${cx},${shoulderY + 14}`} fill={t.skin} />

        {/* ab lines (visible via a V neckline cut for higher tiers) */}
        {t.abLines > 0 && <g stroke={t.suitShadow} strokeWidth="1.4" opacity="0.7">
            <line x1={cx} y1={shoulderY + 20} x2={cx} y2={waistY - 6} />
            {Array.from({
          length: t.abLines
        }).map((_, i) => <line key={i} x1={cx - 10} y1={shoulderY + 30 + i * 14} x2={cx + 10} y2={shoulderY + 30 + i * 14} />)}
          </g>}

        {/* neck */}
        <rect x={cx - 8} y={shoulderY - 14} width="16" height="18" fill={t.skin} />

        {/* head */}
        <ellipse cx={cx} cy={shoulderY - 32} rx="22" ry="24" fill={t.skin} />
        
        {/* hair back (swaying) */}
        <g className="avatar-hair-sway">
          <path d={`M ${cx - 24},${shoulderY - 42}
                Q ${cx - 30},${shoulderY - 70} ${cx},${shoulderY - 74}
                Q ${cx + 30},${shoulderY - 70} ${cx + 24},${shoulderY - 42}
                Q ${cx + 20},${shoulderY - 54} ${cx},${shoulderY - 50}
                Q ${cx - 20},${shoulderY - 54} ${cx - 24},${shoulderY - 42} Z`} fill={t.hair} />
          {/* spiky fringe */}
          <path d={`M ${cx - 22},${shoulderY - 46}
                L ${cx - 16},${shoulderY - 60}
                L ${cx - 8},${shoulderY - 48}
                L ${cx},${shoulderY - 64}
                L ${cx + 8},${shoulderY - 48}
                L ${cx + 16},${shoulderY - 60}
                L ${cx + 22},${shoulderY - 46}
                Q ${cx},${shoulderY - 40} ${cx - 22},${shoulderY - 46} Z`} fill={t.hair} />
        </g>

        {/* eyes (blinking) */}
        <g className="avatar-blink">
          <ellipse cx={cx - 8} cy={shoulderY - 32} rx="3.4" ry="3" fill={t.eye}>
            {t.glow > 0.3 && <animate attributeName="opacity" values="1;0.55;1" dur="2.4s" repeatCount="indefinite" />}
          </ellipse>
          <ellipse cx={cx + 8} cy={shoulderY - 32} rx="3.4" ry="3" fill={t.eye}>
            {t.glow > 0.3 && <animate attributeName="opacity" values="1;0.55;1" dur="2.4s" repeatCount="indefinite" />}
          </ellipse>
        </g>
      </g>
    </svg>;
}