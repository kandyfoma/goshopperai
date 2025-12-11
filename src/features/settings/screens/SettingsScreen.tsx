// Settings Screen - App settings and profile
// Styled with GoShopperAI Design System (Blue + Gold)
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useAuth, useUser, useSubscription, useTheme} from '@/shared/contexts';
import {RootStackParamList} from '@/shared/types';
import {Colors, Typography, Spacing, BorderRadius, Shadows} from '@/shared/theme/theme';
import {Icon, FadeIn, SlideIn} from '@/shared/components';
import {SUBSCRIPTION_PLANS, TRIAL_SCAN_LIMIT} from '@/shared/utils/constants';
import {formatDate} from '@/shared/utils/helpers';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface SettingItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showArrow?: boolean;
  danger?: boolean;
}

function SettingItem({
  icon,
  title,
  subtitle,
  onPress,
  rightElement,
  showArrow = true,
  danger = false,
}: SettingItemProps) {
  return (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}>
      <View style={[styles.settingIconWrapper, danger && styles.settingIconWrapperDanger]}>
        <Icon name={icon} size="sm" color={danger ? Colors.status.error : Colors.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text
          style={[styles.settingTitle, danger && styles.settingTitleDanger]}>
          {title}
        </Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement}
      {showArrow && onPress && <Icon name="chevron-right" size="sm" color={Colors.text.tertiary} />}
    </TouchableOpacity>
  );
}

function SettingSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

