import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Theme } from '../theme';

interface Props {
  theme: Theme;
  title?: string;
  /** When given, a "Copy" pill is shown on the right. */
  onCopy?: () => void;
  /** Optional small text under the title, e.g. the angle mode. */
  subtitle?: string;
}

/** Top bar: app name on the left, quick actions on the right. */
export function Header({ theme, title = 'SidCalc', onCopy, subtitle }: Props) {
  return (
    <View style={styles.bar}>
      <View>
        <Text accessibilityRole="header" style={[styles.title, { color: theme.accent }]}>
          {title}
        </Text>
        {subtitle ? <Text style={[styles.subtitle, { color: theme.textMuted }]}>{subtitle}</Text> : null}
      </View>
      {onCopy ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Copy result to clipboard"
          onPress={onCopy}
          hitSlop={8}
          android_ripple={{ color: 'rgba(232,18,60,0.35)' }}
          style={({ pressed }) => [
            styles.pill,
            { borderColor: theme.border, backgroundColor: theme.surface },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={[styles.pillText, { color: theme.text }]}>Copy</Text>
        </Pressable>
      ) : null}
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
  subtitle: { fontSize: 11, marginTop: -2 },
  pill: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pillText: { fontSize: 13, fontWeight: '600' },
});
