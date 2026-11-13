/**
 * SidCalc – root component.
 *
 * Wires together the pure calculator logic (src/engine), persistent storage
 * (src/hooks, src/storage), the animation settings (src/hooks/useMotion) and
 * the UI (src/components). Five tabs: Calculator, Scientific, Converter,
 * History and Settings. One shared calculator state feeds the first two.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { CopyCheck } from './src/components/CopyCheck';
import { ConverterScreen } from './src/components/converter/ConverterScreen';
import { Display } from './src/components/Display';
import { Header } from './src/components/Header';
import { HistoryScreen } from './src/components/HistoryScreen';
import { LoadingDots } from './src/components/LoadingDots';
import { KeyId, Keypad } from './src/components/Keypad';
import { ScreenTransition } from './src/components/ScreenTransition';
import { SciKeypad } from './src/components/SciKeypad';
import { SettingsScreen } from './src/components/SettingsScreen';
import { TABS, TabBar, TabId } from './src/components/TabBar';
import { formatNumber, usesAngles } from './src/engine/calculator';
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
import { MotionProvider, useMotionConfig } from './src/hooks/useMotion';
import { useMemoryRegister, useSettings } from './src/hooks/usePersisted';
import type { HistoryEntry } from './src/storage/storage';
import { themes } from './src/theme';
import { notify } from './src/utils/notify';

/** Keys whose rejection (nothing changed) is worth a small shake. */
const SHAKE_ON_REJECT = (id: KeyId): boolean => !/^\d$/.test(id) && !['back', 'clear', 'sign'].includes(id);

