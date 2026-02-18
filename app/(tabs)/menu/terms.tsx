/**
 * Terms Screen
 * Terms and conditions - matching web frontend
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { FileText } from 'lucide-react-native';
import { useTheme } from '../../../src/theme';
import { Text, BulletList } from '../../../src/components/slices';

// Terms content sections - EXACT copy from web frontend
const termsSections = [
  {
    title: '1. مقدمة',
    content: [
      'مرحباً بك في شام باي. باستخدامك لموقعنا وخدماتنا، فإنك توافق على الالتزام بهذه الشروط والأحكام. يرجى قراءتها بعناية قبل استخدام الموقع.',
      'شام باي هي منصة إلكترونية تتيح للمستخدمين نشر إعلانات لبيع وشراء المنتجات والخدمات المختلفة. نحن نوفر فقط المنصة للتواصل بين البائعين والمشترين.',
    ],
  },
  {
    title: '2. دور المنصة',
    content: ['شام باي هي منصة وسيطة فقط وليست طرفاً في أي معاملة تتم بين المستخدمين. نحن:'],
    list: [
      'لا نملك أو نبيع أي من المنتجات المعروضة',
      'لا نضمن جودة أو حالة أو صحة المنتجات المعلنة',
      'لا نتحقق من هوية البائعين أو المشترين',
      'لا نتدخل في المفاوضات أو الأسعار بين الأطراف',
      'لا نتحمل مسؤولية أي نزاعات تنشأ بين المستخدمين',
    ],
  },
  {
    title: '3. مسؤوليات المستخدم',
    content: ['بتسجيلك في الموقع، فإنك تتعهد بما يلي:'],
    list: [
      'تقديم معلومات صحيحة ودقيقة عند التسجيل',
      'الحفاظ على سرية بيانات حسابك وكلمة المرور',
      'نشر إعلانات صادقة ودقيقة تصف المنتج بشكل حقيقي',
      'عدم نشر محتوى مخالف للقانون أو الآداب العامة',
      'عدم استخدام الموقع لأغراض احتيالية أو غير قانونية',
      'التعامل باحترام مع المستخدمين الآخرين',
      'الإبلاغ عن أي محتوى مخالف أو سلوك مشبوه',
    ],
  },
  {
    title: '4. المحتوى المحظور',
    content: ['يُمنع نشر الإعلانات التالية على المنصة:'],
    list: [
      'المنتجات المسروقة أو غير القانونية',
      'الأسلحة والذخيرة والمتفجرات',
      'المخدرات والمواد المحظورة',
      'المنتجات المقلدة أو المزيفة',
      'المحتوى الإباحي أو غير اللائق',
      'خدمات أو منتجات تنتهك حقوق الملكية الفكرية',
      'إعلانات تتضمن معلومات كاذبة أو مضللة',
    ],
  },
  {
    title: '5. سلامة المعاملات',
    content: ['لحماية نفسك أثناء التعامل، ننصحك بما يلي:'],
    list: [
      'قم بمعاينة المنتج شخصياً قبل الشراء',
      'تجنب إرسال أموال مقدماً قبل استلام المنتج',
      'استخدم طرق دفع آمنة وموثوقة',
      'احتفظ بسجلات المحادثات والاتفاقيات',
      'قابل البائع في مكان عام وآمن',
      'لا تشارك معلوماتك البنكية أو الشخصية الحساسة',
    ],
  },
  {
    title: '6. تعليق وإنهاء الحسابات',
    content: ['نحتفظ بالحق في تعليق أو إنهاء حسابك في الحالات التالية:'],
    list: [
      'انتهاك أي من شروط الاستخدام',
      'نشر محتوى محظور أو مخالف',
      'تلقي شكاوى متعددة من مستخدمين آخرين',
      'الاشتباه في نشاط احتيالي',
      'عدم النشاط لفترة طويلة',
    ],
    footer: 'نطبق نظام التحذيرات التالي: التحذير الأول ينتج عنه تنبيه، التحذير الثاني يؤدي لإيقاف الحساب 7 أيام، والتحذير الثالث يؤدي لحظر دائم.',
  },
  {
    title: '7. إخلاء المسؤولية',
    content: ['شام باي غير مسؤولة عن:'],
    list: [
      'أي خسائر مالية ناتجة عن التعامل مع مستخدمين آخرين',
      'جودة أو حالة أو صحة المنتجات المعروضة',
      'أي نزاعات بين البائعين والمشترين',
      'المعلومات الخاطئة في الإعلانات',
      'أي أضرار ناتجة عن استخدام الموقع',
      'أي انقطاع في الخدمة أو أخطاء تقنية',
    ],
  },
  {
    title: '8. حقوق الملكية الفكرية',
    content: [
      'جميع المحتويات الموجودة على الموقع، بما في ذلك التصميم والشعارات والنصوص والصور، هي ملكية خاصة لشام باي ومحمية بموجب قوانين حقوق الملكية الفكرية.',
      'يُمنع نسخ أو إعادة إنتاج أو توزيع أي محتوى من الموقع دون إذن كتابي مسبق منا.',
    ],
  },
  {
    title: '9. التعديلات على الشروط',
    content: [
      'نحتفظ بالحق في تعديل هذه الشروط والأحكام في أي وقت. سيتم نشر أي تغييرات على هذه الصفحة مع تحديث تاريخ آخر تحديث. استمرارك في استخدام الموقع بعد نشر التغييرات يعني موافقتك على الشروط المعدلة.',
    ],
  },
  {
    title: '10. الاتصال بنا',
    content: [
      'إذا كان لديك أي أسئلة حول هذه الشروط والأحكام، يمكنك التواصل معنا عبر صفحة "تواصل معنا" أو البريد الإلكتروني.',
    ],
  },
];

export default function TermsScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.heroIcon}>
          <FileText size={40} color={theme.colors.primary} />
        </View>
        <Text variant="h3" center>الشروط والأحكام</Text>
        <Text variant="small" color="muted" center style={styles.lastUpdate}>
          آخر تحديث: ديسمبر 2024
        </Text>
      </View>

      {/* Terms Sections */}
      <View style={styles.sectionsContainer}>
        {termsSections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text variant="h4" style={styles.sectionTitle}>{section.title}</Text>

            {section.content.map((paragraph, pIndex) => (
              <Text key={pIndex} variant="paragraph" color="secondary" style={styles.paragraph}>
                {paragraph}
              </Text>
            ))}

            {section.list && (
              <BulletList items={section.list} />
            )}

            {section.footer && (
              <Text variant="paragraph" color="secondary" style={[styles.paragraph, styles.footerText]}>
                {section.footer}
              </Text>
            )}
          </View>
        ))}
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
    lastUpdate: {
      marginTop: 8,
    },
    sectionsContainer: {
      backgroundColor: theme.colors.bg,
      marginHorizontal: theme.spacing.md,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
      gap: theme.spacing.lg,
    },
    section: {
    },
    sectionTitle: {
      marginBottom: 12,
    },
    paragraph: {
      lineHeight: 24,
      marginBottom: 8,
    },
    footerText: {
      marginTop: 12,
      fontStyle: 'italic',
    },
  });
