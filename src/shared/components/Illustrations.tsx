// Custom Illustration Components for Onboarding
import React from 'react';
import {View, StyleSheet} from 'react-native';
import Svg, {
  Circle,
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  G,
  Ellipse,
  Rect,
  Polygon,
} from 'react-native-svg';
import {Colors} from '@/shared/theme/theme';

interface IllustrationProps {
  width?: number;
  height?: number;
  primaryColor?: string;
  secondaryColor?: string;
}

// Scanner Feature Illustration
export const ScannerIllustration: React.FC<IllustrationProps> = ({
  width = 200,
  height = 200,
  primaryColor = Colors.primary,
  secondaryColor = Colors.secondary,
}) => (
  <Svg width={width} height={height} viewBox="0 0 200 200">
    <Defs>
      <SvgLinearGradient id="scannerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={primaryColor} stopOpacity="0.8" />
        <Stop offset="100%" stopColor={secondaryColor} stopOpacity="0.6" />
      </SvgLinearGradient>
    </Defs>
    
    {/* Phone mockup */}
    <Rect
      x="50"
      y="30"
      width="100"
      height="140"
      rx="15"
      ry="15"
      fill="url(#scannerGradient)"
      stroke={Colors.white}
      strokeWidth="2"
    />
    
    {/* Screen */}
    <Rect
      x="60"
      y="50"
      width="80"
      height="100"
      rx="5"
      ry="5"
      fill={Colors.white}
      opacity="0.9"
    />
    
    {/* Receipt in screen */}
    <Rect
      x="70"
      y="60"
      width="60"
      height="80"
      rx="3"
      ry="3"
      fill={Colors.background.secondary}
      stroke={Colors.border.light}
      strokeWidth="1"
    />
    
    {/* Receipt lines */}
    <G stroke={Colors.text.tertiary} strokeWidth="1" opacity="0.6">
      <Path d="M75 70 L125 70" />
      <Path d="M75 80 L120 80" />
      <Path d="M75 90 L115 90" />
      <Path d="M75 100 L125 100" />
      <Path d="M75 110 L110 110" />
      <Path d="M75 120 L125 120" />
    </G>
    
    {/* Scanning beam */}
    <Rect
      x="65"
      y="95"
      width="70"
      height="2"
      fill={Colors.status.success}
      opacity="0.8"
    />
    
    {/* Floating elements */}
    <Circle cx="35" cy="60" r="3" fill={Colors.status.success} opacity="0.7" />
    <Circle cx="170" cy="90" r="4" fill={primaryColor} opacity="0.5" />
    <Circle cx="40" cy="140" r="2" fill={secondaryColor} opacity="0.6" />
  </Svg>
);

// Payment Security Illustration  
export const PaymentIllustration: React.FC<IllustrationProps> = ({
  width = 200,
  height = 200,
  primaryColor = Colors.primary,
  secondaryColor = Colors.secondary,
}) => (
  <Svg width={width} height={height} viewBox="0 0 200 200">
    <Defs>
      <SvgLinearGradient id="paymentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={primaryColor} stopOpacity="0.8" />
        <Stop offset="100%" stopColor={secondaryColor} stopOpacity="0.6" />
      </SvgLinearGradient>
    </Defs>
    
    {/* Credit card */}
    <Rect
      x="40"
      y="70"
      width="120"
      height="75"
      rx="8"
      ry="8"
      fill="url(#paymentGradient)"
      stroke={Colors.white}
      strokeWidth="2"
    />
    
    {/* Card chip */}
    <Rect
      x="55"
      y="85"
      width="15"
      height="12"
      rx="2"
      ry="2"
      fill={Colors.white}
      opacity="0.9"
    />
    
    {/* Card number placeholder */}
    <G fill={Colors.white} opacity="0.8">
      <Circle cx="85" cy="105" r="2" />
      <Circle cx="95" cy="105" r="2" />
      <Circle cx="105" cy="105" r="2" />
      <Circle cx="115" cy="105" r="2" />
      
      <Circle cx="85" cy="115" r="2" />
      <Circle cx="95" cy="115" r="2" />
      <Circle cx="105" cy="115" r="2" />
      <Circle cx="115" cy="115" r="2" />
    </G>
    
    {/* Shield icon */}
    <Path
      d="M100 20 L110 25 L110 45 C110 55 105 60 100 65 C95 60 90 55 90 45 L90 25 Z"
      fill={Colors.status.success}
      stroke={Colors.white}
      strokeWidth="2"
    />
    
    {/* Checkmark in shield */}
    <Path
      d="M95 40 L98 43 L105 35"
      stroke={Colors.white}
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    
    {/* Security dots */}
    <Circle cx="30" cy="50" r="2" fill={Colors.status.success} opacity="0.6" />
    <Circle cx="170" cy="160" r="3" fill={primaryColor} opacity="0.5" />
    <Circle cx="25" cy="150" r="2" fill={secondaryColor} opacity="0.7" />
  </Svg>
);

