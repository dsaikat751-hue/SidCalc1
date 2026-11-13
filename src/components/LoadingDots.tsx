import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useMotion } from '../hooks/useMotion';

/** Three softly pulsing dots. Used only while saved settings load. */
export function LoadingDots({ color }: { color: string }) {
  const motion = useMotion();
  const dots = useRef([0, 1, 2].map(() => new Animated.Value(0.3))).current;

  useEffect(() => {
    if (motion.mode === 'off') return;
    const loops = dots.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 140),
          Animated.timing(v, { toValue: 1, duration: 320, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(v, { toValue: 0.3, duration: 320, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [dots, motion.mode]);

  return (
    <View style={styles.row} accessibilityLabel="Loading" accessibilityRole="progressbar">
      {dots.map((v, i) => (
        <Animated.View key={i} style={[styles.dot, { backgroundColor: color, opacity: v }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  dot: { width: 12, height: 12, borderRadius: 6 },
});