function Calculator() {
  const insets = useSafeAreaInsets();
  const { settings, ready, update } = useSettings();
  const { entries, add, remove, clear } = useHistory();
  const { memory, setMemory } = useMemoryRegister();
  const motion = useMotionConfig(settings);

  const theme = themes[settings.theme];
  const angle = settings.angle;

  const [calc, setCalc] = useState<CalcState>(INITIAL_STATE);
  // A ref mirrors the state so very fast taps never read a stale value.
  const calcRef = useRef<CalcState>(INITIAL_STATE);
  const [tab, setTab] = useState<TabId>('calculator');
  const prevTab = useRef<TabId>('calculator');
  const [revealTick, setRevealTick] = useState(0);
  const [errorTick, setErrorTick] = useState(0);
  const [copyTick, setCopyTick] = useState(0);
  const [copied, setCopied] = useState('');

  const setCalcState = useCallback((next: CalcState) => {
    calcRef.current = next;
    setCalc(next);
  }, []);

  const goTo = useCallback((next: TabId) => {
    setTab((cur) => {
      prevTab.current = cur;
      return next;
    });
  }, []);

  // Android back button: return to the Calculator tab before leaving the app.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (tab !== 'calculator') {
        goTo('calculator');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [tab, goTo]);

  const copyText = useCallback(async (text: string | null) => {
    if (!text) {
      notify('Nothing to copy');
      return;
    }
    try {
      await Clipboard.setStringAsync(text);
      setCopied(text);
      setCopyTick((t) => t + 1);
    } catch {
      notify('Could not copy');
    }
  }, []);

  /** Copy the result, or the live preview, or the number being typed. */
  const copyCurrent = useCallback(() => {
    const s = calcRef.current;
    if (s.error) return copyText(null);
    const text = s.result ?? previewResult(s, angle) ?? (stripTrailing(s.expression) || null);
    return copyText(text);
  }, [copyText, angle]);

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
      const value = currentValue(s, angle);
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
    [memory, setMemory, setCalcState, angle],
  );

  const handleKey = useCallback(
    (id: KeyId) => {
      if (id === 'MC' || id === 'MR' || id === 'M+' || id === 'M-') {
        handleMemory(id);
        return;
      }
      const cur = calcRef.current;
      if (id === 'MODE') {
        update({ angle: angle === 'deg' ? 'rad' : 'deg' });
        // A shown answer was computed with the old unit: go back to editing.
        if (cur.result !== null) setCalcState({ ...cur, result: null });
        return;
      }
      if (id === '=') {
        const { state, committed } = pressEquals(cur, angle);
        setCalcState(state);
        if (state.error) setErrorTick((t) => t + 1);
        else if (state !== cur && state.result !== null) setRevealTick((t) => t + 1);
        if (committed) {
          add(committed.expression, committed.result, usesAngles(committed.expression) ? angle : undefined);
        }
        return;
      }
      const next = applyKey(cur, id as EditKey);
      if (
        SHAKE_ON_REJECT(id) &&
        cur.result === null &&
        cur.error === null &&
        next.expression === cur.expression
      ) {
        setErrorTick((t) => t + 1);
      }
      setCalcState(next);
    },
    [add, angle, handleMemory, setCalcState, update],
  );

  const handleSelect = useCallback(
    (entry: HistoryEntry) => {
      setCalcState(loadEntry(entry.expression, entry.result));
      if (entry.angle && entry.angle !== angle) update({ angle: entry.angle });
      goTo(/[a-z∛π^!]/.test(entry.expression) ? 'scientific' : 'calculator');
    },
    [angle, goTo, setCalcState, update],
  );

  const preview = useMemo(() => previewResult(calc, angle), [calc, angle]);

  if (!ready) {
    return (
      <View style={[styles.center, { backgroundColor: themes.dark.background }]}>
        <LoadingDots color={themes.dark.accent} />
      </View>
    );
  }

  const direction = Math.sign(
    TABS.findIndex((t) => t.id === tab) - TABS.findIndex((t) => t.id === prevTab.current),
  );

  let screen: React.ReactNode;
  switch (tab) {
    case 'calculator':
      screen = (
        <>
          <Header theme={theme} onCopy={copyCurrent} />
          <Display
            theme={theme}
            state={calc}
            preview={preview}
            hasMemory={memory !== 0}
            onCopy={copyCurrent}
            revealTick={revealTick}
            errorTick={errorTick}
          />
          <View style={styles.padWrap}>
            <Keypad theme={theme} haptics={settings.haptics} onKey={handleKey} />
          </View>
        </>
      );
      break;
    case 'scientific':
      screen = (
        <>
          <Header
            theme={theme}
            onCopy={copyCurrent}
            subtitle={`Scientific · ${angle === 'deg' ? 'Degrees' : 'Radians'}`}
          />
          <Display
            theme={theme}
            state={calc}
            preview={preview}
            hasMemory={memory !== 0}
            onCopy={copyCurrent}
            revealTick={revealTick}
            errorTick={errorTick}
            compact
          />
          <View style={styles.padWrap}>
            <SciKeypad theme={theme} haptics={settings.haptics} angle={angle} onKey={handleKey} />
          </View>
        </>
      );
      break;
    case 'converter':
      screen = (
        <>
          <Header theme={theme} title="Converter" />
          <ConverterScreen theme={theme} onCopy={copyText} />
        </>
      );
      break;
    case 'history':
      screen = (
        <HistoryScreen
          theme={theme}
          entries={entries}
          onSelect={handleSelect}
          onDelete={remove}
          onClear={clear}
          onCopy={copyText}
        />
      );
      break;
    default:
      screen = <SettingsScreen theme={theme} settings={settings} motion={motion} onChange={update} />;
  }

  return (
    <MotionProvider value={motion}>
      <View style={[styles.fill, { backgroundColor: theme.background, paddingTop: insets.top }]}>
        <StatusBar style={theme.statusBar} />
        <View style={styles.fill}>
          <ScreenTransition screenKey={tab} direction={direction}>
            {screen}
          </ScreenTransition>
        </View>
        <TabBar theme={theme} active={tab} onChange={goTo} />
        <CopyCheck theme={theme} tick={copyTick} text={copied} />
      </View>
    </MotionProvider>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  padWrap: { paddingTop: 8, paddingBottom: 8 },
});
