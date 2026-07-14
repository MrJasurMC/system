import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { ProceduralIcon } from './icons/ProceduralIcon';
import { resolveAchievementIconCategory } from './icons/iconMapping';
import { RARITY_COLOR } from '../constants/rarityColors';

interface AchievementUnlockedPayload {
  achievementId: string;
  title: string;
  description?: string;
  icon?: string;
  rarity: string;
}

/**
 * A rarer, bigger moment than the quest-complete toast — achievements are
 * meant to feel like an event, so this takes over center screen briefly
 * instead of sliding in from the corner.
 */
export function AchievementUnlockToast() {
  const { socket } = useAuth();
  const queryClient = useQueryClient();
  const [active, setActive] = useState<AchievementUnlockedPayload | null>(null);
  const queue = useRef<AchievementUnlockedPayload[]>([]);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!socket) return;
    function onUnlocked(payload: AchievementUnlockedPayload) {
      queue.current.push(payload);
      // Refresh the Achievements page data in the background so it's
      // already up to date if the user navigates there next.
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      if (!active) pullNext();
    }
    socket.on('achievement:unlocked', onUnlocked);
    return () => {
      socket.off('achievement:unlocked', onUnlocked);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  function pullNext() {
    const next = queue.current.shift();
    if (!next) return;
    setActive(next);
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    dismissTimer.current = setTimeout(() => dismiss(), 4200);
  }

  function dismiss() {
    setActive(null);
    setTimeout(pullNext, 400);
  }

  const color = active ? RARITY_COLOR[active.rarity] ?? RARITY_COLOR.common : RARITY_COLOR.common;

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key={active.achievementId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={dismiss}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(4,6,11,0.6)',
            backdropFilter: 'blur(3px)',
            cursor: 'pointer',
          }}
        >
          <motion.div
            initial={{ scale: 0.7, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0, transition: { duration: 0.25 } }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            style={{
              width: 360,
              textAlign: 'center',
              padding: '36px 28px 28px',
              background: 'linear-gradient(180deg, rgba(16,20,32,0.98), rgba(8,11,18,0.98))',
              border: `1px solid ${color}`,
              borderRadius: 14,
              boxShadow: `0 0 60px ${color}55, 0 0 0 1px rgba(255,255,255,0.02) inset`,
            }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 12, delay: 0.15 }}
              style={{
                width: 84,
                height: 84,
                margin: '0 auto 18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 42,
                background: `radial-gradient(circle, ${color}33, transparent 70%)`,
                border: `2px solid ${color}`,
                boxShadow: `0 0 30px ${color}88`,
              }}
            >
              {active && (
                <ProceduralIcon
                  seed={active.title}
                  category={resolveAchievementIconCategory(active)}
                  color={color}
                  size={44}
                />
              )}
            </motion.div>

            <div
              style={{
                fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.25em',
                color, textTransform: 'uppercase', marginBottom: 8,
              }}
            >
              Achievement Unlocked
            </div>
            <div
              style={{
                fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800,
                color: '#fff', textShadow: `0 0 20px ${color}`, marginBottom: 8,
              }}
            >
              {active.title}
            </div>
            {active.description && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--text-dim)', lineHeight: 1.6 }}>
                {active.description}
              </div>
            )}

            <div style={{ marginTop: 18, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', opacity: 0.7 }}>
              tap to dismiss
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
