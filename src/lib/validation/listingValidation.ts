/**
 * Listing validation utilities for React Native
 * Provides client-side validation with Arabic error messages
 * Ported from web frontend validation system
 */

// ============ TYPES ============

export interface ListingFormData {
  title: string;
  description?: string;
  priceMinor: number;
  allowBidding: boolean;
  biddingStartPrice?: number;
  images: any[];
  videoUrl?: string;
  location: {
    province: string;
    city?: string;
    area?: string;
    link?: string;
  };
  specs: Record<string, any>;
}

export interface ValidationErrors {
  [key: string]: string | undefined;
}

export interface AttributeConfig {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  maxSelections?: number;
  expectedValue?: 'string' | 'number' | 'array' | 'date' | 'boolean';
  dateFormat?: 'year' | 'month' | 'day' | 'full';
  dataSource?: string;
  pattern?: string;
}

export interface ValidatableAttribute {
  key: string;
  name: string;
  validation: 'REQUIRED' | 'OPTIONAL' | 'required' | 'optional';
  type: string;
  maxSelections?: number;
  config?: AttributeConfig;
}

// ============ VALIDATION CONFIG ============

export const ListingValidationConfig = {
  title: {
    minLength: 5,
    maxLength: 100,
  },
  description: {
    maxLength: 2000,
  },
  price: {
    min: 1,
  },
  images: {
    min: 1,
    max: 20,
  },
  videoUrl: {
    maxLength: 500,
  },
  location: {
    provinceRequired: true,
  },
};

// ============ INDIVIDUAL FIELD VALIDATORS ============

export const validateTitle = (title: string): string | undefined => {
  if (!title || !title.trim()) {
    return 'عنوان الإعلان مطلوب';
  }

  const trimmed = title.trim();
  if (trimmed.length < ListingValidationConfig.title.minLength) {
    return `عنوان الإعلان يجب أن يكون ${ListingValidationConfig.title.minLength} أحرف على الأقل`;
  }

  if (trimmed.length > ListingValidationConfig.title.maxLength) {
    return `عنوان الإعلان يجب أن يكون أقل من ${ListingValidationConfig.title.maxLength} حرف`;
  }

  return undefined;
};

export const validateDescription = (description: string): string | undefined => {
  if (!description || !description.trim()) {
    return undefined; // Description is optional
  }

  if (description.length > ListingValidationConfig.description.maxLength) {
    return `الوصف يجب أن يكون أقل من ${ListingValidationConfig.description.maxLength} حرف`;
  }

  return undefined;
};

export const validatePriceMinor = (price: number): string | undefined => {
  if (price === undefined || price === null || price < ListingValidationConfig.price.min) {
    return 'السعر مطلوب ويجب أن يكون أكبر من صفر';
  }
  return undefined;
};

export const validateImages = (images: any[]): string | undefined => {
  if (!images || images.length < ListingValidationConfig.images.min) {
    return `يجب إضافة ${ListingValidationConfig.images.min} صورة على الأقل`;
  }

  if (images.length > ListingValidationConfig.images.max) {
    return `يجب ألا تتجاوز عدد الصور ${ListingValidationConfig.images.max}`;
  }

  return undefined;
};

export const validateVideoUrl = (url: string): string | undefined => {
  if (!url || url.trim() === '') return undefined; // Empty is OK

  try {
    // Basic URL validation
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return 'رابط الفيديو غير صحيح';
    }

    if (url.length > ListingValidationConfig.videoUrl.maxLength) {
      return 'رابط الفيديو طويل جداً';
    }

    return undefined;
  } catch {
    return 'رابط الفيديو غير صحيح';
  }
};

export const validateProvince = (province: string): string | undefined => {
  if (!province || !province.trim()) {
    return 'المحافظة مطلوبة';
  }
  return undefined;
};

// ============ CONFIG-BASED FIELD VALIDATION ============

/**
 * Validate a field value using attribute config
 * Used for title, description, and dynamic attribute fields
 */
