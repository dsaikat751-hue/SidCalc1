import React, { memo, useEffect, useRef } from 'react';
import {
  Alert,
  Animated,
  Easing,
  FlatList,
  LayoutAnimation,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { groupDigits, usesAngles } from '../engine/calculator';
import { useMotion } from '../hooks/useMotion';
import type { HistoryEntry } from '../storage/storage';
import type { Theme } from '../theme';
import { formatTimestamp } from '../utils/format';

interface Props {
  theme: Theme;
  entries: HistoryEntry[];
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
      android_ripple={{ color: 'rgba(232,18,60,0.30)' }}
      style={styles.textButton}
    >
      <Text style={[styles.textButtonLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

interface RowProps {
  theme: Theme;
  item: HistoryEntry;
  index: number;
  onSelect: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
  onCopy: (text: string) => void;
}

/** One history card. Slides in when it appears and fades out when deleted. */
const HistoryRow = memo(function HistoryRow({ theme, item, index, onSelect, onDelete, onCopy }: RowProps) {
  const motion = useMotion();
  const enter = useRef(new Animated.Value(motion.mode === 'off' ? 1 : 0)).current;
  const exit = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (motion.mode === 'off') return;
    Animated.timing(enter, {
      toValue: 1,
      duration: motion.mode === 'reduced' ? 150 : 280,
      delay: motion.mode === 'full' ? Math.min(index, 6) * 35 : 0,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remove = () => {
    if (motion.mode === 'off') {
      onDelete(item.id);
      return;
    }
    Animated.timing(exit, {
      toValue: 1,
      duration: motion.mode === 'reduced' ? 120 : 200,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      // Let the cards below glide up into the gap.
      if (motion.mode === 'full') LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      onDelete(item.id);
    });
  };

  const slide = motion.mode === 'full' ? 18 * motion.intensity : 0;
  const drift = motion.mode === 'full' ? 40 : 0;
  const showAngle = usesAngles(item.expression) && item.angle;

  return (
    <Animated.View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
        {
          opacity: Animated.multiply(enter, exit.interpolate({ inputRange: [0, 1], outputRange: [1, 0] })),
          transform: [
            { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [slide, 0] }) },
            { translateX: exit.interpolate({ inputRange: [0, 1], outputRange: [0, drift] }) },
          ],
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${item.expression} equals ${item.result}. Tap to load into calculator.`}
        onPress={() => onSelect(item)}
        android_ripple={{ color: 'rgba(232,18,60,0.25)' }}
        style={styles.cardMain}
      >
        <Text numberOfLines={2} ellipsizeMode="head" style={[styles.expr, { color: theme.textMuted }]}>
          {item.expression}
        </Text>
        <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.result, { color: theme.accent }]}>
          = {groupDigits(item.result)}
        </Text>
        <Text style={[styles.time, { color: theme.textMuted }]}>
          {formatTimestamp(item.timestamp)}
          {showAngle ? `  ·  ${item.angle === 'rad' ? 'RAD' : 'DEG'}` : ''}
        </Text>
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
          onPress={remove}
        />
      </View>
    </Animated.View>
  );
});

/** List of saved calculations, newest first. */
export function HistoryScreen({ theme, entries, onSelect, onDelete, onClear, onCopy }: Props) {
  const motion = useMotion();
  const clearAnim = useRef(new Animated.Value(0)).current;

  // A cleared list that gets new entries later must be visible again.
  useEffect(() => {
    if (entries.length > 0) clearAnim.setValue(0);
  }, [entries.length, clearAnim]);

  const doClear = () => {
    if (motion.mode === 'off') {
      onClear();
      return;
    }
    Animated.timing(clearAnim, {
      toValue: 1,
      duration: motion.mode === 'reduced' ? 160 : 280,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => onClear());
  };

  const confirmClear = () => {
    Alert.alert(
      'Clear all history?',
      'This permanently deletes every saved calculation. It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear all', style: 'destructive', onPress: doClear },
      ],
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[styles.title, { color: theme.accent }]}>
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
        <Animated.View
          style={{
            flex: 1,
            opacity: clearAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
            transform: [
              {
                translateY: clearAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, motion.mode === 'full' ? 24 : 0],
                }),
              },
            ],
          }}
        >
          <FlatList
            data={entries}
            keyExtractor={(e) => e.id}
            renderItem={({ item, index }) => (
              <HistoryRow
                theme={theme}
                item={item}
                index={index}
                onSelect={onSelect}
                onDelete={onDelete}
                onCopy={onCopy}
              />
            )}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={Separator}
            initialNumToRender={12}
          />
        </Animated.View>
      )}
    </View>
  );
}

const Separator = () => <View style={{ height: 10 }} />;

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 22, fontWeight: '700', letterSpacing: 1 },
  textButton: { minHeight: 44, minWidth: 56, paddingHorizontal: 8, justifyContent: 'center', overflow: 'hidden' },
  textButtonLabel: { fontSize: 16, fontWeight: '600' },
  list: { paddingHorizontal: 14, paddingBottom: 24 },
  card: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 4,
    elevation: 2,
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
