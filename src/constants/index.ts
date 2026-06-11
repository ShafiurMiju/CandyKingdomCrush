/**
 * Game-wide tunable constants. Kept free of any React/UI imports so the engine
 * and tests can use them in isolation.
 */

/** Board dimensions. The classic Candy Crush board is 8x8 wide squares. */
export const BOARD_ROWS = 8;
export const BOARD_COLS = 8;

/** Number of candy colours in play. */
export const NUM_COLORS = 6;

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

/** Base points awarded per match length. Anything 6+ uses MATCH_5 + extra. */
export const SCORE_MATCH_3 = 60;
export const SCORE_MATCH_4 = 120;
export const SCORE_MATCH_5 = 250;
/** Points added per candy beyond the 5th in a single run. */
export const SCORE_EXTRA_PER_CANDY = 70;

/** Bonus for spawning a special candy. */
export const SCORE_SPECIAL_SPAWN = 50;
/** Bonus per candy destroyed by a detonating special candy. */
export const SCORE_SPECIAL_CLEAR = 20;
/** Bonus per ice layer broken. */
export const SCORE_ICE_BREAK = 25;
/** Bonus per chocolate block cleared. */
export const SCORE_CHOCOLATE_CLEAR = 40;

/**
 * Combo multiplier applied at cascade step N (1-based). Step 1 is x1, and each
 * additional cascade in the same move ramps the multiplier up.
 */
export const COMBO_MULTIPLIERS = [1, 1, 1.5, 2, 2.5, 3, 4, 5];

/** Returns the multiplier for a given (1-based) cascade combo step. */
export function comboMultiplier(combo: number): number {
  const idx = Math.min(Math.max(combo, 1), COMBO_MULTIPLIERS.length) - 1;
  return COMBO_MULTIPLIERS[idx];
}

// ---------------------------------------------------------------------------
// Animation timings (ms) — shared by the orchestration hook and components.
// ---------------------------------------------------------------------------

export const ANIM = {
  swap: 220,
  invalidShake: 320,
  pop: 200,
  fall: 260,
  spawnStagger: 18,
  comboToastDuration: 700,
};

/** Minimum swipe distance (in px) to register a swap gesture. */
export const SWIPE_THRESHOLD = 12;
