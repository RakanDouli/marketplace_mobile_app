/**
 * User Subscriptions Screen (Pricing Page)
 * Shows all available subscription plans for purchase/upgrade
 * Matches web: /user-subscriptions
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import {
  Crown,
  Check,
  X,
  Package,
  Image,
  Video,
  BarChart,
  Star,
  TrendingUp,
  Zap,
  Shield,
  Users,
  Clock,
  ChevronLeft,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/theme';
import { Text, Button, Loading } from '../src/components/ui';
import { Collapsible } from '../src/components/slices';
import { useUserAuthStore } from '../src/stores/userAuthStore';
import { useSubscriptionPlansStore, type SubscriptionPlan } from '../src/stores/subscriptionPlansStore';
import { useCurrencyStore } from '../src/stores/currencyStore';
import { formatPrice } from '../src/utils/formatPrice';

// Static FAQ items
const faqItems = [
  { question: 'هل يمكنني تغيير الباقة لاحقاً؟', answer: 'نعم، يمكنك ترقية أو تخفيض باقتك في أي وقت. سيتم احتساب الفرق تناسبياً.' },
  { question: 'ماذا يحدث عند انتهاء الاشتراك؟', answer: 'ستنتقل تلقائياً إلى الباقة المجانية وستبقى إعلاناتك الحالية منشورة حسب حدود الباقة المجانية.' },
  { question: 'هل الدفع آمن؟', answer: 'نعم، نستخدم أحدث تقنيات التشفير لحماية بياناتك. جميع المعاملات تتم عبر بوابات دفع موثوقة.' },
  { question: 'هل يمكنني استرداد المبلغ؟', answer: 'نعم، نوفر ضمان استرداد المبلغ خلال 7 أيام من الاشتراك إذا لم تكن راضياً عن الخدمة.' },
  { question: 'ما الفرق بين الباقات؟', answer: 'كل باقة تختلف في عدد الإعلانات المسموحة، عدد الصور، إمكانية رفع فيديو، والأولوية في نتائج البحث. اختر الباقة التي تناسب حجم نشاطك.' },
];

// Why choose us features
const whyChooseUsFeatures = [
  { icon: Zap, title: 'نشر سريع', description: 'انشر إعلاناتك بضغطة زر' },
  { icon: Shield, title: 'حماية كاملة', description: 'تحقق من جميع الإعلانات' },
  { icon: Users, title: 'وصول أوسع', description: 'آلاف المشترين المحتملين' },
  { icon: Clock, title: 'دعم 24/7', description: 'فريق دعم متاح دائماً' },
];

// Plan Card Component
function PlanCard({ plan, isCurrentPlan, theme, styles, onSelect, preferredCurrency }: {
  plan: SubscriptionPlan;
  isCurrentPlan: boolean;
  theme: ReturnType<typeof useTheme>;
  styles: ReturnType<typeof createStyles>;
  onSelect: () => void;
  preferredCurrency: string;
}) {
  const isFree = plan.monthlyPrice === 0;
  const isPopular = plan.sortOrder === 2;

  const getBadge = () => {
    if (isCurrentPlan) return 'خطتك الحالية';
    if (isFree) return 'مجاني';
    if (isPopular) return 'الأكثر شعبية';
    return null;
  };

  const getBadgeStyle = () => {
    if (isCurrentPlan) return styles.badgePrimary;
    if (isFree) return styles.badgeSuccess;
    return styles.badgeWarning;
  };

  const getButtonText = () => {
    if (isCurrentPlan) return 'خطتك الحالية';
    if (isFree) return 'ابدأ مجاناً';
    return 'اختيار الخطة';
  };

  const features = [
    { icon: Package, label: 'عدد الإعلانات', value: plan.maxListings === 0 ? 'غير محدود' : `${plan.maxListings}`, included: true },
    { icon: Image, label: 'الصور لكل إعلان', value: `${plan.maxImagesPerListing}`, included: true },
    { icon: Video, label: 'رفع فيديو', included: plan.videoAllowed },
    { icon: TrendingUp, label: 'الأولوية في البحث', included: plan.priorityPlacement },
    { icon: BarChart, label: 'لوحة التحليلات', included: plan.analyticsAccess },
    { icon: Star, label: 'شعار الشركة', included: plan.customBranding },
  ];

  const badge = getBadge();

  return (
    <View style={[
      styles.planCard,
      isPopular && styles.planCardHighlighted,
      isCurrentPlan && styles.planCardCurrent,
    ]}>
      {/* Badge */}
      {badge && (
        <View style={[styles.badge, getBadgeStyle()]}>
          <Text variant="xs" style={styles.badgeText}>{badge}</Text>
        </View>
      )}

      {/* Plan Header */}
      <View style={styles.planHeader}>
        <Crown size={24} color={isCurrentPlan ? theme.colors.primary : theme.colors.textMuted} />
        <Text variant="h3" style={styles.planTitle}>{plan.title}</Text>
      </View>

      {/* Description */}
      {plan.description && (
        <Text variant="small" color="secondary" style={styles.planDescription}>
          {plan.description}
        </Text>
      )}

      {/* Price */}
      <View style={styles.priceRow}>
        <Text variant="h1" style={{ color: theme.colors.primary }}>
          {formatPrice(plan.monthlyPrice, preferredCurrency)}
        </Text>
        <Text variant="small" color="muted">
          {isFree ? 'مجاناً' : '/ شهرياً'}
        </Text>
      </View>

      {/* Features List */}
      <View style={styles.featuresList}>
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <View key={index} style={styles.featureItem}>
              <View style={styles.featureContent}>
                {feature.value && (
                  <Text variant="small" style={styles.featureValue}>{feature.value}</Text>
                )}
                <Text variant="small" color={feature.included ? 'primary' : 'muted'}>
                  {feature.label}
                </Text>
              </View>
              <View style={[
                styles.featureIcon,
                feature.included ? styles.featureIncluded : styles.featureNotIncluded,
              ]}>
                {feature.included ? (
                  <Check size={14} color={theme.colors.success} />
                ) : (
                  <X size={14} color={theme.colors.textMuted} />
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Action Button */}
      <Button
        variant={isCurrentPlan ? 'outline' : 'primary'}
        onPress={onSelect}
        disabled={isCurrentPlan}
        fullWidth
      >
        {getButtonText()}
      </Button>
    </View>
  );
}

