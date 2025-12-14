// City Items Screen - Browse items from all users in the same city
// Shows aggregated price data for community price comparison
import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Animated,
  Pressable,
  RefreshControl,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from '@/shared/theme/theme';
import {Icon, FadeIn, SlideIn} from '@/shared/components';
import {formatCurrency} from '@/shared/utils/helpers';
import {useAuth, useUser} from '@/shared/contexts';
import {analyticsService} from '@/shared/services/analytics';
import firestore from '@react-native-firebase/firestore';
import {APP_ID} from '@/shared/services/firebase/config';

interface CityItem {
  id: string;
  name: string;
  nameNormalized: string;
  prices: {
    storeName: string;
    price: number;
    currency: 'USD' | 'CDF';
    date: Date;
    userId: string;
  }[];
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  storeCount: number;
  currency: 'USD' | 'CDF';
  totalPurchases: number;
  lastPurchaseDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export function CityItemsScreen() {
  const {user, isAuthenticated} = useAuth();
  const {profile: userProfile} = useUser();
  const navigation = useNavigation();
  const [items, setItems] = useState<CityItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<CityItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<TextInput>(null);
  const searchAnimation = useRef(new Animated.Value(0)).current;

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigation.push('Login');
    }
  }, [isAuthenticated, navigation]);

  useEffect(() => {
    // Track screen view
    analyticsService.logScreenView('City Items', 'CityItemsScreen');
  }, []);

  useEffect(() => {
    if (userProfile?.defaultCity) {
      loadInitialItems();
    } else {
      setIsLoading(false);
    }
  }, [userProfile?.defaultCity]);

  useEffect(() => {
    // Debounced search
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      filterItems();
    }, 300);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [items, searchQuery]);

  const searchTimeout = useRef<NodeJS.Timeout>();

  const loadInitialItems = async () => {
    if (!userProfile?.defaultCity) {
      return;
    }

    try {
      setIsLoading(true);

      const result = await fetchCityItems({
        limit: 20,
        orderBy: 'lastPurchaseDate',
        orderDirection: 'desc',
      });

      setItems(result.items);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Error loading initial city items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCityItems = async (options: {
    limit?: number;
    startAfter?: any;
    searchQuery?: string;
    orderBy?: 'lastPurchaseDate' | 'totalPurchases' | 'name';
    orderDirection?: 'asc' | 'desc';
  } = {}) => {
    const {
      limit = 20,
      startAfter,
      orderBy = 'lastPurchaseDate',
      orderDirection = 'desc',
    } = options;

    // Query items from all users in the same city
    let query = firestore()
      .collection('artifacts')
      .doc(APP_ID)
      .collection('cities')
      .doc(userProfile!.defaultCity)
      .collection('items')
      .orderBy(orderBy, orderDirection);

    if (startAfter) {
      query = query.startAfter(startAfter);
    }

    query = query.limit(limit + 1);

    const snapshot = await query.get();
    const hasMore = snapshot.docs.length > limit;
    const items = snapshot.docs
      .slice(0, limit)
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || 'Article inconnu',
          nameNormalized: data.nameNormalized || '',
          prices: (data.prices || []).map((price: any) => ({
            storeName: price.storeName || 'Magasin inconnu',
            price: price.price || 0,
            currency: price.currency || 'USD',
            date: price.date?.toDate() || new Date(),
            userId: price.userId || '',
          })),
          minPrice: data.minPrice || 0,
          maxPrice: data.maxPrice || 0,
          avgPrice: data.avgPrice || 0,
          storeCount: data.storeCount || 0,
          currency: data.currency || 'USD',
          totalPurchases: data.totalPurchases || 0,
          lastPurchaseDate: data.lastPurchaseDate?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };
      });

    // Client-side search filter
    let filteredItems = items;
    if (options.searchQuery && options.searchQuery.trim()) {
      const query = options.searchQuery.toLowerCase().trim();
      filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(query),
      );
    }

    return {
      items: filteredItems,
      lastDoc: snapshot.docs[limit - 1] || null,
      hasMore,
    };
  };

  const loadMoreItems = async () => {
    if (isLoadingMore || !hasMore || !lastDoc || !userProfile?.defaultCity) {
      return;
    }

    try {
      setIsLoadingMore(true);

      const result = await fetchCityItems({
        limit: 20,
        startAfter: lastDoc,
        orderBy: 'lastPurchaseDate',
        orderDirection: 'desc',
      });

      setItems(prev => [...prev, ...result.items]);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Error loading more city items:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadInitialItems();
    setIsRefreshing(false);
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
  };

  const toggleSearch = () => {
    if (isSearchOpen) {
      // Closing search
      setSearchQuery('');
      Animated.timing(searchAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start(() => setIsSearchOpen(false));
    } else {
      // Opening search
      setIsSearchOpen(true);
      Animated.timing(searchAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start(() => searchInputRef.current?.focus());
    }
  };

  const renderItem = ({item, index}: {item: CityItem; index: number}) => {
    const priceRange = item.minPrice !== item.maxPrice
      ? `${formatCurrency(item.minPrice, item.currency)} - ${formatCurrency(item.maxPrice, item.currency)}`
      : formatCurrency(item.avgPrice, item.currency);

    return (
      <FadeIn delay={index * 50}>
        <Pressable
          style={({pressed}) => [
            styles.itemCard,
            pressed && styles.itemCardPressed,
          ]}
          onPress={() => {
            // Navigate to item details or comparison
            console.log('City item pressed:', item.name);
          }}
        >
          <View style={styles.itemHeader}>
            <Text style={styles.itemName} numberOfLines={2}>
              {item.name}
            </Text>
            <View style={styles.priceBadge}>
              <Text style={styles.priceText}>{priceRange}</Text>
            </View>
          </View>

          <View style={styles.itemStats}>
            <View style={styles.stat}>
              <Icon name="store" size={14} color={Colors.text.secondary} />
              <Text style={styles.statText}>
                {item.storeCount} magasin{item.storeCount > 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.stat}>
              <Icon name="shopping-cart" size={14} color={Colors.text.secondary} />
              <Text style={styles.statText}>
                {item.totalPurchases} achat{item.totalPurchases > 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          <Text style={styles.lastPurchase}>
            Dernier achat: {item.lastPurchaseDate.toLocaleDateString('fr-FR')}
          </Text>
        </Pressable>
      </FadeIn>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="cart" size={64} color={Colors.text.secondary} />
      <Text style={styles.emptyTitle}>Aucun article trouvé</Text>
      <Text style={styles.emptySubtitle}>
        Les articles de votre ville apparaîtront ici une fois que d'autres utilisateurs auront scanné leurs reçus.
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;

    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={Colors.primary.crimson} />
        <Text style={styles.footerText}>Chargement d'autres articles...</Text>
      </View>
    );
  };

  if (!userProfile?.defaultCity) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Icon name="map-pin" size={64} color={Colors.text.secondary} />
          <Text style={styles.centerTitle}>Ville non définie</Text>
          <Text style={styles.centerSubtitle}>
            Définissez votre ville dans les paramètres pour voir les articles de votre communauté.
          </Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.push('Settings')}
          >
            <Text style={styles.settingsButtonText}>Aller aux paramètres</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Articles de {userProfile.defaultCity}</Text>
        <TouchableOpacity onPress={toggleSearch}>
          <Icon
            name={isSearchOpen ? 'x' : 'search'}
            size={24}
            color={Colors.text.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <Animated.View
        style={[
          styles.searchContainer,
          {
            height: searchAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 60],
            }),
            opacity: searchAnimation,
          },
        ]}
      >
        <View style={styles.searchInputContainer}>
          <Icon name="search" size={20} color={Colors.text.secondary} />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Rechercher un article..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.text.secondary}
          />
        </View>
      </Animated.View>

      {/* Items List */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary.crimson} />
          <Text style={styles.loadingText}>Chargement des articles...</Text>
        </View>
      ) : (
        <FlatList
          data={searchQuery ? filteredItems : items}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMoreItems}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary.crimson]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  title: {
    ...Typography.heading.h2,
    color: Colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  searchContainer: {
    overflow: 'hidden',
    backgroundColor: Colors.background.secondary,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    ...Shadows.light,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    ...Typography.body.medium,
    color: Colors.text.primary,
  },
  listContainer: {
    padding: Spacing.md,
  },
  itemCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.medium,
  },
  itemCardPressed: {
    opacity: 0.8,
    transform: [{scale: 0.98}],
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  itemName: {
    ...Typography.heading.h3,
    color: Colors.text.primary,
    flex: 1,
    marginRight: Spacing.md,
  },
  priceBadge: {
    backgroundColor: Colors.primary.crimson,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  priceText: {
    ...Typography.body.small,
    color: Colors.text.white,
    fontWeight: 'bold',
  },
  itemStats: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.lg,
  },
  statText: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    marginLeft: Spacing.xs,
  },
  lastPurchase: {
    ...Typography.body.small,
    color: Colors.text.secondary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  centerTitle: {
    ...Typography.heading.h2,
    color: Colors.text.primary,
    textAlign: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  centerSubtitle: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  settingsButton: {
    backgroundColor: Colors.primary.crimson,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  settingsButtonText: {
    ...Typography.body.medium,
    color: Colors.text.white,
    fontWeight: 'bold',
  },
  loadingText: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.heading.h2,
    color: Colors.text.primary,
    textAlign: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  footer: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
  },
});