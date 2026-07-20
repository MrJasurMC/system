import { useEffect, useState } from 'react';

/** Ticking `Hh Mm Ss` readout until `endDate`. Shared by Boss and Quests pages. */
export function Countdown({
  endDate,
  endedLabel = 'ENDED'
}) {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    const tick = () => {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining(endedLabel);
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor(diff % 3600000 / 60000);
      const s = Math.floor(diff % 60000 / 1000);
      setRemaining(`${h}h ${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endDate, endedLabel]);
  return <>{remaining}</>;
}