import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '@/shared/types';
import {useSubscription} from '@/shared/contexts/SubscriptionContext';
import {Icon, FadeIn, Button} from '@/shared/components';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from '@/shared/theme/theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function SubscriptionDetailsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const {
    subscription,
    isTrialActive,
    trialDaysRemaining,
    trialScansUsed,
    scansRemaining,
  } = useSubscription();

  const isPremium = subscription?.isSubscribed && subscription?.status === 'active' && subscription?.planId === 'premium';
  const isTrial = isTrialActive;
  const scansUsed = trialScansUsed;
  const scanLimit = subscription?.trialScansLimit || 50;

  // Format dates
  const formatDate = (date: Date | undefined) => {
    if (!date) return '-';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const getStatusColor = () => {
    if (isPremium) return Colors.status.success;
    if (isTrial) return Colors.card.blue;
    return Colors.text.tertiary;
  };

  const getStatusText = () => {
    if (isPremium) return 'Abonnement Premium Actif';
    if (isTrial) return `Essai Gratuit - ${trialDaysRemaining} jours restants`;
    return 'Aucun Abonnement';
  };

  const getStatusIcon = () => {
    if (isPremium) return 'check-circle';
    if (isTrial) return 'clock';
    return 'x-circle';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Modern Header */}
      <FadeIn>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}>
              <Icon name="arrow-left" size="sm" color={Colors.primary} />
            </TouchableOpacity>
            <View style={styles.headerLeft}>
              <View style={styles.titleRow}>
                <Icon name="zap" size="md" color={Colors.primary} />
                <Text style={styles.title}>Mon Abonnement</Text>
              </View>
              <Text style={styles.subtitle}>
                {isPremium
                  ? 'Premium actif'
                  : isTrial
                  ? `${trialDaysRemaining} jours restants`
                  : 'Aucun abonnement'}
              </Text>
            </View>
          </View>
        </View>
      </FadeIn>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={[styles.statusBadge, {backgroundColor: getStatusColor() + '15'}]}>
            <Icon name={getStatusIcon()} size="xl" color={getStatusColor()} />
          </View>
          <Text style={styles.statusTitle}>{getStatusText()}</Text>
          {!isPremium && !isTrial && (
            <Text style={styles.statusSubtitle}>
              Passez à Premium pour des scans illimités
            </Text>
          )}
          {isTrial && (
            <Text style={styles.statusSubtitle}>
              Profitez de votre période d'essai gratuite
            </Text>
          )}
        </View>

        {/* Scans Usage Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Icon name="camera" size="md" color={Colors.card.red} />
            <Text style={styles.infoTitle}>Utilisation des Scans</Text>
          </View>
          
          <View style={styles.scansProgress}>
            <View style={styles.scansNumbers}>
              <View style={styles.scansStat}>
                <Text style={styles.scansValue}>{scansUsed || 0}</Text>
                <Text style={styles.scansLabel}>Utilisés</Text>
              </View>
              <View style={styles.scansDivider} />
              <View style={styles.scansStat}>
                <Text style={[styles.scansValue, {color: Colors.card.blue}]}>
                  {scansRemaining === -1 ? '∞' : (scansRemaining || 0)}
                </Text>
                <Text style={styles.scansLabel}>Restants</Text>
              </View>
            </View>

            {scansRemaining !== -1 && (
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${Math.min(100, (scansUsed / scanLimit) * 100).toFixed(0)}%` as any,
                    },
                  ]}
                />
              </View>
            )}
          </View>

          {scansRemaining !== -1 && scansRemaining <= 5 && (
            <View style={styles.warningBox}>
              <Icon name="alert-circle" size="sm" color={Colors.card.red} />
              <Text style={styles.warningText}>
                Il vous reste {scansRemaining} scan{scansRemaining !== 1 ? 's' : ''}. Passez à Premium pour des scans illimités !
              </Text>
            </View>
          )}
        </View>

        {/* Subscription Details Card */}
        {(isTrial || isPremium) && (
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Icon name="calendar" size="md" color={Colors.card.red} />
              <Text style={styles.infoTitle}>Détails de l'Abonnement</Text>
            </View>

            <View style={styles.detailsList}>
              {isTrial && (
                <>
                  <View style={styles.detailRow}>
                    <View style={styles.detailLeft}>
                      <Icon name="play-circle" size="sm" color={Colors.text.tertiary} />
                      <Text style={styles.detailLabel}>Date de début</Text>
                    </View>
                    <Text style={styles.detailValue}>
                      {formatDate(subscription?.trialStartDate)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <View style={styles.detailLeft}>
                      <Icon name="clock" size="sm" color={Colors.text.tertiary} />
                      <Text style={styles.detailLabel}>Expire le</Text>
                    </View>
                    <Text style={[styles.detailValue, {color: Colors.card.red, fontFamily: Typography.fontFamily.bold}]}>
                      {formatDate(subscription?.trialEndDate)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <View style={styles.detailLeft}>
                      <Icon name="zap" size="sm" color={Colors.text.tertiary} />
                      <Text style={styles.detailLabel}>Type</Text>
                    </View>
                    <Text style={styles.detailValue}>Essai gratuit</Text>
                  </View>
                </>
              )}

              {isPremium && (
                <>
                  <View style={styles.detailRow}>
                    <View style={styles.detailLeft}>
                      <Icon name="shopping-bag" size="sm" color={Colors.text.tertiary} />
                      <Text style={styles.detailLabel}>Date d'achat</Text>
                    </View>
                    <Text style={styles.detailValue}>
                      {formatDate(subscription?.lastPaymentDate || subscription?.subscriptionStartDate)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <View style={styles.detailLeft}>
                      <Icon name="play-circle" size="sm" color={Colors.text.tertiary} />
                      <Text style={styles.detailLabel}>Date de début</Text>
                    </View>
                    <Text style={styles.detailValue}>
                      {formatDate(subscription?.subscriptionStartDate)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <View style={styles.detailLeft}>
                      <Icon name="calendar" size="sm" color={Colors.text.tertiary} />
                      <Text style={styles.detailLabel}>Renouvellement</Text>
                    </View>
                    <Text style={[styles.detailValue, {color: Colors.card.blue, fontFamily: Typography.fontFamily.bold}]}>
                      {formatDate(subscription?.subscriptionEndDate)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <View style={styles.detailLeft}>
                      <Icon name="zap" size="sm" color={Colors.text.tertiary} />
                      <Text style={styles.detailLabel}>Type</Text>
                    </View>
                    <Text style={styles.detailValue}>Premium - {subscription?.durationMonths} mois</Text>
                  </View>
                  {subscription?.lastPaymentAmount && (
                    <View style={styles.detailRow}>
                      <View style={styles.detailLeft}>
                        <Icon name="dollar-sign" size="sm" color={Colors.text.tertiary} />
                        <Text style={styles.detailLabel}>Montant payé</Text>
                      </View>
                      <Text style={styles.detailValue}>
                        {subscription.lastPaymentAmount} {subscription.currency || 'USD'}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>
          </View>
        )}

        {/* Features Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Icon name="star" size="md" color={Colors.card.red} />
            <Text style={styles.infoTitle}>
              {isPremium ? 'Vos Avantages Premium' : 'Avantages Premium'}
            </Text>
          </View>

          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Icon
                name="check-circle"
                size="sm"
                color={isPremium ? Colors.status.success : Colors.text.tertiary}
              />
              <Text style={styles.featureText}>Scans illimités</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon
                name="check-circle"
                size="sm"
                color={isPremium ? Colors.status.success : Colors.text.tertiary}
              />
              <Text style={styles.featureText}>Comparaison de prix en temps réel</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon
                name="check-circle"
                size="sm"
                color={isPremium ? Colors.status.success : Colors.text.tertiary}
              />
              <Text style={styles.featureText}>Assistant IA personnalisé</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon
                name="check-circle"
                size="sm"
                color={isPremium ? Colors.status.success : Colors.text.tertiary}
              />
              <Text style={styles.featureText}>Alertes de prix personnalisées</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon
                name="check-circle"
                size="sm"
                color={isPremium ? Colors.status.success : Colors.text.tertiary}
              />
              <Text style={styles.featureText}>Statistiques avancées</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon
                name="check-circle"
                size="sm"
                color={isPremium ? Colors.status.success : Colors.text.tertiary}
              />
              <Text style={styles.featureText}>Support prioritaire</Text>
            </View>
          </View>
        </View>

        {/* Action Button */}
        <Button
          title="Voir plus d'abonnements"
          onPress={() => navigation.push('Subscription')}
          variant="primary"
          icon={<Icon name="zap" size="sm" color={Colors.white} />}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },

  // Header Styles
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    ...Shadows.sm,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.card.blue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  headerLeft: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.tertiary,
    marginLeft: 36, // Align with title after icon
  },

  // Status Card
  statusCard: {
    backgroundColor: Colors.card.cream,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  statusBadge: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  statusTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  statusSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.secondary,
    textAlign: 'center',
  },

  // Details List
  detailsList: {
    gap: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  detailLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.secondary,
  },
  detailValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.text.primary,
  },

  // Info Card
  infoCard: {
    backgroundColor: Colors.card.cream,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  infoTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.text.primary,
  },
  scansProgress: {
    gap: Spacing.md,
  },
  scansNumbers: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  scansStat: {
    alignItems: 'center',
    flex: 1,
  },
  scansValue: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.card.red,
  },
  scansLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
  },
  scansDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border.light,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.card.red,
    borderRadius: BorderRadius.full,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card.yellow,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  warningText: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.primary,
  },
  featuresList: {
    gap: Spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  featureText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.primary,
  },
});

export default SubscriptionDetailsScreen;
