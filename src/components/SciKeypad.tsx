import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AngleMode } from '../engine/calculator';
import type { Theme } from '../theme';
import { KeyDef, KeyId, KeyRow, digit, k } from './Keypad';

/** Scientific rows: five narrow keys each. */
function scientificRows(angle: AngleMode): KeyDef[][] {
  return [
    [
      k(
        'MODE',
        angle === 'deg' ? 'DEG' : 'RAD',
        angle === 'deg'
          ? 'Angle mode degrees. Tap to switch to radians'
          : 'Angle mode radians. Tap to switch to degrees',
        'operator',
      ),
      k('sin', 'sin', 'Sine', 'function'),
      k('cos', 'cos', 'Cosine', 'function'),
      k('tan', 'tan', 'Tangent', 'function'),
      k('π', 'π', 'Pi', 'function'),
    ],
    [
      k('log', 'log', 'Logarithm base 10', 'function'),
      k('ln', 'ln', 'Natural logarithm', 'function'),
      k('asin', 'sin⁻¹', 'Inverse sine', 'function'),
      k('acos', 'cos⁻¹', 'Inverse cosine', 'function'),
      k('atan', 'tan⁻¹', 'Inverse tangent', 'function'),
    ],
    [
      k('√', '√', 'Square root', 'function'),
      k('∛', '∛', 'Cube root', 'function'),
      k('²', 'x²', 'Square', 'function'),
      k('^', 'x^y', 'Power', 'function'),
      k('!', 'n!', 'Factorial', 'function'),
    ],
    [
      k('(', '(', 'Open bracket', 'function'),
      k(')', ')', 'Close bracket', 'function'),
      k('%', '%', 'Percent', 'function'),
      k('e', 'e', 'Euler number', 'function'),
      k('back', '←', 'Delete last character', 'function'),
    ],
  ];
}

const BASIC_ROWS: KeyDef[][] = [
  [digit('7'), digit('8'), digit('9'), k('÷', '÷', 'Divide', 'operator')],
  [digit('4'), digit('5'), digit('6'), k('×', '×', 'Multiply', 'operator')],
  [digit('1'), digit('2'), digit('3'), k('−', '−', 'Subtract', 'operator')],
  [digit('0'), k('.', '.', 'Decimal point', 'digit'), k('sign', '±', 'Toggle positive or negative', 'function'), k('+', '+', 'Add', 'operator')],
  [k('clear', 'C', 'Clear all', 'function', 1), k('=', '=', 'Equals', 'equals', 3)],
];

interface Props {
  theme: Theme;
  haptics: boolean;
  angle: AngleMode;
  onKey: (id: KeyId) => void;
}

const GAP = 8;

/** Scientific keys on top, standard keys below. */
export function SciKeypad({ theme, haptics, angle, onKey }: Props) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const usable = height - insets.top - insets.bottom;
  const rowH = Math.round(Math.min(64, Math.max(40, usable * 0.056)));
  const sciH = Math.round(rowH * 0.78);

  return (
    <View style={styles.pad}>
      {scientificRows(angle).map((row, i) => (
        <KeyRow key={`s${i}`} defs={row} height={sciH} theme={theme} haptics={haptics} onKey={onKey} small />
      ))}
      <View style={styles.spacer} />
      {BASIC_ROWS.map((row, i) => (
        <KeyRow key={`b${i}`} defs={row} height={rowH} theme={theme} haptics={haptics} onKey={onKey} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: 14, paddingTop: 4, gap: GAP },
  spacer: { height: 2 },
});
