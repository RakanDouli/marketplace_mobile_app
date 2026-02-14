/**
 * User Authentication Store
 * Zustand store for managing user authentication state
 */

import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import {
  supabase,
  getSession,
  getUser,
  signInWithEmail,
  signUpWithEmail,
  signOut as supabaseSignOut,
  onAuthStateChange,
} from '../services/supabase';

// =============================================================================
// TYPES
// =============================================================================

interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  avatar?: string | null;
  status: string;
  accountType: string;
  createdAt: string;
}

interface UserAuthState {
  // State
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
}

// =============================================================================
// STORE
// =============================================================================

export const useUserAuthStore = create<UserAuthState>((set, get) => ({
  // Initial state
  user: null,
  session: null,
  profile: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  /**
   * Initialize auth state on app start
   */
  initialize: async () => {
    try {
      set({ isLoading: true, error: null });

      // Get current session
      const session = await getSession();

      if (session) {
        const user = await getUser();
        set({
          session,
          user,
          isAuthenticated: true,
          isLoading: false,
        });

        // TODO: Fetch full profile from GraphQL
        // const profile = await fetchUserProfile(user.id);
        // set({ profile });
      } else {
        set({
          session: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }

      // Listen for auth state changes
      onAuthStateChange((event, session) => {
        console.log('[Auth] State changed:', event);

        if (event === 'SIGNED_IN' && session) {
          set({
            session,
            user: session.user,
            isAuthenticated: true,
          });
        } else if (event === 'SIGNED_OUT') {
          set({
            session: null,
            user: null,
            profile: null,
            isAuthenticated: false,
          });
        } else if (event === 'TOKEN_REFRESHED' && session) {
          set({ session });
        }
      });
    } catch (error: any) {
      console.error('[Auth] Initialize error:', error);
      set({
        error: error.message || 'فشل في تحميل بيانات المستخدم',
        isLoading: false,
      });
    }
  },

  /**
   * Sign in with email and password
   */
  signIn: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });

      const { session, user, error } = await signInWithEmail(email, password);

      if (error) {
        set({ isLoading: false, error: error.message });
        return { success: false, error: error.message };
      }

      set({
        session,
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      return { success: true };
    } catch (error: any) {
      const message = error.message || 'فشل في تسجيل الدخول';
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  /**
   * Sign up with email, password, and name
   */
  signUp: async (email: string, password: string, name: string) => {
    try {
      set({ isLoading: true, error: null });

      const { session, user, error } = await signUpWithEmail(email, password, {
        full_name: name,
      });

      if (error) {
        set({ isLoading: false, error: error.message });
        return { success: false, error: error.message };
      }

      // If email confirmation is required, user will need to verify
      if (!session) {
        set({ isLoading: false });
        return {
          success: true,
          // Message: Check your email for verification link
        };
      }

      set({
        session,
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      return { success: true };
    } catch (error: any) {
      const message = error.message || 'فشل في إنشاء الحساب';
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  /**
   * Sign out
   */
  signOut: async () => {
    try {
      set({ isLoading: true });
      await supabaseSignOut();
      set({
        session: null,
        user: null,
        profile: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error: any) {
      console.error('[Auth] Sign out error:', error);
      // Still clear state even if sign out fails
      set({
        session: null,
        user: null,
        profile: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  /**
   * Request password reset email
   */
  resetPassword: async (email: string) => {
    try {
      set({ isLoading: true, error: null });

      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        set({ isLoading: false, error: error.message });
        return { success: false, error: error.message };
      }

      set({ isLoading: false });
      return { success: true };
    } catch (error: any) {
      const message = error.message || 'فشل في إرسال رابط استعادة كلمة المرور';
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (updates: Partial<UserProfile>) => {
    try {
      set({ isLoading: true, error: null });

      // TODO: Call GraphQL mutation to update profile
      // const result = await updateUserProfile(updates);

      // For now, just update local state
      const currentProfile = get().profile;
      if (currentProfile) {
        set({
          profile: { ...currentProfile, ...updates },
          isLoading: false,
        });
      }

      return { success: true };
    } catch (error: any) {
      const message = error.message || 'فشل في تحديث الملف الشخصي';
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  /**
   * Clear error state
   */
  clearError: () => {
    set({ error: null });
  },
}));

export default useUserAuthStore;
