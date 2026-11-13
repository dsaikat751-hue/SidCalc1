import { useCallback, useEffect, useState } from 'react';
import {
  HistoryEntry,
  MAX_HISTORY,
  loadHistory,
  saveHistory,
} from '../storage/storage';
import type { AngleMode } from '../engine/calculator';
import { makeId } from '../utils/format';

/**
 * Calculation history that survives app restarts.
 * Newest entries come first. Every change is written to AsyncStorage.
 */
export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load once on start-up. Merge with anything added before loading finished.
  useEffect(() => {
    let alive = true;
    loadHistory().then((stored) => {
      if (!alive) return;
      setEntries((prev) => (prev.length ? [...prev, ...stored].slice(0, MAX_HISTORY) : stored));
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Persist after every change (but never before the first load completes,
  // otherwise we could overwrite saved history with an empty list).
  useEffect(() => {
    if (loaded) saveHistory(entries);
  }, [entries, loaded]);

  const add = useCallback((expression: string, result: string, angle?: AngleMode) => {
    const entry: HistoryEntry = { id: makeId(), expression, result, timestamp: Date.now() };
    if (angle) entry.angle = angle;
    setEntries((prev) => [entry, ...prev].slice(0, MAX_HISTORY));
  }, []);

  const remove = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const clear = useCallback(() => setEntries([]), []);

  return { entries, add, remove, clear };
}
