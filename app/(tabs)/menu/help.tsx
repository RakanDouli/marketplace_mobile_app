/**
 * Help Screen
 * FAQ and help center - matching web frontend
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { HelpCircle, Mail, MapPin, Clock, ExternalLink } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../src/theme';
import { Text, Button } from '../../../src/components/slices';
import { Collapsible } from '../../../src/components/slices';

// Static FAQ items - grouped by category
const faqItems = [
  {
    category: 'الحساب',
    questions: [
      { question: 'كيف أقوم بإنشاء حساب جديد؟', answer: 'اضغط على "تسجيل الدخول" في الأسفل، ثم اختر "إنشاء حساب جديد" واتبع الخطوات لإدخال بياناتك.' },
      { question: 'كيف أستعيد كلمة المرور؟', answer: 'من صفحة تسجيل الدخول، اضغط على "نسيت كلمة المرور" واتبع التعليمات. سيتم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني.' },
      { question: 'كيف أعدل معلومات حسابي؟', answer: 'اذهب إلى القائمة > معلومات الحساب، ويمكنك تعديل اسمك وصورتك ومعلوماتك الأخرى.' },
    ],
  },
  {
    category: 'الإعلانات',
    questions: [
      { question: 'كيف أقوم بإضافة إعلان جديد؟', answer: 'اضغط على زر "+" في الشريط السفلي، ثم اختر الفئة المناسبة واملأ تفاصيل الإعلان وأضف الصور.' },
      { question: 'كيف أحذف أو أعدل إعلاني؟', answer: 'اذهب إلى القائمة > إعلاناتي، ثم اضغط على الإعلان لعرض خيارات التعديل أو الحذف.' },
      { question: 'لماذا لم يظهر إعلاني؟', answer: 'قد يستغرق ظهور الإعلان بعض الوقت للمراجعة. تأكد من أن إعلانك يتوافق مع سياسات الموقع ولا يحتوي على محتوى محظور.' },
      { question: 'هل يمكنني تعديل إعلاني بعد النشر؟', answer: 'نعم، يمكنك تعديل إعلانك في أي وقت من صفحة "إعلاناتي" في القائمة.' },
    ],
  },
  {
    category: 'التواصل والشراء',
    questions: [
      { question: 'كيف أتواصل مع البائع؟', answer: 'افتح صفحة الإعلان واضغط على زر "تواصل مع البائع" لبدء محادثة مباشرة.' },
      { question: 'هل الشراء آمن على المنصة؟', answer: 'شام باي هي منصة وسيطة فقط. ننصح دائماً بمعاينة المنتج شخصياً والتأكد من حالته قبل الدفع.' },
      { question: 'ماذا أفعل إذا واجهت مشكلة مع بائع؟', answer: 'يمكنك الإبلاغ عن البائع من صفحة الإعلان أو التواصل معنا عبر صفحة "تواصل معنا".' },
    ],
  },
  {
    category: 'الاشتراكات',
    questions: [
      { question: 'ما هي الاشتراكات المتاحة؟', answer: 'نوفر عدة باقات اشتراك تتيح لك مزايا إضافية مثل تمييز الإعلانات وزيادة عددها. يمكنك مراجعتها من صفحة "الاشتراك" في القائمة.' },
      { question: 'كيف أقوم بترقية اشتراكي؟', answer: 'اذهب إلى القائمة > الاشتراك، ثم اختر الباقة المناسبة واتبع خطوات الدفع.' },
    ],
  },
];

// Contact info
const contactInfo = [
  { icon: Mail, label: 'البريد الإلكتروني', value: 'info@shambay.com' },
  { icon: MapPin, label: 'العنوان', value: 'دمشق، سوريا' },
  { icon: Clock, label: 'ساعات العمل', value: 'السبت - الخميس: 9 ص - 6 م' },
];

export default function HelpScreen() {
  const theme = useTheme();
  const router = useRouter();
  const styles = createStyles(theme);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.heroIcon}>
          <HelpCircle size={40} color={theme.colors.primary} />
        </View>
        <Text variant="h3" center>مركز المساعدة</Text>
        <Text variant="paragraph" color="secondary" center style={styles.heroSubtitle}>
          ابحث عن إجابات لأسئلتك الشائعة
        </Text>
      </View>

      {/* FAQ Sections */}
      {faqItems.map((category, categoryIndex) => (
        <View key={categoryIndex} style={styles.section}>
          <Text variant="h4" style={styles.sectionTitle}>{category.category}</Text>
          <View style={styles.faqContainer}>
            {category.questions.map((item, index) => (
              <Collapsible key={index} title={item.question} variant="accent">
                <Text variant="paragraph" color="secondary" style={{ lineHeight: 24 }}>
                  {item.answer}
                </Text>
              </Collapsible>
            ))}
          </View>
        </View>
      ))}

      {/* Contact Section */}
      <View style={styles.section}>
        <Text variant="h4" style={styles.sectionTitle}>لم تجد إجابتك؟</Text>
        <View style={styles.contactCard}>
          <Text variant="paragraph" color="secondary" center style={{ marginBottom: 16 }}>
            تواصل معنا مباشرة وسنرد عليك في أقرب وقت
          </Text>

          {/* Contact Info */}
          <View style={styles.contactInfoList}>
            {contactInfo.map((info, index) => {
              const Icon = info.icon;
              return (
                <View key={index} style={styles.contactInfoItem}>
                  <Icon size={18} color={theme.colors.primary} />
                  <Text variant="small" color="secondary" style={{ marginRight: 8 }}>{info.value}</Text>
                </View>
              );
            })}
          </View>

          {/* Go to Contact Page */}
          <Button
            variant="secondary"
            icon={<ExternalLink size={18} color="#FFFFFF" />}
            onPress={() => router.push('/menu/contact')}
            fullWidth
          >
            الذهاب لصفحة التواصل
          </Button>
        </View>
      </View>

      {/* Quick Links */}
      <View style={styles.section}>
        <Text variant="h4" style={styles.sectionTitle}>روابط مفيدة</Text>
        <View style={styles.linksContainer}>
          <Button
            variant="ghost"
            arrow
            onPress={() => router.push('/menu/privacy')}
            style={styles.linkItem}
          >
            سياسة الخصوصية
          </Button>
          <Button
            variant="ghost"
            arrow
            onPress={() => router.push('/menu/terms')}
            style={{ ...styles.linkItem, borderBottomWidth: 0 }}
          >
            الشروط والأحكام
          </Button>
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
    faqContainer: {
      backgroundColor: theme.colors.bg,
      marginHorizontal: 16,
      borderRadius: theme.radius.md,
      overflow: 'hidden',
    },
    contactCard: {
      backgroundColor: theme.colors.bg,
      marginHorizontal: 16,
      borderRadius: theme.radius.md,
      padding: 16,
    },
    contactInfoList: {
      marginBottom: 16,
    },
    contactInfoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingVertical: 8,
    },
    linksContainer: {
      backgroundColor: theme.colors.bg,
      marginHorizontal: 16,
      borderRadius: theme.radius.md,
      overflow: 'hidden',
    },
    linkItem: {
      borderRadius: 0,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      justifyContent: 'flex-start',
    },
  });
