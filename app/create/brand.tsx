/**
 * Brand Selection Pre-Step
 * User selects brand before entering wizard
 * "Other" option allows custom brand entry in the form
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Car, ChevronLeft } from 'lucide-react-native';
import { useTheme, Theme } from '../../src/theme';
import { Text, ListItem, Image } from '../../src/components/slices';
import { useCreateListingStore } from '../../src/stores/createListingStore';
import type { Brand } from '../../src/stores/createListingStore/types';

export default function BrandSelectionScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();

  const {
    brands,
    isLoadingBrands,
    attributes,
    setFormField,
    fetchModels,
  } = useCreateListingStore();

  // Check if category has models
  const hasModels = attributes.some(attr => attr.key === 'modelId');

  const handleBrandSelect = async (brand: Brand) => {
    // Set brand in form data and specs
    setFormField('brandId', brand.id);
    setFormField('brandName', brand.name);
    setFormField('isOtherBrand', false);
    setFormField('isOtherModel', false);

    // Fetch models for this brand
    await fetchModels(brand.id);

    if (hasModels) {
      // Go to model selection
      router.push('/create/model');
    } else {
      // No models for this category, go to wizard
      router.push('/create/wizard');
    }
  };

  const handleOtherSelect = () => {
    // Clear brand/model/variant - user will type in form
    setFormField('brandId', undefined);
    setFormField('brandName', undefined);
    setFormField('modelId', undefined);
    setFormField('modelName', undefined);
    setFormField('variantId', undefined);
    setFormField('variantName', undefined);
    setFormField('isOtherBrand', true);
    setFormField('isOtherModel', true);

    // Skip model/variant, go to wizard
    router.push('/create/wizard');
  };

  // Render brand logo
  const renderBrandIcon = (brand: Brand) => {
    if (brand.logoUrl) {
      return (
        <View style={styles.brandLogoContainer}>
          <Image
            src={brand.logoUrl}
            width={32}
            height={32}
            resizeMode="contain"
            transparent
          />
        </View>
      );
    }
    return (
      <View style={styles.brandLogoContainer}>
        <Car size={24} color={theme.colors.textMuted} />
      </View>
    );
  };

  if (isLoadingBrands) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'اختر الماركة',
            headerShown: true,
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
                <ChevronLeft size={24} color={theme.colors.text} />
              </TouchableOpacity>
            ),
          }}
        />
        <View style={[styles.loadingContainer, { backgroundColor: theme.colors.surface }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="paragraph" color="secondary" style={styles.loadingText}>
            جاري تحميل الماركات...
          </Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'اختر الماركة',
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
              <ChevronLeft size={24} color={theme.colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.surface }]} edges={['bottom']}>
        {/* Fixed "Other" option at top */}
        <View style={[styles.otherSection, { backgroundColor: theme.colors.bg, borderBottomColor: theme.colors.border }]}>
          <ListItem
            label="ماركة أخرى"
            subtitle="أدخل اسم الماركة يدوياً"
            onPress={handleOtherSelect}
            showArrow
            showBorder={false}
            size="lg"
          />
        </View>

        {/* Divider */}
        <View style={[styles.sectionDivider, { backgroundColor: theme.colors.surface }]}>
          <Text variant="small" color="secondary">
            أو اختر من القائمة
          </Text>
        </View>

        {/* Brand list */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {brands.length > 0 ? (
            brands.map((brand, index) => (
              <ListItem
                key={brand.id}
                label={brand.nameAr || brand.name}
                subtitle={brand.nameAr && brand.nameAr !== brand.name ? brand.name : undefined}
                icon={renderBrandIcon(brand)}
                onPress={() => handleBrandSelect(brand)}
                showArrow
                showBorder={index < brands.length - 1}
                size="lg"
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text variant="body" color="secondary">
                لا توجد ماركات متاحة
              </Text>
              <Text variant="small" color="muted" style={{ marginTop: 8 }}>
                اختر "ماركة أخرى" لإدخال الاسم يدوياً
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
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
    otherSection: {
      borderBottomWidth: 1,
    },
    sectionDivider: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    scrollView: {
      flex: 1,
    },
    brandLogoContainer: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    brandLogo: {
      width: 32,
      height: 32,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
      paddingHorizontal: 16,
    },
  });
