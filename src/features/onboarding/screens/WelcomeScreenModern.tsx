// Modern Welcome Screen with Clean Design and Brand Colors
import React, {useState, useRef, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
  Platform,
  Image,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, {
  Path,
  Circle,
  Rect,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  G,
} from 'react-native-svg';
import {RootStackParamList} from '@/shared/types';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from '@/shared/theme/theme';
import {Icon} from '@/shared/components';
import {hapticService} from '@/shared/services';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ONBOARDING_KEY = '@goshopperai_onboarding_complete';

interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  SvgIllustration: React.ComponentType<any>;
}

// Clean hand-drawn style illustration for scanning
const ScanReceiptIllustration: React.FC<{animate?: boolean}> = ({animate = false}) => {
  const scanLineY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animate) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineY, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineY, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [animate, scanLineY]);

  const translateY = scanLineY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 100],
  });

  return (
    <View style={illustrationStyles.container}>
      <Svg width={260} height={200} viewBox="0 0 260 200">
        <Defs>
          <SvgGradient id="scanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={Colors.primary} />
            <Stop offset="100%" stopColor={Colors.primaryDark} />
          </SvgGradient>
        </Defs>

        {/* Phone outline - hand drawn style */}
        <Rect 
          x="70" y="20" width="120" height="160" rx="16" 
          fill={Colors.background.secondary}
          stroke={Colors.accent}
          strokeWidth="3"
        />
        
        {/* Screen */}
        <Rect 
          x="80" y="35" width="100" height="125" rx="8" 
          fill={Colors.white}
          stroke={Colors.border.light}
          strokeWidth="1"
        />
        
        {/* Receipt lines on screen */}
        <G opacity="0.8">
          <Rect x="90" y="50" width="60" height="6" rx="3" fill={Colors.text.tertiary} />
          <Rect x="90" y="65" width="45" height="4" rx="2" fill={Colors.text.tertiary} />
          <Rect x="90" y="78" width="70" height="4" rx="2" fill={Colors.text.tertiary} />
          <Rect x="90" y="91" width="55" height="4" rx="2" fill={Colors.text.tertiary} />
          <Rect x="90" y="104" width="65" height="4" rx="2" fill={Colors.text.tertiary} />
          <Rect x="90" y="120" width="40" height="6" rx="3" fill={Colors.primary} />
        </G>

        {/* Camera icon */}
        <Circle cx="130" cy="170" r="6" fill={Colors.accent} />

        {/* Sparkles */}
        <Circle cx="50" cy="50" r="4" fill={Colors.primary} opacity="0.6" />
        <Circle cx="210" cy="80" r="3" fill={Colors.accent} opacity="0.5" />
        <Circle cx="220" cy="150" r="5" fill={Colors.primary} opacity="0.4" />
        <Circle cx="40" cy="130" r="3" fill={Colors.accent} opacity="0.6" />
      </Svg>
      
      {/* Animated scan line */}
      <Animated.View 
        style={[
          illustrationStyles.scanLine, 
          {transform: [{translateY}]}
        ]} 
      />
    </View>
  );
};

// Clean AI analysis illustration
const AIAnalysisIllustration: React.FC<{animate?: boolean}> = ({animate = false}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (animate) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [animate, pulseAnim]);

  return (
    <View style={illustrationStyles.container}>
      <Animated.View style={{transform: [{scale: pulseAnim}]}}>
        <Svg width={260} height={200} viewBox="0 0 260 200">
          <Defs>
            <SvgGradient id="aiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={Colors.accent} />
              <Stop offset="100%" stopColor={Colors.accentLight} />
            </SvgGradient>
          </Defs>

          {/* Central brain/chip */}
          <Circle cx="130" cy="100" r="45" fill="url(#aiGrad)" opacity="0.15" />
          <Circle cx="130" cy="100" r="30" fill="url(#aiGrad)" opacity="0.3" />
          <Circle cx="130" cy="100" r="18" fill={Colors.accent} />
          
          {/* AI symbol in center */}
          <Path
            d="M122,95 L130,105 L138,95 M130,90 L130,110"
            stroke={Colors.white}
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />

          {/* Connection lines */}
          <G opacity="0.6">
            <Path d="M130,55 L130,70" stroke={Colors.accent} strokeWidth="2" strokeLinecap="round" />
            <Path d="M130,130 L130,145" stroke={Colors.accent} strokeWidth="2" strokeLinecap="round" />
            <Path d="M85,100 L100,100" stroke={Colors.accent} strokeWidth="2" strokeLinecap="round" />
            <Path d="M160,100 L175,100" stroke={Colors.accent} strokeWidth="2" strokeLinecap="round" />
          </G>

          {/* Data nodes */}
          <Circle cx="130" cy="45" r="8" fill={Colors.primary} />
          <Circle cx="130" cy="155" r="8" fill={Colors.primary} />
          <Circle cx="75" cy="100" r="8" fill={Colors.primary} />
          <Circle cx="185" cy="100" r="8" fill={Colors.primary} />

          {/* Diagonal connections */}
          <G opacity="0.4">
            <Path d="M98,68 L115,85" stroke={Colors.primary} strokeWidth="2" />
            <Path d="M162,68 L145,85" stroke={Colors.primary} strokeWidth="2" />
            <Path d="M98,132 L115,115" stroke={Colors.primary} strokeWidth="2" />
            <Path d="M162,132 L145,115" stroke={Colors.primary} strokeWidth="2" />
          </G>

          {/* Corner nodes */}
          <Circle cx="90" cy="60" r="6" fill={Colors.accent} opacity="0.7" />
          <Circle cx="170" cy="60" r="6" fill={Colors.accent} opacity="0.7" />
          <Circle cx="90" cy="140" r="6" fill={Colors.accent} opacity="0.7" />
          <Circle cx="170" cy="140" r="6" fill={Colors.accent} opacity="0.7" />
        </Svg>
      </Animated.View>
    </View>
  );
};

