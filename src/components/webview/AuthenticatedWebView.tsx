/**
 * AuthenticatedWebView Component
 *
 * Displays web pages from the Shambay web app with automatic authentication.
 * Uses JavaScript injection to set Supabase session in localStorage before page loads.
 *
 * Flow:
 * 1. Mobile gets full session from Supabase
 * 2. Injects session into WebView's localStorage via injectedJavaScriptBeforeContentLoaded
 * 3. Page loads with session already in localStorage
 * 4. Supabase on web app reads session from localStorage - user is authenticated
 *
 * Benefits:
 * - No tokens in URL (more secure)
 * - No redirect needed
 * - Session available immediately when page loads
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Pressable, Platform } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { ArrowLeft, ArrowRight, RefreshCw, X, ExternalLink } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme, Theme } from '../../theme';
import { Text } from '../slices';
import { getSession } from '../../services/supabase';
import { ENV } from '../../constants/env';

interface AuthenticatedWebViewProps {
  /** The path on the web app (e.g., '/advertise', '/user-subscriptions') */
  path: string;
  /** Title to show in the header */
  title: string;
  /** Whether authentication is required for this page */
  requiresAuth?: boolean;
  /** Callback when WebView finishes loading */
  onLoadEnd?: () => void;
  /** Callback when WebView has an error */
  onError?: (error: string) => void;
}

