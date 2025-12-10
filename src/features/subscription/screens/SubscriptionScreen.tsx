// Subscription Screen - Paywall with Moko Afrika integration
import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useSubscription} from '@/shared/contexts';
import {COLORS, SUBSCRIPTION_PLANS, TRIAL_SCAN_LIMIT} from '@/shared/utils/constants';
import {formatCurrency} from '@/shared/utils/helpers';

type PaymentMethod = 'mpesa' | 'orange' | 'airtel' | 'afrimoney';
type PlanId = 'free' | 'basic' | 'premium';

interface PaymentOption {
  id: PaymentMethod;
  name: string;
  icon: string;
  color: string;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  {id: 'mpesa', name: 'M-Pesa', icon: '📱', color: '#4CAF50'},
  {id: 'orange', name: 'Orange Money', icon: '🟠', color: '#FF6600'},
  {id: 'airtel', name: 'Airtel Money', icon: '🔴', color: '#ED1C24'},
  {id: 'afrimoney', name: 'AfriMoney', icon: '💰', color: '#FFB300'},
];

export function SubscriptionScreen() {
  const navigation = useNavigation();
  const {subscription, trialScansUsed} = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<PlanId>('basic');
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const isCurrentPlan = (planId: PlanId) => subscription?.planId === planId;
  const trialRemaining = Math.max(0, TRIAL_SCAN_LIMIT - trialScansUsed);

  const handleSubscribe = async () => {
    if (!selectedPayment) {
      Alert.alert('Méthode de paiement', 'Veuillez sélectionner une méthode de paiement');
      return;
    }

    const plan = SUBSCRIPTION_PLANS[selectedPlan];
    
    Alert.alert(
      'Confirmer l\'abonnement',
      `Vous allez souscrire à ${plan.name} pour ${formatCurrency(plan.price)}/mois via ${PAYMENT_OPTIONS.find(p => p.id === selectedPayment)?.name}`,
      [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Confirmer',
          onPress: async () => {
            setIsProcessing(true);
            
            // TODO: Call Moko Afrika API via Cloud Functions
            // const result = await functions().httpsCallable('initiateMokoPayment')({
            //   planId: selectedPlan,
            //   paymentMethod: selectedPayment,
            //   amount: plan.price,
            //   currency: 'USD',
            // });

            // Simulate payment processing
            setTimeout(() => {
              setIsProcessing(false);
              Alert.alert(
                'Paiement initié',
                'Veuillez confirmer le paiement sur votre téléphone',
                [{text: 'OK', onPress: () => navigation.goBack()}]
              );
            }, 2000);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Prix Tracker Pro</Text>
          <Text style={styles.headerSubtitle}>
            Économisez plus avec les fonctionnalités premium
          </Text>
        </View>

        {/* Trial Status */}
        {(!subscription || subscription.planId === 'free') && (
          <View style={styles.trialCard}>
            <Text style={styles.trialIcon}>🎁</Text>
            <View style={styles.trialInfo}>
              <Text style={styles.trialTitle}>Période d'essai</Text>
              <Text style={styles.trialDesc}>
                {trialRemaining > 0 
                  ? `${trialRemaining} scans gratuits restants`
                  : 'Période d\'essai terminée'}
              </Text>
            </View>
            <View style={styles.trialBadge}>
              <Text style={styles.trialBadgeText}>{trialRemaining}/{TRIAL_SCAN_LIMIT}</Text>
            </View>
          </View>
        )}

        {/* Plans */}
        <Text style={styles.sectionTitle}>Choisir un plan</Text>
        
        {Object.entries(SUBSCRIPTION_PLANS).map(([id, plan]) => {
          const planId = id as PlanId;
          const isSelected = selectedPlan === planId;
          const isCurrent = isCurrentPlan(planId);
          const isPremium = planId === 'premium';
          
          return (
            <TouchableOpacity
              key={planId}
              style={[
                styles.planCard,
                isSelected && styles.planCardSelected,
                isCurrent && styles.planCardCurrent,
              ]}
              onPress={() => !isCurrent && setSelectedPlan(planId)}
              disabled={isCurrent}
              activeOpacity={0.8}>
              
              {isPremium && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>POPULAIRE</Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <View>
                  <Text style={[
                    styles.planName,
                    isSelected && styles.planNameSelected
                  ]}>
                    {plan.name}
                  </Text>
                  <View style={styles.planPrice}>
                    <Text style={[
                      styles.priceAmount,
                      isSelected && styles.priceAmountSelected
                    ]}>
                      {plan.price > 0 ? formatCurrency(plan.price) : 'Gratuit'}
                    </Text>
                    {plan.price > 0 && (
                      <Text style={styles.pricePeriod}>/mois</Text>
                    )}
                  </View>
                </View>
                
                <View style={[
                  styles.radioOuter,
                  isSelected && styles.radioOuterSelected
                ]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </View>

              <View style={styles.planFeatures}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Text style={styles.featureCheck}>✓</Text>
                    <Text style={[
                      styles.featureText,
                      isSelected && styles.featureTextSelected
                    ]}>
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>

              {isCurrent && (
                <View style={styles.currentPlanBadge}>
                  <Text style={styles.currentPlanText}>Plan actuel</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Payment Methods */}
        {selectedPlan !== 'free' && (
          <>
            <Text style={styles.sectionTitle}>Méthode de paiement</Text>
            <Text style={styles.paymentSubtitle}>
              Paiement sécurisé via Moko Afrika
            </Text>

            <View style={styles.paymentGrid}>
              {PAYMENT_OPTIONS.map(option => {
                const isSelected = selectedPayment === option.id;
                
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.paymentOption,
                      isSelected && styles.paymentOptionSelected,
                    ]}
                    onPress={() => setSelectedPayment(option.id)}
                    activeOpacity={0.8}>
                    <Text style={styles.paymentIcon}>{option.icon}</Text>
                    <Text style={[
                      styles.paymentName,
                      isSelected && styles.paymentNameSelected
                    ]}>
                      {option.name}
                    </Text>
                    {isSelected && (
                      <View style={styles.paymentCheck}>
                        <Text style={styles.paymentCheckText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* Subscribe Button */}
        {selectedPlan !== 'free' && !isCurrentPlan(selectedPlan) && (
          <TouchableOpacity
            style={[
              styles.subscribeButton,
              (!selectedPayment || isProcessing) && styles.subscribeButtonDisabled
            ]}
            onPress={handleSubscribe}
            disabled={!selectedPayment || isProcessing}>
            {isProcessing ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.subscribeButtonText}>
                S'abonner à {SUBSCRIPTION_PLANS[selectedPlan].name}
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* Terms */}
        <Text style={styles.terms}>
          En vous abonnant, vous acceptez nos Conditions d'utilisation et notre 
          Politique de confidentialité. L'abonnement se renouvelle automatiquement 
          chaque mois jusqu'à annulation.
        </Text>
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
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 15,
    color: COLORS.gray[500],
    textAlign: 'center',
  },
  trialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary[50],
    borderRadius: 14,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.primary[100],
  },
  trialIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  trialInfo: {
    flex: 1,
  },
  trialTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary[700],
  },
  trialDesc: {
    fontSize: 13,
    color: COLORS.primary[600],
  },
  trialBadge: {
    backgroundColor: COLORS.primary[500],
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  trialBadgeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.gray[900],
    marginBottom: 12,
  },
  planCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    overflow: 'hidden',
  },
  planCardSelected: {
    borderColor: COLORS.primary[500],
    backgroundColor: COLORS.primary[50],
  },
  planCardCurrent: {
    borderColor: COLORS.gray[300],
    opacity: 0.8,
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.primary[500],
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderBottomLeftRadius: 12,
  },
  popularText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.gray[900],
    marginBottom: 2,
  },
  planNameSelected: {
    color: COLORS.primary[700],
  },
  planPrice: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  priceAmountSelected: {
    color: COLORS.primary[600],
  },
  pricePeriod: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginLeft: 2,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: COLORS.primary[500],
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary[500],
  },
  planFeatures: {
    gap: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureCheck: {
    fontSize: 14,
    color: COLORS.primary[500],
    marginRight: 8,
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  featureTextSelected: {
    color: COLORS.primary[700],
  },
  currentPlanBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: COLORS.gray[200],
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  currentPlanText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray[600],
  },
  paymentSubtitle: {
    fontSize: 13,
    color: COLORS.gray[500],
    marginTop: -8,
    marginBottom: 12,
  },
  paymentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 24,
  },
  paymentOption: {
    width: '48%',
    marginHorizontal: '1%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  paymentOptionSelected: {
    borderColor: COLORS.primary[500],
    backgroundColor: COLORS.primary[50],
  },
  paymentIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  paymentName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  paymentNameSelected: {
    color: COLORS.primary[700],
  },
  paymentCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentCheckText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  subscribeButton: {
    backgroundColor: COLORS.primary[500],
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  subscribeButtonDisabled: {
    backgroundColor: COLORS.gray[300],
  },
  subscribeButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  terms: {
    fontSize: 11,
    color: COLORS.gray[400],
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 16,
  },
});