// Clean savings/growth illustration
const SavingsIllustration: React.FC<{animate?: boolean}> = ({animate = false}) => {
  const coinAnim = useRef(new Animated.Value(0)).current;
  const chartHeights = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    if (animate) {
      // Coin drop animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(coinAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.delay(1000),
          Animated.timing(coinAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Chart growth animation
      Animated.stagger(150, 
        chartHeights.map((anim, i) =>
          Animated.spring(anim, {
            toValue: 1,
            tension: 40,
            friction: 8,
            useNativeDriver: true,
          })
        )
      ).start();
    }
  }, [animate, coinAnim, chartHeights]);

  const coinOpacity = coinAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1, 1],
  });

  const coinTranslateY = coinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-30, 0],
  });

  return (
    <View style={illustrationStyles.container}>
      <Svg width={260} height={200} viewBox="0 0 260 200">
        <Defs>
          <SvgGradient id="chartGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <Stop offset="0%" stopColor={Colors.primary} />
            <Stop offset="100%" stopColor={Colors.primaryDark} />
          </SvgGradient>
          <SvgGradient id="coinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFD700" />
            <Stop offset="100%" stopColor="#FFA500" />
          </SvgGradient>
        </Defs>

        {/* Piggy bank body */}
        <G transform="translate(140, 90)">
          <Circle cx="0" cy="30" r="40" fill={Colors.primary} opacity="0.2" />
          <Circle cx="0" cy="30" r="32" fill={Colors.primary} opacity="0.4" />
          <Circle cx="0" cy="30" r="24" fill={Colors.primary} />
          
          {/* Coin slot */}
          <Rect x="-8" y="2" width="16" height="4" rx="2" fill={Colors.primaryDark} />
          
          {/* Eyes */}
          <Circle cx="-8" cy="25" r="3" fill={Colors.white} />
          <Circle cx="8" cy="25" r="3" fill={Colors.white} />
          <Circle cx="-7" cy="25" r="1.5" fill={Colors.primaryDark} />
          <Circle cx="9" cy="25" r="1.5" fill={Colors.primaryDark} />
          
          {/* Snout */}
          <Circle cx="0" cy="38" r="8" fill={Colors.primaryDark} opacity="0.3" />
          <Circle cx="-3" cy="38" r="2" fill={Colors.primaryDark} />
          <Circle cx="3" cy="38" r="2" fill={Colors.primaryDark} />
        </G>

        {/* Growth chart bars */}
        {[0, 1, 2, 3].map((i) => (
          <Animated.View 
            key={i} 
            style={{
              position: 'absolute',
              left: 35 + i * 22,
              bottom: 30,
              transform: [{scaleY: chartHeights[i]}],
            }}
          >
            <View style={{
              width: 16,
              height: [40, 60, 55, 80][i],
              backgroundColor: i === 3 ? Colors.accent : Colors.primary,
              borderRadius: 4,
              opacity: i === 3 ? 1 : 0.6 + i * 0.1,
            }} />
          </Animated.View>
        ))}

        {/* Trend line */}
        <Path
          d="M43,150 Q65,135 87,145 Q109,110 130,100"
          stroke={Colors.accent}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          opacity="0.8"
        />

        {/* Arrow up */}
        <G transform="translate(125, 85)">
          <Path
            d="M0,15 L0,0 L-6,6 M0,0 L6,6"
            stroke={Colors.accent}
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
        </G>
      </Svg>

      {/* Animated falling coin */}
      <Animated.View 
        style={[
          illustrationStyles.coin,
          {
            opacity: coinOpacity,
            transform: [{translateY: coinTranslateY}],
          }
        ]}
      >
        <Svg width={24} height={24} viewBox="0 0 24 24">
          <Circle cx="12" cy="12" r="11" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
          <Circle cx="12" cy="12" r="8" fill="#FFA500" opacity="0.3" />
          <Path d="M12,7 L12,17 M9,10 L15,10 M9,14 L15,14" stroke="#DAA520" strokeWidth="1.5" strokeLinecap="round" />
        </Svg>
      </Animated.View>
    </View>
  );
};

