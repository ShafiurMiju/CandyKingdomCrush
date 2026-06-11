/** Board pixel layout, derived from the screen width. */

import {Dimensions} from 'react-native';
import {BOARD_COLS, BOARD_ROWS} from './index';

const {width} = Dimensions.get('window');

/** Outer padding around the candy grid inside the board frame. */
export const BOARD_PADDING = 6;

/** The candy grid is square; cap it so it looks good on tablets too. */
const maxGridWidth = Math.min(width - 28, 440) - BOARD_PADDING * 2;

/** Side length of a single candy tile, in px. */
export const TILE_SIZE = Math.floor(maxGridWidth / BOARD_COLS);

/** Width/height of the candy grid (without frame padding). */
export const GRID_WIDTH = TILE_SIZE * BOARD_COLS;
export const GRID_HEIGHT = TILE_SIZE * BOARD_ROWS;

/** Width/height of the whole board frame. */
export const BOARD_SIZE = GRID_WIDTH + BOARD_PADDING * 2;

/** Inset of the candy inside its tile (gives candies a small gap). */
export const CANDY_INSET = Math.max(2, Math.floor(TILE_SIZE * 0.06));
export const CANDY_SIZE = TILE_SIZE - CANDY_INSET * 2;
