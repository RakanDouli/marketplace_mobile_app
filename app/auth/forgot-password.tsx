/**
 * Forgot Password Screen
 */

import React, { useState } from 'react';
import { View, StyleSheet, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { useTheme } from '../../src/theme';
import { Text } from '../../src/components/ui/Text';
import { Button } from '../../src/components/ui/Button';
import { useUserAuthStore } from '../../src/stores/userAuthStore';

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { resetPassword, isLoading, error } = useUserAuthStore();

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    try {
      await resetPassword(email);
      setSent(true);
    } catch (e) {
      console.error('Reset failed:', e);
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
          {/* Back Button */}
          <Button
            variant="ghost"
            onPress={() => router.back()}
            icon={<ArrowRight size={20} color={theme.colors.text} />}
            style={styles.backButton}
          >
            رجوع
          </Button>

          <Text variant="h3" center style={styles.title}>نسيت كلمة المرور؟</Text>
          <Text variant="paragraph" center color="secondary" style={styles.subtitle}>
            أدخل بريدك الإلكتروني وسنرسل لك رابط لإعادة تعيين كلمة المرور
          </Text>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text variant="small" style={{ color: theme.colors.error }}>{error}</Text>
            </View>
          )}

          {/* Success Message */}
          {sent && (
            <View style={styles.successContainer}>
              <Text variant="small" style={{ color: theme.colors.success }}>
                تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني
              </Text>
            </View>
          )}

          {/* Form */}
          {!sent && (
            <View style={styles.form}>
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

              <Button
                onPress={handleReset}
                loading={isLoading}
                style={styles.button}
              >
                إرسال رابط الاستعادة
              </Button>
            </View>
          )}

          {sent && (
            <Button
              onPress={() => router.replace('/auth/login')}
              style={styles.button}
            >
              العودة لتسجيل الدخول
            </Button>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: theme.spacing.lg, justifyContent: 'center' },
  backButton: { alignSelf: 'flex-start', marginBottom: theme.spacing.lg },
  title: { marginBottom: theme.spacing.xs },
  subtitle: { marginBottom: theme.spacing.xl },
  errorContainer: { backgroundColor: theme.colors.errorLight, padding: theme.spacing.md, borderRadius: theme.radius.md, marginBottom: theme.spacing.md },
  successContainer: { backgroundColor: theme.colors.successLight, padding: theme.spacing.md, borderRadius: theme.radius.md, marginBottom: theme.spacing.md },
  form: { gap: theme.spacing.md },
  inputContainer: { gap: theme.spacing.xs },
  label: { color: theme.colors.text, fontWeight: '500' },
  input: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: theme.spacing.md, fontSize: 16, color: theme.colors.text },
  button: { marginTop: theme.spacing.sm },
});
