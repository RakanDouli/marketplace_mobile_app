/**
 * Settings Screen
 * App settings and preferences (notifications, currency, language, theme)
 */

import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert, Platform } from 'react-native';
import { Bell, DollarSign, Check, Globe, RefreshCw } from 'lucide-react-native';
import * as Updates from 'expo-updates';
import { useTheme, Theme } from '../../../src/theme';
import { Text } from '../../../src/components/slices/Text';
import {
  useCurrencyStore,
  CURRENCY_SYMBOLS,
  CURRENCY_LABELS,
  type Currency,
} from '../../../src/stores/currencyStore';
import {
  useLanguageStore,
  LANGUAGES,
  type Language,
} from '../../../src/stores/languageStore';
import { useTranslation } from '../../../src/hooks/useTranslation';

export default function SettingsScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [notifications, setNotifications] = useState(true);
  const { t, language: currentLanguage } = useTranslation();

  const {
    preferredCurrency,
    setPreferredCurrency,
  } = useCurrencyStore();

  const {
    language,
    setLanguage,
    requiresRestart,
  } = useLanguageStore();

  const currencies: Currency[] = ['USD', 'EUR', 'SYP'];
  const languages: Language[] = ['ar', 'en'];

  const handleLanguageChange = async (newLanguage: Language) => {
    if (newLanguage === language) return;

    await setLanguage(newLanguage);

    // Show restart prompt for Android (RTL requires restart)
    if (Platform.OS === 'android') {
      Alert.alert(
        t('settings.restartRequired'),
        t('settings.restartMessage'),
        [
          {
            text: t('settings.restartLater'),
            style: 'cancel',
          },
          {
            text: t('settings.restartNow'),
            onPress: async () => {
              try {
                await Updates.reloadAsync();
              } catch (e) {
                // Fallback for development builds
                Alert.alert(
                  'Restart Required',
                  'Please close and reopen the app to apply language changes.'
                );
              }
            },
          },
        ]
      );
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.bg }]}
      contentContainerStyle={styles.content}
    >
      {/* Language Selector */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Globe size={20} color={theme.colors.text} />
          <Text variant="body" style={styles.sectionTitle}>
            {t('settings.language')}
          </Text>
        </View>
        <View style={styles.optionsList}>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[
                styles.option,
                language === lang && styles.optionSelected,
              ]}
              onPress={() => handleLanguageChange(lang)}
            >
              <View style={styles.optionContent}>
                <Text
                  variant="body"
                  style={[
                    styles.optionLabel,
                    language === lang && { color: theme.colors.primary },
                  ]}
                >
                  {LANGUAGES[lang].nativeName}
                </Text>
                <Text
                  variant="small"
                  color="secondary"
                  style={language === lang ? { color: theme.colors.primary } : undefined}
                >
                  {LANGUAGES[lang].name}
                </Text>
              </View>
              {language === lang && (
                <Check size={20} color={theme.colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
        {requiresRestart && (
          <View style={styles.restartNotice}>
            <RefreshCw size={16} color={theme.colors.warning} />
            <Text variant="small" style={{ color: theme.colors.warning, marginRight: 8 }}>
              {t('settings.restartRequired')}
            </Text>
          </View>
        )}
      </View>

      {/* Currency Selector */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <DollarSign size={20} color={theme.colors.text} />
          <Text variant="body" style={styles.sectionTitle}>
            {t('settings.currency')}
          </Text>
        </View>
        <View style={styles.optionsList}>
          {currencies.map((currency) => (
            <TouchableOpacity
              key={currency}
              style={[
                styles.option,
                preferredCurrency === currency && styles.optionSelected,
              ]}
              onPress={() => setPreferredCurrency(currency)}
            >
              <View style={styles.optionContent}>
                <Text
                  variant="body"
                  style={[
                    styles.currencySymbol,
                    preferredCurrency === currency && { color: theme.colors.primary },
                  ]}
                >
                  {CURRENCY_SYMBOLS[currency]}
                </Text>
                <Text
                  variant="small"
                  style={preferredCurrency === currency ? { color: theme.colors.primary } : undefined}
                >
                  {CURRENCY_LABELS[currency]}
                </Text>
              </View>
              {preferredCurrency === currency && (
                <Check size={20} color={theme.colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Bell size={22} color={theme.colors.text} />
            <Text variant="body" style={{ marginRight: 12 }}>
              {t('settings.notifications')}
            </Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
          />
        </View>
      </View>

      <Text variant="small" color="muted" center style={{ marginTop: 20 }}>
        {t('settings.version')} 1.0.0
      </Text>
    </ScrollView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      padding: 20,
      gap: 16,
    },
    // Section
    section: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      overflow: 'hidden',
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      gap: theme.spacing.sm,
    },
    sectionTitle: {
      fontWeight: '600',
    },
    // Options List (for both language and currency)
    optionsList: {
      padding: theme.spacing.sm,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
    },
    optionSelected: {
      backgroundColor: theme.colors.primaryLight,
    },
    optionContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    optionLabel: {
      fontWeight: '600',
      minWidth: 70,
    },
    currencySymbol: {
      fontWeight: '700',
      width: 30,
    },
    // Settings Row
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.md,
    },
    rowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    // Restart Notice
    restartNotice: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      backgroundColor: theme.colors.warningLight || 'rgba(255, 193, 7, 0.1)',
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
  });
