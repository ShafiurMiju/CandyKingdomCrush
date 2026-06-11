/**
 * Visual theme: palette, candy colours/glyphs and reusable style tokens.
 * Candies are drawn as coloured rounded tiles with an emoji glyph, so the game
 * ships with zero binary image assets while still looking colourful.
 */

import {CandyColor} from '../types';

export const palette = {
  bgTop: '#3A1078',
  bgBottom: '#4E31AA',
  panel: '#2E0B6E',
  panelLight: '#5B2EC4',
  accent: '#FFD93D',
  accentDark: '#F4A300',
  text: '#FFFFFF',
  textMuted: '#C9B9F2',
  success: '#6BCB77',
  danger: '#FF5D6C',
  star: '#FFD93D',
  starEmpty: '#5B4A8A',
  boardBg: '#27065C',
  cellEven: '#3D1A86',
  cellOdd: '#45219A',
  overlay: 'rgba(20, 4, 52, 0.82)',
};

/** Per-candy-colour fill and glyph. Index === CandyColor. */
export const CANDY_THEME: {
  color: string;
  light: string;
  glyph: string;
  name: string;
}[] = [
  {color: '#FF4D6D', light: '#FF8FA3', glyph: '🍓', name: 'Strawberry'},
  {color: '#FF9F45', light: '#FFC178', glyph: '🍊', name: 'Orange'},
  {color: '#FFD93D', light: '#FFE98A', glyph: '🍋', name: 'Lemon'},
  {color: '#6BCB77', light: '#A7E0AE', glyph: '🍏', name: 'Apple'},
  {color: '#4D96FF', light: '#92BFFF', glyph: '🫐', name: 'Blueberry'},
  {color: '#9B5DE5', light: '#C19BF0', glyph: '🍇', name: 'Grape'},
];

export function candyTheme(color: CandyColor) {
  return CANDY_THEME[color] ?? CANDY_THEME[0];
}

/** Badge glyphs overlaid on special candies. */
export const SPECIAL_GLYPH = {
  'striped-h': '↔️',
  'striped-v': '↕️',
  wrapped: '🎁',
  bomb: '💣',
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 22,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 18,
  xl: 28,
};

export const shadow = {
  shadowColor: '#000',
  shadowOpacity: 0.3,
  shadowRadius: 6,
  shadowOffset: {width: 0, height: 3},
  elevation: 4,
};
