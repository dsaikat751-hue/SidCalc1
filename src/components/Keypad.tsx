import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { EditKey } from '../engine/input';
import type { Theme } from '../theme';
import { ButtonVariant, CalcButton } from './CalcButton';

export type KeyId = EditKey | '=' | 'MC' | 'MR' | 'M+' | 'M-';

interface KeyDef {
  id: KeyId;
  label: string;
  a11y: string;
  variant: ButtonVariant;
}

const k = (id: KeyId, label: string, a11y: string, variant: ButtonVariant): KeyDef => ({
  id,
  label,
  a11y,
  variant,
});

const digit = (d: string): KeyDef => k(d as KeyId, d, d, 'digit');

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

/** The whole button grid. Row height adapts to the phone's screen height. */
export function Keypad({ theme, haptics, onKey }: Props) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const usable = height - insets.top - insets.bottom;
  const rowH = Math.round(Math.min(74, Math.max(46, usable * 0.072)));

  const renderRow = (row: KeyDef[], h: number, key: string) => (
    <View key={key} style={[styles.row, { height: h }]}>
      {row.map((def) => (
        <CalcButton
          key={def.id}
          label={def.label}
          accessibilityLabel={def.a11y}
          variant={def.variant}
          theme={theme}
          haptics={haptics}
          onPress={() => onKey(def.id)}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.pad}>
      {renderRow(MEMORY_ROW, Math.round(rowH * 0.62), 'mem')}
      {ROWS.map((row, i) => renderRow(row, rowH, `r${i}`))}
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: 14, paddingTop: 6, gap: GAP },
  row: { flexDirection: 'row', gap: GAP },
});
