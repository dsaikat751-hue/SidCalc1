import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { EditKey } from '../engine/input';
import type { Theme } from '../theme';
import { ButtonVariant, CalcButton } from './CalcButton';

export type KeyId = EditKey | '=' | 'MC' | 'MR' | 'M+' | 'M-' | 'MODE';

export interface KeyDef {
  id: KeyId;
  label: string;
  a11y: string;
  variant: ButtonVariant;
  flex?: number;
}

export const k = (
  id: KeyId,
  label: string,
  a11y: string,
  variant: ButtonVariant,
  flex?: number,
): KeyDef => ({ id, label, a11y, variant, flex });

export const digit = (d: string): KeyDef => k(d as KeyId, d, d, 'digit');

/** One horizontal row of buttons with a fixed height. */
export function KeyRow({
  defs,
  height,
  theme,
  haptics,
  onKey,
  small,
}: {
  defs: KeyDef[];
  height: number;
  theme: Theme;
  haptics: boolean;
  onKey: (id: KeyId) => void;
  small?: boolean;
}) {
  return (
    <View style={[styles.row, { height }]}>
      {defs.map((def) => (
        <CalcButton
          key={def.id}
          label={def.label}
          accessibilityLabel={def.a11y}
          variant={def.variant}
          theme={theme}
          haptics={haptics}
          flex={def.flex}
          small={small}
          onPress={() => onKey(def.id)}
        />
      ))}
    </View>
  );
}

const MEMORY_ROW: KeyDef[] = [
  k('MC', 'MC', 'Memory clear', 'memory'),
  k('MR', 'MR', 'Memory recall', 'memory'),
  k('M+', 'M+', 'Memory add', 'memory'),
  k('M-', 'M−', 'Memory subtract', 'memory'),
];

const ROWS: KeyDef[][] = [
  [
    k('(', '(', 'Open bracket', 'function'),
    k(')', ')', 'Close bracket', 'function'),
    k('√', '√', 'Square root', 'function'),
    k('²', 'x²', 'Square', 'function'),
  ],
  [
    k('clear', 'C', 'Clear all', 'function'),
    k('back', '←', 'Delete last character', 'function'),
    k('%', '%', 'Percent', 'function'),
    k('÷', '÷', 'Divide', 'operator'),
  ],
  [digit('7'), digit('8'), digit('9'), k('×', '×', 'Multiply', 'operator')],
  [digit('4'), digit('5'), digit('6'), k('−', '−', 'Subtract', 'operator')],
  [digit('1'), digit('2'), digit('3'), k('+', '+', 'Add', 'operator')],
  [
    k('sign', '±', 'Toggle positive or negative', 'function'),
    digit('0'),
    k('.', '.', 'Decimal point', 'digit'),
    k('=', '=', 'Equals', 'equals'),
  ],
];

interface Props {
  theme: Theme;
  haptics: boolean;
  onKey: (id: KeyId) => void;
}

const GAP = 10;

/** The standard calculator button grid. Row height adapts to screen height. */
export function Keypad({ theme, haptics, onKey }: Props) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const usable = height - insets.top - insets.bottom;
  // The tab bar takes ~64dp, so the grid gets a little less than before.
  const rowH = Math.round(Math.min(72, Math.max(44, usable * 0.066)));

  return (
    <View style={styles.pad}>
      <KeyRow
        defs={MEMORY_ROW}
        height={Math.round(rowH * 0.62)}
        theme={theme}
        haptics={haptics}
        onKey={onKey}
      />
      {ROWS.map((row, i) => (
        <KeyRow key={`r${i}`} defs={row} height={rowH} theme={theme} haptics={haptics} onKey={onKey} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: 14, paddingTop: 6, gap: GAP },
  row: { flexDirection: 'row', gap: GAP },
});
