/**
 * Signup Success Screen
 * Simple confirmation page after registration
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CheckCircle } from 'lucide-react-native';
import { useTheme } from '../../src/theme';
import { Text, Button } from '../../src/components/slices';
import { LogoIcon } from '../../src/components/icons';
import { useUserAuthStore } from '../../src/stores/userAuthStore';

export default function SignupSuccessScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const { clearRegistrationState } = useUserAuthStore();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleGoToLogin = () => {
    clearRegistrationState();
    router.replace('/auth/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo Header */}
        <View style={styles.logoContainer}>
          <Text variant="h2" style={styles.logoTextAr}>شام باي</Text>
          <View style={styles.logoIcon}>
            <LogoIcon width={28} height={28} color={theme.colors.textInverse} />
          </View>
          <Text variant="h2" style={styles.logoTextEn}>Shambay</Text>
        </View>

        {/* Success Card */}
        <View style={styles.card}>
          <CheckCircle size={56} color={theme.colors.success} />

          <Text variant="h3" style={styles.title}>
            تم إرسال رابط التأكيد
          </Text>

          <Text variant="paragraph" center color="secondary" style={styles.message}>
            يرجى التحقق من بريدك الإلكتروني{email ? ` (${email})` : ''} والضغط على الرابط لتأكيد حسابك، ثم قم بتسجيل الدخول.
          </Text>

          <Button
            variant="primary"
            onPress={handleGoToLogin}
            style={styles.button}
          >
            تسجيل الدخول
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.bgPrimary,
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
      alignItems: 'center',
      padding: theme.spacing.xl,
      backgroundColor: theme.colors.bg,
      borderRadius: theme.radius.xl,
    },
    title: {
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      textAlign: 'center',
    },
    message: {
      marginBottom: theme.spacing.lg,
    },
    button: {
      width: '100%',
    },
  });
