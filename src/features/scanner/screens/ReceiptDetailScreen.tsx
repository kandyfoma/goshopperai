// Receipt Detail Screen - View parsed receipt details
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList, Receipt, ReceiptItem} from '@/shared/types';
import {COLORS} from '@/shared/utils/constants';
import {formatCurrency, formatDate} from '@/shared/utils/helpers';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type ReceiptDetailRouteProp = RouteProp<RootStackParamList, 'ReceiptDetail'>;

export function ReceiptDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ReceiptDetailRouteProp>();
  const {receiptId} = route.params;

  // TODO: Fetch receipt from Firestore
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  useEffect(() => {
    // Mock data for now - will fetch from Firestore
    setReceipt({
      id: receiptId,
      userId: 'user-1',
      storeName: 'Shoprite Kinshasa',
      storeNameNormalized: 'shoprite kinshasa',
      date: new Date(),
      currency: 'USD',
      items: [
        {
          id: '1',
          name: 'Riz Basmati 5kg',
          nameNormalized: 'riz basmati 5kg',
          quantity: 1,
          unitPrice: 12.99,
          totalPrice: 12.99,
          category: 'Alimentation',
          confidence: 0.95,
        },
        {
          id: '2',
          name: 'Huile de palme 1L',
          nameNormalized: 'huile palme 1l',
          quantity: 2,
          unitPrice: 4.50,
          totalPrice: 9.00,
          category: 'Alimentation',
          confidence: 0.92,
        },
        {
          id: '3',
          name: 'Coca-Cola 1.5L',
          nameNormalized: 'coca cola 1.5l',
          quantity: 3,
          unitPrice: 2.00,
          totalPrice: 6.00,
          category: 'Boissons',
          confidence: 0.98,
        },
      ],
      total: 27.99,
      processingStatus: 'completed',
      createdAt: new Date(),
      updatedAt: new Date(),
      scannedAt: new Date(),
    });
  }, [receiptId]);

  const handleCompare = () => {
    navigation.navigate('PriceComparison', {receiptId});
  };

  if (!receipt) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}>
        {/* Store Header */}
        <View style={styles.storeHeader}>
          <Text style={styles.storeIcon}>🏪</Text>
          <Text style={styles.storeName}>{receipt.storeName}</Text>
          <Text style={styles.receiptDate}>
            {formatDate(receipt.date, 'long')}
          </Text>
        </View>

        {/* Items List */}
        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>
            Articles ({receipt.items.length})
          </Text>

          {receipt.items.map((item, index) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemMain}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemMeta}>
                    {item.quantity} × {formatCurrency(item.unitPrice, receipt.currency)}
                  </Text>
                  {item.category && (
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{item.category}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.itemPrice}>
                  {formatCurrency(item.totalPrice, receipt.currency)}
                </Text>
              </View>
              
              {/* Confidence indicator */}
              <View style={styles.confidenceBar}>
                <View 
                  style={[
                    styles.confidenceFill, 
                    {width: `${item.confidence * 100}%`}
                  ]} 
                />
              </View>
            </View>
          ))}
        </View>

        {/* Total */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>
              {formatCurrency(receipt.total, receipt.currency)}
            </Text>
          </View>
        </View>

        {/* Compare Prices CTA */}
        <TouchableOpacity
          style={styles.compareButton}
          onPress={handleCompare}
          activeOpacity={0.8}>
          <Text style={styles.compareIcon}>📊</Text>
          <View style={styles.compareTextContainer}>
            <Text style={styles.compareTitle}>Comparer les prix</Text>
            <Text style={styles.compareDesc}>
              Voir si vous avez payé le meilleur prix
            </Text>
          </View>
          <Text style={styles.compareArrow}>→</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  storeHeader: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  storeIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  storeName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 4,
    textAlign: 'center',
  },
  receiptDate: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
  itemsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  itemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  itemMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  itemMeta: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: COLORS.primary[50],
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 12,
    color: COLORS.primary[700],
    fontWeight: '500',
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  confidenceBar: {
    height: 3,
    backgroundColor: COLORS.gray[200],
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: COLORS.primary[500],
    borderRadius: 2,
  },
  totalSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary[500],
  },
  compareButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary[200],
  },
  compareIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  compareTextContainer: {
    flex: 1,
  },
  compareTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray[900],
    marginBottom: 2,
  },
  compareDesc: {
    fontSize: 13,
    color: COLORS.gray[500],
  },
  compareArrow: {
    fontSize: 24,
    color: COLORS.primary[500],
  },
});
