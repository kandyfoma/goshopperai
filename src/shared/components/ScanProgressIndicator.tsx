// Scan Progress Indicator - Modern visual stepper for receipt processing
import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, Animated, Easing} from 'react-native';
import {Colors, Typography, Spacing, BorderRadius} from '@/shared/theme/theme';
import {Icon} from '@/shared/components';

export interface ScanProgressStep {
  key: string;
  title: string;
  subtitle: string;
  icon: string;
}

interface ScanProgressIndicatorProps {
  steps: ScanProgressStep[];
  currentStep: number; // 0-indexed
  isComplete?: boolean;
}

export function ScanProgressIndicator({
  steps,
  currentStep,
  isComplete = false,
}: ScanProgressIndicatorProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: currentStep,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [currentStep, progressAnim]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIconContainer}>
          <View style={styles.headerIconPulse}>
            <Icon name="scan" size="xl" color={Colors.white} />
          </View>
        </View>
        <Text style={styles.headerTitle}>Analyse en cours</Text>
        <Text style={styles.headerSubtitle}>
          Étape {Math.min(currentStep + 1, steps.length)} sur {steps.length}
        </Text>
      </View>

      {/* Progress card */}
      <View style={styles.card}>
        {/* Overall progress bar */}
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, steps.length - 1],
                  outputRange: ['5%', '100%'],
                  extrapolate: 'clamp',
                }),
              },
            ]}
          />
        </View>

        {/* Steps */}
        <View style={styles.stepsContainer}>
          {steps.map((step, index) => (
            <StepItem
              key={step.key}
              step={step}
              index={index}
              currentStep={currentStep}
              totalSteps={steps.length}
              isLast={index === steps.length - 1}
              isComplete={isComplete}
            />
          ))}
        </View>
      </View>

      {/* Current action indicator */}
      {currentStep < steps.length && (
        <View style={styles.currentActionContainer}>
          <LoadingDots />
          <Text style={styles.currentActionText}>
            {steps[currentStep]?.subtitle}
          </Text>
        </View>
      )}
    </View>
  );
}

// Animated loading dots
function LoadingDots() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      );
    };

    Animated.parallel([
      animateDot(dot1, 0),
      animateDot(dot2, 150),
      animateDot(dot3, 300),
    ]).start();
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.loadingDots}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View
          key={i}
          style={[
            styles.loadingDot,
            {
              opacity: dot.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 1],
              }),
              transform: [
                {
                  scale: dot.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1.2],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

interface StepItemProps {
  step: ScanProgressStep;
  index: number;
  currentStep: number;
  totalSteps: number;
  isLast: boolean;
  isComplete: boolean;
}

function StepItem({step, index, currentStep, isLast, isComplete}: StepItemProps) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0.5)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;

  const isCompleted = isComplete || index < currentStep;
  const isCurrent = index === currentStep && !isComplete;
  const isUpcoming = index > currentStep && !isComplete;

  useEffect(() => {
    if (isCompleted) {
      // Pop in the checkmark
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.timing(checkAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else if (isCurrent) {
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0.4);
      checkAnim.setValue(0);
    }
  }, [isCompleted, isCurrent, scaleAnim, opacityAnim, checkAnim]);

  return (
    <Animated.View
      style={[
        styles.stepItem,
        isCurrent && styles.stepItemCurrent,
        {opacity: opacityAnim},
      ]}>
      {/* Icon */}
      <Animated.View
        style={[
          styles.stepIconContainer,
          isCompleted && styles.stepIconCompleted,
          isCurrent && styles.stepIconCurrent,
          isUpcoming && styles.stepIconUpcoming,
          {transform: [{scale: scaleAnim}]},
        ]}>
        {isCompleted ? (
          <Animated.View style={{opacity: checkAnim}}>
            <Icon name="check" size="sm" color={Colors.white} />
          </Animated.View>
        ) : (
          <Icon
            name={step.icon}
            size="md"
            color={isCurrent ? Colors.white : Colors.text.tertiary}
          />
        )}
      </Animated.View>

      {/* Text content */}
      <View style={styles.stepTextContainer}>
        <Text
          style={[
            styles.stepTitle,
            isCompleted && styles.stepTitleCompleted,
            isCurrent && styles.stepTitleCurrent,
            isUpcoming && styles.stepTitleUpcoming,
          ]}>
          {step.title}
        </Text>
      </View>

      {/* Status indicator */}
      <View style={styles.stepStatus}>
        {isCompleted && (
          <Text style={styles.stepStatusCompleted}>✓</Text>
        )}
        {isCurrent && (
          <View style={styles.currentDot} />
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  
  // Header
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    shadowColor: Colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  headerIconPulse: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },

  // Card
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    width: '100%',
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },

  // Progress bar
  progressBarContainer: {
    height: 4,
    backgroundColor: Colors.border.light,
    borderRadius: 2,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },

  // Steps
  stepsContainer: {
    gap: Spacing.xs,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  stepItemCurrent: {
    backgroundColor: `${Colors.primary}10`,
  },

  // Step icon
  stepIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  stepIconCompleted: {
    backgroundColor: Colors.status.success,
  },
  stepIconCurrent: {
    backgroundColor: Colors.primary,
  },
  stepIconUpcoming: {
    backgroundColor: Colors.border.light,
  },

  // Step text
  stepTextContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
  },
  stepTitleCompleted: {
    color: Colors.status.success,
  },
  stepTitleCurrent: {
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.semiBold,
  },
  stepTitleUpcoming: {
    color: Colors.text.tertiary,
  },

  // Step status
  stepStatus: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepStatusCompleted: {
    fontSize: 14,
    color: Colors.status.success,
    fontWeight: Typography.fontWeight.bold,
  },
  currentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },

  // Current action
  currentActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.full,
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  currentActionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginLeft: Spacing.sm,
  },

  // Loading dots
  loadingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
});
