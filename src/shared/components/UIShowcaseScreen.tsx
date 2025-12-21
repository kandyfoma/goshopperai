// Usage Examples for Enhanced UI Components
import React, {useState} from 'react';
import {View, StyleSheet, TouchableOpacity, Text} from 'react-native';
import {WelcomeScreenModern} from '@/features/onboarding/screens/WelcomeScreenModern';
import {TransactionAnimation} from '@/shared/components/TransactionAnimation';
import {Colors, Typography, Spacing, BorderRadius, Shadows} from '@/shared/theme/theme';

export const UIShowcaseScreen: React.FC = () => {
  const [showWelcome, setShowWelcome] = useState(false);
  const [showTransaction, setShowTransaction] = useState(false);
  const [transactionType, setTransactionType] = useState<'scan' | 'payment' | 'success' | 'processing'>('scan');

  const handleShowWelcome = () => {
    setShowWelcome(true);
  };

  const handleShowTransaction = (type: 'scan' | 'payment' | 'success' | 'processing') => {
    setTransactionType(type);
    setShowTransaction(true);
  };

  const handleTransactionComplete = () => {
    setShowTransaction(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enhanced UI Components</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Welcome Screen with SVG Animations</Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={handleShowWelcome}
        >
          <Text style={styles.buttonText}>Show Modern Welcome Screen</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transaction Animations</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.button, styles.smallButton]}
            onPress={() => handleShowTransaction('scan')}
          >
            <Text style={styles.buttonText}>Scan</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.smallButton]}
            onPress={() => handleShowTransaction('payment')}
          >
            <Text style={styles.buttonText}>Payment</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.button, styles.smallButton]}
            onPress={() => handleShowTransaction('processing')}
          >
            <Text style={styles.buttonText}>Processing</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.smallButton]}
            onPress={() => handleShowTransaction('success')}
          >
            <Text style={styles.buttonText}>Success</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modern Welcome Screen Modal */}
      {showWelcome && (
        <View style={StyleSheet.absoluteFillObject}>
          <WelcomeScreenModern />
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setShowWelcome(false)}
          >
            <Text style={styles.closeButtonText}>Close Demo</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Transaction Animation */}
      <TransactionAnimation
        isVisible={showTransaction}
        transactionType={transactionType}
        amount={transactionType === 'payment' ? 1250.50 : undefined}
        onComplete={handleTransactionComplete}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing['2xl'],
  },
  section: {
    marginBottom: Spacing['2xl'],
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  smallButton: {
    flex: 1,
    marginHorizontal: Spacing.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.white,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    zIndex: 1000,
  },
  closeButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
});