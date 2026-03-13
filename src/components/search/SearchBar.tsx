/**
 * SearchBar Component
 * Reusable search bar with category selector dropdown
 * Used in: Home page, Search page, Listings page
 * Uses BaseModal for consistent styling
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, LayoutGrid } from 'lucide-react-native';
import { SvgXml } from 'react-native-svg';
import { useTheme, Theme } from '../../theme';
import { BaseModal, ListItem } from '../slices';

export interface Category {
  slug: string;
  nameAr: string;
  icon?: string;
  isActive?: boolean;
}

export interface SearchBarProps {
  value?: string;
  onChangeText?: (text: string) => void;
  onSubmitEditing?: () => void;
  placeholder?: string;
  // Category selector props
  categories?: Category[];
  selectedCategory?: string | null;
  onCategorySelect?: (slug: string) => void;
  /** If true, navigate immediately when category is selected (default: true) */
  navigateOnCategorySelect?: boolean;
  showCategorySelector?: boolean;
  // Style prop
  style?: any;
}

export function SearchBar({
  value,
  onChangeText,
  onSubmitEditing,
  placeholder = 'ابحث...',
  categories = [],
  selectedCategory,
  onCategorySelect,
  navigateOnCategorySelect = true,
  showCategorySelector = true,
  style,
}: SearchBarProps) {
  const theme = useTheme();
  const router = useRouter();
  const isRTL = theme.isRTL;
  const styles = useMemo(() => createStyles(theme, isRTL), [theme, isRTL]);
  const [showDropdown, setShowDropdown] = useState(false);

  const activeCategories = useMemo(
    () => categories.filter((cat) => cat.isActive !== false),
    [categories]
  );
  const selectedCategoryObj = activeCategories.find(
    (cat) => cat.slug === selectedCategory
  );

  // Helper to render category icon from SVG string
  const renderCategoryIcon = (
    iconSvg: string | undefined,
    size: number,
    color: string
  ) => {
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

  const handleCategoryPress = (slug: string) => {
    setShowDropdown(false);
    onCategorySelect?.(slug);

    // Navigate to search page immediately if enabled
    if (navigateOnCategorySelect) {
      router.push(`/search/${slug}`);
    }
  };

  return (
    <>
      <View style={[styles.container, style]}>
        <View style={styles.searchBarInner}>
          <Search
            size={18}
            color={theme.colors.textSecondary}
            style={{ marginStart: theme.spacing.xs }}
          />
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            onSubmitEditing={onSubmitEditing}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textSecondary}
            returnKeyType="search"
          />

          {/* Category Selector */}
          {showCategorySelector && (
            <TouchableOpacity
              style={[
                styles.iconButton,
                !selectedCategoryObj && styles.iconButtonEmpty,
              ]}
              onPress={() => setShowDropdown(true)}
              activeOpacity={0.8}
            >
              {selectedCategoryObj?.icon ? (
                renderCategoryIcon(
                  selectedCategoryObj.icon,
                  18,
                  theme.colors.primary
                )
              ) : (
                <LayoutGrid size={18} color={theme.colors.textSecondary} />
              )}
            </TouchableOpacity>
          )}

          {/* Search Button */}
          <TouchableOpacity
            style={styles.searchButton}
            onPress={onSubmitEditing}
            activeOpacity={0.8}
          >
            <Search size={18} color={theme.colors.textLight} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Dropdown Modal using BaseModal */}
      <BaseModal
        visible={showDropdown}
        onClose={() => setShowDropdown(false)}
        title="اختر الفئة"
        maxHeightPercent={60}
        bodyPadding="none"
      >
        <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false}>
          {activeCategories.map((category, index) => (
            <ListItem
              key={category.slug}
              label={category.nameAr}
              icon={renderCategoryIcon(category.icon, 24, theme.colors.primary)}
              selected={selectedCategory === category.slug}
              onPress={() => handleCategoryPress(category.slug)}
              showArrow={false}
              showBorder={index < activeCategories.length - 1}
            />
          ))}
        </ScrollView>
      </BaseModal>
    </>
  );
}

const createStyles = (theme: Theme, isRTL: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.bg,
      paddingStart: theme.spacing.md,
      paddingEnd: theme.spacing.md,
      paddingVertical: theme.spacing.md,
    },
    searchBarInner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.bg,
      paddingStart: theme.spacing.sm,
      paddingEnd: theme.spacing.sm,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...theme.shadows.md,
    },
    input: {
      flex: 1,
      fontSize: theme.fontSize.sm,
      color: theme.colors.text,
      paddingVertical: theme.spacing.xs,
      paddingStart: theme.spacing.sm,
      paddingEnd: theme.spacing.sm,
      textAlign: isRTL ? 'right' : 'left',
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconButtonEmpty: {
      borderColor: theme.colors.warning,
      borderWidth: 2,
    },
    searchButton: {
      width: 40,
      height: 40,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    // Dropdown content styles
    dropdownScroll: {
      maxHeight: 400,
    },
  });

export default SearchBar;
