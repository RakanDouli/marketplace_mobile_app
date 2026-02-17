/**
 * Advertise Screen
 * Ad packages and advertising options - fetches from backend
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, Linking } from 'react-native';
import { Megaphone, BarChart, Users, Eye, Mail, Monitor, Smartphone, Clock, MapPin } from 'lucide-react-native';
import { useTheme } from '../../../src/theme';
import { Text, Button, Loading } from '../../../src/components/ui';
import { Collapsible } from '../../../src/components/slices';
import { useAdPackagesStore, type AdPackage } from '../../../src/stores/adPackagesStore';

// Placement labels in Arabic
const PLACEMENT_LABELS: Record<string, string> = {
  homepage_top: 'أعلى الصفحة الرئيسية',
  homepage_mid: 'وسط الصفحة الرئيسية',
  detail_top: 'أعلى صفحة التفاصيل',
  detail_before_description: 'قبل وصف الإعلان',
  between_listings: 'بين نتائج البحث',
};

// Why advertise features
const whyAdvertiseFeatures = [
  {
    icon: Users,
    title: '100k+ زائر شهرياً',
    description: 'وصول واسع لجمهورك المستهدف',
  },
  {
    icon: MapPin,
    title: 'مشترون مستهدفون',
    description: 'جمهور مهتم بالمنتجات فعلياً',
  },
  {
    icon: BarChart,
    title: 'تقارير شفافة',
    description: 'تتبع أداء حملتك بالتفصيل',
  },
  {
    icon: Eye,
    title: 'أسعار تنافسية',
    description: 'أفضل قيمة مقابل المال',
  },
];

// FAQ items
const faqItems = [
  { question: 'كيف يتم الدفع؟', answer: 'يتم الدفع بعد التواصل مع فريق الإعلانات وتحديد تفاصيل الحملة. نقبل الدفع عبر التحويل البنكي أو PayPal.' },
  { question: 'ما هي مواصفات الإعلانات؟', answer: 'نتبع معايير IAB العالمية. كل حزمة لها مواصفات محددة (الأبعاد، الحجم، النوع). سيتم إرسال التفاصيل الكاملة بعد التواصل.' },
  { question: 'هل أحصل على تقارير أداء؟', answer: 'نعم، ستحصل على رابط خاص لتتبع أداء حملتك (الظهور، النقرات، معدل التحويل) بشكل يومي.' },
  { question: 'هل يمكنني تخصيص الحزمة؟', answer: 'نعم، نوفر حزم مخصصة للشركات الكبرى. تواصل معنا لمناقشة احتياجاتك الخاصة.' },
];

// Package Card Component
function PackageCard({ pkg, index, theme, styles, onContact }: {
  pkg: AdPackage;
  index: number;
  theme: ReturnType<typeof useTheme>;
  styles: ReturnType<typeof createStyles>;
  onContact: () => void;
}) {
  // First package gets "Most Popular" badge
  const badge = index === 0 ? 'الأكثر شعبية' : index === 1 ? 'أفضل تحويل' : null;
  const placementLabel = PLACEMENT_LABELS[pkg.placement] || pkg.placement;

  return (
    <View style={[styles.packageCard, badge && styles.packageCardWithBadge]}>
      {badge && (
        <View style={styles.badge}>
          <Text variant="xs" style={styles.badgeText}>{badge}</Text>
        </View>
      )}

      {/* Package Name */}
      <Text variant="h4" style={styles.packageTitle}>{pkg.packageName}</Text>
      <Text variant="small" color="secondary">{placementLabel}</Text>

      {/* Price Row */}
      <View style={styles.priceRow}>
        <Text variant="h3" style={styles.price}>
          ${pkg.basePrice}
        </Text>
        <Text variant="small" color="muted" style={styles.priceDuration}>
          / {pkg.durationDays} يوم
        </Text>
      </View>

      {/* Specs List */}
      <View style={styles.specsList}>
        <View style={styles.specItem}>
          <Text variant="small" color="secondary" style={styles.specText}>
            سطح المكتب: {pkg.dimensions.desktop.width} × {pkg.dimensions.desktop.height}
          </Text>
          <Monitor size={16} color={theme.colors.textMuted} />
        </View>
        <View style={styles.specItem}>
          <Text variant="small" color="secondary" style={styles.specText}>
            الموبايل: {pkg.dimensions.mobile.width} × {pkg.dimensions.mobile.height}
          </Text>
          <Smartphone size={16} color={theme.colors.textMuted} />
        </View>
        <View style={styles.specItem}>
          <Text variant="small" color="secondary" style={styles.specText}>
            عدد الظهور: {pkg.impressionLimit.toLocaleString()}
          </Text>
          <Eye size={16} color={theme.colors.textMuted} />
        </View>
        <View style={styles.specItem}>
          <Text variant="small" color="secondary" style={styles.specText}>
            المدة: {pkg.durationDays} يوم
          </Text>
          <Clock size={16} color={theme.colors.textMuted} />
        </View>
      </View>

      {/* Contact Button */}
      <Button
        variant="primary"
        icon={<Mail size={18} color="#FFFFFF" />}
        onPress={onContact}
        fullWidth
      >
        تواصل معنا
      </Button>
    </View>
  );
}

