// Modern Welcome Screen with SVG Animations and Transaction Flow
import React, {useState, useRef, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
  ScrollView,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import LottieView from 'lottie-react-native';
import Svg, {
  Path,
  Circle,
  Rect,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  G,
  ClipPath,
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
  gradientColors: string[];
  SvgIllustration: React.ComponentType<any>;
  accentColor: string;
}

// SVG Illustrations
const ScanReceiptIllustration: React.FC<{animate?: boolean}> = ({
  animate = false,
}) => {
  const animValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;
  const glowValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animate) {
      // Phone scanning animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleValue, {
            toValue: 1.1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Glow effect
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowValue, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(glowValue, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [animate]);

  const scanOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const scanTranslateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [50, -50],
  });

  return (
    <Animated.View style={{transform: [{scale: scaleValue}]}}>
      <Svg width={280} height={200} viewBox="0 0 280 200">
        <Defs>
          <SvgGradient id="phoneGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={Colors.primary} />
            <Stop offset="100%" stopColor={Colors.primaryDark} />
          </SvgGradient>
          <SvgGradient id="receiptGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={Colors.white} />
            <Stop offset="100%" stopColor={Colors.secondary} />
          </SvgGradient>
          <SvgGradient id="scanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={Colors.accentLight} />
            <Stop offset="100%" stopColor={Colors.accent} />
          </SvgGradient>
        </Defs>

        {/* Hand-drawn style phone */}
        <Path
          d="M40 50 Q45 45 50 50 L50 200 Q45 205 40 200 L130 200 Q135 205 130 200 L130 50 Q135 45 130 50 Z"
          fill="url(#phoneGradient)"
          stroke={Colors.white}
          strokeWidth="2"
          strokeLinecap="round"
        />
        
        {/* Phone screen with slight curve */}
        <Path
          d="M50 60 Q55 55 60 60 L110 60 Q115 55 120 60 L120 170 Q115 175 110 170 L60 170 Q55 175 50 170 Z"
          fill={Colors.accent}
        />

        {/* Receipt with wavy edges */}
        <Path
          d="M150 60 Q155 55 160 60 L225 60 Q230 55 235 60 L235 175 Q230 180 225 175 L160 175 Q155 180 150 175 Z"
          fill="url(#receiptGradient)"
          stroke={Colors.text.secondary}
          strokeWidth="1"
          strokeDasharray="3,1"
        />

        {/* Hand-drawn receipt lines */}
        {[0, 1, 2, 3, 4, 5].map(i => (
          <Path
            key={i}
            d={`M160 ${85 + i * 15} Q190 ${83 + i * 15} 220 ${85 + i * 15}`}
            stroke="rgba(120,0,0,0.6)"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        ))}

        {/* Animated scan line */}
        <Animated.View
          style={{
            position: 'absolute',
            opacity: scanOpacity,
            transform: [{translateY: scanTranslateY}],
          }}>
          <Rect
            x="45"
            y="100"
            width="80"
            height="3"
            fill="url(#scanGradient)"
            opacity="0.8"
          />
        </Animated.View>

        {/* Success checkmark */}
        <Circle cx="190" cy="50" r="15" fill="#4ade80" stroke="#fff" strokeWidth="2" />
        <Path d="M185,50 L188,53 L195,46" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
};

