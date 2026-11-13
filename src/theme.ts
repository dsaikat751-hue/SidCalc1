/**
 * Colour palettes for SidCalc. Dark (deep black / charcoal with a crimson
 * neon accent) is the default; a light variant is kept for daytime use.
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
  /** Function buttons: C, ←, %, brackets, √, x², scientific keys */
  keyFunction: string;
  keyFunctionText: string;
  /** Memory buttons */
  keyMemory: string;
  keyMemoryText: string;
  /** Primary accent (operators, equals, highlights) */
  accent: string;
  accentText: string;
  /** Neon glow colour used behind the answer */
  glow: string;
  /** Colour of the big answer text */
  resultText: string;
  danger: string;
  statusBar: 'light' | 'dark';
}

export const darkTheme: Theme = {
  name: 'dark',
  background: '#07070A',
  surface: '#121216',
  border: '#26262C',
  text: '#F4F1F2',
  textMuted: '#8C8790',
  keyDigit: '#1B1B20',
  keyDigitText: '#F4F1F2',
  keyFunction: '#2A2A31',
  keyFunctionText: '#FF6B86',
  keyMemory: '#101014',
  keyMemoryText: '#B5AEB2',
  accent: '#E8123C',
  accentText: '#FFFFFF',
  glow: '#FF2D55',
  resultText: '#FFEEF1',
  danger: '#FFB74D',
  statusBar: 'light',
};

export const lightTheme: Theme = {
  name: 'light',
  background: '#FAF5F6',
  surface: '#FFFFFF',
  border: '#E6D9DC',
  text: '#1A1215',
  textMuted: '#6E6064',
  keyDigit: '#FFFFFF',
  keyDigitText: '#1A1215',
  keyFunction: '#F1E4E7',
  keyFunctionText: '#B0123A',
  keyMemory: '#F5ECEE',
  keyMemoryText: '#5F5256',
  accent: '#D01040',
  accentText: '#FFFFFF',
  glow: '#E8123C',
  resultText: '#B0123A',
  danger: '#B45309',
  statusBar: 'dark',
};

export const themes: Record<ThemeName, Theme> = { dark: darkTheme, light: lightTheme };