export const validateFieldWithConfig = (
  value: any,
  fieldName: string,
  config: AttributeConfig,
  required: boolean = false
): string | undefined => {
  // Check required
  if (required) {
    if (value === undefined || value === null || value === '' ||
        (Array.isArray(value) && value.length === 0)) {
      return `${fieldName} مطلوب`;
    }
  }

  // Skip validation if empty and not required
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const strValue = typeof value === 'string' ? value.trim() : String(value);

  // minLength validation
  if (config.minLength !== undefined && strValue.length < config.minLength) {
    return `${fieldName} يجب أن يكون ${config.minLength} أحرف على الأقل`;
  }

  // maxLength validation
  if (config.maxLength !== undefined && strValue.length > config.maxLength) {
    return `${fieldName} يجب أن يكون أقل من ${config.maxLength} حرف`;
  }

  // Number min validation
  if (config.min !== undefined && typeof value === 'number') {
    if (value < config.min) {
      return `${fieldName} يجب أن يكون ${config.min} على الأقل`;
    }
  }

  // Number max validation
  if (config.max !== undefined && typeof value === 'number') {
    if (value > config.max) {
      return `${fieldName} يجب أن يكون أقل من ${config.max}`;
    }
  }

  // Array maxSelections validation
  if (config.maxSelections !== undefined && Array.isArray(value)) {
    if (value.length > config.maxSelections) {
      return `${fieldName} يجب ألا يتجاوز ${config.maxSelections} خيارات`;
    }
  }

  return undefined;
};

// ============ DYNAMIC ATTRIBUTE VALIDATION ============

// Attribute types (matching backend enums)
export const AttributeType = {
  SELECTOR: 'selector',
  SINGLE_SELECT: 'single_select',
  SELECT: 'select',
  MULTI_SELECTOR: 'multi_selector',
  MULTI_SELECT: 'multi_select',
  RANGE: 'range',
  RANGE_SELECTOR: 'range_selector',
  NUMBER: 'number',
  INTEGER: 'integer',
  TEXT: 'text',
  STRING: 'string',
  BOOLEAN: 'boolean',
} as const;

/**
 * Validate dynamic attribute based on attribute type, validation rules, and config
 * This is the main function for validating any dynamic attribute
 */
export const validateAttribute = (
  value: any,
  attribute: ValidatableAttribute
): string | undefined => {
  const isRequired = attribute.validation === 'REQUIRED' || attribute.validation === 'required';
  const config = attribute.config || {};

  // Required validation
  if (isRequired) {
    if (value === undefined || value === null || value === '' ||
        (Array.isArray(value) && value.length === 0)) {
      return `${attribute.name} مطلوب`;
    }
  }

  // Skip further validation if empty and not required
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  // Config-based validation (minLength, maxLength, maxSelections)
  const configError = validateFieldWithConfig(value, attribute.name, {
    ...config,
    maxSelections: attribute.maxSelections || config.maxSelections,
  }, false); // Don't check required again
  if (configError) return configError;

  // Type-specific validation
  const attrType = attribute.type?.toLowerCase();

  switch (attrType) {
    case AttributeType.SELECTOR:
    case AttributeType.SINGLE_SELECT:
    case AttributeType.SELECT:
      if (typeof value !== 'string' || !value.trim()) {
        return `${attribute.name} غير صحيح`;
      }
      break;

    case AttributeType.MULTI_SELECTOR:
    case AttributeType.MULTI_SELECT:
      // For listings: MULTI_SELECTOR stores array of selected options
      if (Array.isArray(value)) {
        const maxSel = attribute.maxSelections || config.maxSelections;
        if (maxSel && value.length > maxSel) {
          return `${attribute.name} يجب ألا يتجاوز ${maxSel} خيارات`;
        }
      } else if (typeof value !== 'string' || !value.trim()) {
        // Single value mode (backwards compatibility)
        return `${attribute.name} غير صحيح`;
      }
      break;

    case AttributeType.RANGE:
    case AttributeType.RANGE_SELECTOR:
      // RANGE has two use cases:
      // 1. Listing creation/editing: single value (string or number) - e.g., year: "2018"
      // 2. Filtering: {min, max} object - e.g., year: {min: 2015, max: 2020}

      // Accept single value (string or number)
      if (typeof value === 'string' || typeof value === 'number') {
        // Validate number range if config has min/max
        if (typeof value === 'number' || !isNaN(Number(value))) {
          const numValue = Number(value);
          if (config.min !== undefined && numValue < config.min) {
            return `${attribute.name} يجب أن يكون ${config.min} على الأقل`;
          }
          if (config.max !== undefined && numValue > config.max) {
            return `${attribute.name} يجب أن يكون أقل من ${config.max}`;
          }
        }
        break;
      }

      // OR accept {min, max} object (for filter compatibility)
      if (typeof value === 'object' && value !== null) {
        if (!value.min && !value.max) {
          return `${attribute.name} غير صحيح`;
        }
        if (value.min && value.max && parseFloat(value.min) > parseFloat(value.max)) {
          return `${attribute.name}: القيمة الدنيا يجب أن تكون أصغر من القيمة القصوى`;
        }
        break;
      }

      // Neither single value nor valid object
      return `${attribute.name} غير صحيح`;

    case AttributeType.NUMBER:
    case AttributeType.INTEGER:
      if (isNaN(Number(value))) {
        return `${attribute.name} يجب أن يكون رقماً`;
      }
      // Validate number range if config has min/max
      const numValue = Number(value);
      if (config.min !== undefined && numValue < config.min) {
        return `${attribute.name} يجب أن يكون ${config.min} على الأقل`;
      }
      if (config.max !== undefined && numValue > config.max) {
        return `${attribute.name} يجب أن يكون أقل من ${config.max}`;
      }
      break;

    case AttributeType.TEXT:
    case AttributeType.STRING:
      if (typeof value !== 'string') {
        return `${attribute.name} غير صحيح`;
      }
      break;

    case AttributeType.BOOLEAN:
      if (typeof value !== 'boolean') {
        return `${attribute.name} غير صحيح`;
      }
      break;
  }

  return undefined;
};

