// Shopping List Screen - Smart shopping with price optimization
import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useAuth} from '@/shared/contexts';
import {
  shoppingListService,
  ShoppingList,
  ShoppingListItem,
  OptimizationResult,
} from '@/shared/services/firebase';
import {COLORS} from '@/shared/utils/constants';

export function ShoppingListScreen() {
  const navigation = useNavigation();
  const {user} = useAuth();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [selectedList, setSelectedList] = useState<ShoppingList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [isCreating, setIsCreating] = useState(false);
  const [optimization, setOptimization] = useState<OptimizationResult | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Load shopping lists
  useEffect(() => {
    loadLists();
    loadSuggestions();
  }, [user?.uid]);

  const loadLists = async () => {
    if (!user?.uid) return;
    
    try {
      const loadedLists = await shoppingListService.getLists(user.uid);
      setLists(loadedLists);
      
      if (loadedLists.length > 0 && !selectedList) {
        setSelectedList(loadedLists[0]);
      }
    } catch (error) {
      console.error('Load lists error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSuggestions = async () => {
    if (!user?.uid) return;
    
    try {
      const items = await shoppingListService.getQuickSuggestions(user.uid);
      setSuggestions(items);
    } catch (error) {
      console.error('Load suggestions error:', error);
    }
  };

  const handleCreateList = useCallback(async () => {
    if (!user?.uid || !newListName.trim()) return;
    
    setIsCreating(true);
    try {
      const list = await shoppingListService.createList(user.uid, newListName.trim());
      setLists(prev => [list, ...prev]);
      setSelectedList(list);
      setShowNewListModal(false);
      setNewListName('');
    } catch (error) {
      console.error('Create list error:', error);
      Alert.alert('Erreur', 'Impossible de créer la liste');
    } finally {
      setIsCreating(false);
    }
  }, [user?.uid, newListName]);

  const handleAddItem = useCallback(async () => {
    if (!user?.uid || !selectedList || !newItemName.trim()) return;
    
    setIsCreating(true);
    try {
      const item = await shoppingListService.addItem(user.uid, selectedList.id, {
        name: newItemName.trim(),
        quantity: parseInt(newItemQuantity) || 1,
      });
      
      // Refresh list
      const updatedList = await shoppingListService.getList(user.uid, selectedList.id);
      if (updatedList) {
        setSelectedList(updatedList);
        setLists(prev => prev.map(l => l.id === updatedList.id ? updatedList : l));
      }
      
      setShowAddItemModal(false);
      setNewItemName('');
      setNewItemQuantity('1');
    } catch (error) {
      console.error('Add item error:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter l\'article');
    } finally {
      setIsCreating(false);
    }
  }, [user?.uid, selectedList, newItemName, newItemQuantity]);

  const handleToggleItem = useCallback(async (itemId: string) => {
    if (!user?.uid || !selectedList) return;
    
    try {
      await shoppingListService.toggleItem(user.uid, selectedList.id, itemId);
      
      // Update local state
      setSelectedList(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map(item =>
            item.id === itemId ? {...item, isChecked: !item.isChecked} : item
          ),
        };
      });
    } catch (error) {
      console.error('Toggle item error:', error);
    }
  }, [user?.uid, selectedList]);

  const handleRemoveItem = useCallback(async (itemId: string) => {
    if (!user?.uid || !selectedList) return;
    
    Alert.alert(
      'Supprimer ?',
      'Supprimer cet article de la liste ?',
      [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await shoppingListService.removeItem(user.uid, selectedList.id, itemId);
              
              setSelectedList(prev => {
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
      ],
    );
  }, [user?.uid, selectedList]);

  const handleOptimize = useCallback(async () => {
    if (!user?.uid || !selectedList) return;
    
    setIsLoading(true);
    try {
      const result = await shoppingListService.optimizeList(user.uid, selectedList.id);
      setOptimization(result);
      
      // Refresh list
      const updatedList = await shoppingListService.getList(user.uid, selectedList.id);
      if (updatedList) {
        setSelectedList(updatedList);
      }
    } catch (error) {
      console.error('Optimize error:', error);
      Alert.alert('Erreur', 'Impossible d\'optimiser la liste');
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid, selectedList]);

  const handleAddSuggestion = useCallback((itemName: string) => {
    setNewItemName(itemName);
    setShowAddItemModal(true);
  }, []);

  const renderItem = ({item}: {item: ShoppingListItem}) => (
    <View style={[styles.itemCard, item.isChecked && styles.itemCardChecked]}>
      <TouchableOpacity
        style={styles.checkBox}
        onPress={() => handleToggleItem(item.id)}>
        <Text style={styles.checkBoxText}>
          {item.isChecked ? '✓' : '○'}
        </Text>
      </TouchableOpacity>
      
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, item.isChecked && styles.itemNameChecked]}>
          {item.name}
        </Text>
        <View style={styles.itemDetails}>
          <Text style={styles.itemQuantity}>x{item.quantity}</Text>
          {item.bestPrice && (
            <Text style={styles.itemPrice}>
              Meilleur: ${item.bestPrice.toFixed(2)} @ {item.bestStore}
            </Text>
          )}
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveItem(item.id)}>
        <Text style={styles.removeButtonText}>×</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading && lists.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary[500]} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Liste de Courses</Text>
        <TouchableOpacity onPress={() => setShowNewListModal(true)}>
          <Text style={styles.newListButton}>+ Nouvelle</Text>
        </TouchableOpacity>
      </View>

      {/* List Selector */}
      {lists.length > 0 && (
        <ScrollView 
          horizontal 
          style={styles.listSelector}
          showsHorizontalScrollIndicator={false}>
          {lists.map(list => (
            <TouchableOpacity
              key={list.id}
              style={[
                styles.listTab,
                selectedList?.id === list.id && styles.listTabActive,
              ]}
              onPress={() => setSelectedList(list)}>
              <Text style={[
                styles.listTabText,
                selectedList?.id === list.id && styles.listTabTextActive,
              ]}>
                {list.name}
              </Text>
              <Text style={styles.listTabCount}>
                {list.items.length} articles
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Selected List Content */}
      {selectedList ? (
        <View style={styles.listContent}>
          {/* Savings Info */}
          {selectedList.potentialSavings > 0 && (
            <View style={styles.savingsCard}>
              <Text style={styles.savingsIcon}>💰</Text>
              <View style={styles.savingsInfo}>
                <Text style={styles.savingsTitle}>
                  Économies potentielles
                </Text>
                <Text style={styles.savingsAmount}>
                  ${selectedList.potentialSavings.toFixed(2)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.optimizeButton}
                onPress={handleOptimize}>
                <Text style={styles.optimizeButtonText}>Optimiser</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Store Recommendations */}
          {selectedList.optimizedStores.length > 0 && (
            <View style={styles.storesCard}>
              <Text style={styles.storesTitle}>🏪 Magasins recommandés:</Text>
              {selectedList.optimizedStores.slice(0, 3).map((store, index) => (
                <View key={store.storeNameNormalized} style={styles.storeRow}>
                  <Text style={styles.storeName}>
                    {index + 1}. {store.storeName}
                  </Text>
                  <Text style={styles.storeItems}>
                    {store.itemCount} articles • ${store.totalPrice.toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Items List */}
          {selectedList.items.length === 0 ? (
            <View style={styles.emptyList}>
              <Text style={styles.emptyIcon}>🛒</Text>
              <Text style={styles.emptyText}>Liste vide</Text>
              <Text style={styles.emptySubtext}>
                Ajoutez des articles à votre liste
              </Text>
            </View>
          ) : (
            <FlatList
              data={selectedList.items}
              renderItem={renderItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.itemsList}
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* Quick Suggestions */}
          {suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>Suggestions rapides:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {suggestions.slice(0, 8).map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionChip}
                    onPress={() => handleAddSuggestion(item)}>
                    <Text style={styles.suggestionText}>+ {item}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Add Item Button */}
          <TouchableOpacity
            style={styles.addItemButton}
            onPress={() => setShowAddItemModal(true)}>
            <Text style={styles.addItemButtonText}>+ Ajouter un article</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.noListContainer}>
          <Text style={styles.noListIcon}>📝</Text>
          <Text style={styles.noListTitle}>Aucune liste</Text>
          <Text style={styles.noListText}>
            Créez votre première liste de courses
          </Text>
          <TouchableOpacity
            style={styles.createFirstButton}
            onPress={() => setShowNewListModal(true)}>
            <Text style={styles.createFirstButtonText}>Créer une liste</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* New List Modal */}
      <Modal
        visible={showNewListModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNewListModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nouvelle Liste</Text>
            <Text style={styles.modalSubtitle}>Oyo ya sika</Text>
            
            <TextInput
              style={styles.modalInput}
              value={newListName}
              onChangeText={setNewListName}
              placeholder="Nom de la liste..."
              placeholderTextColor={COLORS.gray[400]}
              autoFocus
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowNewListModal(false)}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalCreateButton,
                  !newListName.trim() && styles.modalCreateButtonDisabled,
                ]}
                onPress={handleCreateList}
                disabled={!newListName.trim() || isCreating}>
                {isCreating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalCreateText}>Créer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Item Modal */}
      <Modal
        visible={showAddItemModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddItemModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ajouter Article</Text>
            <Text style={styles.modalSubtitle}>Bakisa eloko</Text>
            
            <TextInput
              style={styles.modalInput}
              value={newItemName}
              onChangeText={setNewItemName}
              placeholder="Nom de l'article..."
              placeholderTextColor={COLORS.gray[400]}
              autoFocus
            />
            
            <View style={styles.quantityContainer}>
              <Text style={styles.quantityLabel}>Quantité:</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setNewItemQuantity(String(Math.max(1, parseInt(newItemQuantity) - 1)))}>
                <Text style={styles.quantityButtonText}>-</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.quantityInput}
                value={newItemQuantity}
                onChangeText={setNewItemQuantity}
                keyboardType="number-pad"
              />
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setNewItemQuantity(String(parseInt(newItemQuantity) + 1))}>
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowAddItemModal(false)}>
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
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalCreateText}>Ajouter</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.gray[600],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  backButton: {
    fontSize: 16,
    color: COLORS.primary[600],
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  newListButton: {
    fontSize: 14,
    color: COLORS.primary[600],
    fontWeight: '600',
  },
  listSelector: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
    maxHeight: 80,
  },
  listTab: {
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  listTabActive: {
    backgroundColor: COLORS.primary[500],
  },
  listTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  listTabTextActive: {
    color: '#fff',
  },
  listTabCount: {
    fontSize: 11,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  listContent: {
    flex: 1,
  },
  savingsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  savingsIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  savingsInfo: {
    flex: 1,
  },
  savingsTitle: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  savingsAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary[700],
  },
  optimizeButton: {
    backgroundColor: COLORS.primary[500],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  optimizeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  storesCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  storesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 12,
  },
  storeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  storeName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[800],
  },
  storeItems: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginTop: 8,
  },
  itemsList: {
    padding: 16,
    paddingBottom: 200,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemCardChecked: {
    backgroundColor: COLORS.gray[100],
    opacity: 0.7,
  },
  checkBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkBoxText: {
    fontSize: 18,
    color: COLORS.primary[600],
    fontWeight: 'bold',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.gray[900],
  },
  itemNameChecked: {
    textDecorationLine: 'line-through',
    color: COLORS.gray[500],
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  itemQuantity: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginRight: 8,
  },
  itemPrice: {
    fontSize: 12,
    color: COLORS.primary[600],
  },
  removeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 24,
    color: COLORS.gray[400],
  },
  suggestionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  suggestionsTitle: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginBottom: 8,
  },
  suggestionChip: {
    backgroundColor: COLORS.primary[100],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  suggestionText: {
    fontSize: 12,
    color: COLORS.primary[700],
    fontWeight: '500',
  },
  addItemButton: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    backgroundColor: COLORS.primary[500],
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  addItemButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  noListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noListIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  noListTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 8,
  },
  noListText: {
    fontSize: 14,
    color: COLORS.gray[500],
    textAlign: 'center',
    marginBottom: 24,
  },
  createFirstButton: {
    backgroundColor: COLORS.primary[500],
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  createFirstButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.gray[500],
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalInput: {
    backgroundColor: COLORS.gray[100],
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.gray[900],
    marginBottom: 16,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  quantityLabel: {
    fontSize: 16,
    color: COLORS.gray[700],
    marginRight: 16,
  },
  quantityButton: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.primary[100],
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 24,
    color: COLORS.primary[600],
    fontWeight: 'bold',
  },
  quantityInput: {
    width: 60,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginHorizontal: 8,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: COLORS.gray[200],
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  modalCreateButton: {
    flex: 1,
    backgroundColor: COLORS.primary[500],
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCreateButtonDisabled: {
    backgroundColor: COLORS.gray[300],
  },
  modalCreateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
