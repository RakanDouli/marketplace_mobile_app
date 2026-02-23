/**
 * Grid Component
 * CSS Grid-like layout with RTL support
 * Layout only - no data fetching
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { useTheme, Theme } from '../../theme';
import { Container, ContainerProps } from './Container';
import { Text } from './Text';
import { Button } from './Button';
import { Loading } from './Loading';

export type GapSize = 'sm' | 'md' | 'lg' | 'xl';

export interface GridProps {
  children: React.ReactNode;
  title?: string;
  titleAlign?: 'right' | 'center';
  action?: React.ReactNode;
  /** View all text (shows if onViewAll provided) */
  viewAllText?: string;
  /** View all callback */
  onViewAll?: () => void;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  mobileColumns?: 1 | 2 | 3 | 4;
  tabletColumns?: 1 | 2 | 3 | 4;
  gap?: GapSize;
  paddingY?: ContainerProps['paddingY'];
  background?: ContainerProps['background'];
  /** Loading state */
  isLoading?: boolean;
}

export function Grid({
  children,
  title,
  titleAlign = 'right',
  action,
  viewAllText = 'عرض الكل',
  onViewAll,
  columns = 4,
  mobileColumns = 2,
  tabletColumns,
  gap = 'lg',
  paddingY = 'xl',
  background = 'transparent',
  isLoading = false,
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

  // Loading state
  if (isLoading) {
    return (
      <Container paddingY={paddingY} background={background}>
        {title && (
          <View style={styles.header}>
            <Text variant="h3">{title}</Text>
          </View>
        )}
        <View style={styles.loading}>
          <Loading type="svg" size="md" />
        </View>
      </Container>
    );
  }

  const childrenArray = React.Children.toArray(children);

  // Empty state
  if (childrenArray.length === 0) {
    return null;
  }

  const gridItems = childrenArray.map((child, index) => (
    <View key={index} style={{ width: itemWidth }}>
      {child}
    </View>
  ));

  const gridElement = (
    <View style={[
      styles.grid,
      { gap: gapValue },
      { flexDirection: theme.isRTL ? 'row-reverse' : 'row' },
    ]}>
      {gridItems}
    </View>
  );

  // Header with title and/or view all button
  const hasHeader = title || action || onViewAll;

  if (hasHeader) {
    return (
      <Container paddingY={paddingY} background={background}>
        <View
          style={[
            styles.header,
            { flexDirection: theme.isRTL ? 'row-reverse' : 'row' },
            titleAlign === 'center' && styles.headerCenter,
          ]}
        >
          {title && <Text variant="h3">{title}</Text>}
          {action}
          {onViewAll && (
            <Button
              variant="link"
              size="sm"
              onPress={onViewAll}
              arrowForward
            >
              {viewAllText}
            </Button>
          )}
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
      flexWrap: 'wrap',
      alignItems: 'flex-start',
    },
    header: {
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    headerCenter: {
      justifyContent: 'center',
    },
    loading: {
      paddingVertical: theme.spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

export default Grid;