// Delivery Illustration
export const DeliveryIllustration: React.FC<IllustrationProps> = ({
  width = 200,
  height = 200,
  primaryColor = Colors.primary,
  secondaryColor = Colors.secondary,
}) => (
  <Svg width={width} height={height} viewBox="0 0 200 200">
    <Defs>
      <SvgLinearGradient id="deliveryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={primaryColor} stopOpacity="0.8" />
        <Stop offset="100%" stopColor={secondaryColor} stopOpacity="0.6" />
      </SvgLinearGradient>
    </Defs>
    
    {/* Delivery truck */}
    <Rect
      x="40"
      y="90"
      width="80"
      height="40"
      rx="5"
      ry="5"
      fill="url(#deliveryGradient)"
      stroke={Colors.white}
      strokeWidth="2"
    />
    
    {/* Truck cabin */}
    <Rect
      x="100"
      y="80"
      width="30"
      height="50"
      rx="5"
      ry="5"
      fill="url(#deliveryGradient)"
      stroke={Colors.white}
      strokeWidth="2"
    />
    
    {/* Wheels */}
    <Circle cx="55" cy="140" r="8" fill={Colors.text.primary} />
    <Circle cx="55" cy="140" r="5" fill={Colors.white} />
    <Circle cx="115" cy="140" r="8" fill={Colors.text.primary} />
    <Circle cx="115" cy="140" r="5" fill={Colors.white} />
    
    {/* Package */}
    <Rect
      x="50"
      y="100"
      width="20"
      height="20"
      rx="2"
      ry="2"
      fill={Colors.white}
      stroke={Colors.border.medium}
      strokeWidth="1"
    />
    
    {/* Package tape */}
    <Path d="M50 110 L70 110" stroke={Colors.status.warning} strokeWidth="2" />
    <Path d="M60 100 L60 120" stroke={Colors.status.warning} strokeWidth="2" />
    
    {/* Speed lines */}
    <G stroke={Colors.text.tertiary} strokeWidth="2" opacity="0.5">
      <Path d="M20 75 L35 75" strokeLinecap="round" />
      <Path d="M15 90 L30 90" strokeLinecap="round" />
      <Path d="M25 105 L40 105" strokeLinecap="round" />
    </G>
    
    {/* House destination */}
    <Polygon
      points="150,60 165,45 180,60 180,80 150,80"
      fill={Colors.background.secondary}
      stroke={Colors.border.medium}
      strokeWidth="1"
    />
    
    {/* House roof */}
    <Polygon
      points="145,60 165,40 185,60"
      fill={secondaryColor}
      opacity="0.7"
    />
    
    {/* House door */}
    <Rect
      x="160"
      y="68"
      width="8"
      height="12"
      fill={primaryColor}
      opacity="0.8"
    />
    
    {/* Tracking path */}
    <Path
      d="M135 115 Q145 100 155 65"
      stroke={Colors.status.success}
      strokeWidth="2"
      fill="none"
      strokeDasharray="5,3"
      opacity="0.7"
    />
  </Svg>
);

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});