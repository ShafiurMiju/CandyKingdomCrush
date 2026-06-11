/** A reusable pressable button with a couple of visual variants. */

import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import {palette, radius, shadow, spacing} from '../constants/theme';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  icon?: string;
  style?: StyleProp<ViewStyle>;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  icon,
  style,
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({pressed}) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      <View style={styles.row}>
        {icon ? <Text style={styles.icon}>{icon}</Text> : null}
        <Text
          style={[
            styles.text,
            variant === 'ghost' && styles.ghostText,
          ]}>
          {title}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    minWidth: 200,
    alignItems: 'center',
    ...shadow,
  },
  row: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center'},
  primary: {backgroundColor: palette.accent},
  secondary: {backgroundColor: palette.panelLight},
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: palette.panelLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  pressed: {opacity: 0.82, transform: [{scale: 0.98}]},
  disabled: {opacity: 0.45},
  icon: {fontSize: 18, marginRight: spacing.sm},
  text: {
    color: '#2A0E5F',
    fontSize: 18,
    fontWeight: '800',
  },
  ghostText: {color: palette.text},
});
