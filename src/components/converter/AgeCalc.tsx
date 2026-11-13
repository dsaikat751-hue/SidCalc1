import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CalcError, groupDigits } from '../../engine/calculator';
import { computeAge, todayParts } from '../../engine/age';
import { parseNumber } from '../../engine/finance';
import type { Theme } from '../../theme';
import { Card, NumberField, ResultPanel } from '../ui';

const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? '' : 's'}`;

/** Exact age in years, months and days from a date of birth. */
export function AgeCalc({ theme, onCopy }: { theme: Theme; onCopy: (t: string) => void }) {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  const d = parseNumber(day);
  const m = parseNumber(month);
  const y = parseNumber(year);
  const complete = d !== null && m !== null && y !== null && year.length === 4;

  let summary: string | null = null;
  let lines: string[] = [];
  let error: string | null = null;
  if (complete) {
    try {
      const r = computeAge({ year: y, month: m, day: d }, todayParts());
      summary = `${plural(r.years, 'year')}, ${plural(r.months, 'month')}, ${plural(r.days, 'day')}`;
      lines = [
        `${groupDigits(String(r.totalDays))} days lived in total`,
        r.nextBirthdayIn === 0 ? 'Happy birthday! It is today 🎉' : `Next birthday in ${plural(r.nextBirthdayIn, 'day')}`,
      ];
    } catch (e) {
      error = e instanceof CalcError ? e.message : 'Cannot calculate';
    }
  }

  return (
    <View style={styles.pad}>
      <Card theme={theme}>
        <Text style={[styles.title, { color: theme.textMuted }]}>Date of birth</Text>
        <View style={styles.row}>
          <View style={styles.small}>
            <NumberField theme={theme} label="Day" value={day} onChangeText={setDay} integer maxLength={2} placeholder="DD" />
          </View>
          <View style={styles.small}>
            <NumberField theme={theme} label="Month" value={month} onChangeText={setMonth} integer maxLength={2} placeholder="MM" />
          </View>
          <View style={styles.big}>
            <NumberField theme={theme} label="Year" value={year} onChangeText={setYear} integer maxLength={4} placeholder="YYYY" />
          </View>
        </View>
      </Card>
      <ResultPanel
        theme={theme}
        title="Your age today"
        value={summary}
        caption={lines.join('\n')}
        error={error}
        hint="Enter day, month and a 4-digit year"
        onCopy={onCopy}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: 16, gap: 12, paddingBottom: 24 },
  title: { fontSize: 13, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 10 },
  small: { flex: 2 },
  big: { flex: 3 },
});
