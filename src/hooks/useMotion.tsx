/**
 * Motion configuration shared by every animated component.
 *
 * The effective mode combines the user's Animation Settings with Android's
 * own "remove animations" accessibility preference:
 *   off     – no animation at all (everything appears instantly)
 *   reduced – gentle fades only: no movement, scaling, glow, sweep or shake
 *   full    – the complete animation set, scaled by the intensity setting
 */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import type { Intensity, Settings } from '../storage/storage';

export type MotionMode = 'off' | 'reduced' | 'full';

export interface Motion {
  mode: MotionMode;
  /** Multiplier for distances, glow strength and press depth (0.55 – 1.35). */
  intensity: number;
  /** Length of the neon answer reveal in milliseconds (380 – 640). */
  revealMs: number;
  /** True when Android's system reduced-motion preference is on. */
  systemReduced: boolean;
}

export const DEFAULT_MOTION: Motion = {
  mode: 'full',
  intensity: 1,
  revealMs: 520,
  systemReduced: false,
};

const LEVELS: Record<Intensity, { intensity: number; revealMs: number }> = {
  low: { intensity: 0.55, revealMs: 380 },
  medium: { intensity: 1, revealMs: 520 },
  high: { intensity: 1.35, revealMs: 640 },
};

const MotionContext = createContext<Motion>(DEFAULT_MOTION);

export const MotionProvider = MotionContext.Provider;

/** Read the current motion configuration. */
export function useMotion(): Motion {
  return useContext(MotionContext);
}

/** Follows Android's system "reduce motion" accessibility setting. */
export function useSystemReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        if (alive) setReduced(v);
      })
      .catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return reduced;
}

/** Combine the saved settings with the system preference. */
export function useMotionConfig(settings: Settings): Motion {
  const systemReduced = useSystemReducedMotion();
  return useMemo(() => {
    const level = LEVELS[settings.animationIntensity];
    let mode: MotionMode = 'full';
    if (!settings.animationsEnabled) mode = 'off';
    else if (settings.reducedMotion || systemReduced) mode = 'reduced';
    return { mode, systemReduced, ...level };
  }, [settings.animationsEnabled, settings.animationIntensity, settings.reducedMotion, systemReduced]);
}
