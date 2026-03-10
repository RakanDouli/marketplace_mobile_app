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
  Play,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, Theme } from '../../src/theme';
import { Text, Button, Loading, Collapsible, IconText } from '../../src/components/slices';
import { useListingsStore } from '../../src/stores/listingsStore';
import { useCurrencyStore } from '../../src/stores/currencyStore';
import { useRelatedListingsStore } from '../../src/stores/relatedListingsStore';
import { useListingOwnerStore } from '../../src/stores/listingOwnerStore';
import { useUserAuthStore } from '../../src/stores/userAuthStore';
import { formatPrice, formatLocation, trackListingView, formatDate } from '../../src/utils';

// Components
import { CarDamageViewer, fromBackendFormat } from '../../src/components/listing/CarDamageViewer';
import { OwnerCard } from '../../src/components/listing/OwnerCard';
import { LocationMap } from '../../src/components/listing/LocationMap';
import { RelatedListings } from '../../src/components/listing/RelatedListings';
import { ImagePreviewModal } from '../../src/components/slices/ImagePreviewModal';
import { ReportModal } from '../../src/components/listing/ReportModal';
import { ReviewsModal } from '../../src/components/listing/ReviewsModal';
import { FavoriteButton } from '../../src/components/listing/FavoriteButton';
import { ShareButton } from '../../src/components/listing/ShareButton';
import { ContactSellerModal } from '../../src/components/ContactSellerModal';
import { BiddingSection } from '../../src/components/listing/BiddingSection';

