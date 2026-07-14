export function StatBar({
  label,
  value,
  max,
  variant = 'green',
}: {
  label: string;
  value: number;
  max: number;
  variant?: 'green' | 'blue' | 'hp';
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div className="stat-row">
        <span>{label}</span>
        <b>
          {value} / {max}
        </b>
      </div>
      <div className="bar-track">
        <div className={`bar-fill ${variant === 'green' ? '' : variant}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
