import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_SETTINGS,
  Settings,
  loadMemory,
  loadSettings,
  saveMemory,
  saveSettings,
} from '../storage/storage';

/** Theme + haptics preference, remembered between launches. */
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    loadSettings().then((s) => {
      if (!alive) return;
      setSettings(s);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  return { settings, ready, update };
}

/** The memory register (MC / MR / M+ / M-), remembered between launches. */
export function useMemoryRegister() {
  const [memory, setMemoryState] = useState(0);

  useEffect(() => {
    let alive = true;
    loadMemory().then((m) => {
      if (alive) setMemoryState(m);
    });
    return () => {
      alive = false;
    };
  }, []);

  const setMemory = useCallback((value: number) => {
    setMemoryState(value);
    saveMemory(value);
  }, []);

  return { memory, setMemory };
}
