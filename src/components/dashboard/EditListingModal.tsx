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
} from 'react-native';
import { X, Save, AlertTriangle, MapPin, Navigation } from 'lucide-react-native';
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
import { graphqlRequest, cachedGraphqlRequest } from '../../services/graphql/client';
import {
  CREATE_IMAGE_UPLOAD_URL_MUTATION,
  GET_ATTRIBUTES_BY_CATEGORY,
  GET_BRANDS_QUERY,
  GET_MODELS_QUERY,
  GET_VARIANTS_BY_MODEL_QUERY,
} from '../../stores/userListingsStore/userListingsStore.gql';
import { LISTING_STATUS_LABELS, REJECTION_REASON_LABELS, getLabel } from '../../constants/metadata-labels';
import { getCloudflareImageUrl } from '../../utils/cloudflare-images';

// =============================================================================
// TYPES
// =============================================================================

interface Attribute {
  id: string;
  key: string;
  name: string;
  type: string;
  validation: string;
  sortOrder: number;
  group: string;
  groupOrder: number;
  storageType: string;
  isActive: boolean;
  isGlobal: boolean;
  config?: any;
  options?: Array<{
    id: string;
    key: string;
    value: string;
    sortOrder: number;
    isActive: boolean;
  }>;
}

interface Brand {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
}

interface Model {
  id: string;
  name: string;
  slug: string;
}

