/**
 * AnimatedView Component
 * 
 * Wrapper components for common animations
 */

import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle, Easing } from 'react-native';
import { Animations } from '../theme/theme';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: ViewStyle;
}

// Fade in animation
export const FadeIn: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  duration = Animations.duration.normal,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[{ opacity }, style]}>
      {children}
    </Animated.View>
  );
};

interface SlideInProps extends FadeInProps {
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
}

// Slide in animation
export const SlideIn: React.FC<SlideInProps> = ({
  children,
  delay = 0,
  duration = Animations.duration.normal,
  direction = 'up',
  distance = 20,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(
    direction === 'up' || direction === 'left' ? distance : -distance
  )).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translate, {
        toValue: 0,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const transform = direction === 'up' || direction === 'down'
    ? [{ translateY: translate }]
    : [{ translateX: translate }];

  return (
    <Animated.View style={[{ opacity, transform }, style]}>
      {children}
    </Animated.View>
  );
};

interface ScaleInProps extends FadeInProps {
  initialScale?: number;
}

// Scale in animation
export const ScaleIn: React.FC<ScaleInProps> = ({
  children,
  delay = 0,
  duration = Animations.duration.normal,
  initialScale = 0.9,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(initialScale)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        delay,
        ...Animations.spring.gentle,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity, transform: [{ scale }] }, style]}>
      {children}
    </Animated.View>
  );
};

interface StaggerProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  duration?: number;
  style?: ViewStyle;
}

// Stagger animation for lists
export const Stagger: React.FC<StaggerProps> = ({
  children,
  staggerDelay = 50,
  duration = Animations.duration.normal,
  style,
}) => {
  return (
    <>
      {React.Children.map(children, (child, index) => (
        <SlideIn delay={index * staggerDelay} duration={duration} style={style}>
          {child}
        </SlideIn>
      ))}
    </>
  );
};

interface PulseProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

// Pulse animation (for loading states, attention)
export const Pulse: React.FC<PulseProps> = ({ children, style }) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.05,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      {children}
    </Animated.View>
  );
};

interface ShakeProps {
  children: React.ReactNode;
  trigger?: boolean;
  style?: ViewStyle;
}

// Shake animation (for errors)
export const Shake: React.FC<ShakeProps> = ({ children, trigger, style }) => {
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (trigger) {
      Animated.sequence([
        Animated.timing(translateX, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [trigger]);

  return (
    <Animated.View style={[{ transform: [{ translateX }] }, style]}>
      {children}
    </Animated.View>
  );
};

// Bounce animation (for buttons, CTAs)
export const Bounce: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  style,
}) => {
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      delay,
      tension: 50,
      friction: 5,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      {children}
    </Animated.View>
  );
};

export default {
  FadeIn,
  SlideIn,
  ScaleIn,
  Stagger,
  Pulse,
  Shake,
  Bounce,
};
