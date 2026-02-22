/**
 * Create Listing Wizard
 * Step-by-step listing creation with dynamic steps based on category
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react-native';
import { useTheme } from '../../src/theme';
import { Text } from '../../src/components/slices/Text';
import { useCreateListingStore } from '../../src/stores/createListingStore';

// Import step components
import BrandStep from '../../src/components/create-listing/BrandStep';
import ModelStep from '../../src/components/create-listing/ModelStep';
import BasicInfoStep from '../../src/components/create-listing/BasicInfoStep';
import ImagesStep from '../../src/components/create-listing/ImagesStep';
import AttributeGroupStep from '../../src/components/create-listing/AttributeGroupStep';
import LocationReviewStep from '../../src/components/create-listing/LocationReviewStep';

export default function WizardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();

  const {
    currentStep,
    steps,
    isLoadingAttributes,
    nextStep,
    previousStep,
    goToStep,
    validateCurrentStep,
    submitListing,
    isSubmitting,
    error,
    ensureDraftExists,
    draftId,
  } = useCreateListingStore();

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  // Ensure draft exists when starting wizard
  useEffect(() => {
    if (categoryId && !draftId) {
      ensureDraftExists();
    }
  }, [categoryId, draftId]);

  const handleNext = async () => {
    if (isLastStep) {
      try {
        await submitListing();
        // Navigate to success screen or listing
        router.replace('/create/success');
      } catch (err) {
        // Error is handled by store
      }
    } else {
      nextStep();
    }
  };

  const handleBack = () => {
    if (isFirstStep) {
      router.back();
    } else {
      previousStep();
    }
  };

  // Render current step content
  const renderStepContent = () => {
    if (!currentStepData) return null;

    switch (currentStepData.type) {
      case 'brand':
        return <BrandStep />;
      case 'model':
        return <ModelStep />;
      case 'basic':
        return <BasicInfoStep />;
      case 'images':
        return <ImagesStep />;
      case 'attribute_group':
        return <AttributeGroupStep group={currentStepData.attributeGroup!} />;
      case 'location_review':
        return <LocationReviewStep />;
      default:
        return (
          <View style={styles.placeholderStep}>
            <Text variant="h3">خطوة غير معروفة</Text>
          </View>
        );
    }
  };

  if (isLoadingAttributes) {
    return (
      <>
        <Stack.Screen options={{ title: 'إضافة إعلان', headerShown: true }} />
        <View style={[styles.loadingContainer, { backgroundColor: theme.colors.surface }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="paragraph" color="secondary" style={styles.loadingText}>
            جاري تحميل النموذج...
          </Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: currentStepData?.title || 'إضافة إعلان',
          headerShown: true,
          headerBackTitle: 'رجوع',
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.surface }]} edges={['bottom']}>
        {/* Progress Bar */}
        <View style={[styles.progressContainer, { backgroundColor: theme.colors.bg }]}>
          <View style={styles.progressBar}>
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <TouchableOpacity
                  onPress={() => goToStep(index)}
                  style={[
                    styles.progressDot,
                    {
                      backgroundColor:
                        index < currentStep
                          ? theme.colors.success
                          : index === currentStep
                          ? theme.colors.primary
                          : theme.colors.border,
                    },
                  ]}
                >
                  {index < currentStep && <Check size={12} color="#fff" />}
                </TouchableOpacity>
                {index < steps.length - 1 && (
                  <View
                    style={[
                      styles.progressLine,
                      {
                        backgroundColor:
                          index < currentStep ? theme.colors.success : theme.colors.border,
                      },
                    ]}
                  />
                )}
              </React.Fragment>
            ))}
          </View>
          <Text variant="small" color="secondary" style={styles.progressText}>
            الخطوة {currentStep + 1} من {steps.length}
          </Text>
        </View>

        {/* Step Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {renderStepContent()}

          {/* Error Message */}
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: theme.colors.error + '15' }]}>
              <Text variant="paragraph" color="error">{error}</Text>
            </View>
          )}
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={[styles.footer, { backgroundColor: theme.colors.bg, borderTopColor: theme.colors.border }]}>
          <TouchableOpacity
            style={[styles.navButton, styles.backButton, { borderColor: theme.colors.border }]}
            onPress={handleBack}
          >
            <ChevronRight size={20} color={theme.colors.text} />
            <Text variant="body">{isFirstStep ? 'إلغاء' : 'رجوع'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navButton,
              styles.nextButton,
              { backgroundColor: theme.colors.primary },
              isSubmitting && styles.disabledButton,
            ]}
            onPress={handleNext}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text variant="body" color="inverse">
                  {isLastStep ? 'نشر الإعلان' : 'التالي'}
                </Text>
                <ChevronLeft size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressLine: {
    flex: 1,
    height: 2,
    maxWidth: 40,
  },
  progressText: {
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  placeholderStep: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  backButton: {
    borderWidth: 1,
  },
  nextButton: {},
  disabledButton: {
    opacity: 0.6,
  },
});
