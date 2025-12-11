// Welcome Screen - First-time user onboarding
import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  FlatList,
  Animated,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '@/shared/types';
import {Colors, Typography, Spacing, BorderRadius} from '@/shared/theme/theme';
import {Icon} from '@/shared/components';

const {width} = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface OnboardingSlide {
  id: string;
  iconName: string;
  title: string;
  titleLingala?: string;
  description: string;
  descriptionLingala?: string;
  backgroundColor: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    iconName: 'hand',
    title: 'Bienvenue !',
    titleLingala: 'Boyei malamu!',
    description: 'GoShopperAI vous aide à faire des économies sur vos achats',
    descriptionLingala:
      'GoShopperAI ekosalisa yo okoba mbongo na bisombi na yo',
    backgroundColor: Colors.primary,
  },
  {
    id: '2',
    iconName: 'camera',
    title: 'Prenez une photo',
    titleLingala: 'Zwa foto',
    description: 'Photographiez simplement votre ticket de caisse ou facture',
    descriptionLingala: 'Zwa foto ya ticket to facture na yo',
    backgroundColor: Colors.status.success,
  },
  {
    id: '3',
    iconName: 'sparkles',
    title: "L'IA analyse tout",
    titleLingala: 'IA etaleli nyonso',
    description:
      'Notre intelligence artificielle lit automatiquement tous les prix',
    descriptionLingala: 'Intelligence artificielle etangi ntalo nyonso',
    backgroundColor: Colors.primaryLight,
  },
  {
    id: '4',
    iconName: 'wallet',
    title: 'Économisez !',
    titleLingala: 'Bomba mbongo!',
    description: 'Comparez les prix et trouvez les meilleures offres',
    descriptionLingala: 'Talela ntalo mpe zwa oyo ya malamu koleka',
    backgroundColor: Colors.accent,
  },
];

export function WelcomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({index: currentIndex + 1});
      setCurrentIndex(currentIndex + 1);
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = () => {
    handleGetStarted();
  };

  const handleGetStarted = () => {
    // Navigate to login screen
    navigation.reset({
      index: 0,
      routes: [{name: 'Login'}],
    });
  };

  const renderSlide = ({item}: {item: OnboardingSlide}) => (
    <View style={[styles.slide, {backgroundColor: item.backgroundColor}]}>
      <View style={styles.slideContent}>
        <View style={styles.iconContainer}>
          <Icon name={item.iconName} size="3xl" color={Colors.white} variant="filled" />
        </View>
        <Text style={styles.slideTitle}>{item.title}</Text>
        {item.titleLingala && (
          <Text style={styles.slideTitleLingala}>{item.titleLingala}</Text>
        )}
        <Text style={styles.slideDescription}>{item.description}</Text>
        {item.descriptionLingala && (
          <Text style={styles.slideDescriptionLingala}>
            {item.descriptionLingala}
          </Text>
        )}
      </View>
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {SLIDES.map((_, index) => (
        <View
          key={index}
          style={[styles.dot, currentIndex === index && styles.dotActive]}
        />
      ))}
    </View>
  );

  const isLastSlide = currentIndex === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{nativeEvent: {contentOffset: {x: scrollX}}}],
          {useNativeDriver: false},
        )}
        onMomentumScrollEnd={event => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        scrollEventThrottle={16}
      />

      <View style={styles.bottomSection}>
        {renderDots()}

        <View style={styles.buttonsContainer}>
          {!isLastSlide && (
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              activeOpacity={0.7}>
              <Text style={styles.skipButtonText}>Passer</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.nextButton, isLastSlide && styles.startButton]}
            onPress={handleNext}
            activeOpacity={0.8}>
            <View style={styles.buttonContent}>
              <Text style={styles.nextButtonText}>
                {isLastSlide ? 'Commencer !' : 'Suivant'}
              </Text>
              <Icon 
                name={isLastSlide ? 'rocket' : 'chevron-right'} 
                size="md" 
                color={Colors.primary} 
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Trial info */}
        <View style={styles.trialInfo}>
          <Icon name="gift" size="md" color={Colors.white} />
          <Text style={styles.trialText}>
            2 mois gratuits • Aucune carte requise
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  slide: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  slideContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  slideTitle: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  slideTitleLingala: {
    fontSize: Typography.fontSize.xl,
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  slideDescription: {
    fontSize: Typography.fontSize.lg,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: Spacing.sm,
  },
  slideDescriptionLingala: {
    fontSize: Typography.fontSize.md,
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomSection: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['2xl'],
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    marginTop: Spacing.base,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginHorizontal: 6,
  },
  dotActive: {
    backgroundColor: Colors.white,
    width: 24,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  skipButton: {
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.xl,
  },
  skipButtonText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
  nextButton: {
    backgroundColor: Colors.white,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing['2xl'],
    borderRadius: BorderRadius['2xl'],
    elevation: 3,
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  startButton: {
    flex: 1,
    marginLeft: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  nextButtonText: {
    color: Colors.primary,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    textAlign: 'center',
  },
  trialInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    gap: Spacing.sm,
  },
  trialText: {
    color: Colors.white,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
  },
});

export default WelcomeScreen;
