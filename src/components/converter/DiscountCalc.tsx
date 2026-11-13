import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { CalcError, groupDigits } from '../../engine/calculator';
import { discount, parseNumber } from '../../engine/finance';
import type { Theme } from '../../theme';
import { Card, NumberField, ResultPanel } from '../ui';

/** Money amounts are shown with exactly two decimals. */
const money = (n: number): string => groupDigits(n.toFixed(2));

/** Price after a percentage discount, and how much is saved. */
export function DiscountCalc({ theme, onCopy }: { theme: Theme; onCopy: (t: string) => void }) {
  const [price, setPrice] = useState('');
  const [percent, setPercent] = useState('');

  const p = parseNumber(price);
  const d = parseNumber(percent);

  let final: string | null = null;
  let saved: string | undefined;
  let error: string | null = null;
  if (p !== null && d !== null) {
    try {
      const r = discount(p, d);
      final = money(r.final);
      saved = `You save ${money(r.saved)}`;
    } catch (e) {
      error = e instanceof CalcError ? e.message : 'Cannot calculate';
    }
  }

  return (
    <View style={styles.pad}>
      <Card theme={theme}>
        <NumberField theme={theme} label="Original price" value={price} onChangeText={setPrice} />
        <NumberField theme={theme} label="Discount (%)" value={percent} onChangeText={setPercent} />
      </Card>
      <ResultPanel
        theme={theme}
        title="Price after discount"
        value={final}
        caption={saved}
        error={error}
        hint="Enter the price and the discount"
        onCopy={() => final !== null && onCopy(final.replace(/,/g, ''))}
      />
    </View>
  );
}

const styles = StyleSheet.create({ pad: { paddingHorizontal: 16, gap: 12, paddingBottom: 24 } });
