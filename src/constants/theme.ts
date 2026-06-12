/**
 * Visual theme: palette, candy colours/glyphs and reusable style tokens.
 * Candies are drawn as coloured rounded tiles with an emoji glyph, so the game
 * ships with zero binary image assets while still looking colourful.
 */

import {CandyColor} from '../types';

export const palette = {
  bgTop: '#FFF1F6', // app background — soft near-white pink (no violet)
  bgBottom: '#FFE3EE',
  panel: '#FFFFFF', // cards / surfaces
  panelLight: '#FFD7E6', // soft pink — secondary surfaces, borders, badges
  accent: '#FF4D8D', // candy pink — primary buttons & highlights
  accentDark: '#E03A77',
  text: '#3A322E', // warm dark text for light backgrounds
  textMuted: '#9A8F86',
  success: '#3DB36B',
  danger: '#FF5260',
  star: '#FFC42E', // gold star
  starEmpty: '#E6DCE2',
  boardBg: '#FFFFFF',
  cellEven: '#FFF1F6',
  cellOdd: '#FCE2EC',
  overlay: 'rgba(38, 26, 34, 0.74)',
};

/** Per-candy-colour fill and glyph. Index === CandyColor. */
export const CANDY_THEME: {
  color: string;
  light: string;
  glyph: string;
  name: string;
}[] = [
  {color: '#FF4D6D', light: '#FF8FA3', glyph: '🍭', name: 'Lollipop'},
  {color: '#FF9F45', light: '#FFC178', glyph: '🍩', name: 'Donut'},
  {color: '#FFD93D', light: '#FFE98A', glyph: '🍪', name: 'Cookie'},
  {color: '#6BCB77', light: '#A7E0AE', glyph: '🍬', name: 'Bonbon'},
  {color: '#4D96FF', light: '#92BFFF', glyph: '🍦', name: 'Ice Cream'},
  {color: '#9B5DE5', light: '#C19BF0', glyph: '🧁', name: 'Cupcake'},
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