export default function UserSubscriptionsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const styles = createStyles(theme);
  const { user, userPackage, isAuthenticated, openAuthModal } = useUserAuthStore();
  const { plans, isLoading, fetchPublicPlans } = useSubscriptionPlansStore();
  const preferredCurrency = useCurrencyStore((state) => state.preferredCurrency);

  useEffect(() => {
    fetchPublicPlans();
  }, []);

  // Filter and sort public plans
  const publicPlans = plans
    .filter((plan) => plan.isPublic)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Get current subscription name
  const currentSubscriptionName = userPackage?.userSubscription?.name;

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (plan.monthlyPrice === 0) {
      // Free plan - show alert and go back
      Alert.alert(
        'الخطة المجانية',
        'أنت مشترك بالفعل في الخطة المجانية',
        [{ text: 'حسناً', onPress: () => router.back() }]
      );
      return;
    }

    // For paid plans, navigate to contact for payment
    router.push('/menu/contact');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text variant="h3" style={styles.headerTitle}>باقات الاشتراك</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text variant="h2" center>اختر ما يناسبك</Text>
          <Text variant="paragraph" color="secondary" center style={styles.heroSubtitle}>
            خطط مرنة تناسب جميع احتياجاتك مع ميزات متقدمة للبائعين المحترفين
          </Text>
        </View>

        {/* Why Choose Us */}
        <View style={styles.section}>
          <Text variant="h4" style={styles.sectionTitle}>لماذا تختارنا؟</Text>
          <View style={styles.featuresGrid}>
            {whyChooseUsFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <View key={index} style={styles.featureCard}>
                  <View style={styles.featureCardIcon}>
                    <Icon size={24} color={theme.colors.primary} />
                  </View>
                  <Text variant="body" style={styles.featureCardTitle}>{feature.title}</Text>
                  <Text variant="xs" color="secondary" center>{feature.description}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Plans Section */}
        <View style={styles.section}>
          <Text variant="h4" style={styles.sectionTitle}>الخطط المتاحة</Text>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Loading type="svg" size="lg" />
              <Text variant="small" color="muted" style={{ marginTop: 12 }}>
                جاري تحميل الخطط...
              </Text>
            </View>
          ) : publicPlans.length > 0 ? (
            <View style={styles.plansContainer}>
              {publicPlans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isCurrentPlan={currentSubscriptionName === plan.name}
                  theme={theme}
                  styles={styles}
                  onSelect={() => handleSelectPlan(plan)}
                  preferredCurrency={preferredCurrency}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text variant="paragraph" color="muted" center>
                لا توجد خطط متاحة حالياً
              </Text>
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
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.bg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      textAlign: 'center',
    },
    scrollView: {
      flex: 1,
    },
    content: {
      paddingBottom: 40,
    },
    heroSection: {
      backgroundColor: theme.colors.bg,
      paddingHorizontal: 20,
      paddingVertical: 24,
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
      textAlign: 'right',
    },
    loadingContainer: {
      padding: 40,
      alignItems: 'center',
    },
    emptyState: {
      padding: 24,
      alignItems: 'center',
    },
    // Features Grid
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
    featureCardIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    featureCardTitle: {
      marginBottom: 4,
      textAlign: 'center',
    },
    // Plans
    plansContainer: {
      paddingHorizontal: 16,
      gap: 16,
    },
    planCard: {
      backgroundColor: theme.colors.bg,
      borderRadius: theme.radius.md,
      padding: 20,
      paddingTop: 28,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    planCardHighlighted: {
      borderColor: theme.colors.warning,
      borderWidth: 2,
    },
    planCardCurrent: {
      borderColor: theme.colors.primary,
      borderWidth: 2,
    },
    badge: {
      position: 'absolute',
      top: -10,
      right: 16,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: theme.radius.sm,
      zIndex: 1,
    },
    badgePrimary: {
      backgroundColor: theme.colors.primary,
    },
    badgeSuccess: {
      backgroundColor: theme.colors.success,
    },
    badgeWarning: {
      backgroundColor: theme.colors.warning,
    },
    badgeText: {
      color: '#FFFFFF',
      fontFamily: theme.fontFamily.bodyMedium,
    },
    planHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 8,
      marginBottom: 8,
    },
    planTitle: {
      textAlign: 'right',
    },
    planDescription: {
      marginBottom: 16,
      textAlign: 'right',
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'flex-end',
      gap: 4,
      marginBottom: 16,
    },
    featuresList: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: 12,
      marginBottom: 16,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingVertical: 8,
      gap: 8,
    },
    featureContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 8,
    },
    featureValue: {
      fontFamily: theme.fontFamily.bodyMedium,
      color: theme.colors.primary,
    },
    featureIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    featureIncluded: {
      backgroundColor: `${theme.colors.success}20`,
    },
    featureNotIncluded: {
      backgroundColor: theme.colors.surface,
    },
    // FAQ
    faqContainer: {
      backgroundColor: theme.colors.bg,
      marginHorizontal: 16,
      borderRadius: theme.radius.md,
      overflow: 'hidden',
    },
  });
