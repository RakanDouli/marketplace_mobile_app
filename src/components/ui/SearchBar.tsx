/**
 * SearchBar Component
 * Reusable search bar with category selector dropdown
 * Used in: Home page, Search page, Listings page
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { Search, LayoutGrid, X } from 'lucide-react-native';
import { SvgXml } from 'react-native-svg';
import { useTheme, Theme } from '../../theme';
import { Text } from './Text';

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
  showCategorySelector = true,
  style,
}: SearchBarProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
      .replace(/stroke="[^"]*"/g, `stroke="${color}"`)
      .replace(/fill="[^"]*"/g, 'fill="none"');
    try {
      return <SvgXml xml={styledSvg} width={size} height={size} />;
    } catch {
      return <LayoutGrid size={size} color={color} />;
    }
  };

  const handleCategoryPress = (slug: string) => {
    setShowDropdown(false);
    onCategorySelect?.(slug);
  };

  return (
    <>
      <View style={[styles.container, style]}>
        <View style={styles.searchBarInner}>
          <Search
            size={18}
            color={theme.colors.textSecondary}
            style={{ marginLeft: theme.spacing.xs }}
          />
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            onSubmitEditing={onSubmitEditing}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textSecondary}
            textAlign="right"
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
            <Search size={18} color={theme.colors.textInverse} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Dropdown Modal */}
      <Modal
        visible={showDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowDropdown(false)}
        >
          <View style={styles.dropdownContainer}>
            <View style={styles.dropdownHeader}>
              <Text variant="h4">اختر الفئة</Text>
              <TouchableOpacity onPress={() => setShowDropdown(false)}>
                <X size={20} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.dropdownScroll}>
              <View style={styles.dropdownOptions}>
                {activeCategories.map((category) => (
                  <TouchableOpacity
                    key={category.slug}
                    style={[
                      styles.dropdownOption,
                      selectedCategory === category.slug &&
                        styles.dropdownOptionSelected,
                    ]}
                    onPress={() => handleCategoryPress(category.slug)}
                  >
                    <View style={styles.dropdownOptionIcon}>
                      {renderCategoryIcon(
                        category.icon,
                        20,
                        theme.colors.primary
                      )}
                    </View>
                    <Text variant="paragraph">{category.nameAr}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.bg,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
    },
    searchBarInner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.bg,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.sm,
      borderRadius: 9999,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...theme.shadows.md,
    },
    input: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.text,
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      textAlign: 'right',
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 9999,
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
      borderRadius: 9999,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    dropdownContainer: {
      backgroundColor: theme.colors.bg,
      borderTopLeftRadius: theme.radius.xl,
      borderTopRightRadius: theme.radius.xl,
      paddingBottom: theme.spacing.xl,
      maxHeight: '60%',
    },
    dropdownHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    dropdownScroll: {
      maxHeight: 400,
    },
    dropdownOptions: {
      padding: theme.spacing.sm,
    },
    dropdownOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
    },
    dropdownOptionSelected: {
      backgroundColor: theme.colors.primaryLight,
    },
    dropdownOptionIcon: {
      width: 40,
      height: 40,
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

export default SearchBar;
