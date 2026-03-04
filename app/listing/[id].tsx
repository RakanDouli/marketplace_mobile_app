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
import { useVideoPlayer, VideoView } from 'expo-video';
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
import { Text, Button, Loading, Collapsible } from '../../src/components/slices';
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

import { getCloudflareImageUrl, getResponsiveImageUrl } from '../../src/utils/cloudflare-images';
import { ENV } from '../../src/constants/env';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_HEIGHT = 300;

// Separate component for video playback using expo-video
// Must be a separate component because useVideoPlayer is a hook
interface VideoItemProps {
  url: string;
  style: any;
  badgeStyle: any;
  badgeTextStyle: any;
}

const VideoItem: React.FC<VideoItemProps> = ({ url, style, badgeStyle, badgeTextStyle }) => {
  const player = useVideoPlayer(url, (player) => {
    player.loop = false;
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
      {/* Video indicator badge */}
      <View style={badgeStyle}>
        <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
        <Text variant="xs" style={badgeTextStyle}>فيديو</Text>
      </View>
    </View>
  );
};

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

  // Build media items array: images first, video at the end (same as web frontend)
  // IMPORTANT: Must be defined before early returns to follow React hooks rules
  const mediaItems = useMemo(() => {
    const items: { type: 'image' | 'video'; url: string; id: string }[] = [];

    // Add images first - use responsive variant based on screen width
    if (currentListing?.imageKeys) {
      currentListing.imageKeys.forEach((key, index) => {
        items.push({
          type: 'image',
          url: getResponsiveImageUrl(key, SCREEN_WIDTH, 'gallery'),
          id: key,
        });
      });
    }

    // Add video at the end if exists
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
                renderItem={({ item }) => (
                  item.type === 'video' ? (
                    <VideoItem
                      url={item.url}
                      style={styles.galleryVideo}
                      badgeStyle={styles.videoBadge}
                      badgeTextStyle={styles.videoBadgeText}
                    />
                  ) : (
                    <TouchableOpacity
                      activeOpacity={0.95}
                      onPress={() => setShowImagePreview(true)}
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

          {/* Description - Collapsible */}
          {currentListing.description && (
            <View style={styles.collapsibleContainer}>
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
    galleryVideo: {
      width: SCREEN_WIDTH,
      height: IMAGE_HEIGHT,
      backgroundColor: '#000000',
    },
    videoBadge: {
      position: 'absolute',
      top: theme.spacing.md,
      right: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      backgroundColor: 'rgba(0,0,0,0.7)',
      paddingHorizontal: theme.spacing.sm,
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
      textAlign: theme.isRTL ? 'right' : 'left',
    },
    title: {
      marginTop: theme.spacing.sm,
      textAlign: theme.isRTL ? 'right' : 'left',
    },
    metaRow: {
      flexDirection: theme.isRTL ? 'row-reverse' : 'row',
      flexWrap: 'wrap',
      marginTop: theme.spacing.md,
      gap: theme.spacing.md,
    },
    metaItem: {
      flexDirection: theme.isRTL ? 'row' : 'row-reverse',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    metaText: {},
    statsRow: {
      flexDirection: theme.isRTL ? 'row-reverse' : 'row',
      marginTop: theme.spacing.md,
      paddingTop: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      gap: theme.spacing.lg,
    },
    statItem: {
      flexDirection: theme.isRTL ? 'row' : 'row-reverse',
      alignItems: 'center',
      gap: theme.spacing.xs,
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
      textAlign: theme.isRTL ? 'right' : 'left',
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
      textAlign: theme.isRTL ? 'right' : 'left',
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
      flexDirection: theme.isRTL ? 'row-reverse' : 'row',
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