const AIAnalysisIllustration: React.FC<{animate?: boolean}> = ({
  animate = false,
}) => {
  const brainAnim = useRef(new Animated.Value(0)).current;
  const dataAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animate) {
      Animated.loop(
        Animated.timing(brainAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      ).start();

      Animated.loop(
        Animated.stagger(200, [
          Animated.timing(dataAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(dataAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [animate]);

  return (
    <Animated.View>
      <Svg width={280} height={200} viewBox="0 0 280 200">
        <Defs>
          <SvgGradient id="brainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={Colors.accent} />
            <Stop offset="100%" stopColor={Colors.accentLight} />
          </SvgGradient>
          <SvgGradient id="dataGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={Colors.primary} />
            <Stop offset="100%" stopColor={Colors.primaryLight} />
          </SvgGradient>
        </Defs>

        {/* AI Brain */}
        <Circle cx="140" cy="100" r="50" fill="url(#brainGradient)" opacity="0.9" />
        
        {/* Neural connections */}
        {[0, 1, 2, 3, 4].map(i => (
          <G key={i}>
            <Circle 
              cx={120 + Math.cos(i * 1.2) * 40} 
              cy={100 + Math.sin(i * 1.2) * 40} 
              r="4" 
              fill={Colors.primary} 
            />
            <Path
              d={`M140,100 L${120 + Math.cos(i * 1.2) * 40},${100 + Math.sin(i * 1.2) * 40}`}
              stroke={Colors.primary}
              strokeWidth="2"
              opacity="0.6"
            />
          </G>
        ))}

        {/* Data flows */}
        <Animated.View style={{opacity: dataAnim}}>
          {[0, 1, 2].map(i => (
            <Circle
              key={i}
              cx={60 + i * 40}
              cy="160"
              r="8"
              fill="url(#dataGradient)"
            />
          ))}
        </Animated.View>

        {/* Analysis results */}
        <Rect x="200" y="80" width="60" height="40" rx="8" fill={Colors.primary} opacity="0.9" />
        <SvgText x="230" y="105" textAnchor="middle" fill="#fff" fontSize="12">
          AI Analysis
        </SvgText>
      </Svg>
    </Animated.View>
  );
};

const SavingsIllustration: React.FC<{animate?: boolean}> = ({animate = false}) => {
  const coinAnim = useRef(new Animated.Value(0)).current;
  const chartAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animate) {
      // Coins falling animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(coinAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.delay(500),
          Animated.timing(coinAnim, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Chart growth animation
      Animated.timing(chartAnim, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: false,
      }).start();
    }
  }, [animate]);

  return (
    <Animated.View>
      <Svg width={280} height={200} viewBox="0 0 280 200">
        <Defs>
          <SvgGradient id="coinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={Colors.primaryLight} />
            <Stop offset="100%" stopColor={Colors.primary} />
          </SvgGradient>
          <SvgGradient id="chartGradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <Stop offset="0%" stopColor={Colors.accent} />
            <Stop offset="100%" stopColor={Colors.accentLight} />
          </SvgGradient>
        </Defs>

        {/* Piggy bank */}
        <Circle cx="140" cy="120" r="40" fill="url(#coinGradient)" />
        <Circle cx="130" cy="110" r="3" fill={Colors.primaryDark} />
        <Circle cx="150" cy="110" r="3" fill={Colors.primaryDark} />
        
        {/* Coin slot */}
        <Rect x="135" y="80" width="10" height="3" rx="1.5" fill={Colors.primaryDark} />

        {/* Animated coins */}
        {[0, 1, 2].map(i => (
          <Animated.View
            key={i}
            style={{
              opacity: coinAnim,
              transform: [
                {
                  translateY: coinAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 60 + i * 10],
                  }),
                },
              ],
            }}>
            <Circle
              cx={120 + i * 15}
              cy="40"
              r="8"
              fill={Colors.primary}
              stroke={Colors.primaryDark}
              strokeWidth="2"
            />
          </Animated.View>
        ))}

        {/* Savings chart */}
        <G transform="translate(200, 60)">
          {[0, 1, 2, 3, 4].map(i => (
            <Animated.View key={i} style={{opacity: chartAnim}}>
              <Rect
                x={i * 12}
                y={100 - i * 15}
                width="8"
                height={i * 15}
                fill="url(#chartGradient)"
                rx="2"
              />
            </Animated.View>
          ))}
        </G>

        {/* Money symbols */}
        <SvgText x="50" y="60" fontSize="24" fill={Colors.primary}>₡</SvgText>
        <SvgText x="220" y="40" fontSize="20" fill={Colors.primary}>$</SvgText>
        <SvgText x="30" y="160" fontSize="18" fill={Colors.primary}>€</SvgText>
      </Svg>
    </Animated.View>
  );
};

const SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Scanner Intelligent',
    subtitle: 'IA Avancée',
    description: 'Scannez vos reçus avec notre IA de pointe. Reconnaissance instantanée des produits et prix.',
    gradientColors: [Colors.primaryLight, Colors.secondary],
    SvgIllustration: ScanReceiptIllustration,
    accentColor: Colors.primary,
  },
  {
    id: '2',
    title: 'Analyse IA',
    subtitle: 'Intelligence Artificielle',
    description: 'Notre IA analyse vos habitudes d\'achat et vous recommande les meilleures offres.',
    gradientColors: [Colors.secondary, Colors.accentLight],
    SvgIllustration: AIAnalysisIllustration,
    accentColor: Colors.accent,
  },
  {
    id: '3',
    title: 'Économies Garanties',
    subtitle: 'Maximisez vos économies',
    description: 'Suivez vos dépenses en temps réel et découvrez où vous pouvez économiser le plus.',
    gradientColors: [Colors.accentLight, Colors.primaryLight],
    SvgIllustration: SavingsIllustration,
    accentColor: Colors.primaryDark,
  },
];

