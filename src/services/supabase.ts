/**
 * Supabase Client for Shambay Mobile App
 * Handles authentication and realtime subscriptions
 */

import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { ENV } from '../constants/env';

// Required for expo-auth-session to work properly
WebBrowser.maybeCompleteAuthSession();

// Custom storage adapter for Supabase using SecureStore for sensitive data
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      // Use SecureStore for tokens (more secure on mobile)
      const value = await SecureStore.getItemAsync(key);
      return value;
    } catch (error) {
      // Fallback to AsyncStorage if SecureStore fails
      return AsyncStorage.getItem(key);
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      // Fallback to AsyncStorage if SecureStore fails
      await AsyncStorage.setItem(key, value);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      await AsyncStorage.removeItem(key);
    }
  },
};

// Create Supabase client with custom storage
export const supabase: SupabaseClient = createClient(
  ENV.SUPABASE_URL,
  ENV.SUPABASE_ANON_KEY,
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // Not needed for mobile
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

/**
 * Get current session
 */
export const getSession = async (): Promise<Session | null> => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  return session;
};

/**
 * Get current user
 */
export const getUser = async (): Promise<User | null> => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting user:', error);
    return null;
  }
  return user;
};

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<{ session: Session | null; user: User | null; error: Error | null }> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { session: null, user: null, error };
  }

  return { session: data.session, user: data.user, error: null };
};

/**
 * Sign up with email and password
 */
export const signUpWithEmail = async (
  email: string,
  password: string,
  metadata?: Record<string, any>
): Promise<{ session: Session | null; user: User | null; error: Error | null }> => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });

  if (error) {
    return { session: null, user: null, error };
  }

  return { session: data.session, user: data.user, error: null };
};

/**
 * Send OTP code to email (for login or signup)
 * User will receive a 6-digit code via email
 */
export const sendEmailOtp = async (
  email: string,
  shouldCreateUser: boolean = false
): Promise<{ error: Error | null }> => {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser, // If true, creates user if doesn't exist
    },
  });

  return { error: error || null };
};

/**
 * Verify OTP code entered by user
 * Returns session if code is valid
 */
export const verifyEmailOtp = async (
  email: string,
  token: string
): Promise<{ session: Session | null; user: User | null; error: Error | null }> => {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });

  if (error) {
    return { session: null, user: null, error };
  }

  return { session: data.session, user: data.user, error: null };
};

/**
 * Resend OTP code to email
 */
export const resendEmailOtp = async (
  email: string
): Promise<{ error: Error | null }> => {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  });

  return { error: error || null };
};

/**
 * Sign out
 */
export const signOut = async (): Promise<{ error: Error | null }> => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

/**
 * Get access token for GraphQL requests
 */
export const getAccessToken = async (): Promise<string | null> => {
  const session = await getSession();
  return session?.access_token || null;
};

/**
 * Get both tokens for WebView auth
 */
export const getTokensForWebView = async (): Promise<{ accessToken: string; refreshToken: string } | null> => {
  const session = await getSession();
  if (!session?.access_token || !session?.refresh_token) {
    return null;
  }
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
  };
};

/**
 * Listen to auth state changes
 */
export const onAuthStateChange = (
  callback: (event: string, session: Session | null) => void
) => {
  return supabase.auth.onAuthStateChange(callback);
};

/**
 * Sign in with Google OAuth using expo-auth-session
 * This works in Expo Go and development builds
 */
export const signInWithGoogle = async (): Promise<{
  session: Session | null;
  user: User | null;
  error: Error | null;
}> => {
  try {
    // Create redirect URL for Expo
    const redirectUrl = AuthSession.makeRedirectUri({
      // Use native scheme in production builds
      // Use Expo proxy in development (Expo Go)
      native: 'shambay://auth/callback',
    });

    // Construct the OAuth URL with Supabase
    const authUrl = `${ENV.SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUrl)}`;

    // Open browser for OAuth
    const result = await WebBrowser.openAuthSessionAsync(
      authUrl,
      redirectUrl
    );

    if (result.type === 'success' && result.url) {
      // Extract the tokens from the URL
      const url = new URL(result.url);

      // Check for hash fragment (Supabase returns tokens in hash)
      const hashParams = new URLSearchParams(url.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (accessToken && refreshToken) {
        // Set the session in Supabase
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          return { session: null, user: null, error };
        }

        return { session: data.session, user: data.user, error: null };
      }

      // Check for error in URL
      const errorCode = hashParams.get('error');
      const errorDescription = hashParams.get('error_description');
      if (errorCode) {
        return {
          session: null,
          user: null,
          error: new Error(errorDescription || errorCode),
        };
      }

      return {
        session: null,
        user: null,
        error: new Error('لم يتم استلام بيانات المصادقة'),
      };
    }

    if (result.type === 'cancel' || result.type === 'dismiss') {
      return {
        session: null,
        user: null,
        error: new Error('تم إلغاء تسجيل الدخول'),
      };
    }

    return {
      session: null,
      user: null,
      error: new Error('فشل تسجيل الدخول بجوجل'),
    };
  } catch (error: any) {
    console.error('Google OAuth error:', error);
    return {
      session: null,
      user: null,
      error: error instanceof Error ? error : new Error('خطأ غير متوقع'),
    };
  }
};

export default supabase;
