/** Board pixel layout, derived from the screen size. */

import {Dimensions} from 'react-native';
import {BOARD_COLS, BOARD_ROWS} from './index';

const {width, height} = Dimensions.get('window');

/** Outer padding around the candy grid inside the board frame. */
export const BOARD_PADDING = 6;

/** Near edge-to-edge horizontally; cap it so it looks good on tablets too. */
const maxGridWidth = Math.min(width - 16, 520) - BOARD_PADDING * 2;

/** Width of a single candy tile, in px. */
export const TILE_WIDTH = Math.floor(maxGridWidth / BOARD_COLS);

/**
 * Vertical space the HUD, safe areas and margins occupy around the board.
 * Conservative estimate — the board centres in whatever slack remains.
 */
const RESERVED_VERTICAL = 300;
const maxGridHeight = height - RESERVED_VERTICAL - BOARD_PADDING * 2;

/**
 * Tiles stretch vertically to fill the screen, capped at 1.25x their width so
 * the candies never look distorted.
 */
export const TILE_HEIGHT = Math.max(
  TILE_WIDTH,
  Math.min(
    Math.floor(maxGridHeight / BOARD_ROWS),
    Math.floor(TILE_WIDTH * 1.25),
  ),
);

/** Width/height of the candy grid (without frame padding). */
export const GRID_WIDTH = TILE_WIDTH * BOARD_COLS;
export const GRID_HEIGHT = TILE_HEIGHT * BOARD_ROWS;

/** Width/height of the whole board frame. */
export const BOARD_WIDTH = GRID_WIDTH + BOARD_PADDING * 2;
export const BOARD_HEIGHT = GRID_HEIGHT + BOARD_PADDING * 2;

/** Inset of the candy inside its tile (gives candies a small gap). */
export const CANDY_INSET = Math.max(2, Math.floor(TILE_WIDTH * 0.06));

/** Candies stay square (sized off tile width) and centre in taller tiles. */
export const CANDY_SIZE = TILE_WIDTH - CANDY_INSET * 2;
export const CANDY_OFFSET_X = CANDY_INSET;
export const CANDY_OFFSET_Y = Math.floor((TILE_HEIGHT - CANDY_SIZE) / 2);
