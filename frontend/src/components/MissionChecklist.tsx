import { useState } from 'react';

/** Splits a quest description into a header paragraph + a list of "- " task lines. */
export function parseMissionTasks(description?: string): { intro: string; tasks: string[] } {
  if (!description) return { intro: '', tasks: [] };
  const lines = description.split('\n').map(l => l.trim()).filter(Boolean);
  const tasks = lines.filter(l => l.startsWith('- ')).map(l => l.slice(2).trim());
  const intro = lines.filter(l => !l.startsWith('- ')).join(' ');
  return { intro, tasks };
}

/**
 * Renders a quest description as a real checklist instead of a raw
 * whitespace-pre text blob. Purely a client-side UX layer — checking every
 * box does not call the API on its own, it just gates the "Mark Complete"
 * button so you can't fat-finger it before you've actually done the work.
 */
export function MissionChecklist({
  description,
  onAllChecked,
}: {
  description?: string;
  onAllChecked?: (allChecked: boolean) => void;
}) {
  const { intro, tasks } = parseMissionTasks(description);
  const [checked, setChecked] = useState<boolean[]>(() => tasks.map(() => false));

  if (tasks.length === 0) {
    return description ? (
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)', whiteSpace: 'pre-line' }}>
        {description}
      </div>
    ) : null;
  }

  function toggle(i: number) {
    setChecked(prev => {
      const next = [...prev];
      next[i] = !next[i];
      onAllChecked?.(next.every(Boolean));
      return next;
    });
  }

  return (
    <div>
      {intro && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)', marginBottom: 10 }}>
          {intro}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {tasks.map((task, i) => (
          <label
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 10px',
              borderRadius: 4,
              border: '1px solid var(--border)',
              background: checked[i] ? 'rgba(80,200,100,0.06)' : 'transparent',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
            }}
          >
            <input
              type="checkbox"
              checked={checked[i]}
              onChange={() => toggle(i)}
              style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
            />
            <span
              aria-hidden
              style={{
                width: 16,
                height: 16,
                flexShrink: 0,
                borderRadius: 3,
                border: `1px solid ${checked[i] ? 'var(--green)' : 'var(--border)'}`,
                background: checked[i] ? 'var(--green)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.12s ease',
              }}
            >
              {checked[i] && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="#0a0a0a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <span style={{
              color: checked[i] ? 'var(--green)' : 'var(--text)',
              textDecoration: checked[i] ? 'line-through' : 'none',
              opacity: checked[i] ? 0.75 : 1,
            }}>
              {task}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
