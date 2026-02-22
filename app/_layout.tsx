/**
 * Root Layout
 * Entry point for Expo Router - handles fonts, providers, and auth
 */

import React, { useEffect, useState, useCallback } from 'react';
import { I18nManager, StatusBar, View, Platform } from 'react-native';
import { Stack, useSegments, useRouter } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';

import { ThemeProvider, useTheme } from '../src/theme';
import { useUserAuthStore } from '../src/stores/userAuthStore';
import { useCategoriesStore } from '../src/stores/categoriesStore';
import { useListingsStore } from '../src/stores/listingsStore';
import { useCurrencyStore } from '../src/stores/currencyStore';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

/**
 * Configure RTL for Arabic
 * Note: On Android, RTL changes require an app restart to take effect.
 * This is set once and persisted by React Native.
 */
const configureRTL = (): void => {
  // Always force RTL for Arabic app
  if (!I18nManager.isRTL) {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(true);
    // RTL will take effect after app restart on Android
    // On iOS, it takes effect immediately
  }
};

/**
 * Load custom fonts from @expo-google-fonts packages
 */
const loadFonts = async (): Promise<boolean> => {
  try {
    await Font.loadAsync({
      // Beiruti - headers
      'Beiruti-Regular': require('@expo-google-fonts/beiruti/400Regular/Beiruti_400Regular.ttf'),
      'Beiruti-SemiBold': require('@expo-google-fonts/beiruti/600SemiBold/Beiruti_600SemiBold.ttf'),
      'Beiruti-Bold': require('@expo-google-fonts/beiruti/700Bold/Beiruti_700Bold.ttf'),
      // Rubik - body text
      'Rubik-Regular': require('@expo-google-fonts/rubik/400Regular/Rubik_400Regular.ttf'),
      'Rubik-Medium': require('@expo-google-fonts/rubik/500Medium/Rubik_500Medium.ttf'),
      'Rubik-SemiBold': require('@expo-google-fonts/rubik/600SemiBold/Rubik_600SemiBold.ttf'),
      'Rubik-Bold': require('@expo-google-fonts/rubik/700Bold/Rubik_700Bold.ttf'),
    });
    console.log('Custom fonts loaded successfully.');
    return true;
  } catch (error) {
    console.log('Error loading fonts:', error);
    return false;
  }
};

/**
 * Auth guard - redirects based on auth state
 */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useUserAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // Wait for auth to initialize

    const inAuthGroup = segments[0] === 'auth';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/auth/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to home if authenticated and in auth group
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

  return <>{children}</>;
}

/**
 * Inner content with theme access
 */
function RootContent() {
  const theme = useTheme();

  // Use fade animation on Android to avoid RTL animation issues
  // iOS handles RTL animations correctly with slide
  const animation = Platform.OS === 'android' ? 'fade' : 'slide_from_right';

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.bg}
      />
      <AuthGuard>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.bg },
            headerStyle: { backgroundColor: theme.colors.bg },
            headerTintColor: theme.colors.primary,
            headerTitleStyle: {
              fontFamily: theme.fontFamily.header,
              color: theme.colors.text,
            },
            headerTitleAlign: 'center',
            // Native back button: arrow only, no text
            headerBackButtonDisplayMode: 'minimal',
            // RTL-safe animation
            animation: animation,
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen
            name="listing/[id]"
            options={{
              headerShown: true,
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="seller/[id]"
            options={{
              headerShown: true,
              presentation: 'card',
            }}
          />
        </Stack>
      </AuthGuard>
    </View>
  );
}

/**
 * Root Layout Component
 */
export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const initialize = useUserAuthStore((state) => state.initialize);

  useEffect(() => {
    async function prepare() {
      try {
        // Configure RTL first (persisted, requires restart on Android)
        configureRTL();

        // Load fonts
        await loadFonts();

        // Initialize auth state
        await initialize();

        // Prefetch essential data during splash
        await Promise.all([
          useCategoriesStore.getState().fetchCategories(),
          useListingsStore.getState().fetchFeaturedListings(),
          useListingsStore.getState().fetchListings({}, 1),
          // Load currency preferences and exchange rates
          useCurrencyStore.getState().loadPreferredCurrency(),
          useCurrencyStore.getState().fetchExchangeRates(),
        ]);
      } catch (error) {
        console.error('Error during app initialization:', error);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, [initialize]);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <ThemeProvider defaultMode="light">
        <RootContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
