/**
 * Create Listing Store - Mobile App
 * Manages the step-by-step listing creation wizard
 * Includes catalog selection (brand → model → variant)
 */

import { create } from 'zustand';
import { graphqlRequest, cachedGraphqlRequest } from '../../services/graphql/client';
import {
  GET_ATTRIBUTES_BY_CATEGORY,
  GET_BRANDS_QUERY,
  GET_MODELS_QUERY,
  GET_VARIANTS_BY_MODEL_QUERY,
  GET_MODEL_SUGGESTION_QUERY,
  CREATE_DRAFT_LISTING,
  UPDATE_DRAFT_LISTING,
  GET_MY_LISTING_BY_ID,
  GET_MY_DRAFTS,
  DELETE_DRAFT,
  CREATE_MY_LISTING_MUTATION,
} from './createListingStore.gql';
import type {
  CreateListingStore,
  CreateListingFormData,
  Attribute,
  AttributeGroup,
  Step,
  Brand,
  Model,
  Variant,
  ModelSuggestion,
  DraftListing,
  LocationData,
} from './types';

// ============ INITIAL STATE ============

const initialFormData: CreateListingFormData = {
  categoryId: '',
  listingType: '',
  brandId: undefined,
  modelId: undefined,
  variantId: undefined,
  title: '',
  description: '',
  priceMinor: 0,
  allowBidding: false,
  biddingStartPrice: undefined,
  condition: '',
  images: [],
  video: [],
  specs: {},
  location: {
    province: '',
    city: '',
    area: '',
    link: '',
  },
};

const initialSteps: Step[] = [
  {
    id: 'basic',
    type: 'basic',
    title: 'المعلومات الأساسية',
    isValid: false,
  },
  {
    id: 'images',
    type: 'images',
    title: 'الصور',
    isValid: false,
  },
  {
    id: 'location_review',
    type: 'location_review',
    title: 'الموقع والمراجعة',
    isValid: false,
  },
];

// ============ STORE ============

