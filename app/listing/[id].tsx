/**
 * Listing Detail Screen
 * Complete listing details with all features from web frontend
 * Uses native transparent header over image gallery
 */

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Linking,
  FlatList,
  Image,
  Alert,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import {
  MapPin,
  Calendar,
  Eye,
  Heart,
  Phone,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, Theme } from '../../src/theme';
import { Text, Button, Loading, Collapsible } from '../../src/components/slices';
import { useListingsStore } from '../../src/stores/listingsStore';
import { useCurrencyStore } from '../../src/stores/currencyStore';
import { useRelatedListingsStore } from '../../src/stores/relatedListingsStore';
import { useListingOwnerStore } from '../../src/stores/listingOwnerStore';
import { useUserAuthStore } from '../../src/stores/userAuthStore';
import { formatPrice, formatLocation, trackListingView } from '../../src/utils';

// Components
import { CarDamageViewer, fromBackendFormat } from '../../src/components/listing/CarDamageViewer';
import { OwnerCard } from '../../src/components/listing/OwnerCard';
import { LocationMap } from '../../src/components/listing/LocationMap';
import { RelatedListings } from '../../src/components/listing/RelatedListings';
import { ImagePreviewModal } from '../../src/components/listing/ImagePreviewModal';
import { ReportModal } from '../../src/components/listing/ReportModal';
import { ReviewsModal } from '../../src/components/listing/ReviewsModal';
import { FavoriteButton } from '../../src/components/listing/FavoriteButton';
import { ShareButton } from '../../src/components/listing/ShareButton';

import { getCloudflareImageUrl } from '../../src/services/cloudflare/images';
import { ENV } from '../../src/constants/env';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_HEIGHT = 300;

