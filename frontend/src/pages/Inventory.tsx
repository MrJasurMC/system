import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { getErrorMessage } from '../utils/errors';
import { ErrorState } from '../components/ui/ErrorState';
import { SystemWindow } from '../components/SystemWindow';
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
  sellValue: number;
  attackBonus?: number;
  maxDurability?: number;
  icon?: string;
}

interface InventoryEntry {
  id: string;
  itemId: string;
  quantity: number;
  equipped: boolean;
  remainingDurability?: number | null;
  item: Item;
}

const rarityBadge: Record<string, string> = {
  common: '',
  uncommon: 'green',
  rare: 'blue',
  epic: 'violet',
  legendary: 'gold',
  mythic: 'red',
  celestial: 'rainbow',
};

export function Inventory() {
  const [items, setItems] = useState<InventoryEntry[]>([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    try {
      setItems(await api.get<InventoryEntry[]>('/inventory'));
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to load inventory.'));
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function use(itemId: string) {
    setBusyId(itemId);
    try {
      await api.post(`/inventory/use/${itemId}`);
      await load();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to consume item.'));
    } finally {
      setBusyId(null);
    }
  }

  async function sell(itemId: string) {
    if (!window.confirm('Are you sure you want to sell this item?')) return;
    setBusyId(itemId);
    try {
      await api.post(`/inventory/sell/${itemId}`);
      await load();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Could not sell item.'));
    } finally {
      setBusyId(null);
    }
  }

  async function equip(itemId: string) {
    setBusyId(itemId);
    try {
      await api.post(`/inventory/equip/${itemId}`);
      await load();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Could not equip item.'));
    } finally {
      setBusyId(null);
    }
  }

  async function unequip(itemId: string) {
    setBusyId(itemId);
    try {
      await api.post(`/inventory/unequip/${itemId}`);
      await load();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Could not unequip item.'));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">
          Inventory
          <small>ITEMS &amp; EQUIPMENT</small>
        </h1>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
        {items.length === 0 && <div className="empty-state" style={{ gridColumn: '1 / -1' }}>Your inventory is empty.</div>}
        
        {items.map((entry) => (
          <SystemWindow key={entry.id} title={entry.item.type.toUpperCase()}>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div
                  style={{
                    fontSize: 26, width: 44, height: 44, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 8,
                  }}
                >
                  <ProceduralIcon
                    seed={entry.item.name}
                    category={resolveItemIconCategory(entry.item)}
                    color={RARITY_COLOR[entry.item.rarity] ?? RARITY_COLOR.common}
                    size={28}
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {entry.item.name}
                    {entry.quantity > 1 && <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>x{entry.quantity}</span>}
                    {entry.equipped && <span className="badge green" style={{ fontSize: 9 }}>EQUIPPED</span>}
                  </h3>

                  <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span className={`badge ${rarityBadge[entry.item.rarity] || ''}`}>{entry.item.rarity}</span>
                    {entry.item.type === 'weapon' && !!entry.item.attackBonus && (
                      <span className="badge red">+{entry.item.attackBonus} ATK</span>
                    )}
                  </div>
                </div>
              </div>

              {entry.item.type === 'weapon' && !!entry.item.maxDurability && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', marginBottom: 3 }}>
                    <span>DURABILITY</span>
                    <span>{entry.remainingDurability ?? entry.item.maxDurability} / {entry.item.maxDurability}</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: 'var(--panel)', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.max(0, Math.min(100, ((entry.remainingDurability ?? entry.item.maxDurability) / entry.item.maxDurability) * 100))}%`,
                        background: (entry.remainingDurability ?? entry.item.maxDurability) <= entry.item.maxDurability * 0.25 ? 'var(--red, #ff6b6b)' : 'var(--accent-soft)',
                      }}
                    />
                  </div>
                </div>
              )}

              <p style={{ flex: 1, color: 'var(--text-dim)', fontSize: 13, lineHeight: 1.4, margin: '12px 0 16px 0' }}>
                {entry.item.description || 'No description provided.'}
              </p>

              <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                {entry.item.type === 'reward' && (
                  <button 
                    className="btn" 
                    style={{ flex: 1 }}
                    disabled={busyId === entry.itemId} 
                    onClick={() => use(entry.itemId)}
                  >
                    {busyId === entry.itemId ? '...' : 'Consume Reward'}
                  </button>
                )}

                {(entry.item.type === 'weapon' || entry.item.type === 'cosmetic') && (
                  entry.equipped ? (
                    <button
                      className="btn ghost"
                      style={{ flex: 1 }}
                      disabled={busyId === entry.itemId}
                      onClick={() => unequip(entry.itemId)}
                    >
                      {busyId === entry.itemId ? '...' : 'Unequip'}
                    </button>
                  ) : (
                    <button
                      className="btn"
                      style={{ flex: 1 }}
                      disabled={busyId === entry.itemId}
                      onClick={() => equip(entry.itemId)}
                    >
                      {busyId === entry.itemId ? '...' : 'Equip'}
                    </button>
                  )
                )}
                
                {entry.item.sellValue > 0 && (
                  <button 
                    className="btn ghost"
                    style={{ flex: 1, color: '#ff6b6b', borderColor: '#ff6b6b33' }}
                    disabled={busyId === entry.itemId || entry.equipped} 
                    onClick={() => sell(entry.itemId)}
                  >
                    Sell ({entry.item.sellValue} G)
                  </button>
                )}
              </div>
            </div>
          </SystemWindow>
        ))}
      </div>
    </>
  );
}
