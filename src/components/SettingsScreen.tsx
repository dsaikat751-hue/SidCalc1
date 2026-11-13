import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import type { AngleMode } from '../engine/calculator';
import { Motion } from '../hooks/useMotion';
import type { Intensity, Settings } from '../storage/storage';
import type { Theme } from '../theme';
import { Card, SectionLabel, Segmented } from './ui';

interface Props {
  theme: Theme;
  settings: Settings;
  motion: Motion;
  onChange: (patch: Partial<Settings>) => void;
}

function ToggleRow({
  theme,
  label,
  hint,
  value,
  onValueChange,
  disabled,
}: {
  theme: Theme;
  label: string;
  hint?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View style={[styles.row, { opacity: disabled ? 0.45 : 1 }]}>
      <View style={styles.rowText}>
        <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
        {hint ? <Text style={[styles.hint, { color: theme.textMuted }]}>{hint}</Text> : null}
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        disabled={disabled}
        onValueChange={onValueChange}
        trackColor={{ false: theme.border, true: theme.accent }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

/** Appearance, feedback, animation and calculation settings. */
export function SettingsScreen({ theme, settings, motion, onChange }: Props) {
  const animOff = !settings.animationsEnabled;
  return (
    <ScrollView style={styles.fill} contentContainerStyle={styles.content}>
      <Text accessibilityRole="header" style={[styles.title, { color: theme.accent }]}>
        Settings
      </Text>

      <SectionLabel theme={theme} text="Appearance" />
      <View style={styles.pad}>
        <Card theme={theme}>
          <ToggleRow
            theme={theme}
            label="Dark theme"
            hint="Black and crimson. Turn off for the light theme."
            value={settings.theme === 'dark'}
            onValueChange={(v) => onChange({ theme: v ? 'dark' : 'light' })}
          />
          <ToggleRow
            theme={theme}
            label="Haptic feedback"
            hint="A light vibration when you tap a key."
            value={settings.haptics}
            onValueChange={(v) => onChange({ haptics: v })}
          />
        </Card>
      </View>

      <SectionLabel theme={theme} text="Animations" />
      <View style={styles.pad}>
        <Card theme={theme}>
          <ToggleRow
            theme={theme}
            label="Animations"
            hint="Neon answer glow, button and screen effects."
            value={settings.animationsEnabled}
            onValueChange={(v) => onChange({ animationsEnabled: v })}
          />
          <View style={[styles.row, { opacity: animOff ? 0.45 : 1 }]}>
            <View style={styles.rowText}>
              <Text style={[styles.label, { color: theme.text }]}>Intensity</Text>
              <Text style={[styles.hint, { color: theme.textMuted }]}>How strong the effects look.</Text>
            </View>
            <Segmented<Intensity>
              theme={theme}
              disabled={animOff}
              value={settings.animationIntensity}
              onChange={(v) => onChange({ animationIntensity: v })}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Med' },
                { value: 'high', label: 'High' },
              ]}
            />
          </View>
          <ToggleRow
            theme={theme}
            label="Reduced motion"
            hint="Only gentle fades: no movement, glow or shake."
            value={settings.reducedMotion || motion.systemReduced}
            disabled={animOff || motion.systemReduced}
            onValueChange={(v) => onChange({ reducedMotion: v })}
          />
          {motion.systemReduced ? (
            <Text style={[styles.hint, { color: theme.textMuted }]}>
              Android’s “Remove animations” setting is on, so reduced motion is always active.
            </Text>
          ) : null}
        </Card>
      </View>

      <SectionLabel theme={theme} text="Scientific" />
      <View style={styles.pad}>
        <Card theme={theme}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={[styles.label, { color: theme.text }]}>Angle unit</Text>
              <Text style={[styles.hint, { color: theme.textMuted }]}>Used by sin, cos, tan and their inverses.</Text>
            </View>
            <Segmented<AngleMode>
              theme={theme}
              value={settings.angle}
              onChange={(v) => onChange({ angle: v })}
              options={[
                { value: 'deg', label: 'DEG' },
                { value: 'rad', label: 'RAD' },
              ]}
            />
          </View>
        </Card>
      </View>

      <SectionLabel theme={theme} text="About" />
      <View style={styles.pad}>
        <Card theme={theme}>
          <Text style={[styles.label, { color: theme.text }]}>SidCalc 1.1.0</Text>
          <Text style={[styles.hint, { color: theme.textMuted }]}>
            Works fully offline. No ads, no tracking, no account and no special permissions.
          </Text>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingBottom: 28 },
  title: { fontSize: 22, fontWeight: '700', letterSpacing: 1, paddingHorizontal: 18, height: 52, textAlignVertical: 'center', lineHeight: 52 },
  pad: { paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 52 },
  rowText: { flex: 1, gap: 2 },
  label: { fontSize: 17, fontWeight: '600' },
  hint: { fontSize: 13, lineHeight: 18 },
});
