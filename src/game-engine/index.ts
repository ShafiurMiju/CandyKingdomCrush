/**
 * Game engine barrel export.
 *
 * The engine is 100% pure TypeScript with no React/UI dependencies, so it can be
 * unit-tested in isolation and reused on any platform.
 */

export * as BoardGenerator from './BoardGenerator';
export * as MatchDetector from './MatchDetector';
export * as SwapValidator from './SwapValidator';
export * as GravityEngine from './GravityEngine';
export * as CascadeEngine from './CascadeEngine';
export * as PowerUpEngine from './PowerUpEngine';
export * as LevelEngine from './LevelEngine';
export * as ScoreEngine from './ScoreEngine';

// Also re-export the most commonly used functions directly.
export {generateBoardForLevel, generateMatchFreeBoard, reshuffleBoard} from './BoardGenerator';
export {findMatches, hasAnyMatch} from './MatchDetector';
export {isValidSwap, swapCells, involvesColorBomb, hasAvailableMove} from './SwapValidator';
export {applyGravityAndRefill} from './GravityEngine';
export {resolveBoard, computeClear} from './CascadeEngine';
export {computeBlast, spreadChocolate, ALL_COLORS} from './PowerUpEngine';
export {
  evaluateLevel,
  isObjectiveComplete,
  starsForScore,
  starsForTime,
  bonusStarForScore,
  bonusStarForTime,
  completionRatio,
  liveStars,
  isTimedLevel,
  objectiveProgress,
  countIceLayers,
  countChocolate,
  countLocks,
} from './LevelEngine';
