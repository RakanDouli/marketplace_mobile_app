/**
 * Grid Component
 * CSS Grid-like layout - matches web frontend Grid
 * Responsive columns for mobile/tablet/iPad
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { useTheme, Theme } from '../../theme';
import { Container, ContainerProps } from './Container';
import { Text } from './Text';

export type GapSize = 'sm' | 'md' | 'lg' | 'xl';

export interface GridProps {
  children: React.ReactNode;
  title?: string;
  titleAlign?: 'right' | 'center';
  action?: React.ReactNode;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  mobileColumns?: 1 | 2 | 3 | 4;
  tabletColumns?: 1 | 2 | 3 | 4;
  gap?: GapSize;
  paddingY?: ContainerProps['paddingY'];
  background?: ContainerProps['background'];
}

export function Grid({
  children,
  title,
  titleAlign = 'right',
  action,
  columns = 4,
  mobileColumns = 2,
  tabletColumns,
  gap = 'lg',
  paddingY = 'xl',
  background = 'transparent',
}: GridProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Lower breakpoints to support Android tablets (dp values vary)
  const isTablet = width >= 600;
  const isDesktop = width >= 900;

  const effectiveTabletColumns = tabletColumns || Math.min(columns, 3);
  const effectiveColumns = isDesktop
    ? columns
    : isTablet
      ? effectiveTabletColumns
      : mobileColumns;

  const gapMap: Record<GapSize, number> = {
    sm: theme.spacing.sm,
    md: theme.spacing.md,
    lg: theme.spacing.lg,
    xl: theme.spacing.xl,
  };

  const gapValue = gapMap[gap];

  const containerPadding = isDesktop
    ? theme.spacing.md * 3
    : isTablet
      ? theme.spacing.md * 2
      : theme.spacing.md;
  const totalGapWidth = (effectiveColumns - 1) * gapValue;
  const availableWidth = width - containerPadding * 2 - totalGapWidth;
  const itemWidth = availableWidth / effectiveColumns;

  const childrenArray = React.Children.toArray(children);
  const gridItems = childrenArray.map((child, index) => (
    <View key={index} style={{ width: itemWidth }}>
      {child}
    </View>
  ));

  const gridElement = (
    <View style={[styles.grid, { gap: gapValue }]}>
      {gridItems}
    </View>
  );

  if (title || action) {
    return (
      <Container paddingY={paddingY} background={background}>
        <View
          style={[
            styles.header,
            titleAlign === 'center' && styles.headerCenter,
          ]}
        >
          {title && <Text variant="h3">{title}</Text>}
          {action}
        </View>
        {gridElement}
      </Container>
    );
  }

  return gridElement;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'flex-start',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    headerCenter: {
      justifyContent: 'center',
    },
  });

export default Grid;
