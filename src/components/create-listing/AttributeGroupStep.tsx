/**
 * Attribute Group Step
 * Renders dynamic attributes based on category configuration
 */

import React from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { Text } from '../slices/Text';
import { useCreateListingStore } from '../../stores/createListingStore';
import type { AttributeGroup, Attribute } from '../../stores/createListingStore/types';

interface AttributeGroupStepProps {
  group: AttributeGroup;
}

export default function AttributeGroupStep({ group }: AttributeGroupStepProps) {
  const theme = useTheme();
  const { formData, setSpecField } = useCreateListingStore();

  const renderAttribute = (attr: Attribute) => {
    const currentValue = formData.specs[attr.key];
    const isRequired = attr.validation === 'REQUIRED';

    switch (attr.type) {
      case 'select':
      case 'single_select':
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
          </View>
        );

      case 'number':
      case 'integer':
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
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                },
              ]}
              value={currentValue?.toString() || ''}
              onChangeText={(text) => {
                const numValue = parseInt(text.replace(/[^0-9]/g, ''), 10) || 0;
                setSpecField(attr.key, numValue);
              }}
              placeholder={`أدخل ${attr.name}`}
              placeholderTextColor={theme.colors.textMuted}
              textAlign="right"
              keyboardType="numeric"
            />
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
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                },
              ]}
              value={currentValue || ''}
              onChangeText={(text) => setSpecField(attr.key, text)}
              placeholder={`أدخل ${attr.name}`}
              placeholderTextColor={theme.colors.textMuted}
              textAlign="right"
            />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 20,
  },
  title: {
    textAlign: 'right',
    marginBottom: 4,
  },
  subtitle: {
    textAlign: 'right',
    marginBottom: 8,
  },
  field: {
    gap: 8,
  },
  label: {
    textAlign: 'right',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  booleanContainer: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  booleanOption: {
    flex: 1,
    maxWidth: 120,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
});
