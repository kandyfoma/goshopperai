// History Screen - List of past receipts
import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  RefreshControl,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Receipt, RootStackParamList} from '@/shared/types';
import {COLORS} from '@/shared/utils/constants';
import {formatCurrency, formatDate} from '@/shared/utils/helpers';
import {useAuth} from '@/shared/contexts';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function HistoryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const {user} = useAuth();

  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [filteredReceipts, setFilteredReceipts] = useState<Receipt[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReceipts();
  }, [user]);

  const loadReceipts = async () => {
    // TODO: Fetch from Firestore
    // Mock data for now
    const mockReceipts: Receipt[] = [
      {
        id: '1',
        userId: user?.id || '',
        storeName: 'Shoprite',
        storeNameNormalized: 'shoprite',
        storeAddress: 'Gombe, Kinshasa',
        date: new Date(2024, 11, 15),
        purchaseDate: new Date(2024, 11, 15),
        total: 45.50,
        totalAmount: 45.50,
        currency: 'USD',
        items: [],
        imageUrls: [],
        status: 'processed',
        processingStatus: 'completed',
        createdAt: new Date(2024, 11, 15),
        updatedAt: new Date(2024, 11, 15),
        scannedAt: new Date(2024, 11, 15),
      },
      {
        id: '2',
        userId: user?.id || '',
        storeName: 'Carrefour',
        storeNameNormalized: 'carrefour',
        storeAddress: 'Lemba, Kinshasa',
        date: new Date(2024, 11, 14),
        purchaseDate: new Date(2024, 11, 14),
        total: 78.20,
        totalAmount: 78.20,
        currency: 'USD',
        items: [],
        imageUrls: [],
        status: 'processed',
        processingStatus: 'completed',
        createdAt: new Date(2024, 11, 14),
        updatedAt: new Date(2024, 11, 14),
        scannedAt: new Date(2024, 11, 14),
      },
      {
        id: '3',
        userId: user?.id || '',
        storeName: 'City Market',
        storeNameNormalized: 'city market',
        storeAddress: 'Ngaliema, Kinshasa',
        date: new Date(2024, 11, 12),
        purchaseDate: new Date(2024, 11, 12),
        total: 32750,
        totalAmount: 32750,
        currency: 'CDF',
        items: [],
        imageUrls: [],
        status: 'processed',
        processingStatus: 'completed',
        createdAt: new Date(2024, 11, 12),
        updatedAt: new Date(2024, 11, 12),
        scannedAt: new Date(2024, 11, 12),
      },
    ];

    setReceipts(mockReceipts);
    setFilteredReceipts(mockReceipts);
    setIsLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadReceipts();
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredReceipts(receipts);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = receipts.filter(
        r => 
          r.storeName.toLowerCase().includes(query) ||
          r.storeAddress?.toLowerCase().includes(query)
      );
      setFilteredReceipts(filtered);
    }
  }, [searchQuery, receipts]);

  const handleReceiptPress = (receiptId: string) => {
    navigation.navigate('ReceiptDetail', {receiptId});
  };

  const getStatusColor = (status: Receipt['status']) => {
    switch (status) {
      case 'processed':
        return COLORS.primary[500];
      case 'processing':
        return COLORS.warning;
      case 'error':
        return COLORS.error;
      default:
        return COLORS.gray[500];
    }
  };

  const getStatusLabel = (status: Receipt['status']) => {
    switch (status) {
      case 'processed':
        return 'Traité';
      case 'processing':
        return 'En cours...';
      case 'error':
        return 'Erreur';
      default:
        return status;
    }
  };

  const renderReceiptItem = ({item}: {item: Receipt}) => (
    <TouchableOpacity
      style={styles.receiptCard}
      onPress={() => handleReceiptPress(item.id)}
      activeOpacity={0.7}>
      <View style={styles.receiptIcon}>
        <Text style={styles.receiptEmoji}>🧾</Text>
      </View>
      
      <View style={styles.receiptInfo}>
        <Text style={styles.storeName}>{item.storeName}</Text>
        <Text style={styles.storeAddress} numberOfLines={1}>
          {item.storeAddress || 'Adresse non spécifiée'}
        </Text>
        <Text style={styles.receiptDate}>
          {formatDate(item.purchaseDate || item.date)}
        </Text>
      </View>
      
      <View style={styles.receiptRight}>
        <Text style={styles.totalAmount}>
          {formatCurrency(item.totalAmount || item.total, item.currency)}
        </Text>
        <View style={[
          styles.statusBadge,
          {backgroundColor: getStatusColor(item.status) + '15'}
        ]}>
          <Text style={[
            styles.statusText,
            {color: getStatusColor(item.status)}
          ]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'Aucun résultat' : 'Pas encore de factures'}
      </Text>
      <Text style={styles.emptyDesc}>
        {searchQuery 
          ? 'Essayez avec d\'autres termes de recherche'
          : 'Scannez votre première facture pour commencer à suivre vos dépenses'}
      </Text>
      {!searchQuery && (
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => navigation.navigate('Scanner')}>
          <Text style={styles.emptyButtonText}>Scanner une facture</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un magasin..."
            placeholderTextColor={COLORS.gray[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearButton}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Stats Bar */}
      {receipts.length > 0 && (
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{receipts.length}</Text>
            <Text style={styles.statLabel}>Factures</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {formatCurrency(
                receipts
                  .filter(r => r.currency === 'USD')
                  .reduce((sum, r) => sum + (r.totalAmount || r.total), 0)
              )}
            </Text>
            <Text style={styles.statLabel}>Total USD</Text>
          </View>
        </View>
      )}

      {/* Receipts List */}
      <FlatList
        data={filteredReceipts}
        renderItem={renderReceiptItem}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.listContent,
          filteredReceipts.length === 0 && styles.listContentEmpty
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary[500]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.gray[900],
  },
  clearButton: {
    fontSize: 16,
    color: COLORS.gray[400],
    padding: 4,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.gray[200],
    marginHorizontal: 20,
  },
  listContent: {
    padding: 16,
    paddingTop: 4,
  },
  listContentEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  receiptCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    alignItems: 'center',
  },
  receiptIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  receiptEmoji: {
    fontSize: 24,
  },
  receiptInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  storeName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray[900],
    marginBottom: 2,
  },
  storeAddress: {
    fontSize: 13,
    color: COLORS.gray[500],
    marginBottom: 2,
  },
  receiptDate: {
    fontSize: 12,
    color: COLORS.gray[400],
  },
  receiptRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 14,
    color: COLORS.gray[500],
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  emptyButton: {
    backgroundColor: COLORS.primary[500],
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
