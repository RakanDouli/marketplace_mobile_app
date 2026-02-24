/**
 * Create Listing Wizard
 * Step-by-step listing creation with dynamic steps based on category
 *
 * Steps come from backend attribute groups:
 * 1. First attribute group (brand/model/variant/year/mileage) - pre-filled if selected in pre-steps
 * 2. Basic info (title, description, price, condition, bidding)
 * 3. Images
 * 4. Other attribute groups (specs, features, etc.)
 * 5. Location and review
 *
 * RTL/LTR Layout:
 * - Progress bar flows based on reading direction
 * - Navigation buttons: Next always on the forward side, Back on the back side
 */

import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useTheme, Theme } from '../../src/theme';
import { Text, Button } from '../../src/components/slices';
import { useCreateListingStore } from '../../src/stores/createListingStore';

// Import step components
import BasicInfoStep from '../../src/components/create-listing/BasicInfoStep';
import ImagesStep from '../../src/components/create-listing/ImagesStep';
import AttributeGroupStep from '../../src/components/create-listing/AttributeGroupStep';
import LocationReviewStep from '../../src/components/create-listing/LocationReviewStep';

export default function WizardScreen() {
  const theme = useTheme();
  const isRTL = theme.isRTL;
  const styles = useMemo(() => createStyles(theme, isRTL), [theme, isRTL]);
  const router = useRouter();
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();

  const {
    currentStep,
    steps,
    attributes,
    isLoadingAttributes,
    nextStep,
    previousStep,
    goToStep,
    submitListing,
    isSubmitting,
    error,
    ensureDraftExists,
    draftId,
    generateSteps,
  } = useCreateListingStore();

  // Keys that are handled in BasicInfoStep (not dynamic attributes)
  const basicInfoKeys = ['search', 'title', 'description', 'price', 'listingType', 'condition', 'location'];

  // Check if category has dynamic attributes (excluding basic info keys)
  const hasDynamicAttributes = attributes.some(attr => !basicInfoKeys.includes(attr.key));

  // Regenerate steps if dynamic attributes exist but steps don't include attribute groups
  // This handles the case where navigation happened before generateSteps completed
  useEffect(() => {
    if (hasDynamicAttributes && !steps.some(s => s.type === 'attribute_group')) {
      generateSteps();
    }
  }, [attributes, steps, hasDynamicAttributes]);

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  // Show loading if dynamic attributes exist but steps haven't been regenerated yet
  const stepsNotReady = hasDynamicAttributes && !steps.some(s => s.type === 'attribute_group');

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

  // Show loading while attributes are being fetched OR while steps are being generated
  if (isLoadingAttributes || stepsNotReady) {
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

  // Display steps based on reading direction
  // RTL: Reverse so step 1 on right, last step on left
  // LTR: Normal order so step 1 on left, last step on right
  const displaySteps = isRTL ? [...steps].reverse() : steps;

  return (
    <>
      <Stack.Screen
        options={{
          title: currentStepData?.title || 'إضافة إعلان',
          headerShown: true,
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.surface }]} edges={['bottom']}>
        {/* Progress Bar */}
        <View style={[styles.progressContainer, { backgroundColor: theme.colors.bg }]}>
          <View style={styles.progressBar}>
            {displaySteps.map((step, displayIndex) => {
              // Convert display index back to actual step index
              const actualIndex = isRTL ? (steps.length - 1 - displayIndex) : displayIndex;
              const isCompleted = actualIndex < currentStep;
              const isCurrent = actualIndex === currentStep;

              return (
                <React.Fragment key={step.id}>
                  <TouchableOpacity
                    onPress={() => goToStep(actualIndex)}
                    style={[
                      styles.progressDot,
                      {
                        backgroundColor: isCompleted
                          ? theme.colors.success
                          : isCurrent
                          ? theme.colors.primary
                          : theme.colors.border,
                      },
                    ]}
                  >
                    {isCompleted && <Check size={12} color="#fff" />}
                  </TouchableOpacity>
                  {displayIndex < displaySteps.length - 1 && (
                    <View
                      style={[
                        styles.progressLine,
                        {
                          backgroundColor:
                            actualIndex <= currentStep && actualIndex > 0
                              ? theme.colors.success
                              : theme.colors.border,
                        },
                      ]}
                    />
                  )}
                </React.Fragment>
              );
            })}
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
        {/* RTL: Back on right, Next on left | LTR: Back on left, Next on right */}
        <View style={[styles.footer, { backgroundColor: theme.colors.bg, borderTopColor: theme.colors.border }]}>
          {/* Back/Cancel Button */}
          <Button
            variant="outline"
            size="lg"
            onPress={handleBack}
            arrowBack
            style={styles.navButton}
          >
            {isFirstStep ? 'إلغاء' : 'رجوع'}
          </Button>

          {/* Next/Submit Button */}
          <Button
            variant="primary"
            size="lg"
            onPress={handleNext}
            loading={isSubmitting}
            disabled={isSubmitting}
            arrowForward={!isLastStep}
            style={styles.navButton}
          >
            {isLastStep ? 'نشر الإعلان' : 'التالي'}
          </Button>
        </View>
      </SafeAreaView>
    </>
  );
}

const createStyles = (theme: Theme, isRTL: boolean) =>
  StyleSheet.create({
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
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    progressLine: {
      flex: 1,
      height: 3,
      maxWidth: 50,
      borderRadius: 1.5,
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
      // RTL: row-reverse puts Back on right, Next on left
      // LTR: row puts Back on left, Next on right
      flexDirection: isRTL ? 'row-reverse' : 'row',
      padding: 16,
      gap: 12,
      borderTopWidth: 1,
    },
    navButton: {
      flex: 1,
    },
  });
