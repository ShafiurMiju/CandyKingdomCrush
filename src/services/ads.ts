/**
 * AdsService
 * ----------
 * Wrapper around react-native-google-mobile-ads: initialises the SDK and keeps
 * an interstitial and a rewarded ad preloaded.
 *
 *  - Banner:       bottom of the Home screen (see AdBanner).
 *  - Interstitial: shown on level start / next / win / loss (GameScreen), with a
 *                  short cooldown so two events can't stack ads back-to-back.
 *  - Rewarded:     in-game power-ups — watch an ad to spawn a bomb or +moves.
 *
 * Ad unit ids use Google's public TEST ids in development (__DEV__). Replace the
 * PROD_* placeholders with your real AdMob unit ids for release builds, and the
 * TEST app ids in Info.plist (GADApplicationIdentifier) + AndroidManifest.xml
 * (APPLICATION_ID meta-data). Ads are non-critical: errors are swallowed so a
 * failed/blocked ad never affects gameplay.
 */

import {Platform} from 'react-native';
import mobileAds, {
  AdEventType,
  InterstitialAd,
  MaxAdContentRating,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

// --- Ad unit ids ----------------------------------------------------------
// TODO: replace with your real AdMob unit ids before shipping.
const PROD_BANNER =
  Platform.select({
    ios: 'ca-app-pub-0000000000000000/0000000000',
    android: 'ca-app-pub-0000000000000000/0000000000',
  }) ?? '';
const PROD_INTERSTITIAL =
  Platform.select({
    ios: 'ca-app-pub-0000000000000000/0000000000',
    android: 'ca-app-pub-0000000000000000/0000000000',
  }) ?? '';
const PROD_REWARDED =
  Platform.select({
    ios: 'ca-app-pub-0000000000000000/0000000000',
    android: 'ca-app-pub-0000000000000000/0000000000',
  }) ?? '';

export const BANNER_AD_UNIT_ID = __DEV__ ? TestIds.BANNER : PROD_BANNER;
const INTERSTITIAL_AD_UNIT_ID = __DEV__ ? TestIds.INTERSTITIAL : PROD_INTERSTITIAL;
const REWARDED_AD_UNIT_ID = __DEV__ ? TestIds.REWARDED : PROD_REWARDED;

/** Minimum gap between interstitials so start/win/next events don't stack. */
const INTERSTITIAL_COOLDOWN_MS = 15000;

let initialized = false;

let interstitial: InterstitialAd | null = null;
let interstitialLoaded = false;
let lastInterstitialAt = 0;

let rewarded: RewardedAd | null = null;
let rewardedLoaded = false;

function loadInterstitial() {
  interstitialLoaded = false;
  const ad = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_UNIT_ID, {
    requestNonPersonalizedAdsOnly: true,
  });
  ad.addAdEventListener(AdEventType.LOADED, () => {
    interstitialLoaded = true;
  });
  ad.addAdEventListener(AdEventType.ERROR, () => {
    interstitialLoaded = false;
  });
  interstitial = ad;
  try {
    ad.load();
  } catch {
    /* will retry on next event */
  }
}

function loadRewarded() {
  rewardedLoaded = false;
  const ad = RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID, {
    requestNonPersonalizedAdsOnly: true,
  });
  ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
    rewardedLoaded = true;
  });
  ad.addAdEventListener(AdEventType.ERROR, () => {
    rewardedLoaded = false;
  });
  rewarded = ad;
  try {
    ad.load();
  } catch {
    /* will retry on next request */
  }
}

export const AdsService = {
  /** Initialise the Mobile Ads SDK and preload the first interstitial + rewarded. */
  async init(): Promise<void> {
    if (initialized) {
      return;
    }
    initialized = true;
    try {
      await mobileAds().setRequestConfiguration({
        maxAdContentRating: MaxAdContentRating.G,
        tagForChildDirectedTreatment: false,
        tagForUnderAgeOfConsent: false,
      });
      await mobileAds().initialize();
      loadInterstitial();
      loadRewarded();
    } catch {
      /* ads are optional — never block startup */
    }
  },

  /**
   * Show an interstitial (level start / next / win / loss). Skips silently if
   * one isn't ready or the cooldown hasn't elapsed. `onDone` (if given) runs
   * exactly once — after the ad closes, or immediately when no ad is shown — so
   * a caller can navigate afterwards.
   */
  showInterstitial(onDone?: () => void): void {
    const done = onDone ?? (() => {});
    const now = Date.now();
    const onCooldown = now - lastInterstitialAt < INTERSTITIAL_COOLDOWN_MS;

    if (!interstitial || !interstitialLoaded || onCooldown) {
      done();
      if (!interstitialLoaded) {
        loadInterstitial();
      }
      return;
    }

    const ad = interstitial;
    lastInterstitialAt = now;
    let finished = false;
    const finish = () => {
      if (finished) {
        return;
      }
      finished = true;
      loadInterstitial(); // preload the next one
      done();
    };
    ad.addAdEventListener(AdEventType.CLOSED, finish);
    ad.addAdEventListener(AdEventType.ERROR, finish);
    try {
      ad.show();
    } catch {
      finish();
    }
  },

  /** True when a rewarded ad is preloaded and ready to show right now. */
  isRewardedReady(): boolean {
    return rewardedLoaded;
  },

  /**
   * Show a rewarded ad. Calls `onReward` only if the user earns the reward;
   * `onUnavailable` runs if no ad was ready or it was dismissed early.
   */
  showRewarded(onReward: () => void, onUnavailable?: () => void): void {
    const ad = rewarded;
    if (!ad || !rewardedLoaded) {
      onUnavailable?.();
      loadRewarded();
      return;
    }

    let earned = false;
    let settled = false;
    const subs: Array<() => void> = [];
    const cleanup = () => subs.forEach(unsub => unsub());

    subs.push(
      ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        earned = true;
      }),
    );
    subs.push(
      ad.addAdEventListener(AdEventType.CLOSED, () => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        loadRewarded();
        if (earned) {
          onReward();
        } else {
          onUnavailable?.();
        }
      }),
    );
    subs.push(
      ad.addAdEventListener(AdEventType.ERROR, () => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        loadRewarded();
        onUnavailable?.();
      }),
    );

    try {
      ad.show();
    } catch {
      if (!settled) {
        settled = true;
        cleanup();
        loadRewarded();
        onUnavailable?.();
      }
    }
  },
};
