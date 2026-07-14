import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { getErrorMessage } from '../utils/errors';
import { ErrorState } from '../components/ui/ErrorState';
import { SystemWindow } from '../components/SystemWindow';
import { useCharacter, CHARACTER_QUERY_KEY } from '../hooks/useCharacter';
import { ProceduralIcon } from '../components/icons/ProceduralIcon';
import { resolveItemIconCategory } from '../components/icons/iconMapping';
import { RARITY_COLOR } from '../constants/rarityColors';

interface Item {
  id: string;
  name: string;
  type: string;
  rarity: string;
  category: string;
  description?: string;
  goldPrice: number;
  attackBonus?: number;
  maxDurability?: number;
  icon?: string;
  exchangeExpiresAt?: string;
  unlockRequirements?: Record<string, unknown>;
  weekRotation?: boolean;
}

const rarityBadge: Record<string, string> = {
  common: '',
  uncommon: 'green',
  rare: 'blue',
  epic: 'violet',
  legendary: 'gold',
  mythic: 'red',
  celestial: 'rainbow', // assume CSS class handles this
};

export function Exchange() {
  const { data: char } = useCharacter();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [purchaseError, setPurchaseError] = useState<string>('');

  async function load() {
    try {
      setItems(await api.get<Item[]>('/inventory/exchange'));
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to load exchange.'));
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const nextMonday = new Date();
      nextMonday.setDate(nextMonday.getDate() + ((1 + 7 - nextMonday.getDay()) % 7 || 7));
      nextMonday.setHours(0, 0, 0, 0);
      
      const diff = nextMonday.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft('Refreshing...');
        return;
      }
      
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);
      
      setTimeLeft(`${d}d ${h}h ${m}m ${s}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  async function purchase(itemId: string) {
    setBusyId(itemId);
    setPurchaseError('');
    try {
      await api.post(`/inventory/exchange/${itemId}/purchase`);
      // Refresh both the exchange listing and the character's gold —
      // previously only the listing refetched, so gold looked unchanged
      // until the next full page load (e.g. a manual refresh).
      load();
      queryClient.invalidateQueries({ queryKey: CHARACTER_QUERY_KEY });
    } catch (err: unknown) {
      setPurchaseError(getErrorMessage(err, 'Purchase failed.'));
      setTimeout(() => setPurchaseError(''), 4000);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title">
          System Exchange
          <small>EXCLUSIVE REWARDS</small>
        </h1>
        <div style={{ textAlign: 'right', display: 'flex', gap: 24 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1 }}>Current Gold</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 'bold', color: '#ffd700' }}>
              {char?.gold ?? 0} G
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1 }}>Next Refresh</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 'bold', color: 'var(--color-primary)' }}>{timeLeft}</div>
          </div>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}
      {purchaseError && (
        <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8, color: '#fca5a5', marginTop: 16 }}>
          {purchaseError}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 24, marginTop: 24 }}>
        {items.length === 0 && <div className="empty-state" style={{ gridColumn: '1 / -1' }}>The exchange is currently empty.</div>}
        
        {items.map((item) => (
          <SystemWindow key={item.id} title={item.category.toUpperCase()} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ProceduralIcon
                      seed={item.name}
                      category={resolveItemIconCategory(item)}
                      color={RARITY_COLOR[item.rarity] ?? RARITY_COLOR.common}
                      size={24}
                    />
                    {item.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 'bold', color: '#ffd700' }}>
                    {item.goldPrice} <span style={{ fontSize: 14 }}>G</span>
                  </div>
                </div>
                
                <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span className={`badge ${rarityBadge[item.rarity] || ''}`}>{item.rarity}</span>
                  <span className="badge">{item.type}</span>
                  {item.type === 'weapon' && !!item.attackBonus && (
                    <span className="badge red">+{item.attackBonus} ATK</span>
                  )}
                  {item.type === 'weapon' && (
                    <span className="badge" style={{ opacity: 0.8 }}>
                      {item.maxDurability && item.maxDurability > 0
                        ? `${item.maxDurability} use${item.maxDurability === 1 ? '' : 's'}`
                        : 'Unbreakable'}
                    </span>
                  )}
                </div>
                
                <p style={{ color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.5, margin: '0 0 24px 0' }}>
                  {item.description || 'A mysterious reward from the System.'}
                </p>
              </div>

              <button 
                className={`btn ${busyId === item.id ? 'ghost' : ''}`}
                style={{ width: '100%', padding: 12, fontSize: 16, marginTop: 'auto' }}
                disabled={busyId === item.id || (char?.gold ?? 0) < item.goldPrice} 
                onClick={() => purchase(item.id)}
              >
                {busyId === item.id ? 'Purchasing...' : (char?.gold ?? 0) < item.goldPrice ? 'Insufficient Gold' : 'Purchase Reward'}
              </button>
            </div>
          </SystemWindow>
        ))}
      </div>
    </>
  );
}
