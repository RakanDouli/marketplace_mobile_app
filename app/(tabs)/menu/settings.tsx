/**
 * Settings Screen
 * App settings and preferences (notifications only - theme is in main menu)
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Switch } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useTheme } from '../../../src/theme';
import { Text } from '../../../src/components/ui/Text';

export default function SettingsScreen() {
  const theme = useTheme();
  const [notifications, setNotifications] = useState(true);

  const settingsOptions = [
    {
      icon: <Bell size={22} color={theme.colors.text} />,
      title: 'الإشعارات',
      type: 'switch' as const,
      value: notifications,
      onValueChange: setNotifications,
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.bg }]}
      contentContainerStyle={styles.content}
    >
      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        {settingsOptions.map((option, index) => (
          <View
            key={index}
            style={[
              styles.row,
              index < settingsOptions.length - 1 && {
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.rowLeft}>
              {option.icon}
              <Text variant="body" style={{ marginLeft: 12 }}>
                {option.title}
              </Text>
            </View>

            <Switch
              value={option.value as boolean}
              onValueChange={option.onValueChange}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            />
          </View>
        ))}
      </View>

      <Text variant="small" color="muted" center style={{ marginTop: 20 }}>
        الإصدار 1.0.0
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
