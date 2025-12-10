// Price Alerts Screen - Set and manage price drop notifications
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
import {priceAlertsService, PriceAlert} from '@/shared/services/firebase';
import {COLORS} from '@/shared/utils/constants';

export function PriceAlertsScreen() {
  const navigation = useNavigation();
  const {user} = useAuth();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newTargetPrice, setNewTargetPrice] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Load alerts
  useEffect(() => {
    if (!user?.uid) return;
    
    const unsubscribe = priceAlertsService.subscribeToAlerts(user.uid, loadedAlerts => {
      setAlerts(loadedAlerts);
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, [user?.uid]);

  const handleCreateAlert = useCallback(async () => {
    if (!user?.uid || !newProductName.trim() || !newTargetPrice) return;
    
    setIsCreating(true);
    try {
      await priceAlertsService.createAlert(user.uid, {
        productName: newProductName.trim(),
        targetPrice: parseFloat(newTargetPrice),
      });
      
      setShowAddModal(false);
      setNewProductName('');
      setNewTargetPrice('');
    } catch (error) {
      console.error('Create alert error:', error);
      Alert.alert('Erreur', 'Impossible de créer l\'alerte');
    } finally {
      setIsCreating(false);
    }
  }, [user?.uid, newProductName, newTargetPrice]);

  const handleDeleteAlert = useCallback(async (alertId: string) => {
    if (!user?.uid) return;
    
    Alert.alert(
      'Supprimer l\'alerte ?',
      'Cette action est irréversible.',
      [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await priceAlertsService.deleteAlert(user.uid, alertId);
            } catch (error) {
              console.error('Delete alert error:', error);
            }
          },
        },
      ],
    );
  }, [user?.uid]);

  const handleToggleAlert = useCallback(async (alertId: string, isActive: boolean) => {
    if (!user?.uid) return;
    
    try {
      await priceAlertsService.updateAlert(user.uid, alertId, {isActive: !isActive});
    } catch (error) {
      console.error('Toggle alert error:', error);
    }
  }, [user?.uid]);

  const renderAlertItem = ({item}: {item: PriceAlert}) => {
    const isTriggered = item.isTriggered;
    const hasPrice = item.currentLowestPrice !== undefined;
    
    return (
      <View style={[styles.alertCard, isTriggered && styles.alertCardTriggered]}>
        <View style={styles.alertHeader}>
          <View style={styles.alertInfo}>
            <Text style={styles.alertProductName}>{item.productName}</Text>
            <Text style={styles.alertTarget}>
              Prix cible: ${item.targetPrice.toFixed(2)}
            </Text>
          </View>
          
          {isTriggered && (
            <View style={styles.triggeredBadge}>
              <Text style={styles.triggeredBadgeText}>🎉 Prix atteint!</Text>
            </View>
          )}
        </View>
        
        {hasPrice && (
          <View style={styles.priceInfo}>
            <Text style={styles.currentPrice}>
              Prix actuel: ${item.currentLowestPrice?.toFixed(2)}
            </Text>
            {item.currentLowestStore && (
              <Text style={styles.storeText}>
                chez {item.currentLowestStore}
              </Text>
            )}
          </View>
        )}
        
        <View style={styles.alertActions}>
          <TouchableOpacity
            style={[styles.toggleButton, !item.isActive && styles.toggleButtonInactive]}
            onPress={() => handleToggleAlert(item.id, item.isActive)}>
            <Text style={styles.toggleButtonText}>
              {item.isActive ? '✓ Active' : '○ Inactive'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteAlert(item.id)}>
            <Text style={styles.deleteButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary[500]} />
          <Text style={styles.loadingText}>Chargement des alertes...</Text>
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
        <Text style={styles.headerTitle}>Alertes de Prix</Text>
        <View style={{width: 60}} />
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoIcon}>🔔</Text>
        <View style={styles.infoTextContainer}>
          <Text style={styles.infoTitle}>Comment ça marche ?</Text>
          <Text style={styles.infoText}>
            Définissez un prix cible pour un article. Nous vous alertons quand le prix baisse !
          </Text>
          <Text style={styles.infoTextLingala}>
            Pesa ntalo oyo olingi. Tokoyebisa yo ntango ntalo ekokita!
          </Text>
        </View>
      </View>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>Aucune alerte</Text>
          <Text style={styles.emptyText}>
            Créez votre première alerte pour suivre les prix
          </Text>
        </View>
      ) : (
        <FlatList
          data={alerts}
          renderItem={renderAlertItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddModal(true)}>
        <Text style={styles.addButtonText}>+ Nouvelle Alerte</Text>
      </TouchableOpacity>

      {/* Add Alert Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nouvelle Alerte</Text>
            <Text style={styles.modalTitleLingala}>Alerte ya sika</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nom du produit</Text>
              <TextInput
                style={styles.input}
                value={newProductName}
                onChangeText={setNewProductName}
                placeholder="Ex: Sucre 1kg, Riz 5kg..."
                placeholderTextColor={COLORS.gray[400]}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Prix cible ($)</Text>
              <TextInput
                style={styles.input}
                value={newTargetPrice}
                onChangeText={setNewTargetPrice}
                placeholder="Ex: 1.50"
                placeholderTextColor={COLORS.gray[400]}
                keyboardType="decimal-pad"
              />
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}>
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.createButton,
                  (!newProductName.trim() || !newTargetPrice) && styles.createButtonDisabled,
                ]}
                onPress={handleCreateAlert}
                disabled={!newProductName.trim() || !newTargetPrice || isCreating}>
                {isCreating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.createButtonText}>Créer</Text>
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
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.gray[600],
    lineHeight: 20,
  },
  infoTextLingala: {
    fontSize: 12,
    color: COLORS.gray[500],
    fontStyle: 'italic',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray[600],
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alertCardTriggered: {
    borderWidth: 2,
    borderColor: COLORS.primary[500],
    backgroundColor: '#f0fdf4',
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  alertInfo: {
    flex: 1,
  },
  alertProductName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  alertTarget: {
    fontSize: 14,
    color: COLORS.primary[600],
    fontWeight: '600',
  },
  triggeredBadge: {
    backgroundColor: COLORS.primary[100],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  triggeredBadgeText: {
    fontSize: 12,
    color: COLORS.primary[700],
    fontWeight: '600',
  },
  priceInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  currentPrice: {
    fontSize: 14,
    color: COLORS.gray[700],
  },
  storeText: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  alertActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  toggleButton: {
    backgroundColor: COLORS.primary[100],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  toggleButtonInactive: {
    backgroundColor: COLORS.gray[200],
  },
  toggleButtonText: {
    fontSize: 14,
    color: COLORS.primary[700],
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 20,
  },
  addButton: {
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
  addButtonText: {
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
  modalTitleLingala: {
    fontSize: 14,
    color: COLORS.gray[500],
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.gray[100],
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.gray[900],
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.gray[200],
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  createButton: {
    flex: 1,
    backgroundColor: COLORS.primary[500],
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: COLORS.gray[300],
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
