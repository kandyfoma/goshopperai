import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  StatusBar,
} from 'react-native';
import {SvgXml} from 'react-native-svg';
import {logoIconSvg, Colors} from '../../../assets/logo-icon';

interface SplashScreenProps {
  onAnimationComplete?: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({onAnimationComplete}) => {
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Clean, smooth entrance animations
    Animated.sequence([
      // Logo appears with smooth scale
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      // Text slides up and fades in
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Callback after animation
    const timer = setTimeout(() => {
      onAnimationComplete?.();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

      {/* Main logo */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            transform: [{scale: logoScale}],
            opacity: logoOpacity,
          },
        ]}>
        <View style={styles.logoShadow}>
          <SvgXml xml={logoIconSvg} width={120} height={120} />
        </View>
      </Animated.View>

      {/* App name */}
      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: textOpacity,
            transform: [{translateY: textTranslateY}],
          },
        ]}>
        <Text style={styles.appName}>GoShopper</Text>
        <Text style={styles.tagline}>Smart Shopping</Text>
      </Animated.View>

      {/* Loading indicator */}
      <Animated.View style={[styles.loadingContainer, {opacity: textOpacity}]}>
        <View style={styles.loadingBar}>
          <LoadingProgress />
        </View>
      </Animated.View>
    </View>
  );
};

// Animated loading progress bar
const LoadingProgress: React.FC = () => {
  const width = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(width, {
      toValue: 1,
      duration: 1800,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, []);

  const animatedWidth = width.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[styles.loadingProgress, {width: animatedWidth}]} />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondary, // Light background
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  logoShadow: {
    shadowColor: Colors.primary,
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  textContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 16,
    color: Colors.textLight,
    marginTop: 8,
    fontWeight: '400',
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 80,
    width: '60%',
  },
  loadingBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingProgress: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
});

export default SplashScreen;
