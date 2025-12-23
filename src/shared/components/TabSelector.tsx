// Simple Tab Selector Component
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {Colors, Typography, Spacing, BorderRadius, Shadows} from '@/shared/theme/theme';
import Icon from './Icon';

interface Tab {
  icon: string;
  label: string;
  value: string;
}

interface TabSelectorProps {
  tabs: Tab[];
  activeIndex: number;
  onTabPress: (index: number) => void;
}

export function TabSelector({tabs, activeIndex, onTabPress}: TabSelectorProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {tabs.map((tab, index) => {
          const isActive = activeIndex === index;
          return (
            <TouchableOpacity
              key={index}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => onTabPress(index)}
              activeOpacity={0.7}>
              <Icon
                name={tab.icon}
                size="sm"
                color={isActive ? Colors.white : Colors.primary}
              />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.xl,
    padding: 4,
    ...Shadows.sm,
  },
  scrollContent: {
    gap: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
    backgroundColor: 'transparent',
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primary,
  },
  tabLabelActive: {
    color: Colors.white,
    fontWeight: Typography.fontWeight.semiBold,
  },
});

export default TabSelector;
