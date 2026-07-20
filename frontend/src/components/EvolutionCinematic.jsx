import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
function buildParticles(count) {
  const hues = ['accent', 'violet', 'gold'];
  return Array.from({
    length: count
  }, (_, i) => ({
    id: i,
    angle: i / count * 360 + (Math.random() * 20 - 10),
    distance: 120 + Math.random() * 160,
    size: 2 + Math.random() * 4,
    delay: Math.random() * 0.4,
    hue: hues[i % hues.length]
  }));
}

/** Animated integer readout — counts from `from` to `to` over `duration` seconds. */
function CountUp({
  to,
  duration = 1.1,
  className
}) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, v => Math.round(v).toLocaleString());
  const [display, setDisplay] = useState('0');
  useEffect(() => {
    const controls = animate(mv, to, {
      duration,
      ease: [0.16, 1, 0.3, 1]
    });
    const unsub = rounded.on('change', v => setDisplay(v));
    return () => {
      controls.stop();
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to]);
  return <span className={className}>{display}</span>;
}
const HUE_COLOR = {
  accent: 'var(--accent)',
  violet: 'var(--violet)',
  gold: 'var(--gold)'
};
export function EvolutionCinematic() {
  const {
    socket
  } = useAuth();
  const [queue, setQueue] = useState([]);
  const [active, setActive] = useState(null);
  const [stage, setStage] = useState('enter');
  const timers = useRef([]);
  useEffect(() => {
    if (!socket) return;
    function onLevelUp(payload) {
      setQueue(q => [...q, payload]);
    }
    socket.on('level:up', onLevelUp);
    return () => {
      socket.off('level:up', onLevelUp);
    };
  }, [socket]);

  // Pull the next queued level-up once the stage is clear, so rapid multi-level
  // gains (e.g. a big XP grant) play as a sequence rather than colliding.
  useEffect(() => {
    if (active || queue.length === 0) return;
    const [next, ...rest] = queue;
    setActive(next);
    setQueue(rest);
  }, [active, queue]);
  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (!active) return;
    setStage('enter');
    timers.current.push(setTimeout(() => setStage('reveal'), 150));
    timers.current.push(setTimeout(() => setStage('details'), 1100));
    timers.current.push(setTimeout(() => setStage('exit'), 4600));
    timers.current.push(setTimeout(() => setActive(null), 5100));
    return () => {
      timers.current.forEach(clearTimeout);
    };
  }, [active]);
  const particles = useMemo(() => active ? buildParticles(28) : [], [active]);
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  return <AnimatePresence>
      {active && stage !== 'exit' && <motion.div key={`${active.level}-${active.source ?? ''}`} initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} exit={{
      opacity: 0,
      transition: {
        duration: 0.5
      }
    }} role="dialog" aria-live="assertive" aria-label={`Level up. You reached level ${active.level}.`} style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse 900px 700px at 50% 45%, rgba(63,169,245,0.14), transparent 65%), rgba(2,4,9,0.92)',
      backdropFilter: 'blur(6px)'
    }}>
          {/* Particle burst */}
          {!prefersReducedMotion && <div style={{
        position: 'absolute',
        width: 0,
        height: 0,
        top: '42%',
        left: '50%'
      }}>
              {particles.map(p => {
          const rad = p.angle * Math.PI / 180;
          const x = Math.cos(rad) * p.distance;
          const y = Math.sin(rad) * p.distance;
          return <motion.span key={p.id} initial={{
            x: 0,
            y: 0,
            opacity: 0,
            scale: 0
          }} animate={{
            x: [0, x * 0.5, x],
            y: [0, y * 0.5, y],
            opacity: [0, 1, 0],
            scale: [0, 1, 0.4]
          }} transition={{
            duration: 1.6,
            delay: 0.3 + p.delay,
            ease: 'easeOut'
          }} style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: HUE_COLOR[p.hue],
            boxShadow: `0 0 ${p.size * 3}px ${HUE_COLOR[p.hue]}`
          }} />;
        })}
            </div>}

          {/* Ring pulse behind the level number */}
          <motion.div initial={{
        scale: 0.3,
        opacity: 0
      }} animate={{
        scale: [0.3, 1.4, 1.2],
        opacity: [0, 0.6, 0]
      }} transition={{
        duration: 1.4,
        delay: 0.3,
        ease: 'easeOut'
      }} style={{
        position: 'absolute',
        width: 260,
        height: 260,
        borderRadius: '50%',
        border: '2px solid var(--accent)',
        top: '42%',
        left: '50%',
        translateX: '-50%',
        translateY: '-50%'
      }} />

          <motion.div initial={{
        opacity: 0,
        y: 14,
        letterSpacing: '0.1em'
      }} animate={{
        opacity: 1,
        y: 0,
        letterSpacing: '0.4em'
      }} transition={{
        duration: 0.7,
        delay: 0.15
      }} style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 14,
        color: 'var(--accent-soft)',
        textTransform: 'uppercase',
        marginBottom: 14
      }}>
            Evolution Complete
          </motion.div>

          <motion.div initial={{
        opacity: 0,
        scale: 0.7
      }} animate={{
        opacity: 1,
        scale: 1
      }} transition={{
        duration: 0.8,
        delay: 0.35,
        ease: [0.16, 1, 0.3, 1]
      }} style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: 22,
        color: 'var(--text-dim)',
        marginBottom: 2
      }}>
            LEVEL UP
          </motion.div>

          <motion.div initial={{
        opacity: 0,
        scale: 0.6
      }} animate={{
        opacity: 1,
        scale: 1
      }} transition={{
        duration: 0.9,
        delay: 0.45,
        ease: [0.16, 1, 0.3, 1]
      }} style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: 84,
        lineHeight: 1,
        color: '#fff',
        textShadow: '0 0 40px rgba(63,169,245,0.65), 0 0 90px rgba(139,92,246,0.35)'
      }}>
            {active.level}
          </motion.div>

          <AnimatePresence>
            {stage === 'details' && <motion.div initial={{
          opacity: 0,
          y: 16
        }} animate={{
          opacity: 1,
          y: 0
        }} exit={{
          opacity: 0,
          y: -8
        }} transition={{
          duration: 0.5
        }} style={{
          marginTop: 26,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10
        }}>
                <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 26,
            color: 'var(--xp)',
            textShadow: '0 0 20px rgba(52,211,153,0.5)'
          }}>
                  +<CountUp to={active.xpGained} /> XP
                </div>

                {active.unallocatedPointsGained > 0 && <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 15,
            color: 'var(--text)'
          }}>
                    +{active.unallocatedPointsGained} Attribute Points Unlocked
                  </div>}

                {active.rankChanged && <motion.div initial={{
            opacity: 0,
            scale: 0.85
          }} animate={{
            opacity: 1,
            scale: 1
          }} transition={{
            duration: 0.5,
            delay: 0.25
          }} style={{
            marginTop: 8,
            padding: '10px 22px',
            border: '1px solid var(--gold)',
            borderRadius: 8,
            color: 'var(--gold)',
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: 15,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            boxShadow: '0 0 24px rgba(234,185,118,0.25)'
          }}>
                    Unlocked: {active.rank} Rank
                  </motion.div>}

                <button onClick={() => setStage('exit')} style={{
            marginTop: 22,
            background: 'transparent',
            border: '1px solid var(--border-bright)',
            color: 'var(--text-dim)',
            borderRadius: 6,
            padding: '8px 18px',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            cursor: 'pointer'
          }}>
                  Continue
                </button>
              </motion.div>}
          </AnimatePresence>
        </motion.div>}
    </AnimatePresence>;
}