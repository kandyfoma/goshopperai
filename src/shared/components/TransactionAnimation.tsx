// Transaction Animation Component - Smooth payment flow animations
import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import Svg, {
  Circle,
  Path,
  Rect,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  G,
  Text as SvgText,
} from 'react-native-svg';
import {Colors, Typography, Spacing} from '@/shared/theme/theme';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

interface TransactionAnimationProps {
  isVisible: boolean;
  transactionType: 'scan' | 'payment' | 'success' | 'processing';
  amount?: number;
  onComplete?: () => void;
}

export const TransactionAnimation: React.FC<TransactionAnimationProps> = ({
  isVisible,
  transactionType,
  amount,
  onComplete,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const moneyAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      // Entry animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Progress animation based on transaction type
      if (transactionType === 'processing') {
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }).start();

        // Pulse animation during processing
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }

      // Money flow animation
      if (transactionType === 'payment' && amount) {
        Animated.loop(
          Animated.timing(moneyAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          })
        ).start();
      }

      // Auto complete after animation
      if (transactionType === 'success') {
        setTimeout(() => {
          onComplete?.();
        }, 2000);
      }
    } else {
      // Exit animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, transactionType]);

  if (!isVisible) return null;

  const renderScanAnimation = () => (
    <Svg width={200} height={200} viewBox="0 0 200 200">
      <Defs>
        <SvgGradient id="scanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#4facfe" />
          <Stop offset="100%" stopColor="#00f2fe" />
        </SvgGradient>
      </Defs>
      
      {/* Phone outline */}
      <Rect
        x="50"
        y="30"
        width="100"
        height="140"
        rx="15"
        fill="none"
        stroke="url(#scanGradient)"
        strokeWidth="3"
      />
      
      {/* Animated scan lines */}
      {[0, 1, 2].map(i => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            opacity: progressAnim.interpolate({
              inputRange: [i * 0.3, (i + 1) * 0.3],
              outputRange: [0, 1],
              extrapolate: 'clamp',
            }),
          }}>
          <Rect
            x="60"
            y={60 + i * 30}
            width="80"
            height="3"
            fill="url(#scanGradient)"
            opacity="0.8"
          />
        </Animated.View>
      ))}
    </Svg>
  );

  const renderPaymentAnimation = () => (
    <Svg width={250} height={200} viewBox="0 0 250 200">
      <Defs>
        <SvgGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#667eea" />
          <Stop offset="100%" stopColor="#764ba2" />
        </SvgGradient>
        <SvgGradient id="phoneGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#ffeaa7" />
          <Stop offset="100%" stopColor="#fab1a0" />
        </SvgGradient>
      </Defs>

      {/* Credit card */}
      <Rect
        x="30"
        y="80"
        width="100"
        height="60"
        rx="8"
        fill="url(#cardGradient)"
      />
      <Rect x="40" y="100" width="80" height="4" fill="rgba(255,255,255,0.8)" />
      <Rect x="40" y="110" width="50" height="3" fill="rgba(255,255,255,0.6)" />

      {/* Phone */}
      <Rect
        x="150"
        y="60"
        width="70"
        height="100"
        rx="12"
        fill="url(#phoneGradient)"
      />

      {/* Animated money flow */}
      {[0, 1, 2].map(i => (
        <Animated.View
          key={i}
          style={{
            opacity: moneyAnim.interpolate({
              inputRange: [i * 0.3, (i + 1) * 0.3],
              outputRange: [0, 1],
              extrapolate: 'clamp',
            }),
            transform: [
              {
                translateX: moneyAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 50],
                }),
              },
            ],
          }}>
          <Circle
            cx={130 - i * 15}
            cy={110 + i * 10}
            r="6"
            fill="#27ae60"
          />
          <SvgText
            x={130 - i * 15}
            y={114 + i * 10}
            textAnchor="middle"
            fontSize="10"
            fill="#fff">
            $
          </SvgText>
        </Animated.View>
      ))}
    </Svg>
  );

  const renderSuccessAnimation = () => (
    <Svg width={150} height={150} viewBox="0 0 150 150">
      <Defs>
        <SvgGradient id="successGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#00b894" />
          <Stop offset="100%" stopColor="#55efc4" />
        </SvgGradient>
      </Defs>

      {/* Success circle */}
      <Circle
        cx="75"
        cy="75"
        r="60"
        fill="url(#successGradient)"
      />

      {/* Checkmark */}
      <Path
        d="M50,75 L65,90 L100,55"
        stroke="#fff"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  const renderProcessingAnimation = () => (
    <Svg width={120} height={120} viewBox="0 0 120 120">
      <Defs>
        <SvgGradient id="processingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#fd79a8" />
          <Stop offset="100%" stopColor="#fdcb6e" />
        </SvgGradient>
      </Defs>

      {/* Processing circle */}
      <Circle
        cx="60"
        cy="60"
        r="50"
        fill="none"
        stroke="url(#processingGradient)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray="50 200"
        transform="rotate(-90 60 60)"
      />

      {/* Central dot */}
      <Circle cx="60" cy="60" r="8" fill="url(#processingGradient)" />
    </Svg>
  );

  const getTitle = () => {
    switch (transactionType) {
      case 'scan':
        return 'Analyse du reçu...';
      case 'payment':
        return 'Traitement du paiement...';
      case 'success':
        return 'Transaction réussie !';
      case 'processing':
        return 'Traitement en cours...';
      default:
        return '';
    }
  };

  const getSubtitle = () => {
    switch (transactionType) {
      case 'scan':
        return 'Notre IA analyse votre reçu';
      case 'payment':
        return amount ? `Montant: ${amount.toFixed(2)} FC` : 'Vérification du paiement';
      case 'success':
        return 'Votre transaction a été complétée';
      case 'processing':
        return 'Veuillez patienter...';
      default:
        return '';
    }
  };

  const renderAnimation = () => {
    switch (transactionType) {
      case 'scan':
        return renderScanAnimation();
      case 'payment':
        return renderPaymentAnimation();
      case 'success':
        return renderSuccessAnimation();
      case 'processing':
        return renderProcessingAnimation();
      default:
        return null;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            {scale: scaleAnim},
            {scale: pulseAnim},
          ],
        },
      ]}>
      <View style={styles.content}>
        <View style={styles.animationContainer}>
          {renderAnimation()}
        </View>
        
        <Text style={styles.title}>{getTitle()}</Text>
        <Text style={styles.subtitle}>{getSubtitle()}</Text>
        
        {transactionType === 'processing' && (
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressBar,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  content: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: Spacing['2xl'],
    alignItems: 'center',
    minWidth: SCREEN_WIDTH * 0.8,
    maxWidth: 320,
  },
  animationContainer: {
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  progressContainer: {
    width: '100%',
    marginTop: Spacing.md,
  },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.background.secondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
});