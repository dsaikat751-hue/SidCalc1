import React, { useLayoutEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { useMotion } from '../hooks/useMotion';

interface Props {
  /** Changes whenever the visible screen changes. */
  screenKey: string;
  /** +1 slides in from the right, -1 from the left. */
  direction: number;
  children: React.ReactNode;
}

/** Same fade-and-slide for every screen change. Never blocks touches. */
export function ScreenTransition({ screenKey, direction, children }: Props) {
  const motion = useMotion();
  const progress = useRef(new Animated.Value(1)).current;
  const first = useRef(true);

  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (motion.mode === 'off') {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: motion.mode === 'reduced' ? 140 : 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenKey]);

  const distance = motion.mode === 'full' ? 22 * motion.intensity * direction : 0;

  return (
    <Animated.View
      style={[
        styles.fill,
        {
          opacity: progress,
          transform: [
            { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
