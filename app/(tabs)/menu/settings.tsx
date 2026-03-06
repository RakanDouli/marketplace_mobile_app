/**
 * Settings Screen
 * App settings and preferences (notifications, language)
 * Note: Currency selector is in the Menu page (menu/index.tsx)
 */

import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { Bell, Check, Globe, RefreshCw } from 'lucide-react-native';
import { useTheme, Theme } from '../../../src/theme';
import { Text, Button, BottomSheet } from '../../../src/components/slices';
import {
  useLanguageStore,
  LANGUAGES,
  type Language,
} from '../../../src/stores/languageStore';
import { useTranslation } from '../../../src/hooks/useTranslation';

export default function SettingsScreen() {
  const theme = useTheme();
  const isRTL = theme.isRTL;
  const styles = useMemo(() => createStyles(theme, isRTL), [theme, isRTL]);
  const [notifications, setNotifications] = useState(true);
  const [showRestartModal, setShowRestartModal] = useState(false);
  const { t } = useTranslation();

  const {
    language,
    setLanguage,
    requiresRestart,
  } = useLanguageStore();

  const languages: Language[] = ['ar', 'en'];

  const handleLanguageChange = async (newLanguage: Language) => {
    if (newLanguage === language) return;

    await setLanguage(newLanguage);

    // Show restart prompt using BottomSheet (RTL-aware)
    setShowRestartModal(true);
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
                    language === lang && styles.optionLabelSelected,
                  ]}
                >
                  {LANGUAGES[lang].nativeName}
                </Text>
                <Text
                  variant="small"
                  color="secondary"
                  style={language === lang ? styles.optionLabelSelected : undefined}
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
            <Text variant="small" style={styles.restartNoticeText}>
              {t('settings.restartRequired')}
            </Text>
          </View>
        )}
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Bell size={22} color={theme.colors.text} />
            <Text variant="body" style={styles.rowLabel}>
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

      <Text variant="small" color="muted" center style={styles.versionText}>
        {t('settings.version')} 1.0.0
      </Text>

      {/* Restart Required Modal */}
      <BottomSheet
        visible={showRestartModal}
        onClose={() => setShowRestartModal(false)}
        title={t('settings.restartRequired')}
      >
        <Text variant="paragraph" style={styles.modalMessage}>
          {t('settings.restartMessage')}
        </Text>
        <Button onPress={() => setShowRestartModal(false)}>
          {t('common.ok')}
        </Button>
      </BottomSheet>
    </ScrollView>
  );
}

const createStyles = (theme: Theme, isRTL: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    // Section
    section: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      overflow: 'hidden',
    },
    sectionHeader: {
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
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
    },
    optionSelected: {
      backgroundColor: theme.colors.primaryLight,
    },
    optionContent: {
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    optionLabel: {
      fontWeight: '600',
      minWidth: 70,
    },
    optionLabelSelected: {
      color: theme.colors.primary,
    },
    // Settings Row
    row: {
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.md,
    },
    rowLeft: {
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    rowLabel: {
      marginStart: theme.spacing.sm,
        marginEnd: theme.spacing.sm,
    },
    // Restart Notice
    restartNotice: {
      alignItems: 'center',
      padding: theme.spacing.sm,
      paddingStart: theme.spacing.md,
        paddingEnd: theme.spacing.md,
      backgroundColor: theme.colors.warningLight || 'rgba(255, 193, 7, 0.1)',
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      gap: theme.spacing.xs,
    },
    restartNoticeText: {
      color: theme.colors.warning,
    },
    // Modal
    modalMessage: {
      marginBottom: theme.spacing.lg,
    },
    versionText: {
      marginTop: theme.spacing.lg,
    },
  });
