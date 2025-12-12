// Multi-Photo Scanner Screen - For long receipts
// Allows users to capture multiple photos of a single receipt
import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '@/shared/types';
import {useSubscription, useAuth} from '@/shared/contexts';
import {useToast} from '@/shared/contexts';
import {cameraService, imageCompressionService} from '@/shared/services/camera';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from '@/shared/theme/theme';
import {Spinner} from '@/shared/components';
import functions from '@react-native-firebase/functions';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface CapturedPhoto {
  id: string;
  uri: string;
  base64?: string;
  status: 'pending' | 'ready' | 'processing' | 'done';
}

type ScanState = 'capturing' | 'reviewing' | 'processing' | 'success' | 'error';

const MAX_PHOTOS = 5;

export function MultiPhotoScannerScreen() {
  const navigation = useNavigation<NavigationProp>();
  const {user} = useAuth();
  const {canScan, recordScan} = useSubscription();
  const {showToast} = useToast();
  const insets = useSafeAreaInsets();

  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [state, setState] = useState<ScanState>('capturing');
  const [processingIndex, setProcessingIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Add a new photo
  const handleAddPhoto = useCallback(
    async (fromGallery: boolean = false) => {
      if (photos.length >= MAX_PHOTOS) {
        showToast(`Maximum ${MAX_PHOTOS} photos par facture`, 'warning');
        return;
      }

      const result = fromGallery
        ? await cameraService.selectFromGallery()
        : await cameraService.captureFromCamera();

      if (!result.success || !result.uri) {
        if (result.error && result.error !== 'Capture annulée') {
          setError(result.error);
        }
        return;
      }

      // Compress and convert to base64
      const base64 = await imageCompressionService.compressToBase64(result.uri);

      const newPhoto: CapturedPhoto = {
        id: `photo_${Date.now()}`,
        uri: result.uri,
        base64,
        status: 'ready',
      };

      setPhotos(prev => [...prev, newPhoto]);
      setState('reviewing');
    },
    [photos.length],
  );

  // Remove a photo
  const handleRemovePhoto = useCallback(
    (photoId: string) => {
      setPhotos(prev => prev.filter(p => p.id !== photoId));
      if (photos.length <= 1) {
        setState('capturing');
      }
    },
    [photos.length],
  );

  // Retake a specific photo
  const handleRetakePhoto = useCallback(async (photoId: string) => {
    const result = await cameraService.captureFromCamera();

    if (!result.success || !result.uri) {
      return;
    }

    const base64 = await imageCompressionService.compressToBase64(result.uri);

    setPhotos(prev =>
      prev.map(p =>
        p.id === photoId
          ? {...p, uri: result.uri!, base64, status: 'ready'}
          : p,
      ),
    );
  }, []);

  // Process all photos
  const handleProcessAll = useCallback(async () => {
    if (!canScan) {
      Alert.alert(
        'Limite atteinte',
        'Passez à Premium pour continuer à scanner.',
        [
          {text: 'Annuler', style: 'cancel'},
          {
            text: 'Voir Premium',
            onPress: () => navigation.navigate('Subscription'),
          },
        ],
      );
      return;
    }

    if (photos.length === 0) {
      showToast('Prenez au moins une photo', 'error');
      return;
    }

    setState('processing');
    setError(null);

    try {
      // Get all base64 images
      const images = photos.filter(p => p.base64).map(p => p.base64!);

      // Call V2 function for multi-image processing
      const parseReceiptV2 = functions().httpsCallable('parseReceiptV2');

      setProcessingIndex(0);

      const response = await parseReceiptV2({
        images,
        mimeType: 'image/jpeg',
      });

      const result = response.data as {
        success: boolean;
        receiptId?: string;
        receipt?: any;
        pageCount?: number;
        error?: string;
      };

      if (result.success && result.receiptId) {
        // Record scan usage
        await recordScan();

        setState('success');

        // Navigate to receipt detail
        setTimeout(() => {
          navigation.replace('ReceiptDetail', {
            receiptId: result.receiptId!,
            receipt: result.receipt,
          });
        }, 1500);
      } else {
        throw new Error(result.error || 'Échec du traitement');
      }
    } catch (err: any) {
      console.error('Multi-photo processing error:', err);
      setState('error');
      setError(err.message || 'Une erreur est survenue');
    }
  }, [photos, canScan, navigation, recordScan]);

  // Reset and start over
  const handleReset = useCallback(() => {
    setPhotos([]);
    setState('capturing');
    setError(null);
  }, []);

  // Render photo thumbnail
  const renderPhotoThumbnail = (photo: CapturedPhoto, index: number) => (
    <View key={photo.id} style={styles.thumbnailContainer}>
      <Image source={{uri: photo.uri}} style={styles.thumbnail} />
      <View style={styles.thumbnailBadge}>
        <Text style={styles.thumbnailBadgeText}>{index + 1}</Text>
      </View>
      {state === 'reviewing' && (
        <View style={styles.thumbnailActions}>
          <TouchableOpacity
            style={styles.thumbnailAction}
            onPress={() => handleRetakePhoto(photo.id)}>
            <Text style={styles.thumbnailActionText}>🔄</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.thumbnailAction, styles.thumbnailActionDelete]}
            onPress={() => handleRemovePhoto(photo.id)}>
            <Text style={styles.thumbnailActionText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}
      {state === 'processing' && (
        <View style={styles.thumbnailOverlay}>
          {index < processingIndex ? (
            <Text style={styles.thumbnailStatusDone}>✓</Text>
          ) : index === processingIndex ? (
            <Spinner size="small" color="#ffffff" />
          ) : (
            <Text style={styles.thumbnailStatusPending}>○</Text>
          )}
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <StatusBar />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Instructions */}
        <View style={styles.instructions}>
          {state === 'capturing' && photos.length === 0 && (
            <>
              <Text style={styles.instructionEmoji}>📄</Text>
              <Text style={styles.instructionTitle}>Facture trop longue?</Text>
              <Text style={styles.instructionText}>
                Prenez plusieurs photos de haut en bas.
                {'\n'}Nous les fusionnerons automatiquement!
              </Text>
              <Text style={styles.instructionTextLingala}>
                Zwa bafoto ebele, tokosangisa yango!
              </Text>
            </>
          )}
          {state === 'reviewing' && (
            <>
              <Text style={styles.instructionTitle}>
                {photos.length} photo{photos.length > 1 ? 's' : ''} capturée
                {photos.length > 1 ? 's' : ''}
              </Text>
              <Text style={styles.instructionText}>
                Ajoutez plus ou traitez maintenant
              </Text>
            </>
          )}
          {state === 'processing' && (
            <>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.instructionTitle}>Analyse en cours...</Text>
              <Text style={styles.instructionText}>
                Traitement de {photos.length} photo
                {photos.length > 1 ? 's' : ''}
              </Text>
            </>
          )}
          {state === 'success' && (
            <>
              <Text style={styles.successEmoji}>✅</Text>
              <Text style={styles.instructionTitle}>Succès!</Text>
              <Text style={styles.instructionText}>
                Facture analysée avec succès
              </Text>
            </>
          )}
          {state === 'error' && (
            <>
              <Text style={styles.errorEmoji}>❌</Text>
              <Text style={styles.instructionTitle}>Erreur</Text>
              <Text style={styles.errorText}>{error}</Text>
            </>
          )}
        </View>

        {/* Photo Thumbnails */}
        {photos.length > 0 && (
          <ScrollView
            horizontal
            style={styles.thumbnailsScroll}
            contentContainerStyle={styles.thumbnailsContainer}
            showsHorizontalScrollIndicator={false}>
            {photos.map((photo, index) => renderPhotoThumbnail(photo, index))}

            {/* Add More Button */}
            {state === 'reviewing' && photos.length < MAX_PHOTOS && (
              <TouchableOpacity
                style={styles.addMoreButton}
                onPress={() => handleAddPhoto(false)}>
                <Text style={styles.addMoreIcon}>+</Text>
                <Text style={styles.addMoreText}>Ajouter</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {(state === 'capturing' || state === 'reviewing') && (
            <>
              {photos.length === 0 ? (
                <>
                  <TouchableOpacity
                    style={styles.captureButton}
                    onPress={() => handleAddPhoto(false)}>
                    <Text style={styles.captureButtonIcon}>📸</Text>
                    <Text style={styles.captureButtonText}>
                      Prendre Photo 1
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.galleryButton}
                    onPress={() => handleAddPhoto(true)}>
                    <Text style={styles.galleryButtonText}>
                      📁 Choisir de la galerie
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.processButton}
                    onPress={handleProcessAll}>
                    <Text style={styles.processButtonIcon}>✨</Text>
                    <Text style={styles.processButtonText}>
                      Analyser {photos.length} photo
                      {photos.length > 1 ? 's' : ''}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.secondaryActions}>
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={() => handleAddPhoto(false)}>
                      <Text style={styles.secondaryButtonText}>📸 + Photo</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={() => handleAddPhoto(true)}>
                      <Text style={styles.secondaryButtonText}>📁 Galerie</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </>
          )}

          {state === 'error' && (
            <TouchableOpacity style={styles.retryButton} onPress={handleReset}>
              <Text style={styles.retryButtonText}>🔄 Réessayer</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Tips */}
      {state === 'capturing' && photos.length === 0 && (
        <View style={styles.tips}>
          <Text style={styles.tipsTitle}>💡 Conseils</Text>
          <Text style={styles.tipItem}>
            • Commencez par le haut de la facture
          </Text>
          <Text style={styles.tipItem}>• Incluez un peu de chevauchement</Text>
          <Text style={styles.tipItem}>
            • Bonne lumière = meilleur résultat
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollContent: {
    flexGrow: 1,
  },
  instructions: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  instructionEmoji: {
    fontSize: Typography.fontSize.xl,
    marginBottom: Spacing.md,
  },
  instructionTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  instructionText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  instructionTextLingala: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: Spacing.sm,
  },
  successEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
  thumbnailsScroll: {
    maxHeight: 140,
    marginBottom: 16,
  },
  thumbnailsContainer: {
    paddingHorizontal: 16,
    gap: 12,
    flexDirection: 'row',
  },
  thumbnailContainer: {
    position: 'relative',
    width: 100,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.background.secondary,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbnailBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  thumbnailActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  thumbnailAction: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
  },
  thumbnailActionDelete: {
    backgroundColor: 'rgba(239,68,68,0.8)',
  },
  thumbnailActionText: {
    fontSize: 16,
    color: '#ffffff',
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailStatusDone: {
    fontSize: 32,
    color: '#22c55e',
  },
  thumbnailStatusPending: {
    fontSize: 24,
    color: 'rgba(255,255,255,0.5)',
  },
  addMoreButton: {
    width: 100,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.primary,
    backgroundColor: Colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addMoreIcon: {
    fontSize: 32,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  addMoreText: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 4,
  },
  actions: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  captureButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  captureButtonIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  captureButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  galleryButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border.light,
  },
  galleryButtonText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  processButton: {
    flexDirection: 'row',
    backgroundColor: '#22c55e',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#22c55e',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  processButtonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  processButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border.light,
  },
  secondaryButtonText: {
    fontSize: 14,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  tips: {
    marginHorizontal: 24,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  tipItem: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 6,
  },
});
