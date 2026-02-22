/**
 * Brand Selection Step
 * Displays a grid of brands for user to select
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { Text } from '../slices/Text';
import { useCreateListingStore } from '../../stores/createListingStore';
import type { Brand } from '../../stores/createListingStore/types';

export default function BrandStep() {
  const theme = useTheme();
  const { brands, isLoadingBrands, formData, setFormField } = useCreateListingStore();

  const handleBrandSelect = (brand: Brand) => {
    setFormField('brandId', brand.id);
    // Clear model and variant when brand changes
    setFormField('modelId', undefined);
    setFormField('variantId', undefined);
  };

  const renderBrand = ({ item }: { item: Brand }) => {
    const isSelected = formData.brandId === item.id;

    return (
      <TouchableOpacity
        style={[
          styles.brandCard,
          {
            backgroundColor: isSelected ? theme.colors.primary + '15' : theme.colors.bg,
            borderColor: isSelected ? theme.colors.primary : theme.colors.border,
          },
        ]}
        onPress={() => handleBrandSelect(item)}
        activeOpacity={0.7}
      >
        {isSelected && (
          <View style={[styles.checkBadge, { backgroundColor: theme.colors.primary }]}>
            <Check size={12} color="#fff" />
          </View>
        )}
        <Text
          variant="body"
          style={[styles.brandName, isSelected && { color: theme.colors.primary }]}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  if (isLoadingBrands) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="paragraph" color="secondary" style={styles.loadingText}>
          جاري تحميل الماركات...
        </Text>
      </View>
    );
  }

  if (brands.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="paragraph" color="secondary">
          لا توجد ماركات متاحة لهذه الفئة
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text variant="h3" style={styles.title}>اختر الماركة</Text>
      <Text variant="paragraph" color="secondary" style={styles.subtitle}>
        اختر ماركة {formData.listingType === 'rent' ? 'للإيجار' : 'للبيع'}
      </Text>

      <FlatList
        data={brands}
        renderItem={renderBrand}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    textAlign: 'right',
    marginBottom: 4,
  },
  subtitle: {
    textAlign: 'right',
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  list: {
    gap: 12,
  },
  row: {
    gap: 12,
  },
  brandCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    position: 'relative',
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandName: {
    textAlign: 'center',
  },
});
