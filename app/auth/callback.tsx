/**
 * Auth Callback Screen
 * Handles OAuth redirect from Google/Facebook login
 * This screen receives the tokens from the URL and completes the authentication
 */

import React, { useEffect } from 'react';
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
  const { initialize } = useUserAuthStore();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // The tokens should already be set by the WebBrowser.openAuthSessionAsync
        // but we can also check URL params if needed

        // Get current session (should be set by Supabase after OAuth)
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          router.replace('/auth/login');
          return;
        }

        if (session) {
          // Session exists - reinitialize auth state
          await initialize();
          // Navigate to home
          router.replace('/');
        } else {
          // No session - something went wrong
          console.error('No session after OAuth callback');
          router.replace('/auth/login');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        router.replace('/auth/login');
      }
    };

    handleCallback();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text variant="body" style={styles.text}>
        جاري تسجيل الدخول...
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
