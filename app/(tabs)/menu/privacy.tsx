/**
 * Privacy Policy Screen
 * App privacy policy - matching web frontend
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Shield, AlertTriangle } from 'lucide-react-native';
import { useTheme } from '../../../src/theme';
import { Text, BulletList } from '../../../src/components/ui';

// Privacy content sections - EXACT copy from web frontend
const privacySections = [
  {
    title: '1. مقدمة',
    content: [
      'نحن في شام باي نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية. توضح هذه السياسة كيفية جمع واستخدام وحماية معلوماتك عند استخدام موقعنا وخدماتنا.',
    ],
  },
  {
    title: '2. المعلومات التي نجمعها',
    content: ['نجمع الأنواع التالية من المعلومات:'],
    subSections: [
      {
        subtitle: 'معلومات التسجيل:',
        list: [
          'الاسم الكامل',
          'البريد الإلكتروني',
          'رقم الهاتف',
          'الموقع الجغرافي (المحافظة/المدينة)',
        ],
      },
      {
        subtitle: 'معلومات الإعلانات:',
        list: [
          'تفاصيل المنتجات المعروضة',
          'الصور المرفقة',
          'معلومات التسعير',
        ],
      },
      {
        subtitle: 'معلومات الاستخدام:',
        list: [
          'سجل التصفح داخل الموقع',
          'الإعلانات التي تمت مشاهدتها',
          'عنوان IP وبيانات الجهاز',
        ],
      },
    ],
  },
  {
    title: '3. كيف نستخدم معلوماتك',
    content: ['نستخدم المعلومات المجمعة للأغراض التالية:'],
    list: [
      'تقديم وتحسين خدماتنا',
      'التواصل معك بشأن حسابك وإعلاناتك',
      'إرسال إشعارات مهمة عن الموقع',
      'تحسين تجربة المستخدم',
      'منع الاحتيال والأنشطة المشبوهة',
      'الامتثال للمتطلبات القانونية',
    ],
  },
  {
    title: '4. خصوصية الرسائل',
    isWarning: true,
    content: ['الرسائل المتبادلة عبر نظام المحادثات في الموقع مخزنة على خوادمنا. ننصحك بشدة بما يلي:'],
    list: [
      'لا تشارك معلومات بطاقتك البنكية أو أرقام الحسابات المصرفية',
      'لا ترسل كلمات مرور أو رموز تحقق',
      'لا تشارك معلومات شخصية حساسة كالهوية أو جواز السفر',
      'لا توافق على طلبات تحويل أموال قبل معاينة المنتج',
    ],
    footer: 'أي معلومات تشاركها في المحادثات هي مسؤوليتك الشخصية. نحن غير مسؤولين عن أي سوء استخدام لهذه المعلومات.',
  },
  {
    title: '5. مشاركة البيانات',
    content: ['نحن لا نبيع بياناتك الشخصية لأطراف ثالثة. قد نشارك معلوماتك في الحالات التالية فقط:'],
    list: [
      'مع المستخدمين الآخرين عند التواصل بشأن إعلان (رقم الهاتف إذا اخترت إظهاره)',
      'مع مزودي الخدمات الذين يساعدوننا في تشغيل الموقع',
      'عند الطلب من جهات قانونية مختصة',
      'لحماية حقوقنا ومنع الاحتيال',
    ],
  },
  {
    title: '6. أمان البيانات',
    content: ['نتخذ إجراءات أمنية لحماية بياناتك:'],
    list: [
      'تشفير البيانات أثناء النقل (SSL/TLS)',
      'تخزين كلمات المرور بشكل مشفر',
      'مراقبة دورية للأنشطة المشبوهة',
      'تحديثات أمنية منتظمة للنظام',
    ],
    footer: 'رغم جهودنا، لا يمكن ضمان أمان 100% لأي نظام على الإنترنت. أنت مسؤول عن حماية بيانات تسجيل الدخول الخاصة بك.',
  },
  {
    title: '7. ملفات تعريف الارتباط (Cookies)',
    content: ['نستخدم ملفات تعريف الارتباط لـ:'],
    list: [
      'تذكر تسجيل دخولك',
      'حفظ تفضيلاتك (مثل اللغة والمظهر)',
      'تحليل استخدام الموقع لتحسين الخدمة',
      'عرض إعلانات مخصصة (إذا كانت مفعلة)',
    ],
    footer: 'يمكنك تعطيل ملفات تعريف الارتباط من إعدادات متصفحك، لكن قد يؤثر ذلك على بعض وظائف الموقع.',
  },
  {
    title: '8. حقوقك',
    content: ['لديك الحقوق التالية بشأن بياناتك:'],
    list: [
      'حق التصحيح: يمكنك تحديث معلوماتك من إعدادات الحساب',
      'حق الحذف: يمكنك طلب حذف حسابك وبياناتك',
      'حق الاعتراض: يمكنك إلغاء الاشتراك من الرسائل التسويقية',
    ],
    footer: 'لممارسة أي من هذه الحقوق، تواصل معنا عبر صفحة الاتصال.',
  },
  {
    title: '9. الاحتفاظ بالبيانات',
    content: [
      'نحتفظ ببياناتك طالما حسابك نشط أو حسب الحاجة لتقديم خدماتنا. عند حذف الحساب، يتم حذف البيانات الشخصية فوراً. قد نحتفظ ببعض البيانات للأغراض القانونية إذا لزم الأمر.',
    ],
  },
  {
    title: '10. القاصرين',
    content: [
      'يمكن للأشخاص من جميع الأعمار تصفح الموقع. ومع ذلك، لإتمام عمليات البيع والشراء والتوقيع على العقود، يجب أن يكون عمر المستخدم 18 عاماً على الأقل أو أن يكون تحت إشراف ولي الأمر.',
      'نحن نستخدم نظام فحص آلي للمحتوى لضمان خلو الموقع من المحتوى غير اللائق أو المخالف.',
    ],
  },
  {
    title: '11. التغييرات على السياسة',
    content: [
      'قد نقوم بتحديث سياسة الخصوصية من وقت لآخر. سنُعلمك بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار على الموقع. ننصحك بمراجعة هذه الصفحة بشكل دوري.',
    ],
  },
  {
    title: '12. الاتصال بنا',
    content: [
      'إذا كان لديك أي أسئلة أو مخاوف بشأن سياسة الخصوصية أو كيفية معالجة بياناتك، يمكنك التواصل معنا عبر صفحة الاتصال.',
    ],
  },
];

export default function PrivacyScreen() {
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
          <Shield size={40} color={theme.colors.primary} />
        </View>
        <Text variant="h3" center>سياسة الخصوصية</Text>
        <Text variant="small" color="muted" center style={styles.lastUpdate}>
          آخر تحديث: ديسمبر 2024
        </Text>
      </View>

      {/* Privacy Sections */}
      <View style={styles.sectionsContainer}>
        {privacySections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text variant="h4" style={styles.sectionTitle}>{section.title}</Text>

            {/* Warning section - all content inside warning box */}
            {section.isWarning ? (
              <View style={styles.warningBox}>

                {section.content.map((paragraph, pIndex) => (
                  <Text key={pIndex} variant="paragraph" color="secondary" style={styles.paragraph}>
                    {paragraph}
                  </Text>
                ))}
                {section.list && (
                  <BulletList items={section.list} variant="warning" />
                )}
                {section.footer && (
                  <Text variant="paragraph" color="secondary" style={[styles.paragraph, styles.footerText]}>
                    {section.footer}
                  </Text>
                )}
              </View>
            ) : (
              <>
                {section.content.map((paragraph, pIndex) => (
                  <Text key={pIndex} variant="paragraph" color="secondary" style={styles.paragraph}>
                    {paragraph}
                  </Text>
                ))}

                {/* Sub-sections with subtitles */}
                {section.subSections && section.subSections.map((subSection, sIndex) => (
                  <View key={sIndex} style={styles.subSection}>
                    <Text variant="body" style={styles.subTitle}>{subSection.subtitle}</Text>
                    <BulletList items={subSection.list} />
                  </View>
                ))}

                {/* Regular list */}
                {section.list && !section.subSections && (
                  <BulletList items={section.list} />
                )}

                {section.footer && (
                  <Text variant="paragraph" color="secondary" style={[styles.paragraph, styles.footerText]}>
                    {section.footer}
                  </Text>
                )}
              </>
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
    subSection: {
      marginTop: 12,
    },
    subTitle: {
      fontFamily: theme.fontFamily.bodyMedium,
      marginBottom: 8,
    },
    footerText: {
      marginTop: 12,
      fontStyle: 'italic',
    },
    warningBox: {
      backgroundColor: theme.colors.warningLight,
      borderWidth: 1,
      borderColor: theme.colors.warningLight,
      borderRadius: theme.radius.sm,
      padding: theme.spacing.md,
    },
    warningHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    warningTitle: {
      color: theme.colors.warning,
      fontFamily: theme.fontFamily.bodyMedium,
    },
  });
