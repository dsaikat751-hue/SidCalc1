import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { CalcError, formatNumber, groupDigits } from '../../engine/calculator';
import { parseNumber, percentChange, percentOf, whatPercent } from '../../engine/finance';
import type { Theme } from '../../theme';
import { Card, Chip, ChipRow, NumberField, ResultPanel } from '../ui';

type Mode = 'of' | 'what' | 'change';

const MODES: ReadonlyArray<{ id: Mode; label: string }> = [
  { id: 'of', label: 'X% of Y' },
  { id: 'what', label: 'X is what % of Y' },
  { id: 'change', label: '% change' },
];

const FIELD_LABELS: Record<Mode, [string, string]> = {
  of: ['Percentage (X)', 'Of this number (Y)'],
  what: ['Part (X)', 'Whole (Y)'],
  change: ['From (old value)', 'To (new value)'],
};

/** Three common percentage questions. */
export function PercentCalc({ theme, onCopy }: { theme: Theme; onCopy: (t: string) => void }) {
  const [mode, setMode] = useState<Mode>('of');
  const [a, setA] = useState('');
  const [b, setB] = useState('');

  const x = parseNumber(a);
  const y = parseNumber(b);

  let value: string | null = null;
  let caption: string | undefined;
  let error: string | null = null;
  if (x !== null && y !== null) {
    try {
      if (mode === 'of') {
        value = formatNumber(percentOf(x, y));
        caption = `${a}% of ${b}`;
      } else if (mode === 'what') {
        value = `${formatNumber(whatPercent(x, y))}%`;
        caption = `${a} is this percentage of ${b}`;
      } else {
        const c = percentChange(x, y);
        value = `${c > 0 ? '+' : ''}${formatNumber(c)}%`;
        caption = c > 0 ? 'Increase' : c < 0 ? 'Decrease' : 'No change';
      }
      value = groupDigits(value);
    } catch (e) {
      error = e instanceof CalcError ? e.message : 'Cannot calculate';
    }
  }

  const [la, lb] = FIELD_LABELS[mode];
  return (
    <View style={styles.wrap}>
      <ChipRow>
        {MODES.map((m) => (
          <Chip key={m.id} theme={theme} label={m.label} selected={m.id === mode} onPress={() => setMode(m.id)} />
        ))}
      </ChipRow>
      <View style={styles.pad}>
        <Card theme={theme}>
          <NumberField theme={theme} label={la} value={a} onChangeText={setA} allowNegative={mode !== 'of'} />
          <NumberField theme={theme} label={lb} value={b} onChangeText={setB} allowNegative={mode !== 'of'} />
        </Card>
        <ResultPanel
          theme={theme}
          title="Result"
          value={value}
          caption={caption}
          error={error}
          hint="Fill in both numbers"
          onCopy={onCopy}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12, paddingBottom: 24 },
  pad: { paddingHorizontal: 16, gap: 12 },
});
