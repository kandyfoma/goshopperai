// Global Scan Progress Banner - Shows scan progress across the app
// Like Facebook/Instagram upload progress indicator
import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Icon} from '@/shared/components';
import {Colors, Typography, Spacing, Shadows} from '@/shared/theme/theme';
import {useScanProcessing} from '@/shared/contexts/ScanProcessingContext';

const {width} = Dimensions.get('window');

export function GlobalScanProgressBanner() {
  const insets = useSafeAreaInsets();
  const {state, isProcessing, dismiss} = useScanProcessing();
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  
  const isError = state.status === 'error';
  const isVisible = isProcessing || isError;
  
  // Show/hide animation
  useEffect(() => {
    if (isVisible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
      
      // Start pulse animation for the icon when processing
      if (isProcessing) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.3,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ).start();
        
        // Shimmer effect for progress bar
        Animated.loop(
          Animated.sequence([
            Animated.timing(shimmerAnim, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(shimmerAnim, {
              toValue: 0,
              duration: 1500,
              useNativeDriver: true,
            }),
          ])
        ).start();
      } else {
        pulseAnim.setValue(1);
        shimmerAnim.setValue(0);
      }
    } else {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      pulseAnim.stopAnimation();
      shimmerAnim.stopAnimation();
    }
  }, [isVisible, isProcessing, slideAnim, pulseAnim, shimmerAnim]);
  
  // Progress animation
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: state.progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [state.progress, progressAnim]);
  
  // Auto-dismiss error after 5 seconds
  useEffect(() => {
    if (isError) {
      const timer = setTimeout(() => {
        dismiss();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isError, dismiss]);
  
  if (!isVisible) {
    return null;
  }
  
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });
  
  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });
  
  // Use warm cream/beige gradient like tab bar, error stays red
  const gradientColors = isError 
    ? ['#DC3545', '#C82333'] 
    : ['#FDF0D5', '#F5E6C3']; // Match tab bar colors
  
  const iconName = isError ? 'alert-circle' : 'camera';
  const iconColor = isError ? Colors.white : '#780000'; // Keep camera red
  const title = isError ? 'Erreur d\'analyse' : 'Analyse en cours...';
  const titleColor = isError ? Colors.white : '#003049'; // Dark blue for contrast
  const messageColor = isError ? 'rgba(255, 255, 255, 0.7)' : '#669BBC'; // Cosmos blue
  
  // Dynamic message based on progress
  const getProgressMessage = () => {
    if (isError) return state.message || 'Veuillez réessayer';
    
    const progress = state.progress;
    if (progress <= 20) return 'Préparation de l\'analyse...';
    if (progress <= 40) return 'Compression et optimisation...';
    if (progress <= 60) return 'Extraction des données...';
    if (progress <= 80) return 'Vérification des informations...';
    if (progress <= 95) return 'Finalisation...';
    return 'Presque terminé !';
  };
  
  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{translateY: slideAnim}],
          paddingTop: insets.top + Spacing.xs,
        },
      ]}>
      <LinearGradient
        colors={gradientColors}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.gradientBackground}>
        <View style={styles.content}>
          {/* Animated Icon */}
          <Animated.View 
            style={[
              styles.iconContainer, 
              {
                transform: [{scale: pulseAnim}],
                backgroundColor: isError ? 'rgba(255, 255, 255, 0.2)' : 'rgba(120, 0, 0, 0.1)',
              }
            ]}>
            <Icon name={iconName} size="sm" color={iconColor} />
          </Animated.View>
          
          {/* Text */}
          <View style={styles.textContainer}>
            <Text style={[styles.title, {color: titleColor}]}>
              {title}
            </Text>
            <Text style={[styles.message, {color: messageColor}]} numberOfLines={2}>
              {getProgressMessage()}
            </Text>
          </View>
          
          {/* Progress percentage or dismiss button */}
          {isError ? (
            <TouchableOpacity style={styles.dismissButton} onPress={dismiss}>
              <Icon name="x" size="sm" color={Colors.white} />
            </TouchableOpacity>
          ) : (
            <View style={[styles.progressBadge, {backgroundColor: 'rgba(120, 0, 0, 0.15)'}]}>
              <Text style={[styles.progressText, {color: '#780000'}]}>{Math.round(state.progress)}%</Text>
            </View>
          )}
        </View>
        
        {/* Progress bar (only show when processing) */}
        {isProcessing && (
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarBg, {backgroundColor: 'rgba(102, 155, 188, 0.2)'}]} />
            <Animated.View 
              style={[styles.progressBar, {width: progressWidth}]} 
            >
              <LinearGradient
                colors={['#780000', '#C1121F']} // Red gradient for progress
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={StyleSheet.absoluteFill}
              >
                {/* Shimmer effect overlay */}
                <Animated.View
                  style={[
                    styles.shimmerOverlay,
                    {
                      transform: [{translateX: shimmerTranslate}],
                    },
                  ]}
                />
              </LinearGradient>
            </Animated.View>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    zIndex: 9999,
    ...Shadows.lg,
  },
  gradientBackground: {
    paddingVertical: Spacing.sm,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
  },
  message: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    marginTop: 2,
  },
  progressBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 100,
  },
  progressText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
  },
  dismissButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarContainer: {
    height: 3,
    borderRadius: 8,
    marginTop: Spacing.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBarBg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: -50,
    right: -50,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
    width: 50,
  },
});
