/**
 * StatItem Component
 * Reusable component for displaying statistics with icon + count
 * Handles RTL automatically - icon appears on correct side
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { Text } from './Text';

export interface StatItemProps {
  icon: React.ReactNode;
  count: number;
  label: string;
}

export function StatItem({ icon, count, label }: StatItemProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { flexDirection: 'row', gap: theme.spacing.xs }]}>
      {/* Icon FIRST in RTL, LAST in LTR */}
      {theme.isRTL && icon}

      <Text variant="small" color="muted">
        {count} {label}
      </Text>

      {/* Icon LAST in LTR */}
      {!theme.isRTL && icon}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
});

export default StatItem;
