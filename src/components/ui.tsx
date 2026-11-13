/**
 * Small shared building blocks for the Converter and Settings screens.
 */
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Theme } from '../theme';

/** A rounded pill used for choosing units, categories and modes. */
export function Chip({
  theme,
  label,
  selected,
  onPress,
  a11y,
}: {
  theme: Theme;
  label: string;
  selected: boolean;
  onPress: () => void;
  a11y?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y ?? label}
      accessibilityState={{ selected }}
      onPress={onPress}
      android_ripple={{ color: 'rgba(232,18,60,0.35)' }}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.accent : theme.surface,
          borderColor: selected ? theme.accent : theme.border,
        },
      ]}
    >
      <Text style={[styles.chipText, { color: selected ? theme.accentText : theme.text }]}>{label}</Text>
    </Pressable>
  );
}

/** Horizontally scrolling row of chips. */
export function ChipRow({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.chipRow}
    >
      {children}
    </ScrollView>
  );
}

/** Rounded surface card. */
export function Card({ theme, children }: { theme: Theme; children: React.ReactNode }) {
  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {children}
    </View>
  );
}

export function SectionLabel({ theme, text }: { theme: Theme; text: string }) {
  return <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>{text}</Text>;
}

/**
 * Numeric text field. It silently rejects characters that cannot be part of a
 * number, so the rest of the app only ever sees something parseNumber() accepts.
 */
export function NumberField({
  theme,
  label,
  value,
  onChangeText,
  allowNegative = false,
  placeholder = '0',
  maxLength = 20,
  integer = false,
}: {
  theme: Theme;
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  allowNegative?: boolean;
  placeholder?: string;
  maxLength?: number;
  integer?: boolean;
}) {
  const handle = (raw: string) => {
    let t = raw.replace(',', '.');
    if (!allowNegative) t = t.replace(/-/g, '');
    const pattern = integer ? /^\d*$/ : allowNegative ? /^-?\d*\.?\d*$/ : /^\d*\.?\d*$/;
    if (pattern.test(t)) onChangeText(t);
  };
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>{label}</Text>
      <View style={styles.fieldRow}>
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={handle}
          placeholder={placeholder}
          placeholderTextColor={theme.textMuted}
          keyboardType={integer ? 'number-pad' : allowNegative ? 'numeric' : 'decimal-pad'}
          maxLength={maxLength}
          selectionColor={theme.accent}
          style={[
            styles.field,
            { color: theme.text, backgroundColor: theme.background, borderColor: theme.border },
          ]}
        />
        {allowNegative ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Toggle negative sign for ${label}`}
            onPress={() => onChangeText(value.startsWith('-') ? value.slice(1) : `-${value}`)}
            style={[styles.signBtn, { backgroundColor: theme.keyFunction, borderColor: theme.border }]}
          >
            <Text style={[styles.signText, { color: theme.keyFunctionText }]}>±</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

/** Big answer panel with a Copy button. Shows an error or hint when there is no value. */
export function ResultPanel({
  theme,
  title,
  value,
  caption,
  error,
  hint,
  onCopy,
}: {
  theme: Theme;
  title: string;
  value: string | null;
  caption?: string;
  error?: string | null;
  hint?: string;
  onCopy: (text: string) => void;
}) {
  return (
    <View style={[styles.result, { backgroundColor: theme.surface, borderColor: error ? theme.danger : theme.border }]}>
      <Text style={[styles.resultTitle, { color: theme.textMuted }]}>{title}</Text>
      {error ? (
        <Text accessibilityLiveRegion="polite" style={[styles.resultError, { color: theme.danger }]}>
          {error}
        </Text>
      ) : value !== null ? (
        <>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.4}
            accessibilityLiveRegion="polite"
            style={[
              styles.resultValue,
              {
                color: theme.resultText,
                textShadowColor: theme.glow,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: theme.name === 'dark' ? 8 : 3,
              },
            ]}
          >
            {value}
          </Text>
          {caption ? <Text style={[styles.resultCaption, { color: theme.textMuted }]}>{caption}</Text> : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Copy ${value}`}
            onPress={() => onCopy(value)}
            android_ripple={{ color: 'rgba(232,18,60,0.35)' }}
            style={[styles.copyBtn, { borderColor: theme.border, backgroundColor: theme.background }]}
          >
            <Text style={[styles.copyText, { color: theme.text }]}>Copy</Text>
          </Pressable>
        </>
      ) : (
        <Text style={[styles.resultHint, { color: theme.textMuted }]}>{hint ?? 'Enter a value'}</Text>
      )}
    </View>
  );
}

/** Two- or three-way segmented control. */
export function Segmented<T extends string>({
  theme,
  options,
  value,
  onChange,
  disabled = false,
}: {
  theme: Theme;
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <View
      style={[
        styles.segmented,
        { backgroundColor: theme.background, borderColor: theme.border, opacity: disabled ? 0.45 : 1 },
      ]}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityLabel={o.label}
            accessibilityState={{ selected: on, disabled }}
            disabled={disabled}
            onPress={() => onChange(o.value)}
            style={[styles.segment, on && { backgroundColor: theme.accent }]}
          >
            <Text style={[styles.segmentText, { color: on ? theme.accentText : theme.text }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  chipText: { fontSize: 14, fontWeight: '600' },
  chipRow: { gap: 8, paddingHorizontal: 16, paddingVertical: 4 },
  card: { borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, padding: 16, gap: 12, elevation: 2 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    marginTop: 14,
    marginBottom: 6,
  },
  fieldWrap: { gap: 6, minWidth: 0 },
  fieldLabel: { fontSize: 13, fontWeight: '600' },
  fieldRow: { flexDirection: 'row', gap: 8, alignItems: 'center', minWidth: 0 },
  field: {
    flex: 1,
    minWidth: 0,
    width: '100%',
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 22,
  },
  signBtn: {
    width: 54,
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signText: { fontSize: 24, fontWeight: '600' },
  result: { borderRadius: 22, borderWidth: 1, padding: 18, gap: 6, alignItems: 'stretch' },
  resultTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  resultValue: { fontSize: 38, fontWeight: '300', textAlign: 'right', includeFontPadding: false },
  resultCaption: { fontSize: 14, textAlign: 'right' },
  resultError: { fontSize: 17, fontWeight: '600' },
  resultHint: { fontSize: 16 },
  copyBtn: {
    alignSelf: 'flex-end',
    marginTop: 6,
    height: 36,
    paddingHorizontal: 18,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  copyText: { fontSize: 13, fontWeight: '600' },
  segmented: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 3, gap: 3 },
  segment: { paddingHorizontal: 16, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  segmentText: { fontSize: 13, fontWeight: '700' },
});
