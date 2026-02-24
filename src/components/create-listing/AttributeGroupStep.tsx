/**
 * Attribute Group Step
 * Renders dynamic attributes based on category configuration
 * Handles special fields: brandId, modelId, variantId with API-driven dropdowns
 * Supports "Other" option with switch toggle for custom entry
 * Includes real-time validation with Arabic error messages
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { Check, ChevronDown, Car, Plus, AlertCircle } from 'lucide-react-native';
import { useTheme, Theme } from '../../theme';
import { Text, Loading } from '../slices';
import { useCreateListingStore } from '../../stores/createListingStore';
import { validateAttribute } from '../../lib/validation/listingValidation';
import type { AttributeGroup, Attribute, Brand, Model, Variant } from '../../stores/createListingStore/types';

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
    fetchModels,
    fetchVariants,
    validationErrors,
    getValidationError,
    clearValidationError,
  } = useCreateListingStore();

  // Track which selector is expanded
  const [expandedSelector, setExpandedSelector] = useState<string | null>(null);

  // Track "Other" mode for brand/model/variant
  const [isOtherBrand, setIsOtherBrand] = useState(formData.isOtherBrand || false);
  const [isOtherModel, setIsOtherModel] = useState(formData.isOtherModel || false);
  const [isOtherVariant, setIsOtherVariant] = useState(false);

  // Custom text values for "Other" entries
  const [customBrandName, setCustomBrandName] = useState(formData.isOtherBrand ? (formData.brandName || '') : '');
  const [customModelName, setCustomModelName] = useState(formData.isOtherModel ? (formData.modelName || '') : '');
  const [customVariantName, setCustomVariantName] = useState('');

  // Pre-fill specs from pre-steps selection (brandId, modelId, variantId)
  // This runs once when the component mounts to sync pre-step selections to specs
  useEffect(() => {
    // If brand was selected in pre-steps but not yet in specs, sync it
    if (formData.brandId && !formData.specs.brandId) {
      setSpecField('brandId', formData.brandId);
    }
    // If model was selected in pre-steps but not yet in specs, sync it
    if (formData.modelId && !formData.specs.modelId) {
      setSpecField('modelId', formData.modelId);
    }
    // If variant was selected in pre-steps but not yet in specs, sync it
    if (formData.variantId && !formData.specs.variantId) {
      setSpecField('variantId', formData.variantId);
    }
  }, []); // Run once on mount

  // When brand changes, fetch models
  useEffect(() => {
    const brandId = formData.specs.brandId;
    if (brandId && typeof brandId === 'string') {
      fetchModels(brandId);
    }
  }, [formData.specs.brandId]);

  // When model changes, fetch variants
  useEffect(() => {
    const modelId = formData.specs.modelId;
    if (modelId && typeof modelId === 'string') {
      fetchVariants(modelId);
    }
  }, [formData.specs.modelId]);

  // Get selected brand/model/variant names for display
  // Check both specs and formData for pre-filled values from pre-steps
  const selectedBrandName = useMemo(() => {
    // First check specs (wizard in-progress selection)
    const brandId = formData.specs.brandId || formData.brandId;
    if (!brandId) return null;
    // Check if it's a custom "other" value
    if (typeof brandId === 'string' && brandId.startsWith('other:')) {
      return brandId.replace('other:', '');
    }
    const brand = brands.find(b => b.id === brandId);
    return brand?.name || formData.brandName || null;
  }, [formData.specs.brandId, formData.brandId, formData.brandName, brands]);

  const selectedModelName = useMemo(() => {
    const modelId = formData.specs.modelId || formData.modelId;
    if (!modelId) return null;
    // Check if it's a custom "other" value
    if (typeof modelId === 'string' && modelId.startsWith('other:')) {
      return modelId.replace('other:', '');
    }
    const model = models.find(m => m.id === modelId);
    return model?.name || formData.modelName || null;
  }, [formData.specs.modelId, formData.modelId, formData.modelName, models]);

  const selectedVariantName = useMemo(() => {
    const variantId = formData.specs.variantId || formData.variantId;
    if (!variantId) return null;
    // Check if it's a custom "other" value
    if (typeof variantId === 'string' && variantId.startsWith('other:')) {
      return variantId.replace('other:', '');
    }
    const variant = variants.find(v => v.id === variantId);
    return variant?.name || formData.variantName || null;
  }, [formData.specs.variantId, formData.variantId, formData.variantName, variants]);

  // Handle brand selection
  const handleBrandSelect = (brand: Brand) => {
    setSpecField('brandId', brand.id);
    setFormField('brandName', brand.name);
    setFormField('isOtherBrand', false);
    // Clear dependent fields
    setSpecField('modelId', '');
    setSpecField('variantId', '');
    setFormField('modelName', undefined);
    setFormField('variantName', undefined);
    setExpandedSelector(null);
  };

  // Handle model selection
  const handleModelSelect = (model: Model) => {
    setSpecField('modelId', model.id);
    setFormField('modelName', model.name);
    setFormField('isOtherModel', false);
    // Clear variant
    setSpecField('variantId', '');
    setFormField('variantName', undefined);
    setExpandedSelector(null);
  };

  // Handle variant selection
  const handleVariantSelect = (variant: Variant) => {
    setSpecField('variantId', variant.id);
    setFormField('variantName', variant.name);
    setExpandedSelector(null);
  };

  // Handle "Other" brand toggle
  const handleOtherBrandToggle = (enabled: boolean) => {
    setIsOtherBrand(enabled);
    setFormField('isOtherBrand', enabled);
    if (enabled) {
      // Clear selected brand, keep custom text
      setSpecField('brandId', '');
      setFormField('brandName', customBrandName || undefined);
      // Also clear model/variant since brand changed
      setSpecField('modelId', '');
      setSpecField('variantId', '');
      setFormField('modelName', undefined);
      setFormField('variantName', undefined);
      setIsOtherModel(true); // Force "other" for model too
      setFormField('isOtherModel', true);
    } else {
      // Clear custom text, prepare for selection
      setCustomBrandName('');
      setFormField('brandName', undefined);
    }
    setExpandedSelector(null);
  };

  // Handle "Other" model toggle
  const handleOtherModelToggle = (enabled: boolean) => {
    setIsOtherModel(enabled);
    setFormField('isOtherModel', enabled);
    if (enabled) {
      // Clear selected model, keep custom text
      setSpecField('modelId', '');
      setFormField('modelName', customModelName || undefined);
      // Also clear variant and force "other" variant
      setSpecField('variantId', '');
      setFormField('variantName', undefined);
      setIsOtherVariant(true);
    } else {
      // Clear custom text, prepare for selection
      setCustomModelName('');
      setFormField('modelName', undefined);
      setIsOtherVariant(false);
    }
    setExpandedSelector(null);
  };

  // Handle "Other" variant toggle
  const handleOtherVariantToggle = (enabled: boolean) => {
    setIsOtherVariant(enabled);
    if (enabled) {
      // Clear selected variant, prepare for custom entry
      setSpecField('variantId', '');
      setFormField('variantName', customVariantName || undefined);
    } else {
      // Clear custom text, prepare for selection
      setCustomVariantName('');
      setFormField('variantName', undefined);
    }
    setExpandedSelector(null);
  };

  // Handle custom brand name input
  const handleCustomBrandChange = (text: string) => {
    setCustomBrandName(text);
    setFormField('brandName', text || undefined);
    // Store as custom spec value for submission
    setSpecField('brandId', `other:${text}`);
  };

  // Handle custom model name input
  const handleCustomModelChange = (text: string) => {
    setCustomModelName(text);
    setFormField('modelName', text || undefined);
    // Store as custom spec value for submission
    setSpecField('modelId', `other:${text}`);
  };

  // Handle custom variant name input
  const handleCustomVariantChange = (text: string) => {
    setCustomVariantName(text);
    setFormField('variantName', text || undefined);
    // Store as custom spec value for submission
    setSpecField('variantId', `other:${text}`);
  };

  // Helper to render field error message
  const renderFieldError = (fieldKey: string) => {
    const error = getValidationError(fieldKey);
    if (!error) return null;

    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={14} color={theme.colors.error} />
        <Text variant="small" style={[styles.errorText, { color: theme.colors.error }]}>
          {error}
        </Text>
      </View>
    );
  };

  // Render brand selector with dropdown and "Other" switch below
  const renderBrandSelector = (attr: Attribute) => {
    const isExpanded = expandedSelector === 'brandId';
    const isRequired = attr.validation === 'REQUIRED' || attr.validation === 'required';

    return (
      <View key={attr.key} style={styles.field}>
        <Text variant="body" style={styles.label}>
          {attr.name} {isRequired && '*'}
        </Text>

        {isOtherBrand ? (
          // Custom brand input field
          <View style={styles.otherInputContainer}>
            <Plus size={20} color={theme.colors.primary} style={styles.otherInputIcon} />
            <TextInput
              style={[
                styles.input,
                styles.otherInput,
                {
                  backgroundColor: theme.colors.bg,
                  borderColor: theme.colors.primary,
                  color: theme.colors.text,
                },
              ]}
              value={customBrandName}
              onChangeText={handleCustomBrandChange}
              placeholder="أدخل اسم الماركة"
              placeholderTextColor={theme.colors.textMuted}
              textAlign={isRTL ? 'right' : 'left'}
            />
          </View>
        ) : (
          <>
            {/* Selected value or placeholder */}
            <TouchableOpacity
              style={[styles.selector, { borderColor: theme.colors.border, backgroundColor: theme.colors.bg }]}
              onPress={() => setExpandedSelector(isExpanded ? null : 'brandId')}
            >
              <Text
                variant="body"
                style={{ color: selectedBrandName ? theme.colors.text : theme.colors.textMuted }}
              >
                {selectedBrandName || 'اختر الماركة'}
              </Text>
              <ChevronDown size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>

            {/* Dropdown list */}
            {isExpanded && (
              <View style={[styles.dropdownContainer, { backgroundColor: theme.colors.bg, borderColor: theme.colors.border }]}>
                {isLoadingBrands ? (
                  <View style={styles.loadingContainer}>
                    <Loading type="svg" size="sm" />
                  </View>
                ) : (
                  <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                    {brands.map((brand) => (
                      <TouchableOpacity
                        key={brand.id}
                        style={[
                          styles.dropdownItem,
                          formData.specs.brandId === brand.id && { backgroundColor: theme.colors.primary + '15' },
                        ]}
                        onPress={() => handleBrandSelect(brand)}
                      >
                        <View style={styles.brandItemContent}>
                          <View style={[styles.brandIcon, { backgroundColor: theme.colors.surface }]}>
                            <Car size={16} color={theme.colors.textMuted} />
                          </View>
                          <Text variant="body">{brand.name}</Text>
                        </View>
                        {formData.specs.brandId === brand.id && (
                          <Check size={18} color={theme.colors.primary} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}
          </>
        )}

        {/* "Other" switch below the selector */}
        <View style={styles.otherSwitchRow}>
          <Text variant="small" color="secondary">ماركة أخرى</Text>
          <Switch
            value={isOtherBrand}
            onValueChange={handleOtherBrandToggle}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary + '60' }}
            thumbColor={isOtherBrand ? theme.colors.primary : theme.colors.surface}
          />
        </View>

        {/* Validation error */}
        {renderFieldError('brandId')}
      </View>
    );
  };

  // Render model selector with dropdown and "Other" switch below
  const renderModelSelector = (attr: Attribute) => {
    const isExpanded = expandedSelector === 'modelId';
    const isRequired = attr.validation === 'REQUIRED' || attr.validation === 'required';
    const hasBrand = !!formData.specs.brandId || isOtherBrand;

    // If brand is "other", model must also be "other"
    const forceOtherModel = isOtherBrand;

    return (
      <View key={attr.key} style={styles.field}>
        <Text variant="body" style={styles.label}>
          {attr.name} {isRequired && '*'}
        </Text>

        {(isOtherModel || forceOtherModel) ? (
          // Custom model input field
          <View style={styles.otherInputContainer}>
            <Plus size={20} color={theme.colors.primary} style={styles.otherInputIcon} />
            <TextInput
              style={[
                styles.input,
                styles.otherInput,
                {
                  backgroundColor: theme.colors.bg,
                  borderColor: theme.colors.primary,
                  color: theme.colors.text,
                },
                !hasBrand && styles.inputDisabled,
              ]}
              value={customModelName}
              onChangeText={handleCustomModelChange}
              placeholder={hasBrand ? "أدخل اسم الموديل" : "اختر الماركة أولاً"}
              placeholderTextColor={theme.colors.textMuted}
              textAlign={isRTL ? 'right' : 'left'}
              editable={hasBrand}
            />
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={[
                styles.selector,
                { borderColor: theme.colors.border, backgroundColor: theme.colors.bg },
                !hasBrand && styles.selectorDisabled,
              ]}
              onPress={() => hasBrand && setExpandedSelector(isExpanded ? null : 'modelId')}
              disabled={!hasBrand}
            >
              <Text
                variant="body"
                style={{ color: selectedModelName ? theme.colors.text : theme.colors.textMuted }}
              >
                {selectedModelName || (hasBrand ? 'اختر الموديل' : 'اختر الماركة أولاً')}
              </Text>
              <ChevronDown size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>

            {isExpanded && (
              <View style={[styles.dropdownContainer, { backgroundColor: theme.colors.bg, borderColor: theme.colors.border }]}>
                {isLoadingModels ? (
                  <View style={styles.loadingContainer}>
                    <Loading type="svg" size="sm" />
                  </View>
                ) : (
                  <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                    {models.map((model) => (
                      <TouchableOpacity
                        key={model.id}
                        style={[
                          styles.dropdownItem,
                          formData.specs.modelId === model.id && { backgroundColor: theme.colors.primary + '15' },
                        ]}
                        onPress={() => handleModelSelect(model)}
                      >
                        <Text variant="body">{model.name}</Text>
                        {formData.specs.modelId === model.id && (
                          <Check size={18} color={theme.colors.primary} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}
          </>
        )}

        {/* "Other" switch below the selector - hidden if brand is "other" */}
        {!forceOtherModel && (
          <View style={[styles.otherSwitchRow, !hasBrand && styles.switchDisabled]}>
            <Text variant="small" color="secondary">موديل آخر</Text>
            <Switch
              value={isOtherModel}
              onValueChange={handleOtherModelToggle}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary + '60' }}
              thumbColor={isOtherModel ? theme.colors.primary : theme.colors.surface}
              disabled={!hasBrand}
            />
          </View>
        )}

        {/* Validation error */}
        {renderFieldError('modelId')}
      </View>
    );
  };

  // Render variant selector with dropdown and "Other" switch below
  const renderVariantSelector = (attr: Attribute) => {
    const isExpanded = expandedSelector === 'variantId';
    const isRequired = attr.validation === 'REQUIRED' || attr.validation === 'required';
    const hasModel = !!formData.specs.modelId || isOtherModel || isOtherBrand;
    const hasVariants = variants.length > 0;

    // If brand or model is "other", force variant to be "other" too
    const forceOtherVariant = isOtherBrand || isOtherModel;

    // Show text input if: forced other, user toggled other, or no variants available
    const showAsTextInput = forceOtherVariant || isOtherVariant || (hasModel && !isLoadingModels && !hasVariants);

    return (
      <View key={attr.key} style={styles.field}>
        <Text variant="body" style={styles.label}>
          {attr.name} {isRequired && '*'}
        </Text>

        {showAsTextInput ? (
          // Custom variant input field (when "other" or no variants available)
          <View style={styles.otherInputContainer}>
            <Plus size={20} color={theme.colors.primary} style={styles.otherInputIcon} />
            <TextInput
              style={[
                styles.input,
                styles.otherInput,
                {
                  backgroundColor: theme.colors.bg,
                  borderColor: theme.colors.primary,
                  color: theme.colors.text,
                },
                !hasModel && styles.inputDisabled,
              ]}
              value={customVariantName || (formData.variantName || '')}
              onChangeText={handleCustomVariantChange}
              placeholder={hasModel ? "أدخل الطراز (اختياري)" : "اختر الموديل أولاً"}
              placeholderTextColor={theme.colors.textMuted}
              textAlign={isRTL ? 'right' : 'left'}
              editable={hasModel}
            />
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={[
                styles.selector,
                { borderColor: theme.colors.border, backgroundColor: theme.colors.bg },
                !hasModel && styles.selectorDisabled,
              ]}
              onPress={() => hasModel && setExpandedSelector(isExpanded ? null : 'variantId')}
              disabled={!hasModel}
            >
              <Text
                variant="body"
                style={{ color: selectedVariantName ? theme.colors.text : theme.colors.textMuted }}
              >
                {selectedVariantName || (hasModel ? 'اختر الطراز' : 'اختر الموديل أولاً')}
              </Text>
              <ChevronDown size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>

            {isExpanded && (
              <View style={[styles.dropdownContainer, { backgroundColor: theme.colors.bg, borderColor: theme.colors.border }]}>
                <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                  {variants.map((variant) => (
                    <TouchableOpacity
                      key={variant.id}
                      style={[
                        styles.dropdownItem,
                        formData.specs.variantId === variant.id && { backgroundColor: theme.colors.primary + '15' },
                      ]}
                      onPress={() => handleVariantSelect(variant)}
                    >
                      <Text variant="body">{variant.name}</Text>
                      {formData.specs.variantId === variant.id && (
                        <Check size={18} color={theme.colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </>
        )}

        {/* "Other" switch below the selector - hidden if brand/model is "other" or no variants exist */}
        {!forceOtherVariant && hasVariants && (
          <View style={[styles.otherSwitchRow, !hasModel && styles.switchDisabled]}>
            <Text variant="small" color="secondary">طراز آخر</Text>
            <Switch
              value={isOtherVariant}
              onValueChange={handleOtherVariantToggle}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary + '60' }}
              thumbColor={isOtherVariant ? theme.colors.primary : theme.colors.surface}
              disabled={!hasModel}
            />
          </View>
        )}

        {/* Validation error */}
        {renderFieldError('variantId')}
      </View>
    );
  };

  // Render regular attribute field
  const renderAttribute = (attr: Attribute) => {
    // Handle special catalog fields
    if (attr.key === 'brandId') return renderBrandSelector(attr);
    if (attr.key === 'modelId') return renderModelSelector(attr);
    if (attr.key === 'variantId') return renderVariantSelector(attr);

    const currentValue = formData.specs[attr.key];
    const isRequired = attr.validation === 'REQUIRED' || attr.validation === 'required';

    switch (attr.type) {
      case 'select':
      case 'single_select':
      case 'selector':
        return (
          <View key={attr.key} style={styles.field}>
            <Text variant="body" style={styles.label}>
              {attr.name} {isRequired && '*'}
            </Text>
            <View style={styles.optionsContainer}>
              {(attr.options || []).map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionChip,
                    {
                      backgroundColor:
                        currentValue === option.key
                          ? theme.colors.primary
                          : theme.colors.bg,
                      borderColor:
                        currentValue === option.key
                          ? theme.colors.primary
                          : theme.colors.border,
                    },
                  ]}
                  onPress={() => setSpecField(attr.key, option.key)}
                >
                  <Text
                    variant="small"
                    style={{
                      color:
                        currentValue === option.key ? '#fff' : theme.colors.text,
                    }}
                  >
                    {option.value}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {renderFieldError(attr.key)}
          </View>
        );

      case 'multi_select':
        const selectedValues = Array.isArray(currentValue) ? currentValue : [];
        return (
          <View key={attr.key} style={styles.field}>
            <Text variant="body" style={styles.label}>
              {attr.name} {isRequired && '*'}
            </Text>
            <View style={styles.optionsContainer}>
              {(attr.options || []).map((option) => {
                const isSelected = selectedValues.includes(option.key);
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.optionChip,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.primary
                          : theme.colors.bg,
                        borderColor: isSelected
                          ? theme.colors.primary
                          : theme.colors.border,
                      },
                    ]}
                    onPress={() => {
                      const newValues = isSelected
                        ? selectedValues.filter((v) => v !== option.key)
                        : [...selectedValues, option.key];
                      setSpecField(attr.key, newValues);
                    }}
                  >
                    {isSelected && <Check size={14} color="#fff" />}
                    <Text
                      variant="small"
                      style={{ color: isSelected ? '#fff' : theme.colors.text }}
                    >
                      {option.value}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {renderFieldError(attr.key)}
          </View>
        );

      case 'number':
      case 'integer':
      case 'range_selector':
        return (
          <View key={attr.key} style={styles.field}>
            <Text variant="body" style={styles.label}>
              {attr.name} {isRequired && '*'}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.bg,
                  borderColor: getValidationError(attr.key) ? theme.colors.error : theme.colors.border,
                  color: theme.colors.text,
                },
              ]}
              value={currentValue?.toString() || ''}
              onChangeText={(text) => {
                const numValue = parseInt(text.replace(/[^0-9]/g, ''), 10) || 0;
                setSpecField(attr.key, numValue);
                clearValidationError(attr.key);
              }}
              placeholder={`أدخل ${attr.name}`}
              placeholderTextColor={theme.colors.textMuted}
              textAlign={isRTL ? 'right' : 'left'}
              keyboardType="numeric"
            />
            {renderFieldError(attr.key)}
          </View>
        );

      case 'text':
      case 'string':
      default:
        return (
          <View key={attr.key} style={styles.field}>
            <Text variant="body" style={styles.label}>
              {attr.name} {isRequired && '*'}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.bg,
                  borderColor: getValidationError(attr.key) ? theme.colors.error : theme.colors.border,
                  color: theme.colors.text,
                },
              ]}
              value={currentValue || ''}
              onChangeText={(text) => {
                setSpecField(attr.key, text);
                clearValidationError(attr.key);
              }}
              placeholder={`أدخل ${attr.name}`}
              placeholderTextColor={theme.colors.textMuted}
              textAlign={isRTL ? 'right' : 'left'}
            />
            {renderFieldError(attr.key)}
          </View>
        );

      case 'boolean':
        return (
          <View key={attr.key} style={styles.field}>
            <Text variant="body" style={styles.label}>
              {attr.name} {isRequired && '*'}
            </Text>
            <View style={styles.booleanContainer}>
              <TouchableOpacity
                style={[
                  styles.booleanOption,
                  {
                    backgroundColor:
                      currentValue === true
                        ? theme.colors.primary
                        : theme.colors.bg,
                    borderColor:
                      currentValue === true
                        ? theme.colors.primary
                        : theme.colors.border,
                  },
                ]}
                onPress={() => setSpecField(attr.key, true)}
              >
                <Text
                  variant="body"
                  style={{ color: currentValue === true ? '#fff' : theme.colors.text }}
                >
                  نعم
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.booleanOption,
                  {
                    backgroundColor:
                      currentValue === false
                        ? theme.colors.primary
                        : theme.colors.bg,
                    borderColor:
                      currentValue === false
                        ? theme.colors.primary
                        : theme.colors.border,
                  },
                ]}
                onPress={() => setSpecField(attr.key, false)}
              >
                <Text
                  variant="body"
                  style={{ color: currentValue === false ? '#fff' : theme.colors.text }}
                >
                  لا
                </Text>
              </TouchableOpacity>
            </View>
            {renderFieldError(attr.key)}
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="h3" style={styles.title}>{group.name}</Text>
      <Text variant="paragraph" color="secondary" style={styles.subtitle}>
        أدخل معلومات {group.name}
      </Text>

      {group.attributes.map((attr) => renderAttribute(attr))}
    </View>
  );
}

const createStyles = (theme: Theme, isRTL: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      gap: 20,
    },
    title: {
      // Text component handles RTL automatically
      marginBottom: 4,
    },
    subtitle: {
      // Text component handles RTL automatically
      marginBottom: 8,
    },
    field: {
      gap: 8,
    },
    label: {
      // Text component handles RTL automatically
    },
    otherSwitchRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: 8,
      marginTop: 4,
    },
    switchDisabled: {
      opacity: 0.5,
    },
    otherInputContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
    },
    otherInputIcon: {
      position: 'absolute',
      [isRTL ? 'right' : 'left']: 12,
      zIndex: 1,
    },
    otherInput: {
      flex: 1,
      [isRTL ? 'paddingRight' : 'paddingLeft']: 44,
      borderWidth: 2,
    },
    inputDisabled: {
      opacity: 0.5,
    },
    input: {
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      textAlign: isRTL ? 'right' : 'left',
    },
    optionsContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      flexWrap: 'wrap',
      gap: 8,
      justifyContent: 'flex-start',
    },
    optionChip: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 20,
      borderWidth: 1,
    },
    booleanContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: 12,
      justifyContent: 'flex-start',
    },
    booleanOption: {
      flex: 1,
      maxWidth: 120,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: 'center',
    },

    // Error styles
    errorContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 4,
      justifyContent: 'flex-start',
    },
    errorText: {
      // Text component handles RTL automatically
    },

    // Selector (dropdown) styles
    selector: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    selectorDisabled: {
      opacity: 0.5,
    },
    dropdownContainer: {
      borderWidth: 1,
      borderRadius: 12,
      marginTop: 4,
      maxHeight: 250,
      overflow: 'hidden',
    },
    dropdownScroll: {
      maxHeight: 250,
    },
    dropdownItem: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    brandItemContent: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 12,
    },
    brandIcon: {
      width: 32,
      height: 32,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingContainer: {
      padding: 20,
      alignItems: 'center',
    },
  });
