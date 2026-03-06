/**
 * Listing Preview Modal
 * Shows a preview of the listing before submission
 * Displays product-related fields only (no seller info, no related listings)
 * UI matches the detail page structure
 */

import React, { useMemo, useState, useCallback, useRef } from 'react';
import {
  View,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Play,
} from 'lucide-react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useTheme, Theme } from '../../theme';
import { Text, Button, Collapsible } from '../slices';
import { useCreateListingStore } from '../../stores/createListingStore';
import { useCategoriesStore } from '../../stores/categoriesStore';
import { CarDamageViewer, fromBackendFormat } from '../listing/CarDamageViewer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_HEIGHT = 280;

// Syrian provinces mapping
const PROVINCES: Record<string, string> = {
  damascus: 'دمشق',
  rif_dimashq: 'ريف دمشق',
  aleppo: 'حلب',
  homs: 'حمص',
  hama: 'حماة',
  latakia: 'اللاذقية',
  tartus: 'طرطوس',
  deir_ezzor: 'دير الزور',
  idlib: 'إدلب',
  daraa: 'درعا',
  suwayda: 'السويداء',
  quneitra: 'القنيطرة',
  raqqa: 'الرقة',
  hasaka: 'الحسكة',
};

interface ListingPreviewModalProps {
  visible: boolean;
  onClose: () => void;
}

// Video item component
interface VideoItemProps {
  url: string;
  style: any;
  badgeStyle: any;
  badgeTextStyle: any;
}

const VideoItem: React.FC<VideoItemProps> = ({ url, style, badgeStyle, badgeTextStyle }) => {
  const player = useVideoPlayer(url, (p) => {
    p.loop = false;
  });

  return (
    <View style={style}>
      <VideoView
        player={player}
        style={style}
        nativeControls={true}
        contentFit="contain"
        allowsFullscreen={true}
      />
      <View style={badgeStyle}>
        <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
        <Text variant="xs" style={badgeTextStyle}>فيديو</Text>
      </View>
    </View>
  );
};

