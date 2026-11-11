/**
 * SidCalc – root component.
 *
 * Wires together the pure calculator logic (src/engine), persistent storage
 * (src/hooks, src/storage) and the UI components (src/components).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Display } from './src/components/Display';
import { Header } from './src/components/Header';
import { HistoryScreen } from './src/components/HistoryScreen';
import { KeyId, Keypad } from './src/components/Keypad';
import { SettingsModal } from './src/components/SettingsModal';
import { formatNumber } from './src/engine/calculator';
import {
  CalcState,
  EditKey,
  INITIAL_STATE,
  applyKey,
  currentValue,
  insertNumber,
  loadEntry,
  pressEquals,
  previewResult,
  stripTrailing,
} from './src/engine/input';
import { useHistory } from './src/hooks/useHistory';
import { useMemoryRegister, useSettings } from './src/hooks/usePersisted';
import type { HistoryEntry } from './src/storage/storage';
import { themes } from './src/theme';
import { notify } from './src/utils/notify';

function Calculator() {
  const insets = useSafeAreaInsets();
  const { settings, ready, update } = useSettings();
  const { entries, add, remove, clear } = useHistory();
  const { memory, setMemory } = useMemoryRegister();

  const theme = themes[settings.theme];

  const [calc, setCalc] = useState<CalcState>(INITIAL_STATE);
  // A ref mirrors the state so very fast taps never read a stale value.
  const calcRef = useRef<CalcState>(INITIAL_STATE);
  const [screen, setScreen] = useState<'calc' | 'history'>('calc');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const setCalcState = useCallback((next: CalcState) => {
    calcRef.current = next;
    setCalc(next);
  }, []);

  // Android back button: close settings / history before leaving the app.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (settingsOpen) {
        setSettingsOpen(false);
        return true;
      }
      if (screen === 'history') {
        setScreen('calc');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [screen, settingsOpen]);

  const copyText = useCallback(async (text: string | null) => {
    if (!text) {
      notify('Nothing to copy');
      return;
    }
    try {
      await Clipboard.setStringAsync(text);
      notify(`Copied ${text}`);
    } catch {
      notify('Could not copy');
    }
  }, []);

  /** Copy the result, or the live preview, or the number being typed. */
  const copyCurrent = useCallback(() => {
    const s = calcRef.current;
    if (s.error) return copyText(null);
    const text = s.result ?? previewResult(s) ?? (stripTrailing(s.expression) || null);
    return copyText(text);
  }, [copyText]);

  const handleMemory = useCallback(
    (id: 'MC' | 'MR' | 'M+' | 'M-') => {
      const s = calcRef.current;
      if (id === 'MC') {
        setMemory(0);
        notify('Memory cleared');
        return;
      }
      if (id === 'MR') {
        if (memory === 0) {
          notify('Memory is empty');
          return;
        }
        setCalcState(insertNumber(s, memory));
        return;
      }
      const value = currentValue(s);
      if (value === null) {
        notify('Calculate a number first');
        return;
      }
      try {
        const next = Number(formatNumber(id === 'M+' ? memory + value : memory - value));
        setMemory(next);
        notify(`Memory: ${formatNumber(next)}`);
      } catch {
        notify('Memory value too large');
      }
    },
    [memory, setMemory, setCalcState],
  );

  const handleKey = useCallback(
    (id: KeyId) => {
      if (id === 'MC' || id === 'MR' || id === 'M+' || id === 'M-') {
        handleMemory(id);
        return;
      }
      if (id === '=') {
        const { state, committed } = pressEquals(calcRef.current);
        setCalcState(state);
        if (committed) add(committed.expression, committed.result);
        return;
      }
      setCalcState(applyKey(calcRef.current, id as EditKey));
    },
    [add, handleMemory, setCalcState],
  );

  const handleSelect = useCallback(
    (entry: HistoryEntry) => {
      setCalcState(loadEntry(entry.expression, entry.result));
      setScreen('calc');
    },
    [setCalcState],
  );

  const preview = useMemo(() => previewResult(calc), [calc]);

  // Avoid a flash of the wrong theme while saved settings load.
  if (!ready) return <View style={[styles.fill, { backgroundColor: themes.dark.background }]} />;

  return (
    <View
      style={[
        styles.fill,
        { backgroundColor: theme.background, paddingTop: insets.top, paddingBottom: insets.bottom + 10 },
      ]}
    >
      <StatusBar style={theme.statusBar} />

      {screen === 'history' ? (
        <HistoryScreen
          theme={theme}
          entries={entries}
          onBack={() => setScreen('calc')}
          onSelect={handleSelect}
          onDelete={remove}
          onClear={clear}
          onCopy={copyText}
        />
      ) : (
        <>
          <Header
            theme={theme}
            onCopy={copyCurrent}
            onHistory={() => setScreen('history')}
            onSettings={() => setSettingsOpen(true)}
          />
          <Display
            theme={theme}
            state={calc}
            preview={preview}
            hasMemory={memory !== 0}
            onCopy={copyCurrent}
          />
          <View style={styles.padWrap}>
            <Keypad theme={theme} haptics={settings.haptics} onKey={handleKey} />
          </View>
        </>
      )}

      <SettingsModal
        visible={settingsOpen}
        theme={theme}
        settings={settings}
        onChange={update}
        onClose={() => setSettingsOpen(false)}
      />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Calculator />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  padWrap: { paddingTop: 8 },
});
