// Theme Context - Dark Mode Support
// Provides theme switching with system preference detection and persistence

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import {useColorScheme, Appearance} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {LightColors, DarkColors} from '../theme/theme';

// Theme types
export type ThemeMode = 'light' | 'dark' | 'system';
export type ActiveTheme = 'light' | 'dark';

// Storage key for persisting theme preference
const THEME_STORAGE_KEY = '@theme:mode';

// Theme context type
interface ThemeContextType {
  // Current resolved theme (always 'light' or 'dark')
  theme: ActiveTheme;
  // Legacy alias for theme
  mode: ActiveTheme;
  // User's theme preference ('light', 'dark', or 'system')
  themeMode: ThemeMode;
  // Whether dark mode is active
  isDark: boolean;
  isDarkMode: boolean;
  // Current colors based on theme
  colors: typeof LightColors;
  // Function to change theme mode
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  // Quick toggle between light/dark
  toggleTheme: () => Promise<void>;
}

// Create context with default values
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme Provider component
interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({children}: ThemeProviderProps) {
  // Get system color scheme
  const systemColorScheme = useColorScheme();
  
  // User's theme preference (defaults to system)
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
          setThemeModeState(savedMode as ThemeMode);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadThemePreference();
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(() => {
      // Force re-render if theme mode is 'system'
      if (themeMode === 'system') {
        setThemeModeState('system');
      }
    });

    return () => subscription.remove();
  }, [themeMode]);

  // Resolve the active theme based on mode and system preference
  const theme: ActiveTheme = useMemo(() => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    return themeMode;
  }, [themeMode, systemColorScheme]);

  // Get colors based on active theme
  const colors = useMemo(() => {
    return theme === 'dark' ? DarkColors : LightColors;
  }, [theme]);

  // Is dark mode active?
  const isDark = theme === 'dark';

  // Set theme mode and persist
  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  }, []);

  // Toggle between light and dark (skips system)
  const toggleTheme = useCallback(async () => {
    const newMode: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    await setThemeMode(newMode);
  }, [theme, setThemeMode]);

  // Context value
  const value = useMemo(
    () => ({
      theme,
      mode: theme, // Legacy alias
      themeMode,
      isDark,
      isDarkMode: isDark,
      colors,
      setThemeMode,
      toggleTheme,
    }),
    [theme, themeMode, isDark, colors, setThemeMode, toggleTheme],
  );

  // Don't render children until theme is loaded
  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// Hook to use theme context
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Export types
export type {ThemeContextType};
