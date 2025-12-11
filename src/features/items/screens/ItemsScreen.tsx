// Items Screen - Browse and compare item prices across stores
// Styled with GoShopperAI Design System (Blue + Gold)
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import {Colors, Typography, Spacing, BorderRadius, Shadows} from '@/shared/theme/theme';
import {Icon, FadeIn, SlideIn} from '@/shared/components';
import {formatCurrency} from '@/shared/utils/helpers';
import {useAuth, useUser} from '@/shared/contexts';
import {analyticsService} from '@/shared/services/analytics';

interface ItemData {
  id: string;
  name: string;
  prices: {
    storeName: string;
    price: number;
    currency: 'USD' | 'CDF';
    date: Date;
    receiptId: string;
  }[];
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  storeCount: number;
  currency: 'USD' | 'CDF'; // Primary currency for display
}

export function ItemsScreen() {
  const {user} = useAuth();
  const {profile: userProfile} = useUser();
  const [items, setItems] = useState<ItemData[]>([]);
  const [filteredItems, setFilteredItems] = useState<ItemData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Track screen view
    analyticsService.logScreenView('Items', 'ItemsScreen');
  }, []);

  useEffect(() => {
    loadItemsData();
  }, [user, userProfile]);

  useEffect(() => {
    filterItems();
  }, [items, searchQuery]);

  const loadItemsData = async () => {
    if (!user?.uid || !userProfile?.defaultCity) {
      setIsLoading(false);
      return;
    }

    try {
      // Get receipts for the user filtered by their city
      const receiptsSnapshot = await firestore()
        .collection(`artifacts/goshopperai/users/${user.uid}/receipts`)
        .where('city', '==', userProfile.defaultCity)
        .get();

      const itemsMap = new Map<string, ItemData>();

      receiptsSnapshot.docs.forEach(doc => {
        const receiptData = doc.data();
        const items = receiptData.items || [];

        items.forEach((item: any) => {
          const itemName = item.name?.toLowerCase().trim();
          if (!itemName) return;

          const price = item.unitPrice || 0;
          if (price <= 0) return;

          if (!itemsMap.has(itemName)) {
            itemsMap.set(itemName, {
              id: itemName,
              name: item.name,
              prices: [],
              minPrice: price,
              maxPrice: price,
              avgPrice: price,
              storeCount: 1,
              currency: receiptData.currency || 'USD',
            });
          }

          const itemData = itemsMap.get(itemName)!;
          itemData.prices.push({
            storeName: receiptData.storeName || 'Inconnu',
            price: price,
            currency: receiptData.currency || 'USD',
            date: receiptData.scannedAt?.toDate() || new Date(),
            receiptId: doc.id,
          });

          // Update statistics
          itemData.minPrice = Math.min(itemData.minPrice, price);
          itemData.maxPrice = Math.max(itemData.maxPrice, price);
          itemData.avgPrice =
            itemData.prices.reduce((sum, p) => sum + p.price, 0) /
            itemData.prices.length;
          itemData.storeCount = new Set(
            itemData.prices.map(p => p.storeName),
          ).size;

          // Determine primary currency (most common)
          const currencyCounts = itemData.prices.reduce((acc, p) => {
            acc[p.currency] = (acc[p.currency] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          itemData.currency = Object.entries(currencyCounts).sort(
            ([, a], [, b]) => b - a,
          )[0][0] as 'USD' | 'CDF';
        });
      });

      const itemsArray = Array.from(itemsMap.values()).sort(
        (a, b) => b.prices.length - a.prices.length,
      ); // Sort by frequency

      setItems(itemsArray);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterItems = () => {
    if (!searchQuery.trim()) {
      setFilteredItems(items);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = items.filter(item =>
      item.name.toLowerCase().includes(query),
    );
    setFilteredItems(filtered);

    // Track item search
    analyticsService.logCustomEvent('item_search', {
      query: query,
      results_count: filtered.length,
    });
  };

  const renderItem = ({item, index}: {item: ItemData; index: number}) => (
    <SlideIn delay={index * 50}>
      <TouchableOpacity style={styles.itemCard} activeOpacity={0.7}>
        <View style={styles.itemHeader}>
          <View style={styles.itemIconWrapper}>
            <Icon name="cart" size="sm" color={Colors.primary} />
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemStats}>
              {item.prices.length} achats • {item.storeCount} magasin
              {item.storeCount > 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        <View style={styles.priceInfo}>
          <View style={styles.priceRow}>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Min</Text>
              <Text style={[styles.priceValue, styles.priceMin]}>
                {formatCurrency(item.minPrice, item.currency)}
              </Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Max</Text>
              <Text style={[styles.priceValue, styles.priceMax]}>
                {formatCurrency(item.maxPrice, item.currency)}
              </Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Moyen</Text>
              <Text style={[styles.priceValue, styles.avgPrice]}>
                {formatCurrency(item.avgPrice, item.currency)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.storesList}>
          <Text style={styles.storesTitle}>Meilleurs prix:</Text>
          {item.prices
            .sort((a, b) => a.price - b.price)
            .slice(0, 3)
            .map((price, index) => (
              <View key={index} style={styles.storePrice}>
                <View style={styles.storeInfo}>
                  <Icon name="location" size="xs" color={Colors.text.tertiary} />
                  <Text style={styles.storeName}>{price.storeName}</Text>
                </View>
                <Text style={styles.storePriceValue}>
                  {formatCurrency(price.price, price.currency)}
                </Text>
              </View>
            ))}
          {item.prices.length > 3 && (
            <Text style={styles.moreStores}>
              +{item.prices.length - 3} autres...
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </SlideIn>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Chargement des articles...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FadeIn>
        <View style={styles.header}>
          <Text style={styles.title}>Articles</Text>
          <Text style={styles.subtitle}>Comparez les prix de vos achats</Text>
        </View>
      </FadeIn>

      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Icon name="search" size="sm" color={Colors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un article..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.text.tertiary}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close" size="sm" color={Colors.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statsBadge}>
          <Icon name="grid" size="xs" color={Colors.primary} />
          <Text style={styles.statsText}>
            {filteredItems.length} article{filteredItems.length > 1 ? 's' : ''}{' '}
            trouvé{filteredItems.length > 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrapper}>
              <Icon name="search" size="xl" color={Colors.text.tertiary} />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery
                ? 'Aucun article trouvé'
                : 'Aucun article disponible'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'Essayez un autre terme de recherche'
                : 'Scannez des factures pour voir vos articles ici'}
            </Text>
          </View>
        }
      />
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
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Shadows.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  statsContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  statsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  statsText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.medium,
  },
  listContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  itemCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  itemIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  itemStats: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
  },
  priceInfo: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceItem: {
    flex: 1,
    alignItems: 'center',
  },
  priceDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border.light,
  },
  priceLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  priceMin: {
    color: Colors.status.success,
  },
  priceMax: {
    color: Colors.status.error,
  },
  avgPrice: {
    color: Colors.primary,
  },
  storesList: {
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingTop: Spacing.md,
  },
  storesTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  storePrice: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.xs,
  },
  storeName: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  storePriceValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.status.success,
  },
  moreStores: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },
  emptyIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.tertiary,
    textAlign: 'center',
    maxWidth: 250,
  },
});
