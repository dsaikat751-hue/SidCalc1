import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Theme } from '../theme';

interface Props {
  theme: Theme;
  onCopy: () => void;
  onHistory: () => void;
  onSettings: () => void;
}

function Pill({
  theme,
  label,
  a11y,
  onPress,
}: {
  theme: Theme;
  label: string;
  a11y: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.pill,
        { borderColor: theme.border, backgroundColor: theme.surface },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text style={[styles.pillText, { color: theme.text }]}>{label}</Text>
    </Pressable>
  );
}

/** Top bar: app name on the left, quick actions on the right. */
export function Header({ theme, onCopy, onHistory, onSettings }: Props) {
  return (
    <View style={styles.bar}>
      <Text accessibilityRole="header" style={[styles.title, { color: theme.gold }]}>
        SidCalc
      </Text>
      <View style={styles.actions}>
        <Pill theme={theme} label="Copy" a11y="Copy result to clipboard" onPress={onCopy} />
        <Pill theme={theme} label="History" a11y="Open calculation history" onPress={onHistory} />
        <Pill theme={theme} label="Settings" a11y="Open settings" onPress={onSettings} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 52,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 22, fontWeight: '700', letterSpacing: 1 },
  actions: { flexDirection: 'row', gap: 8 },
  pill: {
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: { fontSize: 13, fontWeight: '600' },
});