export const useCreateListingStore = create<CreateListingStore>((set, get) => ({
  // Current wizard step
  currentStep: 0,
  steps: initialSteps,

  // Category & attributes
  categoryId: null,
  attributes: [],
  attributeGroups: [],
  isLoadingAttributes: false,

  // Catalog data
  brands: [],
  models: [],
  variants: [],
  isLoadingBrands: false,
  isLoadingModels: false,

  // Form data
  formData: initialFormData,

  // Draft state
  draftId: null,
  isDraftSaving: false,
  lastSavedAt: null,
  isCreatingDraft: false,

  // Draft listings
  myDrafts: [],
  isLoadingDrafts: false,

  // Submission
  isSubmitting: false,
  error: null,

  // ============ CATEGORY & ATTRIBUTES ============

  setCategory: async (categoryId: string): Promise<void> => {
    set({
      categoryId,
      formData: { ...get().formData, categoryId },
      error: null,
      // Reset catalog selection when category changes
      brands: [],
      models: [],
      variants: [],
    });

    // Fetch attributes for this category
    await get().fetchAttributes(categoryId);

    // Check if category has brandId attribute and fetch brands
    const { attributes } = get();
    const hasBrandAttribute = attributes.some(attr => attr.key === 'brandId');
    if (hasBrandAttribute) {
      await get().fetchBrands(categoryId);
    }
  },

  fetchAttributes: async (categoryId: string): Promise<void> => {
    set({ isLoadingAttributes: true, error: null });

    try {
      const data = await graphqlRequest<{ getAttributesByCategory: Attribute[] }>(
        GET_ATTRIBUTES_BY_CATEGORY,
        { categoryId }
      );
      const attributes = data.getAttributesByCategory || [];

      set({ attributes });
      get().generateSteps();
    } catch (error: any) {
      console.error('Failed to fetch attributes:', error);
      set({ error: error.message || 'فشل تحميل الخصائص' });
    } finally {
      set({ isLoadingAttributes: false });
    }
  },

  // ============ CATALOG ACTIONS ============

  fetchBrands: async (categoryId: string): Promise<void> => {
    set({ isLoadingBrands: true });

    try {
      const data = await cachedGraphqlRequest<{ brands: Brand[] }>(
        GET_BRANDS_QUERY,
        { categoryId },
        5 * 60 * 1000 // Cache for 5 minutes
      );
      set({ brands: data.brands || [], isLoadingBrands: false });
    } catch (error: any) {
      console.error('Failed to fetch brands:', error);
      set({ brands: [], isLoadingBrands: false });
    }
  },

  fetchModels: async (brandId: string): Promise<void> => {
    set({ isLoadingModels: true, models: [], variants: [] });

    try {
      const data = await cachedGraphqlRequest<{ models: Model[] }>(
        GET_MODELS_QUERY,
        { brandId },
        5 * 60 * 1000
      );
      set({ models: data.models || [], isLoadingModels: false });
    } catch (error: any) {
      console.error('Failed to fetch models:', error);
      set({ models: [], isLoadingModels: false });
    }
  },

  fetchVariants: async (modelId: string): Promise<void> => {
    try {
      const data = await cachedGraphqlRequest<{ variants: Variant[] }>(
        GET_VARIANTS_BY_MODEL_QUERY,
        { modelId },
        5 * 60 * 1000
      );
      set({ variants: data.variants || [] });
    } catch (error: any) {
      console.error('Failed to fetch variants:', error);
      set({ variants: [] });
    }
  },

  fetchModelSuggestion: async (
    brandId: string,
    modelId: string,
    year?: number,
    variantId?: string
  ): Promise<ModelSuggestion | null> => {
    try {
      const data = await cachedGraphqlRequest<{ getModelSuggestion: ModelSuggestion }>(
        GET_MODEL_SUGGESTION_QUERY,
        { brandId, modelId, year, variantId },
        10 * 60 * 1000 // Cache for 10 minutes
      );
      return data.getModelSuggestion || null;
    } catch (error: any) {
      console.error('Failed to fetch model suggestion:', error);
      return null;
    }
  },

  // ============ FORM FIELD SETTERS ============

  setFormField: <K extends keyof CreateListingFormData>(
    field: K,
    value: CreateListingFormData[K]
  ): void => {
    set((state) => ({
      formData: { ...state.formData, [field]: value },
    }));

    // If brandId changes, fetch models
    if (field === 'brandId' && value) {
      get().fetchModels(value as string);
    }

    // If modelId changes, fetch variants
    if (field === 'modelId' && value) {
      get().fetchVariants(value as string);
    }

    // Auto-validate after field change
    setTimeout(() => get().validateCurrentStep(), 0);
  },

  setSpecField: (key: string, value: any): void => {
    set((state) => ({
      formData: {
        ...state.formData,
        specs: { ...state.formData.specs, [key]: value },
      },
    }));
    setTimeout(() => get().validateCurrentStep(), 0);
  },

  setLocationField: (field: keyof LocationData, value: string): void => {
    set((state) => ({
      formData: {
        ...state.formData,
        location: { ...state.formData.location, [field]: value },
      },
    }));
    setTimeout(() => get().validateCurrentStep(), 0);
  },

  // ============ STEP NAVIGATION ============

  goToStep: (stepIndex: number): void => {
    const { steps } = get();
    if (stepIndex >= 0 && stepIndex < steps.length) {
      set({ currentStep: stepIndex });
    }
  },

  nextStep: (): void => {
    const { currentStep, steps, validateCurrentStep } = get();
    if (!validateCurrentStep()) return;
    if (currentStep < steps.length - 1) {
      set({ currentStep: currentStep + 1 });
    }
  },

  previousStep: (): void => {
    const { currentStep } = get();
    if (currentStep > 0) {
      set({ currentStep: currentStep - 1 });
    }
  },

  // ============ VALIDATION ============

  validateCurrentStep: (): boolean => {
    const { currentStep } = get();
    return get().validateStep(currentStep);
  },

  validateStep: (stepIndex: number): boolean => {
    const { steps, formData, attributes } = get();
    const step = steps[stepIndex];
    if (!step) return false;

    let isValid = false;

    switch (step.type) {
      case 'listing_type':
        isValid = !!formData.listingType;
        break;

      case 'brand':
        isValid = !!formData.brandId;
        break;

      case 'model':
        isValid = !!formData.modelId;
        break;

      case 'basic':
        isValid = !!(
          formData.title.trim() &&
          formData.priceMinor > 0 &&
          (!formData.allowBidding ||
            (formData.biddingStartPrice !== undefined && formData.biddingStartPrice >= 0))
        );
        break;

      case 'images':
        isValid = formData.images.length >= 1;
        break;

      case 'attribute_group':
        if (step.attributeGroup) {
          isValid = step.attributeGroup.attributes.every((attr) => {
            if (attr.validation !== 'REQUIRED') return true;
            const value = formData.specs[attr.key];
            if (Array.isArray(value)) return value.length > 0;
            return value !== undefined && value !== null && value !== '';
          });
        }
        break;

      case 'location_review':
        isValid = !!formData.location.province;
        break;

      default:
        isValid = true;
    }

    set((state) => ({
      steps: state.steps.map((s, i) =>
        i === stepIndex ? { ...s, isValid } : s
      ),
    }));

    return isValid;
  },

  // ============ GENERATE DYNAMIC STEPS ============

  generateSteps: (): void => {
    const { attributes, formData } = get();

    // Check if category has brand-model support
    const hasBrandAttr = attributes.some((attr) => attr.key === 'brandId');
    const hasModelAttr = attributes.some((attr) => attr.key === 'modelId');

    // Manually handled attribute keys (have dedicated UI)
    const manuallyHandledKeys = [
      'search', 'title', 'description', 'price', 'listingType', 'condition',
      'brandId', 'modelId', 'variantId', 'location',
    ];

    // Group remaining attributes
    const groupsMap = new Map<string, Attribute[]>();
    attributes.forEach((attr) => {
      if (manuallyHandledKeys.includes(attr.key)) return;
      const groupName = attr.group || 'other';
      if (!groupsMap.has(groupName)) groupsMap.set(groupName, []);
      groupsMap.get(groupName)!.push(attr);
    });

    // Sort attributes within each group
    groupsMap.forEach((attrs) =>
      attrs.sort((a, b) => a.sortOrder - b.sortOrder)
    );

    // Create attribute groups
    const attributeGroups: AttributeGroup[] = [];
    groupsMap.forEach((attrs, name) => {
      if (attrs.length && name !== 'other') {
        attributeGroups.push({
          name,
          groupOrder: attrs[0].groupOrder || 0,
          attributes: attrs,
        });
      }
    });
    attributeGroups.sort((a, b) => a.groupOrder - b.groupOrder);

    // Build steps dynamically
    const steps: Step[] = [];

    // Step 1: Brand selection (if category has brands)
    if (hasBrandAttr) {
      steps.push({
        id: 'brand',
        type: 'brand',
        title: 'اختر الماركة',
        isValid: false,
      });
    }

    // Step 2: Model selection (if category has models)
    if (hasModelAttr) {
      steps.push({
        id: 'model',
        type: 'model',
        title: 'اختر الموديل',
        isValid: false,
      });
    }

    // Step 3: Basic info
    steps.push({
      id: 'basic',
      type: 'basic',
      title: 'المعلومات الأساسية',
      isValid: false,
    });

    // Step 4: Images
    steps.push({
      id: 'images',
      type: 'images',
      title: 'الصور',
      isValid: false,
    });

    // Step 5+: Dynamic attribute groups
    attributeGroups.forEach((group, i) => {
      steps.push({
        id: `group-${i}`,
        type: 'attribute_group',
        title: group.name,
        isValid: false,
        attributeGroup: group,
      });
    });

    // Final step: Location and review
    steps.push({
      id: 'location_review',
      type: 'location_review',
      title: 'الموقع والمراجعة',
      isValid: false,
    });

    set({ steps, attributeGroups });
  },

  // ============ DRAFT MANAGEMENT ============

  ensureDraftExists: async (): Promise<string | null> => {
    const { draftId, formData, isCreatingDraft } = get();

    if (draftId) return draftId;
    if (isCreatingDraft) return null;
    if (!formData.categoryId) {
      set({ error: 'يرجى اختيار الفئة أولاً' });
      return null;
    }

    set({ isCreatingDraft: true });

    try {
      const data = await graphqlRequest<{ createDraftListing: { id: string } }>(
        CREATE_DRAFT_LISTING,
        { categoryId: formData.categoryId }
      );
      const newDraftId = data.createDraftListing.id;

      set({
        draftId: newDraftId,
        isCreatingDraft: false,
        error: null,
      });

      // Save current form data to draft
      await get().saveDraft();

      return newDraftId;
    } catch (error: any) {
      console.error('Error creating draft:', error);
      set({ error: error.message || 'فشل إنشاء المسودة', isCreatingDraft: false });
      return null;
    }
  },

  loadDraft: async (draftId: string): Promise<void> => {
    try {
      const data = await graphqlRequest<{ myListingById: DraftListing }>(
        GET_MY_LISTING_BY_ID,
        { id: draftId }
      );
      const draft = data.myListingById;

      if (!draft || draft.status.toUpperCase() !== 'DRAFT') {
        set({ error: 'المسودة غير موجودة أو تم إرسالها' });
        return;
      }

      // Parse specs
      let parsedSpecs: Record<string, any> = {};
      if (draft.specs) {
        try {
          parsedSpecs = typeof draft.specs === 'string' ? JSON.parse(draft.specs) : draft.specs;
        } catch (e) {
          console.error('Error parsing specs:', e);
        }
      }

      const listingType = draft.listingType ? draft.listingType.toLowerCase() : '';
      const condition = draft.condition ? draft.condition.toLowerCase() : '';

      set({
        draftId: draft.id,
        categoryId: draft.categoryId,
        formData: {
          categoryId: draft.categoryId,
          listingType,
          brandId: parsedSpecs.brandId,
          modelId: parsedSpecs.modelId,
          variantId: parsedSpecs.variantId,
          title: draft.title || '',
          description: draft.description || '',
          priceMinor: draft.priceMinor || 0,
          allowBidding: draft.allowBidding || false,
          biddingStartPrice: draft.biddingStartPrice,
          condition,
          images: (draft.imageKeys || []).map((key: string) => ({
            id: key,
            url: `https://imagedelivery.net/yvE6_nYkmBMTwQORcLcTkA/${key}/public`,
          })),
          video: draft.videoUrl
            ? [{ id: draft.videoUrl, url: draft.videoUrl, isVideo: true }]
            : [],
          specs: parsedSpecs,
          location: {
            province: draft.location?.province || '',
            city: draft.location?.city || '',
            area: draft.location?.area || '',
            link: draft.location?.link || '',
          },
        },
        error: null,
      });

      // Fetch attributes for this category
      await get().fetchAttributes(draft.categoryId);
    } catch (error: any) {
      console.error('Error loading draft:', error);
      set({ error: error.message || 'فشل تحميل المسودة' });
    }
  },

  fetchMyDrafts: async (): Promise<void> => {
    set({ isLoadingDrafts: true });

    try {
      const data = await graphqlRequest<{ myListings: DraftListing[] }>(
        GET_MY_DRAFTS,
        { status: 'DRAFT' }
      );
      set({ myDrafts: data.myListings || [], isLoadingDrafts: false });
    } catch (error: any) {
      console.error('Error fetching drafts:', error);
      set({ myDrafts: [], isLoadingDrafts: false });
    }
  },

  saveDraft: async (): Promise<void> => {
    const { isDraftSaving, draftId, formData } = get();

    if (!draftId || isDraftSaving) return;

    set({ isDraftSaving: true });

    try {
      await graphqlRequest(
        UPDATE_DRAFT_LISTING,
        {
          input: {
            draftId,
            title: formData.title || undefined,
            description: formData.description || undefined,
            priceMinor: formData.priceMinor || undefined,
            listingType: formData.listingType || undefined,
            condition: formData.condition || undefined,
            allowBidding: formData.allowBidding,
            biddingStartPrice: formData.biddingStartPrice,
            specs: Object.keys(formData.specs).length > 0 ? formData.specs : undefined,
            location: formData.location.province ? formData.location : undefined,
          },
        }
      );

      set({ isDraftSaving: false, lastSavedAt: new Date() });
    } catch (error: any) {
      console.error('Error saving draft:', error);
      set({ isDraftSaving: false });
    }
  },

  deleteDraft: async (): Promise<boolean> => {
    const { draftId } = get();
    if (!draftId) return false;

    try {
      await graphqlRequest(DELETE_DRAFT, { draftId });
      get().reset();
      return true;
    } catch (error: any) {
      console.error('Error deleting draft:', error);
      set({ error: error.message || 'فشل حذف المسودة' });
      return false;
    }
  },

  // ============ MEDIA MANAGEMENT ============
  // Note: These will need React Native specific implementations
  // For now, they are placeholders

  uploadAndAddImage: async (uri: string, position?: number): Promise<string | null> => {
    // TODO: Implement React Native image upload
    console.log('uploadAndAddImage not yet implemented for mobile', uri, position);
    set({ error: 'رفع الصور غير مدعوم حالياً' });
    return null;
  },

  removeImage: async (imageKey: string): Promise<void> => {
    const { formData } = get();
    set({
      formData: {
        ...formData,
        images: formData.images.filter((img) => img.id !== imageKey),
      },
    });
  },

  uploadAndAddVideo: async (uri: string): Promise<string | null> => {
    // TODO: Implement React Native video upload
    console.log('uploadAndAddVideo not yet implemented for mobile', uri);
    set({ error: 'رفع الفيديو غير مدعوم حالياً' });
    return null;
  },

  removeVideo: async (): Promise<void> => {
    const { formData } = get();
    set({
      formData: {
        ...formData,
        video: [],
      },
    });
  },

  // ============ SUBMISSION ============

  submitListing: async (): Promise<void> => {
    const { draftId, formData, validateStep, steps } = get();

    if (!draftId) {
      set({ error: 'لم يتم إنشاء مسودة. يرجى اختيار الفئة أولاً.' });
      return;
    }

    // Validate all steps
    for (let i = 0; i < steps.length; i++) {
      const isValid = validateStep(i);
      if (!isValid) {
        set({ error: `يرجى ملء جميع الحقول المطلوبة في الخطوة ${i + 1}` });
        return;
      }
    }

    set({ isSubmitting: true, error: null });

    try {
      // Build specs object
      const specs = { ...formData.specs };
      if (formData.brandId) specs.brandId = formData.brandId;
      if (formData.modelId) specs.modelId = formData.modelId;
      if (formData.variantId) specs.variantId = formData.variantId;

      await graphqlRequest(
        CREATE_MY_LISTING_MUTATION,
        {
          input: {
            draftId,
            categoryId: formData.categoryId,
            title: formData.title,
            description: formData.description || undefined,
            priceMinor: formData.priceMinor,
            allowBidding: formData.allowBidding,
            biddingStartPrice: formData.allowBidding ? formData.biddingStartPrice : undefined,
            listingType: formData.listingType || undefined,
            condition: formData.condition || undefined,
            specs: Object.keys(specs).length > 0 ? specs : undefined,
            location: formData.location.province ? formData.location : undefined,
          },
        }
      );

      set({ isSubmitting: false });
    } catch (error: any) {
      set({
        error: error.message || 'فشل إنشاء الإعلان',
        isSubmitting: false,
      });
      throw error;
    }
  },

  // ============ RESET ============

  reset: (): void => {
    set({
      currentStep: 0,
      steps: initialSteps,
      categoryId: null,
      attributes: [],
      attributeGroups: [],
      isLoadingAttributes: false,
      brands: [],
      models: [],
      variants: [],
      isLoadingBrands: false,
      isLoadingModels: false,
      formData: initialFormData,
      draftId: null,
      isDraftSaving: false,
      lastSavedAt: null,
      isCreatingDraft: false,
      isSubmitting: false,
      error: null,
    });
  },
}));

// ============ SELECTORS ============

export const useCurrentStep = () => useCreateListingStore((state) => state.currentStep);
export const useSteps = () => useCreateListingStore((state) => state.steps);
export const useBrands = () => useCreateListingStore((state) => state.brands);
export const useModels = () => useCreateListingStore((state) => state.models);
export const useVariants = () => useCreateListingStore((state) => state.variants);
export const useFormData = () => useCreateListingStore((state) => state.formData);
export const useIsSubmitting = () => useCreateListingStore((state) => state.isSubmitting);

export default useCreateListingStore;
