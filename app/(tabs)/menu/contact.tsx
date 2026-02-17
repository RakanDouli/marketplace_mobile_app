/**
 * Contact Screen
 * Contact form and information - matching web frontend
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Mail, MapPin, Clock, Send, Building2 } from 'lucide-react-native';
import { useTheme } from '../../../src/theme';
import { Text, Button } from '../../../src/components/ui';
import { Collapsible } from '../../../src/components/slices';

// Static contact info (no phone number - use form instead)
const contactInfo = [
  {
    icon: Mail,
    title: 'البريد الإلكتروني',
    value: 'info@shambay.com',
  },
  {
    icon: MapPin,
    title: 'العنوان',
    value: 'دمشق، سوريا',
  },
  {
    icon: Clock,
    title: 'ساعات العمل',
    value: 'السبت - الخميس: 9 ص - 6 م',
  },
];

// Static FAQ items
const faqItems = [
  { question: 'كيف يمكنني نشر إعلان؟', answer: 'لنشر إعلان، قم بتسجيل الدخول إلى حسابك، ثم اضغط على "+" في الشريط السفلي واتبع الخطوات لإضافة تفاصيل إعلانك والصور.' },
  { question: 'هل التطبيق مجاني؟', answer: 'نعم، يمكنك التسجيل وتصفح الإعلانات مجاناً. نوفر أيضاً باقات اشتراك متميزة للبائعين المحترفين.' },
  { question: 'كيف أتواصل مع البائع؟', answer: 'يمكنك التواصل مع البائع مباشرة عبر نظام المراسلة في التطبيق بعد تسجيل الدخول.' },
  { question: 'كم يستغرق الرد على استفساراتي؟', answer: 'نسعى للرد على جميع الاستفسارات خلال 24 ساعة في أيام العمل.' },
  { question: 'هل يمكنني تعديل إعلاني بعد النشر؟', answer: 'نعم، يمكنك تعديل إعلانك في أي وقت من صفحة "إعلاناتي" في القائمة.' },
];

export default function ContactScreen() {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      Alert.alert('خطأ', 'يرجى تعبئة جميع الحقول المطلوبة');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('خطأ', 'يرجى إدخال بريد إلكتروني صحيح');
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert('تم الإرسال', 'شكراً لتواصلك معنا. سنرد عليك في أقرب وقت ممكن.');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    }, 1000);
  };

  const styles = createStyles(theme);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text variant="h3" center>اتصل بنا - نحن هنا لمساعدتك</Text>
          <Text variant="paragraph" color="secondary" center style={styles.heroSubtitle}>
            لديك سؤال أو استفسار؟ تواصل معنا وسنرد عليك في أقرب وقت
          </Text>
        </View>

        {/* Contact Info Cards */}
        <View style={styles.section}>
          <Text variant="h4" style={styles.sectionTitle}>تواصل معنا</Text>
          <View style={styles.cardsGrid}>
            {contactInfo.map((info, index) => {
              const Icon = info.icon;
              return (
                <View key={index} style={styles.infoCard}>
                  <View style={styles.cardIconContainer}>
                    <Icon size={24} color={theme.colors.primary} />
                  </View>
                  <Text variant="body" style={styles.cardTitle}>{info.title}</Text>
                  <Text variant="small" color="secondary" center>{info.value}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Contact Form */}
        <View style={styles.section}>
          <Text variant="h4" style={styles.sectionTitle}>أرسل لنا رسالة</Text>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text variant="small" style={styles.label}>الاسم *</Text>
              <TextInput
                style={styles.input}
                placeholder="أدخل اسمك"
                placeholderTextColor={theme.colors.textMuted}
                value={name}
                onChangeText={setName}
                textAlign="right"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text variant="small" style={styles.label}>البريد الإلكتروني *</Text>
              <TextInput
                style={styles.input}
                placeholder="example@email.com"
                placeholderTextColor={theme.colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                textAlign="right"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text variant="small" style={styles.label}>الموضوع</Text>
              <TextInput
                style={styles.input}
                placeholder="موضوع الرسالة"
                placeholderTextColor={theme.colors.textMuted}
                value={subject}
                onChangeText={setSubject}
                textAlign="right"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text variant="small" style={styles.label}>الرسالة *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="اكتب رسالتك هنا..."
                placeholderTextColor={theme.colors.textMuted}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                textAlign="right"
              />
            </View>

            <Button
              variant="primary"
              onPress={handleSubmit}
              disabled={isSubmitting}
              loading={isSubmitting}
              icon={<Send size={18} color="#FFFFFF" />}
              fullWidth
              style={{ marginTop: theme.spacing.sm }}
            >
              {isSubmitting ? 'جاري الإرسال...' : 'إرسال الرسالة'}
            </Button>
          </View>
        </View>

        {/* Company Info */}
        <View style={styles.section}>
          <View style={styles.companyCard}>
            <View style={styles.companyHeader}>
              <Text variant="h4" style={{ marginLeft: 12 }}>معلومات الشركة</Text>
              <Building2 size={24} color={theme.colors.primary} />
            </View>
            <Text variant="paragraph" color="secondary" style={styles.companyText}>
              شام باي هو منصتك الأولى للبيع والشراء في سوريا. نوفر لك تجربة سهلة وآمنة للتواصل مع البائعين والمشترين.
            </Text>
            <Text variant="paragraph" color="secondary" style={styles.companyText}>
              نحن ملتزمون بتقديم أفضل خدمة لعملائنا ومساعدتهم في العثور على ما يبحثون عنه أو بيع منتجاتهم بأفضل سعر.
            </Text>
          </View>
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
    </KeyboardAvoidingView>
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
    cardsGrid: {
      flexDirection: 'row',
      paddingHorizontal: 12,
      gap: 8,
    },
    infoCard: {
      flex: 1,
      backgroundColor: theme.colors.bg,
      borderRadius: theme.radius.md,
      padding: 12,
      alignItems: 'center',
    },
    cardIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    cardTitle: {
      marginBottom: 4,
      textAlign: 'center',
    },
    formCard: {
      backgroundColor: theme.colors.bg,
      marginHorizontal: 16,
      borderRadius: theme.radius.md,
      padding: 16,
    },
    inputGroup: {
      marginBottom: 16,
    },
    label: {
      marginBottom: 6,
      color: theme.colors.textSecondary,
    },
    input: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      fontFamily: theme.fontFamily.body,
      color: theme.colors.text,
    },
    textArea: {
      minHeight: 120,
      paddingTop: 12,
    },
    companyCard: {
      backgroundColor: theme.colors.bg,
      marginHorizontal: 16,
      borderRadius: theme.radius.md,
      padding: 16,
    },
    companyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginBottom: 12,
    },
    companyText: {
      marginBottom: 8,
      lineHeight: 24,
    },
    faqContainer: {
      backgroundColor: theme.colors.bg,
      marginHorizontal: 16,
      borderRadius: theme.radius.md,
      overflow: 'hidden',
    },
  });