export default function AdvertiseScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { packages, isLoading, fetchActivePackages } = useAdPackagesStore();

  useEffect(() => {
    fetchActivePackages();
  }, []);

  const handleContact = () => {
    Linking.openURL('mailto:ads@shambay.com?subject=استفسار عن الإعلانات');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.heroIcon}>
          <Megaphone size={40} color={theme.colors.primary} />
        </View>
        <Text variant="h3" center>أعلن معنا - وصول إلى آلاف المستخدمين</Text>
        <Text variant="paragraph" color="secondary" center style={styles.heroSubtitle}>
          إعلانات احترافية بمعايير IAB العالمية مع تقارير شفافة وأسعار تنافسية
        </Text>
      </View>

      {/* Why Advertise */}
      <View style={styles.section}>
        <Text variant="h4" style={styles.sectionTitle}>لماذا تعلن معنا؟</Text>
        <View style={styles.featuresGrid}>
          {whyAdvertiseFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <View key={index} style={styles.featureCard}>
                <View style={styles.featureIconContainer}>
                  <Icon size={24} color={theme.colors.primary} />
                </View>
                <Text variant="body" style={styles.featureTitle}>{feature.title}</Text>
                <Text variant="small" color="secondary" center>{feature.description}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Ad Packages */}
      <View style={styles.section}>
        <Text variant="h4" style={styles.sectionTitle}>حزم الإعلانات المتاحة</Text>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Loading type="svg" size="lg" />
            <Text variant="small" color="muted" style={{ marginTop: 12 }}>
              جاري تحميل الحزم...
            </Text>
          </View>
        ) : packages.length > 0 ? (
          packages.map((pkg, index) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              index={index}
              theme={theme}
              styles={styles}
              onContact={handleContact}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text variant="paragraph" color="muted" center>
              لا توجد حزم متاحة حالياً. تواصل معنا للمزيد من المعلومات.
            </Text>
            <Button
              variant="primary"
              icon={<Mail size={18} color="#FFFFFF" />}
              onPress={handleContact}
              style={{ marginTop: 16 }}
            >
              تواصل معنا
            </Button>
          </View>
        )}
      </View>

      {/* FAQ Section */}
      <View style={styles.section}>
        <Text variant="h4" style={styles.sectionTitle}>الأسئلة الشائعة</Text>
        <View style={styles.faqContainer}>
          {faqItems.map((item, index) => (
            <Collapsible key={index} title={item.question} variant="accent">
              <Text variant="paragraph" color="secondary" style={{ lineHeight: 24 }}>
                {item.answer}
              </Text>
            </Collapsible>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    content: {
      paddingBottom: 40,
    },
    heroSection: {
      backgroundColor: theme.colors.bg,
      paddingHorizontal: 20,
      paddingVertical: 24,
      marginBottom: 16,
      alignItems: 'center',
    },
    heroIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    heroSubtitle: {
      marginTop: 8,
    },
    section: {
      marginBottom: 16,
    },
    sectionTitle: {
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    loadingContainer: {
      padding: 40,
      alignItems: 'center',
    },
    emptyState: {
      padding: 24,
      alignItems: 'center',
    },
    featuresGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 12,
      gap: 8,
    },
    featureCard: {
      width: '48%',
      backgroundColor: theme.colors.bg,
      borderRadius: theme.radius.md,
      padding: 16,
      alignItems: 'center',
    },
    featureIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    featureTitle: {
      marginBottom: 4,
      textAlign: 'center',
    },
    packageCard: {
      backgroundColor: theme.colors.bg,
      marginHorizontal: 16,
      marginBottom: 16,
      borderRadius: theme.radius.md,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    packageCardWithBadge: {
      paddingTop: 24, // Extra padding for badge
    },
    badge: {
      position: 'absolute',
      top: -10,
      right: 16,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: theme.radius.sm,
      zIndex: 1,
    },
    badgeText: {
      color: '#FFFFFF',
      fontFamily: theme.fontFamily.bodyMedium,
    },
    packageTitle: {
      marginBottom: 4,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'flex-end',
      marginVertical: 12,
      gap: 4,
    },
    price: {
      color: theme.colors.primary,
    },
    priceDuration: {
      marginRight: 4,
    },
    specsList: {
      marginBottom: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: 12,
    },
    specItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingVertical: 6,
      gap: 8,
    },
    specText: {
      textAlign: 'right',
    },
    faqContainer: {
      backgroundColor: theme.colors.bg,
      marginHorizontal: 16,
      borderRadius: theme.radius.md,
      overflow: 'hidden',
    },
  });
