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
  GET_VARIANTS_BY_BRAND_QUERY,
  GET_MODEL_SUGGESTION_QUERY,
  CREATE_DRAFT_LISTING,
  UPDATE_DRAFT_LISTING,
  GET_MY_LISTING_BY_ID,
  GET_MY_DRAFTS,
  DELETE_DRAFT,
  CREATE_MY_LISTING_MUTATION,
  CREATE_IMAGE_UPLOAD_URL_MUTATION,
  ADD_IMAGE_TO_DRAFT,
  REMOVE_IMAGE_FROM_DRAFT,
  ADD_VIDEO_TO_DRAFT,
  REMOVE_VIDEO_FROM_DRAFT,
} from './createListingStore.gql';
import {
  validateTitle,
  validateDescription,
  validatePriceMinor,
  validateImages,
  validateProvince,
  validateAttribute,
  validateAttributeGroup,
  hasValidationErrors,
  type ValidationErrors,
} from '../../lib/validation/listingValidation';
import { useCategoriesStore } from '../categoriesStore';
import { useUserAuthStore } from '../userAuthStore';
import { getCloudflareImageUrl } from '../../utils/cloudflare-images';
import { ENV } from '../../constants/env';
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
  brandName: undefined,
  modelId: undefined,
  modelName: undefined,
  variantId: undefined,
  variantName: undefined,
  isOtherBrand: false,
  isOtherModel: false,
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
  isLoadingVariants: false,

  // Auto-suggestion specs (from CarAPI)
  suggestionSpecs: null,
  isAutoFilling: false,

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

  // Validation errors (per-field)
  validationErrors: {} as ValidationErrors,

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
      set({ models: [], isLoadingModels: false });
    }
  },

  fetchVariants: async (modelId: string): Promise<void> => {
    set({ isLoadingVariants: true });
    try {
      const data = await cachedGraphqlRequest<{ variants: Variant[] }>(
        GET_VARIANTS_BY_MODEL_QUERY,
        { modelId },
        5 * 60 * 1000
      );
      set({ variants: data.variants || [], isLoadingVariants: false });
    } catch (error: any) {
      set({ variants: [], isLoadingVariants: false });
    }
  },

  // Fetch both models AND variants by brand (for grouped dropdown like web)
  fetchModelsAndVariants: async (brandId: string): Promise<void> => {
    set({ isLoadingModels: true, isLoadingVariants: true, models: [], variants: [], suggestionSpecs: null });

    try {
      const [modelsData, variantsData] = await Promise.all([
        cachedGraphqlRequest<{ models: Model[] }>(GET_MODELS_QUERY, { brandId }, 5 * 60 * 1000),
        cachedGraphqlRequest<{ variantsByBrand: Variant[] }>(GET_VARIANTS_BY_BRAND_QUERY, { brandId }, 5 * 60 * 1000),
      ]);
      set({
        models: modelsData.models || [],
        variants: variantsData.variantsByBrand || [],
        isLoadingModels: false,
        isLoadingVariants: false,
      });
    } catch (error: any) {
      set({ models: [], variants: [], isLoadingModels: false, isLoadingVariants: false });
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
      return null;
    }
  },

  // Fetch suggestions and auto-fill fields with single options
  fetchAndApplySuggestions: async (): Promise<void> => {
    const { formData, setSpecField } = get();
    const { brandId, modelId, variantId, year } = formData.specs;

    // Need at least brand and model to fetch suggestions
    if (!brandId || !modelId) {
      set({ suggestionSpecs: null });
      return;
    }

    // Skip if using custom "other" values
    if (String(brandId).startsWith('other:') || String(modelId).startsWith('other:')) {
      set({ suggestionSpecs: null });
      return;
    }

    set({ isAutoFilling: true });

    try {
      const suggestion = await get().fetchModelSuggestion(
        brandId as string,
        modelId as string,
        year ? parseInt(String(year)) : undefined,
        variantId as string | undefined
      );

      if (suggestion?.specs) {
        const specs = suggestion.specs as Record<string, (string | number)[]>;
        set({ suggestionSpecs: specs });

        // Auto-fill fields that have exactly 1 option
        Object.entries(specs).forEach(([field, options]) => {
          if (Array.isArray(options) && options.length === 1) {
            // Only auto-fill if the field is currently empty
            const currentValue = formData.specs[field];
            if (!currentValue || currentValue === '') {
              setSpecField(field, String(options[0]));
            }
          }
        });
      } else {
        set({ suggestionSpecs: null });
      }
    } catch (error) {
      set({ suggestionSpecs: null });
    } finally {
      set({ isAutoFilling: false });
    }
  },

  // Clear suggestion specs (when brand/model changes)
  clearSuggestionSpecs: (): void => {
    set({ suggestionSpecs: null });
  },

  // ============ FORM FIELD SETTERS ============

  setFormField: <K extends keyof CreateListingFormData>(
    field: K,
    value: CreateListingFormData[K]
  ): void => {
    set((state) => {
      const newFormData = { ...state.formData, [field]: value };

      // Sync brandId/modelId/variantId to specs for consistency
      // This ensures pre-step selections are available in specs
      if (field === 'brandId' && value) {
        newFormData.specs = { ...newFormData.specs, brandId: value as string };
      }
      if (field === 'modelId' && value) {
        newFormData.specs = { ...newFormData.specs, modelId: value as string };
      }
      if (field === 'variantId' && value) {
        newFormData.specs = { ...newFormData.specs, variantId: value as string };
      }

      return { formData: newFormData };
    });

    // If brandId changes, fetch models
    if (field === 'brandId' && value) {
      get().fetchModels(value as string);
    }

    // If modelId changes, fetch variants
    if (field === 'modelId' && value) {
      get().fetchVariants(value as string);
    }

    // Don't auto-validate - only validate on "Next" press
    // Clear error for this field if it exists
    get().clearValidationError(field as string);
  },

  setSpecField: (key: string, value: any): void => {
    set((state) => ({
      formData: {
        ...state.formData,
        specs: { ...state.formData.specs, [key]: value },
      },
    }));
    // Don't auto-validate - only validate on "Next" press
    // Clear error for this field if it exists
    get().clearValidationError(key);
  },

  setLocationField: (field: keyof LocationData, value: string): void => {
    set((state) => ({
      formData: {
        ...state.formData,
        location: { ...state.formData.location, [field]: value },
      },
    }));
    // Don't auto-validate - only validate on "Next" press
    // Clear error for this field if it exists
    get().clearValidationError(`location.${field}`);
  },

  // ============ STEP NAVIGATION ============

  goToStep: (stepIndex: number): void => {
    const { steps } = get();
    if (stepIndex >= 0 && stepIndex < steps.length) {
      // Clear all validation errors when jumping to a step
      set({ currentStep: stepIndex, validationErrors: {} });
    }
  },

  nextStep: (): void => {
    const { currentStep, steps, validateCurrentStep } = get();
    // Validate current step - errors will be set if invalid
    if (!validateCurrentStep()) return;

    if (currentStep < steps.length - 1) {
      // Clear errors when moving to next step (validation passed)
      set({ currentStep: currentStep + 1, validationErrors: {} });
    }
  },

  previousStep: (): void => {
    const { currentStep } = get();
    if (currentStep > 0) {
      // Clear errors when going back
      set({ currentStep: currentStep - 1, validationErrors: {} });
    }
  },

  // ============ VALIDATION ============

  validateCurrentStep: (): boolean => {
    const { currentStep } = get();
    return get().validateStep(currentStep);
  },

  validateStep: (stepIndex: number): boolean => {
    const { steps, formData, attributes, validationErrors: existingErrors } = get();
    const step = steps[stepIndex];
    if (!step) return false;

    let isValid = false;
    const errors: ValidationErrors = {};

    switch (step.type) {
      case 'listing_type':
        if (!formData.listingType) {
          errors.listingType = 'يرجى اختيار نوع الإعلان';
        }
        isValid = !formData.listingType ? false : true;
        break;

      case 'basic':
        // Validate listingType if category supports multiple types
        const category = useCategoriesStore.getState().getCategoryById(formData.categoryId);
        const supportedTypes = category?.supportedListingTypes || ['sale'];
        if (supportedTypes.length > 1 && !formData.listingType) {
          errors.listingType = 'يرجى اختيار نوع الإعلان (بيع أو إيجار)';
        }

        // Validate title
        const titleError = validateTitle(formData.title);
        if (titleError) errors.title = titleError;

        // Validate description (optional but has max length)
        const descError = validateDescription(formData.description);
        if (descError) errors.description = descError;

        // Validate price
        const priceError = validatePriceMinor(formData.priceMinor);
        if (priceError) errors.priceMinor = priceError;

        // Validate bidding
        if (formData.allowBidding && (formData.biddingStartPrice === undefined || formData.biddingStartPrice === null || formData.biddingStartPrice < 0)) {
          errors.biddingStartPrice = 'سعر البداية للمزايدة مطلوب عند تفعيل المزايدة';
        }

        isValid = !hasValidationErrors(errors);
        break;

      case 'images':
        const imagesError = validateImages(formData.images);
        if (imagesError) errors.images = imagesError;
        isValid = !imagesError;
        break;

      case 'attribute_group':
        if (step.attributeGroup) {
          // Validate all attributes in the group using the validation system
          const groupErrors = validateAttributeGroup(
            step.attributeGroup.attributes.map(attr => ({
              key: attr.key,
              name: attr.name,
              validation: attr.validation as 'REQUIRED' | 'OPTIONAL',
              type: attr.type,
              maxSelections: attr.config?.maxSelections,
              config: attr.config,
            })),
            formData.specs
          );

          // Merge group errors into errors object
          Object.assign(errors, groupErrors);
          isValid = !hasValidationErrors(groupErrors);
        }
        break;

      case 'location_review':
        const provinceError = validateProvince(formData.location.province);
        if (provinceError) errors['location.province'] = provinceError;
        isValid = !provinceError;
        break;

      default:
        isValid = true;
    }

    // Update validation errors in state (merge with existing errors for other steps)
    set((state) => ({
      validationErrors: { ...state.validationErrors, ...errors },
      steps: state.steps.map((s, i) =>
        i === stepIndex ? { ...s, isValid } : s
      ),
    }));

    return isValid;
  },

  getValidationError: (field: string): string | undefined => {
    return get().validationErrors[field];
  },

  clearValidationError: (field: string): void => {
    set((state) => {
      const newErrors = { ...state.validationErrors };
      delete newErrors[field];
      return { validationErrors: newErrors };
    });
  },

  // ============ GENERATE DYNAMIC STEPS ============

  generateSteps: (): void => {
    const { attributes } = get();

    // Keys that are handled in BasicInfoStep (not dynamic attributes)
    const basicInfoKeys = ['search', 'title', 'description', 'price', 'listingType', 'condition', 'location'];

    // Group ALL attributes by their group name (including brand/model/variant)
    const groupsMap = new Map<string, Attribute[]>();
    attributes.forEach((attr) => {
      // Skip basic info keys - they have dedicated UI
      if (basicInfoKeys.includes(attr.key)) return;

      const groupName = attr.group || 'other';
      if (!groupsMap.has(groupName)) groupsMap.set(groupName, []);
      groupsMap.get(groupName)!.push(attr);
    });

    // Sort attributes within each group by sortOrder
    groupsMap.forEach((attrs) =>
      attrs.sort((a, b) => a.sortOrder - b.sortOrder)
    );

    // Create attribute groups (sorted by groupOrder)
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

    // Separate first group (contains brand/model/variant) from other groups
    const firstGroup = attributeGroups[0];
    const otherGroups = attributeGroups.slice(1);

    // Build steps dynamically
    const steps: Step[] = [];

    // Step 1: First attribute group (brand/model/variant/year/mileage)
    // This is where pre-selected brand/model are shown as pre-filled fields
    if (firstGroup) {
      steps.push({
        id: 'first_group',
        type: 'attribute_group',
        title: firstGroup.name,
        isValid: false,
        attributeGroup: firstGroup,
      });
    }

    // Step 2: Basic info (title, description, price, condition, bidding)
    steps.push({
      id: 'basic',
      type: 'basic',
      title: 'معلومات الإعلان',
      isValid: false,
    });

    // Step 3: Images
    steps.push({
      id: 'images',
      type: 'images',
      title: 'الصور',
      isValid: false,
    });

    // Step 4+: Other dynamic attribute groups (specs, features, etc.)
    otherGroups.forEach((group, i) => {
      steps.push({
        id: `group-${i + 1}`,
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
            url: getCloudflareImageUrl(key, 'card'),
            isUploaded: true,
            cloudflareKey: key,
          })),
          video: draft.videoUrl
            ? [{ id: draft.videoUrl, url: draft.videoUrl, isVideo: true, isUploaded: true }]
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

      // Check if category has brand/model attributes and fetch catalog data
      const { attributes } = get();
      const hasBrandAttribute = attributes.some(attr => attr.key === 'brandId');

      if (hasBrandAttribute) {
        await get().fetchBrands(draft.categoryId);

        // If draft has brandId, also fetch models and variants
        if (parsedSpecs.brandId) {
          await get().fetchModelsAndVariants(parsedSpecs.brandId);
        }
      }
    } catch (error: any) {
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
      set({ error: error.message || 'فشل حذف المسودة' });
      return false;
    }
  },

  // ============ MEDIA MANAGEMENT ============

  uploadAndAddImage: async (uri: string, position?: number, onProgress?: (progress: number) => void): Promise<string | null> => {
    const { draftId, formData } = get();

    if (!draftId) {
      // Create draft first if it doesn't exist
      const newDraftId = await get().ensureDraftExists();
      if (!newDraftId) {
        set({ error: 'فشل إنشاء المسودة' });
        return null;
      }
    }

    try {
      // 1. Get upload URL from backend
      const uploadData = await graphqlRequest<{
        createImageUploadUrl: { uploadUrl: string; assetKey: string };
      }>(CREATE_IMAGE_UPLOAD_URL_MUTATION, {});

      const { uploadUrl, assetKey } = uploadData.createImageUploadUrl;

      onProgress?.(10);

      // 2. Upload file to Cloudflare
      const formDataUpload = new FormData();
      formDataUpload.append('file', {
        uri,
        type: 'image/jpeg',
        name: `image-${Date.now()}.jpg`,
      } as any);

      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        body: formDataUpload,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('فشل رفع الصورة');
      }

      // Extract ACTUAL asset ID from Cloudflare response (not the backend's assetKey)
      const uploadResult = await uploadResponse.json();

      if (!uploadResult.success) {
        throw new Error('فشل رفع الصورة إلى Cloudflare');
      }

      const actualAssetId = uploadResult?.result?.id;
      if (!actualAssetId) {
        throw new Error('لم يتم استلام معرف الصورة من Cloudflare');
      }

      onProgress?.(70);

      // 3. Add image key to draft - use the ACTUAL Cloudflare asset ID
      const currentDraftId = get().draftId;
      await graphqlRequest(ADD_IMAGE_TO_DRAFT, {
        draftId: currentDraftId,
        imageKey: actualAssetId,
        position: position ?? formData.images.length,
      });

      onProgress?.(100);

      // 4. Update local state with proper Cloudflare URL
      const imageUrl = getCloudflareImageUrl(actualAssetId, 'card');

      set({
        formData: {
          ...get().formData,
          images: [
            ...get().formData.images,
            { id: actualAssetId, url: imageUrl, isUploaded: true },
          ],
        },
      });

      return actualAssetId;
    } catch (error: any) {
      set({ error: error.message || 'فشل رفع الصورة' });
      return null;
    }
  },

  removeImage: async (imageKey: string): Promise<void> => {
    const { draftId, formData } = get();

    // Update local state first
    set({
      formData: {
        ...formData,
        images: formData.images.filter((img) => img.id !== imageKey),
      },
    });

    // Remove from backend if draft exists
    if (draftId) {
      try {
        await graphqlRequest(REMOVE_IMAGE_FROM_DRAFT, {
          draftId,
          imageKey,
        });
      } catch (error: any) {
        // Don't set error - local state is already updated
      }
    }
  },

  uploadAndAddVideo: async (uri: string, onProgress?: (progress: number) => void): Promise<string | null> => {
    const { draftId } = get();

    if (!draftId) {
      const newDraftId = await get().ensureDraftExists();
      if (!newDraftId) {
        set({ error: 'فشل إنشاء المسودة' });
        return null;
      }
    }

    try {
      // Get auth token from Supabase session
      const session = useUserAuthStore.getState().session;
      if (!session?.access_token) {
        throw new Error('يرجى تسجيل الدخول أولاً');
      }

      onProgress?.(5);

      // 1. Upload video to R2 storage via backend REST API
      // NOTE: Videos are NOT uploaded to Cloudflare Images - they go to R2 storage
      // The web frontend uses the same approach: /api/listings/upload-video endpoint
      const formDataUpload = new FormData();

      // Detect video type from URI
      const extension = uri.split('.').pop()?.toLowerCase() || 'mp4';
      const mimeType = extension === 'mov' ? 'video/quicktime' :
                       extension === 'webm' ? 'video/webm' :
                       'video/mp4';

      formDataUpload.append('video', {
        uri,
        type: mimeType,
        name: `video-${Date.now()}.${extension}`,
      } as any);

      onProgress?.(10);

      const uploadResponse = await fetch(`${ENV.API_URL}/api/listings/upload-video`, {
        method: 'POST',
        body: formDataUpload,
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          // Note: Don't set Content-Type header - let fetch set it with boundary for multipart/form-data
        },
      });

      onProgress?.(60);

      // Log response status for debugging

      if (!uploadResponse.ok) {
        // Try to get error message from response
        let errorMessage = 'فشل رفع الفيديو';
        try {
          const responseText = await uploadResponse.text();
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch {
            // Response wasn't JSON
            errorMessage = `فشل رفع الفيديو (${uploadResponse.status}: ${responseText.slice(0, 100)})`;
          }
        } catch (e) {
        }
        throw new Error(errorMessage);
      }

      const uploadResult = await uploadResponse.json();

      if (!uploadResult.videoUrl) {
        throw new Error('لم يتم الحصول على رابط الفيديو');
      }

      const videoUrl = uploadResult.videoUrl;

      onProgress?.(80);

      // 2. Add video URL to draft
      const currentDraftId = get().draftId;
      await graphqlRequest(ADD_VIDEO_TO_DRAFT, {
        draftId: currentDraftId,
        videoUrl: videoUrl,
      });

      onProgress?.(100);

      // 3. Update local state with R2 video URL
      set({
        formData: {
          ...get().formData,
          video: [{ id: videoUrl, url: videoUrl, isVideo: true, isUploaded: true }],
        },
      });

      return videoUrl;
    } catch (error: any) {
      set({ error: error.message || 'فشل رفع الفيديو' });
      return null;
    }
  },

  removeVideo: async (): Promise<void> => {
    const { draftId, formData } = get();

    // Update local state first
    set({
      formData: {
        ...formData,
        video: [],
      },
    });

    // Remove from backend if draft exists
    if (draftId) {
      try {
        await graphqlRequest(REMOVE_VIDEO_FROM_DRAFT, { draftId });
      } catch (error: any) {
        // Don't set error - local state is already updated
      }
    }
  },

  // ============ SUBMISSION ============

  submitListing: async (): Promise<void> => {
    const { draftId, formData, validateStep, steps } = get();

    if (!draftId) {
      set({ error: 'لم يتم إنشاء مسودة. يرجى اختيار الفئة أولاً.' });
      throw new Error('No draft exists');
    }

    // Validate all steps
    for (let i = 0; i < steps.length; i++) {
      const isValid = validateStep(i);
      if (!isValid) {
        const stepName = steps[i]?.title || `الخطوة ${i + 1}`;
        set({ error: `يرجى ملء جميع الحقول المطلوبة في ${stepName}` });
        throw new Error(`Validation failed at step ${i + 1}: ${stepName}`);
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
      validationErrors: {},
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
export const useValidationErrors = () => useCreateListingStore((state) => state.validationErrors);

export default useCreateListingStore;
