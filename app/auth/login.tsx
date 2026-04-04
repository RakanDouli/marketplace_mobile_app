/**
 * Login Screen
 * User authentication with Email and Password
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronDown } from 'lucide-react-native';
import { useTheme } from '../../src/theme';
import { Text, Button, Input, Form } from '../../src/components/slices';
import { LogoIcon, GoogleIcon, AppleIcon } from '../../src/components/icons';
import { useUserAuthStore } from '../../src/stores/userAuthStore';

// Check if running on iOS for Apple Sign-In
const isIOS = Platform.OS === 'ios';

// Development credentials from backend seed
const DEV_CREDENTIALS = [
  {
    name: 'فردي (5 إعلانات)',
    email: 'individual@marketplace.com',
    password: 'Individual123!',
  },
  {
    name: 'تاجر (غير محدود)',
    email: 'dealer@marketplace.com',
    password: 'Dealer123!',
  },
  {
    name: 'شركة (غير محدود)',
    email: 'business@marketplace.com',
    password: 'Business123!',
  },
  {
    name: 'مستخدم 1',
    email: 'user@marketplace.com',
    password: 'User123!',
  },
  {
    name: 'مستخدم 2',
    email: 'user2@marketplace.com',
    password: 'User123!',
  },
  {
    name: 'ركان (بريد حقيقي)',
    email: 'rairakzak@gmail.com',
    password: 'User123!',
  },
  {
    name: 'إدخال يدوي',
    email: '',
    password: '',
  },
];

// Validation functions
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

export default function LoginScreen() {
  const theme = useTheme();
  const router = useRouter();
  const {
    signIn,
    signInWithGoogle,
    signInWithApple,
    isLoading,
    error,
    clearError,
  } = useUserAuthStore();
  const isRTL = theme.isRTL;
  const styles = useMemo(() => createStyles(theme, isRTL), [theme, isRTL]);

  // Show dev credentials in development (not production)
  const showDevCredentials = __DEV__;

  // Dev credentials state
  const [selectedOption, setSelectedOption] = useState(0);
  const [showPicker, setShowPicker] = useState(false);

  // Form state
  const [email, setEmail] = useState(showDevCredentials ? DEV_CREDENTIALS[0].email : '');
  const [password, setPassword] = useState(showDevCredentials ? DEV_CREDENTIALS[0].password : '');

  // Update form when dev option changes
  useEffect(() => {
    if (showDevCredentials) {
      const option = DEV_CREDENTIALS[selectedOption];
      setEmail(option.email);
      setPassword(option.password);
    }
  }, [selectedOption, showDevCredentials]);

  const handleSelectOption = async (index: number) => {
    setSelectedOption(index);
    setShowPicker(false);

    // Auto-login if not "manual entry" option
    const option = DEV_CREDENTIALS[index];
    if (option.email && option.password) {
      clearError();
      const result = await signIn(option.email, option.password);
      if (result.success) {
        router.replace('/(tabs)');
      }
    }
  };

  // Password login
  const handleLogin = async () => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    if (emailError || passwordError) return;

    clearError();
    const result = await signIn(email, password);
    if (result.success) {
      router.replace('/(tabs)');
    }
  };

  const handleGoogleLogin = async () => {
    clearError();
    const result = await signInWithGoogle();
    if (result.success) {
      router.replace('/(tabs)');
    }
  };

  const handleAppleLogin = async () => {
    clearError();
    const result = await signInWithApple();
    if (result.success) {
      router.replace('/(tabs)');
    }
  };

  // Form validation
  const isEmailValid = !validateEmail(email);
  const isFormValid = isEmailValid && !validatePassword(password);

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
            <Text variant="h3" center style={styles.title}>تسجيل الدخول</Text>
            <Text variant="paragraph" center color="secondary" style={styles.subtitle}>
              مرحباً بعودتك! سجل دخولك للمتابعة
            </Text>

            {/* Dev Credentials Selector */}
            {showDevCredentials && (
              <View style={styles.devSelector}>
                <Text variant="small" style={styles.devLabel}>
                  اختر حساب من قاعدة البيانات:
                </Text>
                <TouchableOpacity
                  style={styles.devPickerButton}
                  onPress={() => setShowPicker(true)}
                  disabled={isLoading}
                >
                  <Text variant="body">{DEV_CREDENTIALS[selectedOption].name}</Text>
                  <ChevronDown size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}

            {/* Login Form */}
            <Form error={error ?? undefined}>
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

              <View style={styles.forgotPassword}>
                <TouchableOpacity
                  onPress={() => router.push('/auth/forgot-password')}
                >
                  <Text variant="small" style={styles.forgotPasswordLink}>
                    نسيت كلمة المرور؟
                  </Text>
                </TouchableOpacity>
              </View>

              <Button
                onPress={handleLogin}
                loading={isLoading}
                disabled={!isFormValid}
                style={styles.button}
              >
                تسجيل الدخول
              </Button>
            </Form>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text variant="small" color="muted" style={styles.dividerText}>أو</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign In Button */}
            <Button
              variant="outline"
              onPress={handleGoogleLogin}
              disabled={isLoading}
              icon={<GoogleIcon width={20} height={20} />}
              style={styles.socialButton}
            >
              تسجيل الدخول بجوجل
            </Button>

            {/* Apple Sign In Button - iOS only */}
            {isIOS && (
              <Button
                variant="outline"
                onPress={handleAppleLogin}
                disabled={isLoading}
                icon={<AppleIcon width={20} height={20} color={theme.colors.text} />}
                style={styles.socialButton}
              >
                تسجيل الدخول بـ Apple
              </Button>
            )}

            {/* Register Link */}
            <TouchableOpacity
              style={styles.registerContainer}
              onPress={() => router.push('/auth/register')}
              activeOpacity={0.7}
            >
              <Text variant="paragraph" color="secondary">ليس لديك حساب؟ </Text>
              <Text variant="paragraph" style={styles.registerLink}>
                سجل الآن
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Dev Credentials Picker Modal */}
      <Modal
        visible={showPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPicker(false)}
        >
          <View style={styles.modalContent}>
            <Text variant="h4" center style={styles.modalTitle}>اختر حساب</Text>
            {DEV_CREDENTIALS.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.modalOption,
                  selectedOption === index && styles.modalOptionSelected,
                ]}
                onPress={() => handleSelectOption(index)}
              >
                <Text
                  variant="body"
                  style={selectedOption === index ? styles.selectedOptionText : undefined}
                >
                  {option.name}
                </Text>
                {option.email && (
                  <Text variant="small" color="muted">{option.email}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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
    // Dev credentials selector
    devSelector: {
      marginBottom: theme.spacing.md,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.warningLight,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.warning,
    },
    devLabel: {
      marginBottom: theme.spacing.sm,
      textAlign: 'right',
    },
    devPickerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.bg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      padding: theme.spacing.sm,
    },
    // Social login buttons
    socialButton: {
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
    // Common
    forgotPassword: {
      width: '100%',
      alignItems: isRTL ? 'flex-start' : 'flex-end',
      marginBottom: theme.spacing.sm,
    },
    forgotPasswordLink: {
      color: theme.colors.primary,
    },
    button: {
      marginTop: theme.spacing.sm,
    },
    registerContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: theme.spacing.xl,
    },
    registerLink: {
      color: theme.colors.primary,
    },
    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.lg,
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.xl,
      padding: theme.spacing.md,
      width: '100%',
      maxWidth: 320,
    },
    modalTitle: {
      marginBottom: theme.spacing.md,
    },
    modalOption: {
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      marginBottom: theme.spacing.xs,
    },
    modalOptionSelected: {
      backgroundColor: theme.colors.primaryLight,
    },
    selectedOptionText: {
      color: theme.colors.primary,
    },
  });
