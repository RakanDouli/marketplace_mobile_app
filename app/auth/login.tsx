/**
 * Login Screen
 * User authentication with email/password and Google OAuth
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
import { useRouter, Link } from 'expo-router';
import { ChevronDown } from 'lucide-react-native';
import { useTheme } from '../../src/theme';
import { Text, Button, Input, Form } from '../../src/components/slices';
import { LogoIcon } from '../../src/components/icons';
import { useUserAuthStore } from '../../src/stores/userAuthStore';

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
  const { signIn, signInWithGoogle, isLoading, error, clearError } = useUserAuthStore();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Show dev credentials in development (not production)
  const showDevCredentials = __DEV__;

  const [selectedOption, setSelectedOption] = useState(0);
  const [showPicker, setShowPicker] = useState(false);
  const [email, setEmail] = useState(showDevCredentials ? DEV_CREDENTIALS[0].email : '');
  const [password, setPassword] = useState(showDevCredentials ? DEV_CREDENTIALS[0].password : '');

  // Update form when option changes
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

  const handleLogin = async () => {
    // Validate before submit
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
    await signInWithGoogle();
    // OAuth will redirect, handled by deep linking
  };

  // Check if form is valid for enabling button
  const isFormValid = !validateEmail(email) && !validatePassword(password);

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

          {/* Google Sign In Button */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleLogin}
            disabled={isLoading}
          >
            <View style={styles.googleIconContainer}>
              <Text style={styles.googleIconText}>G</Text>
            </View>
            <Text variant="body" style={styles.googleButtonText}>
              تسجيل الدخول بجوجل
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
            <Text variant="small" color="muted" style={styles.dividerText}>أو</Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
          </View>

          {/* Form with validation */}
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

            <Link href="/auth/forgot-password" asChild>
              <TouchableOpacity style={styles.forgotPassword}>
                <Text variant="small" style={{ color: theme.colors.primary }}>
                  نسيت كلمة المرور؟
                </Text>
              </TouchableOpacity>
            </Link>

            <Button
              onPress={handleLogin}
              loading={isLoading}
              disabled={!isFormValid}
              style={styles.button}
            >
              تسجيل الدخول
            </Button>
          </Form>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text variant="paragraph" color="secondary">ليس لديك حساب؟ </Text>
            <Link href="/auth/register" asChild>
              <TouchableOpacity>
                <Text variant="paragraph" style={{ color: theme.colors.primary }}>
                  سجل الآن
                </Text>
              </TouchableOpacity>
            </Link>
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
                  style={selectedOption === index ? { color: theme.colors.primary } : undefined}
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
    forgotPassword: {
      alignSelf: 'flex-end',
      marginBottom: theme.spacing.sm,
    },
    button: {
      marginTop: theme.spacing.sm,
    },
    registerContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: theme.spacing.xl,
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
  });
