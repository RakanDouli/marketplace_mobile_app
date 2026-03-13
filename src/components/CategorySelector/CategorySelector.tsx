/**
 * CategorySelector Component
 * Reusable category grid selector used on home page and search
 * Uses Grid component for consistent grid layout
 */

import React, { useMemo } from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { LayoutGrid } from 'lucide-react-native';
import { SvgXml } from 'react-native-svg';
import { useTheme, Theme } from '../../theme';
import { Text, Loading, Grid } from '../slices';
import { ListingType } from '../../common/enums';
import { Category } from '../../stores/categoriesStore';

export interface CategorySelectorProps {
  categories: Category[];
  isLoading?: boolean;
  onCategoryPress: (slug: string, name: string) => void;
  columns?: 2 | 3 | 4;
  mobileColumns?: 1 | 2;
  showOnlyActive?: boolean;
  excludeSlugs?: string[];
  isCollection?: boolean;
  parentCollectionId: string | null | undefined;
  level?: 0
}

export function CategorySelector({
  categories,
  isLoading = false,
  onCategoryPress,
  columns = 4,
  mobileColumns = 2,
  showOnlyActive = true,
  excludeSlugs = [],
  isCollection = false,
  parentCollectionId = null,
  level = 0
}: CategorySelectorProps) {
  const theme = useTheme();
  // Use theme.isDark as explicit dependency to ensure styles update on theme change
  const styles = useMemo(() => createStyles(theme), [theme, theme.isDark]);

  // Filter categories
  const visibleCategories = useMemo(() => {
    return categories.filter(cat => {
      if (showOnlyActive && !cat.isActive) return false;
      if (excludeSlugs.includes(cat.slug)) return false;
      
      // Filter by parent collection if specified
      if (parentCollectionId) {
        return cat.parentCollectionId === parentCollectionId;
      } else {
        // Show top-level categories (no parent) if no specific collection requested
        return !cat.parentCollectionId;
      }
    });
  }, [categories, showOnlyActive, excludeSlugs, parentCollectionId]);

  // Render category icon (SVG or fallback)
  const renderCategoryIcon = (iconSvg: string | undefined, size: number, color: string) => {
    if (!iconSvg) return <LayoutGrid size={size} color={color} />;

    const styledSvg = iconSvg
      .replace(/<svg/, `<svg width="${size}" height="${size}"`)
      .replace(/stroke="currentColor"/g, `stroke="${color}"`)
      .replace(/fill="currentColor"/g, `fill="${color}"`);

    try {
      return <SvgXml xml={styledSvg} width={size} height={size} />;
    } catch {
      return <LayoutGrid size={size} color={color} />;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Loading type="dots" size="sm" />
      </View>
    );
  }

  return (
    <Grid columns={columns} mobileColumns={mobileColumns} gap="md">
      {visibleCategories.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={styles.categoryCard}
          onPress={() => onCategoryPress(category.slug, category.nameAr)}
          activeOpacity={0.8}
        >
          <View style={styles.categoryCardIcon}>
            {renderCategoryIcon(category.icon, 24, theme.colors.primary)}
          </View>
          <Text variant="h4" center>
            {category.nameAr}
          </Text>
        </TouchableOpacity>
      ))}
    </Grid>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    loadingContainer: {
      padding: theme.spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    categoryCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      paddingVertical: theme.spacing.lg,
      paddingHorizontal: theme.spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      minHeight: 100,
    },
    categoryCardIcon: {
      width: 48,
      height: 48,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

export default CategorySelector;
