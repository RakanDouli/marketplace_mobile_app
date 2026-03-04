/**
 * CatalogSelector
 * Wrapper component for Brand/Model/Variant selection
 * Uses SelectWithAdd from slices
 * Provides default labels and placeholders based on type
 */

import React from 'react';
import { SelectWithAdd, SelectWithAddOption } from '../slices';

export interface CatalogItem {
  id: string;
  name: string;
  nameAr?: string;
  logoUrl?: string;
}

export interface CatalogSelectorProps {
  /** Type of selector */
  type: 'brand' | 'model' | 'variant';
  /** Label text */
  label: string;
  /** Items to display in dropdown */
  items: CatalogItem[];
  /** Selected item ID */
  value: string;
  /** Custom text value (when "Other" is selected) */
  customValue?: string;
  /** Whether "Other" mode is active */
  isOther?: boolean;
  /** Change handler for selection */
  onChange: (id: string, name?: string) => void;
  /** Change handler for custom text */
  onCustomChange?: (text: string) => void;
  /** Change handler for "Other" toggle */
  onOtherToggle?: (enabled: boolean) => void;
  /** Whether field is required */
  required?: boolean;
  /** Whether dropdown is loading */
  loading?: boolean;
  /** Whether selector is disabled */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Disabled placeholder text */
  disabledPlaceholder?: string;
  /** Error message */
  error?: string;
  /** Whether to show "Other" toggle */
  showOtherToggle?: boolean;
  /** Label for "Other" toggle */
  otherToggleLabel?: string;
}

export function CatalogSelector({
  type,
  label,
  items,
  value,
  customValue = '',
  isOther = false,
  onChange,
  onCustomChange,
  onOtherToggle,
  required = false,
  loading = false,
  disabled = false,
  placeholder,
  disabledPlaceholder,
  error,
  showOtherToggle = true,
  otherToggleLabel,
}: CatalogSelectorProps) {
  // Get default labels based on type
  const getDefaultPlaceholder = () => {
    switch (type) {
      case 'brand': return 'اختر الماركة';
      case 'model': return 'اختر الموديل';
      case 'variant': return 'اختر الطراز';
    }
  };

  const getDefaultDisabledPlaceholder = () => {
    switch (type) {
      case 'brand': return 'اختر الماركة';
      case 'model': return 'اختر الماركة أولاً';
      case 'variant': return 'اختر الموديل أولاً';
    }
  };

  const getDefaultOtherLabel = () => {
    switch (type) {
      case 'brand': return 'ماركة أخرى';
      case 'model': return 'موديل آخر';
      case 'variant': return 'طراز آخر';
    }
  };

  const getCustomInputPlaceholder = () => {
    switch (type) {
      case 'brand': return 'أدخل اسم الماركة';
      case 'model': return 'أدخل اسم الموديل';
      case 'variant': return 'أدخل الطراز (اختياري)';
    }
  };

  // Convert items to SelectWithAdd options (filter out items without IDs)
  const options: SelectWithAddOption[] = items
    .filter(item => item.id)
    .map(item => ({
      value: item.id,
      label: item.nameAr || item.name,
      labelSecondary: item.nameAr && item.name ? item.name : undefined,
      logoUrl: item.logoUrl,
    }));

  return (
    <SelectWithAdd
      label={label}
      placeholder={placeholder || getDefaultPlaceholder()}
      disabledPlaceholder={disabledPlaceholder || getDefaultDisabledPlaceholder()}
      options={options}
      value={value}
      onChange={onChange}
      error={error}
      required={required}
      loading={loading}
      disabled={disabled}
      showLogos={type === 'brand'}
      showOtherToggle={showOtherToggle}
      otherToggleLabel={otherToggleLabel || getDefaultOtherLabel()}
      isOther={isOther}
      onOtherToggle={onOtherToggle}
      customValue={customValue}
      onCustomChange={onCustomChange}
      customInputPlaceholder={getCustomInputPlaceholder()}
      containerStyle={{ marginBottom: 0 }}
    />
  );
}

export default CatalogSelector;
