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
  sendEmailOtp,
  verifyEmailOtp,
  resendEmailOtp,
  signInWithGoogle as supabaseSignInWithGoogle,
} from '../services/supabase';
import { graphqlRequest } from '../services/graphql/client';
import { ME_QUERY, UPDATE_ME_MUTATION } from './userAuthStore/userAuthStore.gql';

// =============================================================================
// ERROR TRANSLATION
// =============================================================================

/**
 * Translate Supabase error messages to Arabic
 * Matches web frontend userAuthStore pattern
 */
const translateAuthError = (error: any): string => {
  const message = error?.message || error?.error_description || String(error);
  const messageLower = message.toLowerCase();

  // Invalid credentials
  if (
    messageLower.includes('invalid login credentials') ||
    messageLower.includes('invalid email or password') ||
    messageLower.includes('wrong password')
  ) {
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
  }

  // Email not confirmed
  if (messageLower.includes('email not confirmed')) {
    return 'يرجى تأكيد بريدك الإلكتروني أولاً';
  }

  // User already registered
  if (
    messageLower.includes('user already registered') ||
    messageLower.includes('email already in use')
  ) {
    return 'هذا البريد الإلكتروني مسجل مسبقاً';
  }

  // Password too short
  if (messageLower.includes('password should be at least')) {
    return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
  }

  // Invalid email format
  if (messageLower.includes('invalid email') || messageLower.includes('email format')) {
    return 'صيغة البريد الإلكتروني غير صحيحة';
  }

  // Rate limit
  if (messageLower.includes('rate limit') || messageLower.includes('too many requests')) {
    return 'محاولات كثيرة جداً، يرجى المحاولة لاحقاً';
  }

  // User not found
  if (messageLower.includes('user not found')) {
    return 'لم يتم العثور على حساب بهذا البريد الإلكتروني';
  }

  // User banned/suspended
  if (messageLower.includes('banned') || messageLower.includes('suspended')) {
    return 'تم إيقاف حسابك، يرجى التواصل مع الدعم';
  }

  // Network/connection errors
  if (
    messageLower.includes('network') ||
    messageLower.includes('fetch') ||
    messageLower.includes('connection') ||
    messageLower.includes('timeout')
  ) {
    return 'خطأ في الاتصال بالخادم، يرجى التحقق من اتصالك بالإنترنت';
  }

  // Default: return original message or generic error
  return message || 'حدث خطأ غير متوقع';
};

// =============================================================================
// USER STATUS VALIDATION
// =============================================================================

/**
 * Validate user status (banned/suspended) and throw appropriate error
 *
 * Strike System:
 * - Strike 1: warningCount=1, status=ACTIVE → User can login, sees WarningBanner
 * - Strike 2: warningCount=2, status=SUSPENDED → Blocked here until bannedUntil date
 * - Strike 3: warningCount>=3, status=BANNED → Permanently blocked here
 */
