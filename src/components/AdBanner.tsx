/** An anchored adaptive AdMob banner, shown at the bottom of menu screens. */

import React from 'react';
import {StyleSheet, View} from 'react-native';
import {BannerAd, BannerAdSize} from 'react-native-google-mobile-ads';

import {BANNER_AD_UNIT_ID} from '../services/ads';

export default function AdBanner() {
  return (
    <View style={styles.wrap}>
      <BannerAd
        unitId={BANNER_AD_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{requestNonPersonalizedAdsOnly: true}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {alignItems: 'center', justifyContent: 'center'},
});