interface Variant {
  id: string;
  modelId: string;
  name: string;
  slug: string;
}

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
  const isRTL = theme.isRTL;
  const styles = useMemo(() => createStyles(theme, isRTL), [theme, isRTL]);

  const { updateMyListing, loadMyListingById, isLoading } = useUserListingsStore();

  // ==========================================================================
  // FORM STATE
  // ==========================================================================

  // Section 1: Basic Info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceMinor, setPriceMinor] = useState(0);
  const [allowBidding, setAllowBidding] = useState(false);
  const [biddingStartPrice, setBiddingStartPrice] = useState(0);

  // Section 2: Images
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Section 3: Specs
  const [specs, setSpecs] = useState<Record<string, any>>({});
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [isLoadingAttributes, setIsLoadingAttributes] = useState(false);

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
  const [error, setError] = useState<string | null>(null);

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================

  const isRejected = listing.status === 'REJECTED';
  const rejectionMessage = listing.rejectionMessage ||
    (listing.rejectionReason ? getLabel(listing.rejectionReason, REJECTION_REASON_LABELS) : null);

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
      setSpecs(typeof listingSpecs === 'string' ? JSON.parse(listingSpecs) : listingSpecs);

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

      setError(null);
    } catch (err: any) {
      console.error('[EditListingModal] Load error:', err);
      setError('فشل في تحميل بيانات الإعلان');
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
      console.error('[EditListingModal] Load attributes error:', err);
    } finally {
      setIsLoadingAttributes(false);
    }
  };

  // ==========================================================================
  // SPEC FIELD HANDLERS
  // ==========================================================================

  const handleSpecChange = (key: string, value: any) => {
    setSpecs(prev => ({ ...prev, [key]: value }));

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
      console.error('Error loading models:', err);
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
      console.error('Error loading variants:', err);
    }
  };

  // ==========================================================================
  // IMAGE HANDLERS
  // ==========================================================================

  const handleImageChange = async (newImages: ImageItem[]) => {
    // Find new images that need uploading
    const imagesToUpload = newImages.filter(img => !img.isUploaded && img.file);

    if (imagesToUpload.length > 0) {
      setIsUploadingImage(true);

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
            // Update image with cloudflare key
            img.cloudflareKey = cloudflareKey;
            img.isUploaded = true;
            img.uri = getCloudflareImageUrl(cloudflareKey, 'card');
          }
        } catch (err) {
          console.error('Image upload error:', err);
        }
      }

      setIsUploadingImage(false);
    }

    setImages(newImages);
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
    const totalCount = 3; // title, description (optional), price

    if (title.trim().length >= 10) filledCount++;
    if (priceMinor > 0) filledCount++;
    if (description.trim().length > 0) filledCount++; // optional but counts

    const isValid = title.trim().length >= 10 && priceMinor > 0;
    return { isValid, filledCount, totalCount };
  };

  const validateImages = (): { isValid: boolean; filledCount: number; totalCount: number } => {
    const uploadedImages = images.filter(img => img.isUploaded || img.cloudflareKey);
    const filledCount = uploadedImages.length;
    const totalCount = 1; // minimum 1 image
    const isValid = filledCount >= 1;
    return { isValid, filledCount: Math.min(filledCount, 10), totalCount: 10 };
  };

  const validateSpecs = (): { isValid: boolean; filledCount: number; totalCount: number } => {
    const requiredAttrs = attributes.filter(a => a.validation === 'REQUIRED');
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
    if (!title.trim() || title.length < 10) {
      setError('العنوان يجب أن يكون 10 أحرف على الأقل');
      return false;
    }
    if (priceMinor <= 0) {
      setError('السعر يجب أن يكون أكبر من صفر');
      return false;
    }
    if (images.filter(i => i.isUploaded || i.cloudflareKey).length === 0) {
      setError('يجب إضافة صورة واحدة على الأقل');
      return false;
    }
    if (!province) {
      setError('يجب اختيار المحافظة');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    setError(null);

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

      await updateMyListing(listing.id, {
        title: title.trim(),
        description: description.trim(),
        priceMinor,
        allowBidding,
        biddingStartPrice: allowBidding ? biddingStartPrice : null,
        status: newStatus,
        imageKeys,
        specs,
        location: {
          province,
          city,
          area,
          link: locationLink,
        },
      });

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ التغييرات');
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
  // RENDER ATTRIBUTE INPUT
  // ==========================================================================

  const renderAttributeInput = (attr: Attribute) => {
    const value = specs[attr.key];

    // Brand selector
    if (attr.key === 'brandId') {
      return (
        <Select
          key={attr.key}
          label={attr.name}
          value={value || ''}
          onChange={(val) => handleSpecChange('brandId', val)}
          options={[
            { value: '', label: 'اختر العلامة التجارية' },
            ...brands.map(b => ({ value: b.id, label: b.nameAr || b.name })),
          ]}
          required={attr.validation === 'REQUIRED'}
        />
      );
    }

    // Model selector
    if (attr.key === 'modelId') {
      return (
        <Select
          key={attr.key}
          label={attr.name}
          value={value || ''}
          onChange={(val) => handleSpecChange('modelId', val)}
          options={[
            { value: '', label: 'اختر الموديل' },
            ...models.map(m => ({ value: m.id, label: m.name })),
          ]}
          required={attr.validation === 'REQUIRED'}
          disabled={!specs.brandId}
        />
      );
    }

    // Variant selector
    if (attr.key === 'variantId') {
      return (
        <Select
          key={attr.key}
          label={attr.name}
          value={value || ''}
          onChange={(val) => handleSpecChange('variantId', val)}
          options={[
            { value: '', label: 'اختر الفئة' },
            ...variants.map(v => ({ value: v.id, label: v.name })),
          ]}
          required={attr.validation === 'REQUIRED'}
          disabled={!specs.modelId}
        />
      );
    }

    // Selector type with options
    if (attr.type === 'selector' && attr.options && attr.options.length > 0) {
      return (
        <Select
          key={attr.key}
          label={attr.name}
          value={value || ''}
          onChange={(val) => handleSpecChange(attr.key, val)}
          options={[
            { value: '', label: `اختر ${attr.name}` },
            ...attr.options
              .filter(o => o.isActive)
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map(o => ({ value: o.key, label: o.value })),
          ]}
          required={attr.validation === 'REQUIRED'}
        />
      );
    }

    // Range selector (year, mileage)
    if (attr.type === 'range_selector') {
      return (
        <Input
          key={attr.key}
          label={attr.name}
          value={value?.toString() || ''}
          onChangeText={(val) => handleSpecChange(attr.key, val ? parseInt(val) : undefined)}
          keyboardType="numeric"
          placeholder={`أدخل ${attr.name}`}
          required={attr.validation === 'REQUIRED'}
        />
      );
    }

    // Default text input
    return (
      <Input
        key={attr.key}
        label={attr.name}
        value={value?.toString() || ''}
        onChangeText={(val) => handleSpecChange(attr.key, val)}
        placeholder={`أدخل ${attr.name}`}
        required={attr.validation === 'REQUIRED'}
      />
    );
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  const basicValidation = validateBasicInfo();
  const imagesValidation = validateImages();
  const specsValidation = validateSpecs();
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
        <View style={styles.header}>
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
              <View style={styles.rejectionHeader}>
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

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text variant="small" color="error">{error}</Text>
            </View>
          )}

          {/* Section 1: Basic Info */}
          <FormSection
            number={1}
            title="المعلومات الأساسية"
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
              onChangeText={setTitle}
              maxLength={100}
              showCounter
              required
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
              onChange={setPriceMinor}
              required
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
              onChange={handleImageChange}
              maxImages={10}
              disabled={isUploadingImage}
              label="صور المنتج"
              emptyStateTitle="أضف صور المنتج"
              emptyStateSubtitle="الصورة الأولى ستكون الصورة الرئيسية"
            />
          </FormSection>

          {/* Section 3: Specs */}
          {attributes.length > 0 && (
            <FormSection
              number={3}
              title="المواصفات"
              status={getSectionStatus(specsValidation.isValid, specsValidation.filledCount, specsValidation.totalCount, specsValidation.totalCount > 0)}
              filledCount={specsValidation.filledCount}
              totalCount={specsValidation.totalCount}
              hasRequiredFields={specsValidation.totalCount > 0}
            >
              {isLoadingAttributes ? (
                <Text variant="small" color="secondary">جاري التحميل...</Text>
              ) : (
                attributes
                  .filter(attr => !['title', 'description', 'price', 'location', 'search'].includes(attr.key))
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map(renderAttributeInput)
              )}
            </FormSection>
          )}

          {/* Section 4: Location */}
          <FormSection
            number={attributes.length > 0 ? 4 : 3}
            title="الموقع"
            status={getSectionStatus(locationValidation.isValid, locationValidation.filledCount, locationValidation.totalCount, true)}
            filledCount={locationValidation.filledCount}
            totalCount={locationValidation.totalCount}
            hasRequiredFields
          >
            <Select
              label="المحافظة"
              value={province}
              onChange={setProvince}
              options={[
                { value: '', label: 'اختر المحافظة' },
                ...PROVINCES,
              ]}
              required
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

            <View style={styles.locationLinkRow}>
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

          {/* Section 5: Status (only for ACTIVE/HIDDEN) */}
          {(listing.status === 'ACTIVE' || listing.status === 'HIDDEN') && (
            <FormSection
              number={attributes.length > 0 ? 5 : 4}
              title="إدارة الحالة"
              status={isHidden ? 'incomplete' : 'complete'}
            >
              <ToggleField
                label="إيقاف الإعلان مؤقتاً"
                value={isHidden}
                onChange={setIsHidden}
                description={isHidden
                  ? 'الإعلان مخفي حالياً ولن يظهر في البحث'
                  : 'الإعلان ظاهر ويمكن للآخرين رؤيته'
                }
              />
            </FormSection>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
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
      </KeyboardAvoidingView>
    </Modal>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const createStyles = (theme: Theme, isRTL: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.bg,
    },
    header: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.md,
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
      flexDirection: isRTL ? 'row-reverse' : 'row',
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
    errorContainer: {
      backgroundColor: '#fef2f2',
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    locationLinkRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'flex-end',
      gap: theme.spacing.sm,
    },
    locationButton: {
      marginBottom: theme.spacing.md,
    },
    footer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: theme.spacing.md,
      padding: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    footerButton: {
      flex: 1,
    },
  });

export default EditListingModal;
