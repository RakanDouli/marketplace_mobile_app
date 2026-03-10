/**
 * Supabase Client for Shambay Mobile App
 * Handles authentication and realtime subscriptions
 */

import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import {
  GoogleSignin,
  statusCodes,
  isErrorWithCode,
} from '@react-native-google-signin/google-signin';
import { ENV } from '../constants/env';

// Configure Google Sign-In with Web Client ID
// IMPORTANT: Must use Web Client ID, not Android Client ID!
// The Web Client ID is configured in ENV.GOOGLE_WEB_CLIENT_ID
if (ENV.GOOGLE_WEB_CLIENT_ID) {
  GoogleSignin.configure({
    webClientId: ENV.GOOGLE_WEB_CLIENT_ID,
    offlineAccess: true,
  });
} else {
  console.warn('[Google Sign-In] GOOGLE_WEB_CLIENT_ID is not configured. Google Sign-In will not work.');
}

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
 * Sign in with Google using native @react-native-google-signin
 * Uses signInWithIdToken to authenticate with Supabase
 *
 * IMPORTANT: This requires:
 * 1. Web Client ID from Google Cloud Console (used in GoogleSignin.configure)
 * 2. Android Client ID with SHA-1 fingerprint (in google-services.json oauth_client)
 * 3. Google provider enabled in Supabase with Web Client ID
 */
export const signInWithGoogle = async (): Promise<{
  session: Session | null;
  user: User | null;
  error: Error | null;
}> => {
  try {
    // Check if Google Play Services are available (Android only)
    await GoogleSignin.hasPlayServices();

    // Trigger native Google Sign-In
    const response = await GoogleSignin.signIn();

    // Check if sign-in was successful and we have idToken
    if (response.type === 'success' && response.data?.idToken) {
      // Use Supabase signInWithIdToken to exchange Google ID token for Supabase session
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.data.idToken,
      });

      if (error) {
        console.error('[Google Sign-In] Supabase error:', error);
        return { session: null, user: null, error };
      }

      return { session: data.session, user: data.user, error: null };
    }

    // User cancelled the sign-in
    if (response.type === 'cancelled') {
      return {
        session: null,
        user: null,
        error: new Error('تم إلغاء تسجيل الدخول'),
      };
    }

    // No idToken received
    return {
      session: null,
      user: null,
      error: new Error('لم يتم استلام بيانات المصادقة من جوجل'),
    };
  } catch (error: any) {
    console.error('[Google Sign-In] Error:', error);

    // Handle specific Google Sign-In errors
    if (isErrorWithCode(error)) {
      switch (error.code) {
        case statusCodes.SIGN_IN_CANCELLED:
          return {
            session: null,
            user: null,
            error: new Error('تم إلغاء تسجيل الدخول'),
          };
        case statusCodes.IN_PROGRESS:
          return {
            session: null,
            user: null,
            error: new Error('عملية تسجيل الدخول جارية بالفعل'),
          };
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          return {
            session: null,
            user: null,
            error: new Error('خدمات Google Play غير متوفرة'),
          };
        default:
          return {
            session: null,
            user: null,
            error: new Error(error.message || 'فشل تسجيل الدخول بجوجل'),
          };
      }
    }

    return {
      session: null,
      user: null,
      error: error instanceof Error ? error : new Error('خطأ غير متوقع'),
    };
  }
};

export default supabase;
