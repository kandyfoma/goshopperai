// Price Comparison Screen - Compare prices across stores
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import {useRoute, RouteProp} from '@react-navigation/native';
import {RootStackParamList, PriceComparison} from '@/shared/types';
import {COLORS} from '@/shared/utils/constants';
import {formatCurrency} from '@/shared/utils/helpers';

type PriceComparisonRouteProp = RouteProp<RootStackParamList, 'PriceComparison'>;

export function PriceComparisonScreen() {
  const route = useRoute<PriceComparisonRouteProp>();
  const {receiptId} = route.params;

  const [comparisons, setComparisons] = useState<PriceComparison[]>([]);
  const [totalSavings, setTotalSavings] = useState(0);

  useEffect(() => {
    // TODO: Fetch price comparisons from Firestore
    // Mock data for now
    const mockComparisons: PriceComparison[] = [
      {
        productName: 'Riz Basmati 5kg',
        productNameNormalized: 'riz basmati 5kg',
        unit: 'kg',
        currentPrice: 12.99,
        currentStore: 'Shoprite',
        bestPrice: 10.99,
        bestStore: 'Carrefour',
        bestDate: new Date(),
        averagePrice: 11.50,
        minPrice: 10.99,
        maxPrice: 13.50,
        priceCount: 15,
        potentialSavings: 2.00,
        savingsPercentage: 15.4,
        allPrices: [],
      },
      {
        productName: 'Huile de palme 1L',
        productNameNormalized: 'huile palme 1l',
        unit: 'L',
        currentPrice: 4.50,
        currentStore: 'Shoprite',
        bestPrice: 4.50,
        bestStore: 'Shoprite',
        bestDate: new Date(),
        averagePrice: 4.75,
        minPrice: 4.50,
        maxPrice: 5.20,
        priceCount: 12,
        potentialSavings: 0,
        savingsPercentage: 0,
        allPrices: [],
      },
      {
        productName: 'Coca-Cola 1.5L',
        productNameNormalized: 'coca cola 1.5l',
        unit: 'L',
        currentPrice: 2.00,
        currentStore: 'Shoprite',
        bestPrice: 1.80,
        bestStore: 'City Market',
        bestDate: new Date(),
        averagePrice: 1.95,
        minPrice: 1.80,
        maxPrice: 2.20,
        priceCount: 25,
        potentialSavings: 0.60, // 3 × 0.20
        savingsPercentage: 10,
        allPrices: [],
      },
    ];

    setComparisons(mockComparisons);
    
    const savings = mockComparisons.reduce(
      (sum, c) => sum + c.potentialSavings, 
      0
    );
    setTotalSavings(savings);
  }, [receiptId]);

  const getPriceStatus = (comparison: PriceComparison) => {
    if (comparison.potentialSavings === 0) {
      return {label: 'Meilleur prix ! 🎉', color: COLORS.primary[500]};
    }
    if (comparison.savingsPercentage > 10) {
      return {label: 'Moins cher ailleurs', color: COLORS.error};
    }
    return {label: 'Prix correct', color: COLORS.warning};
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}>
        
        {/* Savings Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryIcon}>
            {totalSavings > 0 ? '💡' : '🎉'}
          </Text>
          {totalSavings > 0 ? (
            <>
              <Text style={styles.summaryTitle}>
                Économie potentielle
              </Text>
              <Text style={styles.savingsAmount}>
                {formatCurrency(totalSavings)}
              </Text>
              <Text style={styles.summaryDesc}>
                sur cette facture en achetant aux meilleurs prix
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.summaryTitle}>
                Excellent choix !
              </Text>
              <Text style={styles.summaryDesc}>
                Vous avez payé les meilleurs prix disponibles
              </Text>
            </>
          )}
        </View>

        {/* Comparisons List */}
        <Text style={styles.sectionTitle}>
          Détail par article
        </Text>

        {comparisons.map((comparison, index) => {
          const status = getPriceStatus(comparison);
          
          return (
            <View key={index} style={styles.comparisonCard}>
              <View style={styles.comparisonHeader}>
                <Text style={styles.productName}>
                  {comparison.productName}
                </Text>
                <View style={[
                  styles.statusBadge, 
                  {backgroundColor: status.color + '15'}
                ]}>
                  <Text style={[styles.statusText, {color: status.color}]}>
                    {status.label}
                  </Text>
                </View>
              </View>

              <View style={styles.priceRow}>
                <View style={styles.priceColumn}>
                  <Text style={styles.priceLabel}>Vous avez payé</Text>
                  <Text style={styles.currentPrice}>
                    {formatCurrency(comparison.currentPrice)}
                  </Text>
                  <Text style={styles.storeLabel}>
                    à {comparison.currentStore}
                  </Text>
                </View>

                <View style={styles.priceDivider} />

                <View style={styles.priceColumn}>
                  <Text style={styles.priceLabel}>Meilleur prix</Text>
                  <Text style={[
                    styles.bestPrice,
                    comparison.potentialSavings > 0 && styles.betterPrice
                  ]}>
                    {formatCurrency(comparison.bestPrice)}
                  </Text>
                  <Text style={styles.storeLabel}>
                    à {comparison.bestStore}
                  </Text>
                </View>
              </View>

              {comparison.potentialSavings > 0 && (
                <View style={styles.savingsRow}>
                  <Text style={styles.savingsText}>
                    💰 Économie possible: {formatCurrency(comparison.potentialSavings)}
                    {' '}(-{comparison.savingsPercentage.toFixed(0)}%)
                  </Text>
                </View>
              )}

              <View style={styles.statsRow}>
                <Text style={styles.statsText}>
                  📊 Prix moyen: {formatCurrency(comparison.averagePrice)}
                  {' '} • {comparison.priceCount} relevés
                </Text>
              </View>
            </View>
          );
        })}
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
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginBottom: 8,
  },
  savingsAmount: {
    fontSize: 42,
    fontWeight: 'bold',
    color: COLORS.primary[500],
    marginBottom: 4,
  },
  summaryDesc: {
    fontSize: 14,
    color: COLORS.gray[500],
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  comparisonCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  comparisonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray[900],
    flex: 1,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceColumn: {
    flex: 1,
    alignItems: 'center',
  },
  priceDivider: {
    width: 1,
    height: 50,
    backgroundColor: COLORS.gray[200],
    marginHorizontal: 16,
  },
  priceLabel: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginBottom: 4,
  },
  currentPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 2,
  },
  bestPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 2,
  },
  betterPrice: {
    color: COLORS.primary[500],
  },
  storeLabel: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  savingsRow: {
    backgroundColor: COLORS.primary[50],
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  savingsText: {
    fontSize: 13,
    color: COLORS.primary[700],
    fontWeight: '600',
    textAlign: 'center',
  },
  statsRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    paddingTop: 10,
  },
  statsText: {
    fontSize: 12,
    color: COLORS.gray[500],
    textAlign: 'center',
  },
});
