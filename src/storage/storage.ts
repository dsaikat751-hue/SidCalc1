/**
 * Persistent storage (AsyncStorage). Everything is wrapped in try/catch: a
 * storage failure must never crash the calculator, it just means a value
 * will not be remembered.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AngleMode } from '../engine/calculator';
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
  /** Angle mode in force when the calculation was made (trig only). */
  angle?: AngleMode;
}

export type Intensity = 'low' | 'medium' | 'high';

export interface Settings {
  theme: ThemeName;
  haptics: boolean;
  /** DEG / RAD for the scientific functions. */
  angle: AngleMode;
  animationsEnabled: boolean;
  animationIntensity: Intensity;
  /** Extra-calm mode: fades only, no movement, glow or shake. */
  reducedMotion: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  haptics: true,
  angle: 'deg',
  animationsEnabled: true,
  animationIntensity: 'medium',
  reducedMotion: false,
};

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
    // Settings saved by v1.0.0 lack the newer fields: fall back to defaults.
    return {
      theme: p.theme === 'light' ? 'light' : 'dark',
      haptics: typeof p.haptics === 'boolean' ? p.haptics : DEFAULT_SETTINGS.haptics,
      angle: p.angle === 'rad' ? 'rad' : 'deg',
      animationsEnabled:
        typeof p.animationsEnabled === 'boolean'
          ? p.animationsEnabled
          : DEFAULT_SETTINGS.animationsEnabled,
      animationIntensity:
        p.animationIntensity === 'low' || p.animationIntensity === 'high'
          ? p.animationIntensity
          : 'medium',
      reducedMotion:
        typeof p.reducedMotion === 'boolean' ? p.reducedMotion : DEFAULT_SETTINGS.reducedMotion,
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
