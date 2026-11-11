/**
 * Colour palettes for SidCalc. Dark (black / charcoal / gold) is the default.
 */
export type ThemeName = 'dark' | 'light';

export interface Theme {
  name: ThemeName;
  background: string;
  surface: string;
  border: string;
  text: string;
  textMuted: string;
  /** Digit buttons */
  keyDigit: string;
  keyDigitText: string;
  /** Function buttons: C, ⌫, %, brackets, √, x² */
  keyFunction: string;
  keyFunctionText: string;
  /** Memory buttons */
  keyMemory: string;
  keyMemoryText: string;
  /** Operator + equals buttons (gold) */
  gold: string;
  goldText: string;
  danger: string;
  statusBar: 'light' | 'dark';
}

export const darkTheme: Theme = {
  name: 'dark',
  background: '#0A0A0B',
  surface: '#161618',
  border: '#2A2A2D',
  text: '#F5F2EA',
  textMuted: '#8D8A82',
  keyDigit: '#202023',
  keyDigitText: '#F5F2EA',
  keyFunction: '#323236',
  keyFunctionText: '#E8C766',
  keyMemory: '#141416',
  keyMemoryText: '#B9B5A8',
  gold: '#D4AF37',
  goldText: '#14110A',
  danger: '#FF6B5E',
  statusBar: 'light',
};

export const lightTheme: Theme = {
  name: 'light',
  background: '#F6F3EA',
  surface: '#FFFFFF',
  border: '#DDD7C6',
  text: '#16140F',
  textMuted: '#6F6A5C',
  keyDigit: '#FFFFFF',
  keyDigitText: '#16140F',
  keyFunction: '#E9E3D1',
  keyFunctionText: '#7A5F0A',
  keyMemory: '#EFEAD9',
  keyMemoryText: '#5F5A4C',
  gold: '#C9A227',
  goldText: '#16140F',
  danger: '#C0392B',
  statusBar: 'dark',
};

export const themes: Record<ThemeName, Theme> = { dark: darkTheme, light: lightTheme };