export function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const {user, signOut} = useAuth();
  const {profile, toggleNotifications, togglePriceAlerts} = useUser();
  const {subscription, trialScansUsed} = useSubscription();
  const {isDarkMode, toggleTheme} = useTheme();

  // Use profile settings or defaults
  const notificationsEnabled = profile?.notificationsEnabled ?? true;
  const priceAlertsEnabled = profile?.priceAlertsEnabled ?? true;

  const currentPlan = subscription?.planId
    ? SUBSCRIPTION_PLANS[subscription.planId]
    : SUBSCRIPTION_PLANS.free;

  const trialRemaining = Math.max(0, TRIAL_SCAN_LIMIT - trialScansUsed);

  const handleToggleNotifications = async (value: boolean) => {
    try {
      await toggleNotifications(value);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de modifier les notifications');
    }
  };

  const handleTogglePriceAlerts = async (value: boolean) => {
    try {
      await togglePriceAlerts(value);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de modifier les alertes de prix');
    }
  };

  const handleSignOut = () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      {text: 'Annuler', style: 'cancel'},
      {
        text: 'Déconnecter',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  const handleDeleteData = () => {
    Alert.alert(
      'Supprimer mes données',
      'Cette action supprimera définitivement toutes vos factures et données. Cette action est irréversible.',
      [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement data deletion
            Alert.alert(
              'Données supprimées',
              'Toutes vos données ont été supprimées.',
            );
          },
        },
      ],
    );
  };

  const handleContactSupport = () => {
    Linking.openURL(
      'mailto:support@goshopperai.com?subject=Support Prix Tracker',
    );
  };

  const handleRateApp = () => {
    // TODO: Link to app store
    Alert.alert('Merci !', 'Votre avis nous aide beaucoup !');
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://goshopperai.com/privacy');
  };

  const handleTermsOfService = () => {
    Linking.openURL('https://goshopperai.com/terms');
  };

  return (
    <SafeAreaView style={styles.container}>
      <FadeIn>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Paramètres</Text>
          <Text style={styles.headerSubtitle}>Gérez votre compte</Text>
        </View>
      </FadeIn>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <SlideIn delay={100}>
          <View style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              <Icon name="user" size="lg" color={Colors.primary} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {user?.displayName || 'Utilisateur'}
              </Text>
              <Text style={styles.profileId}>ID: {user?.id?.slice(0, 8)}...</Text>
            </View>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => navigation.navigate('Profile' as any)}>
              <Icon name="edit" size="sm" color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </SlideIn>

        {/* Subscription Card */}
        <SlideIn delay={200}>
          <TouchableOpacity
            style={styles.subscriptionCard}
            onPress={() => navigation.navigate('Subscription')}
            activeOpacity={0.9}>
            <View style={styles.subscriptionGlow} />
            <View style={styles.subscriptionHeader}>
              <View style={styles.subscriptionBadge}>
                <Icon name="crown" size="xs" color={Colors.accent} />
                <Text style={styles.subscriptionBadgeText}>
                  {currentPlan.name}
                </Text>
              </View>
              <Icon name="chevron-right" size="sm" color="rgba(255,255,255,0.8)" />
            </View>

            {subscription?.planId === 'free' ? (
              <View style={styles.trialProgress}>
                <Text style={styles.trialText}>
                  Essai: {trialRemaining}/{TRIAL_SCAN_LIMIT} scans restants
                </Text>
                <View style={styles.trialBar}>
                  <View
                    style={[
                      styles.trialBarFill,
                      {width: `${(trialRemaining / TRIAL_SCAN_LIMIT) * 100}%`},
                    ]}
                  />
                </View>
              </View>
            ) : (
              <Text style={styles.subscriptionExpiry}>
                Expire le:{' '}
                {subscription?.expiryDate
                  ? formatDate(subscription.expiryDate)
                  : 'Illimité'}
              </Text>
            )}

            <View style={styles.upgradeButton}>
              <Text style={styles.upgradeText}>
                {subscription?.planId === 'premium'
                  ? 'Gérer mon abonnement'
                  : 'Passer à Premium'}
              </Text>
              <Icon name="arrow-right" size="xs" color={Colors.accent} />
            </View>
          </TouchableOpacity>
        </SlideIn>

        {/* Settings Sections */}
        <SlideIn delay={300}>
          <SettingSection title="Préférences">
            <SettingItem
              icon="moon"
              title="Mode sombre"
              subtitle={isDarkMode ? 'Activé' : 'Désactivé'}
              showArrow={false}
              rightElement={
                <Switch
                  value={isDarkMode}
                  onValueChange={toggleTheme}
                  trackColor={{
                    false: Colors.border.light,
                    true: Colors.primaryLight,
                  }}
                  thumbColor={isDarkMode ? Colors.primary : '#ffffff'}
                />
              }
            />
            <SettingItem
              icon="bell"
              title="Notifications"
              subtitle={notificationsEnabled ? 'Activées' : 'Désactivées'}
              showArrow={false}
              rightElement={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleToggleNotifications}
                  trackColor={{
                    false: Colors.border.light,
                    true: Colors.primaryLight,
                  }}
                  thumbColor={
                    notificationsEnabled ? Colors.primary : '#ffffff'
                  }
                />
              }
            />
            <SettingItem
              icon="trending-up"
              title="Alertes de prix"
              subtitle="Gérer vos alertes de prix"
              showArrow={true}
              onPress={() => navigation.navigate('PriceAlerts')}
            />
          </SettingSection>
        </SlideIn>

        <SlideIn delay={400}>
          <SettingSection title="Support">
            <SettingItem
              icon="message"
              title="Contacter le support"
              subtitle="support@goshopperai.com"
              onPress={handleContactSupport}
            />
            <SettingItem
              icon="star"
              title="Noter l'application"
              subtitle="Donnez-nous 5 étoiles !"
              onPress={handleRateApp}
            />
            <SettingItem
              icon="help"
              title="FAQ"
              subtitle="Questions fréquentes"
              onPress={() => Linking.openURL('https://goshopperai.com/faq')}
            />
          </SettingSection>
        </SlideIn>

        <SlideIn delay={500}>
          <SettingSection title="Légal">
            <SettingItem
              icon="lock"
              title="Politique de confidentialité"
              onPress={handlePrivacyPolicy}
            />
            <SettingItem
              icon="document"
              title="Conditions d'utilisation"
              onPress={handleTermsOfService}
            />
          </SettingSection>
        </SlideIn>

        <SlideIn delay={600}>
          <SettingSection title="Compte">
            <SettingItem
              icon="trash"
              title="Supprimer mes données"
              subtitle="Supprimer toutes les factures et données"
              onPress={handleDeleteData}
              danger
            />
            <SettingItem
              icon="logout"
              title="Déconnexion"
              onPress={handleSignOut}
              danger
            />
          </SettingSection>
        </SlideIn>

        {/* App Info */}
        <FadeIn delay={700}>
          <View style={styles.appInfo}>
            <View style={styles.appLogoContainer}>
              <Icon name="receipt" size="md" color={Colors.primary} />
            </View>
            <Text style={styles.appName}>GoShopperAI</Text>
            <Text style={styles.appVersion}>Version 1.0.0</Text>
            <Text style={styles.appCopyright}>
              © 2024 GoShopperAI. Tous droits réservés.
            </Text>
          </View>
        </FadeIn>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  profileId: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscriptionCard: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  subscriptionGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: Colors.accent,
    opacity: 0.15,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  subscriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  subscriptionBadgeText: {
    color: '#ffffff',
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  trialProgress: {
    marginBottom: Spacing.md,
  },
  trialText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.sm,
  },
  trialBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  trialBarFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.full,
  },
  subscriptionExpiry: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.sm,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  upgradeText: {
    color: Colors.accent,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  sectionContent: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  settingIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  settingIconWrapperDanger: {
    backgroundColor: `${Colors.status.error}15`,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
  },
  settingTitleDanger: {
    color: Colors.status.error,
  },
  settingSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  appInfo: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  appLogoContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  appName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  appVersion: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    marginBottom: Spacing.sm,
  },
  appCopyright: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
  },
});
