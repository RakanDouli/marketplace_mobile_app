/**
 * MetaItem Component
 * Reusable component for displaying metadata with icon + text
 * Handles RTL automatically - icon appears on correct side
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { Text } from './Text';

export interface MetaItemProps {
  icon: React.ReactNode;
  text: string;
}

export function MetaItem({ icon, text }: MetaItemProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { flexDirection: 'row', gap: theme.spacing.xs }]}>
      {/* Icon FIRST in RTL, LAST in LTR */}
      {theme.isRTL && icon}

      <Text variant="small" color="secondary">
        {text}
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

export default MetaItem;
