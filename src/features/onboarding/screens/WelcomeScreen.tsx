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
import {COLORS} from '@/shared/utils/constants';

const {width} = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface OnboardingSlide {
  id: string;
  icon: string;
  title: string;
  titleLingala?: string;
  description: string;
  descriptionLingala?: string;
  backgroundColor: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    icon: '👋',
    title: 'Bienvenue !',
    titleLingala: 'Boyei malamu!',
    description: 'GoShopperAI vous aide à faire des économies sur vos achats',
    descriptionLingala:
      'GoShopperAI ekosalisa yo okoba mbongo na bisombi na yo',
    backgroundColor: COLORS.primary[500],
  },
  {
    id: '2',
    icon: '📸',
    title: 'Prenez une photo',
    titleLingala: 'Zwa foto',
    description: 'Photographiez simplement votre ticket de caisse ou facture',
    descriptionLingala: 'Zwa foto ya ticket to facture na yo',
    backgroundColor: '#10b981',
  },
  {
    id: '3',
    icon: '🤖',
    title: "L'IA analyse tout",
    titleLingala: 'IA etaleli nyonso',
    description:
      'Notre intelligence artificielle lit automatiquement tous les prix',
    descriptionLingala: 'Intelligence artificielle etangi ntalo nyonso',
    backgroundColor: '#6366f1',
  },
  {
    id: '4',
    icon: '💰',
    title: 'Économisez !',
    titleLingala: 'Bomba mbongo!',
    description: 'Comparez les prix et trouvez les meilleures offres',
    descriptionLingala: 'Talela ntalo mpe zwa oyo ya malamu koleka',
    backgroundColor: '#f59e0b',
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
        <Text style={styles.slideIcon}>{item.icon}</Text>
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
            <Text style={styles.nextButtonText}>
              {isLastSlide ? '🚀 Commencer !' : 'Suivant →'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Trial info */}
        <View style={styles.trialInfo}>
          <Text style={styles.trialIcon}>🎁</Text>
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
    backgroundColor: COLORS.primary[500],
  },
  slide: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  slideContent: {
    alignItems: 'center',
  },
  slideIcon: {
    fontSize: 100,
    marginBottom: 32,
  },
  slideTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  slideTitleLingala: {
    fontSize: 20,
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 24,
  },
  slideDescription: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 8,
  },
  slideDescriptionLingala: {
    fontSize: 14,
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
    marginTop: 16,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginHorizontal: 6,
  },
  dotActive: {
    backgroundColor: '#ffffff',
    width: 24,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  skipButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  skipButtonText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '500',
  },
  nextButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  startButton: {
    flex: 1,
    marginLeft: 0,
  },
  nextButtonText: {
    color: COLORS.primary[600],
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  trialInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  trialIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  trialText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default WelcomeScreen;
