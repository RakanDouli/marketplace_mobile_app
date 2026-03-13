/**
 * Home Tab - Main landing page
 * Re-exports the existing HomeScreen component with updated navigation
 */

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Search,
  Shield,
  Tag,
  Zap,
} from 'lucide-react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTheme } from '../../src/theme';
import { LogoIcon } from '../../src/components/icons';
import { Text } from '../../src/components/slices/Text';
import { FeaturedListings } from '../../src/components/listing';
import { SearchBar } from '../../src/components/search';
import { CategorySelector } from '../../src/components/CategorySelector';
import { useCategoriesStore, useListingsStore, useWishlistStore, useUserAuthStore, useFiltersStore } from '../../src/stores';
import {
  Container,
  FeatureCard,
  PromoCard,
  PromoBanner,
  Image,
  Grid,
} from '../../src/components/slices';
import { ENV } from '../../src/constants/env';

// CMS Assets - Use environment-based URL
const CMS_BASE_URL = ENV.WEB_URL;
const CMS_ASSETS = {
  home: {
    promoBanner: { car: `${CMS_BASE_URL}/images/cms/car.avif` },
    promoCards: {
      realEstate: `${CMS_BASE_URL}/images/cms/building.avif`,
      electronics: `${CMS_BASE_URL}/images/cms/phone.avif`,
    },
    searchBar: { background: `${CMS_BASE_URL}/images/cms/cars1.avif` },
  },
};

const COMING_SOON_CATEGORIES: string[] = [];

const PROMO_CATEGORIES = [
  {
    slug: 'real-estate',
    title: 'هل لديك عقار للبيع؟',
    subtitle: 'أضف إعلانك الآن واوصل لآلاف المشترين',
    buttonText: 'قريباً',
    imageSrc: CMS_ASSETS.home.promoCards.realEstate,
    badge: 'جديد',
  },
  {
    slug: 'electronics',
    title: 'هل لديك جهاز للبيع؟',
    subtitle: 'أضف إعلانك الآن واوصل لآلاف المشترين',
    buttonText: 'أضف إعلانك',
    imageSrc: CMS_ASSETS.home.promoCards.electronics,
  },
];

const SOCIAL_LINKS = [
  { url: 'https://www.instagram.com/theshambay/', icon: 'instagram' as const, label: 'Instagram' },
  { url: 'https://www.facebook.com/profile.php?id=61584913273672', icon: 'facebook' as const, label: 'Facebook' },
];

const FEATURES = [
  { id: '1', icon: Search, title: 'بحث سهل', description: 'ابحث بسهولة عن ما تريد باستخدام فلاتر متقدمة' },
  { id: '2', icon: Shield, title: 'آمن وموثوق', description: 'جميع البائعين موثقين وجميع المعاملات محمية' },
  { id: '3', icon: Tag, title: 'أفضل الأسعار', description: 'قارن الأسعار واحصل على أفضل صفقة ممكنة' },
  { id: '4', icon: Zap, title: 'سريع وفعال', description: 'انشر إعلانك في دقائق وابدأ البيع فوراً' },
];

