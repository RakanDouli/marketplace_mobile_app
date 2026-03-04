/**
 * useTranslation Hook
 * Provides translation function based on current language
 *
 * Usage:
 *   const { t, language, direction, isRTL } = useTranslation();
 *   <Text>{t('common.save')}</Text>
 *   <Text>{t('time.minutesAgo', { count: 5 })}</Text>
 */

import { useCallback } from 'react';
import { useLanguageStore, type Language, type Direction } from '../stores/languageStore';
import { translations, type TranslationKey } from '../constants/translations';

interface UseTranslationReturn {
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  language: Language;
  direction: Direction;
  isRTL: boolean;
  locale: string;
}

export function useTranslation(): UseTranslationReturn {
  const { language, direction, locale } = useLanguageStore();

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      // Get translation for current language
      const translation = translations[language][key];

      if (!translation) {
        // Fallback to Arabic, then to key itself
        return translations.ar[key] || key;
      }

      // If no params, return translation directly
      if (!params) {
        return translation;
      }

      // Replace params like {count} or {value}
      let result = translation;
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
      });

      return result;
    },
    [language]
  );

  return {
    t,
    language,
    direction,
    isRTL: direction === 'rtl',
    locale,
  };
}

export default useTranslation;