export function WelcomeScreenModern() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: (currentSlide + 1) / SLIDES.length,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [currentSlide]);

  const nextSlide = useCallback(() => {
    if (isTransitioning) return;
    
    hapticService.light();
    setIsTransitioning(true);

    if (currentSlide < SLIDES.length - 1) {
      // Slide transition animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentSlide(prev => prev + 1);
        
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setIsTransitioning(false);
        });
      });
    }
  }, [currentSlide, isTransitioning]);

  const handleGetStarted = useCallback(async () => {
    try {
      hapticService.medium();
      await AsyncStorage.setItem(ONBOARDING_KEY, 'completed');
      
      // Exit animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        navigation.replace('SignIn');
      });
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      navigation.replace('SignIn');
    }
  }, [navigation]);

  const currentSlideData = SLIDES[currentSlide];
  const {SvgIllustration} = currentSlideData;

  return (
    <LinearGradient
      colors={currentSlideData.gradientColors}
      style={[styles.container, {paddingTop: insets.top}]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
                backgroundColor: currentSlideData.accentColor,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {currentSlide + 1} / {SLIDES.length}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        
        {/* Main Content */}
        <Animated.View
          style={[
            styles.slideContent,
            {
              opacity: fadeAnim,
              transform: [{scale: scaleAnim}],
            },
          ]}>
          
          {/* SVG Illustration */}
          <View style={styles.illustrationContainer}>
            <SvgIllustration animate={!isTransitioning} />
          </View>

          {/* Text Content */}
          <View style={styles.textContent}>
            <View style={styles.subtitleContainer}>
              <View style={[styles.subtitleBadge, {backgroundColor: currentSlideData.accentColor + '20'}]}>
                <Text style={[styles.subtitle, {color: currentSlideData.accentColor}]}>
                  {currentSlideData.subtitle}
                </Text>
              </View>
            </View>
            
            <Text style={styles.title}>{currentSlideData.title}</Text>
            <Text style={styles.description}>{currentSlideData.description}</Text>
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {currentSlide < SLIDES.length - 1 ? (
            <>
              <TouchableOpacity style={styles.skipButton} onPress={handleGetStarted}>
                <Text style={styles.skipText}>Ignorer</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.nextButton, {backgroundColor: currentSlideData.accentColor}]}
                onPress={nextSlide}
                disabled={isTransitioning}>
                <Text style={styles.nextText}>Suivant</Text>
                <Icon name="chevron-right" size="sm" color="#fff" />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.getStartedButton, {backgroundColor: currentSlideData.accentColor}]}
              onPress={handleGetStarted}>
              <Text style={styles.getStartedText}>Commencer</Text>
              <Icon name="sparkles" size="sm" color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Decorative elements */}
      <View style={styles.decorativeElements}>
        {[...Array(6)].map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.floatingCircle,
              {
                left: `${20 + i * 15}%`,
                top: `${10 + (i % 2) * 80}%`,
                backgroundColor: currentSlideData.accentColor + '15',
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, Math.sin(i) * 20],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginRight: Spacing.md,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: Typography.fontWeight.medium,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
  },
  slideContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['2xl'],
  },
  illustrationContainer: {
    marginBottom: Spacing['2xl'],
    ...Shadows.lg,
  },
  textContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  subtitleContainer: {
    marginBottom: Spacing.md,
  },
  subtitleBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing.md,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4,
  },
  description: {
    fontSize: Typography.fontSize.lg,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: Typography.fontSize.lg * 1.5,
    marginBottom: Spacing.xl,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  skipButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  skipText: {
    fontSize: Typography.fontSize.md,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: Typography.fontWeight.medium,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
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
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing['2xl'],
    borderRadius: BorderRadius.full,
    alignSelf: 'center',
    ...Shadows.lg,
  },
  getStartedText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.white,
    fontWeight: Typography.fontWeight.bold,
    marginRight: Spacing.sm,
  },
  decorativeElements: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  floatingCircle: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});