// Reusable Back Button Component
import React from 'react';
import {TouchableOpacity, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Icon from './Icon';
import {Colors, BorderRadius} from '@/shared/theme/theme';

interface BackButtonProps {
  onPress?: () => void;
  color?: string;
  style?: any;
}

export function BackButton({onPress, color = Colors.text.primary, style}: BackButtonProps) {
  const navigation = useNavigation();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.backButton, style]}
      onPress={handlePress}
      hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
      <Icon name="chevron-left" size="md" color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});