export default function HomeTab() {
  const theme = useTheme();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();

  // Stores
  const { categories, isLoading: categoriesLoading, fetchCategories } = useCategoriesStore();
  const { featuredListings, isLoading: listingsLoading, fetchFeaturedListings } = useListingsStore();
  const { loadMyWishlist, isInitialized: wishlistInitialized } = useWishlistStore();
  const { isAuthenticated, isLoading: authLoading } = useUserAuthStore();
  const { resetFilters } = useFiltersStore();

  // Lower breakpoints to better support Android tablets (dp values vary)
  const isTablet = screenWidth >= 600;
  const isDesktop = screenWidth >= 900;

  const styles = createStyles(theme, screenWidth, isTablet, isDesktop);

  // Load wishlist only when authenticated and auth is fully loaded
  useEffect(() => {
    if (!authLoading && isAuthenticated && !wishlistInitialized) {
      loadMyWishlist();
    }
  }, [authLoading, isAuthenticated, wishlistInitialized, loadMyWishlist]);

  // Ensure categories are loaded
  useEffect(() => {
    if (categories.length === 0 && !categoriesLoading) {
      fetchCategories();
    }
  }, [categories.length, categoriesLoading, fetchCategories]);

  // Fetch featured listings for cars category (matching web frontend behavior)
  useEffect(() => {
    fetchFeaturedListings('cars', 10);
  }, [fetchFeaturedListings]);


  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const activeCategories = useMemo(() => categories.filter(cat => cat.isActive), [categories]);

  // Navigation with expo-router - memoized to prevent re-renders
  const goToCategory = useCallback((categorySlug: string, categoryName: string) => {
    resetFilters(); // Clear filters when navigating to a new category
    router.push(`/search/${categorySlug}`);
  }, [router, resetFilters]);

  const goToListing = useCallback((listingId: string) => {
    router.push({ pathname: '/listing/[id]', params: { id: listingId } });
  }, [router]);

  const goToCreateListing = useCallback(() => {
    router.push('/(tabs)/create');
  }, [router]);

  const handleSearch = useCallback(() => {
    if (!selectedCategory) {
      // SearchBar component will handle showing dropdown
      return;
    }
    goToCategory(selectedCategory, '');
  }, [selectedCategory, goToCategory]);

  const handleCategorySelect = useCallback((slug: string) => {
    setSelectedCategory(slug);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <SearchBar
          value={searchTerm}
          onChangeText={setSearchTerm}
          onSubmitEditing={handleSearch}
          categories={activeCategories}
          selectedCategory={selectedCategory}
          onCategorySelect={handleCategorySelect}
        />

        {/* Hero Section - Using Image component with AVIF support */}
        <View style={styles.heroSection}>
          <Image
            src={CMS_ASSETS.home.searchBar.background}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <Text variant="h2" center style={{ color: theme.colors.textInverse }}>مرحباً بكم في شام باي</Text>
            <Text variant="paragraph" center style={{ color: theme.colors.textInverse, opacity: 0.85, marginTop: theme.spacing.sm }}>منصتك الأولى للبيع والشراء في سوريا</Text>
          </View>
        </View>

        <Container paddingY="none" style={styles.categoriesContainer}>
          <CategorySelector
            categories={categories}
            isLoading={categoriesLoading}
            onCategoryPress={goToCategory}
            columns={isDesktop ? 4 : isTablet ? 3 : 2}
            mobileColumns={2}
            excludeSlugs={COMING_SOON_CATEGORIES}
            parentCollectionId={null}
          />
        </Container>

        {/* CTA Banner - Use PromoBanner component for consistency */}
        <PromoBanner
          title="هل لديك سيارة للبيع؟"
          subtitle="أضف إعلانك الآن وتواصل مع آلاف المشترين"
          buttonText="أضف إعلانك"
          onButtonPress={goToCreateListing}
          imageSrc={CMS_ASSETS.home.promoBanner.car}
          imagePosition="left"
          variant="secondary"
          paddingY="sm"
        />

        {/* Listings Slider */}
        <FeaturedListings
          listings={featuredListings}
          title="سيارات جديدة"
          viewAllText="عرض الكل"
          onViewAll={() => goToCategory('cars', 'سيارات')}
          onListingPress={goToListing}
          variant="slider"
          isLoading={listingsLoading && featuredListings.length === 0}
          paddingY="md"
        />

        {/* Listings Grid */}
        <FeaturedListings
          listings={featuredListings}
          title="سيارات جديدة"
          viewAllText="عرض الكل"
          onViewAll={() => goToCategory('cars', 'سيارات')}
          onListingPress={goToListing}
          variant="grid"
          columns={isTablet ? 3 : 2}
          limit={isTablet ? 9 : 6}
          isLoading={listingsLoading && featuredListings.length === 0}
          paddingY="md"
        />

        {/* Promo Cards */}
        <Container paddingY="md">
          <View style={styles.promoCardsGrid}>
            {PROMO_CATEGORIES.map((promo, index) => (
              <PromoCard
                key={promo.slug}
                title={promo.title}
                subtitle={promo.subtitle}
                buttonText={promo.buttonText}
                onButtonPress={() => { if (promo.slug === 'electronics') goToCreateListing(); }}
                imageSrc={promo.imageSrc}
                imagePosition={index % 2 === 0 ? 'right' : 'left'}
                badge={promo.badge}
              />
            ))}
          </View>
        </Container>

        {/* Features */}
        <Grid
          title="لماذا تختارنا؟"
          titleAlign="center"
          columns={4}
          mobileColumns={2}
          gap="md"
          paddingY="lg"
          background="transparent"
        >
          {FEATURES.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <FeatureCard
                key={feature.id}
                icon={<IconComponent size={24} color={theme.colors.primary} />}
                title={feature.title}
                description={feature.description}
                variant="card"
              />
            );
          })}
        </Grid>

        {/* Footer */}
        <View style={styles.footer}>
          {/* Part 1: Logo + Name */}
          <View style={styles.footerBrand}>
            <View style={styles.footerLogoIcon}>
              <LogoIcon width={28} height={28} color="#FFFFFF" />
            </View>
            <Text variant="h3" center>شام باي</Text>
          </View>
          {/* Part 2: Tagline */}
          <Text variant="small" center color="secondary">منذ اليوم - منصتك الأولى لبيع وشراء في سوريا</Text>
          {/* Part 3: Social Media */}
          <View style={styles.footerSocial}>
            {SOCIAL_LINKS.map((social) => (
              <TouchableOpacity
                key={social.label}
                style={styles.socialButton}
                onPress={() => Linking.openURL(social.url)}
                accessibilityLabel={social.label}
              >
                <FontAwesome name={social.icon} size={22} color={theme.colors.textInverse} />
              </TouchableOpacity>
            ))}
          </View>
          {/* Part 4: Divider + Copyright */}
          <View style={styles.footerCopyright}>
            <View style={styles.footerDivider} />
            <Text variant="xs" center color="muted">© Shambay 2026 جميع الحقوق محفوظة</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>, screenWidth: number, isTablet: boolean, isDesktop: boolean) => {
  const horizontalPadding = isDesktop ? theme.spacing.md * 3 : isTablet ? theme.spacing.md * 2 : theme.spacing.md;
  const gridColumns = isDesktop ? 4 : isTablet ? 3 : 2;
  const gridGap = theme.spacing.sm;
  const gridCardWidth = (screenWidth - horizontalPadding * 2 - gridGap * (gridColumns - 1)) / gridColumns;

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.surface },
    heroSection: { paddingVertical: isTablet ? theme.spacing.xxl : theme.spacing.xl, paddingHorizontal: horizontalPadding, alignItems: 'center', justifyContent: 'center', minHeight: isTablet ? 280 : 220, overflow: 'hidden', position: 'relative' },
    heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.colors.overlay },
    heroContent: { alignItems: 'center', zIndex: 1 },
    categoriesContainer: { marginTop: -40, paddingHorizontal: horizontalPadding, paddingBottom: theme.spacing.md, zIndex: 10 },
    section: { paddingVertical: theme.spacing.md },
    sectionHeader: { justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: horizontalPadding, marginBottom: theme.spacing.md },
    listingsScroll: { paddingHorizontal: horizontalPadding },
    listingsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: horizontalPadding, gap: gridGap },
    gridCard: { width: gridCardWidth, backgroundColor: theme.colors.bg, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden', marginBottom: theme.spacing.sm },
    promoCardsGrid: { gap: theme.spacing.md },
    footer: { backgroundColor: theme.colors.surface, paddingHorizontal: horizontalPadding, paddingVertical: theme.spacing.xl, paddingBottom: theme.spacing.xl + 88, marginTop: theme.spacing.md, borderTopWidth: 1, borderTopColor: theme.colors.border, alignItems: 'center', gap: theme.spacing.lg },
    footerBrand: { alignItems: 'center', gap: theme.spacing.sm },
    footerLogoIcon: { padding: theme.spacing.sm, borderRadius: theme.radius.md, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
    footerSocial: { flexDirection: 'row', gap: theme.spacing.md, alignItems: 'center' },
    socialButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
    footerCopyright: { alignItems: 'center', gap: theme.spacing.md },
    footerDivider: { width: 60, height: 1, backgroundColor: theme.colors.border },
  });
};
