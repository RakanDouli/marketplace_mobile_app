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
import { CheckCircle } from 'lucide-react-native';
import { useTheme } from '../../src/theme';
import { Text, Button, Input, Form } from '../../src/components/slices';
import { LogoIcon } from '../../src/components/icons';
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
    isAuthenticated,
    error,
    clearError,
    registrationComplete,
    registeredEmail,
    clearRegistrationState,
  } = useUserAuthStore();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Local success state - this prevents AuthGuard redirect race condition
  const [showSuccess, setShowSuccess] = useState(false);
  const [successEmail, setSuccessEmail] = useState('');

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

    // If signup succeeded, show success screen using local state
    // This prevents the AuthGuard redirect from hiding the success screen
    if (result.success) {
      setSuccessEmail(email);
      setShowSuccess(true);
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

  // Show success screen after registration (using local state to avoid AuthGuard race condition)
  if (showSuccess) {
    // Check if user was auto-logged in (no email confirmation needed) or needs to confirm email
    const needsEmailConfirmation = !isAuthenticated;

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <LogoIcon width={32} height={32} color={theme.colors.textInverse} />
            </View>
            <Text variant="h2">شام باي</Text>
          </View>

          {/* Success Icon */}
          <View style={styles.successContainer}>
            <View style={[styles.successIcon, { backgroundColor: theme.colors.successLight }]}>
              <CheckCircle size={48} color={theme.colors.success} />
            </View>

            <Text variant="h3" center style={styles.successTitle}>
              تم إنشاء الحساب بنجاح!
            </Text>

            {needsEmailConfirmation ? (
              <>
                <Text variant="paragraph" center color="secondary" style={styles.successMessage}>
                  تم إرسال رابط التأكيد إلى بريدك الإلكتروني
                </Text>

                <Text variant="body" center style={styles.emailText}>
                  {successEmail}
                </Text>

                <Text variant="small" center color="muted" style={styles.successHint}>
                  يرجى التحقق من بريدك الإلكتروني والضغط على رابط التأكيد لتفعيل حسابك
                </Text>
              </>
            ) : (
              <Text variant="paragraph" center color="secondary" style={styles.successMessage}>
                تم تسجيل دخولك تلقائياً. يمكنك البدء باستخدام التطبيق الآن!
              </Text>
            )}
          </View>

          {/* Action Button */}
          <Button
            variant="primary"
            onPress={() => {
              // Clear states and navigate
              clearRegistrationState();
              setShowSuccess(false);
              if (isAuthenticated) {
                router.replace('/(tabs)');
              } else {
                router.replace('/auth/login');
              }
            }}
            style={styles.button}
          >
            {isAuthenticated ? 'ابدأ الآن' : 'تسجيل الدخول'}
          </Button>
        </ScrollView>
      </SafeAreaView>
    );
  }

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
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <LogoIcon width={32} height={32} color={theme.colors.textInverse} />
            </View>
            <Text variant="h2">شام باي</Text>
          </View>

          <Text variant="h3" center style={styles.title}>إنشاء حساب</Text>
          <Text variant="paragraph" center color="secondary" style={styles.subtitle}>
            أنشئ حسابك للبدء في البيع والشراء
          </Text>

          {/* Google Sign Up Button */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignUp}
            disabled={isLoading}
          >
            <View style={styles.googleIconContainer}>
              <Text style={styles.googleIconText}>G</Text>
            </View>
            <Text variant="body" style={styles.googleButtonText}>
              التسجيل بجوجل
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
            <Text variant="small" color="muted" style={styles.dividerText}>أو</Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
          </View>

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
                  { borderColor: theme.colors.border },
                ]}
              >
                {acceptTerms && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text variant="small" style={styles.termsText}>
                أوافق على{' '}
                <Text variant="small" style={{ color: theme.colors.primary }}>
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

          {/* Login Link */}
          <TouchableOpacity
            style={styles.loginContainer}
            onPress={() => router.push('/auth/login')}
            activeOpacity={0.7}
          >
            <Text variant="paragraph" color="secondary">لديك حساب بالفعل؟ </Text>
            <Text variant="paragraph" style={{ color: theme.colors.primary }}>
              سجل دخولك
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.bg,
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
      marginBottom: theme.spacing.xl,
    },
    logoIcon: {
      width: 48,
      height: 48,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      marginBottom: theme.spacing.xs,
    },
    subtitle: {
      marginBottom: theme.spacing.lg,
    },
    // Google button
    googleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    googleIconContainer: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#4285F4',
      justifyContent: 'center',
      alignItems: 'center',
    },
    googleIconText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
    googleButtonText: {
      color: theme.colors.text,
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
    },
    dividerText: {
      marginHorizontal: theme.spacing.md,
    },
    // Terms
    termsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: theme.radius.sm,
      borderWidth: 2,
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
    },
    // Success screen
    successContainer: {
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
    },
    successIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    successTitle: {
      marginBottom: theme.spacing.sm,
    },
    successMessage: {
      marginBottom: theme.spacing.xs,
    },
    emailText: {
      fontWeight: '600',
      marginBottom: theme.spacing.md,
    },
    successHint: {
      paddingHorizontal: theme.spacing.lg,
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
  });
