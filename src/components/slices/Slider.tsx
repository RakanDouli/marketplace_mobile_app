/**
 * Slider Component
 * Horizontal scrolling layout with RTL support
 * Uses `inverted` prop for RTL (native React Native approach)
 * Layout only - no data fetching
 */

import React, { useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme, Theme } from '../../theme';
import { Container, ContainerProps } from './Container';
import { Text } from './Text';
import { Loading } from './Loading';

export interface SliderProps<T> {
  /** Data array to render */
  data: T[];
  /** Render function for each item */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Key extractor for FlatList */
  keyExtractor: (item: T, index: number) => string;
  /** Section title */
  title?: string;
  /** View all button text */
  viewAllText?: string;
  /** View all callback */
  onViewAll?: () => void;
  /** Fixed card width (default: 180) */
  cardWidth?: number;
  /** Gap between items (default: md) */
  gap?: 'sm' | 'md' | 'lg';
  /** Loading state */
  isLoading?: boolean;
  /** Container padding */
  paddingY?: ContainerProps['paddingY'];
  /** Container background */
  background?: ContainerProps['background'];
}

export function Slider<T>({
  data,
  renderItem,
  keyExtractor,
  title,
  viewAllText = 'عرض الكل',
  onViewAll,
  cardWidth = 180,
  gap = 'md',
  isLoading = false,
  paddingY = 'lg',
  background = 'transparent',
}: SliderProps<T>) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const gapValue = theme.spacing[gap];

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

  // Empty state
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <Container paddingY={paddingY} paddingX="none" background={background}>
      {/* Header */}
      {(title || onViewAll) && (
        <View style={[styles.header, { paddingHorizontal: theme.spacing.md }]}>
          {onViewAll && (
            <TouchableOpacity onPress={onViewAll} style={styles.viewAllButton}>
              <Text variant="paragraph" style={{ color: theme.colors.primary }}>
                {viewAllText}
              </Text>
              <ChevronLeft size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
          {title && <Text variant="h3">{title}</Text>}
        </View>
      )}

      {/* Horizontal FlatList - inverted for RTL support */}
      <FlatList
        data={data}
        horizontal
        inverted
        showsHorizontalScrollIndicator={false}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.listContent,
          { gap: gapValue, paddingHorizontal: theme.spacing.md },
        ]}
        renderItem={({ item, index }) => (
          <View style={{ width: cardWidth }}>
            {renderItem(item, index)}
          </View>
        )}
      />
    </Container>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row-reverse', // RTL: title on right, action on left
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    viewAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    loading: {
      paddingVertical: theme.spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
    },
    listContent: {
      // gap and padding applied inline
    },
  });

export default Slider;