export default function ListingDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // State
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Stores
  const { currentListing, isLoading, error, fetchListingById } = useListingsStore();
  const preferredCurrency = useCurrencyStore((state) => state.preferredCurrency);
  const { fetchAll: fetchRelated, clearRelated } = useRelatedListingsStore();
  const { owner, isLoading: ownerLoading, clearOwner } = useListingOwnerStore();
  const { profile: currentUserProfile } = useUserAuthStore();

  // Fetch listing on mount
  useEffect(() => {
    if (id) {
      fetchListingById(id);
    }
    return () => {
      clearRelated();
      clearOwner();
    };
  }, [id]);

  // Fetch related listings after main listing loads
  useEffect(() => {
    if (currentListing?.id) {
      fetchRelated(currentListing.id);
    }
  }, [currentListing?.id]);

  // Track view for analytics
  useEffect(() => {
    if (id) {
      trackListingView(id);
    }
  }, [id]);

  // Image navigation
  const goToNextImage = useCallback(() => {
    if (!currentListing?.imageKeys) return;
    const nextIndex = (activeImageIndex + 1) % currentListing.imageKeys.length;
    setActiveImageIndex(nextIndex);
    flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
  }, [activeImageIndex, currentListing?.imageKeys]);

  const goToPrevImage = useCallback(() => {
    if (!currentListing?.imageKeys) return;
    const prevIndex = activeImageIndex === 0 ? currentListing.imageKeys.length - 1 : activeImageIndex - 1;
    setActiveImageIndex(prevIndex);
    flatListRef.current?.scrollToIndex({ index: prevIndex, animated: true });
  }, [activeImageIndex, currentListing?.imageKeys]);

  // Handle call seller
  const handleCallSeller = useCallback(() => {
    const phone = owner?.contactPhone || owner?.phone;
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  }, [owner]);

  // Handle WhatsApp
  const handleWhatsApp = useCallback(() => {
    const phone = owner?.contactPhone || owner?.phone;
    if (phone && currentListing) {
      const cleanPhone = phone.replace(/\D/g, '');
      Linking.openURL(`whatsapp://send?phone=${cleanPhone}&text=مرحباً، رأيت إعلانك: ${currentListing.title}`);
    }
  }, [owner, currentListing]);

  // Handle Message - Opens chat or shows placeholder
  const handleMessage = useCallback(() => {
    // TODO: Implement chat/messaging feature
    // For now, show an alert
    Alert.alert(
      'إرسال رسالة',
      'ميزة المراسلة قيد التطوير. يمكنك استخدام الاتصال أو واتساب للتواصل مع البائع.',
      [{ text: 'حسناً', style: 'default' }]
    );
  }, []);

  // Build share metadata
  const shareMetadata = useMemo(() => {
    if (!currentListing) return null;
    const categorySlug = currentListing.category?.slug || 'cars';
    const listingType = currentListing.listingType === 'rent' ? 'rent' : 'sell';
    const shareUrl = `${ENV.WEB_URL}/${categorySlug}/${listingType}/${currentListing.id}`;
    const firstImage = currentListing.imageKeys?.[0];

    return {
      title: currentListing.title || '',
      description: currentListing.description?.slice(0, 100) || '',
      url: shareUrl,
      price: formatPrice(currentListing.priceMinor, preferredCurrency),
      imageUrl: firstImage ? getCloudflareImageUrl(firstImage, 'card') : undefined,
    };
  }, [currentListing, preferredCurrency]);

  // Format date
  const formatDate = useCallback((dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  // Build specs list from specsDisplay (excluding car_damage)
  const specsList = useMemo(() => {
    if (!currentListing?.specsDisplay) return [];
    return Object.entries(currentListing.specsDisplay)
      .filter(([key, spec]: [string, any]) =>
        spec?.label && spec?.value && key !== 'car_damage'
      )
      .map(([key, spec]: [string, any]) => ({
        key,
        label: spec.label,
        value: typeof spec.value === 'object' ? JSON.stringify(spec.value) : spec.value,
      }));
  }, [currentListing?.specsDisplay]);

  // Check for car damage data
  // Try specs first (raw data), then specsDisplay (processed data)
  const carDamages = useMemo(() => {
    // First check specs.car_damage (raw array from backend)
    const rawDamageData = currentListing?.specs?.car_damage;
    if (rawDamageData && Array.isArray(rawDamageData) && rawDamageData.length > 0) {
      return fromBackendFormat(rawDamageData as string[]);
    }
    // Fallback to specsDisplay.car_damage.value
    const displayDamageData = currentListing?.specsDisplay?.car_damage?.value;
    if (!displayDamageData) return [];
    return fromBackendFormat(displayDamageData);
  }, [currentListing?.specs, currentListing?.specsDisplay]);

  // Native header right component - must be defined before early returns
  const headerRight = useCallback(() => {
    if (!currentListing || !shareMetadata) return null;
    return (
      <View style={styles.headerActions}>
        <ShareButton
          metadata={shareMetadata}
          size={22}
          style="inline"
        />
        <FavoriteButton
          listingId={currentListing.id}
          listingUserId={currentListing.user?.id}
          size={22}
          style="inline"
        />
      </View>
    );
  }, [currentListing?.id, currentListing?.userId, shareMetadata, styles]);

  // Loading state
  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: '',
            headerBackButtonDisplayMode: 'minimal',
            headerTintColor: theme.colors.text,
          }}
        />
        <View style={styles.loadingContainer}>
          <Loading type="svg" size="lg" />
        </View>
      </>
    );
  }

  // Error state
  if (error || !currentListing) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: 'خطأ',
            headerBackButtonDisplayMode: 'minimal',
            headerTintColor: theme.colors.text,
          }}
        />
        <View style={styles.errorContainer}>
          <Text variant="h4" color="secondary">
            {error || 'لم يتم العثور على الإعلان'}
          </Text>
          <Button variant="primary" onPress={() => router.back()} style={{ marginTop: 16 }}>
            العودة
          </Button>
        </View>
      </>
    );
  }

  const images = currentListing.imageKeys || [];
  const location = formatLocation(currentListing.location);
  const hasPhone = owner?.showPhone && (owner?.phone || owner?.contactPhone);
  const isWhatsApp = owner?.phoneIsWhatsApp;

  // Get userId from user object (GraphQL returns user.id, not userId)
  const listingUserId = currentListing.user?.id;

  // Check if this is user's own listing (don't show contact buttons or report for own listings)
  const isOwnListing = !!(currentUserProfile?.id && listingUserId && currentUserProfile.id === listingUserId);

  // Prepare location for LocationMap
  // Priority: link → coordinates → address → province only
  const locationForMap = currentListing.location ? {
    province: currentListing.location.province,
    city: currentListing.location.city,
    area: currentListing.location.area,
    link: currentListing.location.link,
    coordinates: currentListing.location.coordinates,
  } : undefined;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: '',
          headerStyle: { backgroundColor: theme.colors.bg },
          headerShadowVisible: true,
          headerBackVisible: true,
          headerBackButtonDisplayMode: 'minimal',
          headerTintColor: theme.colors.text,
          headerRight: headerRight,
        }}
      />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Image Gallery */}
        <View style={styles.imageGallery}>
          {images.length > 0 ? (
              <>
                <FlatList
                  ref={flatListRef}
                  data={images}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                    setActiveImageIndex(index);
                  }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      activeOpacity={0.95}
                      onPress={() => setShowImagePreview(true)}
                    >
                      <Image
                        source={{ uri: getCloudflareImageUrl(item, 'large') }}
                        style={styles.galleryImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  )}
                  keyExtractor={(item) => item}
                />

                {/* Navigation arrows */}
                {images.length > 1 && (
                  <>
                    <TouchableOpacity
                      style={[styles.galleryNav, styles.galleryNavLeft]}
                      onPress={goToPrevImage}
                    >
                      <ChevronLeft size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.galleryNav, styles.galleryNavRight]}
                      onPress={goToNextImage}
                    >
                      <ChevronRight size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                  </>
                )}

                {/* Image counter */}
                {images.length > 1 && (
                  <View style={styles.imageCounter}>
                    <Text variant="xs" style={styles.imageCounterText}>
                      {activeImageIndex + 1} / {images.length}
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
              {formatPrice(currentListing.priceMinor, preferredCurrency)}
            </Text>

            {/* Title */}
            <Text variant="h3" style={styles.title}>
              {currentListing.title}
            </Text>

            {/* Meta info */}
            <View style={styles.metaRow}>
              {location && (
                <View style={styles.metaItem}>
                  <Text variant="small" color="secondary" style={styles.metaText}>
                    {location}
                  </Text>
                  <MapPin size={16} color={theme.colors.textMuted} />
                </View>
              )}
              {currentListing.createdAt && (
                <View style={styles.metaItem}>
                  <Text variant="small" color="secondary" style={styles.metaText}>
                    {formatDate(currentListing.createdAt)}
                  </Text>
                  <Calendar size={16} color={theme.colors.textMuted} />
                </View>
              )}
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text variant="small" color="muted">
                  {currentListing.viewCount || 0} مشاهدة
                </Text>
                <Eye size={16} color={theme.colors.textMuted} />
              </View>
              <View style={styles.statItem}>
                <Text variant="small" color="muted">
                  {currentListing.wishlistCount || 0} مفضلة
                </Text>
                <Heart size={16} color={theme.colors.textMuted} />
              </View>
            </View>

            {/* Specifications - Collapsible */}
            {specsList.length > 0 && (
              <View style={styles.section}>
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
              <View style={styles.section}>
                <Collapsible title="حالة السيارة" defaultOpen={false} variant="bordered">
                  <CarDamageViewer damages={carDamages} />
                </Collapsible>
              </View>
            )}

            {/* Description - Collapsible */}
            {currentListing.description && (
              <View style={styles.section}>
                <Collapsible title="الوصف" defaultOpen variant="bordered">
                  <Text variant="paragraph" color="secondary" style={styles.description}>
                    {currentListing.description}
                  </Text>
                </Collapsible>
              </View>
            )}

            {/* Seller Info */}
            {listingUserId && (
              <View style={styles.section}>
                <Text variant="h4" style={styles.sectionTitle}>
                  معلومات البائع
                </Text>
                <OwnerCard
                  userId={listingUserId}
                  onViewReviews={() => setShowReviewsModal(true)}
                  onReport={isOwnListing ? undefined : () => setShowReportModal(true)}
                />
              </View>
            )}

            {/* Location Map */}
            {locationForMap && (
              <View style={styles.section}>
                <Text variant="h4" style={styles.sectionTitle}>
                  الموقع
                </Text>
                <LocationMap
                  location={locationForMap}
                  title={currentListing.title}
                />
              </View>
            )}
          </View>

          {/* Related Listings - By Brand (Slider) */}
          <RelatedListings
            listingId={currentListing.id}
            type="brand"
            title="من نفس الماركة"
            layout="slider"
          />

          {/* Related Listings - By Price (Grid) */}
          <RelatedListings
            listingId={currentListing.id}
            type="price"
            title="بسعر مشابه"
            layout="grid"
          />

          {/* Bottom spacing for action bar */}
          <View style={{ height: isOwnListing ? 20 : 100 }} />
        </ScrollView>

        {/* Bottom Actions - Fixed at bottom */}
        {/* Always show for other's listings, hide for own listings */}
        {!isOwnListing && (
          <SafeAreaView edges={['bottom']} style={styles.bottomSafeArea}>
            <View style={styles.bottomActions}>
              {/* Message Button - Always visible */}
              <Button
                variant="primary"
                icon={<MessageCircle size={18} color="#FFFFFF" />}
                onPress={handleMessage}
                style={styles.actionButton}
              >
                رسالة
              </Button>

              {/* Show skeleton buttons while owner data is loading */}
              {/* This prevents layout shift when phone buttons appear */}
              {ownerLoading ? (
                <>
                  {/* Placeholder for Call button */}
                  <View style={[styles.actionButton, styles.skeletonButton]} />
                  {/* Placeholder for WhatsApp button */}
                  <View style={[styles.actionButton, styles.skeletonButton]} />
                </>
              ) : (
                <>
                  {/* Call Button - Only if phone is available */}
                  {hasPhone && (
                    <Button
                      variant="outline"
                      icon={<Phone size={18} color={theme.colors.primary} />}
                      onPress={handleCallSeller}
                      style={styles.actionButton}
                    >
                      اتصال
                    </Button>
                  )}

                  {/* WhatsApp Button - Only if phone is WhatsApp */}
                  {hasPhone && isWhatsApp && (
                    <Button
                      variant="success"
                      icon={<MessageCircle size={18} color="#FFFFFF" />}
                      onPress={handleWhatsApp}
                      style={styles.actionButton}
                    >
                      واتساب
                    </Button>
                  )}
                </>
              )}
            </View>
          </SafeAreaView>
        )}

      {/* Modals */}
      <ImagePreviewModal
        visible={showImagePreview}
        onClose={() => setShowImagePreview(false)}
        images={images}
        initialIndex={activeImageIndex}
      />

      {listingUserId && (
        <ReportModal
          visible={showReportModal}
          onClose={() => setShowReportModal(false)}
          entityType="listing"
          entityId={currentListing.id}
          reportedUserId={listingUserId}
          sellerName={owner?.name}
        />
      )}

      {listingUserId && (
        <ReviewsModal
          visible={showReviewsModal}
          onClose={() => setShowReviewsModal(false)}
          userId={listingUserId}
          userName={owner?.name}
        />
      )}
    </>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.bg,
    },
    scrollView: {
      flex: 1,
      backgroundColor: theme.colors.bg,
    },
    scrollContent: {
      flexGrow: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.lg,
    },

    // Native Header Actions (headerRight)
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
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
      paddingHorizontal: theme.spacing.sm,
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
      textAlign: 'right',
    },
    title: {
      marginTop: theme.spacing.sm,
      textAlign: 'right',
    },
    metaRow: {
      flexDirection: 'row-reverse',
      flexWrap: 'wrap',
      marginTop: theme.spacing.md,
      gap: theme.spacing.md,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    metaText: {
      marginRight: 4,
    },
    statsRow: {
      flexDirection: 'row-reverse',
      marginTop: theme.spacing.md,
      paddingTop: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      gap: theme.spacing.lg,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },

    // Section
    section: {
      marginTop: theme.spacing.lg,
    },
    sectionTitle: {
      marginBottom: theme.spacing.md,
      textAlign: 'right',
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
      alignItems: 'flex-end',
    },

    // Description
    description: {
      textAlign: 'right',
      lineHeight: 24,
    },

    // Bottom Actions - Fixed at bottom
    bottomSafeArea: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.colors.bg,
    },
    bottomActions: {
      flexDirection: 'row-reverse',
      padding: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.bg,
      gap: theme.spacing.md,
    },
    actionButton: {
      flex: 1,
    },
    skeletonButton: {
      height: 44,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
  });
