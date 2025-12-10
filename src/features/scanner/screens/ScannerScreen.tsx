// Scanner Screen - Capture and process receipts
import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList, Receipt} from '@/shared/types';
import {useSubscription} from '@/shared/contexts';
import {cameraService, imageCompressionService} from '@/shared/services/camera';
import {geminiService} from '@/shared/services/ai/gemini';
import {COLORS} from '@/shared/utils/constants';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type ScanState = 'idle' | 'capturing' | 'processing' | 'success' | 'error';

export function ScannerScreen() {
  const navigation = useNavigation<NavigationProp>();
  const {canScan, recordScan} = useSubscription();
  
  const [state, setState] = useState<ScanState>('idle');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const handleCapture = useCallback(async () => {
    // Check if user can scan
    if (!canScan) {
      navigation.navigate('Subscription');
      return;
    }

    setState('capturing');
    setError(null);

    const result = await cameraService.captureFromCamera();

    if (!result.success || !result.uri) {
      setState('idle');
      if (result.error && result.error !== 'Capture annulée') {
        setError(result.error);
      }
      return;
    }

    setImageUri(result.uri);
    await processImage(result.uri);
  }, [canScan, navigation]);

  const handleGallery = useCallback(async () => {
    if (!canScan) {
      navigation.navigate('Subscription');
      return;
    }

    setState('capturing');
    setError(null);

    const result = await cameraService.selectFromGallery();

    if (!result.success || !result.uri) {
      setState('idle');
      if (result.error && result.error !== 'Capture annulée') {
        setError(result.error);
      }
      return;
    }

    setImageUri(result.uri);
    await processImage(result.uri);
  }, [canScan, navigation]);

  const processImage = async (uri: string) => {
    setState('processing');

    try {
      // Compress image before sending to AI
      const base64 = await imageCompressionService.compressToBase64(uri);

      // Parse receipt with Gemini AI
      const result = await geminiService.parseReceipt(base64, 'current-user');

      if (result.success && result.receipt) {
        // Record scan usage
        const recorded = await recordScan();
        if (!recorded) {
          throw new Error('Failed to record scan');
        }

        setReceipt(result.receipt);
        setState('success');
      } else {
        throw new Error(result.error || 'Échec de l\'analyse');
      }
    } catch (err: any) {
      console.error('Processing error:', err);
      setError(err.message || 'Une erreur est survenue');
      setState('error');
    }
  };

  const handleRetry = () => {
    setState('idle');
    setImageUri(null);
    setError(null);
    setReceipt(null);
  };

  const handleViewResults = () => {
    if (receipt) {
      navigation.navigate('ReceiptDetail', {receiptId: receipt.id});
    }
  };

  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scanner</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {state === 'idle' && (
          <View style={styles.idleContainer}>
            <Text style={styles.idleIcon}>📸</Text>
            <Text style={styles.idleTitle}>Scannez votre facture</Text>
            <Text style={styles.idleDesc}>
              Prenez en photo votre ticket de caisse ou sélectionnez une image
            </Text>

            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={styles.captureButton}
                onPress={handleCapture}
                activeOpacity={0.8}>
                <Text style={styles.captureIcon}>📷</Text>
                <Text style={styles.captureText}>Prendre une photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.galleryButton}
                onPress={handleGallery}
                activeOpacity={0.8}>
                <Text style={styles.galleryIcon}>🖼️</Text>
                <Text style={styles.galleryText}>Galerie</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {state === 'capturing' && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary[500]} />
            <Text style={styles.loadingText}>Capture en cours...</Text>
          </View>
        )}

        {state === 'processing' && (
          <View style={styles.loadingContainer}>
            {imageUri && (
              <Image source={{uri: imageUri}} style={styles.previewImage} />
            )}
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.processingText}>
                Analyse en cours...
              </Text>
              <Text style={styles.processingSubtext}>
                L'IA extrait les informations de votre facture
              </Text>
            </View>
          </View>
        )}

        {state === 'success' && receipt && (
          <View style={styles.successContainer}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.successTitle}>Facture analysée !</Text>
            
            <View style={styles.summaryCard}>
              <Text style={styles.storeName}>{receipt.storeName}</Text>
              <Text style={styles.itemCount}>
                {receipt.items.length} article{receipt.items.length > 1 ? 's' : ''} détecté{receipt.items.length > 1 ? 's' : ''}
              </Text>
              <Text style={styles.totalAmount}>
                Total: ${receipt.total.toFixed(2)}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.viewResultsButton}
              onPress={handleViewResults}
              activeOpacity={0.8}>
              <Text style={styles.viewResultsText}>
                Voir les détails & comparer
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.scanAnotherButton}
              onPress={handleRetry}
              activeOpacity={0.8}>
              <Text style={styles.scanAnotherText}>
                Scanner une autre facture
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {state === 'error' && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>❌</Text>
            <Text style={styles.errorTitle}>Échec de l'analyse</Text>
            <Text style={styles.errorDesc}>{error}</Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetry}
              activeOpacity={0.8}>
              <Text style={styles.retryText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 20,
    color: COLORS.gray[600],
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  idleContainer: {
    alignItems: 'center',
  },
  idleIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  idleTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 8,
  },
  idleDesc: {
    fontSize: 16,
    color: COLORS.gray[500],
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  buttonsContainer: {
    width: '100%',
  },
  captureButton: {
    backgroundColor: COLORS.primary[500],
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  captureIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  captureText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  galleryButton: {
    backgroundColor: COLORS.gray[100],
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  galleryText: {
    color: COLORS.gray[700],
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray[600],
  },
  previewImage: {
    width: 300,
    height: 400,
    borderRadius: 12,
    marginBottom: 20,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  processingSubtext: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  successContainer: {
    alignItems: 'center',
    width: '100%',
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 16,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  storeName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray[900],
    marginBottom: 8,
  },
  itemCount: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginBottom: 12,
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary[500],
  },
  viewResultsButton: {
    backgroundColor: COLORS.primary[500],
    borderRadius: 12,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewResultsText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  scanAnotherButton: {
    padding: 16,
  },
  scanAnotherText: {
    color: COLORS.gray[600],
    fontSize: 14,
  },
  errorContainer: {
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 8,
  },
  errorDesc: {
    fontSize: 16,
    color: COLORS.gray[500],
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: COLORS.primary[500],
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
