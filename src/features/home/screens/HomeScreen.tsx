// Home Screen - Main landing page with scan CTA
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '@/shared/types';
import {useSubscription} from '@/shared/contexts';
import {COLORS, APP_NAME} from '@/shared/utils/constants';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const {canScan, scansRemaining, subscription} = useSubscription();

  const handleScanPress = () => {
    if (canScan) {
      navigation.navigate('Scanner');
    } else {
      navigation.navigate('Subscription');
    }
  };

  const isSubscribed = subscription?.isSubscribed;
  const showTrialBadge = !isSubscribed && scansRemaining > 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>🛒</Text>
          <Text style={styles.appName}>{APP_NAME}</Text>
          <Text style={styles.tagline}>
            Scannez. Comparez. Économisez.
          </Text>
        </View>

        {/* Trial/Subscription Badge */}
        {showTrialBadge && (
          <View style={styles.trialBadge}>
            <Text style={styles.trialText}>
              🎁 Essai gratuit : {scansRemaining} scan{scansRemaining > 1 ? 's' : ''} restant{scansRemaining > 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {isSubscribed && (
          <View style={styles.subscribedBadge}>
            <Text style={styles.subscribedText}>
              ⭐ Abonné Premium
            </Text>
          </View>
        )}

        {/* Main Scan Button */}
        <TouchableOpacity
          style={[
            styles.scanButton,
            !canScan && styles.scanButtonDisabled,
          ]}
          onPress={handleScanPress}
          activeOpacity={0.8}>
          <Text style={styles.scanIcon}>📸</Text>
          <Text style={styles.scanButtonText}>
            Scanner une facture
          </Text>
          <Text style={styles.scanButtonSubtext}>
            Prenez en photo votre ticket de caisse
          </Text>
        </TouchableOpacity>

        {/* Features Grid */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Comment ça marche</Text>
          
          <View style={styles.featuresGrid}>
            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>📷</Text>
              <Text style={styles.featureTitle}>Scannez</Text>
              <Text style={styles.featureDesc}>
                Prenez en photo votre facture
              </Text>
            </View>

            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>🤖</Text>
              <Text style={styles.featureTitle}>Analysez</Text>
              <Text style={styles.featureDesc}>
                L'IA extrait vos achats
              </Text>
            </View>

            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>📊</Text>
              <Text style={styles.featureTitle}>Comparez</Text>
              <Text style={styles.featureDesc}>
                Trouvez les meilleurs prix
              </Text>
            </View>

            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>💰</Text>
              <Text style={styles.featureTitle}>Économisez</Text>
              <Text style={styles.featureDesc}>
                Suivez vos économies
              </Text>
            </View>
          </View>
        </View>

        {/* Upgrade CTA (for trial users) */}
        {!isSubscribed && (
          <TouchableOpacity
            style={styles.upgradeCard}
            onPress={() => navigation.navigate('Subscription')}
            activeOpacity={0.8}>
            <View style={styles.upgradeContent}>
              <Text style={styles.upgradeIcon}>🚀</Text>
              <View style={styles.upgradeTextContainer}>
                <Text style={styles.upgradeTitle}>
                  Passez à Premium
                </Text>
                <Text style={styles.upgradeDesc}>
                  Scans illimités • Alertes de prix • Historique complet
                </Text>
              </View>
            </View>
            <Text style={styles.upgradePrice}>$2.99/mois</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 20,
  },
  logo: {
    fontSize: 64,
    marginBottom: 8,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  tagline: {
    fontSize: 16,
    color: COLORS.gray[500],
  },
  trialBadge: {
    backgroundColor: COLORS.primary[50],
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  trialText: {
    color: COLORS.primary[700],
    fontWeight: '600',
    fontSize: 14,
  },
  subscribedBadge: {
    backgroundColor: '#fef3c7',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  subscribedText: {
    color: '#92400e',
    fontWeight: '600',
    fontSize: 14,
  },
  scanButton: {
    backgroundColor: COLORS.primary[500],
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: COLORS.primary[500],
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  scanButtonDisabled: {
    backgroundColor: COLORS.gray[300],
    shadowColor: COLORS.gray[300],
  },
  scanIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  scanButtonText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  scanButtonSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  featuresSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.gray[900],
    marginBottom: 16,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 12,
    color: COLORS.gray[500],
    textAlign: 'center',
  },
  upgradeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: COLORS.primary[200],
  },
  upgradeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  upgradeIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  upgradeTextContainer: {
    flex: 1,
  },
  upgradeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray[900],
    marginBottom: 2,
  },
  upgradeDesc: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  upgradePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary[500],
  },
});
