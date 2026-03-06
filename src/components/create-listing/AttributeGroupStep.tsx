/**
 * Attribute Group Step
 * Renders dynamic attributes based on category configuration
 * Uses AttributeFieldRenderer for regular attributes
 * Uses CatalogSelector for brandId, modelId, variantId
 * Skips car_damage (handled in ImagesStep)
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, Theme } from '../../theme';
import { Text, Loading } from '../slices';
import { useCreateListingStore } from '../../stores/createListingStore';
import { AttributeFieldRenderer } from './AttributeFieldRenderer';
import { CatalogSelector } from './CatalogSelector';
import type { AttributeGroup, Attribute } from '../../stores/createListingStore/types';

interface AttributeGroupStepProps {
  group: AttributeGroup;
}

export default function AttributeGroupStep({ group }: AttributeGroupStepProps) {
  const theme = useTheme();
  const isRTL = theme.isRTL;
  const styles = useMemo(() => createStyles(theme, isRTL), [theme, isRTL]);

  const {
    formData,
    setFormField,
    setSpecField,
    brands,
    models,
    variants,
    isLoadingBrands,
    isLoadingModels,
    isLoadingVariants,
    fetchModelsAndVariants,
    fetchAndApplySuggestions,
    clearSuggestionSpecs,
    suggestionSpecs,
    isAutoFilling,
    getValidationError,
    clearValidationError,
  } = useCreateListingStore();

  // Track "Other" mode for brand/model/variant
  const [isOtherBrand, setIsOtherBrand] = useState(formData.isOtherBrand || false);
  const [isOtherModel, setIsOtherModel] = useState(formData.isOtherModel || false);
  const [isOtherVariant, setIsOtherVariant] = useState(false);

  // Custom text values for "Other" entries
  const [customBrandName, setCustomBrandName] = useState(formData.isOtherBrand ? (formData.brandName || '') : '');
  const [customModelName, setCustomModelName] = useState(formData.isOtherModel ? (formData.modelName || '') : '');
  const [customVariantName, setCustomVariantName] = useState('');

  // Pre-fill specs from pre-steps selection
  useEffect(() => {
    if (formData.brandId && !formData.specs.brandId) {
      setSpecField('brandId', formData.brandId);
    }
    if (formData.modelId && !formData.specs.modelId) {
      setSpecField('modelId', formData.modelId);
    }
    if (formData.variantId && !formData.specs.variantId) {
      setSpecField('variantId', formData.variantId);
    }
  }, []);

  // Fetch models when brand changes
  useEffect(() => {
    const brandId = formData.specs.brandId;
    if (brandId && typeof brandId === 'string' && !brandId.startsWith('other:')) {
      fetchModelsAndVariants(brandId);
      clearSuggestionSpecs();
    }
  }, [formData.specs.brandId]);

  // Fetch suggestions when brand + model changes
  useEffect(() => {
    const { brandId, modelId } = formData.specs;
    if (brandId && modelId && !String(brandId).startsWith('other:') && !String(modelId).startsWith('other:')) {
      fetchAndApplySuggestions();
    }
  }, [formData.specs.brandId, formData.specs.modelId, formData.specs.variantId, formData.specs.year]);

  // Brand handlers
  const handleBrandChange = (id: string, name?: string) => {
    setSpecField('brandId', id);
    setFormField('brandName', name);
    setFormField('isOtherBrand', false);
    // Clear dependent fields
    setSpecField('modelId', '');
    setSpecField('variantId', '');
    setFormField('modelName', undefined);
    setFormField('variantName', undefined);
    clearValidationError('brandId');
  };

  const handleBrandOtherToggle = (enabled: boolean) => {
    setIsOtherBrand(enabled);
    setFormField('isOtherBrand', enabled);
    if (enabled) {
      setSpecField('brandId', '');
      setFormField('brandName', customBrandName || undefined);
      setSpecField('modelId', '');
      setSpecField('variantId', '');
      setFormField('modelName', undefined);
      setFormField('variantName', undefined);
      setIsOtherModel(true);
      setFormField('isOtherModel', true);
    } else {
      setCustomBrandName('');
      setFormField('brandName', undefined);
    }
  };

  const handleBrandCustomChange = (text: string) => {
    setCustomBrandName(text);
    setFormField('brandName', text || undefined);
    setSpecField('brandId', `other:${text}`);
  };

  // Model handlers
  const handleModelChange = (id: string, name?: string) => {
    setSpecField('modelId', id);
    setFormField('modelName', name);
    setFormField('isOtherModel', false);
    setSpecField('variantId', '');
    setFormField('variantName', undefined);
    clearValidationError('modelId');
  };

  const handleModelOtherToggle = (enabled: boolean) => {
    setIsOtherModel(enabled);
    setFormField('isOtherModel', enabled);
    if (enabled) {
      setSpecField('modelId', '');
      setFormField('modelName', customModelName || undefined);
      setSpecField('variantId', '');
      setFormField('variantName', undefined);
      setIsOtherVariant(true);
    } else {
      setCustomModelName('');
      setFormField('modelName', undefined);
      setIsOtherVariant(false);
    }
  };

  const handleModelCustomChange = (text: string) => {
    setCustomModelName(text);
    setFormField('modelName', text || undefined);
    setSpecField('modelId', `other:${text}`);
  };

  // Variant handlers
  const handleVariantChange = (id: string, name?: string) => {
    setSpecField('variantId', id);
    setFormField('variantName', name);
    clearValidationError('variantId');
  };

  const handleVariantOtherToggle = (enabled: boolean) => {
    setIsOtherVariant(enabled);
    if (enabled) {
      setSpecField('variantId', '');
      setFormField('variantName', customVariantName || undefined);
    } else {
      setCustomVariantName('');
      setFormField('variantName', undefined);
    }
  };

  const handleVariantCustomChange = (text: string) => {
    setCustomVariantName(text);
    setFormField('variantName', text || undefined);
    setSpecField('variantId', `other:${text}`);
  };

  // Check if model/variant fields should be disabled
  const hasBrand = !!formData.specs.brandId || isOtherBrand;
  const hasModel = !!formData.specs.modelId || isOtherModel || isOtherBrand;
  const hasVariants = variants.length > 0;

  // Force "other" when parent is "other"
  const forceOtherModel = isOtherBrand;
  const forceOtherVariant = isOtherBrand || isOtherModel || (hasModel && !isLoadingModels && !hasVariants);

  // Get suggestions for a field
  const getSuggestions = (fieldKey: string): any[] | undefined => {
    const suggestions = suggestionSpecs?.[fieldKey];
    return Array.isArray(suggestions) && suggestions.length > 1 ? suggestions : undefined;
  };

  // Check if field was auto-filled
  const wasAutoFilled = (fieldKey: string): boolean => {
    const suggestions = suggestionSpecs?.[fieldKey];
    const currentValue = formData.specs[fieldKey];
    return Array.isArray(suggestions) && suggestions.length === 1 && currentValue !== undefined && currentValue !== '';
  };

  // Render attribute
  const renderAttribute = (attr: Attribute) => {
    // Handle catalog selectors
    if (attr.key === 'brandId') {
      return (
        <CatalogSelector
          key={attr.key}
          type="brand"
          label={attr.name}
          items={brands}
          value={formData.specs.brandId || ''}
          customValue={customBrandName}
          isOther={isOtherBrand}
          onChange={handleBrandChange}
          onCustomChange={handleBrandCustomChange}
          onOtherToggle={handleBrandOtherToggle}
          required={attr.validation === 'REQUIRED' || attr.validation === 'required'}
          loading={isLoadingBrands}
          error={getValidationError('brandId')}
        />
      );
    }

    if (attr.key === 'modelId') {
      return (
        <CatalogSelector
          key={attr.key}
          type="model"
          label={attr.name}
          items={models}
          value={formData.specs.modelId || ''}
          customValue={customModelName}
          isOther={isOtherModel || forceOtherModel}
          onChange={handleModelChange}
          onCustomChange={handleModelCustomChange}
          onOtherToggle={handleModelOtherToggle}
          required={attr.validation === 'REQUIRED' || attr.validation === 'required'}
          loading={isLoadingModels}
          disabled={!hasBrand}
          error={getValidationError('modelId')}
          showOtherToggle={!forceOtherModel}
        />
      );
    }

    if (attr.key === 'variantId') {
      return (
        <CatalogSelector
          key={attr.key}
          type="variant"
          label={attr.name}
          items={variants}
          value={formData.specs.variantId || ''}
          customValue={customVariantName || formData.variantName || ''}
          isOther={forceOtherVariant || isOtherVariant}
          onChange={handleVariantChange}
          onCustomChange={handleVariantCustomChange}
          onOtherToggle={handleVariantOtherToggle}
          required={attr.validation === 'REQUIRED' || attr.validation === 'required'}
          loading={isLoadingVariants}
          disabled={!hasModel}
          error={getValidationError('variantId')}
          showOtherToggle={!forceOtherVariant && hasVariants}
        />
      );
    }

    // Skip car_damage - handled in ImagesStep
    if (attr.key === 'car_damage' || attr.key === 'body_damage') {
      return null;
    }

    // Render regular attribute using AttributeFieldRenderer
    return (
      <AttributeFieldRenderer
        key={attr.key}
        attribute={attr}
        value={formData.specs[attr.key]}
        onChange={(value) => setSpecField(attr.key, value)}
        error={getValidationError(attr.key)}
        onClearError={() => clearValidationError(attr.key)}
        suggestions={getSuggestions(attr.key)}
        wasAutoFilled={wasAutoFilled(attr.key)}
      />
    );
  };

  return (
    <View style={styles.container}>
      <Text variant="h3" style={styles.title}>{group.name}</Text>
      <Text variant="paragraph" color="secondary" style={styles.subtitle}>
        أدخل معلومات {group.name}
      </Text>

      {/* Auto-fill loading indicator */}
      {isAutoFilling && (
        <View style={[styles.autoFillLoadingContainer, { backgroundColor: theme.colors.primaryLight }]}>
          <Loading type="svg" size="sm" />
          <Text variant="small" style={{ color: theme.colors.primary }}>
            جاري التعبئة التلقائية...
          </Text>
        </View>
      )}

      {group.attributes.map((attr) => renderAttribute(attr))}
    </View>
  );
}

const createStyles = (theme: Theme, isRTL: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      gap: theme.spacing.lg,
    },
    title: {
      marginBottom: theme.spacing.xs,
    },
    subtitle: {
      marginBottom: theme.spacing.sm,
    },
    autoFillLoadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      marginBottom: theme.spacing.md,
    },
  });
