import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
function spawnOrigin() {
  return {
    x: window.innerWidth - 40,
    y: 110
  };
}
export function PurchaseCompleteToast() {
  const {
    socket
  } = useAuth();
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);
  useEffect(() => {
    if (!socket) return;
    function onPurchased(payload) {
      counter.current += 1;
      const toast = {
        ...payload,
        key: `${payload.itemId}-${counter.current}`,
        origin: spawnOrigin()
      };
      setToasts(t => [...t, toast]);
      setTimeout(() => {
        setToasts(t => t.filter(x => x.key !== toast.key));
      }, 2600);
    }
    socket.on('exchange:purchased', onPurchased);
    return () => {
      socket.off('exchange:purchased', onPurchased);
    };
  }, [socket]);
  return <div style={{
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 9998
  }}>
      <AnimatePresence>
        {toasts.map((t, i) => <motion.div key={t.key} initial={{
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
        border: '1px solid var(--gold)',
        borderRadius: 10,
        padding: '12px 14px',
        boxShadow: '0 0 24px rgba(255,215,0,0.18)',
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
            background: 'var(--gold)',
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
                  Purchase Complete
                </div>
                <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 14,
              color: 'var(--text)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
                  {t.name}
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
              <span className="badge gold" style={{
            fontSize: 10
          }}>-{t.goldSpent} GOLD</span>
            </div>
          </motion.div>)}
      </AnimatePresence>
    </div>;
}