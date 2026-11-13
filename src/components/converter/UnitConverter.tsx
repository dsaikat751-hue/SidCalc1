import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CalcError, groupDigits } from '../../engine/calculator';
import { parseNumber } from '../../engine/finance';
import { Category, convertText } from '../../engine/units';
import type { Theme } from '../../theme';
import { Card, Chip, ChipRow, NumberField, ResultPanel, SectionLabel } from '../ui';

interface Props {
  theme: Theme;
  category: Category;
  onCopy: (text: string) => void;
}

/** Converts a value between the units of one category (length, mass, ...). */
export function UnitConverter({ theme, category, onCopy }: Props) {
  const units = category.units;
  const isTemp = category.id === 'temperature';
  const [text, setText] = useState('1');
  const [fromId, setFromId] = useState(units[0].id);
  const [toId, setToId] = useState(units[1].id);

  const from = units.find((u) => u.id === fromId) ?? units[0];
  const to = units.find((u) => u.id === toId) ?? units[1];
  const value = parseNumber(text);

  let result: string | null = null;
  let error: string | null = null;
  if (value !== null) {
    try {
      result = convertText(category.id, value, from.id, to.id);
    } catch (e) {
      error = e instanceof CalcError ? e.message : 'Cannot convert this value';
    }
  }

  const swap = () => {
    setFromId(toId);
    setToId(fromId);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.pad}>
        <Card theme={theme}>
          <NumberField
            theme={theme}
            label={`Value in ${from.name}`}
            value={text}
            onChangeText={setText}
            allowNegative={isTemp}
          />
        </Card>
      </View>

      <SectionLabel theme={theme} text="From" />
      <ChipRow>
        {units.map((u) => (
          <Chip key={u.id} theme={theme} label={u.label} a11y={`From ${u.name}`} selected={u.id === fromId} onPress={() => setFromId(u.id)} />
        ))}
      </ChipRow>

      <View style={styles.swapRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Swap from and to units"
          onPress={swap}
          android_ripple={{ color: 'rgba(232,18,60,0.35)' }}
          style={[styles.swap, { backgroundColor: theme.keyFunction, borderColor: theme.border }]}
        >
          <Text style={[styles.swapText, { color: theme.keyFunctionText }]}>⇅  Swap</Text>
        </Pressable>
      </View>

      <SectionLabel theme={theme} text="To" />
      <ChipRow>
        {units.map((u) => (
          <Chip key={u.id} theme={theme} label={u.label} a11y={`To ${u.name}`} selected={u.id === toId} onPress={() => setToId(u.id)} />
        ))}
      </ChipRow>

      <View style={[styles.pad, { marginTop: 16 }]}>
        <ResultPanel
          theme={theme}
          title={`${from.name} → ${to.name}`}
          value={result === null ? null : `${groupDigits(result)} ${to.label}`}
          caption={result === null ? undefined : `${groupDigits(String(value))} ${from.label} = ${groupDigits(result)} ${to.label}`}
          error={error}
          hint="Enter a number above"
          onCopy={() => result !== null && onCopy(result)}
        />
      </View>

      {result !== null && value !== null ? (
        <>
          <SectionLabel theme={theme} text="All units" />
          <View style={styles.pad}>
            <Card theme={theme}>
              {units
                .filter((u) => u.id !== from.id)
                .map((u) => {
                  let v = '—';
                  try {
                    v = groupDigits(convertText(category.id, value, from.id, u.id));
                  } catch {
                    /* leave dash */
                  }
                  return (
                    <View key={u.id} style={styles.allRow}>
                      <Text style={[styles.allUnit, { color: theme.textMuted }]}>{u.name}</Text>
                      <Text style={[styles.allValue, { color: theme.text }]} numberOfLines={1}>
                        {v}
                      </Text>
                    </View>
                  );
                })}
            </Card>
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingBottom: 24 },
  pad: { paddingHorizontal: 16 },
  swapRow: { alignItems: 'center', marginTop: 10 },
  swap: { height: 38, paddingHorizontal: 22, borderRadius: 19, borderWidth: 1, justifyContent: 'center', overflow: 'hidden' },
  swapText: { fontSize: 14, fontWeight: '700' },
  allRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  allUnit: { fontSize: 14, flexShrink: 0 },
  allValue: { fontSize: 16, fontWeight: '500', flex: 1, textAlign: 'right' },
});
