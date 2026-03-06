/**
 * Register Screen
 * User registration with Email and Password
 * After registration, user receives email confirmation link
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme';
import { Text, Button, Input, Form } from '../../src/components/slices';
import { LogoIcon, GoogleIcon } from '../../src/components/icons';
import { useUserAuthStore } from '../../src/stores/userAuthStore';

// Validation functions
const validateName = (name: string): string | undefined => {
  if (!name) return 'الاسم مطلوب';
  if (name.length < 2) return 'الاسم يجب أن يكون حرفين على الأقل';
  return undefined;
};

const validateEmail = (email: string): string | undefined => {
  if (!email) return 'البريد الإلكتروني مطلوب';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'البريد الإلكتروني غير صالح';
  return undefined;
};

const validatePassword = (password: string): string | undefined => {
  if (!password) return 'كلمة المرور مطلوبة';
  if (password.length < 6) return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
  return undefined;
};

const validateConfirmPassword = (password: string, confirmPassword: string): string | undefined => {
  if (!confirmPassword) return 'تأكيد كلمة المرور مطلوب';
  if (password !== confirmPassword) return 'كلمات المرور غير متطابقة';
  return undefined;
};

export default function RegisterScreen() {
  const theme = useTheme();
  const router = useRouter();
  const {
    signUp,
    signInWithGoogle,
    isLoading,
    error,
    clearError,
  } = useUserAuthStore();
  const isRTL = theme.isRTL;
  const styles = useMemo(() => createStyles(theme, isRTL), [theme, isRTL]);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Handle registration
  const handleRegister = async () => {
    const nameError = validateName(name);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmError = validateConfirmPassword(password, confirmPassword);

    if (nameError || emailError || passwordError || confirmError || !acceptTerms) return;

    clearError();

    // Call signUp and check result
    const result = await signUp(email, password, name);

    // If signup succeeded, navigate to success page
    if (result.success) {
      router.replace(`/auth/signup-success?email=${encodeURIComponent(email)}`);
    }
  };

  // Handle Google Sign Up
  const handleGoogleSignUp = async () => {
    clearError();
    await signInWithGoogle();
  };

  // Validation
  const isFormValid =
    !validateName(name) &&
    !validateEmail(email) &&
    !validatePassword(password) &&
    !validateConfirmPassword(password, confirmPassword) &&
    acceptTerms;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo Header */}
          <View style={styles.logoContainer}>
            <Text variant="h2" style={styles.logoTextAr}>شام باي</Text>
            <View style={styles.logoIcon}>
              <LogoIcon width={28} height={28} color={theme.colors.textInverse} />
            </View>
            <Text variant="h2" style={styles.logoTextEn}>Shambay</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <Text variant="h3" center style={styles.title}>إنشاء حساب</Text>
            <Text variant="paragraph" center color="secondary" style={styles.subtitle}>
              أنشئ حسابك للبدء في البيع والشراء
            </Text>

            <Form error={error ?? undefined}>
              <Input
                label="الاسم الكامل"
                value={name}
                onChangeText={setName}
                placeholder="اسمك الكامل"
                autoCapitalize="words"
                validate={validateName}
                required
                editable={!isLoading}
              />

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

              <Input
                label="كلمة المرور"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                validate={validatePassword}
                required
                editable={!isLoading}
              />

              <Input
                label="تأكيد كلمة المرور"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                secureTextEntry
                validate={(value) => validateConfirmPassword(password, value)}
                required
                editable={!isLoading}
              />

              {/* Terms checkbox */}
              <TouchableOpacity
                style={styles.termsContainer}
                onPress={() => setAcceptTerms(!acceptTerms)}
                disabled={isLoading}
              >
                <View
                  style={[
                    styles.checkbox,
                    acceptTerms && styles.checkboxChecked,
                  ]}
                >
                  {acceptTerms && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text variant="small" style={styles.termsText}>
                  أوافق على{' '}
                  <Text variant="small" style={styles.termsLink}>
                    الشروط والأحكام
                  </Text>
                </Text>
              </TouchableOpacity>

              <Button
                onPress={handleRegister}
                loading={isLoading}
                disabled={!isFormValid}
                style={styles.button}
              >
                إنشاء الحساب
              </Button>
            </Form>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text variant="small" color="muted" style={styles.dividerText}>أو</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign Up Button */}
            <Button
              variant="outline"
              onPress={handleGoogleSignUp}
              disabled={isLoading}
              icon={<GoogleIcon width={20} height={20} />}
              style={styles.googleButton}
            >
              التسجيل بجوجل
            </Button>

            {/* Login Link */}
            <TouchableOpacity
              style={styles.loginContainer}
              onPress={() => router.push('/auth/login')}
              activeOpacity={0.7}
            >
              <Text variant="paragraph" color="secondary">لديك حساب بالفعل؟ </Text>
              <Text variant="paragraph" style={styles.loginLink}>
                سجل دخولك
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>, isRTL: boolean) =>
  StyleSheet.create({
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
      backgroundColor: theme.colors.bg,
      borderRadius: theme.radius.xl,
      padding: theme.spacing.lg,
    },
    title: {
      marginBottom: theme.spacing.xs,
    },
    subtitle: {
      marginBottom: theme.spacing.lg,
    },
    // Google button
    googleButton: {
      marginBottom: theme.spacing.sm,
    },
    // Divider
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: theme.spacing.lg,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.border,
    },
    dividerText: {
      marginStart: theme.spacing.md,
        marginEnd: theme.spacing.md,
    },
    // Terms
    termsContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: theme.radius.sm,
      borderWidth: 2,
      borderColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxChecked: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    checkmark: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
    termsText: {
      flex: 1,
      textAlign: isRTL ? 'right' : 'left',
    },
    termsLink: {
      color: theme.colors.primary,
    },
    // Common
    button: {
      marginTop: theme.spacing.sm,
    },
    loginContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: theme.spacing.xl,
    },
    loginLink: {
      color: theme.colors.primary,
    },
  });
