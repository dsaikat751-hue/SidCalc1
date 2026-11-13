import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { groupDigits } from '../engine/calculator';
import type { CalcState } from '../engine/input';
import { useMotion } from '../hooks/useMotion';
import type { Theme } from '../theme';

interface Props {
  theme: Theme;
  state: CalcState;
  /** Live preview of the answer while typing, or null. */
  preview: string | null;
  hasMemory: boolean;
  /** Long-pressing the display copies the result. */
  onCopy: () => void;
  /** Increments every time "=" produces an answer: starts the neon reveal. */
  revealTick: number;
  /** Increments on an error or a rejected key press: starts the shake. */
  errorTick: number;
  /** Smaller type for the Scientific screen, which has less room. */
  compact?: boolean;
}

/** Glow layers: [horizontal inset, vertical inset, strength]. Stacked translucent
 *  rounded rectangles give a soft stepped glow on every Android version. */
const GLOW_LAYERS: ReadonlyArray<{ x: number; y: number; strength: number; left?: string }> = [
  { x: -14, y: -16, strength: 0.07 },
  { x: -6, y: -8, strength: 0.1 },
  { x: 0, y: 0, strength: 0.13, left: '22%' },
];

/** Large, readable display with the crimson neon answer reveal. */
export function Display({
  theme,
  state,
  preview,
  hasMemory,
  onCopy,
  revealTick,
  errorTick,
  compact = false,
}: Props) {
  const motion = useMotion();
  const appear = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const sweep = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const [boxWidth, setBoxWidth] = useState(300);

  const showingResult = state.result !== null;
  const hasError = state.error !== null;

  // Neon reveal: fade + rise, glow expands then fades, highlight sweeps across.
  // The answer itself is already in state, so nothing waits for the animation.
  useEffect(() => {
    if (revealTick === 0) return;
    glow.setValue(0);
    sweep.setValue(0);
    if (motion.mode === 'off') {
      appear.setValue(1);
      return;
    }
    const ms = motion.revealMs;
    appear.setValue(0.15);
    const parts: Animated.CompositeAnimation[] = [
      Animated.timing(appear, {
        toValue: 1,
        duration: motion.mode === 'reduced' ? 160 : Math.round(ms * 0.6),
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ];
    if (motion.mode === 'full') {
      parts.push(
        Animated.timing(glow, {
          toValue: 1,
          duration: ms,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(sweep, {
          toValue: 1,
          duration: Math.round(ms * 0.85),
          delay: Math.round(ms * 0.15),
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      );
    }
    Animated.parallel(parts).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealTick]);

  // Short horizontal shake for errors / rejected keys.
  useEffect(() => {
    if (errorTick === 0 || motion.mode !== 'full') return;
    const step = (to: number) =>
      Animated.timing(shake, { toValue: to, duration: 45, easing: Easing.linear, useNativeDriver: true });
    Animated.sequence([step(1), step(-1), step(0.6), step(-0.6), step(0)]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorTick]);

  const k = motion.intensity;
  const revealStyle =
    showingResult && motion.mode !== 'off'
      ? {
          opacity: appear,
          transform: [
            {
              translateY: appear.interpolate({
                inputRange: [0, 1],
                outputRange: [motion.mode === 'full' ? 12 * k : 0, 0],
              }),
            },
          ],
        }
      : null;

  // Top (small) line: the expression that produced the result or error.
  const topLine = showingResult || hasError ? `${state.expression}${showingResult ? ' =' : ''}` : '';

  // Main (big) line.
  let main: string;
  if (hasError) main = state.error as string;
  else if (showingResult) main = groupDigits(state.result as string);
  else main = state.expression === '' ? '0' : state.expression;

  const spoken = hasError
    ? `Error: ${state.error}`
    : showingResult
      ? `Result ${state.result}`
      : `Expression ${state.expression || '0'}`;

  const onBoxLayout = (e: LayoutChangeEvent) => setBoxWidth(e.nativeEvent.layout.width);
  const glowOn = motion.mode === 'full' && showingResult;

  return (
    <Pressable
      onLongPress={onCopy}
      delayLongPress={450}
      accessibilityRole="text"
      accessibilityLabel={spoken}
      accessibilityHint="Long press to copy the result"
      style={[styles.wrap, { backgroundColor: theme.surface, borderColor: theme.border }]}
    >
      <View style={styles.topRow}>
        <Text
          style={[styles.memoryFlag, { color: theme.accent, opacity: hasMemory ? 1 : 0 }]}
          accessibilityElementsHidden={!hasMemory}
          importantForAccessibility={hasMemory ? 'yes' : 'no-hide-descendants'}
        >
          M
        </Text>
        <Text
          numberOfLines={2}
          ellipsizeMode="head"
          style={[styles.topLine, compact && styles.topLineCompact, { color: theme.textMuted }]}
        >
          {topLine}
        </Text>
      </View>

      <View style={styles.answerBox}>
        {glowOn
          ? GLOW_LAYERS.map((layer, i) => (
              <Animated.View
                key={i}
                pointerEvents="none"
                style={[
                  styles.glowLayer,
                  {
                    backgroundColor: theme.glow,
                    left: (layer.left ?? layer.x) as number | `${number}%`,
                    right: layer.x,
                    top: layer.y,
                    bottom: layer.y,
                    opacity: glow.interpolate({
                      inputRange: [0, 0.3, 1],
                      outputRange: [0, Math.min(0.5, layer.strength * 2 * k), 0],
                    }),
                    transform: [
                      {
                        scale: glow.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.78, 1 + 0.12 * k],
                        }),
                      },
                    ],
                  },
                ]}
              />
            ))
          : null}

        <Animated.View
          style={{
            transform: [
              {
                translateX: shake.interpolate({ inputRange: [-1, 1], outputRange: [-9 * k, 9 * k] }),
              },
            ],
          }}
        >
          <Animated.View style={[styles.clip, revealStyle]} onLayout={onBoxLayout}>
            <Text
              numberOfLines={hasError ? 2 : 1}
              adjustsFontSizeToFit={!hasError}
              minimumFontScale={0.3}
              allowFontScaling={false}
              style={[
                styles.main,
                compact && styles.mainCompact,
                hasError ? styles.mainError : null,
                showingResult && {
                  textShadowColor: theme.glow,
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: theme.name === 'dark' ? 10 : 4,
                },
                { color: hasError ? theme.danger : showingResult ? theme.resultText : theme.text },
              ]}
            >
              {main}
            </Text>
            {glowOn ? (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.sweep,
                  {
                    backgroundColor:
                      theme.name === 'dark' ? 'rgba(255,255,255,0.10)' : 'rgba(232,18,60,0.14)',
                    transform: [
                      {
                        translateX: sweep.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-90, boxWidth + 40],
                        }),
                      },
                      { rotate: '16deg' },
                    ],
                  },
                ]}
              />
            ) : null}
          </Animated.View>
        </Animated.View>
      </View>

      <Text
        numberOfLines={1}
        style={[styles.preview, compact && styles.previewCompact, { color: theme.textMuted }]}
        accessibilityLabel={preview ? `Preview ${preview}` : undefined}
      >
        {preview ? `= ${groupDigits(preview)}` : ' '}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    marginHorizontal: 14,
    marginTop: 4,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'flex-end',
    elevation: 3,
  },
  topRow: { flexDirection: 'row', alignItems: 'flex-start' },
  memoryFlag: { fontSize: 16, fontWeight: '800', width: 22, paddingTop: 2 },
  topLine: { flex: 1, fontSize: 20, textAlign: 'right', minHeight: 26 },
  topLineCompact: { fontSize: 17, minHeight: 22 },
  answerBox: { alignSelf: 'stretch' },
  glowLayer: { position: 'absolute', borderRadius: 30 },
  clip: { overflow: 'hidden', paddingVertical: 4, paddingHorizontal: 4 },
  main: {
    fontSize: 60,
    fontWeight: '300',
    textAlign: 'right',
    includeFontPadding: false,
  },
  mainCompact: { fontSize: 46 },
  mainError: { fontSize: 26, fontWeight: '500' },
  sweep: { position: 'absolute', top: -12, bottom: -12, width: 34 },
  preview: { fontSize: 20, textAlign: 'right', marginTop: 4, minHeight: 26 },
  previewCompact: { fontSize: 17, minHeight: 22 },
});
