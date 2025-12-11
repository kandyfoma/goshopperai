// Profile Screen - User profile and settings access
// Styled with GoShopperAI Design System (Blue + Gold)
import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useAuth, useSubscription} from '@/shared/contexts';
import {RootStackParamList} from '@/shared/types';
import {Colors, Typography, Spacing, BorderRadius, Shadows} from '@/shared/theme/theme';
import {Icon, FadeIn, SlideIn} from '@/shared/components';
import {SUBSCRIPTION_PLANS, TRIAL_SCAN_LIMIT} from '@/shared/utils/constants';
import {formatCurrency, formatDate} from '@/shared/utils/helpers';
import functions from '@react-native-firebase/functions';
import {analyticsService} from '@/shared/services/analytics';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Animated Action Card
const ActionCard = ({
  icon,
  label,
  labelLingala,
  onPress,
  primary = false,
  delay = 0,
}: {
  icon: string;
  label: string;
  labelLingala: string;
  onPress: () => void;
  primary?: boolean;
  delay?: number;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

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
    <SlideIn direction="up" delay={delay}>
      <Animated.View style={[styles.actionCardWrapper, {transform: [{scale: scaleAnim}]}]}>
        <TouchableOpacity
          style={[styles.actionCard, primary && styles.actionCardPrimary]}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}>
          <View style={[styles.actionIconWrapper, primary && styles.actionIconWrapperPrimary]}>
            <Icon 
              name={icon} 
              size="lg" 
              color={primary ? Colors.white : Colors.primary} 
            />
          </View>
          <Text style={[styles.actionLabel, primary && styles.actionLabelPrimary]}>{label}</Text>
          <Text style={[styles.actionLabelLingala, primary && styles.actionLabelLingalaPrimary]}>
            {labelLingala}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </SlideIn>
  );
};