export function ListingPreviewModal({ visible, onClose }: ListingPreviewModalProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const flatListRef = useRef<FlatList>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Get form data from store
  const { formData, attributes, brands, models, variants } = useCreateListingStore();
  const { categories } = useCategoriesStore();

  // Get category info
  const category = categories.find(c => c.id === formData.categoryId);

  // Build media items array (images + video)
  const mediaItems = useMemo(() => {
    const items: { type: 'image' | 'video'; url: string; id: string }[] = [];

    // Add images
    formData.images.forEach((img, index) => {
      items.push({
        type: 'image',
        url: img.url,
        id: img.id || `image-${index}`,
      });
    });

    // Add video at the end if exists
    if (formData.video.length > 0) {
      items.push({
        type: 'video',
        url: formData.video[0].url,
        id: 'video',
      });
    }

    return items;
  }, [formData.images, formData.video]);

  // Navigation handlers
  const goToNextImage = useCallback(() => {
    if (mediaItems.length === 0) return;
    const nextIndex = (activeImageIndex + 1) % mediaItems.length;
    setActiveImageIndex(nextIndex);
    flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
  }, [activeImageIndex, mediaItems.length]);

  const goToPrevImage = useCallback(() => {
    if (mediaItems.length === 0) return;
    const prevIndex = activeImageIndex === 0 ? mediaItems.length - 1 : activeImageIndex - 1;
    setActiveImageIndex(prevIndex);
    flatListRef.current?.scrollToIndex({ index: prevIndex, animated: true });
  }, [activeImageIndex, mediaItems.length]);

  // Format location
  const locationText = useMemo(() => {
    const parts: string[] = [];
    if (formData.location.area) parts.push(formData.location.area);
    if (formData.location.city) parts.push(formData.location.city);
    if (formData.location.province) {
      parts.push(PROVINCES[formData.location.province] || formData.location.province);
    }
    return parts.join('، ') || 'غير محدد';
  }, [formData.location]);

  // Build specs list from formData.specs
  const specsList = useMemo(() => {
    const specs: { key: string; label: string; value: string }[] = [];

    // Get brand name
    if (formData.brandId || formData.specs.brandId) {
      const brandId = formData.brandId || formData.specs.brandId;
      const brand = brands.find(b => b.id === brandId);
      if (brand) {
        specs.push({ key: 'brand', label: 'الماركة', value: brand.name });
      }
    }

    // Get model name
    if (formData.modelId || formData.specs.modelId) {
      const modelId = formData.modelId || formData.specs.modelId;
      const model = models.find(m => m.id === modelId);
      if (model) {
        specs.push({ key: 'model', label: 'الموديل', value: model.name });
      }
    }

    // Get variant name
    if (formData.variantId || formData.specs.variantId) {
      const variantId = formData.variantId || formData.specs.variantId;
      const variant = variants.find(v => v.id === variantId);
      if (variant) {
        specs.push({ key: 'variant', label: 'الفئة', value: variant.name });
      }
    }

    // Add other specs from attributes
    Object.entries(formData.specs).forEach(([key, value]) => {
      // Skip IDs and empty values
      if (['brandId', 'modelId', 'variantId', 'car_damage'].includes(key)) return;
      if (!value && value !== 0) return;

      // Find attribute to get label
      const attr = attributes.find(a => a.key === key);
      const label = attr?.name || key;

      // Format value based on type
      let displayValue = String(value);

      // Check if it's a select/multiselect with options
      if (attr?.config?.options && Array.isArray(attr.config.options)) {
        const option = attr.config.options.find((o: any) => o.value === value);
        if (option) {
          displayValue = option.label;
        }
      }

      // Handle arrays (multiselect)
      if (Array.isArray(value)) {
        if (attr?.config?.options) {
          displayValue = value.map(v => {
            const opt = attr.config.options.find((o: any) => o.value === v);
            return opt?.label || v;
          }).join('، ');
        } else {
          displayValue = value.join('، ');
        }
      }

      specs.push({ key, label, value: displayValue });
    });

    return specs;
  }, [formData.specs, formData.brandId, formData.modelId, formData.variantId, attributes, brands, models, variants]);

  // Check for car damage data
  const carDamages = useMemo(() => {
    const damageData = formData.specs.car_damage;
    if (!damageData || !Array.isArray(damageData) || damageData.length === 0) {
      return [];
    }
    return fromBackendFormat(damageData as string[]);
  }, [formData.specs.car_damage]);

  // Condition label
  const conditionLabel = useMemo(() => {
    const conditions: Record<string, string> = {
      new: 'جديد',
      like_new: 'شبه جديد',
      used: 'مستعمل',
      needs_repair: 'يحتاج إصلاح',
    };
    return conditions[formData.condition] || formData.condition;
  }, [formData.condition]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bg }]} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text variant="h4" style={styles.headerTitle}>معاينة الإعلان</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Media Gallery */}
          <View style={styles.imageGallery}>
            {mediaItems.length > 0 ? (
              <>
                <FlatList
                  ref={flatListRef}
                  data={mediaItems}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                    setActiveImageIndex(index);
                  }}
                  renderItem={({ item }) => (
                    item.type === 'video' ? (
                      <VideoItem
                        url={item.url}
                        style={styles.galleryImage}
                        badgeStyle={styles.videoBadge}
                        badgeTextStyle={styles.videoBadgeText}
                      />
                    ) : (
                      <Image
                        source={{ uri: item.url }}
                        style={styles.galleryImage}
                        resizeMode="cover"
                      />
                    )
                  )}
                  keyExtractor={(item) => item.id}
                />

                {/* Navigation arrows */}
                {mediaItems.length > 1 && (
                  <>
                    <TouchableOpacity
                      style={[styles.galleryNav, styles.galleryNavLeft]}
                      onPress={theme.isRTL ? goToNextImage : goToPrevImage}
                    >
                      <ChevronLeft size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.galleryNav, styles.galleryNavRight]}
                      onPress={theme.isRTL ? goToPrevImage : goToNextImage}
                    >
                      <ChevronRight size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                  </>
                )}

                {/* Media counter */}
                {mediaItems.length > 1 && (
                  <View style={styles.imageCounter}>
                    <Text variant="xs" style={styles.imageCounterText}>
                      {activeImageIndex + 1} / {mediaItems.length}
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.noImage}>
                <Text variant="paragraph" color="muted">لا توجد صور</Text>
              </View>
            )}
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Price */}
            <Text variant="h2" style={styles.price}>
              {formData.priceMinor > 0
                ? `${formData.priceMinor.toLocaleString()} ل.س`
                : 'السعر غير محدد'}
            </Text>

            {/* Title */}
            <Text variant="h3" style={styles.title}>
              {formData.title || 'بدون عنوان'}
            </Text>

            {/* Meta info */}
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Text variant="small" color="secondary" style={styles.metaText}>
                  {locationText}
                </Text>
                <MapPin size={16} color={theme.colors.textMuted} />
              </View>
            </View>

            {/* Category & Condition */}
            <View style={styles.tagsRow}>
              {category && (
                <View style={[styles.tag, { backgroundColor: theme.colors.primaryLight }]}>
                  <Text variant="xs" style={{ color: theme.colors.primary }}>
                    {category.nameAr || category.name}
                  </Text>
                </View>
              )}
              {formData.condition && (
                <View style={[styles.tag, { backgroundColor: theme.colors.surface }]}>
                  <Text variant="xs" color="secondary">
                    {conditionLabel}
                  </Text>
                </View>
              )}
              {formData.listingType && (
                <View style={[styles.tag, { backgroundColor: theme.colors.surface }]}>
                  <Text variant="xs" color="secondary">
                    {formData.listingType === 'rent' ? 'للإيجار' : 'للبيع'}
                  </Text>
                </View>
              )}
            </View>

            {/* Specifications */}
            {specsList.length > 0 && (
              <View style={styles.collapsibleContainer}>
                <Collapsible title="المواصفات" defaultOpen variant="bordered">
                  <View style={styles.specsGrid}>
                    {specsList.map((spec) => (
                      <View key={spec.key} style={styles.specItem}>
                        <Text variant="small" color="muted">
                          {spec.label}
                        </Text>
                        <Text variant="body" bold>
                          {spec.value}
                        </Text>
                      </View>
                    ))}
                  </View>
                </Collapsible>
              </View>
            )}

            {/* Car Damage Viewer */}
            {carDamages.length > 0 && (
              <View style={styles.collapsibleContainer}>
                <Collapsible title="حالة السيارة" defaultOpen={false} variant="bordered">
                  <CarDamageViewer damages={carDamages} />
                </Collapsible>
              </View>
            )}

            {/* Description */}
            {formData.description && (
              <View style={styles.collapsibleContainer}>
                <Collapsible title="الوصف" defaultOpen variant="bordered">
                  <Text variant="paragraph" color="secondary" style={styles.description}>
                    {formData.description}
                  </Text>
                </Collapsible>
              </View>
            )}

            {/* Bidding Info */}
            {formData.allowBidding && (
              <View style={[styles.biddingCard, { backgroundColor: theme.colors.primaryLight }]}>
                <Text variant="body" style={{ color: theme.colors.primary }}>
                  المزايدة مفعّلة
                </Text>
                {formData.biddingStartPrice !== undefined && (
                  <Text variant="small" style={{ color: theme.colors.primary }}>
                    سعر البداية: {formData.biddingStartPrice.toLocaleString()} ل.س
                  </Text>
                )}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Bottom Action */}
        <View style={styles.bottomActions}>
          <Button
            variant="primary"
            size="lg"
            onPress={onClose}
            style={styles.actionButton}
          >
            إغلاق المعاينة
          </Button>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingStart: theme.spacing.md,
      paddingEnd: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    closeButton: {
      padding: theme.spacing.xs,
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
    },
    headerSpacer: {
      width: 32,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },

    // Image Gallery
    imageGallery: {
      width: SCREEN_WIDTH,
      height: IMAGE_HEIGHT,
      backgroundColor: theme.colors.surface,
      position: 'relative',
    },
    galleryImage: {
      width: SCREEN_WIDTH,
      height: IMAGE_HEIGHT,
    },
    videoBadge: {
      position: 'absolute',
      top: theme.spacing.md,
      right: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      backgroundColor: 'rgba(0,0,0,0.7)',
      paddingStart: theme.spacing.sm,
      paddingEnd: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.radius.md,
    },
    videoBadgeText: {
      color: '#FFFFFF',
    },
    noImage: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
    },
    galleryNav: {
      position: 'absolute',
      top: '50%',
      marginTop: -20,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    galleryNavLeft: {
      left: theme.spacing.md,
    },
    galleryNavRight: {
      right: theme.spacing.md,
    },
    imageCounter: {
      position: 'absolute',
      bottom: theme.spacing.md,
      left: theme.spacing.md,
      backgroundColor: 'rgba(0,0,0,0.6)',
      paddingStart: theme.spacing.sm,
      paddingEnd: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.radius.md,
    },
    imageCounterText: {
      color: '#FFFFFF',
    },

    // Content
    content: {
      padding: theme.spacing.md,
    },
    price: {
      color: theme.colors.primary,
    },
    title: {
      marginTop: theme.spacing.sm,
    },
    metaRow: {
      flexWrap: 'wrap',
      marginTop: theme.spacing.md,
      gap: theme.spacing.md,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    metaText: {},
    tagsRow: {
      flexWrap: 'wrap',
      marginTop: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    tag: {
      paddingStart: theme.spacing.sm,
      paddingEnd: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.radius.md,
    },

    // Collapsible sections
    collapsibleContainer: {
      backgroundColor: theme.colors.bg,
      marginTop: theme.spacing.md,
      borderRadius: theme.radius.md,
      overflow: 'hidden',
    },

    // Specs
    specsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    specItem: {
      width: '48%',
      backgroundColor: theme.colors.bg,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      alignItems: theme.isRTL ? 'flex-end' : 'flex-start',
    },

    // Description
    description: {
      lineHeight: 24,
    },

    // Bidding card
    biddingCard: {
      marginTop: theme.spacing.md,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      alignItems: theme.isRTL ? 'flex-end' : 'flex-start',
      gap: theme.spacing.xs,
    },

    // Bottom Actions
    bottomActions: {
      padding: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.bg,
    },
    actionButton: {
      width: '100%',
    },
  });

export default ListingPreviewModal;
