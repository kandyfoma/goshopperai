// Settings Screen - App settings and profile
import React, {useState} from 'react';
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
import {useAuth, useSubscription, useTheme} from '@/shared/contexts';
import {RootStackParamList} from '@/shared/types';
import {COLORS, SUBSCRIPTION_PLANS, TRIAL_SCAN_LIMIT} from '@/shared/utils/constants';
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
      <Text style={styles.settingIcon}>{icon}</Text>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, danger && styles.settingTitleDanger]}>
          {title}
        </Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement}
      {showArrow && onPress && (
        <Text style={styles.settingArrow}>›</Text>
      )}
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
  const {subscription, trialScansUsed} = useSubscription();
  const {isDarkMode, toggleTheme} = useTheme();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [priceAlertsEnabled, setPriceAlertsEnabled] = useState(true);

  const currentPlan = subscription?.planId 
    ? SUBSCRIPTION_PLANS[subscription.planId] 
    : SUBSCRIPTION_PLANS.free;

  const trialRemaining = Math.max(0, TRIAL_SCAN_LIMIT - trialScansUsed);

  const handleSignOut = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Déconnecter',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
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
            Alert.alert('Données supprimées', 'Toutes vos données ont été supprimées.');
          },
        },
      ]
    );
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@goshopperai.com?subject=Support Prix Tracker');
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
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>👤</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {user?.displayName || 'Utilisateur'}
            </Text>
            <Text style={styles.profileId}>
              ID: {user?.id?.slice(0, 8)}...
            </Text>
          </View>
        </View>

        {/* Subscription Card */}
        <TouchableOpacity
          style={styles.subscriptionCard}
          onPress={() => navigation.navigate('Subscription')}
          activeOpacity={0.9}>
          <View style={styles.subscriptionHeader}>
            <View style={styles.subscriptionBadge}>
              <Text style={styles.subscriptionBadgeText}>{currentPlan.name}</Text>
            </View>
            <Text style={styles.subscriptionArrow}>›</Text>
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
                    {width: `${(trialRemaining / TRIAL_SCAN_LIMIT) * 100}%`}
                  ]} 
                />
              </View>
            </View>
          ) : (
            <Text style={styles.subscriptionExpiry}>
              Expire le: {subscription?.expiryDate 
                ? formatDate(subscription.expiryDate) 
                : 'Illimité'}
            </Text>
          )}
          
          <Text style={styles.upgradeText}>
            {subscription?.planId === 'premium' 
              ? 'Gérer mon abonnement' 
              : 'Passer à Premium →'}
          </Text>
        </TouchableOpacity>

        {/* Settings Sections */}
        <SettingSection title="Préférences">
          <SettingItem
            icon="🌙"
            title="Mode sombre"
            subtitle={isDarkMode ? 'Activé' : 'Désactivé'}
            showArrow={false}
            rightElement={
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{false: COLORS.gray[200], true: COLORS.primary[300]}}
                thumbColor={isDarkMode ? COLORS.primary[500] : '#ffffff'}
              />
            }
          />
          <SettingItem
            icon="🔔"
            title="Notifications"
            subtitle={notificationsEnabled ? 'Activées' : 'Désactivées'}
            showArrow={false}
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{false: COLORS.gray[200], true: COLORS.primary[300]}}
                thumbColor={notificationsEnabled ? COLORS.primary[500] : '#ffffff'}
              />
            }
          />
          <SettingItem
            icon="📊"
            title="Alertes de prix"
            subtitle="Recevez des alertes quand les prix baissent"
            showArrow={false}
            rightElement={
              <Switch
                value={priceAlertsEnabled}
                onValueChange={setPriceAlertsEnabled}
                trackColor={{false: COLORS.gray[200], true: COLORS.primary[300]}}
                thumbColor={priceAlertsEnabled ? COLORS.primary[500] : '#ffffff'}
              />
            }
          />
        </SettingSection>

        <SettingSection title="Support">
          <SettingItem
            icon="💬"
            title="Contacter le support"
            subtitle="support@goshopperai.com"
            onPress={handleContactSupport}
          />
          <SettingItem
            icon="⭐"
            title="Noter l'application"
            subtitle="Donnez-nous 5 étoiles !"
            onPress={handleRateApp}
          />
          <SettingItem
            icon="📖"
            title="FAQ"
            subtitle="Questions fréquentes"
            onPress={() => Linking.openURL('https://goshopperai.com/faq')}
          />
        </SettingSection>

        <SettingSection title="Légal">
          <SettingItem
            icon="🔒"
            title="Politique de confidentialité"
            onPress={handlePrivacyPolicy}
          />
          <SettingItem
            icon="📄"
            title="Conditions d'utilisation"
            onPress={handleTermsOfService}
          />
        </SettingSection>

        <SettingSection title="Compte">
          <SettingItem
            icon="🗑️"
            title="Supprimer mes données"
            subtitle="Supprimer toutes les factures et données"
            onPress={handleDeleteData}
            danger
          />
          <SettingItem
            icon="🚪"
            title="Déconnexion"
            onPress={handleSignOut}
            danger
          />
        </SettingSection>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>Prix Tracker</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appCopyright}>
            © 2024 GoShopperAI. Tous droits réservés.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  profileAvatarText: {
    fontSize: 28,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.gray[900],
    marginBottom: 2,
  },
  profileId: {
    fontSize: 13,
    color: COLORS.gray[500],
  },
  subscriptionCard: {
    backgroundColor: COLORS.primary[500],
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subscriptionBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  subscriptionBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  subscriptionArrow: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '300',
  },
  trialProgress: {
    marginBottom: 12,
  },
  trialText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginBottom: 8,
  },
  trialBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  trialBarFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 3,
  },
  subscriptionExpiry: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginBottom: 8,
  },
  upgradeText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionContent: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  settingIcon: {
    fontSize: 22,
    marginRight: 14,
    width: 28,
    textAlign: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.gray[900],
  },
  settingTitleDanger: {
    color: COLORS.error,
  },
  settingSubtitle: {
    fontSize: 13,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  settingArrow: {
    fontSize: 20,
    color: COLORS.gray[400],
    fontWeight: '300',
  },
  appInfo: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 13,
    color: COLORS.gray[400],
    marginBottom: 8,
  },
  appCopyright: {
    fontSize: 12,
    color: COLORS.gray[400],
  },
});
