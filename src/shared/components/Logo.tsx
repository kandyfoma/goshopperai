import React, {useEffect, useRef} from 'react';
import {View, StyleSheet, Animated, Easing, ViewStyle} from 'react-native';
import {SvgXml} from 'react-native-svg';
import {
  logoIconSvg,
  logoIconWhiteSvg,
  logoIconMinimalSvg,
  logoFullSvg,
  logoBlueGoldSvg,
  logoPurpleOrangeSvg,
  logoTealCoralSvg,
} from '../../../assets/logo-icon';

type LogoVariant =
  | 'default'
  | 'white'
  | 'minimal'
  | 'full'
  | 'blueGold'
  | 'purpleOrange'
  | 'tealCoral';

interface LogoProps {
  size?: number;
  style?: ViewStyle;
  variant?: LogoVariant;
  animated?: boolean;
  pulseOnLoad?: boolean;
}

const Logo: React.FC<LogoProps> = ({
  size = 100,
  style,
  variant = 'default',
  animated = false,
  pulseOnLoad = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(pulseOnLoad ? 0.8 : 1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (pulseOnLoad) {
      // Initial pulse animation on load
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 300,
          easing: Easing.out(Easing.back(2)),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }

    if (animated) {
      // Subtle continuous animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }
  }, [animated, pulseOnLoad, scaleAnim]);

  const getLogoSvg = () => {
    switch (variant) {
      case 'white':
        return logoIconWhiteSvg;
      case 'minimal':
        return logoIconMinimalSvg;
      case 'full':
        return logoFullSvg;
      case 'blueGold':
        return logoBlueGoldSvg;
      case 'purpleOrange':
        return logoPurpleOrangeSvg;
      case 'tealCoral':
        return logoTealCoralSvg;
      default:
        return logoIconSvg;
    }
  };

  const getAspectRatio = () => {
    // Full logo has different aspect ratio
    if (variant === 'full') {
      return {width: size * 2.8, height: size * 0.8};
    }
    return {width: size, height: size};
  };

  const dimensions = getAspectRatio();

  return (
    <Animated.View
      style={[styles.container, style, {transform: [{scale: scaleAnim}]}]}>
      <SvgXml
        xml={getLogoSvg()}
        width={dimensions.width}
        height={dimensions.height}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Logo;
