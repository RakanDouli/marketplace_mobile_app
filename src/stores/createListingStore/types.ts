/**
 * Types for Create Listing Store
 */

// ============ ATTRIBUTE TYPES ============

export interface AttributeOption {
  id: string;
  key: string;
  value: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Attribute {
  id: string;
  key: string;
  name: string; // Arabic name
  type: string; // 'text', 'number', 'select', 'multiselect', etc.
  validation?: string; // 'REQUIRED', 'OPTIONAL'
  sortOrder: number;
  group?: string;
  groupOrder?: number;
  storageType?: string;
  isActive: boolean;
  isGlobal?: boolean;
  config?: any;
  options: AttributeOption[];
}

export interface AttributeGroup {
  name: string;
  groupOrder: number;
  attributes: Attribute[];
}

// ============ CATALOG TYPES ============

export interface Brand {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

export interface Model {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

export interface Variant {
  id: string;
  modelId: string;
  name: string;
  slug: string;
  isActive: boolean;
}

export interface ModelSuggestion {
  id: string;
  brandId: string;
  modelId: string;
  year?: number;
  specs: Record<string, any>;
}

// ============ FORM DATA TYPES ============

export interface ImageItem {
  id: string;
  url: string;
  file?: File;
  isVideo?: boolean;
}

export interface LocationData {
  province: string;
  city: string;
  area: string;
  link: string;
}

export interface CreateListingFormData {
  categoryId: string;
  listingType: string; // 'sale' or 'rent'

  // Catalog selection (for categories with brand-model)
  brandId?: string;
  modelId?: string;
  variantId?: string;

  // Basic info
  title: string;
  description: string;
  priceMinor: number;
  allowBidding: boolean;
  biddingStartPrice?: number;
  condition: string;

  // Media
  images: ImageItem[];
  video: ImageItem[];

  // Dynamic specs
  specs: Record<string, any>;

  // Location
  location: LocationData;
}

// ============ WIZARD STEP TYPES ============

export type StepType =
  | 'listing_type'      // Select sale/rent (if category supports both)
  | 'brand'             // Select brand (if category has brands)
  | 'model'             // Select model (if category has models)
  | 'basic'             // Title, price, condition
  | 'images'            // Photo/video upload
  | 'attribute_group'   // Dynamic attribute group
  | 'location_review';  // Location and final review

export interface Step {
  id: string;
  type: StepType;
  title: string;
  isValid: boolean;
  attributeGroup?: AttributeGroup;
}

// ============ DRAFT TYPES ============

export interface DraftListing {
  id: string;
  title?: string;
  description?: string;
  priceMinor?: number;
  allowBidding?: boolean;
  biddingStartPrice?: number;
  listingType?: string;
  condition?: string;
  imageKeys?: string[];
  videoUrl?: string;
  specs?: Record<string, any> | string;
  location?: LocationData;
  status: string;
  categoryId: string;
  category?: {
    id: string;
    name: string;
    nameAr: string;
  };
  createdAt: string;
  updatedAt: string;
}

// ============ STORE STATE & ACTIONS ============

export interface CreateListingState {
  // Current wizard step
  currentStep: number;
  steps: Step[];

  // Category & attributes
  categoryId: string | null;
  attributes: Attribute[];
  attributeGroups: AttributeGroup[];
  isLoadingAttributes: boolean;

  // Catalog data (brands, models, variants)
  brands: Brand[];
  models: Model[];
  variants: Variant[];
  isLoadingBrands: boolean;
  isLoadingModels: boolean;

  // Form data
  formData: CreateListingFormData;

  // Draft state
  draftId: string | null;
  isDraftSaving: boolean;
  lastSavedAt: Date | null;
  isCreatingDraft: boolean;

  // Draft listings for "Continue" feature
  myDrafts: DraftListing[];
  isLoadingDrafts: boolean;

  // Submission
  isSubmitting: boolean;
  error: string | null;
}

export interface CreateListingActions {
  // Category & attributes
  setCategory: (categoryId: string) => Promise<void>;
  fetchAttributes: (categoryId: string) => Promise<void>;

  // Catalog actions
  fetchBrands: (categoryId: string) => Promise<void>;
  fetchModels: (brandId: string) => Promise<void>;
  fetchVariants: (modelId: string) => Promise<void>;
  fetchModelSuggestion: (brandId: string, modelId: string, year?: number, variantId?: string) => Promise<ModelSuggestion | null>;

  // Form field setters
  setFormField: <K extends keyof CreateListingFormData>(field: K, value: CreateListingFormData[K]) => void;
  setSpecField: (key: string, value: any) => void;
  setLocationField: (field: keyof LocationData, value: string) => void;

  // Step navigation
  goToStep: (stepIndex: number) => void;
  nextStep: () => void;
  previousStep: () => void;

  // Validation
  validateCurrentStep: () => boolean;
  validateStep: (stepIndex: number) => boolean;

  // Draft management
  ensureDraftExists: () => Promise<string | null>;
  loadDraft: (draftId: string) => Promise<void>;
  fetchMyDrafts: () => Promise<void>;
  saveDraft: () => Promise<void>;
  deleteDraft: () => Promise<boolean>;

  // Media management
  uploadAndAddImage: (uri: string, position?: number) => Promise<string | null>;
  removeImage: (imageKey: string) => Promise<void>;
  uploadAndAddVideo: (uri: string) => Promise<string | null>;
  removeVideo: () => Promise<void>;

  // Submission
  submitListing: () => Promise<void>;

  // Reset
  reset: () => void;
  generateSteps: () => void;
}

export type CreateListingStore = CreateListingState & CreateListingActions;
