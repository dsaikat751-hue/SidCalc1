import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { groupDigits } from '../engine/calculator';
import type { CalcState } from '../engine/input';
import type { Theme } from '../theme';

interface Props {
  theme: Theme;
  state: CalcState;
  /** Live preview of the answer while typing, or null. */
  preview: string | null;
  hasMemory: boolean;
  /** Long-pressing the display copies the result. */
  onCopy: () => void;
}

/** Large, readable display: expression, big result and a live preview. */
export function Display({ theme, state, preview, hasMemory, onCopy }: Props) {
  const showingResult = state.result !== null;
  const hasError = state.error !== null;

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
          style={[styles.memoryFlag, { color: theme.gold, opacity: hasMemory ? 1 : 0 }]}
          accessibilityElementsHidden={!hasMemory}
          importantForAccessibility={hasMemory ? 'yes' : 'no-hide-descendants'}
        >
          M
        </Text>
        <Text
          numberOfLines={2}
          ellipsizeMode="head"
          style={[styles.topLine, { color: theme.textMuted }]}
        >
          {topLine}
        </Text>
      </View>

      <Text
        numberOfLines={hasError ? 2 : 1}
        adjustsFontSizeToFit={!hasError}
        minimumFontScale={0.3}
        allowFontScaling={false}
        style={[
          styles.main,
          hasError ? styles.mainError : null,
          { color: hasError ? theme.danger : showingResult ? theme.gold : theme.text },
        ]}
      >
        {main}
      </Text>

      <Text
        numberOfLines={1}
        style={[styles.preview, { color: theme.textMuted }]}
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
  },
  topRow: { flexDirection: 'row', alignItems: 'flex-start' },
  memoryFlag: { fontSize: 16, fontWeight: '800', width: 22, paddingTop: 2 },
  topLine: { flex: 1, fontSize: 20, textAlign: 'right', minHeight: 26 },
  main: {
    fontSize: 60,
    fontWeight: '300',
    textAlign: 'right',
    includeFontPadding: false,
  },
  mainError: { fontSize: 26, fontWeight: '500' },
  preview: { fontSize: 20, textAlign: 'right', marginTop: 4, minHeight: 26 },
});
