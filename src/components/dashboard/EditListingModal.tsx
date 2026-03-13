/**
 * EditListingModal Component
 * Full edit modal for published listings using collapsible FormSection
 * Matches web frontend pattern with validation indicators
 *
 * Sections:
 * 1. Basic Info (title, description, price, bidding)
 * 2. Images (upload/delete grid)
 * 3. Specs/Attributes (dynamic based on category)
 * 4. Location (province, city, area, map link)
 * 5. Status Management (hide/show)
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch,
} from 'react-native';
import { X, Save, AlertTriangle, MapPin, Navigation, CarFront } from 'lucide-react-native';
import * as Location from 'expo-location';
import { useTheme, Theme } from '../../theme';
import { Text } from '../slices/Text';
import { Input } from '../slices/Input';
import { Button } from '../slices/Button';
import { PriceInput } from '../slices/PriceInput';
import { ToggleField } from '../slices/ToggleField';
import { Select } from '../slices/Select';
import { FormSection, FormSectionStatus } from '../slices/FormSection';
import { ImageUploadGrid, ImageItem } from '../slices/ImageUploadGrid';
import { useUserListingsStore, UserListing } from '../../stores/userListingsStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { graphqlRequest, cachedGraphqlRequest } from '../../services/graphql/client';
import {
  CREATE_IMAGE_UPLOAD_URL_MUTATION,
  GET_ATTRIBUTES_BY_CATEGORY,
  GET_BRANDS_QUERY,
  GET_MODELS_QUERY,
  GET_VARIANTS_BY_MODEL_QUERY,
} from '../../stores/userListingsStore/userListingsStore.gql';
import { LISTING_STATUS_LABELS, REJECTION_REASON_LABELS, LISTING_TYPE_LABELS, CONDITION_LABELS, getLabel } from '../../constants/metadata-labels';
import { Condition, ListingType } from '../../common/enums';
import { useCategoriesStore } from '../../stores/categoriesStore';
import { ChipSelector } from '../slices/ChipSelector';
import { getCloudflareImageUrl } from '../../utils/cloudflare-images';
import { CarInspection, fromBackendFormat, toBackendFormat, DamageReport } from '../create-listing/CarInspection';
import { AttributeFieldRenderer } from '../create-listing/AttributeFieldRenderer';
import { CatalogSelector } from '../create-listing/CatalogSelector';
import type { Attribute, Brand, Model, Variant } from '../../stores/createListingStore/types';

// Syrian provinces
const PROVINCES = [
  { value: 'damascus', label: 'دمشق' },
  { value: 'rif_dimashq', label: 'ريف دمشق' },
  { value: 'aleppo', label: 'حلب' },
  { value: 'homs', label: 'حمص' },
  { value: 'hama', label: 'حماة' },
  { value: 'latakia', label: 'اللاذقية' },
  { value: 'tartus', label: 'طرطوس' },
  { value: 'deir_ezzor', label: 'دير الزور' },
  { value: 'idlib', label: 'إدلب' },
  { value: 'daraa', label: 'درعا' },
  { value: 'suwayda', label: 'السويداء' },
  { value: 'quneitra', label: 'القنيطرة' },
  { value: 'raqqa', label: 'الرقة' },
  { value: 'hasaka', label: 'الحسكة' },
];

// =============================================================================
// PROPS
// =============================================================================

export interface EditListingModalProps {
  visible: boolean;
  onClose: () => void;
  listing: UserListing;
  onSuccess?: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export const EditListingModal: React.FC<EditListingModalProps> = ({
  visible,
  onClose,
  listing,
  onSuccess,
}) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { updateMyListing, loadMyListingById, isLoading } = useUserListingsStore();
  const addNotification = useNotificationStore((state) => state.addNotification);

  // ==========================================================================
  // FORM STATE
  // ==========================================================================

  // Section 1: Basic Info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceMinor, setPriceMinor] = useState(0);
  const [allowBidding, setAllowBidding] = useState(false);
  const [biddingStartPrice, setBiddingStartPrice] = useState(0);
  const [listingType, setListingType] = useState('');
  const [condition, setCondition] = useState('');

  // Section 2: Images
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Car Inspection (only for cars category)
  const [showCarDamage, setShowCarDamage] = useState(false);

  // Section 3: Specs
  const [specs, setSpecs] = useState<Record<string, any>>({});
  const [originalSpecs, setOriginalSpecs] = useState<Record<string, any>>({}); // Track original specs
  const [specsModified, setSpecsModified] = useState(false); // Track if user modified specs
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [isLoadingAttributes, setIsLoadingAttributes] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);

  // "Other" mode state for catalog selectors
  const [isOtherBrand, setIsOtherBrand] = useState(false);
  const [isOtherModel, setIsOtherModel] = useState(false);
  const [isOtherVariant, setIsOtherVariant] = useState(false);
  const [customBrandName, setCustomBrandName] = useState('');
  const [customModelName, setCustomModelName] = useState('');
  const [customVariantName, setCustomVariantName] = useState('');

  // Section 4: Location
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [locationLink, setLocationLink] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Section 5: Status
  const [isHidden, setIsHidden] = useState(false);

  // Local state
  const [isSaving, setIsSaving] = useState(false);

  // Field-level errors (for inline validation)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Form-level error message (displayed inline above buttons)
  const [formError, setFormError] = useState<string>('');

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================

  const isRejected = listing.status === 'REJECTED';
  const rejectionMessage = listing.rejectionMessage ||
    (listing.rejectionReason ? getLabel(listing.rejectionReason, REJECTION_REASON_LABELS) : null);

  // Get category to check supported listing types
  const { getCategoryById } = useCategoriesStore();
  const category = listing.category?.id ? getCategoryById(listing.category.id) : null;
  // supportedListingTypes from backend is uppercase (SALE, RENT) - keep as UPPERCASE
  const supportedListingTypes = (category?.supportedListingTypes || [ListingType.SALE]).map(t => t.toUpperCase());
  const showListingTypeSelector = supportedListingTypes.length > 1;

  // Condition options for ChipSelector - use UPPERCASE enum values (GraphQL expects uppercase)
  const conditionOptions = [
    { key: Condition.NEW, label: CONDITION_LABELS[Condition.NEW] || 'جديد' },
    { key: Condition.USED_LIKE_NEW, label: CONDITION_LABELS[Condition.USED_LIKE_NEW] || 'مستعمل كالجديد' },
    { key: Condition.USED, label: CONDITION_LABELS[Condition.USED] || 'مستعمل' },
  ];

  // Listing type options for ChipSelector - use UPPERCASE enum values (GraphQL expects uppercase)
  const listingTypeOptions = [
    { key: ListingType.SALE, label: LISTING_TYPE_LABELS[ListingType.SALE] || 'للبيع' },
    { key: ListingType.RENT, label: LISTING_TYPE_LABELS[ListingType.RENT] || 'للإيجار' },
  ].filter(opt => supportedListingTypes.includes(opt.key));

  // Check if category has car_damage attribute (only for cars category)
  const hasCarDamageAttribute = useMemo(() => {
    return attributes.some(attr =>
      attr.key === 'car_damage' || attr.key === 'body_damage'
    );
  }, [attributes]);

  // ==========================================================================
  // ATTRIBUTE GROUPS (Dynamic FormSections from backend attributes)
  // ==========================================================================

  interface AttributeGroup {
    name: string;
    attributes: Attribute[];
    groupOrder: number;
  }

  // Keys excluded from dynamic sections (handled in Basic Info, Location, or Images)
  const excludedAttrKeys = [
    'search', 'title', 'description', 'price', 'province', 'city', 'area',
    'accountType', 'location', 'listingType', 'condition', 'car_damage', 'body_damage'
  ];

  // Group attributes by their group field (same pattern as web frontend)
  const attributeGroups: AttributeGroup[] = useMemo(() => {
    const groupsMap = new Map<string, Attribute[]>();

    attributes
      .filter(attr => !excludedAttrKeys.includes(attr.key))
      .forEach(attr => {
        const groupName = attr.group || 'other';
        if (!groupsMap.has(groupName)) {
          groupsMap.set(groupName, []);
        }
        groupsMap.get(groupName)!.push(attr);
      });

    // Convert to array and sort by groupOrder
    return Array.from(groupsMap.entries())
      .filter(([name]) => name !== 'other') // Skip "other" group
      .map(([name, attrs]) => ({
        name,
        attributes: attrs.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
        groupOrder: attrs[0]?.groupOrder || 999,
      }))
      .sort((a, b) => a.groupOrder - b.groupOrder);
  }, [attributes]);

  // Validation for each attribute group
  const validateAttributeGroup = (group: AttributeGroup): { isValid: boolean; filledCount: number; totalCount: number } => {
    const requiredAttrs = group.attributes.filter(a => a.validation === 'REQUIRED' || a.validation === 'required');
    let filledCount = 0;
    const totalCount = requiredAttrs.length;

    requiredAttrs.forEach(attr => {
      const value = specs[attr.key];
      if (value !== undefined && value !== null && value !== '') {
        filledCount++;
      }
    });

    return { isValid: filledCount >= totalCount, filledCount, totalCount };
  };

  // Get current car damage from specs
  const currentCarDamage: DamageReport[] = useMemo(() => {
    const rawValue = specs?.car_damage;
    if (!rawValue) return [];
    return fromBackendFormat(rawValue as string[]);
  }, [specs?.car_damage]);

  // Handle car damage changes
  const handleCarDamageChange = useCallback((damages: DamageReport[]) => {
    const backendFormat = toBackendFormat(damages);
    setSpecs(prev => ({
      ...prev,
      car_damage: backendFormat.length > 0 ? backendFormat : undefined,
    }));
    setSpecsModified(true);
  }, []);

  // ==========================================================================
  // LOAD FULL LISTING DATA
  // ==========================================================================

  useEffect(() => {
    if (visible && listing.id) {
      loadFullListingData();
    }
  }, [visible, listing.id]);

  const loadFullListingData = async () => {
    try {
      // Load full listing details
      const fullListing = await loadMyListingById(listing.id);

      // Set basic info
      setTitle(fullListing.title || '');
      setDescription(fullListing.description || '');
      setPriceMinor(fullListing.priceMinor || 0);
      setAllowBidding(fullListing.allowBidding || false);
      setBiddingStartPrice(fullListing.biddingStartPrice || 0);
      // Keep UPPERCASE values - GraphQL returns and expects UPPERCASE enum values
      setListingType(fullListing.listingType || '');
      setCondition(fullListing.condition || '');

      // Set images
      const imageItems: ImageItem[] = (fullListing.imageKeys || []).map((key: string, index: number) => ({
        id: key,
        uri: getCloudflareImageUrl(key, 'card'),
        cloudflareKey: key,
        isUploaded: true,
      }));
      setImages(imageItems);

      // Set specs
      const listingSpecs = fullListing.specs || {};
      const parsedSpecs = typeof listingSpecs === 'string' ? JSON.parse(listingSpecs) : listingSpecs;
      setSpecs(parsedSpecs);
      setOriginalSpecs(parsedSpecs); // Save original for comparison
      setSpecsModified(false);

      // Set location
      setProvince(fullListing.location?.province || '');
      setCity(fullListing.location?.city || '');
      setArea(fullListing.location?.area || '');
      setLocationLink(fullListing.location?.link || '');

      // Set status
      setIsHidden(fullListing.status === 'HIDDEN');

      // Load attributes for this category
      if (fullListing.category?.id) {
        await loadAttributesAndCatalog(fullListing.category.id, listingSpecs);
      }

      } catch (err: any) {
      addNotification({
        type: 'error',
        title: 'خطأ',
        message: 'فشل في تحميل بيانات الإعلان',
      });
    }
  };

  // ==========================================================================
  // LOAD ATTRIBUTES & CATALOG
  // ==========================================================================

  const loadAttributesAndCatalog = async (categoryId: string, currentSpecs: Record<string, any>) => {
    setIsLoadingAttributes(true);

    try {
      // Fetch attributes
      const attrData = await graphqlRequest<{ getAttributesByCategory: Attribute[] }>(
        GET_ATTRIBUTES_BY_CATEGORY,
        { categoryId }
      );
      setAttributes(attrData.getAttributesByCategory || []);

      // Check if has brand attribute
      const hasBrandAttr = (attrData.getAttributesByCategory || []).some(a => a.key === 'brandId');

      if (hasBrandAttr) {
        // Fetch brands
        const brandsData = await cachedGraphqlRequest<{ brands: Brand[] }>(
          GET_BRANDS_QUERY,
          { categoryId },
          5 * 60 * 1000
        );
        setBrands(brandsData.brands || []);

        // If brand is selected, fetch models
        if (currentSpecs.brandId) {
          const modelsData = await cachedGraphqlRequest<{ models: Model[] }>(
            GET_MODELS_QUERY,
            { brandId: currentSpecs.brandId },
            5 * 60 * 1000
          );
          setModels(modelsData.models || []);

          // If model is selected, fetch variants
          if (currentSpecs.modelId) {
            const variantsData = await cachedGraphqlRequest<{ variants: Variant[] }>(
              GET_VARIANTS_BY_MODEL_QUERY,
              { modelId: currentSpecs.modelId },
              5 * 60 * 1000
            );
            setVariants(variantsData.variants || []);
          }
        }
      }
    } catch (err: any) {
    } finally {
      setIsLoadingAttributes(false);
    }
  };

  // ==========================================================================
  // SPEC FIELD HANDLERS
  // ==========================================================================

  const handleSpecChange = (key: string, value: any) => {
    setSpecs(prev => ({ ...prev, [key]: value }));
    setSpecsModified(true); // Mark as modified

    // Cascade loading for brand → model → variant
    if (key === 'brandId' && value && listing.category?.id) {
      loadModels(value);
      // Clear downstream selections
      setSpecs(prev => ({ ...prev, modelId: undefined, variantId: undefined }));
      setModels([]);
      setVariants([]);
    }

    if (key === 'modelId' && value) {
      loadVariants(value);
      // Clear variant selection
      setSpecs(prev => ({ ...prev, variantId: undefined }));
      setVariants([]);
    }
  };

  const loadModels = async (brandId: string) => {
    try {
      const data = await cachedGraphqlRequest<{ models: Model[] }>(
        GET_MODELS_QUERY,
        { brandId },
        5 * 60 * 1000
      );
      setModels(data.models || []);
    } catch (err) {
    }
  };

  const loadVariants = async (modelId: string) => {
    try {
      const data = await cachedGraphqlRequest<{ variants: Variant[] }>(
        GET_VARIANTS_BY_MODEL_QUERY,
        { modelId },
        5 * 60 * 1000
      );
      setVariants(data.variants || []);
    } catch (err) {
    }
  };

  // ==========================================================================
  // IMAGE HANDLERS
  // ==========================================================================

  const handleImageChange = async (newImages: ImageItem[]) => {
    // Find new images that need uploading
    const imagesToUpload = newImages.filter(img => !img.isUploaded && !img.isUploading && img.file);

    if (imagesToUpload.length > 0) {
      setIsUploadingImage(true);

      // Mark images as uploading immediately (so grid shows loading state)
      const updatedImages = newImages.map(img => {
        if (imagesToUpload.find(u => u.id === img.id)) {
          return { ...img, isUploading: true, uploadProgress: 0 };
        }
        return img;
      });
      setImages(updatedImages);

      for (const img of imagesToUpload) {
        try {
          // Get upload URL
          const uploadData = await graphqlRequest<{
            createImageUploadUrl: { uploadUrl: string; assetKey: string };
          }>(CREATE_IMAGE_UPLOAD_URL_MUTATION, {}, true);

          const { uploadUrl } = uploadData.createImageUploadUrl;

          // Upload to Cloudflare
          const formData = new FormData();
          formData.append('file', img.file as any);

          const response = await fetch(uploadUrl, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) throw new Error('Upload failed');

          const result = await response.json();
          const cloudflareKey = result?.result?.id;

          if (cloudflareKey) {
            // Update image in state with uploaded status
            setImages(prev => prev.map(prevImg => {
              if (prevImg.id === img.id) {
                return {
                  ...prevImg,
                  cloudflareKey,
                  isUploaded: true,
                  isUploading: false,
                  uri: getCloudflareImageUrl(cloudflareKey, 'card'),
                };
              }
              return prevImg;
            }));
          }
        } catch (err) {
          // Mark failed upload
          setImages(prev => prev.map(prevImg => {
            if (prevImg.id === img.id) {
              return { ...prevImg, isUploading: false };
            }
            return prevImg;
          }));
        }
      }

      setIsUploadingImage(false);
    } else {
      // No uploads needed, just update images (for removals/reorders)
      setImages(newImages);
    }
  };

  // ==========================================================================
  // LOCATION HANDLER
  // ==========================================================================

  const handleGetLocation = useCallback(async () => {
    setIsGettingLocation(true);

    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        Alert.alert('خدمات الموقع', 'يرجى تفعيل خدمات الموقع في إعدادات الجهاز');
        setIsGettingLocation(false);
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('صلاحية الموقع', 'يرجى السماح بالوصول إلى الموقع');
        setIsGettingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
      setLocationLink(mapsLink);

      Alert.alert('تم', 'تم الحصول على الموقع بنجاح');
    } catch (err: any) {
      Alert.alert('خطأ', 'فشل الحصول على الموقع');
    } finally {
      setIsGettingLocation(false);
    }
  }, []);

  // ==========================================================================
  // VALIDATION
  // ==========================================================================

  const validateBasicInfo = (): { isValid: boolean; filledCount: number; totalCount: number } => {
    let filledCount = 0;
    // title, price, condition are required; description is optional; listingType only if multiple supported
    const totalCount = showListingTypeSelector ? 5 : 4;

    if (title.trim().length >= 10) filledCount++;
    if (priceMinor > 0) filledCount++;
    if (description.trim().length > 0) filledCount++; // optional but counts
    if (condition) filledCount++;
    if (showListingTypeSelector && listingType) filledCount++;

    // Valid if all required fields are filled
    const isValid = title.trim().length >= 10 && priceMinor > 0 && !!condition &&
      (!showListingTypeSelector || !!listingType);
    return { isValid, filledCount, totalCount };
  };

  const validateImages = (): { isValid: boolean; filledCount: number; totalCount: number } => {
    const uploadedImages = images.filter(img => img.isUploaded || img.cloudflareKey);
    const filledCount = uploadedImages.length;
    const totalCount = 1; // minimum 1 image
    const isValid = filledCount >= 1;
    return { isValid, filledCount: Math.min(filledCount, 10), totalCount: 10 };
  };

  const validateLocation = (): { isValid: boolean; filledCount: number; totalCount: number } => {
    let filledCount = 0;
    const totalCount = 4; // province (required), city, area, link (optional)

    if (province) filledCount++;
    if (city) filledCount++;
    if (area) filledCount++;
    if (locationLink) filledCount++;

    return { isValid: !!province, filledCount, totalCount };
  };

  const getSectionStatus = (
    isValid: boolean,
    filledCount: number,
    totalCount: number,
    hasRequired: boolean
  ): FormSectionStatus => {
    if (filledCount >= totalCount) return 'complete';
    if (isValid) return 'required';
    return 'incomplete';
  };

  // ==========================================================================
  // FORM SUBMISSION
  // ==========================================================================

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!title.trim() || title.length < 10) {
      errors.title = 'العنوان يجب أن يكون 10 أحرف على الأقل';
    }
    if (priceMinor <= 0) {
      errors.price = 'السعر يجب أن يكون أكبر من صفر';
    }
    if (images.filter(i => i.isUploaded || i.cloudflareKey).length === 0) {
      errors.images = 'يجب إضافة صورة واحدة على الأقل';
    }
    if (!province) {
      errors.province = 'يجب اختيار المحافظة';
    }
    // Validate condition
    if (!condition) {
      errors.condition = 'يجب اختيار حالة المنتج';
    }
    // Validate listingType only if category supports multiple types
    if (showListingTypeSelector && !listingType) {
      errors.listingType = 'يجب اختيار نوع الإعلان';
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      // Show error inline above buttons (not as toast notification)
      setFormError('يرجى تصحيح الأخطاء أدناه');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    setFieldErrors({});
    setFormError(''); // Clear any previous form error

    try {
      // Determine new status
      let newStatus = listing.status;
      if (listing.status === 'ACTIVE' && isHidden) {
        newStatus = 'HIDDEN';
      } else if (listing.status === 'HIDDEN' && !isHidden) {
        newStatus = 'ACTIVE';
      } else if (isRejected) {
        newStatus = 'PENDING_APPROVAL';
      }

      // Prepare image keys (only uploaded ones)
      const imageKeys = images
        .filter(img => img.cloudflareKey || img.isUploaded)
        .map(img => img.cloudflareKey || img.id);

      // Build update input - only include specs if user modified them
      const updateInput: any = {
        title: title.trim(),
        description: description.trim(),
        priceMinor,
        allowBidding,
        biddingStartPrice: allowBidding ? biddingStartPrice : null,
        status: newStatus,
        imageKeys,
        location: {
          province,
          city,
          area,
          link: locationLink,
        },
        // Include listingType and condition (these are column-level fields, not specs)
        listingType: listingType || undefined,
        condition: condition || undefined,
      };

      // Only send specs if user actually modified them
      if (specsModified) {
        // Clean specs - only include keys that match actual attributes with storageType='specs'
        // AND validate that selector values match valid option keys
        const specsAttributes = attributes.filter(attr => attr.storageType === 'specs');
        const cleanSpecs: Record<string, any> = {};

        for (const attr of specsAttributes) {
          const value = specs[attr.key];

          // Skip empty values
          if (value === undefined || value === null || value === '') {
            continue;
          }

          // For selector types, validate that the value is a valid option key
          if (attr.type === 'selector' && attr.options && attr.options.length > 0) {
            const validOptionKeys = new Set(attr.options.map(o => o.key));
            if (!validOptionKeys.has(value)) {
              continue; // Skip invalid option values
            }
          }

          cleanSpecs[attr.key] = value;
        }

        updateInput.specs = cleanSpecs;
      } else {
      }

      await updateMyListing(listing.id, updateInput);

      // Show success notification
      addNotification({
        type: 'success',
        title: 'تم الحفظ',
        message: 'تم حفظ التغييرات بنجاح',
      });

      onSuccess?.();
      onClose();
    } catch (err: any) {
      // Show error inline above buttons (not as toast notification)
      setFormError(err.message || 'حدث خطأ أثناء حفظ التغييرات');
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================================================
  // CLOSE HANDLER
  // ==========================================================================

  const handleClose = () => {
    // Could add unsaved changes warning here
    onClose();
  };

  // ==========================================================================
  // CATALOG HANDLERS (Brand/Model/Variant)
  // ==========================================================================

  const hasBrand = !!specs.brandId || isOtherBrand;
  const hasModel = !!specs.modelId || isOtherModel || isOtherBrand;
  const hasVariants = variants.length > 0;
  const forceOtherModel = isOtherBrand;
  const forceOtherVariant = isOtherBrand || isOtherModel || (hasModel && !isLoadingModels && !hasVariants);

  // Brand handlers
  const handleBrandChange = (id: string, name?: string) => {
    handleSpecChange('brandId', id);
    setIsOtherBrand(false);
    // Clear dependent fields
    handleSpecChange('modelId', '');
    handleSpecChange('variantId', '');
    setModels([]);
    setVariants([]);
    // Load models for this brand
    if (id && !id.startsWith('other:')) {
      loadModelsForBrand(id);
    }
  };

  const handleBrandOtherToggle = (enabled: boolean) => {
    setIsOtherBrand(enabled);
    if (enabled) {
      handleSpecChange('brandId', '');
      handleSpecChange('modelId', '');
      handleSpecChange('variantId', '');
      setIsOtherModel(true);
    } else {
      setCustomBrandName('');
    }
  };

  const handleBrandCustomChange = (text: string) => {
    setCustomBrandName(text);
    handleSpecChange('brandId', `other:${text}`);
  };

  // Model handlers
  const handleModelChange = (id: string, name?: string) => {
    handleSpecChange('modelId', id);
    setIsOtherModel(false);
    handleSpecChange('variantId', '');
    setVariants([]);
    // Load variants for this model
    if (id && !id.startsWith('other:')) {
      loadVariantsForModel(id);
    }
  };

  const handleModelOtherToggle = (enabled: boolean) => {
    setIsOtherModel(enabled);
    if (enabled) {
      handleSpecChange('modelId', '');
      handleSpecChange('variantId', '');
      setIsOtherVariant(true);
    } else {
      setCustomModelName('');
      setIsOtherVariant(false);
    }
  };

  const handleModelCustomChange = (text: string) => {
    setCustomModelName(text);
    handleSpecChange('modelId', `other:${text}`);
  };

  // Variant handlers
  const handleVariantChange = (id: string, name?: string) => {
    handleSpecChange('variantId', id);
  };

  const handleVariantOtherToggle = (enabled: boolean) => {
    setIsOtherVariant(enabled);
    if (enabled) {
      handleSpecChange('variantId', '');
    } else {
      setCustomVariantName('');
    }
  };

  const handleVariantCustomChange = (text: string) => {
    setCustomVariantName(text);
    handleSpecChange('variantId', `other:${text}`);
  };

  // Load models for a brand
  const loadModelsForBrand = async (brandId: string) => {
    setIsLoadingModels(true);
    try {
      const data = await cachedGraphqlRequest<{ models: Model[] }>(
        GET_MODELS_QUERY,
        { brandId },
        30 * 60 * 1000 // 30 minutes cache
      );
      setModels(data.models || []);
    } catch (err) {
      console.error('Failed to load models:', err);
    } finally {
      setIsLoadingModels(false);
    }
  };

  // Load variants for a model
  const loadVariantsForModel = async (modelId: string) => {
    setIsLoadingVariants(true);
    try {
      const data = await cachedGraphqlRequest<{ variants: Variant[] }>(
        GET_VARIANTS_BY_MODEL_QUERY,
        { modelId },
        30 * 60 * 1000 // 30 minutes cache
      );
      setVariants(data.variants || []);
    } catch (err) {
      console.error('Failed to load variants:', err);
    } finally {
      setIsLoadingVariants(false);
    }
  };

  // ==========================================================================
  // RENDER ATTRIBUTE INPUT
  // ==========================================================================

  const renderAttributeInput = (attr: Attribute) => {
    const value = specs[attr.key];

    // Skip car_damage - handled separately in images section
    if (attr.key === 'car_damage' || attr.key === 'body_damage') {
      return null;
    }

    // Brand selector with CatalogSelector
    if (attr.key === 'brandId') {
      return (
        <CatalogSelector
          key={attr.key}
          type="brand"
          label={attr.name}
          items={brands}
          value={value || ''}
          customValue={customBrandName}
          isOther={isOtherBrand}
          onChange={handleBrandChange}
          onCustomChange={handleBrandCustomChange}
          onOtherToggle={handleBrandOtherToggle}
          required={attr.validation === 'REQUIRED' || attr.validation === 'required'}
          loading={isLoadingAttributes}
          error={fieldErrors.brandId}
        />
      );
    }

    // Model selector with CatalogSelector
    if (attr.key === 'modelId') {
      return (
        <CatalogSelector
          key={attr.key}
          type="model"
          label={attr.name}
          items={models}
          value={value || ''}
          customValue={customModelName}
          isOther={isOtherModel || forceOtherModel}
          onChange={handleModelChange}
          onCustomChange={handleModelCustomChange}
          onOtherToggle={handleModelOtherToggle}
          required={attr.validation === 'REQUIRED' || attr.validation === 'required'}
          loading={isLoadingModels}
          disabled={!hasBrand}
          error={fieldErrors.modelId}
          showOtherToggle={!forceOtherModel}
        />
      );
    }

    // Variant selector with CatalogSelector
    if (attr.key === 'variantId') {
      return (
        <CatalogSelector
          key={attr.key}
          type="variant"
          label={attr.name}
          items={variants}
          value={value || ''}
          customValue={customVariantName}
          isOther={forceOtherVariant || isOtherVariant}
          onChange={handleVariantChange}
          onCustomChange={handleVariantCustomChange}
          onOtherToggle={handleVariantOtherToggle}
          required={attr.validation === 'REQUIRED' || attr.validation === 'required'}
          loading={isLoadingVariants}
          disabled={!hasModel}
          error={fieldErrors.variantId}
          showOtherToggle={!forceOtherVariant && hasVariants}
        />
      );
    }

    // Use AttributeFieldRenderer for all other attributes
    return (
      <AttributeFieldRenderer
        key={attr.key}
        attribute={attr}
        value={value}
        onChange={(newValue) => handleSpecChange(attr.key, newValue)}
        error={fieldErrors[attr.key]}
        onClearError={() => setFieldErrors(prev => ({ ...prev, [attr.key]: '' }))}
      />
    );
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  const basicValidation = validateBasicInfo();
  const imagesValidation = validateImages();
  const locationValidation = validateLocation();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { flexDirection: theme.isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text variant="h3" style={styles.headerTitle}>تعديل الإعلان</Text>
          <View style={styles.closeButtonPlaceholder} />
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Rejection Alert */}
          {isRejected && rejectionMessage && (
            <View style={styles.rejectionAlert}>
              <View style={[styles.rejectionHeader, { flexDirection: theme.isRTL ? 'row-reverse' : 'row' }]}>
                <AlertTriangle size={20} color={theme.colors.error} />
                <Text variant="body" bold style={{ color: theme.colors.error }}>
                  تم رفض الإعلان
                </Text>
              </View>
              <Text variant="small" color="secondary" style={styles.rejectionMessage}>
                {rejectionMessage}
              </Text>
              <Text variant="xs" color="muted">
                قم بتعديل الإعلان ثم اضغط حفظ لإعادة إرساله للمراجعة
              </Text>
            </View>
          )}

          {/* Category Info */}
          <View style={styles.infoCard}>
            <Text variant="small" color="secondary">
              الفئة: {listing.category?.nameAr || listing.category?.name || 'غير محدد'}
            </Text>
            <Text variant="xs" color="muted">
              الحالة: {getLabel(listing.status, LISTING_STATUS_LABELS)}
            </Text>
          </View>

          {/* Section 1: Listing Info (title, description, price, etc.) */}
            <FormSection
              number={1}
              title="معلومات الإعلان"
              status={getSectionStatus(basicValidation.isValid, basicValidation.filledCount, basicValidation.totalCount, true)}
              filledCount={basicValidation.filledCount}
              totalCount={basicValidation.totalCount}
              hasRequiredFields
              defaultExpanded
            >
              <Input
                label="عنوان الإعلان"
                placeholder="أدخل عنوان الإعلان"
                value={title}
                onChangeText={(text) => {
                  setTitle(text);
                  if (fieldErrors.title) {
                    setFieldErrors(prev => ({ ...prev, title: '' }));
                  }
                }}
                maxLength={100}
                showCounter
                required
                error={fieldErrors.title}
              />

              <Input
                label="الوصف"
                placeholder="أدخل وصف تفصيلي للإعلان"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={5}
                maxLength={2000}
                showCounter
              />

              <PriceInput
                label="السعر"
                value={priceMinor}
                onChange={(val) => {
                  setPriceMinor(val);
                  if (fieldErrors.price) {
                    setFieldErrors(prev => ({ ...prev, price: '' }));
                  }
                }}
                required
                error={fieldErrors.price}
              />

              <ToggleField
                label="السماح بالمزايدة"
                value={allowBidding}
                onChange={setAllowBidding}
                description="تمكين المزايدة يسمح للمشترين بتقديم عروض أسعار"
              />

              {allowBidding && (
                <PriceInput
                  label="سعر بداية المزايدة"
                  value={biddingStartPrice}
                  onChange={setBiddingStartPrice}
                />
              )}

              {/* Listing Type Selector - only show if category supports multiple types */}
              {showListingTypeSelector && (
                <ChipSelector
                  label="نوع الإعلان"
                  options={listingTypeOptions}
                  value={listingType}
                  onChange={(val) => setListingType(val as string)}
                  required
                  error={fieldErrors.listingType}
                />
              )}

              {/* Condition Selector */}
              <ChipSelector
                label="الحالة"
                options={conditionOptions}
                value={condition}
                onChange={(val) => setCondition(val as string)}
                required
                error={fieldErrors.condition}
              />
            </FormSection>

            {/* Section 2: Images */}
            <FormSection
              number={2}
              title="الصور"
              status={getSectionStatus(imagesValidation.isValid, imagesValidation.filledCount, imagesValidation.totalCount, true)}
              filledCount={imagesValidation.filledCount}
              totalCount={imagesValidation.totalCount}
              hasRequiredFields
            >
              <ImageUploadGrid
                images={images}
                onChange={(newImages) => {
                  handleImageChange(newImages);
                  if (fieldErrors.images) {
                    setFieldErrors(prev => ({ ...prev, images: '' }));
                  }
                }}
                maxImages={10}
                minImages={1}
                disabled={isUploadingImage}
                label="صور المنتج"
                emptyStateTitle="أضف صور المنتج"
                emptyStateSubtitle="الصورة الأولى ستكون الصورة الرئيسية"
              />
              {fieldErrors.images && (
                <Text variant="small" color="error" style={{ marginTop: theme.spacing.sm }}>
                  {fieldErrors.images}
                </Text>
              )}

              {/* Car Body Inspection - Only for car category */}
              {hasCarDamageAttribute && (
                <View style={styles.carDamageSection}>
                  <View style={[styles.carDamageHeader, { flexDirection: theme.isRTL ? 'row-reverse' : 'row' }]}>
                    <View style={[styles.carDamageToggle, { flexDirection: theme.isRTL ? 'row-reverse' : 'row' }]}>
                      <CarFront size={20} color={theme.colors.primary} />
                      <Text variant="body" bold style={{ marginHorizontal: theme.spacing.sm }}>
                        هل يوجد ملاحظات على الهيكل؟
                      </Text>
                    </View>
                    <Switch
                      value={showCarDamage || currentCarDamage.length > 0}
                      onValueChange={(value) => {
                        setShowCarDamage(value);
                        if (!value) {
                          handleCarDamageChange([]);
                        }
                      }}
                      trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
                      thumbColor={showCarDamage || currentCarDamage.length > 0 ? theme.colors.primary : theme.colors.textMuted}
                    />
                  </View>

                  {(showCarDamage || currentCarDamage.length > 0) && (
                    <View style={styles.carDamageContent}>
                      <Text variant="small" color="secondary" style={{ marginBottom: theme.spacing.md }}>
                        حدد مناطق الضرر على الهيكل
                      </Text>
                      <CarInspection
                        value={currentCarDamage}
                        onChange={handleCarDamageChange}
                      />
                    </View>
                  )}
                </View>
              )}
            </FormSection>

          {/* Dynamic Attribute Group Sections */}
          {isLoadingAttributes ? (
            <FormSection
              number={3}
              title="المواصفات"
              status="incomplete"
              filledCount={0}
              totalCount={1}
              hasRequiredFields
            >
              <Text variant="small" color="secondary">جاري التحميل...</Text>
            </FormSection>
          ) : (
            attributeGroups.map((group, groupIndex) => {
              const groupValidation = validateAttributeGroup(group);
              const sectionNumber = 3 + groupIndex; // Start from 3 (after Basic Info and Images)

              return (
                <FormSection
                  key={group.name}
                  number={sectionNumber}
                  title={group.name}
                  status={getSectionStatus(
                    groupValidation.isValid,
                    groupValidation.filledCount,
                    groupValidation.totalCount,
                    groupValidation.totalCount > 0
                  )}
                  filledCount={groupValidation.filledCount}
                  totalCount={groupValidation.totalCount}
                  hasRequiredFields={groupValidation.totalCount > 0}
                  defaultExpanded={groupIndex === 0} // First group expanded by default
                >
                  {group.attributes.map(renderAttributeInput)}
                </FormSection>
              );
            })
          )}

            {/* Location Section */}
            <FormSection
              number={3 + attributeGroups.length}
              title="الموقع"
              status={getSectionStatus(locationValidation.isValid, locationValidation.filledCount, locationValidation.totalCount, true)}
              filledCount={locationValidation.filledCount}
              totalCount={locationValidation.totalCount}
              hasRequiredFields
            >
              <Select
                label="المحافظة"
                value={province}
                onChange={(val) => {
                  setProvince(val);
                  if (fieldErrors.province) {
                    setFieldErrors(prev => ({ ...prev, province: '' }));
                  }
                }}
                options={[
                  { value: '', label: 'اختر المحافظة' },
                  ...PROVINCES,
                ]}
                required
                error={fieldErrors.province}
              />

              <Input
                label="المدينة"
                placeholder="أدخل اسم المدينة"
                value={city}
                onChangeText={setCity}
              />

              <Input
                label="المنطقة"
                placeholder="أدخل اسم المنطقة"
                value={area}
                onChangeText={setArea}
              />

              <View style={[styles.locationLinkRow, { flexDirection: theme.isRTL ? 'row-reverse' : 'row' }]}>
                <View style={{ flex: 1 }}>
                  <Input
                    label="رابط الموقع"
                    placeholder="رابط Google Maps"
                    value={locationLink}
                    onChangeText={setLocationLink}
                  />
                </View>
                <Button
                  variant="outline"
                  size="sm"
                  onPress={handleGetLocation}
                  loading={isGettingLocation}
                  icon={<Navigation size={16} color={theme.colors.primary} />}
                  style={styles.locationButton}
                >
                  موقعي
                </Button>
              </View>
            </FormSection>

          {/* Status Toggle (only for ACTIVE/HIDDEN) - NOT in a collapse */}
          {(listing.status === 'ACTIVE' || listing.status === 'HIDDEN') && (
            <View style={styles.statusSection}>
              <ToggleField
                label="إيقاف الإعلان مؤقتاً"
                value={isHidden}
                onChange={setIsHidden}
                description={isHidden
                  ? 'الإعلان مخفي حالياً ولن يظهر في البحث'
                  : 'الإعلان ظاهر ويمكن للآخرين رؤيته'
                }
              />
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footerContainer}>
          {/* Error message - displayed inline above buttons */}
          {formError && (
            <View style={styles.formErrorContainer}>
              <AlertTriangle size={16} color={theme.colors.error} />
              <Text variant="small" style={{ color: theme.colors.error, flex: 1 }}>
                {formError}
              </Text>
            </View>
          )}
          <View style={[styles.footer, { flexDirection: theme.isRTL ? 'row-reverse' : 'row' }]}>
            <Button
              variant="outline"
              onPress={handleClose}
              style={styles.footerButton}
              disabled={isSaving}
            >
              إلغاء
            </Button>
            <Button
              variant="primary"
              onPress={handleSave}
              style={styles.footerButton}
              loading={isSaving || isUploadingImage}
              disabled={isSaving || isUploadingImage}
              icon={<Save size={18} color="#fff" />}
            >
              حفظ التغييرات
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.bg,
    },
    header: {
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingStart: theme.spacing.md,
      paddingEnd: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    closeButton: {
      padding: theme.spacing.sm,
    },
    closeButtonPlaceholder: {
      width: 40,
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      padding: theme.spacing.md,
      paddingBottom: theme.spacing.xl,
    },
    rejectionAlert: {
      backgroundColor: '#fef2f2',
      borderWidth: 1,
      borderColor: theme.colors.error,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      gap: theme.spacing.xs,
    },
    rejectionHeader: {
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    rejectionMessage: {
      marginTop: theme.spacing.xs,
    },
    infoCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      gap: theme.spacing.xs,
    },
    locationLinkRow: {
      alignItems: 'flex-end',
      gap: theme.spacing.sm,
    },
    locationButton: {
      marginBottom: theme.spacing.md,
    },
    statusSection: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    footerContainer: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    formErrorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
    },
    footer: {
      gap: theme.spacing.md,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
    },
    footerButton: {
      flex: 1,
    },
    carDamageSection: {
      marginTop: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    carDamageHeader: {
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.sm,
    },
    carDamageToggle: {
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    carDamageContent: {
      marginTop: theme.spacing.md,
    },
  });

export default EditListingModal;
