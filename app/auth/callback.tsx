/**
 * Auth Callback Screen
 * Handles OAuth redirect from Google/Facebook login
 * This screen receives the tokens from the URL and completes the authentication
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../src/theme';
import { Text } from '../../src/components/slices';
import { supabase } from '../../src/services/supabase';
import { useUserAuthStore } from '../../src/stores/userAuthStore';

export default function AuthCallbackScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { initialize, isAuthenticated } = useUserAuthStore();
  const [status, setStatus] = useState('جاري تسجيل الدخول...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setStatus('جاري التحقق من الجلسة...');

        // Small delay to ensure Supabase has processed the tokens
        await new Promise(resolve => setTimeout(resolve, 500));

        // Get current session (should be set by Supabase after OAuth)
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          setStatus('حدث خطأ في المصادقة');
          setTimeout(() => router.replace('/auth/login'), 1500);
          return;
        }

        if (session) {
          setStatus('جاري تحميل بيانات المستخدم...');
          // Session exists - reinitialize auth state
          await initialize();

          setStatus('تم تسجيل الدخول بنجاح!');
          // Small delay so user sees success message
          setTimeout(() => {
            // Navigate to tabs
            router.replace('/(tabs)');
          }, 500);
        } else {
          // No session - something went wrong
          console.error('No session after OAuth callback');
          setStatus('لم يتم العثور على جلسة');
          setTimeout(() => router.replace('/auth/login'), 1500);
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('حدث خطأ غير متوقع');
        setTimeout(() => router.replace('/auth/login'), 1500);
      }
    };

    handleCallback();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text variant="body" style={styles.text}>
        {status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  text: {
    marginTop: 16,
  },
});
