// Profile Screen - User profile and settings access
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useAuth, useSubscription} from '@/shared/contexts';
import {RootStackParamList} from '@/shared/types';
import {COLORS, SUBSCRIPTION_PLANS, TRIAL_SCAN_LIMIT} from '@/shared/utils/constants';
import {formatCurrency, formatDate} from '@/shared/utils/helpers';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const {user} = useAuth();
  const {subscription, trialScansUsed} = useSubscription();

  const currentPlan = subscription?.planId 
    ? SUBSCRIPTION_PLANS[subscription.planId] 
    : SUBSCRIPTION_PLANS.free;

  const trialRemaining = Math.max(0, TRIAL_SCAN_LIMIT - trialScansUsed);
  const isFreeTier = !subscription || subscription.planId === 'free';

  // Mock stats - in real app, fetch from Firestore
  const stats = {
    totalReceipts: 15,
    totalSavings: 45.80,
    joinDate: new Date(2024, 10, 1),
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.displayName?.[0]?.toUpperCase() || '👤'}
              </Text>
            </View>
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>
                {currentPlan.name.charAt(0)}
              </Text>
            </View>
          </View>
          <Text style={styles.userName}>
            {user?.displayName || 'Utilisateur'}
          </Text>
          <Text style={styles.memberSince}>
            Membre depuis {formatDate(stats.joinDate)}
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalReceipts}</Text>
            <Text style={styles.statLabel}>Factures</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {formatCurrency(stats.totalSavings)}
            </Text>
            <Text style={styles.statLabel}>Économisés</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {isFreeTier ? trialRemaining : '∞'}
            </Text>
            <Text style={styles.statLabel}>
              {isFreeTier ? 'Essais' : 'Scans'}
            </Text>
          </View>
        </View>

        {/* Subscription Card */}
        <TouchableOpacity
          style={styles.subscriptionCard}
          onPress={() => navigation.navigate('Subscription')}
          activeOpacity={0.9}>
          <View style={styles.subscriptionTop}>
            <View>
              <Text style={styles.subscriptionPlan}>{currentPlan.name}</Text>
              {isFreeTier ? (
                <Text style={styles.subscriptionStatus}>
                  {trialRemaining}/{TRIAL_SCAN_LIMIT} scans d'essai
                </Text>
              ) : (
                <Text style={styles.subscriptionStatus}>
                  Expire: {subscription?.expiryDate 
                    ? formatDate(subscription.expiryDate)
                    : 'Jamais'}
                </Text>
              )}
            </View>
            <Text style={styles.subscriptionArrow}>→</Text>
          </View>
          
          {isFreeTier && (
            <View style={styles.upgradePrompt}>
              <Text style={styles.upgradeText}>
                🚀 Passez à Premium pour des scans illimités
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Raccourcis</Text>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Scanner')}
              activeOpacity={0.8}>
              <Text style={styles.actionIcon}>📸</Text>
              <Text style={styles.actionLabel}>Scanner</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Settings')}
              activeOpacity={0.8}>
              <Text style={styles.actionIcon}>⚙️</Text>
              <Text style={styles.actionLabel}>Paramètres</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Subscription')}
              activeOpacity={0.8}>
              <Text style={styles.actionIcon}>⭐</Text>
              <Text style={styles.actionLabel}>Premium</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => {/* Navigate to help */}}
              activeOpacity={0.8}>
              <Text style={styles.actionIcon}>❓</Text>
              <Text style={styles.actionLabel}>Aide</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Réalisations</Text>
          
          <View style={styles.achievementsCard}>
            <View style={styles.achievement}>
              <Text style={styles.achievementIcon}>🎯</Text>
              <View style={styles.achievementInfo}>
                <Text style={styles.achievementTitle}>Premier scan</Text>
                <Text style={styles.achievementDesc}>
                  Vous avez scanné votre première facture !
                </Text>
              </View>
              <Text style={styles.achievementBadge}>✓</Text>
            </View>
            
            <View style={styles.achievement}>
              <Text style={styles.achievementIcon}>💰</Text>
              <View style={styles.achievementInfo}>
                <Text style={styles.achievementTitle}>Économiste</Text>
                <Text style={styles.achievementDesc}>
                  Économisez plus de $50 grâce aux comparaisons
                </Text>
              </View>
              <View style={styles.achievementProgress}>
                <View style={[styles.achievementProgressBar, {width: '91%'}]} />
              </View>
            </View>
            
            <View style={[styles.achievement, styles.achievementLocked]}>
              <Text style={styles.achievementIcon}>🏆</Text>
              <View style={styles.achievementInfo}>
                <Text style={styles.achievementTitleLocked}>Pro shopper</Text>
                <Text style={styles.achievementDescLocked}>
                  Scannez 100 factures
                </Text>
              </View>
              <Text style={styles.achievementLockIcon}>🔒</Text>
            </View>
          </View>
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
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 8,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 14,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.primary[500],
  },
  avatarText: {
    fontSize: 40,
    color: COLORS.primary[600],
    fontWeight: '700',
  },
  premiumBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#f9fafb',
  },
  premiumBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  subscriptionCard: {
    backgroundColor: COLORS.primary[500],
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
  },
  subscriptionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subscriptionPlan: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  subscriptionStatus: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  subscriptionArrow: {
    fontSize: 24,
    color: '#ffffff',
  },
  upgradePrompt: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  upgradeText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.gray[900],
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  actionCard: {
    width: '23%',
    marginHorizontal: '1%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  actionIcon: {
    fontSize: 26,
    marginBottom: 6,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.gray[700],
    textAlign: 'center',
  },
  achievementsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  achievement: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  achievementLocked: {
    opacity: 0.6,
  },
  achievementIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 2,
  },
  achievementTitleLocked: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray[500],
    marginBottom: 2,
  },
  achievementDesc: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  achievementDescLocked: {
    fontSize: 12,
    color: COLORS.gray[400],
  },
  achievementBadge: {
    fontSize: 20,
    color: COLORS.primary[500],
  },
  achievementProgress: {
    width: 60,
    height: 6,
    backgroundColor: COLORS.gray[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  achievementProgressBar: {
    height: '100%',
    backgroundColor: COLORS.primary[500],
    borderRadius: 3,
  },
  achievementLockIcon: {
    fontSize: 16,
    color: COLORS.gray[400],
  },
});
