import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
function comboLabel(combo) {
  if (combo >= 2) return `Momentum ×${combo}`;
  return null;
}

/** Where the card should spawn from — top-right, clear of the sidebar. */
function spawnOrigin() {
  return {
    x: window.innerWidth - 40,
    y: 110
  };
}

/** The live position of the sidebar XP bar, so the flying XP number has a real destination. */
function xpBarTarget() {
  const el = document.getElementById('global-xp-bar');
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}
export function MissionCompleteToast() {
  const {
    socket
  } = useAuth();
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);
  useEffect(() => {
    if (!socket) return;
    function onClaimed(payload) {
      counter.current += 1;
      const toast = {
        ...payload,
        key: `${payload.questId}-${counter.current}`,
        origin: spawnOrigin(),
        target: xpBarTarget()
      };
      setToasts(t => [...t, toast]);
      setTimeout(() => {
        setToasts(t => t.filter(x => x.key !== toast.key));
      }, 2600);
    }
    socket.on('quest:claimed', onClaimed);
    return () => {
      socket.off('quest:claimed', onClaimed);
    };
  }, [socket]);
  const attrEntries = r => r ? Object.entries(r).filter(([, v]) => v > 0) : [];
  return <div style={{
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 9998
  }}>
      <AnimatePresence>
        {toasts.map((t, i) => {
        const combo = comboLabel(t.combo);
        const dx = t.target ? t.target.x - t.origin.x : -160;
        const dy = t.target ? t.target.y - t.origin.y : 400;
        return <motion.div key={t.key} initial={{
          opacity: 0,
          x: t.origin.x - 280,
          y: t.origin.y + i * 78,
          scale: 0.9
        }} animate={{
          opacity: 1,
          x: t.origin.x - 280,
          y: t.origin.y + i * 78,
          scale: 1
        }} exit={{
          opacity: 0,
          x: t.origin.x - 260,
          transition: {
            duration: 0.35
          }
        }} transition={{
          duration: 0.4,
          ease: [0.16, 1, 0.3, 1]
        }} style={{
          position: 'absolute',
          width: 260,
          background: 'rgba(10,14,22,0.94)',
          border: '1px solid var(--xp)',
          borderRadius: 10,
          padding: '12px 14px',
          boxShadow: '0 0 24px rgba(52,211,153,0.18)',
          backdropFilter: 'blur(4px)'
        }}>
              <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
                <motion.div initial={{
              scale: 0,
              rotate: -25
            }} animate={{
              scale: 1,
              rotate: 0
            }} transition={{
              type: 'spring',
              stiffness: 400,
              damping: 14,
              delay: 0.1
            }} style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: 'var(--xp)',
              color: '#04140d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 15,
              fontWeight: 700,
              flexShrink: 0
            }}>
                  ✓
                </motion.div>
                <div style={{
              minWidth: 0
            }}>
                  <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em'
              }}>
                    Mission Complete
                  </div>
                  <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 14,
                color: 'var(--text)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                    {t.title}
                  </div>
                </div>
              </div>

              <div style={{
            display: 'flex',
            gap: 6,
            marginTop: 8,
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
                <span className="badge green" style={{
              fontSize: 10
            }}>+{t.xpReward} XP</span>
                {t.goldReward > 0 && <span className="badge gold" style={{
              fontSize: 10
            }}>+{t.goldReward} GOLD</span>}
                {attrEntries(t.attributeReward).map(([attr, val]) => <motion.span key={attr} className="badge blue" style={{
              fontSize: 10
            }} initial={{
              opacity: 0,
              y: 4
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              delay: 0.25
            }}>
                    +{val} {attr}
                  </motion.span>)}
              </div>

              {combo && <motion.div initial={{
            opacity: 0,
            scale: 0.8
          }} animate={{
            opacity: 1,
            scale: 1
          }} transition={{
            delay: 0.3,
            type: 'spring',
            stiffness: 300,
            damping: 16
          }} style={{
            marginTop: 8,
            fontFamily: 'var(--font-display)',
            fontSize: 12,
            fontWeight: 600,
            color: t.combo >= 5 ? 'var(--gold)' : 'var(--violet)',
            letterSpacing: '0.05em'
          }}>
                  {combo}
                  {t.isNewBestCombo && t.combo >= 5 && ' — New Best!'}
                </motion.div>}

              {/* XP flying toward the sidebar bar */}
              <motion.div initial={{
            opacity: 1,
            x: 0,
            y: 0,
            scale: 1
          }} animate={{
            opacity: 0,
            x: dx,
            y: dy,
            scale: 0.4
          }} transition={{
            duration: 0.9,
            delay: 0.5,
            ease: 'easeIn'
          }} style={{
            position: 'absolute',
            right: 14,
            top: 12,
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--xp)',
            textShadow: '0 0 10px rgba(52,211,153,0.6)'
          }}>
                +{t.xpReward}
              </motion.div>
            </motion.div>;
      })}
      </AnimatePresence>
    </div>;
}