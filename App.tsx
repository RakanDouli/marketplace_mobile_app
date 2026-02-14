/**
 * Shambay Mobile App
 * Arabic marketplace app with full RTL support
 */

import React, { useEffect, useState, useCallback } from 'react';
import { I18nManager, StatusBar, View, StyleSheet, Text as RNText } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';

import { ThemeProvider, useTheme } from './src/theme';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

/**
 * Configure RTL for Arabic
 * Must be done before app renders
 */
const configureRTL = () => {
  // Only change if not already RTL
  if (!I18nManager.isRTL) {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(true);
    // Note: In development, you may need to reload the app manually
    // In production, this will automatically reload
    console.log('RTL configured. Reload the app if RTL is not applied.');
  }
};

/**
 * Check if custom fonts exist
 */
const fontsExist = (): boolean => {
  try {
    // Try to require fonts - this will throw if they don't exist
    require('./assets/fonts/Rubik-Regular.ttf');
    return true;
  } catch {
    return false;
  }
};

/**
 * Load custom fonts (if they exist)
 */
const loadFonts = async (): Promise<boolean> => {
  if (!fontsExist()) {
    console.log('Custom fonts not found. Using system fonts.');
    return false;
  }

  try {
    await Font.loadAsync({
      // Beiruti font family (Arabic headers)
      'Beiruti-Regular': require('./assets/fonts/Beiruti-Regular.ttf'),
      'Beiruti-SemiBold': require('./assets/fonts/Beiruti-SemiBold.ttf'),
      'Beiruti-Bold': require('./assets/fonts/Beiruti-Bold.ttf'),

      // Rubik font family (Arabic body)
      'Rubik-Regular': require('./assets/fonts/Rubik-Regular.ttf'),
      'Rubik-Medium': require('./assets/fonts/Rubik-Medium.ttf'),
      'Rubik-SemiBold': require('./assets/fonts/Rubik-SemiBold.ttf'),
      'Rubik-Bold': require('./assets/fonts/Rubik-Bold.ttf'),
    });
    return true;
  } catch (error) {
    console.log('Error loading fonts:', error);
    return false;
  }
};

/**
 * Main App Component
 */
function AppContent({ customFontsLoaded }: { customFontsLoaded: boolean }) {
  const theme = useTheme();

  // Use custom fonts if available, otherwise use system font
  const headerFont = customFontsLoaded ? 'Beiruti-Bold' : undefined;
  const bodyFont = customFontsLoaded ? 'Rubik-Regular' : undefined;
  const mediumFont = customFontsLoaded ? 'Rubik-Medium' : undefined;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.bg}
      />

      {/* Placeholder - Navigation will go here */}
      <View style={styles.placeholder}>
        <RNText style={[
          styles.title,
          { color: theme.colors.text },
          headerFont && { fontFamily: headerFont }
        ]}>
          شمباي
        </RNText>
        <RNText style={[
          styles.subtitle,
          { color: theme.colors.textSecondary },
          bodyFont && { fontFamily: bodyFont }
        ]}>
          السوق السوري الأول
        </RNText>
        <View style={[styles.statusBadge, { backgroundColor: theme.colors.successLight }]}>
          <RNText style={[
            styles.rtlTest,
            { color: theme.colors.success },
            mediumFont && { fontFamily: mediumFont }
          ]}>
            {I18nManager.isRTL ? '✓ RTL مُفعّل' : '⟲ أعد تشغيل التطبيق'}
          </RNText>
        </View>
        {!customFontsLoaded && (
          <RNText style={[styles.fontNote, { color: theme.colors.textMuted }]}>
            (باستخدام خطوط النظام)
          </RNText>
        )}
      </View>
    </View>
  );
}

/**
 * Root App with Providers
 */
export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [customFontsLoaded, setCustomFontsLoaded] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Configure RTL first
        configureRTL();

        // Try to load fonts (will fallback to system fonts if not available)
        const fontsLoaded = await loadFonts();
        setCustomFontsLoaded(fontsLoaded);

      } catch (error) {
        console.error('Error during app initialization:', error);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // Hide splash screen
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null; // Still showing splash screen
  }

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <ThemeProvider defaultMode="light">
        <NavigationContainer>
          <AppContent customFontsLoaded={customFontsLoaded} />
        </NavigationContainer>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 24,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  rtlTest: {
    fontSize: 16,
    fontWeight: '500',
    writingDirection: 'rtl',
  },
  fontNote: {
    fontSize: 12,
    marginTop: 16,
    writingDirection: 'rtl',
  },
});
