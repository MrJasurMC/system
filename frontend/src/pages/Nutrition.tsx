import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { getErrorMessage } from '../utils/errors';
import { ErrorState } from '../components/ui/ErrorState';
import { SystemWindow } from '../components/SystemWindow';
import { useCharacter, CHARACTER_QUERY_KEY } from '../hooks/useCharacter';

/**
 * Mirrors QuestGeneratorService.nutritionTargets on the backend, so the
 * result shows instantly on button press instead of waiting on a round
 * trip. The actual values driving the Side quest are always computed
 * server-side from the saved weight/age — this is just for display.
 */
function computeTargets(weightKg: number, ageYears: number) {
  let kcalPerKg: number;
  if (ageYears < 18) kcalPerKg = 45;
  else if (ageYears <= 30) kcalPerKg = 40;
  else if (ageYears <= 50) kcalPerKg = 37;
  else kcalPerKg = 33;

  const calories = Math.round((weightKg * kcalPerKg) / 50) * 50;
  const waterLiters = Math.max(2.5, Math.round(weightKg * 0.04 * 10) / 10);
  return { calories, waterLiters };
}

export function Nutrition() {
  const { data: char } = useCharacter();
  const queryClient = useQueryClient();

  const [ageInput, setAgeInput] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ calories: number; waterLiters: number } | null>(null);

  async function onCalculate() {
    const age = Number(ageInput);
    const weight = Number(weightInput);

    if (!age || age < 5 || age > 120) {
      setError('Enter a valid age (5–120).');
      return;
    }
    if (!weight || weight < 15) {
      setError('Enter a valid weight in kg.');
      return;
    }

    setError('');
    setBusy(true);
    try {
      setResult(computeTargets(weight, age));
      await api.patch(`/characters/${char!.id}/nutrition`, {
        weightKg: Math.round(weight),
        ageYears: Math.round(age),
      });
      await queryClient.invalidateQueries({ queryKey: CHARACTER_QUERY_KEY });
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Could not save your nutrition targets.'));
    } finally {
      setBusy(false);
    }
  }

  const savedCalories = char?.weightKg && char?.ageYears ? computeTargets(char.weightKg, char.ageYears) : null;

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Nutrition</h1>
      </div>

      <SystemWindow title="Daily Targets">
        <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 12 }}>
          Enter your age and bodyweight to get a daily calorie and water target. Your Side quest
          picks these up automatically. This is general beginner weight-gain guidance, not a
          medical plan — check in with a doctor or parent as your weight changes.
        </p>

        {savedCalories && (
          <div
            style={{
              display: 'flex', gap: 16, marginBottom: 16, padding: 12,
              border: '1px solid var(--border)', borderRadius: 8, background: 'var(--panel-raised)',
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Current target
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14 }}>
                {savedCalories.calories} kcal · {savedCalories.waterLiters}L water
              </div>
            </div>
          </div>
        )}

        {error && <ErrorState message={error} />}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            className="input"
            type="number"
            min={5}
            max={120}
            placeholder="Age (years)"
            value={ageInput}
            onChange={(e) => setAgeInput(e.target.value)}
            style={{ flex: 1, minWidth: 120 }}
          />
          <input
            className="input"
            type="number"
            min={15}
            placeholder="Weight (kg)"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            style={{ flex: 1, minWidth: 120 }}
          />
          <button className="btn" disabled={busy || !char} onClick={onCalculate}>
            {busy ? 'Calculating...' : 'Calculate'}
          </button>
        </div>

        {result && (
          <div style={{ marginTop: 16, padding: 12, border: '1px solid var(--accent)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>Your daily targets</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700 }}>
              {result.calories} kcal
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700 }}>
              {result.waterLiters}L water
            </div>
          </div>
        )}
      </SystemWindow>
    </>
  );
}
