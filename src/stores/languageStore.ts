/**
 * Language Store
 * Manages app language and RTL/LTR direction
 * Persists to AsyncStorage for app restarts
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

// Supported languages
export type Language = 'ar' | 'en';

// Language direction
export type Direction = 'rtl' | 'ltr';

// Language configuration
export interface LanguageConfig {
  code: Language;
  name: string;
  nativeName: string;
  direction: Direction;
  locale: string; // For date formatting
}

// Language configurations
export const LANGUAGES: Record<Language, LanguageConfig> = {
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    direction: 'rtl',
    locale: 'ar-EG',
  },
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    locale: 'en-US',
  },
};

// Storage key
const LANGUAGE_STORAGE_KEY = '@shambay/language';

// Interface for language store state
interface LanguageState {
  language: Language;
  direction: Direction;
  locale: string;
  isLoading: boolean;
  isInitialized: boolean;
  requiresRestart: boolean; // Android requires restart for RTL changes

  // Actions
  setLanguage: (language: Language) => Promise<void>;
  loadLanguage: () => Promise<void>;
  getConfig: () => LanguageConfig;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: 'ar', // Default to Arabic
  direction: 'rtl',
  locale: 'ar-EG',
  isLoading: true,
  isInitialized: false,
  requiresRestart: false,

  setLanguage: async (language: Language) => {
    try {
      const config = LANGUAGES[language];
      const currentDirection = get().direction;
      const newDirection = config.direction;

      // Save to storage
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);

      // Check if direction changed (requires app restart on Android)
      const directionChanged = currentDirection !== newDirection;

      if (directionChanged) {
        // Update RTL setting
        if (newDirection === 'rtl') {
          I18nManager.allowRTL(true);
          I18nManager.forceRTL(true);
        } else {
          I18nManager.allowRTL(false);
          I18nManager.forceRTL(false);
        }
      }

      set({
        language,
        direction: newDirection,
        locale: config.locale,
        requiresRestart: directionChanged,
      });
    } catch (error) {
    }
  },

  loadLanguage: async () => {
    try {
      const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

      if (stored && (stored === 'ar' || stored === 'en')) {
        const config = LANGUAGES[stored as Language];
        set({
          language: stored as Language,
          direction: config.direction,
          locale: config.locale,
          isLoading: false,
          isInitialized: true,
        });
      } else {
        // Default to Arabic
        set({
          isLoading: false,
          isInitialized: true,
        });
      }
    } catch (error) {
      set({ isLoading: false, isInitialized: true });
    }
  },

  getConfig: () => {
    return LANGUAGES[get().language];
  },
}));

// Convenience hooks
export const useLanguage = () => useLanguageStore((state) => state.language);
export const useDirection = () => useLanguageStore((state) => state.direction);
export const useLocale = () => useLanguageStore((state) => state.locale);
export const useIsRTL = () => useLanguageStore((state) => state.direction === 'rtl');

export default useLanguageStore;
