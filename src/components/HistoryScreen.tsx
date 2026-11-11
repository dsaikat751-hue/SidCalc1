import React from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { groupDigits } from '../engine/calculator';
import type { HistoryEntry } from '../storage/storage';
import type { Theme } from '../theme';
import { formatTimestamp } from '../utils/format';

interface Props {
  theme: Theme;
  entries: HistoryEntry[];
  onBack: () => void;
  /** Tapping an entry loads it back into the calculator. */
  onSelect: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  onCopy: (text: string) => void;
}

function TextButton({
  label,
  a11y,
  color,
  onPress,
}: {
  label: string;
  a11y: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.textButton, pressed && { opacity: 0.6 }]}
    >
      <Text style={[styles.textButtonLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

/** Full-screen list of saved calculations, newest first. */
export function HistoryScreen({ theme, entries, onBack, onSelect, onDelete, onClear, onCopy }: Props) {
  const confirmClear = () => {
    Alert.alert(
      'Clear all history?',
      'This permanently deletes every saved calculation. It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear all', style: 'destructive', onPress: onClear },
      ],
    );
  };

  const renderItem = ({ item }: { item: HistoryEntry }) => (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${item.expression} equals ${item.result}. Tap to load into calculator.`}
        onPress={() => onSelect(item)}
        style={({ pressed }) => [styles.cardMain, pressed && { opacity: 0.7 }]}
      >
        <Text numberOfLines={2} ellipsizeMode="head" style={[styles.expr, { color: theme.textMuted }]}>
          {item.expression}
        </Text>
        <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.result, { color: theme.gold }]}>
          = {groupDigits(item.result)}
        </Text>
        <Text style={[styles.time, { color: theme.textMuted }]}>{formatTimestamp(item.timestamp)}</Text>
      </Pressable>
      <View style={styles.cardActions}>
        <TextButton
          label="Copy"
          a11y={`Copy result ${item.result}`}
          color={theme.text}
          onPress={() => onCopy(item.result)}
        />
        <TextButton
          label="Delete"
          a11y={`Delete ${item.expression} from history`}
          color={theme.danger}
          onPress={() => onDelete(item.id)}
        />
      </View>
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TextButton label="‹ Back" a11y="Back to calculator" color={theme.gold} onPress={onBack} />
        <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>
          History
        </Text>
        <View style={{ opacity: entries.length ? 1 : 0.35 }}>
          <TextButton
            label="Clear all"
            a11y="Clear all history"
            color={theme.danger}
            onPress={() => entries.length && confirmClear()}
          />
        </View>
      </View>

      {entries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No calculations yet</Text>
          <Text style={[styles.emptyBody, { color: theme.textMuted }]}>
            Results you calculate with “=” are saved here and kept even after you close the app.
          </Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(e) => e.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          initialNumToRender={12}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    height: 56,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 20, fontWeight: '700' },
  textButton: { minHeight: 44, minWidth: 56, paddingHorizontal: 8, justifyContent: 'center' },
  textButtonLabel: { fontSize: 16, fontWeight: '600' },
  list: { paddingHorizontal: 14, paddingBottom: 24 },
  card: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  cardMain: { gap: 2 },
  expr: { fontSize: 17, textAlign: 'right' },
  result: { fontSize: 30, fontWeight: '500', textAlign: 'right' },
  time: { fontSize: 12, textAlign: 'right', marginTop: 2 },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 8 },
  emptyTitle: { fontSize: 20, fontWeight: '600' },
  emptyBody: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