export const AuthenticatedWebView: React.FC<AuthenticatedWebViewProps> = ({
  path,
  title,
  requiresAuth = true,
  onLoadEnd,
  onError,
}) => {
  const theme = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [webViewUrl, setWebViewUrl] = useState<string | null>(null);
  const [injectedJS, setInjectedJS] = useState<string | null>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  // Build the URL and prepare auth injection
  useEffect(() => {
    const buildUrl = async () => {
      try {
        if (requiresAuth) {
          // Get the full session from Supabase
          const session = await getSession();


          if (!session) {
            setLoadError('يرجى تسجيل الدخول أولاً');
            setIsLoading(false);
            return;
          }

          // Build the Supabase storage key (matches what web app uses)
          // Format: sb-{project-ref}-auth-token
          const supabaseRef = ENV.SUPABASE_URL.replace('https://', '').split('.')[0];
          const storageKey = `sb-${supabaseRef}-auth-token`;

          // Supabase v2 localStorage format - store the session directly
          // This matches what @supabase/supabase-js stores
          const sessionData = {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at,
            expires_in: session.expires_in,
            token_type: session.token_type || 'bearer',
            user: session.user,
          };

          // JavaScript to inject AFTER content loads
          // This sets the session in localStorage and then reloads
          const jsCode = `
            (function() {
              try {
                var storageKey = '${storageKey}';
                var sessionData = ${JSON.stringify(sessionData)};
                var sessionString = JSON.stringify(sessionData);

                // Check if we already set the session (use a flag to prevent loops)
                var injectionFlag = 'shambay_mobile_session_injected';
                if (sessionStorage.getItem(injectionFlag)) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'log',
                    message: 'Session already injected, skipping'
                  }));

                  // Check if user is logged in
                  var stored = localStorage.getItem(storageKey);
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'log',
                    message: 'Stored session exists: ' + !!stored
                  }));
                  return;
                }

                // Set the session in localStorage
                localStorage.setItem(storageKey, sessionString);

                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'log',
                  message: 'Session saved to localStorage with key: ' + storageKey
                }));

                // Mark that we've injected (use sessionStorage so it clears on tab close)
                sessionStorage.setItem(injectionFlag, 'true');

                // Instead of reloading, redirect to the same URL with a cache-bust
                // This forces a fresh page load where Supabase will read from localStorage
                var currentUrl = window.location.href;
                var separator = currentUrl.includes('?') ? '&' : '?';
                var newUrl = currentUrl + separator + '_t=' + Date.now();

                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'log',
                  message: 'Redirecting to: ' + newUrl
                }));

                window.location.href = newUrl;

              } catch (e) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'error',
                  message: 'Failed to inject: ' + e.message
                }));
              }
            })();
            true;
          `;

          setInjectedJS(jsCode);
        }

        // Build the target URL
        const url = `${ENV.WEB_URL}${path}`;
        setWebViewUrl(url);
      } catch (error) {
        setLoadError('حدث خطأ في تحميل الصفحة');
        setIsLoading(false);
      }
    };

    buildUrl();
  }, [path, requiresAuth]);

  // Handle navigation state changes
  const handleNavigationStateChange = useCallback((navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    setCurrentUrl(navState.url);
  }, []);

  // Handle load start
  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    setLoadError(null);
  }, []);

  // Handle load end
  const handleLoadEnd = useCallback(() => {
    setIsLoading(false);
    onLoadEnd?.();
  }, [onLoadEnd]);

  // Handle error
  const handleError = useCallback((syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    setLoadError('فشل في تحميل الصفحة');
    setIsLoading(false);
    onError?.(nativeEvent.description || 'Unknown error');
  }, [onError]);

  // Handle messages from WebView (for debugging)
  const handleMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'log') {
      } else if (data.type === 'error') {
      }
    } catch (e) {
    }
  }, []);

  // Navigation actions
  const goBack = useCallback(() => {
    if (canGoBack) {
      webViewRef.current?.goBack();
    } else {
      router.back();
    }
  }, [canGoBack, router]);

  const goForward = useCallback(() => {
    if (canGoForward) {
      webViewRef.current?.goForward();
    }
  }, [canGoForward]);

  const reload = useCallback(() => {
    setLoadError(null);
    setIsLoading(true);
    webViewRef.current?.reload();
  }, []);

  const close = useCallback(() => {
    router.back();
  }, [router]);

  // Render error state
  if (loadError) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={close} style={styles.headerButton}>
            <X size={24} color={theme.colors.text} />
          </Pressable>
          <Text variant="h4" style={styles.headerTitle}>{title}</Text>
          <View style={styles.headerButton} />
        </View>

        <View style={styles.errorContainer}>
          <ExternalLink size={48} color={theme.colors.textMuted} />
          <Text variant="h4" color="secondary" style={styles.errorTitle}>
            {loadError}
          </Text>
          <Pressable onPress={reload} style={styles.retryButton}>
            <RefreshCw size={20} color={theme.colors.primary} />
            <Text variant="paragraph" color="primary">
              إعادة المحاولة
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Wait for URL to be built
  if (!webViewUrl) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={close} style={styles.headerButton}>
            <X size={24} color={theme.colors.text} />
          </Pressable>
          <Text variant="h4" style={styles.headerTitle}>{title}</Text>
          <View style={styles.headerButton} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="paragraph" color="secondary" style={styles.loadingText}>
            جاري التحميل...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={close} style={styles.headerButton}>
          <X size={24} color={theme.colors.text} />
        </Pressable>
        <Text variant="h4" style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        <Pressable onPress={reload} style={styles.headerButton}>
          <RefreshCw size={20} color={theme.colors.text} />
        </Pressable>
      </View>

      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: webViewUrl }}
        style={styles.webView}
        onNavigationStateChange={handleNavigationStateChange}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        onMessage={handleMessage}
        // Inject session into localStorage AFTER content loads
        // This ensures localStorage is accessible and then reloads once
        injectedJavaScript={injectedJS || undefined}
        // Enable JavaScript
        javaScriptEnabled={true}
        // Enable DOM storage for session persistence
        domStorageEnabled={true}
        // Allow mixed content (http in https)
        mixedContentMode="compatibility"
        // Share cookies with app
        sharedCookiesEnabled={true}
        // Third party cookies for Supabase
        thirdPartyCookiesEnabled={true}
        // Disable HTTP caching to get fresh JS bundles
        cacheEnabled={false}
        // User agent to identify mobile app
        userAgent={`ShambayMobile/${ENV.APP_VERSION} (${Platform.OS})`}
        // Allow file access for uploads
        allowFileAccess={true}
        // Scale page to fit
        scalesPageToFit={true}
        // Start in overview mode
        startInLoadingState={true}
        // Render loading indicator
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}
      />

      {/* Bottom navigation bar */}
      <View style={styles.bottomBar}>
        <Pressable
          onPress={goBack}
          style={[styles.navButton, !canGoBack && styles.navButtonDisabled]}
          disabled={!canGoBack && !router.canGoBack()}
        >
          <ArrowLeft size={24} color={canGoBack ? theme.colors.text : theme.colors.textMuted} />
        </Pressable>

        <Pressable
          onPress={goForward}
          style={[styles.navButton, !canGoForward && styles.navButtonDisabled]}
          disabled={!canGoForward}
        >
          <ArrowRight size={24} color={canGoForward ? theme.colors.text : theme.colors.textMuted} />
        </Pressable>
      </View>
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingStart: theme.spacing.sm,
      paddingEnd: theme.spacing.sm,
      paddingVertical: theme.spacing.sm,
      backgroundColor: theme.colors.bg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      paddingTop: Platform.OS === 'ios' ? 50 : theme.spacing.sm,
    },
    headerButton: {
      padding: theme.spacing.sm,
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
    },
    webView: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 100,
    },
    loadingText: {
      marginTop: theme.spacing.md,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    errorTitle: {
      marginTop: theme.spacing.md,
      textAlign: 'center',
    },
    retryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.lg,
      padding: theme.spacing.md,
    },
    bottomBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-evenly',
      paddingVertical: theme.spacing.sm,
      paddingStart: theme.spacing.lg,
      paddingEnd: theme.spacing.lg,
      backgroundColor: theme.colors.bg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingBottom: Platform.OS === 'ios' ? 30 : theme.spacing.sm,
    },
    navButton: {
      padding: theme.spacing.sm,
    },
    navButtonDisabled: {
      opacity: 0.5,
    },
  });

export default AuthenticatedWebView;