const illustrationStyles = StyleSheet.create({
  container: {
    width: 260,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanLine: {
    position: 'absolute',
    top: 55,
    left: 85,
    width: 90,
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
    opacity: 0.8,
  },
  coin: {
    position: 'absolute',
    top: 60,
    right: 55,
  },
});

const SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Scan Intelligent',
    subtitle: 'Simple & Rapide',
    description: 'Photographiez vos reçus et laissez notre IA extraire automatiquement tous les détails.',
    SvgIllustration: ScanReceiptIllustration,
  },
  {
    id: '2',
    title: 'Analyse IA',
    subtitle: 'Intelligence Avancée',
    description: 'Notre technologie analyse vos achats pour vous donner des insights personnalisés.',
    SvgIllustration: AIAnalysisIllustration,
  },
  {
    id: '3',
    title: 'Économisez Plus',
    subtitle: 'Optimisez vos Dépenses',
    description: 'Suivez vos dépenses et découvrez comment maximiser vos économies au quotidien.',
    SvgIllustration: SavingsIllustration,
  },
];

export function WelcomeScreenModern() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const nextSlide = useCallback(() => {
    if (isTransitioning) return;
    
    hapticService.light();
    setIsTransitioning(true);

    if (currentSlide < SLIDES.length - 1) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentSlide(prev => prev + 1);
        slideAnim.setValue(50);
        
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setIsTransitioning(false);
        });
      });
    }
  }, [currentSlide, isTransitioning, fadeAnim, slideAnim]);

  const handleGetStarted = useCallback(async () => {
    try {
      hapticService.medium();
      await AsyncStorage.setItem(ONBOARDING_KEY, 'completed');
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        navigation.replace('SignIn');
      });
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      navigation.replace('SignIn');
    }
  }, [navigation, fadeAnim, scaleAnim]);

  const currentSlideData = SLIDES[currentSlide];
  const {SvgIllustration} = currentSlideData;

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.primary} />
      
      {/* Header with Logo */}
      <View style={styles.header}>
        <Image 
          source={require('../../../../assets/logo.png')} 
          style={{width: 48, height: 48}} 
          resizeMode="contain"
        />
        <Text style={styles.brandName}>GoShopper</Text>
      </View>

      {/* Main Content */}
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{translateX: slideAnim}, {scale: scaleAnim}],
          }
        ]}
      >
        {/* Illustration Card */}
        <View style={styles.illustrationCard}>
          <SvgIllustration animate={!isTransitioning} />
        </View>

        {/* Text Content */}
        <View style={styles.textContent}>
          <View style={styles.subtitleBadge}>
            <Text style={styles.subtitle}>{currentSlideData.subtitle}</Text>
          </View>
          <Text style={styles.title}>{currentSlideData.title}</Text>
          <Text style={styles.description}>{currentSlideData.description}</Text>
        </View>
      </Animated.View>

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {SLIDES.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentSlide && styles.dotActive,
            ]}
          />
        ))}
      </View>

      {/* Action Buttons */}
      <View style={[styles.footer, {paddingBottom: insets.bottom + Spacing.lg}]}>
        {currentSlide < SLIDES.length - 1 ? (
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.skipButton} 
              onPress={handleGetStarted}
            >
              <Text style={styles.skipText}>Ignorer</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.nextButton}
              onPress={nextSlide}
              disabled={isTransitioning}
              activeOpacity={0.8}
            >
              <Text style={styles.nextText}>Suivant</Text>
              <Icon name="chevron-right" size="sm" color={Colors.white} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={handleGetStarted}
            activeOpacity={0.8}
          >
            <Text style={styles.getStartedText}>Commencer</Text>
            <Icon name="arrow-right" size="md" color={Colors.white} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  brandName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    marginLeft: Spacing.sm,
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationCard: {
    width: SCREEN_WIDTH - Spacing.xl * 2,
    height: 240,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing['2xl'],
    ...Shadows.md,
  },
  textContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  subtitleBadge: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border.light,
    marginHorizontal: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  skipText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    ...Shadows.md,
  },
  nextText: {
    fontSize: Typography.fontSize.md,
    color: Colors.white,
    fontWeight: Typography.fontWeight.semiBold,
    marginRight: Spacing.xs,
  },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing['2xl'],
    borderRadius: BorderRadius.full,
    ...Shadows.lg,
  },
  getStartedText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.white,
    fontWeight: Typography.fontWeight.bold,
    marginRight: Spacing.sm,
  },
});