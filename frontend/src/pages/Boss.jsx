import { useState, useRef, useEffect } from 'react';
import { getErrorMessage } from '../utils/errors';
import { ErrorState } from '../components/ui/ErrorState';
import { Countdown } from '../components/Countdown';
import { useBoss } from '../hooks/useBoss';
import { api } from '../api/client';
import { ProceduralIcon } from '../components/icons/ProceduralIcon';
import { resolveItemIconCategory } from '../components/icons/iconMapping';
import { RARITY_COLOR } from '../constants/rarityColors';
const EXERCISE_TYPES = [{
  key: 'pushup',
  label: 'Push-up',
  damage: 10,
  emoji: '💪'
}, {
  key: 'squat',
  label: 'Squat',
  damage: 8,
  emoji: '🦵'
}, {
  key: 'pullup',
  label: 'Pull-up',
  damage: 20,
  emoji: '⚡'
}, {
  key: 'plank',
  label: 'Plank (sec)',
  damage: 1,
  emoji: '🛡'
}, {
  key: 'running',
  label: 'Running (100m)',
  damage: 5,
  emoji: '🏃'
}];
const TIER_COLORS = {
  common: {
    primary: '#8a94a6',
    glow: 'rgba(138,148,166,0.4)',
    label: 'COMMON'
  },
  elite: {
    primary: '#3fa9f5',
    glow: 'rgba(63,169,245,0.4)',
    label: 'ELITE'
  },
  legendary: {
    primary: '#eab308',
    glow: 'rgba(234,179,8,0.4)',
    label: 'LEGENDARY'
  },
  mythic: {
    primary: '#ef4444',
    glow: 'rgba(239,68,68,0.4)',
    label: 'MYTHIC'
  },
  immortal: {
    primary: '#8b5cf6',
    glow: 'rgba(139,92,246,0.55)',
    label: 'IMMORTAL'
  }
};

/** Deterministic hash of a boss name → picks one of 5 silhouette variants
 * and a few numeric wobbles, so the *same* boss always renders the *same*
 * way, but different bosses actually look different from each other —
 * previously every single boss used one identical horned-circle shape and
 * was colored by `weekNumber % 7` instead of its own tier, so an Immortal
 * boss could render in a random common-tier color with zero visual weight. */
