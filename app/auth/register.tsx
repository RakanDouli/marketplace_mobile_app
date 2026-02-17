/**
 * Register Screen
 */

import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import { useTheme } from '../../src/theme';
import { Text } from '../../src/components/ui/Text';
import { Button } from '../../src/components/ui/Button';
import { LogoIcon } from '../../src/components/ui/LogoIcon';
import { useUserAuthStore } from '../../src/stores/userAuthStore';

export default function RegisterScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { signUp, isLoading, error } = useUserAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      console.error('Passwords do not match');
      return;
    }
    try {
      await signUp(email, password, name);
      router.replace('/(tabs)');
    } catch (e) {
      console.error('Registration failed:', e);
    }
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text variant="small" style={{ color: theme.colors.error }}>{error}</Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text variant="small" style={styles.label}>الاسم الكامل</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="اسمك الكامل"
                placeholderTextColor={theme.colors.textMuted}
                autoCapitalize="words"
                textAlign="right"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text variant="small" style={styles.label}>البريد الإلكتروني</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="example@email.com"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textAlign="right"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text variant="small" style={styles.label}>كلمة المرور</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={theme.colors.textMuted}
                secureTextEntry
                textAlign="right"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text variant="small" style={styles.label}>تأكيد كلمة المرور</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                placeholderTextColor={theme.colors.textMuted}
                secureTextEntry
                textAlign="right"
              />
            </View>

            <Button
              onPress={handleRegister}
              loading={isLoading}
              style={styles.button}
            >
              إنشاء حساب
            </Button>
          </View>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text variant="paragraph" color="secondary">لديك حساب بالفعل؟ </Text>
            <Link href="/auth/login" asChild>
              <TouchableOpacity>
                <Text variant="paragraph" style={{ color: theme.colors.primary }}>سجل دخولك</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: theme.spacing.lg, justifyContent: 'center' },
  logoContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.xl },
  logoIcon: { width: 48, height: 48, borderRadius: theme.radius.md, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
  title: { marginBottom: theme.spacing.xs },
  subtitle: { marginBottom: theme.spacing.xl },
  errorContainer: { backgroundColor: theme.colors.errorLight, padding: theme.spacing.md, borderRadius: theme.radius.md, marginBottom: theme.spacing.md },
  form: { gap: theme.spacing.md },
  inputContainer: { gap: theme.spacing.xs },
  label: { color: theme.colors.text, fontWeight: '500' },
  input: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: theme.spacing.md, fontSize: 16, color: theme.colors.text },
  button: { marginTop: theme.spacing.sm },
  loginContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: theme.spacing.xl },
});
