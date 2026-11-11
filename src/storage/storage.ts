/**
 * Persistent storage (AsyncStorage). Everything is wrapped in try/catch: a
 * storage failure must never crash the calculator, it just means a value
 * will not be remembered.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemeName } from '../theme';

const KEYS = {
  history: 'sidcalc:history:v1',
  settings: 'sidcalc:settings:v1',
  memory: 'sidcalc:memory:v1',
} as const;

/** Oldest entries are dropped beyond this many, to keep storage small. */
export const MAX_HISTORY = 500;

export interface HistoryEntry {
  id: string;
  expression: string;
  result: string;
  /** Milliseconds since epoch. */
  timestamp: number;
}

export interface Settings {
  theme: ThemeName;
  haptics: boolean;
}

export const DEFAULT_SETTINGS: Settings = { theme: 'dark', haptics: true };

function isEntry(x: unknown): x is HistoryEntry {
  if (typeof x !== 'object' || x === null) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.expression === 'string' &&
    typeof o.result === 'string' &&
    typeof o.timestamp === 'number'
  );
}

export async function loadHistory(): Promise<HistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.history);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isEntry) : [];
  } catch {
    return [];
  }
}

export async function saveHistory(entries: HistoryEntry[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.history, JSON.stringify(entries));
  } catch {
    /* ignore: history just will not persist this time */
  }
}

export async function loadSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.settings);
    if (!raw) return DEFAULT_SETTINGS;
    const p = JSON.parse(raw) as Partial<Settings>;
    return {
      theme: p.theme === 'light' ? 'light' : 'dark',
      haptics: typeof p.haptics === 'boolean' ? p.haptics : true,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.settings, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

export async function loadMemory(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.memory);
    const n = raw === null ? 0 : Number(raw);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export async function saveMemory(value: number): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.memory, String(value));
  } catch {
    /* ignore */
  }
}