function hashName(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = h * 31 + name.charCodeAt(i) >>> 0;
  return h;
}
function BossPortrait({
  name,
  tier,
  primary
}) {
  const h = hashName(name);
  const variant = h % 5;
  const initial = name.charAt(0).toUpperCase();
  const ringCount = {
    common: 1,
    elite: 1,
    legendary: 2,
    mythic: 2,
    immortal: 3
  }[tier] ?? 1;
  const jitter = n => (h >> n) % 12 - 6;
  return <svg viewBox="0 0 200 200" width="180" height="180" style={{
    display: 'block',
    margin: '0 auto'
  }}>
      <defs>
        <radialGradient id="bossAura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={primary} stopOpacity="0.35" />
          <stop offset="100%" stopColor={primary} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="bossGlow" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor={primary} stopOpacity="0.6" />
          <stop offset="100%" stopColor="#0a0e1a" stopOpacity="1" />
        </radialGradient>
      </defs>

      <circle cx="100" cy="100" r="98" fill="url(#bossAura)">
        <animate attributeName="r" values="90;98;90" dur="3s" repeatCount="indefinite" />
      </circle>

      {/* Tier rings — Immortal gets 3 concentric rings, Legendary/Mythic get 2, everything else gets 1 */}
      {Array.from({
      length: ringCount
    }).map((_, i) => <circle key={i} cx="100" cy="100" r={72 + (i + 1) * 8} fill="none" stroke={primary} strokeWidth="1" opacity={0.25 - i * 0.06} />)}

      <circle cx="100" cy="100" r="72" fill="url(#bossGlow)" stroke={primary} strokeWidth="2" />

      {/* Silhouette variant, deterministic per boss name */}
      {variant === 0 && <>
          {/* Horned brute */}
          <polygon points={`${70 + jitter(2)},45 ${58 + jitter(3)},10 80,40`} fill={primary} opacity="0.9" />
          <polygon points={`${130 - jitter(2)},45 ${142 - jitter(3)},10 120,40`} fill={primary} opacity="0.9" />
        </>}
      {variant === 1 && <>
          {/* Crowned sovereign */}
          <polygon points="65,42 75,15 88,35 100,10 112,35 125,15 135,42" fill={primary} opacity="0.9" />
        </>}
      {variant === 2 && <>
          {/* Winged fiend */}
          <path d={`M40,90 Q10,70 25,${40 + jitter(4)} Q50,60 62,88 Z`} fill={primary} opacity="0.75" />
          <path d={`M160,90 Q190,70 175,${40 + jitter(5)} Q150,60 138,88 Z`} fill={primary} opacity="0.75" />
        </>}
      {variant === 3 && <>
          {/* Tentacled horror */}
          {[0, 1, 2, 3].map(i => <path key={i} d={`M${60 + i * 27},172 Q${55 + i * 27 + jitter(i)},190 ${50 + i * 27},198`} stroke={primary} strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.7" />)}
        </>}
      {variant === 4 && <>
          {/* Blade guardian */}
          <polygon points="100,4 108,40 92,40" fill={primary} opacity="0.9" />
          <polygon points="30,60 65,80 55,95" fill={primary} opacity="0.8" />
          <polygon points="170,60 135,80 145,95" fill={primary} opacity="0.8" />
        </>}

      <ellipse cx="82" cy="88" rx="8" ry="6" fill={primary}>
        <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cx="118" cy="88" rx="8" ry="6" fill={primary}>
        <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
      </ellipse>

      <text x="100" y="125" textAnchor="middle" fontSize="28" fill={primary} fontWeight="900" fontFamily="monospace" opacity="0.5">
        {initial}
      </text>
    </svg>;
}
export function Boss() {
  const {
    boss,
    nextSpawnAt,
    isLoading,
    error: queryError,
    damageBoss,
    isAttacking
  } = useBoss();
  const [exerciseType, setExerciseType] = useState('pushup');
  const [amount, setAmount] = useState(10);
  const [lastDamage, setLastDamage] = useState(null);
  const [error, setError] = useState('');
  const flashRef = useRef(null);
  const [weapons, setWeapons] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedWeapon, setSelectedWeapon] = useState(null);
  async function loadWeapons() {
    try {
      const all = await api.get('/inventory');
      setWeapons(all.filter(entry => !!entry.item?.attackBonus));
    } catch {
      // Non-fatal — weapon picker just stays empty; bare-hands attacks still work.
    }
  }
  useEffect(() => {
    loadWeapons();
  }, []);
  async function attack() {
    if (!boss) return;
    setError('');
    try {
      await damageBoss({
        bossId: boss.id,
        exerciseType,
        amount,
        weaponId: selectedWeapon?.itemId
      });
      const ex = EXERCISE_TYPES.find(e => e.key === exerciseType);
      const weaponBonus = selectedWeapon?.item.attackBonus ?? 0;
      setLastDamage(amount * (ex.damage + weaponBonus));
      if (flashRef.current) clearTimeout(flashRef.current);
      flashRef.current = setTimeout(() => setLastDamage(null), 2500);
      // The weapon may have just broken (or lost a use) — refresh the list
      // and drop the selection if it's no longer owned.
      const refreshed = await api.get('/inventory');
      const weaponEntries = refreshed.filter(entry => !!entry.item?.attackBonus);
      setWeapons(weaponEntries);
      if (selectedWeapon && !weaponEntries.find(w => w.itemId === selectedWeapon.itemId)) {
        setSelectedWeapon(null);
      } else if (selectedWeapon) {
        setSelectedWeapon(weaponEntries.find(w => w.itemId === selectedWeapon.itemId) ?? null);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to submit damage.'));
    }
  }
  const tierTheme = boss ? TIER_COLORS[boss.tier] ?? TIER_COLORS.common : TIER_COLORS.common;
  const primary = tierTheme.primary;
  const hpPct = boss ? Math.max(0, Math.min(100, Number(boss.hp) / Number(boss.maxHp) * 100)) : 0;
  if (isLoading) {
    return <div className="loading-line" style={{
      margin: '80px auto',
      textAlign: 'center'
    }}>SCANNING FOR WORLD BOSS...</div>;
  }
  if (queryError) {
    return <ErrorState message={getErrorMessage(queryError, 'Failed to load boss.')} onRetry={() => window.location.reload()} />;
  }
  if (!boss) {
    // No 404, no error — the weekend just hasn't started yet. This is a
    // normal, expected state (boss only runs Sat–Sun), so it gets a calm
    // "prepare yourself" box with a real countdown, not a red warning box.
    return <div style={{
      maxWidth: 520,
      margin: '80px auto',
      textAlign: 'center'
    }}>
        <div className="system-window" style={{
        padding: '40px 32px',
        border: '1px solid var(--border)'
      }}>
          <div style={{
          fontSize: 32,
          marginBottom: 12,
          opacity: 0.6
        }}>⚔</div>
          <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 22,
          color: 'var(--text)',
          marginBottom: 10
        }}>
            No World Boss Active
          </div>
          <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: 'var(--text-dim)',
          lineHeight: 1.8,
          marginBottom: 20
        }}>
            The World Boss only appears on weekends.
            <br />Prepare yourself.
          </div>
          {nextSpawnAt && <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          color: 'var(--accent-soft)',
          border: '1px solid var(--border)',
          borderRadius: 4,
          padding: '10px 16px',
          display: 'inline-block',
          letterSpacing: '0.04em'
        }}>
              Boss returns in <Countdown endDate={nextSpawnAt} />
            </div>}
        </div>
      </div>;
  }
  return <div style={{
    maxWidth: 700,
    margin: '0 auto',
    paddingBottom: 60
  }}>
      {/* ── HEADER ── */}
      <div style={{
      textAlign: 'center',
      marginBottom: 32
    }}>
        <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        color: primary,
        letterSpacing: '0.25em',
        marginBottom: 8
      }}>
          ⚠ WORLD BOSS DETECTED — WEEK {boss.weekNumber}
        </div>
        <span className="badge" style={{
        borderColor: primary,
        color: primary,
        fontSize: 10,
        letterSpacing: '0.1em',
        marginBottom: 10,
        display: 'inline-block'
      }}>
          {tierTheme.label}
        </span>
        <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 38,
        fontWeight: 900,
        letterSpacing: '0.06em',
        margin: 0,
        color: '#fff',
        textShadow: `0 0 30px ${primary}`
      }}>
          {boss.name}
        </h1>
        <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        color: 'var(--text-dim)',
        marginTop: 8
      }}>
          Time Remaining: <span style={{
          color: primary
        }}>
            <Countdown endDate={boss.endDate} />
          </span>
        </div>
      </div>

      {/* ── AVATAR ── */}
      <div style={{
      position: 'relative',
      marginBottom: 32,
      filter: `drop-shadow(0 0 24px ${primary})`
    }}>
        <BossPortrait name={boss.name} tier={boss.tier} primary={primary} />
        {lastDamage !== null && <div style={{
        position: 'absolute',
        top: '10%',
        left: '50%',
        transform: 'translateX(-50%)',
        fontFamily: 'var(--font-display)',
        fontSize: 32,
        fontWeight: 900,
        color: '#fff',
        textShadow: `0 0 20px ${primary}`,
        animation: 'fadeUpText 2s ease-out forwards',
        pointerEvents: 'none'
      }}>
            -{lastDamage.toLocaleString()} DMG
          </div>}
      </div>

      {/* ── HP BAR ── */}
      <div className="system-window" style={{
      marginBottom: 24,
      border: `1px solid ${primary}`,
      boxShadow: `0 0 20px rgba(0,0,0,0.3)`
    }}>
        <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        marginBottom: 10
      }}>
          <span style={{
          color: 'var(--text-dim)'
        }}>BOSS HP</span>
          <span style={{
          color: primary
        }}>
            {Number(boss.hp).toLocaleString()} / {Number(boss.maxHp).toLocaleString()}
          </span>
        </div>
        <div style={{
        background: 'var(--panel)',
        borderRadius: 4,
        height: 20,
        overflow: 'hidden',
        position: 'relative'
      }}>
          <div style={{
          height: '100%',
          width: `${hpPct}%`,
          background: `linear-gradient(90deg, ${primary}, ${primary}aa)`,
          borderRadius: 4,
          transition: 'width 0.6s ease',
          boxShadow: `0 0 12px ${primary}`
        }} />
        </div>
        <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        color: 'var(--text-dim)',
        marginTop: 6,
        textAlign: 'right'
      }}>
          {hpPct.toFixed(1)}% remaining
        </div>
      </div>

      {/* ── ATTACK PANEL ── */}
      <div className="system-window" style={{
      marginBottom: 24
    }}>
        <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        color: 'var(--text-dim)',
        letterSpacing: '0.15em',
        marginBottom: 16
      }}>
          SELECT EXERCISE TO ATTACK
        </div>

        <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: 8,
        marginBottom: 20
      }}>
          {EXERCISE_TYPES.map(ex => <button key={ex.key} onClick={() => setExerciseType(ex.key)} style={{
          background: exerciseType === ex.key ? primary : 'var(--panel)',
          border: `1px solid ${exerciseType === ex.key ? primary : 'var(--border)'}`,
          color: 'var(--text)',
          padding: '10px 8px',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          cursor: 'pointer',
          transition: 'all 0.2s',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          boxShadow: exerciseType === ex.key ? `0 0 12px ${primary}50` : 'none'
        }}>
              <span style={{
            fontSize: 20
          }}>{ex.emoji}</span>
              <span>{ex.label}</span>
              <span style={{
            color: exerciseType === ex.key ? '#fff' : 'var(--text-dim)',
            fontSize: 10
          }}>
                {ex.damage} DMG/rep
              </span>
            </button>)}
        </div>

        <div style={{
        marginBottom: 20
      }}>
          <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8
        }}>
            <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-dim)',
            letterSpacing: '0.15em'
          }}>
              WEAPON
            </div>
            <button className="btn ghost" style={{
            fontSize: 11,
            padding: '4px 10px'
          }} onClick={() => setPickerOpen(v => !v)}>
              {pickerOpen ? 'Close' : 'Choose Weapon'}
            </button>
          </div>

          {selectedWeapon ? <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 12px',
          background: 'var(--panel)',
          border: `1px solid ${primary}`,
          borderRadius: 4
        }}>
              <ProceduralIcon seed={selectedWeapon.item.name} category={resolveItemIconCategory(selectedWeapon.item)} color={RARITY_COLOR[selectedWeapon.item.rarity] ?? RARITY_COLOR.common} size={20} />
              <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13
          }}>{selectedWeapon.item.name}</span>
              <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: primary
          }}>
                +{selectedWeapon.item.attackBonus ?? 0} ATK
              </span>
              <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-dim)',
            marginLeft: 'auto'
          }}>
                {selectedWeapon.item.maxDurability ? `${selectedWeapon.remainingDurability ?? selectedWeapon.item.maxDurability} use${(selectedWeapon.remainingDurability ?? selectedWeapon.item.maxDurability) === 1 ? '' : 's'} left` : 'Unbreakable'}
              </span>
              <button className="btn ghost" style={{
            fontSize: 11,
            padding: '3px 8px'
          }} onClick={() => setSelectedWeapon(null)}>
                Unequip
              </button>
            </div> : <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: 'var(--text-dim)'
        }}>
              Bare-handed — no weapon selected.
            </div>}

          {pickerOpen && <div style={{
          marginTop: 10,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 8,
          maxHeight: 260,
          overflowY: 'auto',
          padding: 4
        }}>
              {weapons.length === 0 && <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'var(--text-dim)',
            gridColumn: '1 / -1'
          }}>
                  No weapons owned — visit the Exchange to buy one.
                </div>}
              {weapons.map(w => <button key={w.id} onClick={() => {
            setSelectedWeapon(w);
            setPickerOpen(false);
          }} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            textAlign: 'left',
            padding: '10px 12px',
            background: 'var(--panel)',
            border: `1px solid ${selectedWeapon?.itemId === w.itemId ? primary : 'var(--border)'}`,
            color: 'var(--text)',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)'
          }}>
                  <span style={{
              fontSize: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
                    <ProceduralIcon seed={w.item.name} category={resolveItemIconCategory(w.item)} color={RARITY_COLOR[w.item.rarity] ?? RARITY_COLOR.common} size={18} />
                    {w.item.name}
                  </span>
                  <span style={{
              fontSize: 11,
              color: primary
            }}>+{w.item.attackBonus ?? 0} ATK</span>
                  <span style={{
              fontSize: 10,
              color: 'var(--text-dim)'
            }}>
                    {w.item.maxDurability ? `${w.remainingDurability ?? w.item.maxDurability} use${(w.remainingDurability ?? w.item.maxDurability) === 1 ? '' : 's'} left · x${w.quantity}` : 'Unbreakable'}
                  </span>
                </button>)}
            </div>}
        </div>

        <div style={{
        display: 'flex',
        gap: 12,
        alignItems: 'center'
      }}>
          <div style={{
          flex: 1
        }}>
            <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-dim)',
            marginBottom: 6
          }}>REPS / AMOUNT</div>
            <input type="number" min={1} max={9999} value={amount} onChange={e => setAmount(Math.max(1, Number(e.target.value)))} style={{
            width: '100%',
            padding: '10px 12px',
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            fontFamily: 'var(--font-mono)',
            fontSize: 14,
            outline: 'none',
            boxSizing: 'border-box'
          }} />
          </div>
          <div style={{
          paddingTop: 22
        }}>
            <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-dim)',
            marginBottom: 4
          }}>TOTAL DAMAGE</div>
            <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            color: primary,
            fontWeight: 700
          }}>
              {(amount * ((EXERCISE_TYPES.find(e => e.key === exerciseType)?.damage ?? 0) + (selectedWeapon?.item.attackBonus ?? 0))).toLocaleString()}
            </div>
          </div>
        </div>

        {error && <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        color: 'var(--danger)',
        marginTop: 8
      }}>{error}</div>}

        <button className="btn-awaken" style={{
        width: '100%',
        marginTop: 16,
        fontSize: 14,
        padding: '14px',
        letterSpacing: '0.1em'
      }} disabled={isAttacking} onClick={attack}>
          {isAttacking ? 'ATTACKING...' : `⚔ ATTACK ${boss.name.toUpperCase()}`}
        </button>
      </div>

      {/* ── BOSS LORE ── */}
      <div className="system-window" style={{
      opacity: 0.8
    }}>
        <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        color: 'var(--text-dim)',
        letterSpacing: '0.15em',
        marginBottom: 8
      }}>
          SYSTEM LOG
        </div>
        <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 13,
        color: 'var(--text-dim)',
        lineHeight: 1.8
      }}>
          {boss.lore}
        </div>
      </div>
    </div>;
}