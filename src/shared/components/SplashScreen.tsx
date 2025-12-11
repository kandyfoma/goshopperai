import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, StatusBar } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { logoIconWhiteSvg } from '../../../assets/logo-icon';

interface SplashScreenProps {
  onAnimationComplete?: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onAnimationComplete }) => {
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;
  const sparkleRotate = useRef(new Animated.Value(0)).current;
  const sparkleScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animations
    Animated.sequence([
      // Logo appears with bounce
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // Text slides up and fades in
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      // Sparkle animation
      Animated.parallel([
        Animated.timing(sparkleScale, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.back(2)),
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.timing(sparkleRotate, {
            toValue: 1,
            duration: 3000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ),
      ]),
    ]).start();

    // Optional callback after initial animation
    const timer = setTimeout(() => {
      onAnimationComplete?.();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const sparkleRotation = sparkleRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#059669" />
      
      {/* Animated sparkle decoration */}
      <Animated.View 
        style={[
          styles.sparkleContainer,
          { 
            transform: [
              { rotate: sparkleRotation },
              { scale: sparkleScale }
            ],
            opacity: sparkleScale,
          }
        ]}
      >
        <View style={[styles.sparkle, styles.sparkle1]} />
        <View style={[styles.sparkle, styles.sparkle2]} />
        <View style={[styles.sparkle, styles.sparkle3]} />
        <View style={[styles.sparkle, styles.sparkle4]} />
      </Animated.View>

      {/* Main logo */}
      <Animated.View 
        style={[
          styles.logoContainer,
          { 
            transform: [{ scale: logoScale }],
            opacity: logoOpacity,
          }
        ]}
      >
        <View style={styles.logoShadow}>
          <SvgXml xml={logoIconWhiteSvg} width={140} height={140} />
        </View>
      </Animated.View>

      {/* App name and tagline */}
      <Animated.View 
        style={[
          styles.textContainer,
          { 
            opacity: textOpacity,
            transform: [{ translateY: textTranslateY }],
          }
        ]}
      >
        <View style={styles.appNameContainer}>
          <Text style={styles.appName}>GoShopper</Text>
          <Text style={styles.appNameAI}>AI</Text>
        </View>
        <Text style={styles.tagline}>Économisez intelligemment</Text>
      </Animated.View>

      {/* Loading indicator */}
      <Animated.View style={[styles.loadingContainer, { opacity: textOpacity }]}>
        <View style={styles.loadingDots}>
          <LoadingDot delay={0} />
          <LoadingDot delay={200} />
          <LoadingDot delay={400} />
        </View>
      </Animated.View>
    </View>
  );
};

// Animated loading dot component
const LoadingDot: React.FC<{ delay: number }> = ({ delay }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return <Animated.View style={[styles.dot, { opacity }]} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkleContainer: {
    position: 'absolute',
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FCD34D',
  },
  sparkle1: {
    top: 20,
    left: 140,
  },
  sparkle2: {
    top: 80,
    right: 30,
  },
  sparkle3: {
    bottom: 60,
    left: 50,
  },
  sparkle4: {
    bottom: 30,
    right: 80,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  textContainer: {
    alignItems: 'center',
  },
  appNameContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  appNameAI: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FCD34D',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 60,
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'white',
    marginHorizontal: 4,
  },
});

export default SplashScreen;