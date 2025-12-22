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
  PanResponder,
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
  Ellipse,
  Text as SvgText,
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

// Modern savings/money management illustration
const SavingsIllustration: React.FC<{animate?: boolean}> = ({animate = false}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const coinsAnim = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const arrowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animate) {
      // Wallet pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Coins floating animation
      coinsAnim.forEach((anim, i) => {
        Animated.loop(
          Animated.sequence([
            Animated.delay(i * 300),
            Animated.timing(anim, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ])
        ).start();
      });

      // Arrow growth animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(arrowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.delay(500),
          Animated.timing(arrowAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [animate, pulseAnim, coinsAnim, arrowAnim]);

  return (
    <View style={illustrationStyles.container}>
      <Svg width={260} height={200} viewBox="0 0 260 200">
        <Defs>
          <SvgGradient id="walletGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={Colors.primary} />
            <Stop offset="100%" stopColor={Colors.primaryDark} />
          </SvgGradient>
          <SvgGradient id="coinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFD700" />
            <Stop offset="100%" stopColor="#FFA500" />
          </SvgGradient>
          <SvgGradient id="accentGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={Colors.accent} />
            <Stop offset="100%" stopColor={Colors.accentLight} />
          </SvgGradient>
        </Defs>

        {/* Background circles */}
        <Circle cx="130" cy="100" r="90" fill={Colors.primary} opacity="0.08" />
        <Circle cx="130" cy="100" r="70" fill={Colors.primary} opacity="0.12" />

        {/* Modern Wallet - Main Focus */}
        <G transform="translate(130, 100)">
          {/* Wallet body */}
          <Rect
            x="-45"
            y="-25"
            width="90"
            height="50"
            rx="8"
            fill="url(#walletGrad)"
          />
          
          {/* Wallet flap */}
          <Path
            d="M-45,-25 L-45,-15 Q-45,-10 -40,-10 L40,-10 Q45,-10 45,-15 L45,-25"
            fill={Colors.primaryDark}
          />
          
          {/* Wallet detail line */}
          <Rect x="-45" y="-5" width="90" height="2" fill={Colors.primaryDark} opacity="0.3" />
          
          {/* Card slot */}
          <Rect x="-30" y="0" width="25" height="15" rx="2" fill={Colors.white} opacity="0.3" />
          
          {/* Wallet shine */}
          <Circle cx="-25" cy="-15" r="6" fill={Colors.white} opacity="0.2" />
        </G>

        {/* Money coming out - Right side */}
        <G transform="translate(190, 85)">
          {/* Bill 1 */}
          <Rect x="0" y="0" width="35" height="20" rx="3" fill={Colors.accent} opacity="0.9" />
          <Rect x="3" y="3" width="29" height="14" rx="2" fill={Colors.white} opacity="0.2" />
          <Circle cx="17.5" cy="10" r="5" fill={Colors.white} opacity="0.3" />
          
          {/* Bill 2 */}
          <Rect x="5" y="25" width="35" height="20" rx="3" fill={Colors.accent} opacity="0.7" />
          <Rect x="8" y="28" width="29" height="14" rx="2" fill={Colors.white} opacity="0.2" />
          <Circle cx="22.5" cy="35" r="5" fill={Colors.white} opacity="0.3" />
        </G>

        {/* Stacked coins - Left side */}
        <G transform="translate(60, 120)">
          {/* Coin stack */}
          <Ellipse cx="0" cy="0" rx="15" ry="4" fill="#FFA500" />
          <Rect x="-15" y="-12" width="30" height="12" fill="url(#coinGrad)" />
          <Ellipse cx="0" cy="-12" rx="15" ry="4" fill="#FFD700" />
          
          {/* Coin detail */}
          <Circle cx="0" cy="-12" r="8" fill={Colors.white} opacity="0.2" />
          <SvgText x="0" y="-8" textAnchor="middle" fill={Colors.white} fontSize="12" fontWeight="bold">$</SvgText>
        </G>

        {/* Upward growth arrow */}
        <G transform="translate(130, 165)">
          <Path
            d="M-25,10 L-15,-5 L0,8 L15,-10 L25,0"
            stroke={Colors.accent}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          
          {/* Arrow head */}
          <Path
            d="M25,0 L25,-8 L20,-3 M25,-8 L30,-3"
            stroke={Colors.accent}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          
          {/* Percentage increase indicator */}
          <Circle cx="0" cy="-5" r="12" fill={Colors.accent} opacity="0.2" />
          <SvgText x="0" y="0" textAnchor="middle" fill={Colors.accent} fontSize="14" fontWeight="bold">+%</SvgText>
        </G>

        {/* Sparkles / money particles */}
        <Circle cx="70" cy="60" r="3" fill="#FFD700" opacity="0.7" />
        <Circle cx="200" cy="70" r="4" fill="#FFD700" opacity="0.6" />
        <Circle cx="85" cy="150" r="2.5" fill={Colors.accent} opacity="0.5" />
        <Circle cx="210" cy="130" r="3.5" fill={Colors.accent} opacity="0.6" />
        <Circle cx="50" cy="95" r="2" fill={Colors.primary} opacity="0.4" />
        <Circle cx="215" cy="155" r="2.5" fill={Colors.primary} opacity="0.5" />
      </Svg>

      {/* Animated floating coins */}
      {[0, 1, 2].map((i) => {
        const coinOpacity = coinsAnim[i].interpolate({
          inputRange: [0, 0.3, 1],
          outputRange: [0, 1, 0],
        });

        const coinTranslateY = coinsAnim[i].interpolate({
          inputRange: [0, 1],
          outputRange: [0, -40],
        });

        const positions = [
          { left: 100, top: 100 },
          { left: 140, top: 110 },
          { left: 120, top: 105 },
        ];

        return (
          <Animated.View
            key={i}
            style={[
              {
                position: 'absolute',
                left: positions[i].left,
                top: positions[i].top,
              },
              {
                opacity: coinOpacity,
                transform: [{ translateY: coinTranslateY }],
              },
            ]}
          >
            <Svg width={16} height={16} viewBox="0 0 16 16">
              <Circle cx="8" cy="8" r="7" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
              <Circle cx="8" cy="8" r="5" fill="#FFA500" opacity="0.3" />
              <SvgText x="8" y="11" textAnchor="middle" fill="#DAA520" fontSize="10" fontWeight="bold">$</SvgText>
            </Svg>
          </Animated.View>
        );
      })}
    </View>
  );
};

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
});

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
    if (currentSlide >= SLIDES.length - 1) return; // Already at last slide
    
    hapticService.light();
    setIsTransitioning(true);

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
  }, [currentSlide, isTransitioning, fadeAnim, slideAnim]);

  const previousSlide = useCallback(() => {
    if (isTransitioning) return;
    if (currentSlide <= 0) return; // Already at first slide
    
    hapticService.light();
    setIsTransitioning(true);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 50,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentSlide(prev => prev - 1);
      slideAnim.setValue(-50);
      
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
  }, [currentSlide, isTransitioning, fadeAnim, slideAnim]);

  // Pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only start responding if horizontal swipe is detected
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderRelease: (_, gestureState) => {
        const swipeThreshold = 50;
        
        // Swipe left (next slide)
        if (gestureState.dx < -swipeThreshold) {
          nextSlide();
        }
        // Swipe right (previous slide)
        else if (gestureState.dx > swipeThreshold) {
          previousSlide();
        }
      },
    })
  ).current;

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

  // Safety check to prevent crash
  const currentSlideData = SLIDES[currentSlide] || SLIDES[0];
  const {SvgIllustration} = currentSlideData;

  return (
    <View style={[styles.container, {paddingTop: insets.top}]} {...panResponder.panHandlers}>
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
    backgroundColor: '#C1121F', // Brand primary red
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg, // 16px - matches app buttons
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
    backgroundColor: '#C1121F', // Brand primary red
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing['2xl'],
    borderRadius: BorderRadius.lg, // 16px - matches app buttons
    ...Shadows.lg,
  },
  getStartedText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.white,
    fontWeight: Typography.fontWeight.bold,
    marginRight: Spacing.sm,
  },
});