// ============ FULL FORM VALIDATION ============

/**
 * Validate entire listing form
 * Returns object with field keys and error messages
 */
export const validateListingForm = (formData: Partial<ListingFormData>): ValidationErrors => {
  const errors: ValidationErrors = {};

  // 1. Validate title
  if (formData.title !== undefined) {
    const titleError = validateTitle(formData.title);
    if (titleError) errors.title = titleError;
  } else {
    errors.title = 'عنوان الإعلان مطلوب';
  }

  // 2. Validate description (optional)
  if (formData.description) {
    const descError = validateDescription(formData.description);
    if (descError) errors.description = descError;
  }

  // 3. Validate price
  if (formData.priceMinor !== undefined) {
    const priceError = validatePriceMinor(formData.priceMinor);
    if (priceError) errors.priceMinor = priceError;
  } else {
    errors.priceMinor = 'السعر مطلوب';
  }

  // 4. Validate images
  if (formData.images) {
    const imagesError = validateImages(formData.images);
    if (imagesError) errors.images = imagesError;
  } else {
    errors.images = `يجب إضافة ${ListingValidationConfig.images.min} صورة على الأقل`;
  }

  // 5. Validate video URL (optional)
  if (formData.videoUrl) {
    const videoError = validateVideoUrl(formData.videoUrl);
    if (videoError) errors.videoUrl = videoError;
  }

  // 6. Validate location
  if (formData.location?.province) {
    const provinceError = validateProvince(formData.location.province);
    if (provinceError) errors['location.province'] = provinceError;
  } else {
    errors['location.province'] = 'المحافظة مطلوبة';
  }

  // 7. Validate bidding fields
  if (formData.allowBidding && (formData.biddingStartPrice === undefined || formData.biddingStartPrice === null || formData.biddingStartPrice < 0)) {
    errors.biddingStartPrice = 'سعر البداية للمزايدة مطلوب عند تفعيل المزايدة';
  }

  return errors;
};

// ============ HELPERS ============

/**
 * Check if there are any errors in the validation result
 */
export const hasValidationErrors = (errors: ValidationErrors): boolean => {
  return Object.values(errors).some(error => error !== undefined && error !== '');
};

/**
 * Create a field validator function for use with Input components
 */
export const createListingFieldValidator = (fieldName: string) => {
  return (value: any): string | undefined => {
    switch (fieldName) {
      case 'title':
        return validateTitle(value);
      case 'description':
        return validateDescription(value);
      case 'priceMinor':
        return validatePriceMinor(value);
      case 'images':
        return validateImages(value);
      case 'videoUrl':
        return validateVideoUrl(value);
      case 'location.province':
        return validateProvince(value);
      default:
        return undefined;
    }
  };
};

/**
 * Validate all attributes in an attribute group
 * Returns object with attribute keys and error messages
 */
export const validateAttributeGroup = (
  attributes: ValidatableAttribute[],
  specs: Record<string, any>
): ValidationErrors => {
  const errors: ValidationErrors = {};

  for (const attr of attributes) {
    const value = specs[attr.key];
    const error = validateAttribute(value, attr);
    if (error) {
      errors[attr.key] = error;
    }
  }

  return errors;
};
