import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { CATEGORIES } from '../../engine/units';
import type { Theme } from '../../theme';
import { Chip, ChipRow } from '../ui';
import { AgeCalc } from './AgeCalc';
import { DiscountCalc } from './DiscountCalc';
import { PercentCalc } from './PercentCalc';
import { UnitConverter } from './UnitConverter';

type SectionId = string;

const EXTRA: ReadonlyArray<{ id: SectionId; title: string }> = [
  { id: 'percent', title: 'Percentage' },
  { id: 'discount', title: 'Discount' },
  { id: 'age', title: 'Age' },
];

interface Props {
  theme: Theme;
  onCopy: (text: string) => void;
}

/** Unit converters, mass converter and the extra calculators in one place. */
export function ConverterScreen({ theme, onCopy }: Props) {
  const [section, setSection] = useState<SectionId>('length');
  const category = CATEGORIES.find((c) => c.id === section);

  return (
    <ScrollView
      style={styles.fill}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <ChipRow>
        {[...CATEGORIES.map((c) => ({ id: c.id, title: c.title })), ...EXTRA].map((s) => (
          <Chip key={s.id} theme={theme} label={s.title} selected={s.id === section} onPress={() => setSection(s.id)} />
        ))}
      </ChipRow>
      <View style={styles.spacer} />
      {category ? (
        // key resets the field and unit choices when the category changes
        <UnitConverter key={category.id} theme={theme} category={category} onCopy={onCopy} />
      ) : section === 'percent' ? (
        <PercentCalc theme={theme} onCopy={onCopy} />
      ) : section === 'discount' ? (
        <DiscountCalc theme={theme} onCopy={onCopy} />
      ) : (
        <AgeCalc theme={theme} onCopy={onCopy} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingTop: 8, paddingBottom: 16 },
  spacer: { height: 10 },
});
