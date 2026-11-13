import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useMotion } from '../hooks/useMotion';
import type { Theme } from '../theme';

interface Props {
  theme: Theme;
  /** Increments each time something is copied. */
  tick: number;
  /** What was copied, shown under the checkmark. */
  text: string;
}

/** Brief "copied" confirmation with an animated checkmark. */
export function CopyCheck({ theme, tick, text }: Props) {
  const motion = useMotion();
  const [visible, setVisible] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;
  const draw = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (tick === 0) return;
    setVisible(true);
    fade.setValue(0);
    pop.setValue(0);
    draw.setValue(0);
    const quick = motion.mode === 'off' ? 0 : 1;
    const full = motion.mode === 'full';
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 140 * quick, useNativeDriver: true }),
        Animated.spring(pop, { toValue: 1, friction: 6, tension: 180, useNativeDriver: true }),
        Animated.timing(draw, {
          toValue: 1,
          duration: full ? 260 : 0,
          delay: full ? 90 : 0,
          easing: Easing.out(Easing.back(1.6)),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(750),
      Animated.timing(fade, { toValue: 0, duration: 220 * quick, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) setVisible(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  if (!visible) return null;

  const scale = motion.mode === 'full' ? pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) : 1;

  return (
    <View pointerEvents="none" style={styles.layer}>
      <Animated.View
        style={[
          styles.badge,
          { backgroundColor: theme.surface, borderColor: theme.accent, opacity: fade, transform: [{ scale }] },
        ]}
        accessibilityLiveRegion="polite"
        accessibilityLabel={`Copied ${text}`}
      >
        <Animated.View
          style={[
            styles.check,
            {
              borderColor: theme.accent,
              opacity: draw.interpolate({ inputRange: [0, 1], outputRange: [motion.mode === 'full' ? 0 : 1, 1] }),
              transform: [
                { scale: motion.mode === 'full' ? draw.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) : 1 },
                { rotate: '45deg' },
              ],
            },
          ]}
        />
        <Text numberOfLines={1} style={[styles.text, { color: theme.text }]}>
          Copied {text.length > 18 ? text.slice(0, 17) + '…' : text}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  badge: {
    minWidth: 150,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 10,
    elevation: 12,
  },
  check: {
    width: 14,
    height: 28,
    borderRightWidth: 5,
    borderBottomWidth: 5,
    marginTop: -6,
    borderRadius: 2,
  },
  text: { fontSize: 15, fontWeight: '600' },
});
