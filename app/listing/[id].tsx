/**
 * Listing Detail Screen
 * Shows full listing details with image gallery, specs, and seller info
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Linking,
  Share,
  FlatList,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import {
  MapPin,
  Calendar,
  Eye,
  Heart,
  Phone,
  MessageCircle,
  Share2,
  ChevronLeft,
  ChevronRight,
  User,
  Building2,
} from 'lucide-react-native';
import { useTheme, Theme } from '../../src/theme';
import { Text, Button, Loading } from '../../src/components/ui';
import { useListingsStore } from '../../src/stores/listingsStore';
import { useCurrencyStore } from '../../src/stores/currencyStore';
import { formatPrice } from '../../src/utils/formatPrice';

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
  const flatListRef = useRef<FlatList>(null);

  // Store
  const { currentListing, isLoading, error, fetchListingById } = useListingsStore();
  const preferredCurrency = useCurrencyStore((state) => state.preferredCurrency);

  // Fetch listing on mount
  useEffect(() => {
    if (id) {
      fetchListingById(id);
    }
  }, [id]);

  // Image navigation
  const goToNextImage = () => {
    if (!currentListing?.imageKeys) return;
    const nextIndex = (activeImageIndex + 1) % currentListing.imageKeys.length;
    setActiveImageIndex(nextIndex);
    flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
  };

  const goToPrevImage = () => {
    if (!currentListing?.imageKeys) return;
    const prevIndex = activeImageIndex === 0 ? currentListing.imageKeys.length - 1 : activeImageIndex - 1;
    setActiveImageIndex(prevIndex);
    flatListRef.current?.scrollToIndex({ index: prevIndex, animated: true });
  };

  // Handle call seller
  const handleCallSeller = () => {
    const phone = currentListing?.user?.contactPhone || currentListing?.user?.phone;
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  // Handle WhatsApp
  const handleWhatsApp = () => {
    const phone = currentListing?.user?.contactPhone || currentListing?.user?.phone;
    if (phone) {
      // Remove any non-digit characters for WhatsApp
      const cleanPhone = phone.replace(/\D/g, '');
      Linking.openURL(`whatsapp://send?phone=${cleanPhone}&text=مرحباً، رأيت إعلانك: ${currentListing?.title}`);
    }
  };

  // Handle share
  const handleShare = async () => {
    if (!currentListing) return;
    try {
      // Build share URL
      const categorySlug = currentListing.category?.slug || 'cars';
      const listingType = currentListing.listingType === 'rent' ? 'rent' : 'sell';
      const shareUrl = `${ENV.WEB_URL}/${categorySlug}/${listingType}/${currentListing.id}`;

      // Ensure all values are strings (defensive coding to prevent [object Object])
      const title = typeof currentListing.title === 'string' ? currentListing.title : '';
      const description = typeof currentListing.description === 'string'
        ? currentListing.description.slice(0, 100)
        : '';
      const priceStr = formatPrice(currentListing.priceMinor, preferredCurrency);

      const message = [
        title,
        description,
        priceStr ? `السعر: ${priceStr}` : null,
        shareUrl,
      ].filter(Boolean).join('\n');

      await Share.share({
        message,
        title: title || 'شام باي',
        url: shareUrl, // iOS only
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Build specs list from specsDisplay
  const getSpecsList = () => {
    if (!currentListing?.specsDisplay) return [];

    return Object.entries(currentListing.specsDisplay)
      .filter(([, spec]: [string, any]) => spec?.label && spec?.value)
      .map(([key, spec]: [string, any]) => ({
        key,
        label: spec.label,
        value: spec.value,
      }));
  };

  // Loading state
  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.loadingContainer}>
            <Loading type="svg" size="lg" />
          </View>
        </SafeAreaView>
      </>
    );
  }

  // Error state
  if (error || !currentListing) {
    return (
      <>
        <Stack.Screen options={{ title: 'خطأ' }} />
        <SafeAreaView style={styles.container} edges={['bottom']}>
          <View style={styles.errorContainer}>
            <Text variant="h4" color="secondary">
              {error || 'لم يتم العثور على الإعلان'}
            </Text>
            <Button variant="primary" onPress={() => router.back()} style={{ marginTop: 16 }}>
              العودة
            </Button>
          </View>
        </SafeAreaView>
      </>
    );
  }

  const images = currentListing.imageKeys || [];
  const specsList = getSpecsList();
  const location = [currentListing.location?.city, currentListing.location?.province]
    .filter(Boolean)
    .join('، ');
  const hasPhone = currentListing.user?.showPhone && (currentListing.user?.phone || currentListing.user?.contactPhone);
  const isWhatsApp = currentListing.user?.phoneIsWhatsApp;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
                    <Image
                      source={{ uri: getCloudflareImageUrl(item, 'large') }}
                      style={styles.galleryImage}
                      resizeMode="cover"
                    />
                  )}
                  keyExtractor={(item, index) => `${item}-${index}`}
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

            {/* Back button */}
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ChevronRight size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Share button */}
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Share2 size={20} color="#FFFFFF" />
            </TouchableOpacity>
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
                  <MapPin size={16} color={theme.colors.textMuted} />
                  <Text variant="small" color="secondary" style={styles.metaText}>
                    {location}
                  </Text>
                </View>
              )}
              {currentListing.createdAt && (
                <View style={styles.metaItem}>
                  <Calendar size={16} color={theme.colors.textMuted} />
                  <Text variant="small" color="secondary" style={styles.metaText}>
                    {formatDate(currentListing.createdAt)}
                  </Text>
                </View>
              )}
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Eye size={16} color={theme.colors.textMuted} />
                <Text variant="small" color="muted">
                  {currentListing.viewCount || 0} مشاهدة
                </Text>
              </View>
              <View style={styles.statItem}>
                <Heart size={16} color={theme.colors.textMuted} />
                <Text variant="small" color="muted">
                  {currentListing.wishlistCount || 0} مفضلة
                </Text>
              </View>
            </View>

            {/* Specs */}
            {specsList.length > 0 && (
              <View style={styles.section}>
                <Text variant="h4" style={styles.sectionTitle}>
                  المواصفات
                </Text>
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
              </View>
            )}

            {/* Description */}
            {currentListing.description && (
              <View style={styles.section}>
                <Text variant="h4" style={styles.sectionTitle}>
                  الوصف
                </Text>
                <Text variant="paragraph" color="secondary" style={styles.description}>
                  {currentListing.description}
                </Text>
              </View>
            )}

            {/* Seller Info */}
            <View style={styles.section}>
              <Text variant="h4" style={styles.sectionTitle}>
                معلومات البائع
              </Text>
              <View style={styles.sellerCard}>
                <View style={styles.sellerAvatar}>
                  {currentListing.user?.accountType === 'business' ? (
                    <Building2 size={28} color={theme.colors.primary} />
                  ) : (
                    <User size={28} color={theme.colors.primary} />
                  )}
                </View>
                <View style={styles.sellerInfo}>
                  <Text variant="body" bold>
                    {currentListing.user?.companyName || currentListing.user?.name || 'البائع'}
                  </Text>
                  {currentListing.user?.accountType === 'business' && (
                    <Text variant="small" color="secondary">
                      حساب تجاري
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Actions */}
        {hasPhone && (
          <View style={styles.bottomActions}>
            <Button
              variant="primary"
              icon={<Phone size={18} color="#FFFFFF" />}
              onPress={handleCallSeller}
              style={styles.actionButton}
            >
              اتصال
            </Button>
            {isWhatsApp && (
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
        )}
      </SafeAreaView>
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
      right: theme.spacing.md,
      backgroundColor: 'rgba(0,0,0,0.6)',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.radius.md,
    },
    imageCounterText: {
      color: '#FFFFFF',
    },
    backButton: {
      position: 'absolute',
      top: theme.spacing.md,
      right: theme.spacing.md,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    shareButton: {
      position: 'absolute',
      top: theme.spacing.md,
      left: theme.spacing.md,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
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
      flexDirection: 'row',
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
      marginLeft: 4,
    },
    statsRow: {
      flexDirection: 'row',
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
      paddingTop: theme.spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
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
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      alignItems: 'flex-end',
    },

    // Description
    description: {
      textAlign: 'right',
      lineHeight: 24,
    },

    // Seller
    sellerCard: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      gap: theme.spacing.md,
    },
    sellerAvatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sellerInfo: {
      flex: 1,
      alignItems: 'flex-end',
    },

    // Bottom Actions
    bottomActions: {
      flexDirection: 'row-reverse',
      padding: theme.spacing.md,
      paddingBottom: theme.spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.bg,
      gap: theme.spacing.md,
    },
    actionButton: {
      flex: 1,
    },
  });
