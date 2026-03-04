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
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { NotificationToast } from '../src/components/slices';
import { useUserAuthStore } from '../src/stores/userAuthStore';
import { useCategoriesStore } from '../src/stores/categoriesStore';
import { useListingsStore } from '../src/stores/listingsStore';
import { useCurrencyStore } from '../src/stores/currencyStore';
import { useLanguageStore } from '../src/stores/languageStore';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

/**
 * Configure RTL based on language
 * Note: On Android, RTL changes require an app restart to take effect.
 * This is set once and persisted by React Native.
 */
const configureRTL = (direction: 'rtl' | 'ltr'): void => {
  const shouldBeRTL = direction === 'rtl';

  if (I18nManager.isRTL !== shouldBeRTL) {
    I18nManager.allowRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);
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
 *
 * IMPORTANT: This guard should NOT redirect when:
 * 1. Auth is still loading (isLoading)
 * 2. User just completed registration (registrationComplete)
 * 3. User is on register page (to allow seeing success screen)
 */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, registrationComplete } = useUserAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // Wait for auth to initialize

    const inAuthGroup = segments[0] === 'auth';
    const onSignupSuccess = (segments as string[])[1] === 'signup-success';

    // Don't redirect if on signup-success page
    if (onSignupSuccess) {
      return;
    }

    // Don't redirect if registration just completed - let user see success screen
    if (registrationComplete) {
      return;
    }

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/auth/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to home if authenticated and in auth group
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments, registrationComplete]);

  // Don't render children until auth is initialized
  // This prevents crashes from components that depend on auth state
  if (isLoading) {
    return null;
  }

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
          <Stack.Screen
            name="chat"
            options={{
              headerShown: false,
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="create"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="webview"
            options={{
              headerShown: false,
              presentation: 'fullScreenModal',
            }}
          />
        </Stack>
      </AuthGuard>
      {/* Global notification toast - positioned after Stack so it appears on top */}
      <NotificationToast />
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
        // Load language preference first
        await useLanguageStore.getState().loadLanguage();

        // Configure RTL based on language (persisted, requires restart on Android)
        const direction = useLanguageStore.getState().direction;
        configureRTL(direction);

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
      <ErrorBoundary>
        <ThemeProvider defaultMode="light">
          <RootContent />
        </ThemeProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
