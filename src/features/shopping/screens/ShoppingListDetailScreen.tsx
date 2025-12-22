// Shopping List Detail Screen - Single list view with full CRUD
import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  ScrollView,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {firebase} from '@react-native-firebase/functions';
import {RootStackParamList} from '@/shared/types';
import {useAuth, useUser} from '@/shared/contexts';
import {
  shoppingListService,
  ShoppingList,
  ShoppingListItem,
} from '@/shared/services/firebase';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from '@/shared/theme/theme';
import {Icon, Spinner, Modal, SwipeToDelete} from '@/shared/components';
import {formatCurrency} from '@/shared/utils/helpers';

type RouteParams = RouteProp<RootStackParamList, 'ShoppingListDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Community item from search
interface CommunityItemData {
  id: string;
  name: string;
  prices: {
    storeName: string;
    price: number;
    currency: 'USD' | 'CDF';
    date: Date | any;
  }[];
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  storeCount: number;
  currency: 'USD' | 'CDF';
}

export function ShoppingListDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteParams>();
  const insets = useSafeAreaInsets();
  const {user, isAuthenticated} = useAuth();
  const {profile: userProfile} = useUser();

  const listId = route.params?.listId;

  const [list, setList] = useState<ShoppingList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [editedListName, setEditedListName] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [isCreating, setIsCreating] = useState(false);

  // Community item search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CommunityItemData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedItemForAdd, setSelectedItemForAdd] = useState<CommunityItemData | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
    }
  }, [isAuthenticated, navigation]);

  // Load list
  useEffect(() => {
    if (user?.uid && listId) {
      loadList();
    }
  }, [user?.uid, listId]);

  // Entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 60,
        friction: 12,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadList = async () => {
    if (!user?.uid || !listId) return;

    try {
      const loadedList = await shoppingListService.getList(user.uid, listId);
      setList(loadedList);
    } catch (error) {
      console.error('Load list error:', error);
      Alert.alert('Erreur', 'Impossible de charger la liste');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  // Search community items
  const searchCommunityItems = useCallback(async (query: string) => {
    if (!query.trim() || !userProfile?.defaultCity) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const functionsInstance = firebase.app().functions('europe-west1');
      const result = await functionsInstance.httpsCallable('getCityItems')({
        city: userProfile.defaultCity,
      });

      const data = result.data as {
        success: boolean;
        items: CommunityItemData[];
      };

      if (data.success && data.items) {
        // Filter items by search query
        const filtered = data.items.filter(item =>
          item.name.toLowerCase().includes(query.toLowerCase())
        );
        setSearchResults(filtered.slice(0, 10)); // Limit to 10 results
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [userProfile?.defaultCity]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchCommunityItems(searchQuery);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, searchCommunityItems]);

  const handleSelectSearchResult = useCallback((item: CommunityItemData) => {
    setSelectedItemForAdd(item);
    setNewItemName(item.name);
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  const handleAddItem = useCallback(async () => {
    if (!user?.uid || !list || !newItemName.trim()) return;

    setIsCreating(true);
    try {
      await shoppingListService.addItem(
        user.uid,
        list.id,
        {
          name: newItemName.trim(),
          quantity: parseInt(newItemQuantity) || 1,
        },
      );

      // Refresh list
      await loadList();

      setShowAddItemModal(false);
      setNewItemName('');
      setNewItemQuantity('1');
      setSearchQuery('');
      setSearchResults([]);
      setSelectedItemForAdd(null);
    } catch (error) {
      console.error('Add item error:', error);
      Alert.alert('Erreur', "Impossible d'ajouter l'article");
    } finally {
      setIsCreating(false);
    }
  }, [user?.uid, list, newItemName, newItemQuantity]);

  const handleToggleItem = useCallback(
    async (itemId: string) => {
      if (!user?.uid || !list) return;

      try {
        await shoppingListService.toggleItem(user.uid, list.id, itemId);

        // Update local state
        setList(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            items: prev.items.map(item =>
              item.id === itemId ? {...item, isChecked: !item.isChecked} : item,
            ),
          };
        });
      } catch (error) {
        console.error('Toggle item error:', error);
      }
    },
    [user?.uid, list],
  );

  const handleRemoveItem = useCallback(
    async (itemId: string) => {
      if (!user?.uid || !list) return;

      Alert.alert('Supprimer ?', 'Supprimer cet article de la liste ?', [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await shoppingListService.removeItem(
                user.uid,
                list.id,
                itemId,
              );

              setList(prev => {
                if (!prev) return prev;
                return {
                  ...prev,
                  items: prev.items.filter(item => item.id !== itemId),
                };
              });
            } catch (error) {
              console.error('Remove item error:', error);
            }
          },
        },
      ]);
    },
    [user?.uid, list],
  );

  const handleUpdateQuantity = useCallback(
    async (itemId: string, newQuantity: number) => {
      if (!user?.uid || !list || newQuantity < 1) return;

      try {
        await shoppingListService.updateItemQuantity(
          user.uid,
          list.id,
          itemId,
          newQuantity,
        );

        setList(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            items: prev.items.map(item =>
              item.id === itemId ? {...item, quantity: newQuantity} : item,
            ),
          };
        });
      } catch (error) {
        console.error('Update quantity error:', error);
      }
    },
    [user?.uid, list],
  );

  const handleUpdateListName = useCallback(async () => {
    if (!user?.uid || !list || !editedListName.trim()) return;

    setIsCreating(true);
    try {
      await shoppingListService.updateListName(
        user.uid,
        list.id,
        editedListName.trim(),
      );

      setList(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          name: editedListName.trim(),
        };
      });

      setShowEditNameModal(false);
      setEditedListName('');
    } catch (error) {
      console.error('Update list name error:', error);
      Alert.alert('Erreur', 'Impossible de modifier le nom');
    } finally {
      setIsCreating(false);
    }
  }, [user?.uid, list, editedListName]);

  const renderItem = ({
    item,
    index,
  }: {
    item: ShoppingListItem;
    index: number;
  }) => {
    return (
      <Animated.View
        style={[
          {
            opacity: fadeAnim,
            transform: [{translateY: slideAnim}],
          },
        ]}>
        <SwipeToDelete
          onDelete={() => handleRemoveItem(item.id)}
          deleteLabel="Supprimer"
          style={{marginBottom: Spacing.sm}}>
          <Animated.View
            style={[
              styles.itemCard,
              item.isChecked && styles.itemCardChecked,
            ]}>
            <TouchableOpacity
              style={[
                styles.checkBox,
                item.isChecked && styles.checkBoxChecked,
              ]}
              onPress={() => handleToggleItem(item.id)}
              activeOpacity={0.7}>
              {item.isChecked && (
                <Icon name="check" size="sm" color={Colors.white} />
              )}
            </TouchableOpacity>

            <View style={styles.itemInfo}>
              <Text
                style={[
                  styles.itemName,
                  item.isChecked && styles.itemNameChecked,
                ]}>
                {item.name}
              </Text>
              <View style={styles.itemDetails}>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                    hitSlop={{top: 5, bottom: 5, left: 5, right: 5}}>
                    <Icon name="minus" size="xs" color={Colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                    hitSlop={{top: 5, bottom: 5, left: 5, right: 5}}>
                    <Icon name="plus" size="xs" color={Colors.primary} />
                  </TouchableOpacity>
                </View>
                {item.bestPrice && item.bestStore && (
                  <View style={styles.priceBadge}>
                    <Icon name="tag" size="xs" color={Colors.status.success} />
                    <Text style={styles.itemPrice}>
                      ${item.bestPrice.toFixed(2)} @ {item.bestStore}
                    </Text>
                  </View>
                )}
                {item.estimatedPrice && !item.bestPrice && (
                  <View style={styles.estimatedPriceBadge}>
                    <Text style={styles.itemEstimatedPrice}>
                      ~${item.estimatedPrice.toFixed(2)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Savings indicator */}
              {item.bestPrice && item.estimatedPrice && item.estimatedPrice > item.bestPrice && (
                <View style={styles.savingsBadge}>
                  <Text style={styles.savingsText}>
                    Économie: ${(item.estimatedPrice - item.bestPrice).toFixed(2)}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleToggleItem(item.id)}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <Icon
                name={item.isChecked ? 'check-circle' : 'circle'}
                size="md"
                color={item.isChecked ? Colors.status.success : Colors.text.tertiary}
              />
            </TouchableOpacity>
          </Animated.View>
        </SwipeToDelete>
      </Animated.View>
    );
  };

  if (!isAuthenticated || isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Spinner size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  if (!list) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, {paddingTop: insets.top + Spacing.md}]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <Icon name="chevron-left" size="md" color={Colors.text.primary} />
        </TouchableOpacity>
        <TouchableOpacity 
          onLongPress={() => {
            setEditedListName(list.name);
            setShowEditNameModal(true);
          }}
          activeOpacity={0.8}>
          <Text style={styles.headerTitle} numberOfLines={1}>{list.name}</Text>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowAddItemModal(true)}>
            <Icon name="plus" size="sm" color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Items List */}
      {list.items.length === 0 ? (
        <View style={styles.emptyList}>
          <View style={styles.emptyIconContainer}>
            <Icon
              name="shopping-cart"
              size="3xl"
              color={Colors.text.tertiary}
            />
          </View>
          <Text style={styles.emptyText}>Liste vide</Text>
          <Text style={styles.emptySubtext}>
            Ajoutez des articles à votre liste
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            data={list.items}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.itemsList}
            showsVerticalScrollIndicator={false}
          />

          {/* Total Price Summary */}
          <View style={styles.totalSummaryCard}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              style={styles.totalSummaryGradient}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}>
              <View style={styles.totalHeader}>
                <Icon name="shopping-cart" size="md" color={Colors.white} />
                <Text style={styles.totalTitle}>Total à payer</Text>
              </View>

              {(() => {
                let totalUSD = 0;
                let totalCDF = 0;
                const exchangeRate = 2200; // CDF per USD (Dec 2025)

                list.items.forEach(item => {
                  const price = item.bestPrice || item.estimatedPrice || 0;
                  const quantity = item.quantity || 1;

                  if (price > 0) {
                    totalUSD += price * quantity;
                  }
                });

                totalCDF = totalUSD * exchangeRate;

                return (
                  <>
                    <View style={styles.totalRow}>
                      <Text style={styles.totalCurrency}>USD</Text>
                      <Text style={styles.totalAmount}>
                        ${totalUSD.toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.totalDivider} />
                    <View style={styles.totalRow}>
                      <Text style={styles.totalCurrency}>CDF</Text>
                      <Text style={styles.totalAmount}>
                        {totalCDF.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FC
                      </Text>
                    </View>
                    <View style={styles.totalItemsCount}>
                      <Text style={styles.totalItemsText}>
                        {list.items.length} article{list.items.length > 1 ? 's' : ''}
                      </Text>
                    </View>
                  </>
                );
              })()}
            </LinearGradient>
          </View>
        </>
      )}

      {/* Floating Add Button */}
      <TouchableOpacity
        style={[styles.floatingButton, {bottom: insets.bottom + Spacing.lg}]}
        onPress={() => setShowAddItemModal(true)}
        activeOpacity={0.9}>
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          style={styles.floatingButtonGradient}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}>
          <Icon name="plus" size="md" color={Colors.white} />
        </LinearGradient>
      </TouchableOpacity>

      {/* Add Item Modal with Search */}
      <Modal
        visible={showAddItemModal}
        variant="bottom-sheet"
        title="Ajouter Article"
        onClose={() => {
          setShowAddItemModal(false);
          setSearchQuery('');
          setSearchResults([]);
          setSelectedItemForAdd(null);
        }}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Rechercher dans la communauté</Text>
          <View style={styles.inputWrapper}>
            <Icon name="search" size="sm" color={Colors.text.tertiary} />
            <TextInput
              style={styles.modalInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Rechercher un article..."
              placeholderTextColor={Colors.text.tertiary}
            />
            {isSearching && (
              <ActivityIndicator size="small" color={Colors.primary} />
            )}
          </View>
        </View>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <ScrollView style={styles.searchResultsContainer} nestedScrollEnabled>
            <Text style={styles.searchResultsTitle}>Résultats ({searchResults.length})</Text>
            {searchResults.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.searchResultItem}
                onPress={() => handleSelectSearchResult(item)}>
                <View style={styles.searchResultInfo}>
                  <Text style={styles.searchResultName}>{item.name}</Text>
                  <Text style={styles.searchResultStats}>
                    {item.storeCount} magasins • {formatCurrency(item.minPrice, item.currency)} - {formatCurrency(item.maxPrice, item.currency)}
                  </Text>
                </View>
                <Icon name="chevron-right" size="sm" color={Colors.text.tertiary} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Selected Item Price Comparison */}
        {selectedItemForAdd && (
          <View style={styles.priceComparisonContainer}>
            <Text style={styles.priceComparisonTitle}>Prix dans différents magasins</Text>
            <ScrollView style={styles.priceList} nestedScrollEnabled>
              {selectedItemForAdd.prices
                .sort((a, b) => a.price - b.price)
                .slice(0, 5)
                .map((priceInfo, index) => (
                  <View key={`${priceInfo.storeName}-${index}`} style={styles.priceItem}>
                    <View style={styles.priceRank}>
                      <Text style={styles.priceRankText}>{index + 1}</Text>
                    </View>
                    <View style={styles.priceStoreInfo}>
                      <Text style={styles.priceStoreName}>{priceInfo.storeName}</Text>
                      <Text style={styles.priceCurrency}>{priceInfo.currency}</Text>
                    </View>
                    <Text style={[
                      styles.priceAmount,
                      index === 0 && styles.priceAmountBest
                    ]}>
                      {formatCurrency(priceInfo.price, priceInfo.currency)}
                    </Text>
                  </View>
                ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Nom de l'article</Text>
          <View style={styles.inputWrapper}>
            <Icon name="tag" size="sm" color={Colors.text.tertiary} />
            <TextInput
              style={styles.modalInput}
              value={newItemName}
              onChangeText={setNewItemName}
              placeholder="Ex: Sucre, Riz, Huile..."
              placeholderTextColor={Colors.text.tertiary}
            />
          </View>
        </View>

        <View style={styles.quantitySection}>
          <Text style={styles.inputLabel}>Quantité</Text>
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButtonModal}
              onPress={() =>
                setNewItemQuantity(
                  String(Math.max(1, parseInt(newItemQuantity) - 1)),
                )
              }>
              <Icon name="minus" size="sm" color={Colors.primary} />
            </TouchableOpacity>
            <View style={styles.quantityInputContainer}>
              <TextInput
                style={styles.quantityInput}
                value={newItemQuantity}
                onChangeText={setNewItemQuantity}
                keyboardType="number-pad"
              />
            </View>
            <TouchableOpacity
              style={styles.quantityButtonModal}
              onPress={() =>
                setNewItemQuantity(String(parseInt(newItemQuantity) + 1))
              }>
              <Icon name="plus" size="sm" color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.modalActions}>
          <TouchableOpacity
            style={styles.modalCancelButton}
            onPress={() => {
              setShowAddItemModal(false);
              setSearchQuery('');
              setSearchResults([]);
              setSelectedItemForAdd(null);
            }}>
            <Text style={styles.modalCancelText}>Annuler</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modalCreateButton,
              !newItemName.trim() && styles.modalCreateButtonDisabled,
            ]}
            onPress={handleAddItem}
            disabled={!newItemName.trim() || isCreating}>
            {isCreating ? (
              <Spinner size="small" color={Colors.white} />
            ) : (
              <>
                <Icon name="plus" size="sm" color={Colors.white} />
                <Text style={styles.modalCreateText}>Ajouter</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Edit List Name Modal */}
      <Modal
        title="Modifier le nom"
        visible={showEditNameModal}
        onClose={() => {
          setShowEditNameModal(false);
          setEditedListName('');
        }}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Nom de la liste</Text>
          <View style={styles.inputWrapper}>
            <Icon name="edit-2" size="sm" color={Colors.text.tertiary} />
            <TextInput
              style={styles.modalInput}
              value={editedListName}
              onChangeText={setEditedListName}
              placeholder="Ex: Courses de la semaine..."
              placeholderTextColor={Colors.text.tertiary}
              autoFocus
            />
          </View>
        </View>

        <View style={styles.modalActions}>
          <TouchableOpacity
            style={styles.modalCancelButton}
            onPress={() => {
              setShowEditNameModal(false);
              setEditedListName('');
            }}>
            <Text style={styles.modalCancelText}>Annuler</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modalCreateButton,
              !editedListName.trim() && styles.modalCreateButtonDisabled,
            ]}
            onPress={handleUpdateListName}
            disabled={!editedListName.trim()}>
            <>
              <Icon name="check" size="sm" color={Colors.white} />
              <Text style={styles.modalCreateText}>Enregistrer</Text>
            </>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.card.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
    marginHorizontal: Spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.card.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing['2xl'],
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.card.blue,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyText: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
  },
  emptySubtext: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
  },
  itemsList: {
    padding: Spacing.lg,
    paddingBottom: 200,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  itemCardChecked: {
    backgroundColor: Colors.card.cream,
    opacity: 0.8,
  },
  checkBox: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.card.blue,
    borderWidth: 2,
    borderColor: Colors.border.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  checkBoxChecked: {
    backgroundColor: Colors.status.success,
    borderColor: Colors.status.success,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.text.primary,
  },
  itemNameChecked: {
    textDecorationLine: 'line-through',
    color: Colors.text.tertiary,
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card.blue,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    gap: Spacing.xs,
  },
  quantityButton: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemQuantity: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.secondary,
    minWidth: 24,
    textAlign: 'center',
  },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card.cream,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  itemPrice: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.status.success,
  },
  estimatedPriceBadge: {
    backgroundColor: Colors.card.yellow,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  itemEstimatedPrice: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.secondary,
  },
  savingsBadge: {
    backgroundColor: Colors.card.cream,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
    alignSelf: 'flex-start',
  },
  savingsText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.status.success,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.card.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalSummaryCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  totalSummaryGradient: {
    padding: Spacing.lg,
  },
  totalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  totalTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  totalCurrency: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: 'rgba(255,255,255,0.8)',
  },
  totalAmount: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  totalDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginVertical: Spacing.xs,
  },
  totalItemsCount: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.3)',
  },
  totalItemsText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  floatingButton: {
    position: 'absolute',
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  floatingButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modal styles
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card.blue,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  modalInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.primary,
  },
  searchResultsContainer: {
    maxHeight: 250,
    backgroundColor: Colors.card.blue,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  searchResultsTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.text.primary,
  },
  searchResultStats: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  priceComparisonContainer: {
    backgroundColor: Colors.card.cream,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  priceComparisonTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  priceList: {
    maxHeight: 200,
  },
  priceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xs,
  },
  priceRank: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.card.yellow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  priceRankText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
  },
  priceStoreInfo: {
    flex: 1,
  },
  priceStoreName: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.text.primary,
  },
  priceCurrency: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.tertiary,
  },
  priceAmount: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },
  priceAmountBest: {
    color: Colors.status.success,
  },
  quantitySection: {
    marginBottom: Spacing.lg,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  quantityButtonModal: {
    width: 48,
    height: 48,
    backgroundColor: Colors.card.blue,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityInputContainer: {
    backgroundColor: Colors.card.yellow,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  quantityInput: {
    width: 50,
    textAlign: 'center',
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: Colors.card.blue,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.text.secondary,
  },
  modalCreateButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  modalCreateButtonDisabled: {
    backgroundColor: Colors.border.light,
  },
  modalCreateText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.white,
  },
});
