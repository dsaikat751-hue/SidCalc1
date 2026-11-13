import React, { memo, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useMotion } from '../hooks/useMotion';
import type { Theme } from '../theme';

export type ButtonVariant = 'digit' | 'function' | 'memory' | 'operator' | 'equals';

interface Props {
  label: string;
  /** Spoken by TalkBack, e.g. "Divide" for the ÷ button. */
  accessibilityLabel: string;
  variant: ButtonVariant;
  theme: Theme;
  haptics: boolean;
  onPress: () => void;
  /** Relative width inside its row (default 1). */
  flex?: number;
  /** Smaller label, used by the dense scientific rows. */
  small?: boolean;
}

function colorsFor(variant: ButtonVariant, theme: Theme): { bg: string; fg: string } {
  switch (variant) {
    case 'operator':
    case 'equals':
      return { bg: theme.accent, fg: theme.accentText };
    case 'function':
      return { bg: theme.keyFunction, fg: theme.keyFunctionText };
    case 'memory':
      return { bg: theme.keyMemory, fg: theme.keyMemoryText };
    default:
      return { bg: theme.keyDigit, fg: theme.keyDigitText };
  }
}

/** One rounded keypad button. Fills the space its parent row gives it. */
function CalcButtonBase({
  label,
  accessibilityLabel,
  variant,
  theme,
  haptics,
  onPress,
  flex = 1,
  small = false,
}: Props) {
  const motion = useMotion();
  const scale = useRef(new Animated.Value(1)).current;
  const { bg, fg } = colorsFor(variant, theme);
  const isAccent = variant === 'operator' || variant === 'equals';
  const fontSize = small ? 16 : variant === 'memory' ? 15 : variant === 'digit' ? 28 : 26;

  // Operators press in deeper than digits so they feel different under the finger.
  const depth = (isAccent ? 0.1 : variant === 'memory' ? 0.05 : 0.07) * motion.intensity;
  const animate = motion.mode === 'full';

  const handlePressIn = () => {
    if (!animate) return;
    Animated.timing(scale, {
      toValue: 1 - depth,
      duration: 70,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (!animate) return;
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 220,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (haptics) {
      if (variant === 'digit') Haptics.selectionAsync().catch(() => undefined);
      else {
        const style =
          variant === 'equals' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light;
        Haptics.impactAsync(style).catch(() => undefined);
      }
    }
    onPress();
  };

  // Crimson ripple on dark keys, a light ripple on the crimson keys themselves.
  const ripple =
    motion.mode === 'off'
      ? undefined
      : { color: isAccent ? 'rgba(255,255,255,0.32)' : 'rgba(232,18,60,0.45)', foreground: true };

  return (
    <Animated.View style={[styles.cell, { flex, transform: [{ scale }] }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={ripple}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: bg, borderColor: theme.border },
          variant === 'memory' && styles.memory,
          pressed && motion.mode !== 'full' && styles.pressedFlat,
        ]}
      >
        <Text
          allowFontScaling={false}
          style={[styles.label, { color: fg, fontSize, fontWeight: variant === 'memory' ? '600' : '500' }]}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export const CalcButton = memo(CalcButtonBase);

const styles = StyleSheet.create({
  cell: { flex: 1 },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    elevation: 2,
  },
  memory: { borderRadius: 16, elevation: 0 },
  pressedFlat: { opacity: 0.8 },
  label: { includeFontPadding: false },
});
