import { useState } from 'react';
import { getErrorMessage } from '../utils/errors';
import { ErrorState } from '../components/ui/ErrorState';
import { SystemWindow } from '../components/SystemWindow';
import { useQuests, QuestProgress } from '../hooks/useQuests';
import { MissionChecklist, parseMissionTasks } from '../components/MissionChecklist';

/** Mirrors backend quests.service.ts minCompletionDelayMs() exactly, so the UI
 * can tell the player *why* Mark Complete is disabled instead of them hitting
 * it, getting a silent-looking alert() rejection, and assuming it's broken. */
function minCompletionDelayMs(estimatedTimeMinutes?: number): number {
  const floorMs = 20_000;
  if (!estimatedTimeMinutes || estimatedTimeMinutes <= 0) return floorMs;
  return Math.max(floorMs, estimatedTimeMinutes * 60_000 * 0.3);
}

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: 'green',
  normal: 'blue',
  hard: 'orange',
  elite: 'violet',
  legendary: 'gold',
  mythic: 'danger',
};

const TYPE_LABEL: Record<string, string> = {
  main_daily: 'MAIN QUEST',
  side: 'SIDE QUEST',
  punishment: 'TRIAL',
};

import { useEffect } from 'react';
import { useCharacter } from '../hooks/useCharacter';

