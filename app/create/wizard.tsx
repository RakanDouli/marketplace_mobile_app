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

import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTheme, Theme } from '../../src/theme';
import { Text, Button, Form } from '../../src/components/slices';
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
  const { categoryId, draftId: draftIdParam } = useLocalSearchParams<{ categoryId?: string; draftId?: string }>();

  // Ref to ScrollView for programmatic scrolling
  const scrollViewRef = useRef<ScrollView>(null);

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
    deleteDraft,
    reset,
    validationErrors,
    loadDraft,
  } = useCreateListingStore();

  // Load draft when draftId is provided via URL (continuing a draft)
  const [isLoadingDraft, setIsLoadingDraft] = React.useState(false);
  useEffect(() => {
    if (draftIdParam && !draftId) {
      setIsLoadingDraft(true);
      loadDraft(draftIdParam).finally(() => setIsLoadingDraft(false));
    }
  }, [draftIdParam]);

  // Keys that are handled in BasicInfoStep (not dynamic attributes)
  const basicInfoKeys = ['search', 'title', 'description', 'price', 'listingType', 'condition', 'location'];

  // Check if category has dynamic attributes that are NOT in 'other' group
  // These are attributes that will create actual attribute_group steps
  const hasDynamicAttributeGroups = attributes.some(attr =>
    !basicInfoKeys.includes(attr.key) && attr.group && attr.group !== 'other'
  );

  // Regenerate steps if dynamic attribute groups exist but steps don't include them
  // This handles the case where navigation happened before generateSteps completed
  // IMPORTANT: Only check attributes.length to avoid infinite loop (don't include steps in deps)
  useEffect(() => {
    if (hasDynamicAttributeGroups && !steps.some(s => s.type === 'attribute_group')) {
      generateSteps();
    }
  }, [attributes.length, hasDynamicAttributeGroups]); // Only depend on attributes.length, not steps

  // Scroll to top when step changes
  useEffect(() => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  }, [currentStep]);

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  // Show loading if dynamic attribute groups exist but steps haven't been regenerated yet
  const stepsNotReady = hasDynamicAttributeGroups && !steps.some(s => s.type === 'attribute_group');

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
        // Scroll to top to show error
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }
    } else {
      nextStep();
    }
  };

  const handleBack = () => {
    if (isFirstStep) {
      // On first step, back goes to previous screen (brand/model selection)
      router.back();
    } else {
      previousStep();
    }
  };

  // Cancel with confirmation
  // When continuing a draft (draftIdParam): offer to save progress or delete
  // When creating new: offer to delete or continue
  const handleCancel = () => {
    if (draftIdParam) {
      // Continuing a draft - offer to save and exit
      Alert.alert(
        'الخروج من الإعلان',
        'ماذا تريد أن تفعل؟',
        [
          {
            text: 'متابعة التحرير',
            style: 'cancel',
          },
          {
            text: 'حفظ والخروج',
            onPress: () => {
              // Just reset local state and go back (draft is already saved)
              reset();
              router.replace('/(tabs)/menu/my-listings');
            },
          },
          {
            text: 'حذف المسودة',
            style: 'destructive',
            onPress: async () => {
              if (draftId) {
                await deleteDraft();
              }
              reset();
              router.replace('/(tabs)/menu/my-listings');
            },
          },
        ]
      );
    } else {
      // Creating new - original behavior
      Alert.alert(
        'إلغاء الإعلان',
        'هل أنت متأكد؟ سيتم حذف جميع البيانات والصور المرفوعة.',
        [
          {
            text: 'متابعة',
            style: 'cancel',
          },
          {
            text: 'إلغاء الإعلان',
            style: 'destructive',
            onPress: async () => {
              // Delete draft from backend (includes image cleanup)
              if (draftId) {
                await deleteDraft();
              } else {
                // Just reset local state if no draft
                reset();
              }
              // Navigate to home
              router.replace('/');
            },
          },
        ]
      );
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

  // Show loading while attributes are being fetched OR while steps are being generated OR while loading draft
  if (isLoadingAttributes || stepsNotReady || isLoadingDraft) {
    return (
      <>
        <Stack.Screen options={{ title: draftIdParam ? 'إكمال الإعلان' : 'إضافة إعلان', headerShown: true }} />
        <View style={[styles.loadingContainer, { backgroundColor: theme.colors.surface }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="paragraph" color="secondary" style={styles.loadingText}>
            {isLoadingDraft ? 'جاري تحميل المسودة...' : 'جاري تحميل النموذج...'}
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

        {/* Step Content - Wrapped in KeyboardAvoidingView to handle keyboard */}
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 140 : 0}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Form error={error || undefined}>
              {renderStepContent()}
            </Form>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Navigation Buttons - 3 buttons: Back | Cancel | Next */}
        <View style={[styles.footer, { backgroundColor: theme.colors.bg, borderTopColor: theme.colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {/* Back Button - goes to previous step or previous screen */}
          <Button
            variant="outline"
            size="lg"
            onPress={handleBack}
            style={styles.navButton}
          >
            <View style={styles.buttonContent}>
              {!theme.isRTL && <ChevronLeft size={16} color={theme.colors.text} />}
              <Text variant="body" bold style={styles.buttonText}>رجوع</Text>
              {theme.isRTL && <ChevronRight size={16} color={theme.colors.text} />}

            </View>
          </Button>

          {/* Cancel Button - deletes draft and goes home */}
          <Button
            variant="danger"
            size="lg"
            onPress={handleCancel}
            style={styles.navButton}
          >
            إلغاء
          </Button>

          {/* Next/Submit Button */}
          <Button
            variant="primary"
            size="lg"
            onPress={handleNext}
            loading={isSubmitting}
            disabled={isSubmitting}
            style={styles.navButton}
          >
            {isLastStep ? (
              'نشر الإعلان'
            ) : (
              <View style={styles.buttonContent}>
                {theme.isRTL && <ChevronLeft size={16} color={theme.colors.textLight} />}
                <Text variant="body" bold style={[styles.buttonText, { color: theme.colors.textLight }]}>التالي</Text>
                {!theme.isRTL && <ChevronRight size={16} color={theme.colors.textLight} />}
              </View>
            )}
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
    keyboardAvoidingView: {
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
    footer: {
      padding: 16,
      gap: 8,
      borderTopWidth: 1,
    },
    navButton: {
      flex: 1,
    },
    buttonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    buttonText: {
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
  });
