/**
 * WebView Screen
 *
 * Generic screen that opens web pages from the Shambay web app.
 * Receives URL path and title via query params.
 *
 * NOTE: This screen is outside (tabs) so the bottom tab bar is hidden.
 *
 * Usage:
 *   router.push('/webview?path=/advertise&title=الإعلانات')
 *   router.push('/webview?path=/privacy&title=سياسة الخصوصية&auth=false')
 */

import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { AuthenticatedWebView } from '../src/components/webview';

export default function WebViewScreen() {
  const params = useLocalSearchParams<{
    path: string;
    title: string;
    auth?: string;
  }>();

  // Default values
  const path = params.path || '/';
  const title = params.title || 'شنباي';
  const requiresAuth = params.auth !== 'false'; // Default to true

  return (
    <AuthenticatedWebView
      path={path}
      title={title}
      requiresAuth={requiresAuth}
    />
  );
}