/** "Wed, Jul 15 — 5:00 AM" in the character's own timezone, not the browser's. */
function formatNextAt(iso: string | null | undefined, timezone: string | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (d.getTime() <= Date.now()) return null; // already due — generator will hand out a new one on next load
  return d.toLocaleString('en-US', {
    timeZone: timezone || undefined,
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function Countdown({ expiresAt }: { expiresAt?: string }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setRemaining('EXPIRED'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${h}h ${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (!expiresAt) return null;
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: remaining === 'EXPIRED' ? 'var(--danger)' : 'var(--accent-soft)' }}>
      ⏱ {remaining}
    </span>
  );
}

export function Quests() {
  const { quests: mine, available, isLoading, error: queryError, progressQuest, acceptQuest } = useQuests();
  const { data: char } = useCharacter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [availableErrors, setAvailableErrors] = useState<Record<string, string>>({});

  async function accept(questId: string) {
    setAcceptingId(questId);
    setAvailableErrors(prev => ({ ...prev, [questId]: '' }));
    try {
      await acceptQuest(questId);
    } catch (err: unknown) {
      setAvailableErrors(prev => ({ ...prev, [questId]: getErrorMessage(err, 'Failed to accept quest.') }));
    } finally {
      setAcceptingId(null);
    }
  }

  async function complete(questId: string) {
    setBusyId(questId);
    setCardErrors(prev => ({ ...prev, [questId]: '' }));
    try {
      await progressQuest({ questId, progressAmount: 1 });
    } catch (err: unknown) {
      // Shown inline on the card instead of a native alert() — alerts are
      // easy to dismiss/miss and made this look like the button did nothing.
      setCardErrors(prev => ({ ...prev, [questId]: getErrorMessage(err, 'Failed to complete quest.') }));
    } finally {
      setBusyId(null);
    }
  }

  const active = mine.filter(m => m.status === 'accepted' || m.status === 'in_progress');
  const punishment = active.filter(m => m.quest.type === 'punishment');
  const daily = active.filter(m => m.quest.type === 'main_daily');
  const side = active.filter(m => m.quest.type === 'side');
  const completed = mine.filter(m => m.status === 'complete' || m.status === 'claimed');
  const failed = mine.filter(m => m.status === 'failed');

  const availableMain = available.filter(q => q.type === 'main_daily');
  const availableSide = available.filter(q => q.type === 'side');

  const nextMain = daily.length === 0 && availableMain.length === 0 ? formatNextAt(char?.nextMainQuestAt, char?.timezone) : null;
  const nextSide = side.length === 0 && availableSide.length === 0 ? formatNextAt(char?.nextSideQuestAt, char?.timezone) : null;

  function QuestCard({ entry }: { entry: QuestProgress }) {
    const q = entry.quest;
    const isPunishment = q.type === 'punishment';
    const isCompleted = entry.status === 'complete' || entry.status === 'claimed';
    const border = isPunishment ? '1px solid var(--danger)' : isCompleted ? '1px solid var(--green)' : '1px solid var(--border)';
    const shadow = isPunishment ? '0 0 20px rgba(220,50,50,0.12)' : isCompleted ? '0 0 12px rgba(80,200,100,0.08)' : 'none';

    const { tasks } = parseMissionTasks(q.description);
    const [allChecked, setAllChecked] = useState(tasks.length === 0);

    const minWaitMs = minCompletionDelayMs(q.estimatedTime);
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
      if (isCompleted) return;
      const id = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(id);
    }, [isCompleted]);
    const elapsed = now - new Date(entry.createdAt).getTime();
    const waitRemainingMs = Math.max(0, minWaitMs - elapsed);
    const stillWaiting = waitRemainingMs > 0;
    const cardError = cardErrors[entry.questId];

    return (
      <div className="system-window" style={{ marginBottom: 12, border, boxShadow: shadow }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
              <span className={`badge ${isPunishment ? 'danger' : 'blue'}`} style={{ fontSize: 10 }}>
                {TYPE_LABEL[q.type] ?? q.type.toUpperCase()}
              </span>
              <span className={`badge ${DIFFICULTY_COLOR[q.difficulty] ?? 'blue'}`} style={{ fontSize: 10 }}>
                {q.difficulty?.toUpperCase()}
              </span>
              <Countdown expiresAt={q.expiresAt} />
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: isPunishment ? 'var(--danger)' : 'var(--text)', letterSpacing: '0.04em' }}>
              {q.title}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div className="badge green" style={{ fontSize: 11, marginBottom: 4 }}>+{q.xpReward} XP</div>
            {q.goldReward > 0 && <div className="badge gold" style={{ fontSize: 11 }}>+{q.goldReward} GOLD</div>}
          </div>
        </div>

        {q.description && (
          <div style={{ marginBottom: 12 }}>
            <MissionChecklist description={q.description} onAllChecked={setAllChecked} />
          </div>
        )}

        {cardError && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--danger)', marginBottom: 10 }}>
            ⚠ {cardError}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {q.estimatedTime && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>
                ~{q.estimatedTime} min
              </span>
            )}
            {q.attributeReward && Object.entries(q.attributeReward).map(([attr, val]) => val > 0 && (
              <span key={attr} className="badge blue" style={{ fontSize: 10 }}>+{val} {attr}</span>
            ))}
          </div>
          {!isCompleted && (
            <button
              className={isPunishment ? 'btn-awaken' : 'btn'}
              style={{
                fontSize: 12, padding: '8px 16px',
                ...(isPunishment && { background: 'linear-gradient(135deg, #8b1a1a, #c0392b)' }),
                ...((!allChecked || stillWaiting) && { opacity: 0.5, cursor: 'not-allowed' }),
              }}
              disabled={busyId === entry.questId || !allChecked || stillWaiting}
              title={!allChecked ? 'Check off every task first' : stillWaiting ? 'The System is still verifying your effort' : undefined}
              onClick={() => complete(entry.questId)}
            >
              {busyId === entry.questId
                ? '...'
                : stillWaiting
                  ? `Verifying — ${Math.ceil(waitRemainingMs / 1000)}s`
                  : !allChecked
                    ? 'Check off tasks first'
                    : isPunishment ? 'Begin Trial' : 'Mark Complete'}
            </button>
          )}
          {isCompleted && (
            <span className="badge green">COMPLETE</span>
          )}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <div className="loading-line" style={{ margin: '80px auto', textAlign: 'center' }}>FETCHING MISSIONS...</div>;
  }

  if (queryError) {
    return <ErrorState message={getErrorMessage(queryError, 'Failed to load quests.')} onRetry={() => window.location.reload()} />;
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">
          Quest Log
          <small>ACTIVE CONTRACTS</small>
        </h1>
      </div>

      {/* ── Available Quests (catalog, not yet accepted) ── */}
      {available.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', letterSpacing: '0.15em', marginBottom: 4 }}>
            ✦ AVAILABLE CONTRACTS
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', marginBottom: 10 }}>
            Waiting to be accepted.
          </div>
          {[...availableMain, ...availableSide].map(q => (
            <div key={q.id} className="system-window" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                    <span className="badge blue" style={{ fontSize: 10 }}>{TYPE_LABEL[q.type] ?? q.type.toUpperCase()}</span>
                    <span className={`badge ${DIFFICULTY_COLOR[q.difficulty] ?? 'blue'}`} style={{ fontSize: 10 }}>
                      {q.difficulty?.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: '0.04em' }}>{q.title}</div>
                  {q.description && (
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 6, whiteSpace: 'pre-line' }}>{q.description}</div>
                  )}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div className="badge green" style={{ fontSize: 11, marginBottom: 4 }}>+{q.xpReward} XP</div>
                  {q.goldReward > 0 && <div className="badge gold" style={{ fontSize: 11 }}>+{q.goldReward} GOLD</div>}
                </div>
              </div>
              {availableErrors[q.id] && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--danger)', marginBottom: 10 }}>
                  ⚠ {availableErrors[q.id]}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="btn"
                  style={{ fontSize: 12, padding: '8px 16px' }}
                  disabled={acceptingId === q.id}
                  onClick={() => accept(q.id)}
                >
                  {acceptingId === q.id ? '...' : 'Accept Quest'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Penalty Trial (priority display) ── */}
      {punishment.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--danger)', letterSpacing: '0.15em', marginBottom: 10 }}>
            ⚠ SYSTEM ALERT — PENALTY TRIAL
          </div>
          {punishment.map(e => <QuestCard key={e.id} entry={e} />)}
        </div>
      )}

      {/* ── Main Quest ── */}
      {(daily.length > 0 || nextMain) && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', letterSpacing: '0.15em', marginBottom: 10 }}>
            ◈ MAIN QUEST
          </div>
          {daily.map(e => <QuestCard key={e.id} entry={e} />)}
          {nextMain && (
            <div className="system-window" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>
              Next Main Quest: <b style={{ color: 'var(--text)' }}>{nextMain}</b>
            </div>
          )}
        </div>
      )}

      {/* ── Side Quest ── */}
      {(side.length > 0 || nextSide) && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.15em', marginBottom: 10 }}>
            ◇ SIDE QUEST
          </div>
          {side.map(e => <QuestCard key={e.id} entry={e} />)}
          {nextSide && (
            <div className="system-window" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>
              Next Side Quest: <b style={{ color: 'var(--text)' }}>{nextSide}</b>
            </div>
          )}
        </div>
      )}

      {active.length === 0 && available.length === 0 && !nextMain && !nextSide && (
        <SystemWindow title="No Active Quests">
          <div className="empty-state">The System has no missions for you right now. Return tomorrow.</div>
        </SystemWindow>
      )}

      {/* ── History ── */}
      {completed.length > 0 && (
        <SystemWindow title={`Completed — ${completed.length}`} style={{ marginTop: 24, opacity: 0.7 }}>
          {completed.map(e => (
            <div key={e.id} className="list-row">
              <span style={{ fontSize: 13 }}>{e.quest.title}</span>
              <span className="badge green" style={{ fontSize: 10 }}>CLAIMED</span>
            </div>
          ))}
        </SystemWindow>
      )}

      {failed.length > 0 && (
        <SystemWindow title={`Failed — ${failed.length}`} style={{ marginTop: 12, opacity: 0.6 }}>
          {failed.map(e => (
            <div key={e.id} className="list-row">
              <span style={{ fontSize: 13 }}>{e.quest.title}</span>
              <span className="badge danger" style={{ fontSize: 10 }}>FAILED</span>
            </div>
          ))}
        </SystemWindow>
      )}
    </>
  );
}
