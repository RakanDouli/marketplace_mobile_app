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
  useWindowDimensions,
} from 'react-native';
import { useTheme, Theme } from '../../theme';
import { Container, ContainerProps } from './Container';
import { Text } from './Text';
import { Button } from './Button';
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
      {/* Header - Title at start, View All at end */}
      {(title || onViewAll) && (
        <View style={[
          styles.header,
          { paddingHorizontal: theme.spacing.md },
          { flexDirection: theme.isRTL ? 'row-reverse' : 'row' },
        ]}>
          {title && <Text variant="h3">{title}</Text>}
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
      )}

      {/* Horizontal FlatList with RTL support
          - For RTL: use inverted=true so items start from right
          - For LTR: use inverted=false so items start from left
          Use theme.isRTL which reflects the user's language choice */}
      <FlatList
        data={data}
        horizontal
        inverted={theme.isRTL}
        showsHorizontalScrollIndicator={false}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.listContent,
          {
            gap: gapValue,
            paddingHorizontal: theme.spacing.md,
          },
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
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
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
