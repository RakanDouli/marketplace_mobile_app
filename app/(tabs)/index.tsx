/**
 * Home Tab - Main landing page
 * Re-exports the existing HomeScreen component with updated navigation
 */

import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SvgXml } from 'react-native-svg';
import {
  Search,
  LayoutGrid,
  ChevronLeft,
  Shield,
  Tag,
  Zap,
} from 'lucide-react-native';
import { useTheme } from '../../src/theme';
import { LogoIcon } from '../../src/components/icons';
import { Text } from '../../src/components/slices/Text';
import { ListingCard } from '../../src/components/listing';
import { Loading } from '../../src/components/slices/Loading';
import { SearchBar } from '../../src/components/search';
import { useCategoriesStore, useListingsStore, useWishlistStore, useUserAuthStore } from '../../src/stores';
import {
  Container,
  FeatureCard,
  PromoCard,
  PromoBanner,
} from '../../src/components/slices';
import { formatLocation } from '../../src/utils';

// CMS Assets
const CMS_BASE_URL = 'https://staging.shambay.com';
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

const COMING_SOON_CATEGORIES = ['real-estate'];

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
  const { categories, isLoading: categoriesLoading } = useCategoriesStore();
  const { listings, featuredListings, isLoading: listingsLoading } = useListingsStore();
  const { loadMyWishlist, isInitialized: wishlistInitialized } = useWishlistStore();
  const { isAuthenticated, isLoading: authLoading } = useUserAuthStore();

  // Lower breakpoints to better support Android tablets (dp values vary)
  const isTablet = screenWidth >= 600;
  const isDesktop = screenWidth >= 900;

  // Get visible categories count for responsive grid
  const visibleCategories = useMemo(() =>
    categories.filter(cat => cat.isActive && !COMING_SOON_CATEGORIES.includes(cat.slug)),
    [categories]
  );
  const visibleCategoryCount = visibleCategories.length;

  const styles = createStyles(theme, screenWidth, isTablet, isDesktop, visibleCategoryCount);

  // Load wishlist only when authenticated and auth is fully loaded
  useEffect(() => {
    if (!authLoading && isAuthenticated && !wishlistInitialized) {
      loadMyWishlist();
    }
  }, [authLoading, isAuthenticated, wishlistInitialized, loadMyWishlist]);


  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const activeCategories = useMemo(() => categories.filter(cat => cat.isActive), [categories]);

  // Navigation with expo-router
  const goToCategory = (categorySlug: string, categoryName: string) => {
    router.push(`/search/${categorySlug}`);
  };
  const goToListing = (listingId: string) => {
    router.push({ pathname: '/listing/[id]', params: { id: listingId } });
  };
  const goToCreateListing = () => router.push('/(tabs)/create');

  const handleSearch = () => {
    if (!selectedCategory) {
      // SearchBar component will handle showing dropdown
      return;
    }
    goToCategory(selectedCategory, '');
  };

  const handleCategorySelect = (slug: string) => {
    setSelectedCategory(slug);
  };

  // Helpers - Format price with English numbers for consistency
  const formatPriceDisplay = (priceMinor: number) => `${(priceMinor / 100).toLocaleString('en-US')} ل.س`;

  const formatSpecs = (specsDisplay: Record<string, any> | string | undefined): string => {
    if (!specsDisplay) return '';
    let specs: Record<string, any> = {};
    try {
      if (typeof specsDisplay === 'string') specs = JSON.parse(specsDisplay);
      else if (typeof specsDisplay === 'object') specs = specsDisplay;
    } catch { return ''; }
    const parts: string[] = [];
    Object.entries(specs)
      .filter(([key]) => key !== 'accountType' && key !== 'account_type')
      .forEach(([, value]) => {
        if (!value) return;
        const displayValue = typeof value === 'object' ? value.value : value;
        if (displayValue && displayValue !== '') parts.push(String(displayValue));
      });
    return parts.join(' | ');
  };

  const renderCategoryIcon = (iconSvg: string | undefined, size: number, color: string) => {
    if (!iconSvg) return <LayoutGrid size={size} color={color} />;
    const styledSvg = iconSvg
      .replace(/<svg/, `<svg width="${size}" height="${size}"`)
      .replace(/stroke="[^"]*"/g, `stroke="${color}"`)
      .replace(/fill="[^"]*"/g, 'fill="none"');
    try { return <SvgXml xml={styledSvg} width={size} height={size} />; }
    catch { return <LayoutGrid size={size} color={color} />; }
  };

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

        {/* Hero Section - Using expo-image for AVIF support on Android */}
        <View style={styles.heroSection}>
          <ExpoImage
            source={{ uri: CMS_ASSETS.home.searchBar.background }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <Text variant="h2" center style={{ color: theme.colors.textInverse }}>مرحباً بكم في شام باي</Text>
            <Text variant="paragraph" center style={{ color: theme.colors.textInverse, opacity: 0.85, marginTop: theme.spacing.sm }}>منصتك الأولى للبيع والشراء في سوريا</Text>
          </View>
        </View>

        {/* Category Cards */}
        <View style={styles.categoriesContainer}>
          {categoriesLoading ? (
            <View style={styles.loadingContainer}><Loading type="dots" size="sm" /></View>
          ) : (
            <View style={styles.categoriesGrid}>
              {visibleCategories.map((category) => (
                <TouchableOpacity key={category.id} style={styles.categoryCard} onPress={() => goToCategory(category.slug, category.nameAr)} activeOpacity={0.8}>
                  <View style={styles.categoryCardIcon}>{renderCategoryIcon(category.icon, 24, theme.colors.primary)}</View>
                  <Text variant="h4" style={{ color: theme.colors.text }}>{category.nameAr}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

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

        {/* Featured Listings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TouchableOpacity style={styles.seeAllButton} onPress={() => goToCategory('cars', 'سيارات')}>
              <ChevronLeft size={16} color={theme.colors.primary} />
              <Text variant="paragraph" style={{ color: theme.colors.primary }}>عرض الكل</Text>
            </TouchableOpacity>
            <Text variant="h3">عروض لك</Text>
          </View>
          {listingsLoading && featuredListings.length === 0 ? (
            <View style={styles.loadingContainer}><Loading type="dots" size="sm" /></View>
          ) : (
            <FlatList
              horizontal
              inverted
              showsHorizontalScrollIndicator={false}
              data={featuredListings}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listingsScroll}
              renderItem={({ item: listing }) => (
                <ListingCard
                  id={listing.id}
                  title={listing.title}
                  price={formatPriceDisplay(listing.priceMinor)}
                  location={formatLocation(listing.location)}
                  specs={formatSpecs(listing.specsDisplay)}
                  images={listing.imageKeys}
                  userId={listing.user?.id}
                  onPress={() => goToListing(listing.id)}
                  viewMode="grid"
                  style={{ width: isTablet ? 220 : 180, marginRight: theme.spacing.md }}
                />
              )}
            />
          )}
        </View>

        {/* New Listings Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TouchableOpacity style={styles.seeAllButton} onPress={() => goToCategory('cars', 'سيارات')}>
              <Text variant="paragraph" style={{ color: theme.colors.primary }}>عرض الكل</Text>
              <ChevronLeft size={16} color={theme.colors.primary} />
            </TouchableOpacity>
            <Text variant="h3">إعلانات جديدة</Text>
          </View>
          {listingsLoading && listings.length === 0 ? (
            <View style={styles.loadingContainer}><Loading type="dots" size="sm" /></View>
          ) : (
            <View style={styles.listingsGrid}>
              {listings.slice(0, isTablet ? 9 : 6).map((listing) => (
                <ListingCard
                  key={listing.id}
                  id={listing.id}
                  title={listing.title}
                  price={formatPriceDisplay(listing.priceMinor)}
                  location={formatLocation(listing.location)}
                  specs={formatSpecs(listing.specsDisplay)}
                  images={listing.imageKeys}
                  userId={listing.user?.id}
                  onPress={() => goToListing(listing.id)}
                  viewMode="grid"
                  style={styles.gridCard}
                />
              ))}
            </View>
          )}
        </View>

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
        <Container paddingY="lg" background="transparent">
          <Text variant="h3" center style={{ marginBottom: theme.spacing.lg }}>لماذا تختارنا؟</Text>
          <View style={styles.featuresGrid}>
            {FEATURES.map((feature) => {
              const IconComponent = feature.icon;
              return (
                <FeatureCard
                  key={feature.id}
                  icon={<IconComponent size={24} color={theme.colors.primary} />}
                  title={feature.title}
                  description={feature.description}
                  variant="card"
                  style={styles.featureCard}
                />
              );
            })}
          </View>
        </Container>

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
          {/* Part 3: Divider + Copyright */}
          <View style={styles.footerCopyright}>
            <View style={styles.footerDivider} />
            <Text variant="xs" center color="muted">© Shambay 2026 جميع الحقوق محفوظة</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>, screenWidth: number, isTablet: boolean, isDesktop: boolean, categoryCount: number) => {
  const horizontalPadding = isDesktop ? theme.spacing.md * 3 : isTablet ? theme.spacing.md * 2 : theme.spacing.md;
  const gridColumns = isDesktop ? 4 : isTablet ? 3 : 2;
  const gridGap = theme.spacing.sm;
  const gridCardWidth = (screenWidth - horizontalPadding * 2 - gridGap * (gridColumns - 1)) / gridColumns;
  const featureColumns = isDesktop ? 4 : 2;
  const featureCardWidth = (screenWidth - horizontalPadding * 2 - theme.spacing.md * (featureColumns - 1)) / featureColumns;

  // Responsive category columns based on screen size AND category count
  // Max columns: desktop=4, tablet=3, mobile=2
  // Actual columns = min(categoryCount, maxColumns)
  const maxCategoryColumns = isDesktop ? 4 : isTablet ? 3 : 2;
  const categoryColumns = Math.min(categoryCount || 1, maxCategoryColumns);
  const categoryGap = theme.spacing.md;
  const categoryCardWidth = categoryColumns === 1
    ? screenWidth - horizontalPadding * 2  // Full width for single category
    : (screenWidth - horizontalPadding * 2 - categoryGap * (categoryColumns - 1)) / categoryColumns;

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.surface },
    heroSection: { paddingVertical: isTablet ? theme.spacing.xxl : theme.spacing.xl, paddingHorizontal: horizontalPadding, alignItems: 'center', justifyContent: 'center', minHeight: isTablet ? 280 : 220, overflow: 'hidden', position: 'relative' },
    heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.colors.overlay },
    heroContent: { alignItems: 'center', zIndex: 1 },
    loadingContainer: { paddingVertical: theme.spacing.xl, alignItems: 'center', justifyContent: 'center' },
    categoriesContainer: { marginTop: -40, paddingHorizontal: horizontalPadding, paddingBottom: theme.spacing.md, zIndex: 10 },
    categoriesGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: categoryGap },
    categoryCard: { width: categoryCardWidth, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: theme.spacing.md, backgroundColor: theme.colors.bg, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, minHeight: 100, gap: theme.spacing.sm, ...theme.shadows.sm },
    categoryCardIcon: { width: 48, height: 48, borderRadius: theme.radius.lg, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center' },
    section: { paddingVertical: theme.spacing.md },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: horizontalPadding, marginBottom: theme.spacing.md },
    seeAllButton: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
    listingsScroll: { paddingHorizontal: horizontalPadding },
    listingsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: horizontalPadding, gap: gridGap },
    gridCard: { width: gridCardWidth, backgroundColor: theme.colors.bg, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden', marginBottom: theme.spacing.sm },
    promoCardsGrid: { gap: theme.spacing.md },
    featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md, justifyContent: 'center' },
    featureCard: { width: featureCardWidth, minWidth: 150 },
    footer: { backgroundColor: theme.colors.surface, paddingHorizontal: horizontalPadding, paddingVertical: theme.spacing.xl, paddingBottom: theme.spacing.xl + 88, marginTop: theme.spacing.md, borderTopWidth: 1, borderTopColor: theme.colors.border, alignItems: 'center', gap: theme.spacing.lg },
    footerBrand: { alignItems: 'center', gap: theme.spacing.sm },
    footerLogoIcon: { padding: theme.spacing.sm, borderRadius: theme.radius.md, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
    footerCopyright: { alignItems: 'center', gap: theme.spacing.md },
    footerDivider: { width: 60, height: 1, backgroundColor: theme.colors.border },
  });
};
