import React, { memo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
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
}

function colorsFor(variant: ButtonVariant, theme: Theme): { bg: string; fg: string } {
  switch (variant) {
    case 'operator':
    case 'equals':
      return { bg: theme.gold, fg: theme.goldText };
    case 'function':
      return { bg: theme.keyFunction, fg: theme.keyFunctionText };
    case 'memory':
      return { bg: theme.keyMemory, fg: theme.keyMemoryText };
    default:
      return { bg: theme.keyDigit, fg: theme.keyDigitText };
  }
}

/** One rounded keypad button. Fills the space its parent row gives it. */
function CalcButtonBase({ label, accessibilityLabel, variant, theme, haptics, onPress }: Props) {
  const { bg, fg } = colorsFor(variant, theme);
  const fontSize = variant === 'memory' ? 15 : variant === 'digit' ? 28 : 26;

  const handlePress = () => {
    if (haptics) {
      const style =
        variant === 'equals' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light;
      Haptics.impactAsync(style).catch(() => undefined);
    }
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, borderColor: theme.border },
        variant === 'memory' && styles.memory,
        pressed && styles.pressed,
      ]}
    >
      <Text
        allowFontScaling={false}
        style={[styles.label, { color: fg, fontSize, fontWeight: variant === 'memory' ? '600' : '500' }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export const CalcButton = memo(CalcButtonBase);

const styles = StyleSheet.create({
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
  },
  memory: { borderRadius: 16 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.95 }] },
  label: { includeFontPadding: false },
});
