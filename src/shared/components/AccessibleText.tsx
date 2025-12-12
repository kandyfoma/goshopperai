/**
 * AccessibleText Component
 * 
 * A Text component that automatically respects system accessibility settings
 * including Dynamic Type (font scaling) and Bold Text preferences.
 */

import React from 'react';
import {Text, TextStyle, TextProps, StyleSheet} from 'react-native';
import {useDynamicType} from '../hooks/useDynamicType';
import {Colors, Typography} from '../theme/theme';

type FontSize = 'xs' | 'sm' | 'md' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
type FontWeight = 'regular' | 'medium' | 'semiBold' | 'bold' | 'extraBold';

interface AccessibleTextProps extends TextProps {
  children: React.ReactNode;
  size?: FontSize;
  weight?: FontWeight;
  color?: string;
  align?: 'left' | 'center' | 'right';
  maxFontSizeMultiplier?: number;
  allowFontScaling?: boolean;
}

const WEIGHT_MAP: Record<FontWeight, '400' | '500' | '600' | '700' | '800'> = {
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
  extraBold: '800',
};

export const AccessibleText: React.FC<AccessibleTextProps> = ({
  children,
  size = 'base',
  weight = 'regular',
  color = Colors.text.primary,
  align = 'left',
  maxFontSizeMultiplier = 1.5,
  allowFontScaling = true,
  style,
  ...props
}) => {
  const {fontSizes, getFontWeight} = useDynamicType();

  const dynamicStyle: TextStyle = {
    fontSize: fontSizes[size],
    fontWeight: getFontWeight(WEIGHT_MAP[weight]),
    color,
    textAlign: align,
    lineHeight: fontSizes[size] * Typography.lineHeight.normal,
  };

  return (
    <Text
      style={[dynamicStyle, style]}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      allowFontScaling={allowFontScaling}
      {...props}
    >
      {children}
    </Text>
  );
};

// Pre-styled variants for common use cases

interface TypographyVariantProps extends Omit<AccessibleTextProps, 'size' | 'weight'> {}

export const Heading1: React.FC<TypographyVariantProps> = (props) => (
  <AccessibleText size="4xl" weight="bold" {...props} />
);

export const Heading2: React.FC<TypographyVariantProps> = (props) => (
  <AccessibleText size="3xl" weight="bold" {...props} />
);

export const Heading3: React.FC<TypographyVariantProps> = (props) => (
  <AccessibleText size="2xl" weight="semiBold" {...props} />
);

export const Title: React.FC<TypographyVariantProps> = (props) => (
  <AccessibleText size="xl" weight="semiBold" {...props} />
);

export const Subtitle: React.FC<TypographyVariantProps> = (props) => (
  <AccessibleText size="lg" weight="medium" {...props} />
);

export const Body: React.FC<TypographyVariantProps> = (props) => (
  <AccessibleText size="base" weight="regular" {...props} />
);

export const BodySmall: React.FC<TypographyVariantProps> = (props) => (
  <AccessibleText size="sm" weight="regular" {...props} />
);

export const Caption: React.FC<TypographyVariantProps> = (props) => (
  <AccessibleText 
    size="xs" 
    weight="regular" 
    color={Colors.text.tertiary}
    {...props} 
  />
);

export const Label: React.FC<TypographyVariantProps> = (props) => (
  <AccessibleText size="sm" weight="medium" {...props} />
);

export const ButtonText: React.FC<TypographyVariantProps> = (props) => (
  <AccessibleText size="base" weight="semiBold" {...props} />
);

const styles = StyleSheet.create({});

export default AccessibleText;