const validateUserStatus = async (
  user: { status: string; bannedUntil?: string | null; banReason?: string | null },
  signOutFn: () => Promise<void>
): Promise<void> => {
  // Normalize status to lowercase for comparison (backend returns lowercase)
  const status = user.status?.toLowerCase();

  // Check BANNED first (most severe - permanent)
  if (status === 'banned') {
    await signOutFn();
    throw new Error('تم حظر حسابك نهائياً. يرجى التواصل مع الإدارة');
  }

  // Check for suspension (Strike 2 - temporary ban)
  if (status === 'suspended') {
    await signOutFn();
    const suspensionEnd = user.bannedUntil ? new Date(user.bannedUntil) : null;
    if (suspensionEnd) {
      const daysRemaining = Math.ceil((suspensionEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      throw new Error(`حسابك موقوف مؤقتاً حتى ${suspensionEnd.toLocaleDateString('ar-SA')} (${daysRemaining > 0 ? daysRemaining : 1} أيام متبقية). السبب: ${user.banReason || 'مخالفة السياسات'}`);
    }
    throw new Error(`حسابك موقوف مؤقتاً. السبب: ${user.banReason || 'مخالفة السياسات'}`);
  }
};

// =============================================================================
// TYPES
// =============================================================================

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  avatar?: string | null;
  status: string;
  accountType: string;
  createdAt: string;
  // Warning/ban system fields
  warningCount?: number;
  currentWarningMessage?: string | null;
  warningAcknowledged?: boolean;
  bannedUntil?: string | null;
  banReason?: string | null;
}

interface UserSubscription {
  id: string;
  name: string;
  title: string;
  description?: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxListings: number;
  maxImagesPerListing: number;
  videoAllowed: boolean;
  priorityPlacement: boolean;
  analyticsAccess: boolean;
  customBranding: boolean;
  featuredListings: number;
}

interface UserPackage {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  currentListings: number;
  userSubscription: UserSubscription;
}

interface UserAuthState {
  // State
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  userPackage: UserPackage | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // OTP State
  otpEmail: string | null; // Email waiting for OTP verification
  otpSent: boolean; // Whether OTP has been sent

  // Registration State
  registrationComplete: boolean; // Whether registration just completed (for showing success screen)
  registeredEmail: string | null; // Email that was just registered

  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
  clearRegistrationState: () => void;

  // OTP Actions
  sendOtp: (email: string, isSignup?: boolean) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (code: string) => Promise<{ success: boolean; error?: string }>;
  resendOtp: () => Promise<{ success: boolean; error?: string }>;
  clearOtpState: () => void;
}

// =============================================================================
// STORE
// =============================================================================

export const useUserAuthStore = create<UserAuthState>((set, get) => ({
  // Initial state
  user: null,
  session: null,
  profile: null,
  userPackage: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  // OTP initial state
  otpEmail: null,
  otpSent: false,

  // Registration initial state
  registrationComplete: false,
  registeredEmail: null,

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

        // Fetch full profile and subscription from GraphQL
        try {
          console.log('[Auth] Initialize: Fetching user profile...');
          const data = await graphqlRequest<{
            me: { user: UserProfile };
            myPackage: UserPackage | null;
          }>(ME_QUERY, {}, false);

          console.log('[Auth] Initialize: User status:', data?.me?.user?.status);

          if (data?.me?.user) {
            // Validate user status (banned/suspended check)
            await validateUserStatus(data.me.user, supabaseSignOut);

            // User is allowed - set all state
            set({
              session,
              user,
              isAuthenticated: true,
              isLoading: false,
              profile: data.me.user,
              userPackage: data.myPackage || null,
            });
          } else {
            // No profile found - sign out and clear state
            console.warn('[Auth] Initialize: No user profile found, signing out');
            await supabaseSignOut();
            set({
              session: null,
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (profileError: any) {
          console.error('[Auth] Initialize: Profile fetch error:', profileError?.message);

          // If validation throws (banned/suspended), sign out
          if (profileError?.message?.includes('حسابك')) {
            set({
              session: null,
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: profileError.message,
            });
          } else {
            // Other errors - sign out to be safe
            console.warn('[Auth] Initialize: Failed to fetch profile, signing out');
            await supabaseSignOut();
            set({
              session: null,
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        }
      } else {
        set({
          session: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }

      // Listen for auth state changes
      onAuthStateChange(async (event, session) => {
        console.log('[Auth] State changed:', event);

        // IMPORTANT: Don't interfere with registration flow
        // If registrationComplete is true, the user just signed up and is viewing success screen
        const currentState = get();
        if (currentState.registrationComplete) {
          console.log('[Auth] onAuthStateChange: Skipping - registration in progress');
          return;
        }

        if (event === 'SIGNED_IN' && session) {
          // Fetch profile and validate status for OAuth logins (Google, etc.)
          try {
            console.log('[Auth] onAuthStateChange: Fetching user profile...');
            const data = await graphqlRequest<{
              me: { user: UserProfile };
              myPackage: UserPackage | null;
            }>(ME_QUERY, {}, false);

            console.log('[Auth] onAuthStateChange: User status:', data?.me?.user?.status);

            if (data?.me?.user) {
              // Validate user status (banned/suspended check)
              await validateUserStatus(data.me.user, supabaseSignOut);

              set({
                session,
                user: session.user,
                isAuthenticated: true,
                profile: data.me.user,
                userPackage: data.myPackage || null,
              });
            } else {
              // No profile found - sign out
              console.warn('[Auth] onAuthStateChange: No user profile, signing out');
              await supabaseSignOut();
              set({
                session: null,
                user: null,
                isAuthenticated: false,
              });
            }
          } catch (profileError: any) {
            console.error('[Auth] onAuthStateChange error:', profileError?.message);

            if (profileError?.message?.includes('حسابك')) {
              set({
                session: null,
                user: null,
                isAuthenticated: false,
                error: profileError.message,
              });
            } else {
              // Other errors - sign out to be safe
              console.warn('[Auth] onAuthStateChange: Failed to fetch profile, signing out');
              await supabaseSignOut();
              set({
                session: null,
                user: null,
                isAuthenticated: false,
              });
            }
          }
        } else if (event === 'SIGNED_OUT') {
          // Don't reset registration state on sign out during registration flow
          const stateBeforeSignout = get();
          if (stateBeforeSignout.registrationComplete) {
            console.log('[Auth] onAuthStateChange SIGNED_OUT: Preserving registration state');
            return;
          }
          set({
            session: null,
            user: null,
            profile: null,
            userPackage: null,
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
        const arabicError = translateAuthError(error);
        set({ isLoading: false, error: arabicError });
        return { success: false, error: arabicError };
      }

      // Fetch full profile and subscription from GraphQL BEFORE setting authenticated
      // This allows us to check ban/suspension status
      // IMPORTANT: Pass the token directly from sign-in response to avoid timing issues
      const token = session?.access_token;
      if (!token) {
        console.error('[Auth] No access token in session');
        set({ isLoading: false, error: 'فشل في تحميل بيانات المستخدم' });
        return { success: false, error: 'فشل في تحميل بيانات المستخدم' };
      }

      try {
        console.log('[Auth] Fetching user profile from GraphQL with token...');
        const data = await graphqlRequest<{
          me: { user: UserProfile };
          myPackage: UserPackage | null;
        }>(ME_QUERY, {}, false, token);

        console.log('[Auth] GraphQL response:', JSON.stringify(data?.me?.user?.status));

        if (data?.me?.user) {
          console.log('[Auth] User status from backend:', data.me.user.status);

          // Validate user status (banned/suspended check)
          await validateUserStatus(data.me.user, supabaseSignOut);

          // User is allowed to login - set all state
          set({
            session,
            user,
            isAuthenticated: true,
            isLoading: false,
            profile: data.me.user,
            userPackage: data.myPackage || null,
          });
        } else {
          console.warn('[Auth] No user profile found in response, blocking login');
          // Don't allow login without profile - this prevents bypassing status check
          await supabaseSignOut();
          set({
            session: null,
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: 'فشل في تحميل بيانات المستخدم',
          });
          return { success: false, error: 'فشل في تحميل بيانات المستخدم' };
        }
      } catch (profileError: any) {
        console.error('[Auth] Profile fetch error:', profileError?.message);

        // If validation throws (banned/suspended), handle the error
        if (profileError?.message?.includes('حسابك')) {
          set({
            session: null,
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: profileError.message,
          });
          return { success: false, error: profileError.message };
        }
        // Other profile errors - DON'T allow login, sign out
        console.warn('[Auth] Failed to fetch profile, blocking login:', profileError);
        await supabaseSignOut();
        set({
          session: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'فشل في تحميل بيانات المستخدم',
        });
        return { success: false, error: 'فشل في تحميل بيانات المستخدم' };
      }

      return { success: true };
    } catch (error: any) {
      const arabicError = translateAuthError(error);
      set({ isLoading: false, error: arabicError });
      return { success: false, error: arabicError };
    }
  },

  /**
   * Sign in with Google OAuth using expo-auth-session
   */
  signInWithGoogle: async () => {
    try {
      set({ isLoading: true, error: null });

      const { session, user, error } = await supabaseSignInWithGoogle();

      if (error) {
        const arabicError = translateAuthError(error);
        set({ isLoading: false, error: arabicError });
        return { success: false, error: arabicError };
      }

      if (session && user) {
        set({
          session,
          user,
          isAuthenticated: true,
          isLoading: false,
        });

        // Fetch user profile from backend
        try {
          const profileData = await graphqlRequest<{ me: any }>(
            ME_QUERY,
            {},
            false,
            session.access_token
          );
          if (profileData?.me) {
            set({ profile: profileData.me });
          }
        } catch (profileError) {
          console.error('Failed to fetch profile after Google sign-in:', profileError);
        }

        return { success: true };
      }

      set({ isLoading: false });
      return { success: false, error: 'فشل تسجيل الدخول بجوجل' };
    } catch (error: any) {
      const arabicError = translateAuthError(error);
      set({ isLoading: false, error: arabicError });
      return { success: false, error: arabicError };
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
        const arabicError = translateAuthError(error);
        set({ isLoading: false, error: arabicError });
        return { success: false, error: arabicError };
      }

      // If email confirmation is required, user will need to verify
      if (!session) {
        // Set registration complete state to show success screen
        set({
          isLoading: false,
          registrationComplete: true,
          registeredEmail: email,
        });
        return {
          success: true,
          // Message: Check your email for verification link
        };
      }

      // User was auto-logged in (no email confirmation required)
      set({
        session,
        user,
        isAuthenticated: true,
        isLoading: false,
        registrationComplete: true,
        registeredEmail: email,
      });

      // Fetch full profile and subscription from GraphQL
      try {
        const data = await graphqlRequest<{
          me: { user: UserProfile };
          myPackage: UserPackage | null;
        }>(ME_QUERY, {}, false);
        if (data?.me?.user) {
          set({
            profile: data.me.user,
            userPackage: data.myPackage || null,
          });
        }
      } catch (profileError) {
        console.warn('[Auth] Failed to fetch profile:', profileError);
        // Continue without profile - fallback to Supabase user
      }

      return { success: true };
    } catch (error: any) {
      const arabicError = translateAuthError(error);
      set({ isLoading: false, error: arabicError });
      return { success: false, error: arabicError };
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
        userPackage: null,
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
        userPackage: null,
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
        const arabicError = translateAuthError(error);
        set({ isLoading: false, error: arabicError });
        return { success: false, error: arabicError };
      }

      set({ isLoading: false });
      return { success: true };
    } catch (error: any) {
      const arabicError = translateAuthError(error);
      set({ isLoading: false, error: arabicError });
      return { success: false, error: arabicError };
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (updates: Partial<UserProfile>) => {
    try {
      set({ isLoading: true, error: null });

      // Get current session for token
      const session = get().session;
      if (!session?.access_token) {
        set({ isLoading: false, error: 'غير مسجل الدخول' });
        return { success: false, error: 'غير مسجل الدخول' };
      }

      // Call GraphQL mutation to update profile
      const result = await graphqlRequest<{
        updateMe: Partial<UserProfile>;
      }>(UPDATE_ME_MUTATION, { input: updates }, false, session.access_token);

      // Update local state with returned data
      const currentProfile = get().profile;
      if (currentProfile && result?.updateMe) {
        set({
          profile: { ...currentProfile, ...result.updateMe },
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }

      return { success: true };
    } catch (error: any) {
      const arabicError = translateAuthError(error);
      set({ isLoading: false, error: arabicError });
      return { success: false, error: arabicError };
    }
  },

  /**
   * Clear error state
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Clear registration state (after user navigates away from success screen)
   */
  clearRegistrationState: () => {
    set({ registrationComplete: false, registeredEmail: null });
  },

  // =============================================================================
  // OTP ACTIONS
  // =============================================================================

  /**
   * Send OTP code to email
   * @param email - User's email address
   * @param isSignup - If true, creates user if doesn't exist
   */
  sendOtp: async (email: string, isSignup: boolean = false) => {
    try {
      set({ isLoading: true, error: null });

      const { error } = await sendEmailOtp(email, isSignup);

      if (error) {
        const arabicError = translateAuthError(error);
        set({ isLoading: false, error: arabicError });
        return { success: false, error: arabicError };
      }

      // OTP sent successfully - store email for verification
      set({
        isLoading: false,
        otpEmail: email,
        otpSent: true,
      });

      return { success: true };
    } catch (error: any) {
      const arabicError = translateAuthError(error);
      set({ isLoading: false, error: arabicError });
      return { success: false, error: arabicError };
    }
  },

  /**
   * Verify OTP code entered by user
   * @param code - 6-digit OTP code
   */
  verifyOtp: async (code: string) => {
    const { otpEmail } = get();

    if (!otpEmail) {
      set({ error: 'يرجى إدخال البريد الإلكتروني أولاً' });
      return { success: false, error: 'يرجى إدخال البريد الإلكتروني أولاً' };
    }

    try {
      set({ isLoading: true, error: null });

      const { session, user, error } = await verifyEmailOtp(otpEmail, code);

      if (error) {
        const arabicError = translateAuthError(error);
        set({ isLoading: false, error: arabicError });
        return { success: false, error: arabicError };
      }

      if (!session) {
        set({ isLoading: false, error: 'فشل في التحقق من الرمز' });
        return { success: false, error: 'فشل في التحقق من الرمز' };
      }

      // Fetch full profile from GraphQL
      try {
        const token = session.access_token;
        const data = await graphqlRequest<{
          me: { user: UserProfile };
          myPackage: UserPackage | null;
        }>(ME_QUERY, {}, false, token);

        if (data?.me?.user) {
          // Validate user status (banned/suspended check)
          await validateUserStatus(data.me.user, supabaseSignOut);

          set({
            session,
            user,
            isAuthenticated: true,
            isLoading: false,
            profile: data.me.user,
            userPackage: data.myPackage || null,
            otpEmail: null,
            otpSent: false,
          });
        } else {
          // No profile - sign out
          await supabaseSignOut();
          set({
            session: null,
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: 'فشل في تحميل بيانات المستخدم',
            otpEmail: null,
            otpSent: false,
          });
          return { success: false, error: 'فشل في تحميل بيانات المستخدم' };
        }
      } catch (profileError: any) {
        if (profileError?.message?.includes('حسابك')) {
          set({
            session: null,
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: profileError.message,
            otpEmail: null,
            otpSent: false,
          });
          return { success: false, error: profileError.message };
        }

        // Profile error but auth succeeded - try again
        await supabaseSignOut();
        set({
          session: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'فشل في تحميل بيانات المستخدم',
          otpEmail: null,
          otpSent: false,
        });
        return { success: false, error: 'فشل في تحميل بيانات المستخدم' };
      }

      return { success: true };
    } catch (error: any) {
      const arabicError = translateAuthError(error);
      set({ isLoading: false, error: arabicError });
      return { success: false, error: arabicError };
    }
  },

  /**
   * Resend OTP code to email
   */
  resendOtp: async () => {
    const { otpEmail } = get();

    if (!otpEmail) {
      set({ error: 'يرجى إدخال البريد الإلكتروني أولاً' });
      return { success: false, error: 'يرجى إدخال البريد الإلكتروني أولاً' };
    }

    try {
      set({ isLoading: true, error: null });

      const { error } = await resendEmailOtp(otpEmail);

      if (error) {
        const arabicError = translateAuthError(error);
        set({ isLoading: false, error: arabicError });
        return { success: false, error: arabicError };
      }

      set({ isLoading: false });
      return { success: true };
    } catch (error: any) {
      const arabicError = translateAuthError(error);
      set({ isLoading: false, error: arabicError });
      return { success: false, error: arabicError };
    }
  },

  /**
   * Clear OTP state (go back to email input)
   */
  clearOtpState: () => {
    set({ otpEmail: null, otpSent: false, error: null });
  },
}));

export default useUserAuthStore;
