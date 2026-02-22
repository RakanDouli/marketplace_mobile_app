/**
 * Model Selection Step
 * Displays models based on selected brand, with optional variant selection
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { Text } from '../slices/Text';
import { useCreateListingStore } from '../../stores/createListingStore';
import type { Model, Variant } from '../../stores/createListingStore/types';

export default function ModelStep() {
  const theme = useTheme();
  const {
    models,
    variants,
    isLoadingModels,
    formData,
    setFormField,
    attributes,
  } = useCreateListingStore();

  // Check if this category has variants
  const hasVariants = attributes.some((attr) => attr.key === 'variantId');

  const handleModelSelect = (model: Model) => {
    setFormField('modelId', model.id);
    // Clear variant when model changes
    setFormField('variantId', undefined);
  };

  const handleVariantSelect = (variant: Variant) => {
    setFormField('variantId', variant.id);
  };

  const renderModel = ({ item }: { item: Model }) => {
    const isSelected = formData.modelId === item.id;

    return (
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: isSelected ? theme.colors.primary + '15' : theme.colors.bg,
            borderColor: isSelected ? theme.colors.primary : theme.colors.border,
          },
        ]}
        onPress={() => handleModelSelect(item)}
        activeOpacity={0.7}
      >
        {isSelected && (
          <View style={[styles.checkBadge, { backgroundColor: theme.colors.primary }]}>
            <Check size={12} color="#fff" />
          </View>
        )}
        <Text
          variant="body"
          style={[styles.cardName, isSelected && { color: theme.colors.primary }]}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderVariant = ({ item }: { item: Variant }) => {
    const isSelected = formData.variantId === item.id;

    return (
      <TouchableOpacity
        style={[
          styles.variantCard,
          {
            backgroundColor: isSelected ? theme.colors.primary + '15' : theme.colors.bg,
            borderColor: isSelected ? theme.colors.primary : theme.colors.border,
          },
        ]}
        onPress={() => handleVariantSelect(item)}
        activeOpacity={0.7}
      >
        {isSelected && (
          <View style={[styles.checkBadge, { backgroundColor: theme.colors.primary }]}>
            <Check size={12} color="#fff" />
          </View>
        )}
        <Text
          variant="small"
          style={[styles.cardName, isSelected && { color: theme.colors.primary }]}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  if (isLoadingModels) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="paragraph" color="secondary" style={styles.loadingText}>
          جاري تحميل الموديلات...
        </Text>
      </View>
    );
  }

  if (models.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="paragraph" color="secondary">
          يرجى اختيار الماركة أولاً
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text variant="h3" style={styles.title}>اختر الموديل</Text>
      <Text variant="paragraph" color="secondary" style={styles.subtitle}>
        اختر الموديل المناسب
      </Text>

      <FlatList
        data={models}
        renderItem={renderModel}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        scrollEnabled={false}
      />

      {/* Variants Section */}
      {hasVariants && formData.modelId && variants.length > 0 && (
        <View style={styles.variantsSection}>
          <Text variant="body" style={styles.variantsTitle}>
            اختر الفئة الفرعية (اختياري)
          </Text>
          <FlatList
            data={variants}
            renderItem={renderVariant}
            keyExtractor={(item) => item.id}
            numColumns={3}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.variantsList}
            scrollEnabled={false}
          />
        </View>
      )}
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
  card: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 70,
    position: 'relative',
  },
  variantCard: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    position: 'relative',
  },
  checkBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardName: {
    textAlign: 'center',
  },
  variantsSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  variantsTitle: {
    textAlign: 'right',
    marginBottom: 12,
  },
  variantsList: {
    gap: 8,
  },
});