export function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const {user} = useAuth();
  const {subscription, trialScansUsed} = useSubscription();

  const [userStats, setUserStats] = useState({
    totalReceipts: 0,
    totalSavings: 0,
    loading: true,
    error: null as string | null,
  });

  const currentPlan = subscription?.planId
    ? SUBSCRIPTION_PLANS[subscription.planId]
    : SUBSCRIPTION_PLANS.free;

  const trialRemaining = Math.max(0, TRIAL_SCAN_LIMIT - trialScansUsed);
  const isFreeTier = !subscription || subscription.planId === 'free';

  useEffect(() => {
    // Track screen view
    analyticsService.logScreenView('Profile', 'ProfileScreen');
  }, []);

  // Fetch user stats from Cloud Function
  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        setUserStats(prev => ({...prev, loading: true, error: null}));

        const getUserStatsCallable = functions().httpsCallable('getUserStats');
        const result = await getUserStatsCallable();
        const data = result.data as {
          totalReceipts: number;
          totalSavings: number;
          totalSpent: number;
          subscriptionStatus: string;
          monthlyScansUsed: number;
          monthlyScansLimit: number;
        };

        setUserStats({
          totalReceipts: data.totalReceipts || 0,
          totalSavings: data.totalSavings || 0,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error('Failed to fetch user stats:', error);
        setUserStats(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load stats',
        }));
      }
    };

    if (user) {
      fetchUserStats();
    }
  }, [user]);

  const stats = {
    totalReceipts: userStats.totalReceipts,
    totalSavings: userStats.totalSavings,
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <FadeIn>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Icon name="user" size="3xl" color={Colors.primary} />
              </View>
              <View style={styles.onlineIndicator} />
            </View>
            <Text style={styles.welcomeText}>Bienvenue!</Text>
            <Text style={styles.welcomeSubtext}>Boyei malamu! 🇨🇩</Text>
          </View>
        </FadeIn>

        {/* Stats Cards */}
        <SlideIn direction="up" delay={100}>
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Votre Activité</Text>
            <Text style={styles.sectionSubtitle}>Misala na yo</Text>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <View style={styles.statIconWrapper}>
                  <Icon name="receipt" size="lg" color={Colors.primary} />
                </View>
                <Text style={styles.statValue}>
                  {userStats.loading ? '...' : stats.totalReceipts}
                </Text>
                <Text style={styles.statLabel}>Factures</Text>
                <Text style={styles.statLabelLingala}>Bafacture</Text>
              </View>

              <View style={[styles.statCard, styles.statCardHighlight]}>
                <View style={[styles.statIconWrapper, styles.statIconWrapperHighlight]}>
                  <Icon name="trending-down" size="lg" color={Colors.white} />
                </View>
                <Text style={[styles.statValue, styles.statValueHighlight]}>
                  {userStats.loading ? '...' : formatCurrency(stats.totalSavings)}
                </Text>
                <Text style={[styles.statLabel, styles.statLabelHighlight]}>
                  Économisés
                </Text>
                <Text style={[styles.statLabelLingala, styles.statLabelHighlight]}>
                  Obombi!
                </Text>
              </View>
            </View>

            {userStats.error && (
              <Text style={styles.errorText}>{userStats.error}</Text>
            )}
          </View>
        </SlideIn>

        {/* Subscription Card */}
        <SlideIn direction="right" delay={200}>
          <TouchableOpacity
            style={styles.subscriptionCard}
            onPress={() => navigation.navigate('Subscription')}
            activeOpacity={0.8}>
            <View style={styles.subscriptionContent}>
              <View style={[styles.subscriptionIcon, isFreeTier ? {} : styles.subscriptionIconPremium]}>
                <Icon 
                  name={isFreeTier ? 'gift' : 'star'} 
                  size="xl" 
                  color={isFreeTier ? Colors.accent : Colors.white}
                  variant="filled"
                />
              </View>
              <View style={styles.subscriptionInfo}>
                <Text style={styles.subscriptionPlan}>{currentPlan.name}</Text>
                {isFreeTier ? (
                  <>
                    <Text style={styles.subscriptionStatus}>
                      {trialRemaining} scans gratuits restants
                    </Text>
                    <Text style={styles.subscriptionStatusLingala}>
                      {trialRemaining} scans ofele etikali
                    </Text>
                  </>
                ) : (
                  <Text style={styles.subscriptionStatus}>
                    Expire:{' '}
                    {subscription?.expiryDate
                      ? formatDate(subscription.expiryDate)
                      : 'Jamais'}
                  </Text>
                )}
              </View>
              <Icon name="chevron-right" size="md" color={Colors.primary} />
            </View>

            {isFreeTier && trialRemaining < 3 && (
              <View style={styles.upgradePrompt}>
                <View style={styles.upgradeWarning}>
                  <Icon name="alert-triangle" size="sm" color={Colors.status.warning} />
                  <Text style={styles.upgradeText}>
                    Plus que {trialRemaining} essais !
                  </Text>
                </View>
                <Text style={styles.upgradeButton}>Passer Premium →</Text>
              </View>
            )}
          </TouchableOpacity>
        </SlideIn>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Actions Rapides</Text>
          <Text style={styles.sectionSubtitle}>Misala ya noki</Text>

          <View style={styles.actionsGrid}>
            <ActionCard
              icon="camera"
              label="Scanner"
              labelLingala="Zwa foto"
              onPress={() => navigation.navigate('Scanner')}
              primary
              delay={300}
            />
            <ActionCard
              icon="star"
              label="Premium"
              labelLingala="Mingi koleka"
              onPress={() => navigation.navigate('Subscription')}
              delay={350}
            />
            <ActionCard
              icon="settings"
              label="Paramètres"
              labelLingala="Kobongisa"
              onPress={() => navigation.navigate('Settings')}
              delay={400}
            />
            <ActionCard
              icon="help"
              label="Aide"
              labelLingala="Lisungi"
              onPress={() => {}}
              delay={450}
            />
            <ActionCard
              icon="user"
              label="Modifier Profil"
              labelLingala="Bongisa profil"
              onPress={() => {
                analyticsService.logCustomEvent('profile_update_started');
                navigation.navigate('UpdateProfile');
              }}
              delay={500}
            />
          </View>
        </View>

        {/* Progress Badges */}
        <SlideIn direction="up" delay={550}>
          <View style={styles.badgesSection}>
            <Text style={styles.sectionTitle}>Vos Badges</Text>
            <Text style={styles.sectionSubtitle}>Medailles na yo</Text>

            <View style={styles.badgesRow}>
              <View style={styles.badgeItem}>
                <View style={styles.badgeIconWrapper}>
                  <Icon name="check-circle" size="lg" color={Colors.status.success} variant="filled" />
                </View>
                <Text style={styles.badgeLabel}>Premier scan</Text>
                <View style={styles.badgeStatus}>
                  <Icon name="check" size="xs" color={Colors.status.success} />
                </View>
              </View>

              <View style={styles.badgeItem}>
                <View style={styles.badgeIconWrapper}>
                  <Icon name="dollar" size="lg" color={Colors.accent} />
                </View>
                <Text style={styles.badgeLabel}>10$ économisés</Text>
                <View style={styles.badgeStatus}>
                  <Icon name="check" size="xs" color={Colors.status.success} />
                </View>
              </View>

              <View style={[styles.badgeItem, styles.badgeLocked]}>
                <View style={[styles.badgeIconWrapper, styles.badgeIconLocked]}>
                  <Icon name="trophy" size="lg" color={Colors.text.tertiary} />
                </View>
                <Text style={styles.badgeLabelLocked}>100 factures</Text>
                <View style={styles.badgeStatusLocked}>
                  <Icon name="lock" size="xs" color={Colors.text.tertiary} />
                </View>
              </View>
            </View>
          </View>
        </SlideIn>

        {/* App Info */}
        <FadeIn delay={600}>
          <View style={styles.appInfo}>
            <Text style={styles.appInfoText}>GoShopper AI v1.0.0</Text>
            <Text style={styles.appInfoSubtext}>Fait avec ❤️ pour le Congo</Text>
          </View>
        </FadeIn>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },

  // Profile Header
  profileHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.md,
  },
  avatarContainer: {
    marginBottom: Spacing.md,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.lg,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.status.success,
    borderWidth: 3,
    borderColor: Colors.background.secondary,
  },
  welcomeText: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  welcomeSubtext: {
    fontSize: Typography.fontSize.lg,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.medium,
  },

  // Section Titles
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    marginBottom: Spacing.md,
    fontStyle: 'italic',
  },

  // Stats Section
  statsSection: {
    marginBottom: Spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.md,
  },
  statCardHighlight: {
    backgroundColor: Colors.primary,
  },
  statIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statIconWrapperHighlight: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  statValue: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  statValueHighlight: {
    color: Colors.white,
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  statLabelHighlight: {
    color: 'rgba(255,255,255,0.9)',
  },
  statLabelLingala: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    fontStyle: 'italic',
    marginTop: 2,
  },

  // Subscription Card
  subscriptionCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadows.md,
  },
  subscriptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subscriptionIcon: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.status.warningLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  subscriptionIconPremium: {
    backgroundColor: Colors.accent,
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionPlan: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  subscriptionStatus: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  subscriptionStatusLingala: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  upgradePrompt: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upgradeWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  upgradeText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.status.warning,
    fontWeight: Typography.fontWeight.semiBold,
  },
  upgradeButton: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.bold,
  },

  // Actions Section
  actionsSection: {
    marginBottom: Spacing.xl,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  actionCardWrapper: {
    width: '47%',
  },
  actionCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.sm,
  },
  actionCardPrimary: {
    backgroundColor: Colors.primary,
  },
  actionIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  actionIconWrapperPrimary: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  actionLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  actionLabelPrimary: {
    color: Colors.white,
  },
  actionLabelLingala: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
  },
  actionLabelLingalaPrimary: {
    color: 'rgba(255,255,255,0.7)',
  },

  // Badges Section
  badgesSection: {
    marginBottom: Spacing.xl,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  badgeItem: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.sm,
  },
  badgeLocked: {
    backgroundColor: Colors.background.tertiary,
    opacity: 0.7,
  },
  badgeIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  badgeIconLocked: {
    backgroundColor: Colors.border.light,
  },
  badgeLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  badgeLabelLocked: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  badgeStatus: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.status.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeStatusLocked: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.border.light,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // App Info
  appInfo: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  appInfoText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    marginBottom: Spacing.xs,
  },
  appInfoSubtext: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.status.error,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
