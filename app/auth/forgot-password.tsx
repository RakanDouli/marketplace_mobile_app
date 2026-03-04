/**
 * Forgot Password Screen
 * Uses slice components for consistent RTL support
 */

import React, { useState, useMemo } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CheckCircle } from 'lucide-react-native';
import { useTheme } from '../../src/theme';
import { Text, Button, Input, Container } from '../../src/components/slices';
import { LogoIcon } from '../../src/components/icons';
import { useUserAuthStore } from '../../src/stores/userAuthStore';

// Email validation
const validateEmail = (email: string): string | undefined => {
  if (!email) return 'البريد الإلكتروني مطلوب';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'البريد الإلكتروني غير صالح';
  return undefined;
};

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { resetPassword, isLoading, error } = useUserAuthStore();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const isEmailValid = !validateEmail(email);

  const handleReset = async () => {
    if (!isEmailValid) return;
    try {
      await resetPassword(email);
      setSent(true);
    } catch (e) {
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Logo Header */}
          <View style={styles.logoContainer}>
            <Text variant="h2" style={styles.logoTextAr}>شام باي</Text>
            <View style={styles.logoIcon}>
              <LogoIcon width={28} height={28} color={theme.colors.textInverse} />
            </View>
            <Text variant="h2" style={styles.logoTextEn}>Shambay</Text>
          </View>

          {/* Card */}
          <Container background="bg" paddingY="lg" paddingX="lg" style={styles.card}>
            {!sent ? (
              <>
                <Text variant="h3" center style={styles.title}>نسيت كلمة المرور؟</Text>
                <Text variant="paragraph" center color="secondary" style={styles.subtitle}>
                  أدخل بريدك الإلكتروني وسنرسل لك رابط لإعادة تعيين كلمة المرور
                </Text>

                {/* Error Message */}
                {error && (
                  <View style={[styles.errorContainer, { backgroundColor: theme.colors.errorLight }]}>
                    <Text variant="small" style={{ color: theme.colors.error }}>{error}</Text>
                  </View>
                )}

                {/* Form */}
                <View style={styles.form}>
                  <Input
                    label="البريد الإلكتروني"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="example@email.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    validate={validateEmail}
                    required
                    editable={!isLoading}
                  />

                  <Button
                    onPress={handleReset}
                    loading={isLoading}
                    disabled={!isEmailValid}
                    style={styles.button}
                  >
                    إرسال رابط الاستعادة
                  </Button>
                </View>

                {/* Back to Login */}
                <TouchableOpacity
                  style={styles.backContainer}
                  onPress={() => router.back()}
                  activeOpacity={0.7}
                >
                  <Text variant="paragraph" style={{ color: theme.colors.primary }}>
                    العودة لتسجيل الدخول
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.successContainer}>
                <CheckCircle size={56} color={theme.colors.success} />

                <Text variant="h3" style={styles.successTitle}>
                  تم الإرسال بنجاح
                </Text>

                <Text variant="paragraph" center color="secondary" style={styles.successMessage}>
                  تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني
                </Text>

                <Button
                  onPress={() => router.replace('/auth/login')}
                  style={styles.button}
                  fullWidth
                >
                  العودة لتسجيل الدخول
                </Button>
              </View>
            )}
          </Container>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bgPrimary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoTextAr: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  logoTextEn: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  card: {
    borderRadius: theme.radius.xl,
  },
  title: {
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    marginBottom: theme.spacing.lg,
  },
  errorContainer: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.md,
    width: '100%',
  },
  form: {
    width: '100%',
  },
  button: {
    marginTop: theme.spacing.sm,
  },
  backContainer: {
    marginTop: theme.spacing.lg,
    alignItems: 'center',
  },
  successContainer: {
    alignItems: 'center',
  },
  successTitle: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  successMessage: {
    marginBottom: theme.spacing.lg,
  },
});
