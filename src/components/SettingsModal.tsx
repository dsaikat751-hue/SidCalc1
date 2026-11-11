import React from 'react';
import { Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import type { Settings } from '../storage/storage';
import type { Theme } from '../theme';

interface Props {
  visible: boolean;
  theme: Theme;
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onClose: () => void;
}

/** Small bottom sheet with the theme and haptics switches. */
export function SettingsModal({ visible, theme, settings, onChange, onClose }: Props) {
  const isDark = settings.theme === 'dark';
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close settings">
        <Pressable
          style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={() => undefined}
        >
          <Text accessibilityRole="header" style={[styles.heading, { color: theme.gold }]}>
            Settings
          </Text>

          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.text }]}>Dark theme</Text>
            <Switch
              accessibilityLabel="Dark theme"
              value={isDark}
              onValueChange={(v) => onChange({ theme: v ? 'dark' : 'light' })}
              trackColor={{ false: theme.border, true: theme.gold }}
              thumbColor={theme.name === 'dark' ? '#F5F2EA' : '#FFFFFF'}
            />
          </View>

          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.text }]}>Haptic feedback</Text>
            <Switch
              accessibilityLabel="Haptic feedback"
              value={settings.haptics}
              onValueChange={(v) => onChange({ haptics: v })}
              trackColor={{ false: theme.border, true: theme.gold }}
              thumbColor={theme.name === 'dark' ? '#F5F2EA' : '#FFFFFF'}
            />
          </View>

          <Text style={[styles.about, { color: theme.textMuted }]}>
            SidCalc 1.0.0 · works fully offline
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close settings"
            onPress={onClose}
            style={[styles.close, { backgroundColor: theme.gold }]}
          >
            <Text style={[styles.closeText, { color: theme.goldText }]}>Done</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    padding: 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  heading: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
  },
  label: { fontSize: 17 },
  about: { fontSize: 13, marginTop: 8 },
  close: {
    marginTop: 16,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontSize: 17, fontWeight: '700' },
});
