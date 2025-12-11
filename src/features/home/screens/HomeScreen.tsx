// Home Screen - Main landing page optimized for ease of use
// Designed for Congolese housewives - simple, visual, large buttons
// Styled with GoShopperAI Design System (Blue + Gold)
import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Animated,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '@/shared/types';
import {useSubscription, useAuth, useUser} from '@/shared/contexts';
import {Colors, Typography, Spacing, BorderRadius, Shadows} from '@/shared/theme/theme';
import {Icon, IconBox, Card, FadeIn, SlideIn, Stagger} from '@/shared/components';
import {analyticsService} from '@/shared/services';

const {width} = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Animated Scan Button with Pulse Effect
const AnimatedScanButton = ({onPress, disabled}: {onPress: () => void; disabled: boolean}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    // Continuous pulse animation
    const pulse = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(pulseOpacity, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.6,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.scanButtonWrapper}>
      {/* Pulse ring effect */}
      <Animated.View
        style={[
          styles.pulseRing,
          {
            transform: [{scale: pulseAnim}],
            opacity: pulseOpacity,
          },
        ]}
      />
      <Animated.View style={{transform: [{scale: scaleAnim}]}}>
        <TouchableOpacity
          style={[
            styles.mainScanButton,
            disabled && styles.mainScanButtonDisabled,
          ]}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}>
          <View style={styles.scanButtonContent}>
            <View style={styles.scanIconContainer}>
              <Icon name="camera" size="3xl" color={Colors.white} />
            </View>
            <Text style={styles.scanButtonTitle}>SCANNER</Text>
            <Text style={styles.scanButtonTitleLingala}>Zwa foto</Text>
            <Text style={styles.scanButtonSubtitle}>
              Appuyez ici pour scanner
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// Quick Action Card Component
const QuickActionCard = ({
  icon,
  title,
  subtitle,
  onPress,
  delay = 0,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  delay?: number;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 100,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
    }).start();
  };

  return (
    <SlideIn direction="up" delay={delay}>
      <Animated.View style={{transform: [{scale: scaleAnim}], flex: 1}}>
        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}>
          <View style={styles.quickActionIconWrapper}>
            <Icon name={icon} size="lg" color={Colors.primary} />
          </View>
          <Text style={styles.quickActionTitle}>{title}</Text>
          <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
        </TouchableOpacity>
      </Animated.View>
    </SlideIn>
  );
};

