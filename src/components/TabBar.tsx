import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMotion } from '../hooks/useMotion';
import type { Theme } from '../theme';

export type TabId = 'calculator' | 'scientific' | 'converter' | 'history' | 'settings';

export const TABS: ReadonlyArray<{ id: TabId; label: string; glyph: string }> = [
  { id: 'calculator', label: 'Calculator', glyph: '÷' },
  { id: 'scientific', label: 'Scientific', glyph: 'ƒx' },
  { id: 'converter', label: 'Converter', glyph: '⇄' },
  { id: 'history', label: 'History', glyph: '↺' },
  { id: 'settings', label: 'Settings', glyph: '⚙' },
];

interface Props {
  theme: Theme;
  active: TabId;
  onChange: (id: TabId) => void;
}

/** Bottom navigation with a crimson indicator that slides between tabs. */
export function TabBar({ theme, active, onChange }: Props) {
  const motion = useMotion();
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const index = TABS.findIndex((t) => t.id === active);
  const x = useRef(new Animated.Value(index)).current;

  useEffect(() => {
    if (motion.mode === 'off' || motion.mode === 'reduced') {
      x.setValue(index);
      return;
    }
    Animated.timing(x, {
      toValue: index,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [index, motion.mode, x]);

  const tabW = width / TABS.length;

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      style={[
        styles.bar,
        { backgroundColor: theme.surface, borderColor: theme.border, paddingBottom: insets.bottom },
      ]}
    >
      {width > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.indicator,
            {
              width: tabW * 0.5,
              marginLeft: tabW * 0.25,
              backgroundColor: theme.accent,
              shadowColor: theme.glow,
              transform: [{ translateX: x.interpolate({ inputRange: [0, TABS.length], outputRange: [0, width] }) }],
            },
          ]}
        />
      ) : null}
      {TABS.map((t) => {
        const on = t.id === active;
        return (
          <Pressable
            key={t.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={t.label}
            onPress={() => onChange(t.id)}
            android_ripple={motion.mode === 'off' ? undefined : { color: 'rgba(232,18,60,0.30)' }}
            style={styles.tab}
          >
            <Text style={[styles.glyph, { color: on ? theme.accent : theme.textMuted }]}>{t.glyph}</Text>
            <Text
              numberOfLines={1}
              style={[styles.label, { color: on ? theme.text : theme.textMuted, fontWeight: on ? '700' : '500' }]}
            >
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 2,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    elevation: 4,
  },
  tab: { flex: 1, height: 54, alignItems: 'center', justifyContent: 'center', gap: 1, overflow: 'hidden' },
  glyph: { fontSize: 18, includeFontPadding: false },
  label: { fontSize: 11 },
});