import { getCloudflareImageUrl, getResponsiveImageUrl } from '../../src/utils/cloudflare-images';
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
  const [showMediaPreview, setShowMediaPreview] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
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

  // Handle Message - Opens contact seller modal
  const handleMessage = useCallback(() => {
    setShowContactModal(true);
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
      <View style={[styles.headerActions, theme.rtl.flexDirection.row()]}>
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
  }, [currentListing?.id, currentListing?.user, shareMetadata, styles]);

  // Build media items array: VIDEO FIRST (if exists), then images
  // IMPORTANT: Must be defined before early returns to follow React hooks rules
  const mediaItems = useMemo(() => {
    const items: { type: 'image' | 'video'; url: string; id: string }[] = [];

    // Add video FIRST if exists (video takes priority)
    // NOTE: Video URLs can be either:
    // 1. Full R2 URLs (https://pub-xxx.r2.dev/videos/xxx.mp4) - use as-is
    // 2. Cloudflare image IDs (legacy) - transform with getCloudflareImageUrl
    if (currentListing?.videoUrl) {
      const videoUrl = currentListing.videoUrl.startsWith('http')
        ? currentListing.videoUrl  // Already a full URL (R2 storage)
        : getCloudflareImageUrl(currentListing.videoUrl, 'public');  // Cloudflare ID
      items.push({
        type: 'video',
        url: videoUrl,
        id: 'video',
      });
    }

    // Add images after video - use responsive variant based on screen width
    if (currentListing?.imageKeys) {
      currentListing.imageKeys.forEach((key) => {
        items.push({
          type: 'image',
          url: getResponsiveImageUrl(key, SCREEN_WIDTH, 'gallery'),
          id: key,
        });
      });
    }

    return items;
  }, [currentListing?.imageKeys, currentListing?.videoUrl]);

  // Media navigation (images + video)
  // IMPORTANT: Must be defined before early returns to follow React hooks rules
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
    // Determine appropriate error message
    const isNotFound = error?.toLowerCase().includes('not found') || !currentListing;
    const errorTitle = isNotFound ? 'الإعلان غير موجود' : 'خطأ';
    const errorMessage = isNotFound
      ? 'هذا الإعلان غير متاح. قد يكون تم حذفه أو أرشفته.'
      : (error || 'حدث خطأ أثناء تحميل الإعلان');

    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: errorTitle,
            headerBackButtonDisplayMode: 'minimal',
            headerTintColor: theme.colors.text,
          }}
        />
        <View style={styles.errorContainer}>
          <Text variant="h4" color="secondary" center>
            {errorMessage}
          </Text>
          <Button variant="primary" onPress={() => router.back()} style={{ marginTop: 16 }}>
            العودة
          </Button>
        </View>
      </>
    );
  }

  // Main render - currentListing is guaranteed to exist here
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
  // Check if we have ANY location data to display (match web frontend logic)
  const hasLocation = currentListing.location && (
    currentListing.location.city ||
    currentListing.location.province ||
    currentListing.location.coordinates?.lat ||
    currentListing.location.link
  );

  const locationForMap = hasLocation && currentListing.location ? {
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
        {/* Media Gallery (Images + Video) */}
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
                renderItem={({ item, index }) => (
                  item.type === 'video' ? (
                    // Video thumbnail - press to open unified media preview
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => {
                        setActiveImageIndex(index);
                        setShowMediaPreview(true);
                      }}
                      style={styles.galleryVideo}
                    >
                      {/* Dark background with play button */}
                      <View style={styles.videoThumbnail}>
                        <View style={styles.playButtonCircle}>
                          <Play size={48} color="#FFFFFF" fill="#FFFFFF" />
                        </View>
                        <Text variant="body" style={styles.videoThumbnailText}>
                          اضغط لتشغيل الفيديو
                        </Text>
                      </View>
                      {/* Video badge */}
                      <View style={[styles.videoBadge, theme.rtl.flexDirection.row()]}>
                        <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
                        <Text variant="xs" style={styles.videoBadgeText}>فيديو</Text>
                      </View>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      activeOpacity={0.95}
                      onPress={() => {
                        setActiveImageIndex(index);
                        setShowMediaPreview(true);
                      }}
                    >
                      <Image
                        source={{ uri: item.url }}
                        style={styles.galleryImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
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
            {formatPrice(currentListing.priceMinor, preferredCurrency)}
          </Text>

          {/* Title */}
          <Text variant="h3" style={styles.title}>
            {currentListing.title}
          </Text>

          {/* Meta info */}
          <View style={styles.metaRow}>
            {location && (
              <IconText
                icon={<MapPin size={16} color={theme.colors.textMuted} />}
                text={location}
                variant="small"
                color="muted"
              />
            )}
            {currentListing.createdAt && (
              <IconText
                icon={<Calendar size={16} color={theme.colors.textMuted} />}
                text={formatDate(currentListing.createdAt)}
                variant="small"
                color="muted"
              />
            )}
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <IconText
              icon={<Eye size={16} color={theme.colors.textMuted} />}
              text={`${currentListing.viewCount || 0} مشاهدة`}
              variant="small"
              color="muted"
            />
            <IconText
              icon={<Heart size={16} color={theme.colors.textMuted} />}
              text={`${currentListing.wishlistCount || 0} مفضلة`}
              variant="small"
              color="muted"
            />
          </View>

          {/* Specifications - Collapsible */}
          {specsList.length > 0 && (
            <View style={styles.collapsibleContainer}>
              <Collapsible title="المواصفات" defaultOpen variant="bordered">
                <View style={[
                  styles.specsGrid,
                  theme.rtl.flexDirection.row(),
                ]}>
                  {specsList.map((spec) => (
                    <View key={spec.key} style={[
                      styles.specItem,
                      { alignItems: theme.isRTL ? "flex-end" : 'flex-start' },
                    ]}>
                      <Text variant="small" color="muted" style={{ textAlign: theme.isRTL ? 'right' : 'left' }}>
                        {spec.label}
                      </Text>
                      <Text variant="body" bold style={{ textAlign: theme.isRTL ? 'right' : 'left' }}>
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

          {/* Description - Collapsible */}
          {currentListing.description && (
            <View style={styles.collapsibleContainer}>
              <Collapsible title="الوصف" defaultOpen variant="bordered">
                <Text variant="paragraph" color="secondary" style={[styles.description, { textAlign: theme.isRTL ? 'right' : 'left' }]}>
                  {currentListing.description}
                </Text>
              </Collapsible>
            </View>
          )}

          {/* Bidding Section - Only show if bidding is enabled */}
          {currentListing.allowBidding && listingUserId && (
            <View style={styles.section}>
              <BiddingSection
                listingId={currentListing.id}
                listingOwnerId={listingUserId}
                allowBidding={currentListing.allowBidding}
                biddingStartPrice={currentListing.biddingStartPrice || null}
              />
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
      {/* Only show after owner data is loaded (prevents layout shift) */}
      {!isOwnListing && !ownerLoading && (
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
          </View>
        </SafeAreaView>
      )}

      {/* Unified Media Preview Modal (Images + Video) */}
      <ImagePreviewModal
        visible={showMediaPreview}
        onClose={() => setShowMediaPreview(false)}
        mediaItems={mediaItems}
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

      {/* Contact Seller Modal */}
      {currentListing && listingUserId && (
        <ContactSellerModal
          visible={showContactModal}
          onClose={() => setShowContactModal(false)}
          listingId={currentListing.id}
          listingTitle={currentListing.title || 'إعلان'}
          sellerId={listingUserId}
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
    galleryVideo: {
      width: SCREEN_WIDTH,
      height: IMAGE_HEIGHT,
      backgroundColor: '#000000',
    },
    videoThumbnail: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
    },
    playButtonCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.5)',
    },
    videoThumbnailText: {
      color: '#FFFFFF',
      opacity: 0.8,
    },
    videoBadge: {
      position: 'absolute',
      top: theme.spacing.md,
      right: theme.spacing.md,
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
      flexDirection: theme.isRTL ? 'row-reverse' : 'row',
      flexWrap: 'wrap',
      marginTop: theme.spacing.md,
      gap: theme.spacing.md,
      justifyContent: 'space-between',
    },
    statsRow: {
      flexDirection: theme.isRTL ? 'row-reverse' : 'row',
      marginTop: theme.spacing.md,
      paddingTop: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      gap: theme.spacing.lg,
      justifyContent: 'space-between',
    },

    // Section
    section: {
      marginTop: theme.spacing.lg,
    },
    collapsibleContainer: {
      backgroundColor: theme.colors.bg,
      marginTop: theme.spacing.md,
      borderRadius: theme.radius.md,
      overflow: 'hidden',
    },
    sectionTitle: {
      marginBottom: theme.spacing.md,
    },

    // Specs
    specsGrid: {
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      width: '100%',
    },
    specItem: {
      width: '48%',
      backgroundColor: theme.colors.bg,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
    },

    // Description
    description: {
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
      flexDirection: 'row',
      padding: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.bg,
      gap: theme.spacing.md,
    },
    actionButton: {
      flex: 1,
    },
  });