export function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const {canScan, subscription, isTrialActive, trialDaysRemaining} =
    useSubscription();
  const {profile: userProfile} = useUser();

  useEffect(() => {
    analyticsService.logScreenView('Home', 'HomeScreen');
  }, []);

  const handleScanPress = () => {
    if (!canScan) {
      analyticsService.logCustomEvent('scan_blocked_subscription');
      navigation.navigate('Subscription');
      return;
    }

    if (!userProfile?.defaultCity) {
      analyticsService.logCustomEvent('scan_redirect_city_selection');
      navigation.navigate('CitySelection');
      return;
    }

    analyticsService.logCustomEvent('scan_started');
    navigation.navigate('Scanner');
  };

  const isSubscribed = subscription?.isSubscribed;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return {fr: 'Bonjour', lingala: 'Mbote'};
    if (hour < 18) return {fr: 'Bon après-midi', lingala: 'Mbote'};
    return {fr: 'Bonsoir', lingala: 'Mbote na butu'};
  };

  const greeting = getGreeting();
  const userName = userProfile?.displayName?.split(' ')[0] || '';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <FadeIn delay={0}>
          <View style={styles.header}>
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>
                {greeting.fr}{userName ? `, ${userName}` : ''} 👋
              </Text>
              <Text style={styles.greetingLingala}>{greeting.lingala}</Text>
            </View>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => navigation.navigate('Main', {screen: 'Profile'} as any)}>
              <Icon name="user" size="md" color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </FadeIn>

        {/* Trial Status Card */}
        {isTrialActive && (
          <SlideIn direction="right" delay={100}>
            <View style={styles.statusCard}>
              <View style={styles.statusIconContainer}>
                <Icon name="gift" size="lg" color={Colors.accent} variant="filled" />
              </View>
              <View style={styles.statusTextContainer}>
                <Text style={styles.statusTitle}>Essai gratuit actif</Text>
                <Text style={styles.statusSubtitle}>
                  {trialDaysRemaining > 0
                    ? `${trialDaysRemaining} jours restants`
                    : 'Dernière journée !'}
                </Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>GRATUIT</Text>
              </View>
            </View>
          </SlideIn>
        )}

        {/* Premium Status Card */}
        {isSubscribed && (
          <SlideIn direction="right" delay={100}>
            <View style={[styles.statusCard, styles.statusCardPremium]}>
              <View style={[styles.statusIconContainer, styles.statusIconPremium]}>
                <Icon name="star" size="lg" color={Colors.white} variant="filled" />
              </View>
              <View style={styles.statusTextContainer}>
                <Text style={styles.statusTitle}>Abonné Premium</Text>
                <Text style={styles.statusSubtitle}>Scans illimités</Text>
              </View>
              <View style={[styles.statusBadge, styles.statusBadgePremium]}>
                <Text style={styles.statusBadgeText}>PRO</Text>
              </View>
            </View>
          </SlideIn>
        )}

        {/* Main Scan Button */}
        <FadeIn delay={200}>
          <AnimatedScanButton onPress={handleScanPress} disabled={!canScan} />
        </FadeIn>

        {/* How it works - Steps */}
        <FadeIn delay={300}>
          <View style={styles.guideSection}>
            <Text style={styles.sectionTitle}>Comment ça marche ?</Text>
            <View style={styles.stepsContainer}>
              <View style={styles.stepCard}>
                <View style={[styles.stepNumber, {backgroundColor: Colors.primary}]}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Icon name="camera" size="xl" color={Colors.primary} />
                <Text style={styles.stepTitle}>Photo</Text>
                <Text style={styles.stepDesc}>Prenez en photo</Text>
              </View>

              <View style={styles.stepConnector}>
                <Icon name="chevron-right" size="sm" color={Colors.text.tertiary} />
              </View>

              <View style={styles.stepCard}>
                <View style={[styles.stepNumber, {backgroundColor: Colors.accent}]}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Icon name="search" size="xl" color={Colors.accent} />
                <Text style={styles.stepTitle}>Analyse</Text>
                <Text style={styles.stepDesc}>IA lit les prix</Text>
              </View>

              <View style={styles.stepConnector}>
                <Icon name="chevron-right" size="sm" color={Colors.text.tertiary} />
              </View>

              <View style={styles.stepCard}>
                <View style={[styles.stepNumber, {backgroundColor: Colors.status.success}]}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Icon name="trending-down" size="xl" color={Colors.status.success} />
                <Text style={styles.stepTitle}>Économies</Text>
                <Text style={styles.stepDesc}>Meilleurs prix</Text>
              </View>
            </View>
          </View>
        </FadeIn>

        {/* Quick Actions Section */}
        <Text style={styles.sectionTitle}>Actions rapides</Text>

        {/* Row 1 */}
        <View style={styles.quickActionsRow}>
          <QuickActionCard
            icon="file-text"
            title="Longue facture"
            subtitle="Multi-photos"
            onPress={() => navigation.navigate('MultiPhotoScanner')}
            delay={400}
          />
          <QuickActionCard
            icon="clock"
            title="Historique"
            subtitle="Mes factures"
            onPress={() => navigation.navigate('Main', {screen: 'History'} as any)}
            delay={450}
          />
        </View>

        {/* Row 2 */}
        <View style={styles.quickActionsRow}>
          <QuickActionCard
            icon="stats"
            title="Statistiques"
            subtitle="Mes dépenses"
            onPress={() => navigation.navigate('Main', {screen: 'Stats'} as any)}
            delay={500}
          />
          <QuickActionCard
            icon="star"
            title="Premium"
            subtitle="Plus de scans"
            onPress={() => navigation.navigate('Subscription')}
            delay={550}
          />
        </View>

        {/* Row 3 - New Features */}
        <View style={styles.quickActionsRow}>
          <QuickActionCard
            icon="bell"
            title="Alertes Prix"
            subtitle="Suivre les prix"
            onPress={() => navigation.navigate('PriceAlerts')}
            delay={600}
          />
          <QuickActionCard
            icon="cart"
            title="Liste Courses"
            subtitle="Oyo ya kosomba"
            onPress={() => navigation.navigate('ShoppingList')}
            delay={650}
          />
        </View>

        {/* Row 4 - AI & Achievements */}
        <View style={styles.quickActionsRow}>
          <QuickActionCard
            icon="help"
            title="Assistant IA"
            subtitle="Poser questions"
            onPress={() => navigation.navigate('AIAssistant')}
            delay={700}
          />
          <QuickActionCard
            icon="trophy"
            title="Mes Succès"
            subtitle="Voir progrès"
            onPress={() => navigation.navigate('Achievements')}
            delay={750}
          />
        </View>

        {/* Help Card */}
        <SlideIn direction="up" delay={800}>
          <TouchableOpacity style={styles.helpCard} activeOpacity={0.7}>
            <View style={styles.helpIconWrapper}>
              <Icon name="help" size="md" color={Colors.primary} />
            </View>
            <View style={styles.helpTextContainer}>
              <Text style={styles.helpTitle}>Besoin d'aide ?</Text>
              <Text style={styles.helpSubtitle}>
                Appuyez pour voir le guide complet
              </Text>
            </View>
            <Icon name="chevron-right" size="md" color={Colors.text.tertiary} />
          </TouchableOpacity>
        </SlideIn>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 120,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  greetingLingala: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border.light,
  },

  // Status Cards
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  statusCardPremium: {
    backgroundColor: Colors.primary,
  },
  statusIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.status.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  statusIconPremium: {
    backgroundColor: Colors.accent,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  statusSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  statusBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusBadgePremium: {
    backgroundColor: Colors.accentLight,
  },
  statusBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },

  // Main Scan Button
  scanButtonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.xl,
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    width: width - 80,
    height: 180,
    borderRadius: BorderRadius['2xl'],
    backgroundColor: Colors.primary,
  },
  mainScanButton: {
    width: width - 80,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing['2xl'],
    alignItems: 'center',
    ...Shadows.xl,
  },
  mainScanButtonDisabled: {
    backgroundColor: Colors.border.medium,
  },
  scanButtonContent: {
    alignItems: 'center',
  },
  scanIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  scanButtonTitle: {
    color: Colors.white,
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    letterSpacing: 3,
    marginBottom: Spacing.xs,
  },
  scanButtonTitleLingala: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: Typography.fontSize.base,
    fontStyle: 'italic',
    marginBottom: Spacing.sm,
  },
  scanButtonSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: Typography.fontSize.md,
    textAlign: 'center',
  },

  // Guide Section
  guideSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.sm,
    position: 'relative',
  },
  stepNumber: {
    position: 'absolute',
    top: -8,
    left: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
  },
  stepTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
    marginTop: Spacing.sm,
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  stepConnector: {
    paddingHorizontal: Spacing.xs,
  },

  // Quick Actions
  quickActionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.sm,
  },
  quickActionIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  quickActionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
  },

  // Help Card
  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderStyle: 'dashed',
  },
  helpIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  helpTextContainer: {
    flex: 1,
  },
  helpTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  helpSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
  },
});

export default HomeScreen;
