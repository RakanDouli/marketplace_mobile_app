/**
 * Settings Screen
 * App settings and preferences (notifications, currency, theme)
 */

import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { Bell, DollarSign, Check } from 'lucide-react-native';
import { useTheme, Theme } from '../../../src/theme';
import { Text } from '../../../src/components/slices/Text';
import {
  useCurrencyStore,
  CURRENCY_SYMBOLS,
  CURRENCY_LABELS,
  type Currency,
} from '../../../src/stores/currencyStore';

export default function SettingsScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [notifications, setNotifications] = useState(true);

  const {
    preferredCurrency,
    setPreferredCurrency,
  } = useCurrencyStore();

  const currencies: Currency[] = ['USD', 'EUR', 'SYP'];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.bg }]}
      contentContainerStyle={styles.content}
    >
      {/* Currency Selector */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <DollarSign size={20} color={theme.colors.text} />
          <Text variant="body" style={styles.sectionTitle}>
            العملة المفضلة
          </Text>
        </View>
        <View style={styles.currencyOptions}>
          {currencies.map((currency) => (
            <TouchableOpacity
              key={currency}
              style={[
                styles.currencyOption,
                preferredCurrency === currency && styles.currencyOptionSelected,
              ]}
              onPress={() => setPreferredCurrency(currency)}
            >
              <View style={styles.currencyOptionContent}>
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
              الإشعارات
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
        الإصدار 1.0.0
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
    // Currency Options
    currencyOptions: {
      padding: theme.spacing.sm,
    },
    currencyOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
    },
    currencyOptionSelected: {
      backgroundColor: theme.colors.primaryLight,
    },
    currencyOptionContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
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
  });
